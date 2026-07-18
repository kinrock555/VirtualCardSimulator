import { create } from 'zustand';
import type { CardInstance, CardStack, StackType } from '../types/table';
import type { DeckData } from '../types/deck';
import type { BoardSnapshot } from '../types/board';
import type { StartSessionConfig, TestPlayer, TestPlayMode } from '../types/testSession';
import { generateRandomId } from '../lib/id';
import {
  clampToTable,
  computeCentroid,
  computeUnstackSpreadPosition,
  normalizeRotation,
  shuffleArray,
} from '../lib/tableGeometry';
import {
  DRAW_PILE_ORIGIN,
  PLAYER_DECK_ORIGINS,
  REVEAL_TOP_OFFSET,
  TABLE_DEPTH,
  TABLE_WIDTH,
  UNSTACK_SPREAD_OFFSET,
} from '../lib/tableConstants';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { DEFAULT_TABLE_THEME_ID } from '../config/tableThemes';
import { DEFAULT_ROOM_ENVIRONMENT_ID } from '../config/roomEnvironments';

type CardContextMenuState = { instanceId: string; x: number; y: number };
type StackContextMenuState = { stackId: string; x: number; y: number };
type ScreenPoint = { x: number; y: number };
export type CameraView = 'oblique' | 'top';
/**
 * Ephemeral (not persisted) state while a hand card is being dragged toward
 * the 3D field. `faceUp` is decided once, at drag start (plain drag = face
 * up, Shift+drag = face down), so the eventual placement request already
 * carries the orientation - this keeps the shape ready for a future online
 * "place card" request that specifies faceUp up front rather than flipping
 * after the fact.
 */
type HandFieldDragState = { instanceId: string; x: number; z: number; visible: boolean; faceUp: boolean };

type TableState = {
  deckId: string | null;
  /** All card instances for the current session, keyed by instanceId. */
  cardInstances: Record<string, CardInstance>;
  /** Every pile on the table: the main deck, graveyard, banished, and any custom stacks. */
  stacks: CardStack[];
  /** Hand order, left to right. */
  hand: string[];

  selectedInstanceIds: string[];
  draggingInstanceId: string | null;
  /** Per-follower {x,z} offsets from the dragged ("leader") card, active only during a group drag. */
  groupDragOffsets: Record<string, { x: number; z: number }> | null;

  cardContextMenu: CardContextMenuState | null;
  stackContextMenu: StackContextMenuState | null;
  multiSelectContextMenu: ScreenPoint | null;
  placingStackId: string | null;
  stackViewerStackId: string | null;

  selectedThemeId: string;
  selectedRoomEnvironmentId: string;
  handPanelCollapsed: boolean;
  /** Non-null only while a hand card is being dragged out of the 2D hand panel toward the field. */
  handFieldDrag: HandFieldDragState | null;
  /** Which camera preset is active - 'oblique' (default 3D angle) or 'top' (straight down). */
  cameraView: CameraView;

  /**
   * Offline pass-and-play players for the current session. Empty/length-1 in
   * plain single-player sessions (started via `loadDeck`, unchanged) - only
   * populated by `startTestSession` for 2-player modes. `hand` on this type
   * only holds the INACTIVE players' hands; the active player's live hand is
   * still `TableState.hand` (see `switchToPlayer`), so every existing
   * hand-mutating action keeps working unmodified regardless of player count.
   */
  players: TestPlayer[];
  currentPlayerIndex: number;
  testPlayMode: TestPlayMode;
  /** The one shared deck's stackId in 'sharedDeck' mode; null otherwise. */
  sharedDeckStackId: string | null;
  /**
   * Ephemeral (not persisted) - set by the test-play setup screen just before
   * navigating to /play/:deckId, consumed once by PlayPage on mount to start
   * a multi-player session instead of the plain single-deck `loadDeck` path.
   */
  pendingSessionConfig: StartSessionConfig | null;
  /** True right after a player switch, before the incoming player clicks "手札を表示" - drives the pass-and-play confirmation overlay. */
  awaitingHandReveal: boolean;
  /** instanceId -> owning playerId ('shared' in sharedDeck mode). Only used so resetTable can rebuild per-player decks separately instead of merging them; never persisted to CardInstance itself. */
  deckOwnerByInstanceId: Record<string, string>;

  /** Expands a deck's card entries into a fresh main deck, plus empty graveyard/banished piles. */
  loadDeck: (deck: DeckData) => void;
  resetTable: () => void;
  /** Builds cardInstances/stacks/players for a 1- or 2-player test-play session per the chosen deck mode. */
  startTestSession: (config: StartSessionConfig) => void;
  setPendingSessionConfig: (config: StartSessionConfig | null) => void;
  /** Syncs the outgoing player's live hand into `players`, then loads the incoming player's hand and shows the reveal confirmation. No-op with fewer than 2 players. */
  switchToPlayer: (index: number) => void;
  /** Dismisses the pass-and-play confirmation overlay so the incoming player's hand becomes visible. */
  revealHand: () => void;
  /** Pure-data snapshot of the live session (no camera - the caller merges that in separately). */
  captureSnapshot: () => Omit<BoardSnapshot, 'camera'>;
  /** Restores a snapshot. Never throws - missing/dangling data is skipped and reported in `warnings`. */
  applySnapshot: (snapshot: BoardSnapshot) => { warnings: string[] };

  selectInstance: (instanceId: string, additive?: boolean) => void;
  clearSelection: () => void;

  beginDrag: (instanceId: string) => void;
  updateDragPosition: (instanceId: string, x: number, z: number) => void;
  endDrag: () => void;

  /** Starts a 2D-hand-panel-initiated drag toward the 3D field (see HandPanel). `faceUp` is fixed for the whole drag. */
  beginHandFieldDrag: (instanceId: string, faceUp: boolean) => void;
  /** Updates the live drop-preview position while dragging from the hand panel. */
  updateHandFieldDrag: (x: number, z: number, visible: boolean) => void;
  /** Cancels a hand->field drag without moving any card (card stays in hand). */
  endHandFieldDrag: () => void;
  /** Commits a hand->field drop: moves the card to the table at an explicit point with the requested orientation. */
  moveHandCardToTableAt: (instanceId: string, x: number, z: number, faceUp: boolean) => void;

  setFaceUp: (instanceIds: string[], faceUp: boolean) => void;
  rotateInstances: (instanceIds: string[], direction: 'left' | 'right') => void;
  removeInstances: (instanceIds: string[]) => void;
  moveCardsToHand: (instanceIds: string[]) => void;
  moveCardsToTable: (instanceIds: string[], faceUp: boolean) => void;
  moveCardsToMainDeckTop: (instanceIds: string[]) => void;
  moveCardsToMainDeckBottom: (instanceIds: string[]) => void;

  createStackFromSelection: () => void;
  unstackCustomStack: (stackId: string) => void;
  shuffleStack: (stackId: string) => void;
  moveStackTopToHand: (stackId: string) => void;
  moveStackTopToTable: (stackId: string) => void;
  /** Draws up to `count` cards (fewer if the stack runs out). Returns how many were actually drawn. */
  drawMultipleFromStack: (stackId: string, count: number) => number;
  setStackOrder: (stackId: string, newOrderIds: string[]) => void;
  beginPlaceStack: (stackId: string) => void;
  placeStackAt: (x: number, z: number) => void;
  cancelPlaceStack: () => void;

  openCardContextMenu: (instanceId: string, x: number, y: number) => void;
  closeCardContextMenu: () => void;
  openStackContextMenu: (stackId: string, x: number, y: number) => void;
  closeStackContextMenu: () => void;
  openMultiSelectContextMenu: (x: number, y: number) => void;
  closeMultiSelectContextMenu: () => void;
  openStackViewer: (stackId: string) => void;
  closeStackViewer: () => void;

  setTheme: (themeId: string) => void;
  setRoomEnvironment: (environmentId: string) => void;
  setHandPanelCollapsed: (collapsed: boolean) => void;
  setCameraView: (view: CameraView) => void;
  toggleCameraView: () => void;

  getInstanceById: (instanceId: string) => CardInstance | undefined;
  getStackById: (stackId: string) => CardStack | undefined;
  findStackContaining: (instanceId: string) => CardStack | undefined;
};

/** Removes an instanceId from wherever it currently sits (hand or any stack). Pure helper, not a store action. */
function detach(
  stacks: CardStack[],
  hand: string[],
  instanceId: string,
): { stacks: CardStack[]; hand: string[] } {
  return {
    hand: hand.filter((id) => id !== instanceId),
    stacks: stacks.map((stack) =>
      stack.cardInstanceIds.includes(instanceId)
        ? { ...stack, cardInstanceIds: stack.cardInstanceIds.filter((id) => id !== instanceId) }
        : stack,
    ),
  };
}

function makePermanentStack(type: StackType, stackId: string, origin: { x: number; z: number }): CardStack {
  return { stackId, type, cardInstanceIds: [], position: { x: origin.x, z: origin.z }, rotationY: 0 };
}

/** Expands one DeckData into a fresh mainDeck stack + cardInstances, tagging every instance with its owning player for `deckOwnerByInstanceId`. Pure helper used by both `loadDeck` (single, owner-less) and `startTestSession` (2-player modes). */
function buildDeckStackInstances(
  deck: DeckData,
  stackId: string,
  origin: { x: number; z: number },
  ownerId: string,
): { instances: Record<string, CardInstance>; stack: CardStack; owners: Record<string, string> } {
  const instances: Record<string, CardInstance> = {};
  const ids: string[] = [];
  const owners: Record<string, string> = {};
  for (const entry of deck.cards) {
    for (let i = 0; i < entry.count; i++) {
      const instanceId = generateRandomId('inst');
      instances[instanceId] = {
        instanceId,
        cardId: entry.cardId,
        zone: 'deck',
        position: { x: origin.x, y: 0, z: origin.z },
        rotationY: 0,
        faceUp: false,
      };
      ids.push(instanceId);
      owners[instanceId] = ownerId;
    }
  }
  const stack: CardStack = { stackId, type: 'mainDeck', cardInstanceIds: ids, position: origin, rotationY: 0 };
  return { instances, stack, owners };
}

// Fixed graveyard/banished piles were removed - boards saved before that change
// may still reference them. These are only read once, on load, to convert
// that old data into ordinary field cards/stacks; nothing new is ever
// written to a 'graveyard'/'banished' zone or stack going forward.
const LEGACY_GRAVEYARD_CONVERSION_POSITION = { x: -TABLE_WIDTH / 2 + 1.6, z: TABLE_DEPTH / 2 - 1.6 };
const LEGACY_BANISHED_CONVERSION_POSITION = { x: TABLE_WIDTH / 2 - 1.6, z: TABLE_DEPTH / 2 - 1.6 };

/**
 * Converts one legacy graveyard/banished stack into either nothing (empty),
 * a single ordinary field card (exactly one card), or an ordinary custom
 * stack (two or more cards) - per the documented conversion rules. Returns
 * the replacement stack (or null to drop it) plus any cardInstances patch.
 */
function convertLegacyZoneStack(
  stack: CardStack,
  cardInstances: Record<string, CardInstance>,
): { stack: CardStack | null; instancesPatch: Record<string, CardInstance>; converted: boolean } {
  const position = stack.type === 'graveyard' ? LEGACY_GRAVEYARD_CONVERSION_POSITION : LEGACY_BANISHED_CONVERSION_POSITION;
  const validIds = stack.cardInstanceIds.filter((id) => Boolean(cardInstances[id]));

  if (validIds.length === 0) {
    return { stack: null, instancesPatch: {}, converted: stack.cardInstanceIds.length > 0 };
  }

  if (validIds.length === 1) {
    const id = validIds[0];
    const instance = cardInstances[id];
    const clamped = clampToTable(position.x, position.z);
    return {
      stack: null,
      instancesPatch: { [id]: { ...instance, zone: 'table', faceUp: true, rotationY: 0, position: { x: clamped.x, y: 0, z: clamped.z } } },
      converted: true,
    };
  }

  const instancesPatch: Record<string, CardInstance> = {};
  for (const id of validIds) {
    instancesPatch[id] = { ...cardInstances[id], zone: 'deck' };
  }
  return {
    stack: { stackId: stack.stackId, type: 'customStack', cardInstanceIds: validIds, position, rotationY: 0 },
    instancesPatch,
    converted: true,
  };
}

const initialThemeId = loadFromStorage<string>(STORAGE_KEYS.tableTheme, DEFAULT_TABLE_THEME_ID);
const initialRoomEnvironmentId = loadFromStorage<string>(
  STORAGE_KEYS.roomEnvironment,
  DEFAULT_ROOM_ENVIRONMENT_ID,
);
const initialHandPanelCollapsed = loadFromStorage<boolean>(STORAGE_KEYS.handPanelCollapsed, false);
const initialCameraView = loadFromStorage<CameraView>(STORAGE_KEYS.cameraView, 'oblique');

export const useTableStore = create<TableState>((set, get) => ({
  deckId: null,
  cardInstances: {},
  stacks: [],
  hand: [],

  selectedInstanceIds: [],
  draggingInstanceId: null,
  groupDragOffsets: null,

  cardContextMenu: null,
  stackContextMenu: null,
  multiSelectContextMenu: null,
  placingStackId: null,
  stackViewerStackId: null,

  selectedThemeId: initialThemeId,
  selectedRoomEnvironmentId: initialRoomEnvironmentId,
  handPanelCollapsed: initialHandPanelCollapsed,
  handFieldDrag: null,
  cameraView: initialCameraView,

  players: [],
  currentPlayerIndex: 0,
  testPlayMode: 'single',
  sharedDeckStackId: null,
  pendingSessionConfig: null,
  awaitingHandReveal: false,
  deckOwnerByInstanceId: {},

  loadDeck: (deck) => {
    const built = buildDeckStackInstances(deck, 'main-deck', DRAW_PILE_ORIGIN, 'player-1');
    set({
      deckId: deck.id,
      cardInstances: built.instances,
      stacks: [built.stack],
      hand: [],
      // Plain single-player launch (DeckEditPage -> /play/:deckId) always resets
      // to a clean single-player session, even if a 2-player session was active before.
      players: [],
      currentPlayerIndex: 0,
      testPlayMode: 'single',
      sharedDeckStackId: null,
      pendingSessionConfig: null,
      awaitingHandReveal: false,
      deckOwnerByInstanceId: built.owners,
      selectedInstanceIds: [],
      draggingInstanceId: null,
      groupDragOffsets: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      placingStackId: null,
      stackViewerStackId: null,
      handFieldDrag: null,
    });
  },

  resetTable: () => {
    set((state) => {
      const allIds = Object.keys(state.cardInstances);
      const nextInstances: Record<string, CardInstance> = {};
      for (const id of allIds) {
        nextInstances[id] = { ...state.cardInstances[id], zone: 'deck', faceUp: false, rotationY: 0 };
      }

      let stacks: CardStack[];
      if ((state.testPlayMode === 'mirroredDecks' || state.testPlayMode === 'separateDecks') && state.players.length >= 2) {
        // Each player's own cards must return to their own deck, never merged
        // into one shared shuffled pile.
        const idsByOwner: Record<string, string[]> = {};
        for (const id of allIds) {
          const owner = state.deckOwnerByInstanceId[id] ?? state.players[0].playerId;
          (idsByOwner[owner] ??= []).push(id);
        }
        stacks = state.players.map((player, index) => ({
          stackId: player.deckStackId ?? `main-deck-p${index + 1}`,
          type: 'mainDeck' as const,
          cardInstanceIds: shuffleArray(idsByOwner[player.playerId] ?? []),
          position: PLAYER_DECK_ORIGINS[index] ?? DRAW_PILE_ORIGIN,
          rotationY: 0,
        }));
      } else {
        stacks = [
          {
            stackId: state.sharedDeckStackId ?? 'main-deck',
            type: 'mainDeck',
            cardInstanceIds: shuffleArray(allIds),
            position: { x: DRAW_PILE_ORIGIN.x, z: DRAW_PILE_ORIGIN.z },
            rotationY: 0,
          },
        ];
      }

      return {
        cardInstances: nextInstances,
        stacks,
        hand: [],
        players: state.players.map((player) => ({ ...player, hand: [] })),
        awaitingHandReveal: false,
        selectedInstanceIds: [],
        draggingInstanceId: null,
        groupDragOffsets: null,
        cardContextMenu: null,
        stackContextMenu: null,
        multiSelectContextMenu: null,
        placingStackId: null,
        stackViewerStackId: null,
        handFieldDrag: null,
      };
    });
  },

  startTestSession: (config) => {
    let cardInstances: Record<string, CardInstance>;
    let stacks: CardStack[];
    let players: TestPlayer[];
    let sharedDeckStackId: string | null = null;
    let deckOwnerByInstanceId: Record<string, string>;
    let deckIdForRoute: string;

    if (config.mode === 'single') {
      const built = buildDeckStackInstances(config.deck, 'main-deck', DRAW_PILE_ORIGIN, 'player-1');
      cardInstances = built.instances;
      stacks = [built.stack];
      deckOwnerByInstanceId = built.owners;
      players = [{ playerId: 'player-1', name: 'プレイヤー1', hand: [], deckStackId: 'main-deck' }];
      deckIdForRoute = config.deck.id;
    } else if (config.mode === 'sharedDeck') {
      const built = buildDeckStackInstances(config.deck, 'main-deck', DRAW_PILE_ORIGIN, 'shared');
      cardInstances = built.instances;
      stacks = [built.stack];
      deckOwnerByInstanceId = built.owners;
      sharedDeckStackId = 'main-deck';
      players = [
        { playerId: 'player-1', name: config.playerNames[0]?.trim() || 'プレイヤー1', hand: [], deckStackId: null },
        { playerId: 'player-2', name: config.playerNames[1]?.trim() || 'プレイヤー2', hand: [], deckStackId: null },
      ];
      deckIdForRoute = config.deck.id;
    } else if (config.mode === 'mirroredDecks') {
      const built1 = buildDeckStackInstances(config.deck, 'main-deck-p1', PLAYER_DECK_ORIGINS[0], 'player-1');
      const built2 = buildDeckStackInstances(config.deck, 'main-deck-p2', PLAYER_DECK_ORIGINS[1], 'player-2');
      cardInstances = { ...built1.instances, ...built2.instances };
      stacks = [built1.stack, built2.stack];
      deckOwnerByInstanceId = { ...built1.owners, ...built2.owners };
      players = [
        { playerId: 'player-1', name: config.playerNames[0]?.trim() || 'プレイヤー1', hand: [], deckStackId: 'main-deck-p1' },
        { playerId: 'player-2', name: config.playerNames[1]?.trim() || 'プレイヤー2', hand: [], deckStackId: 'main-deck-p2' },
      ];
      deckIdForRoute = config.deck.id;
    } else {
      const built1 = buildDeckStackInstances(config.decks[0], 'main-deck-p1', PLAYER_DECK_ORIGINS[0], 'player-1');
      const built2 = buildDeckStackInstances(config.decks[1], 'main-deck-p2', PLAYER_DECK_ORIGINS[1], 'player-2');
      cardInstances = { ...built1.instances, ...built2.instances };
      stacks = [built1.stack, built2.stack];
      deckOwnerByInstanceId = { ...built1.owners, ...built2.owners };
      players = [
        { playerId: 'player-1', name: config.playerNames[0]?.trim() || 'プレイヤー1', hand: [], deckStackId: 'main-deck-p1' },
        { playerId: 'player-2', name: config.playerNames[1]?.trim() || 'プレイヤー2', hand: [], deckStackId: 'main-deck-p2' },
      ];
      deckIdForRoute = config.decks[0].id;
    }

    set({
      deckId: deckIdForRoute,
      cardInstances,
      stacks,
      hand: [],
      players,
      currentPlayerIndex: 0,
      testPlayMode: config.mode,
      sharedDeckStackId,
      deckOwnerByInstanceId,
      pendingSessionConfig: null,
      awaitingHandReveal: false,
      selectedInstanceIds: [],
      draggingInstanceId: null,
      groupDragOffsets: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      placingStackId: null,
      stackViewerStackId: null,
      handFieldDrag: null,
    });
  },

  setPendingSessionConfig: (config) => set({ pendingSessionConfig: config }),

  switchToPlayer: (index) => {
    set((state) => {
      if (state.players.length < 2) return state;
      if (index < 0 || index >= state.players.length || index === state.currentPlayerIndex) return state;
      const players = state.players.map((player, i) =>
        i === state.currentPlayerIndex ? { ...player, hand: state.hand } : player,
      );
      return {
        players,
        currentPlayerIndex: index,
        hand: players[index].hand,
        awaitingHandReveal: true,
        selectedInstanceIds: [],
        draggingInstanceId: null,
        groupDragOffsets: null,
        cardContextMenu: null,
        stackContextMenu: null,
        multiSelectContextMenu: null,
        handFieldDrag: null,
      };
    });
  },

  revealHand: () => set({ awaitingHandReveal: false }),

  captureSnapshot: () => {
    const state = get();
    return {
      version: 2,
      deckId: state.deckId,
      cardInstances: state.cardInstances,
      stacks: state.stacks,
      hand: state.hand,
      selectedThemeId: state.selectedThemeId,
      selectedRoomEnvironmentId: state.selectedRoomEnvironmentId,
      cameraView: state.cameraView,
      testPlayMode: state.testPlayMode,
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      sharedDeckStackId: state.sharedDeckStackId,
      deckOwnerByInstanceId: state.deckOwnerByInstanceId,
    };
  },

  applySnapshot: (snapshot) => {
    const warnings: string[] = [];
    let cardInstances: Record<string, CardInstance> =
      snapshot.cardInstances && typeof snapshot.cardInstances === 'object' ? snapshot.cardInstances : {};
    if (!snapshot.cardInstances) warnings.push('カード情報が見つからなかったため、空の状態から復元しました。');

    let stacks: CardStack[] = Array.isArray(snapshot.stacks)
      ? snapshot.stacks.filter((s): s is CardStack => Boolean(s) && Array.isArray(s.cardInstanceIds))
      : [];
    if (!Array.isArray(snapshot.stacks)) warnings.push('山札の情報が見つかりませんでした。');

    if (!stacks.some((s) => s.type === 'mainDeck')) {
      stacks.push(makePermanentStack('mainDeck', 'main-deck', DRAW_PILE_ORIGIN));
      warnings.push('山札のデータが欠けていたため、空の状態を補いました。');
    }

    // Convert any pre-existing-fixed-zone boards (graveyard/banished are no
    // longer part of the live game, but old saves may still have them) into
    // ordinary field cards/custom stacks instead of dropping their content.
    let legacyZoneConverted = false;
    const nextStacks: CardStack[] = [];
    for (const stack of stacks) {
      if (stack.type === 'graveyard' || stack.type === 'banished') {
        const result = convertLegacyZoneStack(stack, cardInstances);
        if (result.converted) legacyZoneConverted = true;
        if (Object.keys(result.instancesPatch).length > 0) {
          cardInstances = { ...cardInstances, ...result.instancesPatch };
        }
        if (result.stack) nextStacks.push(result.stack);
      } else {
        nextStacks.push(stack);
      }
    }
    stacks = nextStacks;

    // Defensive: convert any stray card whose zone is still graveyard/banished
    // (not tracked in any stack above) back to an ordinary field card too.
    for (const [id, instance] of Object.entries(cardInstances)) {
      if (instance.zone === 'graveyard' || instance.zone === 'banished') {
        const position =
          instance.zone === 'graveyard' ? LEGACY_GRAVEYARD_CONVERSION_POSITION : LEGACY_BANISHED_CONVERSION_POSITION;
        const clamped = clampToTable(position.x, position.z);
        cardInstances = {
          ...cardInstances,
          [id]: { ...instance, zone: 'table', faceUp: true, rotationY: 0, position: { x: clamped.x, y: 0, z: clamped.z } },
        };
        legacyZoneConverted = true;
      }
    }
    if (legacyZoneConverted) {
      warnings.push('以前のバージョンの墓地・除外データを、通常のフィールドカード/束として読み込みました。');
    }

    const hand = Array.isArray(snapshot.hand) ? snapshot.hand : [];
    if (!Array.isArray(snapshot.hand)) warnings.push('手札の情報が見つかりませんでした。');

    const validId = (id: string) => Boolean(cardInstances[id]);
    const filteredStacks = stacks.map((s) => {
      const filtered = s.cardInstanceIds.filter(validId);
      if (filtered.length !== s.cardInstanceIds.length) warnings.push('存在しないカードを一部のスタックから除外しました。');
      return { ...s, cardInstanceIds: filtered };
    });
    const validHand = hand.filter(validId);
    if (validHand.length !== hand.length) warnings.push('一部のカードが見つからなかったため、手札から除外しました。');

    // Version-2 saves carry the full pass-and-play session (players/mode/decks).
    // Older saves (no `players`, or a malformed one) are loaded as a plain
    // single-player session instead of failing - `hand` above is already that
    // player's whole hand either way.
    const VALID_MODES: TestPlayMode[] = ['single', 'sharedDeck', 'mirroredDecks', 'separateDecks'];
    const hasValidMultiplayerData =
      Array.isArray(snapshot.players) &&
      snapshot.players.length > 0 &&
      snapshot.players.every(
        (p) => p && typeof p.playerId === 'string' && typeof p.name === 'string' && Array.isArray(p.hand),
      ) &&
      typeof snapshot.testPlayMode === 'string' &&
      VALID_MODES.includes(snapshot.testPlayMode as TestPlayMode);

    let players: TestPlayer[];
    let currentPlayerIndex: number;
    let testPlayMode: TestPlayMode;
    let sharedDeckStackId: string | null;
    let deckOwnerByInstanceId: Record<string, string>;

    if (hasValidMultiplayerData) {
      players = snapshot.players!.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        hand: p.hand.filter(validId),
        deckStackId: typeof p.deckStackId === 'string' ? p.deckStackId : null,
      }));
      currentPlayerIndex =
        typeof snapshot.currentPlayerIndex === 'number' &&
        snapshot.currentPlayerIndex >= 0 &&
        snapshot.currentPlayerIndex < players.length
          ? snapshot.currentPlayerIndex
          : 0;
      testPlayMode = snapshot.testPlayMode as TestPlayMode;
      sharedDeckStackId = typeof snapshot.sharedDeckStackId === 'string' ? snapshot.sharedDeckStackId : null;
      deckOwnerByInstanceId =
        snapshot.deckOwnerByInstanceId && typeof snapshot.deckOwnerByInstanceId === 'object'
          ? snapshot.deckOwnerByInstanceId
          : {};
    } else {
      if (snapshot.version !== undefined || snapshot.players !== undefined) {
        warnings.push('プレイヤー情報が不完全だったため、1人用セッションとして読み込みました。');
      }
      const legacyDeckStack = filteredStacks.find((s) => s.type === 'mainDeck');
      players = [{ playerId: 'player-1', name: 'プレイヤー1', hand: [], deckStackId: legacyDeckStack?.stackId ?? null }];
      currentPlayerIndex = 0;
      testPlayMode = 'single';
      sharedDeckStackId = null;
      deckOwnerByInstanceId = {};
    }

    const nextCameraView: CameraView =
      snapshot.cameraView === 'oblique' || snapshot.cameraView === 'top' ? snapshot.cameraView : get().cameraView;
    saveToStorage(STORAGE_KEYS.cameraView, nextCameraView);

    set({
      deckId: snapshot.deckId ?? null,
      cardInstances,
      stacks: filteredStacks,
      hand: validHand,
      selectedThemeId: typeof snapshot.selectedThemeId === 'string' ? snapshot.selectedThemeId : DEFAULT_TABLE_THEME_ID,
      selectedRoomEnvironmentId:
        typeof snapshot.selectedRoomEnvironmentId === 'string'
          ? snapshot.selectedRoomEnvironmentId
          : DEFAULT_ROOM_ENVIRONMENT_ID,
      cameraView: nextCameraView,
      players,
      currentPlayerIndex,
      testPlayMode,
      sharedDeckStackId,
      deckOwnerByInstanceId,
      pendingSessionConfig: null,
      awaitingHandReveal: false,
      selectedInstanceIds: [],
      draggingInstanceId: null,
      groupDragOffsets: null,
      cardContextMenu: null,
      stackContextMenu: null,
      multiSelectContextMenu: null,
      placingStackId: null,
      stackViewerStackId: null,
      handFieldDrag: null,
    });

    return { warnings };
  },

  selectInstance: (instanceId, additive = false) => {
    set((state) => {
      if (!additive) return { selectedInstanceIds: [instanceId] };
      const exists = state.selectedInstanceIds.includes(instanceId);
      return {
        selectedInstanceIds: exists
          ? state.selectedInstanceIds.filter((id) => id !== instanceId)
          : [...state.selectedInstanceIds, instanceId],
      };
    });
  },

  clearSelection: () => set({ selectedInstanceIds: [] }),

  beginDrag: (instanceId) => {
    set((state) => {
      const isGroup = state.selectedInstanceIds.length > 1 && state.selectedInstanceIds.includes(instanceId);
      if (!isGroup) {
        return { draggingInstanceId: instanceId, selectedInstanceIds: [instanceId], groupDragOffsets: null };
      }
      const leader = state.cardInstances[instanceId];
      const offsets: Record<string, { x: number; z: number }> = {};
      for (const id of state.selectedInstanceIds) {
        if (id === instanceId) continue;
        const other = state.cardInstances[id];
        if (!other || other.zone !== 'table') continue;
        offsets[id] = { x: other.position.x - leader.position.x, z: other.position.z - leader.position.z };
      }
      return { draggingInstanceId: instanceId, groupDragOffsets: offsets };
    });
  },

  beginHandFieldDrag: (instanceId, faceUp) => {
    set((state) => {
      if (!state.hand.includes(instanceId)) return state;
      return { handFieldDrag: { instanceId, x: 0, z: 0, visible: false, faceUp } };
    });
  },

  updateHandFieldDrag: (x, z, visible) => {
    set((state) => {
      if (!state.handFieldDrag) return state;
      return { handFieldDrag: { ...state.handFieldDrag, x, z, visible } };
    });
  },

  endHandFieldDrag: () => set({ handFieldDrag: null }),

  moveHandCardToTableAt: (instanceId, x, z, faceUp) => {
    set((state) => {
      if (!state.hand.includes(instanceId)) return { handFieldDrag: null };
      const instance = state.cardInstances[instanceId];
      if (!instance) return { handFieldDrag: null };
      const clamped = clampToTable(x, z);
      return {
        hand: state.hand.filter((id) => id !== instanceId),
        cardInstances: {
          ...state.cardInstances,
          [instanceId]: {
            ...instance,
            zone: 'table',
            position: { x: clamped.x, y: 0, z: clamped.z },
            faceUp,
            rotationY: 0,
          },
        },
        handFieldDrag: null,
      };
    });
  },

  updateDragPosition: (instanceId, x, z) => {
    const clampedLeader = clampToTable(x, z);
    set((state) => {
      const leaderInstance = state.cardInstances[instanceId];
      if (!leaderInstance) return state;
      const nextInstances = { ...state.cardInstances };
      nextInstances[instanceId] = {
        ...leaderInstance,
        position: { ...leaderInstance.position, x: clampedLeader.x, z: clampedLeader.z },
      };
      if (state.groupDragOffsets) {
        for (const id in state.groupDragOffsets) {
          const offset = state.groupDragOffsets[id];
          const other = state.cardInstances[id];
          if (!other) continue;
          const target = clampToTable(clampedLeader.x + offset.x, clampedLeader.z + offset.z);
          nextInstances[id] = { ...other, position: { ...other.position, x: target.x, z: target.z } };
        }
      }
      return { cardInstances: nextInstances };
    });
  },

  endDrag: () => set({ draggingInstanceId: null, groupDragOffsets: null }),

  setFaceUp: (instanceIds, faceUp) => {
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, faceUp };
      }
      return { cardInstances: nextInstances };
    });
  },

  rotateInstances: (instanceIds, direction) => {
    const delta = direction === 'left' ? 90 : -90;
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, rotationY: normalizeRotation(instance.rotationY + delta) };
      }
      return { cardInstances: nextInstances };
    });
  },

  removeInstances: (instanceIds) => {
    set((state) => {
      const idSet = new Set(instanceIds);
      const nextInstances = { ...state.cardInstances };
      for (const id of instanceIds) delete nextInstances[id];
      return {
        cardInstances: nextInstances,
        stacks: state.stacks.map((stack) => ({
          ...stack,
          cardInstanceIds: stack.cardInstanceIds.filter((id) => !idSet.has(id)),
        })),
        hand: state.hand.filter((id) => !idSet.has(id)),
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !idSet.has(id)),
        cardContextMenu: state.cardContextMenu && idSet.has(state.cardContextMenu.instanceId) ? null : state.cardContextMenu,
      };
    });
  },

  moveCardsToHand: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'hand', faceUp: true, rotationY: 0 };
        movedIds.push(id);
      }
      return {
        cardInstances: nextInstances,
        stacks,
        hand: [...hand, ...movedIds],
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToTable: (instanceIds, faceUp) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      let dropIndex = 0;
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const sourceStack = stacks.find((s) => s.cardInstanceIds.includes(id));
        const base = sourceStack
          ? { x: sourceStack.position.x + REVEAL_TOP_OFFSET.x, z: sourceStack.position.z + REVEAL_TOP_OFFSET.z }
          : { x: instance.position.x, z: instance.position.z };
        const spread = computeUnstackSpreadPosition(base, dropIndex, UNSTACK_SPREAD_OFFSET);
        dropIndex++;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'table', faceUp, rotationY: 0, position: { x: spread.x, y: 0, z: spread.z } };
      }
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToMainDeckTop: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'deck', faceUp: false, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'mainDeck' ? { ...s, cardInstanceIds: [...s.cardInstanceIds, ...movedIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  moveCardsToMainDeckBottom: (instanceIds) => {
    set((state) => {
      let stacks = state.stacks;
      let hand = state.hand;
      const nextInstances = { ...state.cardInstances };
      const movedIds: string[] = [];
      for (const id of instanceIds) {
        const instance = nextInstances[id];
        if (!instance) continue;
        const detached = detach(stacks, hand, id);
        stacks = detached.stacks;
        hand = detached.hand;
        nextInstances[id] = { ...instance, zone: 'deck', faceUp: false, rotationY: 0 };
        movedIds.push(id);
      }
      stacks = stacks.map((s) => (s.type === 'mainDeck' ? { ...s, cardInstanceIds: [...movedIds, ...s.cardInstanceIds] } : s));
      return {
        cardInstances: nextInstances,
        stacks,
        hand,
        selectedInstanceIds: state.selectedInstanceIds.filter((id) => !instanceIds.includes(id)),
        cardContextMenu: null,
        multiSelectContextMenu: null,
      };
    });
  },

  createStackFromSelection: () => {
    set((state) => {
      const ids = state.selectedInstanceIds.filter((id) => state.cardInstances[id]?.zone === 'table');
      if (ids.length === 0) return state;
      const points = ids.map((id) => state.cardInstances[id].position);
      const center = computeCentroid(points);
      const newStack: CardStack = {
        stackId: generateRandomId('stack'),
        type: 'customStack',
        cardInstanceIds: ids,
        position: center,
        rotationY: 0,
      };
      const nextInstances = { ...state.cardInstances };
      for (const id of ids) {
        nextInstances[id] = { ...nextInstances[id], zone: 'deck' };
      }
      return {
        cardInstances: nextInstances,
        stacks: [...state.stacks, newStack],
        selectedInstanceIds: [],
        multiSelectContextMenu: null,
      };
    });
  },

  unstackCustomStack: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId && s.type === 'customStack');
      if (!stack) return state;
      const nextInstances = { ...state.cardInstances };
      stack.cardInstanceIds.forEach((id, index) => {
        const instance = nextInstances[id];
        if (!instance) return;
        const spread = computeUnstackSpreadPosition(stack.position, index, UNSTACK_SPREAD_OFFSET);
        nextInstances[id] = { ...instance, zone: 'table', position: { x: spread.x, y: 0, z: spread.z } };
      });
      return {
        cardInstances: nextInstances,
        stacks: state.stacks.filter((s) => s.stackId !== stackId),
        stackContextMenu: state.stackContextMenu?.stackId === stackId ? null : state.stackContextMenu,
        stackViewerStackId: state.stackViewerStackId === stackId ? null : state.stackViewerStackId,
      };
    });
  },

  shuffleStack: (stackId) => {
    set((state) => ({
      stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: shuffleArray(s.cardInstanceIds) } : s)),
    }));
  },

  moveStackTopToHand: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack || stack.cardInstanceIds.length === 0) return state;
      const topId = stack.cardInstanceIds[stack.cardInstanceIds.length - 1];
      const instance = state.cardInstances[topId];
      if (!instance) return state;
      return {
        stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, -1) } : s)),
        hand: [...state.hand, topId],
        cardInstances: { ...state.cardInstances, [topId]: { ...instance, zone: 'hand', faceUp: true } },
      };
    });
  },

  moveStackTopToTable: (stackId) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack || stack.cardInstanceIds.length === 0) return state;
      const topId = stack.cardInstanceIds[stack.cardInstanceIds.length - 1];
      const instance = state.cardInstances[topId];
      if (!instance) return state;
      const revealed = clampToTable(stack.position.x + REVEAL_TOP_OFFSET.x, stack.position.z + REVEAL_TOP_OFFSET.z);
      return {
        stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, -1) } : s)),
        cardInstances: {
          ...state.cardInstances,
          [topId]: { ...instance, zone: 'table', faceUp: true, rotationY: 0, position: { x: revealed.x, y: 0, z: revealed.z } },
        },
      };
    });
  },

  drawMultipleFromStack: (stackId, count) => {
    const stack = get().stacks.find((s) => s.stackId === stackId);
    if (!stack) return 0;
    const actualCount = Math.max(0, Math.min(Math.floor(count), stack.cardInstanceIds.length));
    if (actualCount === 0) return 0;
    const drawOrder = stack.cardInstanceIds.slice(stack.cardInstanceIds.length - actualCount).reverse();
    set((state) => {
      const nextInstances = { ...state.cardInstances };
      for (const id of drawOrder) {
        const instance = nextInstances[id];
        if (instance) nextInstances[id] = { ...instance, zone: 'hand', faceUp: true };
      }
      return {
        stacks: state.stacks.map((s) =>
          s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, s.cardInstanceIds.length - actualCount) } : s,
        ),
        hand: [...state.hand, ...drawOrder],
        cardInstances: nextInstances,
      };
    });
    return actualCount;
  },

  setStackOrder: (stackId, newOrderIds) => {
    set((state) => {
      const stack = state.stacks.find((s) => s.stackId === stackId);
      if (!stack) return state;
      if (newOrderIds.length !== stack.cardInstanceIds.length) return state;
      const currentSet = new Set(stack.cardInstanceIds);
      for (const id of newOrderIds) {
        if (!currentSet.has(id)) return state;
      }
      return { stacks: state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: newOrderIds } : s)) };
    });
  },

  beginPlaceStack: (stackId) => set({ placingStackId: stackId, stackContextMenu: null }),

  placeStackAt: (x, z) => {
    const clamped = clampToTable(x, z);
    set((state) => ({
      stacks: state.stacks.map((s) => (s.stackId === state.placingStackId ? { ...s, position: clamped } : s)),
      placingStackId: null,
    }));
  },

  cancelPlaceStack: () => set({ placingStackId: null }),

  openCardContextMenu: (instanceId, x, y) =>
    set({ cardContextMenu: { instanceId, x, y }, stackContextMenu: null, multiSelectContextMenu: null }),
  closeCardContextMenu: () => set({ cardContextMenu: null }),

  openStackContextMenu: (stackId, x, y) =>
    set({ stackContextMenu: { stackId, x, y }, cardContextMenu: null, multiSelectContextMenu: null }),
  closeStackContextMenu: () => set({ stackContextMenu: null }),

  openMultiSelectContextMenu: (x, y) =>
    set({ multiSelectContextMenu: { x, y }, cardContextMenu: null, stackContextMenu: null }),
  closeMultiSelectContextMenu: () => set({ multiSelectContextMenu: null }),

  openStackViewer: (stackId) => set({ stackViewerStackId: stackId, stackContextMenu: null }),
  closeStackViewer: () => set({ stackViewerStackId: null }),

  setTheme: (themeId) => {
    saveToStorage(STORAGE_KEYS.tableTheme, themeId);
    set({ selectedThemeId: themeId });
  },

  setRoomEnvironment: (environmentId) => {
    saveToStorage(STORAGE_KEYS.roomEnvironment, environmentId);
    set({ selectedRoomEnvironmentId: environmentId });
  },

  setHandPanelCollapsed: (collapsed) => {
    saveToStorage(STORAGE_KEYS.handPanelCollapsed, collapsed);
    set({ handPanelCollapsed: collapsed });
  },

  setCameraView: (view) => {
    saveToStorage(STORAGE_KEYS.cameraView, view);
    set({ cameraView: view });
  },

  toggleCameraView: () => {
    set((state) => {
      const next: CameraView = state.cameraView === 'oblique' ? 'top' : 'oblique';
      saveToStorage(STORAGE_KEYS.cameraView, next);
      return { cameraView: next };
    });
  },

  getInstanceById: (instanceId) => get().cardInstances[instanceId],
  getStackById: (stackId) => get().stacks.find((s) => s.stackId === stackId),
  findStackContaining: (instanceId) => get().stacks.find((s) => s.cardInstanceIds.includes(instanceId)),
}));
