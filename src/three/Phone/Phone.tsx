import type { DeviceConfig, ScreenConfig } from "../../types/scene";
import { DEVICE_MODELS } from "./device/ProceduralPhoneBody";
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
 * DEVICE_MODELS registry (procedural now, a .glb later) and the screen is
 * placed from the model's `display` descriptor. Swapping the body never
 * touches PhoneScreen, Scene, animations, or compositions.
 */
export function Phone({ device, screen }: PhoneProps) {
  const model = DEVICE_MODELS[device.model];
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
