import AsyncStorage from '@react-native-async-storage/async-storage';
import { PATCH_NOTES } from '../constants/patchNotes';

const SEEN_VERSION_KEY = 'rougedoku_last_seen_patch_version';
const LATEST_VERSION = PATCH_NOTES[0].version;

export const patchNotesService = {
  async hasUnseenNotes(): Promise<boolean> {
    try {
      const seen = await AsyncStorage.getItem(SEEN_VERSION_KEY);
      return seen !== LATEST_VERSION;
    } catch {
      return false;
    }
  },

  async markAsSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(SEEN_VERSION_KEY, LATEST_VERSION);
    } catch {
      // non-critical, ignore
    }
  },
};
