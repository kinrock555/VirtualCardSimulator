import type { RoomEnvironment } from '../../../config/roomEnvironments';
import type { GraphicsQuality } from '../../../store/useTableStore';
import { ROOM_FLOOR_Y } from '../../../lib/tableConstants';
import { RoomShell } from './RoomShell';

const noRaycast = () => null;

/** A fictional, upscale card-room background - deep carpet, indirect glow strips, gold trim, distant tables. */
export function CasinoEnvironment({
  environment,
  quality = 'standard',
}: {
  environment: RoomEnvironment;
  quality?: GraphicsQuality;
}) {
  const floorY = ROOM_FLOOR_Y;
  const isLight = quality === 'light';

  return (
    <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor}>
      {/* Indirect wall lighting - an emissive strip rather than a real light, to keep the light count low. */}
      <mesh position={[0, floorY + 7.6, -21.85]} raycast={noRaycast}>
        <planeGeometry args={[20, 0.35]} />
        <meshStandardMaterial color="#f2c879" emissive="#e8b45c" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-25.85, floorY + 7.6, 0]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
        <planeGeometry args={[18, 0.35]} />
        <meshStandardMaterial color="#f2c879" emissive="#e8b45c" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[25.85, floorY + 7.6, 0]} rotation={[0, -Math.PI / 2, 0]} raycast={noRaycast}>
        <planeGeometry args={[18, 0.35]} />
        <meshStandardMaterial color="#f2c879" emissive="#e8b45c" emissiveIntensity={0.8} />
      </mesh>

      {/* Gold trim skirting around the base of the walls. */}
      <mesh position={[0, floorY + 0.15, -21.7]} raycast={noRaycast}>
        <boxGeometry args={[20, 0.3, 0.1]} />
        <meshStandardMaterial color="#c9a24a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Two distant tables (simple box top + cylinder legs), suggesting a
          wider card room - skipped in light-quality mode, and never
          shadow-casting (well outside TableScene's shadow-camera frustum). */}
      {!isLight &&
        [
          [-18, -15],
          [18, -13],
        ].map(([x, z]) => (
          <group key={`${x}-${z}`} position={[x, floorY, z]}>
            <mesh position={[0, 1.0, 0]} raycast={noRaycast}>
              <boxGeometry args={[3.2, 0.15, 2]} />
              <meshStandardMaterial color="#3a1218" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.5, 0]} raycast={noRaycast}>
              <cylinderGeometry args={[0.12, 0.12, 1, 8]} />
              <meshStandardMaterial color="#2a1f18" roughness={0.8} />
            </mesh>
          </group>
        ))}
    </RoomShell>
  );
}
