// ScoreBar.tsx
// Displays the current floor score progress toward the advance threshold.
// Shows: running total, score threshold, current multiplier badge, and a
// progress bar that turns green once the threshold is met.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ScoreBarProps {
  totalScore: number;
  threshold: number;
  currentMult: number;
  thresholdReached: boolean;
}

export function ScoreBar({
  totalScore,
  threshold,
  currentMult,
  thresholdReached,
}: ScoreBarProps) {
  const { theme } = useTheme();
  const progress = Math.min(totalScore / Math.max(threshold, 1), 1);
  const barColor = thresholdReached ? '#10B981' : '#8B5CF6';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            Score
          </Text>
          <Text style={[styles.scoreText, { color: thresholdReached ? '#10B981' : theme.colors.textPrimary }]} allowFontScaling={false}>
            {totalScore.toLocaleString()}
            <Text style={[styles.threshold, { color: theme.colors.textSecondary }]}>
              {' '}/ {threshold.toLocaleString()}
            </Text>
          </Text>
        </View>

        <View style={[styles.multBadge, { backgroundColor: barColor }]}>
          <Text style={styles.multText} allowFontScaling={false}>×{currentMult}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.barTrack, { backgroundColor: theme.isDark ? '#27272A' : '#E5E7EB' }]}>
        <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
      </View>

      {thresholdReached && (
        <Text style={styles.readyText} allowFontScaling={false}>
          ✓ Advance available!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 17,
    fontWeight: '700',
  },
  threshold: {
    fontSize: 13,
    fontWeight: '400',
  },
  multBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  multText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  readyText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
