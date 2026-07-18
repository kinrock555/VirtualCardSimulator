// Layout constants shared with the online server live in shared/tableLogic.ts
// (re-exported here so existing imports across the offline client keep working
// unchanged). Camera/hand/drag values below are client-rendering-only concerns.
export {
  TABLE_WIDTH,
  TABLE_DEPTH,
  TABLE_SURFACE_Y,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_THICKNESS,
  DRAW_PILE_ORIGIN,
  DRAW_PILE_STACK_OFFSET_Y,
  DRAW_PILE_MAX_VISIBLE_LAYERS,
  GRAVEYARD_ORIGIN,
  BANISHED_ORIGIN,
  REVEAL_TOP_OFFSET,
  UNSTACK_SPREAD_OFFSET,
} from '../../shared/tableLogic';
import { CARD_WIDTH as _CARD_WIDTH, TABLE_WIDTH as _TABLE_WIDTH, TABLE_DEPTH as _TABLE_DEPTH } from '../../shared/tableLogic';

export const DRAG_LIFT_HEIGHT = 0.4;

// 3D hand area (player-facing row of cards near the camera-side table edge).
export const HAND_AREA_Z = _TABLE_DEPTH / 2 - 1.3;
export const HAND_AREA_Y = 0.01;
export const HAND_DEFAULT_SPACING = _CARD_WIDTH * 1.15;
export const HAND_AVAILABLE_WIDTH = _TABLE_WIDTH * 0.65;

export const CAMERA_INITIAL_POSITION: [number, number, number] = [0, 8.5, 9.5];
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_MIN_DISTANCE = 4;
export const CAMERA_MAX_DISTANCE = 18;
export const CAMERA_MAX_POLAR_ANGLE = Math.PI / 2 - 0.05; // stay above the table plane
