import type { ComponentType } from "react";
import type { PhoneMaterialPreset } from "../phoneConfig";

export interface FrontSensor {
  /** Dynamic Island pill width (world units). */
  width: number;
  /** Dynamic Island pill height (world units). */
  height: number;
  /** Center of the island relative to the device origin (z slightly proud of the screen). */
  position: [number, number, number];
  /** Front camera lens: offset from island center + radius. */
  lens: { x: number; y: number; radius: number };
}

export interface DisplaySurface {
  /** Width of the emissive display plane (world units). */
  width: number;
  /** Height of the emissive display plane (world units). */
  height: number;
  /** Corner radius of the emissive display plane (world units). */
  cornerRadius: number;
  /** Center of the display plane relative to the device origin. */
  position: [number, number, number];
  /** Optional front-glass overlay (the "cristal frontal" / ScreenGlass). */
  glass: {
    width: number;
    height: number;
    thickness: number;
    position: [number, number, number];
    radius: number;
  };
  /** Optional front-facing sensor cluster (Dynamic Island + camera lens). */
  sensor?: FrontSensor;
}

export interface DeviceModel {
  id: string;
  /** Where the screen surface lives on this device. Drives PhoneScreen placement. */
  display: DisplaySurface;
  /**
   * Renders only the device body (chassis, frame, buttons, rear cameras).
   * It must NOT render the screen — the screen is added by <Phone> from
   * `display`, so swapping the body for a .glb later requires no changes to
   * PhoneScreen, Scene, animations, or compositions.
   */
  Body: ComponentType<{ material: PhoneMaterialPreset }>;
}
