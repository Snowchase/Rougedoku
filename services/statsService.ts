import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RunState } from '../constants/runConfig';

const STATS_STORAGE_KEY = 'rougedoku_user_stats';

// ─── Run-based stats ──────────────────────────────────────────────────────────

export interface UserStats {
  userId: string;

  // Run stats
  runsAttempted: number;
  runsCompleted: number;   // reached final floor
  maxFloorReached: number; // best single run
  totalFloorsCleared: number;
  totalMistakes: number;
  totalCoinsEarned: number;

  // Legacy field kept for referral eligibility check
  totalPuzzlesSolved: number;

  createdAt: any;
  updatedAt: any;
}

export function createEmptyStats(userId: string): UserStats {
  return {
    userId,
    runsAttempted: 0,
    runsCompleted: 0,
    maxFloorReached: 0,
    totalFloorsCleared: 0,
    totalMistakes: 0,
    totalCoinsEarned: 0,
    totalPuzzlesSolved: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const statsDoc = await getDoc(doc(db, 'userStats', userId));

    if (statsDoc.exists()) {
      const stats = statsDoc.data() as UserStats;
      try {
        await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      } catch {
        // non-critical
      }
      return stats;
    }

    const newStats = createEmptyStats(userId);
    await setDoc(doc(db, 'userStats', userId), newStats);
    try {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // non-critical
    }
    return newStats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    try {
      const cached = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (cached) return JSON.parse(cached) as UserStats;
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Record the result of a completed or failed run.
 * Call this from run-summary screen after the run ends.
 */
export async function updateStatsAfterRun(run: RunState): Promise<{ success: boolean }> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false };

    const stats = await getUserStats(user.uid);
    if (!stats) return { success: false };

    const floorsCleared = run.status === 'completed'
      ? run.maxFloors
      : Math.max(0, run.currentFloor - 1);

    const totalRunCoins = run.floorRewards.reduce((a, b) => a + b, 0);

    const updatedStats: Partial<UserStats> = {
      runsAttempted: stats.runsAttempted + 1,
      runsCompleted: stats.runsCompleted + (run.status === 'completed' ? 1 : 0),
      maxFloorReached: Math.max(stats.maxFloorReached, run.status === 'completed' ? run.maxFloors : run.currentFloor),
      totalFloorsCleared: stats.totalFloorsCleared + floorsCleared,
      totalMistakes: stats.totalMistakes + run.totalMistakes,
      totalCoinsEarned: stats.totalCoinsEarned + totalRunCoins,
      totalPuzzlesSolved: stats.totalPuzzlesSolved + floorsCleared, // kept for referral check
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, 'userStats', user.uid), updatedStats);

    try {
      await AsyncStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify({ ...stats, ...updatedStats }),
      );
    } catch {
      // non-critical
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating run stats:', error);
    return { success: false };
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export interface FormattedStats {
  runsAttempted: number;
  runsCompleted: number;
  maxFloorReached: number;
  totalFloorsCleared: number;
  completionRate: number;   // percentage
  totalMistakes: number;
  totalCoinsEarned: number;
}

export function formatStatsForDisplay(stats: UserStats): FormattedStats {
  const completionRate = stats.runsAttempted === 0
    ? 0
    : Math.round((stats.runsCompleted / stats.runsAttempted) * 100);

  return {
    runsAttempted: stats.runsAttempted,
    runsCompleted: stats.runsCompleted,
    maxFloorReached: stats.maxFloorReached,
    totalFloorsCleared: stats.totalFloorsCleared,
    completionRate,
    totalMistakes: stats.totalMistakes,
    totalCoinsEarned: stats.totalCoinsEarned,
  };
}
