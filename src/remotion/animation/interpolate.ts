import { Easing, interpolate } from "remotion";

export type EasingName = "linear" | "easeInOut" | "expoOut" | "expoInOut";

const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeInOut: Easing.inOut(Easing.ease),
  expoOut: Easing.out(Easing.exp),
  expoInOut: Easing.inOut(Easing.exp),
};

export interface InterpolateProgressArgs {
  frame: number;
  from: number;
  to: number;
  easing?: EasingName;
  /** Map the eased 0..1 progress onto this range. Defaults to [0, 1]. */
  outputRange?: [number, number];
}

/**
 * Frame-driven eased progress (0..1 by default). Deterministic: derives time
 * only from the Remotion frame, never from the real clock.
 */
export function interpolateProgress({
  frame,
  from,
  to,
  easing = "linear",
  outputRange = [0, 1],
}: InterpolateProgressArgs): number {
  const raw = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = EASINGS[easing](raw);
  return interpolate(eased, [0, 1], outputRange);
}
