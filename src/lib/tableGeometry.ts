import {
  CARD_HEIGHT,
  CARD_THICKNESS,
  CARD_WIDTH,
  DRAW_PILE_STACK_OFFSET_Y,
  DRAW_PILE_MAX_VISIBLE_LAYERS,
  HAND_AVAILABLE_WIDTH,
  HAND_DEFAULT_SPACING,
  TABLE_DEPTH,
  TABLE_WIDTH,
} from './tableConstants';

const halfCardDiagonalMargin = Math.max(CARD_WIDTH, CARD_HEIGHT) / 2;

const minX = -TABLE_WIDTH / 2 + halfCardDiagonalMargin;
const maxX = TABLE_WIDTH / 2 - halfCardDiagonalMargin;
const minZ = -TABLE_DEPTH / 2 + halfCardDiagonalMargin;
const maxZ = TABLE_DEPTH / 2 - halfCardDiagonalMargin;

/** Keeps a card's center within the table surface regardless of its rotation. */
export function clampToTable(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    z: Math.min(maxZ, Math.max(minZ, z)),
  };
}

export function normalizeRotation(degrees: number): 0 | 90 | 180 | 270 {
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

/** X offset (from the hand row's center) of the card at `index` among `count` hand cards. */
export function computeHandSlotX(index: number, count: number): number {
  if (count <= 1) return 0;
  const spacing = Math.min(HAND_DEFAULT_SPACING, HAND_AVAILABLE_WIDTH / (count - 1));
  const totalWidth = spacing * (count - 1);
  return -totalWidth / 2 + index * spacing;
}

/** Fisher-Yates shuffle - returns a new array, never mutates the input. */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
