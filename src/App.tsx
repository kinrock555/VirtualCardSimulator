import { Navigate, Route, Routes } from 'react-router-dom';
import { MainMenuPage } from './routes/MainMenuPage';
import { BoxPage } from './routes/BoxPage';
import { DeckEditPage } from './routes/DeckEditPage';
import { PlayPage } from './routes/PlayPage';
import { PlaySetupPage } from './routes/PlaySetupPage';
import { SettingsPage } from './routes/SettingsPage';
import { OnlineHomePage } from './routes/OnlineHomePage';
import { OnlineCreatePage } from './routes/OnlineCreatePage';
import { OnlineJoinPage } from './routes/OnlineJoinPage';
import { RoomPage } from './routes/RoomPage';
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
        <Route path="/play-setup" element={<PlaySetupPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/online" element={<OnlineHomePage />} />
        <Route path="/online/create" element={<OnlineCreatePage />} />
        <Route path="/online/join" element={<OnlineJoinPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
