// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Build dist/bundle.json (the data every client downloads in one piece, so no
// request reveals which venue a user cares about) and the desktop rules page
// dist/site/all-rules.html. The mobile app (dist/site/index.html) is built
// next by scripts/build-app.ts. The full bundle, with its sources and checks,
// stays out of dist/site, the folder that gets published: the app ships only
// the fields it shows.
//   pnpm build

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildBundle } from './bundle.ts';
import { ROOT, green } from './lib.ts';
import { renderSite } from './site.ts';

export type { Bundle, BundleEdition, BundleMilestone, BundleQuote, BundleRule, ResolvedTime } from './bundle.ts';

const bundle = buildBundle();
const dist = join(ROOT, 'dist');
const site = join(dist, 'site');
mkdirSync(site, { recursive: true });
const json = JSON.stringify(bundle, null, 2);
writeFileSync(join(dist, 'bundle.json'), json);
rmSync(join(site, 'bundle.json'), { force: true });
writeFileSync(join(site, 'all-rules.html'), renderSite(bundle));
console.log(
  green(
    `✓ built ${bundle.rules.length} rules across ${bundle.editions.length} editions → dist/bundle.json, dist/site/all-rules.html (bundle ${bundle.bundle_hash.slice(0, 12)})`,
  ),
);
