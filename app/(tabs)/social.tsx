import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { themes, themeKeys, ThemeKey } from '../../constants/themes';
import { premiumAvatars } from '../../constants/customizations';
import {
  initializeUser,
  getUserProfile,
  getCurrentUser,
  updateProfile,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
  getGlobalScores,
  getFriendsScores,
  getAllTimeBestScores,
  AVATAR_OPTIONS,
  PROFILE_COLORS,
  type UserProfile,
  type FriendRequest,
  type DailyScore,
} from '../../components/friendService';
import { getDateString } from '../../components/dailyPuzzleGenerator';
import { getUserStats, formatStatsForDisplay, type FormattedStats } from '../../services/statsService';
import StatsDisplay from '../../components/StatsDisplay';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';

type TabType = 'profile' | 'friends' | 'leaderboards';
type FriendsSubTab = 'friends' | 'requests';
type LeaderboardTab = 'stats' | 'allTime' | 'daily';
type ViewType = 'global' | 'friends';
type LBDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

const DIFFICULTY_COLORS: Record<LBDifficulty, string> = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
  expert: '#8B5CF6',
};

export default function SocialScreen() {
  const router = useRouter();
  const { theme, themeKey, setTheme } = useTheme();
  const { coins, isAvatarOwned, isThemeOwned, applyReferralCode, referralStats, refreshReferralStats } = useCurrency();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [friendsSubTab, setFriendsSubTab] = useState<FriendsSubTab>('friends');

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Friends state
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Referral state
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralSubmitting, setReferralSubmitting] = useState(false);

  // Leaderboard state
  const [lbTab, setLbTab] = useState<LeaderboardTab>('stats');
  const [lbViewType, setLbViewType] = useState<ViewType>('global');
  const [lbDifficulty, setLbDifficulty] = useState<LBDifficulty>('medium');
  const [lbScores, setLbScores] = useState<DailyScore[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbRefreshing, setLbRefreshing] = useState(false);
  const [lbCurrentUserId, setLbCurrentUserId] = useState<string | null>(null);
  const [lbSelectedDate, setLbSelectedDate] = useState<Date>(new Date());
  const [lbUserStats, setLbUserStats] = useState<FormattedStats | null>(null);

  useEffect(() => {
    loadData();
    initLbAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboards' && lbTab !== 'stats') {
      loadLbScores();
    }
  }, [activeTab, lbTab, lbViewType, lbDifficulty, lbSelectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userProfile = await initializeUser();
      if (userProfile) {
        setProfile(userProfile);
        setUsername(userProfile.username);
        setSelectedAvatar(userProfile.avatar || '😀');
        setSelectedColor(userProfile.profileColor || '#3B82F6');
        await loadFriends();
        await loadPendingRequests();
        await refreshReferralStats();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Profile handlers
  const handleSaveUsername = async () => {
    if (username.trim().length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long');
      return;
    }

    const result = await updateProfile({ username: username.trim() });
    if (result.success) {
      setIsEditingUsername(false);
      await loadData();
      Alert.alert('Success', 'Username updated!');
    } else {
      Alert.alert('Error', result.error || 'Failed to update username');
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    setSelectedAvatar(avatar);
    const result = await updateProfile({ avatar });
    if (result.success) {
      await loadData();
    } else {
      setSelectedAvatar(profile?.avatar || '😀');
    }
  };

  const handleColorSelect = async (color: string) => {
    setSelectedColor(color);
    const result = await updateProfile({ profileColor: color });
    if (result.success) {
      await loadData();
    } else {
      setSelectedColor(profile?.profileColor || '#3B82F6');
    }
  };

  const handleThemeSelect = async (key: ThemeKey) => {
    const owned = isThemeOwned(key);
    if (!owned) {
      Alert.alert(
        'Theme Locked',
        'Visit the Shop to unlock this theme!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Shop', onPress: () => router.push('/shop') },
        ]
      );
      return;
    }
    await setTheme(key);
  };

  // Friends handlers
  const handleAddFriend = async () => {
    if (!friendCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a friend code');
      return;
    }

    const result = await sendFriendRequest(friendCodeInput.toUpperCase());
    if (result.success) {
      Alert.alert('Success!', result.message);
      setFriendCodeInput('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleAcceptRequest = async (requestId: string, fromUsername: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      Alert.alert('Success!', `You're now friends with ${fromUsername}!`);
      await loadFriends();
      await loadPendingRequests();
    } else {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectFriendRequest(requestId);
    if (success) {
      await loadPendingRequests();
    } else {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleRemoveFriend = (friend: UserProfile) => {
    Alert.alert(
      'Remove Friend?',
      `Remove ${friend.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFriend(friend.userId);
            if (success) {
              await loadFriends();
            }
          },
        },
      ]
    );
  };

  const handleShareCode = async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Join me on Sudokle! Use my code ${profile.friendCode} to get 100 free coins when you sign up!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }
    setReferralSubmitting(true);
    try {
      const result = await applyReferralCode(referralCodeInput.trim());
      if (result.success) {
        setReferralCodeInput('');
        Alert.alert(
          'Code Applied!',
          `You earned ${result.coinsEarned} coins! The player who referred you also gets bonus coins.`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to apply referral code');
      }
    } finally {
      setReferralSubmitting(false);
    }
  };

  // Leaderboard functions
  const initLbAuth = async () => {
    const user = getCurrentUser();
    if (!user) {
      await initializeUser();
      const newUser = getCurrentUser();
      setLbCurrentUserId(newUser?.uid || null);
      if (newUser) await loadLbUserStats(newUser.uid);
    } else {
      setLbCurrentUserId(user.uid);
      await loadLbUserStats(user.uid);
    }
  };

  const loadLbUserStats = async (userId: string) => {
    try {
      const stats = await getUserStats(userId);
      if (stats) setLbUserStats(formatStatsForDisplay(stats));
    } catch (error) {
      console.error('Error loading lb user stats:', error);
    }
  };

  const loadLbScores = async () => {
    setLbLoading(true);
    try {
      let fetchedScores: DailyScore[] = [];
      if (lbTab === 'allTime') {
        fetchedScores = await getAllTimeBestScores(lbDifficulty, 100);
      } else {
        const dateStr = getDateString(lbSelectedDate);
        if (lbViewType === 'global') {
          fetchedScores = await getGlobalScores(dateStr, lbDifficulty, 100);
        } else {
          fetchedScores = await getFriendsScores(dateStr, lbDifficulty);
        }
      }
      setLbScores(fetchedScores);
    } catch (error) {
      console.error('Error loading lb scores:', error);
    } finally {
      setLbLoading(false);
    }
  };

  const onLbRefresh = async () => {
    setLbRefreshing(true);
    if (lbTab === 'stats' && lbCurrentUserId) {
      await loadLbUserStats(lbCurrentUserId);
    } else {
      await loadLbScores();
    }
    setLbRefreshing(false);
  };

  const lbIsToday = () => getDateString(lbSelectedDate) === getDateString(new Date());

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = getDateString(date);
    if (dateStr === getDateString(today)) return 'Today';
    if (dateStr === getDateString(yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const renderLbScoreRow = (score: DailyScore, index: number) => {
    const isCurrentUser = score.userId === lbCurrentUserId;
    const rank = index + 1;
    return (
      <View
        key={`${score.userId}-${score.date}-${score.difficulty}`}
        style={[
          styles.scoreRow,
          { backgroundColor: theme.colors.cardBackground },
          isCurrentUser && { backgroundColor: theme.colors.primaryButton + '15', borderColor: theme.colors.primaryButton, borderWidth: 2 },
          rank <= 3 && !isCurrentUser && { backgroundColor: '#FFFBEB' },
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, rank <= 3 && styles.rankTextMedal]}>{getMedalEmoji(rank)}</Text>
        </View>
        <View style={[styles.lbAvatarContainer, { backgroundColor: score.profileColor || '#3B82F6' }]}>
          <Text style={styles.lbAvatarEmoji}>{score.avatar || '😀'}</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={[styles.lbUsername, { color: theme.colors.textPrimary }, isCurrentUser && { color: theme.colors.primaryButton }]}>
            {score.username}{isCurrentUser ? ' (You)' : ''}
          </Text>
          {lbTab === 'allTime' && (
            <Text style={[styles.lbDateText, { color: theme.colors.textSecondary }]}>{score.date}</Text>
          )}
        </View>
        <View style={styles.scoreStats}>
          <Text style={[styles.lbTimeText, { color: theme.colors.textPrimary }, isCurrentUser && { color: theme.colors.primaryButton }]}>
            {formatTime(score.timeSeconds)}
          </Text>
          <Text style={[styles.hintsText, { color: theme.colors.textSecondary }]}>{score.hintsUsed} 💡</Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardsTab = () => (
    <View style={styles.tabContent}>
      {/* Leaderboard inner tabs */}
      <View style={[styles.lbTabContainer, { backgroundColor: theme.colors.background }]}>
        {(['stats', 'allTime', 'daily'] as LeaderboardTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.lbTab, lbTab === t && { backgroundColor: theme.colors.primaryButton }]}
            onPress={() => setLbTab(t)}
          >
            <Text style={[styles.lbTabText, { color: lbTab === t ? theme.colors.primaryButtonText : theme.colors.textSecondary }]}>
              {t === 'stats' ? '📊 Stats' : t === 'allTime' ? '🏆 All-Time' : '📅 Daily'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date nav (daily only) */}
      {lbTab === 'daily' && (
        <View style={[styles.dateNavContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.cellBorder }]}>
          <TouchableOpacity style={[styles.dateNavButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cellBorder }]}
            onPress={() => { const d = new Date(lbSelectedDate); d.setDate(d.getDate() - 1); setLbSelectedDate(d); }}>
            <Text style={[styles.dateNavArrow, { color: theme.colors.primaryButton }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.dateCenterContainer}>
            <Text style={[styles.dateDisplay, { color: theme.colors.textPrimary }]}>{formatDisplayDate(lbSelectedDate)}</Text>
            {!lbIsToday() && (
              <TouchableOpacity onPress={() => setLbSelectedDate(new Date())} style={[styles.todayButton, { backgroundColor: theme.colors.primaryButton }]}>
                <Text style={[styles.todayButtonText, { color: theme.colors.primaryButtonText }]}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.dateNavButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cellBorder }, lbIsToday() && { opacity: 0.3 }]}
            onPress={() => { const d = new Date(lbSelectedDate); d.setDate(d.getDate() + 1); if (d <= new Date()) setLbSelectedDate(d); }}
            disabled={lbIsToday()}>
            <Text style={[styles.dateNavArrow, { color: theme.colors.primaryButton }]}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View selector (daily only) */}
      {lbTab === 'daily' && (
        <View style={[styles.viewContainer, { backgroundColor: theme.colors.background }]}>
          {(['global', 'friends'] as ViewType[]).map((v) => (
            <TouchableOpacity key={v}
              style={[styles.viewButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cellBorder }, lbViewType === v && { backgroundColor: theme.colors.primaryButton + '20', borderColor: theme.colors.primaryButton }]}
              onPress={() => setLbViewType(v)}>
              <Text style={[styles.viewText, { color: lbViewType === v ? theme.colors.primaryButton : theme.colors.textSecondary }]}>
                {v === 'global' ? '🌎 Global' : '👥 Friends'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Difficulty selector (non-stats) */}
      {lbTab !== 'stats' && (
        <View style={[styles.difficultyContainer, { backgroundColor: theme.colors.background }]}>
          {(['easy', 'medium', 'hard', 'expert'] as LBDifficulty[]).map((diff) => (
            <TouchableOpacity key={diff}
              style={[styles.difficultyButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cellBorder }, lbDifficulty === diff && { backgroundColor: DIFFICULTY_COLORS[diff], borderColor: DIFFICULTY_COLORS[diff] }]}
              onPress={() => setLbDifficulty(diff)}>
              <Text style={[styles.difficultyText, lbDifficulty === diff && { color: '#fff' }]}>
                {diff.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.tabContent}
        refreshControl={<RefreshControl refreshing={lbRefreshing} onRefresh={onLbRefresh} />}>
        {lbTab === 'stats' ? (
          <View style={{ padding: 16 }}>
            {lbUserStats ? (
              <StatsDisplay stats={lbUserStats} theme={theme} />
            ) : (
              <View style={styles.lbLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primaryButton} />
                <Text style={[styles.lbLoadingText, { color: theme.colors.textSecondary }]}>Loading your stats...</Text>
              </View>
            )}
          </View>
        ) : lbLoading ? (
          <View style={styles.lbLoadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primaryButton} />
            <Text style={[styles.lbLoadingText, { color: theme.colors.textSecondary }]}>Loading scores...</Text>
          </View>
        ) : lbScores.length === 0 ? (
          <View style={styles.lbLoadingContainer}>
            <Text style={[styles.lbLoadingText, { color: theme.colors.textSecondary }]}>
              {lbTab === 'allTime'
                ? 'No scores recorded yet.\nComplete a puzzle to appear on the leaderboard!'
                : lbViewType === 'friends'
                  ? 'No friends have completed this puzzle yet.\nAdd friends to see their scores!'
                  : `No scores yet for ${formatDisplayDate(lbSelectedDate)}.\nBe the first to complete it!`}
            </Text>
          </View>
        ) : (
          <View style={{ padding: 12, gap: 8 }}>
            {lbScores.map((score, index) => renderLbScoreRow(score, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderProfileTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Profile Preview Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.profilePreview}>
          <View style={[styles.avatarCircle, { backgroundColor: selectedColor }]}>
            <Text style={styles.avatarText}>{selectedAvatar}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileUsername, { color: theme.colors.textPrimary }]}>
              {username}
            </Text>
            <Text style={[styles.friendCode, { color: theme.colors.textSecondary }]}>
              Friend Code: {profile?.friendCode || '------'}
            </Text>
          </View>
        </View>

        {/* Username Editor */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
            Username
          </Text>
          {isEditingUsername ? (
            <View style={styles.usernameEditContainer}>
              <TextInput
                style={[
                  styles.usernameInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.cellBorder,
                    backgroundColor: theme.colors.cellBackground,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primaryButton }]}
                onPress={handleSaveUsername}
              >
                <Text style={[styles.saveButtonText, { color: theme.colors.primaryButtonText }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.colors.primaryButton }]}
              onPress={() => setIsEditingUsername(true)}
            >
              <Text style={[styles.editButtonText, { color: theme.colors.primaryButtonText }]}>
                Edit Username
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar Selector */}
        <View style={styles.sectionDivider} />
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
          Avatar
        </Text>
        <View style={styles.avatarGrid}>
          {/* Free avatars */}
          {AVATAR_OPTIONS.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatarOption,
                { backgroundColor: theme.colors.cellBackground },
                selectedAvatar === avatar && {
                  borderColor: theme.colors.primaryButton,
                  borderWidth: 3,
                },
              ]}
              onPress={() => handleAvatarSelect(avatar)}
            >
              <Text style={styles.avatarOptionText}>{avatar}</Text>
            </TouchableOpacity>
          ))}
          {/* Purchased premium avatars */}
          {premiumAvatars
            .filter((premiumAvatar) => isAvatarOwned(premiumAvatar.id))
            .map((premiumAvatar) => (
              <TouchableOpacity
                key={premiumAvatar.id}
                style={[
                  styles.avatarOption,
                  { backgroundColor: theme.colors.cellBackground },
                  selectedAvatar === premiumAvatar.emoji && {
                    borderColor: theme.colors.primaryButton,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => handleAvatarSelect(premiumAvatar.emoji)}
              >
                <Text style={styles.avatarOptionText}>{premiumAvatar.emoji}</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* Color Selector */}
        <View style={styles.sectionDivider} />
        <Text style={[styles.settingLabel, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
          Profile Color
        </Text>
        <View style={styles.colorGrid}>
          {PROFILE_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => handleColorSelect(color)}
            >
              {selectedColor === color && (
                <Text style={styles.colorCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Selection Card */}
      <View style={[styles.themeCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.themeCardTitle, { color: theme.colors.textPrimary }]}>
          Color Theme
        </Text>
        <Text style={[styles.themeCardDesc, { color: theme.colors.textSecondary }]}>
          Choose your app color scheme
        </Text>
        <View style={styles.themesGrid}>
          {themeKeys.map((key) => {
            const themeData = themes[key];
            const isSelected = key === themeKey;
            const owned = isThemeOwned(key);

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeOption,
                  { backgroundColor: themeData.colors.cardBackground },
                  isSelected && { borderColor: theme.colors.primaryButton, borderWidth: 2 },
                  !owned && styles.themeOptionLocked,
                ]}
                onPress={() => handleThemeSelect(key)}
              >
                <View style={styles.themeHeader}>
                  <Text style={[styles.themeName, { color: themeData.colors.textPrimary }]} numberOfLines={1}>
                    {themeData.name}
                  </Text>
                  {!owned && <Text style={styles.lockedIcon}>🔒</Text>}
                  {isSelected && owned && <Text style={styles.selectedIcon}>✓</Text>}
                </View>
                <View style={styles.themeSwatches}>
                  <View style={[styles.themeSwatch, { backgroundColor: themeData.colors.primaryButton }]} />
                  <View style={[styles.themeSwatch, { backgroundColor: themeData.colors.cellSelected }]} />
                  <View style={[styles.themeSwatch, { backgroundColor: themeData.colors.difficultyEasy }]} />
                  <View style={[styles.themeSwatch, { backgroundColor: themeData.colors.difficultyMedium }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Share Code Card */}
      <View style={[styles.shareCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.shareTitle, { color: theme.colors.textPrimary }]}>
          Refer a Friend
        </Text>
        <Text style={[styles.shareDescription, { color: theme.colors.textSecondary }]}>
          Share your code — you get 50 coins and your friend gets 100 coins
        </Text>
        <View style={styles.shareCodeContainer}>
          <Text style={[styles.shareCodeText, { color: theme.colors.primaryButton }]}>
            {profile?.friendCode || '------'}
          </Text>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.success }]}
            onPress={handleShareCode}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
        {(referralStats?.referralCount ?? 0) > 0 && (
          <Text style={[styles.referralStatsText, { color: theme.colors.textSecondary }]}>
            {referralStats!.referralCount} {referralStats!.referralCount === 1 ? 'friend' : 'friends'} referred · {referralStats!.referralCoinsEarned} coins earned
          </Text>
        )}
      </View>

      {/* Enter Referral Code Card */}
      <View style={[styles.referralCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.shareTitle, { color: theme.colors.textPrimary }]}>
          Have a Referral Code?
        </Text>
        {referralStats?.hasBeenReferred ? (
          <>
            <Text style={[styles.referralUsedText, { color: theme.colors.textSecondary }]}>
              You've already used a referral code.
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.shareDescription, { color: theme.colors.textSecondary }]}>
              Enter a friend's code to earn 100 free coins. New players only.
            </Text>
            <View style={styles.referralInputRow}>
              <TextInput
                style={[
                  styles.referralInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.cellBorder,
                    backgroundColor: theme.colors.cellBackground,
                  },
                ]}
                placeholder="Enter code"
                placeholderTextColor={theme.colors.textSecondary}
                value={referralCodeInput}
                onChangeText={setReferralCodeInput}
                autoCapitalize="characters"
                maxLength={6}
                editable={!referralSubmitting}
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: referralSubmitting ? theme.colors.cellBorder : theme.colors.primaryButton },
                ]}
                onPress={handleApplyReferral}
                disabled={referralSubmitting}
              >
                <Text style={[styles.applyButtonText, { color: theme.colors.primaryButtonText }]}>
                  {referralSubmitting ? '...' : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );

  const renderFriendsTab = () => (
    <View style={styles.tabContent}>
      {/* Add Friend Section */}
      <View style={[styles.addFriendCard, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.addFriendTitle, { color: theme.colors.textPrimary }]}>
          Add Friend
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.friendInput,
              {
                color: theme.colors.textPrimary,
                borderColor: theme.colors.cellBorder,
                backgroundColor: theme.colors.cellBackground,
              },
            ]}
            placeholder="Enter friend code"
            placeholderTextColor={theme.colors.textSecondary}
            value={friendCodeInput}
            onChangeText={setFriendCodeInput}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primaryButton }]}
            onPress={handleAddFriend}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.primaryButtonText }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Friends/Requests Sub-tabs */}
      <View style={[styles.subTabs, { borderBottomColor: theme.colors.cellBorder }]}>
        <TouchableOpacity
          style={[
            styles.subTab,
            friendsSubTab === 'friends' && { borderBottomColor: theme.colors.primaryButton, borderBottomWidth: 2 },
          ]}
          onPress={() => setFriendsSubTab('friends')}
        >
          <Text
            style={[
              styles.subTabText,
              { color: friendsSubTab === 'friends' ? theme.colors.primaryButton : theme.colors.textSecondary },
            ]}
          >
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            friendsSubTab === 'requests' && { borderBottomColor: theme.colors.primaryButton, borderBottomWidth: 2 },
          ]}
          onPress={() => setFriendsSubTab('requests')}
        >
          <Text
            style={[
              styles.subTabText,
              { color: friendsSubTab === 'requests' ? theme.colors.primaryButton : theme.colors.textSecondary },
            ]}
          >
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      {friendsSubTab === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={[styles.friendItem, { backgroundColor: theme.colors.cardBackground }]}>
              <View style={[styles.friendAvatar, { backgroundColor: item.profileColor || '#3B82F6' }]}>
                <Text style={styles.friendAvatarText}>{item.avatar || '😀'}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: theme.colors.textPrimary }]}>
                  {item.username}
                </Text>
                <Text style={[styles.friendCodeSmall, { color: theme.colors.textSecondary }]}>
                  {item.friendCode}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.isDark ? '#450a0a' : '#FEE2E2' }]}
                onPress={() => handleRemoveFriend(item)}
              >
                <Text style={[styles.removeButtonText, { color: theme.isDark ? '#FCA5A5' : '#DC2626' }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No friends yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Share your code or add friends to compete!
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.requestItem, { backgroundColor: theme.colors.cardBackground }]}>
              <View style={styles.requestInfo}>
                <Text style={[styles.requestName, { color: theme.colors.textPrimary }]}>
                  {item.fromUsername}
                </Text>
                <Text style={[styles.requestText, { color: theme.colors.textSecondary }]}>
                  wants to be friends!
                </Text>
              </View>
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={[styles.requestButton, { backgroundColor: theme.colors.success }]}
                  onPress={() => handleAcceptRequest(item.id, item.fromUsername)}
                >
                  <Text style={styles.requestButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleRejectRequest(item.id)}
                >
                  <Text style={styles.requestButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No pending requests
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <NavigationHeader title="Social" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenErrorBoundary screenName="Social">
      <SwipeableScreen>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <NavigationHeader title="Social" />

        {/* Main Tabs */}
        <View style={[styles.mainTabs, { backgroundColor: theme.colors.cardBackground }]}>
          {(['profile', 'friends', 'leaderboards'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.mainTab,
                activeTab === tab && { backgroundColor: theme.colors.primaryButton },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.mainTabText,
                  { color: activeTab === tab ? theme.colors.primaryButtonText : theme.colors.textPrimary },
                ]}
              >
                {tab === 'profile' ? 'Profile' : tab === 'friends' ? 'Friends' : '🏆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'profile'
          ? renderProfileTab()
          : activeTab === 'friends'
            ? renderFriendsTab()
            : renderLeaderboardsTab()}
      </View>
    </SwipeableScreen>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  mainTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  friendCode: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 16,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionText: {
    fontSize: 32,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shareCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  shareDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  shareCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareCodeText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  shareButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addFriendCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  friendInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  subTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 24,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendCodeSmall: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestText: {
    fontSize: 12,
    marginTop: 2,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  themeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeCardDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeOption: {
    width: '48%',
    borderRadius: 10,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionLocked: {
    opacity: 0.6,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  lockedIcon: {
    fontSize: 14,
  },
  selectedIcon: {
    fontSize: 16,
    color: '#3B82F6',
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 4,
  },
  themeSwatch: {
    flex: 1,
    height: 20,
    borderRadius: 4,
  },
  referralStatsText: {
    fontSize: 13,
    marginTop: 12,
  },
  referralCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  referralInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  referralInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 2,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 70,
    alignItems: 'center',
  },
  applyButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  referralUsedText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Leaderboard styles
  lbTabContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  lbTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  lbTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  dateNavArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateCenterContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dateDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  rankTextMedal: {
    fontSize: 22,
  },
  lbAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  lbAvatarEmoji: {
    fontSize: 20,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 10,
  },
  lbUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  lbDateText: {
    fontSize: 11,
    marginTop: 1,
  },
  scoreStats: {
    alignItems: 'flex-end',
  },
  lbTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintsText: {
    fontSize: 11,
    marginTop: 1,
  },
  lbLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  lbLoadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
