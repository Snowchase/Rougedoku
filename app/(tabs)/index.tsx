import React from 'react';
import { View, StyleSheet } from 'react-native';
import SudokuGrid from '../../components/SudokuGrid';

export default function HomeScreen() {
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