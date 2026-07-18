import type { RefObject } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { TableTheme } from '../../config/tableThemes';
import type { RoomEnvironment } from '../../config/roomEnvironments';
import { TableSurface } from './TableSurface';
import { CardLayer } from './CardLayer';
import { CameraRig } from './CameraRig';
import { ThreeContextBridge } from './ThreeContextBridge';
import { RoomEnvironmentRenderer } from './environments/RoomEnvironmentRenderer';
import { PLAY_CAMERA_MAX_DISTANCE } from '../../lib/tableConstants';

type TableSceneProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  cameraEnabled: boolean;
  theme: TableTheme;
  roomEnvironment: RoomEnvironment;
};

export function TableScene({ controlsRef, cameraEnabled, theme, roomEnvironment }: TableSceneProps) {
  return (
    <>
      <color attach="background" args={[roomEnvironment.backgroundColor]} />
      <fog attach="fog" args={[roomEnvironment.backgroundColor, 34, 78]} />

      <ambientLight intensity={roomEnvironment.ambientLightIntensity} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={roomEnvironment.directionalLightIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <RoomEnvironmentRenderer environment={roomEnvironment} />
      <TableSurface theme={theme} />
      <CardLayer />
      <CameraRig controlsRef={controlsRef} enabled={cameraEnabled} maxDistance={PLAY_CAMERA_MAX_DISTANCE} />
      <ThreeContextBridge />
    </>
  );
}
