import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudio } from '../../contexts/AudioContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';
import { TILE_ICONS, TILE_DESCRIPTIONS, type TileType } from '../../constants/runConfig';

const { width } = Dimensions.get('window');
const GRID_SIZE = 9;
const CELL_SIZE = Math.min((width - 40) / GRID_SIZE, 45);

const TUTORIAL_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const TILE_LEGEND: { type: TileType; label: string }[] = [
  { type: 'gold',       label: 'Gold — +coins when filled correctly' },
  { type: 'cursed',     label: 'Cursed — lose an extra life if filled wrong' },
  { type: 'shield',     label: 'Shield — restore 1 life when filled correctly' },
  { type: 'hint',       label: 'Hint — auto-reveals a nearby empty cell' },
  { type: 'fragile',    label: 'Fragile — cannot be erased once a number is placed' },
  { type: 'multiplier', label: 'Multiplier — boosts floor reward if all solved correctly' },
  { type: 'bonus',      label: 'Bonus — flat coin bonus when filled correctly' },
];

interface TutorialStep {
  title: string;
  description: string;
  targetCell?: { row: number; col: number };
  expectedNumber?: number;
  highlightRow?: number;
  showTileLegend?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Rougedoku!',
    description:
      'A roguelike sudoku adventure. Clear each floor\'s puzzle to advance deeper into the dungeon. Lives are precious — lose them all and your run ends.',
  },
  {
    title: 'The Rules',
    description:
      'Fill the 9×9 grid so every row, column, and 3×3 box contains the digits 1–9 with no repeats. Each puzzle has exactly one solution.',
  },
  {
    title: 'Finding a Number',
    description:
      'Look at row 1 — it has 5, 3, and 7. Each missing digit must go somewhere in this row, but only one position per cell fits all three constraints: its row, column, and box.',
    highlightRow: 0,
  },
  {
    title: 'Your Turn!',
    description:
      'Tap the highlighted cell (row 1, column 3). Column 3 already has 8, 6, 1, 7, 5. The top-left box has 5, 3, 6, 9, 8. The only digit that fits is 4!',
    targetCell: { row: 0, col: 2 },
    expectedNumber: 4,
  },
  {
    title: 'Lives & Mistakes',
    description:
      'You start each run with 3 lives ❤️❤️❤️. Every wrong number placed costs 1 life. Lose all your lives and the run is over — no second chances within a run.',
  },
  {
    title: 'Tile Modifiers',
    description:
      'Some cells have special tiles that trigger when filled. Look for icons in the corner of cells — they can help or hurt you.',
    showTileLegend: true,
  },
  {
    title: 'Floor Modifiers',
    description:
      'Each floor may have a special rule shown in a banner at the top:\n\n⚔️ Double Edge — mistakes cost 2 lives\n🌫 Fog of War — numbers only visible near selected cell\n⚡ Speed Bonus — +100 coins for clearing in under 4 minutes\n🔩 Iron — zero mistakes allowed this floor',
  },
  {
    title: 'Upgrades',
    description:
      'After clearing each floor you choose one upgrade to carry forward. Upgrades stack and can combine in powerful ways — a run with Alchemist + Gambler + Scholar plays very differently to one without.',
  },
  {
    title: 'Ready to Conquer!',
    description:
      'Clear all 20 floors to complete a run. Boss floors (5, 10, 15, 20) have tougher tile distributions. Use hints wisely — you only get a limited supply per run.\n\nGood luck! Can you Conquer the doku?',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { playSoundEffect, playSelectedSong, stopMusic } = useAudio();
  const { selectedSong, loading } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<number[][]>(
    TUTORIAL_PUZZLE.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  useFocusEffect(
    React.useCallback(() => {
      if (loading) return;
      playSelectedSong(selectedSong, 'homeMusic', 1500).catch(() => {});
      return () => {
        stopMusic(800).catch(() => {});
      };
    }, [selectedSong, loading, playSelectedSong, stopMusic])
  );

  const handleCellPress = (row: number, col: number) => {
    if (TUTORIAL_PUZZLE[row][col] !== 0) return;
    setSelectedCell({ row, col });
    playSoundEffect('tap');
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell || !step.expectedNumber) return;
    const { row, col } = selectedCell;
    if (num === step.expectedNumber && row === step.targetCell?.row && col === step.targetCell?.col) {
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = num;
      setGrid(newGrid);
      playSoundEffect('success');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setSelectedCell(null);
      }, 500);
    } else {
      playSoundEffect('error');
    }
  };

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
      setSelectedCell(null);
    } else {
      router.replace('/(tabs)');
    }
  };

  const getCellBackground = (row: number, col: number) => {
    if (step.targetCell && row === step.targetCell.row && col === step.targetCell.col) {
      return '#FFD700';
    }
    if (step.highlightRow !== undefined && row === step.highlightRow) {
      return theme.isDark ? '#4A5568' : '#E2E8F0';
    }
    if (selectedCell && row === selectedCell.row && col === selectedCell.col) {
      return theme.colors.primaryButton + '40';
    }
    return theme.colors.cellBackground;
  };

  const getCellBorderColor = (row: number, col: number) => {
    if (step.targetCell && row === step.targetCell.row && col === step.targetCell.col) {
      return '#FFA500';
    }
    return theme.colors.gridLine;
  };

  const showGrid = currentStep >= 2 && currentStep <= 3;
  const showNumberPad = !!step.expectedNumber && !!selectedCell;

  return (
    <ScreenErrorBoundary screenName="Tutorial">
      <SwipeableScreen>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <NavigationHeader title="Tutorial" showBackButton onBackPress={() => router.replace('/(tabs)')} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.cellBackground }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: '#8B5CF6',
                      width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Instruction Card */}
            <View style={[styles.instructionCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={[styles.instructionTitle, { color: theme.colors.textPrimary }]}>
                {step.title}
              </Text>
              <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
                {step.description}
              </Text>

              {/* Tile Legend (step 6 only) */}
              {step.showTileLegend && (
                <View style={styles.tileLegend}>
                  {TILE_LEGEND.map(({ type, label }) => (
                    <View key={type} style={[styles.tileRow, { borderColor: theme.colors.cellBackground }]}>
                      <Text style={styles.tileIcon} allowFontScaling={false}>{TILE_ICONS[type]}</Text>
                      <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Next / Finish button (shown when no interaction required) */}
              {!step.expectedNumber && (
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: '#8B5CF6' }]}
                  onPress={nextStep}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? "Let's Go!" : 'Next'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sudoku Grid (shown for sudoku teaching steps only) */}
            {showGrid && (
              <View style={styles.gridContainer}>
                <View style={styles.grid}>
                  {grid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                      {row.map((cell, colIndex) => (
                        <TouchableOpacity
                          key={`${rowIndex}-${colIndex}`}
                          style={[
                            styles.cell,
                            {
                              width: CELL_SIZE,
                              height: CELL_SIZE,
                              backgroundColor: getCellBackground(rowIndex, colIndex),
                              borderColor: getCellBorderColor(rowIndex, colIndex),
                              borderRightWidth: (colIndex + 1) % 3 === 0 ? 2 : 0.5,
                              borderBottomWidth: (rowIndex + 1) % 3 === 0 ? 2 : 0.5,
                              borderLeftWidth: colIndex === 0 ? 2 : 0,
                              borderTopWidth: rowIndex === 0 ? 2 : 0,
                            },
                          ]}
                          onPress={() => handleCellPress(rowIndex, colIndex)}
                        >
                          {cell !== 0 && (
                            <Text
                              style={[
                                styles.cellText,
                                {
                                  color:
                                    TUTORIAL_PUZZLE[rowIndex][colIndex] !== 0
                                      ? theme.colors.textPrimary
                                      : theme.colors.primaryButton,
                                  fontWeight: TUTORIAL_PUZZLE[rowIndex][colIndex] !== 0 ? '600' : 'bold',
                                },
                              ]}
                            >
                              {cell}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Number Pad (interactive step only) */}
            {showNumberPad && (
              <View style={styles.numberPad}>
                <Text style={[styles.numberPadTitle, { color: theme.colors.textPrimary }]}>
                  Select a number:
                </Text>
                <View style={styles.numberRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.numberButton,
                        {
                          backgroundColor:
                            num === step.expectedNumber
                              ? theme.colors.primaryButton
                              : theme.colors.cellBackground,
                        },
                      ]}
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text
                        style={[
                          styles.numberButtonText,
                          {
                            color:
                              num === step.expectedNumber
                                ? '#FFFFFF'
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Grid hint for interactive step */}
            {step.expectedNumber && !selectedCell && (
              <View style={[styles.hintBanner, { backgroundColor: theme.colors.cardBackground }]}>
                <Text style={[styles.hintText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  👆 Tap the gold cell first, then choose the number.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SwipeableScreen>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  instructionCard: {
    padding: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 23,
  },
  tileLegend: {
    marginTop: 4,
    gap: 8,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  tileIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  tileLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  nextButton: {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    alignItems: 'center',
  },
  grid: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 18,
  },
  numberPad: {
    gap: 10,
  },
  numberPadTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  numberButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  hintBanner: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
