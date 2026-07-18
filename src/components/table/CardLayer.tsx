import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';
import { computeDeckLayerY, computeHandSlotX } from '../../lib/tableGeometry';
import { HAND_AREA_Y, HAND_AREA_Z } from '../../lib/tableConstants';
import { CardMesh } from './CardMesh';

export function CardLayer() {
  const cardInstances = useTableStore((state) => state.cardInstances);
  const deckStack = useTableStore((state) => state.deckStack);
  const hand = useTableStore((state) => state.hand);
  const deckPosition = useTableStore((state) => state.deckPosition);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const selectedInstanceId = useTableStore((state) => state.selectedInstanceId);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const cardBackUrl = getCardBackUrl();

  const meshes = [];

  for (let i = 0; i < deckStack.length; i++) {
    const instanceId = deckStack[i];
    const instance = cardInstances[instanceId];
    if (!instance) continue;
    meshes.push(
      <CardMesh
        key={instanceId}
        instance={instance}
        card={getCardById(instance.cardId)}
        cardBackUrl={cardBackUrl}
        isSelected={selectedInstanceId === instanceId}
        isDragging={draggingInstanceId === instanceId}
        renderPosition={{ x: deckPosition.x, y: computeDeckLayerY(i), z: deckPosition.z }}
      />,
    );
  }

  for (let i = 0; i < hand.length; i++) {
    const instanceId = hand[i];
    const instance = cardInstances[instanceId];
    if (!instance) continue;
    meshes.push(
      <CardMesh
        key={instanceId}
        instance={instance}
        card={getCardById(instance.cardId)}
        cardBackUrl={cardBackUrl}
        isSelected={selectedInstanceId === instanceId}
        isDragging={draggingInstanceId === instanceId}
        renderPosition={{ x: computeHandSlotX(i, hand.length), y: HAND_AREA_Y, z: HAND_AREA_Z }}
      />,
    );
  }

  for (const instanceId in cardInstances) {
    const instance = cardInstances[instanceId];
    if (instance.zone !== 'table') continue;
    meshes.push(
      <CardMesh
        key={instanceId}
        instance={instance}
        card={getCardById(instance.cardId)}
        cardBackUrl={cardBackUrl}
        isSelected={selectedInstanceId === instanceId}
        isDragging={draggingInstanceId === instanceId}
        renderPosition={instance.position}
      />,
    );
  }

  return <>{meshes}</>;
}
