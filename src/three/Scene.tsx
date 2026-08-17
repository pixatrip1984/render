import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneConfig } from "../types/scene";
import { LightingRig } from "./LightingRig";
import { Laptop } from "./Laptop/Laptop";
import { Phone } from "./Phone/Phone";

/**
 * Shared product scene: background, lighting, ground shadow-catcher and the
 * phone. Deliberately camera-free — the render path adds <CameraRig>, the
 * preview adds OrbitControls. Both consume the exact same scene/model.
 *
 * The background is set on the scene object directly (not via a <color
 * attach="background"> child) so it works regardless of where <Scene> is
 * mounted inside the Canvas.
 */
export function Scene({
  config,
  deviceRef,
}: {
  config: SceneConfig;
  deviceRef?: (group: THREE.Group | null) => void;
}) {
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    scene.background = new THREE.Color(config.background);
  }, [scene, config.background]);

  return (
    <group>
      <LightingRig preset={config.lighting.preset} />
      {config.device.type === "laptop" ? (
        <Laptop device={config.device} screen={config.screen} deviceRef={deviceRef} />
      ) : (
        <Phone device={config.device} screen={config.screen} deviceRef={deviceRef} />
      )}

      {config.ground.enabled && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.52, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.22} />
        </mesh>
      )}
    </group>
  );
}
