# Audio Assets

This directory contains all audio files for Sudokle.

## Directory Structure

```
assets/audio/
├── music/           # Background music tracks
│   ├── home.mp3     # Home screen music
│   └── gameplay.mp3 # Gameplay music
└── sfx/             # Sound effects
    ├── place.mp3    # Number placement sound
    ├── complete.mp3 # Puzzle completion sound
    ├── click.mp3    # Button click sound
    └── error.mp3    # Error sound
```

## Adding Your Music Files

### Step 1: Prepare Your Audio Files

1. **Format**: Use MP3 format (most compatible)
2. **Bitrate**: 128-192 kbps recommended (balance between quality and file size)
3. **Music Tracks**:
   - Should loop seamlessly (fade in/out at start/end)
   - Keep file size reasonable (<5MB per track)
4. **Sound Effects**:
   - Keep short (0.5-2 seconds)
   - Small file size (<100KB each)

### Step 2: Add Files to Project

1. Place your MP3 files in the appropriate directory:
   ```
   assets/audio/music/home.mp3
   assets/audio/music/gameplay.mp3
   assets/audio/sfx/place.mp3
   assets/audio/sfx/complete.mp3
   assets/audio/sfx/click.mp3
   assets/audio/sfx/error.mp3
   ```

2. **Important**: Use lowercase names with no spaces or special characters

### Step 3: Update Audio Manager

Edit `services/audioManager.ts` to reference your files:

```typescript
const AUDIO_FILES = {
  // Music tracks
  homeMusic: require('../assets/audio/music/home.mp3'),
  gameplayMusic: require('../assets/audio/music/gameplay.mp3'),

  // Sound effects
  numberPlace: require('../assets/audio/sfx/place.mp3'),
  puzzleComplete: require('../assets/audio/sfx/complete.mp3'),
  buttonClick: require('../assets/audio/sfx/click.mp3'),
  errorSound: require('../assets/audio/sfx/error.mp3'),
};
```

### Step 4: Push to Repository

```bash
# Add audio files to git
git add assets/audio/music/*.mp3
git add assets/audio/sfx/*.mp3

# Commit
git commit -m "Add music and sound effect files"

# Push to your branch
git push
```

**Note**: Git may warn about large files. If your audio files are large (>10MB total), consider:
- Compressing them further
- Using lower bitrate
- Using Git LFS (Large File Storage)

## File Size Guidelines

- **Total audio assets**: Try to keep under 10MB
- **Individual music tracks**: 2-5MB each
- **Individual sound effects**: 50-200KB each

## Testing Your Audio

After adding files:
1. Restart the Expo development server: `npm start`
2. Clear cache if needed: `npm start --clear`
3. Test on device/simulator
4. Check Settings panel for music/SFX controls

## Free Music Resources

If you need royalty-free music:
- **Uppbeat** (https://uppbeat.io) - Free for creators
- **Pixabay Music** (https://pixabay.com/music) - CC0 license
- **Incompetech** (https://incompetech.com) - CC BY 3.0
- **Bensound** (https://bensound.com) - Some free tracks

## Current Status

⚠️ **Placeholder files are currently in use**

Replace the placeholder MP3 files in `music/` and `sfx/` directories with your actual audio files.

The app will work without real audio files, but will log errors when trying to play audio. Once you add real MP3 files, everything will work automatically.
