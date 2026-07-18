// Single source of truth for table & card dimensions, shared between the
// Zustand table store (for clamping) and the 3D components (for rendering).
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

// Where "山札の一番上をめくる" places the revealed card, relative to the deck.
export const REVEAL_TOP_OFFSET = { x: CARD_WIDTH * 1.3, z: 0 };

export const DRAG_LIFT_HEIGHT = 0.4;

// 3D hand area (player-facing row of cards near the camera-side table edge).
export const HAND_AREA_Z = TABLE_DEPTH / 2 - 1.3;
export const HAND_AREA_Y = 0.01;
export const HAND_DEFAULT_SPACING = CARD_WIDTH * 1.15;
export const HAND_AVAILABLE_WIDTH = TABLE_WIDTH * 0.65;

export const CAMERA_INITIAL_POSITION: [number, number, number] = [0, 8.5, 9.5];
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_MIN_DISTANCE = 4;
export const CAMERA_MAX_DISTANCE = 18;
export const CAMERA_MAX_POLAR_ANGLE = Math.PI / 2 - 0.05; // stay above the table plane
