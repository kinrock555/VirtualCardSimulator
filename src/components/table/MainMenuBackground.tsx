import { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { TableSurface } from './TableSurface';
import { RoomEnvironmentRenderer } from './environments/RoomEnvironmentRenderer';
import { getRoomEnvironmentById, DEFAULT_ROOM_ENVIRONMENT_ID } from '../../config/roomEnvironments';
import { getTableThemeById, DEFAULT_TABLE_THEME_ID } from '../../config/tableThemes';
import { getCardBackUrl } from '../../lib/cardLoader';
import { useCardMasterStore } from '../../store/useCardMasterStore';

/** Very slow side-to-side drift - just enough to feel alive, never fast
 * enough to be distracting or nauseating behind menu text. */
function DriftingCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.06;
    camera.position.x = Math.sin(t) * 0.8;
    camera.position.y = 7.2 + Math.sin(t * 0.7) * 0.15;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const CARD_POSITIONS: Array<[number, number, number, number]> = [
  // x, y, z, rotationY(rad)
  [-1.6, 0.05, 1.1, 0.3],
  [0.7, 0.06, 0.3, -0.5],
  [2.1, 0.05, -0.9, 1.1],
];

function DecorativeCards() {
  const cards = useCardMasterStore((state) => state.cards);
  const backUrl = getCardBackUrl();
  const frontUrl = cards[0]?.imagePath ?? backUrl;
  const textures = useTexture([frontUrl, backUrl]);

  return (
    <>
      {CARD_POSITIONS.map(([x, y, z, rot], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[-Math.PI / 2, 0, rot]} raycast={() => null}>
          <planeGeometry args={[1, 1.4]} />
          <meshStandardMaterial map={index === 1 ? textures[0] : textures[1]} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Lightweight reuse of the real 3D table/room system as the main menu's
 * backdrop - same TableSurface/RoomEnvironmentRenderer used in actual test
 * play, just non-interactive (no OrbitControls, no card layer, no shadows,
 * fixed to the lightest room/table so it never competes with the menu for
 * attention or GPU budget). Nothing here is registered for raycasting.
 */
export function MainMenuBackground() {
  const theme = getTableThemeById(DEFAULT_TABLE_THEME_ID);
  const roomEnvironment = getRoomEnvironmentById(DEFAULT_ROOM_ENVIRONMENT_ID);

  return (
    <div className="main-menu-background" aria-hidden="true">
      <Canvas shadows={false} dpr={[1, 1.25]} camera={{ position: [0, 7.2, 9.5], fov: 42 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <color attach="background" args={[roomEnvironment.backgroundColor]} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 10, 4]} intensity={0.85} />
          <RoomEnvironmentRenderer environment={roomEnvironment} />
          <TableSurface theme={theme} interactive={false} />
          <DecorativeCards />
          <DriftingCamera />
        </Suspense>
      </Canvas>
      <div className="main-menu-background-scrim" />
    </div>
  );
}
