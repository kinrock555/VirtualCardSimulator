import type { Server, Socket } from 'socket.io';
import type { ServerRoom } from '../shared/onlineTypes';
import { SOCKET_EVENTS } from '../shared/socketEvents';
import type {
  CardFlipRequest,
  CardMoveCommitRequest,
  CardMoveRequest,
  CardRotateRequest,
  CardZoneMoveRequest,
  RoomCreateAck,
  RoomCreateRequest,
  RoomJoinAck,
  RoomJoinRequest,
  RoomLeaveRequest,
  StackCreateRequest,
  StackDrawRequest,
  StackMoveRequest,
  StackReorderRequest,
  StackReturnAllRequest,
  StackRevealTopRequest,
  StackShuffleRequest,
  StackUnstackRequest,
  StackViewAck,
  StackViewRequest,
  TableResetRequest,
  TableThemeSetRequest,
  AckResponse,
} from '../shared/socketEvents';
import {
  isNonEmptyString,
  isValidCoordinate,
  isValidDrawCount,
  isValidInstanceId,
  isValidInstanceIdArray,
  isValidPlayerId,
  isValidPlayerName,
  isValidRoomId,
  isValidRotationDirection,
  isValidStackId,
  isValidThemeId,
  normalizePlayerName,
} from '../shared/validation';
import * as rooms from './roomManager';
import * as ops from './tableOperations';

const MAX_DECK_ENTRIES = 500;

function isValidDeckCards(value: unknown): value is { cardId: string; count: number }[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_DECK_ENTRIES &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        isNonEmptyString((entry as { cardId?: unknown }).cardId, 200) &&
        Number.isInteger((entry as { count?: unknown }).count) &&
        (entry as { count: number }).count >= 0 &&
        (entry as { count: number }).count <= 1000,
    )
  );
}

function broadcastPlayerList(io: Server, room: ServerRoom): void {
  io.to(room.roomId).emit(SOCKET_EVENTS.PLAYER_LIST_UPDATE, { players: room.players });
}

/** Table state is redacted per-viewer (hand privacy), so this is a per-socket send, not a room broadcast. */
function broadcastTableState(io: Server, room: ServerRoom): void {
  for (const player of room.players) {
    if (!player.socketId || !player.connected) continue;
    io.to(player.socketId).emit(SOCKET_EVENTS.ROOM_STATE_SYNC, {
      state: {
        roomId: room.roomId,
        players: room.players,
        table: ops.toPublicTableState(room.tableState, player.playerId),
        viewerId: player.playerId,
      },
    });
  }
}

function sendError(socket: Socket, message: string): void {
  socket.emit(SOCKET_EVENTS.ERROR, { code: 'operation_failed', message });
}

/** Shared plumbing for every "validate -> mutate room.tableState -> broadcast -> ack" handler. */
function applyAndBroadcast(
  io: Server,
  socket: Socket,
  roomId: string,
  playerId: string,
  ack: ((response: AckResponse) => void) | undefined,
  operation: (state: import('../shared/onlineTypes').ServerTableState) => ops.OpResult,
): void {
  const room = rooms.getRoom(roomId);
  if (!room || !room.players.some((p) => p.playerId === playerId)) {
    ack?.({ ok: false, error: 'ルームまたはプレイヤーが見つかりません' });
    return;
  }
  const result = operation(room.tableState);
  if (!result.ok) {
    ack?.({ ok: false, error: result.error });
    sendError(socket, result.error);
    return;
  }
  room.tableState = result.state;
  room.updatedAt = new Date().toISOString();
  broadcastTableState(io, room);
  ack?.({ ok: true });
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on(SOCKET_EVENTS.ROOM_CREATE, (payload: RoomCreateRequest, ack?: (r: RoomCreateAck) => void) => {
      if (!payload || typeof payload !== 'object') return ack?.({ ok: false, error: '不正な要求です' });
      const { playerId, playerName, deckId, deckCards, themeId } = payload;
      if (!isValidPlayerId(playerId)) return ack?.({ ok: false, error: 'プレイヤー情報が不正です' });
      if (!isValidPlayerName(playerName)) return ack?.({ ok: false, error: '名前は1〜20文字で入力してください' });
      if (!isNonEmptyString(deckId, 200)) return ack?.({ ok: false, error: 'デッキが選択されていません' });
      if (!isValidDeckCards(deckCards)) return ack?.({ ok: false, error: 'デッキデータが不正です' });
      if (!isValidThemeId(themeId)) return ack?.({ ok: false, error: 'テーマが不正です' });

      const room = rooms.createRoom(playerId, normalizePlayerName(playerName), deckId, deckCards, themeId);
      rooms.attachSocket(room.roomId, playerId, socket.id);
      void socket.join(room.roomId);

      ack?.({
        ok: true,
        roomId: room.roomId,
        state: { roomId: room.roomId, players: room.players, table: ops.toPublicTableState(room.tableState, playerId), viewerId: playerId },
      });
      broadcastPlayerList(io, room);
    });

    socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload: RoomJoinRequest, ack?: (r: RoomJoinAck) => void) => {
      if (!payload || typeof payload !== 'object') return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, playerName } = payload;
      if (!isValidRoomId(roomId)) return ack?.({ ok: false, error: 'ルームIDの形式が不正です' });
      if (!isValidPlayerId(playerId)) return ack?.({ ok: false, error: 'プレイヤー情報が不正です' });
      if (!isValidPlayerName(playerName)) return ack?.({ ok: false, error: '名前は1〜20文字で入力してください' });

      const result = rooms.joinRoom(roomId, playerId, normalizePlayerName(playerName));
      if (!result.ok) return ack?.({ ok: false, error: result.error });

      rooms.attachSocket(roomId, playerId, socket.id);
      void socket.join(roomId);

      ack?.({
        ok: true,
        state: {
          roomId,
          players: result.room.players,
          table: ops.toPublicTableState(result.room.tableState, playerId),
          viewerId: playerId,
        },
      });
      broadcastPlayerList(io, result.room);
      broadcastTableState(io, result.room);
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (payload: RoomLeaveRequest) => {
      if (!payload || !isValidRoomId(payload.roomId) || !isValidPlayerId(payload.playerId)) return;
      const room = rooms.removePlayer(payload.roomId, payload.playerId);
      void socket.leave(payload.roomId);
      if (room) broadcastPlayerList(io, room);
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE, (payload: CardMoveRequest) => {
      if (!payload) return;
      const { roomId, playerId, instanceId, x, z } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceId(instanceId)) return;
      if (!isValidCoordinate(x) || !isValidCoordinate(z)) return;
      const room = rooms.getRoom(roomId);
      if (!room || !room.players.some((p) => p.playerId === playerId)) return;
      const result = ops.moveCardEphemeral(room.tableState, instanceId, x, z);
      if (!result.ok) return;
      room.tableState = result.state;
      const card = room.tableState.cardInstances[instanceId];
      socket.to(roomId).emit(SOCKET_EVENTS.CARD_MOVE, { instanceId, x: card.position.x, z: card.position.z, byPlayerId: playerId });
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE_COMMIT, (payload: CardMoveCommitRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, instanceId, x, z } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceId(instanceId) || !isValidCoordinate(x) || !isValidCoordinate(z)) {
        return ack?.({ ok: false, error: '不正な座標です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.moveCardCommit(state, instanceId, x, z));
    });

    socket.on(SOCKET_EVENTS.CARD_FLIP, (payload: CardFlipRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, instanceId, faceUp } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceId(instanceId) || typeof faceUp !== 'boolean') {
        return ack?.({ ok: false, error: '不正な要求です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.flipCard(state, instanceId, faceUp));
    });

    socket.on(SOCKET_EVENTS.CARD_ROTATE, (payload: CardRotateRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, instanceId, direction } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceId(instanceId) || !isValidRotationDirection(direction)) {
        return ack?.({ ok: false, error: '不正な要求です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.rotateCard(state, instanceId, direction));
    });

    socket.on(SOCKET_EVENTS.CARD_ZONE_MOVE, (payload: CardZoneMoveRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, instanceId, destination, x, z } = payload;
      const validDestinations = ['hand', 'tableFaceUp', 'tableFaceDown', 'graveyard', 'banished', 'deckTop', 'deckBottom'];
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceId(instanceId) || !validDestinations.includes(destination)) {
        return ack?.({ ok: false, error: '不正な要求です' });
      }
      const targetPosition = x !== undefined && z !== undefined && isValidCoordinate(x) && isValidCoordinate(z) ? { x, z } : undefined;
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.moveCardZone(state, playerId, instanceId, destination, targetPosition));
    });

    socket.on(SOCKET_EVENTS.STACK_SHUFFLE, (payload: StackShuffleRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId)) return ack?.({ ok: false, error: '不正な要求です' });
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.shuffleStack(state, stackId));
    });

    socket.on(SOCKET_EVENTS.STACK_DRAW, (payload: StackDrawRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId, count } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId) || !isValidDrawCount(count)) {
        return ack?.({ ok: false, error: '枚数が不正です' });
      }
      const room = rooms.getRoom(roomId);
      if (!room || !room.players.some((p) => p.playerId === playerId)) return ack?.({ ok: false, error: 'ルームが見つかりません' });
      const result = ops.drawFromStack(room.tableState, playerId, stackId, count);
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        sendError(socket, result.error);
        return;
      }
      room.tableState = result.state;
      room.updatedAt = new Date().toISOString();
      broadcastTableState(io, room);
      ack?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.STACK_REVEAL_TOP, (payload: StackRevealTopRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId)) return ack?.({ ok: false, error: '不正な要求です' });
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.revealStackTop(state, stackId));
    });

    socket.on(SOCKET_EVENTS.STACK_REORDER, (payload: StackReorderRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId, orderedInstanceIds } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId) || !isValidInstanceIdArray(orderedInstanceIds)) {
        return ack?.({ ok: false, error: '不正な要求です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.reorderStack(state, stackId, orderedInstanceIds));
    });

    socket.on(SOCKET_EVENTS.STACK_CREATE, (payload: StackCreateRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, instanceIds } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidInstanceIdArray(instanceIds) || instanceIds.length === 0) {
        return ack?.({ ok: false, error: '不正な要求です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.createStackFromSelection(state, instanceIds));
    });

    socket.on(SOCKET_EVENTS.STACK_UNSTACK, (payload: StackUnstackRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId)) return ack?.({ ok: false, error: '不正な要求です' });
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.unstackCustomStack(state, stackId));
    });

    socket.on(SOCKET_EVENTS.STACK_MOVE, (payload: StackMoveRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId, x, z } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId) || !isValidCoordinate(x) || !isValidCoordinate(z)) {
        return ack?.({ ok: false, error: '不正な座標です' });
      }
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.moveStack(state, stackId, x, z));
    });

    socket.on(SOCKET_EVENTS.STACK_RETURN_ALL, (payload: StackReturnAllRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId)) return ack?.({ ok: false, error: '不正な要求です' });
      applyAndBroadcast(io, socket, roomId, playerId, ack, (state) => ops.returnAllToMainDeck(state, stackId));
    });

    socket.on(SOCKET_EVENTS.STACK_VIEW_REQUEST, (payload: StackViewRequest, ack?: (r: StackViewAck) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, stackId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidStackId(stackId)) return ack?.({ ok: false, error: '不正な要求です' });
      const room = rooms.getRoom(roomId);
      if (!room || !room.players.some((p) => p.playerId === playerId)) return ack?.({ ok: false, error: 'ルームが見つかりません' });
      const cards = ops.getStackViewCards(room.tableState, stackId);
      if (!cards) return ack?.({ ok: false, error: '対象が見つかりません' });
      // Sent only to the requester via the ack callback - nobody else in the room receives this.
      ack?.({ ok: true, stackId, cards });
    });

    socket.on(SOCKET_EVENTS.TABLE_RESET, (payload: TableResetRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId)) return ack?.({ ok: false, error: '不正な要求です' });
      const room = rooms.getRoom(roomId);
      if (!room || !room.players.some((p) => p.playerId === playerId)) return ack?.({ ok: false, error: 'ルームが見つかりません' });
      room.tableState = ops.resetTable(room.tableState);
      room.updatedAt = new Date().toISOString();
      broadcastTableState(io, room);
      ack?.({ ok: true });
    });

    socket.on(SOCKET_EVENTS.TABLE_THEME_SET, (payload: TableThemeSetRequest, ack?: (r: AckResponse) => void) => {
      if (!payload) return ack?.({ ok: false, error: '不正な要求です' });
      const { roomId, playerId, themeId } = payload;
      if (!isValidRoomId(roomId) || !isValidPlayerId(playerId) || !isValidThemeId(themeId)) return ack?.({ ok: false, error: '不正な要求です' });
      const room = rooms.getRoom(roomId);
      if (!room || !room.players.some((p) => p.playerId === playerId)) return ack?.({ ok: false, error: 'ルームが見つかりません' });
      room.tableState = ops.setTheme(room.tableState, themeId);
      room.updatedAt = new Date().toISOString();
      broadcastTableState(io, room);
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      const room = rooms.disconnectSocket(socket.id);
      if (room) broadcastPlayerList(io, room);
    });
  });
}
