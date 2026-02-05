/**
 * Coin Boost Service - Manages a daily hidden difficulty selection for rewarded ad boost.
 *
 * Each day, one of the four difficulty puzzles is randomly chosen (hidden from user).
 * When the user completes that specific puzzle, they are offered a rewarded interstitial
 * ad. Watching the ad grants a 20% coin bonus on that puzzle's reward.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const DAILY_BOOST_KEY = 'sudokle_daily_boost_selection';

export interface DailyBoostSelection {
  difficulty: Difficulty;
  date: string; // YYYY-MM-DD format
  used: boolean; // Whether the boost has already been offered/used today
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

  // Create a new selection for today
  const randomIndex = Math.floor(Math.random() * DIFFICULTIES.length);
  const selection: DailyBoostSelection = {
    difficulty: DIFFICULTIES[randomIndex],
    date: today,
    used: false,
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
 * Returns true if this difficulty is today's chosen one and hasn't been used yet.
 */
export async function isBoostEligible(difficulty: Difficulty): Promise<boolean> {
  const selection = await getDailyBoostSelection();
  return selection.difficulty === difficulty && !selection.used;
}

/**
 * Mark today's boost as used (called after ad is shown, regardless of outcome).
 */
export async function markBoostUsed(): Promise<void> {
  try {
    const selection = await getDailyBoostSelection();
    selection.used = true;
    await AsyncStorage.setItem(DAILY_BOOST_KEY, JSON.stringify(selection));
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
