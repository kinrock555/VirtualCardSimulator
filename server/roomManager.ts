// In-memory room store - the whole point of this prototype is "no database".
// Everything here lives in a single Map and is lost on server restart
// (documented as an accepted limitation in README.md).
import type { DeckCardEntrySummary, OnlinePlayer, ServerRoom } from '../shared/onlineTypes';
import { EMPTY_ROOM_TTL_MS, MAX_PLAYERS_PER_ROOM, ROOM_CLEANUP_INTERVAL_MS } from '../shared/onlineTypes';
import { generateRoomId } from './utils/id';
import { buildInitialTableState, ensurePlayerHand } from './tableOperations';

const rooms = new Map<string, ServerRoom>();
/** socketId -> {roomId, playerId}, so a bare disconnect event can find who left. */
const socketIndex = new Map<string, { roomId: string; playerId: string }>();

function now(): string {
  return new Date().toISOString();
}

function recomputeEmptySince(room: ServerRoom): void {
  const anyoneConnected = room.players.some((p) => p.connected);
  if (anyoneConnected) {
    room.emptySince = null;
  } else if (room.emptySince === null) {
    room.emptySince = now();
  }
}

export function createRoom(
  hostPlayerId: string,
  hostName: string,
  deckId: string,
  deckCards: DeckCardEntrySummary[],
  themeId: string,
): ServerRoom {
  let roomId = generateRoomId();
  while (rooms.has(roomId)) roomId = generateRoomId(); // collision is astronomically unlikely, but stay safe
  const timestamp = now();
  const hostPlayer: OnlinePlayer = {
    playerId: hostPlayerId,
    socketId: null,
    name: hostName,
    connected: false, // flips true once the socket actually attaches (see socketHandlers.ts)
    joinedAt: timestamp,
    lastSeenAt: timestamp,
  };
  const room: ServerRoom = {
    roomId,
    players: [hostPlayer],
    tableState: buildInitialTableState(deckId, deckCards, themeId, [hostPlayerId]),
    createdAt: timestamp,
    updatedAt: timestamp,
    emptySince: null,
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): ServerRoom | undefined {
  return rooms.get(roomId);
}

export type JoinResult = { ok: true; room: ServerRoom; player: OnlinePlayer } | { ok: false; error: string };

export function joinRoom(roomId: string, playerId: string, playerName: string): JoinResult {
  const room = rooms.get(roomId);
  if (!room) return { ok: false, error: 'ルームが見つかりません' };

  const existing = room.players.find((p) => p.playerId === playerId);
  if (existing) {
    existing.name = playerName;
    existing.lastSeenAt = now();
    room.tableState = ensurePlayerHand(room.tableState, playerId);
    return { ok: true, room, player: existing };
  }

  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    return { ok: false, error: 'ルームが満員です' };
  }

  const timestamp = now();
  const newPlayer: OnlinePlayer = {
    playerId,
    socketId: null,
    name: playerName,
    connected: false,
    joinedAt: timestamp,
    lastSeenAt: timestamp,
  };
  room.players.push(newPlayer);
  room.tableState = ensurePlayerHand(room.tableState, playerId);
  room.updatedAt = timestamp;
  return { ok: true, room, player: newPlayer };
}

/** Attaches a live socket to an already-joined player (initial join or reconnect). */
export function attachSocket(roomId: string, playerId: string, socketId: string): ServerRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  const player = room.players.find((p) => p.playerId === playerId);
  if (!player) return undefined;

  // Same playerId connecting from a second tab/browser: the newest connection wins,
  // the previous socketId is treated as stale (its own disconnect event is a no-op below).
  if (player.socketId && player.socketId !== socketId) {
    socketIndex.delete(player.socketId);
  }
  player.socketId = socketId;
  player.connected = true;
  player.lastSeenAt = now();
  socketIndex.set(socketId, { roomId, playerId });
  recomputeEmptySince(room);
  return room;
}

export function findBySocketId(socketId: string): { roomId: string; playerId: string } | undefined {
  return socketIndex.get(socketId);
}

/** A live socket dropped (tab closed / network blip) - keep the player slot for reconnection. */
export function disconnectSocket(socketId: string): ServerRoom | undefined {
  const entry = socketIndex.get(socketId);
  if (!entry) return undefined;
  socketIndex.delete(socketId);
  const room = rooms.get(entry.roomId);
  if (!room) return undefined;
  const player = room.players.find((p) => p.playerId === entry.playerId);
  if (!player || player.socketId !== socketId) return room; // a newer socket already replaced this one
  player.connected = false;
  player.socketId = null;
  player.lastSeenAt = now();
  recomputeEmptySince(room);
  return room;
}

/** Explicit "leave room" - frees the player's slot entirely, unlike a bare disconnect. */
export function removePlayer(roomId: string, playerId: string): ServerRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  const player = room.players.find((p) => p.playerId === playerId);
  if (player?.socketId) socketIndex.delete(player.socketId);
  room.players = room.players.filter((p) => p.playerId !== playerId);
  room.updatedAt = now();
  recomputeEmptySince(room);
  return room;
}

export function updateTableState(roomId: string, updater: (room: ServerRoom) => void): ServerRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  updater(room);
  room.updatedAt = now();
  return room;
}

/** Deletes rooms that have been empty for longer than EMPTY_ROOM_TTL_MS. Called on an interval from index.ts. */
export function cleanupExpiredRooms(): number {
  const cutoff = Date.now() - EMPTY_ROOM_TTL_MS;
  let removed = 0;
  for (const [roomId, room] of rooms.entries()) {
    if (room.emptySince && Date.parse(room.emptySince) < cutoff) {
      rooms.delete(roomId);
      removed++;
    }
  }
  return removed;
}

export function startCleanupInterval(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const removed = cleanupExpiredRooms();
    if (removed > 0) console.log(`[roomManager] cleaned up ${removed} expired room(s)`);
  }, ROOM_CLEANUP_INTERVAL_MS);
}

export function getRoomCountForDebug(): number {
  return rooms.size;
}
