import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { SOUND_PACKS } from '../constants/customizations';

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
   'jazz-midnight': require('../assets/audio/music/premium/jazz-midnight.mp3'),
   'jazz-smooth': require('../assets/audio/music/premium/jazz-smooth.mp3'),

  // Electronic tracks
   'electronic-synth': require('../assets/audio/music/premium/electronic-synth.mp3'),
   'electronic-space': require('../assets/audio/music/premium/electronic-space.mp3'),
   'electronic-neon': require('../assets/audio/music/premium/electronic-neon.mp3'),
   'electronic-zen': require('../assets/audio/music/premium/electronic-zen.mp3'),

  // Rock tracks
   'rock-classic': require('../assets/audio/music/premium/rock-classic.mp3'),
   'rock-acoustic': require('../assets/audio/music/premium/rock-acoustic.mp3'),
   'rock-indie': require('../assets/audio/music/premium/rock-indie.mp3'),
   'rock-power': require('../assets/audio/music/premium/rock-power.mp3'),

  // Reggae tracks
   'reggae-chill': require('../assets/audio/music/premium/reggae-chill.mp3'),
   'reggae-dub': require('../assets/audio/music/premium/reggae-dub.mp3'),
   'reggae-roots': require('../assets/audio/music/premium/reggae-roots.mp3'),
   'reggae-sunset': require('../assets/audio/music/premium/reggae-sunset.mp3'),
};

// Combined audio files for lookup
const AUDIO_FILES: Record<string, any> = {
  ...DEFAULT_AUDIO_FILES,
  ...PREMIUM_SONG_FILES,
};

export type MusicTrack = 'homeMusic' | 'gameplayMusic';
export type PremiumSongId =
  | 'lofi-chill' | 'lofi-study' | 'lofi-cafe' | 'lofi-sunset'
  | 'jazz-piano' | 'jazz-saxophone' | 'jazz-swing' | 'jazz-bossa' | 'jazz-midnight' | 'jazz-smooth'
  | 'electronic-synth' | 'electronic-space' | 'electronic-neon' | 'electronic-zen'
  | 'rock-classic' | 'rock-acoustic' | 'rock-indie' | 'rock-power'
  | 'reggae-chill' | 'reggae-dub' | 'reggae-roots' | 'reggae-sunset';
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
  private activeSoundPackId: string = 'default';

  /** Called by CurrencyContext whenever selectedSoundPack changes. */
  setActiveSoundPack(packId: string) {
    this.activeSoundPackId = packId;
  }

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
    console.log(`[AUDIO] playMusic() CALLED for track: ${track}`);

    // Queue this operation to prevent race conditions
    const previousLock = this.musicOperationLock;
    let releaseLock: () => void;
    this.musicOperationLock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      // Wait for any previous music operation to complete
      await previousLock;
      console.log(`[AUDIO] Lock acquired for track: ${track}`);

      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.settings.musicEnabled) {
        console.log(`[AUDIO] Music disabled, skipping`);
        return;
      }

      const audioSource = this.getAudioSource(track);
      if (!audioSource) {
        console.log(`[AUDIO] No audio file for ${track}`);
        return;
      }

      // Simple check: if same track is already playing, skip
      if (this.currentTrack === track && this.currentMusic) {
        try {
          const status = await this.currentMusic.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            console.log(`[AUDIO] ${track} already playing, skipping`);
            return;
          }
        } catch {
          // Continue if status check fails
        }
      }

      // Stop current music if any
      if (this.currentMusic) {
        console.log(`[AUDIO] Stopping previous track: ${this.currentTrack}`);
        const musicToStop = this.currentMusic;
        this.currentMusic = null;
        this.currentTrack = null;

        try {
          musicToStop.setOnPlaybackStatusUpdate(null);
          await musicToStop.stopAsync();
          await musicToStop.unloadAsync();
        } catch {
          // Ignore stop errors
        }
      }

      // Create and play new track
      console.log(`[AUDIO] Creating sound for: ${track}`);
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

      // Set up looping monitoring
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && !status.isLooping && this.currentMusic === sound) {
          sound.setIsLoopingAsync(true).catch(() => {});
        }
      });

      await sound.setIsLoopingAsync(true);

      // Fade in
      await this.fadeIn(fadeInDuration);

      console.log(`[AUDIO] ✓ ${track} now playing`);
    } catch (error) {
      console.error(`[AUDIO] ✗ Error playing ${track}:`, error);
    } finally {
      releaseLock!();
    }
  }

  // Play selected song or fall back to default music
  async playSelectedSong(selectedSongId: string | null, fallbackTrack: MusicTrack = 'homeMusic', fadeInDuration: number = 1000) {
    console.log(`[AUDIO] playSelectedSong() called with: selectedSongId=${selectedSongId}, fallback=${fallbackTrack}`);

    // If no selected song or it's null, play the fallback (default music)
    if (!selectedSongId) {
      console.log(`[AUDIO] No selected song, playing fallback: ${fallbackTrack}`);
      await this.playMusic(fallbackTrack, fadeInDuration);
      return;
    }

    // Try to play the selected premium song
    if (this.isSongAvailable(selectedSongId)) {
      console.log(`[AUDIO] Selected song ${selectedSongId} is available, playing it`);
      await this.playMusic(selectedSongId, fadeInDuration);
    } else {
      // Premium song file not yet added, fall back to default
      console.log(`[AUDIO] Premium song ${selectedSongId} not available, using default music ${fallbackTrack}`);
      await this.playMusic(fallbackTrack, fadeInDuration);
    }
  }

  async stopMusic(fadeOutDuration: number = 500) {
    console.log(`[AUDIO] stopMusic() CALLED, currentTrack: ${this.currentTrack}`);

    // Queue this operation to prevent race conditions
    const previousLock = this.musicOperationLock;
    let releaseLock: () => void;
    this.musicOperationLock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      // Wait for any previous music operation to complete
      await previousLock;
      console.log(`[AUDIO] stopMusic() lock acquired`);

      if (!this.currentMusic) {
        console.log(`[AUDIO] No music to stop`);
        return;
      }

      const musicToStop = this.currentMusic;
      const stoppedTrack = this.currentTrack;

      // Clear references
      this.currentMusic = null;
      this.currentTrack = null;

      try {
        musicToStop.setOnPlaybackStatusUpdate(null);
        await musicToStop.stopAsync();
        await musicToStop.unloadAsync();
        console.log(`[AUDIO] ✓ Stopped: ${stoppedTrack}`);
      } catch {
        // Ignore stop errors
      }
    } finally {
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

    // For packable effects (not buttonClick), try the active sound pack first
    let assetToPlay: any = null;
    if (effect !== 'buttonClick' && this.activeSoundPackId !== 'default') {
      const pack = SOUND_PACKS.find(p => p.id === this.activeSoundPackId);
      if (pack) {
        assetToPlay = pack.files[effect as keyof typeof pack.files];
      }
    }

    // Fall back to default AUDIO_FILES if no pack asset resolved
    if (!assetToPlay) {
      assetToPlay = AUDIO_FILES[effect];
    }

    if (!assetToPlay) {
      console.log(`Audio file for ${effect} not found. Add your MP3 files to enable sound effects.`);
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(assetToPlay, {
        shouldPlay: true,
        volume: this.settings.sfxVolume,
      });

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

  /** Play a sound effect from a pre-resolved asset module (used by sound packs). */
  async playSoundEffectAsset(asset: any) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.settings.soundEffectsEnabled || !asset) {
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(asset, {
        shouldPlay: true,
        volume: this.settings.sfxVolume,
      });

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing sound effect asset:', error);
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
