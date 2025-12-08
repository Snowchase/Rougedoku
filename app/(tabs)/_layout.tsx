import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NavigationHeader } from '@/components/navigation-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          href: null, // Hide from tab bar
          headerShown: true,
          header: () => <NavigationHeader title="Play" />,
        }}
      />
      <Tabs.Screen
        name="leaderboards"
        options={{
          href: null, // Hide from tab bar
          headerShown: true,
          header: () => <NavigationHeader title="Leaderboards" />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // Hide from tab bar
          headerShown: true,
          header: () => <NavigationHeader title="Friends" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          headerShown: true,
          header: () => <NavigationHeader title="Settings" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          headerShown: true,
          header: () => <NavigationHeader title="Explore" />,
        }}
      />
    </Tabs>
  );
}
