export type CardRotation = 0 | 90 | 180 | 270;

/** Where a card instance currently lives: the draw pile, a player's hand, or loose on the table. */
export type CardZone = 'deck' | 'hand' | 'table';

export type CardInstance = {
  instanceId: string;
  cardId: string;
  zone: CardZone;
  /**
   * Authoritative only for zone "table" (free placement, draggable).
   * For "deck"/"hand" the render position is computed from the card's
   * index within `deckStack`/`hand` instead, so this value is stale/unused.
   */
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotationY: CardRotation;
  faceUp: boolean;
};

/**
 * A single draw pile on the table. Card order is the source of truth for
 * "top of the deck" - the LAST id in `cardInstanceIds` is the top card
 * (draw / reveal-top always operate on `cardInstanceIds[length - 1]`).
 */
export type CardStack = {
  stackId: string;
  cardInstanceIds: string[];
  position: {
    x: number;
    z: number;
  };
  rotationY: number;
};
