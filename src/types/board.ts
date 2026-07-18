import type { CardInstance, CardStack } from './table';

export type BoardCameraState = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
};

/**
 * Pure data snapshot of a table session - card instances, stacks, hand order,
 * theme and camera framing. Never holds a Three.js object, only plain
 * numbers/strings, so it is safe to JSON.stringify into localStorage.
 */
export type BoardSnapshot = {
  deckId: string | null;
  cardInstances: Record<string, CardInstance>;
  stacks: CardStack[];
  hand: string[];
  selectedThemeId: string;
  /** Optional for backward compatibility - saves made before room environments existed omit this. */
  selectedRoomEnvironmentId?: string;
  camera: BoardCameraState | null;
};

export type SavedTableState = BoardSnapshot & {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
