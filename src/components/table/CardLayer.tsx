import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';
import { CardMesh } from './CardMesh';

export function CardLayer() {
  const instances = useTableStore((state) => state.instances);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const selectedInstanceId = useTableStore((state) => state.selectedInstanceId);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const cardBackUrl = getCardBackUrl();

  return (
    <>
      {instances.map((instance) => (
        <CardMesh
          key={instance.instanceId}
          instance={instance}
          card={getCardById(instance.cardId)}
          cardBackUrl={cardBackUrl}
          isSelected={selectedInstanceId === instance.instanceId}
          isDragging={draggingInstanceId === instance.instanceId}
        />
      ))}
    </>
  );
}
