import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_STORAGE_KEY = 'rougedoku_currency';
const PURCHASES_STORAGE_KEY = 'rougedoku_purchases';

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
  unlockedSoundPacks: string[];
  selectedFont: string;
  selectedSong: string | null;
  selectedSoundPack: string;
}

const defaultCurrencyData: CurrencyData = {
  coins: 50, // Starting coins for new users
  totalEarned: 50,
  totalSpent: 0,
};

const defaultPurchaseData: PurchaseData = {
  unlockedThemes: ['default', 'dark', 'dungeon'], // Default themes are free
  unlockedAvatars: [],
  unlockedCellStyles: ['default'],
  unlockedFonts: ['default'], // Default font is free
  unlockedSongs: [], // No songs unlocked by default (uses default music)
  unlockedSoundPacks: ['default'], // Default sound pack is free
  selectedFont: 'default',
  selectedSong: null, // null means use default music
  selectedSoundPack: 'default',
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

// Sound pack purchase/select functions
export async function purchaseSoundPack(packId: string, price: number): Promise<{ success: boolean; message: string }> {
  const purchases = await getPurchaseData();

  if ((purchases.unlockedSoundPacks ?? ['default']).includes(packId)) {
    return { success: false, message: 'Sound pack already owned' };
  }

  const result = await spendCoins(price);
  if (!result.success) {
    return { success: false, message: 'Not enough coins' };
  }

  purchases.unlockedSoundPacks = [...(purchases.unlockedSoundPacks ?? ['default']), packId];
  await savePurchaseData(purchases);

  return { success: true, message: 'Sound pack unlocked!' };
}

export async function unlockSoundPackFree(packId: string): Promise<void> {
  const purchases = await getPurchaseData();
  const current = purchases.unlockedSoundPacks ?? ['default'];
  if (!current.includes(packId)) {
    purchases.unlockedSoundPacks = [...current, packId];
    await savePurchaseData(purchases);
  }
}

export async function setSelectedSoundPack(packId: string): Promise<void> {
  const purchases = await getPurchaseData();
  purchases.selectedSoundPack = packId;
  await savePurchaseData(purchases);
}

export async function isSoundPackUnlocked(packId: string): Promise<boolean> {
  const purchases = await getPurchaseData();
  return (purchases.unlockedSoundPacks ?? ['default']).includes(packId);
}

// Free-unlock helpers for sudoku pass rewards
export async function unlockThemeFree(themeKey: string): Promise<void> {
  const purchases = await getPurchaseData();
  if (!purchases.unlockedThemes.includes(themeKey)) {
    purchases.unlockedThemes = [...purchases.unlockedThemes, themeKey];
    await savePurchaseData(purchases);
  }
}

export async function unlockAvatarFree(avatarId: string): Promise<void> {
  const purchases = await getPurchaseData();
  if (!purchases.unlockedAvatars.includes(avatarId)) {
    purchases.unlockedAvatars = [...purchases.unlockedAvatars, avatarId];
    await savePurchaseData(purchases);
  }
}

export async function unlockSongFree(songId: string): Promise<void> {
  const purchases = await getPurchaseData();
  if (!purchases.unlockedSongs.includes(songId)) {
    purchases.unlockedSongs = [...purchases.unlockedSongs, songId];
    await savePurchaseData(purchases);
  }
}
