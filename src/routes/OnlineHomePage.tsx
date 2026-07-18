import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { useOnlineStore } from '../store/useOnlineStore';

export function OnlineHomePage() {
  const navigate = useNavigate();
  const playerName = useOnlineStore((state) => state.playerName);
  const setPlayerName = useOnlineStore((state) => state.setPlayerName);

  const trimmedName = playerName.trim();
  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= 20;

  return (
    <div className="screen">
      <ScreenHeader
        title="オンライン対戦"
        subtitle="2人専用の最小オンライン版（同じ盤面をリアルタイムで共有します）"
        actions={
          <Button variant="ghost" onClick={() => navigate('/')}>
            メインメニューへ戻る
          </Button>
        }
      />

      <div className="screen-body online-home-body">
        <div className="online-home-card">
          <label className="field-label" htmlFor="player-name-input">
            プレイヤー名（1〜20文字）
          </label>
          <input
            id="player-name-input"
            type="text"
            className="deck-name-input"
            value={playerName}
            maxLength={20}
            placeholder="例: こうき"
            onChange={(event) => setPlayerName(event.target.value)}
          />
          {!isNameValid && <p className="online-home-hint">名前を1〜20文字で入力してください。</p>}

          <div className="online-home-actions">
            <Button variant="primary" disabled={!isNameValid} onClick={() => navigate('/online/create')}>
              オンラインルームを作成
            </Button>
            <Button disabled={!isNameValid} onClick={() => navigate('/online/join')}>
              オンラインルームへ参加
            </Button>
          </div>

          <p className="online-home-hint">
            ルームIDを直接知っている場合や、招待URLを開いた場合は「参加」からルームIDを入力してください。
          </p>
        </div>
      </div>
    </div>
  );
}
