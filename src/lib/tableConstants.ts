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
import {
  CARD_WIDTH as _CARD_WIDTH,
  TABLE_WIDTH as _TABLE_WIDTH,
  TABLE_DEPTH as _TABLE_DEPTH,
  TABLE_SURFACE_Y as _TABLE_SURFACE_Y,
} from '../../shared/tableLogic';

export const DRAG_LIFT_HEIGHT = 0.4;

// 3D hand area - used only by the online mode's 3D hand row (see
// components/online/OnlineCardLayer.tsx). The offline screen now renders its
// hand in the 2D HandPanel instead (components/table/HandPanel.tsx).
export const HAND_AREA_Z = _TABLE_DEPTH / 2 - 1.3;
export const HAND_AREA_Y = 0.01;
export const HAND_DEFAULT_SPACING = _CARD_WIDTH * 1.15;
export const HAND_AVAILABLE_WIDTH = _TABLE_WIDTH * 0.65;

// ---- Physical table structure (offline 3D table: frame/thickness/legs) ----
// The playmat itself stays exactly at TABLE_SURFACE_Y=0 so every existing
// card-position calculation (clampToTable, stack layering, etc.) is untouched;
// the frame/legs are purely additive geometry above and below that plane.
export const TABLE_FRAME_MARGIN = 0.6;
export const TABLE_FRAME_THICKNESS = 0.4;
export const TABLE_FRAME_TOP_Y = _TABLE_SURFACE_Y + 0.02;
export const TABLE_LEG_HEIGHT = 1.6;
export const TABLE_LEG_SIZE = 0.32;
export const TABLE_LEG_INSET = 0.5;
export const ROOM_FLOOR_Y = TABLE_FRAME_TOP_Y - TABLE_FRAME_THICKNESS - TABLE_LEG_HEIGHT;

// ---- Room environment sizing (offline only) ----
// Kept comfortably larger than CAMERA_MAX_DISTANCE below so the camera can
// never orbit past a wall or reveal empty space beyond the room.
export const ROOM_HALF_WIDTH = 26;
export const ROOM_HALF_DEPTH = 22;
export const ROOM_WALL_HEIGHT = 9;

// Shared camera defaults - CameraRig falls back to these when a screen doesn't
// pass its own overrides. The online mode uses these defaults unchanged.
export const CAMERA_INITIAL_POSITION: [number, number, number] = [0, 8.5, 9.5];
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_MIN_DISTANCE = 4;
export const CAMERA_MAX_DISTANCE = 18;
export const CAMERA_MAX_POLAR_ANGLE = Math.PI / 2 - 0.05; // stay above the table plane

// Offline-only camera overrides - the play screen now has a room around the
// table, so it uses a slightly wider default framing and zoom range while
// staying safely inside ROOM_HALF_WIDTH/ROOM_HALF_DEPTH above.
export const PLAY_CAMERA_INITIAL_POSITION: [number, number, number] = [0, 9, 12.5];
export const PLAY_CAMERA_MAX_DISTANCE = 20;
