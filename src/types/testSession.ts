import type { DeckData } from './deck';

export type TestPlayMode = 'single' | 'sharedDeck' | 'mirroredDecks' | 'separateDecks';

export type TestPlayer = {
  playerId: string;
  name: string;
  /** This player's hand order (instanceIds) while it is NOT their turn. While
   * a player is the active player, their live hand lives in TableState.hand
   * instead - see useTableStore's switchToPlayer for how the two stay in sync. */
  hand: string[];
  /** Which stack in TableState.stacks is this player's own deck (null in single-player mode, where the deck has no dedicated owner). */
  deckStackId: string | null;
};

export type StartSessionConfig =
  | { mode: 'single'; deck: DeckData }
  | { mode: 'sharedDeck'; deck: DeckData; playerNames: [string, string] }
  | { mode: 'mirroredDecks'; deck: DeckData; playerNames: [string, string] }
  | { mode: 'separateDecks'; decks: [DeckData, DeckData]; playerNames: [string, string] };
