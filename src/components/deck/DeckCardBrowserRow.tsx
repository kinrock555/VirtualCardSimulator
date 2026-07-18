import type { CardMaster } from '../../types/card';
import { Button } from '../common/Button';

type DeckCardBrowserRowProps = {
  card: CardMaster;
  disabled: boolean;
  onAdd: (cardId: string) => void;
  isSelected: boolean;
  onToggleSelect: (cardId: string) => void;
};

export function DeckCardBrowserRow({ card, disabled, onAdd, isSelected, onToggleSelect }: DeckCardBrowserRowProps) {
  return (
    <div
      className={`deck-browser-card${isSelected ? ' selected' : ''}`}
      onClick={() => onToggleSelect(card.id)}
      role="button"
      tabIndex={0}
    >
      <input
        type="checkbox"
        className="deck-browser-card-checkbox"
        checked={isSelected}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggleSelect(card.id)}
        aria-label={`${card.name}を選択`}
      />
      <div className="deck-browser-card-thumb">
        <img src={card.imagePath} alt={card.name} loading="lazy" />
      </div>
      <div className="deck-browser-card-name">{card.name}</div>
      <Button
        variant="primary"
        size="sm"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onAdd(card.id);
        }}
      >
        追加
      </Button>
    </div>
  );
}
