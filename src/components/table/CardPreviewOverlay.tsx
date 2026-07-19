import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { getCardBackUrl } from '../../lib/cardLoader';

const LOUPE_ZOOM = 2.5;
const LOUPE_WIDTH = 180;
const LOUPE_HEIGHT = 252; // 5:7, matching the card aspect ratio

type LoupeState = { x: number; y: number; bgX: number; bgY: number; bgWidth: number; bgHeight: number };

export function CardPreviewOverlay() {
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const cardInstances = useTableStore((state) => state.cardInstances);
  const peekingInstanceId = useTableStore((state) => state.peekingInstanceId);
  const endPeekCard = useTableStore((state) => state.endPeekCard);
  const loupeEnabled = useTableStore((state) => state.loupeEnabled);
  const previewPanelCollapsed = useTableStore((state) => state.previewPanelCollapsed);
  const setPreviewPanelCollapsed = useTableStore((state) => state.setPreviewPanelCollapsed);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const [loupe, setLoupe] = useState<LoupeState | null>(null);

  // A peek is only ever valid while it still points at an actual face-down
  // table card - any other store change (card removed/moved/flipped, stack
  // draw, etc.) silently invalidates it here rather than needing every
  // mutating store action to remember to clear `peekingInstanceId` itself.
  const peekedInstance = peekingInstanceId ? cardInstances[peekingInstanceId] : undefined;
  const isPeeking = Boolean(peekedInstance && peekedInstance.zone === 'table' && !peekedInstance.faceUp);

  const primaryInstanceId = selectedInstanceIds.length === 1 ? selectedInstanceIds[0] : null;
  const selectedInstance = primaryInstanceId ? cardInstances[primaryInstanceId] : undefined;

  const instance = isPeeking ? peekedInstance : selectedInstance;
  const card = instance ? getCardById(instance.cardId) : undefined;
  // While peeking, the front image always shows - the card itself stays
  // face-down in `cardInstances` the whole time (see beginPeekCard).
  const imageUrl = !instance ? undefined : isPeeking || instance.faceUp ? (card?.imagePath ?? getCardBackUrl()) : getCardBackUrl();
  const label = !instance ? undefined : isPeeking || instance.faceUp ? (card?.name ?? '不明なカード') : '裏向き';

  const multiCount = !isPeeking && selectedInstanceIds.length > 1 ? selectedInstanceIds.length : 0;

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!loupeEnabled || !imageUrl) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) {
      setLoupe(null);
      return;
    }
    const bgWidth = rect.width * LOUPE_ZOOM;
    const bgHeight = rect.height * LOUPE_ZOOM;
    // Clamped so the lens never scrolls past the image's own edges - it always shows real pixels, never blank space.
    const bgX = Math.max(-(bgWidth - LOUPE_WIDTH), Math.min(0, -(relX * LOUPE_ZOOM - LOUPE_WIDTH / 2)));
    const bgY = Math.max(-(bgHeight - LOUPE_HEIGHT), Math.min(0, -(relY * LOUPE_ZOOM - LOUPE_HEIGHT / 2)));
    const lensLeft = Math.max(0, Math.min(rect.width - LOUPE_WIDTH, relX - LOUPE_WIDTH / 2));
    const lensTop = Math.max(0, Math.min(rect.height - LOUPE_HEIGHT, relY - LOUPE_HEIGHT / 2));
    setLoupe({ x: lensLeft, y: lensTop, bgX, bgY, bgWidth, bgHeight });
  };

  if (previewPanelCollapsed) {
    return (
      <button
        type="button"
        className="card-preview-collapsed-tab"
        onClick={() => setPreviewPanelCollapsed(false)}
        title="カードプレビューを開く"
      >
        ◀
      </button>
    );
  }

  return (
    <div className="card-preview-overlay">
      <div className="card-preview-overlay-header">
        {isPeeking ? (
          <span className="card-preview-peek-badge">自分だけ確認中</span>
        ) : (
          <span className="card-preview-overlay-title">カードプレビュー</span>
        )}
        <button type="button" className="card-preview-collapse-button" onClick={() => setPreviewPanelCollapsed(true)} title="たたむ">
          ▶
        </button>
      </div>

      <div className="card-preview-overlay-image" onMouseMove={handleMouseMove} onMouseLeave={() => setLoupe(null)}>
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label} />
            {loupe && (
              <div
                className="card-preview-loupe"
                style={{
                  left: loupe.x,
                  top: loupe.y,
                  width: LOUPE_WIDTH,
                  height: LOUPE_HEIGHT,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${loupe.bgWidth}px ${loupe.bgHeight}px`,
                  backgroundPosition: `${loupe.bgX}px ${loupe.bgY}px`,
                }}
              />
            )}
          </>
        ) : (
          <div className="card-preview-overlay-placeholder">
            {multiCount > 0 ? `${multiCount}枚のカードを選択中` : 'カードを選択してください'}
          </div>
        )}
      </div>

      {isPeeking ? (
        <button type="button" className="card-preview-peek-close" onClick={endPeekCard}>
          閉じる
        </button>
      ) : (
        <div className="card-preview-overlay-name">
          {multiCount > 0 ? `${multiCount}枚選択中` : primaryInstanceId ? label : '未選択'}
        </div>
      )}
    </div>
  );
}
