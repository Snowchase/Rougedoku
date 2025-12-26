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
  AVATAR_OPTIONS,
  PROFILE_COLORS,
  type UserProfile,
  type FriendRequest,
} from '../../components/friendService';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';

type TabType = 'profile' | 'friends';
type FriendsSubTab = 'friends' | 'requests';

export default function SocialScreen() {
  const router = useRouter();
  const { theme, themeKey, setTheme } = useTheme();
  const { coins, isAvatarOwned, isThemeOwned } = useCurrency();

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

  useEffect(() => {
    loadData();
  }, []);

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
        message: `Add me on Sudokle! My friend code is: ${profile.friendCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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
          Share Your Friend Code
        </Text>
        <Text style={[styles.shareDescription, { color: theme.colors.textSecondary }]}>
          Friends can add you using this code to compete on leaderboards
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
          <TouchableOpacity
            style={[
              styles.mainTab,
              activeTab === 'profile' && { backgroundColor: theme.colors.primaryButton },
            ]}
            onPress={() => setActiveTab('profile')}
          >
            <Text
              style={[
                styles.mainTabText,
                { color: activeTab === 'profile' ? theme.colors.primaryButtonText : theme.colors.textPrimary },
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mainTab,
              activeTab === 'friends' && { backgroundColor: theme.colors.primaryButton },
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                styles.mainTabText,
                { color: activeTab === 'friends' ? theme.colors.primaryButtonText : theme.colors.textPrimary },
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'profile' ? renderProfileTab() : renderFriendsTab()}
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
});
