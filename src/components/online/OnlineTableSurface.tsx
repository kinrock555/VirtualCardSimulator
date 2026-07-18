import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { TableTheme } from '../../config/tableThemes';
import { getTableSurfaceTexture } from '../../lib/tableTextureGenerator';
import { TABLE_DEPTH, TABLE_SURFACE_Y, TABLE_WIDTH } from '../../lib/tableConstants';
import { useOnlineStore } from '../../store/useOnlineStore';

const BORDER_MARGIN = 0.6;

type OnlineTableSurfaceProps = {
  theme: TableTheme;
};

export function OnlineTableSurface({ theme }: OnlineTableSurfaceProps) {
  const moveStackPosition = useOnlineStore((state) => state.moveStackPosition);
  const clearSelection = useOnlineStore((state) => state.clearSelection);
  const texture = useMemo(() => getTableSurfaceTexture(theme), [theme]);

  const handleSurfaceClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const state = useOnlineStore.getState();
    if (state.placingStackId) {
      moveStackPosition(state.placingStackId, event.point.x, event.point.z);
      return;
    }
    if (state.selectedInstanceIds.length > 0) clearSelection();
  };

  return (
    <group>
      <mesh position={[0, TABLE_SURFACE_Y - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH + BORDER_MARGIN, TABLE_DEPTH + BORDER_MARGIN]} />
        <meshStandardMaterial color="#141a16" roughness={1} />
      </mesh>
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
