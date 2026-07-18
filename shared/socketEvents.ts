import type { DeckCardEntrySummary, OnlinePlayer, PublicRoomState, StackViewCard } from './onlineTypes';

export const SOCKET_EVENTS = {
  // Room lifecycle (client -> server unless noted)
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE_SYNC: 'room:state:sync', // server -> client, full redacted state
  PLAYER_LIST_UPDATE: 'room:players:update', // server -> client

  // Single-card operations
  CARD_MOVE: 'card:move', // throttled in-progress drag position (not persisted as a commit)
  CARD_MOVE_COMMIT: 'card:move:commit', // final drag position - server commits + resyncs
  CARD_FLIP: 'card:flip',
  CARD_ROTATE: 'card:rotate',
  CARD_ZONE_MOVE: 'card:zone:move',

  // Stack / pile operations
  STACK_SHUFFLE: 'stack:shuffle',
  STACK_DRAW: 'stack:draw',
  STACK_REVEAL_TOP: 'stack:revealTop',
  STACK_REORDER: 'stack:reorder',
  STACK_CREATE: 'stack:create',
  STACK_UNSTACK: 'stack:unstack',
  STACK_MOVE: 'stack:move',
  STACK_RETURN_ALL: 'stack:returnAll',
  STACK_VIEW_REQUEST: 'stack:view:request', // client -> server, ack-style response
  STACK_VIEW_RESULT: 'stack:view:result', // server -> requesting client only

  // Table-wide operations
  TABLE_RESET: 'table:reset',
  TABLE_THEME_SET: 'table:theme:set',

  ERROR: 'server:error', // server -> client
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// ---------- client -> server request payloads ----------

export type RoomCreateRequest = {
  playerId: string;
  playerName: string;
  deckId: string;
  deckCards: DeckCardEntrySummary[];
  themeId: string;
};

export type RoomJoinRequest = {
  roomId: string;
  playerId: string;
  playerName: string;
};

export type RoomLeaveRequest = {
  roomId: string;
  playerId: string;
};

export type CardMoveRequest = {
  roomId: string;
  playerId: string;
  instanceId: string;
  x: number;
  z: number;
};

export type CardMoveCommitRequest = CardMoveRequest & {
  clientSeq: number; // monotonically increasing per client drag, guards against out-of-order commits
};

export type CardFlipRequest = {
  roomId: string;
  playerId: string;
  instanceId: string;
  faceUp: boolean;
};

export type CardRotateRequest = {
  roomId: string;
  playerId: string;
  instanceId: string;
  direction: 'left' | 'right';
};

export type CardZoneDestination = 'hand' | 'tableFaceUp' | 'tableFaceDown' | 'graveyard' | 'banished' | 'deckTop' | 'deckBottom';

export type CardZoneMoveRequest = {
  roomId: string;
  playerId: string;
  instanceId: string;
  destination: CardZoneDestination;
  /** Optional drop position - only used for tableFaceUp/tableFaceDown (e.g. dragging a hand card onto the table). */
  x?: number;
  z?: number;
};

export type StackShuffleRequest = { roomId: string; playerId: string; stackId: string };
export type StackDrawRequest = { roomId: string; playerId: string; stackId: string; count: number };
export type StackRevealTopRequest = { roomId: string; playerId: string; stackId: string };
export type StackReorderRequest = { roomId: string; playerId: string; stackId: string; orderedInstanceIds: string[] };
export type StackCreateRequest = { roomId: string; playerId: string; instanceIds: string[] };
export type StackUnstackRequest = { roomId: string; playerId: string; stackId: string };
export type StackMoveRequest = { roomId: string; playerId: string; stackId: string; x: number; z: number };
export type StackReturnAllRequest = { roomId: string; playerId: string; stackId: string };
export type StackViewRequest = { roomId: string; playerId: string; stackId: string };

export type TableResetRequest = { roomId: string; playerId: string };
export type TableThemeSetRequest = { roomId: string; playerId: string; themeId: string };

// ---------- server -> client payloads ----------

export type AckResponse = { ok: true } | { ok: false; error: string };
export type RoomCreateAck = { ok: true; roomId: string; state: PublicRoomState } | { ok: false; error: string };
export type RoomJoinAck = { ok: true; state: PublicRoomState } | { ok: false; error: string };
export type StackViewAck = { ok: true; stackId: string; cards: StackViewCard[] } | { ok: false; error: string };

export type PlayerListUpdatePayload = { players: OnlinePlayer[] };
export type RoomStateSyncPayload = { state: PublicRoomState };
export type CardMoveBroadcastPayload = { instanceId: string; x: number; z: number; byPlayerId: string };
export type ServerErrorPayload = { code: string; message: string };
