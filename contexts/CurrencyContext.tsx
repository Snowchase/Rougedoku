import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrencyData,
  getPurchaseData,
  addCoins,
  spendCoins,
  purchaseTheme,
  purchaseAvatar,
  purchaseCellStyle,
  purchaseFont,
  purchaseSong,
  purchaseSoundPack as purchaseSoundPackService,
  unlockSoundPackFree as unlockSoundPackFreeService,
  setSelectedSoundPack as setSoundPackSelection,
  unlockThemeFree as unlockThemeFreeService,
  unlockAvatarFree as unlockAvatarFreeService,
  unlockSongFree as unlockSongFreeService,
  setSelectedFont as setFontSelection,
  setSelectedSong as setSongSelection,
  calculatePuzzleReward,
  checkFirstCompletion,
  CurrencyData,
  PurchaseData,
} from '../services/currencyService';
import { Difficulty } from '../components/dailyPuzzleGenerator';
import { audioManager } from '../services/audioManager';
import {
  loadSudokuPassData,
  saveSudokuPassData,
  getNewlyCompletedTiers,
  SUDOKU_PASS_TIERS,
  MAX_XP,
} from '../services/sudokuPassService';
// Using real ad service for native builds (Android/iOS)
// Change to '../services/adService.mock' for Expo Go testing
import { adService } from '../services/adService';
import {
  submitReferralCode,
  getReferralStats,
  ReferralResult,
  ReferralStats,
} from '../services/referralService';
import { auth } from '../components/firebaseConfig';

const REFERRAL_COINS_GRANTED_KEY = 'sudokle_referral_coins_granted';

interface CurrencyContextType {
  coins: number;
  totalEarned: number;
  totalSpent: number;
  unlockedThemes: string[];
  unlockedAvatars: string[];
  unlockedCellStyles: string[];
  unlockedFonts: string[];
  unlockedSongs: string[];
  unlockedSoundPacks: string[];
  selectedFont: string;
  selectedSong: string | null;
  selectedSoundPack: string;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
  addBonusCoins: (amount: number) => Promise<void>;
  awardPuzzleCompletion: (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number,
    mistakesCount: number
  ) => Promise<{ total: number; breakdown: { baseReward: number; timeBonus: number; hintPenalty: number; mistakePenalty: number; firstBonus: number } }>;
  buyTheme: (themeKey: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyAvatar: (avatar: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyCellStyle: (style: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyFont: (fontId: string, price: number) => Promise<{ success: boolean; message: string }>;
  buySong: (songId: string, price: number) => Promise<{ success: boolean; message: string }>;
  buySoundPack: (packId: string, price: number) => Promise<{ success: boolean; message: string }>;
  setSelectedFont: (fontId: string) => Promise<void>;
  setSelectedSong: (songId: string | null) => Promise<void>;
  setSelectedSoundPack: (packId: string) => Promise<void>;
  isThemeOwned: (themeKey: string) => boolean;
  isAvatarOwned: (avatar: string) => boolean;
  isCellStyleOwned: (style: string) => boolean;
  isFontOwned: (fontId: string) => boolean;
  isSongOwned: (songId: string) => boolean;
  isSoundPackOwned: (packId: string) => boolean;
  // Sudoku pass free-unlock methods
  unlockThemeFree: (themeKey: string) => Promise<void>;
  unlockAvatarFree: (avatarId: string) => Promise<void>;
  unlockSongFree: (songId: string) => Promise<void>;
  unlockSoundPackFree: (packId: string) => Promise<void>;
  watchRewardedAd: () => Promise<{ success: boolean; coinsEarned: number; message: string }>;
  isAdReady: () => boolean;
  showBoostAd: () => Promise<boolean>;
  awardBoostBonus: (amount: number) => Promise<void>;
  applyReferralCode: (code: string) => Promise<ReferralResult>;
  referralStats: ReferralStats | null;
  refreshReferralStats: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyData, setCurrencyData] = useState<CurrencyData>({
    coins: 0,
    totalEarned: 0,
    totalSpent: 0,
  });
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    unlockedThemes: ['default', 'dark'],
    unlockedAvatars: [],
    unlockedCellStyles: ['default'],
    unlockedFonts: ['default'],
    unlockedSongs: [],
    unlockedSoundPacks: ['default'],
    selectedFont: 'default',
    selectedSong: null,
    selectedSoundPack: 'default',
  });
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currency, purchases] = await Promise.all([
        getCurrencyData(),
        getPurchaseData(),
      ]);
      setCurrencyData(currency);
      setPurchaseData(purchases);
      // Keep audioManager in sync with selected sound pack
      audioManager.setActiveSoundPack(purchases.selectedSoundPack ?? 'default');
      // Claim any pending referral coins the user earned as a referrer
      await claimPendingReferralCoins();
    } catch (error) {
      console.error('Error loading currency data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync referrer coin grants from Firestore to local storage.
   * When someone uses this user's referral code, their referralCoinsEarned
   * is incremented in Firestore. On the next launch we detect the delta and
   * grant the difference locally.
   */
  const claimPendingReferralCoins = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const stats = await getReferralStats(user.uid);
      const firestoreTotal = stats.referralCoinsEarned;

      const grantedStr = await AsyncStorage.getItem(REFERRAL_COINS_GRANTED_KEY);
      const alreadyGranted = grantedStr ? parseInt(grantedStr, 10) : 0;

      const pending = firestoreTotal - alreadyGranted;
      if (pending > 0) {
        const newData = await addCoins(pending);
        setCurrencyData(newData);
        await AsyncStorage.setItem(REFERRAL_COINS_GRANTED_KEY, String(firestoreTotal));
      }

      setReferralStats(stats);
    } catch (error) {
      console.error('Error claiming pending referral coins:', error);
    }
  };

  const refreshReferralStats = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const stats = await getReferralStats(user.uid);
      setReferralStats(stats);
    } catch (error) {
      console.error('Error refreshing referral stats:', error);
    }
  }, []);

  const applyReferralCode = useCallback(async (code: string): Promise<ReferralResult> => {
    const result = await submitReferralCode(code);
    if (result.success && result.coinsEarned) {
      // Award coins to the referee immediately
      const newData = await addCoins(result.coinsEarned);
      setCurrencyData(newData);
      // Refresh referral stats to reflect hasBeenReferred = true
      await refreshReferralStats();
    }
    return result;
  }, [refreshReferralStats]);

  const refreshCurrency = useCallback(async () => {
    await loadData();
  }, []);

  const addBonusCoins = useCallback(async (amount: number) => {
    const newData = await addCoins(amount);
    setCurrencyData(newData);
  }, []);

  const SUDOKU_PASS_XP: Record<Difficulty, number> = {
    easy: 10, medium: 25, hard: 50, expert: 100,
  };

  const awardPuzzleCompletion = useCallback(async (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number,
    mistakesCount: number
  ) => {
    const isFirst = await checkFirstCompletion(date, difficulty);
    const reward = calculatePuzzleReward(difficulty, elapsedTime, hintsUsed, mistakesCount, isFirst);

    const newData = await addCoins(reward.total);
    setCurrencyData(newData);

    // Award sudoku pass XP and grant any newly unlocked tier rewards
    try {
      const bpData = await loadSudokuPassData();
      const oldXP = bpData.currentXP;
      const xpGain = SUDOKU_PASS_XP[difficulty];
      const newXP = Math.min(oldXP + xpGain, MAX_XP);
      const newTiers = getNewlyCompletedTiers(oldXP, newXP);

      for (const tierNum of newTiers) {
        if (!bpData.claimedTiers.includes(tierNum)) {
          const tierDef = SUDOKU_PASS_TIERS.find(t => t.tier === tierNum);
          if (tierDef) {
            const r = tierDef.reward;
            if (r.type === 'coins') await addCoins(parseInt(r.id, 10));
            else if (r.type === 'avatar') await unlockAvatarFreeService(r.id);
            else if (r.type === 'song') await unlockSongFreeService(r.id);
            else if (r.type === 'theme') await unlockThemeFreeService(r.id);
            else if (r.type === 'soundPack') await unlockSoundPackFreeService(r.id);
            bpData.claimedTiers.push(tierNum);
          }
        }
      }

      bpData.currentXP = newXP;
      await saveSudokuPassData(bpData);
      // Reload currency to reflect any coin grants from tiers
      if (newTiers.length > 0) {
        const refreshed = await getCurrencyData();
        setCurrencyData(refreshed);
      }
    } catch (e) {
      console.error('Error awarding sudoku pass XP:', e);
    }

    return {
      total: reward.total,
      breakdown: {
        baseReward: reward.baseReward,
        timeBonus: reward.timeBonus,
        hintPenalty: reward.hintPenalty,
        mistakePenalty: reward.mistakePenalty,
        firstBonus: reward.firstBonus,
      },
    };
  }, []);

  const buyTheme = useCallback(async (themeKey: string, price: number) => {
    const result = await purchaseTheme(themeKey, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const buyAvatar = useCallback(async (avatar: string, price: number) => {
    const result = await purchaseAvatar(avatar, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const buyCellStyle = useCallback(async (style: string, price: number) => {
    const result = await purchaseCellStyle(style, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const buyFont = useCallback(async (fontId: string, price: number) => {
    const result = await purchaseFont(fontId, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const setSelectedFont = useCallback(async (fontId: string) => {
    await setFontSelection(fontId);
    await loadData();
  }, []);

  const buySong = useCallback(async (songId: string, price: number) => {
    const result = await purchaseSong(songId, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const setSelectedSong = useCallback(async (songId: string | null) => {
    await setSongSelection(songId);
    await loadData();
  }, []);

  const buySoundPack = useCallback(async (packId: string, price: number) => {
    const result = await purchaseSoundPackService(packId, price);
    if (result.success) {
      await loadData();
    }
    return result;
  }, []);

  const setSelectedSoundPack = useCallback(async (packId: string) => {
    await setSoundPackSelection(packId);
    audioManager.setActiveSoundPack(packId);
    await loadData();
  }, []);

  const unlockThemeFree = useCallback(async (themeKey: string) => {
    await unlockThemeFreeService(themeKey);
    await loadData();
  }, []);

  const unlockAvatarFree = useCallback(async (avatarId: string) => {
    await unlockAvatarFreeService(avatarId);
    await loadData();
  }, []);

  const unlockSongFree = useCallback(async (songId: string) => {
    await unlockSongFreeService(songId);
    await loadData();
  }, []);

  const unlockSoundPackFree = useCallback(async (packId: string) => {
    await unlockSoundPackFreeService(packId);
    await loadData();
  }, []);

  const isThemeOwned = useCallback((themeKey: string) => {
    return purchaseData.unlockedThemes.includes(themeKey);
  }, [purchaseData.unlockedThemes]);

  const isAvatarOwned = useCallback((avatar: string) => {
    return purchaseData.unlockedAvatars.includes(avatar);
  }, [purchaseData.unlockedAvatars]);

  const isCellStyleOwned = useCallback((style: string) => {
    return purchaseData.unlockedCellStyles.includes(style);
  }, [purchaseData.unlockedCellStyles]);

  const isFontOwned = useCallback((fontId: string) => {
    return purchaseData.unlockedFonts.includes(fontId);
  }, [purchaseData.unlockedFonts]);

  const isSongOwned = useCallback((songId: string) => {
    return purchaseData.unlockedSongs.includes(songId);
  }, [purchaseData.unlockedSongs]);

  const isSoundPackOwned = useCallback((packId: string) => {
    return (purchaseData.unlockedSoundPacks ?? ['default']).includes(packId);
  }, [purchaseData.unlockedSoundPacks]);

  const watchRewardedAd = useCallback(async () => {
    try {
      const coinsEarned = await adService.showRewardedAd();
      const newData = await addCoins(coinsEarned);
      setCurrencyData(newData);
      return {
        success: true,
        coinsEarned,
        message: `You earned ${coinsEarned} coins!`,
      };
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return {
        success: false,
        coinsEarned: 0,
        message: error instanceof Error ? error.message : 'Failed to show ad. Please try again.',
      };
    }
  }, []);

  const isAdReady = useCallback(() => {
    return adService.isRewardedAdReady();
  }, []);

  /**
   * Show a rewarded interstitial ad for the coin boost feature.
   * Returns true if the user watched the ad and earned the reward.
   */
  const showBoostAd = useCallback(async (): Promise<boolean> => {
    try {
      return await adService.showRewardedInterstitialAd();
    } catch (error) {
      console.error('Error showing boost ad:', error);
      return false;
    }
  }, []);

  /**
   * Award bonus coins from the boost ad (called after user watches the ad).
   */
  const awardBoostBonus = useCallback(async (amount: number) => {
    const newData = await addCoins(amount);
    setCurrencyData(newData);
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        coins: currencyData.coins,
        totalEarned: currencyData.totalEarned,
        totalSpent: currencyData.totalSpent,
        unlockedThemes: purchaseData.unlockedThemes,
        unlockedAvatars: purchaseData.unlockedAvatars,
        unlockedCellStyles: purchaseData.unlockedCellStyles,
        unlockedFonts: purchaseData.unlockedFonts,
        unlockedSongs: purchaseData.unlockedSongs,
        unlockedSoundPacks: purchaseData.unlockedSoundPacks ?? ['default'],
        selectedFont: purchaseData.selectedFont,
        selectedSong: purchaseData.selectedSong,
        selectedSoundPack: purchaseData.selectedSoundPack ?? 'default',
        loading,
        refreshCurrency,
        addBonusCoins,
        awardPuzzleCompletion,
        buyTheme,
        buyAvatar,
        buyCellStyle,
        buyFont,
        buySong,
        buySoundPack,
        setSelectedFont,
        setSelectedSong,
        setSelectedSoundPack,
        isThemeOwned,
        isAvatarOwned,
        isCellStyleOwned,
        isFontOwned,
        isSongOwned,
        isSoundPackOwned,
        unlockThemeFree,
        unlockAvatarFree,
        unlockSongFree,
        unlockSoundPackFree,
        watchRewardedAd,
        isAdReady,
        showBoostAd,
        awardBoostBonus,
        applyReferralCode,
        referralStats,
        refreshReferralStats,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
