import { useEffect } from 'react';
import { playBgm } from './audioManager';
import type { BgmId } from '../../types/audio';

/**
 * Declares "this screen's BGM is `bgmId`" for as long as it's mounted.
 * playBgm() itself is idempotent for an already-active track, so mounting
 * the same screen repeatedly (or two screens requesting the same track)
 * never restarts or overlaps playback - the actual switching/fading lives
 * entirely in audioManager.
 */
export function useScreenBgm(bgmId: BgmId): void {
  useEffect(() => {
    playBgm(bgmId);
  }, [bgmId]);
}
