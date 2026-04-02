import AsyncStorage from '@react-native-async-storage/async-storage';

const BATTLE_PASS_STORAGE_KEY = 'sudokle_battle_pass';
const XP_PER_TIER = 150;
const TOTAL_TIERS = 30;

export interface TierReward {
  type: 'avatar' | 'song' | 'theme' | 'soundPack' | 'coins';
  id: string;     // item id, or coin amount as string for 'coins' type
  label: string;
  emoji: string;
}

export interface BattlePassTier {
  tier: number;        // 1–30
  xpRequired: number;  // cumulative XP threshold
  reward: TierReward;
}

export interface BattlePassData {
  season: number;
  currentXP: number;
  claimedTiers: number[];
}

export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  { tier: 1,  xpRequired: 150,  reward: { type: 'coins',     id: '50',                label: '50 Coins',         emoji: '🪙' } },
  { tier: 2,  xpRequired: 300,  reward: { type: 'avatar',    id: 'astronaut',          label: 'Astronaut',        emoji: '🧑‍🚀' } },
  { tier: 3,  xpRequired: 450,  reward: { type: 'coins',     id: '75',                label: '75 Coins',         emoji: '🪙' } },
  { tier: 4,  xpRequired: 600,  reward: { type: 'song',      id: 'lofi-chill',        label: 'Chill Beats',      emoji: '🎧' } },
  { tier: 5,  xpRequired: 750,  reward: { type: 'theme',     id: 'midnight',          label: 'Midnight Blue',    emoji: '🌙' } },
  { tier: 6,  xpRequired: 900,  reward: { type: 'coins',     id: '100',               label: '100 Coins',        emoji: '🪙' } },
  { tier: 7,  xpRequired: 1050, reward: { type: 'avatar',    id: 'robot',             label: 'Robot',            emoji: '🤖' } },
  { tier: 8,  xpRequired: 1200, reward: { type: 'coins',     id: '75',                label: '75 Coins',         emoji: '🪙' } },
  { tier: 9,  xpRequired: 1350, reward: { type: 'song',      id: 'electronic-zen',   label: 'Digital Zen',      emoji: '🎹' } },
  { tier: 10, xpRequired: 1500, reward: { type: 'soundPack', id: 'minimal',           label: 'Minimal Pack',     emoji: '✨' } },
  { tier: 11, xpRequired: 1650, reward: { type: 'coins',     id: '100',               label: '100 Coins',        emoji: '🪙' } },
  { tier: 12, xpRequired: 1800, reward: { type: 'avatar',    id: 'dragon',            label: 'Dragon',           emoji: '🐉' } },
  { tier: 13, xpRequired: 1950, reward: { type: 'coins',     id: '125',               label: '125 Coins',        emoji: '🪙' } },
  { tier: 14, xpRequired: 2100, reward: { type: 'theme',     id: 'forest',            label: 'Forest Green',     emoji: '🌿' } },
  { tier: 15, xpRequired: 2250, reward: { type: 'song',      id: 'jazz-piano',        label: 'Piano Lounge',     emoji: '🎷' } },
  { tier: 16, xpRequired: 2400, reward: { type: 'coins',     id: '150',               label: '150 Coins',        emoji: '🪙' } },
  { tier: 17, xpRequired: 2550, reward: { type: 'avatar',    id: 'phoenix',           label: 'Eagle',            emoji: '🦅' } },
  { tier: 18, xpRequired: 2700, reward: { type: 'coins',     id: '100',               label: '100 Coins',        emoji: '🪙' } },
  { tier: 19, xpRequired: 2850, reward: { type: 'theme',     id: 'sunset',            label: 'Sunset Orange',    emoji: '🌅' } },
  { tier: 20, xpRequired: 3000, reward: { type: 'song',      id: 'electronic-space', label: 'Space Journey',    emoji: '🚀' } },
  { tier: 21, xpRequired: 3150, reward: { type: 'coins',     id: '200',               label: '200 Coins',        emoji: '🪙' } },
  { tier: 22, xpRequired: 3300, reward: { type: 'soundPack', id: 'synthwave',         label: 'Synthwave Pack',   emoji: '🌆' } },
  { tier: 23, xpRequired: 3450, reward: { type: 'avatar',    id: 'gem',               label: 'Diamond',          emoji: '💎' } },
  { tier: 24, xpRequired: 3600, reward: { type: 'coins',     id: '150',               label: '150 Coins',        emoji: '🪙' } },
  { tier: 25, xpRequired: 3750, reward: { type: 'theme',     id: 'space',             label: 'Deep Space',       emoji: '🌌' } },
  { tier: 26, xpRequired: 3900, reward: { type: 'song',      id: 'jazz-midnight',     label: 'Midnight Blues',   emoji: '🎶' } },
  { tier: 27, xpRequired: 4050, reward: { type: 'coins',     id: '200',               label: '200 Coins',        emoji: '🪙' } },
  { tier: 28, xpRequired: 4200, reward: { type: 'avatar',    id: 'legend',            label: 'Legend',           emoji: '🌟' } },
  { tier: 29, xpRequired: 4350, reward: { type: 'song',      id: 'lofi-sunset',       label: 'Sunset Drive',     emoji: '🌇' } },
  { tier: 30, xpRequired: 4500, reward: { type: 'theme',     id: 'battlepass',        label: 'Battle Pass Gold', emoji: '🏆' } },
];

const defaultBattlePassData: BattlePassData = {
  season: 1,
  currentXP: 0,
  claimedTiers: [],
};

export async function loadBattlePassData(): Promise<BattlePassData> {
  try {
    const raw = await AsyncStorage.getItem(BATTLE_PASS_STORAGE_KEY);
    if (raw) {
      return { ...defaultBattlePassData, ...JSON.parse(raw) };
    }
    await saveBattlePassData(defaultBattlePassData);
    return defaultBattlePassData;
  } catch {
    return defaultBattlePassData;
  }
}

export async function saveBattlePassData(data: BattlePassData): Promise<void> {
  try {
    await AsyncStorage.setItem(BATTLE_PASS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving battle pass data:', error);
  }
}

/** Returns the highest completed tier index (0 = no tiers done, 30 = all done). */
export function computeCurrentTier(xp: number): number {
  return Math.min(TOTAL_TIERS, Math.floor(xp / XP_PER_TIER));
}

/** XP progress within the current (incomplete) tier, from 0.0 to 1.0. */
export function computeTierProgress(xp: number): number {
  const tier = computeCurrentTier(xp);
  if (tier >= TOTAL_TIERS) return 1;
  const tierStartXP = tier * XP_PER_TIER;
  return (xp - tierStartXP) / XP_PER_TIER;
}

/**
 * Returns the tier *numbers* (1-based) that were newly completed by
 * going from oldXP to newXP.
 */
export function getNewlyCompletedTiers(oldXP: number, newXP: number): number[] {
  const oldTier = computeCurrentTier(oldXP);
  const newTier = computeCurrentTier(newXP);
  const result: number[] = [];
  for (let t = oldTier + 1; t <= newTier; t++) {
    result.push(t);
  }
  return result;
}

export const MAX_XP = TOTAL_TIERS * XP_PER_TIER; // 4500
