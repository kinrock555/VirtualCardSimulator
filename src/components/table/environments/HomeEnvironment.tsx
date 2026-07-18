import type { RoomEnvironment } from '../../../config/roomEnvironments';
import { ROOM_FLOOR_Y } from '../../../lib/tableConstants';
import { RoomShell } from './RoomShell';

/** A warm living-room-style background: window, a shelf, and a simple sofa silhouette. */
export function HomeEnvironment({ environment }: { environment: RoomEnvironment }) {
  const floorY = ROOM_FLOOR_Y;

  return (
    <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor}>
      {/* Window on the back wall - an emissive plane simulating daylight, no real light source. */}
      <mesh position={[10, floorY + 4.6, -21.85]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial color="#dff0ff" emissive="#bfe3ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[10, floorY + 4.6, -21.8]}>
        <planeGeometry args={[3.4, 0.12]} />
        <meshStandardMaterial color="#6b4a2c" />
      </mesh>
      <mesh position={[10, floorY + 4.6, -21.8]}>
        <planeGeometry args={[0.12, 3.4]} />
        <meshStandardMaterial color="#6b4a2c" />
      </mesh>

      {/* Shelf against the left wall, with a couple of simple boxes standing in for books/knickknacks. */}
      <mesh position={[-25.4, floorY + 2.2, -8]} castShadow>
        <boxGeometry args={[0.5, 0.1, 3.2]} />
        <meshStandardMaterial color="#7a5230" roughness={0.8} />
      </mesh>
      <mesh position={[-25.3, floorY + 2.45, -8.9]} castShadow>
        <boxGeometry args={[0.28, 0.4, 0.5]} />
        <meshStandardMaterial color="#b0432f" roughness={0.7} />
      </mesh>
      <mesh position={[-25.3, floorY + 2.42, -8.2]} castShadow>
        <boxGeometry args={[0.28, 0.34, 0.4]} />
        <meshStandardMaterial color="#3f6f8f" roughness={0.7} />
      </mesh>

      {/* Simple sofa silhouette in the back-right corner, well clear of the table/card area. */}
      <group position={[19, floorY, -16]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 1.1, 1.6]} />
          <meshStandardMaterial color="#8a5a3c" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.35, -0.6]} castShadow>
          <boxGeometry args={[4.2, 1.2, 0.4]} />
          <meshStandardMaterial color="#7a4c30" roughness={0.85} />
        </mesh>
        <mesh position={[-1.9, 1.0, 0]} castShadow>
          <boxGeometry args={[0.4, 1.4, 1.6]} />
          <meshStandardMaterial color="#7a4c30" roughness={0.85} />
        </mesh>
        <mesh position={[1.9, 1.0, 0]} castShadow>
          <boxGeometry args={[0.4, 1.4, 1.6]} />
          <meshStandardMaterial color="#7a4c30" roughness={0.85} />
        </mesh>
      </group>
    </RoomShell>
  );
}
