import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationHour = 8 | 12 | 18 | 21;

interface GameSettings {
  boardLocked: boolean;
  notificationsEnabled: boolean;
  notificationHour: NotificationHour;
}

interface SettingsContextType {
  settings: GameSettings;
  setBoardLocked: (locked: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationHour: (hour: NotificationHour) => Promise<void>;
}

const defaultSettings: GameSettings = {
  boardLocked: true,
  notificationsEnabled: false,
  notificationHour: 8,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'rougedoku_game_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: GameSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const setBoardLocked = async (locked: boolean) => {
    await saveSettings({ ...settings, boardLocked: locked });
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    await saveSettings({ ...settings, notificationsEnabled: enabled });
  };

  const setNotificationHour = async (hour: NotificationHour) => {
    await saveSettings({ ...settings, notificationHour: hour });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setBoardLocked,
        setNotificationsEnabled,
        setNotificationHour,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
