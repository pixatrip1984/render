import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { staticFile } from "remotion";
import { useScreenTexture } from "../Phone/useScreenTexture";

/**
 * The Blender-exported MacBook Pro (open). Extracted from LAPTOP-ASSETS to
 * public/models/macbookpro/.
 *
 * Structure (usemtl groups, from a Blender export):
 *  - "macBook_TopPart_Cube.004"  -> lid: Screen, Emission, Logo, Main, Text,
 *                                   Camera, Camera1, CameraGreen, Outline
 *  - "macBook_BottomPart_Cube.005" -> base: Black, Main, Second, KeysMain,
 *                                   KeysBottom, TopLine, DarkGrey
 *  - "Plane" (Material.001)      -> a huge 96x96 backdrop plane baked into the
 *                                   export. Hidden here; it would otherwise
 *                                   dominate the bounding box.
 *
 * The laptop has no usable MTL colors (Blender export leaves most Kd at 0.8),
 * so materials are assigned here by usemtl name. The screen is a single ngon
 * with UVs, so we texture it with the active wallpaper as an unlit emissive
 * panel (screens emit light, they don't receive it).
 */

/** Target width in scene units. The OBJ body is ~3.46 wide (model units). */
const TARGET_WIDTH = 1.2;

/** The backdrop plane baked into the export; hide it. */
const BACKDROP_MATERIAL = "Material.001";

/**
 * Interior parts that must NOT cast the ground shadow. The keyboard well, keys,
 * trackpad and recessed deck pieces sit inside the chassis and poke out at the
 * light's grazing angle, so they project a "keyboard skeleton" ghost shadow
 * (outline + key shapes) offset from the laptop. Only the outer shell (Main,
 * Second, lid details) should cast the silhouette.
 */
const NO_SHADOW_CAST = new Set(["Black", "KeysMain", "KeysBottom", "DarkGrey", "TopLine"]);

interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

const MATERIALS: Record<string, MaterialConfig> = {
  Main: { color: "#3c3f45", metalness: 0.9, roughness: 0.34, clearcoat: 0.35 },
  Second: { color: "#2f3237", metalness: 0.85, roughness: 0.4 },
  Black: { color: "#191a1d", metalness: 0.6, roughness: 0.5 },
  DarkGrey: { color: "#26282c", metalness: 0.7, roughness: 0.45 },
  KeysMain: { color: "#1d1e22", metalness: 0.5, roughness: 0.5 },
  KeysBottom: { color: "#121316", metalness: 0.5, roughness: 0.55 },
  TopLine: { color: "#33363c", metalness: 0.8, roughness: 0.4 },
  Text: { color: "#0b0c0e", metalness: 0.3, roughness: 0.6 },
  Outline: { color: "#0a0b0d", metalness: 0.4, roughness: 0.5 },
  Camera: { color: "#0a0c10", metalness: 0.2, roughness: 0.05, clearcoat: 1 },
  Camera1: { color: "#05060a", metalness: 0.2, roughness: 0.05, clearcoat: 1 },
  CameraGreen: { color: "#04150c", metalness: 0.1, roughness: 0.05, clearcoat: 1 },
  Emission: { color: "#ffffff", metalness: 0, roughness: 0.4, emissive: "#ffffff", emissiveIntensity: 1.6 },
  Logo: { color: "#c9ccd2", metalness: 0.9, roughness: 0.25 },
};

function LaptopBody({ screenSrc }: { screenSrc: string }) {
  const obj = useLoader(OBJLoader, staticFile("models/macbookpro/MacBookPro.obj")) as THREE.Group;
  const screenTexture = useScreenTexture(screenSrc);

  // Normalize: center the body (excluding the backdrop plane) on the origin and
  // scale so the laptop is TARGET_WIDTH wide. Compute the bounding box from kept
  // meshes only, before any transform is applied (all matrices are identity at
  // this point).
  const { center, scale } = useMemo(() => {
    const box = new THREE.Box3();
    let first = true;
    obj.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const name = mats[0]?.name ?? "";
      if (name === BACKDROP_MATERIAL) return;
      child.geometry.computeBoundingBox();
      if (!child.geometry.boundingBox) return;
      if (first) {
        box.copy(child.geometry.boundingBox);
        first = false;
      } else {
        box.union(child.geometry.boundingBox);
      }
    });
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return { center, scale: TARGET_WIDTH / size.x };
  }, [obj]);

  useLayoutEffect(() => {
    obj.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || child.userData.macbookMat) return;

      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const castName = mats[0]?.name ?? "";
      child.castShadow = !NO_SHADOW_CAST.has(castName);
      const next = mats.map((m) => {
        const name = m?.name ?? "";
        if (name === BACKDROP_MATERIAL) {
          child.visible = false;
          return m;
        }
        if (name === "Screen") {
          // Unlit, lighting-independent screen panel (screens emit light).
          const mat = new THREE.MeshBasicMaterial({
            map: screenTexture,
            toneMapped: false,
          });
          mat.name = name;
          return mat;
        }
        const cfg = MATERIALS[name];
        if (!cfg) return m;
        const mat = new THREE.MeshPhysicalMaterial({
          color: cfg.color,
          metalness: cfg.metalness,
          roughness: cfg.roughness,
          envMapIntensity: 1.05,
          ...(cfg.emissive
            ? { emissive: cfg.emissive, emissiveIntensity: cfg.emissiveIntensity ?? 1 }
            : {}),
          ...(cfg.clearcoat !== undefined
            ? { clearcoat: cfg.clearcoat, clearcoatRoughness: 0.15 }
            : {}),
        });
        mat.name = name;
        return mat;
      });

      if (next.length === 1) child.material = next[0];
      else child.material = next;

      child.userData.macbookMat = true;
      child.receiveShadow = true;
    });
  }, [obj, screenTexture]);

  return (
    <group
      scale={scale}
      position={[-center.x * scale, -center.y * scale, -center.z * scale]}
    >
      <primitive object={obj} />
    </group>
  );
}

export default LaptopBody;
