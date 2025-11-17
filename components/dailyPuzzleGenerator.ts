// dailyPuzzleGenerator.ts
// Generates consistent daily puzzles based on date seed

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface PuzzleData {
  puzzle: number[][];
  solution: number[][];
}

const DIFFICULTY_CLUES = {
  easy: 45,
  medium: 35,
  hard: 28,
  expert: 24,
};

// Seeded random number generator (for consistency)
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

// Get seed from date and difficulty
function getDailySeed(date: Date, difficulty: Difficulty): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Create unique seed for each day + difficulty
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const difficultyValue = { easy: 1, medium: 2, hard: 3, expert: 4 }[difficulty];
  
  // Simple hash function
  let hash = 0;
  const str = dateStr + difficulty + difficultyValue;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

// Check if number placement is valid
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

// Solve sudoku using backtracking with seeded randomness
function solveSudoku(board: number[][], rng: SeededRandom): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;

            if (solveSudoku(board, rng)) {
              return true;
            }

            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Generate a complete sudoku solution
function generateSolution(seed: number): number[][] {
  const rng = new SeededRandom(seed);
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes (they're independent)
  for (let box = 0; box < 9; box += 3) {
    const numbers = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[box + i][box + j] = numbers[idx++];
      }
    }
  }

  // Solve the rest
  solveSudoku(board, rng);
  
  return board;
}

// Create puzzle by removing numbers
function createPuzzle(solution: number[][], numClues: number, seed: number): number[][] {
  const rng = new SeededRandom(seed + 1000);
  const puzzle = solution.map(row => [...row]);

  // Get all cell positions
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }

  // Shuffle positions
  const shuffled = rng.shuffle(positions);

  // Remove cells until we have desired number of clues
  const cellsToRemove = 81 - numClues;
  for (let i = 0; i < cellsToRemove && i < shuffled.length; i++) {
    const [row, col] = shuffled[i];
    puzzle[row][col] = 0;
  }

  return puzzle;
}

// Main function to get today's puzzle
export function getDailyPuzzle(difficulty: Difficulty, date: Date = new Date()): PuzzleData {
  const seed = getDailySeed(date, difficulty);
  const solution = generateSolution(seed);
  const clues = DIFFICULTY_CLUES[difficulty];
  const puzzle = createPuzzle(solution, clues, seed);

  return { puzzle, solution };
}

// Get formatted date string
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if it's a new day (for resetting puzzles)
export function isNewDay(lastPlayedDate: string, currentDate: Date = new Date()): boolean {
  const today = getDateString(currentDate);
  return lastPlayedDate !== today;
}

// Test function to verify consistency
export function testConsistency() {
  const testDate = new Date('2024-01-15');
  const puzzle1 = getDailyPuzzle('medium', testDate);
  const puzzle2 = getDailyPuzzle('medium', testDate);
  
  const same = JSON.stringify(puzzle1.puzzle) === JSON.stringify(puzzle2.puzzle);
  console.log('Same puzzle generated twice:', same);
  
  return same;
}
