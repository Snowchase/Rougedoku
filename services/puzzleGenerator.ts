// puzzleGenerator.ts
// Floor-based puzzle generation for the roguelike run system.
// Re-exports core validation from the original generator so other files
// can migrate their imports incrementally.

import {
  isValid,
  isCompleteBoardValid,
  countSolutions,
} from '../components/dailyPuzzleGenerator';

// Re-export core validation so consumers can migrate imports incrementally
export { isValid, isCompleteBoardValid, countSolutions };
import {
  type Difficulty,
  type TileModifier,
  type TileDistribution,
  type TileType,
  FLOOR_TILE_DISTRIBUTIONS,
  BOSS_FLOOR_EXTRA,
  RUN_CONFIG,
  FLOOR_MODIFIER_POOL,
  type FloorModifier,
} from '../constants/runConfig';

export type { Difficulty };

export interface PuzzleData {
  puzzle: number[][];
  solution: number[][];
}

// ─── Seeded RNG (same algorithm as dailyPuzzleGenerator) ─────────────────────

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// ─── Floor Seed ───────────────────────────────────────────────────────────────

/**
 * Derives a deterministic seed for a specific floor within a run.
 * Different run seeds produce completely different floor layouts.
 */
export function getFloorSeed(runSeed: number, floor: number): number {
  // Mix the run seed and floor number to produce a unique per-floor seed
  let hash = runSeed ^ (floor * 2654435761);
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >>> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >>> 16) ^ hash;
  return Math.abs(hash) || 1; // guard against 0
}

// ─── Difficulty Scaling ───────────────────────────────────────────────────────

/** Returns the sudoku difficulty for a given floor number. */
export function getFloorDifficulty(floor: number): Difficulty {
  if (floor <= 3)  return 'easy';
  if (floor <= 8)  return 'medium';
  if (floor <= 14) return 'hard';
  return 'expert';
}

const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  easy:   45,
  medium: 35,
  hard:   28,
  expert: 24,
};

// ─── Puzzle Generation ────────────────────────────────────────────────────────

function solveSudoku(board: number[][], rng: SeededRandom): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board, rng)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateSolution(seed: number): number[][] {
  const rng = new SeededRandom(seed);
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  // Fill diagonal 3×3 boxes first (they're independent of each other)
  for (let box = 0; box < 9; box += 3) {
    const numbers = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[box + i][box + j] = numbers[idx++];
      }
    }
  }

  solveSudoku(board, rng);
  return board;
}

function createPuzzle(solution: number[][], numClues: number, seed: number): number[][] {
  const rng = new SeededRandom(seed + 1000);
  const puzzle = solution.map(row => [...row]);

  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  const shuffled = rng.shuffle(positions);
  const cellsToRemove = 81 - numClues;
  for (let i = 0; i < cellsToRemove && i < shuffled.length; i++) {
    const [row, col] = shuffled[i];
    puzzle[row][col] = 0;
  }

  return puzzle;
}

/**
 * Generates the puzzle and solution for a specific floor in a run.
 */
export function getFloorPuzzle(floor: number, runSeed: number): PuzzleData {
  const difficulty = getFloorDifficulty(floor);
  const seed = getFloorSeed(runSeed, floor);
  const solution = generateSolution(seed);
  const clues = DIFFICULTY_CLUES[difficulty];
  const puzzle = createPuzzle(solution, clues, seed);
  return { puzzle, solution };
}

// ─── Tile Modifier Generation ─────────────────────────────────────────────────

/** Returns the base tile distribution for a given floor. */
function getBaseTileDistribution(floor: number): TileDistribution {
  const entry = FLOOR_TILE_DISTRIBUTIONS.find(e => floor <= e.maxFloor);
  // Default to highest tier if somehow above maxFloor entries
  return entry?.dist ?? FLOOR_TILE_DISTRIBUTIONS[FLOOR_TILE_DISTRIBUTIONS.length - 1].dist;
}

/**
 * Generates a map of tile modifiers for a floor.
 * Only user-fillable (non-original) cells receive modifiers.
 * Uses the floor seed so modifier positions are deterministic per run.
 *
 * @param floor      Current floor number
 * @param runSeed    Master run seed
 * @param original   The given-cell grid (non-zero = pre-filled/locked)
 * @param extraFloorModifiers  Floor-wide modifiers that may affect distribution
 */
export function generateTileModifiers(
  floor: number,
  runSeed: number,
  original: number[][],
  extraFloorModifiers: FloorModifier[] = [],
): { [key: string]: TileModifier } {
  // Use a separate seed offset to decouple tile positions from puzzle shape
  const tileSeed = getFloorSeed(runSeed, floor) ^ 0xdeadbeef;
  const rng = new SeededRandom(tileSeed);

  // Determine distribution
  let dist: TileDistribution = { ...getBaseTileDistribution(floor) };

  // Boss floor bonus
  if (RUN_CONFIG.bossFloors.includes(floor)) {
    dist = {
      gold:       dist.gold       + BOSS_FLOOR_EXTRA.gold,
      cursed:     dist.cursed     + BOSS_FLOOR_EXTRA.cursed,
      multiplier: dist.multiplier + BOSS_FLOOR_EXTRA.multiplier,
      shield:     dist.shield     + BOSS_FLOOR_EXTRA.shield,
      hint:       dist.hint       + BOSS_FLOOR_EXTRA.hint,
      fragile:    dist.fragile    + BOSS_FLOOR_EXTRA.fragile,
      bonus:      dist.bonus      + BOSS_FLOOR_EXTRA.bonus,
    };
  }

  // Abundant floor modifier: +2 gold, +2 bonus
  if (extraFloorModifiers.includes('abundant')) {
    dist = { ...dist, gold: dist.gold + 2, bonus: dist.bonus + 2 };
  }

  // Build ordered list of tile types to assign
  const tilePool: TileType[] = [];
  const typeKeys: (keyof TileDistribution)[] = [
    'cursed', 'gold', 'shield', 'multiplier', 'fragile', 'hint', 'bonus',
  ];
  for (const key of typeKeys) {
    for (let i = 0; i < dist[key]; i++) {
      tilePool.push(key as TileType);
    }
  }

  // Collect all user-fillable cell positions
  const emptyCells: string[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (original[r][c] === 0) {
        emptyCells.push(`${r}-${c}`);
      }
    }
  }

  // Shuffle positions and assign tiles
  const shuffledCells = rng.shuffle(emptyCells);
  const modifiers: { [key: string]: TileModifier } = {};
  const assignCount = Math.min(tilePool.length, shuffledCells.length);

  // Shuffle the tile pool too so order isn't always cursed-first
  const shuffledPool = rng.shuffle(tilePool);

  for (let i = 0; i < assignCount; i++) {
    modifiers[shuffledCells[i]] = {
      type: shuffledPool[i],
      triggered: false,
    };
  }

  return modifiers;
}

// ─── Floor Modifier Rolling ───────────────────────────────────────────────────

/**
 * Deterministically rolls floor modifiers for a given floor using the run seed.
 * Floors 1–5 have no modifiers. Boss floors always include 'iron'.
 * Floors 6+ roll one modifier from the pool; boss floors roll one more.
 */
export function rollFloorModifiers(floor: number, runSeed: number): FloorModifier[] {
  if (floor < 6) return [];

  const modSeed = getFloorSeed(runSeed, floor) ^ 0xc0ffee;
  const rng = new SeededRandom(modSeed);

  const isBoss = RUN_CONFIG.bossFloors.includes(floor);
  const mods: FloorModifier[] = [];

  if (isBoss) {
    mods.push('iron');
  }

  // Roll one random modifier from the pool (excluding 'iron' which is boss-only)
  const pool = FLOOR_MODIFIER_POOL.filter(m => m !== 'iron');
  const pick = pool[rng.nextInt(pool.length)];
  if (!mods.includes(pick)) {
    mods.push(pick);
  }

  return mods;
}
