import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { useAudio } from '../../contexts/AudioContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';

// TODO: Replace these URLs with your actual hosted policy URLs
const PRIVACY_POLICY_URL = 'https://sudokleprivacy.netlify.app/';
const TERMS_OF_SERVICE_URL = 'https://sudokleterms.netlify.app/';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const {
    settings: audioSettings,
    setMusicEnabled,
    setSoundEffectsEnabled,
    setMusicVolume,
    setSfxVolume,
  } = useAudio();
  const { settings: gameSettings, setBoardLocked } = useSettings();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <SwipeableScreen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <NavigationHeader title="Settings" />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Game Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Game Settings
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Customize your gameplay experience
          </Text>
        </View>

        <View style={[styles.gameSettingsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.settingRowWithSwitch}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                Lock Board Position
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.textSecondary }]}>
                Prevent accidental zoom and pan gestures
              </Text>
            </View>
            <Switch
              value={gameSettings.boardLocked}
              onValueChange={setBoardLocked}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primaryButton }}
              thumbColor="#fff"
            />
          </View>
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
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Legal
          </Text>
          <View style={[styles.legalCard, { backgroundColor: theme.colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => openLink(PRIVACY_POLICY_URL)}
            >
              <Text style={[styles.legalLinkText, { color: theme.colors.textPrimary }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.legalLinkArrow, { color: theme.colors.textSecondary }]}>
                {'>'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.legalDivider, { backgroundColor: theme.colors.cellBackground }]} />
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => openLink(TERMS_OF_SERVICE_URL)}
            >
              <Text style={[styles.legalLinkText, { color: theme.colors.textPrimary }]}>
                Terms of Service
              </Text>
              <Text style={[styles.legalLinkArrow, { color: theme.colors.textSecondary }]}>
                {'>'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            About
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Sudokle - Daily Sudoku Challenge
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Version 1.0.2
            </Text>
          </View>
        </View>
        </ScrollView>
      </View>
    </SwipeableScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  gameSettingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingRowWithSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingSubLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  legalCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  legalLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  legalLinkArrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  legalDivider: {
    height: 1,
    marginHorizontal: 16,
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
