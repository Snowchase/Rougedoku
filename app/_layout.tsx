import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSettings } from '@/contexts/SettingsContext';
// Using real ad service for native builds (Android/iOS)
// Change to '@/services/adService.mock' for Expo Go testing
import { adService } from '@/services/adService';
import { notificationService } from '@/services/notificationService';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Separate component so it can consume SettingsContext
function AppInitializer() {
  const { settings } = useSettings();

  useEffect(() => {
    notificationService
      .initialize(settings.notificationsEnabled, settings.notificationHour, settings.streakAlertsEnabled)
      .catch((error) => {
        console.error('Failed to initialize notifications:', error);
      });
  }, [settings.notificationsEnabled, settings.notificationHour, settings.streakAlertsEnabled]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize ad service on app startup
  useEffect(() => {
    adService.initialize().catch((error) => {
      console.error('Failed to initialize ad service:', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AudioProvider>
            <SettingsProvider>
              <CurrencyProvider>
                <AppInitializer />
                <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="shop" options={{ presentation: 'modal', title: 'Shop' }} />
                    <Stack.Screen name="patch-notes" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </NavigationThemeProvider>
              </CurrencyProvider>
            </SettingsProvider>
          </AudioProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
