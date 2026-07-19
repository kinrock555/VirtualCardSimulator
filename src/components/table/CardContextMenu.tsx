import { useTableStore } from '../../store/useTableStore';
import { useUiStore } from '../../store/useUiStore';

export function CardContextMenu() {
  const contextMenu = useTableStore((state) => state.cardContextMenu);
  const instance = useTableStore((state) =>
    state.cardContextMenu ? state.cardInstances[state.cardContextMenu.instanceId] : undefined,
  );
  const setFaceUp = useTableStore((state) => state.setFaceUp);
  const rotateInstances = useTableStore((state) => state.rotateInstances);
  const removeInstances = useTableStore((state) => state.removeInstances);
  const moveCardsToHand = useTableStore((state) => state.moveCardsToHand);
  const moveCardsToMainDeckTop = useTableStore((state) => state.moveCardsToMainDeckTop);
  const moveCardsToMainDeckBottom = useTableStore((state) => state.moveCardsToMainDeckBottom);
  const closeCardContextMenu = useTableStore((state) => state.closeCardContextMenu);
  const canPeekCard = useTableStore((state) => state.canPeekCard);
  const beginPeekCard = useTableStore((state) => state.beginPeekCard);
  const showNotification = useUiStore((state) => state.showNotification);

  if (!contextMenu || !instance) return null;

  const id = instance.instanceId;
  const runAndClose = (action: () => void) => {
    action();
    closeCardContextMenu();
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={closeCardContextMenu}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="card-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
        <button
          className="card-context-menu-item"
          disabled={instance.faceUp}
          onClick={() => runAndClose(() => setFaceUp([id], true))}
        >
          表向きにする
        </button>
        <button
          className="card-context-menu-item"
          disabled={!instance.faceUp}
          onClick={() => runAndClose(() => setFaceUp([id], false))}
        >
          裏向きにする
        </button>
        {!instance.faceUp && (
          <button
            className="card-context-menu-item"
            onClick={() =>
              runAndClose(() => {
                if (canPeekCard(id)) {
                  beginPeekCard(id);
                } else {
                  showNotification('このカードは確認できません');
                }
              })
            }
          >
            自分だけ確認
          </button>
        )}
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateInstances([id], 'right'))}>
          右へ90度回転
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateInstances([id], 'left'))}>
          左へ90度回転
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardsToHand([id]))}>
          手札へ戻す
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardsToMainDeckTop([id]))}>
          山札の上へ戻す
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardsToMainDeckBottom([id]))}>
          山札の下へ戻す
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => removeInstances([id]))}>
          テーブルから取り除く
        </button>
        <button className="card-context-menu-item" onClick={closeCardContextMenu}>
          キャンセル
        </button>
      </div>
    </>
  );
}
