import { useEffect, useState } from 'react';
import { ClampToEdgeWrapping, SRGBColorSpace, Texture, TextureLoader } from 'three';
import { getCustomPlaymatBlob } from './customPlaymatStorage';

/**
 * Loads the selected custom playmat image (if any) as a Three.js texture,
 * UV-mapped like CSS `object-fit: cover` so an arbitrarily-shaped photo
 * fills the rectangular playmat plane without ever distorting/stretching it.
 * Returns null while loading, on failure, or when `playmatId` is null (the
 * caller falls back to the standard theme-generated texture in that case).
 */
export function useCustomPlaymatTexture(playmatId: string | null, planeAspect: number): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    if (!playmatId) {
      setTexture(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    let loadedTexture: Texture | null = null;

    getCustomPlaymatBlob(playmatId)
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        new TextureLoader().load(objectUrl, (loaded) => {
          if (cancelled) {
            loaded.dispose();
            return;
          }
          loaded.colorSpace = SRGBColorSpace;
          loaded.wrapS = ClampToEdgeWrapping;
          loaded.wrapT = ClampToEdgeWrapping;
          loaded.needsUpdate = true;
          const imgAspect = loaded.image.width / loaded.image.height;
          if (imgAspect > planeAspect) {
            const scale = planeAspect / imgAspect;
            loaded.repeat.set(scale, 1);
            loaded.offset.set((1 - scale) / 2, 0);
          } else {
            const scale = imgAspect / planeAspect;
            loaded.repeat.set(1, scale);
            loaded.offset.set(0, (1 - scale) / 2);
          }
          loadedTexture = loaded;
          setTexture(loaded);
        });
      })
      .catch(() => {
        if (!cancelled) setTexture(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (loadedTexture) loadedTexture.dispose();
    };
  }, [playmatId, planeAspect]);

  return texture;
}
