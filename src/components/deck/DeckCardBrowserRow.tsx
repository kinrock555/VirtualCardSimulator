import type { CardMaster } from '../../types/card';
import { Button } from '../common/Button';

type DeckCardBrowserRowProps = {
  card: CardMaster;
  disabled: boolean;
  onAdd: (cardId: string) => void;
};

export function DeckCardBrowserRow({ card, disabled, onAdd }: DeckCardBrowserRowProps) {
  return (
    <div className="deck-browser-card">
      <div className="deck-browser-card-thumb">
        <img src={card.imagePath} alt={card.name} loading="lazy" />
      </div>
      <div className="deck-browser-card-name">{card.name}</div>
      <Button variant="primary" size="sm" disabled={disabled} onClick={() => onAdd(card.id)}>
        追加
      </Button>
    </div>
  );
}
