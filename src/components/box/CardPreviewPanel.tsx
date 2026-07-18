import { useEffect, useState } from 'react';
import type { CardMaster } from '../../types/card';

type CardPreviewPanelProps = {
  card: CardMaster | undefined;
  onRename: (cardId: string, name: string) => void;
};

export function CardPreviewPanel({ card, onRename }: CardPreviewPanelProps) {
  const [draftName, setDraftName] = useState('');

  useEffect(() => {
    setDraftName(card?.name ?? '');
  }, [card?.id, card?.name]);

  if (!card) {
    return (
      <aside className="preview-panel">
        <p className="empty-state">カードを選択するとここに拡大表示されます。</p>
      </aside>
    );
  }

  const commitName = () => {
    if (draftName.trim() && draftName.trim() !== card.name) {
      onRename(card.id, draftName);
    } else {
      setDraftName(card.name);
    }
  };

  return (
    <aside className="preview-panel">
      <div className="preview-panel-image">
        <img src={card.imagePath} alt={card.name} />
      </div>
      <div className="stack-gap-sm" style={{ width: '100%' }}>
        <span className="field-label">カード名</span>
        <input
          className="preview-panel-name-input"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              (event.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
    </aside>
  );
}
