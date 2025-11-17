import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';
import SudokuGrid from '../../components/SudokuGrid';

export default function PlayScreen() {
  const { playMusic, stopMusic } = useAudio();

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
    <View style={styles.container}>
      <SudokuGrid difficulty="medium" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
