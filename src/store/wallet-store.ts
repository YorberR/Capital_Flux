import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletRow {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  currency: string;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletInsert {
  user_id: string;
  name: string;
  currency: string;
  balance?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
  client_id?: string | null;
}

export interface WalletUpdate {
  name?: string;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
  updated_at?: string;
}

interface WalletState {
  wallets: WalletRow[];
  loading: boolean;
  error: string | null;
  fetchWallets: (userId: string) => Promise<void>;
  createWallet: (data: Omit<WalletInsert, 'user_id'>, userId: string) => Promise<WalletRow | null>;
  updateWallet: (id: string, data: WalletUpdate) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  reset: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

// Use the untyped client to avoid conflicts with the Database generic type
const db = supabase as any;

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  loading: false,
  error: null,

  fetchWallets: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await db
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ wallets: (data as WalletRow[]) ?? [], loading: false });
    } catch (err) {
      const message = (err as Error).message ?? 'Error fetching wallets';
      set({ error: message, loading: false });
    }
  },

  createWallet: async (data: Omit<WalletInsert, 'user_id'>, userId: string) => {
    set({ error: null });
    try {
      const insertData: WalletInsert = {
        ...data,
        user_id: userId,
        balance: data.balance ?? 0,
        icon: data.icon ?? '💼',
        color: data.color ?? '#4F46E5',
        is_active: true,
      };

      const { data: wallet, error } = await db
        .from('wallets')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newWallet = wallet as WalletRow;
      set((state) => ({ wallets: [...state.wallets, newWallet] }));
      return newWallet;
    } catch (err) {
      const message = (err as Error).message ?? 'Error creating wallet';
      set({ error: message });
      return null;
    }
  },

  updateWallet: async (id: string, data: WalletUpdate) => {
    set({ error: null });
    try {
      const { data: updated, error } = await db
        .from('wallets')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedWallet = updated as WalletRow;
      set((state) => ({
        wallets: state.wallets.map((w) => (w.id === id ? updatedWallet : w)),
      }));
    } catch (err) {
      const message = (err as Error).message ?? 'Error updating wallet';
      set({ error: message });
    }
  },

  deleteWallet: async (id: string) => {
    set({ error: null });
    try {
      const { error } = await db
        .from('wallets')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({ wallets: state.wallets.filter((w) => w.id !== id) }));
    } catch (err) {
      const message = (err as Error).message ?? 'Error deleting wallet';
      set({ error: message });
    }
  },

  reset: () => set({ wallets: [], loading: false, error: null }),
}));
