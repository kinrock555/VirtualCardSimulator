// Table layout constants and pure geometry/randomness helpers shared between
// the offline client (src/lib/tableConstants.ts, tableGeometry.ts re-export
// these) and the online server (server/tableOperations.ts uses them directly
// so both modes place/clamp/shuffle cards identically).
import type { CardRotation } from './cardTypes';

export const TABLE_WIDTH = 16; // extent along X
export const TABLE_DEPTH = 10; // extent along Z
export const TABLE_SURFACE_Y = 0;

export const CARD_WIDTH = 1;
export const CARD_HEIGHT = CARD_WIDTH * 1.4; // ~63mm x 88mm trading card ratio
export const CARD_THICKNESS = 0.02;

export const DRAW_PILE_ORIGIN = { x: -TABLE_WIDTH / 4, z: 0.5 };
export const DRAW_PILE_STACK_OFFSET_Y = 0.005;
// Stack height growth is capped so a 100+ card deck doesn't tower over the table.
export const DRAW_PILE_MAX_VISIBLE_LAYERS = 40;

// Fixed initial positions for the always-present graveyard/banished piles.
// Custom stacks have no fixed spot - they spawn near where they were created.
export const GRAVEYARD_ORIGIN = { x: TABLE_WIDTH / 8, z: 0.5 };
export const BANISHED_ORIGIN = { x: TABLE_WIDTH / 8, z: -TABLE_DEPTH / 2 + 1.5 };

// Where "山札の一番上をめくる" / "一番上をフィールドへ出す" places the revealed card,
// relative to the stack it came from.
export const REVEAL_TOP_OFFSET = { x: CARD_WIDTH * 1.3, z: 0 };

// How far apart cards land when a custom stack is dissolved ("束を解除").
export const UNSTACK_SPREAD_OFFSET = { x: CARD_WIDTH * 0.55, z: CARD_HEIGHT * 0.4 };

const halfCardDiagonalMargin = Math.max(CARD_WIDTH, CARD_HEIGHT) / 2;
const minX = -TABLE_WIDTH / 2 + halfCardDiagonalMargin;
const maxX = TABLE_WIDTH / 2 - halfCardDiagonalMargin;
const minZ = -TABLE_DEPTH / 2 + halfCardDiagonalMargin;
const maxZ = TABLE_DEPTH / 2 - halfCardDiagonalMargin;

/** Keeps a card's center within the table surface regardless of its rotation. */
export function clampToTable(x: number, z: number): { x: number; z: number } {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeZ = Number.isFinite(z) ? z : 0;
  return {
    x: Math.min(maxX, Math.max(minX, safeX)),
    z: Math.min(maxZ, Math.max(minZ, safeZ)),
  };
}

export function normalizeRotation(degrees: number): CardRotation {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 90) return 90;
  if (normalized === 180) return 180;
  if (normalized === 270) return 270;
  return 0;
}

/** Height of the Nth card (0-based, from the bottom) in any stack/pile - growth is capped for huge piles. */
export function computeStackLayerY(indexFromBottom: number): number {
  const cappedIndex = Math.min(indexFromBottom, DRAW_PILE_MAX_VISIBLE_LAYERS);
  return cappedIndex * (CARD_THICKNESS + DRAW_PILE_STACK_OFFSET_Y);
}

/** Center point of a set of table positions - used as a new custom stack's default position. */
export function computeCentroid(points: readonly { x: number; z: number }[]): { x: number; z: number } {
  if (points.length === 0) return { x: 0, z: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
  return { x: sum.x / points.length, z: sum.z / points.length };
}

/** Spread-out position for the Nth card (0-based) when a stack is dissolved ("束を解除"). */
export function computeUnstackSpreadPosition(
  origin: { x: number; z: number },
  index: number,
  offset: { x: number; z: number },
): { x: number; z: number } {
  return clampToTable(origin.x + index * offset.x, origin.z + index * offset.z);
}

/** Fisher-Yates shuffle - returns a new array, never mutates the input. The server is the sole shuffle authority online. */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
