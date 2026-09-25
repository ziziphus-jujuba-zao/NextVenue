// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Regenerate the app's PNG icons from apps/mobile/icons/app-icon.svg with
// macOS `sips`. The PNGs are committed, so CI and `pnpm build` never need this.
//   pnpm icons

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, green, red } from './lib.ts';

const dir = join(ROOT, 'apps', 'mobile', 'icons');
const svg = join(dir, 'app-icon.svg');

if (process.platform !== 'darwin') {
  console.error(red('✗ pnpm icons uses macOS sips; the committed PNGs are used everywhere else'));
  process.exit(1);
}

for (const n of [180, 192, 512]) {
  const out = join(dir, `icon-${n}.png`);
  execFileSync('sips', ['-s', 'format', 'png', svg, '--out', out, '-z', String(n), String(n)], { stdio: 'ignore' });
  console.log(green(`✓ ${out}`));
}
