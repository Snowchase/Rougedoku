import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationHeader } from '../components/navigation-header';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { SwipeableScreen } from '../components/SwipeableScreen';
import { useTheme } from '../contexts/ThemeContext';
import { PATCH_NOTES, ChangeType } from '../constants/patchNotes';
import { patchNotesService } from '../services/patchNotesService';

const CHANGE_CONFIG: Record<ChangeType, { emoji: string; label: string; color: string }> = {
  new: { emoji: '🆕', label: 'New', color: '#10B981' },
  improved: { emoji: '⬆️', label: 'Improved', color: '#3B82F6' },
  fixed: { emoji: '🐛', label: 'Fixed', color: '#F59E0B' },
};

export default function PatchNotesScreen() {
  const { theme } = useTheme();

  useEffect(() => {
    patchNotesService.markAsSeen();
  }, []);

  return (
    <ScreenErrorBoundary screenName="PatchNotes">
      <SwipeableScreen>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <NavigationHeader title="What's New" />
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {PATCH_NOTES.map((note, noteIndex) => (
              <View
                key={note.version}
                style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}
              >
                {/* Version header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.versionText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                      v{note.version}
                    </Text>
                    <Text style={[styles.titleText, { color: theme.colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                      {note.title}
                    </Text>
                  </View>
                  <View style={[styles.dateBadge, { backgroundColor: theme.colors.cellBackground }]}>
                    <Text style={[styles.dateText, { color: theme.colors.textSecondary }]} maxFontSizeMultiplier={1.1}>
                      {note.date}
                    </Text>
                  </View>
                </View>

                {/* Latest badge */}
                {noteIndex === 0 && (
                  <View style={[styles.latestBadge, { backgroundColor: theme.colors.primaryButton }]}>
                    <Text style={[styles.latestBadgeText, { color: theme.colors.primaryButtonText }]} allowFontScaling={false}>
                      LATEST
                    </Text>
                  </View>
                )}

                {/* Change list */}
                <View style={styles.changeList}>
                  {note.changes.map((change, changeIndex) => {
                    const config = CHANGE_CONFIG[change.type];
                    return (
                      <View key={changeIndex} style={styles.changeRow}>
                        <View style={[styles.changeBadge, { backgroundColor: config.color + '22' }]}>
                          <Text style={styles.changeEmoji} allowFontScaling={false}>
                            {config.emoji}
                          </Text>
                          <Text style={[styles.changeLabel, { color: config.color }]} allowFontScaling={false}>
                            {config.label}
                          </Text>
                        </View>
                        <Text
                          style={[styles.changeDescription, { color: theme.colors.textSecondary }]}
                          maxFontSizeMultiplier={1.2}
                        >
                          {change.description}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </SwipeableScreen>
    </ScreenErrorBoundary>
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
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  latestBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 14,
  },
  latestBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  changeList: {
    gap: 10,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 78,
  },
  changeEmoji: {
    fontSize: 11,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  changeDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
