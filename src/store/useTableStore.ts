import { create } from 'zustand';
import type { CardInstance } from '../types/table';
import type { DeckData } from '../types/deck';
import { generateRandomId } from '../lib/id';
import { clampToTable, normalizeRotation } from '../lib/tableGeometry';
import { CARD_THICKNESS, DRAW_PILE_ORIGIN, DRAW_PILE_STACK_OFFSET_Y } from '../lib/tableConstants';

type ContextMenuState = {
  instanceId: string;
  x: number;
  y: number;
};

type TableState = {
  deckId: string | null;
  instances: CardInstance[];
  selectedInstanceId: string | null;
  draggingInstanceId: string | null;
  contextMenu: ContextMenuState | null;

  /** Expands a deck's card entries into individual table instances, stacked as a draw pile. */
  loadDeck: (deck: DeckData) => void;
  selectInstance: (instanceId: string | null) => void;
  beginDrag: (instanceId: string) => void;
  updateDragPosition: (instanceId: string, x: number, z: number) => void;
  endDrag: () => void;
  setFaceUp: (instanceId: string, faceUp: boolean) => void;
  rotateInstance: (instanceId: string, direction: 'left' | 'right') => void;
  removeInstance: (instanceId: string) => void;
  openContextMenu: (instanceId: string, x: number, y: number) => void;
  closeContextMenu: () => void;
  getInstanceById: (instanceId: string) => CardInstance | undefined;
};

export const useTableStore = create<TableState>((set, get) => ({
  deckId: null,
  instances: [],
  selectedInstanceId: null,
  draggingInstanceId: null,
  contextMenu: null,

  loadDeck: (deck) => {
    const instances: CardInstance[] = [];
    let stackIndex = 0;
    for (const entry of deck.cards) {
      for (let i = 0; i < entry.count; i++) {
        instances.push({
          instanceId: generateRandomId('inst'),
          cardId: entry.cardId,
          position: {
            x: DRAW_PILE_ORIGIN.x,
            y: stackIndex * (CARD_THICKNESS + DRAW_PILE_STACK_OFFSET_Y),
            z: DRAW_PILE_ORIGIN.z,
          },
          rotationY: 0,
          faceUp: false,
        });
        stackIndex++;
      }
    }
    set({
      deckId: deck.id,
      instances,
      selectedInstanceId: null,
      draggingInstanceId: null,
      contextMenu: null,
    });
  },

  selectInstance: (instanceId) => set({ selectedInstanceId: instanceId }),

  beginDrag: (instanceId) => set({ draggingInstanceId: instanceId, selectedInstanceId: instanceId }),

  updateDragPosition: (instanceId, x, z) => {
    const clamped = clampToTable(x, z);
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.instanceId === instanceId
          ? { ...instance, position: { ...instance.position, x: clamped.x, z: clamped.z } }
          : instance,
      ),
    }));
  },

  endDrag: () => set({ draggingInstanceId: null }),

  setFaceUp: (instanceId, faceUp) => {
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.instanceId === instanceId ? { ...instance, faceUp } : instance,
      ),
    }));
  },

  rotateInstance: (instanceId, direction) => {
    set((state) => ({
      instances: state.instances.map((instance) => {
        if (instance.instanceId !== instanceId) return instance;
        const delta = direction === 'left' ? 90 : -90;
        return { ...instance, rotationY: normalizeRotation(instance.rotationY + delta) };
      }),
    }));
  },

  removeInstance: (instanceId) => {
    set((state) => ({
      instances: state.instances.filter((instance) => instance.instanceId !== instanceId),
      selectedInstanceId: state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
      contextMenu: state.contextMenu?.instanceId === instanceId ? null : state.contextMenu,
    }));
  },

  openContextMenu: (instanceId, x, y) => set({ contextMenu: { instanceId, x, y } }),
  closeContextMenu: () => set({ contextMenu: null }),

  getInstanceById: (instanceId) => get().instances.find((instance) => instance.instanceId === instanceId),
}));
