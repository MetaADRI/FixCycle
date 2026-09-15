// Generates Fixcycle PWA/brand icons from the official logo (fixcycle-logo.png)
// for both the user and driver apps. Delegates resize work to Windows PowerShell
// System.Drawing so the official logo is never cropped or distorted; it is only
// scaled (aspect-preserving) and centered on a white canvas.
//
// Usage: node scripts/generate-icons.mjs

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..');
const LOGO = path.join(REPO_ROOT, 'fixcycle-logo.png');

const APP_ICON_DIRS = [
  path.join(ROOT, 'apps', 'user', 'public', 'icons'),
  path.join(ROOT, 'apps', 'driver', 'public', 'icons'),
];

const SIZES = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
];

if (!fs.existsSync(LOGO)) {
  console.error(`Official logo not found at ${LOGO}`);
  process.exit(1);
}

for (const dir of APP_ICON_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(LOGO, path.join(dir, 'fixcycle-logo.png'));
  for (const { file, size, maskable } of SIZES) {
    const target = path.join(dir, file);
    const scale = maskable ? 0.8 : 1.0;
    const ps = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($env:FC_LOGO)
$size = ${size}
$maskable = ${maskable ? '1' : '0'}
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'HighQuality'
$g.InterpolationMode = 'HighQualityBicubic'
$g.PixelOffsetMode = 'HighQuality'
$g.Clear([System.Drawing.Color]::White)
$scale = if ($maskable) { 0.8 } else { 1.0 }
$dim = [int]([math]::Round($size * $scale))
$x = [int](($size - $dim) / 2)
$g.DrawImage($src, [System.Drawing.Rectangle]::new($x, $x, $dim, $dim))
$g.Dispose()
$bmp.Save($env:FC_OUT, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$src.Dispose()
`;
    const result = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      encoding: 'utf8',
      env: { ...process.env, FC_LOGO: LOGO, FC_OUT: target },
    });
    if (result.status !== 0) {
      console.error(`Failed to generate ${target}: ${result.stderr}`);
      process.exit(1);
    }
    console.log(`wrote ${path.relative(ROOT, target)} (${fs.statSync(target).size} bytes)`);
  }
}

console.log('done');