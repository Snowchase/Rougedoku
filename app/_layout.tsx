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
import { adService } from '@/services/adService';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
                <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="shop" options={{ presentation: 'modal', title: 'Shop' }} />
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
