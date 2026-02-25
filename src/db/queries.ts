import { Category, ExchangeRate, Transaction, Wallet } from "../types";
import {
  ExchangeRateRow,
  mapExchangeRateRowToExchangeRate,
  mapTransactionRowToTransaction,
  mapTransactionToTransactionRow,
  mapWalletRowToWallet,
  mapWalletToWalletRow,
  TransactionRow,
  WalletRow,
} from "../types/database";
import { getDatabase } from "./database";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const walletQueries = {
  async getAll(): Promise<Wallet[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WalletRow>(
      "SELECT * FROM wallets WHERE is_active = 1 ORDER BY updated_at DESC",
    );
    return rows.map(mapWalletRowToWallet);
  },

  async getById(id: string): Promise<Wallet | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WalletRow>(
      "SELECT * FROM wallets WHERE id = ?",
      [id],
    );
    return row ? mapWalletRowToWallet(row) : null;
  },

  async create(
    data: Omit<Wallet, "id" | "serverId" | "pendingSync" | "updatedAt">,
  ): Promise<Wallet> {
    const db = await getDatabase();
    const id = generateId();
    const updatedAt = new Date().toISOString();
    const wallet: Wallet = {
      ...data,
      id,
      serverId: null,
      pendingSync: true,
      updatedAt,
    };

    const row = mapWalletToWalletRow(wallet);
    await db.runAsync(
      `INSERT INTO wallets (id, server_id, name, currency, balance, icon, color, is_active, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id!,
        row.server_id ?? null,
        row.name!,
        row.currency!,
        row.balance ?? 0,
        row.icon ?? "wallet",
        row.color ?? "#4F46E5",
        row.is_active ?? 1,
        row.pending_sync ?? 1,
        row.updated_at!,
      ],
    );

    return wallet;
  },

  async update(
    id: string,
    data: Partial<Omit<Wallet, "id" | "serverId">>,
  ): Promise<Wallet | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: Wallet = {
      ...existing,
      ...data,
      pendingSync: true,
      updatedAt: new Date().toISOString(),
    };

    const row = mapWalletToWalletRow(updated);
    await db.runAsync(
      `UPDATE wallets SET name = ?, currency = ?, balance = ?, icon = ?, color = ?, is_active = ?, pending_sync = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.name!,
        row.currency!,
        row.balance ?? 0,
        row.icon ?? "wallet",
        row.color ?? "#4F46E5",
        row.is_active ?? 1,
        row.pending_sync ?? 1,
        row.updated_at!,
        id,
      ],
    );

    return updated;
  },

  async deactivate(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE wallets SET is_active = 0, pending_sync = 1, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id],
    );
  },

  async getPendingSync(): Promise<Wallet[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WalletRow>(
      "SELECT * FROM wallets WHERE pending_sync = 1",
    );
    return rows.map(mapWalletRowToWallet);
  },

  async markSynced(id: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE wallets SET server_id = ?, pending_sync = 0 WHERE id = ?",
      [serverId, id],
    );
  },

  async getByServerId(serverId: string): Promise<Wallet | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WalletRow>(
      "SELECT * FROM wallets WHERE server_id = ?",
      [serverId],
    );
    return row ? mapWalletRowToWallet(row) : null;
  },

  async upsertFromServer(serverWallet: {
    id: string;
    client_id: string | null;
    name: string;
    currency: string;
    balance: number;
    icon: string;
    color: string;
    is_active: boolean;
    updated_at: string;
  }): Promise<Wallet> {
    const db = await getDatabase();

    if (serverWallet.client_id) {
      const existingByClientId = await this.getById(serverWallet.client_id);
      if (existingByClientId) {
        await db.runAsync(
          `UPDATE wallets SET server_id = ?, name = ?, currency = ?, balance = ?, icon = ?, color = ?, is_active = ?, pending_sync = 0, updated_at = ? WHERE id = ?`,
          [
            serverWallet.id,
            serverWallet.name,
            serverWallet.currency,
            serverWallet.balance,
            serverWallet.icon,
            serverWallet.color,
            serverWallet.is_active ? 1 : 0,
            serverWallet.updated_at,
            serverWallet.client_id,
          ],
        );
        return {
          id: serverWallet.client_id,
          serverId: serverWallet.id,
          name: serverWallet.name,
          currency: serverWallet.currency as Wallet['currency'],
          balance: serverWallet.balance,
          icon: serverWallet.icon,
          color: serverWallet.color,
          isActive: serverWallet.is_active,
          pendingSync: false,
          updatedAt: serverWallet.updated_at,
        };
      }
    }

    const existing = await this.getByServerId(serverWallet.id);
    if (existing) {
      await db.runAsync(
        `UPDATE wallets SET name = ?, currency = ?, balance = ?, icon = ?, color = ?, is_active = ?, pending_sync = 0, updated_at = ? WHERE server_id = ?`,
        [
          serverWallet.name,
          serverWallet.currency,
          serverWallet.balance,
          serverWallet.icon,
          serverWallet.color,
          serverWallet.is_active ? 1 : 0,
          serverWallet.updated_at,
          serverWallet.id,
        ],
      );
      return {
        ...existing,
        name: serverWallet.name,
        currency: serverWallet.currency as Wallet['currency'],
        balance: serverWallet.balance,
        icon: serverWallet.icon,
        color: serverWallet.color,
        isActive: serverWallet.is_active,
        pendingSync: false,
        updatedAt: serverWallet.updated_at,
      };
    }

    const id = generateId();
    await db.runAsync(
      `INSERT INTO wallets (id, server_id, name, currency, balance, icon, color, is_active, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        serverWallet.id,
        serverWallet.name,
        serverWallet.currency,
        serverWallet.balance,
        serverWallet.icon,
        serverWallet.color,
        serverWallet.is_active ? 1 : 0,
        0,
        serverWallet.updated_at,
      ],
    );

    return {
      id,
      serverId: serverWallet.id,
      name: serverWallet.name,
      currency: serverWallet.currency as Wallet['currency'],
      balance: serverWallet.balance,
      icon: serverWallet.icon,
      color: serverWallet.color,
      isActive: serverWallet.is_active,
      pendingSync: false,
      updatedAt: serverWallet.updated_at,
    };
  },
};

export const transactionQueries = {
  async getAll(walletId?: string): Promise<Transaction[]> {
    const db = await getDatabase();
    let query = "SELECT * FROM transactions";
    const params: string[] = [];

    if (walletId) {
      query += " WHERE wallet_id = ?";
      params.push(walletId);
    }

    query += " ORDER BY date DESC, updated_at DESC";

    const rows = await db.getAllAsync<TransactionRow>(query, params);
    return rows.map(mapTransactionRowToTransaction);
  },

  async getById(id: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE id = ?",
      [id],
    );
    return row ? mapTransactionRowToTransaction(row) : null;
  },

  async create(
    data: Omit<Transaction, "id" | "serverId" | "pendingSync" | "updatedAt">,
  ): Promise<Transaction> {
    const db = await getDatabase();
    const id = generateId();
    const updatedAt = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id,
      serverId: null,
      pendingSync: true,
      updatedAt,
    };

    const row = mapTransactionToTransactionRow(transaction);
    await db.runAsync(
      `INSERT INTO transactions (id, server_id, wallet_id, category_id, type, amount, currency, original_amount, exchange_rate, rate_source, description, date, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id!,
        row.server_id ?? null,
        row.wallet_id!,
        row.category_id ?? null,
        row.type!,
        row.amount!,
        row.currency!,
        row.original_amount ?? null,
        row.exchange_rate ?? null,
        row.rate_source ?? null,
        row.description ?? null,
        row.date!,
        row.pending_sync ?? 1,
        row.updated_at!,
      ],
    );

    await updateWalletBalance(data.walletId, data.type, data.amount);

    return transaction;
  },

  async update(
    id: string,
    data: Partial<Omit<Transaction, "id" | "serverId">>,
  ): Promise<Transaction | null> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return null;

    if (existing.amount !== data.amount || existing.type !== data.type) {
      await updateWalletBalance(
        existing.walletId,
        existing.type,
        -existing.amount,
      );
      if (data.amount !== undefined && data.type !== undefined) {
        await updateWalletBalance(existing.walletId, data.type, data.amount);
      }
    }

    const updated: Transaction = {
      ...existing,
      ...data,
      pendingSync: true,
      updatedAt: new Date().toISOString(),
    };

    const row = mapTransactionToTransactionRow(updated);
    await db.runAsync(
      `UPDATE transactions SET wallet_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, original_amount = ?, exchange_rate = ?, rate_source = ?, description = ?, date = ?, pending_sync = ?, updated_at = ?
      WHERE id = ?`,
      [
        row.wallet_id!,
        row.category_id ?? null,
        row.type!,
        row.amount!,
        row.currency!,
        row.original_amount ?? null,
        row.exchange_rate ?? null,
        row.rate_source ?? null,
        row.description ?? null,
        row.date!,
        row.pending_sync ?? 1,
        row.updated_at!,
        id,
      ],
    );

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const existing = await this.getById(id);
    if (!existing) return;

    await updateWalletBalance(
      existing.walletId,
      existing.type,
      -existing.amount,
    );
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  },

  async getPendingSync(): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE pending_sync = 1",
    );
    return rows.map(mapTransactionRowToTransaction);
  },

  async markSynced(id: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE transactions SET server_id = ?, pending_sync = 0 WHERE id = ?",
      [serverId, id],
    );
  },

  async getByServerId(serverId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE server_id = ?",
      [serverId],
    );
    return row ? mapTransactionRowToTransaction(row) : null;
  },

  async getByClientId(clientId: string): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      "SELECT * FROM transactions WHERE id = ?",
      [clientId],
    );
    return row ? mapTransactionRowToTransaction(row) : null;
  },

  async upsertFromServer(
    serverTransaction: {
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
    },
    localWalletId: string
  ): Promise<Transaction> {
    const db = await getDatabase();

    if (serverTransaction.client_id) {
      const existingByClientId = await this.getByClientId(serverTransaction.client_id);
      if (existingByClientId) {
        await db.runAsync(
          `UPDATE transactions SET server_id = ?, wallet_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, original_amount = ?, exchange_rate = ?, rate_source = ?, description = ?, date = ?, pending_sync = 0, updated_at = ? WHERE id = ?`,
          [
            serverTransaction.id,
            localWalletId,
            serverTransaction.category_id,
            serverTransaction.type,
            serverTransaction.amount,
            serverTransaction.currency,
            serverTransaction.original_amount,
            serverTransaction.exchange_rate,
            serverTransaction.rate_source,
            serverTransaction.description,
            serverTransaction.date,
            serverTransaction.updated_at,
            serverTransaction.client_id,
          ],
        );
        return {
          id: serverTransaction.client_id,
          serverId: serverTransaction.id,
          walletId: localWalletId,
          categoryId: serverTransaction.category_id,
          type: serverTransaction.type as Transaction['type'],
          amount: serverTransaction.amount,
          currency: serverTransaction.currency as Transaction['currency'],
          originalAmount: serverTransaction.original_amount,
          exchangeRate: serverTransaction.exchange_rate,
          rateSource: serverTransaction.rate_source as Transaction['rateSource'],
          description: serverTransaction.description,
          date: serverTransaction.date,
          pendingSync: false,
          updatedAt: serverTransaction.updated_at,
        };
      }
    }

    const existing = await this.getByServerId(serverTransaction.id);
    if (existing) {
      await db.runAsync(
        `UPDATE transactions SET wallet_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, original_amount = ?, exchange_rate = ?, rate_source = ?, description = ?, date = ?, pending_sync = 0, updated_at = ? WHERE server_id = ?`,
        [
          localWalletId,
          serverTransaction.category_id,
          serverTransaction.type,
          serverTransaction.amount,
          serverTransaction.currency,
          serverTransaction.original_amount,
          serverTransaction.exchange_rate,
          serverTransaction.rate_source,
          serverTransaction.description,
          serverTransaction.date,
          serverTransaction.updated_at,
          serverTransaction.id,
        ],
      );
      return {
        ...existing,
        walletId: localWalletId,
        categoryId: serverTransaction.category_id,
        type: serverTransaction.type as Transaction['type'],
        amount: serverTransaction.amount,
        currency: serverTransaction.currency as Transaction['currency'],
        originalAmount: serverTransaction.original_amount,
        exchangeRate: serverTransaction.exchange_rate,
        rateSource: serverTransaction.rate_source as Transaction['rateSource'],
        description: serverTransaction.description,
        date: serverTransaction.date,
        pendingSync: false,
        updatedAt: serverTransaction.updated_at,
      };
    }

    const id = generateId();
    await db.runAsync(
      `INSERT INTO transactions (id, server_id, wallet_id, category_id, type, amount, currency, original_amount, exchange_rate, rate_source, description, date, pending_sync, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        serverTransaction.id,
        localWalletId,
        serverTransaction.category_id,
        serverTransaction.type,
        serverTransaction.amount,
        serverTransaction.currency,
        serverTransaction.original_amount,
        serverTransaction.exchange_rate,
        serverTransaction.rate_source,
        serverTransaction.description,
        serverTransaction.date,
        0,
        serverTransaction.updated_at,
      ],
    );

    return {
      id,
      serverId: serverTransaction.id,
      walletId: localWalletId,
      categoryId: serverTransaction.category_id,
      type: serverTransaction.type as Transaction['type'],
      amount: serverTransaction.amount,
      currency: serverTransaction.currency as Transaction['currency'],
      originalAmount: serverTransaction.original_amount,
      exchangeRate: serverTransaction.exchange_rate,
      rateSource: serverTransaction.rate_source as Transaction['rateSource'],
      description: serverTransaction.description,
      date: serverTransaction.date,
      pendingSync: false,
      updatedAt: serverTransaction.updated_at,
    };
  },
};

async function updateWalletBalance(
  walletId: string,
  type: string,
  amount: number,
): Promise<void> {
  const db = await getDatabase();
  const multiplier = type === "income" ? 1 : -1;
  await db.runAsync(
    "UPDATE wallets SET balance = balance + ?, pending_sync = 1, updated_at = ? WHERE id = ?",
    [amount * multiplier, new Date().toISOString(), walletId],
  );
}

export const exchangeRateQueries = {
  async getRate(
    baseCurrency: string,
    targetCurrency: string,
    source: string,
  ): Promise<ExchangeRate | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ExchangeRateRow>(
      "SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? AND source = ? ORDER BY fetched_at DESC LIMIT 1",
      [baseCurrency, targetCurrency, source],
    );
    return row ? mapExchangeRateRowToExchangeRate(row) : null;
  },

  async getAllRates(): Promise<ExchangeRate[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ExchangeRateRow>(
      "SELECT * FROM exchange_rates ORDER BY fetched_at DESC",
    );
    return rows.map(mapExchangeRateRowToExchangeRate);
  },

  async saveRate(data: Omit<ExchangeRate, "id">): Promise<ExchangeRate> {
    const db = await getDatabase();
    const id = generateId();
    const rate: ExchangeRate = { ...data, id };

    await db.runAsync(
      "INSERT INTO exchange_rates (id, base_currency, target_currency, rate, source, fetched_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        data.baseCurrency,
        data.targetCurrency,
        data.rate,
        data.source,
        data.fetchedAt,
      ],
    );

    return rate;
  },

  async clearOldRates(olderThanDays: number = 30): Promise<void> {
    const db = await getDatabase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    await db.runAsync("DELETE FROM exchange_rates WHERE fetched_at < ?", [
      cutoff.toISOString(),
    ]);
  },
};

export const categoryQueries = {
  async getAll(): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Category>(
      "SELECT * FROM categories ORDER BY name",
    );
    return rows;
  },

  async getByType(type: string): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Category>(
      "SELECT * FROM categories WHERE type = ? OR type = ? ORDER BY name",
      [type, "transfer"],
    );
    return rows;
  },
};

export const syncQueries = {
  async getPendingCount(): Promise<{ wallets: number; transactions: number }> {
    const db = await getDatabase();
    const wallets = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM wallets WHERE pending_sync = 1",
    );
    const transactions = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions WHERE pending_sync = 1",
    );

    return {
      wallets: wallets?.count ?? 0,
      transactions: transactions?.count ?? 0,
    };
  },

  async getLastSyncTimestamp(): Promise<string | null> {
    const db = await getDatabase();
    const wallet = await db.getFirstAsync<{ updated_at: string }>(
      "SELECT updated_at FROM wallets WHERE server_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1",
    );
    const transaction = await db.getFirstAsync<{ updated_at: string }>(
      "SELECT updated_at FROM transactions WHERE server_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1",
    );

    if (!wallet && !transaction) return null;

    const timestamps: string[] = [];
    if (wallet?.updated_at) timestamps.push(wallet.updated_at);
    if (transaction?.updated_at) timestamps.push(transaction.updated_at);

    return timestamps.sort().pop() ?? null;
  },

  async getAllServerWalletIds(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ server_id: string }>(
      "SELECT server_id FROM wallets WHERE server_id IS NOT NULL",
    );
    return rows.map((r) => r.server_id);
  },

  async getAllServerTransactionIds(): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ server_id: string }>(
      "SELECT server_id FROM transactions WHERE server_id IS NOT NULL",
    );
    return rows.map((r) => r.server_id);
  },
};
