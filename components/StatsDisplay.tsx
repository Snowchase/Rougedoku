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
      {/* Streak Section */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🔥 Streaks
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primaryButton }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Current Streak
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.difficultyHard }]}>
              {stats.bestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Best Streak
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
              {stats.totalSolved}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Solved
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.difficultyMedium }]}>
              {stats.winRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Win Rate
            </Text>
          </View>
        </View>
      </View>

      {/* Average Times by Difficulty */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          ⏱️ Average Times
        </Text>
        <View style={styles.difficultyRow}>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyEasy }]}>
              <Text style={styles.difficultyText}>Easy</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.averageTimeEasy}
            </Text>
          </View>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyMedium }]}>
              <Text style={styles.difficultyText}>Medium</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.averageTimeMedium}
            </Text>
          </View>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyHard }]}>
              <Text style={styles.difficultyText}>Hard</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.averageTimeHard}
            </Text>
          </View>
        </View>
      </View>

      {/* Best Times by Difficulty */}
      <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🏆 Best Times
        </Text>
        <View style={styles.difficultyRow}>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyEasy }]}>
              <Text style={styles.difficultyText}>Easy</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.bestTimeEasy}
            </Text>
          </View>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyMedium }]}>
              <Text style={styles.difficultyText}>Medium</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.bestTimeMedium}
            </Text>
          </View>
          <View style={styles.difficultyItem}>
            <View style={[styles.difficultyBadge, { backgroundColor: theme.colors.difficultyHard }]}>
              <Text style={styles.difficultyText}>Hard</Text>
            </View>
            <Text style={[styles.timeValue, { color: theme.colors.textPrimary }]}>
              {stats.bestTimeHard}
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
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyItem: {
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
