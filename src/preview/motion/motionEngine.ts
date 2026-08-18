import * as THREE from "three";
import type { Vec3 } from "../../types/scene";
import type { MotionKeyframe, MotionRecording, SpeedMarker } from "./types";

/**
 * Speed-marker resolution engine.
 *
 * The timeline is normalized to [0, 1]. Speed markers define a piecewise-LINEAR
 * speed curve v(p) (the "slope"/acceleration changes abruptly at each marker, as
 * the user described). Endpoints default to x1 unless a marker sits exactly at
 * 0 or 1.
 *
 * The engine maps a timeline position p to a source-time fraction u(p) by
 * integrating the speed curve (piecewise-quadratic in time) and normalizing so
 * u(0)=0 and u(1)=1 — the full recording always plays across the full timeline,
 * but the instantaneous speed at p is v(p)/avg(v). This is the standard
 * "speed ramp" behavior: markers raise/lower playback speed continuously
 * between them.
 */

interface Segment {
  start: number;
  end: number;
  startSpeed: number;
  endSpeed: number;
  area: number;
}

function normalizeMarkers(markers: SpeedMarker[]): { position: number; speed: number }[] {
  const clamped = markers
    .filter(
      (m) =>
        Number.isFinite(m.position) &&
        Number.isFinite(m.speed) &&
        m.speed > 0,
    )
    .map((m) => ({
      position: Math.min(1, Math.max(0, m.position)),
      speed: m.speed,
    }))
    .sort((a, b) => a.position - b.position);

  // Dedupe near-equal positions (keep the last speed).
  const dedup: { position: number; speed: number }[] = [];
  for (const m of clamped) {
    const last = dedup[dedup.length - 1];
    if (last && Math.abs(last.position - m.position) < 1e-6) {
      last.speed = m.speed;
    } else {
      dedup.push({ ...m });
    }
  }

  // Inject x1 endpoints when absent.
  if (dedup.length === 0 || dedup[0].position > 1e-6) {
    dedup.unshift({ position: 0, speed: 1 });
  }
  if (dedup.length === 0 || dedup[dedup.length - 1].position < 1 - 1e-6) {
    dedup.push({ position: 1, speed: 1 });
  }

  return dedup;
}

/** Build the normalized time remap u: [0,1] -> [0,1] from a set of markers. */
export function buildTimeRemap(markers: SpeedMarker[]): (p: number) => number {
  const pts = normalizeMarkers(markers);

  const segments: Segment[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dt = b.position - a.position;
    const area = dt > 0 ? 0.5 * (a.speed + b.speed) * dt : 0;
    segments.push({
      start: a.position,
      end: b.position,
      startSpeed: a.speed,
      endSpeed: b.speed,
      area,
    });
    total += area;
  }

  const totalArea = total > 0 ? total : 1;

  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;

    let cum = 0;
    for (const seg of segments) {
      if (p >= seg.end) {
        cum += seg.area;
        continue;
      }
      if (p <= seg.start) break;

      const dt = seg.end - seg.start;
      if (dt <= 0) break;
      const pa = p - seg.start;
      const v0 = seg.startSpeed;
      const v1 = seg.endSpeed;
      // ∫ v dq from seg.start to p with linear v: v0*pa + 0.5*(v1-v0)*pa^2/dt
      cum += v0 * pa + 0.5 * (v1 - v0) * (pa * pa) / dt;
      break;
    }

    return Math.min(1, Math.max(0, cum / totalArea));
  };
}

/**
 * Sample a recording at a source time (seconds). Position is linearly
 * interpolated; rotation is slerped on quaternions so full rotations interpolate
 * smoothly rather than folding through Euler singularities.
 */
export function sampleKeyframes(
  recording: MotionRecording,
  sourceTime: number,
): { position: Vec3; rotation: Vec3 } | null {
  const kfs = recording.keyframes;
  if (!kfs || kfs.length === 0) return null;

  const first = kfs[0];
  const last = kfs[kfs.length - 1];
  const snap = (kf: MotionKeyframe) => ({
    position: [...kf.position] as Vec3,
    rotation: [...kf.rotation] as Vec3,
  });

  if (kfs.length === 1) return snap(first);

  const t = Math.max(0, Math.min(sourceTime, last.time));
  if (t <= first.time) return snap(first);
  if (t >= last.time) return snap(last);

  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t < a.time || t > b.time) continue;

    const span = b.time - a.time;
    const f = span > 0 ? (t - a.time) / span : 0;

    const position = a.position.map(
      (v, k) => v + (b.position[k] - v) * f,
    ) as Vec3;

    const qa = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(a.rotation[0], a.rotation[1], a.rotation[2], "XYZ"),
    );
    const qb = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(b.rotation[0], b.rotation[1], b.rotation[2], "XYZ"),
    );
    const q = qa.clone().slerp(qb, f);
    const e = new THREE.Euler().setFromQuaternion(q, "XYZ");

    return { position, rotation: [e.x, e.y, e.z] as Vec3 };
  }

  return snap(last);
}
