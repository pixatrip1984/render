import type { DeviceConfig, ScreenConfig } from "../../types/scene";
import { DEVICE_MODELS } from "./device/ProceduralPhoneBody";
import { objPhoneModel } from "./device/OBJPhoneBody";

// Register the OBJ-based iPhone 17 Pro model
const ALL_DEVICE_MODELS = {
  ...DEVICE_MODELS,
  [objPhoneModel.id]: objPhoneModel,
};
import { PHONE_MATERIAL_PRESETS } from "./phoneConfig";
import { PhoneScreen } from "./PhoneScreen";

interface PhoneProps {
  device: DeviceConfig;
  screen: ScreenConfig;
}

/**
 * Assembles a device model and its replaceable screen.
 *
 * The body and the screen surface are decoupled: the body renders from the
 * ALL_DEVICE_MODELS registry (procedural now, OBJ models like iphone-17-pro later)
 * and the screen is placed from the model's `display` descriptor. 
 * Swapping the body never touches PhoneScreen, Scene, animations, or compositions.
 */
export function Phone({ device, screen }: PhoneProps) {
  const model = ALL_DEVICE_MODELS[device.model];
  if (!model) {
    throw new Error(`Unknown device model "${device.model}"`);
  }

  const material = PHONE_MATERIAL_PRESETS[device.color];
  const Body = model.Body;

  return (
    <group
      position={device.position}
      rotation={device.rotation}
      scale={device.scale}
    >
      <Body material={material} />
      <PhoneScreen display={model.display} screen={screen} />
    </group>
  );
}
