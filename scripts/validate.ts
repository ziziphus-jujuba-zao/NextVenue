// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Schema and cross-reference checks for everything under data/.
//   pnpm validate [--edition iclr-2027,cvpr-2027]
// Exits non-zero on any error; warnings are printed but do not fail.

import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { isValidTimeZone, loadRepoData, snapshotPath, toInstant } from '@nextvenue/core';
import { applyCopy, lintCopy, staleCopy } from '../apps/mobile/copy.ts';
import { toAppData } from './app-data.ts';
import { buildBundle } from './bundle.ts';
import { ROOT, editionFilter, green, parseArgs, red, yellow } from './lib.ts';

const args = parseArgs(process.argv.slice(2));
const wanted = editionFilter(args);
const data = loadRepoData(ROOT);

const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);
const schema = (name: string) => JSON.parse(readFileSync(join(ROOT, 'schema', name), 'utf8'));
const validateSourceFile = ajv.compile(schema('source-file.schema.json'));
const validateEdition = ajv.compile(schema('edition.schema.json'));
const validateRule = ajv.compile(schema('rule.schema.json'));

const errors: string[] = [];
const warnings: string[] = [];
const err = (file: string, msg: string) => errors.push(`${file}: ${msg}`);
const warn = (file: string, msg: string) => warnings.push(`${file}: ${msg}`);

function schemaErrors(file: string, fn: typeof validateRule) {
  for (const e of fn.errors ?? []) err(file, `schema ${e.instancePath || '/'} ${e.message}`);
}

// Sources
const sourceIds = new Map<string, string>();
for (const { file, value } of data.sourceFiles) {
  if (!validateSourceFile(value)) {
    schemaErrors(file, validateSourceFile);
    continue;
  }
  if (basename(file, '.yml') !== value.edition) err(file, `file name must be ${value.edition}.yml`);
  if (!wanted(value.edition)) continue;
  for (const s of value.sources) {
    if (sourceIds.has(s.id)) err(file, `duplicate source id ${s.id} (also in ${sourceIds.get(s.id)})`);
    sourceIds.set(s.id, file);
    if (s.snapshot && !existsSync(snapshotPath(ROOT, s.snapshot))) err(file, `${s.id}: snapshot file missing`);
    if (s.http_status === 200 && !s.snapshot) err(file, `${s.id}: HTTP 200 but no snapshot`);
    if (s.http_status !== 200) warn(file, `${s.id}: HTTP ${s.http_status} (not observable)`);
  }
}
// Sources of other editions still resolve for cross-edition quotes (inherited rules).
for (const id of data.sources.keys()) if (!sourceIds.has(id)) sourceIds.set(id, '(other edition)');

// Editions
const editions = new Map<string, Set<string>>();
for (const { file, value: ed } of data.editions) {
  if (!validateEdition(ed)) {
    schemaErrors(file, validateEdition);
    continue;
  }
  if (basename(file, '.yml') !== ed.id) err(file, `file name must be ${ed.id}.yml`);
  editions.set(ed.id, new Set(ed.milestones.map((m) => m.type)));
  if (!wanted(ed.id)) continue;
  for (const m of ed.milestones) {
    const where = `milestone ${m.type}`;
    if (!isValidTimeZone(m.tz)) err(file, `${where}: unknown tz "${m.tz}"`);
    if (m.src && !sourceIds.has(m.src)) err(file, `${where}: unknown source ${m.src}`);
    if (m.status !== 'tba' && !m.src) warn(file, `${where}: no source`);
    try {
      for (const t of [m.at, m.start, m.end]) if (t) toInstant(t, m.tz);
      if (m.start && m.end && toInstant(m.start, m.tz) > toInstant(m.end, m.tz)) err(file, `${where}: start after end`);
    } catch (e) {
      err(file, `${where}: ${(e as Error).message}`);
    }
  }
}

// Rules
const ruleIds = new Set<string>();
for (const { file, value: r } of data.rules) {
  if (!validateRule(r)) {
    schemaErrors(file, validateRule);
    continue;
  }
  if (!wanted(r.edition)) continue;
  const [edPart, slug] = r.id.split('/');
  if (edPart !== r.edition) err(file, `id must start with "${r.edition}/"`);
  if (basename(dirname(file)) !== r.edition || basename(file, '.yml') !== slug) {
    err(file, `file must live at data/rules/${r.edition}/${slug}.yml`);
  }
  if (ruleIds.has(r.id)) err(file, `duplicate rule id ${r.id}`);
  ruleIds.add(r.id);

  const milestones = editions.get(r.edition);
  if (!milestones) err(file, `unknown edition ${r.edition}`);
  for (const key of ['from', 'until'] as const) {
    const t = r.applies?.[key];
    if (t && milestones && !milestones.has(t)) warn(file, `applies.${key}=${t} but ${r.edition} has no such milestone`);
  }
  for (const q of r.quotes) {
    if (!sourceIds.has(q.src)) err(file, `quote source ${q.src} not found in data/sources`);
    if (q.text.length > 600) warn(file, `quote from ${q.src} is ${q.text.length} chars; keep quotes to 1–2 sentences`);
  }
  for (const s of r.checked_sources ?? []) if (!sourceIds.has(s)) err(file, `checked source ${s} not found`);
  if (r.inherited_from && !r.inherited_from.match(/^[a-z0-9-]+$/)) err(file, `bad inherited_from`);
  if (r.verification === 'inherited' && r.conf === 'high') warn(file, 'inherited rule marked conf: high');
}

// App wording (apps/mobile/copy.ts) over the built data: list labels name the
// action, never the answer word; overrides still match the data; no official
// (AoE) day is left next to the Beijing times the app shows.
if (!errors.length && !args.edition) {
  const slim = toAppData(buildBundle());
  for (const s of staleCopy(slim)) err('apps/mobile/copy.ts', `stale override: ${s}`);
  const lint = lintCopy(applyCopy(slim));
  for (const e of lint.errors) err('apps/mobile/copy.ts', e);
  for (const w of lint.warnings) warn('apps/mobile/copy.ts', w);
}

for (const w of warnings) console.log(yellow(`warn  ${w}`));
for (const e of errors) console.log(red(`error ${e}`));
const counts = `${data.sourceFiles.length} source files, ${data.editions.length} editions, ${data.rules.length} rules`;
if (errors.length) {
  console.log(red(`✗ ${errors.length} error(s) — ${counts}`));
  process.exit(1);
}
console.log(green(`✓ valid — ${counts}${warnings.length ? `, ${warnings.length} warning(s)` : ''}`));
