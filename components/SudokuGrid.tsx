import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
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
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { isValid, isCompleteBoardValid } from '../services/puzzleGenerator';
import { initializeUser } from './friendService';
import { numberFonts } from '../constants/customizations';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useRun } from '../contexts/RunContext';
import {
  TILE_COLORS,
  TILE_ICONS,
  FLOOR_MODIFIER_INFO,
  type TileModifier,
  RUN_CONFIG,
  getScoreThreshold,
} from '../constants/runConfig';
import { ScoreBar } from './ScoreBar';
import { getFloorDifficulty } from '../services/puzzleGenerator';
import { addCoins } from '../services/currencyService';

const GRID_SIZE = 9;
const { width } = Dimensions.get('window');
const CELL_SIZE = Math.min((width - 40) / GRID_SIZE, 45);

const SudokuGrid = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { playSoundEffect } = useAudio();
  const { settings } = useSettings();
  const { coins, selectedFont, addBonusCoins } = useCurrency();
  const {
    activeRun,
    floorState,
    triggerTileEffect,
    recordMistake,
    useHint: runUseHint,
    completeFloor,
    selectUpgrade,
    failRun,
    updateFloorProgress,
    scoreSection,
    applyPerfectClearBonus,
  } = useRun();
  const activeFontStyle = (numberFonts.find(f => f.id === selectedFont) ?? numberFonts[0]).style;

  // ── Local puzzle state (synced from RunContext on load) ───────────────────
  const [grid, setGrid] = useState<number[][]>([]);
  const [original, setOriginal] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<{[key: string]: number[]}>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);

  // Track whether floor-clear flow is in progress (prevent double-trigger)
  const completionInProgress = useRef(false);

  // ── Derived from RunContext ────────────────────────────────────────────────
  const tileModifiers = floorState?.tileModifiers ?? {};
  const floorModifiers = floorState?.floorModifiers ?? [];
  const currentFloor = activeRun?.currentFloor ?? 1;
  const maxFloors = activeRun?.maxFloors ?? RUN_CONFIG.maxFloors;
  const livesRemaining = activeRun?.livesRemaining ?? RUN_CONFIG.startingLives;
  const maxLives = activeRun?.maxLives ?? RUN_CONFIG.startingLives;
  const hintsRemaining = activeRun?.hintsRemaining ?? 0;
  const difficulty = getFloorDifficulty(currentFloor);

  // ── Zoom and pan ──────────────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Count how many of each number (1-9) are in the grid
  const numberCounts = useMemo(() => {
    const counts: {[key: number]: number} = {};
    for (let num = 1; num <= 9; num++) counts[num] = 0;
    grid.forEach(row => row.forEach(cell => { if (cell !== 0) counts[cell]++; }));
    return counts;
  }, [grid]);

  // ── Initialize user on mount ──────────────────────────────────────────────
  useEffect(() => {
    initializeUser();
  }, []);

  // ── Load puzzle from RunContext.floorState ────────────────────────────────
  useEffect(() => {
    if (!floorState) return;
    setGrid(floorState.grid.map(r => [...r]));
    setOriginal(floorState.original.map(r => [...r]));
    setSolution(floorState.solution.map(r => [...r]));
    setNotes(floorState.notes ?? {});
    setElapsedTime(floorState.elapsedTime);
    setIsComplete(floorState.isComplete);
    setStartTime(Date.now() - floorState.elapsedTime * 1000);
    setSelectedCell(null);
    setNoteMode(false);
    setHighlightedNumber(null);
    completionInProgress.current = false;
  }, [floorState?.floor]); // Re-init only when the floor number changes

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isComplete || isPaused) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isComplete, isPaused]);

  // ── Reset board position when locked ─────────────────────────────────────
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

  // ── Auto-pause when app goes to background ────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (!isComplete && !isPaused) setIsPaused(true);
      }
    });
    return () => subscription.remove();
  }, [isComplete, isPaused]);

  // ── Persist grid progress to RunContext ───────────────────────────────────
  useEffect(() => {
    if (grid.length > 0 && !isComplete) {
      updateFloorProgress({ grid, notes, elapsedTime });
    }
  }, [grid, notes, elapsedTime]);

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

  const handleNumberPress = useCallback(async (num: number) => {
    if (!selectedCell) {
      Alert.alert('No cell selected', 'Please select an empty cell first');
      return;
    }

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    // Never modify original (given) cells
    if (original[row]?.[col] !== 0) return;

    // Fragile tile: block erasure once a number has been placed
    if (num === 0) {
      const mod = tileModifiers[key];
      if (mod?.type === 'fragile' && mod.triggered && grid[row][col] !== 0) {
        Alert.alert('🔒 Fragile', 'This cell is locked — it cannot be erased.');
        return;
      }
    }

    // Notes mode
    if (noteMode && num !== 0) {
      const cellNotes = notes[key] || [];
      const newNotes = { ...notes };
      newNotes[key] = cellNotes.includes(num)
        ? cellNotes.filter(n => n !== num)
        : [...cellNotes, num].sort();
      setNotes(newNotes);
      return;
    }

    const newGrid = grid.map(r => [...r]);

    // Validate placement
    let isRuleViolation = false;
    if (num !== 0) {
      const prev = newGrid[row][col];
      newGrid[row][col] = 0;
      isRuleViolation = !isValid(newGrid, row, col, num);
      newGrid[row][col] = prev;
    }

    newGrid[row][col] = num;
    setGrid(newGrid);

    // Clear notes for this cell when a number is placed
    if (num !== 0 && notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }

    if (num !== 0) {
      setHighlightedNumber(num);
    } else {
      setHighlightedNumber(null);
    }

    if (num !== 0 && isRuleViolation) {
      // Rule violation
      playSoundEffect('errorSound');

      const livesLost = await recordMistake();

      // Check iron floor modifier: any mistake fails the floor
      if (floorModifiers.includes('iron')) {
        await failRun();
        Alert.alert(
          '🔩 Iron — Run Failed',
          'No mistakes are allowed on this floor.',
          [{ text: 'OK', onPress: () => router.replace('/run-summary') }],
        );
        return;
      }

      // Check if lives ran out
      const newLives = livesRemaining - livesLost;
      if (newLives <= 0) {
        await failRun();
        Alert.alert(
          '💀 Run Over',
          'You ran out of lives!',
          [{ text: 'See Results', onPress: () => router.replace('/run-summary') }],
        );
        return;
      }

      if (livesLost > 0) {
        Alert.alert(
          '❌ Mistake',
          `${livesLost === 2 ? '⚔️ Double Edge: ' : ''}Lost ${livesLost} life${livesLost > 1 ? 's' : ''}. ${newLives} remaining.`,
        );
      }

      // Cursed tile: extra life already deducted via recordMistake → applyTileEffect chain
      // Just show the tile icon for the cursed cell
      await triggerTileEffect(key, false);
    } else if (num !== 0) {
      // Valid placement
      playSoundEffect('numberPlace');

      // Lock fragile tile immediately (triggered before further checks)
      if (tileModifiers[key]?.type === 'fragile' && !tileModifiers[key].triggered) {
        await triggerTileEffect(key, true);
      } else if (tileModifiers[key] && !tileModifiers[key].triggered) {
        const { event, revealCellKey } = await triggerTileEffect(key, true);

        // Hint tile auto-reveals a neighbour — update local grid
        if (revealCellKey && event?.effect === 'reveal_cell') {
          const [rr, rc] = revealCellKey.split('-').map(Number);
          // floorState grid already updated in RunContext; sync locally
          const revealed = solution[rr][rc];
          setGrid(prev => {
            const g = prev.map(r => [...r]);
            g[rr][rc] = revealed;
            return g;
          });
        }

        // Show brief tile event feedback
        if (event) {
          const tileLabel = TILE_ICONS[event.type] ?? '';
          if (event.effect === 'gain_life') {
            Alert.alert(`${tileLabel} Shield`, `+${event.value} life restored!`);
          }
          if (event.effect === 'gain_coins' && event.type === 'multiplier') {
            Alert.alert('⭐ Multiplier', `×${event.value} added! Mult is now ×${(floorState?.currentMult ?? 1)}`);
          }
        }
      }

      // Section scoring (row/col/box completions + comboist)
      await scoreSection(newGrid, row, col);

      checkCompletion(newGrid);
    }
  }, [
    selectedCell, original, tileModifiers, floorModifiers, noteMode, notes,
    grid, solution, isComplete, livesRemaining, recordMistake, triggerTileEffect,
    failRun, playSoundEffect, router, scoreSection, floorState,
  ]);

  const checkCompletion = useCallback(async (currentGrid: number[][]) => {
    if (isComplete || completionInProgress.current) return;

    const allFilled = currentGrid.every(row => row.every(cell => cell !== 0));
    const complete = allFilled && isCompleteBoardValid(currentGrid);
    if (!complete) return;

    completionInProgress.current = true;
    setIsComplete(true);
    playSoundEffect('puzzleComplete');

    try {
      // Completionist bonus: perfect clear adds 500 × mult before floor reward calc
      await applyPerfectClearBonus();

      const { reward, upgradeChoices } = await completeFloor();
      await addCoins(reward.total);

      const mins = Math.floor(elapsedTime / 60);
      const secs = elapsedTime % 60;
      const isLastFloor = currentFloor >= maxFloors;

      let rewardText = `Floor ${currentFloor} of ${maxFloors} complete!\n⏱️ ${mins}:${secs.toString().padStart(2, '0')}\n\n🪙 +${reward.total} coins`;
      if (reward.goldBonus > 0) rewardText += `\n   🪙 Gold tiles: +${reward.goldBonus}`;
      if (reward.scoreBonus > 0) rewardText += `\n   ⭐ Score bonus: +${reward.scoreBonus}`;
      if (reward.speedBonus > 0) rewardText += `\n   ⚡ Speed bonus: +${reward.speedBonus}`;

      const nextLabel = isLastFloor ? 'Finish' : (upgradeChoices.length > 0 ? 'Choose Upgrade' : 'Next Floor');

      Alert.alert(
        isLastFloor ? '🏆 Run Complete!' : '🎉 Floor Clear!',
        rewardText,
        [
          {
            text: nextLabel,
            onPress: () => {
              if (isLastFloor) {
                // selectUpgrade finalises the run as 'completed'
                selectUpgrade(null, reward.total).then(() => {
                  router.replace('/run-summary');
                });
              } else if (upgradeChoices.length > 0) {
                router.push({
                  pathname: '/upgrade-draft',
                  params: {
                    choices: JSON.stringify(upgradeChoices),
                    rewardCoins: String(reward.total),
                  },
                });
              } else {
                selectUpgrade(null, reward.total);
              }
            },
          },
        ],
      );
    } catch (err) {
      console.error('Error completing floor:', err);
    }
  }, [isComplete, elapsedTime, currentFloor, maxFloors, completeFloor, selectUpgrade, applyPerfectClearBonus, playSoundEffect, router]);

  const handleUseHint = useCallback(async () => {
    if (!selectedCell) {
      Alert.alert('Select a cell', 'Please select an empty cell first');
      return;
    }

    const { row, col } = selectedCell;

    if (original[row][col] !== 0) {
      Alert.alert('Cannot hint', 'This cell is already a given — no hint needed');
      return;
    }

    if (grid[row][col] !== 0) {
      Alert.alert('Cell filled', 'Clear the cell first to use a hint');
      return;
    }

    const granted = await runUseHint();
    if (!granted) {
      if (floorModifiers.includes('no_hints')) {
        Alert.alert('🚫 No Hints', 'The No Hints modifier is active this floor.');
      } else {
        Alert.alert('No hints left', 'You have no hints remaining in this run.');
      }
      return;
    }

    const hintValue = solution[row][col];
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = hintValue;
    setGrid(newGrid);

    const key = `${row}-${col}`;
    if (notes[key]) {
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);
    }

    setHighlightedNumber(hintValue);
  }, [selectedCell, original, grid, solution, notes, floorModifiers, runUseHint]);

  const togglePause = () => {
    if (!isPaused) {
      setIsPaused(true);
    } else {
      setStartTime(Date.now() - (elapsedTime * 1000));
      setIsPaused(false);
    }
  };

  const handleAdvanceEarly = useCallback(async () => {
    if (isComplete || completionInProgress.current) return;
    completionInProgress.current = true;
    setIsComplete(true);
    playSoundEffect('puzzleComplete');

    try {
      // No perfect-clear bonus for advance-early (board not fully solved)
      const { reward, upgradeChoices } = await completeFloor();
      await addCoins(reward.total);

      const isLastFloor = currentFloor >= maxFloors;
      let rewardText = `Advanced early on Floor ${currentFloor}!\n\n🪙 +${reward.total} coins`;
      if (reward.scoreBonus > 0) rewardText += `\n   ⭐ Score bonus: +${reward.scoreBonus}`;
      if (reward.goldBonus > 0) rewardText += `\n   🪙 Gold tiles: +${reward.goldBonus}`;
      if (reward.speedBonus > 0) rewardText += `\n   ⚡ Speed bonus: +${reward.speedBonus}`;

      const nextLabel = isLastFloor ? 'Finish' : (upgradeChoices.length > 0 ? 'Choose Upgrade' : 'Next Floor');
      Alert.alert(isLastFloor ? '🏆 Run Complete!' : '🎉 Advanced!', rewardText, [
        {
          text: nextLabel,
          onPress: () => {
            if (isLastFloor) {
              selectUpgrade(null, reward.total).then(() => router.replace('/run-summary'));
            } else if (upgradeChoices.length > 0) {
              router.push({
                pathname: '/upgrade-draft',
                params: { choices: JSON.stringify(upgradeChoices), rewardCoins: String(reward.total) },
              });
            } else {
              selectUpgrade(null, reward.total);
            }
          },
        },
      ]);
    } catch (err) {
      console.error('Error advancing early:', err);
    }
  }, [isComplete, currentFloor, maxFloors, completeFloor, selectUpgrade, playSoundEffect, router]);

  const handleResetPuzzle = () => {
    Alert.alert(
      'Restart Puzzle?',
      'This will clear all your filled numbers and notes. Your time will keep running.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: () => {
            setGrid(original.map(r => [...r]));
            setNotes({});
            setNoteMode(false);
            setSelectedCell(null);
            setHighlightedNumber(null);
            setIsComplete(false);
          },
        },
      ]
    );
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

    // ── Base background ──────────────────────────────────────────────────────
    let backgroundColor = isAlt ? theme.colors.cellBackgroundAlt : theme.colors.cellBackground;
    if (isOriginal) {
      backgroundColor = isAlt ? theme.colors.cellOriginalAlt : theme.colors.cellOriginal;
    }

    // ── Tile modifier tint (lowest priority, below all highlights) ───────────
    const modifier = !isOriginal ? tileModifiers[`${row}-${col}`] : undefined;
    if (modifier && !modifier.triggered) {
      backgroundColor = TILE_COLORS[modifier.type];
    }

    // ── Row/column/box highlight ─────────────────────────────────────────────
    if (isInSelectedRow || isInSelectedCol || isInSelectedBox) {
      backgroundColor = theme.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
    }

    // ── Number highlight ─────────────────────────────────────────────────────
    if (isHighlighted && !isSelected) {
      backgroundColor = theme.colors.cellHighlighted;
    }

    // ── Selected cell ────────────────────────────────────────────────────────
    if (isSelected) {
      backgroundColor = theme.colors.cellSelected;
    }

    // ── Wrong cells (highest priority) ───────────────────────────────────────
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
    const modifier: TileModifier | undefined = !isOriginalCell ? tileModifiers[key] : undefined;
    const hasFog = floorModifiers.includes('fog_of_war');

    // Fog of War: hide user-placed numbers that aren't in the selected row/col/box
    const isRelatedToSelected =
      selectedCell &&
      (selectedCell.row === row ||
       selectedCell.col === col ||
       (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
        Math.floor(selectedCell.col / 3) === Math.floor(col / 3)));
    const fogHidden = hasFog && !isOriginalCell && value !== 0 && !isRelatedToSelected && !isPaused;

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
              activeFontStyle,
              { color: isOriginalCell ? theme.colors.textOriginal : theme.colors.textUser },
            ]}
            allowFontScaling={false}
          >
            {isPaused ? '' : fogHidden ? '·' : value}
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

        {/* Tile modifier badge — shown in top-right corner of untriggered modifier cells */}
        {modifier && !modifier.triggered && !isPaused && (
          <Text style={styles.tileBadge} allowFontScaling={false}>
            {TILE_ICONS[modifier.type]}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (grid.length === 0 || !floorState) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
          Loading floor {currentFloor}...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
      {/* Header: Floor progress + coins */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
            Floor {currentFloor} <Text style={[styles.floorOf, { color: theme.colors.textSecondary }]}>/ {maxFloors}</Text>
          </Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </View>
        <View style={[styles.coinDisplay, { backgroundColor: theme.isDark ? '#422006' : '#FEF3C7' }]}>
          <Text style={[styles.coinText, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} maxFontSizeMultiplier={1.2}>🪙 {coins}</Text>
        </View>
      </View>

      {isComplete && (
        <View style={styles.completedBadgeContainer}>
          <Text style={[styles.completedBadge, { color: theme.colors.success }]} maxFontSizeMultiplier={1.2}>✅ Floor Complete!</Text>
        </View>
      )}

      {/* Floor modifier banner */}
      {floorModifiers.length > 0 && (
        <View style={[styles.modifierBanner, { backgroundColor: theme.isDark ? '#3F1A1A' : '#FEF2F2' }]}>
          {floorModifiers.map(mod => (
            <Text key={mod} style={[styles.modifierBannerText, { color: theme.isDark ? '#FCA5A5' : '#B91C1C' }]} allowFontScaling={false}>
              {FLOOR_MODIFIER_INFO[mod].icon} {FLOOR_MODIFIER_INFO[mod].name}
            </Text>
          ))}
        </View>
      )}

      {/* Game Info Card: lives, timer, hints */}
      <View style={[styles.gameInfoCard, { backgroundColor: theme.colors.cardBackground }]}>
        {/* Lives row */}
        <View style={styles.livesRow}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <Text key={i} style={styles.lifeIcon} allowFontScaling={false}>
              {i < livesRemaining ? '❤️' : '🖤'}
            </Text>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.isDark ? '#3F3F46' : '#E5E7EB' }]} />

        {/* Timer, Hints, Pause Row */}
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
              <Text style={[
                styles.statValue,
                { color: floorModifiers.includes('no_hints') ? '#9CA3AF' : theme.colors.textPrimary },
              ]} allowFontScaling={false}>
                {floorModifiers.includes('no_hints') ? '—' : hintsRemaining}
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon} allowFontScaling={false}>📍</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} allowFontScaling={false}>Floor</Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
                {currentFloor}/{maxFloors}
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

      {/* Score Bar */}
      {!isComplete && (
        <ScoreBar
          totalScore={floorState?.totalScore ?? 0}
          threshold={getScoreThreshold(currentFloor)}
          currentMult={floorState?.currentMult ?? 1}
          thresholdReached={floorState?.thresholdReached ?? false}
        />
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseText} maxFontSizeMultiplier={1.2}>PAUSED</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
            <Text style={styles.resumeButtonText} maxFontSizeMultiplier={1.2}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Zoom Controls — only shown when zoom/pan is enabled */}
      {!settings.boardLocked && (
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }]}
            onPress={handleZoomOut}
          >
            <Text style={[styles.zoomButtonText, { color: theme.colors.secondaryButtonText }]} allowFontScaling={false}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }]}
            onPress={handleZoomReset}
          >
            <Text style={[styles.zoomResetText, { color: theme.colors.secondaryButtonText }]} allowFontScaling={false}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.zoomButton, { backgroundColor: theme.colors.secondaryButton }]}
            onPress={handleZoomIn}
          >
            <Text style={[styles.zoomButtonText, { color: theme.colors.secondaryButtonText }]} allowFontScaling={false}>+</Text>
          </TouchableOpacity>
        </View>
      )}

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
          {/* Advance Early button — shown once score threshold is met */}
          {floorState?.thresholdReached && (
            <TouchableOpacity
              style={[styles.advanceButton, { backgroundColor: '#10B981' }]}
              onPress={handleAdvanceEarly}
              disabled={isPaused}
            >
              <Text style={styles.advanceButtonText} allowFontScaling={false}>
                ✓ Advance to Floor {currentFloor + 1}
              </Text>
            </TouchableOpacity>
          )}

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
              onPress={handleUseHint}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>💡 {hintsRemaining}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.clearButton }]}
              onPress={() => handleNumberPress(0)}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
              onPress={handleResetPuzzle}
              disabled={isPaused}
            >
              <Text style={styles.actionButtonText} allowFontScaling={false}>↺ Reset</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isComplete && (
        <View style={[styles.completedContainer, { backgroundColor: theme.isDark ? '#052e16' : '#F0FDF4' }]}>
          <Text style={[styles.completedText, { color: theme.colors.success }]} maxFontSizeMultiplier={1.2}>
            {currentFloor >= maxFloors ? '🏆 Run Complete!' : '🎉 Floor cleared — great work!'}
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
  // ── Roguelike additions ──────────────────────────────────────────────────
  floorOf: {
    fontSize: 20,
    fontWeight: '400',
  },
  modifierBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  modifierBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  livesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  lifeIcon: {
    fontSize: 20,
  },
  tileBadge: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 8,
    lineHeight: 10,
  },
  advanceButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SudokuGrid;