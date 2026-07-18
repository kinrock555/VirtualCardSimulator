import { useMemo, useState } from 'react';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useOnlineStore } from '../../store/useOnlineStore';
import { Button } from '../common/Button';

export function OnlineStackViewerPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const stackViewerStackId = useOnlineStore((state) => state.stackViewerStackId);
  const cards = useOnlineStore((state) => state.stackViewerCards);
  const getCardById = useCardMasterStore((state) => state.getCardById);
  const reorderStack = useOnlineStore((state) => state.reorderStack);
  const closeStackViewer = useOnlineStore((state) => state.closeStackViewer);

  const isSearching = searchQuery.trim().length > 0;
  const filtered = useMemo(() => {
    if (!cards) return [];
    if (!isSearching) return cards;
    const query = searchQuery.trim().toLowerCase();
    return cards.filter((c) => (getCardById(c.cardId)?.name ?? '').toLowerCase().includes(query));
  }, [cards, isSearching, searchQuery, getCardById]);

  if (!stackViewerStackId) return null;

  if (!cards) {
    return (
      <div className="modal-overlay" onClick={closeStackViewer}>
        <div className="modal-panel stack-viewer-panel" onClick={(event) => event.stopPropagation()}>
          <p className="empty-state">読み込み中...</p>
        </div>
      </div>
    );
  }

  const total = cards.length;

  const moveToTop = (instanceId: string) => {
    const order = cards.map((c) => c.instanceId).filter((id) => id !== instanceId);
    order.push(instanceId);
    reorderStack(stackViewerStackId, order);
  };
  const moveToBottom = (instanceId: string) => {
    const order = cards.map((c) => c.instanceId).filter((id) => id !== instanceId);
    order.unshift(instanceId);
    reorderStack(stackViewerStackId, order);
  };
  const handleDrop = (targetInstanceId: string) => {
    if (isSearching || !draggedId || draggedId === targetInstanceId) return;
    const order = cards.map((c) => c.instanceId);
    const fromIndex = order.indexOf(draggedId);
    const toIndex = order.indexOf(targetInstanceId);
    if (fromIndex === -1 || toIndex === -1) return;
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, draggedId);
    reorderStack(stackViewerStackId, order);
    setDraggedId(null);
  };

  return (
    <div className="modal-overlay" onClick={closeStackViewer}>
      <div className="modal-panel stack-viewer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="stack-viewer-header">
          <h2 className="modal-title">中身を見る（自分だけ確認・{total}枚）</h2>
          <Button size="sm" variant="ghost" onClick={closeStackViewer}>
            閉じる
          </Button>
        </div>
        <p className="stack-viewer-hint">上に表示されているカードほど、この束の上にあります。相手にはこの一覧は送信されません。</p>

        <input
          type="text"
          className="search-input"
          placeholder="カード名で検索"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        {isSearching && <p className="stack-viewer-hint stack-viewer-hint-muted">検索中は並び替えできません。</p>}

        <div className="stack-viewer-list">
          {filtered.length === 0 && <p className="empty-state">該当するカードがありません。</p>}
          {filtered.map((entry) => {
            const card = getCardById(entry.cardId);
            const positionFromTop = cards.findIndex((c) => c.instanceId === entry.instanceId) + 1;
            return (
              <div
                key={entry.instanceId}
                className="stack-viewer-row"
                draggable={!isSearching}
                onDragStart={() => setDraggedId(entry.instanceId)}
                onDragOver={(event) => {
                  if (!isSearching) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(entry.instanceId);
                }}
              >
                <div className="stack-viewer-row-thumb">{card && <img src={card.imagePath} alt={card.name} loading="lazy" />}</div>
                <div className="stack-viewer-row-info">
                  <div className="stack-viewer-row-name">{card?.name ?? '不明なカード'}</div>
                  <div className="stack-viewer-row-position">
                    上から{positionFromTop}番目 / 全{total}枚
                  </div>
                </div>
                <div className="stack-viewer-row-actions">
                  <Button size="sm" variant="ghost" disabled={isSearching} onClick={() => moveToTop(entry.instanceId)}>
                    一番上へ
                  </Button>
                  <Button size="sm" variant="ghost" disabled={isSearching} onClick={() => moveToBottom(entry.instanceId)}>
                    一番下へ
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
