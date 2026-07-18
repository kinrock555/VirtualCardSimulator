import { useState } from 'react';
import { useTableStore } from '../../store/useTableStore';
import { useUiStore } from '../../store/useUiStore';
import { DrawCountDialog } from './DrawCountDialog';

type DrawDialogState = { stackId: string; maxCount: number };

export function StackContextMenu() {
  const [drawDialog, setDrawDialog] = useState<DrawDialogState | null>(null);
  const stackContextMenu = useTableStore((state) => state.stackContextMenu);
  const stack = useTableStore((state) =>
    state.stackContextMenu ? state.stacks.find((s) => s.stackId === state.stackContextMenu?.stackId) : undefined,
  );
  const shuffleStack = useTableStore((state) => state.shuffleStack);
  const moveStackTopToHand = useTableStore((state) => state.moveStackTopToHand);
  const moveStackTopToTable = useTableStore((state) => state.moveStackTopToTable);
  const drawMultipleFromStack = useTableStore((state) => state.drawMultipleFromStack);
  const returnAllToMainDeck = useTableStore((state) => state.returnAllToMainDeck);
  const unstackCustomStack = useTableStore((state) => state.unstackCustomStack);
  const moveCardsToGraveyard = useTableStore((state) => state.moveCardsToGraveyard);
  const moveCardsToBanished = useTableStore((state) => state.moveCardsToBanished);
  const openStackViewer = useTableStore((state) => state.openStackViewer);
  const beginPlaceStack = useTableStore((state) => state.beginPlaceStack);
  const closeStackContextMenu = useTableStore((state) => state.closeStackContextMenu);
  const showNotification = useUiStore((state) => state.showNotification);

  const runAndClose = (action: () => void) => {
    action();
    closeStackContextMenu();
  };

  const handleOpenDrawDialog = () => {
    if (!stack) return;
    setDrawDialog({ stackId: stack.stackId, maxCount: stack.cardInstanceIds.length });
    closeStackContextMenu();
  };

  const handleConfirmDraw = (count: number) => {
    if (!drawDialog) return;
    const drawn = drawMultipleFromStack(drawDialog.stackId, count);
    setDrawDialog(null);
    if (drawn < count) {
      showNotification(`山札の残りが${drawn}枚だったため、${drawn}枚だけドローしました。`);
    } else {
      showNotification(`${drawn}枚ドローしました。`);
    }
  };

  const isEmpty = stack ? stack.cardInstanceIds.length === 0 : true;

  return (
    <>
      {stackContextMenu && stack && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={closeStackContextMenu}
            onContextMenu={(event) => event.preventDefault()}
          />
          <div className="card-context-menu" style={{ left: stackContextMenu.x, top: stackContextMenu.y }}>
            {stack.type === 'mainDeck' && (
              <>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => shuffleStack(stack.stackId))}>
                  シャッフル
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToHand(stack.stackId))}
                >
                  1枚ドロー
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={handleOpenDrawDialog}>
                  複数枚ドロー
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToTable(stack.stackId))}
                >
                  一番上のカードをめくる
                </button>
                <div className="card-context-menu-divider" />
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る
                </button>
                <button
                  className="card-context-menu-item"
                  onClick={() =>
                    runAndClose(() => {
                      beginPlaceStack(stack.stackId);
                      showNotification('山札の移動先をテーブル上でクリックしてください');
                    })
                  }
                >
                  山札を移動
                </button>
              </>
            )}

            {stack.type === 'customStack' && (
              <>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => shuffleStack(stack.stackId))}>
                  シャッフル
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToHand(stack.stackId))}
                >
                  一番上から1枚取る
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToTable(stack.stackId))}
                >
                  一番上をめくる
                </button>
                <div className="card-context-menu-divider" />
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る
                </button>
                <button
                  className="card-context-menu-item"
                  onClick={() =>
                    runAndClose(() => {
                      beginPlaceStack(stack.stackId);
                      showNotification('束の移動先をテーブル上でクリックしてください');
                    })
                  }
                >
                  束を移動
                </button>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => unstackCustomStack(stack.stackId))}>
                  束を解除
                </button>
                <div className="card-context-menu-divider" />
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveCardsToGraveyard([...stack.cardInstanceIds]))}
                >
                  墓地へ送る
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveCardsToBanished([...stack.cardInstanceIds]))}
                >
                  除外する
                </button>
              </>
            )}

            {(stack.type === 'graveyard' || stack.type === 'banished') && (
              <>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToHand(stack.stackId))}
                >
                  一番上を手札へ加える
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => moveStackTopToTable(stack.stackId))}
                >
                  一番上をフィールドへ出す
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => returnAllToMainDeck(stack.stackId))}
                >
                  山札へすべて戻す
                </button>
              </>
            )}

            <div className="card-context-menu-divider" />
            <button className="card-context-menu-item" onClick={closeStackContextMenu}>
              キャンセル
            </button>
          </div>
        </>
      )}

      {drawDialog && (
        <DrawCountDialog
          maxCount={drawDialog.maxCount}
          onConfirm={handleConfirmDraw}
          onCancel={() => setDrawDialog(null)}
        />
      )}
    </>
  );
}
