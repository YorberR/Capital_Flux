import { resolveConflict, detectConflict } from '../conflict-resolver';
import { Wallet, Transaction } from '../../../types';

const createMockWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: 'local-wallet-1',
  serverId: 'server-wallet-1',
  name: 'Test Wallet',
  currency: 'USD',
  balance: 100,
  icon: 'wallet',
  color: '#4F46E5',
  isActive: true,
  pendingSync: false,
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'local-tx-1',
  serverId: 'server-tx-1',
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
  pendingSync: false,
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('detectConflict', () => {
  it('should return false when entity has no serverId', () => {
    const wallet = createMockWallet({ serverId: null });
    const result = detectConflict(wallet, '2024-01-15T12:00:00Z');
    expect(result).toBe(false);
  });

  it('should return true when local updatedAt is after server updatedAt', () => {
    const wallet = createMockWallet({
      serverId: 'server-wallet-1',
      updatedAt: '2024-01-15T14:00:00Z',
    });
    const result = detectConflict(wallet, '2024-01-15T12:00:00Z');
    expect(result).toBe(true);
  });

  it('should return false when local updatedAt is before server updatedAt', () => {
    const wallet = createMockWallet({
      serverId: 'server-wallet-1',
      updatedAt: '2024-01-15T10:00:00Z',
    });
    const result = detectConflict(wallet, '2024-01-15T12:00:00Z');
    expect(result).toBe(false);
  });

  it('should return false when timestamps are equal', () => {
    const wallet = createMockWallet({
      serverId: 'server-wallet-1',
      updatedAt: '2024-01-15T12:00:00Z',
    });
    const result = detectConflict(wallet, '2024-01-15T12:00:00Z');
    expect(result).toBe(false);
  });

  it('should work with transactions', () => {
    const transaction = createMockTransaction({
      serverId: 'server-tx-1',
      updatedAt: '2024-01-15T14:00:00Z',
    });
    const result = detectConflict(transaction, '2024-01-15T12:00:00Z');
    expect(result).toBe(true);
  });
});

describe('resolveConflict', () => {
  describe('server_wins strategy', () => {
    it('should return server entity for wallets', () => {
      const localWallet = createMockWallet({
        name: 'Local Name',
        balance: 200,
        updatedAt: '2024-01-15T14:00:00Z',
      });
      const serverWallet = createMockWallet({
        name: 'Server Name',
        balance: 100,
        updatedAt: '2024-01-15T12:00:00Z',
      });

      const result = resolveConflict(localWallet, serverWallet, 'server_wins');

      expect(result.strategy).toBe('server_wins');
      expect(result.resolvedData).toEqual(serverWallet);
      expect(result.conflictDetails).toContain('wallet');
    });

    it('should return server entity for transactions', () => {
      const localTx = createMockTransaction({
        amount: 200,
        description: 'Local description',
      });
      const serverTx = createMockTransaction({
        amount: 100,
        description: 'Server description',
      });

      const result = resolveConflict(localTx, serverTx, 'server_wins');

      expect(result.strategy).toBe('server_wins');
      expect(result.resolvedData).toEqual(serverTx);
    });
  });

  describe('client_wins strategy', () => {
    it('should return local entity for wallets', () => {
      const localWallet = createMockWallet({
        name: 'Local Name',
        balance: 200,
      });
      const serverWallet = createMockWallet({
        name: 'Server Name',
        balance: 100,
      });

      const result = resolveConflict(localWallet, serverWallet, 'client_wins');

      expect(result.strategy).toBe('client_wins');
      expect(result.resolvedData).toEqual(localWallet);
      expect(result.conflictDetails).toContain('Local version preserved');
    });

    it('should return local entity for transactions', () => {
      const localTx = createMockTransaction({
        amount: 200,
        description: 'Local description',
      });
      const serverTx = createMockTransaction({
        amount: 100,
        description: 'Server description',
      });

      const result = resolveConflict(localTx, serverTx, 'client_wins');

      expect(result.strategy).toBe('client_wins');
      expect(result.resolvedData).toEqual(localTx);
    });
  });

  describe('merge strategy', () => {
    it('should merge wallet with newer local metadata', () => {
      const localWallet = createMockWallet({
        name: 'Local Name',
        icon: 'local-icon',
        color: '#FF0000',
        balance: 200,
        updatedAt: '2024-01-15T14:00:00Z',
      });
      const serverWallet = createMockWallet({
        name: 'Server Name',
        icon: 'server-icon',
        color: '#00FF00',
        balance: 100,
        updatedAt: '2024-01-15T12:00:00Z',
      });

      const result = resolveConflict(localWallet, serverWallet, 'merge');

      expect(result.strategy).toBe('merge');
      const merged = result.resolvedData as Wallet;
      expect(merged.name).toBe('Local Name');
      expect(merged.icon).toBe('local-icon');
      expect(merged.color).toBe('#FF0000');
      expect(merged.balance).toBe(100);
    });

    it('should use server metadata when server is newer', () => {
      const localWallet = createMockWallet({
        name: 'Local Name',
        balance: 200,
        updatedAt: '2024-01-15T10:00:00Z',
      });
      const serverWallet = createMockWallet({
        name: 'Server Name',
        balance: 100,
        updatedAt: '2024-01-15T14:00:00Z',
      });

      const result = resolveConflict(localWallet, serverWallet, 'merge');

      expect(result.strategy).toBe('merge');
      const merged = result.resolvedData as Wallet;
      expect(merged.name).toBe('Server Name');
      expect(merged.balance).toBe(100);
    });

    it('should use local transaction when local is newer', () => {
      const localTx = createMockTransaction({
        amount: 200,
        description: 'Local description',
        updatedAt: '2024-01-15T14:00:00Z',
      });
      const serverTx = createMockTransaction({
        amount: 100,
        description: 'Server description',
        updatedAt: '2024-01-15T12:00:00Z',
      });

      const result = resolveConflict(localTx, serverTx, 'merge');

      expect(result.strategy).toBe('merge');
      expect(result.resolvedData).toEqual(localTx);
    });

    it('should use server transaction when server is newer', () => {
      const localTx = createMockTransaction({
        amount: 200,
        description: 'Local description',
        updatedAt: '2024-01-15T10:00:00Z',
      });
      const serverTx = createMockTransaction({
        amount: 100,
        description: 'Server description',
        updatedAt: '2024-01-15T14:00:00Z',
      });

      const result = resolveConflict(localTx, serverTx, 'merge');

      expect(result.strategy).toBe('merge');
      expect(result.resolvedData).toEqual(serverTx);
    });
  });

  describe('default strategy', () => {
    it('should default to server_wins when no strategy provided', () => {
      const localWallet = createMockWallet({ name: 'Local' });
      const serverWallet = createMockWallet({ name: 'Server' });

      const result = resolveConflict(localWallet, serverWallet);

      expect(result.strategy).toBe('server_wins');
      expect(result.resolvedData).toEqual(serverWallet);
    });
  });
});
