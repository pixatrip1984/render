import { Environment, Lightformer } from "@react-three/drei";
import type { LightingPreset } from "../types/scene";

interface RigConfig {
  ambient: number;
  key: number;
  fill: number;
  rim: number;
}

const PRESETS: Record<LightingPreset, RigConfig> = {
  "studio-soft": {
    ambient: 0.55,
    key: 2.8,
    fill: 1.1,
    rim: 1.8,
  },
};

/**
 * Studio lighting: ambient + key/fill/rim directional lights, plus a
 * procedural (network-free) environment for convincing PBR reflections on the
 * chassis and glass. `frames={1}` renders the environment once — important for
 * deterministic, fast Remotion rendering.
 */
export function LightingRig({ preset }: { preset: LightingPreset }) {
  const cfg = PRESETS[preset];

  return (
    <group>
      <ambientLight intensity={cfg.ambient} />

      <directionalLight
        position={[3, 4, 5]}
        intensity={cfg.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-3, 1, 2]} intensity={cfg.fill} />
      <directionalLight position={[0, 3, -5]} intensity={cfg.rim} />

      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={6}
          position={[0, 2, 5]}
          scale={[6, 3, 1]}
        />
        <Lightformer
          intensity={4}
          position={[-4, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[4, 2, 1]}
        />
        <Lightformer
          intensity={3}
          position={[4, 1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[4, 2, 1]}
        />
        <Lightformer
          intensity={2.5}
          position={[0, 4, -3]}
          rotation={[Math.PI, 0, 0]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          intensity={2.5}
          position={[0, 5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[6, 6, 1]}
        />
      </Environment>
    </group>
  );
}
