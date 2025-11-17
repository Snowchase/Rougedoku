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

## Adding Your Music Files

### Step 1: Prepare Your Files

1. **Choose Your Music**
   - Use royalty-free music or your own compositions
   - Recommended format: MP3
   - Recommended bitrate: 128-192 kbps
   - File size: Keep under 5MB per track

2. **Name Your Files**
   Use lowercase names without spaces:
   - `home.mp3` - Home screen music
   - `gameplay.mp3` - Gameplay music
   - `place.mp3` - Number placement sound
   - `complete.mp3` - Puzzle completion sound
   - `click.mp3` - Button click sound
   - `error.mp3` - Error sound

### Step 2: Add Files to Project

Place your MP3 files in the correct directories:

```
assets/audio/
├── music/
│   ├── home.mp3        <-- Add your home music here
│   └── gameplay.mp3    <-- Add your gameplay music here
└── sfx/
    ├── place.mp3       <-- Add sound effects here
    ├── complete.mp3
    ├── click.mp3
    └── error.mp3
```

### Step 3: Update Audio Manager

Edit `services/audioManager.ts` and uncomment/update the file imports:

```typescript
const AUDIO_FILES: Record<string, any> = {
  // Music tracks - uncomment these lines:
  homeMusic: require('../assets/audio/music/home.mp3'),
  gameplayMusic: require('../assets/audio/music/gameplay.mp3'),

  // Sound effects - uncomment these lines:
  numberPlace: require('../assets/audio/sfx/place.mp3'),
  puzzleComplete: require('../assets/audio/sfx/complete.mp3'),
  buttonClick: require('../assets/audio/sfx/click.mp3'),
  errorSound: require('../assets/audio/sfx/error.mp3'),
};
```

### Step 4: Test Your Audio

1. Restart the Expo development server:
   ```bash
   npm start --clear
   ```

2. Test on device or simulator:
   - Go to Settings and enable music
   - Navigate to home screen (should play home music)
   - Navigate to play screen (should fade to gameplay music)
   - Test volume controls in Settings

### Step 5: Push to Repository

Once your audio files are working:

```bash
# Add all audio files
git add assets/audio/music/*.mp3
git add assets/audio/sfx/*.mp3

# Also add the updated audio manager
git add services/audioManager.ts

# Commit
git commit -m "Add music and sound effect files"

# Push
git push
```

**Note about file sizes**: If you get warnings about large files:
- Compress your audio files further
- Use a lower bitrate (128 kbps)
- Consider using Git LFS for files over 50MB total

## User Controls

Users can control audio from the Settings screen:

### Music Controls
- **Toggle**: Enable/disable background music
- **Volume**: 0%, 25%, 50%, 75%, 100%

### Sound Effects Controls
- **Toggle**: Enable/disable sound effects
- **Volume**: 0%, 25%, 50%, 75%, 100%

Settings are persisted locally using AsyncStorage.

## Fade Effects

The audio system includes smooth fade in/out transitions:

- **Fade In**: 1500ms (1.5 seconds) when entering a screen
- **Fade Out**: 800ms (0.8 seconds) when leaving a screen
- **Background**: 300ms when app goes to background
- **Foreground**: 300ms when app returns to foreground

You can adjust these durations in the code:
```typescript
// In home screen or play screen
playMusic('homeMusic', 1500);  // Fade in duration
stopMusic(800);                 // Fade out duration
```

## Adding Sound Effects

To play sound effects in your code:

```typescript
import { useAudio } from '../contexts/AudioContext';

function MyComponent() {
  const { playSoundEffect } = useAudio();

  const handleButtonClick = () => {
    playSoundEffect('buttonClick');
    // Your button logic
  };

  return <Button onPress={handleButtonClick}>Click Me</Button>;
}
```

Available sound effects:
- `'numberPlace'` - When placing a number
- `'puzzleComplete'` - When completing a puzzle
- `'buttonClick'` - For button presses
- `'errorSound'` - For errors or invalid moves

## Free Music Resources

If you need royalty-free music:

### Music Libraries
- **Uppbeat** (https://uppbeat.io) - Free for YouTube creators
- **Pixabay Music** (https://pixabay.com/music) - CC0 license (public domain)
- **Incompetech** (https://incompetech.com) - CC BY 3.0 (attribution required)
- **Bensound** (https://bensound.com) - Some free tracks with attribution
- **Free Music Archive** (https://freemusicarchive.org) - Various licenses

### Sound Effects
- **Freesound** (https://freesound.org) - User-uploaded sound effects
- **Zapsplat** (https://www.zapsplat.com) - Free with attribution
- **Mixkit** (https://mixkit.co/free-sound-effects/) - Free sound effects

**Important**: Always check the license and provide attribution if required!

## Tips for Good Audio

### Music Selection
- **Home Screen**: Choose calming, ambient music
- **Gameplay**: Choose focus music (lo-fi, classical, or ambient)
- **Loop Seamlessly**: Ensure tracks loop without noticeable gaps
- **Volume**: Master your tracks at consistent volumes

### File Optimization
```bash
# Convert to MP3 with 128 kbps using FFmpeg
ffmpeg -i input.wav -b:a 128k -ar 44100 output.mp3

# Add fade in/out to help with looping
ffmpeg -i input.mp3 -af "afade=t=in:st=0:d=2,afade=t=out:st=28:d=2" output.mp3
```

### Testing Checklist
- [ ] Music plays on home screen
- [ ] Music fades between screens
- [ ] Gameplay music is different from home music
- [ ] Music pauses when app goes to background
- [ ] Volume controls work
- [ ] Toggle switches work
- [ ] Music stops when disabled
- [ ] Sound effects play (if implemented)

## Troubleshooting

### Music doesn't play
1. Check that MP3 files are in correct directories
2. Verify file names match exactly (case-sensitive)
3. Uncomment require() statements in audioManager.ts
4. Clear cache: `npm start --clear`
5. Check console for error messages

### Music cuts out or glitches
- Reduce file size/bitrate
- Ensure stable processing (background tasks)
- Check device storage

### No fade effect
- Verify fade durations in playMusic/stopMusic calls
- Check that music is actually playing before fade

### Sound on iOS but not Android (or vice versa)
- Test on multiple devices
- Check audio format compatibility
- Verify expo-av is properly installed

## Advanced: Customizing Fade Duration

You can customize fade durations per screen:

```typescript
// Quick fade for snappy transitions
playMusic('homeMusic', 500);

// Slow fade for dramatic effect
playMusic('gameplayMusic', 3000);

// No fade (instant)
playMusic('homeMusic', 0);
```

## Technical Details

- **Library**: expo-av
- **Format Support**: MP3, M4A, WAV, AAC
- **Storage**: Settings saved to AsyncStorage
- **Memory**: Sounds auto-unload after playing
- **Background Audio**: Enabled on iOS via audio mode configuration

## Need Help?

- Check `assets/audio/README.md` for quick reference
- Review code examples in `services/audioManager.ts`
- See integration examples in `app/(tabs)/index.tsx` and `app/(tabs)/play.tsx`
