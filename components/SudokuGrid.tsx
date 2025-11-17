import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyPuzzle, getDateString, isNewDay, type Difficulty } from './dailyPuzzleGenerator';
import { submitDailyScore, initializeUser } from './friendService';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';

const GRID_SIZE = 9;
const { width } = Dimensions.get('window');
const CELL_SIZE = Math.min((width - 40) / GRID_SIZE, 45);

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  easy: { clues: 45, maxHints: 5, color: '#10B981' },
  medium: { clues: 35, maxHints: 3, color: '#F59E0B' },
  hard: { clues: 28, maxHints: 2, color: '#EF4444' },
  expert: { clues: 24, maxHints: 1, color: '#8B5CF6' },
};

interface GameState {
  grid: number[][];
  hintsUsed: number;
  elapsedTime: number;
  isComplete: boolean;
  notes: {[key: string]: number[]};
  lastPlayed: string;
}

const SudokuGrid = () => {
  const { theme } = useTheme();
  const { playSoundEffect } = useAudio();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [grid, setGrid] = useState<number[][]>([]);
  const [original, setOriginal] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<{[key: string]: number[]}>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [todayDate, setTodayDate] = useState('');

  // Count how many of each number (1-9) are in the grid
  const numberCounts = useMemo(() => {
    const counts: {[key: number]: number} = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = 0;
    }
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell !== 0) {
          counts[cell]++;
        }
      });
    });
    return counts;
  }, [grid]);

  // Initialize user on mount
  useEffect(() => {
    initializeUser();
  }, []);

  // Load or create puzzle on mount and difficulty change
  useEffect(() => {
    loadDailyPuzzle();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (isComplete || isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isComplete, isPaused]);

  // Save game state periodically
  useEffect(() => {
    if (grid.length > 0 && !isComplete) {
      saveGameState();
    }
  }, [grid, hintsUsed, elapsedTime, notes]);

  const getStorageKey = () => `sudokle_${todayDate}_${difficulty}`;

  const loadDailyPuzzle = async () => {
    const today = getDateString();
    setTodayDate(today);

    try {
      // Try to load saved state for today
      const storageKey = `sudokle_${today}_${difficulty}`;
      const savedState = await AsyncStorage.getItem(storageKey);
      
      if (savedState) {
        const state: GameState = JSON.parse(savedState);
        
        // Check if it's actually today's puzzle
        if (state.lastPlayed === today && !state.isComplete) {
          // Resume saved game
          const { puzzle, solution: sol } = getDailyPuzzle(difficulty, new Date());
          setGrid(state.grid);
          setOriginal(puzzle);
          setSolution(sol);
          setHintsUsed(state.hintsUsed);
          setElapsedTime(state.elapsedTime);
          setNotes(state.notes || {});
          setIsComplete(state.isComplete);
          setStartTime(Date.now() - (state.elapsedTime * 1000));
          console.log('Resumed saved puzzle');
          return;
        }
      }

      // Load new daily puzzle
      loadNewDailyPuzzle();
    } catch (error) {
      console.error('Error loading puzzle:', error);
      loadNewDailyPuzzle();
    }
  };

  const loadNewDailyPuzzle = () => {
    const { puzzle, solution: sol } = getDailyPuzzle(difficulty, new Date());
    setGrid(puzzle.map(row => [...row]));
    setOriginal(puzzle.map(row => [...row]));
    setSolution(sol);
    setStartTime(Date.now());
    setElapsedTime(0);
    setHintsUsed(0);
    setNotes({});
    setIsComplete(false);
    setSelectedCell(null);
    setNoteMode(false);
    setIsPaused(false);
    console.log('Loaded new daily puzzle for', getDateString(), difficulty);
  };

  const saveGameState = async () => {
    try {
      const state: GameState = {
        grid,
        hintsUsed,
        elapsedTime,
        isComplete,
        notes,
        lastPlayed: todayDate,
      };
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (original[row][col] !== 0) return;
    setSelectedCell({ row, col });
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell) {
      Alert.alert('No cell selected', 'Please select an empty cell first');
      return;
    }

    const { row, col } = selectedCell;

    if (noteMode && num !== 0) {
      const key = `${row}-${col}`;
      const cellNotes = notes[key] || [];
      const newNotes = { ...notes };
      
      if (cellNotes.includes(num)) {
        newNotes[key] = cellNotes.filter(n => n !== num);
      } else {
        newNotes[key] = [...cellNotes, num].sort();
      }
      
      setNotes(newNotes);
      return;
    }

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);

    const key = `${row}-${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }

    // Play sound effects
    if (num !== 0 && num !== solution[row][col]) {
      // Incorrect number
      playSoundEffect('errorSound');
      Alert.alert('❌ Incorrect', "That number doesn't belong there!");
    } else if (num !== 0) {
      // Correct number placed
      playSoundEffect('numberPlace');
    }

    checkCompletion(newGrid);
  };

  const checkCompletion = async (currentGrid: number[][]) => {
    const complete = currentGrid.every((row, r) =>
      row.every((cell, c) => cell === solution[r][c])
    );

    if (complete) {
      setIsComplete(true);

      // Play completion sound
      playSoundEffect('puzzleComplete');

      // Save completion
      const state: GameState = {
        grid: currentGrid,
        hintsUsed,
        elapsedTime,
        isComplete: true,
        notes,
        lastPlayed: todayDate,
      };
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(state));

      // Submit score to Firebase
      try {
        const result = await submitDailyScore(todayDate, difficulty, elapsedTime, hintsUsed);
        if (result.success) {
          console.log('Score submitted successfully');
        } else {
          console.error('Error submitting score:', result.error);
          // Note: Score submission failed but game is still complete locally
        }
      } catch (error) {
        console.error('Error submitting score:', error);
      }

      showCompletionScreen();
    }
  };

  const showCompletionScreen = () => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    
    const difficultyEmoji = {
      easy: '🟢',
      medium: '🟡',
      hard: '🟠',
      expert: '🔴',
    };

    const shareText = `Sudokle ${todayDate}\n${difficultyEmoji[difficulty]} ${difficulty.toUpperCase()}\n⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}\n💡 ${hintsUsed} hints`;

    Alert.alert(
      '🎉 Daily Puzzle Complete!',
      shareText + '\n\nCome back tomorrow for a new puzzle!',
      [{ text: 'OK' }]
    );
  };

  const useHint = () => {
    const maxHints = DIFFICULTY_CONFIG[difficulty].maxHints;
    
    if (hintsUsed >= maxHints) {
      Alert.alert('No hints left', `You've used all ${maxHints} hints for this difficulty!`);
      return;
    }

    if (!selectedCell) {
      Alert.alert('Select a cell', 'Please select an empty cell first');
      return;
    }

    const { row, col } = selectedCell;
    
    if (original[row][col] !== 0) {
      Alert.alert('Cannot hint', 'This cell is already filled');
      return;
    }

    if (grid[row][col] !== 0) {
      Alert.alert('Cell filled', 'Clear the cell first to use a hint');
      return;
    }

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = solution[row][col];
    setGrid(newGrid);
    setHintsUsed(hintsUsed + 1);

    const key = `${row}-${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }

    Alert.alert('💡 Hint used', `Placed ${solution[row][col]} at (${row + 1}, ${col + 1})`);
  };

  const togglePause = () => {
    if (!isPaused) {
      setIsPaused(true);
    } else {
      setStartTime(Date.now() - (elapsedTime * 1000));
      setIsPaused(false);
    }
  };

  const getCellStyle = (row: number, col: number) => {
    const isOriginal = original[row][col] !== 0;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isWrong = grid[row][col] !== 0 && grid[row][col] !== solution[row][col];

    return [
      styles.cell,
      isOriginal && styles.cellOriginal,
      isSelected && styles.cellSelected,
      isWrong && styles.cellWrong,
      (col + 1) % 3 === 0 && col < 8 && styles.cellRightBorder,
      (row + 1) % 3 === 0 && row < 8 && styles.cellBottomBorder,
    ];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCell = (row: number, col: number) => {
    const value = grid[row][col];
    const key = `${row}-${col}`;
    const cellNotes = notes[key] || [];

    return (
      <TouchableOpacity
        key={key}
        style={getCellStyle(row, col)}
        onPress={() => handleCellPress(row, col)}
        disabled={isComplete}
      >
        {value !== 0 ? (
          <Text style={[
            styles.cellText,
            original[row][col] !== 0 && styles.cellTextOriginal
          ]}>
            {isPaused ? '' : value}
          </Text>
        ) : cellNotes.length > 0 && !isPaused ? (
          <View style={styles.notesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Text key={num} style={styles.noteText}>
                {cellNotes.includes(num) ? num : ' '}
              </Text>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (grid.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading today's puzzle...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SUDOKLE</Text>
        <Text style={styles.date}>{todayDate}</Text>
        {isComplete && <Text style={styles.completedBadge}>✅ Completed!</Text>}
      </View>

      {/* Difficulty Tabs */}
      <View style={styles.difficultyTabs}>
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(diff => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.difficultyTab,
              difficulty === diff && { 
                backgroundColor: DIFFICULTY_CONFIG[diff].color,
                borderColor: DIFFICULTY_CONFIG[diff].color,
              }
            ]}
            onPress={() => {
              playSoundEffect('buttonClick');
              setDifficulty(diff);
            }}
          >
            <Text style={[
              styles.difficultyTabText,
              difficulty === diff && styles.difficultyTabTextActive
            ]}>
              {diff.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>⏱️</Text>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>💡</Text>
          <Text style={styles.statValue}>
            {hintsUsed}/{DIFFICULTY_CONFIG[difficulty].maxHints}
          </Text>
        </View>
        {!isComplete && (
          <TouchableOpacity 
            style={styles.pauseButton}
            onPress={togglePause}
          >
            <Text style={styles.pauseButtonText}>{isPaused ? '▶️' : '⏸️'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText}>PAUSED</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid */}
      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </View>
        ))}
      </View>

      {!isComplete && (
        <>
          {/* Number Pad */}
          <View style={styles.numberPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const isComplete = numberCounts[num] >= 9;
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberButton,
                    { backgroundColor: theme.colors.primaryButton },
                    isComplete && styles.numberButtonComplete,
                  ]}
                  onPress={() => handleNumberPress(num)}
                  disabled={isPaused || isComplete}
                >
                  <Text
                    style={[
                      styles.numberButtonText,
                      { color: theme.colors.primaryButtonText },
                      isComplete && styles.numberButtonTextComplete,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, noteMode && styles.actionButtonActive]}
              onPress={() => setNoteMode(!noteMode)}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText}>
                {noteMode ? '📝 ON' : '📝 Notes'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.hintButton]}
              onPress={useHint}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText}>💡 Hint</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => handleNumberPress(0)}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isComplete && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            🎉 Come back tomorrow for a new puzzle!
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  completedBadge: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 8,
  },
  difficultyTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 8,
  },
  difficultyTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  difficultyTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  difficultyTabTextActive: {
    color: '#fff',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  pauseButton: {
    padding: 8,
  },
  pauseButtonText: {
    fontSize: 20,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#1F2937',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cellOriginal: {
    backgroundColor: '#F3F4F6',
  },
  cellSelected: {
    backgroundColor: '#DBEAFE',
  },
  cellWrong: {
    backgroundColor: '#FEE2E2',
  },
  cellRightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#1F2937',
  },
  cellBottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#1F2937',
  },
  cellText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3B82F6',
  },
  cellTextOriginal: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 2,
  },
  noteText: {
    fontSize: 8,
    width: '33.33%',
    textAlign: 'center',
    color: '#6B7280',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 15,
  },
  numberButton: {
    width: (width - 80) / 9,
    height: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  numberButtonComplete: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  numberButtonTextComplete: {
    color: '#D1D5DB',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#10B981',
  },
  hintButton: {
    backgroundColor: '#8B5CF6',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  completedContainer: {
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SudokuGrid;