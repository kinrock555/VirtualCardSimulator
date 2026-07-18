import { create } from 'zustand';

type UiState = {
  /** Short-lived banner message, e.g. for "not implemented yet" actions. */
  notification: string | null;
  showNotification: (message: string) => void;
  clearNotification: () => void;

  boxSearchQuery: string;
  setBoxSearchQuery: (query: string) => void;
  boxSelectedCardId: string | null;
  setBoxSelectedCardId: (cardId: string | null) => void;

  deckBrowserSearchQuery: string;
  setDeckBrowserSearchQuery: (query: string) => void;
  editingDeckId: string | null;
  setEditingDeckId: (deckId: string | null) => void;
};

let notificationTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set) => ({
  notification: null,
  showNotification: (message) => {
    if (notificationTimer) clearTimeout(notificationTimer);
    set({ notification: message });
    notificationTimer = setTimeout(() => set({ notification: null }), 2600);
  },
  clearNotification: () => {
    if (notificationTimer) clearTimeout(notificationTimer);
    set({ notification: null });
  },

  boxSearchQuery: '',
  setBoxSearchQuery: (query) => set({ boxSearchQuery: query }),
  boxSelectedCardId: null,
  setBoxSelectedCardId: (cardId) => set({ boxSelectedCardId: cardId }),

  deckBrowserSearchQuery: '',
  setDeckBrowserSearchQuery: (query) => set({ deckBrowserSearchQuery: query }),
  editingDeckId: null,
  setEditingDeckId: (deckId) => set({ editingDeckId: deckId }),
}));
