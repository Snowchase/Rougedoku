import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { themes, themeKeys, ThemeKey } from '../constants/themes';
import { numberFonts, premiumAvatars, avatarCategories, AvatarCategory, premiumSongs, songCategories, SongCategory } from '../constants/customizations';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
// Use mock ad service for Expo Go testing (no native modules required)
// Change to '../services/adService' when testing with native builds
import { COINS_PER_AD } from '../services/adService.mock';

type ShopTab = 'themes' | 'fonts' | 'avatars' | 'songs' | 'rewards';

export default function ShopScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const {
    coins,
    isThemeOwned,
    buyTheme,
    isFontOwned,
    buyFont,
    selectedFont,
    setSelectedFont,
    isAvatarOwned,
    buyAvatar,
    isSongOwned,
    buySong,
    selectedSong,
    setSelectedSong,
    watchRewardedAd,
    isAdReady,
  } = useCurrency();
  const [activeTab, setActiveTab] = useState<ShopTab>('themes');
  const [avatarCategory, setAvatarCategory] = useState<AvatarCategory>('animals');
  const [songCategory, setSongCategory] = useState<SongCategory>('ambient');
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  const handlePurchaseTheme = async (key: ThemeKey) => {
    const themeData = themes[key];

    if (isThemeOwned(key)) {
      await setTheme(key);
      Alert.alert('Theme Applied', `${themeData.name} is now active!`);
      return;
    }

    if (coins < themeData.price) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${themeData.price - coins} more coins to unlock ${themeData.name}.`
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
              Alert.alert('Theme Unlocked!', `${themeData.name} is now yours!`);
            }
          },
        },
      ]
    );
  };

  const handlePurchaseFont = async (fontId: string, fontName: string, price: number) => {
    if (isFontOwned(fontId)) {
      await setSelectedFont(fontId);
      Alert.alert('Font Applied', `${fontName} is now active!`);
      return;
    }

    if (coins < price) {
      Alert.alert('Not Enough Coins', `You need ${price - coins} more coins.`);
      return;
    }

    Alert.alert(
      'Unlock Font',
      `Spend ${price} coins to unlock ${fontName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            const result = await buyFont(fontId, price);
            if (result.success) {
              await setSelectedFont(fontId);
              Alert.alert('Font Unlocked!', `${fontName} is now yours!`);
            }
          },
        },
      ]
    );
  };

  const handlePurchaseAvatar = async (avatarId: string, emoji: string, name: string, price: number) => {
    if (isAvatarOwned(avatarId)) {
      Alert.alert('Already Owned', `You already own ${name}!`);
      return;
    }

    if (coins < price) {
      Alert.alert('Not Enough Coins', `You need ${price - coins} more coins.`);
      return;
    }

    Alert.alert(
      'Unlock Avatar',
      `Spend ${price} coins to unlock ${emoji} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            const result = await buyAvatar(avatarId, price);
            if (result.success) {
              Alert.alert('Avatar Unlocked!', `${emoji} ${name} is now available in your profile!`);
            }
          },
        },
      ]
    );
  };

  const handlePurchaseSong = async (songId: string, name: string, price: number) => {
    if (isSongOwned(songId)) {
      await setSelectedSong(songId);
      Alert.alert('Song Selected', `${name} is now your background music!`);
      return;
    }

    if (coins < price) {
      Alert.alert('Not Enough Coins', `You need ${price - coins} more coins.`);
      return;
    }

    Alert.alert(
      'Unlock Song',
      `Spend ${price} coins to unlock "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            const result = await buySong(songId, price);
            if (result.success) {
              await setSelectedSong(songId);
              Alert.alert('Song Unlocked!', `${name} is now yours!`);
            }
          },
        },
      ]
    );
  };

  const handleWatchAd = async () => {
    if (isLoadingAd) return;

    setIsLoadingAd(true);
    try {
      const result = await watchRewardedAd();
      if (result.success) {
        Alert.alert('Coins Earned!', result.message);
      } else {
        Alert.alert('Ad Not Available', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoadingAd(false);
    }
  };

  const renderThemeCard = (key: ThemeKey) => {
    const themeData = themes[key];
    const owned = isThemeOwned(key);
    const canAfford = coins >= themeData.price;

    return (
      <TouchableOpacity
        key={key}
        style={[styles.themeCard, { backgroundColor: themeData.colors.cardBackground }]}
        onPress={() => handlePurchaseTheme(key)}
      >
        <View style={styles.themePreview}>
          <View style={[styles.previewGrid, { borderColor: themeData.colors.gridBorder }]}>
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellOriginal }]} />
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellSelected }]} />
            <View style={[styles.previewCell, { backgroundColor: themeData.colors.cellBackground }]} />
          </View>
        </View>
        <View style={styles.themeInfo}>
          <Text style={[styles.themeName, { color: themeData.colors.textPrimary }]}>
            {themeData.name}
          </Text>
          <Text style={[styles.themeDescription, { color: themeData.colors.textSecondary }]}>
            {themeData.description}
          </Text>
          <View style={styles.colorSwatches}>
            <View style={[styles.swatch, { backgroundColor: themeData.colors.primaryButton }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyEasy }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyMedium }]} />
            <View style={[styles.swatch, { backgroundColor: themeData.colors.difficultyHard }]} />
          </View>
        </View>
        <View style={styles.priceBadge}>
          {owned ? (
            <View style={[styles.ownedBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.ownedText}>Owned</Text>
            </View>
          ) : (
            <View style={[styles.priceTag, { backgroundColor: canAfford ? '#FEF3C7' : '#FEE2E2' }]}>
              <Text style={[styles.priceText, { color: canAfford ? '#92400E' : '#991B1B' }]}>
                {themeData.price}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFontCard = (font: typeof numberFonts[0]) => {
    const owned = isFontOwned(font.id);
    const isSelected = selectedFont === font.id;
    const canAfford = coins >= font.price;

    return (
      <TouchableOpacity
        key={font.id}
        style={[
          styles.fontCard,
          { backgroundColor: theme.colors.cardBackground },
          isSelected && { borderColor: theme.colors.primaryButton, borderWidth: 2 },
        ]}
        onPress={() => handlePurchaseFont(font.id, font.name, font.price)}
      >
        <View style={styles.fontPreview}>
          <Text
            style={[
              styles.fontPreviewText,
              { color: theme.colors.textPrimary },
              font.style,
            ]}
          >
            123
          </Text>
        </View>
        <View style={styles.fontInfo}>
          <Text style={[styles.fontName, { color: theme.colors.textPrimary }]}>
            {font.name}
          </Text>
          <Text style={[styles.fontDescription, { color: theme.colors.textSecondary }]}>
            {font.description}
          </Text>
        </View>
        <View style={styles.priceBadge}>
          {owned ? (
            <View style={[styles.ownedBadge, { backgroundColor: isSelected ? theme.colors.primaryButton : theme.colors.success }]}>
              <Text style={styles.ownedText}>{isSelected ? 'Active' : 'Owned'}</Text>
            </View>
          ) : font.price === 0 ? (
            <View style={[styles.ownedBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.ownedText}>Free</Text>
            </View>
          ) : (
            <View style={[styles.priceTag, { backgroundColor: canAfford ? '#FEF3C7' : '#FEE2E2' }]}>
              <Text style={[styles.priceText, { color: canAfford ? '#92400E' : '#991B1B' }]}>
                {font.price}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAvatarGrid = () => {
    const categoryAvatars = premiumAvatars.filter(a => a.category === avatarCategory);

    return (
      <View>
        <View style={styles.avatarCategoryTabs}>
          {avatarCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.avatarCategoryTab,
                avatarCategory === cat.id && { backgroundColor: theme.colors.primaryButton },
              ]}
              onPress={() => setAvatarCategory(cat.id)}
            >
              <Text style={styles.avatarCategoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.avatarCategoryName,
                  { color: avatarCategory === cat.id ? theme.colors.primaryButtonText : theme.colors.textSecondary },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.avatarGrid}>
          {categoryAvatars.map((avatar) => {
            const owned = isAvatarOwned(avatar.id);
            const canAfford = coins >= avatar.price;

            return (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  { backgroundColor: theme.colors.cardBackground },
                  owned && { borderColor: theme.colors.success, borderWidth: 2 },
                ]}
                onPress={() => handlePurchaseAvatar(avatar.id, avatar.emoji, avatar.name, avatar.price)}
              >
                <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                <Text style={[styles.avatarName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {avatar.name}
                </Text>
                {owned ? (
                  <Text style={[styles.avatarOwned, { color: theme.colors.success }]}>Owned</Text>
                ) : (
                  <Text style={[styles.avatarPrice, { color: canAfford ? '#92400E' : '#991B1B' }]}>
                    {avatar.price}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSongsGrid = () => {
    const categorySongs = premiumSongs.filter(s => s.category === songCategory);

    return (
      <View>
        <View style={styles.songCategoryTabs}>
          {songCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.songCategoryTab,
                { backgroundColor: theme.colors.cardBackground },
                songCategory === cat.id && { backgroundColor: theme.colors.primaryButton },
              ]}
              onPress={() => setSongCategory(cat.id)}
            >
              <Text style={styles.songCategoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.songCategoryName,
                  { color: songCategory === cat.id ? theme.colors.primaryButtonText : theme.colors.textSecondary },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Default music option */}
        <TouchableOpacity
          style={[
            styles.songCard,
            { backgroundColor: theme.colors.cardBackground },
            selectedSong === null && { borderColor: theme.colors.primaryButton, borderWidth: 2 },
          ]}
          onPress={() => {
            setSelectedSong(null);
            Alert.alert('Default Music', 'Using default background music!');
          }}
        >
          <View style={styles.songIcon}>
            <Text style={styles.songIconText}>🎵</Text>
          </View>
          <View style={styles.songInfo}>
            <Text style={[styles.songName, { color: theme.colors.textPrimary }]}>Default Music</Text>
            <Text style={[styles.songArtist, { color: theme.colors.textSecondary }]}>Built-in</Text>
            <Text style={[styles.songDesc, { color: theme.colors.textSecondary }]}>Original Sudokle music</Text>
          </View>
          <View style={styles.priceBadge}>
            <View style={[styles.ownedBadge, { backgroundColor: selectedSong === null ? theme.colors.primaryButton : theme.colors.success }]}>
              <Text style={styles.ownedText}>{selectedSong === null ? 'Active' : 'Free'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.songsGrid}>
          {categorySongs.map((song) => {
            const owned = isSongOwned(song.id);
            const isSelected = selectedSong === song.id;
            const canAfford = coins >= song.price;

            return (
              <TouchableOpacity
                key={song.id}
                style={[
                  styles.songCard,
                  { backgroundColor: theme.colors.cardBackground },
                  isSelected && { borderColor: theme.colors.primaryButton, borderWidth: 2 },
                ]}
                onPress={() => handlePurchaseSong(song.id, song.name, song.price)}
              >
                <View style={[styles.songIcon, { backgroundColor: theme.isDark ? '#27272A' : '#F3F4F6' }]}>
                  <Text style={styles.songIconText}>🎶</Text>
                </View>
                <View style={styles.songInfo}>
                  <Text style={[styles.songName, { color: theme.colors.textPrimary }]}>{song.name}</Text>
                  <Text style={[styles.songArtist, { color: theme.colors.textSecondary }]}>{song.artist}</Text>
                  <Text style={[styles.songDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {song.description}
                  </Text>
                </View>
                <View style={styles.songMeta}>
                  <Text style={[styles.songDuration, { color: theme.colors.textSecondary }]}>{song.duration}</Text>
                  {owned ? (
                    <View style={[styles.ownedBadge, { backgroundColor: isSelected ? theme.colors.primaryButton : theme.colors.success }]}>
                      <Text style={styles.ownedText}>{isSelected ? 'Active' : 'Owned'}</Text>
                    </View>
                  ) : (
                    <View style={[styles.priceTag, { backgroundColor: canAfford ? '#FEF3C7' : '#FEE2E2' }]}>
                      <Text style={[styles.priceText, { color: canAfford ? '#92400E' : '#991B1B' }]}>
                        {song.price}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderRewardsInfo = () => {
    return (
      <View style={styles.rewardsContainer}>

      {/* Watch Ad for Coins Card */}
      <TouchableOpacity
        style={[
          styles.adCard,
          { backgroundColor: theme.colors.primaryButton },
          isLoadingAd && { opacity: 0.7 },
        ]}
        onPress={handleWatchAd}
        disabled={isLoadingAd}
      >
        <View style={styles.adCardContent}>
          <View style={styles.adIconContainer}>
            <Text style={styles.adIcon}>📺</Text>
          </View>
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>Watch Ad for Coins</Text>
            <Text style={styles.adSubtitle}>Earn {COINS_PER_AD} coins per ad</Text>
          </View>
          {isLoadingAd ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.adButton}>
              <Text style={styles.adButtonText}>Watch</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

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
          Your Balance
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>
            Current Coins
          </Text>
          <Text style={[styles.statsValue, { color: theme.colors.textPrimary }]}>
            {coins}
          </Text>
        </View>
      </View>
    </View>
    );
  };

  const tabs: { id: ShopTab; label: string; icon: string }[] = [
    { id: 'themes', label: 'Themes', icon: '🎨' },
    { id: 'fonts', label: 'Fonts', icon: '🔤' },
    { id: 'avatars', label: 'Avatars', icon: '😀' },
    { id: 'songs', label: 'Music', icon: '🎵' },
    { id: 'rewards', label: 'Info', icon: '💰' },
  ];

  return (
    <ScreenErrorBoundary screenName="Shop">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Shop',
            headerStyle: { backgroundColor: theme.colors.cardBackground },
            headerTintColor: theme.colors.primaryButton,
            headerTitleStyle: { color: theme.colors.textPrimary },
            headerRight: () => (
              <View style={styles.coinBalance}>
                <Text style={styles.coinText}>{coins}</Text>
              </View>
            ),
          }}
        />

      <View style={[styles.tabs, { backgroundColor: theme.colors.cardBackground }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: theme.colors.primaryButton },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.id ? theme.colors.primaryButtonText : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'themes' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Color Themes
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
              Personalize your Sudokle experience
            </Text>
            <View style={styles.themesGrid}>
              {themeKeys.map(key => renderThemeCard(key))}
            </View>
          </>
        )}

        {activeTab === 'fonts' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Number Fonts
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
              Change how numbers look on the grid
            </Text>
            <View style={styles.fontsGrid}>
              {numberFonts.map(font => renderFontCard(font))}
            </View>
          </>
        )}

        {activeTab === 'avatars' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Premium Avatars
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
              Unlock special profile icons
            </Text>
            {renderAvatarGrid()}
          </>
        )}

        {activeTab === 'songs' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Background Music
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
              Unlock premium tracks for gameplay
            </Text>
            {renderSongsGrid()}
          </>
        )}

        {activeTab === 'rewards' && renderRewardsInfo()}
      </ScrollView>
    </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coinBalance: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  coinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 11,
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
    gap: 12,
  },
  themeCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themePreview: {
    marginRight: 12,
  },
  previewGrid: {
    width: 50,
    height: 50,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 12,
    marginBottom: 6,
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  priceBadge: {
    justifyContent: 'center',
  },
  ownedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ownedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fontsGrid: {
    gap: 12,
  },
  fontCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  fontPreview: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  fontPreviewText: {
    fontSize: 24,
  },
  fontInfo: {
    flex: 1,
  },
  fontName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fontDescription: {
    fontSize: 12,
  },
  avatarCategoryTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  avatarCategoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  avatarCategoryIcon: {
    fontSize: 16,
  },
  avatarCategoryName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarCard: {
    width: '30%',
    aspectRatio: 0.85,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  avatarOwned: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  avatarPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
    fontSize: 18,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardDesc: {
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 16,
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
  songCategoryTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  songCategoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  songCategoryIcon: {
    fontSize: 16,
  },
  songCategoryName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  songsGrid: {
    gap: 12,
  },
  songCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  songIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songIconText: {
    fontSize: 24,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    marginBottom: 2,
  },
  songDesc: {
    fontSize: 11,
  },
  songMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  songDuration: {
    fontSize: 11,
    fontWeight: '500',
  },
  adCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  adCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adIcon: {
    fontSize: 28,
  },
  adTextContainer: {
    flex: 1,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  adSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  adButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  adButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
