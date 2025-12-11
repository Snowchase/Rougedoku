import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { themes, themeKeys, ThemeKey } from '../constants/themes';

type ShopTab = 'themes' | 'rewards';

export default function ShopScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { coins, isThemeOwned, buyTheme } = useCurrency();
  const [activeTab, setActiveTab] = useState<ShopTab>('themes');

  const handlePurchaseTheme = async (key: ThemeKey) => {
    const themeData = themes[key];

    if (isThemeOwned(key)) {
      // Already owned, just apply it
      await setTheme(key);
      Alert.alert('Theme Applied', `${themeData.name} is now active!`);
      return;
    }

    if (coins < themeData.price) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${themeData.price - coins} more coins to unlock ${themeData.name}.\n\nComplete puzzles to earn more coins!`
      );
      return;
    }

    Alert.alert(
      'Unlock Theme',
      `Spend ${themeData.price} coins to unlock ${themeData.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            const result = await buyTheme(key, themeData.price);
            if (result.success) {
              await setTheme(key);
              Alert.alert('Theme Unlocked!', `${themeData.name} is now yours and has been applied!`);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const renderThemeCard = (key: ThemeKey) => {
    const themeData = themes[key];
    const owned = isThemeOwned(key);
    const canAfford = coins >= themeData.price;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.themeCard,
          { backgroundColor: themeData.colors.cardBackground },
        ]}
        onPress={() => handlePurchaseTheme(key)}
      >
        {/* Theme Preview */}
        <View style={styles.themePreview}>
          <View style={[styles.previewGrid, { borderColor: themeData.colors.gridBorder }]}>
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellOriginal }]} />
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellSelected }]} />
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellBackground }]} />
          </View>
        </View>

        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <Text style={[styles.themeName, { color: themeData.colors.textPrimary }]}>
            {themeData.name}
          </Text>
          <Text style={[styles.themeDescription, { color: themeData.colors.textSecondary }]}>
            {themeData.description}
          </Text>

          {/* Color Swatches */}
          <View style={styles.colorSwatches}>
            <View style={[styles.swatch, { backgroundColor: themeData.colors.primaryButton }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyEasy }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyMedium }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyHard }]} />
          </View>
        </View>

        {/* Price/Status Badge */}
        <View style={styles.priceBadge}>
          {owned ? (
            <View style={[styles.ownedBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.ownedText}>Owned</Text>
            </View>
          ) : (
            <View
              style={[
                styles.priceTag,
                { backgroundColor: canAfford ? '#FEF3C7' : '#FEE2E2' },
              ]}
            >
              <Text style={[styles.priceText, { color: canAfford ? '#92400E' : '#991B1B' }]}>
                🪙 {themeData.price}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRewardsInfo = () => (
    <View style={styles.rewardsContainer}>
      <View style={[styles.rewardCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.rewardTitle, { color: theme.colors.textPrimary }]}>
          How to Earn Coins
        </Text>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardEmoji}>🎯</Text>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardLabel, { color: theme.colors.textPrimary }]}>
              Complete Puzzles
            </Text>
            <Text style={[styles.rewardDesc, { color: theme.colors.textSecondary }]}>
              Easy: 10 | Medium: 25 | Hard: 50 | Expert: 100
            </Text>
          </View>
        </View>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardEmoji}>⚡</Text>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardLabel, { color: theme.colors.textPrimary }]}>
              Time Bonus
            </Text>
            <Text style={[styles.rewardDesc, { color: theme.colors.textSecondary }]}>
              Under 3min: +50 | Under 5min: +30 | Under 10min: +15
            </Text>
          </View>
        </View>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardEmoji}>⭐</Text>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardLabel, { color: theme.colors.textPrimary }]}>
              First Clear Bonus
            </Text>
            <Text style={[styles.rewardDesc, { color: theme.colors.textSecondary }]}>
              +50 coins for first time completing each puzzle
            </Text>
          </View>
        </View>

        <View style={styles.rewardItem}>
          <Text style={styles.rewardEmoji}>💡</Text>
          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardLabel, { color: theme.colors.textPrimary }]}>
              Hint Penalty
            </Text>
            <Text style={[styles.rewardDesc, { color: theme.colors.textSecondary }]}>
              -5 coins per hint used
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.statsTitle, { color: theme.colors.textPrimary }]}>
          Your Stats
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>
            Current Balance
          </Text>
          <Text style={[styles.statsValue, { color: theme.colors.textPrimary }]}>
            🪙 {coins}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.colors.primaryButton }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Shop</Text>
        <View style={styles.coinBalance}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'themes' && { backgroundColor: theme.colors.primaryButton },
          ]}
          onPress={() => setActiveTab('themes')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'themes' ? theme.colors.primaryButtonText : theme.colors.textSecondary },
            ]}
          >
            Themes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'rewards' && { backgroundColor: theme.colors.primaryButton },
          ]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'rewards' ? theme.colors.primaryButtonText : theme.colors.textSecondary },
            ]}
          >
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'themes' ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Available Themes
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
              Tap to preview and unlock new themes
            </Text>
            <View style={styles.themesGrid}>
              {themeKeys.map(key => renderThemeCard(key))}
            </View>
          </>
        ) : (
          renderRewardsInfo()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  coinBalance: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  themesGrid: {
    gap: 16,
  },
  themeCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themePreview: {
    marginRight: 16,
  },
  previewGrid: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  previewCell: {
    width: '33.33%',
    height: '33.33%',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 6,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  priceBadge: {
    justifyContent: 'center',
  },
  ownedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ownedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardsContainer: {
    gap: 16,
  },
  rewardCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
