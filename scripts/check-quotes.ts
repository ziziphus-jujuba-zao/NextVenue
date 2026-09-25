// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Every quote must occur verbatim, after normalization, in the snapshot of
// the source it cites: rule cards, and every `quote` in editions (milestones,
// sites, logistics, submission_evidence, federated_with), series
// periodicity, data/visa and data/china. A JSON source is checked by
// `json_path` + `json_value`; an `anchor` must sit shortly before its quote.
// Statistics quotes (data/stats, data/stats/areas, data/topics) may skip text
// with "..." or "[...]" and table cells with " | "; each part must occur
// verbatim and in order (checkQuoteParts).
//   pnpm check:quotes [--edition iclr-2027]

import type { EvidenceRef } from '@nextvenue/core';
import {
  checkEvidence,
  checkQuoteParts,
  collectEvidence,
  findQuote,
  loadRepoData,
  nearestMatch,
  normalizeStats,
  readSnapshot,
  statsQuotes,
} from '@nextvenue/core';
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

/** Evidence objects (quote, json_path, anchor) found anywhere in a data file. */
function checkRefs(file: string, refs: EvidenceRef[]) {
  // Anchors of items in the same list, e.g. the other hotels.
  const listOf = (r: EvidenceRef) => r.path.replace(/\[\d+\]$/, '');
  const anchors = new Map<string, string[]>();
  for (const r of refs) if (r.anchor) anchors.set(listOf(r), [...(anchors.get(listOf(r)) ?? []), r.anchor]);
  for (const r of refs) checkRef(file, r, r.anchor ? (anchors.get(listOf(r)) ?? []) : []);
}

function checkRef(file: string, ref: EvidenceRef, siblingAnchors: string[]) {
  const where = `${file} ${ref.path}`;
  if (!ref.src) return failures.push(`${where}: quote without src`);
  if (ref.json_path === undefined && !ref.anchor) return check(where, ref.src, ref.quote ?? '');
  checked++;
  const src = data.sources.get(ref.src);
  if (!src) return failures.push(`${where}: unknown source ${ref.src}`);
  const snap = readSnapshot(ROOT, src);
  if (!snap) return failures.push(`${where}: source ${ref.src} has no snapshot (HTTP ${src.http_status})`);
  const problem = checkEvidence(ref, snap, siblingAnchors);
  if (problem) failures.push(`${where}: ${problem} in ${ref.src} (snapshot ${src.snapshot?.slice(0, 12)})`);
}

for (const { file, value: r } of data.rules) {
  if (!r || !wanted(r.edition)) continue;
  (r.quotes ?? []).forEach((q, i) => check(`${file} quotes[${i}]`, q.src, q.text));
}
for (const { file, value: ed } of data.editions) {
  if (!ed || !wanted(ed.id)) continue;
  (ed.milestones ?? []).forEach((m, i) => {
    checkRefs(file, collectEvidence(m, `milestones[${i}] ${m.type}${m.site ? ` (${m.site})` : ''}`));
  });
  checkRefs(file, collectEvidence(ed.sites, 'sites'));
  checkRefs(file, collectEvidence(ed.logistics, 'logistics'));
  checkRefs(file, collectEvidence(ed.submission_evidence, 'submission_evidence'));
  checkRefs(file, collectEvidence(ed.federated_with, 'federated_with'));
}
if (!args.edition) for (const { file, value: s } of data.series) if (s) checkRefs(file, collectEvidence(s.periodicity, 'periodicity'));
if (!args.edition) {
  const others = [...data.visa, ...data.holidays, ...(data.chinaAdmin ? [data.chinaAdmin] : [])];
  for (const { file, value } of others) checkRefs(file, collectEvidence(value));
}

if (!args.edition) {
  // One normalization per snapshot: front-matter PDFs are long and carry many quotes.
  const normalized = new Map<string, string | null>();
  for (const q of statsQuotes(data.stats, data.areas, data.topics)) {
    checked++;
    const where = `${q.file} ${q.where}`;
    const src = data.sources.get(q.src);
    if (!src) {
      failures.push(`${where}: unknown source ${q.src}`);
      continue;
    }
    if (!normalized.has(q.src)) {
      const snap = readSnapshot(ROOT, src);
      normalized.set(q.src, snap === null ? null : normalizeStats(snap));
    }
    const text = normalized.get(q.src);
    if (text == null) {
      failures.push(`${where}: source ${q.src} has no snapshot (HTTP ${src.http_status})`);
      continue;
    }
    const problem = checkQuoteParts(q.quote, text, true);
    if (problem) failures.push(`${where}: ${problem} in ${q.src} (snapshot ${src.snapshot?.slice(0, 12)})`);
  }
}

for (const f of failures) console.log(red(`✗ ${f}`));
if (failures.length) {
  console.log(red(`${failures.length}/${checked} quote(s) not found`));
  process.exit(1);
}
console.log(green(`✓ all ${checked} quotes found verbatim in their snapshots`));
