import type { CardInstance, CardStack } from './table';
import type { TestPlayer, TestPlayMode } from './testSession';

export type BoardCameraState = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
};

/**
 * Pure data snapshot of a table session - card instances, stacks, hand order,
 * theme and camera framing. Never holds a Three.js object, only plain
 * numbers/strings, so it is safe to JSON.stringify into localStorage.
 *
 * `version` distinguishes the pre-multiplayer save shape (absent/1: no
 * `players`/`testPlayMode`/etc - a single-player session, `hand` is that
 * player's whole hand) from the current shape (2: may describe a 1- or
 * 2-player pass-and-play session). Old saves load fine either way - see
 * useTableStore's applySnapshot for how a version-1 save is synthesized into
 * a single-player TestPlayer.
 */
export type BoardSnapshot = {
  version?: number;
  deckId: string | null;
  cardInstances: Record<string, CardInstance>;
  stacks: CardStack[];
  /** The currently-active player's hand (matches TableState.hand). */
  hand: string[];
  selectedThemeId: string;
  /** Optional for backward compatibility - saves made before room environments existed omit this. */
  selectedRoomEnvironmentId?: string;
  camera: BoardCameraState | null;
  /** Optional for backward compatibility - saves made before the camera-view toggle existed omit this. */
  cameraView?: 'oblique' | 'top';
  /** Everything below is optional/absent on version-1 (pre-multiplayer) saves. */
  testPlayMode?: TestPlayMode;
  players?: TestPlayer[];
  currentPlayerIndex?: number;
  sharedDeckStackId?: string | null;
  /** instanceId -> owning playerId, only meaningful in mirroredDecks/separateDecks mode. */
  deckOwnerByInstanceId?: Record<string, string>;
};

export type SavedTableState = BoardSnapshot & {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
