import { useEffect, useRef, type RefObject } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MOUSE, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_POLAR_ANGLE,
  CAMERA_MIN_DISTANCE,
  CAMERA_MIN_POLAR_ANGLE,
  CAMERA_TARGET,
  CAMERA_TOP_POLAR_ANGLE,
  CAMERA_VIEW_TRANSITION_SECONDS,
  PLAYER_CAMERA_PRESETS,
  type PlayerSeat,
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
  /** Offline 2-player only: which side of the table to view from. Defaults to player1 (the pre-existing single/near-side view) when omitted. */
  seat?: PlayerSeat;
  /** Bump this (e.g. on every "reset camera" click) to replay the animation into `view`/`seat` even when neither changed. */
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

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Interpolates an angle (radians) by the shorter of its two possible sweeps, so e.g. going from just-past-PI to just-before--PI is a tiny step, not a near-full-circle one. */
function lerpAngle(from: number, to: number, t: number): number {
  const twoPi = Math.PI * 2;
  let delta = (to - from) % twoPi;
  delta = ((delta + Math.PI * 3) % twoPi) - Math.PI;
  return from + delta * t;
}

/** Polar angle (from +Y) / azimuth (around +Y, from +Z) / radius, relative to CAMERA_TARGET - the same convention OrbitControls itself uses internally. Working in this space (instead of a straight Cartesian lerp) is what lets a player1<->player2 swap sweep AROUND the table instead of cutting straight through the camera-up singularity directly over the target. */
type OrbitPose = { radius: number; phi: number; theta: number };

function poseFromPosition(position: Vector3): OrbitPose {
  const offset = position.clone().sub(new Vector3(...CAMERA_TARGET));
  const radius = Math.max(offset.length(), 0.0001);
  const phi = Math.acos(Math.min(1, Math.max(-1, offset.y / radius)));
  const theta = Math.atan2(offset.x, offset.z);
  return { radius, phi, theta };
}

function poseToPosition(pose: OrbitPose): Vector3 {
  const sinPhiRadius = Math.sin(pose.phi) * pose.radius;
  return new Vector3(
    sinPhiRadius * Math.sin(pose.theta) + CAMERA_TARGET[0],
    Math.cos(pose.phi) * pose.radius + CAMERA_TARGET[1],
    sinPhiRadius * Math.cos(pose.theta) + CAMERA_TARGET[2],
  );
}

type ViewAnimation = { from: OrbitPose; to: OrbitPose; elapsed: number };

export function CameraRig({ controlsRef, enabled, minDistance, maxDistance, view, seat, resetToken }: CameraRigProps) {
  const animationRef = useRef<ViewAnimation | null>(null);

  useEffect(() => {
    if (!view) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const activeSeat = seat ?? 'player1';
    const targetPosition = PLAYER_CAMERA_PRESETS[activeSeat][view].position;
    animationRef.current = {
      from: poseFromPosition(controls.object.position),
      to: poseFromPosition(new Vector3(...targetPosition)),
      elapsed: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, seat, resetToken]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const animation = animationRef.current;
    if (!controls || !animation) return;
    animation.elapsed += delta;
    const t = easeInOutCubic(Math.min(1, animation.elapsed / CAMERA_VIEW_TRANSITION_SECONDS));
    const pose: OrbitPose = {
      radius: lerp(animation.from.radius, animation.to.radius, t),
      phi: lerp(animation.from.phi, animation.to.phi, t),
      theta: lerpAngle(animation.from.theta, animation.to.theta, t),
    };
    controls.object.position.copy(poseToPosition(pose));
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
      minPolarAngle={isTop ? CAMERA_TOP_POLAR_ANGLE : CAMERA_MIN_POLAR_ANGLE}
      mouseButtons={MOUSE_BUTTONS}
    />
  );
}
