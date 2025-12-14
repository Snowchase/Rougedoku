# Sudokle

A modern, feature-rich Sudoku puzzle game built with React Native and Expo. Solve daily puzzles, customize your experience, compete with friends, and earn rewards.

## Features

### Core Gameplay
- **Daily Puzzles** - Fresh puzzles every day with consistent seeding
- **Four Difficulty Levels** - Easy, Medium, Hard, and Expert
- **Smart Input** - Tap cells and number pad for intuitive gameplay
- **Hints System** - Get help when stuck (costs coins)
- **Timer & Statistics** - Track your solving time and performance

### Customization
- **Themes** - Multiple color themes (Classic, Dark, Ocean, Forest, Sunset, Lavender, Midnight)
- **Number Fonts** - Different font styles for the puzzle grid
- **Profile Avatars** - Unlock and display premium avatar icons
- **Background Music** - Choose from ambient, classical, and electronic tracks

### Social Features
- **Friends System** - Add friends and view their profiles
- **Leaderboards** - Compare scores with other players
- **Profile Customization** - Set your avatar and profile color

### Economy System
- **Coins** - Earn coins by completing puzzles
- **Shop** - Spend coins on themes, fonts, avatars, and music
- **Rewarded Ads** - Watch ads to earn bonus coins (25 coins per ad)
- **Time Bonuses** - Earn extra coins for fast completion
- **First Clear Bonus** - Extra reward for first-time puzzle completion

### Settings
- **Board Lock** - Lock board orientation during gameplay
- **Audio Controls** - Toggle music and sound effects
- **Haptic Feedback** - Tactile feedback on interactions

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Backend**: Firebase (authentication, leaderboards)
- **Ads**: Google AdMob (rewarded video ads)
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler

## Project Structure

```
Sudokle/
├── app/                    # Screen components (file-based routing)
│   ├── (tabs)/            # Tab-based screens
│   │   ├── index.tsx      # Home menu
│   │   ├── play.tsx       # Main puzzle screen
│   │   ├── social.tsx     # Profile & Friends
│   │   ├── leaderboards.tsx
│   │   ├── settings.tsx
│   │   └── versus.tsx     # VS mode (in development)
│   ├── shop.tsx           # In-app shop (modal)
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── SudokuGrid.tsx     # Main puzzle grid component
│   ├── SwipeableScreen.tsx # Swipe-to-go-back wrapper
│   ├── navigation-header.tsx
│   └── dailyPuzzleGenerator.ts
├── contexts/              # React Context providers
│   ├── ThemeContext.tsx   # Theme management
│   ├── CurrencyContext.tsx # Coins & purchases
│   ├── SettingsContext.tsx # User settings
│   └── AudioContext.tsx   # Music & sound
├── services/              # Business logic
│   ├── AdService.ts       # AdMob integration
│   ├── currencyService.ts # Economy system
│   ├── statsService.ts    # Statistics tracking
│   └── audioManager.ts    # Audio playback
├── constants/             # Configuration
│   ├── themes.ts          # Theme definitions
│   └── customizations.ts  # Fonts, avatars, songs
└── assets/                # Images, sounds, fonts
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator or physical device

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Sudokle

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

- **Expo Go (Development)**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal
- **Development Build** (for ads): `npx expo run:android` or `npx expo run:ios`

## Configuration

### AdMob Setup
1. Create an AdMob account at https://admob.google.com
2. Create an app and get your App ID
3. Create a Rewarded Ad Unit
4. Update IDs in:
   - `app.json` (GADApplicationIdentifier, googleMobileAdsAppId)
   - `services/AdService.ts` (PRODUCTION_REWARDED_AD_ID)

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication and Firestore
3. Update `components/firebaseConfig.ts` with your config

## Version

**Current Version**: 1.0.2

## License

Private - All rights reserved

## Author

Sudokle Team
