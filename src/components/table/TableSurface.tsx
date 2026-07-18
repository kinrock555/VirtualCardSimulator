import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { TableTheme } from '../../config/tableThemes';
import { getTableSurfaceTexture } from '../../lib/tableTextureGenerator';
import { TABLE_DEPTH, TABLE_SURFACE_Y, TABLE_WIDTH } from '../../lib/tableConstants';
import { useTableStore } from '../../store/useTableStore';

const BORDER_MARGIN = 0.6;

type TableSurfaceProps = {
  theme: TableTheme;
};

export function TableSurface({ theme }: TableSurfaceProps) {
  const placeDeckAt = useTableStore((state) => state.placeDeckAt);
  const texture = useMemo(() => getTableSurfaceTexture(theme), [theme]);

  const handleSurfaceClick = (event: ThreeEvent<MouseEvent>) => {
    if (!useTableStore.getState().isPlacingDeck) return;
    event.stopPropagation();
    placeDeckAt(event.point.x, event.point.z);
  };

  return (
    <group>
      {/* Frame behind the felt, sits lowest so it only shows around the edge. */}
      <mesh position={[0, TABLE_SURFACE_Y - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH + BORDER_MARGIN, TABLE_DEPTH + BORDER_MARGIN]} />
        <meshStandardMaterial color="#141a16" roughness={1} />
      </mesh>
      {/* Playmat surface cards rest on - offset slightly below y=0 so cards never z-fight it. */}
      <mesh
        position={[0, TABLE_SURFACE_Y - 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={handleSurfaceClick}
      >
        <planeGeometry args={[TABLE_WIDTH, TABLE_DEPTH]} />
        <meshStandardMaterial map={texture} color={theme.tableColor} roughness={0.92} metalness={0} />
      </mesh>
    </group>
  );
}
