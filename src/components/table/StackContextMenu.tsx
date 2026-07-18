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
  const players = useTableStore((state) => state.players);
  const currentPlayerIndex = useTableStore((state) => state.currentPlayerIndex);
  const sharedDeckStackId = useTableStore((state) => state.sharedDeckStackId);
  const shuffleStack = useTableStore((state) => state.shuffleStack);
  const moveStackTopToHand = useTableStore((state) => state.moveStackTopToHand);
  const moveStackTopToTable = useTableStore((state) => state.moveStackTopToTable);
  const drawMultipleFromStack = useTableStore((state) => state.drawMultipleFromStack);
  const unstackCustomStack = useTableStore((state) => state.unstackCustomStack);
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

  // In 2-player per-deck modes (mirroredDecks/separateDecks), each player has
  // their own deck stack - drawing/revealing/peeking from the OTHER player's
  // deck would both act on the wrong hand and leak that deck's contents, so
  // those actions are disabled for a deck stack that isn't the shared pool or
  // the active player's own. Shuffling/moving the pile is still harmless.
  const activePlayer = players[currentPlayerIndex];
  const isOpponentDeck =
    Boolean(stack) &&
    stack!.type === 'mainDeck' &&
    players.length > 1 &&
    sharedDeckStackId !== stack!.stackId &&
    activePlayer?.deckStackId !== stack!.stackId;

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
            {isOpponentDeck && <div className="card-context-menu-heading">相手の山札のため一部操作できません</div>}
            {stack.type === 'mainDeck' && (
              <>
                <button className="card-context-menu-item" onClick={() => runAndClose(() => shuffleStack(stack.stackId))}>
                  シャッフル
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty || isOpponentDeck}
                  onClick={() => runAndClose(() => moveStackTopToHand(stack.stackId))}
                >
                  1枚ドロー
                </button>
                <button className="card-context-menu-item" disabled={isEmpty || isOpponentDeck} onClick={handleOpenDrawDialog}>
                  複数枚ドロー
                </button>
                <button
                  className="card-context-menu-item"
                  disabled={isEmpty || isOpponentDeck}
                  onClick={() => runAndClose(() => moveStackTopToTable(stack.stackId))}
                >
                  一番上のカードをめくる
                </button>
                <div className="card-context-menu-divider" />
                <button
                  className="card-context-menu-item"
                  disabled={isOpponentDeck}
                  onClick={() => runAndClose(() => openStackViewer(stack.stackId))}
                >
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
