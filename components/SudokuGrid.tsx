import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { getDailyPuzzle, getDateString, isNewDay, isValid, isCompleteBoardValid, type Difficulty } from './dailyPuzzleGenerator';
import { submitDailyScore, initializeUser } from './friendService';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { isBoostEligible, markBoostUsed, calculateBoostBonus } from '../services/coinBoostService';

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
  mistakesCount: number;
  elapsedTime: number;
  isComplete: boolean;
  notes: {[key: string]: number[]};
  lastPlayed: string;
}

const SudokuGrid = () => {
  const { theme } = useTheme();
  const { playSoundEffect } = useAudio();
  const { settings } = useSettings();
  const { coins, awardPuzzleCompletion, showBoostAd, awardBoostBonus } = useCurrency();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [grid, setGrid] = useState<number[][]>([]);
  const [original, setOriginal] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<{[key: string]: number[]}>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);

  // Zoom and pan functionality
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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

  // Reset board position when locked
  useEffect(() => {
    if (settings.boardLocked) {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [settings.boardLocked]);

  // Auto-pause when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Auto-pause when app goes to background
        if (!isComplete && !isPaused) {
          setIsPaused(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isComplete, isPaused]);

  // Save game state periodically
  useEffect(() => {
    if (grid.length > 0 && !isComplete) {
      saveGameState();
    }
  }, [grid, hintsUsed, mistakesCount, elapsedTime, notes]);

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
        if (state.lastPlayed === today) {
          // Resume saved game (even if complete, so users can see their finished puzzle)
          const { puzzle, solution: sol } = getDailyPuzzle(difficulty, new Date());
          setGrid(state.grid);
          setOriginal(puzzle);
          setSolution(sol);
          setHintsUsed(state.hintsUsed);
          setMistakesCount(state.mistakesCount || 0);
          setElapsedTime(state.elapsedTime);
          setNotes(state.notes || {});
          setIsComplete(state.isComplete);
          setStartTime(Date.now() - (state.elapsedTime * 1000));
          console.log(state.isComplete ? 'Loaded completed puzzle' : 'Resumed saved puzzle');
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
    setMistakesCount(0);
    setNotes({});
    setIsComplete(false);
    setSelectedCell(null);
    setNoteMode(false);
    setIsPaused(false);
    setHighlightedNumber(null);
    console.log('Loaded new daily puzzle for', getDateString(), difficulty);
  };

  const saveGameState = async () => {
    try {
      const state: GameState = {
        grid,
        hintsUsed,
        mistakesCount,
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
    // Select the cell
    setSelectedCell({ row, col });

    // Highlight all instances of the number in this cell
    const cellValue = grid[row][col];
    if (cellValue !== 0) {
      setHighlightedNumber(cellValue);
    } else {
      setHighlightedNumber(null);
    }
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

    // Check if the placement violates Sudoku rules
    let isRuleViolation = false;
    if (num !== 0) {
      // Temporarily clear the cell to check if the number can be placed
      const originalValue = newGrid[row][col];
      newGrid[row][col] = 0;
      isRuleViolation = !isValid(newGrid, row, col, num);
      newGrid[row][col] = originalValue;
    }

    newGrid[row][col] = num;
    setGrid(newGrid);

    const key = `${row}-${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }

    // Update highlighted number to match the newly placed number
    if (num !== 0) {
      setHighlightedNumber(num);
    } else {
      setHighlightedNumber(null);
    }

    // Handle feedback based on placement validity
    if (num !== 0 && isRuleViolation) {
      // Number violates Sudoku rules (duplicate in row/column/box)
      playSoundEffect('errorSound');
      setMistakesCount(mistakesCount + 1);
      Alert.alert('❌ Rule Violation', "This number conflicts with another in the same row, column, or box!");
    } else if (num !== 0) {
      // Valid placement according to Sudoku rules
      // This includes forced forks (alternative valid solutions) - NOT counted as mistakes
      playSoundEffect('numberPlace');
    }

    checkCompletion(newGrid);
  };

  const checkCompletion = async (currentGrid: number[][]) => {
    // Check if all cells are filled
    const allFilled = currentGrid.every(row =>
      row.every(cell => cell !== 0)
    );

    // Check if the board is a valid Sudoku solution
    const complete = allFilled && isCompleteBoardValid(currentGrid);

    if (complete) {
      setIsComplete(true);

      // Play completion sound
      playSoundEffect('puzzleComplete');

      // Save completion
      const state: GameState = {
        grid: currentGrid,
        hintsUsed,
        mistakesCount,
        elapsedTime,
        isComplete: true,
        notes,
        lastPlayed: todayDate,
      };
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(state));

      // Award coins for completion
      let coinReward = { total: 0, breakdown: { baseReward: 0, timeBonus: 0, hintPenalty: 0, mistakePenalty: 0, firstBonus: 0 } };
      try {
        coinReward = await awardPuzzleCompletion(todayDate, difficulty, elapsedTime, hintsUsed, mistakesCount);
        console.log('Coins awarded:', coinReward.total);
      } catch (error) {
        console.error('Error awarding coins:', error);
      }

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

      // Check if this difficulty is eligible for a boost ad
      let boostEligible = false;
      try {
        boostEligible = await isBoostEligible(difficulty);
      } catch (error) {
        console.error('Error checking boost eligibility:', error);
      }

      showCompletionScreen(coinReward, boostEligible);
    }
  };

  const showCompletionScreen = (
    coinReward: { total: number; breakdown: { baseReward: number; timeBonus: number; hintPenalty: number; mistakePenalty: number; firstBonus: number } },
    boostEligible: boolean
  ) => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    const difficultyEmoji = {
      easy: '🟢',
      medium: '🟡',
      hard: '🟠',
      expert: '🔴',
    };

    let rewardText = `\n\n🪙 +${coinReward.total} coins earned!`;
    if (coinReward.breakdown.timeBonus > 0) {
      rewardText += `\n   ⚡ Time bonus: +${coinReward.breakdown.timeBonus}`;
    }
    if (coinReward.breakdown.firstBonus > 0) {
      rewardText += `\n   ⭐ First clear: +${coinReward.breakdown.firstBonus}`;
    }
    if (coinReward.breakdown.hintPenalty > 0) {
      rewardText += `\n   💡 Hints used: -${coinReward.breakdown.hintPenalty}`;
    }
    if (coinReward.breakdown.mistakePenalty > 0) {
      rewardText += `\n   ❌ Mistakes: -${coinReward.breakdown.mistakePenalty}`;
    }

    const shareText = `Sudokle ${todayDate}\n${difficultyEmoji[difficulty]} ${difficulty.toUpperCase()}\n⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}\n💡 ${hintsUsed} hints\n❌ ${mistakesCount} mistakes${rewardText}`;

    Alert.alert(
      '🎉 Daily Puzzle Complete!',
      shareText + '\n\nCome back tomorrow for a new puzzle!',
      [
        {
          text: 'OK',
          onPress: () => {
            if (boostEligible) {
              showBoostOfferPopup(coinReward.total);
            }
          },
        },
      ]
    );
  };

  const showBoostOfferPopup = (baseTotal: number) => {
    const bonusAmount = calculateBoostBonus(baseTotal);

    Alert.alert(
      '🚀 Bonus Opportunity!',
      `Watch a short ad to earn 20% more coins!\n\n+${bonusAmount} bonus coins`,
      [
        {
          text: 'No Thanks',
          style: 'cancel',
          onPress: async () => {
            await markBoostUsed(difficulty);
          },
        },
        {
          text: 'Watch Ad',
          onPress: async () => {
            await markBoostUsed(difficulty);
            const rewarded = await showBoostAd();
            if (rewarded) {
              await awardBoostBonus(bonusAmount);
              Alert.alert(
                '🎉 Bonus Earned!',
                `+${bonusAmount} bonus coins added!\n\n🪙 Total coins from this puzzle: ${baseTotal + bonusAmount}`
              );
            }
          },
        },
      ]
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

    // Highlight all instances of the hint number
    setHighlightedNumber(solution[row][col]);

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

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(savedScale.value + 0.2, 2.0);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    const newScale = Math.max(savedScale.value - 0.2, 0.7);
    scale.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const handleZoomReset = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Pan gesture for moving around when zoomed
  const panGesture = Gesture.Pan()
    .enabled(!settings.boardLocked)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .enabled(!settings.boardLocked)
    .onUpdate((event) => {
      scale.value = Math.max(0.7, Math.min(savedScale.value * event.scale, 2.0));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Combine gestures to allow both pan and pinch simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Determine if a cell is in an alternating 3x3 block (checkerboard pattern)
  const isAlternatingBlock = (row: number, col: number) => {
    const blockRow = Math.floor(row / 3);
    const blockCol = Math.floor(col / 3);
    // Checkerboard pattern: (0,0), (0,2), (1,1), (2,0), (2,2) are alternating
    return (blockRow + blockCol) % 2 === 1;
  };

  const getCellStyle = (row: number, col: number) => {
    const isOriginal = original[row][col] !== 0;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;

    // Check if this cell violates Sudoku rules (creates duplicates)
    const cellValue = grid[row][col];
    let isWrong = false;
    if (cellValue !== 0) {
      // Check for duplicates in the same row
      for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === cellValue) {
          isWrong = true;
          break;
        }
      }
      // Check for duplicates in the same column
      if (!isWrong) {
        for (let r = 0; r < 9; r++) {
          if (r !== row && grid[r][col] === cellValue) {
            isWrong = true;
            break;
          }
        }
      }
      // Check for duplicates in the same 3x3 box
      if (!isWrong) {
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && grid[r][c] === cellValue) {
              isWrong = true;
              break;
            }
          }
          if (isWrong) break;
        }
      }
    }

    const isHighlighted = highlightedNumber !== null && grid[row][col] === highlightedNumber;
    const isAlt = isAlternatingBlock(row, col);

    // Check if cell is in same row, column, or box as selected cell
    const isInSelectedRow = selectedCell && selectedCell.row === row && !isSelected;
    const isInSelectedCol = selectedCell && selectedCell.col === col && !isSelected;
    const isInSelectedBox = selectedCell &&
      Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3) &&
      !isSelected;

    // Get the appropriate background color based on state
    let backgroundColor = isAlt ? theme.colors.cellBackgroundAlt : theme.colors.cellBackground;
    if (isOriginal) {
      backgroundColor = isAlt ? theme.colors.cellOriginalAlt : theme.colors.cellOriginal;
    }

    // Apply row/column/box highlighting (lighter than selected cell)
    if (isInSelectedRow || isInSelectedCol || isInSelectedBox) {
      // Theme-aware highlight colors for row/column/box
      backgroundColor = theme.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
    }

    // Number highlighting (when same number is in different cells)
    if (isHighlighted && !isSelected) {
      backgroundColor = theme.colors.cellHighlighted;
    }

    // Selected cell gets priority
    if (isSelected) {
      backgroundColor = theme.colors.cellSelected;
    }

    // Wrong cells get highest priority
    if (isWrong) {
      backgroundColor = theme.colors.cellWrong;
    }

    return [
      styles.cell,
      { backgroundColor },
      { borderColor: theme.colors.cellBorder },
      (col + 1) % 3 === 0 && col < 8 && [styles.cellRightBorder, { borderRightColor: theme.colors.gridBorder }],
      (row + 1) % 3 === 0 && row < 8 && [styles.cellBottomBorder, { borderBottomColor: theme.colors.gridBorder }],
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
    const isOriginalCell = original[row][col] !== 0;

    return (
      <TouchableOpacity
        key={key}
        style={getCellStyle(row, col)}
        onPress={() => handleCellPress(row, col)}
        disabled={isComplete}
      >
        {value !== 0 ? (
          <Text
            style={[
              styles.cellText,
              { color: isOriginalCell ? theme.colors.textOriginal : theme.colors.textUser }
            ]}
            allowFontScaling={false}
          >
            {isPaused ? '' : value}
          </Text>
        ) : cellNotes.length > 0 && !isPaused ? (
          <View style={styles.notesContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Text key={num} style={[styles.noteText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
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
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
          Loading today's puzzle...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
      {/* Header with Date and Coins */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>SUDOKLE</Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>{todayDate}</Text>
        </View>
        <View style={[styles.coinDisplay, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7' }]}>
          <Text style={[styles.coinText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} maxFontSizeMultiplier={1.2}>🪙 {coins}</Text>
        </View>
      </View>
      {isComplete && (
        <View style={styles.completedBadgeContainer}>
          <Text style={[styles.completedBadge, { color: theme.colors.success }]} maxFontSizeMultiplier={1.2}>✅ Completed!</Text>
        </View>
      )}

      {/* Game Info Card - Grouped difficulty, timer, hints */}
      <View style={[styles.gameInfoCard, { backgroundColor: theme.colors.cardBackground }]}>
        {/* Difficulty Tabs */}
        <View style={styles.difficultyTabs}>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(diff => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.difficultyTab,
                { backgroundColor: theme.isDark ? '#27272A' : '#F3F4F6' },
                difficulty === diff && {
                  backgroundColor: DIFFICULTY_CONFIG[diff].color,
                }
              ]}
              onPress={() => {
                playSoundEffect('buttonClick');
                setDifficulty(diff);
              }}
            >
              <Text
                style={[
                  styles.difficultyTabText,
                  { color: theme.colors.textSecondary },
                  difficulty === diff && styles.difficultyTabTextActive
                ]}
                allowFontScaling={false}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.isDark ? '#3F3F46' : '#E5E7EB' }]} />

        {/* Timer, Hints, and Mistakes Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon} allowFontScaling={false}>⏱️</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Time</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]} allowFontScaling={false}>{formatTime(elapsedTime)}</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon} allowFontScaling={false}>💡</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Hints</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
                {hintsUsed}/{DIFFICULTY_CONFIG[difficulty].maxHints}
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon} allowFontScaling={false}>❌</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Mistakes</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
                {mistakesCount}
              </Text>
            </View>
          </View>

          {!isComplete && (
            <TouchableOpacity
              style={[styles.pauseButton, { backgroundColor: theme.isDark ? '#27272A' : '#F3F4F6' }]}
              onPress={togglePause}
            >
              <Text style={styles.pauseButtonText} allowFontScaling={false}>{isPaused ? '▶️' : '⏸️'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText} maxFontSizeMultiplier={1.2}>PAUSED</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
            <Text style={styles.resumeButtonText} maxFontSizeMultiplier={1.2}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }, settings.boardLocked && { backgroundColor: theme.isDark ? '#27272A' : '#D1D5DB' }]}
          onPress={handleZoomOut}
          disabled={settings.boardLocked}
        >
          <Text style={[styles.zoomButtonText, { color: theme.colors.secondaryButtonText }, settings.boardLocked && { color: theme.colors.textSecondary }]} allowFontScaling={false}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }, settings.boardLocked && { backgroundColor: theme.isDark ? '#27272A' : '#D1D5DB' }]}
          onPress={handleZoomReset}
          disabled={settings.boardLocked}
        >
          <Text style={[styles.zoomResetText, { color: theme.colors.secondaryButtonText }, settings.boardLocked && { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            {settings.boardLocked ? '🔒' : 'Reset'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }, settings.boardLocked && { backgroundColor: theme.isDark ? '#27272A' : '#D1D5DB' }]}
          onPress={handleZoomIn}
          disabled={settings.boardLocked}
        >
          <Text style={[styles.zoomButtonText, { color: theme.colors.secondaryButtonText }, settings.boardLocked && { color: theme.colors.textSecondary }]} allowFontScaling={false}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Grid with Pinch-to-Zoom and Pan */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.gridContainer, animatedStyle]}>
          <View style={[styles.grid, { borderColor: theme.colors.gridBorder }]}>
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
              </View>
            ))}
          </View>
        </Animated.View>
      </GestureDetector>

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
                    allowFontScaling={false}
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
              style={[styles.actionButton, { backgroundColor: theme.colors.secondaryButton }, noteMode && { backgroundColor: theme.colors.noteButton }]}
              onPress={() => setNoteMode(!noteMode)}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>
                {noteMode ? '📝 ON' : '📝 Notes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.hintButton }]}
              onPress={useHint}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>💡 Hint</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.clearButton }]}
              onPress={() => handleNumberPress(0)}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>Clear</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isComplete && (
        <View style={[styles.completedContainer, { backgroundColor: theme.isDark ? '#052e16' : '#F0FDF4' }]}>
          <Text style={[styles.completedText, { color: theme.colors.success }]} maxFontSizeMultiplier={1.2}>
            🎉 Come back tomorrow for a new puzzle!
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
    </GestureHandlerRootView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  date: {
    fontSize: 13,
    marginTop: 2,
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadgeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  completedBadge: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  gameInfoCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  difficultyTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  difficultyTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyTabTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 18,
  },
  statInfo: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  pauseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pauseButtonText: {
    fontSize: 18,
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
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  zoomButton: {
    width: 50,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  zoomResetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  grid: {
    alignSelf: 'center',
    borderWidth: 3,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellRightBorder: {
    borderRightWidth: 2,
  },
  cellBottomBorder: {
    borderBottomWidth: 2,
  },
  cellText: {
    fontSize: 24,
    fontWeight: '600',
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
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 15,
  },
  numberButton: {
    width: (width - 92) / 9,
    height: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  numberButtonText: {
    fontSize: 26,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  completedContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SudokuGrid;