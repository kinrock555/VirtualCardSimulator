import { DoubleSide } from 'three';
import { darkenHex } from '../../../lib/color';
import { ROOM_FLOOR_Y, ROOM_HALF_DEPTH, ROOM_HALF_WIDTH, ROOM_WALL_HEIGHT } from '../../../lib/tableConstants';

type RoomShellProps = {
  floorColor: string;
  wallColor: string;
  children?: React.ReactNode;
};

const BASEBOARD_HEIGHT = 0.28;
const DOOR_WIDTH = 2.6;
const DOOR_HEIGHT = 5.2;
const WINDOW_SIZE = 2.8;
/** No handlers on any of these decorative meshes, but excluded from raycasting explicitly anyway, per the "background never intercepts card operations" rule. */
const noRaycast = () => null;

/**
 * Floor + 4 walls shared by every room background, so the table is never
 * surrounded by empty void no matter how the camera orbits, plus a baseboard
 * trim, one door, and one window so every theme (even "Plain") reads as an
 * actual room rather than an empty box. The "upward" background above the
 * walls is handled by the scene's background/fog color (see TableScene)
 * rather than a literal ceiling mesh - the camera's maxPolarAngle already
 * keeps it from looking up past the walls in normal use, and a large
 * horizontal ceiling plane up there was found to break rendering entirely
 * under this environment's software WebGL fallback. A small ceiling-mounted
 * light fixture (see below) delivers "ceiling lighting" without needing a
 * full ceiling surface. Kept to flat colors (no textures) so switching
 * backgrounds never taxes the frame rate - each environment adds only a
 * handful of simple primitives on top of this shell.
 */
export function RoomShell({ floorColor, wallColor, children }: RoomShellProps) {
  const wallCenterY = ROOM_FLOOR_Y + ROOM_WALL_HEIGHT / 2;
  const width = ROOM_HALF_WIDTH * 2;
  const depth = ROOM_HALF_DEPTH * 2;
  const baseboardColor = darkenHex(wallColor, 0.55);
  const baseboardCenterY = ROOM_FLOOR_Y + BASEBOARD_HEIGHT / 2;

  return (
    <group>
      {/* No receiveShadow here: the room floor is far outside the table's shadow
          camera frustum, so it doesn't need to receive dynamic shadows. */}
      <mesh position={[0, ROOM_FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.95} />
      </mesh>

      <mesh position={[0, wallCenterY, -ROOM_HALF_DEPTH]} raycast={noRaycast}>
        <planeGeometry args={[width, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[0, wallCenterY, ROOM_HALF_DEPTH]} rotation={[0, Math.PI, 0]} raycast={noRaycast}>
        <planeGeometry args={[width, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[-ROOM_HALF_WIDTH, wallCenterY, 0]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
        <planeGeometry args={[depth, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[ROOM_HALF_WIDTH, wallCenterY, 0]} rotation={[0, -Math.PI / 2, 0]} raycast={noRaycast}>
        <planeGeometry args={[depth, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>

      {/* Baseboard trim along the base of all 4 walls - a thin dark strip so the
          floor/wall junction reads as a real room instead of two flat planes
          meeting at a hard edge. */}
      <mesh position={[0, baseboardCenterY, -ROOM_HALF_DEPTH + 0.02]} raycast={noRaycast}>
        <boxGeometry args={[width, BASEBOARD_HEIGHT, 0.05]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, baseboardCenterY, ROOM_HALF_DEPTH - 0.02]} raycast={noRaycast}>
        <boxGeometry args={[width, BASEBOARD_HEIGHT, 0.05]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      <mesh position={[-ROOM_HALF_WIDTH + 0.02, baseboardCenterY, 0]} raycast={noRaycast}>
        <boxGeometry args={[0.05, BASEBOARD_HEIGHT, depth]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>
      <mesh position={[ROOM_HALF_WIDTH - 0.02, baseboardCenterY, 0]} raycast={noRaycast}>
        <boxGeometry args={[0.05, BASEBOARD_HEIGHT, depth]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.8} />
      </mesh>

      {/* One door (back-left wall) and one window (back-right wall) - purely
          decorative flat inserts, same "vertical plane" shape as the walls
          themselves (never the large-horizontal-plane shape that broke
          rendering for a ceiling), so every theme gets at least these two
          baseline room features regardless of its own extra decoration. */}
      <mesh position={[-9, ROOM_FLOOR_Y + DOOR_HEIGHT / 2, -ROOM_HALF_DEPTH + 0.03]} raycast={noRaycast}>
        <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        <meshStandardMaterial color={darkenHex(wallColor, 0.4)} roughness={0.7} />
      </mesh>
      <mesh position={[-9, ROOM_FLOOR_Y + DOOR_HEIGHT - 0.35, -ROOM_HALF_DEPTH + 0.035]} raycast={noRaycast}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 8]} />
        <meshStandardMaterial color="#c9a24a" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[9, ROOM_FLOOR_Y + 4.4, -ROOM_HALF_DEPTH + 0.03]} raycast={noRaycast}>
        <planeGeometry args={[WINDOW_SIZE, WINDOW_SIZE]} />
        <meshStandardMaterial color="#dff0ff" emissive="#bfe3ff" emissiveIntensity={0.45} />
      </mesh>

      {/* No literal ceiling-mounted light fixture mesh: with no ceiling plane
          for it to actually mount to (see the no-ceiling comment above), a
          floating disc directly over the table center was exactly what
          became visible - and distracting - once the camera looked straight
          down in the top view. "Ceiling lighting" is delivered purely via
          the real hemisphereLight/directionalLight in TableScene.tsx, which
          (having no mesh representation) can never look wrong from any
          camera angle. */}

      {children}
    </group>
  );
}
