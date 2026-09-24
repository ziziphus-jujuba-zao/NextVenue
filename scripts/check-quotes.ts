// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Every quote on a rule card (and on a milestone, if given) must occur
// verbatim, after normalization, in the snapshot of the source it cites.
//   pnpm check:quotes [--edition iclr-2027]

import { findQuote, loadRepoData, nearestMatch, readSnapshot } from '@nextvenue/core';
import { ROOT, editionFilter, green, parseArgs, red } from './lib.ts';

const args = parseArgs(process.argv.slice(2));
const wanted = editionFilter(args);
const data = loadRepoData(ROOT);

let checked = 0;
const failures: string[] = [];

function check(where: string, srcId: string, text: string) {
  checked++;
  const src = data.sources.get(srcId);
  if (!src) return failures.push(`${where}: unknown source ${srcId}`);
  const snap = readSnapshot(ROOT, src);
  if (!snap) return failures.push(`${where}: source ${srcId} has no snapshot (HTTP ${src.http_status})`);
  if (findQuote(text, snap).found) return;
  const near = nearestMatch(text, snap);
  failures.push(
    `${where}: quote not found in ${srcId} (snapshot ${src.snapshot?.slice(0, 12)})\n` +
      `      quote: "${text.slice(0, 160)}${text.length > 160 ? '…' : ''}"\n` +
      (near
        ? `      first ${near.matchedWords}/${near.totalWords} words match here: "…${near.context}…"`
        : '      no part of it matches'),
  );
}

for (const { file, value: r } of data.rules) {
  if (!r || !wanted(r.edition)) continue;
  (r.quotes ?? []).forEach((q, i) => check(`${file} quotes[${i}]`, q.src, q.text));
}
for (const { file, value: ed } of data.editions) {
  if (!ed || !wanted(ed.id)) continue;
  for (const m of ed.milestones ?? []) if (m.quote && m.src) check(`${file} milestone ${m.type}`, m.src, m.quote);
}

for (const f of failures) console.log(red(`✗ ${f}`));
if (failures.length) {
  console.log(red(`${failures.length}/${checked} quote(s) not found`));
  process.exit(1);
}
console.log(green(`✓ all ${checked} quotes found verbatim in their snapshots`));
