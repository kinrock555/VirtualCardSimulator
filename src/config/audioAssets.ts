import type { BgmId, SoundEffectId } from '../types/audio';

/**
 * Single source of truth for every audio file path. None of these ship in
 * the repo yet (see public/audio/README - no license-cleared BGM/SE were
 * available to add), but every path is wired up end to end: audioManager
 * treats a missing/404ing file the same as any other playback failure and
 * just stays silent, so the app works identically with or without real
 * files here - dropping a matching mp3 into public/audio/{bgm,se}/ is all
 * that's needed to turn sound on.
 */
export const AUDIO_ASSETS: {
  bgm: Record<BgmId, string>;
  se: Record<SoundEffectId, string>;
} = {
  bgm: {
    title: '/audio/bgm/title.mp3',
    play: '/audio/bgm/play.mp3',
  },
  se: {
    uiClick: '/audio/se/ui-click.mp3',
    draw: '/audio/se/draw.mp3',
    place: '/audio/se/place.mp3',
    flip: '/audio/se/flip.mp3',
    shuffle: '/audio/se/shuffle.mp3',
  },
};
