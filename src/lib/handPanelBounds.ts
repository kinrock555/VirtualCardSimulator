const HAND_PANEL_SELECTOR = '.hand-panel';

/**
 * Whether a screen point falls within the 2D hand panel's current DOM rect.
 * Used when a field card is dragged downward so it can be returned to the
 * hand by dropping it there, instead of only via the right-click menu.
 * Looked up on demand (not cached) since the panel's height changes when
 * collapsed/expanded and when the hand card count changes.
 */
export function isPointOverHandPanel(clientX: number, clientY: number): boolean {
  const panel = document.querySelector(HAND_PANEL_SELECTOR);
  if (!panel) return false;
  const rect = panel.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}
