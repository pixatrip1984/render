import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { DeviceModel } from "./DeviceModel";
import type { PhoneMaterialPreset } from "../phoneConfig";
import { roundedRectShape } from "../geometry";

/**
 * Physical dimensions of the procedural phone (world units).
 *
 * Depth convention: +Z = FRONT (screen), -Z = BACK (rear cameras). A single
 * extruded rounded-rectangle chassis (flat front/back faces, rounded perimeter
 * rail) is closed on the front by a thin black bezel + emissive display + glass
 * overlay, and on the back by a thin rear panel + camera module. The display
 * surface is described in `display` so <Phone> and <PhoneScreen> never need to
 * know how the body is built.
 */

// +Z = FRONT (screen), -Z = BACK (rear cameras).
const BODY = {
  width: 0.46,
  height: 1.0,
  depth: 0.02,
  radius: 0.055, // perimeter corner radius (front/back faces stay flat)
};

const BEZEL = {
  width: 0.44,
  height: 0.98,
  thickness: 0.001,
  radius: 0.045,
  z: 0.0105, // center; sits on the chassis front face (+0.010)
};

const GLASS = {
  width: 0.444,
  height: 0.984,
  thickness: 0.002,
  radius: 0.05,
  z: 0.0123, // center; back face +0.0113 (bonded to the screen plane)
};

const DISPLAY = {
  width: 0.42,
  height: 0.92,
  z: 0.0113, // screen plane, just in front of the bezel
};

const REAR_PANEL = {
  width: 0.45,
  height: 0.99,
  thickness: 0.001,
  radius: 0.05,
  z: -0.0105, // center; closes the chassis back face (-0.010)
};

const LENS_MATERIAL = {
  color: "#1c1e24",
  metalness: 0.9,
  roughness: 0.25,
};

// Rear camera module, assembled outward along -Z (BACK):
//   rear panel -> island base -> lens ring -> lens glass -> flash.
// Every element sits farther toward -Z than the one before it.
const CAMERA_ISLAND = {
  size: 0.15,
  depth: 0.006,
  radius: 0.04,
  x: -0.11,
  y: 0.32,
  z: -0.014, // center: front -0.011 (rear panel), back -0.017
};

const LENS_RING = {
  radius: 0.02,
  tube: 0.0035,
  z: -0.0205, // ring plane: front tip -0.017 (island back), back tip -0.024
};

const LENS_GLASS = {
  radius: 0.0145,
  z: -0.0242, // outermost rear-facing surface
};

const FLASH = {
  radius: 0.008,
  z: -0.0173, // sits on the island back face
};

function SideButtons() {
  const buttonMaterial = { color: "#8a8d92", metalness: 0.9, roughness: 0.3 };
  // right edge, protruding slightly
  return (
    <group>
      <RoundedBox
        args={[0.006, 0.055, 0.012]}
        radius={0.003}
        smoothness={2}
        position={[0.233, 0.14, 0.002]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      <RoundedBox
        args={[0.006, 0.055, 0.012]}
        radius={0.003}
        smoothness={2}
        position={[0.233, 0.06, 0.002]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
      <RoundedBox
        args={[0.006, 0.07, 0.012]}
        radius={0.003}
        smoothness={2}
        position={[0.233, -0.16, 0.002]}
      >
        <meshStandardMaterial {...buttonMaterial} />
      </RoundedBox>
    </group>
  );
}

function RearCameraModule() {
  return (
    <group>
      {/* camera island base, protruding from the rear panel (-Z) */}
      <RoundedBox
        args={[CAMERA_ISLAND.size, CAMERA_ISLAND.size, CAMERA_ISLAND.depth]}
        radius={CAMERA_ISLAND.radius}
        smoothness={4}
        position={[CAMERA_ISLAND.x, CAMERA_ISLAND.y, CAMERA_ISLAND.z]}
      >
        <meshPhysicalMaterial color="#1a1a1e" metalness={0.5} roughness={0.35} />
      </RoundedBox>

      {/* lenses: ring (torus) + outer glass, every part faces BACK (-Z) */}
      {[
        [0.03, 0.03],
        [-0.03, 0.03],
        [0.03, -0.03],
      ].map(([dx, dy], i) => (
        <group key={i} position={[CAMERA_ISLAND.x + dx, CAMERA_ISLAND.y + dy, 0]}>
          {/* lens ring, protruding outward */}
          <mesh position={[0, 0, LENS_RING.z]}>
            <torusGeometry args={[LENS_RING.radius, LENS_RING.tube, 24, 48]} />
            <meshPhysicalMaterial {...LENS_MATERIAL} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>
          {/* lens glass — outermost rear-facing surface */}
          <mesh position={[0, 0, LENS_GLASS.z]} rotation={[0, Math.PI, 0]}>
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

      {/* flash / sensor, on the island back face */}
      <mesh
        position={[CAMERA_ISLAND.x - 0.03, CAMERA_ISLAND.y - 0.03, FLASH.z]}
        rotation={[0, Math.PI, 0]}
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
