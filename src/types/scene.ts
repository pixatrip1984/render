export type Vec3 = [number, number, number];

export type PhoneColorPreset = "champagne" | "graphite" | "silver" | "black";

export type ScreenFit = "cover" | "contain";

export type LightingPreset = "studio-soft";

export interface DeviceConfig {
  type: "phone";
  /** Device model id resolved through the DEVICE_MODELS registry. */
  model: string;
  /** Key into PHONE_MATERIAL_PRESETS. Changing it must never affect the screen. */
  color: PhoneColorPreset;
  /** World-space position of the device group. */
  position: Vec3;
  /** World-space euler rotation in radians [x, y, z]. */
  rotation: Vec3;
  scale: number;
}

export interface ScreenConfig {
  /** Resolved URL/path of the screenshot texture. */
  src: string;
  fit: ScreenFit;
  brightness: number;
}

export interface CameraConfig {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface LightingConfig {
  preset: LightingPreset;
}

export interface GroundConfig {
  enabled: boolean;
  /** Color of the ground plane (usually matches the background for a seamless studio floor). */
  color: string;
}

export interface SceneConfig {
  device: DeviceConfig;
  screen: ScreenConfig;
  camera: CameraConfig;
  lighting: LightingConfig;
  background: string;
  ground: GroundConfig;
}
