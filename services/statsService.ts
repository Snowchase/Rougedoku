import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';

export interface UserStats {
  userId: string;

  // Streak tracking
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD format

  // Total stats
  totalPuzzlesSolved: number;
  totalPuzzlesAttempted: number;

  // Per-difficulty stats
  easyStats: DifficultyStats;
  mediumStats: DifficultyStats;
  hardStats: DifficultyStats;

  // Timestamps
  createdAt: any;
  updatedAt: any;
}

export interface DifficultyStats {
  solved: number;
  attempted: number;
  totalTimeSeconds: number; // Sum of all completion times
  bestTimeSeconds: number; // Fastest completion
}

// Initialize empty stats
export function createEmptyStats(userId: string): UserStats {
  return {
    userId,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDate: '',
    totalPuzzlesSolved: 0,
    totalPuzzlesAttempted: 0,
    easyStats: { solved: 0, attempted: 0, totalTimeSeconds: 0, bestTimeSeconds: Infinity },
    mediumStats: { solved: 0, attempted: 0, totalTimeSeconds: 0, bestTimeSeconds: Infinity },
    hardStats: { solved: 0, attempted: 0, totalTimeSeconds: 0, bestTimeSeconds: Infinity },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Get user stats
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const statsDoc = await getDoc(doc(db, 'userStats', userId));

    if (statsDoc.exists()) {
      return statsDoc.data() as UserStats;
    }

    // Create new stats if they don't exist
    const newStats = createEmptyStats(userId);
    await setDoc(doc(db, 'userStats', userId), newStats);
    return newStats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

// Calculate streak based on last played date
function calculateStreak(lastPlayedDate: string, currentDate: string): { shouldIncrement: boolean; shouldReset: boolean } {
  if (!lastPlayedDate) {
    return { shouldIncrement: true, shouldReset: false };
  }

  const last = new Date(lastPlayedDate);
  const current = new Date(currentDate);

  // Set to midnight for accurate day comparison
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day - don't increment
    return { shouldIncrement: false, shouldReset: false };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { shouldIncrement: true, shouldReset: false };
  } else {
    // Missed day(s) - reset streak
    return { shouldIncrement: true, shouldReset: true };
  }
}

// Update stats after completing a puzzle
export async function updateStatsAfterCompletion(
  userId: string,
  date: string,
  difficulty: 'easy' | 'medium' | 'hard',
  timeSeconds: number,
  completed: boolean
): Promise<{ success: boolean; newStreak?: number }> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) {
      return { success: false };
    }

    // Calculate streak
    const { shouldIncrement, shouldReset } = calculateStreak(stats.lastPlayedDate, date);

    let newCurrentStreak = stats.currentStreak;
    if (shouldReset) {
      newCurrentStreak = 1;
    } else if (shouldIncrement) {
      newCurrentStreak = stats.currentStreak + 1;
    }

    const newBestStreak = Math.max(stats.bestStreak, newCurrentStreak);

    // Update difficulty-specific stats
    const difficultyKey = `${difficulty}Stats` as 'easyStats' | 'mediumStats' | 'hardStats';
    const diffStats = stats[difficultyKey];

    const updatedDiffStats: DifficultyStats = {
      solved: diffStats.solved + (completed ? 1 : 0),
      attempted: diffStats.attempted + 1,
      totalTimeSeconds: diffStats.totalTimeSeconds + (completed ? timeSeconds : 0),
      bestTimeSeconds: completed ? Math.min(diffStats.bestTimeSeconds, timeSeconds) : diffStats.bestTimeSeconds,
    };

    // Update total stats
    const updatedStats: Partial<UserStats> = {
      currentStreak: newCurrentStreak,
      bestStreak: newBestStreak,
      lastPlayedDate: date,
      totalPuzzlesSolved: stats.totalPuzzlesSolved + (completed ? 1 : 0),
      totalPuzzlesAttempted: stats.totalPuzzlesAttempted + 1,
      [difficultyKey]: updatedDiffStats,
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, 'userStats', userId), updatedStats);

    return { success: true, newStreak: newCurrentStreak };
  } catch (error) {
    console.error('Error updating stats:', error);
    return { success: false };
  }
}

// Calculate average time for a difficulty
export function calculateAverageTime(diffStats: DifficultyStats): number {
  if (diffStats.solved === 0) return 0;
  return Math.round(diffStats.totalTimeSeconds / diffStats.solved);
}

// Calculate win rate (percentage)
export function calculateWinRate(stats: UserStats): number {
  if (stats.totalPuzzlesAttempted === 0) return 0;
  return Math.round((stats.totalPuzzlesSolved / stats.totalPuzzlesAttempted) * 100);
}

// Get formatted stats for display
export interface FormattedStats {
  currentStreak: number;
  bestStreak: number;
  totalSolved: number;
  winRate: number;
  averageTimeEasy: string;
  averageTimeMedium: string;
  averageTimeHard: string;
  bestTimeEasy: string;
  bestTimeMedium: string;
  bestTimeHard: string;
}

function formatTime(seconds: number): string {
  if (seconds === 0 || seconds === Infinity) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatStatsForDisplay(stats: UserStats): FormattedStats {
  return {
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    totalSolved: stats.totalPuzzlesSolved,
    winRate: calculateWinRate(stats),
    averageTimeEasy: formatTime(calculateAverageTime(stats.easyStats)),
    averageTimeMedium: formatTime(calculateAverageTime(stats.mediumStats)),
    averageTimeHard: formatTime(calculateAverageTime(stats.hardStats)),
    bestTimeEasy: formatTime(stats.easyStats.bestTimeSeconds),
    bestTimeMedium: formatTime(stats.mediumStats.bestTimeSeconds),
    bestTimeHard: formatTime(stats.hardStats.bestTimeSeconds),
  };
}

// Check if user has played today
export async function hasPlayedToday(userId: string): Promise<boolean> {
  try {
    const stats = await getUserStats(userId);
    if (!stats) return false;

    const today = new Date().toISOString().split('T')[0];
    return stats.lastPlayedDate === today;
  } catch (error) {
    console.error('Error checking if played today:', error);
    return false;
  }
}
