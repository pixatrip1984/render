import * as THREE from "three";

/**
 * Shared renderer settings applied to both <ThreeCanvas> (Remotion) and
 * <Canvas> (preview) so preview and final render match: ACES filmic tone
 * mapping, sRGB output, antialiasing, capped device pixel ratio.
 */
export const GL_PROPS = {
  antialias: true,
  alpha: false,
  powerPreference: "high-performance" as const,
  toneMapping: THREE.ACESFilmicToneMapping,
  outputColorSpace: THREE.SRGBColorSpace,
};

export const MAX_DPR = 2;

/**
 * Shadow-map config for the <Canvas shadows> prop. We pin PCFShadowMap
 * explicitly: three >= r185 deprecates PCFSoftShadowMap (which R3F uses for the
 * `shadows` boolean shorthand) and logs a warning per frame.
 */
export const SHADOW_PROPS = { type: THREE.PCFShadowMap };
