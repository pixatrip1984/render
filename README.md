# Product Motion Lab

A self-contained 3D motion-graphics lab for a **premium, manipulable smartphone** with a **replaceable screenshot** on its display, an **orbitable interactive preview**, and **deterministic Remotion renders** (a still PNG and a short orbit MP4).

Built with React 19, Remotion 4, `@remotion/three`, `@react-three/fiber` 9, `@react-three/drei` and `three`.

## Quick start

```bash
npm install

# Interactive preview (orbit the phone, tweak color/camera/screen)
npm run dev

# Type-check + production build (both Remotion + Vite bundles)
npm run build

# List Remotion compositions
npm run remotion:compositions

# Render outputs
npm run render:still   # output/phone-still.png
npm run render:orbit   # output/phone-orbit.mp4
```

You can also open the Remotion Studio to scrub frames interactively:

```bash
npm run remotion:studio
```

## Replace the screenshot

The screen texture is just an image file under `public/`.

1. Drop your screenshot at `public/screens/<name>.png`.
2. Point the scene at it in `src/config/defaultScene.ts`:

   ```ts
   screen: {
     src: "/screens/<name>.png",
     fit: "cover", // or "contain"
     brightness: 1,
   },
   ```

Or edit it live in the preview sidebar (the **Screen → Screenshot** field accepts a path under `public/`, e.g. `/screens/demo-screen.png`).

The screenshot is auto-fitted to the device's own display dimensions via UV `cover`/`contain` math — there is no hard-coded aspect ratio, so any screenshot adapts to whatever display geometry the device model defines.

## Change the phone color / camera

- **Color** — `src/three/Phone/phoneConfig.ts` defines four chassis presets (`champagne`, `graphite`, `silver`, `black`). Set `device.color` in `defaultScene.ts`, or pick it from the preview sidebar.
- **Camera** — `camera` in `defaultScene.ts` (`position`, `target`, `fov`). The `PhoneOrbit` composition also adds a light frame-driven camera drift on top of it.

## Architecture

```
src/
├── remotion/            # deterministic render path
│   ├── Root.tsx         # registers PhoneStill + PhoneOrbit
│   ├── compositions/
│   │   ├── PhoneStill.tsx   # 1080×1350, 1 frame
│   │   └── PhoneOrbit.tsx   # 1080×1350, 150 frames @ 30fps
│   └── animation/       # easing + camera presets
├── three/               # shared 3D library (used by BOTH paths)
│   ├── Scene.tsx        # background, lighting, phone, shadow-catcher ground
│   ├── LightingRig.tsx  # ambient/key/fill/rim + procedural studio environment
│   ├── CameraRig.tsx    # declarative, phone-decoupled camera (render only)
│   ├── Phone/
│   │   ├── Phone.tsx        # assembles device body + screen
│   │   ├── PhoneScreen.tsx  # ScreenContent + ScreenGlass (cover/contain UV)
│   │   ├── useScreenTexture.ts # Suspense-based texture loading
│   │   ├── phoneConfig.ts   # dimensions + material presets
│   │   └── device/
│   │       ├── DeviceModel.ts        # device/screen abstraction
│   │       └── ProceduralPhoneBody.tsx # chassis/frame/bezel/buttons/cameras
│   └── renderSettings.ts # shared GL props (tone mapping, sRGB, shadow type)
├── preview/             # interactive Vite path (OrbitControls only)
├── types/scene.ts       # SceneConfig + sub-types (the declarative contract)
└── config/defaultScene.ts # the default scene object
```

### Key design points

- **One model, two entry points.** The Remotion compositions and the Vite preview both render `Scene`, so preview and final render use the *same* phone by construction.
- **Decoupled screen abstraction.** `Phone` renders the body from the `DEVICE_MODELS` registry and the screen from the model's `display` descriptor. A future `.glb` body can replace the procedural body without touching `Scene`, `PhoneScreen`, animations, or compositions.
- **Screen layers.** `ScreenContent` is an unlit `meshBasicMaterial` plane (`toneMapped={false}`) so screenshot colors/brightness are untouched by lighting; `ScreenGlass` is a thin transparent `meshPhysicalMaterial` with clearcoat for subtle reflections. They are physically separated to avoid z-fighting.
- **Determinism.** Render time comes only from `useCurrentFrame()` / `interpolate()`. `OrbitControls` lives exclusively in the Vite preview and is fully isolated from render state. The procedural environment renders once (`frames={1}`) and shadows use a fixed map type — a composition produces the same frame every run.
- **No network at render time.** The environment is built from procedural `Lightformer`s; the demo screenshot is generated locally (`scripts/generate-demo-screen.mjs`).

## Rendering notes

- `remotion.config.ts` pins `Config.setConcurrency(1)`. Headless Chrome rasterises WebGL on the CPU, so parallel tabs saturate the CPU and cause per-frame timeouts. Keep concurrency at 1 for reliable renders.
- The MP4 encoder (Remotion's bundled ffmpeg) is downloaded automatically on the first `remotion render` run (PNG stills don't need it).
- Chrome Headless Shell is downloaded automatically on the first render/composition listing.

## Limitations & next milestone

- The phone is **procedural** (no external `.glb` yet). The `DeviceModel` abstraction is ready for a GLB swap.
- The screen is a **static image**. Video or remote-URL screens are a natural extension of `PhoneScreen` (`useScreenTexture` → `useVideoTexture`).
- `PhoneOrbit` is a minimal, math-driven proof (rotation + light camera drift). A richer motion-preset library (camera/device choreography) is the next milestone.
