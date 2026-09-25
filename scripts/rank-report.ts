// Copyright (c) 2026 Zayier Xie. All rights reserved.

// What the rank matching decided and what it could not: labels per series,
// ambiguous and unconfirmed matches, entries several series claim, ccfddl's
// CCF tiers that differ from the CCF list, and list entries no series has yet
// (the backlog for "every CCF-listed conference").
//   pnpm ranks:report [--list ccf7] [--series hscc,cav] [--unlinked] [--json]
// Fix a case by adding a link or a `not` to data/ranks/mapping.yml, or by
// giving the series file its full name, aliases or dblp key.

import { labelText, loadRepoData, resolveRanks } from '@nextvenue/core';
import { ROOT, green, parseArgs, yellow } from './lib.ts';

const args = parseArgs(process.argv.slice(2));
const data = loadRepoData(ROOT);
const series = data.series.map((s) => s.value);
const lists = data.rankLists.map((l) => l.value);
const mapping = data.rankMapping?.value ?? { links: [], not: [] };
const { labels, report } = resolveRanks(series, lists, mapping, data.upstream?.value ?? null);

const onlyList = typeof args.list === 'string' ? args.list : null;
const onlySeries = typeof args.series === 'string' ? new Set(args.series.split(',')) : null;
const keep = (x: { list?: string | null; series?: string | string[] }) =>
  (!onlyList || x.list === onlyList) && (!onlySeries || [x.series].flat().some((s) => s && onlySeries.has(s)));

if (args.json) {
  console.log(JSON.stringify({ labels: Object.fromEntries(labels), report }, null, 2));
  process.exit(0);
}

console.log('Labels');
for (const [id, ls] of [...labels].sort(([a], [b]) => a.localeCompare(b))) {
  if (onlySeries && !onlySeries.has(id)) continue;
  const shown = ls.filter((l) => !onlyList || l.list === onlyList);
  console.log(`  ${id.padEnd(18)} ${shown.map((l) => `${labelText(l)}${l.year ? `@${l.year}` : ''} [${l.match}]`).join(' · ') || '—'}`);
}
const section = (title: string, rows: string[]) => {
  if (!rows.length) return;
  console.log(yellow(`\n${title} (${rows.length})`));
  for (const r of rows) console.log(`  ${r}`);
};
section('Problems in mapping.yml', report.problems);
section('Links waiting for a series file', report.pending);
section(
  'Ambiguous: several entries fit, no label',
  report.ambiguous.filter(keep).map((a) => `${a.series} → ${a.list}: ${a.candidates.map((c) => `${c.entry} (${c.why})`).join('; ')}`),
);
section(
  'Unconfirmed: acronym or dblp key only, no label',
  report.unconfirmed.filter(keep).map((u) => `${u.series} → ${u.list}/${u.entry}: ${u.why}`),
);
section('Shared: one entry, several series, no label', report.shared.filter(keep).map((s) => `${s.list}/${s.entry}: ${s.series.join(', ')}`));
section(
  'ccfddl CCF tier differs from the CCF list',
  report.ccfddl_disagree.filter((d) => keep({ series: d.series })).map((d) => `${d.series}: ccfddl ${d.ccfddl}, CCF list ${d.list ?? 'no entry matched'}`),
);
const unlinked = report.unlinked.filter(keep);
const byList = new Map<string, number>();
for (const u of unlinked) byList.set(u.list, (byList.get(u.list) ?? 0) + 1);
if (args.unlinked) section('List entries with no series yet', unlinked.map((u) => `${u.list}/${u.entry} ${u.acronym ?? ''} ${u.tier}`));
else if (unlinked.length) console.log(yellow(`\nList entries with no series yet: ${[...byList].map(([l, n]) => `${l} ${n}`).join(', ')} (--unlinked lists them)`));
const n = [...labels.values()].filter((ls) => ls.length).length;
console.log(green(`\n✓ ${n}/${labels.size} series have at least one label`));
