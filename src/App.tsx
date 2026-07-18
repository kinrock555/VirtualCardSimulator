import { Navigate, Route, Routes } from 'react-router-dom';
import { MainMenuPage } from './routes/MainMenuPage';
import { BoxPage } from './routes/BoxPage';
import { DeckEditPage } from './routes/DeckEditPage';
import { PlayPage } from './routes/PlayPage';
import { NotificationBanner } from './components/common/NotificationBanner';

export default function App() {
  return (
    <div className="app-shell">
      <NotificationBanner />
      <Routes>
        <Route path="/" element={<MainMenuPage />} />
        <Route path="/box" element={<BoxPage />} />
        <Route path="/decks" element={<DeckEditPage />} />
        <Route path="/play/:deckId" element={<PlayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
