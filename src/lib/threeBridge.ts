import { Raycaster, Vector2, Vector3 } from 'three';
import type { Camera, WebGLRenderer } from 'three';
import { tableDragPlane } from './dragPlane';

type ThreeContext = { camera: Camera; gl: WebGLRenderer };

// Module-level singleton: only one offline play screen Canvas is ever mounted
// at a time, so a ref/store round-trip isn't needed just to reach the active
// camera/renderer from the 2D hand panel (which lives outside the Canvas).
let current: ThreeContext | null = null;

export function setThreeContext(ctx: ThreeContext | null): void {
  current = ctx;
}

const raycaster = new Raycaster();
const ndc = new Vector2();
const hitPoint = new Vector3();

/**
 * Projects a screen point (clientX/clientY) onto the table plane using the
 * active R3F camera. Returns null if no Canvas is mounted, the point falls
 * outside the canvas bounds, or the ray never crosses the table plane.
 */
export function screenToTablePoint(clientX: number, clientY: number): { x: number; z: number } | null {
  if (!current) return null;
  const rect = current.gl.domElement.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, current.camera);
  const hit = raycaster.ray.intersectPlane(tableDragPlane, hitPoint);
  if (!hit) return null;
  return { x: hitPoint.x, z: hitPoint.z };
}
