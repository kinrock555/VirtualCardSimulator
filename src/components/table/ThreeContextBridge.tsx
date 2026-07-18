import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { setThreeContext } from '../../lib/threeBridge';

/** Publishes the active camera/renderer so the 2D hand panel (outside the Canvas) can raycast onto the table. */
export function ThreeContextBridge() {
  const { camera, gl } = useThree();

  useEffect(() => {
    setThreeContext({ camera, gl });
    return () => setThreeContext(null);
  }, [camera, gl]);

  return null;
}
