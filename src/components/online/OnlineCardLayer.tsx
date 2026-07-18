import { Html } from '@react-three/drei';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useOnlineStore } from '../../store/useOnlineStore';
import { getCardBackUrl } from '../../lib/cardLoader';
import { computeHandSlotX, computeStackLayerY } from '../../lib/tableGeometry';
import { HAND_AREA_Y, HAND_AREA_Z } from '../../lib/tableConstants';
import { OnlineCardMesh } from './OnlineCardMesh';

const STACK_LABELS: Record<string, string> = {
  mainDeck: '山札',
  graveyard: '墓地',
  banished: '除外',
  customStack: '束',
};

export function OnlineCardLayer() {
  const table = useOnlineStore((state) => state.table);
  const myPlayerId = useOnlineStore((state) => state.playerId);
  const localCardPositions = useOnlineStore((state) => state.localCardPositions);
  const selectedInstanceIds = useOnlineStore((state) => state.selectedInstanceIds);
  const draggingInstanceId = useOnlineStore((state) => state.draggingInstanceId);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const cardBackUrl = getCardBackUrl();

  if (!table) return null;

  const meshes = [];

  for (const stack of table.stacks) {
    for (let i = 0; i < stack.cardInstanceIds.length; i++) {
      const instanceId = stack.cardInstanceIds[i];
      const instance = table.cardInstances[instanceId];
      if (!instance) continue;
      meshes.push(
        <OnlineCardMesh
          key={instanceId}
          instance={instance}
          card={instance.cardId ? getCardById(instance.cardId) : undefined}
          cardBackUrl={cardBackUrl}
          isSelected={selectedInstanceIds.includes(instanceId)}
          isDragging={draggingInstanceId === instanceId}
          renderPosition={{ x: stack.position.x, y: computeStackLayerY(i), z: stack.position.z }}
          isMyHandCard={false}
          stackId={stack.stackId}
        />,
      );
    }
    meshes.push(
      <Html
        key={`${stack.stackId}-label`}
        position={[stack.position.x, computeStackLayerY(stack.cardInstanceIds.length) + 0.35, stack.position.z]}
        center
        distanceFactor={8}
      >
        <div className="stack-count-badge">
          {STACK_LABELS[stack.type] ?? '束'} {stack.cardInstanceIds.length}
        </div>
      </Html>,
    );
  }

  for (const [playerId, handIds] of Object.entries(table.hands)) {
    const isMine = playerId === myPlayerId;
    const z = isMine ? HAND_AREA_Z : -HAND_AREA_Z;
    for (let i = 0; i < handIds.length; i++) {
      const instanceId = handIds[i];
      const instance = table.cardInstances[instanceId];
      if (!instance) continue;
      meshes.push(
        <OnlineCardMesh
          key={instanceId}
          instance={instance}
          card={instance.cardId ? getCardById(instance.cardId) : undefined}
          cardBackUrl={cardBackUrl}
          isSelected={selectedInstanceIds.includes(instanceId)}
          isDragging={draggingInstanceId === instanceId}
          renderPosition={{ x: computeHandSlotX(i, handIds.length), y: HAND_AREA_Y, z }}
          isMyHandCard={isMine}
        />,
      );
    }
  }

  for (const [instanceId, instance] of Object.entries(table.cardInstances)) {
    if (instance.zone !== 'table') continue;
    const overridePos = localCardPositions[instanceId];
    meshes.push(
      <OnlineCardMesh
        key={instanceId}
        instance={instance}
        card={instance.cardId ? getCardById(instance.cardId) : undefined}
        cardBackUrl={cardBackUrl}
        isSelected={selectedInstanceIds.includes(instanceId)}
        isDragging={draggingInstanceId === instanceId}
        renderPosition={{
          x: overridePos ? overridePos.x : instance.position.x,
          y: instance.position.y,
          z: overridePos ? overridePos.z : instance.position.z,
        }}
        isMyHandCard={false}
      />,
    );
  }

  return <>{meshes}</>;
}
