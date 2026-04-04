import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SudokuPassData,
  TierReward,
  SUDOKU_PASS_TIERS,
  loadSudokuPassData,
  saveSudokuPassData,
  computeCurrentTier,
  computeTierProgress,
  getNewlyCompletedTiers,
  addOneMonth,
  MAX_XP,
} from '../services/sudokuPassService';
import { useCurrency } from './CurrencyContext';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const SUDOKU_PASS_XP_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
};

interface SudokuPassContextType {
  sudokuPassData: SudokuPassData;
  isLoading: boolean;
  currentTier: number;
  tierProgress: number; // 0.0–1.0 within the current incomplete tier
  seasonEndDate: string; // ISO date string
  addXP: (amount: number) => Promise<TierReward[]>;
  addXPForDifficulty: (difficulty: Difficulty) => Promise<TierReward[]>;
  refreshSudokuPass: () => Promise<void>;
}

const SudokuPassContext = createContext<SudokuPassContextType | undefined>(undefined);

export function SudokuPassProvider({ children }: { children: ReactNode }) {
  const [sudokuPassData, setSudokuPassData] = useState<SudokuPassData>({
    season: 1,
    seasonStartDate: new Date().toISOString().slice(0, 10),
    currentXP: 0,
    claimedTiers: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const {
    unlockThemeFree,
    unlockAvatarFree,
    unlockSongFree,
    unlockSoundPackFree,
    addBonusCoins,
  } = useCurrency();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await loadSudokuPassData();
      setSudokuPassData(data);
    } catch (error) {
      console.error('Error loading sudoku pass data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSudokuPass = useCallback(async () => {
    await loadData();
  }, []);

  const grantReward = useCallback(async (reward: TierReward) => {
    switch (reward.type) {
      case 'coins':
        await addBonusCoins(parseInt(reward.id, 10));
        break;
      case 'avatar':
        await unlockAvatarFree(reward.id);
        break;
      case 'song':
        await unlockSongFree(reward.id);
        break;
      case 'theme':
        await unlockThemeFree(reward.id);
        break;
      case 'soundPack':
        await unlockSoundPackFree(reward.id);
        break;
    }
  }, [addBonusCoins, unlockAvatarFree, unlockSongFree, unlockThemeFree, unlockSoundPackFree]);

  const addXP = useCallback(async (amount: number): Promise<TierReward[]> => {
    const current = await loadSudokuPassData();
    const oldXP = current.currentXP;
    const newXP = Math.min(oldXP + amount, MAX_XP);

    const newlyCompletedTierNumbers = getNewlyCompletedTiers(oldXP, newXP);
    const earnedRewards: TierReward[] = [];

    for (const tierNum of newlyCompletedTierNumbers) {
      if (!current.claimedTiers.includes(tierNum)) {
        const tierDef = SUDOKU_PASS_TIERS.find(t => t.tier === tierNum);
        if (tierDef) {
          await grantReward(tierDef.reward);
          earnedRewards.push(tierDef.reward);
          current.claimedTiers.push(tierNum);
        }
      }
    }

    current.currentXP = newXP;
    await saveSudokuPassData(current);
    setSudokuPassData({ ...current });

    return earnedRewards;
  }, [grantReward]);

  const addXPForDifficulty = useCallback(async (difficulty: Difficulty): Promise<TierReward[]> => {
    const xp = SUDOKU_PASS_XP_PER_DIFFICULTY[difficulty];
    return addXP(xp);
  }, [addXP]);

  const currentTier = computeCurrentTier(sudokuPassData.currentXP);
  const tierProgress = computeTierProgress(sudokuPassData.currentXP);
  const seasonEndDate = addOneMonth(sudokuPassData.seasonStartDate);

  return (
    <SudokuPassContext.Provider value={{
      sudokuPassData,
      isLoading,
      currentTier,
      tierProgress,
      seasonEndDate,
      addXP,
      addXPForDifficulty,
      refreshSudokuPass,
    }}>
      {children}
    </SudokuPassContext.Provider>
  );
}

export function useSudokuPass() {
  const context = useContext(SudokuPassContext);
  if (!context) {
    throw new Error('useSudokuPass must be used within a SudokuPassProvider');
  }
  return context;
}
