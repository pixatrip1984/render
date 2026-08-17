import type { CameraConfig } from "../../types/scene";

/**
 * Small set of reusable product-camera presets. Kept minimal on purpose: the
 * full camera/device motion-preset library is a later milestone.
 */
export const CAMERA_PRESETS: Record<string, CameraConfig> = {
  "product-front": {
    position: [0, 0.45, 2.6],
    target: [0, 0, 0],
    fov: 32,
  },
  "three-quarter": {
    position: [1.9, 0.5, 2.2],
    target: [0, 0, 0],
    fov: 32,
  },
};
