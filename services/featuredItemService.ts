import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeKey } from '../constants/themes';
import { numberFonts, premiumAvatars, premiumSongs } from '../constants/customizations';

const FEATURED_ITEM_KEY = 'sudokle_featured_item';

export type FeaturedItemType = 'theme' | 'font' | 'avatar' | 'song';

export interface FeaturedItem {
  id: string;
  type: FeaturedItemType;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  date: string; // ISO date string (YYYY-MM-DD)
  expiresAt: number; // Timestamp for next midnight
  // Additional display info
  emoji?: string;
  description?: string;
  category?: string;
}

interface StoredFeaturedItem {
  date: string;
  itemId: string;
  itemType: FeaturedItemType;
  discountPercent: number;
}

// Simple hash function for deterministic random based on date
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get today's date string in YYYY-MM-DD format
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get timestamp for next midnight (when the deal expires)
function getNextMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Calculate time remaining until next midnight
export function getTimeRemaining(): { hours: number; minutes: number; seconds: number } {
  const now = Date.now();
  const midnight = getNextMidnight();
  const diff = midnight - now;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

// Get all purchasable items with their metadata
function getAllPurchasableItems(): { id: string; type: FeaturedItemType; name: string; price: number; emoji?: string; description?: string; category?: string }[] {
  const items: { id: string; type: FeaturedItemType; name: string; price: number; emoji?: string; description?: string; category?: string }[] = [];

  // Add themes (exclude free ones)
  Object.entries(themes).forEach(([key, theme]) => {
    if (theme.price > 0) {
      items.push({
        id: key,
        type: 'theme',
        name: theme.name,
        price: theme.price,
        description: theme.description,
      });
    }
  });

  // Add fonts (exclude free ones)
  numberFonts.forEach(font => {
    if (font.price > 0) {
      items.push({
        id: font.id,
        type: 'font',
        name: font.name,
        price: font.price,
        description: font.description,
      });
    }
  });

  // Add avatars
  premiumAvatars.forEach(avatar => {
    items.push({
      id: avatar.id,
      type: 'avatar',
      name: avatar.name,
      price: avatar.price,
      emoji: avatar.emoji,
      category: avatar.category,
    });
  });

  // Add songs
  premiumSongs.forEach(song => {
    items.push({
      id: song.id,
      type: 'song',
      name: song.name,
      price: song.price,
      description: song.description,
      category: song.category,
    });
  });

  return items;
}

// Calculate discount percentage (5-25%) based on date seed
function calculateDailyDiscount(dateSeed: number): number {
  // 5-25% discount range (21 possible values: 5, 6, 7, ... 25)
  return 5 + (dateSeed % 21);
}

// Select item deterministically based on date
function selectDailyItem(dateSeed: number): { id: string; type: FeaturedItemType; name: string; price: number; emoji?: string; description?: string; category?: string } {
  const items = getAllPurchasableItems();
  const index = dateSeed % items.length;
  return items[index];
}

// Get or generate today's featured item
export async function getDailyFeaturedItem(): Promise<FeaturedItem> {
  const todayDate = getTodayDateString();

  try {
    // Check if we already have today's featured item cached
    const stored = await AsyncStorage.getItem(FEATURED_ITEM_KEY);
    if (stored) {
      const storedItem: StoredFeaturedItem = JSON.parse(stored);
      if (storedItem.date === todayDate) {
        // Return cached item with full details
        return buildFeaturedItem(storedItem.itemId, storedItem.itemType, storedItem.discountPercent, todayDate);
      }
    }
  } catch (error) {
    console.error('Error reading featured item cache:', error);
  }

  // Generate new featured item for today
  const dateSeed = hashCode(todayDate);
  const selectedItem = selectDailyItem(dateSeed);
  const discountPercent = calculateDailyDiscount(hashCode(todayDate + '_discount'));

  // Cache the selection
  const storedItem: StoredFeaturedItem = {
    date: todayDate,
    itemId: selectedItem.id,
    itemType: selectedItem.type,
    discountPercent,
  };

  try {
    await AsyncStorage.setItem(FEATURED_ITEM_KEY, JSON.stringify(storedItem));
  } catch (error) {
    console.error('Error caching featured item:', error);
  }

  return buildFeaturedItem(selectedItem.id, selectedItem.type, discountPercent, todayDate);
}

// Build full featured item object from stored data
function buildFeaturedItem(itemId: string, itemType: FeaturedItemType, discountPercent: number, date: string): FeaturedItem {
  let name = '';
  let originalPrice = 0;
  let emoji: string | undefined;
  let description: string | undefined;
  let category: string | undefined;

  switch (itemType) {
    case 'theme':
      const theme = themes[itemId as ThemeKey];
      if (theme) {
        name = theme.name;
        originalPrice = theme.price;
        description = theme.description;
      }
      break;
    case 'font':
      const font = numberFonts.find(f => f.id === itemId);
      if (font) {
        name = font.name;
        originalPrice = font.price;
        description = font.description;
      }
      break;
    case 'avatar':
      const avatar = premiumAvatars.find(a => a.id === itemId);
      if (avatar) {
        name = avatar.name;
        originalPrice = avatar.price;
        emoji = avatar.emoji;
        category = avatar.category;
      }
      break;
    case 'song':
      const song = premiumSongs.find(s => s.id === itemId);
      if (song) {
        name = song.name;
        originalPrice = song.price;
        description = song.description;
        category = song.category;
      }
      break;
  }

  // Calculate discounted price and round to nearest 5
  const rawDiscountedPrice = originalPrice * (1 - discountPercent / 100);
  const discountedPrice = Math.round(rawDiscountedPrice / 5) * 5;

  return {
    id: itemId,
    type: itemType,
    name,
    originalPrice,
    discountedPrice,
    discountPercent,
    date,
    expiresAt: getNextMidnight(),
    emoji,
    description,
    category,
  };
}

// Check if an item is today's featured item
export async function isFeaturedItem(itemId: string, itemType: FeaturedItemType): Promise<boolean> {
  const featured = await getDailyFeaturedItem();
  return featured.id === itemId && featured.type === itemType;
}

// Get the featured price for an item (returns null if not featured)
export async function getFeaturedPrice(itemId: string, itemType: FeaturedItemType): Promise<number | null> {
  const featured = await getDailyFeaturedItem();
  if (featured.id === itemId && featured.type === itemType) {
    return featured.discountedPrice;
  }
  return null;
}

// Get type icon for display
export function getFeaturedTypeIcon(type: FeaturedItemType): string {
  switch (type) {
    case 'theme': return '🎨';
    case 'font': return '🔤';
    case 'avatar': return '😀';
    case 'song': return '🎵';
    default: return '✨';
  }
}

// Get type label for display
export function getFeaturedTypeLabel(type: FeaturedItemType): string {
  switch (type) {
    case 'theme': return 'Theme';
    case 'font': return 'Font';
    case 'avatar': return 'Avatar';
    case 'song': return 'Music';
    default: return 'Item';
  }
}
