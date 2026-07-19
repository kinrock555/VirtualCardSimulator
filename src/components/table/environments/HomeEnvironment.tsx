import type { RoomEnvironment } from '../../../config/roomEnvironments';
import type { GraphicsQuality } from '../../../store/useTableStore';
import { ROOM_FLOOR_Y } from '../../../lib/tableConstants';
import { RoomShell } from './RoomShell';

const noRaycast = () => null;

/** A warm living-room-style background: window, a shelf, a potted plant, and a simple sofa silhouette. */
export function HomeEnvironment({ environment, quality = 'standard' }: { environment: RoomEnvironment; quality?: GraphicsQuality }) {
  const floorY = ROOM_FLOOR_Y;
  const isLight = quality === 'light';

  return (
    <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor}>
      {/* Window on the back wall - an emissive plane simulating daylight, no real light source. */}
      <mesh position={[10, floorY + 4.6, -21.85]} raycast={noRaycast}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial color="#dff0ff" emissive="#bfe3ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[10, floorY + 4.6, -21.8]} raycast={noRaycast}>
        <planeGeometry args={[3.4, 0.12]} />
        <meshStandardMaterial color="#6b4a2c" />
      </mesh>
      <mesh position={[10, floorY + 4.6, -21.8]} raycast={noRaycast}>
        <planeGeometry args={[0.12, 3.4]} />
        <meshStandardMaterial color="#6b4a2c" />
      </mesh>

      {/* Shelf against the left wall, with a couple of simple boxes standing in
          for books/knickknacks - well outside TableScene's shadow-camera
          frustum (±12/±8 around the table), so these never cast a visible
          shadow; castShadow is skipped entirely rather than paying for a
          shadow-pass draw call with no visual result. */}
      <mesh position={[-25.4, floorY + 2.2, -8]} raycast={noRaycast}>
        <boxGeometry args={[0.5, 0.1, 3.2]} />
        <meshStandardMaterial color="#7a5230" roughness={0.8} />
      </mesh>
      <mesh position={[-25.3, floorY + 2.45, -8.9]} raycast={noRaycast}>
        <boxGeometry args={[0.28, 0.4, 0.5]} />
        <meshStandardMaterial color="#b0432f" roughness={0.7} />
      </mesh>
      <mesh position={[-25.3, floorY + 2.42, -8.2]} raycast={noRaycast}>
        <boxGeometry args={[0.28, 0.34, 0.4]} />
        <meshStandardMaterial color="#3f6f8f" roughness={0.7} />
      </mesh>

      {/* Potted plant near the window - a cylinder pot + two stacked spheres of
          foliage, cheap geometry (no leaves modeled individually). Also outside
          the shadow-camera frustum, so no castShadow here either. */}
      <group position={[6, floorY, -20.5]}>
        <mesh position={[0, 0.35, 0]} raycast={noRaycast}>
          <cylinderGeometry args={[0.32, 0.24, 0.7, 10]} />
          <meshStandardMaterial color="#8a5a3c" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.05, 0]} raycast={noRaycast}>
          <sphereGeometry args={[0.55, 10, 8]} />
          <meshStandardMaterial color="#3f7d4a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.55, 0]} raycast={noRaycast}>
          <sphereGeometry args={[0.36, 10, 8]} />
          <meshStandardMaterial color="#4f8f58" roughness={0.9} />
        </mesh>
      </group>

      {/* Simple sofa silhouette in the back-right corner, well clear of the
          table/card area - skipped in light-quality mode, and never
          shadow-casting even in standard quality (outside the shadow frustum). */}
      {!isLight && (
        <group position={[19, floorY, -16]}>
          <mesh position={[0, 0.55, 0]} raycast={noRaycast}>
            <boxGeometry args={[4.2, 1.1, 1.6]} />
            <meshStandardMaterial color="#8a5a3c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.35, -0.6]} raycast={noRaycast}>
            <boxGeometry args={[4.2, 1.2, 0.4]} />
            <meshStandardMaterial color="#7a4c30" roughness={0.85} />
          </mesh>
          <mesh position={[-1.9, 1.0, 0]} raycast={noRaycast}>
            <boxGeometry args={[0.4, 1.4, 1.6]} />
            <meshStandardMaterial color="#7a4c30" roughness={0.85} />
          </mesh>
          <mesh position={[1.9, 1.0, 0]} raycast={noRaycast}>
            <boxGeometry args={[0.4, 1.4, 1.6]} />
            <meshStandardMaterial color="#7a4c30" roughness={0.85} />
          </mesh>
        </group>
      )}
    </RoomShell>
  );
}
