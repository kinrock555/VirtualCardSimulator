import { create } from 'zustand';
import type { DeckCardEntry, DeckData } from '../types/deck';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { generateRandomId } from '../lib/id';

type DeckState = {
  decks: DeckData[];
  createDeck: (name: string) => DeckData;
  duplicateDeck: (deckId: string) => DeckData | undefined;
  renameDeck: (deckId: string, name: string) => void;
  deleteDeck: (deckId: string) => void;
  saveDeckCards: (deckId: string, cards: DeckCardEntry[]) => void;
  getDeckById: (deckId: string) => DeckData | undefined;
};

function persist(decks: DeckData[]): void {
  saveToStorage(STORAGE_KEYS.decks, decks);
}

const initialDecks = loadFromStorage<DeckData[]>(STORAGE_KEYS.decks, []);

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: initialDecks,

  createDeck: (name) => {
    const now = new Date().toISOString();
    const deck: DeckData = {
      id: generateRandomId('deck'),
      name: name.trim() || '新しいデッキ',
      cards: [],
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const next = [...state.decks, deck];
      persist(next);
      return { decks: next };
    });
    return deck;
  },

  duplicateDeck: (deckId) => {
    const source = get().decks.find((deck) => deck.id === deckId);
    if (!source) return undefined;
    const now = new Date().toISOString();
    const copy: DeckData = {
      id: generateRandomId('deck'),
      name: `${source.name}のコピー`,
      cards: source.cards.map((entry) => ({ ...entry })),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const next = [...state.decks, copy];
      persist(next);
      return { decks: next };
    });
    return copy;
  },

  renameDeck: (deckId, name) => {
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return state;
      const next = state.decks.map((deck) =>
        deck.id === deckId ? { ...deck, name: trimmed, updatedAt: new Date().toISOString() } : deck,
      );
      persist(next);
      return { decks: next };
    });
  },

  deleteDeck: (deckId) => {
    set((state) => {
      const next = state.decks.filter((deck) => deck.id !== deckId);
      persist(next);
      return { decks: next };
    });
  },

  saveDeckCards: (deckId, cards) => {
    set((state) => {
      const next = state.decks.map((deck) =>
        deck.id === deckId ? { ...deck, cards, updatedAt: new Date().toISOString() } : deck,
      );
      persist(next);
      return { decks: next };
    });
  },

  getDeckById: (deckId) => get().decks.find((deck) => deck.id === deckId),
}));
