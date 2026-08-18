import type { Vec3 } from "../../types/scene";

export type GizmoMode = "translate" | "rotate";

export type MotionMode = "idle" | "record" | "play";

/** A single captured device pose at a point in time (seconds since record start). */
export interface MotionKeyframe {
  time: number;
  position: Vec3;
  rotation: Vec3; // euler radians [x, y, z]
}

/** A user-placed speed marker on the normalized timeline. */
export interface SpeedMarker {
  id: string;
  /** Position on the timeline, 0..1. */
  position: number;
  /** Speed multiplier (> 0). */
  speed: number;
}

/** The frozen result of a recording session. */
export interface MotionRecording {
  keyframes: MotionKeyframe[];
  duration: number;
}

export interface MotionState {
  mode: MotionMode;
  gizmo: GizmoMode;
  markers: SpeedMarker[];
  recording: MotionRecording | null;
  /** Playhead position on the normalized timeline, 0..1. */
  playhead: number;
  /** Bumped to signal "reset the device pose to the config pose" (e.g. on clear). */
  resetNonce: number;
}
