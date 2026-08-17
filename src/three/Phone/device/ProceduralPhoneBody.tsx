import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { DeviceModel } from "./DeviceModel";
import type { PhoneMaterialPreset } from "../phoneConfig";
import { roundedRectShape } from "../geometry";
import { objPhoneModel } from "./OBJPhoneBody";

/**
 * Physical dimensions of the procedural phone (world units).
 * iPhone 16 Pro exact design with precise camera module placement.
 *
 * Depth convention: +Z = FRONT (screen), -Z = BACK (rear cameras). A single
 * extruded rounded-rectangle chassis (flat front/back faces, rounded perimeter
 * rail) is closed on the front by a thin black bezel + emissive display + glass
 * overlay, and on the back by a thin rear panel + camera module. The display
 * surface is described in `display` so <Phone> and <PhoneScreen> never need to
 * know how the body is built.
 */

// +Z = FRONT (screen), -Z = BACK (rear cameras).
// iPhone 16 Pro proportions: 6.3" screen ratio ≈ 0.437 width/height
const BODY = {
  width: 0.437,
  height: 0.95,
  depth: 0.019,
  radius: 0.052, // perimeter corner radius (iPhone-style rounded corners)
};

const BEZEL = {
  width: 0.428,
  height: 0.942,
  thickness: 0.0008, // Ultra-thin bezel like iPhone 16 Pro
  radius: 0.044,
  z: 0.0098, // center; sits on the chassis front face
};

const GLASS = {
  width: 0.432,
  height: 0.946,
  thickness: 0.0015,
  radius: 0.046,
  z: 0.0112, // center; back face bonded to the screen plane
};

const DISPLAY = {
  width: 0.412,
  height: 0.915,
  cornerRadius: 0.04,
  z: 0.0105, // screen plane, just in front of the bezel
};

const REAR_PANEL = {
  width: 0.435,
  height: 0.948,
  thickness: 0.0008,
  radius: 0.046,
  z: -0.0098, // center; closes the chassis back face
};

const LENS_MATERIAL = {
  color: "#1a1c22",
  metalness: 0.95,
  roughness: 0.2,
};

// iPhone 16 Pro camera island: large square bump in top-left corner
// Based on CAD design from reference image
const CAMERA_ISLAND = {
  size: 0.21,           // Large square base (~48% of phone width)
  depth: 0.006,         // Camera bump protrusion from back panel
  radius: 0.015,        // Rounded corners on the island
  x: -0.115,            // Positioned in top-left corner with proper margin
  y: 0.34,              // Vertical position from center
  z: -0.0125,           // Base sits on rear panel surface
};

const LENS_RING = {
  radius: 0.032,        // Lens rings for iPhone 16 Pro
  tube: 0.005,          // Metallic ring thickness
  z: 0.008,             // Lens rings sit ON TOP of island base
};

const LENS_GLASS = {
  radius: 0.024,        // Lens glass diameter
  z: 0.0105,            // Outermost rear-facing surface
};

// iPhone 16 Pro lens positions: triangular pattern
// Top lens centered, two bottom lenses forming the base of triangle
const LENS_POSITIONS = [
  [0.0, 0.055],       // Top-center lens
  [-0.052, -0.032],   // Bottom-left lens
  [0.052, -0.032],    // Bottom-right lens
];

const FLASH = {
  radius: 0.012,
  position: [-0.065, 0.052],  // Flash to the left of top lens
  z: 0.006,
};

const LIDAR = {
  radius: 0.006,
  position: [0.065, -0.052],  // LiDAR sensor at bottom-right
  z: 0.005,
};

function SideButtons() {
  const buttonMaterial = { color: "#8a8d92", metalness: 0.9, roughness: 0.3 };
  // iPhone 16 Pro buttons: Action button on left, volume controls on right, power on right
  return (
    <group>
      {/* Action button - left edge, upper position */}
      <RoundedBox
        args={[0.004, 0.028, 0.008]}
        radius={0.002}
        smoothness={2}
        position={[-0.221, 0.28, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Volume up button - right edge, upper */}
      <RoundedBox
        args={[0.004, 0.048, 0.008]}
        radius={0.002}
        smoothness={2}
        position={[0.221, 0.19, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Volume down button - right edge, lower than volume up */}
      <RoundedBox
        args={[0.004, 0.048, 0.008]}
        radius={0.002}
        smoothness={2}
        position={[0.221, 0.095, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Power/Side button - left edge, centered vertically */}
      <RoundedBox
        args={[0.004, 0.075, 0.008]}
        radius={0.002}
        smoothness={2}
        position={[-0.221, 0.02, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
    </group>
  );
}

function RearCameraModule() {
  return (
    <group>
      {/* camera island base - square bump protruding from the rear panel (-Z) */}
      <RoundedBox
        args={[CAMERA_ISLAND.size, CAMERA_ISLAND.size, CAMERA_ISLAND.depth]}
        radius={CAMERA_ISLAND.radius}
        smoothness={4}
        position={[CAMERA_ISLAND.x, CAMERA_ISLAND.y, CAMERA_ISLAND.z]}
      >
        <meshPhysicalMaterial color="#1a1a1e" metalness={0.5} roughness={0.35} />
      </RoundedBox>

      {/* iPhone 16 Pro-style lens arrangement: triangular pattern with lenses ON TOP of the bump
       * Lenses correctly face outward (toward -Z, away from the phone)
       * Top-center, bottom-left, and bottom-right positions
       */}
      {LENS_POSITIONS.map(([dx, dy], i) => (
        <group key={i} position={[CAMERA_ISLAND.x + dx, CAMERA_ISLAND.y + dy, 0]}>
          {/* lens ring - metallic housing that holds the lens glass, sits ON TOP of island */}
          <mesh position={[0, 0, CAMERA_ISLAND.z + LENS_RING.z]} rotation={[Math.PI, 0, 0]}>
            <torusGeometry args={[LENS_RING.radius, LENS_RING.tube, 24, 48]} />
            <meshPhysicalMaterial {...LENS_MATERIAL} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          {/* lens glass - dark circular surface facing BACK (-Z), sits slightly beyond the ring */}
          <mesh position={[0, 0, CAMERA_ISLAND.z + LENS_GLASS.z]} rotation={[Math.PI, 0, 0]}>
            <circleGeometry args={[LENS_GLASS.radius, 32]} />
            <meshPhysicalMaterial
              color="#05060a"
              metalness={0.6}
              roughness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* flash / sensor array, positioned on the island surface to the left of top lens */}
      <mesh
        position={[CAMERA_ISLAND.x + FLASH.position[0], CAMERA_ISLAND.y + FLASH.position[1], CAMERA_ISLAND.z + FLASH.z]}
        rotation={[Math.PI, 0, 0]}
      >
        <circleGeometry args={[FLASH.radius, 24]} />
        <meshPhysicalMaterial
          color="#f2ead8"
          metalness={0.1}
          roughness={0.3}
          emissive="#fff6e0"
          emissiveIntensity={0.35}
        />
      </mesh>
      
      {/* LiDAR sensor dot - small black circle typical of iPhone Pro models, at bottom-right area */}
      <mesh
        position={[CAMERA_ISLAND.x + LIDAR.position[0], CAMERA_ISLAND.y + LIDAR.position[1], CAMERA_ISLAND.z + LIDAR.z]}
        rotation={[Math.PI, 0, 0]}
      >
        <circleGeometry args={[LIDAR.radius, 16]} />
        <meshPhysicalMaterial
          color="#0a0a0f"
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

const ProceduralPhoneBody: DeviceModel["Body"] = ({ material }) => {
  const chassisShape = useMemo(
    () => roundedRectShape(BODY.width, BODY.height, BODY.radius),
    [],
  );
  const bezelShape = useMemo(
    () => roundedRectShape(BEZEL.width, BEZEL.height, BEZEL.radius),
    [],
  );
  const rearShape = useMemo(
    () => roundedRectShape(REAR_PANEL.width, REAR_PANEL.height, REAR_PANEL.radius),
    [],
  );

  return (
    <group>
      {/* single structural chassis: flat front/back faces, rounded perimeter rail */}
      <mesh position={[0, 0, -BODY.depth / 2]} castShadow>
        <extrudeGeometry args={[chassisShape, { depth: BODY.depth, bevelEnabled: false }]} />
        <meshPhysicalMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* thin black bezel closing the front face (frame around the screen) */}
      <mesh position={[0, 0, BEZEL.z - BEZEL.thickness / 2]}>
        <extrudeGeometry args={[bezelShape, { depth: BEZEL.thickness, bevelEnabled: false }]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.1} roughness={0.35} />
      </mesh>

      {/* thin rear panel closing the back face */}
      <mesh position={[0, 0, REAR_PANEL.z - REAR_PANEL.thickness / 2]}>
        <extrudeGeometry args={[rearShape, { depth: REAR_PANEL.thickness, bevelEnabled: false }]} />
        <meshPhysicalMaterial
          color={material.color}
          metalness={material.metalness}
          roughness={material.roughness}
          envMapIntensity={1.1}
        />
      </mesh>

      <SideButtons />
      <RearCameraModule />
    </group>
  );
};

export const proceduralPhoneModel: DeviceModel = {
  id: "procedural-phone",
  display: {
    width: DISPLAY.width,
    height: DISPLAY.height,
    cornerRadius: DISPLAY.cornerRadius,
    position: [0, 0, DISPLAY.z],
    glass: {
      width: GLASS.width,
      height: GLASS.height,
      thickness: GLASS.thickness,
      position: [0, 0, GLASS.z],
      radius: GLASS.radius,
    },
  },
  Body: ProceduralPhoneBody,
};

export const DEVICE_MODELS: Record<string, DeviceModel> = {
  [proceduralPhoneModel.id]: proceduralPhoneModel,
  [objPhoneModel.id]: objPhoneModel,
};
