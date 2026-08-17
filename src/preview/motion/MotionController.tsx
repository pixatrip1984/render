import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { Vec3 } from "../../types/scene";
import { buildTimeRemap, sampleKeyframes } from "./motionEngine";
import { MotionStore, useMotionMode } from "./motionStore";

const ROT_SENSITIVITY = 0.006; // radians per pixel (free-drag spin)
const PAN_SCALE = 0.0012; // world units per pixel per unit of camera depth

interface MotionControllerProps {
  deviceRef: React.RefObject<THREE.Object3D | null>;
  store: MotionStore;
  /** Config pose, used to reset the device when the recording is cleared. */
  initialPose: { position: Vec3; rotation: Vec3 };
  /** OrbitControls target (config.camera.target). */
  cameraTarget: Vec3;
}

const SAMPLE_INTERVAL = 1 / 30; // 30 keyframes per second while recording

/**
 * Lives inside the Canvas. Owns the TransformControls gizmo and the frame loop:
 *  - record: sample the gizmo-driven device transform into keyframes.
 *  - play:   advance the playhead, resolve speed markers, drive the device.
 *
 * Reads the store mutably in `useFrame` (no React re-render per frame) and only
 * subscribes to mode/gizmo/resetNonce so the gizmo re-renders when it must.
 */
export function MotionController({ deviceRef, store, initialPose, cameraTarget }: MotionControllerProps) {
  const { mode, gizmo, resetNonce } = useMotionMode(store);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  // The TransformControls need the concrete Object3D (not the ref, which may be
  // null while the device OBJ is still suspending). Track it via useFrame.
  const [device, setDevice] = useState<THREE.Object3D | null>(null);
  const tcRef = useRef<any>(null);

  const acc = useRef({ sample: 0, time: 0, initialized: false });
  const dragState = useRef({ active: false, lastX: 0, lastY: 0 });

  useFrame((_, delta) => {
    const d = deviceRef.current;
    if (d && d !== device) setDevice(d);

    if (!d) return;
    const s = store.getState();

    if (s.mode === "record") {
      if (!acc.current.initialized) {
        acc.current.initialized = true;
        store.addKeyframe({
          time: 0,
          position: [d.position.x, d.position.y, d.position.z],
          rotation: [d.rotation.x, d.rotation.y, d.rotation.z],
        });
      }
      acc.current.time += delta;
      acc.current.sample += delta;
      if (acc.current.sample >= SAMPLE_INTERVAL) {
        acc.current.sample -= SAMPLE_INTERVAL;
        store.addKeyframe({
          time: acc.current.time,
          position: [d.position.x, d.position.y, d.position.z],
          rotation: [d.rotation.x, d.rotation.y, d.rotation.z],
        });
      }
    } else if (s.mode === "play") {
      const rec = s.recording;
      if (!rec || rec.keyframes.length === 0) {
        store.setMode("idle");
        return;
      }
      const duration = Math.max(rec.duration, 0.001);
      const remap = buildTimeRemap(s.markers);
      const next = s.playhead + delta / duration;
      const p = next >= 1 ? 1 : next;
      const sourceTime = remap(p) * rec.duration;
      const sample = sampleKeyframes(rec, sourceTime);
      if (sample) {
        d.position.set(sample.position[0], sample.position[1], sample.position[2]);
        d.rotation.set(sample.rotation[0], sample.rotation[1], sample.rotation[2]);
      }
      if (next >= 1) store.finishPlayback();
      else store.advancePlayhead(next);
    }
  });

  // Reset the device pose when the recording is cleared.
  useEffect(() => {
    if (resetNonce === 0) return;
    const d = deviceRef.current;
    if (d) {
      d.position.set(initialPose.position[0], initialPose.position[1], initialPose.position[2]);
      d.rotation.set(initialPose.rotation[0], initialPose.rotation[1], initialPose.rotation[2]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce]);

  // Reset the per-recording accumulator whenever we enter record mode.
  useEffect(() => {
    if (mode === "record") {
      acc.current = { sample: 0, time: 0, initialized: false };
    }
  }, [mode]);

  // Free movement: while recording, dragging the canvas (NOT on the gizmo)
  // rotates the device; Shift+drag translates it in the camera's screen plane.
  // This is what "movimiento libre" means — moving the device without the axis
  // guides. OrbitControls is disabled during record/play so a plain drag here
  // rotates the device (and is recorded) instead of orbiting the camera.
  useEffect(() => {
    if (mode !== "record") return;
    const el = gl.domElement;
    const st = dragState.current;
    st.active = false;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      st.active = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!st.active) return;
      // Ignore free-drag while the gizmo is actively being dragged.
      if (tcRef.current && tcRef.current.dragging) return;
      const d = deviceRef.current;
      if (!d) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;

      if (e.shiftKey) {
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const scale = camera.position.distanceTo(d.position) * PAN_SCALE;
        d.position.addScaledVector(right, dx * scale);
        d.position.addScaledVector(up, -dy * scale);
      } else {
        d.rotation.y += dx * ROT_SENSITIVITY;
        d.rotation.x += dy * ROT_SENSITIVITY;
      }
    };
    const onEnd = () => {
      st.active = false;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [mode, gl, camera]);

  return (
    <>
      <OrbitControls
        makeDefault
        enabled={mode === "idle"}
        target={cameraTarget}
        enableDamping
        dampingFactor={0.08}
      />
      {device && mode === "record" && (
        <TransformControls ref={tcRef} object={device} mode={gizmo} />
      )}
    </>
  );
}
