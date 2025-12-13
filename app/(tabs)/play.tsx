import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../contexts/ThemeContext';
import SudokuGrid from '../../components/SudokuGrid';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';

export default function PlayScreen() {
  const { playMusic, stopMusic } = useAudio();
  const { theme } = useTheme();

  // Play gameplay music when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      // Start playing gameplay music with fade in
      playMusic('gameplayMusic', 1500);

      return () => {
        // Fade out music when leaving screen
        stopMusic(800);
      };
    }, [])
  );

  return (
    <SwipeableScreen>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <NavigationHeader title="Daily Puzzle" />
        <SudokuGrid difficulty="medium" />
      </View>
    </SwipeableScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
