# Audio Assets

This directory contains all audio files for Sudokle.

## 🔊 Current Status

**Placeholder files are included** - The app currently has minimal silent MP3 files as placeholders. Replace them with your own music to hear actual audio!

## Directory Structure

```
assets/audio/
├── music/           # Background music tracks
│   ├── home.mp3     # Home screen music (PLACEHOLDER - replace me!)
│   └── gameplay.mp3 # Gameplay music (PLACEHOLDER - replace me!)
└── sfx/             # Sound effects
    ├── place.mp3    # Number placement sound (placeholder)
    ├── complete.mp3 # Puzzle completion sound (placeholder)
    ├── click.mp3    # Button click sound (placeholder)
    └── error.mp3    # Error sound (placeholder)
```

## 🎵 Replacing Placeholder Files

The app works out of the box, but the included audio files are just silent placeholders. Here's how to add your own music:

### Step 1: Prepare Your Audio Files

1. **Format**: Use MP3 format (most compatible)
2. **Bitrate**: 128-192 kbps recommended (balance between quality and file size)
3. **Music Tracks**:
   - Should loop seamlessly (fade in/out at start/end)
   - Keep file size reasonable (<5MB per track)
4. **Sound Effects**:
   - Keep short (0.5-2 seconds)
   - Small file size (<100KB each)

### Step 2: Replace the Placeholder Files

Simply **overwrite** the existing MP3 files with your own:

**On Windows:**
1. Navigate to: `C:\Users\YourName\Desktop\Sudokle\SudokleApp\assets\audio\music\`
2. Copy your `home.mp3` file here (overwrite the existing one)
3. Copy your `gameplay.mp3` file here (overwrite the existing one)
4. Repeat for sound effects in the `sfx\` folder

**On Mac/Linux:**
```bash
# Copy your music files (replace the placeholders)
cp /path/to/your/home-music.mp3 assets/audio/music/home.mp3
cp /path/to/your/gameplay-music.mp3 assets/audio/music/gameplay.mp3

# Copy your sound effects
cp /path/to/your/place-sound.mp3 assets/audio/sfx/place.mp3
cp /path/to/your/complete-sound.mp3 assets/audio/sfx/complete.mp3
```

### Step 3: Restart the App

```bash
# Clear cache and restart
npx expo start --clear

# Press 'w' for web, 'a' for Android, or 'i' for iOS
```

### Step 4: Enable Music in Settings

1. Open the app
2. Tap Settings ⚙️ (top right)
3. Scroll to "Audio & Music"
4. Toggle "Background Music" ON
5. Adjust volume as desired
6. Go back to home screen - you should hear your music!

## ✅ No Code Changes Needed!

Unlike before, you **don't need to edit any code files**. Just replace the MP3 files and restart. The audio manager is already configured to load them.

### Step 5: Commit Your Changes (Optional)

```bash
# Add your new audio files
git add assets/audio/music/*.mp3
git add assets/audio/sfx/*.mp3

# Commit
git commit -m "Replace placeholder audio with custom music"

# Push to your branch
git push
```

**Note**: If your audio files are large (>10MB total), consider:
- Compressing them further
- Using lower bitrate (128 kbps)
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
