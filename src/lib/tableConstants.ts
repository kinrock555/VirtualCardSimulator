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
// Resting (non-selected, non-dragging) cards previously sat at exactly
// y=0, just ~0.004 above the playmat - close enough that on some GPUs the
// card's thin bottom face and the playmat would z-fight, and placing a
// second card onto the field could make an earlier one flicker invisible
// (see README known-issues history / bug fix in the card-placement rework).
// This small constant lift gives cards enough depth separation from the
// playmat to render reliably regardless of how many are placed.
export const CARD_REST_LIFT = 0.05;

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

// ---- Offline play-screen viewpoints: oblique (default) and top-down ----
// Both share CAMERA_TARGET/PLAY_CAMERA_MAX_DISTANCE; switching just moves the
// camera to the other preset and (for top view) narrows the orbit's polar
// angle range so it stays looking straight down instead of tilting back into
// an oblique-like angle.
export const CAMERA_VIEW_OBLIQUE_POSITION = PLAY_CAMERA_INITIAL_POSITION;
// Distance picked so the whole TABLE_WIDTH/TABLE_DEPTH field fits within the
// default 45 degree FOV when looking almost straight down.
const CAMERA_TOP_DISTANCE = 15.5;
// Kept very small (not exactly 0) - a true 0 polar angle sits on
// OrbitControls' up-vector singularity. CAMERA_VIEW_TOP_POSITION is derived
// from this same angle/distance so the preset position and the polar-angle
// clamp CameraRig applies for the top view never disagree with each other.
export const CAMERA_TOP_POLAR_ANGLE = 0.06;
export const CAMERA_VIEW_TOP_POSITION: [number, number, number] = [
  0,
  CAMERA_TOP_DISTANCE * Math.cos(CAMERA_TOP_POLAR_ANGLE),
  CAMERA_TOP_DISTANCE * Math.sin(CAMERA_TOP_POLAR_ANGLE),
];
export const CAMERA_VIEW_TRANSITION_SECONDS = 0.35;

// ---- Per-player deck positions for 2-player test play ----
// Only used in mirroredDecks/separateDecks modes, where each player has their
// own deck stack; single/sharedDeck modes keep using the one DRAW_PILE_ORIGIN
// pile above. Same X as DRAW_PILE_ORIGIN, split front/back so the two piles
// never overlap.
export const PLAYER_DECK_ORIGINS: [{ x: number; z: number }, { x: number; z: number }] = [
  { x: -_TABLE_WIDTH / 4, z: _TABLE_DEPTH / 2 - 1.6 },
  { x: -_TABLE_WIDTH / 4, z: -(_TABLE_DEPTH / 2 - 1.6) },
];
