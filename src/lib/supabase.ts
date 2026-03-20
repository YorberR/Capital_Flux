import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { Database } from './database.types';

export type { Database };

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Using placeholder values.');
}

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const memoryStorage: Record<string, string> = {};

const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore errors
    }
  },
};

const mobileStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStorage[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
  },
};

const tryInitSecureStore = async () => {
  if (isWeb) return null;
  
  try {
    const SecureStore = require('expo-secure-store');
    return {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
  } catch (e) {
    console.warn('expo-secure-store not available, using fallback storage');
    return null;
  }
};

const initStorage = async () => {
  if (isWeb) {
    return webStorage;
  }
  
  const secureStore = await tryInitSecureStore();
  return secureStore ?? mobileStorage;
};

const storagePromise = initStorage();

const getStorage = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      const storage = await storagePromise;
      return storage.getItem(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const storage = await storagePromise;
      return storage.setItem(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
      const storage = await storagePromise;
      return storage.removeItem(key);
    },
  };
};

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const supabaseUntyped: SupabaseClientType = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type SupabaseClient = typeof supabase;
