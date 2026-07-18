import { useEffect, useRef, type RefObject } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOUSE, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_POLAR_ANGLE,
  CAMERA_MIN_DISTANCE,
  CAMERA_TARGET,
  CAMERA_TOP_POLAR_ANGLE,
  CAMERA_VIEW_OBLIQUE_POSITION,
  CAMERA_VIEW_TOP_POSITION,
  CAMERA_VIEW_TRANSITION_SECONDS,
} from '../../lib/tableConstants';
import type { CameraView } from '../../store/useTableStore';

type CameraRigProps = {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  enabled: boolean;
  /** Overrides for screens with more to show around the table (e.g. the offline room background). Online keeps the defaults. */
  minDistance?: number;
  maxDistance?: number;
  /**
   * Offline-only: which camera preset to animate to and lock the polar-angle
   * range around. Omitted entirely by the online mode, which keeps its
   * single fixed oblique-only range unchanged.
   */
  view?: CameraView;
  /** Bump this (e.g. on every "reset camera" click) to replay the animation into `view` even when `view` itself didn't change. */
  resetToken?: number;
};

// Left button is reserved for card selection/drag, so it must never trigger
// OrbitControls - only middle/right drag orbit the camera, per spec.
const MOUSE_BUTTONS = {
  LEFT: -1,
  MIDDLE: MOUSE.ROTATE,
  RIGHT: MOUSE.ROTATE,
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

type ViewAnimation = { from: Vector3; to: Vector3; elapsed: number };

export function CameraRig({ controlsRef, enabled, minDistance, maxDistance, view, resetToken }: CameraRigProps) {
  const animationRef = useRef<ViewAnimation | null>(null);

  useEffect(() => {
    if (!view) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const targetPosition = view === 'top' ? CAMERA_VIEW_TOP_POSITION : CAMERA_VIEW_OBLIQUE_POSITION;
    animationRef.current = {
      from: controls.object.position.clone(),
      to: new Vector3(...targetPosition),
      elapsed: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, resetToken]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const animation = animationRef.current;
    if (!controls || !animation) return;
    animation.elapsed += delta;
    const t = Math.min(1, animation.elapsed / CAMERA_VIEW_TRANSITION_SECONDS);
    controls.object.position.lerpVectors(animation.from, animation.to, easeInOutCubic(t));
    controls.update();
    if (t >= 1) animationRef.current = null;
  });

  const isTop = view === 'top';

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      makeDefault
      target={CAMERA_TARGET}
      enablePan={false}
      minDistance={minDistance ?? CAMERA_MIN_DISTANCE}
      maxDistance={maxDistance ?? CAMERA_MAX_DISTANCE}
      maxPolarAngle={isTop ? CAMERA_TOP_POLAR_ANGLE : CAMERA_MAX_POLAR_ANGLE}
      minPolarAngle={isTop ? CAMERA_TOP_POLAR_ANGLE : 0.15}
      mouseButtons={MOUSE_BUTTONS}
    />
  );
}
