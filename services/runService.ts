// runService.ts
// Manages roguelike run lifecycle: creation, persistence, floor progression,
// tile effects, reward calculation, and upgrade drafting.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type RunState,
  type FloorState,
  type TileModifier,
  type TileEvent,
  type FloorReward,
  type UpgradeId,
  type FloorModifier,
  RUN_CONFIG,
  ALL_UPGRADE_IDS,
  UPGRADES,
} from '../constants/runConfig';
import {
  getFloorPuzzle,
  generateTileModifiers,
  rollFloorModifiers,
  getFloorSeed,
} from './puzzleGenerator';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const RUN_STATE_KEY = 'sudokle_active_run';
const FLOOR_STATE_KEY = 'sudokle_floor_state';

// ─── UUID ─────────────────────────────────────────────────────────────────────

function generateRunId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 9);
  return `run_${ts}_${rand}`;
}

// ─── Run Seed ─────────────────────────────────────────────────────────────────

function generateRunSeed(): number {
  return Math.abs(
    Math.floor(Math.random() * 2_147_483_647) ^
    (Date.now() & 0xffffffff)
  ) || 42;
}

// ─── Run CRUD ─────────────────────────────────────────────────────────────────

/** Creates a fresh run, persists it, and returns the initial state pair. */
export async function createRun(): Promise<{ run: RunState; floor: FloorState }> {
  const runSeed = generateRunSeed();
  const maxLives = RUN_CONFIG.startingLives + (0); // resilient upgrade adds 1 at run creation
  const run: RunState = {
    runId: generateRunId(),
    runSeed,
    currentFloor: 1,
    maxFloors: RUN_CONFIG.maxFloors,
    livesRemaining: RUN_CONFIG.startingLives,
    maxLives,
    hintsRemaining: RUN_CONFIG.startingHints,
    runUpgrades: [],
    floorRewards: [],
    status: 'active',
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    totalMistakes: 0,
    totalTileBonus: 0,
  };

  const floor = generateFloorState(run, 1);
  await saveRunState(run, floor);
  return { run, floor };
}

/** Loads the persisted active run. Returns null if no run is in progress. */
export async function getActiveRun(): Promise<RunState | null> {
  try {
    const raw = await AsyncStorage.getItem(RUN_STATE_KEY);
    if (!raw) return null;
    const run: RunState = JSON.parse(raw);
    return run.status === 'active' ? run : null;
  } catch {
    return null;
  }
}

/** Loads the persisted floor state for the current floor. */
export async function getFloorState(): Promise<FloorState | null> {
  try {
    const raw = await AsyncStorage.getItem(FLOOR_STATE_KEY);
    return raw ? (JSON.parse(raw) as FloorState) : null;
  } catch {
    return null;
  }
}

/** Atomically saves run + floor state to AsyncStorage. */
export async function saveRunState(run: RunState, floor: FloorState): Promise<void> {
  const updatedRun: RunState = { ...run, lastUpdatedAt: new Date().toISOString() };
  await AsyncStorage.multiSet([
    [RUN_STATE_KEY, JSON.stringify(updatedRun)],
    [FLOOR_STATE_KEY, JSON.stringify(floor)],
  ]);
}

/** Clears all active run data from storage (called after run ends). */
export async function clearRunState(): Promise<void> {
  await AsyncStorage.multiRemove([RUN_STATE_KEY, FLOOR_STATE_KEY]);
}

// ─── Floor Generation ─────────────────────────────────────────────────────────

/**
 * Generates a complete FloorState for the given floor number.
 * Uses the run's master seed to ensure reproducibility.
 */
export function generateFloorState(run: RunState, floor: number): FloorState {
  const floorModifiers = rollFloorModifiers(floor, run.runSeed);
  const { puzzle, solution } = getFloorPuzzle(floor, run.runSeed);
  const tileModifiers = generateTileModifiers(floor, run.runSeed, puzzle, floorModifiers);

  // Scholar upgrade: extra hints per floor
  const scholarBonus = run.runUpgrades.includes('scholar') ? 2 : 0;

  return {
    floor,
    grid: puzzle.map(r => [...r]),
    original: puzzle.map(r => [...r]),
    solution: solution.map(r => [...r]),
    notes: {},
    tileModifiers,
    floorModifiers,
    hintsUsedThisFloor: 0,
    mistakesThisFloor: 0,
    elapsedTime: 0,
    isComplete: false,
  };
}

// ─── Floor Progression ────────────────────────────────────────────────────────

/**
 * Advances the run to the next floor.
 * Returns the updated RunState and the new FloorState.
 * Does NOT persist — caller must call saveRunState after any further changes
 * (e.g. upgrade selection).
 */
export function advanceFloor(
  run: RunState,
  floorRewardCoins: number,
): { updatedRun: RunState; nextFloor: FloorState } {
  const nextFloorNumber = run.currentFloor + 1;

  // Scholar upgrade: refill hint bonus on each floor entry
  const scholarBonus = run.runUpgrades.includes('scholar') ? 2 : 0;

  const updatedRun: RunState = {
    ...run,
    currentFloor: nextFloorNumber,
    floorRewards: [...run.floorRewards, floorRewardCoins],
    hintsRemaining: run.hintsRemaining + scholarBonus,
    lastUpdatedAt: new Date().toISOString(),
  };

  const nextFloor = generateFloorState(updatedRun, nextFloorNumber);
  return { updatedRun, nextFloor };
}

// ─── Tile Effect Resolution ───────────────────────────────────────────────────

export interface TileEffectResult {
  updatedRun: RunState;
  updatedFloor: FloorState;
  event: TileEvent | null;
  coinsDelta: number;     // coins to award immediately (gold/bonus tiles)
  revealCellKey?: string; // for hint tiles
}

/**
 * Resolves the effect of a tile modifier when a cell is filled.
 *
 * @param run         Current run state
 * @param floor       Current floor state
 * @param cellKey     "row-col" string for the cell
 * @param correct     true = cell was filled correctly per Sudoku rules
 */
export function applyTileEffect(
  run: RunState,
  floor: FloorState,
  cellKey: string,
  correct: boolean,
): TileEffectResult {
  const modifier = floor.tileModifiers[cellKey];

  // No modifier or already triggered — nothing to do
  if (!modifier || modifier.triggered) {
    return { updatedRun: run, updatedFloor: floor, event: null, coinsDelta: 0 };
  }

  const hasGambler = run.runUpgrades.includes('gambler');
  const hasAlchemist = run.runUpgrades.includes('alchemist');
  const hasArmored = run.runUpgrades.includes('armored');
  const hasMedic = run.runUpgrades.includes('medic');
  const hasRecycler = run.runUpgrades.includes('recycler');
  const hasDoubleEdge = floor.floorModifiers.includes('double_edge');

  let updatedRun: RunState = { ...run };
  let updatedFloor: FloorState = {
    ...floor,
    tileModifiers: {
      ...floor.tileModifiers,
      [cellKey]: { ...modifier, triggered: true },
    },
  };
  let event: TileEvent | null = null;
  let coinsDelta = 0;
  let revealCellKey: string | undefined;

  if (correct) {
    switch (modifier.type) {
      case 'gold': {
        // Preview value shown in UI animation; coins are actually awarded at floor-clear
        const multiplier = (hasAlchemist || hasDoubleEdge ? 3 : 2) * (hasGambler ? 2 : 1);
        coinsDelta = RUN_CONFIG.goldTileCoins * multiplier;
        event = { type: 'gold', cellKey, effect: 'gain_coins', value: coinsDelta };
        break;
      }

      case 'bonus': {
        coinsDelta = RUN_CONFIG.bonusTileCoins * (hasGambler ? 2 : 1);
        event = { type: 'bonus', cellKey, effect: 'gain_coins', value: coinsDelta };
        break;
      }

      case 'shield': {
        const livesRestored = hasMedic ? 2 : 1;
        const newLives = Math.min(
          updatedRun.livesRemaining + livesRestored,
          updatedRun.maxLives,
        );
        updatedRun = { ...updatedRun, livesRemaining: newLives };
        event = { type: 'shield', cellKey, effect: 'gain_life', value: livesRestored };
        break;
      }

      case 'hint': {
        // Find the best neighboring empty cell to auto-reveal
        revealCellKey = findBestHintTarget(cellKey, floor);
        event = {
          type: 'hint',
          cellKey,
          effect: 'reveal_cell',
          revealedCellKey: revealCellKey,
        };
        break;
      }

      case 'fragile': {
        // Fragile is locked-in on placement (triggered so it can't be erased)
        event = { type: 'fragile', cellKey, effect: 'lock_cell' };
        if (hasRecycler) {
          updatedRun = {
            ...updatedRun,
            hintsRemaining: updatedRun.hintsRemaining + 1,
          };
        }
        break;
      }

      case 'multiplier': {
        // multiplier tiles are aggregated at floor-end — no immediate effect
        event = { type: 'multiplier', cellKey, effect: 'gain_coins', value: 0 };
        break;
      }

      case 'cursed': {
        // No punishment for correctly filling a cursed tile
        event = null;
        break;
      }
    }
  } else {
    // Incorrect placement
    if (modifier.type === 'cursed' && !hasArmored) {
      const extraLoss = hasGambler ? 2 : 1;
      const newLives = Math.max(0, updatedRun.livesRemaining - extraLoss);
      updatedRun = { ...updatedRun, livesRemaining: newLives };
      event = { type: 'cursed', cellKey, effect: 'lose_life', value: extraLoss };
    }

    if (modifier.type === 'fragile') {
      // Lock in even wrong answers — nature of fragile
      event = { type: 'fragile', cellKey, effect: 'lock_cell' };
    }
  }

  return { updatedRun, updatedFloor, event, coinsDelta, revealCellKey };
}

/**
 * Finds the most useful cell to auto-reveal for a hint tile effect.
 * Prefers cells in the same row/col/box with the fewest valid placements.
 * Falls back to any empty cell if no adjacent empty cells exist.
 */
function findBestHintTarget(
  sourceCellKey: string,
  floor: FloorState,
): string | undefined {
  const [sr, sc] = sourceCellKey.split('-').map(Number);
  const boxRow = Math.floor(sr / 3) * 3;
  const boxCol = Math.floor(sc / 3) * 3;

  const candidates: string[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (floor.grid[r][c] !== 0) continue;       // already filled
      if (floor.original[r][c] !== 0) continue;   // is a given cell
      const key = `${r}-${c}`;
      if (key === sourceCellKey) continue;

      const isRelated =
        r === sr ||
        c === sc ||
        (Math.floor(r / 3) * 3 === boxRow && Math.floor(c / 3) * 3 === boxCol);

      if (isRelated) candidates.push(key);
    }
  }

  // If no related candidates, take any empty cell
  if (candidates.length === 0) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (floor.grid[r][c] === 0 && floor.original[r][c] === 0) {
          const key = `${r}-${c}`;
          if (key !== sourceCellKey) return key;
        }
      }
    }
    return undefined;
  }

  // Pick the candidate with the fewest valid numbers (hardest to solve naturally)
  let bestKey = candidates[0];
  let bestCount = Infinity;

  for (const key of candidates) {
    const [r, c] = key.split('-').map(Number);
    let count = 0;
    for (let num = 1; num <= 9; num++) {
      // Quick row check
      if (!floor.grid[r].includes(num)) count++;
    }
    if (count < bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  return bestKey;
}

// ─── Reward Calculation ───────────────────────────────────────────────────────

/**
 * Calculates the total coin reward for completing a floor.
 * Call this when isComplete becomes true.
 */
export function calculateFloorReward(
  floor: FloorState,
  run: RunState,
): FloorReward {
  const hasGambler = run.runUpgrades.includes('gambler');
  const hasAlchemist = run.runUpgrades.includes('alchemist');
  const hasDoubleEdge = floor.floorModifiers.includes('double_edge');

  const base = RUN_CONFIG.baseFloorCoins;

  // Tally up tile rewards from tiles triggered this floor
  let goldBonus = 0;
  let bonusTileFlat = 0;

  for (const modifier of Object.values(floor.tileModifiers)) {
    if (!modifier.triggered) continue;
    if (modifier.type === 'gold') {
      const mult = (hasAlchemist || hasDoubleEdge ? 3 : 2) * (hasGambler ? 2 : 1);
      goldBonus += RUN_CONFIG.goldTileCoins * mult;
    }
    if (modifier.type === 'bonus') {
      bonusTileFlat += RUN_CONFIG.bonusTileCoins * (hasGambler ? 2 : 1);
    }
  }

  // Multiplier tile bonus: if ALL multiplier tiles were triggered (filled correctly)
  const allModifiers = Object.values(floor.tileModifiers);
  const multiplierTiles = allModifiers.filter(m => m.type === 'multiplier');
  const allMultiplierTriggered =
    multiplierTiles.length > 0 && multiplierTiles.every(m => m.triggered);

  const floorSubtotal = base + goldBonus + bonusTileFlat;
  const multiplierBonus = allMultiplierTriggered
    ? Math.round(floorSubtotal * RUN_CONFIG.multiplierPercent * (hasGambler ? 2 : 1))
    : 0;

  // Speed bonus
  const speedBonus =
    floor.floorModifiers.includes('speed_bonus') &&
    floor.elapsedTime <= RUN_CONFIG.speedBonusSeconds
      ? RUN_CONFIG.speedBonusCoins
      : 0;

  const total = base + goldBonus + bonusTileFlat + multiplierBonus + speedBonus;

  return {
    base,
    goldBonus,
    bonusTileFlat,
    multiplierBonus,
    speedBonus,
    total,
  };
}

// ─── Run Completion ───────────────────────────────────────────────────────────

/** Calculates the coin bonus awarded at the end of a full run. */
export function calculateRunCompletionBonus(run: RunState): number {
  const floorsCleared = run.floorRewards.length;
  const runBonus = floorsCleared * 50;
  const perfectBonus = run.totalMistakes === 0 ? 500 : 0;
  return runBonus + perfectBonus;
}

// ─── Upgrade Drafting ─────────────────────────────────────────────────────────

/**
 * Rolls upgrade choices for the post-floor draft.
 * Excludes upgrades the player already owns.
 * Uses a deterministic seed so the same floor always offers the same choices
 * (fair for players who need to close and reopen the app mid-draft).
 */
export function rollUpgradeOptions(run: RunState): UpgradeId[] {
  const available = ALL_UPGRADE_IDS.filter(id => !run.runUpgrades.includes(id));
  if (available.length === 0) return [];

  // Seed: run seed XOR'd with floor number so each floor draft is different
  const draftSeed = getFloorSeed(run.runSeed, run.currentFloor) ^ 0xfadebabe;
  let s = draftSeed;

  // Seeded Fisher-Yates on a copy of available
  const arr = [...available];
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, Math.min(RUN_CONFIG.upgradeChoices, arr.length));
}

// ─── Surgeon Helper ───────────────────────────────────────────────────────────

/**
 * Returns true if the surgeon upgrade should forgive this mistake
 * (first mistake of the floor).
 */
export function surgeonForgivesThisMistake(run: RunState, floor: FloorState): boolean {
  return run.runUpgrades.includes('surgeon') && floor.mistakesThisFloor === 0;
}
