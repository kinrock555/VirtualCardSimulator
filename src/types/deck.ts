export type DeckCardEntry = {
  cardId: string;
  count: number;
};

export type DeckData = {
  id: string;
  name: string;
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
};
