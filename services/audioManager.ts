import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';

// Audio file references
// To add your own MP3s:
// 1. Place MP3 files in assets/audio/music/ or assets/audio/sfx/
// 2. Uncomment the lines below and update with your filenames
// 3. Restart with: npx expo start --clear

// Audio files - placeholder silent MP3s included
// Replace these files with your own music in assets/audio/
const AUDIO_FILES: Record<string, any> = {
  // Music tracks
  homeMusic: require('../assets/audio/music/home.mp3'),
  gameplayMusic: require('../assets/audio/music/gameplay.mp3'),

  // Sound effects
  numberPlace: require('../assets/audio/sfx/place.mp3'),
  puzzleComplete: require('../assets/audio/sfx/complete.mp3'),
  buttonClick: require('../assets/audio/sfx/click.mp3'),
  errorSound: require('../assets/audio/sfx/error.mp3'),
};

export type MusicTrack = 'homeMusic' | 'gameplayMusic';
export type SoundEffect = 'numberPlace' | 'puzzleComplete' | 'buttonClick' | 'errorSound';

interface AudioSettings {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
}

class AudioManager {
  private currentMusic: Audio.Sound | null = null;
  private currentTrack: MusicTrack | null = null;
  private settings: AudioSettings = {
    musicEnabled: true,
    soundEffectsEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.7,
  };
  private isInitialized = false;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isFading = false;

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

  // Music Playback with Fade
  async playMusic(track: MusicTrack, fadeInDuration: number = 1000) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.settings.musicEnabled) {
      return;
    }

    // Check if audio file exists
    if (!AUDIO_FILES[track]) {
      console.log(`Audio file for ${track} not found. Add your MP3 files to enable music.`);
      return;
    }

    // If same track is already playing, don't restart
    if (this.currentTrack === track && this.currentMusic) {
      const status = await this.currentMusic.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        return;
      }
    }

    // Fade out and stop current music if playing
    if (this.currentMusic) {
      await this.fadeOut(500);
      await this.stopMusic();
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        AUDIO_FILES[track],
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0, // Start at 0 for fade in
        }
      );

      this.currentMusic = sound;
      this.currentTrack = track;

      // Fade in
      await this.fadeIn(fadeInDuration);

      console.log(`Playing music: ${track}`);
    } catch (error) {
      console.error(`Error playing music ${track}:`, error);
    }
  }

  async stopMusic(fadeOutDuration: number = 500) {
    if (!this.currentMusic) return;

    try {
      if (fadeOutDuration > 0) {
        await this.fadeOut(fadeOutDuration);
      }

      await this.currentMusic.stopAsync();
      await this.currentMusic.unloadAsync();
      this.currentMusic = null;
      this.currentTrack = null;

      console.log('Music stopped');
    } catch (error) {
      console.error('Error stopping music:', error);
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
      if (!this.currentMusic || !this.isFading) break;

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
      if (!this.currentMusic || !this.isFading) break;

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
  getCurrentTrack(): MusicTrack | null {
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
