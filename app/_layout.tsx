import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <AudioProvider>
        <SettingsProvider>
          <CurrencyProvider>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="shop" options={{ presentation: 'modal', title: 'Shop' }} />
              </Stack>
              <StatusBar style="auto" />
            </NavigationThemeProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </AudioProvider>
    </ThemeProvider>
  );
}
