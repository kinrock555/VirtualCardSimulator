export type BgmId = 'title' | 'play';

export type SoundEffectId = 'uiClick' | 'draw' | 'place' | 'flip' | 'shuffle';

export type AudioSettings = {
  masterVolume: number;
  bgmVolume: number;
  seVolume: number;
  bgmEnabled: boolean;
  seEnabled: boolean;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.8,
  bgmVolume: 0.4,
  seVolume: 0.7,
  bgmEnabled: true,
  seEnabled: true,
};
