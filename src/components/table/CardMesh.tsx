import { memo, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useTexture, Outlines } from '@react-three/drei';
import { Vector3 } from 'three';
import type { CardInstance } from '../../types/table';
import type { CardMaster } from '../../types/card';
import { CARD_HEIGHT, CARD_THICKNESS, CARD_WIDTH, DRAG_LIFT_HEIGHT } from '../../lib/tableConstants';
import { tableDragPlane } from '../../lib/dragPlane';
import { useTableStore } from '../../store/useTableStore';

type CardMeshProps = {
  instance: CardInstance;
  card: CardMaster | undefined;
  cardBackUrl: string;
  isSelected: boolean;
  isDragging: boolean;
  /** Current world position to render at (deck/hand/graveyard/banished zones compute this from their slot index). */
  renderPosition: { x: number; y: number; z: number };
};

const FALLBACK_EDGE_COLOR = '#d8d8d8';
const MISSING_CARD_COLOR = '#8a3b3b';
const STACKED_ZONES = new Set(['deck', 'graveyard', 'banished']);

function CardMeshImpl({ instance, card, cardBackUrl, isSelected, isDragging, renderPosition }: CardMeshProps) {
  const beginDrag = useTableStore((state) => state.beginDrag);
  const beginHandDrag = useTableStore((state) => state.beginHandDrag);
  const updateDragPosition = useTableStore((state) => state.updateDragPosition);
  const endDrag = useTableStore((state) => state.endDrag);
  const selectInstance = useTableStore((state) => state.selectInstance);
  const openCardContextMenu = useTableStore((state) => state.openCardContextMenu);
  const openStackContextMenu = useTableStore((state) => state.openStackContextMenu);
  const openMultiSelectContextMenu = useTableStore((state) => state.openMultiSelectContextMenu);

  const grabOffsetRef = useRef({ x: 0, z: 0 });
  const intersectionRef = useRef(new Vector3());

  const frontTexture = useTexture(card?.imagePath ?? cardBackUrl);
  const backTexture = useTexture(cardBackUrl);

  const materials = useMemo(() => {
    const topTexture = instance.faceUp ? frontTexture : backTexture;
    const bottomTexture = instance.faceUp ? backTexture : frontTexture;
    return [
      { color: card ? FALLBACK_EDGE_COLOR : MISSING_CARD_COLOR },
      { color: card ? FALLBACK_EDGE_COLOR : MISSING_CARD_COLOR },
      { map: topTexture },
      { map: bottomTexture },
      { color: card ? FALLBACK_EDGE_COLOR : MISSING_CARD_COLOR },
      { color: card ? FALLBACK_EDGE_COLOR : MISSING_CARD_COLOR },
    ];
  }, [card, frontTexture, backTexture, instance.faceUp]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return;
    if (instance.zone !== 'table' && instance.zone !== 'hand') return;
    // Shift is reserved for click-to-toggle multi-select (handled in onClick) - starting a
    // drag here would immediately collapse the selection to just this card beforehand.
    if (event.nativeEvent.shiftKey) return;
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    const hasIntersection = event.ray.intersectPlane(tableDragPlane, intersectionRef.current);

    if (instance.zone === 'hand') {
      const startX = renderPosition.x;
      const startZ = renderPosition.z;
      grabOffsetRef.current = hasIntersection
        ? { x: startX - intersectionRef.current.x, z: startZ - intersectionRef.current.z }
        : { x: 0, z: 0 };
      beginHandDrag(instance.instanceId, startX, startZ);
      return;
    }

    grabOffsetRef.current = hasIntersection
      ? { x: instance.position.x - intersectionRef.current.x, z: instance.position.z - intersectionRef.current.z }
      : { x: 0, z: 0 };
    beginDrag(instance.instanceId);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (useTableStore.getState().draggingInstanceId !== instance.instanceId) return;
    if (!event.ray.intersectPlane(tableDragPlane, intersectionRef.current)) return;
    updateDragPosition(
      instance.instanceId,
      intersectionRef.current.x + grabOffsetRef.current.x,
      intersectionRef.current.z + grabOffsetRef.current.z,
    );
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (useTableStore.getState().draggingInstanceId !== instance.instanceId) return;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    endDrag();
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (STACKED_ZONES.has(instance.zone)) return;
    const additive = instance.zone === 'table' && event.nativeEvent.shiftKey;
    selectInstance(instance.instanceId, additive);
  };

  const handleContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    const { clientX, clientY } = event.nativeEvent;

    if (STACKED_ZONES.has(instance.zone)) {
      const stack = useTableStore.getState().findStackContaining(instance.instanceId);
      if (stack) openStackContextMenu(stack.stackId, clientX, clientY);
      return;
    }

    if (instance.zone === 'table') {
      const state = useTableStore.getState();
      const isPartOfMultiSelection = state.selectedInstanceIds.length > 1 && state.selectedInstanceIds.includes(instance.instanceId);
      if (isPartOfMultiSelection) {
        openMultiSelectContextMenu(clientX, clientY);
      } else {
        selectInstance(instance.instanceId, false);
        openCardContextMenu(instance.instanceId, clientX, clientY);
      }
    }
  };

  const liftY = isDragging ? DRAG_LIFT_HEIGHT : isSelected ? 0.08 : 0;
  const rotationYRad = (instance.rotationY * Math.PI) / 180;

  return (
    <group
      position={[renderPosition.x, renderPosition.y + liftY, renderPosition.z]}
      rotation={[0, rotationYRad, 0]}
    >
      <mesh
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <boxGeometry args={[CARD_WIDTH, CARD_THICKNESS, CARD_HEIGHT]} />
        {materials.map((mat, index) => (
          <meshStandardMaterial key={index} attach={`material-${index}`} {...mat} />
        ))}
        {isSelected && <Outlines thickness={2} color="#ffd35c" />}
      </mesh>
    </group>
  );
}

export const CardMesh = memo(CardMeshImpl);
