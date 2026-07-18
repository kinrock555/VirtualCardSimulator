import type { RefObject } from 'react';
import { OrbitControls } from '@react-three/drei';
import { MOUSE } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_POLAR_ANGLE,
  CAMERA_MIN_DISTANCE,
  CAMERA_TARGET,
} from '../../lib/tableConstants';

type CameraRigProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  enabled: boolean;
};

// Left button is reserved for card selection/drag, so it must never trigger
// OrbitControls - only middle/right drag orbit the camera, per spec.
const MOUSE_BUTTONS = {
  LEFT: -1,
  MIDDLE: MOUSE.ROTATE,
  RIGHT: MOUSE.ROTATE,
};

export function CameraRig({ controlsRef, enabled }: CameraRigProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      makeDefault
      target={CAMERA_TARGET}
      enablePan={false}
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      maxPolarAngle={CAMERA_MAX_POLAR_ANGLE}
      minPolarAngle={0.15}
      mouseButtons={MOUSE_BUTTONS}
    />
  );
}
