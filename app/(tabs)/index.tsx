import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAudio } from '../../contexts/AudioContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { playMusic, stopMusic } = useAudio();

  // Play home music when screen is focused, stop when unfocused
  useFocusEffect(
    React.useCallback(() => {
      // Start playing home music with fade in
      playMusic('homeMusic', 1500);

      return () => {
        // Fade out music when leaving screen
        stopMusic(800);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Settings Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/(tabs)/settings')}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* App Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SUDOKLE</Text>
          <Text style={styles.subtitle}>Daily Sudoku Challenge</Text>
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.playButton]}
            onPress={() => router.push('/(tabs)/play')}
          >
            <Text style={styles.menuButtonIcon}>🎮</Text>
            <Text style={styles.menuButtonText}>Play</Text>
            <Text style={styles.menuButtonSubtext}>Solve today's puzzle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.leaderboardButton]}
            onPress={() => router.push('/(tabs)/leaderboards')}
          >
            <Text style={styles.menuButtonIcon}>🏆</Text>
            <Text style={styles.menuButtonText}>Leaderboards</Text>
            <Text style={styles.menuButtonSubtext}>Compare your times</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.friendsButton]}
            onPress={() => router.push('/(tabs)/friends')}
          >
            <Text style={styles.menuButtonIcon}>👥</Text>
            <Text style={styles.menuButtonText}>Friends</Text>
            <Text style={styles.menuButtonSubtext}>Manage your friends</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New puzzle every day at midnight!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
    letterSpacing: 1,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playButton: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  leaderboardButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  friendsButton: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  menuButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 28,
  },
});
