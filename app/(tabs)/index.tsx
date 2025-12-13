import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getCurrentUser } from '../../components/friendService';
import { getUserStats } from '../../services/statsService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { playMusic, stopMusic } = useAudio();
  const { theme } = useTheme();
  const { coins } = useCurrency();
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Play home music when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      // Start playing home music with fade in
      playMusic('homeMusic', 1500);

      // Load streak
      loadStreak();

      return () => {
        // Fade out music when leaving screen
        stopMusic(800);
      };
    }, [])
  );

  const loadStreak = async () => {
    const user = getCurrentUser();
    if (user) {
      const stats = await getUserStats(user.uid);
      if (stats) {
        setCurrentStreak(stats.currentStreak);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.coinButton, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7' }]}
          onPress={() => router.push('/shop')}
        >
          <Text style={[styles.coinText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]}>🪙 {coins}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* App Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>SUDOKLE</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>New puzzle every day at midnight!</Text>

          {/* Streak Badge */}
          {currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7', borderColor: theme.isDark ? '#F59E0B' : '#F59E0B' }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]}>{currentStreak} Day Streak!</Text>
            </View>
          )}
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.primaryButton }]}
            onPress={() => router.push('/(tabs)/play')}
          >
            <Text style={styles.menuButtonIcon}>🎮</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]}>Play</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]}>Solve today's puzzle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.error || '#EF4444' }]}
            onPress={() => router.push('/(tabs)/versus')}
          >
            <Text style={styles.menuButtonIcon}>⚔️</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]}>Versus</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]}>Battle friends or AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.success }]}
            onPress={() => router.push('/(tabs)/social')}
          >
            <Text style={styles.menuButtonIcon}>👥</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]}>Social</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]}>Profile & friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.isDark ? '#F59E0B' : '#D97706' }]}
            onPress={() => router.push('/shop')}
          >
            <Text style={styles.menuButtonIcon}>🛒</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]}>Shop</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]}>Unlock themes & more</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.warning }]}
            onPress={() => router.push('/(tabs)/leaderboards')}
          >
            <Text style={styles.menuButtonIcon}>🏆</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]}>Leaderboards</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]}>Compare your times</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  coinButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  coinText: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuContainer: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  menuButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
  },
  menuButtonIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menuButtonSubtext: {
    fontSize: 13,
  },
});
