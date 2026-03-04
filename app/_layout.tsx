import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

// Prevent auto hide so we can manually control it
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
  // Hide splash screen immediately when root layout mounts
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignored
      }
    };
    hideSplash();
  }, []);

  return (
    <>
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
