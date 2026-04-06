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

  const badgeColor = isUnlocked ? themeColors.success : isCurrent ? themeColors.primaryButton : '#6B7280';

  return (
    <View style={[
      styles.card,
      { backgroundColor: themeColors.cardBackground },
      isUnlocked && { borderColor: themeColors.success, borderWidth: 2 },
      isCurrent && { borderColor: themeColors.primaryButton, borderWidth: 2 },
    ]}>
      {/* Left: Tier badge */}
      <View style={[styles.tierBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.tierNumber}>{tier.tier}</Text>
      </View>

      {/* Center: Emoji + label */}
      <View style={styles.centerContent}>
        <View style={styles.rewardRow}>
          <Text style={styles.rewardEmoji}>{tier.reward.emoji}</Text>
          <View style={styles.labelContainer}>
            <Text style={[styles.rewardLabel, { color: themeColors.textPrimary }]} numberOfLines={1}>
              {tier.reward.label}
            </Text>
            <Text style={[styles.xpText, { color: themeColors.textSecondary }]}>
              {tier.xpRequired} XP required
            </Text>
          </View>
        </View>

        {/* Progress bar (current tier only) */}
        {isCurrent && (
          <View style={[styles.progressTrack, { backgroundColor: '#E5E7EB' }]}>
            <View style={[
              styles.progressFill,
              { backgroundColor: themeColors.primaryButton, width: `${Math.round(progress * 100)}%` },
            ]} />
          </View>
        )}
      </View>

      {/* Right: Status indicator */}
      <View style={styles.statusContainer}>
        {isUnlocked ? (
          <View style={[styles.checkCircle, { backgroundColor: themeColors.success }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : isCurrent ? (
          <View style={[styles.checkCircle, { backgroundColor: themeColors.primaryButton }]}>
            <Text style={styles.checkmark}>▶</Text>
          </View>
        ) : (
          <View style={[styles.checkCircle, { backgroundColor: '#D1D5DB' }]}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  tierNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    marginRight: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardEmoji: {
    fontSize: 26,
    flexShrink: 0,
  },
  labelContainer: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  xpText: {
    fontSize: 12,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  statusContainer: {
    flexShrink: 0,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 14,
  },
});
