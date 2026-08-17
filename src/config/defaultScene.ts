import type { SceneConfig } from "../types/scene";

/**
 * Declarative default scene — the "champagne phone on a cream background" demo.
 * Both the Remotion compositions and the interactive preview start from this
 * object, which is what keeps preview and final render using the same model.
 */
export const defaultScene: SceneConfig = {
  device: {
    type: "phone",
    model: "procedural-phone",
    color: "champagne",
    position: [0, 0, 0],
    rotation: [0, -0.35, 0],
    scale: 1,
  },
  screen: {
    src: "/screens/astra-1.png",
    fit: "cover",
    brightness: 1,
  },
  camera: {
    position: [0, 0.45, 2.6],
    target: [0, 0, 0],
    fov: 32,
  },
  lighting: {
    preset: "studio-soft",
  },
  background: "#eee9e2",
  ground: {
    enabled: true,
    color: "#eee9e2",
  },
};
