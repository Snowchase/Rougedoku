import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudio } from '../../contexts/AudioContext';
import { themes, themeKeys, ThemeKey } from '../../constants/themes';
import {
  getUserProfile,
  getCurrentUser,
  updateProfile,
  AVATAR_OPTIONS,
  PROFILE_COLORS,
  type UserProfile,
} from '../../components/friendService';

export default function SettingsScreen() {
  const { theme, themeKey, setTheme } = useTheme();
  const {
    settings: audioSettings,
    setMusicEnabled,
    setSoundEffectsEnabled,
    setMusicVolume,
    setSfxVolume,
  } = useAudio();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = getCurrentUser();
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setUsername(userProfile.username);
        setSelectedAvatar(userProfile.avatar || '😀');
        setSelectedColor(userProfile.profileColor || '#3B82F6');
      }
    }
  };

  const handleSaveUsername = async () => {
    if (username.trim().length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long');
      return;
    }

    const result = await updateProfile({ username: username.trim() });
    if (result.success) {
      setIsEditingUsername(false);
      await loadProfile();
      Alert.alert('Success', 'Username updated successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to update username');
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    setSelectedAvatar(avatar);
    const result = await updateProfile({ avatar });
    if (result.success) {
      await loadProfile();
    } else {
      // Revert on failure
      setSelectedAvatar(profile?.avatar || '😀');
    }
  };

  const handleColorSelect = async (color: string) => {
    setSelectedColor(color);
    const result = await updateProfile({ profileColor: color });
    if (result.success) {
      await loadProfile();
    } else {
      // Revert on failure
      setSelectedColor(profile?.profileColor || '#3B82F6');
    }
  };

  const handleThemeSelect = async (key: ThemeKey) => {
    await setTheme(key);
  };

  const renderThemePreview = (key: ThemeKey) => {
    const themeData = themes[key];
    const isSelected = key === themeKey;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.themeCard,
          { backgroundColor: themeData.colors.cardBackground },
          isSelected && styles.themeCardSelected,
        ]}
        onPress={() => handleThemeSelect(key)}
      >
        <View style={styles.themeHeader}>
          <Text style={[styles.themeName, { color: themeData.colors.textPrimary }]}>
            {themeData.name}
          </Text>
          {isSelected && (
            <Text style={styles.selectedBadge}>✓</Text>
          )}
        </View>

        {/* Color Preview */}
        <View style={styles.colorPreview}>
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: themeData.colors.primaryButton },
            ]}
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: themeData.colors.cellSelected },
            ]}
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: themeData.colors.difficultyEasy },
            ]}
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: themeData.colors.difficultyMedium },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Profile
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Customize your profile - changes will appear on leaderboards
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Profile Preview */}
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
              <TouchableOpacity onPress={() => setIsEditingUsername(true)}>
                <Text style={{ color: theme.colors.primaryButton }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar Selector */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
              Avatar
            </Text>
          </View>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((avatar) => (
              <TouchableOpacity
                key={avatar}
                style={[
                  styles.avatarOption,
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
          </View>

          {/* Color Selector */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
              Profile Color
            </Text>
          </View>
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

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Color Theme
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Choose your preferred color scheme for the app
          </Text>
        </View>

        <View style={styles.themesGrid}>
          {themeKeys.map(key => renderThemePreview(key))}
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Audio & Music
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Control background music and sound effects
          </Text>
        </View>

        <View style={[styles.audioCard, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Music Toggle */}
          <View style={styles.audioRow}>
            <View style={styles.audioLabelContainer}>
              <Text style={[styles.audioLabel, { color: theme.colors.textPrimary }]}>
                Background Music
              </Text>
              <Text style={[styles.audioSubLabel, { color: theme.colors.textSecondary }]}>
                Play music on home screen and during gameplay
              </Text>
            </View>
            <Switch
              value={audioSettings.musicEnabled}
              onValueChange={setMusicEnabled}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primaryButton }}
              thumbColor="#fff"
            />
          </View>

          {/* Music Volume */}
          {audioSettings.musicEnabled && (
            <View style={styles.volumeContainer}>
              <Text style={[styles.volumeLabel, { color: theme.colors.textPrimary }]}>
                Music Volume: {Math.round(audioSettings.musicVolume * 100)}%
              </Text>
              <View style={styles.volumeSlider}>
                {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.volumeButton,
                      { backgroundColor: theme.colors.cellBackground },
                      audioSettings.musicVolume === value && {
                        backgroundColor: theme.colors.primaryButton,
                      },
                    ]}
                    onPress={() => setMusicVolume(value)}
                  >
                    <Text
                      style={[
                        styles.volumeButtonText,
                        { color: theme.colors.textPrimary },
                        audioSettings.musicVolume === value && {
                          color: theme.colors.primaryButtonText,
                        },
                      ]}
                    >
                      {Math.round(value * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sound Effects Toggle */}
          <View style={styles.audioRow}>
            <View style={styles.audioLabelContainer}>
              <Text style={[styles.audioLabel, { color: theme.colors.textPrimary }]}>
                Sound Effects
              </Text>
              <Text style={[styles.audioSubLabel, { color: theme.colors.textSecondary }]}>
                Play sounds for button clicks and game events
              </Text>
            </View>
            <Switch
              value={audioSettings.soundEffectsEnabled}
              onValueChange={setSoundEffectsEnabled}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primaryButton }}
              thumbColor="#fff"
            />
          </View>

          {/* SFX Volume */}
          {audioSettings.soundEffectsEnabled && (
            <View style={styles.volumeContainer}>
              <Text style={[styles.volumeLabel, { color: theme.colors.textPrimary }]}>
                Effects Volume: {Math.round(audioSettings.sfxVolume * 100)}%
              </Text>
              <View style={styles.volumeSlider}>
                {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.volumeButton,
                      { backgroundColor: theme.colors.cellBackground },
                      audioSettings.sfxVolume === value && {
                        backgroundColor: theme.colors.primaryButton,
                      },
                    ]}
                    onPress={() => setSfxVolume(value)}
                  >
                    <Text
                      style={[
                        styles.volumeButtonText,
                        { color: theme.colors.textPrimary },
                        audioSettings.sfxVolume === value && {
                          color: theme.colors.primaryButtonText,
                        },
                      ]}
                    >
                      {Math.round(value * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.audioNote, { backgroundColor: theme.colors.cellBackground }]}>
            <Text style={[styles.audioNoteText, { color: theme.colors.textSecondary }]}>
              💡 Note: Add your own MP3 files to assets/audio/ to enable music playback. See README for instructions.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            About
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Sudokle - Daily Sudoku Challenge
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
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
    marginBottom: 16,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  themeCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeCardSelected: {
    borderColor: '#3B82F6',
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedBadge: {
    fontSize: 18,
    color: '#3B82F6',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    flex: 1,
    height: 28,
    borderRadius: 6,
  },
  miniGrid: {
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  miniGridRow: {
    flexDirection: 'row',
  },
  miniCell: {
    width: 30,
    height: 30,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  audioCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  audioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  audioLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  audioSubLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  volumeContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  volumeSlider: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  volumeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  audioNote: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  audioNoteText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
