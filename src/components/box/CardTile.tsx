import type { CardMaster } from '../../types/card';

type CardTileProps = {
  card: CardMaster;
  selected: boolean;
  onSelect: (cardId: string) => void;
};

export function CardTile({ card, selected, onSelect }: CardTileProps) {
  return (
    <div
      className={`card-tile${selected ? ' selected' : ''}`}
      onClick={() => onSelect(card.id)}
      role="button"
      tabIndex={0}
    >
      <div className="card-tile-thumb">
        <img src={card.imagePath} alt={card.name} loading="lazy" />
      </div>
      <div className="card-tile-name">{card.name}</div>
    </div>
  );
}
