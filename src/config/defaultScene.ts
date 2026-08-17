import type { SceneConfig } from "../types/scene";

/**
 * Declarative default scene — the "champagne phone on a cream background" demo.
 * Both the Remotion compositions and the interactive preview start from this
 * object, which is what keeps preview and final render using the same model.
 */
export const defaultScene: SceneConfig = {
  device: {
    type: "phone",
    model: "iphone-17-pro",
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

/**
 * Laptop preset — same studio framing, but the device is the MacBook OBJ with
 * its own wallpaper. Used by the preview's device switcher.
 */
export const laptopScene: SceneConfig = {
  ...defaultScene,
  device: {
    type: "laptop",
    model: "macbook-pro",
    color: "graphite",
    position: [0, 0, 0],
    rotation: [0, -0.35, 0],
    scale: 1,
  },
  screen: {
    src: "/screens/macbook-wallpaper.png",
    fit: "cover",
    brightness: 1,
  },
};
