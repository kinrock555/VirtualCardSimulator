import { getCardBackUrl } from '../../lib/cardLoader';

type OpponentHandRackProps = {
  name: string;
  count: number;
};

// Caps how many face-down tiles actually render - beyond this the overlapping
// count badge communicates the rest, so the rack never grows large enough to
// meaningfully obscure the field regardless of hand size.
const MAX_VISIBLE_TILES = 10;

/**
 * 2D overlay showing another player's hand as a face-down count only - never
 * given the card contents/ids, so there is no way for it to leak them even
 * by accident (see the `name`/`count`-only prop shape below).
 */
export function OpponentHandRack({ name, count }: OpponentHandRackProps) {
  const visibleTiles = Math.min(count, MAX_VISIBLE_TILES);
  const overlap = visibleTiles > 5;
  const cardBackUrl = getCardBackUrl();

  return (
    <div className="opponent-hand-rack">
      <span className="opponent-hand-rack-name">{name}</span>
      <div className="opponent-hand-rack-tiles">
        {visibleTiles === 0 ? (
          <div className="opponent-hand-rack-empty" />
        ) : (
          Array.from({ length: visibleTiles }, (_, index) => (
            <img
              key={index}
              className="opponent-hand-rack-tile"
              src={cardBackUrl}
              alt=""
              draggable={false}
              style={{ marginLeft: overlap && index > 0 ? -26 : 0 }}
            />
          ))
        )}
      </div>
      <span className="opponent-hand-rack-count">手札 {count}枚</span>
    </div>
  );
}
