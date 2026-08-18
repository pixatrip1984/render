import React from "react";
import { defaultScene, laptopScene } from "../../config/defaultScene";
import { PHONE_COLOR_IDS, PHONE_MATERIAL_PRESETS } from "../../three/Phone/phoneConfig";
import type { DeviceType, SceneConfig, Vec3 } from "../../types/scene";

interface SidebarProps {
  config: SceneConfig;
  onChange: (next: SceneConfig) => void;
}

const DEG = Math.PI / 180;

const sectionStyle: React.CSSProperties = {
  borderBottom: "1px solid #2c2c33",
  padding: "12px 16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#8b8d98",
  marginBottom: 8,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: 64,
  background: "#232329",
  border: "1px solid #34343c",
  color: "#e6e6eb",
  borderRadius: 4,
  padding: "4px 6px",
  fontSize: 12,
};

function NumberField({
  label,
  value,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={rowStyle}>
      <span style={{ width: 18, color: "#a6a8b3", fontSize: 12 }}>{label}</span>
      <input
        type="number"
        step={step}
        style={inputStyle}
        value={Number(value.toFixed(4))}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    </label>
  );
}

function Vec3Field({
  value,
  step,
  onChange,
}: {
  value: Vec3;
  step?: number;
  onChange: (v: Vec3) => void;
}) {
  const set = (i: number, n: number) => {
    const next = [...value] as Vec3;
    next[i] = n;
    onChange(next);
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <NumberField label="X" value={value[0]} step={step} onChange={(n) => set(0, n)} />
      <NumberField label="Y" value={value[1]} step={step} onChange={(n) => set(1, n)} />
      <NumberField label="Z" value={value[2]} step={step} onChange={(n) => set(2, n)} />
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ config, onChange }) => {
  const updateDevice = (patch: Partial<SceneConfig["device"]>) =>
    onChange({ ...config, device: { ...config.device, ...patch } });

  const updateCamera = (patch: Partial<SceneConfig["camera"]>) =>
    onChange({ ...config, camera: { ...config.camera, ...patch } });

  const updateScreen = (patch: Partial<SceneConfig["screen"]>) =>
    onChange({ ...config, screen: { ...config.screen, ...patch } });

  const rotationDeg: Vec3 = [
    config.device.rotation[0] / DEG,
    config.device.rotation[1] / DEG,
    config.device.rotation[2] / DEG,
  ];

  const switchDeviceType = (type: DeviceType) => {
    if (type === config.device.type) return;
    onChange(type === "laptop" ? laptopScene : defaultScene);
  };

  return (
    <aside
      style={{
        width: 280,
        background: "#1b1b1f",
        borderLeft: "1px solid #2c2c33",
        color: "#e6e6eb",
        overflowY: "auto",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>
        3D Device Preview
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Device</div>
        <label style={rowStyle}>
          <span style={{ width: 70, color: "#a6a8b3", fontSize: 12 }}>Type</span>
          <select
            style={{ ...inputStyle, width: 130 }}
            value={config.device.type}
            onChange={(e) => switchDeviceType(e.target.value as DeviceType)}
          >
            <option value="phone">Phone</option>
            <option value="laptop">Laptop</option>
          </select>
        </label>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Device — Rotation (°)</div>
        <Vec3Field
          value={rotationDeg}
          onChange={(deg) =>
            updateDevice({
              rotation: [deg[0] * DEG, deg[1] * DEG, deg[2] * DEG],
            })
          }
        />
        <div style={labelStyle}>Position</div>
        <Vec3Field value={config.device.position} onChange={(p) => updateDevice({ position: p })} />
        <div style={labelStyle}>Scale</div>
        <NumberField
          label=""
          value={config.device.scale}
          step={0.05}
          onChange={(n) => updateDevice({ scale: n })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Camera</div>
        <Vec3Field value={config.camera.position} onChange={(p) => updateCamera({ position: p })} />
        <div style={labelStyle}>FOV</div>
        <NumberField
          label=""
          value={config.camera.fov}
          step={1}
          onChange={(n) => updateCamera({ fov: n })}
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Appearance</div>
        {config.device.type === "phone" && (
          <label style={rowStyle}>
            <span style={{ width: 70, color: "#a6a8b3", fontSize: 12 }}>Color</span>
            <select
              style={{ ...inputStyle, width: 130 }}
              value={config.device.color}
              onChange={(e) => updateDevice({ color: e.target.value as SceneConfig["device"]["color"] })}
            >
              {PHONE_COLOR_IDS.map((id) => (
                <option key={id} value={id}>
                  {PHONE_MATERIAL_PRESETS[id].label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label style={rowStyle}>
          <span style={{ width: 70, color: "#a6a8b3", fontSize: 12 }}>Background</span>
          <input
            type="color"
            style={{ width: 40, height: 26, background: "none", border: "none", padding: 0 }}
            value={config.background}
            onChange={(e) => onChange({ ...config, background: e.target.value })}
          />
        </label>
        <label style={rowStyle}>
          <span style={{ width: 70, color: "#a6a8b3", fontSize: 12 }}>Brightness</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            style={{ flex: 1 }}
            value={config.screen.brightness}
            onChange={(e) => updateScreen({ brightness: parseFloat(e.target.value) })}
          />
          <span style={{ width: 30, textAlign: "right", fontSize: 12 }}>
            {config.screen.brightness.toFixed(2)}
          </span>
        </label>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Screen</div>
        <label style={rowStyle}>
          <span style={{ width: 70, color: "#a6a8b3", fontSize: 12 }}>Screenshot</span>
          <input
            type="text"
            style={{ ...inputStyle, flex: 1 }}
            value={config.screen.src}
            onChange={(e) => updateScreen({ src: e.target.value })}
          />
        </label>
        <div style={{ fontSize: 11, color: "#6f7180", marginTop: 4 }}>
          Path under <code>public/</code>, e.g. /screens/demo-screen.png
        </div>
      </div>
    </aside>
  );
};
