import React, { Component, Suspense, useMemo, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { defaultScene } from "../config/defaultScene";
import { Scene } from "../three/Scene";
import { GL_PROPS, MAX_DPR, SHADOW_PROPS } from "../three/renderSettings";
import type { SceneConfig } from "../types/scene";
import { Sidebar } from "./controls/Sidebar";
import { MotionController } from "./motion/MotionController";
import { MotionStore } from "./motion/motionStore";
import { MotionTimeline } from "./motion/MotionTimeline";

class SceneErrorBoundary extends Component<
  { children: React.ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(err: unknown) {
    return { message: err instanceof Error ? err.message : String(err) };
  }

  render() {
    if (this.state.message) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ff7b72",
            padding: 24,
            textAlign: "center",
          }}
        >
          {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Interactive design preview. OrbitControls live here and here only — the
 * Remotion compositions use <CameraRig> and never touch OrbitControls, keeping
 * render output deterministic and independent of interactive state.
 */
export const Preview: React.FC = () => {
  const [config, setConfig] = useState<SceneConfig>(defaultScene);

  // The motion recorder/player store (single instance for the session).
  const store = useMemo(() => new MotionStore(), []);
  // The device group, exposed by Scene so the recorder can read/drive it.
  const deviceRef = useRef<THREE.Object3D | null>(null);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <Canvas
            shadows={SHADOW_PROPS}
            gl={GL_PROPS}
            dpr={[1, MAX_DPR]}
            camera={{
              fov: config.camera.fov,
              position: config.camera.position,
              near: 0.1,
              far: 100,
            }}
          >
            <SceneErrorBoundary>
              <Suspense fallback={null}>
                <Scene
                  config={config}
                  deviceRef={(g) => {
                    deviceRef.current = g;
                  }}
                />
              </Suspense>
            </SceneErrorBoundary>
            <OrbitControls
              makeDefault
              target={config.camera.target}
              enableDamping
              dampingFactor={0.08}
            />
            <MotionController
              deviceRef={deviceRef}
              store={store}
              initialPose={{
                position: config.device.position,
                rotation: config.device.rotation,
              }}
            />
          </Canvas>
        </div>

        {/* Timeline lives in the MAIN space (not the right sidebar). */}
        <MotionTimeline store={store} />
      </div>
      <Sidebar config={config} onChange={setConfig} />
    </div>
  );
};
