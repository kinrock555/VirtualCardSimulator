import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Shape } from 'three';
import type { TableTheme } from '../../config/tableThemes';
import type { TableTypeId } from '../../config/tableTypes';
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
  ROUND_TABLE_RADIUS,
  ROUND_TABLE_FRAME_RADIUS,
  ROUND_TABLE_LEG_RADIUS,
  CASINO_FRAME_CORNER_RADIUS,
} from '../../lib/tableConstants';
import { useTableStore } from '../../store/useTableStore';

// Thin inset margin between the playmat's true edge and the boundary line
// drawn beneath it - purely a visual "this is the playable area" cue, not a
// game-rule zone (no monster/spell/mana lines - the field stays freeform).
const INNER_BORDER_MARGIN = 0.16;

/** No handlers on these decorative frame/leg meshes - explicitly excluded from raycasting so they never intercept card clicks/drags. */
const noRaycast = () => null;

const FRAME_CENTER_Y = TABLE_FRAME_TOP_Y - TABLE_FRAME_THICKNESS / 2;
const LEG_CENTER_Y = TABLE_FRAME_TOP_Y - TABLE_FRAME_THICKNESS - TABLE_LEG_HEIGHT / 2;

/** A rounded-rectangle outline, used only for the casino table's frame - a
 * proper "large corner radius" footprint shape that a plain RoundedBox can't
 * produce (its radius is capped by half its thinnest dimension, i.e. the
 * table's thickness, far too small to read as an oval/stadium silhouette). */
function createRoundedRectShape(width: number, depth: number, radius: number): Shape {
  const halfW = width / 2;
  const halfD = depth / 2;
  const r = Math.min(radius, halfW, halfD);
  const shape = new Shape();
  shape.moveTo(-halfW + r, -halfD);
  shape.lineTo(halfW - r, -halfD);
  shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + r);
  shape.lineTo(halfW, halfD - r);
  shape.quadraticCurveTo(halfW, halfD, halfW - r, halfD);
  shape.lineTo(-halfW + r, halfD);
  shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - r);
  shape.lineTo(-halfW, -halfD + r);
  shape.quadraticCurveTo(-halfW, -halfD, -halfW + r, -halfD);
  return shape;
}

type TableSurfaceProps = {
  theme: TableTheme;
  /** Table shape - independent of theme (color). Defaults to 'standard' for callers (e.g. online/menu reuse) that don't pass it. */
  tableType?: TableTypeId;
  /** False for the (non-interactive) main-menu background reuse of this component - disables the playmat's click handler and excludes it from raycasting entirely. Defaults to true for the real play screen. */
  interactive?: boolean;
};

export function TableSurface({ theme, tableType = 'standard', interactive = true }: TableSurfaceProps) {
  const placeStackAt = useTableStore((state) => state.placeStackAt);
  const clearSelection = useTableStore((state) => state.clearSelection);
  const selectedPlaymatId = useTableStore((state) => state.selectedPlaymatId);
  const themeTexture = useMemo(() => getTableSurfaceTexture(theme), [theme]);
  // A round playmat's UV bounds are a square (CircleGeometry inscribes its
  // circle in a 1:1 UV square), unlike the rectangular table's 16:10 aspect.
  const planeAspect = tableType === 'round' ? 1 : TABLE_WIDTH / TABLE_DEPTH;
  const customPlaymatTexture = useCustomPlaymatTexture(selectedPlaymatId, planeAspect);
  const texture = customPlaymatTexture ?? themeTexture;
  const frameColor = useMemo(() => darkenHex(theme.tableColor, 0.45), [theme.tableColor]);
  const legColor = useMemo(() => darkenHex(theme.tableColor, 0.62), [theme.tableColor]);
  const playmatColor = customPlaymatTexture ? '#ffffff' : theme.tableColor;

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

  const roundedRectShape = useMemo(
    () => (tableType === 'casino' ? createRoundedRectShape(frameWidth, frameDepth, CASINO_FRAME_CORNER_RADIUS) : null),
    [tableType, frameWidth, frameDepth],
  );

  // The playmat + boundary line are identical for 'standard' and 'casino'
  // (the casino look comes entirely from its frame below) - only 'round'
  // gets genuinely different (circular) surface geometry.
  const isRound = tableType === 'round';

  return (
    <group>
      {/* Outer frame: gives the table real thickness plus a raised lip around the mat. */}
      {tableType === 'round' ? (
        <mesh position={[0, FRAME_CENTER_Y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[ROUND_TABLE_FRAME_RADIUS, ROUND_TABLE_FRAME_RADIUS, TABLE_FRAME_THICKNESS, 48]} />
          <meshStandardMaterial color={frameColor} roughness={0.65} metalness={0.12} />
        </mesh>
      ) : tableType === 'casino' && roundedRectShape ? (
        <mesh
          position={[0, FRAME_CENTER_Y - TABLE_FRAME_THICKNESS / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <extrudeGeometry args={[roundedRectShape, { depth: TABLE_FRAME_THICKNESS, bevelEnabled: false, curveSegments: 16 }]} />
          <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.16} />
        </mesh>
      ) : (
        <RoundedBox
          args={[frameWidth, TABLE_FRAME_THICKNESS, frameDepth]}
          radius={0.18}
          smoothness={3}
          position={[0, FRAME_CENTER_Y, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={frameColor} roughness={0.65} metalness={0.12} />
        </RoundedBox>
      )}

      {/* Boundary line marking the free-form play area (no fixed game zones - just a visual edge). */}
      {isRound ? (
        <mesh position={[0, TABLE_SURFACE_Y - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[ROUND_TABLE_RADIUS + INNER_BORDER_MARGIN, 48]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.08} />
        </mesh>
      ) : (
        <mesh position={[0, TABLE_SURFACE_Y - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[TABLE_WIDTH + INNER_BORDER_MARGIN * 2, TABLE_DEPTH + INNER_BORDER_MARGIN * 2]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.08} />
        </mesh>
      )}

      {/* Playmat - cards rest here. Offset slightly below y=0 so cards never z-fight it. */}
      <mesh
        position={[0, TABLE_SURFACE_Y - 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={interactive ? handleSurfaceClick : undefined}
        raycast={interactive ? undefined : noRaycast}
      >
        {isRound ? <circleGeometry args={[ROUND_TABLE_RADIUS, 48]} /> : <planeGeometry args={[TABLE_WIDTH, TABLE_DEPTH]} />}
        {/* A custom playmat photo must render at its own true colors - only the
            procedurally-generated theme texture gets tinted by theme.tableColor. */}
        <meshStandardMaterial map={texture} color={playmatColor} roughness={0.82} metalness={0} />
      </mesh>

      {/* Legs - simple boxes/cylinders are enough; no need for a detailed 3D model. */}
      {isRound ? (
        <mesh position={[0, LEG_CENTER_Y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[ROUND_TABLE_LEG_RADIUS * 0.75, ROUND_TABLE_LEG_RADIUS * 1.4, TABLE_LEG_HEIGHT, 20]} />
          <meshStandardMaterial color={legColor} roughness={0.6} metalness={0.15} />
        </mesh>
      ) : (
        legPositions.map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, LEG_CENTER_Y, z]} castShadow receiveShadow>
            {tableType === 'casino' ? (
              <cylinderGeometry args={[TABLE_LEG_SIZE * 0.62, TABLE_LEG_SIZE * 0.62, TABLE_LEG_HEIGHT, 16]} />
            ) : (
              <boxGeometry args={[TABLE_LEG_SIZE, TABLE_LEG_HEIGHT, TABLE_LEG_SIZE]} />
            )}
            <meshStandardMaterial
              color={legColor}
              roughness={tableType === 'casino' ? 0.5 : 0.7}
              metalness={tableType === 'casino' ? 0.25 : 0.1}
            />
          </mesh>
        ))
      )}
    </group>
  );
}
