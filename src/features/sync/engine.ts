import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase, supabaseUntyped } from '../../lib/supabase';
import { walletQueries, transactionQueries, syncQueries } from '../../db/queries';
import { Wallet, Transaction } from '../../types';
import {
  SyncConfig,
  DEFAULT_SYNC_CONFIG,
  SyncResult,
  SyncStats,
  SyncEventHandlers,
  SyncEntityType,
  PullResult,
} from './types';
import { detectConflict, resolveConflict } from './conflict-resolver';

type Entity = Wallet | Transaction;

interface ServerWallet {
  id: string;
  client_id: string | null;
  name: string;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
  updated_at: string;
}

interface ServerTransaction {
  id: string;
  client_id: string | null;
  wallet_id: string;
  category_id: string | null;
  type: string;
  amount: number;
  currency: string;
  original_amount: number | null;
  exchange_rate: number | null;
  rate_source: string | null;
  description: string | null;
  date: string;
  updated_at: string;
}

interface InsertResult {
  id: string;
}

const db = supabaseUntyped;

class SyncEngine {
  private config: SyncConfig;
  private handlers: SyncEventHandlers = {};
  private isSyncing = false;
  private unsubscribeNetInfo?: () => void;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  setHandlers(handlers: SyncEventHandlers): void {
    this.handlers = handlers;
  }

  async initialize(): Promise<void> {
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
  }

  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }

  private async handleNetworkChange(state: NetInfoState): Promise<void> {
    if (this.config.syncOnReconnect && state.isConnected && state.isInternetReachable) {
      await this.sync();
    }
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  async sync(): Promise<SyncStats> {
    if (this.isSyncing) {
      return this.getStats();
    }

    const isOnline = await this.isOnline();
    if (!isOnline) {
      return this.getStats();
    }

    this.isSyncing = true;
    this.handlers.onSyncStart?.();

    const stats: SyncStats = {
      totalPending: 0,
      synced: 0,
      failed: 0,
      conflicts: 0,
      lastSyncAt: null,
    };

    try {
      const pullStats = await this.pull();
      stats.conflicts += pullStats.failed;

      const pendingCount = await syncQueries.getPendingCount();
      stats.totalPending = pendingCount.wallets + pendingCount.transactions;

      const walletResults = await this.syncWallets();
      stats.synced += walletResults.filter(r => r.success).length;
      stats.failed += walletResults.filter(r => !r.success).length;

      const transactionResults = await this.syncTransactions();
      stats.synced += transactionResults.filter(r => r.success).length;
      stats.failed += transactionResults.filter(r => !r.success).length;

      stats.lastSyncAt = new Date().toISOString();
      this.handlers.onSyncComplete?.(stats);
    } catch (error) {
      this.handlers.onSyncError?.(error as Error);
    } finally {
      this.isSyncing = false;
    }

    return stats;
  }

  async pull(): Promise<{ walletsPulled: number; transactionsPulled: number; failed: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { walletsPulled: 0, transactionsPulled: 0, failed: 0 };
    }

    const result = {
      walletsPulled: 0,
      transactionsPulled: 0,
      failed: 0,
    };

    const walletResults = await this.pullWallets(user.id);
    result.walletsPulled = walletResults.filter(r => r.success).length;
    result.failed += walletResults.filter(r => !r.success).length;

    const transactionResults = await this.pullTransactions(user.id);
    result.transactionsPulled = transactionResults.filter(r => r.success).length;
    result.failed += transactionResults.filter(r => !r.success).length;

    return result;
  }

  private async pullWallets(userId: string): Promise<PullResult[]> {
    const results: PullResult[] = [];
    const lastSyncTimestamp = await syncQueries.getLastSyncTimestamp();

    let query = db
      .from('wallets')
      .select('id, client_id, name, currency, balance, icon, color, is_active, updated_at')
      .eq('user_id', userId);

    if (lastSyncTimestamp) {
      query = query.gt('updated_at', lastSyncTimestamp);
    }

    const { data: serverWallets, error } = await query;

    if (error || !serverWallets) {
      return results;
    }

    for (const serverWallet of serverWallets as ServerWallet[]) {
      try {
        const localWallet = await walletQueries.getByServerId(serverWallet.id);
        
        if (localWallet && localWallet.pendingSync) {
          if (detectConflict(localWallet, serverWallet.updated_at)) {
            const resolution = resolveConflict(localWallet, {
              ...localWallet,
              updatedAt: serverWallet.updated_at,
            }, 'server_wins');
            this.handlers.onConflict?.(resolution);
            continue;
          }
        }

        await walletQueries.upsertFromServer(serverWallet);
        results.push({
          success: true,
          entityType: 'wallet',
          serverId: serverWallet.id,
        });
      } catch (err) {
        results.push({
          success: false,
          entityType: 'wallet',
          serverId: serverWallet.id,
          error: (err as Error).message,
        });
      }
    }

    return results;
  }

  private async pullTransactions(userId: string): Promise<PullResult[]> {
    const results: PullResult[] = [];
    const lastSyncTimestamp = await syncQueries.getLastSyncTimestamp();

    let query = db
      .from('transactions')
      .select('id, client_id, wallet_id, category_id, type, amount, currency, original_amount, exchange_rate, rate_source, description, date, updated_at')
      .eq('user_id', userId);

    if (lastSyncTimestamp) {
      query = query.gt('updated_at', lastSyncTimestamp);
    }

    const { data: serverTransactions, error } = await query;

    if (error || !serverTransactions) {
      return results;
    }

    for (const serverTx of serverTransactions as ServerTransaction[]) {
      try {
        const localTx = await transactionQueries.getByServerId(serverTx.id);

        if (localTx && localTx.pendingSync) {
          if (detectConflict(localTx, serverTx.updated_at)) {
            const resolution = resolveConflict(localTx, {
              ...localTx,
              updatedAt: serverTx.updated_at,
            }, 'server_wins');
            this.handlers.onConflict?.(resolution);
            continue;
          }
        }

        let localWalletId: string | null = null;

        const walletByServerId = await walletQueries.getByServerId(serverTx.wallet_id);
        if (walletByServerId) {
          localWalletId = walletByServerId.id;
        } else {
          const allWallets = await walletQueries.getAll();
          const matchingWallet = allWallets.find(w => w.serverId === serverTx.wallet_id);
          if (matchingWallet) {
            localWalletId = matchingWallet.id;
          }
        }

        if (!localWalletId) {
          results.push({
            success: false,
            entityType: 'transaction',
            serverId: serverTx.id,
            error: 'Wallet not found locally',
          });
          continue;
        }

        await transactionQueries.upsertFromServer(serverTx, localWalletId);
        results.push({
          success: true,
          entityType: 'transaction',
          serverId: serverTx.id,
        });
      } catch (err) {
        results.push({
          success: false,
          entityType: 'transaction',
          serverId: serverTx.id,
          error: (err as Error).message,
        });
      }
    }

    return results;
  }

  private async syncWallets(): Promise<SyncResult[]> {
    const pendingWallets = await walletQueries.getPendingSync();
    const results: SyncResult[] = [];

    for (const wallet of pendingWallets) {
      const result = await this.syncEntity('wallet', wallet);
      results.push(result);
    }

    return results;
  }

  private async syncTransactions(): Promise<SyncResult[]> {
    const pendingTransactions = await transactionQueries.getPendingSync();
    const results: SyncResult[] = [];

    for (const transaction of pendingTransactions) {
      const result = await this.syncEntity('transaction', transaction);
      results.push(result);
    }

    return results;
  }

  private async syncEntity(
    entityType: SyncEntityType,
    entity: Entity
  ): Promise<SyncResult> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        entityType,
        entityId: entity.id,
        error: 'User not authenticated',
      };
    }

    try {
      if (entityType === 'wallet') {
        return await this.syncWallet(entity as Wallet, user.id);
      } else {
        return await this.syncTransaction(entity as Transaction, user.id);
      }
    } catch (error) {
      return {
        success: false,
        entityType,
        entityId: entity.id,
        error: (error as Error).message,
      };
    }
  }

  private async syncWallet(wallet: Wallet, userId: string): Promise<SyncResult> {
    if (wallet.serverId) {
      const { data: serverWallet, error: fetchError } = await db
        .from('wallets')
        .select('updated_at')
        .eq('id', wallet.serverId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        return {
          success: false,
          entityType: 'wallet',
          entityId: wallet.id,
          error: fetchError.message,
        };
      }

      if (serverWallet && detectConflict(wallet, (serverWallet as ServerWallet).updated_at)) {
        const resolution = resolveConflict(wallet, wallet, 'server_wins');
        this.handlers.onConflict?.(resolution);
      }

      const { error } = await db
        .from('wallets')
        .update({
          name: wallet.name,
          currency: wallet.currency,
          balance: wallet.balance,
          icon: wallet.icon,
          color: wallet.color,
          is_active: wallet.isActive,
          updated_at: wallet.updatedAt,
        })
        .eq('id', wallet.serverId);

      if (error) {
        return {
          success: false,
          entityType: 'wallet',
          entityId: wallet.id,
          error: error.message,
        };
      }

      await walletQueries.markSynced(wallet.id, wallet.serverId);
      return {
        success: true,
        entityType: 'wallet',
        entityId: wallet.id,
        serverId: wallet.serverId,
      };
    }

    const { data, error } = await db
      .from('wallets')
      .insert({
        user_id: userId,
        client_id: wallet.id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
        icon: wallet.icon,
        color: wallet.color,
        is_active: wallet.isActive,
      })
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        entityType: 'wallet',
        entityId: wallet.id,
        error: error?.message ?? 'Unknown error',
      };
    }

    await walletQueries.markSynced(wallet.id, (data as InsertResult).id);
    return {
      success: true,
      entityType: 'wallet',
      entityId: wallet.id,
      serverId: (data as InsertResult).id,
    };
  }

  private async syncTransaction(transaction: Transaction, userId: string): Promise<SyncResult> {
    let serverWalletId = transaction.walletId;

    const wallet = await walletQueries.getById(transaction.walletId);
    if (wallet?.serverId) {
      serverWalletId = wallet.serverId;
    } else if (!wallet?.serverId && wallet) {
      const walletResult = await this.syncWallet(wallet, userId);
      if (!walletResult.success) {
        return {
          success: false,
          entityType: 'transaction',
          entityId: transaction.id,
          error: 'Failed to sync parent wallet',
        };
      }
      serverWalletId = walletResult.serverId!;
    }

    if (transaction.serverId) {
      const { error } = await db
        .from('transactions')
        .update({
          wallet_id: serverWalletId,
          category_id: transaction.categoryId,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          original_amount: transaction.originalAmount,
          exchange_rate: transaction.exchangeRate,
          rate_source: transaction.rateSource,
          description: transaction.description,
          date: transaction.date,
        })
        .eq('id', transaction.serverId);

      if (error) {
        return {
          success: false,
          entityType: 'transaction',
          entityId: transaction.id,
          error: error.message,
        };
      }

      await transactionQueries.markSynced(transaction.id, transaction.serverId);
      return {
        success: true,
        entityType: 'transaction',
        entityId: transaction.id,
        serverId: transaction.serverId,
      };
    }

    const { data, error } = await db
      .from('transactions')
      .insert({
        user_id: userId,
        client_id: transaction.id,
        wallet_id: serverWalletId,
        category_id: transaction.categoryId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        original_amount: transaction.originalAmount,
        exchange_rate: transaction.exchangeRate,
        rate_source: transaction.rateSource,
        description: transaction.description,
        date: transaction.date,
      })
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        entityType: 'transaction',
        entityId: transaction.id,
        error: error?.message ?? 'Unknown error',
      };
    }

    await transactionQueries.markSynced(transaction.id, (data as InsertResult).id);
    return {
      success: true,
      entityType: 'transaction',
      entityId: transaction.id,
      serverId: (data as InsertResult).id,
    };
  }

  async getStats(): Promise<SyncStats> {
    const pendingCount = await syncQueries.getPendingCount();
    return {
      totalPending: pendingCount.wallets + pendingCount.transactions,
      synced: 0,
      failed: 0,
      conflicts: 0,
      lastSyncAt: null,
    };
  }
}

export const syncEngine = new SyncEngine();
export { SyncEngine };
