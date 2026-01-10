import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';

// Audio file references
// To add your own MP3s:
// 1. Place MP3 files in assets/audio/music/ or assets/audio/sfx/
// 2. Uncomment the lines below and update with your filenames
// 3. Restart with: npx expo start --clear

// Default/built-in audio files
const DEFAULT_AUDIO_FILES: Record<string, any> = {
  // Music tracks
  homeMusic: require('../assets/audio/music/home.mp3'),
  gameplayMusic: require('../assets/audio/music/gameplay.mp3'),

  // Sound effects
  numberPlace: require('../assets/audio/sfx/place.mp3'),
  puzzleComplete: require('../assets/audio/sfx/complete.mp3'),
  buttonClick: require('../assets/audio/sfx/click.mp3'),
  errorSound: require('../assets/audio/sfx/error.mp3'),
};
const PREMIUM_SONG_FILES: Record<string, any> = {
  // Lo-fi tracks
   'lofi-chill': require('../assets/audio/music/premium/lofi-chill.mp3'),
   'lofi-study': require('../assets/audio/music/premium/lofi-study.mp3'),
   'lofi-cafe': require('../assets/audio/music/premium/lofi-cafe.mp3'),
   'lofi-sunset': require('../assets/audio/music/premium/lofi-sunset.mp3'),

  // Jazz tracks
   'jazz-piano': require('../assets/audio/music/premium/jazz-piano.mp3'),
   'jazz-saxophone': require('../assets/audio/music/premium/jazz-saxophone.mp3'),
   'jazz-swing': require('../assets/audio/music/premium/jazz-swing.mp3'),
   'jazz-bossa': require('../assets/audio/music/premium/jazz-bossa.mp3'),

  // Electronic tracks
   'electronic-synth': require('../assets/audio/music/premium/electronic-synth.mp3'),
   'electronic-space': require('../assets/audio/music/premium/electronic-space.mp3'),
   'electronic-neon': require('../assets/audio/music/premium/electronic-neon.mp3'),
   'electronic-zen': require('../assets/audio/music/premium/electronic-zen.mp3'),
};

// Combined audio files for lookup
const AUDIO_FILES: Record<string, any> = {
  ...DEFAULT_AUDIO_FILES,
  ...PREMIUM_SONG_FILES,
};

export type MusicTrack = 'homeMusic' | 'gameplayMusic';
export type PremiumSongId =
  | 'lofi-chill' | 'lofi-study' | 'lofi-cafe' | 'lofi-sunset'
  | 'jazz-piano' | 'jazz-saxophone' | 'jazz-swing' | 'jazz-bossa'
  | 'electronic-synth' | 'electronic-space' | 'electronic-neon' | 'electronic-zen';
export type SoundEffect = 'numberPlace' | 'puzzleComplete' | 'buttonClick' | 'errorSound';

interface AudioSettings {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
}

// Type for any playable music (default tracks or premium songs)
export type PlayableMusic = MusicTrack | PremiumSongId | string;

class AudioManager {
  private currentMusic: Audio.Sound | null = null;
  private currentTrack: PlayableMusic | null = null;
  private settings: AudioSettings = {
    musicEnabled: true,
    soundEffectsEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.7,
  };
  private isInitialized = false;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isFading = false;
  private musicOperationLock: Promise<void> = Promise.resolve();
  private cancelCurrentFade = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load saved settings
      await this.loadSettings();

      this.isInitialized = true;
      console.log('AudioManager initialized');
    } catch (error) {
      console.error('Error initializing AudioManager:', error);
    }
  }

  // Settings Management
  async loadSettings() {
    try {
      const saved = await AsyncStorage.getItem('audioSettings');
      if (saved) {
        this.settings = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem('audioSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving audio settings:', error);
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async setMusicEnabled(enabled: boolean) {
    this.settings.musicEnabled = enabled;
    await this.saveSettings();

    if (!enabled && this.currentMusic) {
      await this.stopMusic();
    }
  }

  async setSoundEffectsEnabled(enabled: boolean) {
    this.settings.soundEffectsEnabled = enabled;
    await this.saveSettings();
  }

  async setMusicVolume(volume: number) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();

    if (this.currentMusic) {
      await this.currentMusic.setVolumeAsync(this.settings.musicVolume);
    }
  }

  async setSfxVolume(volume: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();
  }

  // Check if a premium song audio file is available
  isSongAvailable(songId: string): boolean {
    return songId in AUDIO_FILES && AUDIO_FILES[songId] !== undefined;
  }

  // Get the appropriate audio source for a song (premium or default fallback)
  private getAudioSource(songIdOrTrack: PlayableMusic, fallbackTrack: MusicTrack = 'homeMusic'): any {
    // If it's a premium song ID, check if the file is available
    if (songIdOrTrack && AUDIO_FILES[songIdOrTrack]) {
      return AUDIO_FILES[songIdOrTrack];
    }
    // Fall back to default track
    return AUDIO_FILES[fallbackTrack] || null;
  }

  // Music Playback with Fade
  async playMusic(track: PlayableMusic, fadeInDuration: number = 1000) {
    // Queue this operation to prevent race conditions
    const previousLock = this.musicOperationLock;
    let releaseLock: () => void;
    this.musicOperationLock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      // Wait for any previous music operation to complete
      await previousLock;

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.settings.musicEnabled) {
        return;
      }

      const audioSource = this.getAudioSource(track);

      // Check if audio file exists
      if (!audioSource) {
        console.log(`Audio file for ${track} not found. Add your MP3 files to enable music.`);
        return;
      }

      // If same track is already playing, don't restart
      if (this.currentTrack === track && this.currentMusic) {
        try {
          const status = await this.currentMusic.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            console.log(`Track ${track} already playing, skipping restart`);
            return;
          }
        } catch {
          // If status check fails, continue to restart
        }
      }

      // Cancel any ongoing fade operations
      this.cancelCurrentFade = true;
      await new Promise(resolve => setTimeout(resolve, 50)); // Brief pause to allow fade cancellation

      // Stop current music if playing - MUST AWAIT to prevent overlap
      if (this.currentMusic) {
        console.log(`Stopping current track before playing ${track}`);
        const musicToStop = this.currentMusic;
        this.currentMusic = null;
        this.currentTrack = null;

        try {
          // Remove any status update listeners before stopping
          musicToStop.setOnPlaybackStatusUpdate(null);

          // Get current status to ensure clean stop
          const currentStatus = await musicToStop.getStatusAsync();
          if (currentStatus.isLoaded && currentStatus.isPlaying) {
            await musicToStop.stopAsync();
          }
          await musicToStop.unloadAsync();
          console.log('Previous track stopped and unloaded successfully');
        } catch (error) {
          // Ignore errors from already stopped/unloaded music
          console.log('Previous track already stopped/unloaded');
        }
      }

      // Brief delay to ensure complete cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const { sound } = await Audio.Sound.createAsync(
          audioSource,
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0, // Start at 0 for fade in
          }
        );

        this.currentMusic = sound;
        this.currentTrack = track;

        // Set up playback status monitoring to ensure proper looping
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            // Log any playback issues for debugging
            if (status.didJustFinish && !status.isLooping) {
              console.warn('Music finished but isLooping was false - this should not happen');
            }
            // Verify looping is enabled
            if (!status.isLooping && this.currentMusic === sound) {
              console.warn('Music isLooping flag is false, re-enabling');
              sound.setIsLoopingAsync(true).catch(err => {
                console.error('Failed to enable looping:', err);
              });
            }
          }
        });

        // Ensure looping is definitely enabled
        await sound.setIsLoopingAsync(true);

        // Reset fade cancellation flag
        this.cancelCurrentFade = false;

        // Fade in
        await this.fadeIn(fadeInDuration);

        console.log(`Playing music: ${track} (looping enabled)`);
      } catch (error) {
        console.error(`Error playing music ${track}:`, error);
      }
    } finally {
      // Release the lock
      releaseLock!();
    }
  }

  // Play selected song or fall back to default music
  async playSelectedSong(selectedSongId: string | null, fallbackTrack: MusicTrack = 'homeMusic', fadeInDuration: number = 1000) {
    // If no selected song or it's null, play the fallback (default music)
    if (!selectedSongId) {
      await this.playMusic(fallbackTrack, fadeInDuration);
      return;
    }

    // Try to play the selected premium song
    if (this.isSongAvailable(selectedSongId)) {
      await this.playMusic(selectedSongId, fadeInDuration);
    } else {
      // Premium song file not yet added, fall back to default
      console.log(`Premium song ${selectedSongId} not available, using default music`);
      await this.playMusic(fallbackTrack, fadeInDuration);
    }
  }

  async stopMusic(fadeOutDuration: number = 500) {
    // Queue this operation to prevent race conditions
    const previousLock = this.musicOperationLock;
    let releaseLock: () => void;
    this.musicOperationLock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      // Wait for any previous music operation to complete
      await previousLock;

      if (!this.currentMusic) return;

      // Store reference to avoid race conditions
      const musicToStop = this.currentMusic;

      // Clear current references immediately to prevent double-stopping
      this.currentMusic = null;
      this.currentTrack = null;

      // Cancel any ongoing fades
      this.cancelCurrentFade = true;

      try {
        // Remove status update listeners
        musicToStop.setOnPlaybackStatusUpdate(null);

        // Fade out if requested (simplified to avoid complex state)
        if (fadeOutDuration > 0) {
          const status = await musicToStop.getStatusAsync();
          if (status.isLoaded) {
            // Quick fade out
            const steps = 10;
            const stepDuration = fadeOutDuration / steps;
            const currentVolume = status.volume || 0;
            const volumeDecrement = currentVolume / steps;

            for (let i = steps; i >= 0; i--) {
              try {
                const newVolume = volumeDecrement * i;
                await musicToStop.setVolumeAsync(newVolume);
                await new Promise(resolve => setTimeout(resolve, stepDuration));
              } catch {
                break; // Stop fading if sound was released
              }
            }
          }
        }

        await musicToStop.stopAsync();
        await musicToStop.unloadAsync();

        console.log('Music stopped');
      } catch (error) {
        // Silently handle errors if music was already stopped/released
        if (error && !error.toString().includes('released') && !error.toString().includes('unloaded')) {
          console.error('Error stopping music:', error);
        }
      }
    } finally {
      // Release the lock
      releaseLock!();
    }
  }

  async pauseMusic(fadeOutDuration: number = 500) {
    if (!this.currentMusic) return;

    try {
      if (fadeOutDuration > 0) {
        await this.fadeOut(fadeOutDuration);
      }
      await this.currentMusic.pauseAsync();
      console.log('Music paused');
    } catch (error) {
      console.error('Error pausing music:', error);
    }
  }

  async resumeMusic(fadeInDuration: number = 500) {
    if (!this.currentMusic || !this.settings.musicEnabled) return;

    try {
      await this.currentMusic.setVolumeAsync(0);
      await this.currentMusic.playAsync();
      await this.fadeIn(fadeInDuration);
      console.log('Music resumed');
    } catch (error) {
      console.error('Error resuming music:', error);
    }
  }

  // Fade In/Out Effects
  private async fadeIn(duration: number) {
    if (!this.currentMusic || this.isFading) return;

    this.isFading = true;
    const targetVolume = this.settings.musicVolume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeIncrement = targetVolume / steps;

    for (let i = 0; i <= steps; i++) {
      // Check for cancellation
      if (!this.currentMusic || !this.isFading || this.cancelCurrentFade) {
        this.isFading = false;
        return;
      }

      const newVolume = volumeIncrement * i;
      try {
        await this.currentMusic.setVolumeAsync(newVolume);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      } catch (error) {
        console.error('Error during fade in:', error);
        break;
      }
    }

    this.isFading = false;
  }

  private async fadeOut(duration: number) {
    if (!this.currentMusic || this.isFading) return;

    this.isFading = true;
    const status = await this.currentMusic.getStatusAsync();
    if (!status.isLoaded) {
      this.isFading = false;
      return;
    }

    const currentVolume = status.volume || 0;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeDecrement = currentVolume / steps;

    for (let i = steps; i >= 0; i--) {
      // Check for cancellation
      if (!this.currentMusic || !this.isFading || this.cancelCurrentFade) {
        this.isFading = false;
        return;
      }

      const newVolume = volumeDecrement * i;
      try {
        await this.currentMusic.setVolumeAsync(newVolume);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      } catch (error) {
        console.error('Error during fade out:', error);
        break;
      }
    }

    this.isFading = false;
  }

  // Sound Effects
  async playSoundEffect(effect: SoundEffect) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.settings.soundEffectsEnabled) {
      return;
    }

    // Check if audio file exists
    if (!AUDIO_FILES[effect]) {
      console.log(`Audio file for ${effect} not found. Add your MP3 files to enable sound effects.`);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        AUDIO_FILES[effect],
        {
          shouldPlay: true,
          volume: this.settings.sfxVolume,
        }
      );

      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error(`Error playing sound effect ${effect}:`, error);
    }
  }

  // Utility
  getCurrentTrack(): PlayableMusic | null {
    return this.currentTrack;
  }

  async cleanup() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    if (this.currentMusic) {
      await this.stopMusic(0);
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
