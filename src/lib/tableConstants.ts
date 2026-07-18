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

export const DRAG_LIFT_HEIGHT = 0.4;

export const CAMERA_INITIAL_POSITION: [number, number, number] = [0, 8.5, 9.5];
export const CAMERA_TARGET: [number, number, number] = [0, 0, 0];
export const CAMERA_MIN_DISTANCE = 4;
export const CAMERA_MAX_DISTANCE = 18;
export const CAMERA_MAX_POLAR_ANGLE = Math.PI / 2 - 0.05; // stay above the table plane
