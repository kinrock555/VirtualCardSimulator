import { useTableStore } from '../../store/useTableStore';

export function CardContextMenu() {
  const contextMenu = useTableStore((state) => state.cardContextMenu);
  const instance = useTableStore((state) =>
    state.cardContextMenu ? state.cardInstances[state.cardContextMenu.instanceId] : undefined,
  );
  const setFaceUp = useTableStore((state) => state.setFaceUp);
  const rotateInstance = useTableStore((state) => state.rotateInstance);
  const removeInstance = useTableStore((state) => state.removeInstance);
  const returnCardToHand = useTableStore((state) => state.returnCardToHand);
  const closeCardContextMenu = useTableStore((state) => state.closeCardContextMenu);

  if (!contextMenu || !instance) return null;

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
          onClick={() => runAndClose(() => setFaceUp(instance.instanceId, true))}
        >
          表向きにする
        </button>
        <button
          className="card-context-menu-item"
          disabled={!instance.faceUp}
          onClick={() => runAndClose(() => setFaceUp(instance.instanceId, false))}
        >
          裏向きにする
        </button>
        <div className="card-context-menu-divider" />
        <button
          className="card-context-menu-item"
          onClick={() => runAndClose(() => rotateInstance(instance.instanceId, 'right'))}
        >
          右へ90度回転
        </button>
        <button
          className="card-context-menu-item"
          onClick={() => runAndClose(() => rotateInstance(instance.instanceId, 'left'))}
        >
          左へ90度回転
        </button>
        <div className="card-context-menu-divider" />
        <button
          className="card-context-menu-item"
          onClick={() => runAndClose(() => returnCardToHand(instance.instanceId))}
        >
          手札へ戻す
        </button>
        <button
          className="card-context-menu-item"
          onClick={() => runAndClose(() => removeInstance(instance.instanceId))}
        >
          テーブルから取り除く
        </button>
        <button className="card-context-menu-item" onClick={closeCardContextMenu}>
          キャンセル
        </button>
      </div>
    </>
  );
}
