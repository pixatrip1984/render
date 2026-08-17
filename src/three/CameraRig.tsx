import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { CameraConfig } from "../types/scene";

/**
 * Declarative, phone-decoupled PerspectiveCamera.
 *
 * Position/target/fov come from the scene config and can be animated frame by
 * frame from Remotion (the component re-runs `useLayoutEffect` each frame).
 * This camera is used only by the deterministic render path; the interactive
 * preview uses OrbitControls instead.
 */
export function CameraRig({ camera }: { camera: CameraConfig }) {
  const cam = useThree((state) => state.camera) as THREE.PerspectiveCamera;

  useLayoutEffect(() => {
    cam.fov = camera.fov;
    cam.near = 0.1;
    cam.far = 100;
    cam.position.set(
      camera.position[0],
      camera.position[1],
      camera.position[2],
    );
    cam.lookAt(camera.target[0], camera.target[1], camera.target[2]);
    cam.updateProjectionMatrix();
  }, [cam, camera]);

  return null;
}
