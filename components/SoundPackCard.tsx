import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SoundPack } from '../constants/customizations';

interface Props {
  pack: SoundPack;
  isOwned: boolean;
  isSelected: boolean;
  coins: number;
  onPress: () => void;
  themeColors: {
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
    primaryButton: string;
    primaryButtonText: string;
    success: string;
  };
}

export default function SoundPackCard({ pack, isOwned, isSelected, coins, onPress, themeColors }: Props) {
  const isSudokuPassOnly = pack.isSudokuPassReward && pack.price === 0;
  const canAfford = coins >= pack.price;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: themeColors.cardBackground },
        isSelected && { borderColor: themeColors.primaryButton, borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{pack.emoji}</Text>

      <View style={styles.info}>
        <Text style={[styles.name, { color: themeColors.textPrimary }]}>{pack.name}</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]} numberOfLines={2}>
          {pack.description}
        </Text>
      </View>

      <View style={styles.badge}>
        {isSelected ? (
          <View style={[styles.statusBadge, { backgroundColor: themeColors.primaryButton }]}>
            <Text style={[styles.statusText, { color: themeColors.primaryButtonText }]}>Active</Text>
          </View>
        ) : isOwned ? (
          <View style={[styles.statusBadge, { backgroundColor: themeColors.success }]}>
            <Text style={styles.statusText}>Select</Text>
          </View>
        ) : isSudokuPassOnly ? (
          <View style={[styles.statusBadge, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.statusText}>🏆 Pass</Text>
          </View>
        ) : pack.price === 0 ? (
          <View style={[styles.statusBadge, { backgroundColor: themeColors.success }]}>
            <Text style={styles.statusText}>Free</Text>
          </View>
        ) : (
          <View style={[styles.priceBadge, { backgroundColor: canAfford ? '#FEF3C7' : '#FEE2E2' }]}>
            <Text style={[styles.priceText, { color: canAfford ? '#92400E' : '#991B1B' }]}>
              🪙 {pack.price}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emoji: {
    fontSize: 32,
    marginRight: 14,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
  },
  badge: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
