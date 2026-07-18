import { CARD_HEIGHT, CARD_WIDTH, TABLE_DEPTH, TABLE_WIDTH } from './tableConstants';

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
