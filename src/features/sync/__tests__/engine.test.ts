import { SyncEngine } from '../engine';
import { Wallet, Transaction } from '../../../types';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(),
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
  supabaseUntyped: {
    from: jest.fn(),
  },
}));

jest.mock('../../../db/queries', () => ({
  walletQueries: {
    getPendingSync: jest.fn(),
    getById: jest.fn(),
    markSynced: jest.fn(),
    getByServerId: jest.fn(),
    upsertFromServer: jest.fn(),
  },
  transactionQueries: {
    getPendingSync: jest.fn(),
    getById: jest.fn(),
    markSynced: jest.fn(),
    getByServerId: jest.fn(),
    getByClientId: jest.fn(),
    upsertFromServer: jest.fn(),
  },
  syncQueries: {
    getPendingCount: jest.fn(),
    getLastSyncTimestamp: jest.fn(),
  },
}));

import NetInfo from '@react-native-community/netinfo';
import { supabase, supabaseUntyped } from '../../../lib/supabase';
import { walletQueries, transactionQueries, syncQueries } from '../../../db/queries';

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockGetUser = supabase.auth.getUser as unknown as jest.Mock;
const mockDb = supabaseUntyped as jest.Mocked<typeof supabaseUntyped>;
const mockWalletQueries = walletQueries as jest.Mocked<typeof walletQueries>;
const mockTransactionQueries = transactionQueries as jest.Mocked<typeof transactionQueries>;
const mockSyncQueries = syncQueries as jest.Mocked<typeof syncQueries>;

const createMockWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: 'local-wallet-1',
  serverId: null,
  name: 'Test Wallet',
  currency: 'USD',
  balance: 100,
  icon: 'wallet',
  color: '#4F46E5',
  isActive: true,
  pendingSync: true,
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'local-tx-1',
  serverId: null,
  walletId: 'wallet-1',
  categoryId: null,
  type: 'expense',
  amount: 50,
  currency: 'USD',
  originalAmount: null,
  exchangeRate: null,
  rateSource: null,
  description: 'Test transaction',
  date: '2024-01-15T10:00:00Z',
  pendingSync: true,
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    syncEngine = new SyncEngine();
  });

  afterEach(() => {
    syncEngine.destroy();
  });

  describe('isOnline', () => {
    it('should return true when connected and internet is reachable', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      const result = await syncEngine.isOnline();

      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      } as any);

      const result = await syncEngine.isOnline();

      expect(result).toBe(false);
    });

    it('should return false when internet is not reachable', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
      } as any);

      const result = await syncEngine.isOnline();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct pending counts', async () => {
      mockSyncQueries.getPendingCount.mockResolvedValue({
        wallets: 3,
        transactions: 5,
      });

      const stats = await syncEngine.getStats();

      expect(stats.totalPending).toBe(8);
    });
  });

  describe('sync', () => {
    it('should not sync when already syncing', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 0, transactions: 0 });
      mockSyncQueries.getLastSyncTimestamp.mockResolvedValue(null);
      mockWalletQueries.getPendingSync.mockResolvedValue([]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([]);

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      mockDb.from = mockFrom;

      const firstSyncPromise = syncEngine.sync();
      const secondSyncPromise = syncEngine.sync();

      await Promise.all([firstSyncPromise, secondSyncPromise]);

      expect(mockSyncQueries.getPendingCount).toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 0, transactions: 0 });

      const stats = await syncEngine.sync();

      expect(stats.synced).toBe(0);
    });

    it('should sync pending wallets successfully', async () => {
      const wallet = createMockWallet();

      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 1, transactions: 0 });
      mockSyncQueries.getLastSyncTimestamp.mockResolvedValue(null);
      mockWalletQueries.getPendingSync.mockResolvedValue([wallet]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([]);

      const mockPullSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'server-wallet-1' },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        single: mockInsert,
      });
      
      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return {
            select: mockPullSelect,
          };
        }
        return {
          insert: jest.fn().mockReturnValue({
            select: mockSelect,
          }),
        };
      });

      mockDb.from = mockFrom;

      const stats = await syncEngine.sync();

      expect(stats.synced).toBe(1);
      expect(mockWalletQueries.markSynced).toHaveBeenCalledWith(
        'local-wallet-1',
        'server-wallet-1'
      );
    });

    it('should sync pending transactions successfully', async () => {
      const wallet = createMockWallet({ id: 'wallet-1', serverId: 'server-wallet-1' });
      const transaction = createMockTransaction();

      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 0, transactions: 1 });
      mockSyncQueries.getLastSyncTimestamp.mockResolvedValue(null);
      mockWalletQueries.getPendingSync.mockResolvedValue([]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([transaction]);
      mockWalletQueries.getById.mockResolvedValue(wallet);

      const mockPullSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      const mockInsert = jest.fn().mockResolvedValue({
        data: { id: 'server-tx-1' },
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({
        single: mockInsert,
      });
      
      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return {
            select: mockPullSelect,
          };
        }
        return {
          insert: jest.fn().mockReturnValue({
            select: mockSelect,
          }),
        };
      });

      mockDb.from = mockFrom;

      const stats = await syncEngine.sync();

      expect(stats.synced).toBe(1);
    });

    it('should handle sync errors gracefully', async () => {
      const wallet = createMockWallet();

      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockGetUser.mockResolvedValue({
        data: { user: null },
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 1, transactions: 0 });
      mockWalletQueries.getPendingSync.mockResolvedValue([wallet]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([]);

      const stats = await syncEngine.sync();

      expect(stats.failed).toBe(1);
    });
  });

  describe('event handlers', () => {
    it('should call onSyncStart when sync begins', async () => {
      const onSyncStart = jest.fn();
      syncEngine.setHandlers({ onSyncStart });

      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 0, transactions: 0 });
      mockWalletQueries.getPendingSync.mockResolvedValue([]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([]);

      await syncEngine.sync();

      expect(onSyncStart).toHaveBeenCalled();
    });

    it('should call onSyncComplete when sync finishes', async () => {
      const onSyncComplete = jest.fn();
      syncEngine.setHandlers({ onSyncComplete });

      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      } as any);

      mockSyncQueries.getPendingCount.mockResolvedValue({ wallets: 0, transactions: 0 });
      mockWalletQueries.getPendingSync.mockResolvedValue([]);
      mockTransactionQueries.getPendingSync.mockResolvedValue([]);

      await syncEngine.sync();

      expect(onSyncComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          synced: 0,
          failed: 0,
        })
      );
    });
  });

  describe('initialize', () => {
    it('should subscribe to network changes', () => {
      const unsubscribe = jest.fn();
      mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

      syncEngine.initialize();

      expect(mockNetInfo.addEventListener).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should unsubscribe from network changes', () => {
      const unsubscribe = jest.fn();
      mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

      syncEngine.initialize();
      syncEngine.destroy();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
