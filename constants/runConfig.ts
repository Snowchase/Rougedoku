// runConfig.ts
// All types, interfaces, and constants for the roguelike run system

// ─── Core Types ──────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type TileType =
  | 'gold'        // +coins when correctly filled
  | 'cursed'      // lose 1 extra life if filled incorrectly
  | 'multiplier'  // boosts floor reward if all multiplier tiles solved correctly
  | 'shield'      // restore 1 life when correctly filled
  | 'hint'        // reveals a neighboring empty cell when correctly filled
  | 'fragile'     // cannot be erased once any number is placed
  | 'bonus';      // flat coin bonus when correctly filled

export type FloorModifier =
  | 'double_edge'   // mistakes cost 2 lives; gold pays 3×
  | 'iron'          // 0 mistakes tolerated — any mistake fails the floor
  | 'fog_of_war'    // user-placed numbers only visible in selected row/col/box
  | 'no_hints'      // hint pool locked this floor
  | 'speed_bonus'   // +100 coins for clearing in under 4 minutes
  | 'abundant'      // 2 extra gold and bonus tiles this floor
  | 'cursed_board'; // all user-fillable cells start with cursed tint

export type UpgradeId =
  | 'alchemist'     // gold tiles pay 3× instead of 2×
  | 'armored'       // cursed tiles never cost extra lives
  | 'surgeon'       // first mistake per floor is forgiven
  | 'scholar'       // start each floor with +2 hints
  | 'gambler'       // tile rewards 2×, punishments 2×
  | 'resilient'     // +1 max life at run start
  | 'cartographer'  // all tile types revealed before floor starts
  | 'recycler'      // filling a fragile tile correctly refunds 1 hint
  | 'medic';        // shield tiles restore 2 lives instead of 1

export type RunStatus = 'active' | 'completed' | 'failed';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TileModifier {
  type: TileType;
  triggered: boolean; // true once the tile effect has fired
}

export interface RunState {
  runId: string;
  runSeed: number;
  currentFloor: number;   // 1-indexed
  maxFloors: number;
  livesRemaining: number;
  maxLives: number;
  hintsRemaining: number;
  runUpgrades: UpgradeId[];
  floorRewards: number[];  // coins earned per completed floor
  status: RunStatus;
  startedAt: string;       // ISO timestamp
  lastUpdatedAt: string;
  totalMistakes: number;
  totalTileBonus: number;  // cumulative tile bonus coins
}

export interface FloorState {
  floor: number;
  grid: number[][];
  original: number[][];
  solution: number[][];
  notes: { [key: string]: number[] };          // "row-col" → candidate numbers
  tileModifiers: { [key: string]: TileModifier }; // "row-col" → modifier
  floorModifiers: FloorModifier[];
  hintsUsedThisFloor: number;
  mistakesThisFloor: number;
  elapsedTime: number;
  isComplete: boolean;
}

export interface FloorReward {
  base: number;
  goldBonus: number;
  bonusTileFlat: number;
  multiplierBonus: number;
  speedBonus: number;
  total: number;
}

export interface TileEvent {
  type: TileType;
  cellKey: string;
  effect: 'gain_life' | 'lose_life' | 'gain_coins' | 'reveal_cell' | 'lock_cell' | 'gain_hint';
  value?: number;
  revealedCellKey?: string; // for hint tiles: which cell was auto-revealed
}

export interface TileDistribution {
  gold: number;
  cursed: number;
  multiplier: number;
  shield: number;
  hint: number;
  fragile: number;
  bonus: number;
}

// ─── Run Configuration ────────────────────────────────────────────────────────

export const RUN_CONFIG = {
  startingLives: 3,
  maxLives: 5,
  startingHints: 3,
  maxFloors: 20,
  bossFloors: [5, 10, 15, 20] as number[],
  upgradeChoices: 3,
  baseFloorCoins: 30,
  goldTileCoins: 10,       // coins per triggered gold tile
  bonusTileCoins: 20,      // coins per triggered bonus tile
  multiplierPercent: 0.5,  // 50% of floor subtotal added if all multiplier tiles triggered
  speedBonusCoins: 100,
  speedBonusSeconds: 240,  // 4 minutes
} as const;

// ─── Tile Distributions by Floor Range ───────────────────────────────────────

// Base distribution for each floor tier (boss floors add extra tiles on top)
export const FLOOR_TILE_DISTRIBUTIONS: { maxFloor: number; dist: TileDistribution }[] = [
  {
    maxFloor: 5,
    dist: { gold: 3, cursed: 0, multiplier: 0, shield: 2, hint: 1, fragile: 0, bonus: 2 },
  },
  {
    maxFloor: 10,
    dist: { gold: 4, cursed: 2, multiplier: 1, shield: 1, hint: 1, fragile: 1, bonus: 1 },
  },
  {
    maxFloor: 15,
    dist: { gold: 3, cursed: 3, multiplier: 2, shield: 1, hint: 1, fragile: 2, bonus: 1 },
  },
  {
    maxFloor: 20,
    dist: { gold: 4, cursed: 5, multiplier: 2, shield: 1, hint: 0, fragile: 2, bonus: 0 },
  },
];

// Extra tiles added on boss floors (on top of tier distribution)
export const BOSS_FLOOR_EXTRA: TileDistribution = {
  gold: 2, cursed: 2, multiplier: 1, shield: 0, hint: 0, fragile: 0, bonus: 0,
};

// ─── Visual Constants ─────────────────────────────────────────────────────────

export const TILE_COLORS: Record<TileType, string> = {
  gold:       'rgba(251, 191, 36,  0.28)',
  cursed:     'rgba(239, 68,  68,  0.22)',
  multiplier: 'rgba(139, 92,  246, 0.22)',
  shield:     'rgba(34,  197, 94,  0.22)',
  hint:       'rgba(56,  189, 248, 0.22)',
  fragile:    'rgba(156, 163, 175, 0.28)',
  bonus:      'rgba(249, 115, 22,  0.22)',
};

export const TILE_ICONS: Record<TileType, string> = {
  gold:       '🪙',
  cursed:     '💀',
  multiplier: '⭐',
  shield:     '🛡',
  hint:       '👁',
  fragile:    '🔒',
  bonus:      '🔥',
};

export const TILE_DESCRIPTIONS: Record<TileType, string> = {
  gold:       '+coins when filled correctly',
  cursed:     'Lose an extra life if filled wrong',
  multiplier: 'Boosts floor reward if all filled correctly',
  shield:     'Restore 1 life when filled correctly',
  hint:       'Reveals a neighboring cell when filled correctly',
  fragile:    'Cannot be erased once a number is placed',
  bonus:      'Flat coin bonus when filled correctly',
};

// ─── Upgrade Metadata ─────────────────────────────────────────────────────────

export interface UpgradeInfo {
  id: UpgradeId;
  name: string;
  description: string;
  icon: string;
}

export const UPGRADES: Record<UpgradeId, UpgradeInfo> = {
  alchemist:    { id: 'alchemist',    name: 'Alchemist',    icon: '🧪', description: 'Gold tiles pay 3× instead of 2×' },
  armored:      { id: 'armored',      name: 'Armored',      icon: '🛡', description: 'Cursed tiles never cost extra lives' },
  surgeon:      { id: 'surgeon',      name: 'Surgeon',      icon: '🩺', description: 'First mistake per floor is forgiven' },
  scholar:      { id: 'scholar',      name: 'Scholar',      icon: '📚', description: 'Start each floor with +2 hints' },
  gambler:      { id: 'gambler',      name: 'Gambler',      icon: '🎲', description: 'All tile rewards 2×, punishments 2×' },
  resilient:    { id: 'resilient',    name: 'Resilient',    icon: '💪', description: 'Start the run with +1 max life' },
  cartographer: { id: 'cartographer', name: 'Cartographer', icon: '🗺', description: 'Tile types revealed before floor starts' },
  recycler:     { id: 'recycler',     name: 'Recycler',     icon: '♻️', description: 'Filling a fragile tile correctly refunds 1 hint' },
  medic:        { id: 'medic',        name: 'Medic',        icon: '❤️', description: 'Shield tiles restore 2 lives instead of 1' },
};

// All upgrade IDs for use in pools
export const ALL_UPGRADE_IDS: UpgradeId[] = Object.keys(UPGRADES) as UpgradeId[];

// ─── Floor Modifier Metadata ──────────────────────────────────────────────────

export const FLOOR_MODIFIER_POOL: FloorModifier[] = [
  'double_edge',
  'speed_bonus',
  'abundant',
  'no_hints',
  'fog_of_war',
  'cursed_board',
];

export const FLOOR_MODIFIER_INFO: Record<FloorModifier, { name: string; icon: string; description: string }> = {
  double_edge:  { name: 'Double Edge',  icon: '⚔️', description: 'Mistakes cost 2 lives; gold pays 3×' },
  iron:         { name: 'Iron',         icon: '🔩', description: 'No mistakes allowed this floor' },
  fog_of_war:   { name: 'Fog of War',   icon: '🌫', description: 'Numbers only visible near selected cell' },
  no_hints:     { name: 'No Hints',     icon: '🚫', description: 'Hint pool locked this floor' },
  speed_bonus:  { name: 'Speed Bonus',  icon: '⚡', description: '+100 coins for clearing in under 4 minutes' },
  abundant:     { name: 'Abundant',     icon: '🌟', description: '2 extra gold and bonus tiles this floor' },
  cursed_board: { name: 'Cursed Board', icon: '💀', description: 'All empty cells start with a cursed tint' },
};
