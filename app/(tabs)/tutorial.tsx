import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudio } from '../../contexts/AudioContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { NavigationHeader } from '../../components/navigation-header';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';

const { width } = Dimensions.get('window');
const GRID_SIZE = 9;
const CELL_SIZE = Math.min((width - 40) / GRID_SIZE, 45);

// Simple tutorial puzzle (partially filled, easy to understand)
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

const TUTORIAL_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

interface TutorialStep {
  title: string;
  description: string;
  targetCell?: { row: number; col: number };
  expectedNumber?: number;
  highlightRow?: number;
  highlightCol?: number;
  highlightBox?: number;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Sudoku!',
    description: 'The goal is to fill the 9×9 grid so that each row, column, and 3×3 box contains the digits 1-9 without repetition.',
  },
  {
    title: 'The Rules',
    description: 'Each row must contain all numbers 1-9. Each column must contain all numbers 1-9. Each 3×3 box must contain all numbers 1-9.',
  },
  {
    title: 'Finding a Number',
    description: 'Look at row 1. It has: 5, 3, 7. It\'s missing 1, 2, 4, 6, 8, 9. Let\'s find where they go!',
    highlightRow: 0,
  },
  {
    title: 'Check the Column',
    description: 'For the empty cell at row 1, column 3 (highlighted), check what numbers are already in that column.',
    targetCell: { row: 0, col: 2 },
    highlightCol: 2,
  },
  {
    title: 'Check the Box',
    description: 'Also check the top-left 3×3 box. This cell is in that box, so it can\'t repeat any number from that box.',
    targetCell: { row: 0, col: 2 },
    highlightBox: 0,
  },
  {
    title: 'Your Turn!',
    description: 'Tap the highlighted cell at row 1, column 3. The answer is 4! Column 3 has 8, 6, 1, 7, 5 already, and the box has 5, 3, 6, 9, 8. So 4 is the only number that fits!',
    targetCell: { row: 0, col: 2 },
    expectedNumber: 4,
  },
  {
    title: 'Great Job!',
    description: 'You just placed your first number! Continue practicing these same steps: check the row, column, and box to find which number fits.',
  },
  {
    title: 'Try Another One',
    description: 'Let\'s try row 1, column 4. Looking at row 1, column 4, and the top-middle box, what number fits? The answer is 6!',
    targetCell: { row: 0, col: 3 },
    expectedNumber: 6,
  },
  {
    title: 'Tutorial Complete!',
    description: 'You now know the basics of Sudoku! Keep practicing by looking at rows, columns, and boxes to find the right numbers. Return to the menu to play daily puzzles!',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { playSoundEffect, playSelectedSong, stopMusic } = useAudio();
  const { selectedSong } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<number[][]>(
    TUTORIAL_PUZZLE.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const step = TUTORIAL_STEPS[currentStep];

  // Play selected song (or default home music) when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      console.log('[TUTORIAL] useFocusEffect MOUNT - selectedSong:', selectedSong);

      // Start playing selected song (or fall back to home music) with fade in
      playSelectedSong(selectedSong, 'homeMusic', 1500).catch(err => {
        console.error('[TUTORIAL] Error starting music:', err);
      });

      return () => {
        isMounted = false;
        console.log('[TUTORIAL] useFocusEffect CLEANUP - calling stopMusic');
        // Stop music when leaving screen
        stopMusic(800).catch(err => {
          console.error('[TUTORIAL] Error stopping music:', err);
        });
      };
    }, [selectedSong, playSelectedSong, stopMusic])
  );

  const handleCellPress = (row: number, col: number) => {
    // Only allow selecting empty cells or target cells
    if (TUTORIAL_PUZZLE[row][col] !== 0) return;

    setSelectedCell({ row, col });
    playSoundEffect('tap');
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    // Check if this is the expected move in the tutorial
    if (step.expectedNumber) {
      if (num === step.expectedNumber && row === step.targetCell?.row && col === step.targetCell?.col) {
        // Correct answer!
        const newGrid = grid.map((r) => [...r]);
        newGrid[row][col] = num;
        setGrid(newGrid);
        playSoundEffect('success');

        // Move to next step after a short delay
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setSelectedCell(null);
          setShowInstructions(true);
        }, 500);
      } else {
        // Wrong answer
        playSoundEffect('error');
      }
    } else {
      // Free play mode (after tutorial steps)
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = num;
      setGrid(newGrid);
      playSoundEffect('tap');
    }
  };

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedCell(null);
    } else {
      // Tutorial complete, return to home
      router.push('/');
    }
  };

  const getCellBackground = (row: number, col: number) => {
    // Highlight target cell
    if (step.targetCell && row === step.targetCell.row && col === step.targetCell.col) {
      return '#FFD700'; // Gold highlight
    }

    // Highlight row
    if (step.highlightRow !== undefined && row === step.highlightRow) {
      return theme.isDark ? '#4A5568' : '#E2E8F0';
    }

    // Highlight column
    if (step.highlightCol !== undefined && col === step.highlightCol) {
      return theme.isDark ? '#4A5568' : '#E2E8F0';
    }

    // Highlight box
    if (step.highlightBox !== undefined) {
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);
      const boxIndex = boxRow * 3 + boxCol;
      if (boxIndex === step.highlightBox) {
        return theme.isDark ? '#4A5568' : '#E2E8F0';
      }
    }

    // Selected cell
    if (selectedCell && row === selectedCell.row && col === selectedCell.col) {
      return theme.colors.primaryButton + '40';
    }

    // Default background
    return theme.colors.cellBackground;
  };

  const getCellBorderColor = (row: number, col: number) => {
    if (step.targetCell && row === step.targetCell.row && col === step.targetCell.col) {
      return '#FFA500'; // Orange border for target
    }
    return theme.colors.gridLine;
  };

  return (
    <ScreenErrorBoundary screenName="Tutorial">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <NavigationHeader title="Tutorial" showBackButton onBackPress={() => router.push('/')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: theme.colors.textPrimary }]}>
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

        {/* Instructions Card */}
        {showInstructions && (
          <View style={[styles.instructionCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.instructionTitle, { color: theme.colors.textPrimary }]}>
              {step.title}
            </Text>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              {step.description}
            </Text>
            {!step.expectedNumber && (
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: '#8B5CF6' }]}
                onPress={nextStep}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish Tutorial' : 'Next'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sudoku Grid */}
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

        {/* Number Pad */}
        {step.expectedNumber && selectedCell && (
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

        {/* Legend */}
        <View style={[styles.legendCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.legendTitle, { color: theme.colors.textPrimary }]}>Legend:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#FFD700' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Target cell to fill
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: theme.isDark ? '#4A5568' : '#E2E8F0' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
              Highlighted area (row/column/box)
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  instructionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  nextButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    borderRadius: 8,
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
    fontSize: 20,
  },
  numberPad: {
    marginBottom: 16,
  },
  numberPadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  legendCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
  },
});
