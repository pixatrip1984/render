import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { DeviceModel } from "./DeviceModel";
import type { PhoneMaterialPreset } from "../phoneConfig";
import { roundedRectShape } from "../geometry";

/**
 * Physical dimensions of the procedural phone (world units).
 * iPhone-style design with corrected rear camera module.
 *
 * Depth convention: +Z = FRONT (screen), -Z = BACK (rear cameras). A single
 * extruded rounded-rectangle chassis (flat front/back faces, rounded perimeter
 * rail) is closed on the front by a thin black bezel + emissive display + glass
 * overlay, and on the back by a thin rear panel + camera module. The display
 * surface is described in `display` so <Phone> and <PhoneScreen> never need to
 * know how the body is built.
 */

// +Z = FRONT (screen), -Z = BACK (rear cameras).
// iPhone-like proportions: taller and slightly narrower
const BODY = {
  width: 0.44,
  height: 0.95,
  depth: 0.018,
  radius: 0.048, // perimeter corner radius (front/back faces stay flat)
};

const BEZEL = {
  width: 0.42,
  height: 0.93,
  thickness: 0.001,
  radius: 0.04,
  z: 0.0095, // center; sits on the chassis front face (+0.009)
};

const GLASS = {
  width: 0.424,
  height: 0.934,
  thickness: 0.002,
  radius: 0.042,
  z: 0.0113, // center; back face +0.0103 (bonded to the screen plane)
};

const DISPLAY = {
  width: 0.40,
  height: 0.88,
  z: 0.0103, // screen plane, just in front of the bezel
};

const REAR_PANEL = {
  width: 0.43,
  height: 0.94,
  thickness: 0.001,
  radius: 0.042,
  z: -0.0095, // center; closes the chassis back face (-0.009)
};

const LENS_MATERIAL = {
  color: "#1c1e24",
  metalness: 0.9,
  roughness: 0.25,
};

// Rear camera module for iPhone-style design: square camera island in top-left corner
// with properly oriented lenses facing outward (-Z direction).
// The camera bump protrudes from the back, with lenses correctly positioned.
const CAMERA_ISLAND = {
  size: 0.18,
  depth: 0.005,
  radius: 0.025,
  x: -0.13,
  y: 0.35,
  z: -0.0115, // center: sits on rear panel surface
};

const LENS_RING = {
  radius: 0.025,
  tube: 0.004,
  z: -0.016, // ring plane: protrudes from island surface toward -Z
};

const LENS_GLASS = {
  radius: 0.019,
  z: -0.0195, // outermost rear-facing surface of each lens
};

const FLASH = {
  radius: 0.009,
  z: -0.0145, // sits slightly proud of island surface
};

function SideButtons() {
  const buttonMaterial = { color: "#8a8d92", metalness: 0.9, roughness: 0.3 };
  // iPhone-style buttons on the right edge (volume up/down and power button)
  return (
    <group>
      {/* Volume up button - left edge */}
      <RoundedBox
        args={[0.005, 0.045, 0.01]}
        radius={0.002}
        smoothness={2}
        position={[-0.223, 0.18, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Volume down button - left edge */}
      <RoundedBox
        args={[0.005, 0.045, 0.01]}
        radius={0.002}
        smoothness={2}
        position={[-0.223, 0.1, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Action button / mute switch - left edge, above volume buttons */}
      <RoundedBox
        args={[0.005, 0.025, 0.01]}
        radius={0.002}
        smoothness={2}
        position={[-0.223, 0.26, 0.001]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      {/* Power button - right edge */}
      <RoundedBox
        args={[0.005, 0.06, 0.01]}
        radius={0.002}
        smoothness={2}
        position={[0.223, 0.0, 0.001]}
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

      {/* iPhone-style lens arrangement: diagonal triple-lens system
       * Lenses correctly face outward (toward -Z, away from the phone)
       * Top-left, top-right, and bottom-left positions in a triangular pattern
       */}
      {[
        [0.045, 0.045],   // top-right lens
        [-0.045, 0.045],  // top-left lens
        [0.045, -0.045],  // bottom-right lens
      ].map(([dx, dy], i) => (
        <group key={i} position={[CAMERA_ISLAND.x + dx, CAMERA_ISLAND.y + dy, 0]}>
          {/* lens ring - metallic housing that holds the lens glass */}
          <mesh position={[0, 0, LENS_RING.z]}>
            <torusGeometry args={[LENS_RING.radius, LENS_RING.tube, 24, 48]} />
            <meshPhysicalMaterial {...LENS_MATERIAL} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          {/* lens glass - dark circular surface facing BACK (-Z), no rotation needed */}
          <mesh position={[0, 0, LENS_GLASS.z]}>
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

      {/* flash / sensor array, positioned on the island surface */}
      <mesh
        position={[CAMERA_ISLAND.x - 0.045, CAMERA_ISLAND.y - 0.045, FLASH.z]}
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
      
      {/* LiDAR sensor dot - small black circle typical of iPhone Pro models */}
      <mesh
        position={[CAMERA_ISLAND.x + 0.02, CAMERA_ISLAND.y - 0.02, FLASH.z]}
      >
        <circleGeometry args={[0.005, 16]} />
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
};
