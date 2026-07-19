import type { RoomEnvironment } from '../../../config/roomEnvironments';
import type { GraphicsQuality } from '../../../store/useTableStore';
import { PlainEnvironment } from './PlainEnvironment';
import { HomeEnvironment } from './HomeEnvironment';
import { CasinoEnvironment } from './CasinoEnvironment';
import { CardShopEnvironment } from './CardShopEnvironment';

type RoomEnvironmentRendererProps = {
  environment: RoomEnvironment;
  /** Defaults to 'standard' for callers that don't care (e.g. the main-menu background). 'light' trims each theme's extra decorative objects. */
  quality?: GraphicsQuality;
};

/** Swaps in the component for the selected room background - unmounting the previous one lets Three.js free its GPU resources automatically. */
export function RoomEnvironmentRenderer({ environment, quality = 'standard' }: RoomEnvironmentRendererProps) {
  switch (environment.id) {
    case 'home':
      return <HomeEnvironment environment={environment} quality={quality} />;
    case 'casino':
      return <CasinoEnvironment environment={environment} quality={quality} />;
    case 'card-shop':
      return <CardShopEnvironment environment={environment} quality={quality} />;
    case 'plain':
    default:
      return <PlainEnvironment environment={environment} />;
  }
}
