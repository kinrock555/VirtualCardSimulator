import type { RefObject } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { TableTheme } from '../../config/tableThemes';
import type { RoomEnvironment } from '../../config/roomEnvironments';
import type { CameraView, GraphicsQuality } from '../../store/useTableStore';
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
  cameraView: CameraView;
  cameraResetToken: number;
  /** Defaults to 'standard' for the main-menu background reuse (which doesn't pass this prop). */
  graphicsQuality?: GraphicsQuality;
};

export function TableScene({
  controlsRef,
  cameraEnabled,
  theme,
  roomEnvironment,
  cameraView,
  cameraResetToken,
  graphicsQuality = 'standard',
}: TableSceneProps) {
  const isLight = graphicsQuality === 'light';
  const shadowMapSize = isLight ? 1024 : 2048;

  return (
    <>
      <color attach="background" args={[roomEnvironment.backgroundColor]} />
      <fog attach="fog" args={[roomEnvironment.backgroundColor, 34, 78]} />

      {/* Hemisphere light (sky/ground) instead of a flat ambient - a cheap way
          (same single-light cost as ambientLight) to add a hint of directional
          falloff/depth without extra draw calls or an extra shadow-casting light. */}
      <hemisphereLight
        args={[roomEnvironment.backgroundColor, roomEnvironment.floorColor, roomEnvironment.ambientLightIntensity]}
      />
      <directionalLight
        position={[6, 10, 4]}
        intensity={roomEnvironment.directionalLightIntensity}
        castShadow={!isLight}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <RoomEnvironmentRenderer environment={roomEnvironment} quality={graphicsQuality} />
      <TableSurface theme={theme} />
      <CardLayer />
      <CameraRig
        controlsRef={controlsRef}
        enabled={cameraEnabled}
        maxDistance={PLAY_CAMERA_MAX_DISTANCE}
        view={cameraView}
        resetToken={cameraResetToken}
      />
      <ThreeContextBridge />
    </>
  );
}
