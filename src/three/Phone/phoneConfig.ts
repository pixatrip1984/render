import type { PhoneColorPreset } from "../../types/scene";

export interface PhoneMaterialPreset {
  label: string;
  color: string;
  metalness: number;
  roughness: number;
}

/**
 * Chassis material presets. The chassis color is fully independent of the
 * screen: the screen content is unlit and never samples these values.
 */
export const PHONE_MATERIAL_PRESETS: Record<
  PhoneColorPreset,
  PhoneMaterialPreset
> = {
  champagne: {
    label: "Champagne",
    color: "#d8c3a0",
    metalness: 0.72,
    roughness: 0.34,
  },
  graphite: {
    label: "Graphite",
    color: "#3a3b40",
    metalness: 0.9,
    roughness: 0.3,
  },
  silver: {
    label: "Silver",
    color: "#c8ccd2",
    metalness: 0.95,
    roughness: 0.2,
  },
  black: {
    label: "Black",
    color: "#141417",
    metalness: 0.7,
    roughness: 0.38,
  },
};

export const PHONE_COLOR_IDS = Object.keys(
  PHONE_MATERIAL_PRESETS,
) as PhoneColorPreset[];
