import { CARD_HEIGHT, CARD_WIDTH, TABLE_SURFACE_Y } from '../../lib/tableConstants';
import { useTableStore } from '../../store/useTableStore';

/** Translucent outline shown on the field while a hand card is being dragged toward it. */
export function HandDropPreview() {
  const handFieldDrag = useTableStore((state) => state.handFieldDrag);

  if (!handFieldDrag || !handFieldDrag.visible) return null;

  return (
    <mesh position={[handFieldDrag.x, TABLE_SURFACE_Y + 0.03, handFieldDrag.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
      <meshBasicMaterial color="#ffd35c" transparent opacity={0.35} depthWrite={false} />
    </mesh>
  );
}
