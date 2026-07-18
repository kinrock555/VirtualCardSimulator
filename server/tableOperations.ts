// Pure, side-effect-free operations on ServerTableState. Every function
// either returns { ok: true, state/... } or { ok: false, error } - callers
// (socketHandlers.ts) decide what to broadcast. Nothing here touches
// sockets, rooms, or timers, which keeps this module easy to reason about
// and reuse from tests later.
import type { CardRotation, CardStack, CardZone } from '../shared/cardTypes';
import type {
  DeckCardEntrySummary,
  OnlineCardInstance,
  PublicCardView,
  PublicTableState,
  ServerTableState,
  StackViewCard,
} from '../shared/onlineTypes';
import type { CardZoneDestination } from '../shared/socketEvents';
import {
  BANISHED_ORIGIN,
  DRAW_PILE_ORIGIN,
  GRAVEYARD_ORIGIN,
  REVEAL_TOP_OFFSET,
  UNSTACK_SPREAD_OFFSET,
  clampToTable,
  computeCentroid,
  computeUnstackSpreadPosition,
  normalizeRotation,
  shuffleArray,
} from '../shared/tableLogic';
import { generateInstanceId, generateStackId } from './utils/id';

export type OpResult = { ok: true; state: ServerTableState } | { ok: false; error: string };

function now(): string {
  return new Date().toISOString();
}

// Computed-property object literals (`{ ...spread, [key]: { ..., rotationY: 0 } }`)
// widen numeric literals to `number`, so this typed constant is used instead of
// inlining `0` wherever a card's rotation is reset - keeps it as the `CardRotation` literal.
const RESET_ROTATION: CardRotation = 0;

function withUpdatedAt(state: ServerTableState): ServerTableState {
  return { ...state, updatedAt: now() };
}

function makePermanentStack(type: 'mainDeck' | 'graveyard' | 'banished', stackId: string, origin: { x: number; z: number }): CardStack {
  return { stackId, type, cardInstanceIds: [], position: { x: origin.x, z: origin.z }, rotationY: 0 };
}

/** Detaches an instanceId from wherever it currently sits (any hand or any stack). */
function detach(
  stacks: CardStack[],
  hands: Record<string, string[]>,
  instanceId: string,
): { stacks: CardStack[]; hands: Record<string, string[]> } {
  const nextHands: Record<string, string[]> = {};
  for (const [playerId, ids] of Object.entries(hands)) {
    nextHands[playerId] = ids.filter((id) => id !== instanceId);
  }
  const nextStacks = stacks.map((stack) =>
    stack.cardInstanceIds.includes(instanceId)
      ? { ...stack, cardInstanceIds: stack.cardInstanceIds.filter((id) => id !== instanceId) }
      : stack,
  );
  return { stacks: nextStacks, hands: nextHands };
}

export function buildInitialTableState(
  deckId: string,
  deckCards: DeckCardEntrySummary[],
  themeId: string,
  initialPlayerIds: string[],
): ServerTableState {
  const cardInstances: Record<string, OnlineCardInstance> = {};
  const mainDeckIds: string[] = [];
  for (const entry of deckCards) {
    const count = Math.max(0, Math.floor(entry.count));
    for (let i = 0; i < count; i++) {
      const instanceId = generateInstanceId();
      cardInstances[instanceId] = {
        instanceId,
        cardId: entry.cardId,
        zone: 'deck',
        ownerId: null,
        position: { x: DRAW_PILE_ORIGIN.x, y: 0, z: DRAW_PILE_ORIGIN.z },
        rotationY: 0,
        faceUp: false,
      };
      mainDeckIds.push(instanceId);
    }
  }
  const hands: Record<string, string[]> = {};
  for (const playerId of initialPlayerIds) hands[playerId] = [];

  return {
    deckId,
    cardInstances,
    stacks: [
      { stackId: 'main-deck', type: 'mainDeck', cardInstanceIds: mainDeckIds, position: { ...DRAW_PILE_ORIGIN }, rotationY: 0 },
      makePermanentStack('graveyard', 'graveyard', GRAVEYARD_ORIGIN),
      makePermanentStack('banished', 'banished', BANISHED_ORIGIN),
    ],
    hands,
    selectedThemeId: themeId,
    updatedAt: now(),
  };
}

export function ensurePlayerHand(state: ServerTableState, playerId: string): ServerTableState {
  if (state.hands[playerId]) return state;
  return { ...state, hands: { ...state.hands, [playerId]: [] } };
}

export function moveCardCommit(state: ServerTableState, instanceId: string, x: number, z: number): OpResult {
  const card = state.cardInstances[instanceId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };
  if (card.zone !== 'table') return { ok: false, error: 'このカードはフィールド上にありません' };
  const clamped = clampToTable(x, z);
  const nextInstances = {
    ...state.cardInstances,
    [instanceId]: { ...card, position: { ...card.position, x: clamped.x, z: clamped.z } },
  };
  return { ok: true, state: withUpdatedAt({ ...state, cardInstances: nextInstances }) };
}

/** Applies an in-progress drag position WITHOUT bumping updatedAt (no broadcast-worthy commit yet). */
export function moveCardEphemeral(state: ServerTableState, instanceId: string, x: number, z: number): OpResult {
  const card = state.cardInstances[instanceId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };
  if (card.zone !== 'table') return { ok: false, error: 'このカードはフィールド上にありません' };
  const clamped = clampToTable(x, z);
  const nextInstances = {
    ...state.cardInstances,
    [instanceId]: { ...card, position: { ...card.position, x: clamped.x, z: clamped.z } },
  };
  return { ok: true, state: { ...state, cardInstances: nextInstances } };
}

export function flipCard(state: ServerTableState, instanceId: string, faceUp: boolean): OpResult {
  const card = state.cardInstances[instanceId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };
  if (card.zone !== 'table') return { ok: false, error: 'このカードはフィールド上にありません' };
  const nextInstances = { ...state.cardInstances, [instanceId]: { ...card, faceUp } };
  return { ok: true, state: withUpdatedAt({ ...state, cardInstances: nextInstances }) };
}

export function rotateCard(state: ServerTableState, instanceId: string, direction: 'left' | 'right'): OpResult {
  const card = state.cardInstances[instanceId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };
  if (card.zone !== 'table') return { ok: false, error: 'このカードはフィールド上にありません' };
  const delta = direction === 'left' ? 90 : -90;
  const nextInstances = { ...state.cardInstances, [instanceId]: { ...card, rotationY: normalizeRotation(card.rotationY + delta) } };
  return { ok: true, state: withUpdatedAt({ ...state, cardInstances: nextInstances }) };
}

export function moveCardZone(
  state: ServerTableState,
  actingPlayerId: string,
  instanceId: string,
  destination: CardZoneDestination,
  targetPosition?: { x: number; z: number },
): OpResult {
  const card = state.cardInstances[instanceId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };

  if (destination === 'hand') {
    if (card.zone === 'hand') return { ok: false, error: 'このカードは既に手札にあります' };
    let targetOwner: string;
    if (card.zone === 'table') {
      if (!card.ownerId) return { ok: false, error: '所有者不明のため手札へ戻せません' };
      targetOwner = card.ownerId;
    } else {
      targetOwner = actingPlayerId;
    }
    const detached = detach(state.stacks, state.hands, instanceId);
    const hands = { ...detached.hands, [targetOwner]: [...(detached.hands[targetOwner] ?? []), instanceId] };
    const nextInstances = {
      ...state.cardInstances,
      [instanceId]: { ...card, zone: 'hand' as CardZone, ownerId: targetOwner, faceUp: true, rotationY: RESET_ROTATION },
    };
    return { ok: true, state: withUpdatedAt({ ...state, stacks: detached.stacks, hands, cardInstances: nextInstances }) };
  }

  if (destination === 'tableFaceUp' || destination === 'tableFaceDown') {
    if (card.zone === 'hand' && card.ownerId !== actingPlayerId) {
      return { ok: false, error: '自分の手札のカードだけを場に出せます' };
    }
    if (card.zone === 'table') return { ok: false, error: 'このカードは既にフィールドにあります' };
    const sourceStack = state.stacks.find((s) => s.cardInstanceIds.includes(instanceId));
    const base =
      targetPosition ??
      (sourceStack
        ? { x: sourceStack.position.x + REVEAL_TOP_OFFSET.x, z: sourceStack.position.z + REVEAL_TOP_OFFSET.z }
        : { x: card.position.x, z: card.position.z });
    const spread = clampToTable(base.x, base.z);
    const detached = detach(state.stacks, state.hands, instanceId);
    const nextInstances = {
      ...state.cardInstances,
      [instanceId]: {
        ...card,
        zone: 'table' as CardZone,
        faceUp: destination === 'tableFaceUp',
        rotationY: RESET_ROTATION,
        position: { x: spread.x, y: 0, z: spread.z },
      },
    };
    return { ok: true, state: withUpdatedAt({ ...state, stacks: detached.stacks, hands: detached.hands, cardInstances: nextInstances }) };
  }

  if (destination === 'graveyard' || destination === 'banished') {
    const targetType = destination;
    const detached = detach(state.stacks, state.hands, instanceId);
    const stacks = detached.stacks.map((s) => (s.type === targetType ? { ...s, cardInstanceIds: [...s.cardInstanceIds, instanceId] } : s));
    const nextInstances = {
      ...state.cardInstances,
      [instanceId]: { ...card, zone: targetType as CardZone, ownerId: null, faceUp: true, rotationY: RESET_ROTATION },
    };
    return { ok: true, state: withUpdatedAt({ ...state, stacks, hands: detached.hands, cardInstances: nextInstances }) };
  }

  // deckTop / deckBottom
  const detached = detach(state.stacks, state.hands, instanceId);
  const stacks = detached.stacks.map((s) => {
    if (s.type !== 'mainDeck') return s;
    return destination === 'deckTop'
      ? { ...s, cardInstanceIds: [...s.cardInstanceIds, instanceId] }
      : { ...s, cardInstanceIds: [instanceId, ...s.cardInstanceIds] };
  });
  const nextInstances = {
    ...state.cardInstances,
    [instanceId]: { ...card, zone: 'deck' as CardZone, ownerId: null, faceUp: false, rotationY: RESET_ROTATION },
  };
  return { ok: true, state: withUpdatedAt({ ...state, stacks, hands: detached.hands, cardInstances: nextInstances }) };
}

export function shuffleStack(state: ServerTableState, stackId: string): OpResult {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  const stacks = state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: shuffleArray(s.cardInstanceIds) } : s));
  return { ok: true, state: withUpdatedAt({ ...state, stacks }) };
}

export function drawFromStack(
  state: ServerTableState,
  actingPlayerId: string,
  stackId: string,
  count: number,
): { ok: true; state: ServerTableState; drawnCount: number } | { ok: false; error: string } {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  const actualCount = Math.max(0, Math.min(Math.floor(count), stack.cardInstanceIds.length));
  if (actualCount === 0) return { ok: true, state, drawnCount: 0 };

  const drawOrder = stack.cardInstanceIds.slice(stack.cardInstanceIds.length - actualCount).reverse();
  const stacks = state.stacks.map((s) =>
    s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, s.cardInstanceIds.length - actualCount) } : s,
  );
  const nextInstances = { ...state.cardInstances };
  for (const id of drawOrder) {
    const card = nextInstances[id];
    if (card) nextInstances[id] = { ...card, zone: 'hand', ownerId: actingPlayerId, faceUp: true };
  }
  const hands = { ...state.hands, [actingPlayerId]: [...(state.hands[actingPlayerId] ?? []), ...drawOrder] };
  return { ok: true, state: withUpdatedAt({ ...state, stacks, hands, cardInstances: nextInstances }), drawnCount: actualCount };
}

export function revealStackTop(state: ServerTableState, stackId: string): OpResult {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  if (stack.cardInstanceIds.length === 0) return { ok: false, error: 'この束は空です' };
  const topId = stack.cardInstanceIds[stack.cardInstanceIds.length - 1];
  const card = state.cardInstances[topId];
  if (!card) return { ok: false, error: 'カードが見つかりません' };
  const revealed = clampToTable(stack.position.x + REVEAL_TOP_OFFSET.x, stack.position.z + REVEAL_TOP_OFFSET.z);
  const stacks = state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: s.cardInstanceIds.slice(0, -1) } : s));
  const nextInstances = {
    ...state.cardInstances,
    [topId]: { ...card, zone: 'table' as CardZone, faceUp: true, rotationY: RESET_ROTATION, position: { x: revealed.x, y: 0, z: revealed.z } },
  };
  return { ok: true, state: withUpdatedAt({ ...state, stacks, cardInstances: nextInstances }) };
}

export function reorderStack(state: ServerTableState, stackId: string, orderedInstanceIds: string[]): OpResult {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  if (orderedInstanceIds.length !== stack.cardInstanceIds.length) return { ok: false, error: '並び替え内容が不正です' };
  const currentSet = new Set(stack.cardInstanceIds);
  for (const id of orderedInstanceIds) {
    if (!currentSet.has(id)) return { ok: false, error: '並び替え内容が不正です' };
  }
  const stacks = state.stacks.map((s) => (s.stackId === stackId ? { ...s, cardInstanceIds: orderedInstanceIds } : s));
  return { ok: true, state: withUpdatedAt({ ...state, stacks }) };
}

export function createStackFromSelection(state: ServerTableState, instanceIds: string[]): OpResult {
  const uniqueIds = Array.from(new Set(instanceIds));
  const cards = uniqueIds.map((id) => state.cardInstances[id]);
  if (cards.length === 0 || cards.some((c) => !c || c.zone !== 'table')) {
    return { ok: false, error: '束にできるのはフィールド上のカードだけです' };
  }
  const center = computeCentroid(cards.map((c) => c!.position));
  const newStack: CardStack = {
    stackId: generateStackId(),
    type: 'customStack',
    cardInstanceIds: uniqueIds,
    position: center,
    rotationY: 0,
  };
  const nextInstances = { ...state.cardInstances };
  for (const id of uniqueIds) nextInstances[id] = { ...nextInstances[id], zone: 'deck' };
  return { ok: true, state: withUpdatedAt({ ...state, cardInstances: nextInstances, stacks: [...state.stacks, newStack] }) };
}

export function unstackCustomStack(state: ServerTableState, stackId: string): OpResult {
  const stack = state.stacks.find((s) => s.stackId === stackId && s.type === 'customStack');
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  const nextInstances = { ...state.cardInstances };
  stack.cardInstanceIds.forEach((id, index) => {
    const card = nextInstances[id];
    if (!card) return;
    const spread = computeUnstackSpreadPosition(stack.position, index, UNSTACK_SPREAD_OFFSET);
    nextInstances[id] = { ...card, zone: 'table', position: { x: spread.x, y: 0, z: spread.z } };
  });
  const stacks = state.stacks.filter((s) => s.stackId !== stackId);
  return { ok: true, state: withUpdatedAt({ ...state, stacks, cardInstances: nextInstances }) };
}

export function moveStack(state: ServerTableState, stackId: string, x: number, z: number): OpResult {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return { ok: false, error: '対象が見つかりません' };
  const clamped = clampToTable(x, z);
  const stacks = state.stacks.map((s) => (s.stackId === stackId ? { ...s, position: clamped } : s));
  return { ok: true, state: withUpdatedAt({ ...state, stacks }) };
}

export function returnAllToMainDeck(state: ServerTableState, stackId: string): OpResult {
  const source = state.stacks.find((s) => s.stackId === stackId);
  if (!source) return { ok: false, error: '対象が見つかりません' };
  if (source.cardInstanceIds.length === 0) return { ok: true, state };
  const ids = source.cardInstanceIds;
  const nextInstances = { ...state.cardInstances };
  for (const id of ids) {
    const card = nextInstances[id];
    if (card) nextInstances[id] = { ...card, zone: 'deck', ownerId: null, faceUp: false, rotationY: 0 };
  }
  const stacks = state.stacks.map((s) => {
    if (s.stackId === stackId) return { ...s, cardInstanceIds: [] };
    if (s.type === 'mainDeck') return { ...s, cardInstanceIds: [...s.cardInstanceIds, ...ids] };
    return s;
  });
  return { ok: true, state: withUpdatedAt({ ...state, stacks, cardInstances: nextInstances }) };
}

export function resetTable(state: ServerTableState): ServerTableState {
  const allIds = Object.keys(state.cardInstances);
  const nextInstances: Record<string, OnlineCardInstance> = {};
  for (const id of allIds) {
    nextInstances[id] = { ...state.cardInstances[id], zone: 'deck', ownerId: null, faceUp: false, rotationY: 0 };
  }
  const hands: Record<string, string[]> = {};
  for (const playerId of Object.keys(state.hands)) hands[playerId] = [];
  return withUpdatedAt({
    ...state,
    cardInstances: nextInstances,
    stacks: [
      { stackId: 'main-deck', type: 'mainDeck', cardInstanceIds: shuffleArray(allIds), position: { ...DRAW_PILE_ORIGIN }, rotationY: 0 },
      makePermanentStack('graveyard', 'graveyard', GRAVEYARD_ORIGIN),
      makePermanentStack('banished', 'banished', BANISHED_ORIGIN),
    ],
    hands,
  });
}

export function setTheme(state: ServerTableState, themeId: string): ServerTableState {
  return withUpdatedAt({ ...state, selectedThemeId: themeId });
}

export function getStackViewCards(state: ServerTableState, stackId: string): StackViewCard[] | null {
  const stack = state.stacks.find((s) => s.stackId === stackId);
  if (!stack) return null;
  return [...stack.cardInstanceIds]
    .reverse() // top-first, matching the offline stack viewer's convention
    .map((id) => state.cardInstances[id])
    .filter((c): c is OnlineCardInstance => Boolean(c))
    .map((c) => ({ instanceId: c.instanceId, cardId: c.cardId, faceUp: c.faceUp }));
}

/** Whether `viewerId` is allowed to see a card's true identity. */
function isVisibleTo(card: OnlineCardInstance, viewerId: string): boolean {
  if (card.zone === 'hand') return card.ownerId === viewerId;
  if (card.zone === 'table') return card.faceUp;
  if (card.zone === 'graveyard' || card.zone === 'banished') return true; // open piles, like a real tabletop
  return false; // deck: always hidden from everyone but an explicit stack-view request
}

export function toPublicCardView(card: OnlineCardInstance, viewerId: string): PublicCardView {
  const visible = isVisibleTo(card, viewerId);
  return {
    instanceId: card.instanceId,
    cardId: visible ? card.cardId : null,
    faceUp: card.zone === 'hand' ? card.ownerId === viewerId && card.faceUp : card.faceUp,
    ownerId: card.ownerId,
    zone: card.zone,
    position: card.position,
    rotationY: card.rotationY,
  };
}

export function toPublicTableState(state: ServerTableState, viewerId: string): PublicTableState {
  const cardInstances: Record<string, PublicCardView> = {};
  for (const [id, card] of Object.entries(state.cardInstances)) {
    cardInstances[id] = toPublicCardView(card, viewerId);
  }
  return {
    deckId: state.deckId,
    cardInstances,
    stacks: state.stacks,
    hands: state.hands,
    selectedThemeId: state.selectedThemeId,
    updatedAt: state.updatedAt,
  };
}
