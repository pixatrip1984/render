import { useSyncExternalStore } from "react";
import type { MotionMode, MotionState, SpeedMarker } from "./types";

const INITIAL_STATE: MotionState = {
  mode: "idle",
  gizmo: "rotate",
  markers: [],
  recording: null,
  playhead: 0,
  resetNonce: 0,
};

/**
 * Mutable, externally-observable store for the motion recorder/player.
 *
 * `useFrame` (inside the Canvas) mutates state at frame rate (append keyframes,
 * advance the playhead) without going through React's render loop; React
 * components subscribe via `useMotionStore` / `useMotionMode` and re-render
 * only when the snapshot they select actually changes.
 */
export class MotionStore {
  private state: MotionState = INITIAL_STATE;
  private listeners = new Set<() => void>();

  getState = (): MotionState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(
    update: Partial<MotionState> | ((s: MotionState) => Partial<MotionState>),
  ): void {
    const patch = typeof update === "function" ? update(this.state) : update;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  setMode(mode: MotionMode): void {
    this.set({ mode });
  }

  setGizmo(gizmo: MotionState["gizmo"]): void {
    this.set({ gizmo });
  }

  startRecord(): void {
    this.set({ mode: "record", recording: { keyframes: [], duration: 0 }, playhead: 0 });
  }

  stopRecord(): void {
    if (this.state.mode === "record") this.set({ mode: "idle" });
  }

  clearRecording(): void {
    this.set((s) => ({
      mode: "idle",
      recording: null,
      markers: [],
      playhead: 0,
      resetNonce: s.resetNonce + 1,
    }));
  }

  togglePlay(): void {
    if (this.state.mode === "play") {
      this.set({ mode: "idle" });
    } else if (this.state.recording && this.state.recording.keyframes.length > 0) {
      this.set({ mode: "play", playhead: this.state.playhead >= 1 ? 0 : this.state.playhead });
    }
  }

  seek(playhead: number): void {
    this.set({ playhead: Math.min(1, Math.max(0, playhead)), mode: "idle" });
  }

  /** Called by useFrame during playback. */
  advancePlayhead(playhead: number): void {
    this.set({ playhead: Math.min(1, Math.max(0, playhead)) });
  }

  /** Called by useFrame when playback reaches the end. */
  finishPlayback(): void {
    this.set({ mode: "idle", playhead: 1 });
  }

  /** Called by useFrame during recording (throttled). */
  addKeyframe(kf: { time: number; position: [number, number, number]; rotation: [number, number, number] }): void {
    const s = this.state;
    if (s.mode !== "record" || !s.recording) return;
    this.set({
      recording: {
        keyframes: [...s.recording.keyframes, kf],
        duration: kf.time,
      },
    });
  }

  addMarker(position: number, speed = 1): void {
    const id = `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.set({ markers: [...this.state.markers, { id, position, speed }] });
  }

  updateMarker(id: string, patch: Partial<Omit<SpeedMarker, "id">>): void {
    this.set({
      markers: this.state.markers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  }

  removeMarker(id: string): void {
    this.set({ markers: this.state.markers.filter((m) => m.id !== id) });
  }
}

/** Subscribe to the full motion state (re-renders on every change). */
export function useMotionStore(store: MotionStore): MotionState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/**
 * Subscribe only to mode/gizmo (they change rarely). Encoded as a primitive
 * string so the snapshot only changes identity when mode or gizmo actually
 * changes — the R3F controller can re-render its gizmo without re-rendering on
 * every playhead/keyframe tick.
 */
export function useMotionMode(store: MotionStore): {
  mode: MotionState["mode"];
  gizmo: MotionState["gizmo"];
  resetNonce: number;
} {
  const snap = useSyncExternalStore(
    store.subscribe,
    () =>
      `${store.getState().mode}|${store.getState().gizmo}|${store.getState().resetNonce}`,
    () => "idle|rotate|0",
  );
  const [mode, gizmo, nonce] = snap.split("|");
  return {
    mode: mode as MotionState["mode"],
    gizmo: gizmo as MotionState["gizmo"],
    resetNonce: Number(nonce),
  };
}
