import { generateRandomId } from './id';

const PLAYER_ID_KEY = 'vct.online.playerId.v1';
const PLAYER_NAME_KEY = 'vct.online.playerName.v1';

/** Stable per-browser identity used to reconnect to a room after a refresh - see README "再接続". */
export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = generateRandomId('player');
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (privacy mode, etc.) - fall back to a session-only id.
    return generateRandomId('player');
  }
}

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    // Non-fatal - the name just won't be remembered next time.
  }
}
