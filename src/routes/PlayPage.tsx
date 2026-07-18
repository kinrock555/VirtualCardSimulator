import { Suspense, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Button } from '../components/common/Button';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { TableScene } from '../components/table/TableScene';
import { CardContextMenu } from '../components/table/CardContextMenu';
import { DeckContextMenu } from '../components/table/DeckContextMenu';
import { CardPreviewOverlay } from '../components/table/CardPreviewOverlay';
import { OperationGuidePanel } from '../components/table/OperationGuidePanel';
import { TableThemePanel } from '../components/table/TableThemePanel';
import { useDeckStore } from '../store/useDeckStore';
import { useTableStore } from '../store/useTableStore';
import { CAMERA_INITIAL_POSITION } from '../lib/tableConstants';
import { getTableThemeById } from '../config/tableThemes';

export function PlayPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const getDeckById = useDeckStore((state) => state.getDeckById);
  const loadDeck = useTableStore((state) => state.loadDeck);
  const resetTable = useTableStore((state) => state.resetTable);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const cardContextMenu = useTableStore((state) => state.cardContextMenu);
  const deckContextMenu = useTableStore((state) => state.deckContextMenu);
  const selectedThemeId = useTableStore((state) => state.selectedThemeId);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const deck = deckId ? getDeckById(deckId) : undefined;
  const theme = getTableThemeById(selectedThemeId);

  useEffect(() => {
    if (deck) loadDeck(deck);
    // Reload only when switching decks - deck object identity changes on save,
    // which would otherwise wipe in-progress table state every autosave-like edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  if (!deckId || !deck) {
    return (
      <div className="screen">
        <p className="empty-state">
          デッキが見つかりません。デッキ編集画面から「テストプレイ」を選択してください。
        </p>
        <div className="screen-actions">
          <Button variant="primary" onClick={() => navigate('/decks')}>
            デッキ編集へ
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
        </div>
      </div>
    );
  }

  const cameraEnabled = !draggingInstanceId && !cardContextMenu && !deckContextMenu;

  const handleResetTable = () => {
    const confirmed = window.confirm(
      'テーブルをリセットしますか？\nすべてのカードを回収して山札をシャッフルします。',
    );
    if (!confirmed) return;
    resetTable();
  };

  return (
    <div className="play-screen" onContextMenu={(event) => event.preventDefault()}>
      <ErrorBoundary
        fallback={<div className="canvas-error-fallback">3D表示でエラーが発生しました。</div>}
      >
        <Canvas shadows camera={{ position: CAMERA_INITIAL_POSITION, fov: 45 }}>
          <Suspense fallback={null}>
            <TableScene controlsRef={controlsRef} cameraEnabled={cameraEnabled} theme={theme} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      <div className="play-topbar">
        <div className="play-topbar-actions">
          <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate('/decks')}>
            デッキ編集へ戻る
          </Button>
          <Button size="sm" onClick={() => controlsRef.current?.reset()}>
            カメラ初期位置へ戻す
          </Button>
          <TableThemePanel />
          <Button size="sm" variant="danger" onClick={handleResetTable}>
            テーブルリセット
          </Button>
        </div>
      </div>

      <OperationGuidePanel />
      <CardPreviewOverlay />
      <CardContextMenu />
      <DeckContextMenu />
    </div>
  );
}
