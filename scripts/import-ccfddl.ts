// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Import ccfddl (github.com/ccfddl/ccf-deadlines, MIT) as upstream data:
// one upstream series file per new ccfddl series, one upstream edition per
// upcoming ccfddl edition, and data/upstream/ccfddl.yml with the pin and
// ccfddl's per-series record (CCF/CORE/THCPL as ccfddl has them). Curated
// editions are never touched. See scripts/ccfddl-plan.ts for the rules.
//
//   pnpm import:ccfddl --commit <40-hex sha> [--as-of YYYY-MM-DD] [--dry-run] [--verbose]
//   pnpm import:ccfddl --file <allconf.yml> --as-of YYYY-MM-DD [--source-url <url>] [--dry-run]
//   pnpm import:ccfddl --url https://ccfddl.com/conference/allconf.yml --as-of YYYY-MM-DD [--dry-run]
//
// --commit reads conference/**/*.yml of that commit (GitHub tarball); its
// date is the commit date unless --as-of is given. --file and --url read a
// built allconf.yml and need --as-of (the date the file is as of). "Upcoming"
// is judged on --as-of, not on today, so a re-run with the same pin writes
// nothing. Run pnpm validate afterwards.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { parse } from 'yaml';
import { loadRepoData, type CcfddlSeries, type Edition, type SeriesFile, type UpstreamManifest } from '@nextvenue/core';
import { planImport, type Existing } from './ccfddl-plan.ts';
import { ROOT, green, parseArgs, red, yellow } from './lib.ts';

const REPO = 'ccfddl/ccf-deadlines';
const DEFAULT_URL = 'https://ccfddl.com/conference/allconf.yml';
const args = parseArgs(process.argv.slice(2));
const dry = Boolean(args['dry-run']);
const verbose = Boolean(args.verbose);
const asOfArg = typeof args['as-of'] === 'string' ? args['as-of'] : undefined;

function fail(msg: string): never {
  console.log(red(msg));
  process.exit(2);
}
if (asOfArg && !/^\d{4}-\d{2}-\d{2}$/.test(asOfArg)) fail('--as-of must be YYYY-MM-DD');

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

async function fetchOk(url: string): Promise<Response> {
  const r = await fetch(url, { headers: { 'user-agent': 'nextvenue-import' } });
  if (!r.ok) fail(`${url}: HTTP ${r.status}`);
  return r;
}

function yamlFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...yamlFilesUnder(p));
    else if (/\.ya?ml$/.test(e.name)) out.push(p);
  }
  return out.sort();
}

async function readSource(): Promise<{ series: CcfddlSeries[]; pin: UpstreamManifest['pin'] }> {
  if (typeof args.commit === 'string') {
    const commit = args.commit;
    if (!/^[0-9a-f]{40}$/.test(commit)) fail('--commit takes a full 40-character sha');
    let asOf = asOfArg;
    if (!asOf) {
      const info = (await (await fetchOk(`https://api.github.com/repos/${REPO}/commits/${commit}`)).json()) as { commit: { committer: { date: string } } };
      asOf = info.commit.committer.date.slice(0, 10);
    }
    const tar = Buffer.from(await (await fetchOk(`https://codeload.github.com/${REPO}/tar.gz/${commit}`)).arrayBuffer());
    const tmp = mkdtempSync(join(tmpdir(), 'ccfddl-'));
    try {
      writeFileSync(join(tmp, 'src.tar.gz'), tar);
      execFileSync('tar', ['-xzf', join(tmp, 'src.tar.gz'), '-C', tmp]);
      const top = readdirSync(tmp, { withFileTypes: true }).find((e) => e.isDirectory());
      if (!top) fail('tarball has no top directory');
      const confDir = join(tmp, top.name, 'conference');
      if (!existsSync(confDir)) fail('tarball has no conference/ directory');
      // conference/<SUB>/<name>.yml only (conference/types.yml is the category table).
      const files = yamlFilesUnder(confDir).filter((f) => /^[A-Z]{2}\/[^/]+\.ya?ml$/.test(relative(confDir, f)));
      const hash = createHash('sha256');
      const series: CcfddlSeries[] = [];
      for (const f of files) {
        const text = readFileSync(f, 'utf8');
        hash.update(`${relative(confDir, f)}\n${text}\n`);
        const v = parse(text) as CcfddlSeries[] | null;
        if (Array.isArray(v)) series.push(...v);
      }
      return { series, pin: { kind: 'commit', commit, as_of: asOf, sha256: hash.digest('hex') } };
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (!asOfArg) fail('--as-of YYYY-MM-DD is required with --file and --url (the date the data is as of)');
  if (typeof args.file === 'string') {
    const raw = readFileSync(args.file);
    const url = typeof args['source-url'] === 'string' ? args['source-url'] : DEFAULT_URL;
    return { series: parse(raw.toString('utf8')) as CcfddlSeries[], pin: { kind: 'file', url, as_of: asOfArg, sha256: sha256(raw) } };
  }
  if (typeof args.url === 'string') {
    const raw = Buffer.from(await (await fetchOk(args.url)).arrayBuffer());
    return { series: parse(raw.toString('utf8')) as CcfddlSeries[], pin: { kind: 'url', url: args.url, as_of: asOfArg, sha256: sha256(raw) } };
  }
  fail('usage: pnpm import:ccfddl --commit <sha> | --file <allconf.yml> --as-of <date> | --url <url> --as-of <date>  [--dry-run] [--verbose]');
}

const { series: ccfddl, pin } = await readSource();
if (!Array.isArray(ccfddl) || !ccfddl.every((s) => s && typeof s.title === 'string' && typeof s.sub === 'string')) fail('not a ccfddl series list');

const data = loadRepoData(ROOT);
if (!data.taxonomy) fail('data/taxonomy.yml is missing');
const withText = <T,>(l: { file: string; value: T }): Existing<T> => ({ ...l, text: readFileSync(join(ROOT, l.file), 'utf8') });
const plan = planImport({
  ccfddl,
  pin,
  series: data.series.map((s) => withText<SeriesFile>(s)),
  editions: data.editions.map((e) => withText<Edition>(e)),
  manifest: data.upstream ? withText<UpstreamManifest>(data.upstream) : null,
  taxonomy: data.taxonomy.value,
});

if (!dry) {
  for (const w of plan.writes) {
    const p = join(ROOT, w.file);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, w.text);
  }
}

const s = plan.summary;
const where = pin.kind === 'commit' ? `commit ${pin.commit!.slice(0, 12)}` : `${pin.kind} ${pin.url}`;
console.log(`ccfddl ${where}, as of ${pin.as_of} (sha256 ${pin.sha256.slice(0, 12)}): ${ccfddl.length} series`);
console.log(`series   ${s.series.linked.length} linked, ${s.series.created.length} new, ${s.series.conflicts.length} conflict(s)`);
console.log(
  `editions ${s.editions.created.length} new, ${s.editions.updated.length} updated, ${s.editions.unchanged.length} unchanged, ` +
    `${s.editions.curated.length} curated kept (${s.editions.curated.filter((c) => c.differs).length} differ from ccfddl), ${s.editions.past} past skipped`,
);
const list = (title: string, rows: string[], always = false) => {
  if (!rows.length) return;
  console.log(yellow(`${title} (${rows.length})`));
  for (const r of always || verbose ? rows : rows.slice(0, 20)) console.log(`  ${r}`);
  if (!verbose && !always && rows.length > 20) console.log(`  … ${rows.length - 20} more (--verbose)`);
};
list('series conflicts: not imported until settled', s.series.conflicts, true);
list('curated editions where ccfddl differs (check the official page)', s.editions.curated.filter((c) => c.differs).map((c) => `${c.id}: ${c.differs}`), true);
list('upstream editions no longer in ccfddl (not deleted)', s.editions.stale, true);
list('parse notes', s.notes);
if (verbose) {
  list('new series', s.series.created, true);
  list('new editions', s.editions.created, true);
  list('updated editions', s.editions.updated, true);
}
console.log(
  dry
    ? green(`✓ dry run: ${plan.writes.length} file(s) would be written, nothing written`)
    : green(`✓ wrote ${plan.writes.length} file(s)${plan.writes.length ? '; now run pnpm validate' : ' (already up to date)'}`),
);
