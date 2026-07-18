import { create } from 'zustand';
import type { CardInstance } from '../types/table';
import type { DeckData } from '../types/deck';
import { generateRandomId } from '../lib/id';
import { clampToTable, computeDeckLayerY, normalizeRotation, shuffleArray } from '../lib/tableGeometry';
import { DRAW_PILE_ORIGIN, REVEAL_TOP_OFFSET } from '../lib/tableConstants';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { DEFAULT_TABLE_THEME_ID } from '../config/tableThemes';

type CardContextMenuState = {
  instanceId: string;
  x: number;
  y: number;
};

type DeckContextMenuState = {
  x: number;
  y: number;
};

type TableState = {
  deckId: string | null;
  /** All card instances for the current session, keyed by instanceId. */
  cardInstances: Record<string, CardInstance>;
  /** Draw pile order. The LAST id is the top of the deck (see types/table.ts). */
  deckStack: string[];
  /** Hand order, left to right. */
  hand: string[];
  deckPosition: { x: number; z: number };

  selectedInstanceId: string | null;
  draggingInstanceId: string | null;
  cardContextMenu: CardContextMenuState | null;
  deckContextMenu: DeckContextMenuState | null;
  isPlacingDeck: boolean;

  selectedThemeId: string;

  /** Expands a deck's card entries into a fresh, shuffled-order-free draw pile. */
  loadDeck: (deck: DeckData) => void;
  resetTable: () => void;

  selectInstance: (instanceId: string | null) => void;
  beginDrag: (instanceId: string) => void;
  /** Moves a hand card onto the table at `x,z` and starts dragging it immediately. */
  beginHandDrag: (instanceId: string, x: number, z: number) => void;
  updateDragPosition: (instanceId: string, x: number, z: number) => void;
  endDrag: () => void;
  setFaceUp: (instanceId: string, faceUp: boolean) => void;
  rotateInstance: (instanceId: string, direction: 'left' | 'right') => void;
  removeInstance: (instanceId: string) => void;
  returnCardToHand: (instanceId: string) => void;

  openCardContextMenu: (instanceId: string, x: number, y: number) => void;
  closeCardContextMenu: () => void;

  shuffleDeck: () => void;
  drawCard: () => void;
  revealTopCard: () => void;
  openDeckContextMenu: (x: number, y: number) => void;
  closeDeckContextMenu: () => void;
  beginPlaceDeck: () => void;
  placeDeckAt: (x: number, z: number) => void;
  cancelPlaceDeck: () => void;

  setTheme: (themeId: string) => void;

  getInstanceById: (instanceId: string) => CardInstance | undefined;
};

const initialThemeId = loadFromStorage<string>(STORAGE_KEYS.tableTheme, DEFAULT_TABLE_THEME_ID);

export const useTableStore = create<TableState>((set, get) => ({
  deckId: null,
  cardInstances: {},
  deckStack: [],
  hand: [],
  deckPosition: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },

  selectedInstanceId: null,
  draggingInstanceId: null,
  cardContextMenu: null,
  deckContextMenu: null,
  isPlacingDeck: false,

  selectedThemeId: initialThemeId,

  loadDeck: (deck) => {
    const cardInstances: Record<string, CardInstance> = {};
    const deckStack: string[] = [];
    let index = 0;
    for (const entry of deck.cards) {
      for (let i = 0; i < entry.count; i++) {
        const instanceId = generateRandomId('inst');
        cardInstances[instanceId] = {
          instanceId,
          cardId: entry.cardId,
          zone: 'deck',
          position: { x: DRAW_PILE_ORIGIN.x, y: computeDeckLayerY(index), z: DRAW_PILE_ORIGIN.z },
          rotationY: 0,
          faceUp: false,
        };
        deckStack.push(instanceId);
        index++;
      }
    }
    set({
      deckId: deck.id,
      cardInstances,
      deckStack,
      hand: [],
      deckPosition: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },
      selectedInstanceId: null,
      draggingInstanceId: null,
      cardContextMenu: null,
      deckContextMenu: null,
      isPlacingDeck: false,
    });
  },

  resetTable: () => {
    set((state) => {
      const allIds = Object.keys(state.cardInstances);
      const nextInstances: Record<string, CardInstance> = {};
      for (const id of allIds) {
        const instance = state.cardInstances[id];
        nextInstances[id] = {
          ...instance,
          zone: 'deck',
          faceUp: false,
          rotationY: 0,
        };
      }
      return {
        cardInstances: nextInstances,
        deckStack: shuffleArray(allIds),
        hand: [],
        deckPosition: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },
        selectedInstanceId: null,
        draggingInstanceId: null,
        cardContextMenu: null,
        deckContextMenu: null,
        isPlacingDeck: false,
      };
    });
  },

  selectInstance: (instanceId) => set({ selectedInstanceId: instanceId }),

  beginDrag: (instanceId) => set({ draggingInstanceId: instanceId, selectedInstanceId: instanceId }),

  beginHandDrag: (instanceId, x, z) => {
    set((state) => {
      if (!state.hand.includes(instanceId)) return state;
      const instance = state.cardInstances[instanceId];
      if (!instance) return state;
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
          },
        },
        draggingInstanceId: instanceId,
        selectedInstanceId: instanceId,
      };
    });
  },

  updateDragPosition: (instanceId, x, z) => {
    const clamped = clampToTable(x, z);
    set((state) => {
      const instance = state.cardInstances[instanceId];
      if (!instance) return state;
      return {
        cardInstances: {
          ...state.cardInstances,
          [instanceId]: { ...instance, position: { ...instance.position, x: clamped.x, z: clamped.z } },
        },
      };
    });
  },

  endDrag: () => set({ draggingInstanceId: null }),

  setFaceUp: (instanceId, faceUp) => {
    set((state) => {
      const instance = state.cardInstances[instanceId];
      if (!instance) return state;
      return { cardInstances: { ...state.cardInstances, [instanceId]: { ...instance, faceUp } } };
    });
  },

  rotateInstance: (instanceId, direction) => {
    set((state) => {
      const instance = state.cardInstances[instanceId];
      if (!instance) return state;
      const delta = direction === 'left' ? 90 : -90;
      return {
        cardInstances: {
          ...state.cardInstances,
          [instanceId]: { ...instance, rotationY: normalizeRotation(instance.rotationY + delta) },
        },
      };
    });
  },

  removeInstance: (instanceId) => {
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      delete nextInstances[instanceId];
      return {
        cardInstances: nextInstances,
        deckStack: state.deckStack.filter((id) => id !== instanceId),
        hand: state.hand.filter((id) => id !== instanceId),
        selectedInstanceId: state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
        cardContextMenu: state.cardContextMenu?.instanceId === instanceId ? null : state.cardContextMenu,
      };
    });
  },

  returnCardToHand: (instanceId) => {
    set((state) => {
      const instance = state.cardInstances[instanceId];
      if (!instance || instance.zone !== 'table') return state;
      return {
        hand: [...state.hand, instanceId],
        cardInstances: {
          ...state.cardInstances,
          [instanceId]: { ...instance, zone: 'hand', faceUp: true, rotationY: 0 },
        },
        selectedInstanceId: state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
        cardContextMenu: null,
      };
    });
  },

  openCardContextMenu: (instanceId, x, y) => set({ cardContextMenu: { instanceId, x, y }, deckContextMenu: null }),
  closeCardContextMenu: () => set({ cardContextMenu: null }),

  shuffleDeck: () => {
    set((state) => ({ deckStack: shuffleArray(state.deckStack) }));
  },

  drawCard: () => {
    set((state) => {
      if (state.deckStack.length === 0) return state;
      const nextDeckStack = state.deckStack.slice(0, -1);
      const topId = state.deckStack[state.deckStack.length - 1];
      const instance = state.cardInstances[topId];
      return {
        deckStack: nextDeckStack,
        hand: [...state.hand, topId],
        cardInstances: { ...state.cardInstances, [topId]: { ...instance, zone: 'hand', faceUp: true } },
      };
    });
  },

  revealTopCard: () => {
    set((state) => {
      if (state.deckStack.length === 0) return state;
      const nextDeckStack = state.deckStack.slice(0, -1);
      const topId = state.deckStack[state.deckStack.length - 1];
      const instance = state.cardInstances[topId];
      const revealed = clampToTable(
        state.deckPosition.x + REVEAL_TOP_OFFSET.x,
        state.deckPosition.z + REVEAL_TOP_OFFSET.z,
      );
      return {
        deckStack: nextDeckStack,
        cardInstances: {
          ...state.cardInstances,
          [topId]: {
            ...instance,
            zone: 'table',
            faceUp: true,
            rotationY: 0,
            position: { x: revealed.x, y: 0, z: revealed.z },
          },
        },
      };
    });
  },

  openDeckContextMenu: (x, y) => set({ deckContextMenu: { x, y }, cardContextMenu: null }),
  closeDeckContextMenu: () => set({ deckContextMenu: null }),

  beginPlaceDeck: () => set({ isPlacingDeck: true, deckContextMenu: null }),
  placeDeckAt: (x, z) => {
    const clamped = clampToTable(x, z);
    set({ deckPosition: clamped, isPlacingDeck: false });
  },
  cancelPlaceDeck: () => set({ isPlacingDeck: false }),

  setTheme: (themeId) => {
    saveToStorage(STORAGE_KEYS.tableTheme, themeId);
    set({ selectedThemeId: themeId });
  },

  getInstanceById: (instanceId) => get().cardInstances[instanceId],
}));
