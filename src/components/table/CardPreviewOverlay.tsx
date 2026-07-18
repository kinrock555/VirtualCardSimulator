import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';

export function CardPreviewOverlay() {
  const selectedInstanceId = useTableStore((state) => state.selectedInstanceId);
  const instance = useTableStore((state) =>
    state.instances.find((i) => i.instanceId === state.selectedInstanceId),
  );
  const getCardById = useCardMasterStore((state) => state.getCardById);

  if (!selectedInstanceId || !instance) return null;

  const card = getCardById(instance.cardId);
  const imageUrl = instance.faceUp ? card?.imagePath ?? getCardBackUrl() : getCardBackUrl();
  const label = instance.faceUp ? card?.name ?? '不明なカード' : '裏向き';

  return (
    <div className="card-preview-overlay">
      <div className="card-preview-overlay-image">
        <img src={imageUrl} alt={label} />
      </div>
      <div className="card-preview-overlay-name">{label}</div>
    </div>
  );
}
