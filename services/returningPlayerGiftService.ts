import AsyncStorage from '@react-native-async-storage/async-storage';

const GIFT_CLAIMED_KEY = 'sudokle_gift_v115_claimed';
const STATS_STORAGE_KEY = 'sudokle_user_stats';

/**
 * Returns true if:
 *  - The player has existing stats (i.e. has completed at least one puzzle), AND
 *  - The gift has not yet been claimed this version.
 *
 * Marks the gift as claimed before returning so it is never awarded twice.
 */
export async function checkAndClaimReturningPlayerGift(): Promise<boolean> {
  try {
    const [claimed, stats] = await Promise.all([
      AsyncStorage.getItem(GIFT_CLAIMED_KEY),
      AsyncStorage.getItem(STATS_STORAGE_KEY),
    ]);

    if (claimed === 'true') return false;

    // Mark as claimed regardless of eligibility so we never check twice
    await AsyncStorage.setItem(GIFT_CLAIMED_KEY, 'true');

    // Only award if they have existing play history
    return stats !== null;
  } catch {
    return false;
  }
}
