import { useSyncExternalStore } from 'react';
import { isAudioUnlocked, subscribeAudioUnlocked } from '../../lib/audio/audioManager';

/**
 * Small "sound is muted until you interact" notice - browsers block audio
 * until the first click/tap/keypress, so without this a first-time visitor
 * would have no idea why the title BGM isn't playing yet. Disappears on its
 * own the moment audioManager's unlock listener fires (see AudioUnlockHint's
 * one subscription point, not a poll).
 */
export function AudioUnlockHint() {
  const unlocked = useSyncExternalStore(subscribeAudioUnlocked, isAudioUnlocked);

  if (unlocked) return null;

  return <p className="audio-unlock-hint">クリックしてサウンドを有効化</p>;
}
