import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@capital_flux/theme_mode';

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved: string | null) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch(() => {
        // Ignore storage errors, fallback to system
      });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  // Resolve actual isDark value
  const isDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
