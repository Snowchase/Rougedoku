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

// Music tracks for purchase
export interface PremiumSong {
  id: string;
  name: string;
  artist: string;
  price: number;
  description: string;
  category: 'ambient' | 'lofi' | 'classical' | 'electronic';
  duration: string; // Display duration
}

export const premiumSongs: PremiumSong[] = [
  // Ambient - Relaxing background music
  { id: 'ambient-rain', name: 'Rainy Day', artist: 'Ambient Sounds', price: 100, description: 'Gentle rain with soft piano', category: 'ambient', duration: '3:45' },
  { id: 'ambient-forest', name: 'Forest Meditation', artist: 'Nature Vibes', price: 100, description: 'Peaceful forest ambiance', category: 'ambient', duration: '4:20' },
  { id: 'ambient-ocean', name: 'Ocean Waves', artist: 'Ambient Sounds', price: 100, description: 'Calming ocean atmosphere', category: 'ambient', duration: '5:00' },
  { id: 'ambient-night', name: 'Starry Night', artist: 'Dream Studio', price: 150, description: 'Ethereal nighttime soundscape', category: 'ambient', duration: '4:15' },

  // Lo-fi - Chill beats
  { id: 'lofi-chill', name: 'Chill Beats', artist: 'Lo-Fi Lab', price: 150, description: 'Relaxing lo-fi hip hop', category: 'lofi', duration: '3:30' },
  { id: 'lofi-study', name: 'Study Session', artist: 'Focus Music', price: 150, description: 'Perfect for concentration', category: 'lofi', duration: '4:00' },
  { id: 'lofi-cafe', name: 'Cafe Vibes', artist: 'Lo-Fi Lab', price: 150, description: 'Cozy coffee shop mood', category: 'lofi', duration: '3:45' },
  { id: 'lofi-sunset', name: 'Sunset Drive', artist: 'Chill Collective', price: 200, description: 'Mellow evening vibes', category: 'lofi', duration: '4:30' },

  // Classical - Timeless pieces
  { id: 'classical-piano', name: 'Piano Dreams', artist: 'Classical Masters', price: 200, description: 'Soothing piano melodies', category: 'classical', duration: '5:15' },
  { id: 'classical-strings', name: 'String Serenity', artist: 'Symphony Orchestra', price: 200, description: 'Gentle string ensemble', category: 'classical', duration: '4:45' },
  { id: 'classical-nocturne', name: 'Moonlight Nocturne', artist: 'Piano Virtuoso', price: 250, description: 'Romantic nighttime piece', category: 'classical', duration: '5:30' },
  { id: 'classical-morning', name: 'Morning Sunrise', artist: 'Chamber Ensemble', price: 250, description: 'Uplifting classical piece', category: 'classical', duration: '4:00' },

  // Electronic - Modern sounds
  { id: 'electronic-synth', name: 'Synth Dreams', artist: 'Digital Wave', price: 200, description: 'Smooth synthesizer melodies', category: 'electronic', duration: '3:50' },
  { id: 'electronic-space', name: 'Space Journey', artist: 'Cosmic Sound', price: 250, description: 'Futuristic ambient electronic', category: 'electronic', duration: '4:30' },
  { id: 'electronic-neon', name: 'Neon Lights', artist: 'Retro Future', price: 250, description: 'Synthwave nostalgia', category: 'electronic', duration: '4:15' },
  { id: 'electronic-zen', name: 'Digital Zen', artist: 'Mindful Beats', price: 300, description: 'Electronic meditation', category: 'electronic', duration: '5:00' },
];

export const songCategories = [
  { id: 'ambient', name: 'Ambient', icon: '🌙' },
  { id: 'lofi', name: 'Lo-Fi', icon: '🎧' },
  { id: 'classical', name: 'Classical', icon: '🎻' },
  { id: 'electronic', name: 'Electronic', icon: '🎹' },
] as const;

export type SongCategory = typeof songCategories[number]['id'];
