import type { RefObject } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { TableSurface } from './TableSurface';
import { CardLayer } from './CardLayer';
import { CameraRig } from './CameraRig';

type TableSceneProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  cameraEnabled: boolean;
};

export function TableScene({ controlsRef, cameraEnabled }: TableSceneProps) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 18, 34]} />

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

      <TableSurface />
      <CardLayer />
      <CameraRig controlsRef={controlsRef} enabled={cameraEnabled} />
    </>
  );
}
