import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { audioManager, MusicTrack, SoundEffect } from '../services/audioManager';
import { AppState, AppStateStatus } from 'react-native';

interface AudioSettings {
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

interface AudioContextType {
  settings: AudioSettings;
  playMusic: (track: MusicTrack, fadeInDuration?: number) => Promise<void>;
  stopMusic: (fadeOutDuration?: number) => Promise<void>;
  pauseMusic: (fadeOutDuration?: number) => Promise<void>;
  resumeMusic: (fadeInDuration?: number) => Promise<void>;
  playSoundEffect: (effect: SoundEffect) => Promise<void>;
  setMusicEnabled: (enabled: boolean) => Promise<void>;
  setSoundEffectsEnabled: (enabled: boolean) => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
  setSfxVolume: (volume: number) => Promise<void>;
  currentTrack: MusicTrack | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>({
    musicEnabled: true,
    soundEffectsEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.7,
  });
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);

  // Initialize audio manager
  useEffect(() => {
    const init = async () => {
      await audioManager.initialize();
      const loadedSettings = audioManager.getSettings();
      setSettings(loadedSettings);
    };

    init();

    // Cleanup on unmount
    return () => {
      audioManager.cleanup();
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // Pause music when app goes to background
      await audioManager.pauseMusic(300);
    } else if (nextAppState === 'active') {
      // Resume music when app comes to foreground
      await audioManager.resumeMusic(300);
    }
  };

  const playMusic = async (track: MusicTrack, fadeInDuration: number = 1000) => {
    await audioManager.playMusic(track, fadeInDuration);
    setCurrentTrack(audioManager.getCurrentTrack());
  };

  const stopMusic = async (fadeOutDuration: number = 500) => {
    await audioManager.stopMusic(fadeOutDuration);
    setCurrentTrack(null);
  };

  const pauseMusic = async (fadeOutDuration: number = 500) => {
    await audioManager.pauseMusic(fadeOutDuration);
  };

  const resumeMusic = async (fadeInDuration: number = 500) => {
    await audioManager.resumeMusic(fadeInDuration);
  };

  const playSoundEffect = async (effect: SoundEffect) => {
    await audioManager.playSoundEffect(effect);
  };

  const setMusicEnabled = async (enabled: boolean) => {
    await audioManager.setMusicEnabled(enabled);
    const updatedSettings = audioManager.getSettings();
    setSettings(updatedSettings);
    if (!enabled) {
      setCurrentTrack(null);
    }
  };

  const setSoundEffectsEnabled = async (enabled: boolean) => {
    await audioManager.setSoundEffectsEnabled(enabled);
    const updatedSettings = audioManager.getSettings();
    setSettings(updatedSettings);
  };

  const setMusicVolume = async (volume: number) => {
    await audioManager.setMusicVolume(volume);
    const updatedSettings = audioManager.getSettings();
    setSettings(updatedSettings);
  };

  const setSfxVolume = async (volume: number) => {
    await audioManager.setSfxVolume(volume);
    const updatedSettings = audioManager.getSettings();
    setSettings(updatedSettings);
  };

  const value: AudioContextType = {
    settings,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playSoundEffect,
    setMusicEnabled,
    setSoundEffectsEnabled,
    setMusicVolume,
    setSfxVolume,
    currentTrack,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
