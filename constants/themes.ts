// Theme definitions for the app

export interface AppTheme {
  name: string;
  price: number; // 0 means free/default unlocked
  description: string;
  isDark?: boolean; // Whether this is a dark theme
  colors: {
    // Background colors
    background: string;
    cardBackground: string;

    // Grid colors
    gridBorder: string;
    cellBorder: string;
    cellBackground: string;
    cellBackgroundAlt: string; // Alternating 3x3 block background
    cellOriginal: string;
    cellOriginalAlt: string; // Alternating 3x3 block original cell
    cellSelected: string;
    cellWrong: string;
    cellHighlighted: string;

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
  dungeon: {
    name: 'Dungeon',
    price: 0,
    description: 'Dark and atmospheric roguelike dungeon aesthetic',
    isDark: true,
    colors: {
      background: '#0D0B0A',
      cardBackground: '#1A1613',

      gridBorder: '#8B6914',
      cellBorder: '#2A2218',
      cellBackground: '#141210',
      cellBackgroundAlt: '#1E1A16',
      cellOriginal: '#2A2218',
      cellOriginalAlt: '#332A1E',
      cellSelected: '#7C5510',
      cellWrong: '#5C1616',
      cellHighlighted: '#4A3A0E',

      textPrimary: '#F0E0C0',
      textSecondary: '#9A8060',
      textOriginal: '#E8D090',
      textUser: '#FFB830',

      primaryButton: '#B8860B',
      primaryButtonText: '#0D0B0A',
      secondaryButton: '#3D3028',
      secondaryButtonText: '#F0E0C0',

      difficultyEasy: '#22C55E',
      difficultyMedium: '#F59E0B',
      difficultyHard: '#EF4444',
      difficultyExpert: '#A855F7',

      hintButton: '#A855F7',
      clearButton: '#EF4444',
      noteButton: '#22C55E',

      success: '#22C55E',
      error: '#EF4444',
      warning: '#F59E0B',
    },
  },

  default: {
    name: 'Classic Blue',
    price: 0,
    description: 'The classic Rougedoku experience',
    isDark: false,
    colors: {
      background: '#F9FAFB',
      cardBackground: '#FFFFFF',

      gridBorder: '#1F2937',
      cellBorder: '#D1D5DB',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#F8FAFC',
      cellOriginal: '#F3F4F6',
      cellOriginalAlt: '#E5E7EB',
      cellSelected: '#DBEAFE',
      cellWrong: '#FEE2E2',
      cellHighlighted: '#FEF3C7',

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
    isDark: true,
    colors: {
      background: '#0A0A0B',
      cardBackground: '#141416',

      gridBorder: '#3F3F46',
      cellBorder: '#27272A',
      cellBackground: '#18181B',
      cellBackgroundAlt: '#1F1F23',
      cellOriginal: '#27272A',
      cellOriginalAlt: '#2E2E33',
      cellSelected: '#1E3A8A',
      cellWrong: '#7F1D1D',
      cellHighlighted: '#422006',

      textPrimary: '#FAFAFA',
      textSecondary: '#A1A1AA',
      textOriginal: '#E4E4E7',
      textUser: '#60A5FA',

      primaryButton: '#3B82F6',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#3F3F46',
      secondaryButtonText: '#FAFAFA',

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
    price: 300,
    description: 'Dive into calm ocean waters',
    isDark: false,
    colors: {
      background: '#E0F2FE',
      cardBackground: '#FFFFFF',

      gridBorder: '#0C4A6E',
      cellBorder: '#BAE6FD',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#F0F9FF',
      cellOriginal: '#F0F9FF',
      cellOriginalAlt: '#E0F2FE',
      cellSelected: '#BAE6FD',
      cellWrong: '#FECDD3',
      cellHighlighted: '#FEF3C7',

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
    price: 300,
    description: 'Peaceful woodland vibes',
    isDark: false,
    colors: {
      background: '#F0FDF4',
      cardBackground: '#FFFFFF',

      gridBorder: '#14532D',
      cellBorder: '#BBF7D0',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#F0FDF4',
      cellOriginal: '#F0FDF4',
      cellOriginalAlt: '#DCFCE7',
      cellSelected: '#D1FAE5',
      cellWrong: '#FEE2E2',
      cellHighlighted: '#FEF3C7',

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
    price: 400,
    description: 'Warm golden hour colors',
    isDark: false,
    colors: {
      background: '#FFF7ED',
      cardBackground: '#FFFFFF',

      gridBorder: '#7C2D12',
      cellBorder: '#FED7AA',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#FFF7ED',
      cellOriginal: '#FFF7ED',
      cellOriginalAlt: '#FFEDD5',
      cellSelected: '#FFEDD5',
      cellWrong: '#FEE2E2',
      cellHighlighted: '#FEF3C7',

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
    price: 450,
    description: 'Majestic and elegant styling',
    isDark: false,
    colors: {
      background: '#FAF5FF',
      cardBackground: '#FFFFFF',

      gridBorder: '#4C1D95',
      cellBorder: '#E9D5FF',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#FAF5FF',
      cellOriginal: '#FAF5FF',
      cellOriginalAlt: '#F3E8FF',
      cellSelected: '#F3E8FF',
      cellWrong: '#FEE2E2',
      cellHighlighted: '#FEF3C7',

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

  cherry: {
    name: 'Cherry Blossom',
    price: 550,
    description: 'Delicate pink spring vibes',
    isDark: false,
    colors: {
      background: '#FDF2F8',
      cardBackground: '#FFFFFF',

      gridBorder: '#9D174D',
      cellBorder: '#FBCFE8',
      cellBackground: '#FFFFFF',
      cellBackgroundAlt: '#FDF2F8',
      cellOriginal: '#FCE7F3',
      cellOriginalAlt: '#FBCFE8',
      cellSelected: '#FBCFE8',
      cellWrong: '#FEE2E2',
      cellHighlighted: '#FEF3C7',

      textPrimary: '#9D174D',
      textSecondary: '#BE185D',
      textOriginal: '#9D174D',
      textUser: '#EC4899',

      primaryButton: '#EC4899',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#BE185D',
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

  midnight: {
    name: 'Midnight Blue',
    price: 600,
    description: 'Deep starry night aesthetic',
    isDark: true,
    colors: {
      background: '#0F172A',
      cardBackground: '#1E293B',

      gridBorder: '#475569',
      cellBorder: '#334155',
      cellBackground: '#1E293B',
      cellBackgroundAlt: '#263449',
      cellOriginal: '#334155',
      cellOriginalAlt: '#3D4F66',
      cellSelected: '#1E40AF',
      cellWrong: '#7F1D1D',
      cellHighlighted: '#422006',

      textPrimary: '#E2E8F0',
      textSecondary: '#94A3B8',
      textOriginal: '#F1F5F9',
      textUser: '#38BDF8',

      primaryButton: '#0EA5E9',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#475569',
      secondaryButtonText: '#E2E8F0',

      difficultyEasy: '#34D399',
      difficultyMedium: '#FBBF24',
      difficultyHard: '#F87171',
      difficultyExpert: '#A78BFA',

      hintButton: '#A78BFA',
      clearButton: '#F87171',
      noteButton: '#34D399',

      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
    },
  },

  retro: {
    name: 'Retro Vintage',
    price: 700,
    description: 'Classic 80s nostalgia',
    isDark: false,
    colors: {
      background: '#FEF3C7',
      cardBackground: '#FFFBEB',

      gridBorder: '#78350F',
      cellBorder: '#FCD34D',
      cellBackground: '#FFFBEB',
      cellBackgroundAlt: '#FEF3C7',
      cellOriginal: '#FEF3C7',
      cellOriginalAlt: '#FDE68A',
      cellSelected: '#FDE68A',
      cellWrong: '#FECACA',
      cellHighlighted: '#D9F99D',

      textPrimary: '#78350F',
      textSecondary: '#92400E',
      textOriginal: '#78350F',
      textUser: '#B45309',

      primaryButton: '#D97706',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#92400E',
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

  space: {
    name: 'Deep Space',
    price: 0,
    description: 'Rougedoku Pass exclusive — cosmic dark theme',
    isDark: true,
    colors: {
      background: '#03030A',
      cardBackground: '#0D0D1F',

      gridBorder: '#4F46E5',
      cellBorder: '#1E1B4B',
      cellBackground: '#0D0D1F',
      cellBackgroundAlt: '#13132B',
      cellOriginal: '#1E1B4B',
      cellOriginalAlt: '#252560',
      cellSelected: '#6D28D9',
      cellWrong: '#BE123C',
      cellHighlighted: '#2E1065',

      textPrimary: '#E0E7FF',
      textSecondary: '#818CF8',
      textOriginal: '#A5B4FC',
      textUser: '#C4B5FD',

      primaryButton: '#6D28D9',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#1E1B4B',
      secondaryButtonText: '#E0E7FF',

      difficultyEasy: '#34D399',
      difficultyMedium: '#FCD34D',
      difficultyHard: '#F87171',
      difficultyExpert: '#A78BFA',

      hintButton: '#A78BFA',
      clearButton: '#F87171',
      noteButton: '#34D399',

      success: '#34D399',
      error: '#F87171',
      warning: '#FCD34D',
    },
  },
  sudokupass: {
    name: 'Rougedoku Pass Gold',
    price: 0,
    description: 'Rougedoku Pass exclusive — prestige golden theme',
    isDark: false,
    colors: {
      background: '#FFFBEB',
      cardBackground: '#FEF3C7',

      gridBorder: '#D97706',
      cellBorder: '#FDE68A',
      cellBackground: '#FFFBEB',
      cellBackgroundAlt: '#FEF9E7',
      cellOriginal: '#FDE68A',
      cellOriginalAlt: '#FCD34D',
      cellSelected: '#F59E0B',
      cellWrong: '#DC2626',
      cellHighlighted: '#FDE68A',

      textPrimary: '#78350F',
      textSecondary: '#92400E',
      textOriginal: '#92400E',
      textUser: '#B45309',

      primaryButton: '#D97706',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#FDE68A',
      secondaryButtonText: '#78350F',

      difficultyEasy: '#059669',
      difficultyMedium: '#D97706',
      difficultyHard: '#DC2626',
      difficultyExpert: '#7C3AED',

      hintButton: '#D97706',
      clearButton: '#DC2626',
      noteButton: '#059669',

      success: '#059669',
      error: '#DC2626',
      warning: '#D97706',
    },
  },
  neon: {
    name: 'Neon Nights',
    price: 800,
    description: 'Vibrant cyberpunk glow',
    isDark: true,
    colors: {
      background: '#09090B',
      cardBackground: '#18181B',

      gridBorder: '#22D3EE',
      cellBorder: '#27272A',
      cellBackground: '#18181B',
      cellBackgroundAlt: '#1F1F23',
      cellOriginal: '#27272A',
      cellOriginalAlt: '#2E2E33',
      cellSelected: '#7C3AED',
      cellWrong: '#BE123C',
      cellHighlighted: '#581C87',

      textPrimary: '#F4F4F5',
      textSecondary: '#A1A1AA',
      textOriginal: '#22D3EE',
      textUser: '#A855F7',

      primaryButton: '#A855F7',
      primaryButtonText: '#FFFFFF',
      secondaryButton: '#3F3F46',
      secondaryButtonText: '#F4F4F5',

      difficultyEasy: '#4ADE80',
      difficultyMedium: '#FACC15',
      difficultyHard: '#FB7185',
      difficultyExpert: '#C084FC',

      hintButton: '#C084FC',
      clearButton: '#FB7185',
      noteButton: '#4ADE80',

      success: '#4ADE80',
      error: '#FB7185',
      warning: '#FACC15',
    },
  },
};

export type ThemeKey = keyof typeof themes;
export const themeKeys = Object.keys(themes) as ThemeKey[];
