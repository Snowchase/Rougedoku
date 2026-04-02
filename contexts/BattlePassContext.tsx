import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  BattlePassData,
  TierReward,
  BATTLE_PASS_TIERS,
  loadBattlePassData,
  saveBattlePassData,
  computeCurrentTier,
  computeTierProgress,
  getNewlyCompletedTiers,
  MAX_XP,
} from '../services/battlePassService';
import { useCurrency } from './CurrencyContext';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const BATTLE_PASS_XP_PER_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
};

interface BattlePassContextType {
  battlePassData: BattlePassData;
  isLoading: boolean;
  currentTier: number;
  tierProgress: number; // 0.0–1.0 within the current incomplete tier
  addXP: (amount: number) => Promise<TierReward[]>;
  addXPForDifficulty: (difficulty: Difficulty) => Promise<TierReward[]>;
  refreshBattlePass: () => Promise<void>;
}

const BattlePassContext = createContext<BattlePassContextType | undefined>(undefined);

export function BattlePassProvider({ children }: { children: ReactNode }) {
  const [battlePassData, setBattlePassData] = useState<BattlePassData>({
    season: 1,
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
      const data = await loadBattlePassData();
      setBattlePassData(data);
    } catch (error) {
      console.error('Error loading battle pass data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBattlePass = useCallback(async () => {
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
    const current = await loadBattlePassData();
    const oldXP = current.currentXP;
    const newXP = Math.min(oldXP + amount, MAX_XP);

    const newlyCompletedTierNumbers = getNewlyCompletedTiers(oldXP, newXP);
    const earnedRewards: TierReward[] = [];

    for (const tierNum of newlyCompletedTierNumbers) {
      if (!current.claimedTiers.includes(tierNum)) {
        const tierDef = BATTLE_PASS_TIERS.find(t => t.tier === tierNum);
        if (tierDef) {
          await grantReward(tierDef.reward);
          earnedRewards.push(tierDef.reward);
          current.claimedTiers.push(tierNum);
        }
      }
    }

    current.currentXP = newXP;
    await saveBattlePassData(current);
    setBattlePassData({ ...current });

    return earnedRewards;
  }, [grantReward]);

  const addXPForDifficulty = useCallback(async (difficulty: Difficulty): Promise<TierReward[]> => {
    const xp = BATTLE_PASS_XP_PER_DIFFICULTY[difficulty];
    return addXP(xp);
  }, [addXP]);

  const currentTier = computeCurrentTier(battlePassData.currentXP);
  const tierProgress = computeTierProgress(battlePassData.currentXP);

  return (
    <BattlePassContext.Provider value={{
      battlePassData,
      isLoading,
      currentTier,
      tierProgress,
      addXP,
      addXPForDifficulty,
      refreshBattlePass,
    }}>
      {children}
    </BattlePassContext.Provider>
  );
}

export function useBattlePass() {
  const context = useContext(BattlePassContext);
  if (!context) {
    throw new Error('useBattlePass must be used within a BattlePassProvider');
  }
  return context;
}
