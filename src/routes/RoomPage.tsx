import { Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Button } from '../components/common/Button';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { OnlineTableScene } from '../components/online/OnlineTableScene';
import { OnlineCardContextMenu } from '../components/online/OnlineCardContextMenu';
import { OnlineStackContextMenu } from '../components/online/OnlineStackContextMenu';
import { OnlineMultiSelectMenu } from '../components/online/OnlineMultiSelectMenu';
import { OnlineStackViewerPanel } from '../components/online/OnlineStackViewerPanel';
import { OnlineCardPreviewOverlay } from '../components/online/OnlineCardPreviewOverlay';
import { OnlineOperationGuidePanel } from '../components/online/OnlineOperationGuidePanel';
import { OnlineTableThemePanel } from '../components/online/OnlineTableThemePanel';
import { ConnectionStatusBanner } from '../components/online/ConnectionStatusBanner';
import { PlayerListPanel } from '../components/online/PlayerListPanel';
import { InviteLinkBox } from '../components/online/InviteLinkBox';
import { useOnlineStore } from '../store/useOnlineStore';
import { CAMERA_INITIAL_POSITION } from '../lib/tableConstants';
import { getTableThemeById, DEFAULT_TABLE_THEME_ID } from '../config/tableThemes';

const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function RoomPage() {
  const { roomId: urlRoomIdRaw } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const urlRoomId = (urlRoomIdRaw ?? '').toUpperCase();

  const storeRoomId = useOnlineStore((state) => state.roomId);
  const playerId = useOnlineStore((state) => state.playerId);
  const playerName = useOnlineStore((state) => state.playerName);
  const setPlayerName = useOnlineStore((state) => state.setPlayerName);
  const joinRoom = useOnlineStore((state) => state.joinRoom);
  const leaveRoom = useOnlineStore((state) => state.leaveRoom);
  const players = useOnlineStore((state) => state.players);
  const table = useOnlineStore((state) => state.table);
  const connectionStatus = useOnlineStore((state) => state.connectionStatus);
  const errorMessage = useOnlineStore((state) => state.errorMessage);
  const clearSelection = useOnlineStore((state) => state.clearSelection);
  const draggingInstanceId = useOnlineStore((state) => state.draggingInstanceId);
  const cardContextMenu = useOnlineStore((state) => state.cardContextMenu);
  const stackContextMenu = useOnlineStore((state) => state.stackContextMenu);
  const multiSelectContextMenu = useOnlineStore((state) => state.multiSelectContextMenu);
  const stackViewerStackId = useOnlineStore((state) => state.stackViewerStackId);
  const resetTable = useOnlineStore((state) => state.resetTable);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  useEffect(() => {
    useOnlineStore.getState().ensureListeners();
  }, []);

  const isValidRoomId = ROOM_ID_PATTERN.test(urlRoomId);
  const isJoinedHere = storeRoomId === urlRoomId;

  // Auto-rejoin after a browser refresh (store state resets on reload, but
  // playerId/playerName persist in localStorage) - satisfies "再接続".
  useEffect(() => {
    if (!isValidRoomId || isJoinedHere || autoJoinAttempted) return;
    if (!playerName.trim()) return;
    setAutoJoinAttempted(true);
    joinRoom(urlRoomId);
  }, [isValidRoomId, isJoinedHere, autoJoinAttempted, playerName, joinRoom, urlRoomId]);

  useEffect(() => {
    if (!isJoinedHere) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJoinedHere, clearSelection]);

  if (!isValidRoomId) {
    return (
      <div className="screen">
        <p className="empty-state">ルームIDの形式が正しくありません。</p>
        <div className="screen-actions">
          <Button variant="primary" onClick={() => navigate('/online/join')}>
            オンラインルームへ参加
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
        </div>
      </div>
    );
  }

  if (!isJoinedHere) {
    return (
      <div className="screen">
        <ScreenHeader
          title="ルームに参加"
          subtitle={`ルームID: ${urlRoomId}`}
          actions={
            <Button variant="ghost" onClick={() => navigate('/')}>
              メインメニューへ戻る
            </Button>
          }
        />
        <div className="screen-body online-home-body">
          <div className="online-home-card">
            <label className="field-label" htmlFor="room-join-name">
              プレイヤー名
            </label>
            <input
              id="room-join-name"
              className="deck-name-input"
              value={playerName}
              maxLength={20}
              placeholder="例: こうき"
              onChange={(event) => setPlayerName(event.target.value)}
            />
            {connectionStatus === 'error' && errorMessage && <p className="online-home-hint online-home-error">{errorMessage}</p>}
            <Button
              variant="primary"
              disabled={playerName.trim().length < 1 || connectionStatus === 'connecting'}
              onClick={() => joinRoom(urlRoomId)}
            >
              {connectionStatus === 'connecting' ? '参加中...' : 'このルームに参加する'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const theme = getTableThemeById(table?.selectedThemeId ?? DEFAULT_TABLE_THEME_ID);
  const cameraEnabled = !draggingInstanceId && !cardContextMenu && !stackContextMenu && !multiSelectContextMenu;

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleResetTable = () => {
    if (!window.confirm('テーブルをリセットしますか？\nすべてのカードを回収して山札をシャッフルします。')) return;
    resetTable();
  };

  return (
    <div className="play-screen" onContextMenu={(event) => event.preventDefault()}>
      <ErrorBoundary fallback={<div className="canvas-error-fallback">3D表示でエラーが発生しました。</div>}>
        <Canvas shadows camera={{ position: CAMERA_INITIAL_POSITION, fov: 45 }}>
          <Suspense fallback={null}>
            <OnlineTableScene controlsRef={controlsRef} cameraEnabled={cameraEnabled} theme={theme} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      <div className="play-topbar">
        <div className="play-topbar-actions">
          <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
          <Button size="sm" onClick={() => controlsRef.current?.reset()}>
            カメラ初期位置へ戻す
          </Button>
          <OnlineTableThemePanel />
          <Button size="sm" variant="danger" onClick={handleResetTable}>
            テーブルリセット
          </Button>
          <Button size="sm" variant="danger" onClick={handleLeave}>
            ルームから退出
          </Button>
        </div>

        <div className="room-info-panel">
          <InviteLinkBox roomId={urlRoomId} />
          <PlayerListPanel players={players} myPlayerId={playerId} />
        </div>
      </div>

      <ConnectionStatusBanner />
      <OnlineOperationGuidePanel />
      <OnlineCardPreviewOverlay />
      <OnlineCardContextMenu />
      <OnlineStackContextMenu />
      <OnlineMultiSelectMenu />
      {stackViewerStackId && <OnlineStackViewerPanel />}
    </div>
  );
}
