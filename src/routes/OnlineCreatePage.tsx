import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../store/useDeckStore';
import { useOnlineStore } from '../store/useOnlineStore';
import { TABLE_THEMES, DEFAULT_TABLE_THEME_ID } from '../config/tableThemes';

export function OnlineCreatePage() {
  const navigate = useNavigate();
  const decks = useDeckStore((state) => state.decks);
  const createRoom = useOnlineStore((state) => state.createRoom);
  const playerName = useOnlineStore((state) => state.playerName);
  const connectionStatus = useOnlineStore((state) => state.connectionStatus);

  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState(DEFAULT_TABLE_THEME_ID);
  const [localError, setLocalError] = useState<string | null>(null);

  const isNameValid = playerName.trim().length >= 1 && playerName.trim().length <= 20;

  const handleCreate = async () => {
    setLocalError(null);
    const deck = decks.find((d) => d.id === selectedDeckId);
    if (!deck) {
      setLocalError('デッキを選択してください');
      return;
    }
    const response = await createRoom({ deckId: deck.id, deckCards: deck.cards, themeId: selectedThemeId });
    if (response.ok) {
      navigate(`/room/${response.roomId}`);
    } else {
      setLocalError(response.error);
    }
  };

  return (
    <div className="screen">
      <ScreenHeader
        title="オンラインルームを作成"
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

          <span className="field-label">使用するデッキ</span>
          <select className="deck-select-dropdown" value={selectedDeckId} onChange={(event) => setSelectedDeckId(event.target.value)}>
            <option value="">選択してください...</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.cards.reduce((sum, c) => sum + c.count, 0)}枚)
              </option>
            ))}
          </select>
          {decks.length === 0 && <p className="online-home-hint">先にデッキ編集画面でデッキを作成してください。</p>}

          <span className="field-label">テーブルテーマ</span>
          <div className="table-theme-list">
            {TABLE_THEMES.map((theme) => (
              <div key={theme.id} className={`table-theme-option${theme.id === selectedThemeId ? ' current' : ''}`}>
                <img className="table-theme-preview" src={theme.previewPath} alt={theme.name} />
                <div className="table-theme-info">
                  <span className="table-theme-name">{theme.name}</span>
                  {theme.id === selectedThemeId ? (
                    <span className="table-theme-current-badge">選択中</span>
                  ) : (
                    <Button size="sm" onClick={() => setSelectedThemeId(theme.id)}>
                      選択
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {localError && <p className="online-home-hint online-home-error">{localError}</p>}

          <Button
            variant="primary"
            disabled={!isNameValid || !selectedDeckId || connectionStatus === 'connecting'}
            onClick={handleCreate}
          >
            {connectionStatus === 'connecting' ? '作成中...' : 'ルームを作成'}
          </Button>
        </div>
      </div>
    </div>
  );
}
