import type { CardMaster } from '../../types/card';
import { Button } from '../common/Button';

type DeckCardRowProps = {
  card: CardMaster | undefined;
  cardId: string;
  count: number;
  onIncrement: (cardId: string) => void;
  onDecrement: (cardId: string) => void;
  onRemove: (cardId: string) => void;
};

export function DeckCardRow({ card, cardId, count, onIncrement, onDecrement, onRemove }: DeckCardRowProps) {
  return (
    <div className="deck-card-row">
      <div className="deck-card-row-thumb">
        {card && <img src={card.imagePath} alt={card.name} loading="lazy" />}
      </div>
      <div className="deck-card-row-name">{card ? card.name : `不明なカード (${cardId})`}</div>
      <div className="deck-card-row-count">
        <Button size="sm" variant="ghost" onClick={() => onDecrement(cardId)} aria-label="1枚減らす">
          −
        </Button>
        <span className="deck-count-value">{count}</span>
        <Button size="sm" variant="ghost" onClick={() => onIncrement(cardId)} aria-label="1枚増やす">
          ＋
        </Button>
      </div>
      <Button size="sm" variant="danger" onClick={() => onRemove(cardId)}>
        外す
      </Button>
    </div>
  );
}
