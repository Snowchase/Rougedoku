import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormattedStats } from '../services/statsService';

interface StatsDisplayProps {
  stats: FormattedStats;
  theme: any;
}

export default function StatsDisplay({ stats, theme }: StatsDisplayProps) {
  return (
    <View style={styles.container}>
      {/* Run Records */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🗺️ Run Records
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primaryButton }]}>
              {stats.maxFloorReached}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Best Floor
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.difficultyMedium }]}>
              {stats.runsCompleted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Runs Won
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {stats.runsAttempted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Runs
            </Text>
          </View>
        </View>
      </View>

      {/* Overall Stats */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          📊 Overall Stats
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primaryButton }]}>
              {stats.totalFloorsCleared}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Floors Cleared
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.difficultyHard }]}>
              {stats.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Win Rate
            </Text>
          </View>
        </View>
      </View>

      {/* Coins & Mistakes */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🪙 Economy
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.totalCoinsEarned}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Coins Earned
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.difficultyHard }]}>
              {stats.totalMistakes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Mistakes
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
