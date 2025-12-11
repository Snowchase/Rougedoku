// Customization items for the shop

export interface NumberFont {
  id: string;
  name: string;
  price: number;
  description: string;
  preview: string[]; // Sample numbers to show
  style: {
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    letterSpacing?: number;
  };
}

export interface PremiumAvatar {
  id: string;
  emoji: string;
  name: string;
  price: number;
  category: 'animals' | 'nature' | 'food' | 'sports' | 'special';
}

// Number font styles
export const numberFonts: NumberFont[] = [
  {
    id: 'default',
    name: 'Classic',
    price: 0,
    description: 'Clean and simple',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '500',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    price: 75,
    description: 'Strong and impactful',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '900',
    },
  },
  {
    id: 'light',
    name: 'Light',
    price: 75,
    description: 'Elegant and minimal',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '300',
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    price: 100,
    description: 'Stylish slant',
    preview: ['1', '2', '3'],
    style: {
      fontStyle: 'italic',
      fontWeight: '500',
    },
  },
  {
    id: 'wide',
    name: 'Wide',
    price: 100,
    description: 'Spaced out style',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '600',
      letterSpacing: 2,
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    price: 100,
    description: 'Tight and neat',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '600',
      letterSpacing: -1,
    },
  },
  {
    id: 'bold-italic',
    name: 'Bold Italic',
    price: 150,
    description: 'Maximum style',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '800',
      fontStyle: 'italic',
    },
  },
];

// Premium avatars organized by category
export const premiumAvatars: PremiumAvatar[] = [
  // Animals - 100 coins each
  { id: 'lion', emoji: '🦁', name: 'Lion', price: 100, category: 'animals' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', price: 100, category: 'animals' },
  { id: 'bear', emoji: '🐻', name: 'Bear', price: 100, category: 'animals' },
  { id: 'panda', emoji: '🐼', name: 'Panda', price: 100, category: 'animals' },
  { id: 'koala', emoji: '🐨', name: 'Koala', price: 100, category: 'animals' },
  { id: 'fox', emoji: '🦊', name: 'Fox', price: 100, category: 'animals' },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', price: 100, category: 'animals' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', price: 150, category: 'animals' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', price: 200, category: 'animals' },
  { id: 'phoenix', emoji: '🦅', name: 'Eagle', price: 150, category: 'animals' },

  // Nature - 75 coins each
  { id: 'sun', emoji: '🌞', name: 'Sun', price: 75, category: 'nature' },
  { id: 'moon', emoji: '🌙', name: 'Moon', price: 75, category: 'nature' },
  { id: 'star', emoji: '⭐', name: 'Star', price: 75, category: 'nature' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', price: 100, category: 'nature' },
  { id: 'flower', emoji: '🌸', name: 'Cherry Blossom', price: 75, category: 'nature' },
  { id: 'rose', emoji: '🌹', name: 'Rose', price: 75, category: 'nature' },
  { id: 'tree', emoji: '🌳', name: 'Tree', price: 75, category: 'nature' },
  { id: 'mountain', emoji: '🏔️', name: 'Mountain', price: 100, category: 'nature' },

  // Food - 50 coins each
  { id: 'pizza', emoji: '🍕', name: 'Pizza', price: 50, category: 'food' },
  { id: 'burger', emoji: '🍔', name: 'Burger', price: 50, category: 'food' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi', price: 50, category: 'food' },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', price: 50, category: 'food' },
  { id: 'cake', emoji: '🎂', name: 'Cake', price: 50, category: 'food' },
  { id: 'coffee', emoji: '☕', name: 'Coffee', price: 50, category: 'food' },
  { id: 'donut', emoji: '🍩', name: 'Donut', price: 50, category: 'food' },
  { id: 'taco', emoji: '🌮', name: 'Taco', price: 50, category: 'food' },

  // Sports - 75 coins each
  { id: 'soccer', emoji: '⚽', name: 'Soccer', price: 75, category: 'sports' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball', price: 75, category: 'sports' },
  { id: 'football', emoji: '🏈', name: 'Football', price: 75, category: 'sports' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis', price: 75, category: 'sports' },
  { id: 'golf', emoji: '⛳', name: 'Golf', price: 75, category: 'sports' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', price: 100, category: 'sports' },
  { id: 'medal', emoji: '🥇', name: 'Gold Medal', price: 150, category: 'sports' },

  // Special - Premium items
  { id: 'crown', emoji: '👑', name: 'Crown', price: 300, category: 'special' },
  { id: 'gem', emoji: '💎', name: 'Diamond', price: 300, category: 'special' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', price: 200, category: 'special' },
  { id: 'alien', emoji: '👽', name: 'Alien', price: 250, category: 'special' },
  { id: 'robot', emoji: '🤖', name: 'Robot', price: 250, category: 'special' },
  { id: 'ghost', emoji: '👻', name: 'Ghost', price: 150, category: 'special' },
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 200, category: 'special' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', price: 200, category: 'special' },
  { id: 'skull', emoji: '💀', name: 'Skull', price: 200, category: 'special' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja', price: 350, category: 'special' },
];

export const avatarCategories = [
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'sports', name: 'Sports', icon: '🏅' },
  { id: 'special', name: 'Special', icon: '✨' },
] as const;

export type AvatarCategory = typeof avatarCategories[number]['id'];
