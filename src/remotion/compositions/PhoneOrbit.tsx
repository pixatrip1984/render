import React from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { defaultScene } from "../../config/defaultScene";
import { CameraRig } from "../../three/CameraRig";
import { Scene } from "../../three/Scene";
import { GL_PROPS, SHADOW_PROPS } from "../../three/renderSettings";
import type { SceneConfig } from "../../types/scene";
import { interpolateProgress } from "../animation/interpolate";

const DURATION_IN_FRAMES = 150;

/**
 * Minimal deterministic proof: phone rotationY -20° → +15° plus a very light
 * camera drift, all driven by the Remotion frame (never the real clock).
 */
export const PhoneOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const rotY = interpolateProgress({
    frame,
    from: 0,
    to: DURATION_IN_FRAMES,
    easing: "easeInOut",
    outputRange: [-0.35, 0.26],
  });

  const camX = interpolate(frame, [0, DURATION_IN_FRAMES], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camY = interpolate(frame, [0, DURATION_IN_FRAMES], [0.4, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scene: SceneConfig = {
    ...defaultScene,
    screen: { ...defaultScene.screen, src: staticFile(defaultScene.screen.src) },
    device: { ...defaultScene.device, rotation: [0, rotY, 0] },
    camera: {
      ...defaultScene.camera,
      position: [camX, camY, defaultScene.camera.position[2]],
    },
  };

  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      <ThreeCanvas width={width} height={height} gl={GL_PROPS} dpr={1} shadows={SHADOW_PROPS}>
        <Scene config={scene} />
        <CameraRig camera={scene.camera} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
