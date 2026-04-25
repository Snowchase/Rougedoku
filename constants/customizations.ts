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
    price: 150,
    description: 'Strong and impactful',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '900',
    },
  },
  {
    id: 'light',
    name: 'Light',
    price: 150,
    description: 'Elegant and minimal',
    preview: ['1', '2', '3'],
    style: {
      fontWeight: '300',
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    price: 200,
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
    price: 200,
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
    price: 200,
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
    price: 300,
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
  // Animals - 200 coins each
  { id: 'lion', emoji: '🦁', name: 'Lion', price: 200, category: 'animals' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', price: 200, category: 'animals' },
  { id: 'bear', emoji: '🐻', name: 'Bear', price: 200, category: 'animals' },
  { id: 'panda', emoji: '🐼', name: 'Panda', price: 200, category: 'animals' },
  { id: 'koala', emoji: '🐨', name: 'Koala', price: 200, category: 'animals' },
  { id: 'fox', emoji: '🦊', name: 'Fox', price: 200, category: 'animals' },
  { id: 'wolf', emoji: '🐺', name: 'Wolf', price: 200, category: 'animals' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', price: 300, category: 'animals' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', price: 400, category: 'animals' },
  { id: 'phoenix', emoji: '🦅', name: 'Eagle', price: 300, category: 'animals' },

  // Nature - 150 coins each
  { id: 'sun', emoji: '🌞', name: 'Sun', price: 150, category: 'nature' },
  { id: 'moon', emoji: '🌙', name: 'Moon', price: 150, category: 'nature' },
  { id: 'star', emoji: '⭐', name: 'Star', price: 150, category: 'nature' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', price: 200, category: 'nature' },
  { id: 'flower', emoji: '🌸', name: 'Cherry Blossom', price: 150, category: 'nature' },
  { id: 'rose', emoji: '🌹', name: 'Rose', price: 150, category: 'nature' },
  { id: 'tree', emoji: '🌳', name: 'Tree', price: 150, category: 'nature' },
  { id: 'mountain', emoji: '🏔️', name: 'Mountain', price: 200, category: 'nature' },

  // Food - 100 coins each
  { id: 'pizza', emoji: '🍕', name: 'Pizza', price: 100, category: 'food' },
  { id: 'burger', emoji: '🍔', name: 'Burger', price: 100, category: 'food' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi', price: 100, category: 'food' },
  { id: 'icecream', emoji: '🍦', name: 'Ice Cream', price: 100, category: 'food' },
  { id: 'cake', emoji: '🎂', name: 'Cake', price: 100, category: 'food' },
  { id: 'coffee', emoji: '☕', name: 'Coffee', price: 100, category: 'food' },
  { id: 'donut', emoji: '🍩', name: 'Donut', price: 100, category: 'food' },
  { id: 'taco', emoji: '🌮', name: 'Taco', price: 100, category: 'food' },

  // Sports - 150 coins each
  { id: 'soccer', emoji: '⚽', name: 'Soccer', price: 150, category: 'sports' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball', price: 150, category: 'sports' },
  { id: 'football', emoji: '🏈', name: 'Football', price: 150, category: 'sports' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis', price: 150, category: 'sports' },
  { id: 'golf', emoji: '⛳', name: 'Golf', price: 150, category: 'sports' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', price: 200, category: 'sports' },
  { id: 'medal', emoji: '🥇', name: 'Gold Medal', price: 300, category: 'sports' },

  // Special - Premium items
  { id: 'crown', emoji: '👑', name: 'Crown', price: 550, category: 'special' },
  { id: 'gem', emoji: '💎', name: 'Diamond', price: 550, category: 'special' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', price: 400, category: 'special' },
  { id: 'alien', emoji: '👽', name: 'Alien', price: 450, category: 'special' },
  { id: 'robot', emoji: '🤖', name: 'Robot', price: 450, category: 'special' },
  { id: 'ghost', emoji: '👻', name: 'Ghost', price: 300, category: 'special' },
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 400, category: 'special' },
  { id: 'lightning', emoji: '⚡', name: 'Lightning', price: 400, category: 'special' },
  { id: 'skull', emoji: '💀', name: 'Skull', price: 400, category: 'special' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja', price: 600, category: 'special' },

  // Sudoku pass exclusive avatars (unlocked via sudoku pass only)
  { id: 'astronaut', emoji: '🧑‍🚀', name: 'Astronaut', price: 0, category: 'special' },
  { id: 'legend', emoji: '🌟', name: 'Legend', price: 0, category: 'special' },
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
  category: 'lofi' | 'jazz' | 'electronic' | 'rock' | 'reggae';
  duration: string; // Display duration
}

export const premiumSongs: PremiumSong[] = [
  // Lo-fi - Chill beats (300-400 coins)
  { id: 'lofi-chill', name: 'Chill Beats', artist: 'Lo-Fi Lab', price: 300, description: 'Relaxing lo-fi hip hop', category: 'lofi', duration: '3:30' },
  { id: 'lofi-study', name: 'Study Session', artist: 'Focus Music', price: 300, description: 'Perfect for concentration', category: 'lofi', duration: '4:00' },
  { id: 'lofi-cafe', name: 'Cafe Vibes', artist: 'Lo-Fi Lab', price: 300, description: 'Cozy coffee shop mood', category: 'lofi', duration: '3:45' },
  { id: 'lofi-sunset', name: 'Sunset Drive', artist: 'Chill Collective', price: 400, description: 'Mellow evening vibes', category: 'lofi', duration: '4:30' },

  // Jazz - Smooth and sophisticated (400-550 coins)
  { id: 'jazz-piano', name: 'Piano Lounge', artist: 'Jazz Masters', price: 400, description: 'Smooth piano jazz', category: 'jazz', duration: '5:15' },
  { id: 'jazz-saxophone', name: 'Saxophone Dreams', artist: 'Night Club Jazz', price: 400, description: 'Mellow sax melodies', category: 'jazz', duration: '4:45' },
  { id: 'jazz-swing', name: 'Late Night Swing', artist: 'The Jazz Quartet', price: 450, description: 'Upbeat swing rhythms', category: 'jazz', duration: '5:30' },
  { id: 'jazz-bossa', name: 'Bossa Nova Vibes', artist: 'Cafe Jazz', price: 450, description: 'Brazilian jazz fusion', category: 'jazz', duration: '4:00' },
  { id: 'jazz-midnight', name: 'Midnight Blues', artist: 'Blue Note Trio', price: 500, description: 'Deep late-night blues', category: 'jazz', duration: '4:20' },
  { id: 'jazz-smooth', name: 'Smooth Groove', artist: 'Jazz Fusion', price: 550, description: 'Silky smooth jazz fusion', category: 'jazz', duration: '4:50' },

  // Electronic - Modern sounds (400-600 coins)
  { id: 'electronic-synth', name: 'Synth Dreams', artist: 'Digital Wave', price: 400, description: 'Smooth synthesizer melodies', category: 'electronic', duration: '3:50' },
  { id: 'electronic-space', name: 'Space Journey', artist: 'Cosmic Sound', price: 450, description: 'Futuristic ambient electronic', category: 'electronic', duration: '4:30' },
  { id: 'electronic-neon', name: 'Neon Lights', artist: 'Retro Future', price: 450, description: 'Synthwave nostalgia', category: 'electronic', duration: '4:15' },
  { id: 'electronic-zen', name: 'Digital Zen', artist: 'Mindful Beats', price: 600, description: 'Electronic meditation', category: 'electronic', duration: '5:00' },

  // Rock - Classic and modern rock (500-700 coins) - Premium genre
  { id: 'rock-classic', name: 'Classic Rock Vibes', artist: 'Rock Legends', price: 500, description: 'Timeless rock energy', category: 'rock', duration: '4:10' },
  { id: 'rock-acoustic', name: 'Acoustic Rock', artist: 'String Theory', price: 500, description: 'Unplugged rock sound', category: 'rock', duration: '3:55' },
  { id: 'rock-indie', name: 'Indie Rock', artist: 'Underground Sound', price: 600, description: 'Alternative indie vibes', category: 'rock', duration: '4:25' },
  { id: 'rock-power', name: 'Power Ballad', artist: 'Rock Anthem', price: 700, description: 'Epic power rock', category: 'rock', duration: '5:00' },

  // Reggae - Island vibes (500-700 coins) - Premium genre
  { id: 'reggae-chill', name: 'Island Chill', artist: 'Reggae Roots', price: 500, description: 'Relaxed island beats', category: 'reggae', duration: '4:00' },
  { id: 'reggae-dub', name: 'Dub Vibes', artist: 'Dub Masters', price: 500, description: 'Deep dub rhythms', category: 'reggae', duration: '4:30' },
  { id: 'reggae-roots', name: 'Roots Reggae', artist: 'Reggae Collective', price: 600, description: 'Traditional roots sound', category: 'reggae', duration: '4:15' },
  { id: 'reggae-sunset', name: 'Sunset Reggae', artist: 'Island Sound', price: 700, description: 'Golden hour island vibes', category: 'reggae', duration: '4:45' },
];

export const songCategories = [
  { id: 'lofi', name: 'Lo-Fi', icon: '🎧' },
  { id: 'jazz', name: 'Jazz', icon: '🎷' },
  { id: 'electronic', name: 'Electronic', icon: '🎹' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
  { id: 'reggae', name: 'Reggae', icon: '🌴' },
] as const;

export type SongCategory = typeof songCategories[number]['id'];

// Sound packs — replace the 3 game SFX (numberPlace, errorSound, puzzleComplete)
export interface SoundPack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  price: number;        // 0 = sudoku-pass-only (not purchasable with coins)
  isSudokuPassReward: boolean;
  files: {
    numberPlace: any;
    errorSound: any;
    puzzleComplete: any;
  };
}

export const SOUND_PACKS: SoundPack[] = [
  {
    id: 'default',
    name: 'Classic',
    description: 'The original Rougedoku sounds',
    emoji: '🎯',
    price: 0,
    isSudokuPassReward: false,
    files: {
      numberPlace: require('../assets/audio/sfx/place.mp3'),
      errorSound: require('../assets/audio/sfx/error.mp3'),
      puzzleComplete: require('../assets/audio/sfx/complete.mp3'),
    },
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    description: '8-bit inspired game sounds',
    emoji: '👾',
    price: 200,
    isSudokuPassReward: false,
    files: {
      numberPlace: require('../assets/audio/sfx/packs/retro/place.mp3'),
      errorSound: require('../assets/audio/sfx/packs/retro/error.mp3'),
      puzzleComplete: require('../assets/audio/sfx/packs/retro/complete.mp3'),
    },
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Calm sounds from the natural world',
    emoji: '🌿',
    price: 250,
    isSudokuPassReward: false,
    files: {
      numberPlace: require('../assets/audio/sfx/packs/nature/place.mp3'),
      errorSound: require('../assets/audio/sfx/packs/nature/error.mp3'),
      puzzleComplete: require('../assets/audio/sfx/packs/nature/complete.mp3'),
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Subtle, clean tones',
    emoji: '✨',
    price: 0,
    isSudokuPassReward: true,
    files: {
      numberPlace: require('../assets/audio/sfx/packs/minimal/place.mp3'),
      errorSound: require('../assets/audio/sfx/packs/minimal/error.mp3'),
      puzzleComplete: require('../assets/audio/sfx/packs/minimal/complete.mp3'),
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Futuristic electronic sounds',
    emoji: '🌆',
    price: 0,
    isSudokuPassReward: true,
    files: {
      numberPlace: require('../assets/audio/sfx/packs/synthwave/place.mp3'),
      errorSound: require('../assets/audio/sfx/packs/synthwave/error.mp3'),
      puzzleComplete: require('../assets/audio/sfx/packs/synthwave/complete.mp3'),
    },
  },
];
