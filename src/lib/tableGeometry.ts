// Geometry/randomness helpers shared with the online server live in
// shared/tableLogic.ts (re-exported here so existing imports keep working).
// computeHandSlotX stays client-only - hand rendering doesn't exist server-side.
export {
  clampToTable,
  normalizeRotation,
  computeStackLayerY,
  computeCentroid,
  computeUnstackSpreadPosition,
  shuffleArray,
} from '../../shared/tableLogic';

import { HAND_AVAILABLE_WIDTH, HAND_DEFAULT_SPACING } from './tableConstants';

/** X offset (from the hand row's center) of the card at `index` among `count` hand cards. */
export function computeHandSlotX(index: number, count: number): number {
  if (count <= 1) return 0;
  const spacing = Math.min(HAND_DEFAULT_SPACING, HAND_AVAILABLE_WIDTH / (count - 1));
  const totalWidth = spacing * (count - 1);
  return -totalWidth / 2 + index * spacing;
}
