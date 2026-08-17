import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { staticFile } from "remotion";
import type { DeviceModel } from "./DeviceModel";
import type { PhoneMaterialPreset } from "../phoneConfig";

/**
 * The Blender-exported iPhone 17 Pro model (single Grey colorway, extracted to
 * public/models/iphone17pro.obj and centered on its body).
 *
 * Coordinate convention (matches the scene): +Z = FRONT (screen), -Z = BACK
 * (rear cameras). The model's front face is at +Z and the lens barrels protrude
 * toward -Z, so no rotation is needed — only a uniform scale.
 *
 * The model has no MTL/textures, so materials are assigned here by OBJ usemtl
 * name. The body object is one multi-material mesh (geometry groups), the lens
 * barrels/discs are separate meshes.
 */

// Body height in model units is 4.0411; scale to the same 0.95 scene height as
// the procedural phone so camera framing and animations are unchanged.
const MODEL_SCALE = 0.95 / 4.041;

// Front face of the model glass sits at z ≈ 0.03705 after scaling. The screen
// content plane is placed a hair in front of it, and is kept below the Dynamic
// Island pill (pill spans y 0.409..0.449 scaled).
const DISPLAY = {
  width: 0.42,
  height: 0.8,
  z: 0.0374,
};

const GLASS = {
  width: 0.44,
  height: 0.9,
  thickness: 0.0008,
  radius: 0.06,
  z: 0.0386,
};

interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
}

const MATERIALS: Record<string, MaterialConfig> = {
  "Matte_Metallic_Grey": { color: "#70757b", metalness: 1.0, roughness: 0.38, clearcoat: 0.4 },
  "Matte_Metallic_Grey_logo.001": { color: "#70757b", metalness: 1.0, roughness: 0.3, clearcoat: 0.4 },
  "Cam_1": { color: "#06070c", metalness: 0.1, roughness: 0.05, clearcoat: 1.0 },
  "Cam_2": { color: "#05060b", metalness: 0.1, roughness: 0.05, clearcoat: 1.0 },
  "Cam_3": { color: "#06070c", metalness: 0.1, roughness: 0.05, clearcoat: 1.0 },
  "LIDAR_Senser": { color: "#0d0f15", metalness: 0.7, roughness: 0.15 },
  "Torch": { color: "#f6f2e4", metalness: 0.0, roughness: 0.35 },
  "Mic": { color: "#16181d", metalness: 0.4, roughness: 0.6 },
  "Display": { color: "#05060b", metalness: 0.3, roughness: 0.12, clearcoat: 1.0 },
  "Display_Borders": { color: "#0a0b0e", metalness: 0.2, roughness: 0.35 },
  "Dynamic_Iceland": { color: "#0a0b0e", metalness: 0.2, roughness: 0.3 },
  "Side_Dark_Lines.004": { color: "#2b2e34", metalness: 0.9, roughness: 0.35 },
  "Warnex_Black": { color: "#1c1e23", metalness: 0.7, roughness: 0.4 },
  "Metal_Mesh_Grill": { color: "#34373d", metalness: 0.9, roughness: 0.55 },
};

function OBJPhoneBody({ material: _material }: { material: PhoneMaterialPreset }) {
  // Suspends until the 5 MB OBJ is fetched + parsed (Remotion waits via the
  // ThreeCanvas Suspense boundary, the preview wraps the scene in <Suspense>).
  const obj = useLoader(OBJLoader, staticFile("models/iphone17pro.obj")) as THREE.Group;

  useLayoutEffect(() => {
    obj.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || child.userData.iphone17Mat) return;

      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const next = mats.map((m) => {
        const cfg = m ? MATERIALS[m.name] : undefined;
        if (!cfg) return m;
        const mat = new THREE.MeshPhysicalMaterial({
          color: cfg.color,
          metalness: cfg.metalness,
          roughness: cfg.roughness,
          envMapIntensity: 1.05,
          ...(cfg.clearcoat !== undefined
            ? { clearcoat: cfg.clearcoat, clearcoatRoughness: 0.15 }
            : {}),
        });
        mat.name = m.name;
        return mat;
      });

      if (next.length === 1) child.material = next[0];
      else child.material = next;

      child.userData.iphone17Mat = true;
      child.castShadow = true;
    });
  }, [obj]);

  return (
    <group scale={MODEL_SCALE}>
      <primitive object={obj} />
    </group>
  );
}

export const objPhoneModel: DeviceModel = {
  id: "iphone-17-pro",
  display: {
    width: DISPLAY.width,
    height: DISPLAY.height,
    position: [0, 0, DISPLAY.z],
    glass: {
      width: GLASS.width,
      height: GLASS.height,
      thickness: GLASS.thickness,
      position: [0, 0, GLASS.z],
      radius: GLASS.radius,
    },
  },
  Body: OBJPhoneBody,
};
