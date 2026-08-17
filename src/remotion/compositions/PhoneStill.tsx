import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { defaultScene } from "../../config/defaultScene";
import { CameraRig } from "../../three/CameraRig";
import { Scene } from "../../three/Scene";
import { GL_PROPS, SHADOW_PROPS } from "../../three/renderSettings";
import type { SceneConfig } from "../../types/scene";

const stillScene: SceneConfig = {
  ...defaultScene,
  screen: { ...defaultScene.screen, src: staticFile(defaultScene.screen.src) },
};

export const PhoneStill: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: stillScene.background }}>
      <ThreeCanvas width={width} height={height} gl={GL_PROPS} dpr={1} shadows={SHADOW_PROPS}>
        <Scene config={stillScene} />
        <CameraRig camera={stillScene.camera} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
