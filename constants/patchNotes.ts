export type ChangeType = 'new' | 'improved' | 'fixed';

export interface PatchNoteChange {
  type: ChangeType;
  description: string;
}

export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: PatchNoteChange[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '1.1.6',
    date: 'March 2026',
    title: 'Refer a Friend',
    changes: [
      { type: 'new', description: 'Referral system — share your code and earn 50 coins for every new player who signs up with it' },
      { type: 'new', description: 'New players who enter a referral code get 100 bonus coins to kick things off' },
      { type: 'new', description: 'Referral stats on your profile show how many friends you\'ve referred and total coins earned' },
    ],
  },
  {
    version: '1.1.5',
    date: 'February 2026',
    title: 'Notifications & Daily Quotes',
    changes: [
      { type: 'new', description: 'Daily quote on the home screen — a fresh puzzle-themed quote every day' },
      { type: 'new', description: 'Patch notes section so you can keep up with every update' },
      { type: 'new', description: 'Notification system — set daily reminders and streak risk alerts' },
      { type: 'improved', description: 'Ad tracking permission now properly delays Google Ads SDK initialization until after the ATT prompt' },
    ],
  },
  {
    version: '1.1.4',
    date: 'January 2026',
    title: 'Performance & Polish',
    changes: [
      { type: 'new', description: 'Featured item rotation in the Shop' },
      { type: 'improved', description: 'Audio manager handles concurrent music transitions more gracefully' },
      { type: 'improved', description: 'Home screen music starts faster after navigation' },
      { type: 'fixed', description: 'Streak badge not updating correctly after midnight' },
      { type: 'fixed', description: 'Occasional crash when switching themes during gameplay' },
    ],
  },
  {
    version: '1.1.3',
    date: 'December 2025',
    title: 'Social & Leaderboards',
    changes: [
      { type: 'new', description: 'Friend requests — invite friends by code and see their daily scores' },
      { type: 'new', description: 'Global and friends-only leaderboards' },
      { type: 'new', description: 'User profiles with custom avatar and color' },
      { type: 'improved', description: 'Score validation now checks for suspicious times and hint counts' },
      { type: 'fixed', description: 'Rate limiting added to prevent duplicate score submissions' },
    ],
  },
  {
    version: '1.1.0',
    date: 'November 2025',
    title: 'Shop & Customization',
    changes: [
      { type: 'new', description: '7 purchasable themes: Ocean, Forest, Sunset, Lavender, Midnight, Dark Mode' },
      { type: 'new', description: '6 number font styles available in the Shop' },
      { type: 'new', description: '20+ premium background music tracks across 5 genres' },
      { type: 'new', description: 'Coin economy — earn coins by completing puzzles and watching ads' },
      { type: 'new', description: 'Rewarded ad integration for bonus coins' },
      { type: 'improved', description: 'Difficulty selection now previews how many coins you can earn' },
    ],
  },
  {
    version: '1.0.0',
    date: 'October 2025',
    title: 'Initial Release',
    changes: [
      { type: 'new', description: 'Daily Sudoku puzzles seeded by date — same puzzle for everyone each day' },
      { type: 'new', description: '4 difficulty levels: Easy, Medium, Hard, Expert' },
      { type: 'new', description: 'Notes mode for marking candidate numbers' },
      { type: 'new', description: 'Hints system and mistake tracking' },
      { type: 'new', description: 'Zoom & pan gesture support on the puzzle grid' },
      { type: 'new', description: 'Daily streak tracking' },
    ],
  },
];
