import { create } from 'zustand';
import type { BoardSnapshot, SavedTableState } from '../types/board';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { generateRandomId } from '../lib/id';

type SavedBoardsState = {
  savedBoards: SavedTableState[];
  /** Creates a new save, or overwrites an existing save with the same name if one exists. */
  saveBoard: (name: string, snapshot: BoardSnapshot) => SavedTableState;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  getBoardById: (id: string) => SavedTableState | undefined;
  findByName: (name: string) => SavedTableState | undefined;
};

function persist(boards: SavedTableState[]): void {
  saveToStorage(STORAGE_KEYS.savedBoards, boards);
}

const initialBoards = loadFromStorage<SavedTableState[]>(STORAGE_KEYS.savedBoards, []);

export const useSavedBoardsStore = create<SavedBoardsState>((set, get) => ({
  savedBoards: initialBoards,

  saveBoard: (name, snapshot) => {
    const trimmed = name.trim();
    const now = new Date().toISOString();
    const existing = get().savedBoards.find((board) => board.name === trimmed);

    if (existing) {
      const updated: SavedTableState = { ...existing, ...snapshot, name: trimmed, updatedAt: now };
      set((state) => {
        const next = state.savedBoards.map((board) => (board.id === existing.id ? updated : board));
        persist(next);
        return { savedBoards: next };
      });
      return updated;
    }

    const created: SavedTableState = {
      ...snapshot,
      id: generateRandomId('board'),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const next = [...state.savedBoards, created];
      persist(next);
      return { savedBoards: next };
    });
    return created;
  },

  renameBoard: (id, name) => {
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return state;
      const next = state.savedBoards.map((board) =>
        board.id === id ? { ...board, name: trimmed, updatedAt: new Date().toISOString() } : board,
      );
      persist(next);
      return { savedBoards: next };
    });
  },

  deleteBoard: (id) => {
    set((state) => {
      const next = state.savedBoards.filter((board) => board.id !== id);
      persist(next);
      return { savedBoards: next };
    });
  },

  getBoardById: (id) => get().savedBoards.find((board) => board.id === id),
  findByName: (name) => get().savedBoards.find((board) => board.name === name.trim()),
}));
