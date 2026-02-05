/**
 * Coin Boost Service - Manages daily hidden difficulty selections for rewarded ad boost.
 *
 * Each day, two of the four difficulty puzzles are randomly chosen (hidden from user).
 * When the user completes one of those puzzles, they are offered a rewarded interstitial
 * ad. Watching the ad grants a 20% coin bonus on that puzzle's reward.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const DAILY_BOOST_KEY = 'sudokle_daily_boost_selection';

export interface DailyBoostSelection {
  difficulties: Difficulty[]; // Two randomly chosen difficulties
  date: string; // YYYY-MM-DD format
  usedDifficulties: Difficulty[]; // Which of the two have already been offered/used
}

const BOOST_MULTIPLIER = 1.20; // 20% boost

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/**
 * Get current date string in YYYY-MM-DD format
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Randomly select two unique difficulties from the four available.
 */
function selectTwoRandomDifficulties(): Difficulty[] {
  const shuffled = [...DIFFICULTIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

/**
 * Get or create today's daily boost selection.
 * Automatically generates a new random selection each day.
 */
export async function getDailyBoostSelection(): Promise<DailyBoostSelection> {
  const today = getDateString();

  try {
    const data = await AsyncStorage.getItem(DAILY_BOOST_KEY);
    if (data) {
      const selection: DailyBoostSelection = JSON.parse(data);
      if (selection.date === today) {
        return selection;
      }
    }
  } catch (error) {
    console.error('Error reading daily boost selection:', error);
  }

  // Create a new selection for today with two random difficulties
  const selection: DailyBoostSelection = {
    difficulties: selectTwoRandomDifficulties(),
    date: today,
    usedDifficulties: [],
  };

  try {
    await AsyncStorage.setItem(DAILY_BOOST_KEY, JSON.stringify(selection));
  } catch (error) {
    console.error('Error saving daily boost selection:', error);
  }

  return selection;
}

/**
 * Check if the completed difficulty is eligible for a boost ad.
 * Returns true if this difficulty is one of today's chosen two and hasn't been used yet.
 */
export async function isBoostEligible(difficulty: Difficulty): Promise<boolean> {
  const selection = await getDailyBoostSelection();
  return selection.difficulties.includes(difficulty) && !selection.usedDifficulties.includes(difficulty);
}

/**
 * Mark a specific difficulty's boost as used (called after ad is shown, regardless of outcome).
 */
export async function markBoostUsed(difficulty: Difficulty): Promise<void> {
  try {
    const selection = await getDailyBoostSelection();
    if (!selection.usedDifficulties.includes(difficulty)) {
      selection.usedDifficulties.push(difficulty);
      await AsyncStorage.setItem(DAILY_BOOST_KEY, JSON.stringify(selection));
    }
  } catch (error) {
    console.error('Error marking boost as used:', error);
  }
}

/**
 * Calculate the bonus coins from the boost (20% of base reward).
 */
export function calculateBoostBonus(baseRewardTotal: number): number {
  return Math.round(baseRewardTotal * (BOOST_MULTIPLIER - 1));
}

/**
 * Get the boost percentage for display purposes.
 */
export function getBoostPercentage(): number {
  return Math.round((BOOST_MULTIPLIER - 1) * 100); // Returns 20
}
