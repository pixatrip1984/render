import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three-stdlib";
import type { DeviceModel } from "./DeviceModel";
import type { PhoneMaterialPreset } from "../phoneConfig";
import * as THREE from "three";

/**
 * Loads an external OBJ model for the device body.
 * Uses polygonOffset to prevent z-fighting between screen and body surfaces.
 */

const staticFile = (path: string) => `/models${path}`;

interface OBJPhoneBodyProps {
  material: PhoneMaterialPreset;
}

function OBJPhoneBody({ material }: OBJPhoneBodyProps) {
  const obj = useLoader(OBJLoader, staticFile("/iphone17pro.obj"));

  // Clone and configure materials to prevent z-fighting
  useMemo(() => {
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh;
        
        // Apply phone material to body parts
        if (mesh.material instanceof THREE.Material) {
          const mat = mesh.material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
          
          // Detect screen/display objects and apply polygon offset
          const isScreen = mesh.name.toLowerCase().includes("screen") || 
                          mesh.name.toLowerCase().includes("display") ||
                          mesh.name.toLowerCase().includes("pantalla");
          
          // Detect camera lens objects
          const isCameraLens = mesh.name.toLowerCase().includes("lens") ||
                              mesh.name.toLowerCase().includes("camera") ||
                              mesh.name.toLowerCase().includes("camara");
          
          // Detect flash/sensor objects
          const isFlash = mesh.name.toLowerCase().includes("flash") ||
                         mesh.name.toLowerCase().includes("led") ||
                         mesh.name.toLowerCase().includes("sensor");

          if (isScreen) {
            // Screen needs to be slightly in front with polygon offset
            mesh.renderOrder = 1;
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -2; // Pull forward
            mat.polygonOffsetUnits = -2;
          } else if (isCameraLens || isFlash) {
            // Camera lenses and flash should render after body
            mesh.renderOrder = 2;
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -1;
            mat.polygonOffsetUnits = -1;
          } else {
            // Body material
            mat.color = new THREE.Color(material.color);
            mat.metalness = material.metalness;
            mat.roughness = material.roughness;
            
            if (mat instanceof THREE.MeshPhysicalMaterial) {
              mat.clearcoat = 0.5;
              mat.clearcoatRoughness = 0.2;
            }
          }
          
          mat.needsUpdate = true;
        }
      }
    });
  }, [obj, material]);

  return <primitive object={obj} />;
}

export const objPhoneModel: DeviceModel = {
  id: "iphone-17-pro",
  display: {
    width: 0.412,
    height: 0.915,
    position: [0, 0, 0.0374], // Adjusted to prevent z-fighting with body (~0.03698)
    glass: {
      width: 0.432,
      height: 0.946,
      thickness: 0.0015,
      position: [0, 0, 0.0385], // Glass slightly in front of screen
      radius: 0.046,
    },
  },
  Body: OBJPhoneBody,
};
