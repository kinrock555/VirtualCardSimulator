import type { RefObject } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { TableTheme } from '../../config/tableThemes';
import { CameraRig } from '../table/CameraRig';
import { OnlineTableSurface } from './OnlineTableSurface';
import { OnlineCardLayer } from './OnlineCardLayer';

type OnlineTableSceneProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  cameraEnabled: boolean;
  theme: TableTheme;
};

export function OnlineTableScene({ controlsRef, cameraEnabled, theme }: OnlineTableSceneProps) {
  return (
    <>
      <color attach="background" args={[theme.backgroundColor]} />
      <fog attach="fog" args={[theme.backgroundColor, 18, 34]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <OnlineTableSurface theme={theme} />
      <OnlineCardLayer />
      <CameraRig controlsRef={controlsRef} enabled={cameraEnabled} />
    </>
  );
}
