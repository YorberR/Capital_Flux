export type Currency = 'VES' | 'USD' | 'EUR' | 'COP';

export type RateSource = 'bcv' | 'parallel' | 'binance' | 'manual';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Wallet {
  id: string;
  serverId: string | null;
  name: string;
  currency: Currency;
  balance: number;
  icon: string;
  color: string;
  isActive: boolean;
  pendingSync: boolean;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  serverId: string | null;
  walletId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  originalAmount: number | null;
  exchangeRate: number | null;
  rateSource: RateSource | null;
  description: string | null;
  date: string;
  pendingSync: boolean;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  baseCurrency: Currency;
  targetCurrency: Currency;
  rate: number;
  source: RateSource;
  fetchedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface UserProfile {
  id: string;
  displayName: string;
  defaultCurrency: Currency;
  preferredRateSource: RateSource;
  locale: 'es' | 'en';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
}
