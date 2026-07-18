import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { useUiStore } from '../store/useUiStore';

export function MainMenuPage() {
  const navigate = useNavigate();
  const showNotification = useUiStore((state) => state.showNotification);

  const handleTestPlay = () => {
    // Test play requires a deck (see /play/:deckId), so hand off to the deck
    // screen where the user picks which saved deck to bring to the table.
    navigate('/decks');
  };

  return (
    <div className="main-menu">
      <div className="main-menu-heading">
        <h1 className="main-menu-title">Virtual Card Simulator</h1>
        <p className="main-menu-subtitle">オリジナルカードゲームの試作・テストプレイ環境</p>
      </div>

      <nav className="main-menu-grid">
        <Button variant="primary" className="main-menu-button" onClick={() => navigate('/box')}>
          BOX
        </Button>
        <Button variant="primary" className="main-menu-button" onClick={() => navigate('/decks')}>
          デッキ編集
        </Button>
        <Button variant="primary" className="main-menu-button" onClick={handleTestPlay}>
          1人でテストプレイ
        </Button>
        <Button variant="primary" className="main-menu-button" onClick={() => navigate('/online')}>
          オンライン対戦
        </Button>
        <Button
          className="main-menu-button"
          onClick={() => showNotification('設定画面は未実装です')}
        >
          設定
        </Button>
      </nav>
    </div>
  );
}
