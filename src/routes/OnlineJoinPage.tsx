import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { useOnlineStore } from '../store/useOnlineStore';

const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function OnlineJoinPage() {
  const navigate = useNavigate();
  const playerName = useOnlineStore((state) => state.playerName);
  const joinRoom = useOnlineStore((state) => state.joinRoom);
  const connectionStatus = useOnlineStore((state) => state.connectionStatus);

  const [roomIdInput, setRoomIdInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isNameValid = playerName.trim().length >= 1 && playerName.trim().length <= 20;
  const normalizedRoomId = roomIdInput.trim().toUpperCase();
  const isRoomIdValid = ROOM_ID_PATTERN.test(normalizedRoomId);

  const handleJoin = async () => {
    setLocalError(null);
    if (!isRoomIdValid) {
      setLocalError('ルームIDの形式が正しくありません（例: A7K9-PQ2M）');
      return;
    }
    const response = await joinRoom(normalizedRoomId);
    if (response.ok) {
      navigate(`/room/${normalizedRoomId}`);
    } else {
      setLocalError(response.error);
    }
  };

  return (
    <div className="screen">
      <ScreenHeader
        title="オンラインルームへ参加"
        subtitle={`プレイヤー名: ${playerName || '(未設定)'}`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/online')}>
            戻る
          </Button>
        }
      />

      <div className="screen-body online-home-body">
        <div className="online-home-card">
          {!isNameValid && (
            <p className="online-home-hint">
              先に <button className="link-button" onClick={() => navigate('/online')}>プレイヤー名</button> を設定してください。
            </p>
          )}

          <label className="field-label" htmlFor="room-id-input">
            ルームID
          </label>
          <input
            id="room-id-input"
            type="text"
            className="deck-name-input"
            placeholder="例: A7K9-PQ2M"
            value={roomIdInput}
            onChange={(event) => setRoomIdInput(event.target.value)}
          />
          <p className="online-home-hint">招待URLを開いた場合は、そのままそのページでルームに参加できます。</p>

          {localError && <p className="online-home-hint online-home-error">{localError}</p>}

          <Button
            variant="primary"
            disabled={!isNameValid || !isRoomIdValid || connectionStatus === 'connecting'}
            onClick={handleJoin}
          >
            {connectionStatus === 'connecting' ? '参加中...' : '参加する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
