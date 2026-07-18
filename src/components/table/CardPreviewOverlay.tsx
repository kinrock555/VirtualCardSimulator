import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';

export function CardPreviewOverlay() {
  const selectedInstanceId = useTableStore((state) => state.selectedInstanceId);
  const instance = useTableStore((state) =>
    state.selectedInstanceId ? state.cardInstances[state.selectedInstanceId] : undefined,
  );
  const getCardById = useCardMasterStore((state) => state.getCardById);

  const card = instance ? getCardById(instance.cardId) : undefined;
  const imageUrl = !instance
    ? undefined
    : instance.faceUp
      ? (card?.imagePath ?? getCardBackUrl())
      : getCardBackUrl();
  const label = !instance ? undefined : instance.faceUp ? (card?.name ?? '不明なカード') : '裏向き';

  return (
    <div className="card-preview-overlay">
      <div className="card-preview-overlay-image">
        {imageUrl ? (
          <img src={imageUrl} alt={label} />
        ) : (
          <div className="card-preview-overlay-placeholder">カードを選択してください</div>
        )}
      </div>
      <div className="card-preview-overlay-name">{selectedInstanceId ? label : '未選択'}</div>
    </div>
  );
}
