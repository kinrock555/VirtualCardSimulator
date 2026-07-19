import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { MainMenuBackground } from '../components/table/MainMenuBackground';
import { useSavedBoardsStore } from '../store/useSavedBoardsStore';
import { useTableStore } from '../store/useTableStore';

export function MainMenuPage() {
  const navigate = useNavigate();
  const savedBoards = useSavedBoardsStore((state) => state.savedBoards);
  const setPendingBoardToLoad = useTableStore((state) => state.setPendingBoardToLoad);

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

      <div className="main-menu-content">
        <div className="main-menu-heading">
          <h1 className="main-menu-title">Virtual Card Simulator</h1>
          <p className="main-menu-subtitle">オリジナルカードゲームの試作・テストプレイ環境</p>
        </div>

        <div className="main-menu-panel">
          <div className="main-menu-primary-row">
            <Button variant="primary" className="main-menu-button main-menu-button-hero" onClick={handleTestPlay}>
              1人でテストプレイ
            </Button>
            {mostRecentBoard && (
              <Button variant="primary" className="main-menu-button main-menu-button-hero" onClick={handleContinue}>
                前回の続きから
              </Button>
            )}
          </div>

          <Button variant="primary" className="main-menu-button" onClick={() => navigate('/play-setup')}>
            2人でテストプレイ
          </Button>

          <nav className="main-menu-grid">
            <Button className="main-menu-button" onClick={() => navigate('/box')}>
              BOX
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/decks')}>
              デッキ編集
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/online')}>
              オンライン対戦
            </Button>
            <Button className="main-menu-button" onClick={() => navigate('/settings')}>
              設定
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
