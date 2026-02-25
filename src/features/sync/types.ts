import { Wallet, Transaction } from '../../types';

export type SyncEntityType = 'wallet' | 'transaction';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: SyncEntityType;
  entityId: string;
  data: Wallet | Transaction;
  timestamp: string;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  entityType: SyncEntityType;
  entityId: string;
  serverId?: string;
  error?: string;
}

export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge';
  resolvedData: Wallet | Transaction;
  conflictDetails?: string;
}

export interface SyncStats {
  totalPending: number;
  synced: number;
  failed: number;
  conflicts: number;
  lastSyncAt: string | null;
}

export interface SyncConfig {
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  syncOnReconnect: boolean;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  batchSize: 10,
  syncOnReconnect: true,
};

export interface SyncEventHandlers {
  onSyncStart?: () => void;
  onSyncComplete?: (stats: SyncStats) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (resolution: ConflictResolution) => void;
  onProgress?: (progress: number) => void;
}

export interface PullResult {
  success: boolean;
  entityType: SyncEntityType;
  serverId: string;
  error?: string;
}

export interface PullStats {
  walletsPulled: number;
  transactionsPulled: number;
  failed: number;
  lastPullAt: string | null;
}
