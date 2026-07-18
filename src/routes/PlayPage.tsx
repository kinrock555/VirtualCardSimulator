import { Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Button } from '../components/common/Button';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { TableScene } from '../components/table/TableScene';
import { CardContextMenu } from '../components/table/CardContextMenu';
import { StackContextMenu } from '../components/table/StackContextMenu';
import { MultiSelectContextMenu } from '../components/table/MultiSelectContextMenu';
import { StackViewerPanel } from '../components/table/StackViewerPanel';
import { CardPreviewOverlay } from '../components/table/CardPreviewOverlay';
import { OperationGuidePanel } from '../components/table/OperationGuidePanel';
import { TableThemePanel } from '../components/table/TableThemePanel';
import { BoardManagerPanel } from '../components/table/BoardManagerPanel';
import { HandPanel } from '../components/table/HandPanel';
import { OpponentHandRack } from '../components/table/OpponentHandRack';
import { PlayerSwitchOverlay } from '../components/table/PlayerSwitchOverlay';
import { useDeckStore } from '../store/useDeckStore';
import { useTableStore } from '../store/useTableStore';
import { PLAY_CAMERA_INITIAL_POSITION } from '../lib/tableConstants';
import { getTableThemeById } from '../config/tableThemes';
import { getRoomEnvironmentById } from '../config/roomEnvironments';

export function PlayPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const getDeckById = useDeckStore((state) => state.getDeckById);
  const loadDeck = useTableStore((state) => state.loadDeck);
  const resetTable = useTableStore((state) => state.resetTable);
  const clearSelection = useTableStore((state) => state.clearSelection);
  const draggingInstanceId = useTableStore((state) => state.draggingInstanceId);
  const cardContextMenu = useTableStore((state) => state.cardContextMenu);
  const stackContextMenu = useTableStore((state) => state.stackContextMenu);
  const multiSelectContextMenu = useTableStore((state) => state.multiSelectContextMenu);
  const stackViewerStackId = useTableStore((state) => state.stackViewerStackId);
  const selectedThemeId = useTableStore((state) => state.selectedThemeId);
  const selectedRoomEnvironmentId = useTableStore((state) => state.selectedRoomEnvironmentId);
  const cameraView = useTableStore((state) => state.cameraView);
  const toggleCameraView = useTableStore((state) => state.toggleCameraView);
  const pendingSessionConfig = useTableStore((state) => state.pendingSessionConfig);
  const startTestSession = useTableStore((state) => state.startTestSession);
  const players = useTableStore((state) => state.players);
  const currentPlayerIndex = useTableStore((state) => state.currentPlayerIndex);
  const switchToPlayer = useTableStore((state) => state.switchToPlayer);
  const awaitingHandReveal = useTableStore((state) => state.awaitingHandReveal);
  const revealHand = useTableStore((state) => state.revealHand);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const deck = deckId ? getDeckById(deckId) : undefined;
  const theme = getTableThemeById(selectedThemeId);
  const roomEnvironment = getRoomEnvironmentById(selectedRoomEnvironmentId);
  const isMultiplayer = players.length > 1;
  const activePlayer = isMultiplayer ? players[currentPlayerIndex] : undefined;
  const opponentPlayer = isMultiplayer ? players[(currentPlayerIndex + 1) % players.length] : undefined;

  useEffect(() => {
    // A 2-player session queued by PlaySetupPage takes priority over the
    // plain single-deck load - both branches fully replace the table state,
    // so only one of them should ever run per mount.
    if (pendingSessionConfig) {
      startTestSession(pendingSessionConfig);
    } else if (deck) {
      loadDeck(deck);
    }
    // Reload only when switching decks - deck object identity changes on save,
    // which would otherwise wipe in-progress table state every autosave-like edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
        return;
      }
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      const menuOrModalOpen = Boolean(
        cardContextMenu || stackContextMenu || multiSelectContextMenu || stackViewerStackId,
      );
      if (event.key.toLowerCase() === 'v') {
        if (isTyping || menuOrModalOpen) return;
        toggleCameraView();
        return;
      }
      if (event.key === 'Tab') {
        // Supplementary-only shortcut: the "プレイヤー交代" button is the
        // required way to switch players. Leave normal Tab focus navigation
        // alone whenever an input/modal is active, in single-player sessions,
        // or while the handoff confirmation screen is already showing.
        if (isTyping || menuOrModalOpen || players.length < 2 || awaitingHandReveal) return;
        event.preventDefault();
        switchToPlayer((currentPlayerIndex + 1) % players.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clearSelection,
    toggleCameraView,
    cardContextMenu,
    stackContextMenu,
    multiSelectContextMenu,
    stackViewerStackId,
    players.length,
    awaitingHandReveal,
    switchToPlayer,
    currentPlayerIndex,
  ]);

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

  const cameraEnabled = !draggingInstanceId && !cardContextMenu && !stackContextMenu && !multiSelectContextMenu;

  const handleResetTable = () => {
    const confirmed = window.confirm(
      'テーブルをリセットしますか？\nすべてのカードを回収して山札をシャッフルします。',
    );
    if (!confirmed) return;
    resetTable();
  };

  return (
    <div className="play-screen" onContextMenu={(event) => event.preventDefault()}>
      <div className="play-field">
        <ErrorBoundary
          fallback={<div className="canvas-error-fallback">3D表示でエラーが発生しました。</div>}
        >
          <Canvas
            shadows
            camera={{ position: PLAY_CAMERA_INITIAL_POSITION, fov: 45 }}
            onCreated={({ gl }) => {
              // Brighter, more natural-looking card colors (see README「フィールドの明るさ改善」).
              gl.outputColorSpace = SRGBColorSpace;
              gl.toneMapping = ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.1;
            }}
          >
            <Suspense fallback={null}>
              <TableScene
                controlsRef={controlsRef}
                cameraEnabled={cameraEnabled}
                theme={theme}
                roomEnvironment={roomEnvironment}
                cameraView={cameraView}
                cameraResetToken={cameraResetToken}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>

        <div className="play-topbar">
          {isMultiplayer && activePlayer && (
            <div className="play-topbar-player-info">
              現在のプレイヤー：{activePlayer.name}
              <Button size="sm" onClick={() => switchToPlayer((currentPlayerIndex + 1) % players.length)}>
                プレイヤー交代
              </Button>
            </div>
          )}
          <div className="play-topbar-actions">
            <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
              メインメニューへ戻る
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/decks')}>
              デッキ編集へ戻る
            </Button>
            <Button size="sm" onClick={() => setCameraResetToken((token) => token + 1)}>
              カメラ初期位置へ戻す
            </Button>
            <Button size="sm" onClick={toggleCameraView}>
              視点：{cameraView === 'top' ? '真上' : '斜め'}
            </Button>
            <TableThemePanel />
            <BoardManagerPanel controlsRef={controlsRef} />
            <Button size="sm" variant="danger" onClick={handleResetTable}>
              テーブルリセット
            </Button>
          </div>
        </div>

        {isMultiplayer && opponentPlayer && <OpponentHandRack name={opponentPlayer.name} count={opponentPlayer.hand.length} />}

        <OperationGuidePanel />
        <CardPreviewOverlay />
        <CardContextMenu />
        <StackContextMenu />
        <MultiSelectContextMenu />
        {stackViewerStackId && <StackViewerPanel />}
      </div>

      <HandPanel />

      {isMultiplayer && awaitingHandReveal && activePlayer && (
        <PlayerSwitchOverlay incomingPlayerName={activePlayer.name} onReveal={revealHand} />
      )}
    </div>
  );
}
