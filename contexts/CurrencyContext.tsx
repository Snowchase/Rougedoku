import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  setSelectedFont as setFontSelection,
  setSelectedSong as setSongSelection,
  calculatePuzzleReward,
  checkFirstCompletion,
  CurrencyData,
  PurchaseData,
} from '../services/currencyService';
import {
  getCoinBoost,
  setCoinBoost,
  clearCoinBoost,
  selectRandomDifficulty,
  CoinBoost,
} from '../services/coinBoostService';
import { Difficulty } from '../components/dailyPuzzleGenerator';
// Using real ad service for native builds (Android/iOS)
// Change to '../services/adService.mock' for Expo Go testing
import { adService } from '../services/adService';

interface CurrencyContextType {
  coins: number;
  totalEarned: number;
  totalSpent: number;
  unlockedThemes: string[];
  unlockedAvatars: string[];
  unlockedCellStyles: string[];
  unlockedFonts: string[];
  unlockedSongs: string[];
  selectedFont: string;
  selectedSong: string | null;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
  addBonusCoins: (amount: number) => Promise<void>;
  awardPuzzleCompletion: (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number,
    mistakesCount: number
  ) => Promise<{ total: number; breakdown: { baseReward: number; timeBonus: number; hintPenalty: number; mistakePenalty: number; firstBonus: number; boostBonus: number } }>;
  buyTheme: (themeKey: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyAvatar: (avatar: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyCellStyle: (style: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyFont: (fontId: string, price: number) => Promise<{ success: boolean; message: string }>;
  buySong: (songId: string, price: number) => Promise<{ success: boolean; message: string }>;
  setSelectedFont: (fontId: string) => Promise<void>;
  setSelectedSong: (songId: string | null) => Promise<void>;
  isThemeOwned: (themeKey: string) => boolean;
  isAvatarOwned: (avatar: string) => boolean;
  isCellStyleOwned: (style: string) => boolean;
  isFontOwned: (fontId: string) => boolean;
  isSongOwned: (songId: string) => boolean;
  watchRewardedAd: () => Promise<{ success: boolean; coinsEarned: number; message: string }>;
  isAdReady: () => boolean;
  // Coin boost related
  activeCoinBoost: CoinBoost | null;
  watchCoinBoostAd: () => Promise<{ success: boolean; boostedDifficulty: Difficulty | null; message: string }>;
  hasActiveCoinBoost: (difficulty: Difficulty) => boolean;
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
    selectedFont: 'default',
    selectedSong: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeCoinBoost, setActiveCoinBoost] = useState<CoinBoost | null>(null);

  useEffect(() => {
    loadData();
    loadCoinBoost();
  }, []);

  const loadCoinBoost = async () => {
    try {
      const boost = await getCoinBoost();
      setActiveCoinBoost(boost);
    } catch (error) {
      console.error('Error loading coin boost:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [currency, purchases] = await Promise.all([
        getCurrencyData(),
        getPurchaseData(),
      ]);
      setCurrencyData(currency);
      setPurchaseData(purchases);
    } catch (error) {
      console.error('Error loading currency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrency = useCallback(async () => {
    await loadData();
  }, []);

  const addBonusCoins = useCallback(async (amount: number) => {
    const newData = await addCoins(amount);
    setCurrencyData(newData);
  }, []);

  const awardPuzzleCompletion = useCallback(async (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number,
    mistakesCount: number
  ) => {
    const isFirst = await checkFirstCompletion(date, difficulty);
    const reward = calculatePuzzleReward(difficulty, elapsedTime, hintsUsed, mistakesCount, isFirst);

    // Check if this puzzle has an active boost
    let boostMultiplier = 1.0;
    let boostBonus = 0;
    if (activeCoinBoost && activeCoinBoost.difficulty === difficulty) {
      boostMultiplier = activeCoinBoost.boostMultiplier;
      const boostedTotal = Math.round(reward.total * boostMultiplier);
      boostBonus = boostedTotal - reward.total;

      // Clear boost after use
      await clearCoinBoost();
      setActiveCoinBoost(null);
      console.log(`Coin boost applied! Extra ${boostBonus} coins earned.`);
    }

    const totalWithBoost = reward.total + boostBonus;
    const newData = await addCoins(totalWithBoost);
    setCurrencyData(newData);

    return {
      total: totalWithBoost,
      breakdown: {
        baseReward: reward.baseReward,
        timeBonus: reward.timeBonus,
        hintPenalty: reward.hintPenalty,
        mistakePenalty: reward.mistakePenalty,
        firstBonus: reward.firstBonus,
        boostBonus,
      },
    };
  }, [activeCoinBoost]);

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

  const watchCoinBoostAd = useCallback(async () => {
    // Check if there's already an active boost
    if (activeCoinBoost) {
      return {
        success: false,
        boostedDifficulty: null,
        message: `You already have an active boost for ${activeCoinBoost.difficulty.toUpperCase()} puzzle!`,
      };
    }

    try {
      const rewardEarned = await adService.showRewardedInterstitialAd();
      if (rewardEarned) {
        const randomDifficulty = selectRandomDifficulty();
        const boost = await setCoinBoost(randomDifficulty);
        setActiveCoinBoost(boost);
        return {
          success: true,
          boostedDifficulty: randomDifficulty,
          message: `20% coin boost activated for ${randomDifficulty.toUpperCase()} puzzle!`,
        };
      }
      return {
        success: false,
        boostedDifficulty: null,
        message: 'Ad was dismissed without earning reward.',
      };
    } catch (error) {
      console.error('Error showing coin boost ad:', error);
      return {
        success: false,
        boostedDifficulty: null,
        message: error instanceof Error ? error.message : 'Failed to show ad. Please try again.',
      };
    }
  }, [activeCoinBoost]);

  const hasActiveCoinBoost = useCallback((difficulty: Difficulty) => {
    return activeCoinBoost !== null && activeCoinBoost.difficulty === difficulty;
  }, [activeCoinBoost]);

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
        selectedFont: purchaseData.selectedFont,
        selectedSong: purchaseData.selectedSong,
        loading,
        refreshCurrency,
        addBonusCoins,
        awardPuzzleCompletion,
        buyTheme,
        buyAvatar,
        buyCellStyle,
        buyFont,
        buySong,
        setSelectedFont,
        setSelectedSong,
        isThemeOwned,
        isAvatarOwned,
        isCellStyleOwned,
        isFontOwned,
        isSongOwned,
        watchRewardedAd,
        isAdReady,
        activeCoinBoost,
        watchCoinBoostAd,
        hasActiveCoinBoost,
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
