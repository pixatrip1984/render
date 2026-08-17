import * as THREE from "three";
import type { DeviceConfig, ScreenConfig } from "../../types/scene";
import LaptopBody from "./LaptopBody";

interface LaptopProps {
  device: DeviceConfig;
  screen: ScreenConfig;
  /** Callback to expose the device group (used by the motion recorder). */
  deviceRef?: (group: THREE.Group | null) => void;
}

/**
 * The laptop device: body (chassis, keyboard, screen, lid) assembled from the
 * MacBook OBJ, placed under the same position/rotation/scale group contract the
 * phone uses so preview framing, animations and the motion recorder treat every
 * device identically.
 */
export function Laptop({ device, screen, deviceRef }: LaptopProps) {
  return (
    <group
      ref={deviceRef}
      position={device.position}
      rotation={device.rotation}
      scale={device.scale}
    >
      <LaptopBody screenSrc={screen.src} />
    </group>
  );
}
