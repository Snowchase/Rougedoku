import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import SudokuGrid from '../../components/SudokuGrid';
import { NavigationHeader } from '../../components/navigation-header';
import { SwipeableScreen } from '../../components/SwipeableScreen';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';

export default function PlayScreen() {
  const { playSelectedSong, stopMusic } = useAudio();
  const { theme } = useTheme();
  const { selectedSong } = useCurrency();

  // Play selected song (or default gameplay music) when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      // Start playing selected song (or fall back to gameplay music) with fade in
      playSelectedSong(selectedSong, 'gameplayMusic', 1500);

      return () => {
        // Fade out music when leaving screen
        stopMusic(800);
      };
    }, [selectedSong])
  );

  return (
    <ScreenErrorBoundary screenName="Play">
      <SwipeableScreen>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <NavigationHeader title="Daily Puzzle" />
          <SudokuGrid difficulty="medium" />
        </View>
      </SwipeableScreen>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
