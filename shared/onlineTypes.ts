import type { CardInstance, CardStack, CardZone, CardRotation } from './cardTypes';

// 2 players today; every online data structure is keyed/array-based so this
// can become 4 later just by changing this constant (see README).
export const MAX_PLAYERS_PER_ROOM = 2;

// How long an emptied room (all players disconnected) is kept in memory.
export const EMPTY_ROOM_TTL_MS = 60 * 60 * 1000; // 1 hour
export const ROOM_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const PLAYER_NAME_MAX_LENGTH = 20;
export const MAX_DRAW_COUNT = 200; // generous but finite - guards against absurd client input

/** Minimal deck contents sent once at room-creation time (the server never stores decks). */
export type DeckCardEntrySummary = {
  cardId: string;
  count: number;
};

export type OnlinePlayer = {
  playerId: string;
  socketId: string | null;
  name: string;
  connected: boolean;
  joinedAt: string;
  lastSeenAt: string;
};

/** Server-side card instance - always holds the true cardId/owner, never redacted. */
export type OnlineCardInstance = CardInstance & {
  ownerId: string | null;
};

/** Full authoritative table state the server holds for one room. */
export type ServerTableState = {
  deckId: string | null;
  cardInstances: Record<string, OnlineCardInstance>;
  stacks: CardStack[];
  /** playerId -> ordered instanceIds, one hand per player (see MAX_PLAYERS_PER_ROOM). */
  hands: Record<string, string[]>;
  selectedThemeId: string;
  updatedAt: string;
};

export type ServerRoom = {
  roomId: string;
  players: OnlinePlayer[];
  tableState: ServerTableState;
  createdAt: string;
  updatedAt: string;
  /** Timestamp of the moment the last connected player left; null while someone is connected. */
  emptySince: string | null;
};

/** Redacted view of a single card - safe to send to a given viewer. */
export type PublicCardView = {
  instanceId: string;
  cardId: string | null;
  faceUp: boolean;
  ownerId: string | null;
  zone: CardZone;
  position: { x: number; y: number; z: number };
  rotationY: CardRotation;
};

/** What one player's client receives - same shape for everyone, contents redacted per-viewer. */
export type PublicTableState = {
  deckId: string | null;
  cardInstances: Record<string, PublicCardView>;
  stacks: CardStack[];
  hands: Record<string, string[]>;
  selectedThemeId: string;
  updatedAt: string;
};

export type PublicRoomState = {
  roomId: string;
  players: OnlinePlayer[];
  table: PublicTableState;
  /** Who this payload was redacted for - lets the client tell "mine" apart from "theirs". */
  viewerId: string;
};

/** A single card entry returned by "山札の中を見る" - sent only to the requesting player. */
export type StackViewCard = {
  instanceId: string;
  cardId: string;
  faceUp: boolean;
};
