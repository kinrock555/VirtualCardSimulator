import { AUDIO_ASSETS } from '../../config/audioAssets';
import type { BgmId, SoundEffectId } from '../../types/audio';
import { useAudioSettingsStore } from '../../store/useAudioSettingsStore';

/**
 * Centralized BGM/SE playback - the only module in the app that touches
 * `Audio` elements directly. Screens/components never construct their own
 * players; they call playBgm()/playSoundEffect() (or the useScreenBgm hook)
 * and this module owns volume, looping, track switching and the browser's
 * autoplay-gesture requirement.
 */

const BGM_FADE_MS = 400;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function effectiveBgmVolume(): number {
  const s = useAudioSettingsStore.getState();
  return s.bgmEnabled ? clamp01(s.masterVolume * s.bgmVolume) : 0;
}

function effectiveSeVolume(): number {
  const s = useAudioSettingsStore.getState();
  return s.seEnabled ? clamp01(s.masterVolume * s.seVolume) : 0;
}

let activeBgmId: BgmId | null = null;
let activeAudio: HTMLAudioElement | null = null;
/** Set when a play() attempt is rejected (autoplay-blocked) or was skipped
 *  entirely because playback was still locked - retried once the page is unlocked. */
let pendingBgmId: BgmId | null = null;
let fadeRaf: number | null = null;

function cancelFade(): void {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

/** Ramps `audio.volume` toward `target` over `durationMs`. Cancels any fade already in flight (on ANY element) first, since only one fade runs at a time in this module. */
function fadeVolume(audio: HTMLAudioElement, target: number, durationMs: number, onDone?: () => void): void {
  cancelFade();
  const start = audio.volume;
  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / durationMs);
    audio.volume = start + (target - start) * t;
    if (t < 1) {
      fadeRaf = requestAnimationFrame(step);
    } else {
      fadeRaf = null;
      onDone?.();
    }
  };
  fadeRaf = requestAnimationFrame(step);
}

function attemptPlay(audio: HTMLAudioElement, id: BgmId): void {
  let playResult: Promise<void> | undefined;
  try {
    playResult = audio.play();
  } catch {
    pendingBgmId = id;
    return;
  }
  if (playResult && typeof playResult.catch === 'function') {
    playResult
      .then(() => {
        if (activeAudio === audio) fadeVolume(audio, effectiveBgmVolume(), BGM_FADE_MS);
      })
      .catch(() => {
        // Autoplay blocked by the browser (no user gesture yet), or the
        // file failed to load - either way, try again once the page unlocks.
        pendingBgmId = id;
      });
  }
}

/**
 * Switches the currently playing BGM track. A no-op if `id` is already the
 * active track (besides making sure it's actually running) so screens can
 * call this on every mount without ever causing a restart or overlap.
 */
export function playBgm(id: BgmId): void {
  if (activeBgmId === id && activeAudio) {
    if (activeAudio.paused && effectiveBgmVolume() > 0) attemptPlay(activeAudio, id);
    return;
  }

  const previous = activeAudio;
  if (previous) {
    fadeVolume(previous, 0, BGM_FADE_MS, () => previous.pause());
  }

  activeBgmId = id;
  pendingBgmId = null;

  const audio = new Audio(AUDIO_ASSETS.bgm[id]);
  audio.loop = true;
  audio.volume = 0;
  audio.onerror = () => {
    // Missing/broken BGM file - stay silent, never let this break the app.
  };
  activeAudio = audio;

  if (effectiveBgmVolume() <= 0) {
    // Muted or BGM disabled - keep the element parked as the active track
    // (so re-enabling BGM later resumes THIS track) without playing it.
    return;
  }
  attemptPlay(audio, id);
}

export function stopBgm(): void {
  if (!activeAudio) return;
  const audio = activeAudio;
  fadeVolume(audio, 0, BGM_FADE_MS, () => audio.pause());
  activeAudio = null;
  activeBgmId = null;
  pendingBgmId = null;
}

/** Re-applies the current settings to whatever BGM is active - called whenever bgmEnabled/masterVolume/bgmVolume change. */
function refreshActiveBgmVolume(): void {
  if (!activeAudio || !activeBgmId) return;
  const target = effectiveBgmVolume();
  const audio = activeAudio;
  if (target <= 0) {
    if (!audio.paused) fadeVolume(audio, 0, BGM_FADE_MS, () => audio.pause());
    return;
  }
  if (audio.paused) {
    attemptPlay(audio, activeBgmId);
  } else {
    fadeVolume(audio, target, BGM_FADE_MS);
  }
}

/**
 * Fires a short one-shot sound effect. Each call gets its own `Audio`
 * instance so overlapping plays of the same SE (e.g. rapid draws) don't cut
 * each other off - the element is simply left to be garbage-collected once
 * playback ends. Never throws: a missing file, a decode error, or a still-
 * locked autoplay gate all just result in silence.
 */
export function playSoundEffect(id: SoundEffectId): void {
  const volume = effectiveSeVolume();
  if (volume <= 0) return;
  try {
    const audio = new Audio(AUDIO_ASSETS.se[id]);
    audio.volume = volume;
    audio.onerror = () => {};
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // Ignore - a sound effect must never be able to break gameplay.
  }
}

// --- Autoplay-unlock handling --------------------------------------------
//
// Browsers reject audio playback started before any user gesture. We
// register a single set of one-shot listeners (guarded so this can never
// happen twice even if the module were somehow re-entered) that flips
// `unlocked` and retries whatever BGM was waiting on the first pointer,
// touch, or key interaction anywhere in the app.

let unlocked = false;
let unlockListenersAttached = false;
const unlockSubscribers = new Set<() => void>();

function notifyUnlockSubscribers(): void {
  unlockSubscribers.forEach((callback) => callback());
}

function handleUnlockGesture(): void {
  window.removeEventListener('pointerdown', handleUnlockGesture);
  window.removeEventListener('keydown', handleUnlockGesture);
  window.removeEventListener('touchstart', handleUnlockGesture);
  unlocked = true;
  if (pendingBgmId && activeBgmId === pendingBgmId && activeAudio) {
    const id = pendingBgmId;
    pendingBgmId = null;
    attemptPlay(activeAudio, id);
  }
  notifyUnlockSubscribers();
}

function ensureUnlockListeners(): void {
  if (unlockListenersAttached) return;
  unlockListenersAttached = true;
  window.addEventListener('pointerdown', handleUnlockGesture);
  window.addEventListener('keydown', handleUnlockGesture);
  window.addEventListener('touchstart', handleUnlockGesture);
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Returns an unsubscribe function. */
export function subscribeAudioUnlocked(callback: () => void): () => void {
  unlockSubscribers.add(callback);
  return () => unlockSubscribers.delete(callback);
}

ensureUnlockListeners();
useAudioSettingsStore.subscribe(() => {
  refreshActiveBgmVolume();
});
