import { DoubleSide } from 'three';
import { ROOM_FLOOR_Y, ROOM_HALF_DEPTH, ROOM_HALF_WIDTH, ROOM_WALL_HEIGHT } from '../../../lib/tableConstants';

type RoomShellProps = {
  floorColor: string;
  wallColor: string;
  children?: React.ReactNode;
};

/**
 * Floor + 4 walls shared by every room background, so the table is never
 * surrounded by empty void no matter how the camera orbits. The "upward"
 * background above the walls is handled by the scene's background/fog color
 * (see TableScene) rather than a literal ceiling mesh - the camera's
 * maxPolarAngle already keeps it from looking up past the walls in normal
 * use, and a large horizontal ceiling plane up there was found to break
 * rendering entirely under this environment's software WebGL fallback.
 * Kept to flat colors (no textures, no extra lights) so switching
 * backgrounds never taxes the frame rate - each environment adds only a
 * handful of simple primitives on top of this shell.
 */
export function RoomShell({ floorColor, wallColor, children }: RoomShellProps) {
  const wallCenterY = ROOM_FLOOR_Y + ROOM_WALL_HEIGHT / 2;
  const width = ROOM_HALF_WIDTH * 2;
  const depth = ROOM_HALF_DEPTH * 2;

  return (
    <group>
      {/* No receiveShadow here: the room floor is far outside the table's shadow
          camera frustum, so it doesn't need to receive dynamic shadows. */}
      <mesh position={[0, ROOM_FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.95} />
      </mesh>

      <mesh position={[0, wallCenterY, -ROOM_HALF_DEPTH]}>
        <planeGeometry args={[width, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[0, wallCenterY, ROOM_HALF_DEPTH]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[-ROOM_HALF_WIDTH, wallCenterY, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[ROOM_HALF_WIDTH, wallCenterY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, ROOM_WALL_HEIGHT]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} side={DoubleSide} />
      </mesh>

      {children}
    </group>
  );
}
