import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { DeckCardBrowserRow } from '../components/deck/DeckCardBrowserRow';
import { DeckCardRow } from '../components/deck/DeckCardRow';
import { useCardMasterStore } from '../store/useCardMasterStore';
import { useDeckStore } from '../store/useDeckStore';
import { useUiStore } from '../store/useUiStore';
import type { DeckCardEntry } from '../types/deck';

export function DeckEditPage() {
  const navigate = useNavigate();
  const cards = useCardMasterStore((state) => state.cards);
  const getCardById = useCardMasterStore((state) => state.getCardById);

  const decks = useDeckStore((state) => state.decks);
  const createDeck = useDeckStore((state) => state.createDeck);
  const duplicateDeck = useDeckStore((state) => state.duplicateDeck);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);
  const renameDeck = useDeckStore((state) => state.renameDeck);
  const saveDeckCards = useDeckStore((state) => state.saveDeckCards);

  const browserQuery = useUiStore((state) => state.deckBrowserSearchQuery);
  const setBrowserQuery = useUiStore((state) => state.setDeckBrowserSearchQuery);
  const editingDeckId = useUiStore((state) => state.editingDeckId);
  const setEditingDeckId = useUiStore((state) => state.setEditingDeckId);
  const showNotification = useUiStore((state) => state.showNotification);

  const [draftName, setDraftName] = useState('');
  const [draftCards, setDraftCards] = useState<DeckCardEntry[]>([]);

  useEffect(() => {
    if (!editingDeckId) {
      setDraftName('');
      setDraftCards([]);
      return;
    }
    const deck = decks.find((d) => d.id === editingDeckId);
    if (deck) {
      setDraftName(deck.name);
      setDraftCards(deck.cards.map((entry) => ({ ...entry })));
    } else {
      setEditingDeckId(null);
    }
    // Only reload the draft when switching which deck is being edited, not on
    // every store update (otherwise unsaved edits would be clobbered).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDeckId]);

  const filteredBrowserCards = useMemo(() => {
    const query = browserQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) => card.name.toLowerCase().includes(query));
  }, [cards, browserQuery]);

  const totalCount = draftCards.reduce((sum, entry) => sum + entry.count, 0);

  const handleAddCard = (cardId: string) => {
    if (!editingDeckId) {
      showNotification('先にデッキを新規作成するか選択してください');
      return;
    }
    setDraftCards((prev) => {
      const existing = prev.find((entry) => entry.cardId === cardId);
      if (existing) {
        return prev.map((entry) => (entry.cardId === cardId ? { ...entry, count: entry.count + 1 } : entry));
      }
      return [...prev, { cardId, count: 1 }];
    });
  };

  const handleIncrement = (cardId: string) => {
    setDraftCards((prev) =>
      prev.map((entry) => (entry.cardId === cardId ? { ...entry, count: entry.count + 1 } : entry)),
    );
  };

  const handleDecrement = (cardId: string) => {
    setDraftCards((prev) =>
      prev.map((entry) =>
        entry.cardId === cardId ? { ...entry, count: Math.max(1, entry.count - 1) } : entry,
      ),
    );
  };

  const handleRemoveEntry = (cardId: string) => {
    setDraftCards((prev) => prev.filter((entry) => entry.cardId !== cardId));
  };

  const handleCreateDeck = () => {
    const deck = createDeck('新しいデッキ');
    setEditingDeckId(deck.id);
  };

  const handleDuplicateDeck = () => {
    if (!editingDeckId) return;
    const copy = duplicateDeck(editingDeckId);
    if (copy) setEditingDeckId(copy.id);
  };

  const handleDeleteDeck = () => {
    if (!editingDeckId) return;
    if (!window.confirm('このデッキを削除しますか？')) return;
    deleteDeck(editingDeckId);
    setEditingDeckId(null);
  };

  const handleSaveDeck = () => {
    if (!editingDeckId) return;
    renameDeck(editingDeckId, draftName);
    saveDeckCards(editingDeckId, draftCards);
    showNotification('デッキを保存しました');
  };

  const handleTestPlay = () => {
    if (!editingDeckId) return;
    navigate(`/play/${editingDeckId}`);
  };

  return (
    <div className="screen">
      <ScreenHeader
        title="デッキ編集"
        subtitle="BOXのカードからテスト用デッキを組み立てます"
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/')}>
              メインメニューへ戻る
            </Button>
            <Button variant="ghost" onClick={() => navigate('/box')}>
              BOXへ
            </Button>
          </>
        }
      />

      <div className="screen-body deck-edit-layout">
        <section className="deck-pane">
          <div className="deck-pane-header">
            <h2 className="deck-pane-title">BOXのカード</h2>
          </div>
          <input
            className="search-input"
            type="text"
            placeholder="カード名で検索"
            value={browserQuery}
            onChange={(event) => setBrowserQuery(event.target.value)}
          />
          <div className="deck-browser-list">
            {filteredBrowserCards.length === 0 && (
              <p className="empty-state">カードが見つかりません。</p>
            )}
            {filteredBrowserCards.map((card) => (
              <DeckCardBrowserRow key={card.id} card={card} disabled={!editingDeckId} onAdd={handleAddCard} />
            ))}
          </div>
        </section>

        <section className="deck-pane">
          <div className="deck-pane-header">
            <h2 className="deck-pane-title">デッキ</h2>
            <div className="row-gap-sm">
              <select
                className="deck-select-dropdown"
                value={editingDeckId ?? ''}
                onChange={(event) => setEditingDeckId(event.target.value || null)}
              >
                <option value="">保存済みデッキを選択…</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name} ({deck.cards.reduce((sum, c) => sum + c.count, 0)}枚)
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleCreateDeck}>
                新規デッキ
              </Button>
            </div>
          </div>

          {!editingDeckId ? (
            <p className="deck-list-empty-hint">
              上のドロップダウンから編集するデッキを選ぶか、「新規デッキ」で作成してください。
            </p>
          ) : (
            <>
              <div className="row-gap-sm">
                <input
                  className="deck-name-input"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="デッキ名"
                />
                <Button size="sm" onClick={handleDuplicateDeck}>
                  複製
                </Button>
                <Button size="sm" variant="danger" onClick={handleDeleteDeck}>
                  削除
                </Button>
              </div>

              <div className="deck-card-list">
                {draftCards.length === 0 && <p className="empty-state">カードが未追加です。</p>}
                {draftCards.map((entry) => (
                  <DeckCardRow
                    key={entry.cardId}
                    cardId={entry.cardId}
                    card={getCardById(entry.cardId)}
                    count={entry.count}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onRemove={handleRemoveEntry}
                  />
                ))}
              </div>

              <div className="deck-total">
                合計 <strong>{totalCount}</strong> 枚
              </div>

              <div className="row-gap-sm">
                <Button variant="primary" onClick={handleSaveDeck}>
                  保存
                </Button>
                <Button onClick={handleTestPlay}>テストプレイ</Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
