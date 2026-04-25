import React, { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';
import { useAudio } from '../../contexts/AudioContext';
import { useSettings, NotificationHour } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationService } from '../../services/notificationService';
import { patchNotesService } from '../../services/patchNotesService';

// TODO: Replace these with Rougedoku-branded hosted policy URLs once available
const PRIVACY_POLICY_URL = 'https://sudokleprivacy.netlify.app/';
const TERMS_OF_SERVICE_URL = 'https://sudokleterms.netlify.app/';

const NOTIFICATION_TIMES: { label: string; hour: NotificationHour }[] = [
  { label: 'Morning\n8 AM', hour: 8 },
  { label: 'Noon\n12 PM', hour: 12 },
  { label: 'Evening\n6 PM', hour: 18 },
  { label: 'Night\n9 PM', hour: 21 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    settings: audioSettings,
    setMusicEnabled,
    setSoundEffectsEnabled,
    setMusicVolume,
    setSfxVolume,
  } = useAudio();
  const {
    settings: gameSettings,
    setBoardLocked,
    setNotificationsEnabled,
    setNotificationHour,
  } = useSettings();

  const [hasUnseenNotes, setHasUnseenNotes] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    patchNotesService.hasUnseenNotes().then(setHasUnseenNotes);
    notificationService.getPermissionStatus().then((status) => {
      setPermissionDenied(status === 'denied');
    });
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermission();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      await setNotificationsEnabled(true);
      await notificationService.scheduleDailyReminder(gameSettings.notificationHour);
    } else {
      await setNotificationsEnabled(false);
      await notificationService.cancelAll();
    }
  };

  const handleNotificationHourChange = async (hour: NotificationHour) => {
    await setNotificationHour(hour);
    if (gameSettings.notificationsEnabled) {
      await notificationService.scheduleDailyReminder(hour);
    }
  };

  return (
    <ScreenErrorBoundary screenName="Settings">
      <SwipeableScreen>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <NavigationHeader title="Settings" />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Game Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            Game Settings
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            Customize your gameplay experience
          </Text>
        </View>

        <View style={[styles.gameSettingsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.settingRowWithSwitch}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Lock Board Position
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
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

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            Notifications
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            Get reminded when it's time to play
          </Text>
        </View>

        <View style={[styles.notificationCard, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Enable toggle */}
          <View style={styles.settingRowWithSwitch}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Daily Reminders
              </Text>
              <Text style={[styles.settingSubLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                Remind me to play each day
              </Text>
            </View>
            <Switch
              value={gameSettings.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primaryButton }}
              thumbColor="#fff"
            />
          </View>

          {/* Permission denied warning */}
          {permissionDenied && (
            <TouchableOpacity
              style={[styles.permissionWarning, { backgroundColor: '#FEF3C7' }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={[styles.permissionWarningText, { color: '#92400E' }]} maxFontSizeMultiplier={1.2}>
                ⚠️ Notifications are blocked. Tap here to open Settings and allow them.
              </Text>
            </TouchableOpacity>
          )}

          {/* Reminder time picker */}
          {gameSettings.notificationsEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.cellBackground }]} />
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary, marginBottom: 10 }]} maxFontSizeMultiplier={1.2}>
                Reminder Time
              </Text>
              <View style={styles.timeButtonRow}>
                {NOTIFICATION_TIMES.map(({ label, hour }) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeButton,
                      { backgroundColor: theme.colors.cellBackground },
                      gameSettings.notificationHour === hour && { backgroundColor: theme.colors.primaryButton },
                    ]}
                    onPress={() => handleNotificationHourChange(hour)}
                  >
                    <Text
                      style={[
                        styles.timeButtonText,
                        { color: theme.colors.textPrimary },
                        gameSettings.notificationHour === hour && { color: theme.colors.primaryButtonText },
                      ]}
                      allowFontScaling={false}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </>
          )}
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            Audio & Music
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            Control background music and sound effects
          </Text>
        </View>

        <View style={[styles.audioCard, { backgroundColor: theme.colors.cardBackground }]}>
          {/* Music Toggle */}
          <View style={styles.audioRow}>
            <View style={styles.audioLabelContainer}>
              <Text style={[styles.audioLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Background Music
              </Text>
              <Text style={[styles.audioSubLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
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
              <Text style={[styles.volumeLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
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
                      allowFontScaling={false}
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
              <Text style={[styles.audioLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Sound Effects
              </Text>
              <Text style={[styles.audioSubLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
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
              <Text style={[styles.volumeLabel, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
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
                      allowFontScaling={false}
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
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            Legal
          </Text>
          <View style={[styles.legalCard, { backgroundColor: theme.colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => openLink(PRIVACY_POLICY_URL)}
            >
              <Text style={[styles.legalLinkText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Privacy Policy
              </Text>
              <Text style={[styles.legalLinkArrow, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                {'>'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.legalDivider, { backgroundColor: theme.colors.cellBackground }]} />
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => openLink(TERMS_OF_SERVICE_URL)}
            >
              <Text style={[styles.legalLinkText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Terms of Service
              </Text>
              <Text style={[styles.legalLinkArrow, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                {'>'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            About
          </Text>
          <View style={[styles.aboutCard, { backgroundColor: theme.colors.cardBackground }]}>
            {/* What's New row */}
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => router.push('/patch-notes')}
            >
              <View style={styles.whatsNewLabel}>
                <Text style={[styles.legalLinkText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                  What's New
                </Text>
                {hasUnseenNotes && (
                  <View style={[styles.newBadge, { backgroundColor: theme.colors.primaryButton }]}>
                    <Text style={[styles.newBadgeText, { color: theme.colors.primaryButtonText }]} allowFontScaling={false}>
                      NEW
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.legalLinkArrow, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                {'>'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.legalDivider, { backgroundColor: theme.colors.cellBackground }]} />
            <View style={styles.infoRows}>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                Rougedoku - Sudoku Roguelike
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                Version 1.1.5
              </Text>
            </View>
          </View>
        </View>
        </ScrollView>
      </View>
    </SwipeableScreen>
    </ScreenErrorBoundary>
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
  notificationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
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
  permissionWarning: {
    padding: 12,
    borderRadius: 10,
  },
  permissionWarningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
  },
  timeButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  infoRows: {
    padding: 16,
    gap: 6,
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
  aboutCard: {
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
  whatsNewLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
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
