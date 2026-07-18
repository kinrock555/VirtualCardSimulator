import type { RoomEnvironment } from '../../../config/roomEnvironments';
import { RoomShell } from './RoomShell';

/** The lightest-weight background - floor + walls only, no decoration, for low-spec machines. */
export function PlainEnvironment({ environment }: { environment: RoomEnvironment }) {
  return <RoomShell floorColor={environment.floorColor} wallColor={environment.wallColor} />;
}
