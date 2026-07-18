import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';

export function CardPreviewOverlay() {
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const primaryInstanceId = selectedInstanceIds.length === 1 ? selectedInstanceIds[0] : null;
  const instance = useTableStore((state) => (primaryInstanceId ? state.cardInstances[primaryInstanceId] : undefined));
  const getCardById = useCardMasterStore((state) => state.getCardById);

  const card = instance ? getCardById(instance.cardId) : undefined;
  const imageUrl = !instance ? undefined : instance.faceUp ? (card?.imagePath ?? getCardBackUrl()) : getCardBackUrl();
  const label = !instance ? undefined : instance.faceUp ? (card?.name ?? '不明なカード') : '裏向き';

  const multiCount = selectedInstanceIds.length > 1 ? selectedInstanceIds.length : 0;

  return (
    <div className="card-preview-overlay">
      <div className="card-preview-overlay-image">
        {imageUrl ? (
          <img src={imageUrl} alt={label} />
        ) : (
          <div className="card-preview-overlay-placeholder">
            {multiCount > 0 ? `${multiCount}枚のカードを選択中` : 'カードを選択してください'}
          </div>
        )}
      </div>
      <div className="card-preview-overlay-name">
        {multiCount > 0 ? `${multiCount}枚選択中` : primaryInstanceId ? label : '未選択'}
      </div>
    </div>
  );
}
