import { useOnlineStore } from '../../store/useOnlineStore';

export function OnlineCardContextMenu() {
  const contextMenu = useOnlineStore((state) => state.cardContextMenu);
  const instance = useOnlineStore((state) =>
    state.cardContextMenu && state.table ? state.table.cardInstances[state.cardContextMenu.instanceId] : undefined,
  );
  const flipCard = useOnlineStore((state) => state.flipCard);
  const rotateCard = useOnlineStore((state) => state.rotateCard);
  const moveCardZone = useOnlineStore((state) => state.moveCardZone);
  const closeCardContextMenu = useOnlineStore((state) => state.closeCardContextMenu);

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
        <button className="card-context-menu-item" disabled={instance.faceUp} onClick={() => runAndClose(() => flipCard(id, true))}>
          表向きにする
        </button>
        <button className="card-context-menu-item" disabled={!instance.faceUp} onClick={() => runAndClose(() => flipCard(id, false))}>
          裏向きにする
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateCard(id, 'right'))}>
          右へ90度回転
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateCard(id, 'left'))}>
          左へ90度回転
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardZone(id, 'hand'))}>
          手札へ戻す
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardZone(id, 'deckTop'))}>
          山札の上へ戻す
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardZone(id, 'deckBottom'))}>
          山札の下へ戻す
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardZone(id, 'graveyard'))}>
          墓地へ送る
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardZone(id, 'banished'))}>
          除外する
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={closeCardContextMenu}>
          キャンセル
        </button>
      </div>
    </>
  );
}
