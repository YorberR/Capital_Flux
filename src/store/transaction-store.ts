import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransactionRow {
  id: string;
  user_id: string;
  client_id: string | null;
  wallet_id: string;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  original_amount: number | null;
  exchange_rate: number | null;
  rate_source: string | null;
  description: string | null;
  date: string;
  created_at: string;
}

export interface TransactionInsert {
  user_id: string;
  wallet_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  date: string;
  category_id?: string | null;
  description?: string | null;
  original_amount?: number | null;
  exchange_rate?: number | null;
  rate_source?: string | null;
  client_id?: string | null;
}

interface TransactionState {
  transactions: TransactionRow[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (userId: string, limit?: number) => Promise<void>;
  fetchByWallet: (walletId: string) => Promise<void>;
  createTransaction: (
    data: Omit<TransactionInsert, 'user_id'>,
    userId: string
  ) => Promise<TransactionRow | null>;
  deleteTransaction: (id: string, walletId: string, amount: number, type: string) => Promise<void>;
  reset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Use untyped client to avoid conflicts with the Database generic
const db = supabase as any;

/**
 * Updates the wallet balance in Supabase after a transaction operation.
 */
async function updateWalletBalance(
  walletId: string,
  amount: number,
  type: string,
  operation: 'add' | 'remove'
): Promise<void> {
  const { data: wallet, error: fetchError } = await db
    .from('wallets')
    .select('balance')
    .eq('id', walletId)
    .single();

  if (fetchError || !wallet) return;

  // income adds to balance; expense subtracts. 'remove' reverses the effect.
  let delta = 0;
  if (operation === 'add') {
    delta = type === 'income' ? amount : -amount;
  } else {
    delta = type === 'income' ? -amount : amount;
  }

  const newBalance = (wallet.balance as number) + delta;

  await db
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', walletId);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (userId: string, limit = 50) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await db
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      set({ transactions: (data as TransactionRow[]) ?? [], loading: false });
    } catch (err) {
      const message = (err as Error).message ?? 'Error fetching transactions';
      set({ error: message, loading: false });
    }
  },

  fetchByWallet: async (walletId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await db
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ transactions: (data as TransactionRow[]) ?? [], loading: false });
    } catch (err) {
      const message = (err as Error).message ?? 'Error fetching wallet transactions';
      set({ error: message, loading: false });
    }
  },

  createTransaction: async (
    data: Omit<TransactionInsert, 'user_id'>,
    userId: string
  ) => {
    set({ error: null });
    try {
      const insertData: TransactionInsert = {
        ...data,
        user_id: userId,
        date: data.date ?? new Date().toISOString(),
      };

      const { data: tx, error } = await db
        .from('transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newTx = tx as TransactionRow;

      // Update wallet balance (not for transfers — handled separately)
      if (newTx.type !== 'transfer') {
        await updateWalletBalance(newTx.wallet_id, newTx.amount, newTx.type, 'add');
      }

      set((state) => ({
        transactions: [newTx, ...state.transactions],
      }));

      return newTx;
    } catch (err) {
      const message = (err as Error).message ?? 'Error creating transaction';
      set({ error: message });
      return null;
    }
  },

  deleteTransaction: async (
    id: string,
    walletId: string,
    amount: number,
    type: string
  ) => {
    set({ error: null });
    try {
      const { error } = await db
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reverse the balance effect on the wallet
      if (type !== 'transfer') {
        await updateWalletBalance(walletId, amount, type, 'remove');
      }

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (err) {
      const message = (err as Error).message ?? 'Error deleting transaction';
      set({ error: message });
    }
  },

  reset: () => set({ transactions: [], loading: false, error: null }),
}));
