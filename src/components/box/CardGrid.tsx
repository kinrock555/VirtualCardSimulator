import type { CardMaster } from '../../types/card';
import { CardTile } from './CardTile';

type CardGridProps = {
  cards: CardMaster[];
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
};

export function CardGrid({ cards, selectedCardId, onSelect }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        カードが見つかりません。src/assets/cards にPNG/JPEG画像を配置してください。
      </div>
    );
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} selected={card.id === selectedCardId} onSelect={onSelect} />
      ))}
    </div>
  );
}
