import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { CardGrid } from '../components/box/CardGrid';
import { CardPreviewPanel } from '../components/box/CardPreviewPanel';
import { useCardMasterStore } from '../store/useCardMasterStore';
import { useUiStore } from '../store/useUiStore';

export function BoxPage() {
  const navigate = useNavigate();
  const cards = useCardMasterStore((state) => state.cards);
  const updateCardName = useCardMasterStore((state) => state.updateCardName);
  const searchQuery = useUiStore((state) => state.boxSearchQuery);
  const setSearchQuery = useUiStore((state) => state.setBoxSearchQuery);
  const selectedCardId = useUiStore((state) => state.boxSelectedCardId);
  const setSelectedCardId = useUiStore((state) => state.setBoxSelectedCardId);

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) => card.name.toLowerCase().includes(query));
  }, [cards, searchQuery]);

  const selectedCard = cards.find((card) => card.id === selectedCardId);

  return (
    <div className="screen">
      <ScreenHeader
        title="BOX"
        subtitle="カード原本ライブラリ"
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/')}>
              メインメニューへ戻る
            </Button>
            <Button variant="primary" onClick={() => navigate('/decks')}>
              デッキ編集へ
            </Button>
          </>
        }
      />

      <div className="screen-body box-layout">
        <div className="box-main">
          <input
            className="search-input"
            type="text"
            placeholder="カード名で検索"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="card-grid-scroll">
            <CardGrid cards={filteredCards} selectedCardId={selectedCardId} onSelect={setSelectedCardId} />
          </div>
        </div>

        <CardPreviewPanel card={selectedCard} onRename={updateCardName} />
      </div>
    </div>
  );
}
