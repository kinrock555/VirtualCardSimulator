type PlayerSwitchOverlayProps = {
  incomingPlayerName: string;
  onReveal: () => void;
};

/**
 * Full-screen pass-and-play handoff screen. Shown between `switchToPlayer`
 * and the incoming player clicking through it - conceals the outgoing
 * player's hand/field state was already live-mutated, and (more importantly)
 * keeps the incoming player's own hand hidden until THEY confirm it's their
 * turn to look, not whoever happened to be holding the mouse when the switch
 * button was clicked.
 */
export function PlayerSwitchOverlay({ incomingPlayerName, onReveal }: PlayerSwitchOverlayProps) {
  return (
    <div className="player-switch-overlay">
      <div className="player-switch-card">
        <p className="player-switch-message">{incomingPlayerName}へ交代します。</p>
        <p className="player-switch-warning">次のプレイヤー以外は画面を見ないでください。</p>
        <button type="button" className="player-switch-reveal-button" onClick={onReveal}>
          手札を表示
        </button>
      </div>
    </div>
  );
}
