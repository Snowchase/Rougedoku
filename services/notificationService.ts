import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ID = 'sudokle_daily_reminder';
const STREAK_ALERT_ID = 'sudokle_streak_alert';

// The hour (local time) at which the streak alert fires regardless of reminder time.
const STREAK_ALERT_HOUR = 21;

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    if (Platform.OS === 'web') return 'undetermined' as Notifications.PermissionStatus;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  async scheduleDailyReminder(hour: number): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: "Today's puzzle is waiting! 🧩",
        body: "A new Sudoku is ready. Can you solve it?",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  },

  async scheduleStreakAlert(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_ALERT_ID,
      content: {
        title: '🔥 Your streak is at risk!',
        body: "Don't forget to play today's puzzle before midnight.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: STREAK_ALERT_HOUR,
        minute: 0,
      },
    });
  },

  async cancelDailyReminder(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  },

  async cancelStreakAlert(): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(STREAK_ALERT_ID).catch(() => {});
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async initialize(
    notificationsEnabled: boolean,
    notificationHour: number,
    streakAlertsEnabled: boolean,
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    if (!notificationsEnabled) {
      await this.cancelAll();
      return;
    }

    const status = await this.getPermissionStatus();
    if (status !== 'granted') return;

    await this.scheduleDailyReminder(notificationHour);

    if (streakAlertsEnabled) {
      await this.scheduleStreakAlert();
    } else {
      await this.cancelStreakAlert();
    }
  },
};
