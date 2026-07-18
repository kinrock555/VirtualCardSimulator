import type { RoomEnvironment } from '../../../config/roomEnvironments';
import { ROOM_FLOOR_Y } from '../../../lib/tableConstants';
import { RoomShell } from './RoomShell';

const PRODUCT_COLORS = ['#e08b3a', '#3a8fe0', '#4fbf6e', '#d94f6e', '#c9a24a'];

/** A bright card-shop play-space background: shelves with abstract boxed "products", posters, other tables. */
export function CardShopEnvironment({ environment }: { environment: RoomEnvironment }) {
  const floorY = ROOM_FLOOR_Y;

  return (
    <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor}>
      {/* Ceiling light strip. */}
      <mesh position={[0, floorY + 8.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#eef3ff" emissiveIntensity={0.7} />
      </mesh>

      {/* Card shelf along the back wall - a frame with rows of abstract product boxes, no real branding. */}
      <group position={[-14, floorY, -21.4]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[8, 5, 0.4]} />
          <meshStandardMaterial color="#d8d3c6" roughness={0.85} />
        </mesh>
        {[0.9, 2.0, 3.1, 4.2].map((y, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <mesh key={`${row}-${col}`} position={[-3.2 + col * 1.15, y, 0.35]} castShadow>
              <boxGeometry args={[0.9, 0.7, 0.3]} />
              <meshStandardMaterial color={PRODUCT_COLORS[(row + col) % PRODUCT_COLORS.length]} roughness={0.6} />
            </mesh>
          )),
        )}
      </group>

      {/* Plain poster panels on the side wall - abstract color blocks, not real artwork. */}
      {[-6, 0, 6].map((z, index) => (
        <mesh key={z} position={[-25.75, floorY + 4, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.2, 3]} />
          <meshStandardMaterial color={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} roughness={0.9} />
        </mesh>
      ))}

      {/* Other play tables scattered around, suggesting a wider shop floor. */}
      {[
        [16, -14],
        [16, 10],
        [-16, 12],
      ].map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, floorY, z]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[3, 0.15, 1.8]} />
            <meshStandardMaterial color="#c7c2b4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.9, 8]} />
            <meshStandardMaterial color="#9a9486" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </RoomShell>
  );
}
