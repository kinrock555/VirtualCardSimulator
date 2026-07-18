import { Html } from '@react-three/drei';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';
import { computeStackLayerY } from '../../lib/tableGeometry';
import { CardMesh } from './CardMesh';
import { HandDropPreview } from './HandDropPreview';

const STACK_LABELS: Record<string, string> = {
  mainDeck: '山札',
  customStack: '束',
};

export function CardLayer() {
  const cardInstances = useTableStore((state) => state.cardInstances);
  const stacks = useTableStore((state) => state.stacks);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const players = useTableStore((state) => state.players);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const cardBackUrl = getCardBackUrl();

  // In 2-player per-deck modes, label each player's own deck stack with their
  // name instead of the generic "山札" so the two piles are distinguishable.
  const deckOwnerNameByStackId: Record<string, string> = {};
  if (players.length > 1) {
    for (const player of players) {
      if (player.deckStackId) deckOwnerNameByStackId[player.deckStackId] = player.name;
    }
  }

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
            {deckOwnerNameByStackId[stack.stackId]
              ? `${deckOwnerNameByStackId[stack.stackId]}の${STACK_LABELS[stack.type]}`
              : STACK_LABELS[stack.type]}{' '}
            {stack.cardInstanceIds.length}
          </div>
        </Html>,
      );
    }
  }

  // Hand cards are rendered in the 2D HandPanel now (see PlayPage), not as 3D
  // meshes - only their zone/order in the store changed, not this render loop.

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

  return (
    <>
      {meshes}
      <HandDropPreview />
    </>
  );
}
