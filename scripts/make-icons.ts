// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Regenerate the app's PNG icons from the SVGs in apps/mobile/icons with
// rsvg-convert (brew install librsvg). The PNGs are committed, so CI and
// `pnpm build` never need this. The masters live in docs/brand.
//   pnpm icons

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, green, red } from './lib.ts';

const dir = join(ROOT, 'apps', 'mobile', 'icons');

/** Full-bleed icon for the home screen (the OS rounds the corners); the maskable one keeps the mark in the safe zone. */
const OUTPUTS: [svg: string, png: string, size: number][] = [
  ['app-icon.svg', 'icon-180.png', 180],
  ['app-icon.svg', 'icon-192.png', 192],
  ['app-icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'icon-maskable-512.png', 512],
];

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
} catch {
  console.error(red('✗ pnpm icons needs rsvg-convert (brew install librsvg); the committed PNGs are used everywhere else'));
  process.exit(1);
}

for (const [svg, png, n] of OUTPUTS) {
  const out = join(dir, png);
  execFileSync('rsvg-convert', ['-w', String(n), '-h', String(n), '-b', 'none', '-o', out, join(dir, svg)], { stdio: 'ignore' });
  console.log(green(`✓ ${out}`));
}
