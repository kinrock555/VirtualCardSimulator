import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { TableTheme } from '../../config/tableThemes';
import { getTableSurfaceTexture } from '../../lib/tableTextureGenerator';
import { darkenHex } from '../../lib/color';
import { useCustomPlaymatTexture } from '../../lib/useCustomPlaymatTexture';
import {
  TABLE_DEPTH,
  TABLE_SURFACE_Y,
  TABLE_WIDTH,
  TABLE_FRAME_MARGIN,
  TABLE_FRAME_THICKNESS,
  TABLE_FRAME_TOP_Y,
  TABLE_LEG_HEIGHT,
  TABLE_LEG_SIZE,
  TABLE_LEG_INSET,
} from '../../lib/tableConstants';
import { useTableStore } from '../../store/useTableStore';

// Thin inset margin between the playmat's true edge and the boundary line
// drawn beneath it - purely a visual "this is the playable area" cue, not a
// game-rule zone (no monster/spell/mana lines - the field stays freeform).
const INNER_BORDER_MARGIN = 0.16;

type TableSurfaceProps = {
  theme: TableTheme;
  /** False for the (non-interactive) main-menu background reuse of this component - disables the playmat's click handler and excludes it from raycasting entirely. Defaults to true for the real play screen. */
  interactive?: boolean;
};

export function TableSurface({ theme, interactive = true }: TableSurfaceProps) {
  const placeStackAt = useTableStore((state) => state.placeStackAt);
  const clearSelection = useTableStore((state) => state.clearSelection);
  const selectedPlaymatId = useTableStore((state) => state.selectedPlaymatId);
  const themeTexture = useMemo(() => getTableSurfaceTexture(theme), [theme]);
  const customPlaymatTexture = useCustomPlaymatTexture(selectedPlaymatId, TABLE_WIDTH / TABLE_DEPTH);
  const texture = customPlaymatTexture ?? themeTexture;
  const frameColor = useMemo(() => darkenHex(theme.tableColor, 0.45), [theme.tableColor]);
  const legColor = useMemo(() => darkenHex(theme.tableColor, 0.62), [theme.tableColor]);

  const handleSurfaceClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const state = useTableStore.getState();
    if (state.placingStackId) {
      placeStackAt(event.point.x, event.point.z);
      return;
    }
    if (state.selectedInstanceIds.length > 0) clearSelection();
  };

  const frameWidth = TABLE_WIDTH + TABLE_FRAME_MARGIN * 2;
  const frameDepth = TABLE_DEPTH + TABLE_FRAME_MARGIN * 2;
  const frameCenterY = TABLE_FRAME_TOP_Y - TABLE_FRAME_THICKNESS / 2;
  const legCenterY = TABLE_FRAME_TOP_Y - TABLE_FRAME_THICKNESS - TABLE_LEG_HEIGHT / 2;

  const legPositions = useMemo((): Array<[number, number]> => {
    const x = frameWidth / 2 - TABLE_LEG_INSET;
    const z = frameDepth / 2 - TABLE_LEG_INSET;
    return [
      [-x, -z],
      [x, -z],
      [-x, z],
      [x, z],
    ];
  }, [frameWidth, frameDepth]);

  return (
    <group>
      {/* Outer frame: gives the table real thickness plus a raised lip around the mat. */}
      <RoundedBox
        args={[frameWidth, TABLE_FRAME_THICKNESS, frameDepth]}
        radius={0.18}
        smoothness={3}
        position={[0, frameCenterY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={frameColor} roughness={0.65} metalness={0.12} />
      </RoundedBox>

      {/* Boundary line marking the free-form play area (no fixed game zones - just a visual edge). */}
      <mesh position={[0, TABLE_SURFACE_Y - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TABLE_WIDTH + INNER_BORDER_MARGIN * 2, TABLE_DEPTH + INNER_BORDER_MARGIN * 2]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.08} />
      </mesh>

      {/* Playmat - cards rest here. Offset slightly below y=0 so cards never z-fight it. */}
      <mesh
        position={[0, TABLE_SURFACE_Y - 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={interactive ? handleSurfaceClick : undefined}
        raycast={interactive ? undefined : () => null}
      >
        <planeGeometry args={[TABLE_WIDTH, TABLE_DEPTH]} />
        {/* A custom playmat photo must render at its own true colors - only the
            procedurally-generated theme texture gets tinted by theme.tableColor. */}
        <meshStandardMaterial map={texture} color={customPlaymatTexture ? '#ffffff' : theme.tableColor} roughness={0.82} metalness={0} />
      </mesh>

      {/* Legs - simple boxes are enough; no need for a detailed 3D model. */}
      {legPositions.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, legCenterY, z]} castShadow receiveShadow>
          <boxGeometry args={[TABLE_LEG_SIZE, TABLE_LEG_HEIGHT, TABLE_LEG_SIZE]} />
          <meshStandardMaterial color={legColor} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
