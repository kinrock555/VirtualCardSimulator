import { useState } from 'react';
import { useOnlineStore } from '../../store/useOnlineStore';
import { DrawCountDialog } from '../table/DrawCountDialog';

type DrawDialogState = { stackId: string; maxCount: number };

export function OnlineStackContextMenu() {
  const [drawDialog, setDrawDialog] = useState<DrawDialogState | null>(null);
  const stackContextMenu = useOnlineStore((state) => state.stackContextMenu);
  const stack = useOnlineStore((state) =>
    state.stackContextMenu && state.table ? state.table.stacks.find((s) => s.stackId === state.stackContextMenu?.stackId) : undefined,
  );
  const shuffleStack = useOnlineStore((state) => state.shuffleStack);
  const drawOne = useOnlineStore((state) => state.drawOne);
  const drawMultiple = useOnlineStore((state) => state.drawMultiple);
  const revealTop = useOnlineStore((state) => state.revealTop);
  const returnAllToDeck = useOnlineStore((state) => state.returnAllToDeck);
  const unstackCustomStack = useOnlineStore((state) => state.unstackCustomStack);
  const moveCardZone = useOnlineStore((state) => state.moveCardZone);
  const openStackViewer = useOnlineStore((state) => state.openStackViewer);
  const beginPlaceStack = useOnlineStore((state) => state.beginPlaceStack);
  const closeStackContextMenu = useOnlineStore((state) => state.closeStackContextMenu);

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
    drawMultiple(drawDialog.stackId, count);
    setDrawDialog(null);
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
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => drawOne(stack.stackId))}>
                  1枚ドロー
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={handleOpenDrawDialog}>
                  複数枚ドロー
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => revealTop(stack.stackId))}>
                  一番上のカードをめくる
                </button>
                <div className="card-context-menu-divider" />
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る（自分だけ確認）
                </button>
                <button
                  className="card-context-menu-item"
                  onClick={() => runAndClose(() => beginPlaceStack(stack.stackId))}
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
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => drawOne(stack.stackId))}>
                  一番上から1枚取る
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => revealTop(stack.stackId))}>
                  一番上をめくる
                </button>
                <div className="card-context-menu-divider" />
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る（自分だけ確認）
                </button>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => beginPlaceStack(stack.stackId))}>
                  束を移動
                </button>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => unstackCustomStack(stack.stackId))}>
                  束を解除
                </button>
                <div className="card-context-menu-divider" />
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => stack.cardInstanceIds.forEach((id) => moveCardZone(id, 'graveyard')))}
                >
                  墓地へ送る
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty}
                  onClick={() => runAndClose(() => stack.cardInstanceIds.forEach((id) => moveCardZone(id, 'banished')))}
                >
                  除外する
                </button>
              </>
            )}

            {(stack.type === 'graveyard' || stack.type === 'banished') && (
              <>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => openStackViewer(stack.stackId))}>
                  中身を見る（自分だけ確認）
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => drawOne(stack.stackId))}>
                  一番上を手札へ加える
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => revealTop(stack.stackId))}>
                  一番上をフィールドへ出す
                </button>
                <button className="card-context-menu-item" disabled={isEmpty} onClick={() => runAndClose(() => returnAllToDeck(stack.stackId))}>
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
        <DrawCountDialog maxCount={drawDialog.maxCount} onConfirm={handleConfirmDraw} onCancel={() => setDrawDialog(null)} />
      )}
    </>
  );
}
