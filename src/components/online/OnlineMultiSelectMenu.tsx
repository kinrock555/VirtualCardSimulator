import { useOnlineStore } from '../../store/useOnlineStore';

export function OnlineMultiSelectMenu() {
  const multiSelectContextMenu = useOnlineStore((state) => state.multiSelectContextMenu);
  const selectedInstanceIds = useOnlineStore((state) => state.selectedInstanceIds);
  const createStackFromSelection = useOnlineStore((state) => state.createStackFromSelection);
  const clearSelection = useOnlineStore((state) => state.clearSelection);
  const closeMultiSelectContextMenu = useOnlineStore((state) => state.closeMultiSelectContextMenu);

  if (!multiSelectContextMenu || selectedInstanceIds.length < 2) return null;

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
        <div className="card-context-menu-heading">{selectedInstanceIds.length}枚選択中</div>
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
