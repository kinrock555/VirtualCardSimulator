import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { AudioUnlockHint } from '../components/common/AudioUnlockHint';
import { MainMenuBackground } from '../components/table/MainMenuBackground';
import { useSavedBoardsStore } from '../store/useSavedBoardsStore';
import { useTableStore } from '../store/useTableStore';
import { useScreenBgm } from '../lib/audio/useScreenBgm';

export function MainMenuPage() {
  const navigate = useNavigate();
  const savedBoards = useSavedBoardsStore((state) => state.savedBoards);
  const setPendingBoardToLoad = useTableStore((state) => state.setPendingBoardToLoad);

  useScreenBgm('title');

  const handleTestPlay = () => {
    // Test play requires a deck (see /play/:deckId), so hand off to the deck
    // screen where the user picks which saved deck to bring to the table.
    navigate('/decks');
  };

  const mostRecentBoard =
    savedBoards.length > 0 ? [...savedBoards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] : null;

  const handleContinue = () => {
    if (!mostRecentBoard) return;
    setPendingBoardToLoad(mostRecentBoard);
    navigate(`/play/${mostRecentBoard.deckId ?? 'continue'}`);
  };

  return (
    <div className="main-menu">
      <MainMenuBackground />
      <div className="main-menu-embers" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="main-menu-ember" />
        ))}
      </div>
      <div className="main-menu-frame" aria-hidden="true" />

      <div className="main-menu-content">
        <div className="main-menu-heading">
          <div className="main-menu-crest" aria-hidden="true">
            <span className="main-menu-crest-line" />
            <span className="main-menu-crest-gem" />
            <span className="main-menu-crest-line" />
          </div>
          <h1 className="main-menu-title">
            <span className="main-menu-title-main">Virtual Card Simulator</span>
          </h1>
          <p className="main-menu-subtitle">バーチャル・カード・シミュレーター</p>
        </div>

        <div className="main-menu-panel">
          <div className="main-menu-primary-row">
            <Button
              variant="primary"
              className="main-menu-button main-menu-button-hero"
              onClick={handleTestPlay}
              style={{ animationDelay: '0ms' }}
            >
              テストプレイ
            </Button>
            <Button
              variant="primary"
              className="main-menu-button main-menu-button-hero main-menu-button-continue"
              onClick={handleContinue}
              disabled={!mostRecentBoard}
              style={{ animationDelay: '60ms' }}
            >
              前回の続きから
            </Button>
          </div>

          <Button
            variant="primary"
            className="main-menu-button"
            onClick={() => navigate('/play-setup')}
            style={{ animationDelay: '120ms' }}
          >
            2人でテストプレイ
          </Button>

          <nav className="main-menu-grid">
            <Button className="main-menu-button" onClick={() => navigate('/box')} style={{ animationDelay: '160ms' }}>
              カードBOX
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/decks')} style={{ animationDelay: '200ms' }}>
              デッキ編集
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/online')} style={{ animationDelay: '240ms' }}>
              オンライン対戦
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/settings')} style={{ animationDelay: '280ms' }}>
              設定
            </Button>
          </nav>
        </div>

        <AudioUnlockHint />
      </div>
    </div>
  );
}
