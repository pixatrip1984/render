import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { ScreenConfig } from "../../types/scene";
import type { DisplaySurface } from "./device/DeviceModel";
import { useScreenTexture } from "./useScreenTexture";
import { roundedRectGeometry, roundedRectShape } from "./geometry";

interface PhoneScreenProps {
  display: DisplaySurface;
  screen: ScreenConfig;
}

/**
 * The replaceable display surface.
 *
 * Two physically separated layers (avoids z-fighting):
 *  - ScreenContent: unlit emissive plane (meshBasicMaterial, toneMapped=false)
 *    so the screenshot keeps its colors and brightness regardless of lights.
 *  - ScreenGlass: a thin, transparent physical glass just in front, with a
 *    subtle clearcoat reflection (needs an environment map).
 *
 * UV cover/contain is computed against the device's own `display` dimensions,
 * so a different device model with a different display never needs changes here.
 */
export function PhoneScreen({ display, screen }: PhoneScreenProps) {
  const texture = useScreenTexture(screen.src);

  const { repeatX, repeatY, offsetX, offsetY } = useMemo(() => {
    const img = texture.image as HTMLImageElement | null | undefined;
    if (!img || !img.width || !img.height) {
      return { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 };
    }
    const texAspect = img.width / img.height;
    const dispAspect = display.width / display.height;
    let rx = 1;
    let ry = 1;

    if (screen.fit === "cover") {
      if (texAspect > dispAspect) rx = dispAspect / texAspect;
      else ry = texAspect / dispAspect;
    } else {
      if (texAspect > dispAspect) ry = dispAspect / texAspect;
      else rx = texAspect / dispAspect;
    }

    return {
      repeatX: rx,
      repeatY: ry,
      offsetX: (1 - rx) / 2,
      offsetY: (1 - ry) / 2,
    };
  }, [texture, display.width, display.height, screen.fit]);

  useLayoutEffect(() => {
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(offsetX, offsetY);
    texture.needsUpdate = true;
  }, [texture, repeatX, repeatY, offsetX, offsetY]);

  const brightness = useMemo(
    () => new THREE.Color(screen.brightness, screen.brightness, screen.brightness),
    [screen.brightness],
  );

  const glass = display.glass;

  const contentGeometry = useMemo(
    () => roundedRectGeometry(display.width, display.height, display.cornerRadius),
    [display.width, display.height, display.cornerRadius],
  );

  const glassShape = useMemo(
    () => roundedRectShape(glass.width, glass.height, glass.radius),
    [glass.width, glass.height, glass.radius],
  );

  const sensor = display.sensor;
  const islandShape = useMemo(
    () =>
      sensor
        ? roundedRectShape(sensor.width, sensor.height, sensor.height / 2)
        : null,
    [sensor],
  );

  return (
    <group>
      {/* ScreenContent — emissive, lighting-independent, rounded to the display cutout */}
      <mesh position={display.position} geometry={contentGeometry}>
        <meshBasicMaterial
          map={texture}
          color={brightness}
          toneMapped={false}
        />
      </mesh>

      {/* Front sensor cluster — Dynamic Island pill + camera lens, proud of the screen */}
      {sensor && islandShape && (
        <group position={sensor.position}>
          <mesh>
            <shapeGeometry args={[islandShape]} />
            <meshBasicMaterial color="#0a0b0e" />
          </mesh>
          <mesh position={[sensor.lens.x, sensor.lens.y, 0.0006]}>
            <circleGeometry args={[sensor.lens.radius, 32]} />
            <meshPhysicalMaterial
              color="#16202f"
              roughness={0.08}
              metalness={0.7}
              clearcoat={1}
              clearcoatRoughness={0.1}
              envMapIntensity={1.2}
            />
          </mesh>
        </group>
      )}

      {/* ScreenGlass — subtle transparent reflection, flat front with rounded perimeter */}
      <mesh
        position={[
          glass.position[0],
          glass.position[1],
          glass.position[2] - glass.thickness / 2,
        ]}
      >
        <extrudeGeometry
          args={[glassShape, { depth: glass.thickness, bevelEnabled: false }]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.16}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.15}
          envMapIntensity={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
