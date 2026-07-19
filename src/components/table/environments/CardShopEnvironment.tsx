import { Instance, Instances } from '@react-three/drei';
import type { RoomEnvironment } from '../../../config/roomEnvironments';
import type { GraphicsQuality } from '../../../store/useTableStore';
import { ROOM_FLOOR_Y } from '../../../lib/tableConstants';
import { RoomShell } from './RoomShell';

const PRODUCT_COLORS = ['#e08b3a', '#3a8fe0', '#4fbf6e', '#d94f6e', '#c9a24a'];
const noRaycast = () => null;

/** A bright card-shop play-space background: shelves with abstract boxed "products", a register counter, chairs, a shop sign, posters, other tables. */
export function CardShopEnvironment({
  environment,
  quality = 'standard',
}: {
  environment: RoomEnvironment;
  quality?: GraphicsQuality;
}) {
  const floorY = ROOM_FLOOR_Y;
  const isLight = quality === 'light';
  const otherTables = isLight ? [[16, -14]] : [[16, -14], [16, 10], [-16, 12]];

  return (
    <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor}>
      {/* Ceiling light strip. */}
      <mesh position={[0, floorY + 8.85, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#eef3ff" emissiveIntensity={0.7} />
      </mesh>

      {/* Shop sign above the shelf - an abstract color block, not real branding. */}
      <mesh position={[-14, floorY + 6.1, -21.3]} raycast={noRaycast}>
        <boxGeometry args={[6, 1, 0.15]} />
        <meshStandardMaterial color="#2f3a4a" roughness={0.6} />
      </mesh>
      <mesh position={[-14, floorY + 6.1, -21.2]} raycast={noRaycast}>
        <planeGeometry args={[5.4, 0.6]} />
        <meshStandardMaterial color="#f2c879" emissive="#e8b45c" emissiveIntensity={0.5} />
      </mesh>

      {/* Card shelf along the back wall - a frame with rows of abstract product
          boxes (one InstancedMesh draw call for all 24, not 24 separate meshes).
          Well outside TableScene's shadow-camera frustum, so no castShadow here. */}
      <group position={[-14, floorY, -21.4]}>
        <mesh position={[0, 2.5, 0]} raycast={noRaycast}>
          <boxGeometry args={[8, 5, 0.4]} />
          <meshStandardMaterial color="#d8d3c6" roughness={0.85} />
        </mesh>
        <Instances limit={24}>
          <boxGeometry args={[0.9, 0.7, 0.3]} />
          <meshStandardMaterial roughness={0.6} />
          {[0.9, 2.0, 3.1, 4.2].map((y, row) =>
            Array.from({ length: 6 }).map((_, col) => (
              <Instance
                key={`${row}-${col}`}
                position={[-3.2 + col * 1.15, y, 0.35]}
                color={PRODUCT_COLORS[(row + col) % PRODUCT_COLORS.length]}
              />
            )),
          )}
        </Instances>
      </group>

      {/* Register counter near the entrance side - outside the shadow frustum. */}
      <group position={[-19, floorY, -15]}>
        <mesh position={[0, 0.55, 0]} raycast={noRaycast}>
          <boxGeometry args={[2.4, 1.1, 0.9]} />
          <meshStandardMaterial color="#c7c2b4" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.15, 0]} raycast={noRaycast}>
          <boxGeometry args={[0.6, 0.2, 0.5]} />
          <meshStandardMaterial color="#3a3f4a" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Plain poster panels on the side wall - abstract color blocks, not real
          artwork - skipped in light-quality mode. */}
      {!isLight &&
        [-6, 0, 6].map((z, index) => (
          <mesh key={z} position={[-25.75, floorY + 4, z]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
            <planeGeometry args={[2.2, 3]} />
            <meshStandardMaterial color={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} roughness={0.9} />
          </mesh>
        ))}

      {/* Other play tables (with simple chairs) scattered around, suggesting a
          wider shop floor - trimmed to just one in light-quality mode, and
          never shadow-casting (outside the shadow frustum). */}
      {otherTables.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, floorY, z]}>
          <mesh position={[0, 0.95, 0]} raycast={noRaycast}>
            <boxGeometry args={[3, 0.15, 1.8]} />
            <meshStandardMaterial color="#c7c2b4" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.45, 0]} raycast={noRaycast}>
            <cylinderGeometry args={[0.12, 0.12, 0.9, 8]} />
            <meshStandardMaterial color="#9a9486" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.4, 1.3]} raycast={noRaycast}>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#8a5a3c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.4, -1.3]} raycast={noRaycast}>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#8a5a3c" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </RoomShell>
  );
}
