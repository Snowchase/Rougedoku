import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useSudokuPass } from '../contexts/SudokuPassContext';
import { SUDOKU_PASS_TIERS } from '../services/sudokuPassService';
import SudokuPassTierCard from '../components/SudokuPassTierCard';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';

const XP_PER_TIER = 150;
const TOTAL_TIERS = 30;

/** Formats an ISO date string (YYYY-MM-DD) to a human-readable date like "May 4, 2026". */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SudokuPassScreen() {
  const { theme } = useTheme();
  const { sudokuPassData, isLoading, currentTier, tierProgress, seasonEndDate, refreshSudokuPass } = useSudokuPass();

  // Refresh sudoku pass data whenever this screen gains focus so XP earned
  // during gameplay (written via CurrencyContext) is reflected immediately.
  useFocusEffect(
    React.useCallback(() => {
      refreshSudokuPass();
    }, [refreshSudokuPass])
  );

  const xpToNextTier =
    currentTier >= TOTAL_TIERS
      ? 0
      : (currentTier + 1) * XP_PER_TIER - sudokuPassData.currentXP;

  const getCardStatus = (tierNum: number): 'locked' | 'current' | 'unlocked' => {
    if (tierNum <= currentTier) return 'unlocked';
    if (tierNum === currentTier + 1) return 'current';
    return 'locked';
  };

  return (
    <ScreenErrorBoundary screenName="SudokuPass">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Sudoku Pass',
            headerStyle: { backgroundColor: theme.colors.cardBackground },
            headerTintColor: theme.colors.primaryButton,
            headerTitleStyle: { color: theme.colors.textPrimary },
          }}
        />

        {/* Header — Season info and XP progress */}
        <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.seasonLabel, { color: theme.colors.textSecondary }]}>
                Season {sudokuPassData.season}
              </Text>
              <Text style={[styles.tierLabel, { color: theme.colors.textPrimary }]}>
                {currentTier >= TOTAL_TIERS
                  ? 'Max Tier Reached! 🏆'
                  : `Tier ${currentTier} / ${TOTAL_TIERS}`}
              </Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={[styles.xpBadgeText, { color: theme.colors.primaryButton }]}>
                {sudokuPassData.currentXP} XP
              </Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          {currentTier < TOTAL_TIERS && (
            <>
              <View style={[styles.progressTrack, { backgroundColor: '#E5E7EB' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primaryButton,
                      width: `${Math.round(tierProgress * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.xpProgressText, { color: theme.colors.textSecondary }]}>
                {xpToNextTier} XP to Tier {currentTier + 1}
              </Text>
            </>
          )}

          <Text style={[styles.howToEarn, { color: theme.colors.textSecondary }]}>
            Earn XP by completing puzzles: Easy +10 · Medium +25 · Hard +50 · Expert +100
          </Text>

          {/* Season end date */}
          <View style={[styles.endDateRow, { borderTopColor: theme.colors.textSecondary + '30' }]}>
            <Text style={styles.endDateIcon}>⏰</Text>
            <Text style={[styles.endDateText, { color: theme.colors.textSecondary }]}>
              Season ends {formatDate(seasonEndDate)} — rewards are yours forever
            </Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.primaryButton}
            size="large"
          />
        ) : (
          <ScrollView
            horizontal
            contentContainerStyle={styles.tiersRow}
            showsHorizontalScrollIndicator={false}
          >
            {SUDOKU_PASS_TIERS.map((tier) => (
              <SudokuPassTierCard
                key={tier.tier}
                tier={tier}
                status={getCardStatus(tier.tier)}
                progress={tier.tier === currentTier + 1 ? tierProgress : 0}
                themeColors={{
                  cardBackground: theme.colors.cardBackground,
                  textPrimary: theme.colors.textPrimary,
                  textSecondary: theme.colors.textSecondary,
                  primaryButton: theme.colors.primaryButton,
                  primaryButtonText: theme.colors.primaryButtonText,
                  success: theme.colors.success,
                }}
              />
            ))}
          </ScrollView>
        )}

        {/* Legend */}
        <View style={[styles.legend, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Unlocked</Text>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primaryButton }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>In Progress</Text>
            <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
            <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Locked</Text>
          </View>
        </View>
      </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  seasonLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  tierLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  xpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  xpProgressText: {
    fontSize: 12,
    marginBottom: 8,
  },
  howToEarn: {
    fontSize: 11,
    marginTop: 4,
  },
  endDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  endDateIcon: {
    fontSize: 13,
  },
  endDateText: {
    fontSize: 11,
    flex: 1,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 40,
  },
  tiersRow: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  legend: {
    padding: 12,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    marginRight: 12,
  },
});
