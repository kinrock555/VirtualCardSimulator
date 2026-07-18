import { create } from 'zustand';
import type { CardMaster } from '../types/card';
import { loadCardMastersFromAssets } from '../lib/cardLoader';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';

type NameOverrides = Record<string, string>;

type CardMasterState = {
  /** Cards as read from src/assets/cards, before any user renaming. */
  baseCards: CardMaster[];
  nameOverrides: NameOverrides;
  /** baseCards with nameOverrides applied - what the rest of the app reads. */
  cards: CardMaster[];
  updateCardName: (cardId: string, name: string) => void;
  getCardById: (cardId: string) => CardMaster | undefined;
};

function mergeCards(base: CardMaster[], overrides: NameOverrides): CardMaster[] {
  return base.map((card) => (overrides[card.id] ? { ...card, name: overrides[card.id] } : card));
}

const initialBaseCards = loadCardMastersFromAssets();
const initialOverrides = loadFromStorage<NameOverrides>(STORAGE_KEYS.cardNameOverrides, {});

export const useCardMasterStore = create<CardMasterState>((set, get) => ({
  baseCards: initialBaseCards,
  nameOverrides: initialOverrides,
  cards: mergeCards(initialBaseCards, initialOverrides),
  updateCardName: (cardId, name) => {
    const trimmed = name.trim();
    set((state) => {
      const nextOverrides = { ...state.nameOverrides };
      if (trimmed.length === 0) {
        delete nextOverrides[cardId];
      } else {
        nextOverrides[cardId] = trimmed;
      }
      saveToStorage(STORAGE_KEYS.cardNameOverrides, nextOverrides);
      return {
        nameOverrides: nextOverrides,
        cards: mergeCards(state.baseCards, nextOverrides),
      };
    });
  },
  getCardById: (cardId) => get().cards.find((card) => card.id === cardId),
}));
