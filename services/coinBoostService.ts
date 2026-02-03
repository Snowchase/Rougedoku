/**
 * Coin Boost Service - Manages the 20% coin boost from rewarded interstitial ads
 *
 * The boost is randomly assigned to one of four difficulty puzzles and
 * applies when the user completes that specific puzzle on the same day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const COIN_BOOST_STORAGE_KEY = 'sudokle_coin_boost';

export interface CoinBoost {
  difficulty: Difficulty;
  date: string; // YYYY-MM-DD format
  boostMultiplier: number; // 1.20 for 20% boost
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
 * Randomly select one of the four difficulty levels
 */
export function selectRandomDifficulty(): Difficulty {
  const randomIndex = Math.floor(Math.random() * DIFFICULTIES.length);
  return DIFFICULTIES[randomIndex];
}

/**
 * Get the current active coin boost (if any)
 * Returns null if no boost is active or if the boost has expired (different day)
 */
export async function getCoinBoost(): Promise<CoinBoost | null> {
  try {
    const data = await AsyncStorage.getItem(COIN_BOOST_STORAGE_KEY);
    if (!data) {
      return null;
    }

    const boost: CoinBoost = JSON.parse(data);

    // Check if boost is for today (boost expires at midnight)
    const today = getDateString();
    if (boost.date !== today) {
      // Boost has expired, clear it
      await clearCoinBoost();
      return null;
    }

    return boost;
  } catch (error) {
    console.error('Error getting coin boost:', error);
    return null;
  }
}

/**
 * Set a new coin boost for the specified difficulty
 */
export async function setCoinBoost(difficulty: Difficulty): Promise<CoinBoost> {
  const boost: CoinBoost = {
    difficulty,
    date: getDateString(),
    boostMultiplier: BOOST_MULTIPLIER,
  };

  try {
    await AsyncStorage.setItem(COIN_BOOST_STORAGE_KEY, JSON.stringify(boost));
    console.log(`Coin boost activated for ${difficulty} puzzle!`);
    return boost;
  } catch (error) {
    console.error('Error setting coin boost:', error);
    throw error;
  }
}

/**
 * Clear the current coin boost (called after the boost is used)
 */
export async function clearCoinBoost(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COIN_BOOST_STORAGE_KEY);
    console.log('Coin boost cleared');
  } catch (error) {
    console.error('Error clearing coin boost:', error);
  }
}

/**
 * Check if a specific difficulty has an active coin boost
 */
export async function hasBoostForDifficulty(difficulty: Difficulty): Promise<boolean> {
  const boost = await getCoinBoost();
  return boost !== null && boost.difficulty === difficulty;
}

/**
 * Get the boost multiplier for a specific difficulty
 * Returns 1.0 if no boost is active, or the boost multiplier if active
 */
export async function getBoostMultiplier(difficulty: Difficulty): Promise<number> {
  const boost = await getCoinBoost();
  if (boost && boost.difficulty === difficulty) {
    return boost.boostMultiplier;
  }
  return 1.0;
}

/**
 * Get the boost multiplier constant (for display purposes)
 */
export function getBoostPercentage(): number {
  return (BOOST_MULTIPLIER - 1) * 100; // Returns 20 for 20%
}
