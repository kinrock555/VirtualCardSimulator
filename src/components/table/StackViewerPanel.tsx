import { useMemo, useState } from 'react';
import { useCardMasterStore } from '../../store/useCardMasterStore';
import { useTableStore } from '../../store/useTableStore';
import { Button } from '../common/Button';

const STACK_TITLES: Record<string, string> = {
  mainDeck: '山札の中身',
  customStack: '束の中身',
};

type CardAction = '' | 'hand' | 'tableUp' | 'tableDown' | 'deckTop' | 'deckBottom';

export function StackViewerPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const stackViewerStackId = useTableStore((state) => state.stackViewerStackId);
  const stack = useTableStore((state) => state.stacks.find((s) => s.stackId === state.stackViewerStackId));
  const cardInstances = useTableStore((state) => state.cardInstances);
  const getCardById = useCardMasterStore((state) => state.getCardById);

  const setStackOrder = useTableStore((state) => state.setStackOrder);
  const moveCardsToHand = useTableStore((state) => state.moveCardsToHand);
  const moveCardsToTable = useTableStore((state) => state.moveCardsToTable);
  const moveCardsToMainDeckTop = useTableStore((state) => state.moveCardsToMainDeckTop);
  const moveCardsToMainDeckBottom = useTableStore((state) => state.moveCardsToMainDeckBottom);
  const closeStackViewer = useTableStore((state) => state.closeStackViewer);

  // Top of the stack is the LAST array entry - display top-first, as the panel states.
  const topFirstIds = useMemo(() => (stack ? [...stack.cardInstanceIds].reverse() : []), [stack]);

  const isSearching = searchQuery.trim().length > 0;
  const filteredIds = useMemo(() => {
    if (!isSearching) return topFirstIds;
    const query = searchQuery.trim().toLowerCase();
    return topFirstIds.filter((id) => {
      const instance = cardInstances[id];
      const card = instance ? getCardById(instance.cardId) : undefined;
      return (card?.name ?? '').toLowerCase().includes(query);
    });
  }, [topFirstIds, isSearching, searchQuery, cardInstances, getCardById]);

  if (!stackViewerStackId || !stack) return null;

  const total = stack.cardInstanceIds.length;

  const handleAction = (instanceId: string, action: CardAction) => {
    if (action === 'hand') moveCardsToHand([instanceId]);
    else if (action === 'tableUp') moveCardsToTable([instanceId], true);
    else if (action === 'tableDown') moveCardsToTable([instanceId], false);
    else if (action === 'deckTop') moveCardsToMainDeckTop([instanceId]);
    else if (action === 'deckBottom') moveCardsToMainDeckBottom([instanceId]);
  };

  const moveWithinStackToTop = (instanceId: string) => {
    const next = stack.cardInstanceIds.filter((id) => id !== instanceId);
    next.push(instanceId);
    setStackOrder(stack.stackId, next);
  };

  const moveWithinStackToBottom = (instanceId: string) => {
    const next = stack.cardInstanceIds.filter((id) => id !== instanceId);
    next.unshift(instanceId);
    setStackOrder(stack.stackId, next);
  };

  const handleDrop = (targetInstanceId: string) => {
    if (isSearching || !draggedId || draggedId === targetInstanceId) return;
    const order = [...stack.cardInstanceIds];
    const fromIndex = order.indexOf(draggedId);
    const toIndex = order.indexOf(targetInstanceId);
    if (fromIndex === -1 || toIndex === -1) return;
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, draggedId);
    setStackOrder(stack.stackId, order);
    setDraggedId(null);
  };

  return (
    <div className="modal-overlay" onClick={closeStackViewer}>
      <div className="modal-panel stack-viewer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="stack-viewer-header">
          <h2 className="modal-title">
            {STACK_TITLES[stack.type] ?? '中身を見る'} ({total}枚)
          </h2>
          <Button size="sm" variant="ghost" onClick={closeStackViewer}>
            閉じる
          </Button>
        </div>
        <p className="stack-viewer-hint">上に表示されているカードほど、この束の上にあります。</p>

        <input
          type="text"
          className="search-input"
          placeholder="カード名で検索"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        {isSearching && (
          <p className="stack-viewer-hint stack-viewer-hint-muted">
            検索中は並び替えできません（検索欄を空にすると並び替えできます）。
          </p>
        )}

        <div className="stack-viewer-list">
          {filteredIds.length === 0 && <p className="empty-state">該当するカードがありません。</p>}
          {filteredIds.map((instanceId) => {
            const instance = cardInstances[instanceId];
            if (!instance) return null;
            const card = getCardById(instance.cardId);
            const positionFromTop = topFirstIds.indexOf(instanceId) + 1;
            return (
              <div
                key={instanceId}
                className="stack-viewer-row"
                draggable={!isSearching}
                onDragStart={() => setDraggedId(instanceId)}
                onDragOver={(event) => {
                  if (!isSearching) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(instanceId);
                }}
              >
                <div className="stack-viewer-row-thumb">
                  {card && <img src={card.imagePath} alt={card.name} loading="lazy" />}
                </div>
                <div className="stack-viewer-row-info">
                  <div className="stack-viewer-row-name">{card?.name ?? '不明なカード'}</div>
                  <div className="stack-viewer-row-position">上から{positionFromTop}番目 / 全{total}枚</div>
                </div>
                <div className="stack-viewer-row-actions">
                  <Button size="sm" variant="ghost" disabled={isSearching} onClick={() => moveWithinStackToTop(instanceId)}>
                    一番上へ
                  </Button>
                  <Button size="sm" variant="ghost" disabled={isSearching} onClick={() => moveWithinStackToBottom(instanceId)}>
                    一番下へ
                  </Button>
                  <select
                    className="stack-viewer-action-select"
                    value=""
                    onChange={(event) => handleAction(instanceId, event.target.value as CardAction)}
                  >
                    <option value="" disabled>
                      操作...
                    </option>
                    <option value="hand">手札へ加える</option>
                    <option value="tableUp">フィールドへ表向きで出す</option>
                    <option value="tableDown">フィールドへ裏向きで出す</option>
                    <option value="deckTop">山札の一番上へ移動</option>
                    <option value="deckBottom">山札の一番下へ移動</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
