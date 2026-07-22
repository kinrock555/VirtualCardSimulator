import { create } from 'zustand';
import type { AudioSettings } from '../types/audio';
import { DEFAULT_AUDIO_SETTINGS } from '../types/audio';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';

type AudioSettingsState = AudioSettings & {
  setMasterVolume: (value: number) => void;
  setBgmVolume: (value: number) => void;
  setSeVolume: (value: number) => void;
  setBgmEnabled: (enabled: boolean) => void;
  setSeEnabled: (enabled: boolean) => void;
};

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function extractSettings(state: AudioSettingsState): AudioSettings {
  return {
    masterVolume: state.masterVolume,
    bgmVolume: state.bgmVolume,
    seVolume: state.seVolume,
    bgmEnabled: state.bgmEnabled,
    seEnabled: state.seEnabled,
  };
}

function persist(settings: AudioSettings): void {
  saveToStorage(STORAGE_KEYS.audioSettings, settings);
}

/**
 * Merges saved data OVER the defaults and validates each field
 * individually (instead of trusting the parsed JSON shape wholesale), so a
 * partial object from an older app version, or one with a corrupted field,
 * still comes out as a complete, in-range AudioSettings rather than an
 * error or a broken volume.
 */
function loadInitialSettings(): AudioSettings {
  const raw = loadFromStorage<Partial<AudioSettings>>(STORAGE_KEYS.audioSettings, {});
  return {
    masterVolume: typeof raw.masterVolume === 'number' ? clamp01(raw.masterVolume) : DEFAULT_AUDIO_SETTINGS.masterVolume,
    bgmVolume: typeof raw.bgmVolume === 'number' ? clamp01(raw.bgmVolume) : DEFAULT_AUDIO_SETTINGS.bgmVolume,
    seVolume: typeof raw.seVolume === 'number' ? clamp01(raw.seVolume) : DEFAULT_AUDIO_SETTINGS.seVolume,
    bgmEnabled: typeof raw.bgmEnabled === 'boolean' ? raw.bgmEnabled : DEFAULT_AUDIO_SETTINGS.bgmEnabled,
    seEnabled: typeof raw.seEnabled === 'boolean' ? raw.seEnabled : DEFAULT_AUDIO_SETTINGS.seEnabled,
  };
}

export const useAudioSettingsStore = create<AudioSettingsState>((set) => ({
  ...loadInitialSettings(),

  setMasterVolume: (value) => {
    set((state) => {
      const next = { ...state, masterVolume: clamp01(value) };
      persist(extractSettings(next));
      return { masterVolume: next.masterVolume };
    });
  },

  setBgmVolume: (value) => {
    set((state) => {
      const next = { ...state, bgmVolume: clamp01(value) };
      persist(extractSettings(next));
      return { bgmVolume: next.bgmVolume };
    });
  },

  setSeVolume: (value) => {
    set((state) => {
      const next = { ...state, seVolume: clamp01(value) };
      persist(extractSettings(next));
      return { seVolume: next.seVolume };
    });
  },

  setBgmEnabled: (enabled) => {
    set((state) => {
      const next = { ...state, bgmEnabled: enabled };
      persist(extractSettings(next));
      return { bgmEnabled: enabled };
    });
  },

  setSeEnabled: (enabled) => {
    set((state) => {
      const next = { ...state, seEnabled: enabled };
      persist(extractSettings(next));
      return { seEnabled: enabled };
    });
  },
}));
