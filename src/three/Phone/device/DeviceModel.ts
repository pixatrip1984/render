import type { ComponentType } from "react";
import type { PhoneMaterialPreset } from "../phoneConfig";

export interface DisplaySurface {
  /** Width of the emissive display plane (world units). */
  width: number;
  /** Height of the emissive display plane (world units). */
  height: number;
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
