import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Slot, Stack, useRootNavigationState, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { ThemeProvider } from '../src/lib/theme-context';
import { useWalletStore } from '../src/store/wallet-store';
import { useTransactionStore } from '../src/store/transaction-store';

// Prevent auto hide so we can manually control it
SplashScreen.preventAutoHideAsync().catch(() => { });

// ─── Query Client Singleton ───────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/**
 * Redirects to /auth/login if unauthenticated, and to /(tabs) if already signed in.
 * Also loads initial data when user logs in.
 */
function AuthGuard() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const fetchWallets = useWalletStore((s) => s.fetchWallets);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const resetWallets = useWalletStore((s) => s.reset);
  const resetTransactions = useTransactionStore((s) => s.reset);

  // Load data when user authenticates
  useEffect(() => {
    if (session?.user) {
      fetchWallets(session.user.id);
      fetchTransactions(session.user.id);
    } else if (!loading) {
      // Clear data on logout
      resetWallets();
      resetTransactions();
    }
  }, [session?.user?.id, loading]);

  // Wait for navigation to be ready
  if (!navigationState?.key) return null;

  // Show a minimal loading indicator while auth state is resolving
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' }}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!session && !inAuthGroup) {
    // Not authenticated → redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  if (session && inAuthGroup) {
    // Already authenticated → redirect to dashboard
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayoutNav() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Ignored
      }
    };
    hideSplash();
  }, []);

  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="transaction" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="wallets" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
