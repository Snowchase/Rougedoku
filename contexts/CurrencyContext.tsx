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
  setSelectedFont as setFontSelection,
  calculatePuzzleReward,
  checkFirstCompletion,
  CurrencyData,
  PurchaseData,
} from '../services/currencyService';
import { Difficulty } from '../components/dailyPuzzleGenerator';

interface CurrencyContextType {
  coins: number;
  totalEarned: number;
  totalSpent: number;
  unlockedThemes: string[];
  unlockedAvatars: string[];
  unlockedCellStyles: string[];
  unlockedFonts: string[];
  selectedFont: string;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
  awardPuzzleCompletion: (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number
  ) => Promise<{ total: number; breakdown: { baseReward: number; timeBonus: number; hintPenalty: number; firstBonus: number } }>;
  buyTheme: (themeKey: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyAvatar: (avatar: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyCellStyle: (style: string, price: number) => Promise<{ success: boolean; message: string }>;
  buyFont: (fontId: string, price: number) => Promise<{ success: boolean; message: string }>;
  setSelectedFont: (fontId: string) => Promise<void>;
  isThemeOwned: (themeKey: string) => boolean;
  isAvatarOwned: (avatar: string) => boolean;
  isCellStyleOwned: (style: string) => boolean;
  isFontOwned: (fontId: string) => boolean;
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
    selectedFont: 'default',
  });
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error loading currency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrency = useCallback(async () => {
    await loadData();
  }, []);

  const awardPuzzleCompletion = useCallback(async (
    date: string,
    difficulty: Difficulty,
    elapsedTime: number,
    hintsUsed: number
  ) => {
    const isFirst = await checkFirstCompletion(date, difficulty);
    const reward = calculatePuzzleReward(difficulty, elapsedTime, hintsUsed, isFirst);

    const newData = await addCoins(reward.total);
    setCurrencyData(newData);

    return {
      total: reward.total,
      breakdown: {
        baseReward: reward.baseReward,
        timeBonus: reward.timeBonus,
        hintPenalty: reward.hintPenalty,
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
        selectedFont: purchaseData.selectedFont,
        loading,
        refreshCurrency,
        awardPuzzleCompletion,
        buyTheme,
        buyAvatar,
        buyCellStyle,
        buyFont,
        setSelectedFont,
        isThemeOwned,
        isAvatarOwned,
        isCellStyleOwned,
        isFontOwned,
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
