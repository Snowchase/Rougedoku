import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from '../components/dailyPuzzleGenerator';

const CURRENCY_STORAGE_KEY = 'sudokle_currency';
const PURCHASES_STORAGE_KEY = 'sudokle_purchases';

export interface CurrencyData {
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

export interface PurchaseData {
  unlockedThemes: string[];
  unlockedAvatars: string[];
  unlockedCellStyles: string[];
  unlockedFonts: string[];
  unlockedSongs: string[];
  selectedFont: string;
  selectedSong: string | null;
}

// Coin rewards based on difficulty
const DIFFICULTY_BASE_REWARDS: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
  expert: 100,
};

// Time bonus thresholds (in seconds) for extra coins
const TIME_BONUSES: { threshold: number; bonus: number }[] = [
  { threshold: 180, bonus: 50 },   // Under 3 minutes
  { threshold: 300, bonus: 30 },   // Under 5 minutes
  { threshold: 600, bonus: 15 },   // Under 10 minutes
  { threshold: 900, bonus: 5 },    // Under 15 minutes
];

// Hint penalty (coins deducted per hint used)
const HINT_PENALTY = 5;

// First completion bonus for each difficulty
const FIRST_COMPLETION_BONUS = 50;

// Daily streak bonuses
const STREAK_BONUSES: { days: number; bonus: number }[] = [
  { days: 7, bonus: 100 },
  { days: 30, bonus: 500 },
  { days: 100, bonus: 2000 },
];

const defaultCurrencyData: CurrencyData = {
  coins: 50, // Starting coins for new users
  totalEarned: 50,
  totalSpent: 0,
};

const defaultPurchaseData: PurchaseData = {
  unlockedThemes: ['default', 'dark'], // Default themes are free
  unlockedAvatars: [],
  unlockedCellStyles: ['default'],
  unlockedFonts: ['default'], // Default font is free
  unlockedSongs: [], // No songs unlocked by default (uses default music)
  selectedFont: 'default',
  selectedSong: null, // null means use default music
};

export async function getCurrencyData(): Promise<CurrencyData> {
  try {
    const data = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    if (data) {
      return { ...defaultCurrencyData, ...JSON.parse(data) };
    }
    // Initialize with default data
    await saveCurrencyData(defaultCurrencyData);
    return defaultCurrencyData;
  } catch (error) {
    console.error('Error loading currency data:', error);
    return defaultCurrencyData;
  }
}

export async function saveCurrencyData(data: CurrencyData): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving currency data:', error);
  }
}

export async function getPurchaseData(): Promise<PurchaseData> {
  try {
    const data = await AsyncStorage.getItem(PURCHASES_STORAGE_KEY);
    if (data) {
      return { ...defaultPurchaseData, ...JSON.parse(data) };
    }
    await savePurchaseData(defaultPurchaseData);
    return defaultPurchaseData;
  } catch (error) {
    console.error('Error loading purchase data:', error);
    return defaultPurchaseData;
  }
}

export async function savePurchaseData(data: PurchaseData): Promise<void> {
  try {
    await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving purchase data:', error);
  }
}

export function calculatePuzzleReward(
  difficulty: Difficulty,
  elapsedTime: number,
  hintsUsed: number,
  isFirstCompletion: boolean = false
): { baseReward: number; timeBonus: number; hintPenalty: number; firstBonus: number; total: number } {
  const baseReward = DIFFICULTY_BASE_REWARDS[difficulty];

  // Calculate time bonus
  let timeBonus = 0;
  for (const { threshold, bonus } of TIME_BONUSES) {
    if (elapsedTime <= threshold) {
      timeBonus = bonus;
      break;
    }
  }

  // Calculate hint penalty
  const hintPenalty = hintsUsed * HINT_PENALTY;

  // First completion bonus
  const firstBonus = isFirstCompletion ? FIRST_COMPLETION_BONUS : 0;

  // Calculate total (minimum 1 coin)
  const total = Math.max(1, baseReward + timeBonus - hintPenalty + firstBonus);

  return {
    baseReward,
    timeBonus,
    hintPenalty,
    firstBonus,
    total,
  };
}

export async function addCoins(amount: number): Promise<CurrencyData> {
  const data = await getCurrencyData();
  data.coins += amount;
  data.totalEarned += amount;
  await saveCurrencyData(data);
  return data;
}

export async function spendCoins(amount: number): Promise<{ success: boolean; data: CurrencyData }> {
  const data = await getCurrencyData();
  if (data.coins < amount) {
    return { success: false, data };
  }
  data.coins -= amount;
  data.totalSpent += amount;
  await saveCurrencyData(data);
  return { success: true, data };
}

export async function purchaseTheme(themeKey: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  // Check if already owned
  if (purchases.unlockedThemes.includes(themeKey)) {
    return { success: false, message: 'Theme already owned' };
  }

  // Try to spend coins
  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  // Add theme to unlocked list
  purchases.unlockedThemes.push(themeKey);
  await savePurchaseData(purchases);

  return { success: true, message: 'Theme unlocked!' };
}

export async function purchaseAvatar(avatar: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  if (purchases.unlockedAvatars.includes(avatar)) {
    return { success: false, message: 'Avatar already owned' };
  }

  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  purchases.unlockedAvatars.push(avatar);
  await savePurchaseData(purchases);

  return { success: true, message: 'Avatar unlocked!' };
}

export async function purchaseCellStyle(style: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  if (purchases.unlockedCellStyles.includes(style)) {
    return { success: false, message: 'Cell style already owned' };
  }

  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  purchases.unlockedCellStyles.push(style);
  await savePurchaseData(purchases);

  return { success: true, message: 'Cell style unlocked!' };
}

export async function isThemeUnlocked(themeKey: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  return purchases.unlockedThemes.includes(themeKey);
}

export async function isAvatarUnlocked(avatar: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  // Basic avatars (emojis from the default set) are free
  return purchases.unlockedAvatars.includes(avatar);
}

export async function isCellStyleUnlocked(style: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  return purchases.unlockedCellStyles.includes(style);
}

export async function purchaseFont(fontId: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  if (purchases.unlockedFonts.includes(fontId)) {
    return { success: false, message: 'Font already owned' };
  }

  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  purchases.unlockedFonts.push(fontId);
  await savePurchaseData(purchases);

  return { success: true, message: 'Font unlocked!' };
}

export async function setSelectedFont(fontId: string): Promise<void> {
  const purchases = await getPurchaseData();
  purchases.selectedFont = fontId;
  await savePurchaseData(purchases);
}

export async function isFontUnlocked(fontId: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  return purchases.unlockedFonts.includes(fontId);
}

export async function getSelectedFont(): Promise<string> {
  const purchases = await getPurchaseData();
  return purchases.selectedFont || 'default';
}

// Check if this is the first time completing a specific puzzle
export async function checkFirstCompletion(date: string, difficulty: Difficulty): Promise<boolean> {
  const key = `sudokle_first_completion_${date}_${difficulty}`;
  try {
    const completed = await AsyncStorage.getItem(key);
    if (!completed) {
      await AsyncStorage.setItem(key, 'true');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Song purchase functions
export async function purchaseSong(songId: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  if (purchases.unlockedSongs.includes(songId)) {
    return { success: false, message: 'Song already owned' };
  }

  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  purchases.unlockedSongs.push(songId);
  await savePurchaseData(purchases);

  return { success: true, message: 'Song unlocked!' };
}

export async function setSelectedSong(songId: string | null): Promise<void> {
  const purchases = await getPurchaseData();
  purchases.selectedSong = songId;
  await savePurchaseData(purchases);
}

export async function isSongUnlocked(songId: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  return purchases.unlockedSongs.includes(songId);
}

export async function getSelectedSong(): Promise<string | null> {
  const purchases = await getPurchaseData();
  return purchases.selectedSong;
}
