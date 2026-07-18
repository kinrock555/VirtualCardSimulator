import { memo, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useTexture, Outlines } from '@react-three/drei';
import { Vector3 } from 'three';
import type { PublicCardView } from '../../../shared/onlineTypes';
import type { CardMaster } from '../../types/card';
import { CARD_HEIGHT, CARD_THICKNESS, CARD_WIDTH, DRAG_LIFT_HEIGHT } from '../../lib/tableConstants';
import { tableDragPlane } from '../../lib/dragPlane';
import { useOnlineStore } from '../../store/useOnlineStore';

type OnlineCardMeshProps = {
  instance: PublicCardView;
  card: CardMaster | undefined;
  cardBackUrl: string;
  isSelected: boolean;
  isDragging: boolean;
  renderPosition: { x: number; y: number; z: number };
  /** True only for cards in MY OWN hand - opponents' hand cards are inert card-backs. */
  isMyHandCard: boolean;
  /** Which stack this instance belongs to (deck/graveyard/banished/custom) - undefined for hand/table cards. */
  stackId?: string;
};

const FALLBACK_EDGE_COLOR = '#d8d8d8';
const HIDDEN_CARD_COLOR = '#3a4256';

function OnlineCardMeshImpl({
  instance,
  card,
  cardBackUrl,
  isSelected,
  isDragging,
  renderPosition,
  isMyHandCard,
  stackId,
}: OnlineCardMeshProps) {
  const beginDrag = useOnlineStore((state) => state.beginDrag);
  const updateDragPosition = useOnlineStore((state) => state.updateDragPosition);
  const endDrag = useOnlineStore((state) => state.endDrag);
  const commitCardMove = useOnlineStore((state) => state.commitCardMove);
  const moveCardZone = useOnlineStore((state) => state.moveCardZone);
  const selectInstance = useOnlineStore((state) => state.selectInstance);
  const openCardContextMenu = useOnlineStore((state) => state.openCardContextMenu);
  const openStackContextMenu = useOnlineStore((state) => state.openStackContextMenu);
  const openMultiSelectContextMenu = useOnlineStore((state) => state.openMultiSelectContextMenu);

  const grabOffsetRef = useRef({ x: 0, z: 0 });
  const intersectionRef = useRef(new Vector3());

  const isKnown = instance.cardId !== null && Boolean(card);
  const frontTexture = useTexture(isKnown && card ? card.imagePath : cardBackUrl);
  const backTexture = useTexture(cardBackUrl);

  const materials = useMemo(() => {
    const topTexture = instance.faceUp ? frontTexture : backTexture;
    const bottomTexture = instance.faceUp ? backTexture : frontTexture;
    const edgeColor = isKnown ? FALLBACK_EDGE_COLOR : HIDDEN_CARD_COLOR;
    return [
      { color: edgeColor },
      { color: edgeColor },
      { map: topTexture },
      { map: bottomTexture },
      { color: edgeColor },
      { color: edgeColor },
    ];
  }, [isKnown, frontTexture, backTexture, instance.faceUp]);

  const isDraggable = instance.zone === 'table' || (instance.zone === 'hand' && isMyHandCard);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || !isDraggable) return;
    if (event.nativeEvent.shiftKey) return; // reserved for multi-select toggle, see handleClick
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    const hasIntersection = event.ray.intersectPlane(tableDragPlane, intersectionRef.current);
    grabOffsetRef.current = hasIntersection
      ? { x: renderPosition.x - intersectionRef.current.x, z: renderPosition.z - intersectionRef.current.z }
      : { x: 0, z: 0 };
    beginDrag(instance.instanceId, instance.zone);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (useOnlineStore.getState().draggingInstanceId !== instance.instanceId) return;
    if (!event.ray.intersectPlane(tableDragPlane, intersectionRef.current)) return;
    updateDragPosition(
      instance.instanceId,
      intersectionRef.current.x + grabOffsetRef.current.x,
      intersectionRef.current.z + grabOffsetRef.current.z,
    );
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (useOnlineStore.getState().draggingInstanceId !== instance.instanceId) return;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    const finalPos = endDrag();
    if (!finalPos) return;
    if (instance.zone === 'hand') {
      moveCardZone(instance.instanceId, 'tableFaceUp', finalPos);
    } else {
      commitCardMove(instance.instanceId, finalPos.x, finalPos.z);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (instance.zone !== 'table' && !(instance.zone === 'hand' && isMyHandCard)) return;
    const additive = instance.zone === 'table' && event.nativeEvent.shiftKey;
    selectInstance(instance.instanceId, additive);
  };

  const handleContextMenu = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    const { clientX, clientY } = event.nativeEvent;

    if (stackId) {
      openStackContextMenu(stackId, clientX, clientY);
      return;
    }
    if (instance.zone === 'table') {
      const state = useOnlineStore.getState();
      const isPartOfMultiSelection = state.selectedInstanceIds.length > 1 && state.selectedInstanceIds.includes(instance.instanceId);
      if (isPartOfMultiSelection) {
        openMultiSelectContextMenu(clientX, clientY);
      } else {
        selectInstance(instance.instanceId, false);
        openCardContextMenu(instance.instanceId, clientX, clientY);
      }
    }
    // hand cards: no context menu (matches offline design)
  };

  const liftY = isDragging ? DRAG_LIFT_HEIGHT : isSelected ? 0.08 : 0;
  const rotationYRad = (instance.rotationY * Math.PI) / 180;

  return (
    <group position={[renderPosition.x, renderPosition.y + liftY, renderPosition.z]} rotation={[0, rotationYRad, 0]}>
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

export const OnlineCardMesh = memo(OnlineCardMeshImpl);
