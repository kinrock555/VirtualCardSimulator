import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { Button } from '../components/common/Button';
import { useDeckStore } from '../store/useDeckStore';
import { useTableStore } from '../store/useTableStore';
import type { DeckData } from '../types/deck';
import type { StartSessionConfig, TestPlayMode } from '../types/testSession';

const MODE_OPTIONS: { mode: TestPlayMode; label: string; description: string }[] = [
  { mode: 'sharedDeck', label: '共通デッキ', description: '1つの山札を2人で共有します。ドロー順は1つで、手札だけを別々に管理します。' },
  { mode: 'mirroredDecks', label: '個別デッキ・同じ構成', description: '同じデッキ構成を2人分用意します。カードは別インスタンスとして複製され、山札の並びも別々です。' },
  { mode: 'separateDecks', label: '個別デッキ・別構成', description: 'プレイヤーごとに好きな保存済みデッキを選べます。' },
];

function hasPlayableCards(deck: DeckData): boolean {
  return deck.cards.some((entry) => entry.count > 0);
}

function cardCount(deck: DeckData): number {
  return deck.cards.reduce((sum, entry) => sum + entry.count, 0);
}

export function PlaySetupPage() {
  const navigate = useNavigate();
  const decks = useDeckStore((state) => state.decks);
  const setPendingSessionConfig = useTableStore((state) => state.setPendingSessionConfig);
  const playableDecks = decks.filter(hasPlayableCards);

  const [mode, setMode] = useState<TestPlayMode>('sharedDeck');
  const [player1Name, setPlayer1Name] = useState('プレイヤー1');
  const [player2Name, setPlayer2Name] = useState('プレイヤー2');
  const [sharedDeckId, setSharedDeckId] = useState('');
  const [player1DeckId, setPlayer1DeckId] = useState('');
  const [player2DeckId, setPlayer2DeckId] = useState('');

  const isSeparate = mode === 'separateDecks';
  const canStart = isSeparate ? Boolean(player1DeckId) && Boolean(player2DeckId) : Boolean(sharedDeckId);

  const handleStart = () => {
    const playerNames: [string, string] = [player1Name.trim() || 'プレイヤー1', player2Name.trim() || 'プレイヤー2'];
    let config: StartSessionConfig;
    let routeDeckId: string;

    if (isSeparate) {
      const deck1 = decks.find((d) => d.id === player1DeckId);
      const deck2 = decks.find((d) => d.id === player2DeckId);
      if (!deck1 || !deck2) return;
      config = { mode: 'separateDecks', decks: [deck1, deck2], playerNames };
      routeDeckId = deck1.id;
    } else {
      const deck = decks.find((d) => d.id === sharedDeckId);
      if (!deck) return;
      config = mode === 'sharedDeck' ? { mode: 'sharedDeck', deck, playerNames } : { mode: 'mirroredDecks', deck, playerNames };
      routeDeckId = deck.id;
    }

    setPendingSessionConfig(config);
    navigate(`/play/${routeDeckId}`);
  };

  const renderDeckOptions = () => (
    <>
      <option value="">選択してください...</option>
      {playableDecks.map((deck) => (
        <option key={deck.id} value={deck.id}>
          {deck.name} ({cardCount(deck)}枚)
        </option>
      ))}
    </>
  );

  return (
    <div className="screen">
      <ScreenHeader
        title="2人でテストプレイ"
        subtitle="1台のPCを2人で交代しながら使うオフライン対人テストプレイです"
        actions={
          <Button variant="ghost" onClick={() => navigate('/')}>
            戻る
          </Button>
        }
      />

      <div className="screen-body">
        <div className="online-home-card">
          <span className="field-label">プレイヤー名</span>
          <div className="play-setup-name-row">
            <input
              type="text"
              className="deck-name-input"
              value={player1Name}
              onChange={(event) => setPlayer1Name(event.target.value)}
              placeholder="プレイヤー1"
            />
            <input
              type="text"
              className="deck-name-input"
              value={player2Name}
              onChange={(event) => setPlayer2Name(event.target.value)}
              placeholder="プレイヤー2"
            />
          </div>

          <span className="field-label">デッキ方式</span>
          <div className="play-setup-mode-list">
            {MODE_OPTIONS.map((option) => (
              <label key={option.mode} className={`play-setup-mode-option${mode === option.mode ? ' selected' : ''}`}>
                <input type="radio" name="test-play-mode" checked={mode === option.mode} onChange={() => setMode(option.mode)} />
                <div>
                  <div className="play-setup-mode-label">{option.label}</div>
                  <div className="play-setup-mode-description">{option.description}</div>
                </div>
              </label>
            ))}
          </div>

          {isSeparate ? (
            <>
              <span className="field-label">{player1Name.trim() || 'プレイヤー1'}用デッキ</span>
              <select className="deck-select-dropdown" value={player1DeckId} onChange={(event) => setPlayer1DeckId(event.target.value)}>
                {renderDeckOptions()}
              </select>

              <span className="field-label">{player2Name.trim() || 'プレイヤー2'}用デッキ</span>
              <select className="deck-select-dropdown" value={player2DeckId} onChange={(event) => setPlayer2DeckId(event.target.value)}>
                {renderDeckOptions()}
              </select>
            </>
          ) : (
            <>
              <span className="field-label">使用するデッキ</span>
              <select className="deck-select-dropdown" value={sharedDeckId} onChange={(event) => setSharedDeckId(event.target.value)}>
                {renderDeckOptions()}
              </select>
            </>
          )}

          {playableDecks.length === 0 && (
            <p className="online-home-hint">先にデッキ編集画面で1枚以上入ったデッキを作成してください。</p>
          )}

          <Button variant="primary" disabled={!canStart} onClick={handleStart}>
            テストプレイ開始
          </Button>
        </div>
      </div>
    </div>
  );
}
