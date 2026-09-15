// Generates placeholder Fixcycle PWA icons as PNG using Node's built-in zlib.
// No external dependencies. Renders the brand cab mark (rounded navy panel,
// white cab, orange accent) with 4x4 supersampling for anti-aliasing.
//
// Usage: node scripts/generate-icons.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'apps', 'user', 'public', 'icons');

const NAVY = [11, 27, 63, 255];
const ACCENT = [255, 107, 53, 255];
const WHITE = [255, 255, 255, 255];

// ---- PNG encoding (IHDR / IDAT / IEND, filter 0, RGBA 8-bit) ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function encodePng(rgba, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0; // filter: none
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      raw[offset] = rgba[index];
      raw[offset + 1] = rgba[index + 1];
      raw[offset + 2] = rgba[index + 2];
      raw[offset + 3] = rgba[index + 3];
      offset += 4;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Shape helpers (normalized 0..1 coordinates) ----

function inRoundedRect(x, y, x0, y0, x1, y1, radius) {
  if (x < x0 || x > x1 || y < y0 || y > y1) {
    return false;
  }
  const cx = Math.max(x0 + radius, Math.min(x1 - radius, x));
  const cy = Math.max(y0 + radius, Math.min(y1 - radius, y));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function inCircle(x, y, cx, cy, radius) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// ---- Glyph ----

const BODY = { x0: 0.16, y0: 0.54, x1: 0.84, y1: 0.8, r: 0.05 };
const CABIN = { x0: 0.28, y0: 0.4, x1: 0.72, y1: 0.56, r: 0.035 };
const STRIPE = { x0: 0.16, y0: 0.652, x1: 0.84, y1: 0.686, r: 0.02 };
const WINDOW_LEFT = { cx: 0.38, cy: 0.48, r: 0.055 };
const WINDOW_RIGHT = { cx: 0.62, cy: 0.48, r: 0.055 };
const WHEEL_LEFT = { cx: 0.27, cy: 0.82, r: 0.075 };
const WHEEL_RIGHT = { cx: 0.73, cy: 0.82, r: 0.075 };
const HEADLIGHT_LEFT = { cx: 0.205, cy: 0.585, r: 0.018 };
const HEADLIGHT_RIGHT = { cx: 0.795, cy: 0.585, r: 0.018 };

function glyphColorAt(nx, ny) {
  // Cutouts (wheels, windows) carve through the body.
  if (inCircle(nx, ny, WHEEL_LEFT.cx, WHEEL_LEFT.cy, WHEEL_LEFT.r) || inCircle(nx, ny, WHEEL_RIGHT.cx, WHEEL_RIGHT.cy, WHEEL_RIGHT.r)) {
    return NAVY;
  }
  if (inCircle(nx, ny, WINDOW_LEFT.cx, WINDOW_LEFT.cy, WINDOW_LEFT.r) || inCircle(nx, ny, WINDOW_RIGHT.cx, WINDOW_RIGHT.cy, WINDOW_RIGHT.r)) {
    return NAVY;
  }
  if (inRoundedRect(nx, ny, CABIN.x0, CABIN.y0, CABIN.x1, CABIN.y1, CABIN.r)) {
    return WHITE;
  }
  if (inRoundedRect(nx, ny, BODY.x0, BODY.y0, BODY.x1, BODY.y1, BODY.r)) {
    return WHITE;
  }
  if (inRoundedRect(nx, ny, STRIPE.x0, STRIPE.y0, STRIPE.x1, STRIPE.y1, STRIPE.r)) {
    return ACCENT;
  }
  if (inCircle(nx, ny, HEADLIGHT_LEFT.cx, HEADLIGHT_LEFT.cy, HEADLIGHT_LEFT.r) || inCircle(nx, ny, HEADLIGHT_RIGHT.cx, HEADLIGHT_RIGHT.cy, HEADLIGHT_RIGHT.r)) {
    return WHITE;
  }
  return null;
}

function renderIcon(size, { viewport, glyphScale, radius }) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let alpha = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + (sx + 0.5) / samples) / size;
          const y = (py + (sy + 0.5) / samples) / size;

          let color = null;
          if (viewport === 'rounded') {
            if (inRoundedRect(x, y, 0, 0, 1, 1, radius)) {
              const gx = 0.5 + (x - 0.5) * glyphScale;
              const gy = 0.5 + (y - 0.5) * glyphScale;
              color = glyphColorAt(gx, gy) ?? NAVY;
            }
          } else {
            const gx = 0.5 + (x - 0.5) * glyphScale;
            const gy = 0.5 + (y - 0.5) * glyphScale;
            color = glyphColorAt(gx, gy) ?? NAVY;
          }

          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            alpha += 1;
          }
        }
      }

      const count = Math.max(alpha, 1);
      const index = (py * size + px) * 4;
      rgba[index] = Math.round(r / count);
      rgba[index + 1] = Math.round(g / count);
      rgba[index + 2] = Math.round(b / count);
      rgba[index + 3] = Math.round((alpha / (samples * samples)) * 255);
    }
  }

  return encodePng(rgba, size);
}

function writePng(filename, buffer) {
  const target = path.join(OUT_DIR, filename);
  fs.writeFileSync(target, buffer);
  console.log(`wrote ${path.relative(ROOT, target)} (${buffer.length} bytes)`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const ROUNDED_RADIUS = 0.22;

writePng('icon-192.png', renderIcon(192, { viewport: 'rounded', glyphScale: 0.9, radius: ROUNDED_RADIUS }));
writePng('icon-512.png', renderIcon(512, { viewport: 'rounded', glyphScale: 0.9, radius: ROUNDED_RADIUS }));
writePng('apple-touch-icon.png', renderIcon(180, { viewport: 'full', glyphScale: 0.9, radius: 0 }));
writePng('icon-maskable-512.png', renderIcon(512, { viewport: 'full', glyphScale: 0.74, radius: 0 }));

console.log('done');