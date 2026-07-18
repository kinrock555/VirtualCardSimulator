import { TABLE_DEPTH, TABLE_SURFACE_Y, TABLE_WIDTH } from '../../lib/tableConstants';

const BORDER_MARGIN = 0.6;

export function TableSurface() {
  return (
    <group>
      {/* Frame behind the felt, sits lowest so it only shows around the edge. */}
      <mesh position={[0, TABLE_SURFACE_Y - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH + BORDER_MARGIN, TABLE_DEPTH + BORDER_MARGIN]} />
        <meshStandardMaterial color="#141a16" roughness={1} />
      </mesh>
      {/* Playmat surface cards rest on - offset slightly below y=0 so cards never z-fight it. */}
      <mesh position={[0, TABLE_SURFACE_Y - 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH, TABLE_DEPTH]} />
        <meshStandardMaterial color="#2f5a44" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}
