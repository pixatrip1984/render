import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/remotion/index.ts");
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");

// Headless Chrome rasterises WebGL on the CPU; parallel tabs saturate the CPU
// and cause per-frame render timeouts. Pin to a single worker for deterministic,
// reproducible renders (a still is unaffected).
Config.setConcurrency(1);
