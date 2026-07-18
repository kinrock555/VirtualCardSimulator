// Core card/table data model, shared between the offline client (src/) and
// the online server (server/). Originally defined in src/types/table.ts;
// moved here so both sides import the exact same definitions instead of
// duplicating them (src/types/table.ts now just re-exports this file).

export type CardRotation = 0 | 90 | 180 | 270;

/**
 * Where a card instance currently lives.
 * - "deck": inside some CardStack (main deck or a custom stack) - see `stacks`.
 * - "hand": in a player's hand row.
 * - "table": loose on the table, freely draggable.
 * - "graveyard" / "banished": inside the (always-present) graveyard/banished stack.
 */
export type CardZone = 'deck' | 'hand' | 'table' | 'graveyard' | 'banished';

export type CardInstance = {
  instanceId: string;
  cardId: string;
  zone: CardZone;
  /**
   * Authoritative only for zone "table" (free placement, draggable).
   * For "deck"/"hand"/"graveyard"/"banished" the render position is computed
   * from the card's index within its stack/hand instead, so this value is
   * stale/unused for those zones.
   */
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotationY: CardRotation;
  faceUp: boolean;
};

/** What kind of pile a CardStack represents. */
export type StackType = 'mainDeck' | 'customStack' | 'graveyard' | 'banished';

/**
 * A pile of cards on the table (the main deck, a graveyard, a banished pile,
 * or a user-created custom stack). Card order is the source of truth for
 * "top of the stack" - the LAST id in `cardInstanceIds` is the top card
 * (draw / reveal-top / shuffle-preserving-order all operate on the end of
 * this array).
 */
export type CardStack = {
  stackId: string;
  type: StackType;
  cardInstanceIds: string[];
  position: {
    x: number;
    z: number;
  };
  rotationY: number;
};
