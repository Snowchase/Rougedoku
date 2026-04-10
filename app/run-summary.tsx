import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useRun } from '../contexts/RunContext';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { UPGRADES } from '../constants/runConfig';
import { updateStatsAfterRun } from '../services/statsService';

export default function RunSummaryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { activeRun, abandonRun, startNewRun } = useRun();
  const statsRecorded = useRef(false);

  const run = activeRun;
  const isCompleted = run?.status === 'completed';
  const isFailed = run?.status === 'failed';

  // Record stats exactly once when this screen mounts
  useEffect(() => {
    if (!run || statsRecorded.current) return;
    if (run.status !== 'completed' && run.status !== 'failed') return;
    statsRecorded.current = true;
    updateStatsAfterRun(run).catch(err =>
      console.error('Error recording run stats:', err),
    );
  }, [run]);

  const floorsCleared = run ? (isCompleted ? run.maxFloors : run.currentFloor - 1) : 0;
  const totalCoins = run?.floorRewards?.reduce((a, b) => a + b, 0) ?? 0;
  const upgrades = run?.runUpgrades ?? [];
  const totalMistakes = run?.totalMistakes ?? 0;
  const maxFloors = run?.maxFloors ?? 20;

  const handleStartNewRun = async () => {
    await abandonRun();
    await startNewRun();
    router.replace('/(tabs)/play');
  };

  const handleGoHome = async () => {
    // Keep the run in storage if it's still active (shouldn't be, but safety check)
    if (!isCompleted && !isFailed) await abandonRun();
    router.replace('/(tabs)');
  };

  return (
    <ScreenErrorBoundary screenName="RunSummary">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Outcome Banner */}
          <View style={[styles.outcomeBanner, {
            backgroundColor: isCompleted
              ? (theme.isDark ? '#14532D' : '#DCFCE7')
              : (theme.isDark ? '#450A0A' : '#FEE2E2'),
          }]}>
            <Text style={styles.outcomeIcon} allowFontScaling={false}>
              {isCompleted ? '🏆' : '💀'}
            </Text>
            <Text style={[styles.outcomeTitle, {
              color: isCompleted
                ? (theme.isDark ? '#4ADE80' : '#15803D')
                : (theme.isDark ? '#F87171' : '#B91C1C'),
            }]} maxFontSizeMultiplier={1.1}>
              {isCompleted ? 'Run Complete!' : 'Run Failed'}
            </Text>
            <Text style={[styles.outcomeSubtitle, {
              color: isCompleted
                ? (theme.isDark ? '#86EFAC' : '#166534')
                : (theme.isDark ? '#FCA5A5' : '#991B1B'),
            }]} maxFontSizeMultiplier={1.2}>
              {isCompleted
                ? `You conquered all ${maxFloors} floors!`
                : `Reached floor ${run?.currentFloor ?? 1} of ${maxFloors}`}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={[styles.statsCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
              Run Stats
            </Text>
            <View style={styles.statsGrid}>
              <StatItem label="Floors Cleared" value={`${floorsCleared}`} icon="🗺" theme={theme} />
              <StatItem label="Coins Earned" value={`${totalCoins}`} icon="🪙" theme={theme} />
              <StatItem label="Mistakes" value={`${totalMistakes}`} icon="❌" theme={theme} />
              <StatItem label="Lives Left" value={`${run?.livesRemaining ?? 0}`} icon="❤️" theme={theme} />
            </View>
          </View>

          {/* Upgrades Collected */}
          {upgrades.length > 0 && (
            <View style={[styles.upgradesCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Upgrades Collected
              </Text>
              <View style={styles.upgradesList}>
                {upgrades.map((id, idx) => {
                  const info = UPGRADES[id];
                  return (
                    <View key={`${id}-${idx}`} style={[styles.upgradeRow, { borderColor: theme.colors.textSecondary + '44' }]}>
                      <Text style={styles.upgradeIcon} allowFontScaling={false}>{info.icon}</Text>
                      <View style={styles.upgradeText}>
                        <Text style={[styles.upgradeName, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                          {info.name}
                        </Text>
                        <Text style={[styles.upgradeDesc, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                          {info.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {upgrades.length === 0 && (
            <View style={[styles.upgradesCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                Upgrades Collected
              </Text>
              <Text style={[styles.noUpgrades, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                None this run
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primaryButton }]}
              onPress={handleStartNewRun}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.primaryButtonText }]} maxFontSizeMultiplier={1.2}>
                🎮 Start New Run
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.textSecondary }]}
              onPress={handleGoHome}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                Go Home
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenErrorBoundary>
  );
}

function StatItem({ label, value, icon, theme }: {
  label: string;
  value: string;
  icon: string;
  theme: any;
}) {
  return (
    <View style={[styles.statItem, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
      <Text style={styles.statIcon} allowFontScaling={false}>{icon}</Text>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.1}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 48,
    gap: 16,
  },
  outcomeBanner: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  outcomeIcon: {
    fontSize: 56,
    marginBottom: 4,
  },
  outcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  outcomeSubtitle: {
    fontSize: 15,
  },
  statsCard: {
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  upgradesCard: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  upgradesList: {
    gap: 10,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  upgradeIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  upgradeText: {
    flex: 1,
    gap: 2,
  },
  upgradeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeDesc: {
    fontSize: 12,
  },
  noUpgrades: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
  },
});
