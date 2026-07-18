import { useTableStore } from '../../store/useTableStore';
import { useUiStore } from '../../store/useUiStore';

export function DeckContextMenu() {
  const deckContextMenu = useTableStore((state) => state.deckContextMenu);
  const deckCount = useTableStore((state) => state.deckStack.length);
  const shuffleDeck = useTableStore((state) => state.shuffleDeck);
  const drawCard = useTableStore((state) => state.drawCard);
  const revealTopCard = useTableStore((state) => state.revealTopCard);
  const beginPlaceDeck = useTableStore((state) => state.beginPlaceDeck);
  const closeDeckContextMenu = useTableStore((state) => state.closeDeckContextMenu);
  const showNotification = useUiStore((state) => state.showNotification);

  if (!deckContextMenu) return null;

  const runAndClose = (action: () => void) => {
    action();
    closeDeckContextMenu();
  };

  const isEmpty = deckCount === 0;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={closeDeckContextMenu}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="card-context-menu" style={{ left: deckContextMenu.x, top: deckContextMenu.y }}>
        <button className="card-context-menu-item" onClick={() => runAndClose(shuffleDeck)}>
          シャッフル
        </button>
        <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(drawCard)}>
          1枚ドロー
        </button>
        <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(revealTopCard)}>
          一番上のカードをめくる
        </button>
        <div className="card-context-menu-divider" />
        <button
          className="card-context-menu-item"
          onClick={() =>
            runAndClose(() => {
              beginPlaceDeck();
              showNotification('山札の移動先をテーブル上でクリックしてください');
            })
          }
        >
          山札を移動
        </button>
        <button className="card-context-menu-item" onClick={closeDeckContextMenu}>
          キャンセル
        </button>
      </div>
    </>
  );
}
