import { useState, type RefObject } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Button } from '../common/Button';
import { useTableStore } from '../../store/useTableStore';
import { useSavedBoardsStore } from '../../store/useSavedBoardsStore';
import { useDeckStore } from '../../store/useDeckStore';
import { useUiStore } from '../../store/useUiStore';
import type { BoardCameraState } from '../../types/board';

type BoardManagerPanelProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
};

function readCamera(controlsRef: RefObject<OrbitControlsImpl | null>): BoardCameraState | null {
  const controls = controlsRef.current;
  if (!controls) return null;
  const position = controls.object.position;
  const target = controls.target;
  return {
    position: { x: position.x, y: position.y, z: position.z },
    target: { x: target.x, y: target.y, z: target.z },
  };
}

function applyCamera(controlsRef: RefObject<OrbitControlsImpl | null>, camera: BoardCameraState | null): void {
  const controls = controlsRef.current;
  if (!controls || !camera) return;
  controls.object.position.set(camera.position.x, camera.position.y, camera.position.z);
  controls.target.set(camera.target.x, camera.target.y, camera.target.z);
  controls.update();
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
}

export function BoardManagerPanel({ controlsRef }: BoardManagerPanelProps) {
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const captureSnapshot = useTableStore((state) => state.captureSnapshot);
  const applySnapshot = useTableStore((state) => state.applySnapshot);
  const savedBoards = useSavedBoardsStore((state) => state.savedBoards);
  const saveBoard = useSavedBoardsStore((state) => state.saveBoard);
  const renameBoard = useSavedBoardsStore((state) => state.renameBoard);
  const deleteBoard = useSavedBoardsStore((state) => state.deleteBoard);
  const findByName = useSavedBoardsStore((state) => state.findByName);
  const getDeckById = useDeckStore((state) => state.getDeckById);
  const showNotification = useUiStore((state) => state.showNotification);

  const handleConfirmSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    const existing = findByName(trimmed);
    if (existing && !window.confirm(`「${trimmed}」という保存が既にあります。上書きしますか？`)) return;

    const snapshot = { ...captureSnapshot(), camera: readCamera(controlsRef) };
    saveBoard(trimmed, snapshot);
    showNotification(`盤面「${trimmed}」を保存しました`);
    setSaveName('');
    setIsSaveOpen(false);
  };

  const handleLoad = (id: string) => {
    const board = savedBoards.find((b) => b.id === id);
    if (!board) return;
    if (!window.confirm('現在の盤面を破棄して保存データを読み込みますか？')) return;
    const { warnings } = applySnapshot(board);
    applyCamera(controlsRef, board.camera);
    setIsLoadOpen(false);
    showNotification(warnings.length > 0 ? `読み込みました（注意: ${warnings[0]}）` : `盤面「${board.name}」を読み込みました`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`保存「${name}」を削除しますか？`)) return;
    deleteBoard(id);
  };

  const handleConfirmRename = () => {
    if (!renamingId) return;
    const trimmed = renameDraft.trim();
    if (trimmed) renameBoard(renamingId, trimmed);
    setRenamingId(null);
  };

  return (
    <>
      <Button size="sm" onClick={() => setIsSaveOpen(true)}>
        盤面を保存
      </Button>
      <Button size="sm" onClick={() => setIsLoadOpen(true)}>
        保存した盤面を開く
      </Button>

      {isSaveOpen && (
        <div className="modal-overlay" onClick={() => setIsSaveOpen(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">盤面を保存</h2>
            <label className="board-save-name-row">
              保存名
              <input
                type="text"
                className="deck-name-input"
                placeholder="例: 終盤コンボ確認"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setIsSaveOpen(false)}>
                キャンセル
              </Button>
              <Button variant="primary" disabled={!saveName.trim()} onClick={handleConfirmSave}>
                保存する
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoadOpen && (
        <div className="modal-overlay" onClick={() => setIsLoadOpen(false)}>
          <div className="modal-panel board-load-panel" onClick={(event) => event.stopPropagation()}>
            <div className="stack-viewer-header">
              <h2 className="modal-title">保存した盤面を開く</h2>
              <Button size="sm" variant="ghost" onClick={() => setIsLoadOpen(false)}>
                閉じる
              </Button>
            </div>

            {savedBoards.length === 0 && <p className="empty-state">保存された盤面はまだありません。</p>}

            <div className="board-load-list">
              {savedBoards.map((board) => {
                const deck = board.deckId ? getDeckById(board.deckId) : undefined;
                const deckMissing = board.deckId != null && !deck;
                return (
                  <div key={board.id} className="board-load-row">
                    {renamingId === board.id ? (
                      <div className="board-load-rename-row">
                        <input
                          type="text"
                          className="deck-name-input"
                          value={renameDraft}
                          onChange={(event) => setRenameDraft(event.target.value)}
                          autoFocus
                        />
                        <Button size="sm" variant="primary" onClick={handleConfirmRename}>
                          決定
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                          キャンセル
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="board-load-info">
                          <div className="board-load-name">{board.name}</div>
                          <div className="board-load-meta">
                            使用デッキ: {deck?.name ?? (deckMissing ? '（削除済みデッキ）' : '不明')}
                          </div>
                          <div className="board-load-meta">
                            作成: {formatDateTime(board.createdAt)} / 更新: {formatDateTime(board.updatedAt)}
                          </div>
                        </div>
                        <div className="board-load-actions">
                          <Button size="sm" variant="primary" onClick={() => handleLoad(board.id)}>
                            読み込む
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setRenamingId(board.id);
                              setRenameDraft(board.name);
                            }}
                          >
                            名前変更
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(board.id, board.name)}>
                            削除
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
