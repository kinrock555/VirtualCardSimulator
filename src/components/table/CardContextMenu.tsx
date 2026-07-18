import { useTableStore } from '../../store/useTableStore';

export function CardContextMenu() {
  const contextMenu = useTableStore((state) => state.contextMenu);
  const instance = useTableStore((state) =>
    state.contextMenu ? state.instances.find((i) => i.instanceId === state.contextMenu?.instanceId) : undefined,
  );
  const setFaceUp = useTableStore((state) => state.setFaceUp);
  const rotateInstance = useTableStore((state) => state.rotateInstance);
  const removeInstance = useTableStore((state) => state.removeInstance);
  const closeContextMenu = useTableStore((state) => state.closeContextMenu);

  if (!contextMenu || !instance) return null;

  const runAndClose = (action: () => void) => {
    action();
    closeContextMenu();
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={closeContextMenu}
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
          onClick={() => runAndClose(() => removeInstance(instance.instanceId))}
        >
          テーブルから取り除く
        </button>
        <button className="card-context-menu-item" onClick={closeContextMenu}>
          キャンセル
        </button>
      </div>
    </>
  );
}
