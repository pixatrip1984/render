// Generates a demo "SaaS app" screenshot as a PNG (1080x2340) with a minimal
// dependency-free PNG encoder (node:zlib only). This is the replaceable screen
// texture for the MVP demo.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "screens");
mkdirSync(outDir, { recursive: true });

const W = 1080;
const H = 2340;
const buf = Buffer.alloc(W * H * 4);

function setPx(x, y, [r, g, b, a = 255]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function fillRoundRect(x0, y0, w, h, r, color) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const x1 = x0 + w;
  const y1 = y0 + h;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const cx = Math.max(x0 + rr, Math.min(x, x1 - rr));
      const cy = Math.max(y0 + rr, Math.min(y, y1 - rr));
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr * rr) setPx(x, y, color);
    }
  }
}

function fillCircle(cx, cy, r, color) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPx(x, y, color);
    }
  }
}

// ---- background: vertical gradient ----
const top = [26, 32, 58];
const bottom = [10, 12, 24];
for (let y = 0; y < H; y++) {
  const t = y / H;
  const c = lerpColor(top, bottom, t);
  for (let x = 0; x < W; x++) setPx(x, y, c);
}

// ---- status bar ----
for (let x = 0; x < W; x++) setPx(x, 0, [0, 0, 0, 60]);
fillRoundRect(70, 46, 130, 26, 13, [235, 238, 250]);
fillCircle(1010, 60, 9, [235, 238, 250]);

// ---- header ----
fillRoundRect(80, 140, 400, 46, 23, [64, 70, 110]);
fillRoundRect(80, 220, 620, 40, 20, [110, 118, 165]);
fillRoundRect(80, 280, 300, 40, 20, [70, 76, 116]);

// ---- hero card (accent gradient) ----
const hero = { x: 80, y: 380, w: 920, h: 520, r: 56 };
const heroTop = [86, 130, 255];
const heroBottom = [46, 96, 226];
for (let y = hero.y; y < hero.y + hero.h; y++) {
  const t = (y - hero.y) / hero.h;
  const c = lerpColor(heroTop, heroBottom, t);
  const rr = hero.r;
  const x0 = hero.x;
  const x1 = hero.x + hero.w;
  const y0 = hero.y;
  const y1 = hero.y + hero.h;
  for (let x = x0; x < x1; x++) {
    const cx = Math.max(x0 + rr, Math.min(x, x1 - rr));
    const cy = Math.max(y0 + rr, Math.min(y, y1 - rr));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= rr * rr) setPx(x, y, c);
  }
}
fillRoundRect(130, 470, 260, 52, 26, [255, 255, 255]);
fillRoundRect(130, 560, 420, 36, 18, [255, 255, 255, 150]);
fillRoundRect(130, 620, 560, 36, 18, [255, 255, 255, 110]);
fillRoundRect(130, 800, 220, 60, 30, [24, 30, 58]);
fillRoundRect(380, 800, 220, 60, 30, [255, 255, 255]);

// ---- three small cards ----
const cards = [
  { c: [52, 180, 150] },
  { c: [250, 150, 90] },
  { c: [150, 110, 250] },
];
for (let i = 0; i < 3; i++) {
  const x = 80 + i * 316;
  fillRoundRect(x, 980, 288, 260, 40, [36, 42, 74]);
  fillCircle(x + 60, 1080, 34, cards[i].c);
  fillRoundRect(x + 40, 1160, 208, 30, 15, [110, 118, 165]);
}

// ---- bar chart ----
fillRoundRect(80, 1320, 920, 340, 40, [36, 42, 74]);
const bars = [120, 220, 160, 260, 180];
for (let i = 0; i < 5; i++) {
  const bw = 120;
  const bx = 160 + i * 160;
  const bh = bars[i];
  const by = 1580 - bh;
  fillRoundRect(bx, by, bw, bh, 24, [86, 130, 255]);
}

// ---- bottom nav ----
fillRoundRect(0, H - 180, W, 180, 0, [20, 24, 44]);
const icons = [110, 520, 930];
for (const x of icons) fillRoundRect(x, H - 140, 50, 50, 16, [120, 128, 180]);

// ---- PNG encoding ----
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter: none
  buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const idat = deflateSync(raw, { level: 9 });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const outPath = resolve(outDir, "demo-screen.png");
writeFileSync(outPath, png);
console.log("Wrote", outPath, `(${png.length} bytes)`);
