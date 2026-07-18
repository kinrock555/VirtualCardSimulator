import type { RoomEnvironment } from '../../../config/roomEnvironments';
import { PlainEnvironment } from './PlainEnvironment';
import { HomeEnvironment } from './HomeEnvironment';
import { CasinoEnvironment } from './CasinoEnvironment';
import { CardShopEnvironment } from './CardShopEnvironment';

type RoomEnvironmentRendererProps = {
  environment: RoomEnvironment;
};

/** Swaps in the component for the selected room background - unmounting the previous one lets Three.js free its GPU resources automatically. */
export function RoomEnvironmentRenderer({ environment }: RoomEnvironmentRendererProps) {
  switch (environment.id) {
    case 'home':
      return <HomeEnvironment environment={environment} />;
    case 'casino':
      return <CasinoEnvironment environment={environment} />;
    case 'card-shop':
      return <CardShopEnvironment environment={environment} />;
    case 'plain':
    default:
      return <PlainEnvironment environment={environment} />;
  }
}
