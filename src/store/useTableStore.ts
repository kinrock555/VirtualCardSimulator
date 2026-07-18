import { create } from 'zustand';
import type { CardInstance, CardStack, StackType } from '../types/table';
import type { DeckData } from '../types/deck';
import type { BoardSnapshot } from '../types/board';
import { generateRandomId } from '../lib/id';
import {
  clampToTable,
  computeCentroid,
  computeUnstackSpreadPosition,
  normalizeRotation,
  shuffleArray,
} from '../lib/tableGeometry';
import {
  BANISHED_ORIGIN,
  DRAW_PILE_ORIGIN,
  GRAVEYARD_ORIGIN,
  REVEAL_TOP_OFFSET,
  UNSTACK_SPREAD_OFFSET,
} from '../lib/tableConstants';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { DEFAULT_TABLE_THEME_ID } from '../config/tableThemes';
import { DEFAULT_ROOM_ENVIRONMENT_ID } from '../config/roomEnvironments';

type CardContextMenuState = { instanceId: string; x: number; y: number };
type StackContextMenuState = { stackId: string; x: number; y: number };
type ScreenPoint = { x: number; y: number };
/** Ephemeral (not persisted) state while a hand card is being dragged toward the 3D field. */
type HandFieldDragState = { instanceId: string; x: number; z: number; visible: boolean };

type TableState = {
  deckId: string | null;
  /** All card instances for the current session, keyed by instanceId. */
  cardInstances: Record<string, CardInstance>;
  /** Every pile on the table: the main deck, graveyard, banished, and any custom stacks. */
  stacks: CardStack[];
  /** Hand order, left to right. */
  hand: string[];

  selectedInstanceIds: string[];
  draggingInstanceId: string | null;
  /** Per-follower {x,z} offsets from the dragged ("leader") card, active only during a group drag. */
  groupDragOffsets: Record<string, { x: number; z: number }> | null;

  cardContextMenu: CardContextMenuState | null;
  stackContextMenu: StackContextMenuState | null;
  multiSelectContextMenu: ScreenPoint | null;
  placingStackId: string | null;
  stackViewerStackId: string | null;

  selectedThemeId: string;
  selectedRoomEnvironmentId: string;
  handPanelCollapsed: boolean;
  /** Non-null only while a hand card is being dragged out of the 2D hand panel toward the field. */
  handFieldDrag: HandFieldDragState | null;

  /** Expands a deck's card entries into a fresh main deck, plus empty graveyard/banished piles. */
  loadDeck: (deck: DeckData) => void;
  resetTable: () => void;
  /** Pure-data snapshot of the live session (no camera - the caller merges that in separately). */
  captureSnapshot: () => Omit<BoardSnapshot, 'camera'>;
  /** Restores a snapshot. Never throws - missing/dangling data is skipped and reported in `warnings`. */
  applySnapshot: (snapshot: BoardSnapshot) => { warnings: string[] };

  selectInstance: (instanceId: string, additive?: boolean) => void;
  clearSelection: () => void;

  beginDrag: (instanceId: string) => void;
  updateDragPosition: (instanceId: string, x: number, z: number) => void;
  endDrag: () => void;

  /** Starts a 2D-hand-panel-initiated drag toward the 3D field (see HandPanel). */
  beginHandFieldDrag: (instanceId: string) => void;
  /** Updates the live drop-preview position while dragging from the hand panel. */
  updateHandFieldDrag: (x: number, z: number, visible: boolean) => void;
  /** Cancels a hand->field drag without moving any card (card stays in hand). */
  endHandFieldDrag: () => void;
  /** Commits a hand->field drop: moves the card to the table at an explicit point, face up. */
  moveHandCardToTableAt: (instanceId: string, x: number, z: number) => void;

  setFaceUp: (instanceIds: string[], faceUp: boolean) => void;
  rotateInstances: (instanceIds: string[], direction: 'left' | 'right') => void;
  removeInstances: (instanceIds: string[]) => void;
  moveCardsToHand: (instanceIds: string[]) => void;
  moveCardsToTable: (instanceIds: string[], faceUp: boolean) => void;
  moveCardsToGraveyard: (instanceIds: string[]) => void;
  moveCardsToBanished: (instanceIds: string[]) => void;
  moveCardsToMainDeckTop: (instanceIds: string[]) => void;
  moveCardsToMainDeckBottom: (instanceIds: string[]) => void;

  createStackFromSelection: () => void;
  unstackCustomStack: (stackId: string) => void;
  shuffleStack: (stackId: string) => void;
  moveStackTopToHand: (stackId: string) => void;
  moveStackTopToTable: (stackId: string) => void;
  /** Draws up to `count` cards (fewer if the stack runs out). Returns how many were actually drawn. */
  drawMultipleFromStack: (stackId: string, count: number) => number;
  returnAllToMainDeck: (stackId: string) => void;
  setStackOrder: (stackId: string, newOrderIds: string[]) => void;
  beginPlaceStack: (stackId: string) => void;
  placeStackAt: (x: number, z: number) => void;
  cancelPlaceStack: () => void;

  openCardContextMenu: (instanceId: string, x: number, y: number) => void;
  closeCardContextMenu: () => void;
  openStackContextMenu: (stackId: string, x: number, y: number) => void;
  closeStackContextMenu: () => void;
  openMultiSelectContextMenu: (x: number, y: number) => void;
  closeMultiSelectContextMenu: () => void;
  openStackViewer: (stackId: string) => void;
  closeStackViewer: () => void;

  setTheme: (themeId: string) => void;
  setRoomEnvironment: (environmentId: string) => void;
  setHandPanelCollapsed: (collapsed: boolean) => void;

  getInstanceById: (instanceId: string) => CardInstance | undefined;
  getStackById: (stackId: string) => CardStack | undefined;
  findStackContaining: (instanceId: string) => CardStack | undefined;
};

/** Removes an instanceId from wherever it currently sits (hand or any stack). Pure helper, not a store action. */
function detach(
  stacks: CardStack[],
  hand: string[],
  instanceId: string,
): { stacks: CardStack[]; hand: string[] } {
  return {
    hand: hand.filter((id) => id !== instanceId),
    stacks: stacks.map((stack) =>
      stack.cardInstanceIds.includes(instanceId)
        ? { ...stack, cardInstanceIds: stack.cardInstanceIds.filter((id) => id !== instanceId) }
        : stack,
    ),
  };
}

function makePermanentStack(type: StackType, stackId: string, origin: { x: number; z: number }): CardStack {
  return { stackId, type, cardInstanceIds: [], position: { x: origin.x, z: origin.z }, rotationY: 0 };
}

const initialThemeId = loadFromStorage<string>(STORAGE_KEYS.tableTheme, DEFAULT_TABLE_THEME_ID);
const initialRoomEnvironmentId = loadFromStorage<string>(
  STORAGE_KEYS.roomEnvironment,
  DEFAULT_ROOM_ENVIRONMENT_ID,
);
const initialHandPanelCollapsed = loadFromStorage<boolean>(STORAGE_KEYS.handPanelCollapsed, false);

export const useTableStore = create<TableState>((set, get) => ({
  deckId: null,
  cardInstances: {},
  stacks: [],
  hand: [],

  selectedInstanceIds: [],
  draggingInstanceId: null,
  groupDragOffsets: null,

  cardContextMenu: null,
  stackContextMenu: null,
  multiSelectContextMenu: null,
  placingStackId: null,
  stackViewerStackId: null,

  selectedThemeId: initialThemeId,
  selectedRoomEnvironmentId: initialRoomEnvironmentId,
  handPanelCollapsed: initialHandPanelCollapsed,
  handFieldDrag: null,

  loadDeck: (deck) => {
    const cardInstances: Record<string, CardInstance> = {};
    const mainDeckIds: string[] = [];
    for (const entry of deck.cards) {
      for (let i = 0; i < entry.count; i++) {
        const instanceId = generateRandomId('inst');
        cardInstances[instanceId] = {
          instanceId,
          cardId: entry.cardId,
          zone: 'deck',
          position: { x: DRAW_PILE_ORIGIN.x, y: 0, z: DRAW_PILE_ORIGIN.z },
          rotationY: 0,
          faceUp: false,
        };
        mainDeckIds.push(instanceId);
      }
    }
    const mainDeck: CardStack = {
      stackId: 'main-deck',
      type: 'mainDeck',
      cardInstanceIds: mainDeckIds,
      position: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },
      rotationY: 0,
    };
    set({
      deckId: deck.id,
      cardInstances,
      stacks: [
        mainDeck,
        makePermanentStack('graveyard', 'graveyard', GRAVEYARD_ORIGIN),
        makePermanentStack('banished', 'banished', BANISHED_ORIGIN),
      ],
      hand: [],
      selectedInstanceIds: [],
      draggingInstanceId: null,
      groupDragOffsets: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      placingStackId: null,
      stackViewerStackId: null,
      handFieldDrag: null,
    });
  },

  resetTable: () => {
    set((state) => {
      const allIds = Object.keys(state.cardInstances);
      const nextInstances: Record<string, CardInstance> = {};
      for (const id of allIds) {
        nextInstances[id] = { ...state.cardInstances[id], zone: 'deck', faceUp: false, rotationY: 0 };
      }
      const mainDeck: CardStack = {
        stackId: 'main-deck',
        type: 'mainDeck',
        cardInstanceIds: shuffleArray(allIds),
        position: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },
        rotationY: 0,
      };
      return {
        cardInstances: nextInstances,
        stacks: [
          mainDeck,
          makePermanentStack('graveyard', 'graveyard', GRAVEYARD_ORIGIN),
          makePermanentStack('banished', 'banished', BANISHED_ORIGIN),
        ],
        hand: [],
        selectedInstanceIds: [],
        draggingInstanceId: null,
        groupDragOffsets: null,
        cardContextMenu: null,
        stackContextMenu: null,
        multiSelectContextMenu: null,
        placingStackId: null,
        stackViewerStackId: null,
        handFieldDrag: null,
      };
    });
  },

  captureSnapshot: () => {
    const state = get();
    return {
      deckId: state.deckId,
      cardInstances: state.cardInstances,
      stacks: state.stacks,
      hand: state.hand,
      selectedThemeId: state.selectedThemeId,
      selectedRoomEnvironmentId: state.selectedRoomEnvironmentId,
    };
  },

  applySnapshot: (snapshot) => {
    const warnings: string[] = [];
    const cardInstances =
      snapshot.cardInstances && typeof snapshot.cardInstances === 'object' ? snapshot.cardInstances : {};
    if (!snapshot.cardInstances) warnings.push('カード情報が見つからなかったため、空の状態から復元しました。');

    let stacks: CardStack[] = Array.isArray(snapshot.stacks)
      ? snapshot.stacks.filter((s): s is CardStack => Boolean(s) && Array.isArray(s.cardInstanceIds))
      : [];
    if (!Array.isArray(snapshot.stacks)) warnings.push('山札・墓地・除外の情報が見つかりませんでした。');

    const permanentOrigins: Record<'mainDeck' | 'graveyard' | 'banished', { x: number; z: number; id: string }> = {
      mainDeck: { ...DRAW_PILE_ORIGIN, id: 'main-deck' },
      graveyard: { ...GRAVEYARD_ORIGIN, id: 'graveyard' },
      banished: { ...BANISHED_ORIGIN, id: 'banished' },
    };
    for (const type of Object.keys(permanentOrigins) as Array<keyof typeof permanentOrigins>) {
      if (!stacks.some((s) => s.type === type)) {
        const origin = permanentOrigins[type];
        stacks.push(makePermanentStack(type, origin.id, origin));
        warnings.push(`${type === 'mainDeck' ? '山札' : type === 'graveyard' ? '墓地' : '除外'}のデータが欠けていたため、空の状態を補いました。`);
      }
    }

    const hand = Array.isArray(snapshot.hand) ? snapshot.hand : [];
    if (!Array.isArray(snapshot.hand)) warnings.push('手札の情報が見つかりませんでした。');

    const validId = (id: string) => Boolean(cardInstances[id]);
    const filteredStacks = stacks.map((s) => {
      const filtered = s.cardInstanceIds.filter(validId);
      if (filtered.length !== s.cardInstanceIds.length) warnings.push('存在しないカードを一部のスタックから除外しました。');
      return { ...s, cardInstanceIds: filtered };
    });
    const validHand = hand.filter(validId);
    if (validHand.length !== hand.length) warnings.push('一部のカードが見つからなかったため、手札から除外しました。');

    set({
      deckId: snapshot.deckId ?? null,
      cardInstances,
      stacks: filteredStacks,
      hand: validHand,
      selectedThemeId: typeof snapshot.selectedThemeId === 'string' ? snapshot.selectedThemeId : DEFAULT_TABLE_THEME_ID,
      selectedRoomEnvironmentId:
        typeof snapshot.selectedRoomEnvironmentId === 'string'
          ? snapshot.selectedRoomEnvironmentId
          : DEFAULT_ROOM_ENVIRONMENT_ID,
      selectedInstanceIds: [],
      draggingInstanceId: null,
      groupDragOffsets: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      placingStackId: null,
      stackViewerStackId: null,
      handFieldDrag: null,
    });

    return { warnings };
  },

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

  beginDrag: (instanceId) => {
    set((state) => {
      const isGroup = state.selectedInstanceIds.length > 1 && state.selectedInstanceIds.includes(instanceId);
      if (!isGroup) {
        return { draggingInstanceId: instanceId, selectedInstanceIds: [instanceId], groupDragOffsets: null };
      }
      const leader = state.cardInstances[instanceId];
      const offsets: Record<string, { x: number; z: number }> = {};
      for (const id of state.selectedInstanceIds) {
        if (id === instanceId) continue;
        const other = state.cardInstances[id];
        if (!other || other.zone !== 'table') continue;
        offsets[id] = { x: other.position.x - leader.position.x, z: other.position.z - leader.position.z };
      }
      return { draggingInstanceId: instanceId, groupDragOffsets: offsets };
    });
  },

  beginHandFieldDrag: (instanceId) => {
    set((state) => {
      if (!state.hand.includes(instanceId)) return state;
      return { handFieldDrag: { instanceId, x: 0, z: 0, visible: false } };
    });
  },

  updateHandFieldDrag: (x, z, visible) => {
    set((state) => {
      if (!state.handFieldDrag) return state;
      return { handFieldDrag: { ...state.handFieldDrag, x, z, visible } };
    });
  },

  endHandFieldDrag: () => set({ handFieldDrag: null }),

  moveHandCardToTableAt: (instanceId, x, z) => {
    set((state) => {
      if (!state.hand.includes(instanceId)) return { handFieldDrag: null };
      const instance = state.cardInstances[instanceId];
      if (!instance) return { handFieldDrag: null };
      const clamped = clampToTable(x, z);
      return {
        hand: state.hand.filter((id) => id !== instanceId),
        cardInstances: {
          ...state.cardInstances,
          [instanceId]: {
            ...instance,
            zone: 'table',
            position: { x: clamped.x, y: 0, z: clamped.z },
            faceUp: true,
            rotationY: 0,
          },
        },
        handFieldDrag: null,
      };
    });
  },

  updateDragPosition: (instanceId, x, z) => {
    const clampedLeader = clampToTable(x, z);
    set((state) => {
      const leaderInstance = state.cardInstances[instanceId];
      if (!leaderInstance) return state;
      const nextInstances = { ...state.cardInstances };
      nextInstances[instanceId] = {
        ...leaderInstance,
        position: { ...leaderInstance.position, x: clampedLeader.x, z: clampedLeader.z },
      };
      if (state.groupDragOffsets) {
        for (const id in state.groupDragOffsets) {
          const offset = state.groupDragOffsets[id];
          const other = state.cardInstances[id];
          if (!other) continue;
          const target = clampToTable(clampedLeader.x + offset.x, clampedLeader.z + offset.z);
          nextInstances[id] = { ...other, position: { ...other.position, x: target.x, z: target.z } };
        }
      }
      return { cardInstances: nextInstances };
    });
  },

  endDrag: () => set({ draggingInstanceId: null, groupDragOffsets: null }),

  setFaceUp: (instanceIds, faceUp) => {
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, faceUp };
      }
      return { cardInstances: nextInstances };
    });
  },

  rotateInstances: (instanceIds, direction) => {
    const delta = direction === 'left' ? 90 : -90;
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, rotationY: normalizeRotation(instance.rotationY + delta) };
      }
      return { cardInstances: nextInstances };
    });
  },

  removeInstances: (instanceIds) => {
    set((state) => {
      const idSet = new Set(instanceIds);
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) delete nextInstances[id];
      return {
        cardInstances: nextInstances,
        stacks: state.stacks.map((stack) => ({
          ...stack,
          cardInstanceIds: stack.cardInstanceIds.filter((id) => !idSet.has(id)),
        })),
        hand: state.hand.filter((id) => !idSet.has(id)),
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !idSet.has(id)),
        cardContextMenu: state.cardContextMenu && idSet.has(state.cardContextMenu.instanceId) ? null : state.cardContextMenu,
      };
    });
  },

  moveCardsToHand: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'hand', faceUp: true, rotationY: 0 };
        movedIds.push(id);
      }
      return {
        cardInstances: nextInstances,
        stacks,
        hand: [...hand, ...movedIds],
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToTable: (instanceIds, faceUp) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      let dropIndex = 0;
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const sourceStack = stacks.find((s) => s.cardInstanceIds.includes(id));
        const base = sourceStack
          ? { x: sourceStack.position.x + REVEAL_TOP_OFFSET.x, z: sourceStack.position.z + REVEAL_TOP_OFFSET.z }
          : { x: instance.position.x, z: instance.position.z };
        const spread = computeUnstackSpreadPosition(base, dropIndex, UNSTACK_SPREAD_OFFSET);
        dropIndex++;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'table', faceUp, rotationY: 0, position: { x: spread.x, y: 0, z: spread.z } };
      }
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToGraveyard: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'graveyard', faceUp: true, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'graveyard' ? { ...s, cardInstanceIds: [...s.cardInstanceIds, ...movedIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToBanished: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'banished', faceUp: true, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'banished' ? { ...s, cardInstanceIds: [...s.cardInstanceIds, ...movedIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToMainDeckTop: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'deck', faceUp: false, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'mainDeck' ? { ...s, cardInstanceIds: [...s.cardInstanceIds, ...movedIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToMainDeckBottom: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'deck', faceUp: false, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'mainDeck' ? { ...s, cardInstanceIds: [...movedIds, ...s.cardInstanceIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  createStackFromSelection: () => {
    set((state) => {
      const ids = state.selectedInstanceIds.filter((id) => state.cardInstances[id]?.zone === 'table');
      if (ids.length === 0) return state;
      const points = ids.map((id) => state.cardInstances[id].position);
      const center = computeCentroid(points);
      const newStack: CardStack = {
        stackId: generateRandomId('stack'),
        type: 'customStack',
        cardInstanceIds: ids,
        position: center,
        rotationY: 0,
      };
      const nextInstances = { ...state.cardInstances };
      for (const id of ids) {
        nextInstances[id] = { ...nextInstances[id], zone: 'deck' };
      }
      return {
        cardInstances: nextInstances,
        stacks: [...state.stacks, newStack],
        selectedInstanceIds: [],
        multiSelectContextMenu: null,
      };
    });
  },

  unstackCustomStack: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId && s.type === 'customStack');
      if (!stack) return state;
      const nextInstances = { ...state.cardInstances };
      stack.cardInstanceIds.forEach((id, index) => {
        const instance = nextInstances[id];
        if (!instance) return;
        const spread = computeUnstackSpreadPosition(stack.position, index, UNSTACK_SPREAD_OFFSET);
        nextInstances[id] = { ...instance, zone: 'table', position: { x: spread.x, y: 0, z: spread.z } };
      });
      return {
        cardInstances: nextInstances,
        stacks: state.stacks.filter((s) => s.stackId !== stackId),
        stackContextMenu: state.stackContextMenu?.stackId === stackId ? null : state.stackContextMenu,
        stackViewerStackId: state.stackViewerStackId === stackId ? null : state.stackViewerStackId,
      };
    });
  },

  shuffleStack: (stackId) => {
    set((state) => ({
      stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: shuffleArray(s.cardInstanceIds) } : s)),
    }));
  },

  moveStackTopToHand: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack || stack.cardInstanceIds.length === 0) return state;
      const topId = stack.cardInstanceIds[stack.cardInstanceIds.length - 1];
      const instance = state.cardInstances[topId];
      if (!instance) return state;
      return {
        stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, -1) } : s)),
        hand: [...state.hand, topId],
        cardInstances: { ...state.cardInstances, [topId]: { ...instance, zone: 'hand', faceUp: true } },
      };
    });
  },

  moveStackTopToTable: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack || stack.cardInstanceIds.length === 0) return state;
      const topId = stack.cardInstanceIds[stack.cardInstanceIds.length - 1];
      const instance = state.cardInstances[topId];
      if (!instance) return state;
      const revealed = clampToTable(stack.position.x + REVEAL_TOP_OFFSET.x, stack.position.z + REVEAL_TOP_OFFSET.z);
      return {
        stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, -1) } : s)),
        cardInstances: {
          ...state.cardInstances,
          [topId]: { ...instance, zone: 'table', faceUp: true, rotationY: 0, position: { x: revealed.x, y: 0, z: revealed.z } },
        },
      };
    });
  },

  drawMultipleFromStack: (stackId, count) => {
    const stack = get().stacks.find((s) => s.stackId === stackId);
    if (!stack) return 0;
    const actualCount = Math.max(0, Math.min(Math.floor(count), stack.cardInstanceIds.length));
    if (actualCount === 0) return 0;
    const drawOrder = stack.cardInstanceIds.slice(stack.cardInstanceIds.length - actualCount).reverse();
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of drawOrder) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, zone: 'hand', faceUp: true };
      }
      return {
        stacks: state.stacks.map((s) =>
          s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, s.cardInstanceIds.length - actualCount) } : s,
        ),
        hand: [...state.hand, ...drawOrder],
        cardInstances: nextInstances,
      };
    });
    return actualCount;
  },

  returnAllToMainDeck: (stackId) => {
    set((state) => {
      const source = state.stacks.find((s) => s.stackId === stackId);
      if (!source || source.cardInstanceIds.length === 0) return state;
      const ids = source.cardInstanceIds;
      const nextInstances = { ...state.cardInstances };
      for (const id of ids) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, zone: 'deck', faceUp: false, rotationY: 0 };
      }
      return {
        cardInstances: nextInstances,
        stacks: state.stacks.map((s) => {
          if (s.stackId === stackId) return { ...s, cardInstanceIds: [] };
          if (s.type === 'mainDeck') return { ...s, cardInstanceIds: [...s.cardInstanceIds, ...ids] };
          return s;
        }),
      };
    });
  },

  setStackOrder: (stackId, newOrderIds) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack) return state;
      if (newOrderIds.length !== stack.cardInstanceIds.length) return state;
      const currentSet = new Set(stack.cardInstanceIds);
      for (const id of newOrderIds) {
        if (!currentSet.has(id)) return state;
      }
      return { stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: newOrderIds } : s)) };
    });
  },

  beginPlaceStack: (stackId) => set({ placingStackId: stackId, stackContextMenu: null }),

  placeStackAt: (x, z) => {
    const clamped = clampToTable(x, z);
    set((state) => ({
      stacks: state.stacks.map((s) => (s.stackId === state.placingStackId ? { ...s, position: clamped } : s)),
      placingStackId: null,
    }));
  },

  cancelPlaceStack: () => set({ placingStackId: null }),

  openCardContextMenu: (instanceId, x, y) =>
    set({ cardContextMenu: { instanceId, x, y }, stackContextMenu: null, multiSelectContextMenu: null }),
  closeCardContextMenu: () => set({ cardContextMenu: null }),

  openStackContextMenu: (stackId, x, y) =>
    set({ stackContextMenu: { stackId, x, y }, cardContextMenu: null, multiSelectContextMenu: null }),
  closeStackContextMenu: () => set({ stackContextMenu: null }),

  openMultiSelectContextMenu: (x, y) =>
    set({ multiSelectContextMenu: { x, y }, cardContextMenu: null, stackContextMenu: null }),
  closeMultiSelectContextMenu: () => set({ multiSelectContextMenu: null }),

  openStackViewer: (stackId) => set({ stackViewerStackId: stackId, stackContextMenu: null }),
  closeStackViewer: () => set({ stackViewerStackId: null }),

  setTheme: (themeId) => {
    saveToStorage(STORAGE_KEYS.tableTheme, themeId);
    set({ selectedThemeId: themeId });
  },

  setRoomEnvironment: (environmentId) => {
    saveToStorage(STORAGE_KEYS.roomEnvironment, environmentId);
    set({ selectedRoomEnvironmentId: environmentId });
  },

  setHandPanelCollapsed: (collapsed) => {
    saveToStorage(STORAGE_KEYS.handPanelCollapsed, collapsed);
    set({ handPanelCollapsed: collapsed });
  },

  getInstanceById: (instanceId) => get().cardInstances[instanceId],
  getStackById: (stackId) => get().stacks.find((s) => s.stackId === stackId),
  findStackContaining: (instanceId) => get().stacks.find((s) => s.cardInstanceIds.includes(instanceId)),
}));
