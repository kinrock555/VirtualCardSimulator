import type { OnlinePlayer } from '../../../shared/onlineTypes';

type PlayerListPanelProps = {
  players: OnlinePlayer[];
  myPlayerId: string;
};

export function PlayerListPanel({ players, myPlayerId }: PlayerListPanelProps) {
  return (
    <ul className="player-list-panel">
      {players.map((player) => (
        <li key={player.playerId} className="player-list-row">
          <span className={`player-status-dot${player.connected ? ' connected' : ' disconnected'}`}>
            {player.connected ? '●' : '○'}
          </span>
          <span className="player-list-name">
            {player.name}
            {player.playerId === myPlayerId && '（自分）'}
            {!player.connected && '（再接続待ち）'}
          </span>
        </li>
      ))}
    </ul>
  );
}
