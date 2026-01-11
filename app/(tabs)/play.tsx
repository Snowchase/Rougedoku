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
  const { selectedSong, loading } = useCurrency();

  // Play selected song (or default gameplay music) when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      console.log('[PLAY] useFocusEffect MOUNT - selectedSong:', selectedSong, 'loading:', loading);

      // Wait for selectedSong to load from storage before playing music
      if (loading) {
        console.log('[PLAY] Still loading selectedSong, skipping music start');
        return;
      }

      // Start playing selected song (or fall back to gameplay music) with fade in
      // The audio manager now handles race conditions internally
      playSelectedSong(selectedSong, 'gameplayMusic', 1500).catch(err => {
        console.error('[PLAY] Error starting gameplay music:', err);
      });

      return () => {
        isMounted = false;
        console.log('[PLAY] useFocusEffect CLEANUP - calling stopMusic');
        // Stop music when leaving screen (audio manager queues this properly)
        stopMusic(800).catch(err => {
          console.error('[PLAY] Error stopping music:', err);
        });
      };
    }, [selectedSong, loading, playSelectedSong, stopMusic])
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
