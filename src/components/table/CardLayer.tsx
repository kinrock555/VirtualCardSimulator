import { Html } from '@react-three/drei';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';
import { computeHandSlotX, computeStackLayerY } from '../../lib/tableGeometry';
import { HAND_AREA_Y, HAND_AREA_Z } from '../../lib/tableConstants';
import { CardMesh } from './CardMesh';

const STACK_LABELS: Record<string, string> = {
  mainDeck: '山札',
  graveyard: '墓地',
  banished: '除外',
  customStack: '束',
};

export function CardLayer() {
  const cardInstances = useTableStore((state) => state.cardInstances);
  const stacks = useTableStore((state) => state.stacks);
  const hand = useTableStore((state) => state.hand);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const cardBackUrl = getCardBackUrl();

  const meshes = [];

  for (const stack of stacks) {
    for (let i = 0; i < stack.cardInstanceIds.length; i++) {
      const instanceId = stack.cardInstanceIds[i];
      const instance = cardInstances[instanceId];
      if (!instance) continue;
      meshes.push(
        <CardMesh
          key={instanceId}
          instance={instance}
          card={getCardById(instance.cardId)}
          cardBackUrl={cardBackUrl}
          isSelected={selectedInstanceIds.includes(instanceId)}
          isDragging={draggingInstanceId === instanceId}
          renderPosition={{ x: stack.position.x, y: computeStackLayerY(i), z: stack.position.z }}
        />,
      );
    }
    if (stack.cardInstanceIds.length > 0 || stack.type !== 'customStack') {
      meshes.push(
        <Html
          key={`${stack.stackId}-label`}
          position={[stack.position.x, computeStackLayerY(stack.cardInstanceIds.length) + 0.35, stack.position.z]}
          center
          distanceFactor={8}
        >
          <div className="stack-count-badge">
            {STACK_LABELS[stack.type]} {stack.cardInstanceIds.length}
          </div>
        </Html>,
      );
    }
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
        isSelected={selectedInstanceIds.includes(instanceId)}
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
        isSelected={selectedInstanceIds.includes(instanceId)}
        isDragging={draggingInstanceId === instanceId}
        renderPosition={instance.position}
      />,
    );
  }

  return <>{meshes}</>;
}
