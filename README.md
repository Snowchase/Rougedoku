# Sudokle

A modern, feature-rich Sudoku puzzle game built with React Native and Expo. Solve daily puzzles, customize your experience, compete with friends, and earn rewards.

## Features

### Core Gameplay
- **Daily Puzzles** - Fresh puzzles every day with consistent seeding
- **Four Difficulty Levels** - Easy, Medium, Hard, and Expert
- **Smart Input** - Tap cells and number pad for intuitive gameplay
- **Visual Highlighting** - Row, column, and 3x3 box highlighting for selected cells
- **Multiple Solution Support** - Accepts all valid Sudoku solutions (handles forced forks)
- **Hints System** - Get help when stuck (costs coins)
- **Notes Mode** - Add candidate numbers to cells
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
  - **Privacy-First**: Full Apple ATT compliance
  - **User Control**: Optional ads, users choose when to watch
  - **Transparent**: Clear privacy prompt before tracking
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

## Rewarded Ads & Privacy Compliance

Sudokle implements rewarded video ads with full compliance to Apple's App Tracking Transparency (ATT) and privacy requirements.

### Privacy Features

1. **App Tracking Transparency (ATT)**
   - Users receive Apple's standard tracking permission dialog on iOS
   - Request is made before any ad tracking begins
   - Users can opt out and still access all app features

2. **User Control**
   - All ads are optional and user-initiated
   - Users choose when to watch ads for coin rewards
   - No forced or interstitial ads

3. **Transparency**
   - Clear privacy description in ATT prompt
   - Privacy policy explains ad network data practices
   - Users informed about data collection

### Configuration

**Test Ads**: The app is configured with Google AdMob test IDs for development.

**Production Setup**: Before release, update the following in `app.json`:
```json
{
  "plugins": [
    ["react-native-google-mobile-ads", {
      "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
      "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
    }]
  ]
}
```

And in `services/adService.ts`, update the rewarded ad unit IDs.

### Implementation Details

- **AdService** (`services/adService.ts`): Handles ad initialization, ATT requests, and rewarded ad display
- **CurrencyContext**: Integrates ad rewards with the coin system
- **Shop Screen**: Provides UI for watching ads to earn coins

## Version

**Current Version**: 1.1.0

## License

Private - All rights reserved

## Author

Robert Edie
Sudokle Team

# Audio System Documentation

This document explains the audio system in Sudokle and how to add your own music and sound effects.

## Overview

Sudokle features a complete audio system with:
- **Background Music**: Different tracks for home screen and gameplay
- **Fade In/Out**: Smooth transitions between screens
- **Sound Effects**: Button clicks, number placement, puzzle completion, etc.
- **User Controls**: Toggle music/SFX on/off and adjust volumes
- **Background Playback**: Music continues when app is minimized (iOS only)

## Architecture

### 1. Audio Manager (`services/audioManager.ts`)
Core service that handles all audio playback:
- Loads and plays audio files
- Manages fade in/out transitions
- Handles volume control
- Persists user settings with AsyncStorage

### 2. Audio Context (`contexts/AudioContext.tsx`)
React Context that provides audio controls to all components:
- Wraps the app at root level
- Handles app state changes (background/foreground)
- Provides hooks for music and sound effects
- Manages audio settings globally

### 3. Integration Points
- **Home Screen** (`app/(tabs)/index.tsx`): Plays `homeMusic`
- **Gameplay Screen** (`app/(tabs)/play.tsx`): Plays `gameplayMusic`
- **Settings Screen** (`app/(tabs)/settings.tsx`): Music/SFX controls