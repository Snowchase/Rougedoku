import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { themes, themeKeys, ThemeKey } from '../../constants/themes';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const { theme, themeKey, setTheme } = useTheme();

  const handleThemeSelect = async (key: ThemeKey) => {
    await setTheme(key);
  };

  const renderThemePreview = (key: ThemeKey) => {
    const themeData = themes[key];
    const isSelected = key === themeKey;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.themeCard,
          { backgroundColor: themeData.colors.cardBackground },
          isSelected && styles.themeCardSelected,
        ]}
        onPress={() => handleThemeSelect(key)}
      >
        <View style={styles.themeHeader}>
          <Text style={[styles.themeName, { color: themeData.colors.textPrimary }]}>
            {themeData.name}
          </Text>
          {isSelected && (
            <Text style={styles.selectedBadge}>✓</Text>
          )}
        </View>

        {/* Color Preview */}
        <View style={styles.colorPreview}>
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.primaryButton },
              ]}
            />
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.cellSelected },
              ]}
            />
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.cellOriginal },
              ]}
            />
          </View>
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.difficultyEasy },
              ]}
            />
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.difficultyMedium },
              ]}
            />
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: themeData.colors.difficultyHard },
              ]}
            />
          </View>
        </View>

        {/* Mini Grid Preview */}
        <View style={[styles.miniGrid, { borderColor: themeData.colors.gridBorder }]}>
          <View style={styles.miniGridRow}>
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellOriginal }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellBackground }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellSelected }]} />
          </View>
          <View style={styles.miniGridRow}>
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellBackground }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellOriginal }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellBackground }]} />
          </View>
          <View style={styles.miniGridRow}>
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellSelected }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellBackground }]} />
            <View style={[styles.miniCell, { backgroundColor: themeData.colors.cellOriginal }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Color Theme
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Choose your preferred color scheme for the app
          </Text>
        </View>

        <View style={styles.themesGrid}>
          {themeKeys.map(key => renderThemePreview(key))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            About
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Sudokle - Daily Sudoku Challenge
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  themesGrid: {
    gap: 16,
    marginBottom: 32,
  },
  themeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  themeCardSelected: {
    borderColor: '#3B82F6',
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedBadge: {
    fontSize: 24,
    color: '#3B82F6',
  },
  colorPreview: {
    marginBottom: 12,
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    flex: 1,
    height: 40,
    borderRadius: 8,
  },
  miniGrid: {
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  miniGridRow: {
    flexDirection: 'row',
  },
  miniCell: {
    width: 30,
    height: 30,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
});
