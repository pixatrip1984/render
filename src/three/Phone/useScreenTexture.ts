import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

/**
 * Loads a screenshot as a Three.js texture, suspending until it is ready.
 *
 * Suspense is the texture-loading contract for both entry points:
 *  - Remotion: <ThreeCanvas> wraps the scene in a Suspense boundary whose
 *    fallback calls delayRender(), so the CLI render waits for the texture.
 *  - Preview: the scene is wrapped in <Suspense> explicitly.
 *
 * Color space and wrapping are configured here so the screenshot is rendered
 * in sRGB with clamped edges (no tiling / bleeding outside the display).
 */
export function useScreenTexture(src: string): THREE.Texture {
  const texture = useLoader(THREE.TextureLoader, src);

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);

  return texture;
}
