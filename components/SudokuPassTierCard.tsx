import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SudokuPassTier } from '../services/sudokuPassService';

interface Props {
  tier: SudokuPassTier;
  status: 'locked' | 'current' | 'unlocked';
  progress?: number; // 0.0–1.0, only relevant for 'current' status
  themeColors: {
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
    primaryButton: string;
    primaryButtonText: string;
    success: string;
  };
}

export default function SudokuPassTierCard({ tier, status, progress = 0, themeColors }: Props) {
  const isUnlocked = status === 'unlocked';
  const isCurrent = status === 'current';

  return (
    <View style={[
      styles.card,
      { backgroundColor: themeColors.cardBackground },
      isUnlocked && { borderColor: themeColors.success, borderWidth: 2 },
      isCurrent && { borderColor: themeColors.primaryButton, borderWidth: 2 },
    ]}>
      {/* Tier number badge */}
      <View style={[
        styles.tierBadge,
        { backgroundColor: isUnlocked ? themeColors.success : isCurrent ? themeColors.primaryButton : '#6B7280' },
      ]}>
        <Text style={styles.tierNumber}>{tier.tier}</Text>
      </View>

      {/* Reward icon */}
      <Text style={styles.rewardEmoji}>{tier.reward.emoji}</Text>

      {/* Reward label */}
      <Text
        style={[styles.rewardLabel, { color: themeColors.textPrimary }]}
        numberOfLines={2}
      >
        {tier.reward.label}
      </Text>

      {/* XP requirement */}
      <Text style={[styles.xpText, { color: themeColors.textSecondary }]}>
        {tier.xpRequired} XP
      </Text>

      {/* Progress bar (current tier only) */}
      {isCurrent && (
        <View style={[styles.progressTrack, { backgroundColor: '#E5E7EB' }]}>
          <View style={[
            styles.progressFill,
            { backgroundColor: themeColors.primaryButton, width: `${Math.round(progress * 100)}%` },
          ]} />
        </View>
      )}

      {/* Unlocked checkmark */}
      {isUnlocked && (
        <Text style={[styles.checkmark, { color: themeColors.success }]}>✓</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    minHeight: 140,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tierNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rewardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  xpText: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
});
