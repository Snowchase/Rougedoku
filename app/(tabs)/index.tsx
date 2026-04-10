import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';
import { checkAndClaimReturningPlayerGift } from '../../services/returningPlayerGiftService';
import { useRun } from '../../contexts/RunContext';
import { RUN_CONFIG } from '../../constants/runConfig';

const { width } = Dimensions.get('window');

const GIFT_AMOUNT = 250;

export default function HomeScreen() {
  const router = useRouter();
  const { playSelectedSong, stopMusic } = useAudio();
  const { theme } = useTheme();
  const { coins, selectedSong, loading, addBonusCoins } = useCurrency();
  const { activeRun, hasActiveRun, startNewRun, isLoading: runLoading } = useRun();
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Check for returning player gift once currency is loaded
  useEffect(() => {
    if (loading) return;
    checkAndClaimReturningPlayerGift().then((eligible) => {
      if (eligible) {
        addBonusCoins(GIFT_AMOUNT).then(() => setShowGiftModal(true));
      }
    });
  }, [loading]);

  // Play selected song (or default home music) when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      if (loading) return;
      playSelectedSong(selectedSong, 'homeMusic', 1500).catch(err => {
        console.error('[HOME] Error starting home music:', err);
      });
      return () => {
        stopMusic(800).catch(err => {
          console.error('[HOME] Error stopping music:', err);
        });
      };
    }, [selectedSong, loading, playSelectedSong, stopMusic])
  );

  const handlePlayPress = async () => {
    if (!hasActiveRun) {
      await startNewRun();
    }
    router.push('/(tabs)/play');
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
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>Sudoku Roguelike</Text>
          </View>

          {/* Run Status Card */}
          {!runLoading && (
            <View style={[styles.quoteCard, { backgroundColor: theme.colors.cardBackground }]}>
              {hasActiveRun && activeRun ? (
                <>
                  <Text style={styles.quoteIcon} allowFontScaling={false}>⚔️</Text>
                  <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                    Floor {activeRun.currentFloor}/{activeRun.maxFloors}
                    {'  '}{'❤️'.repeat(activeRun.livesRemaining)}{'🖤'.repeat(Math.max(0, activeRun.maxLives - activeRun.livesRemaining))}
                    {'  '}💡{activeRun.hintsRemaining}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.quoteIcon} allowFontScaling={false}>🗺️</Text>
                  <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                    No run in progress. Start a new run to begin your roguelike adventure!
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Menu Buttons */}
          <View style={styles.menuContainer}>
          {/* Primary Buttons Group */}
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.primaryButton }]}
            onPress={handlePlayPress}
            disabled={runLoading}
          >
            <Text style={styles.menuButtonIcon} allowFontScaling={false}>{hasActiveRun ? '▶️' : '🎮'}</Text>
            <Text style={[styles.menuButtonText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
              {hasActiveRun ? 'Continue Run' : 'Start Run'}
            </Text>
            <Text style={[styles.menuButtonSubtext, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
              {hasActiveRun && activeRun ? `Floor ${activeRun.currentFloor} of ${activeRun.maxFloors}` : 'Begin a new roguelike run'}
            </Text>
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
              style={[styles.secondaryButton, { backgroundColor: theme.colors.cardBackground, borderColor: '#7C3AED' }]}
              onPress={() => router.push('/(tabs)/leaderboards')}
            >
              <Text style={styles.secondaryButtonIcon} allowFontScaling={false}>🏆</Text>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]} numberOfLines={1} allowFontScaling={false}>
                Scores
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Returning Player Gift Modal */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={styles.modalGiftIcon} allowFontScaling={false}>🎁</Text>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
              Thank You!
            </Text>
            <Text style={[styles.modalBody, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
              As a thank-you for playing and helping test Sudokle in its early stages, we've added a gift to your account.
            </Text>
            <View style={[styles.coinGiftBadge, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7' }]}>
              <Text style={styles.coinGiftEmoji} allowFontScaling={false}>🪙</Text>
              <Text style={[styles.coinGiftAmount, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} allowFontScaling={false}>
                +{GIFT_AMOUNT} Coins
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primaryButton }]}
              onPress={() => setShowGiftModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.primaryButtonText }]} maxFontSizeMultiplier={1.2}>
                Awesome!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
  quoteCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteIcon: {
    fontSize: 16,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  quoteAuthor: {
    fontSize: 11,
    marginTop: 2,
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
  // Gift modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalGiftIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  coinGiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 24,
  },
  coinGiftEmoji: {
    fontSize: 24,
  },
  coinGiftAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
