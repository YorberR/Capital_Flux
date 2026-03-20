import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DefaultCategories } from '../constants/theme';

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  is_active?: boolean;
}

interface CategoryState {
  categories: CategoryRow[];
  loading: boolean;
  error: string | null;
  fetchCategories: (userId: string) => Promise<void>;
  createCategory: (data: Omit<CategoryInsert, 'user_id'>, userId: string) => Promise<CategoryRow | null>;
  reset: () => void;
}

const db = supabase as any;

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await db
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      // If the table 'categories' doesn't exist yet, this will error. 
      // We will fallback to an empty array so default categories are still shown
      if (error) {
         console.warn("Categories fetch error (might not exist table yet):", error.message);
         set({ categories: [], loading: false });
         return;
      }
      
      set({ categories: (data as CategoryRow[]) ?? [], loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  createCategory: async (data: Omit<CategoryInsert, 'user_id'>, userId: string) => {
    set({ error: null });
    try {
      const insertData: CategoryInsert = {
        ...data,
        user_id: userId,
        is_active: true,
      };

      const { data: category, error } = await db
        .from('categories')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newCategory = category as CategoryRow;
      set((state) => ({ categories: [...state.categories, newCategory] }));
      return newCategory;
    } catch (err) {
      const message = (err as Error).message ?? 'Error creating category';
      set({ error: message });
      return null;
    }
  },

  reset: () => set({ categories: [], loading: false, error: null }),
}));
