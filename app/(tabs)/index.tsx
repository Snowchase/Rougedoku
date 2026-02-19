import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getCurrentUser } from '../../components/friendService';
import { getUserStats } from '../../services/statsService';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { playSelectedSong, stopMusic } = useAudio();
  const { theme } = useTheme();
  const { coins, selectedSong, loading } = useCurrency();
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Play selected song (or default home music) when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      console.log('[HOME] useFocusEffect MOUNT - selectedSong:', selectedSong, 'loading:', loading);

      // Wait for selectedSong to load from storage before playing music
      if (loading) {
        console.log('[HOME] Still loading selectedSong, skipping music start');
        return;
      }

      // Start playing selected song (or fall back to home music) with fade in
      // The audio manager now handles race conditions internally
      playSelectedSong(selectedSong, 'homeMusic', 1500).catch(err => {
        console.error('[HOME] Error starting home music:', err);
      });

      // Load streak
      loadStreak();

      return () => {
        isMounted = false;
        console.log('[HOME] useFocusEffect CLEANUP - calling stopMusic');
        // Stop music when leaving screen (audio manager queues this properly)
        stopMusic(800).catch(err => {
          console.error('[HOME] Error stopping music:', err);
        });
      };
    }, [selectedSong, loading, playSelectedSong, stopMusic])
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
    <ScreenErrorBoundary screenName="Home">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.coinButton, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7' }]}
          onPress={() => router.push('/shop')}
        >
          <Text style={[styles.coinText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} maxFontSizeMultiplier={1.2}>🪙 {coins}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.settingsIcon} allowFontScaling={false}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* App Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.1}>SUDOKLE</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>New puzzle every day at midnight!</Text>

            {/* Streak Badge */}
            {currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7', borderColor: theme.isDark ? '#F59E0B' : '#F59E0B' }]}>
                <Text style={styles.streakEmoji} allowFontScaling={false}>🔥</Text>
                <Text style={[styles.streakText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} maxFontSizeMultiplier={1.2}>{currentStreak} Day Streak!</Text>
              </View>
            )}
          </View>

          {/* Menu Buttons */}
          <View style={styles.menuContainer}>
          {/* Primary Buttons Group */}
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.primaryButton }]}
            onPress={() => router.push('/(tabs)/play')}
          >
            <Text style={styles.menuButtonIcon} allowFontScaling={false}>🎮</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>Play</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>Solve today's puzzle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.success }]}
            onPress={() => router.push('/(tabs)/social')}
          >
            <Text style={styles.menuButtonIcon} allowFontScaling={false}>👥</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>Social</Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>Profile & friends</Text>
          </TouchableOpacity>

          <View
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: '#EF4444', opacity: 0.6 }]}
          >
            <Text style={styles.menuButtonIcon} allowFontScaling={false}>⚔️</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>Versus</Text>
            <Text style={[styles.menuButtonSubtext, { color: '#EF4444' }]} maxFontSizeMultiplier={1.2}>Coming Soon</Text>
          </View>

          {/* Secondary Buttons Group */}
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.cardBackground, borderColor: '#8B5CF6' }]}
              onPress={() => router.push('/(tabs)/tutorial')}
            >
              <Text style={styles.secondaryButtonIcon} allowFontScaling={false}>📚</Text>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]} numberOfLines={1} allowFontScaling={false}>Tutorial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.isDark ? '#F59E0B' : '#D97706' }]}
              onPress={() => router.push('/shop')}
            >
              <Text style={styles.secondaryButtonIcon} allowFontScaling={false}>🛒</Text>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]} numberOfLines={1} allowFontScaling={false}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.warning }]}
              onPress={() => router.push('/(tabs)/leaderboards')}
            >
              <Text style={styles.secondaryButtonIcon} allowFontScaling={false}>🏆</Text>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]} numberOfLines={1} allowFontScaling={false}>Leaders</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
    </ScreenErrorBoundary>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 110,
  },
  content: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
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
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  secondaryButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
