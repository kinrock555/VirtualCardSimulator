import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { screenToTablePoint } from '../../lib/threeBridge';
import { getCardBackUrl } from '../../lib/cardLoader';

const OVERLAP_THRESHOLD = 9;
const CARD_BASE_WIDTH = 92;
const OVERLAP_MARGIN = -34;

type DragGhost = { instanceId: string; clientX: number; clientY: number; faceUp: boolean };

export function HandPanel() {
  const hand = useTableStore((state) => state.hand);
  const cardInstances = useTableStore((state) => state.cardInstances);
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const selectInstance = useTableStore((state) => state.selectInstance);
  const clearSelection = useTableStore((state) => state.clearSelection);
  const collapsed = useTableStore((state) => state.handPanelCollapsed);
  const setHandPanelCollapsed = useTableStore((state) => state.setHandPanelCollapsed);
  const beginHandFieldDrag = useTableStore((state) => state.beginHandFieldDrag);
  const updateHandFieldDrag = useTableStore((state) => state.updateHandFieldDrag);
  const endHandFieldDrag = useTableStore((state) => state.endHandFieldDrag);
  const moveHandCardToTableAt = useTableStore((state) => state.moveHandCardToTableAt);
  const getCardById = useCardMasterStore((state) => state.getCardById);

  const [ghost, setGhost] = useState<DragGhost | null>(null);

  const overlap = hand.length > OVERLAP_THRESHOLD;

  const handlePointerDown = (instanceId: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // The face orientation is locked in at drag start: plain drag = face up,
    // Shift+drag = face down. Checking it again mid-drag would let the user
    // flip the outcome by releasing Shift before dropping, which is confusing.
    const faceUp = !event.shiftKey;
    selectInstance(instanceId, false);
    beginHandFieldDrag(instanceId, faceUp);
    setGhost({ instanceId, clientX: event.clientX, clientY: event.clientY, faceUp });
  };

  const handlePointerMove = (instanceId: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (useTableStore.getState().handFieldDrag?.instanceId !== instanceId) return;
    setGhost((prev) => (prev ? { ...prev, clientX: event.clientX, clientY: event.clientY } : prev));
    const point = screenToTablePoint(event.clientX, event.clientY);
    if (point) updateHandFieldDrag(point.x, point.z, true);
    else updateHandFieldDrag(0, 0, false);
  };

  const handlePointerUp = (instanceId: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (useTableStore.getState().handFieldDrag?.instanceId !== instanceId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const drag = useTableStore.getState().handFieldDrag;
    if (drag && drag.visible) {
      moveHandCardToTableAt(instanceId, drag.x, drag.z, drag.faceUp);
    } else {
      endHandFieldDrag();
    }
    setGhost(null);
  };

  const ghostCard = ghost ? cardInstances[ghost.instanceId] : undefined;
  const ghostMaster = ghostCard?.cardId ? getCardById(ghostCard.cardId) : undefined;
  const ghostImageSrc = ghost && !ghost.faceUp ? getCardBackUrl() : ghostMaster?.imagePath;

  return (
    <div className={`hand-panel${collapsed ? ' collapsed' : ''}`}>
      <div className="hand-panel-header">
        <span className="hand-panel-title">手札</span>
        <span className="hand-panel-count">{hand.length}枚</span>
        <button
          type="button"
          className="hand-panel-toggle"
          onClick={() => setHandPanelCollapsed(!collapsed)}
        >
          {collapsed ? '▲ 開く' : '▼ たたむ'}
        </button>
      </div>

      {!collapsed && (
        <div className="hand-panel-track" onClick={() => clearSelection()}>
          {hand.length === 0 && <p className="hand-panel-empty">手札はありません</p>}
          <div className="hand-panel-cards">
            {hand.map((instanceId, index) => {
              const instance = cardInstances[instanceId];
              if (!instance) return null;
              const card = instance.cardId ? getCardById(instance.cardId) : undefined;
              const isSelected = selectedInstanceIds.includes(instanceId);
              const isBeingDragged = ghost?.instanceId === instanceId;
              return (
                <div
                  key={instanceId}
                  className={`hand-card${isSelected ? ' selected' : ''}${isBeingDragged ? ' dragging' : ''}`}
                  style={{
                    width: CARD_BASE_WIDTH,
                    marginLeft: overlap && index > 0 ? OVERLAP_MARGIN : 0,
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={handlePointerDown(instanceId)}
                  onPointerMove={handlePointerMove(instanceId)}
                  onPointerUp={handlePointerUp(instanceId)}
                >
                  {card ? (
                    <img className="hand-card-image" src={card.imagePath} alt={card.name} draggable={false} />
                  ) : (
                    <div className="hand-card-missing">カード不明</div>
                  )}
                  <div className="hand-card-name">{card?.name ?? '不明なカード'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ghost && (
        <div className="hand-drag-ghost" style={{ left: ghost.clientX, top: ghost.clientY }}>
          {!ghost.faceUp || ghostMaster ? (
            <img src={ghostImageSrc} alt={ghost.faceUp ? (ghostMaster?.name ?? '') : 'カード裏面'} draggable={false} />
          ) : (
            <div className="hand-card-missing">カード不明</div>
          )}
          <span className={`hand-drag-ghost-badge${ghost.faceUp ? '' : ' face-down'}`}>
            {ghost.faceUp ? '表向きで出す' : '裏向きで出す'}
          </span>
        </div>
      )}
    </div>
  );
}
