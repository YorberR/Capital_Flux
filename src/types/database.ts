import { Wallet, Transaction, ExchangeRate, Currency, RateSource, TransactionType } from './index';

export interface WalletRow {
  id: string;
  server_id: string | null;
  name: string;
  currency: Currency;
  balance: number;
  icon: string;
  color: string;
  is_active: number;
  pending_sync: number;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  server_id: string | null;
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  original_amount: number | null;
  exchange_rate: number | null;
  rate_source: RateSource | null;
  description: string | null;
  date: string;
  pending_sync: number;
  updated_at: string;
}

export interface ExchangeRateRow {
  id: string;
  base_currency: Currency;
  target_currency: Currency;
  rate: number;
  source: RateSource;
  fetched_at: string;
}

export function mapWalletRowToWallet(row: WalletRow): Wallet {
  return {
    id: row.id,
    serverId: row.server_id,
    name: row.name,
    currency: row.currency,
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    isActive: row.is_active === 1,
    pendingSync: row.pending_sync === 1,
    updatedAt: row.updated_at,
  };
}

export function mapWalletToWalletRow(wallet: Partial<Wallet> & { id: string }): Partial<WalletRow> {
  return {
    id: wallet.id,
    server_id: wallet.serverId ?? null,
    name: wallet.name,
    currency: wallet.currency,
    balance: wallet.balance,
    icon: wallet.icon,
    color: wallet.color,
    is_active: wallet.isActive ? 1 : 0,
    pending_sync: wallet.pendingSync ? 1 : 0,
    updated_at: wallet.updatedAt,
  };
}

export function mapTransactionRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    serverId: row.server_id,
    walletId: row.wallet_id,
    categoryId: row.category_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    originalAmount: row.original_amount,
    exchangeRate: row.exchange_rate,
    rateSource: row.rate_source,
    description: row.description,
    date: row.date,
    pendingSync: row.pending_sync === 1,
    updatedAt: row.updated_at,
  };
}

export function mapTransactionToTransactionRow(tx: Partial<Transaction> & { id: string }): Partial<TransactionRow> {
  return {
    id: tx.id,
    server_id: tx.serverId ?? null,
    wallet_id: tx.walletId,
    category_id: tx.categoryId ?? null,
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    original_amount: tx.originalAmount ?? null,
    exchange_rate: tx.exchangeRate ?? null,
    rate_source: tx.rateSource ?? null,
    description: tx.description ?? null,
    date: tx.date,
    pending_sync: tx.pendingSync ? 1 : 0,
    updated_at: tx.updatedAt,
  };
}

export function mapExchangeRateRowToExchangeRate(row: ExchangeRateRow): ExchangeRate {
  return {
    id: row.id,
    baseCurrency: row.base_currency,
    targetCurrency: row.target_currency,
    rate: row.rate,
    source: row.source,
    fetchedAt: row.fetched_at,
  };
}
