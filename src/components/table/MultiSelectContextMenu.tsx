import { useTableStore } from '../../store/useTableStore';

export function MultiSelectContextMenu() {
  const multiSelectContextMenu = useTableStore((state) => state.multiSelectContextMenu);
  const selectedInstanceIds = useTableStore((state) => state.selectedInstanceIds);
  const setFaceUp = useTableStore((state) => state.setFaceUp);
  const rotateInstances = useTableStore((state) => state.rotateInstances);
  const moveCardsToHand = useTableStore((state) => state.moveCardsToHand);
  const createStackFromSelection = useTableStore((state) => state.createStackFromSelection);
  const clearSelection = useTableStore((state) => state.clearSelection);
  const closeMultiSelectContextMenu = useTableStore((state) => state.closeMultiSelectContextMenu);

  if (!multiSelectContextMenu || selectedInstanceIds.length < 2) return null;

  const ids = selectedInstanceIds;
  const runAndClose = (action: () => void) => {
    action();
    closeMultiSelectContextMenu();
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={closeMultiSelectContextMenu}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="card-context-menu" style={{ left: multiSelectContextMenu.x, top: multiSelectContextMenu.y }}>
        <div className="card-context-menu-heading">{ids.length}枚選択中</div>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => setFaceUp(ids, true))}>
          表向きにする
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => setFaceUp(ids, false))}>
          裏向きにする
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateInstances(ids, 'right'))}>
          右へ90度回転
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(() => rotateInstances(ids, 'left'))}>
          左へ90度回転
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(() => moveCardsToHand(ids))}>
          手札へ戻す
        </button>
        <div className="card-context-menu-divider" />
        <button className="card-context-menu-item" onClick={() => runAndClose(createStackFromSelection)}>
          束にする
        </button>
        <button className="card-context-menu-item" onClick={() => runAndClose(clearSelection)}>
          選択解除
        </button>
      </div>
    </>
  );
}
