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
};

const FALLBACK_EDGE_COLOR = '#d8d8d8';
const MISSING_CARD_COLOR = '#8a3b3b';

function CardMeshImpl({ instance, card, cardBackUrl, isSelected, isDragging }: CardMeshProps) {
  const beginDrag = useTableStore((state) => state.beginDrag);
  const updateDragPosition = useTableStore((state) => state.updateDragPosition);
  const endDrag = useTableStore((state) => state.endDrag);
  const selectInstance = useTableStore((state) => state.selectInstance);
  const openContextMenu = useTableStore((state) => state.openContextMenu);

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
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    if (event.ray.intersectPlane(tableDragPlane, intersectionRef.current)) {
      grabOffsetRef.current = {
        x: instance.position.x - intersectionRef.current.x,
        z: instance.position.z - intersectionRef.current.z,
      };
    } else {
      grabOffsetRef.current = { x: 0, z: 0 };
    }
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
    selectInstance(instance.instanceId);
  };

  const handleContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    selectInstance(instance.instanceId);
    openContextMenu(instance.instanceId, event.nativeEvent.clientX, event.nativeEvent.clientY);
  };

  const liftY = isDragging ? DRAG_LIFT_HEIGHT : isSelected ? 0.08 : 0;
  const rotationYRad = (instance.rotationY * Math.PI) / 180;

  return (
    <group
      position={[instance.position.x, instance.position.y + liftY, instance.position.z]}
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
