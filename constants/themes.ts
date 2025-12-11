// Theme definitions for the app

export interface AppTheme {
  name: string;
  price: number; // 0 means free/default unlocked
  description: string;
  colors: {
    // Background colors
    background: string;
    cardBackground: string;

    // Grid colors
    gridBorder: string;
    cellBorder: string;
    cellBackground: string;
    cellOriginal: string;
    cellSelected: string;
    cellWrong: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textOriginal: string;
    textUser: string;

    // Button colors
    primaryButton: string;
    primaryButtonText: string;
    secondaryButton: string;
    secondaryButtonText: string;

    // Difficulty colors
    difficultyEasy: string;
    difficultyMedium: string;
    difficultyHard: string;
    difficultyExpert: string;

    // Feature colors
    hintButton: string;
    clearButton: string;
    noteButton: string;

    // Status colors
    success: string;
    error: string;
    warning: string;
  };
}

export const themes: { [key: string]: AppTheme } = {
  default: {
    name: 'Classic Blue',
    price: 0,
    description: 'The classic Sudokle experience',
    colors: {
      background: '#F9FAFB',
      cardBackground: '#FFFFFF',

      gridBorder: '#1F2937',
      cellBorder: '#D1D5DB',
      cellBackground: '#FFFFFF',
      cellOriginal: '#F3F4F6',
      cellSelected: '#DBEAFE',
      cellWrong: '#FEE2E2',

      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      textOriginal: '#1F2937',
      textUser: '#3B82F6',

      primaryButton: '#3B82F6',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#6B7280',
      secondaryButtonText: '#FFFFFF',

      difficultyEasy: '#10B981',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#8B5CF6',

      hintButton: '#8B5CF6',
      clearButton: '#EF4444',
      noteButton: '#10B981',

      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },

  dark: {
    name: 'Dark Mode',
    price: 0,
    description: 'Easy on the eyes for night puzzling',
    colors: {
      background: '#111827',
      cardBackground: '#1F2937',

      gridBorder: '#F9FAFB',
      cellBorder: '#4B5563',
      cellBackground: '#1F2937',
      cellOriginal: '#374151',
      cellSelected: '#1E3A8A',
      cellWrong: '#7F1D1D',

      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
      textOriginal: '#F9FAFB',
      textUser: '#60A5FA',

      primaryButton: '#3B82F6',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#4B5563',
      secondaryButtonText: '#F9FAFB',

      difficultyEasy: '#10B981',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#8B5CF6',

      hintButton: '#8B5CF6',
      clearButton: '#EF4444',
      noteButton: '#10B981',

      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },

  ocean: {
    name: 'Ocean Blue',
    price: 150,
    description: 'Dive into calm ocean waters',
    colors: {
      background: '#E0F2FE',
      cardBackground: '#FFFFFF',

      gridBorder: '#0C4A6E',
      cellBorder: '#BAE6FD',
      cellBackground: '#FFFFFF',
      cellOriginal: '#F0F9FF',
      cellSelected: '#BAE6FD',
      cellWrong: '#FECDD3',

      textPrimary: '#0C4A6E',
      textSecondary: '#0369A1',
      textOriginal: '#0C4A6E',
      textUser: '#0284C7',

      primaryButton: '#0284C7',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#0369A1',
      secondaryButtonText: '#FFFFFF',

      difficultyEasy: '#059669',
      difficultyMedium: '#D97706',
      difficultyHard: '#DC2626',
      difficultyExpert: '#7C3AED',

      hintButton: '#7C3AED',
      clearButton: '#DC2626',
      noteButton: '#059669',

      success: '#059669',
      error: '#DC2626',
      warning: '#D97706',
    },
  },

  forest: {
    name: 'Forest Green',
    price: 150,
    description: 'Peaceful woodland vibes',
    colors: {
      background: '#F0FDF4',
      cardBackground: '#FFFFFF',

      gridBorder: '#14532D',
      cellBorder: '#BBF7D0',
      cellBackground: '#FFFFFF',
      cellOriginal: '#F0FDF4',
      cellSelected: '#D1FAE5',
      cellWrong: '#FEE2E2',

      textPrimary: '#14532D',
      textSecondary: '#166534',
      textOriginal: '#14532D',
      textUser: '#16A34A',

      primaryButton: '#16A34A',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#166534',
      secondaryButtonText: '#FFFFFF',

      difficultyEasy: '#10B981',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#8B5CF6',

      hintButton: '#8B5CF6',
      clearButton: '#EF4444',
      noteButton: '#16A34A',

      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },

  sunset: {
    name: 'Sunset Orange',
    price: 200,
    description: 'Warm golden hour colors',
    colors: {
      background: '#FFF7ED',
      cardBackground: '#FFFFFF',

      gridBorder: '#7C2D12',
      cellBorder: '#FED7AA',
      cellBackground: '#FFFFFF',
      cellOriginal: '#FFF7ED',
      cellSelected: '#FFEDD5',
      cellWrong: '#FEE2E2',

      textPrimary: '#7C2D12',
      textSecondary: '#9A3412',
      textOriginal: '#7C2D12',
      textUser: '#EA580C',

      primaryButton: '#EA580C',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#9A3412',
      secondaryButtonText: '#FFFFFF',

      difficultyEasy: '#10B981',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#8B5CF6',

      hintButton: '#8B5CF6',
      clearButton: '#EF4444',
      noteButton: '#10B981',

      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },

  purple: {
    name: 'Royal Purple',
    price: 250,
    description: 'Majestic and elegant styling',
    colors: {
      background: '#FAF5FF',
      cardBackground: '#FFFFFF',

      gridBorder: '#4C1D95',
      cellBorder: '#E9D5FF',
      cellBackground: '#FFFFFF',
      cellOriginal: '#FAF5FF',
      cellSelected: '#F3E8FF',
      cellWrong: '#FEE2E2',

      textPrimary: '#4C1D95',
      textSecondary: '#6B21A8',
      textOriginal: '#4C1D95',
      textUser: '#9333EA',

      primaryButton: '#9333EA',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#6B21A8',
      secondaryButtonText: '#FFFFFF',

      difficultyEasy: '#10B981',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#8B5CF6',

      hintButton: '#8B5CF6',
      clearButton: '#EF4444',
      noteButton: '#10B981',

      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },
};

export type ThemeKey = keyof typeof themes;
export const themeKeys = Object.keys(themes) as ThemeKey[];
