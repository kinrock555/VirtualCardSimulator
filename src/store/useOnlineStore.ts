import { create } from 'zustand';
import { SOCKET_EVENTS } from '../../shared/socketEvents';
import type {
  CardZoneDestination,
  RoomCreateAck,
  RoomJoinAck,
  StackViewAck,
  AckResponse,
  CardMoveBroadcastPayload,
  PlayerListUpdatePayload,
  RoomStateSyncPayload,
  ServerErrorPayload,
} from '../../shared/socketEvents';
import type { CardZone } from '../../shared/cardTypes';
import type { OnlinePlayer, PublicTableState, StackViewCard } from '../../shared/onlineTypes';
import type { DeckCardEntry } from '../types/deck';
import { getSocket, emitWithAck } from '../lib/onlineSocket';
import { getOrCreatePlayerId, getSavedPlayerName, savePlayerName } from '../lib/onlinePlayer';
import { clampToTable } from '../lib/tableGeometry';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type CardContextMenuState = { instanceId: string; x: number; y: number };
type StackContextMenuState = { stackId: string; x: number; y: number };
type ScreenPoint = { x: number; y: number };

type OnlineState = {
  playerId: string;
  playerName: string;
  connectionStatus: ConnectionStatus;
  roomId: string | null;
  players: OnlinePlayer[];
  table: PublicTableState | null;
  errorMessage: string | null;
  listenersReady: boolean;

  /** Live-drag position overrides (mine + everyone else's), cleared on each full state sync. */
  localCardPositions: Record<string, { x: number; z: number }>;

  selectedInstanceIds: string[];
  draggingInstanceId: string | null;
  /** Zone the dragged card started in - decides whether drag-end commits a move or a hand->table zone change. */
  draggingZone: CardZone | null;

  cardContextMenu: CardContextMenuState | null;
  stackContextMenu: StackContextMenuState | null;
  multiSelectContextMenu: ScreenPoint | null;
  stackViewerStackId: string | null;
  stackViewerCards: StackViewCard[] | null;
  placingStackId: string | null;

  setPlayerName: (name: string) => void;
  ensureListeners: () => void;

  createRoom: (params: { deckId: string; deckCards: DeckCardEntry[]; themeId: string }) => Promise<RoomCreateAck>;
  joinRoom: (roomId: string) => Promise<RoomJoinAck>;
  leaveRoom: () => void;
  resetOnlineState: () => void;

  selectInstance: (instanceId: string, additive?: boolean) => void;
  clearSelection: () => void;
  beginDrag: (instanceId: string, zone: CardZone) => void;
  updateDragPosition: (instanceId: string, x: number, z: number) => void;
  /** Clears drag state and returns the final local position (if any) - caller decides commit vs zone-move. */
  endDrag: () => { x: number; z: number } | undefined;
  commitCardMove: (instanceId: string, x: number, z: number) => void;

  flipCard: (instanceId: string, faceUp: boolean) => void;
  rotateCard: (instanceId: string, direction: 'left' | 'right') => void;
  moveCardZone: (instanceId: string, destination: CardZoneDestination, targetPosition?: { x: number; z: number }) => void;
  shuffleStack: (stackId: string) => void;
  drawOne: (stackId: string) => void;
  drawMultiple: (stackId: string, count: number) => void;
  revealTop: (stackId: string) => void;
  reorderStack: (stackId: string, orderedInstanceIds: string[]) => void;
  createStackFromSelection: () => void;
  unstackCustomStack: (stackId: string) => void;
  moveStackPosition: (stackId: string, x: number, z: number) => void;
  returnAllToDeck: (stackId: string) => void;
  requestStackView: (stackId: string) => void;
  beginPlaceStack: (stackId: string) => void;
  cancelPlaceStack: () => void;
  resetTable: () => void;
  setTheme: (themeId: string) => void;

  openCardContextMenu: (instanceId: string, x: number, y: number) => void;
  closeCardContextMenu: () => void;
  openStackContextMenu: (stackId: string, x: number, y: number) => void;
  closeStackContextMenu: () => void;
  openMultiSelectContextMenu: (x: number, y: number) => void;
  closeMultiSelectContextMenu: () => void;
  openStackViewer: (stackId: string) => void;
  closeStackViewer: () => void;
};

const dragMoveThrottle = new Map<string, number>();
const DRAG_MOVE_INTERVAL_MS = 80;

function currentRoomId(state: OnlineState): string | null {
  return state.roomId;
}

export const useOnlineStore = create<OnlineState>((set, get) => ({
  playerId: getOrCreatePlayerId(),
  playerName: getSavedPlayerName(),
  connectionStatus: 'idle',
  roomId: null,
  players: [],
  table: null,
  errorMessage: null,
  listenersReady: false,

  localCardPositions: {},

  selectedInstanceIds: [],
  draggingInstanceId: null,
  draggingZone: null,

  cardContextMenu: null,
  stackContextMenu: null,
  multiSelectContextMenu: null,
  stackViewerStackId: null,
  stackViewerCards: null,
  placingStackId: null,

  setPlayerName: (name) => {
    savePlayerName(name);
    set({ playerName: name });
  },

  ensureListeners: () => {
    if (get().listenersReady) return;
    const socket = getSocket();

    socket.on('connect', () => set({ connectionStatus: 'connected', errorMessage: null }));
    socket.on('disconnect', () => set({ connectionStatus: 'reconnecting' }));
    socket.io.on('reconnect_attempt', () => set({ connectionStatus: 'reconnecting' }));
    socket.on('connect_error', () => set({ connectionStatus: 'error', errorMessage: 'サーバーに接続できません' }));

    socket.on(SOCKET_EVENTS.PLAYER_LIST_UPDATE, (payload: PlayerListUpdatePayload) => {
      set({ players: payload.players });
    });

    socket.on(SOCKET_EVENTS.ROOM_STATE_SYNC, (payload: RoomStateSyncPayload) => {
      set({ table: payload.state.table, players: payload.state.players, localCardPositions: {} });
    });

    socket.on(SOCKET_EVENTS.CARD_MOVE, (payload: CardMoveBroadcastPayload) => {
      set((state) => ({
        localCardPositions: { ...state.localCardPositions, [payload.instanceId]: { x: payload.x, z: payload.z } },
      }));
    });

    socket.on(SOCKET_EVENTS.ERROR, (payload: ServerErrorPayload) => {
      set({ errorMessage: payload.message });
    });

    set({ listenersReady: true });
  },

  createRoom: async ({ deckId, deckCards, themeId }) => {
    const state = get();
    get().ensureListeners();
    set({ connectionStatus: 'connecting', errorMessage: null });
    const response = await emitWithAck<RoomCreateAck>(SOCKET_EVENTS.ROOM_CREATE, {
      playerId: state.playerId,
      playerName: state.playerName,
      deckId,
      deckCards: deckCards.map((c) => ({ cardId: c.cardId, count: c.count })),
      themeId,
    });
    if (response.ok) {
      set({
        roomId: response.roomId,
        table: response.state.table,
        players: response.state.players,
        connectionStatus: 'connected',
      });
    } else {
      set({ errorMessage: response.error, connectionStatus: 'error' });
    }
    return response;
  },

  joinRoom: async (roomId) => {
    const state = get();
    get().ensureListeners();
    set({ connectionStatus: 'connecting', errorMessage: null });
    const response = await emitWithAck<RoomJoinAck>(SOCKET_EVENTS.ROOM_JOIN, {
      roomId,
      playerId: state.playerId,
      playerName: state.playerName,
    });
    if (response.ok) {
      set({
        roomId,
        table: response.state.table,
        players: response.state.players,
        connectionStatus: 'connected',
      });
    } else {
      set({ errorMessage: response.error, connectionStatus: 'error' });
    }
    return response;
  },

  leaveRoom: () => {
    const state = get();
    if (state.roomId) {
      getSocket().emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId: state.roomId, playerId: state.playerId });
    }
    get().resetOnlineState();
  },

  resetOnlineState: () =>
    set({
      roomId: null,
      players: [],
      table: null,
      errorMessage: null,
      localCardPositions: {},
      selectedInstanceIds: [],
      draggingInstanceId: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      stackViewerStackId: null,
      stackViewerCards: null,
    }),

  selectInstance: (instanceId, additive = false) => {
    set((state) => {
      if (!additive) return { selectedInstanceIds: [instanceId] };
      const exists = state.selectedInstanceIds.includes(instanceId);
      return {
        selectedInstanceIds: exists
          ? state.selectedInstanceIds.filter((id) => id !== instanceId)
          : [...state.selectedInstanceIds, instanceId],
      };
    });
  },
  clearSelection: () => set({ selectedInstanceIds: [] }),

  beginDrag: (instanceId, zone) => set({ draggingInstanceId: instanceId, draggingZone: zone, selectedInstanceIds: [instanceId] }),

  updateDragPosition: (instanceId, x, z) => {
    const clamped = clampToTable(x, z);
    set((state) => ({ localCardPositions: { ...state.localCardPositions, [instanceId]: clamped } }));

    // Hand cards aren't "table" server-side yet, so live-position broadcasting
    // only applies once the card is actually on the table.
    if (get().draggingZone !== 'table') return;
    const roomId = currentRoomId(get());
    if (!roomId) return;
    const lastSent = dragMoveThrottle.get(instanceId) ?? 0;
    const nowTs = Date.now();
    if (nowTs - lastSent < DRAG_MOVE_INTERVAL_MS) return;
    dragMoveThrottle.set(instanceId, nowTs);
    getSocket().emit(SOCKET_EVENTS.CARD_MOVE, { roomId, playerId: get().playerId, instanceId, x: clamped.x, z: clamped.z });
  },

  endDrag: () => {
    const state = get();
    const instanceId = state.draggingInstanceId;
    const finalPos = instanceId ? state.localCardPositions[instanceId] : undefined;
    set({ draggingInstanceId: null, draggingZone: null });
    return finalPos;
  },

  commitCardMove: (instanceId, x, z) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(
      SOCKET_EVENTS.CARD_MOVE_COMMIT,
      { roomId: state.roomId, playerId: state.playerId, instanceId, x, z, clientSeq: Date.now() },
      (response: AckResponse) => {
        if (!response.ok) set({ errorMessage: response.error });
      },
    );
  },

  flipCard: (instanceId, faceUp) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.CARD_FLIP, { roomId: state.roomId, playerId: state.playerId, instanceId, faceUp });
  },

  rotateCard: (instanceId, direction) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.CARD_ROTATE, { roomId: state.roomId, playerId: state.playerId, instanceId, direction });
  },

  moveCardZone: (instanceId, destination, targetPosition) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(
      SOCKET_EVENTS.CARD_ZONE_MOVE,
      { roomId: state.roomId, playerId: state.playerId, instanceId, destination, ...targetPosition },
      (response: AckResponse) => {
        if (!response.ok) set({ errorMessage: response.error });
      },
    );
    set((s) => ({
      selectedInstanceIds: [],
      cardContextMenu: null,
      multiSelectContextMenu: null,
      localCardPositions: targetPosition ? { ...s.localCardPositions, [instanceId]: targetPosition } : s.localCardPositions,
    }));
  },

  shuffleStack: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_SHUFFLE, { roomId: state.roomId, playerId: state.playerId, stackId });
  },

  drawOne: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_DRAW, { roomId: state.roomId, playerId: state.playerId, stackId, count: 1 });
  },

  drawMultiple: (stackId, count) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_DRAW, { roomId: state.roomId, playerId: state.playerId, stackId, count });
  },

  revealTop: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_REVEAL_TOP, { roomId: state.roomId, playerId: state.playerId, stackId });
  },

  reorderStack: (stackId, orderedInstanceIds) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_REORDER, { roomId: state.roomId, playerId: state.playerId, stackId, orderedInstanceIds });
  },

  createStackFromSelection: () => {
    const state = get();
    if (!state.roomId || state.selectedInstanceIds.length === 0) return;
    getSocket().emit(SOCKET_EVENTS.STACK_CREATE, {
      roomId: state.roomId,
      playerId: state.playerId,
      instanceIds: state.selectedInstanceIds,
    });
    set({ selectedInstanceIds: [], multiSelectContextMenu: null });
  },

  unstackCustomStack: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_UNSTACK, { roomId: state.roomId, playerId: state.playerId, stackId });
  },

  moveStackPosition: (stackId, x, z) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_MOVE, { roomId: state.roomId, playerId: state.playerId, stackId, x, z });
    set({ placingStackId: null });
  },

  beginPlaceStack: (stackId) => set({ placingStackId: stackId, stackContextMenu: null }),
  cancelPlaceStack: () => set({ placingStackId: null }),

  returnAllToDeck: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.STACK_RETURN_ALL, { roomId: state.roomId, playerId: state.playerId, stackId });
  },

  requestStackView: (stackId) => {
    const state = get();
    if (!state.roomId) return;
    emitWithAck<StackViewAck>(SOCKET_EVENTS.STACK_VIEW_REQUEST, { roomId: state.roomId, playerId: state.playerId, stackId }).then(
      (response) => {
        if (response.ok) set({ stackViewerCards: response.cards });
        else set({ errorMessage: response.error, stackViewerStackId: null });
      },
    );
  },

  resetTable: () => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.TABLE_RESET, { roomId: state.roomId, playerId: state.playerId });
  },

  setTheme: (themeId) => {
    const state = get();
    if (!state.roomId) return;
    getSocket().emit(SOCKET_EVENTS.TABLE_THEME_SET, { roomId: state.roomId, playerId: state.playerId, themeId });
  },

  openCardContextMenu: (instanceId, x, y) =>
    set({ cardContextMenu: { instanceId, x, y }, stackContextMenu: null, multiSelectContextMenu: null }),
  closeCardContextMenu: () => set({ cardContextMenu: null }),

  openStackContextMenu: (stackId, x, y) =>
    set({ stackContextMenu: { stackId, x, y }, cardContextMenu: null, multiSelectContextMenu: null }),
  closeStackContextMenu: () => set({ stackContextMenu: null }),

  openMultiSelectContextMenu: (x, y) =>
    set({ multiSelectContextMenu: { x, y }, cardContextMenu: null, stackContextMenu: null }),
  closeMultiSelectContextMenu: () => set({ multiSelectContextMenu: null }),

  openStackViewer: (stackId) => {
    set({ stackViewerStackId: stackId, stackContextMenu: null, stackViewerCards: null });
    get().requestStackView(stackId);
  },
  closeStackViewer: () => set({ stackViewerStackId: null, stackViewerCards: null }),
}));
