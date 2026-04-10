import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useRun } from '../contexts/RunContext';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import {
  UPGRADES,
  type UpgradeId,
} from '../constants/runConfig';

export default function UpgradeDraftScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { selectUpgrade, activeRun } = useRun();
  const params = useLocalSearchParams<{ choices: string; rewardCoins: string }>();

  const choices: UpgradeId[] = params.choices
    ? JSON.parse(params.choices)
    : [];
  const rewardCoins = params.rewardCoins ? parseInt(params.rewardCoins, 10) : 0;

  const [selecting, setSelecting] = useState(false);

  const owned = activeRun?.runUpgrades ?? [];

  const handleSelect = async (upgradeId: UpgradeId | null) => {
    if (selecting) return;
    setSelecting(true);
    try {
      const { runComplete } = await selectUpgrade(upgradeId, rewardCoins);
      if (runComplete) {
        router.replace('/run-summary');
      } else {
        router.replace('/(tabs)/play');
      }
    } catch (err) {
      console.error('Error selecting upgrade:', err);
      setSelecting(false);
    }
  };

  return (
    <ScreenErrorBoundary screenName="UpgradeDraft">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.1}>
            Choose an Upgrade
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
            Pick one perk to carry into the next floor
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {choices.length === 0 ? (
            <View style={[styles.noUpgradesCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={styles.noUpgradesIcon} allowFontScaling={false}>✨</Text>
              <Text style={[styles.noUpgradesText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                All upgrades already collected!
              </Text>
            </View>
          ) : (
            choices.map((id) => {
              const info = UPGRADES[id];
              const alreadyOwned = owned.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.upgradeCard,
                    {
                      backgroundColor: theme.colors.cardBackground,
                      borderColor: alreadyOwned ? theme.colors.textSecondary : theme.colors.primaryButton,
                      opacity: selecting ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(id)}
                  disabled={selecting}
                  activeOpacity={0.75}
                >
                  <Text style={styles.upgradeIcon} allowFontScaling={false}>{info.icon}</Text>
                  <View style={styles.upgradeTextBlock}>
                    <Text style={[styles.upgradeName, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                      {info.name}
                    </Text>
                    <Text style={[styles.upgradeDesc, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                      {info.description}
                    </Text>
                    {alreadyOwned && (
                      <Text style={[styles.ownedBadge, { color: theme.isDark ? '#FCD34D' : '#92400E' }]} maxFontSizeMultiplier={1.2}>
                        Already owned — upgrades stack
                      </Text>
                    )}
                  </View>
                  {selecting ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryButton} />
                  ) : (
                    <Text style={[styles.selectArrow, { color: theme.colors.primaryButton }]} allowFontScaling={false}>›</Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Skip option */}
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: theme.colors.textSecondary, opacity: selecting ? 0.5 : 1 }]}
            onPress={() => handleSelect(null)}
            disabled={selecting}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
              Skip — continue without an upgrade
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 14,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  upgradeIcon: {
    fontSize: 36,
    width: 44,
    textAlign: 'center',
  },
  upgradeTextBlock: {
    flex: 1,
    gap: 4,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: '700',
  },
  upgradeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  ownedBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  selectArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  skipButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  skipText: {
    fontSize: 14,
  },
  noUpgradesCard: {
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  noUpgradesIcon: {
    fontSize: 36,
  },
  noUpgradesText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
