import { useMemo, useRef, useState } from "react";
import { MotionStore, useMotionStore } from "./motionStore";

const MAX_KEYFRAME_DOTS = 200;

const buttonStyle: React.CSSProperties = {
  background: "#232329",
  border: "1px solid #34343c",
  color: "#e6e6eb",
  borderRadius: 4,
  padding: "5px 10px",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#2b4bd6",
  borderColor: "#3c5be0",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#b33a3a",
  borderColor: "#c94b4b",
};

/**
 * The timeline editor. Lives in the MAIN space (below the canvas), not in the
 * right sidebar, per the product requirement.
 *
 * Shows the recorded keyframes as a scrubber track, a draggable playhead, and
 * draggable speed markers (x multiples). Markers are resolved into continuous
 * transitions by the engine in motionEngine.ts.
 */
export function MotionTimeline({ store }: { store: MotionStore }) {
  const state = useMotionStore(store);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<null | { type: "playhead" | "marker"; id?: string }>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const recording = state.recording;
  const hasRecording = !!recording && recording.keyframes.length > 0;
  const duration = recording ? Math.max(recording.duration, 0.001) : 0;
  const isRecording = state.mode === "record";
  const isPlaying = state.mode === "play";

  const selectedMarker = state.markers.find((m) => m.id === selectedId) ?? null;

  // Downsample keyframe dots for display (a long recording has thousands).
  const dots = useMemo(() => {
    if (!recording || recording.keyframes.length === 0) return [] as number[];
    const kfs = recording.keyframes;
    const d = Math.max(recording.duration, 0.001);
    if (kfs.length <= MAX_KEYFRAME_DOTS) {
      return kfs.map((k) => k.time / d);
    }
    // Downsample to at most MAX_KEYFRAME_DOTS dots. Use an integer stride so
    // `kfs[i]` always indexes a real keyframe (a fractional stride would read
    // `kfs[1.005] === undefined` and crash once the recording exceeds 200).
    const stride = Math.max(1, Math.ceil(kfs.length / MAX_KEYFRAME_DOTS));
    const out: number[] = [];
    for (let i = 0; i < kfs.length; i += stride) {
      out.push(kfs[i].time / d);
    }
    return out;
  }, [recording]);

  const fracFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const kind = target.dataset.kind;
    if (kind === "playhead") {
      dragRef.current = { type: "playhead" };
      store.seek(fracFromClientX(e.clientX));
    } else if (kind === "marker") {
      dragRef.current = { type: "marker", id: target.dataset.id };
      setSelectedId(target.dataset.id ?? null);
    } else {
      store.seek(fracFromClientX(e.clientX));
      setSelectedId(null);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const f = fracFromClientX(e.clientX);
    if (drag.type === "playhead") {
      store.seek(f);
    } else if (drag.type === "marker" && drag.id) {
      store.updateMarker(drag.id, { position: f });
    }
  };

  const onTrackPointerUp = () => {
    dragRef.current = null;
  };

  const addMarker = () => {
    store.addMarker(state.playhead, 1);
    // select the just-added marker so its editor opens
    const last = store.getState().markers[store.getState().markers.length - 1];
    if (last) setSelectedId(last.id);
  };

  const currentTime = (state.playhead * duration).toFixed(1);
  const totalTime = duration.toFixed(1);

  return (
    <div
      style={{
        borderTop: "1px solid #2c2c33",
        background: "#1b1b1f",
        color: "#e6e6eb",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Transport + marker tools */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {isRecording ? (
          <button style={dangerButtonStyle} onClick={() => store.stopRecord()}>
            ⏹ Stop
          </button>
        ) : (
          <button style={dangerButtonStyle} onClick={() => store.startRecord()}>
            ● Record
          </button>
        )}

        <button
          style={primaryButtonStyle}
          onClick={() => store.togglePlay()}
          disabled={!hasRecording}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          style={buttonStyle}
          onClick={() => store.seek(0)}
          disabled={!hasRecording}
        >
          ⟲ Rewind
        </button>

        <button
          style={buttonStyle}
          onClick={() => {
            store.clearRecording();
            setSelectedId(null);
          }}
          disabled={!hasRecording && state.markers.length === 0}
        >
          ✕ Clear
        </button>

        <span style={{ width: 1, height: 20, background: "#34343c", margin: "0 4px" }} />

        <span style={{ fontSize: 11, color: "#8b8d98", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Gizmo
        </span>
        <button
          style={state.gizmo === "translate" ? primaryButtonStyle : buttonStyle}
          onClick={() => store.setGizmo("translate")}
        >
          ⟷ Move
        </button>
        <button
          style={state.gizmo === "rotate" ? primaryButtonStyle : buttonStyle}
          onClick={() => store.setGizmo("rotate")}
        >
          ⟳ Rotate
        </button>

        <span style={{ width: 1, height: 20, background: "#34343c", margin: "0 4px" }} />

        <button style={buttonStyle} onClick={addMarker} disabled={!hasRecording}>
          ＋ Speed marker
        </button>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#a6a8b3", fontVariantNumeric: "tabular-nums" }}>
          {currentTime}s / {totalTime}s
        </span>
      </div>

      {/* Selected marker editor */}
      {selectedMarker && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{ color: "#8b8d98" }}>Marker @ {Math.round(selectedMarker.position * 100)}%</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#a6a8b3" }}>Speed ×</span>
            <input
              type="number"
              step={0.25}
              min={0.05}
              max={16}
              style={{
                width: 60,
                background: "#232329",
                border: "1px solid #34343c",
                color: "#e6e6eb",
                borderRadius: 4,
                padding: "3px 6px",
                fontSize: 12,
              }}
              value={selectedMarker.speed}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                if (Number.isFinite(n) && n > 0) store.updateMarker(selectedMarker.id, { speed: n });
              }}
            />
          </label>
          <button style={dangerButtonStyle} onClick={() => { store.removeMarker(selectedMarker.id); setSelectedId(null); }}>
            ✕ Delete
          </button>
        </div>
      )}

      {/* Timeline track */}
      <div
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        style={{
          position: "relative",
          height: 56,
          background: "#232329",
          border: "1px solid #34343c",
          borderRadius: 4,
          cursor: "crosshair",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* keyframe dots */}
        {dots.map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${f * 100}%`,
              top: "50%",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#6f7180",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* speed markers */}
        {state.markers.map((m) => {
          const selected = m.id === selectedId;
          return (
            <div
              key={m.id}
              data-kind="marker"
              data-id={m.id}
              title={`Speed ×${m.speed}`}
              style={{
                position: "absolute",
                left: `${m.position * 100}%`,
                top: 0,
                bottom: 0,
                width: 2,
                background: selected ? "#7aa2ff" : "#5b7bd6",
                cursor: "ew-resize",
                transform: "translateX(-50%)",
              }}
            >
              <div
                data-kind="marker"
                data-id={m.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 2,
                  transform: "translateX(0)",
                  background: selected ? "#7aa2ff" : "#5b7bd6",
                  color: "#0c0d10",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 4px",
                  borderRadius: "0 0 3px 3px",
                  whiteSpace: "nowrap",
                }}
              >
                ×{m.speed}
              </div>
            </div>
          );
        })}

        {/* playhead */}
        <div
          data-kind="playhead"
          style={{
            position: "absolute",
            left: `${state.playhead * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#f0f0f5",
            cursor: "ew-resize",
            transform: "translateX(-50%)",
            pointerEvents: "auto",
          }}
        >
          <div
            data-kind="playhead"
            style={{
              position: "absolute",
              top: 0,
              left: -6,
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid #f0f0f5",
            }}
          />
        </div>

        {/* empty-state hint */}
        {!hasRecording && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6f7180",
              fontSize: 12,
              pointerEvents: "none",
            }}
          >
            {isRecording ? "Recording… move & rotate the device" : "Press Record, then move/rotate the device"}
          </div>
        )}
      </div>
    </div>
  );
}
