// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Schema and cross-reference checks for everything under data/.
//   pnpm validate [--edition iclr-2027,cvpr-2027]
// Exits non-zero on any error; warnings are printed but do not fail.

import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Edition, HolidayFile, Logistics, RankList, RuleCard, SeriesFile, StatsRow } from '@nextvenue/core';
import {
  BEIJING,
  POST_ACCEPT_ONLY,
  collectEvidence,
  directionIds,
  matchKeyProblem,
  resolveRanks,
  formatIn,
  areaProblems,
  isValidTimeZone,
  loadRepoData,
  placeProblems,
  visaRouteProblems,
  snapshotPath,
  statsRowProblems,
  toInstant,
  topicsProblems,
  unlicensedSource,
  weekdayOf,
  workCalendar,
} from '@nextvenue/core';
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
const validateVisa = ajv.compile(schema('visa.schema.json'));
const validateVisaCountries = ajv.compile(schema('visa-countries.schema.json'));
const validateChinaAdmin = ajv.compile(schema('china-admin.schema.json'));
const validateHolidays = ajv.compile(schema('china-holidays.schema.json'));
const validateStats = ajv.compile(schema('stats.schema.json'));
const validateAreas = ajv.compile(schema('stats-areas.schema.json'));
const validateTopics = ajv.compile(schema('topics.schema.json'));
const validateTaxonomy = ajv.compile(schema('topics-taxonomy.schema.json'));
const validateSeries = ajv.compile(schema('series.schema.json'));
const validateDisciplines = ajv.compile(schema('taxonomy.schema.json'));
const validateRankList = ajv.compile(schema('rank-list.schema.json'));
const validateRankMapping = ajv.compile(schema('rank-mapping.schema.json'));
const validateUpstream = ajv.compile(schema('upstream-ccfddl.schema.json'));
const validateCities = ajv.compile(schema('cities.schema.json'));

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

// Visa routing table (read before editions, which point into it)
const countries = data.visaCountries;
if (countries && !validateVisaCountries(countries.value)) schemaErrors(countries.file, validateVisaCountries);
const countryRegime = new Map(Object.entries(countries?.value ?? {}));

/** Every `src` and `checked_sources` id anywhere under `value` must be a known source. */
function checkSourceIds(file: string, where: string, value: unknown): void {
  if (Array.isArray(value)) return value.forEach((v, i) => checkSourceIds(file, `${where}[${i}]`, v));
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (k === 'src' && typeof v === 'string' && !sourceIds.has(v)) err(file, `${where}: unknown source ${v}`);
    else if (k === 'checked_sources' && Array.isArray(v)) {
      for (const id of v) if (!sourceIds.has(id)) err(file, `${where}: checked source ${id} not found`);
    } else checkSourceIds(file, where ? `${where}.${k}` : k, v);
  }
}

/** Every quote needs a source: its own `src` or an enclosing object's. */
function checkEvidenceHasSource(file: string, value: unknown, base = ''): void {
  for (const ref of collectEvidence(value, base)) if (!ref.src) err(file, `${ref.path}: quote without src`);
}

const digitsOnly = (s: string) => s.replace(/(\d),(?=\d{3}\b)/g, '$1');
/** The amount appears as a number in the quote ("1,250" counts as 1250). */
function amountQuoted(amount: number, quote: string | undefined): boolean {
  if (!quote) return false;
  const n = String(amount);
  return new RegExp(`(?<![\\d.])${n.replace('.', '\\.')}(?!\\d)`).test(digitsOnly(quote));
}

/** "cvpr-2026" / "aaai-26" → { series, year }. */
function editionParts(id: string): { series: string; year: number } | null {
  const m = /^(.+?)-(\d{4}|\d{2})(?:-\d{2})?$/.exec(id);
  if (!m) return null;
  const y = Number(m[2]);
  return { series: m[1]!, year: y < 100 ? 2000 + y : y };
}

function checkReference(file: string, where: string, ed: Edition, from: string): void {
  const p = editionParts(from);
  if (!p || p.series !== ed.series) err(file, `${where}: reference.from ${from} is not an edition of ${ed.series}`);
  else if (p.year >= ed.year) err(file, `${where}: reference.from ${from} must be an earlier edition than ${ed.year}`);
}

function checkLogistics(file: string, ed: Edition, lg: Logistics): void {
  const siteIds = new Set((ed.sites ?? []).map((x) => x.id));
  const siteOk = (where: string, site: string | undefined) => {
    if (site !== undefined && !siteIds.has(site)) err(file, `${where}: site ${site} is not in sites[]`);
  };
  const hasMilestone = (type: string, site?: string) =>
    ed.milestones.some((m) => m.type === type && (m.site === undefined || m.site === site));
  if (ed.sites && lg.venue) err(file, 'logistics.venue: multi-site editions put each venue in sites[].venue');

  (lg.fees ?? []).forEach((t, i) => {
    const where = `logistics.fees[${i}]`;
    siteOk(where, t.site);
    if ('reference' in t && t.reference) checkReference(file, where, ed, t.reference.from);
    if ('status' in t) return;
    const tierIds = t.tiers.map((x) => x.id);
    if (new Set(tierIds).size !== tierIds.length) err(file, `${where}: duplicate tier id`);
    t.tiers.forEach((tier, j) => {
      if (j < t.tiers.length - 1 && !tier.until) err(file, `${where}.tiers[${j}]: every tier but the last needs "until"`);
      if (tier.until && !hasMilestone(tier.until, t.site)) err(file, `${where}.tiers[${j}]: no ${tier.until} milestone${t.site ? ` for ${t.site}` : ''}`);
    });
    const rowIds = new Set<string>();
    t.rows.forEach((r, j) => {
      const rw = `${where}.rows[${j}] ${r.id}`;
      if (rowIds.has(r.id)) err(file, `${rw}: duplicate row id`);
      rowIds.add(r.id);
      const tiers = r.tiers ?? tierIds;
      for (const id of tiers) if (!tierIds.includes(id)) err(file, `${rw}: unknown tier ${id}`);
      if (r.amounts.length !== tiers.length) err(file, `${rw}: ${r.amounts.length} amounts for ${tiers.length} tiers`);
      const q = r.quote ?? t.quote;
      if (!q) err(file, `${rw}: needs a quote (on the row or the table)`);
      else for (const a of r.amounts) if (!amountQuoted(a, q)) err(file, `${rw}: amount ${a} does not appear in its quote`);
    });
  });
  for (const key of ['coverage', 'visa_letter', 'poster'] as const) {
    const f = lg[key] as ({ reference?: { from: string } } & object) | undefined;
    if (f && 'reference' in f && f.reference) checkReference(file, `logistics.${key}`, ed, f.reference.from);
  }
  const codes = new Set([ed.location?.country_code, ...(ed.sites ?? []).map((x) => x.country_code)].filter(Boolean));
  (lg.visa_guidance ?? []).forEach((g, i) => {
    if (!codes.has(g.country_code)) warn(file, `logistics.visa_guidance[${i}]: ${g.country_code} is not where ${ed.id} is held`);
  });
  if (Array.isArray(lg.hotels)) {
    lg.hotels.forEach((h, i) => {
      if (ed.dates && h.cutoff > ed.dates.end) warn(file, `logistics.hotels[${i}]: cutoff after the conference`);
      if (lg.hotels && (lg.hotels as unknown[]).length > 1 && !h.anchor) {
        warn(file, `logistics.hotels[${i}]: add anchor (the hotel name as the page writes it) so the cutoff quote is tied to this hotel`);
      }
    });
  }
  (lg.sold_out ?? []).forEach((x, i) => siteOk(`logistics.sold_out[${i}]`, x.site));
  (lg.links ?? []).forEach((x, i) => siteOk(`logistics.links[${i}]`, x.site));
}

// Catalog: taxonomy (data/taxonomy.yml), series (data/series/), rank lists
// and their links (data/ranks/), and the ccfddl manifest (data/upstream/).
const noticeText = existsSync(join(ROOT, 'NOTICE')) ? readFileSync(join(ROOT, 'NOTICE'), 'utf8') : '';
const CCFDDL_NOTICE = 'ccfddl/ccf-deadlines';
const directions = new Set<string>();
const rankListById = new Map<string, RankList>();
for (const { file, value: l } of data.rankLists) {
  if (!validateRankList(l)) {
    schemaErrors(file, validateRankList);
    continue;
  }
  if (basename(file, '.yml') !== l.id) err(file, `file name must be ${l.id}.yml`);
  rankListById.set(l.id, l);
  const cats = new Set(l.categories.map((c) => c.id));
  const ids = new Set<string>();
  const byTier = new Map<string, number>();
  if (l.attach === 'edition' && !l.covers_year) err(file, 'attach: edition needs covers_year (the year of the listed editions)');
  for (const e of l.entries) {
    const where = `entry ${e.id}`;
    if (ids.has(e.id)) err(file, `${where}: duplicate id`);
    ids.add(e.id);
    if (!l.tiers.includes(e.tier)) err(file, `${where}: tier ${e.tier} is not one of ${l.tiers.join(', ')}`);
    if (!cats.has(e.category)) err(file, `${where}: unknown category ${e.category}`);
    for (const k of e.match_keys) {
      const p = matchKeyProblem(k);
      if (p) err(file, `${where}: ${p}`);
    }
    byTier.set(e.tier, (byTier.get(e.tier) ?? 0) + 1);
  }
  if (l.counts && l.counts.total !== l.entries.length) err(file, `counts.total is ${l.counts.total} but there are ${l.entries.length} entries`);
  for (const [tier, n] of Object.entries(l.counts?.by_tier ?? {})) {
    if ((byTier.get(tier) ?? 0) !== n) err(file, `counts.by_tier.${tier} is ${n} but ${byTier.get(tier) ?? 0} entries have tier ${tier}`);
  }
}
const tax = data.taxonomy;
if (!tax) err('data/taxonomy.yml', 'missing: the discipline → direction taxonomy');
else if (!validateDisciplines(tax.value)) schemaErrors(tax.file, validateDisciplines);
else {
  const legacy = new Map<string, string>();
  for (const d of tax.value.disciplines) {
    for (const x of d.directions) {
      if (directions.has(x.id)) err(tax.file, `duplicate direction ${x.id}`);
      directions.add(x.id);
      if (!x.id.startsWith(`${d.id}/`)) err(tax.file, `${x.id} must start with "${d.id}/"`);
      for (const t of x.legacy ?? []) {
        if (legacy.has(t)) err(tax.file, `legacy topic ${t} is on both ${legacy.get(t)} and ${x.id}`);
        legacy.set(t, x.id);
      }
    }
  }
  if (directionIds(tax.value).length !== directions.size) err(tax.file, 'direction ids must be unique');
  for (const d of tax.value.disciplines) {
    for (const x of d.see_also ?? []) {
      if (!directions.has(x)) err(tax.file, `${d.id}.see_also: unknown direction ${x}`);
      else if (x.startsWith(`${d.id}/`)) err(tax.file, `${d.id}.see_also: ${x} is already in ${d.id}`);
    }
  }
  const subs = new Set<string>();
  for (const c of tax.value.category_directions) {
    const where = `category_directions ${c.list}/${c.category}`;
    const l = rankListById.get(c.list);
    if (!l) err(tax.file, `${where}: unknown list ${c.list}`);
    else if (!l.categories.some((x) => x.id === c.category)) err(tax.file, `${where}: ${c.list} has no category ${c.category}`);
    for (const x of c.directions) if (!directions.has(x)) err(tax.file, `${where}: unknown direction ${x}`);
    if (c.ccfddl_sub) {
      if (subs.has(c.ccfddl_sub)) err(tax.file, `${where}: ccfddl_sub ${c.ccfddl_sub} used twice`);
      subs.add(c.ccfddl_sub);
    }
  }
}

const seriesById = new Map<string, SeriesFile>();
const byCcfddl = new Map<string, string>();
const byDblp = new Map<string, string>();
for (const { file, value: s } of data.series) {
  if (!validateSeries(s)) {
    schemaErrors(file, validateSeries);
    continue;
  }
  if (basename(file, '.yml') !== s.id) err(file, `file name must be ${s.id}.yml`);
  seriesById.set(s.id, s);
  for (const d of s.directions) if (directions.size && !directions.has(d)) err(file, `unknown direction ${d} (see data/taxonomy.yml)`);
  if (s.ccfddl) {
    if (byCcfddl.has(s.ccfddl)) err(file, `ccfddl ${s.ccfddl} is also on ${byCcfddl.get(s.ccfddl)}`);
    byCcfddl.set(s.ccfddl, s.id);
  } else if (s.data_level === 'upstream') err(file, 'an upstream series needs its ccfddl key');
  if (s.dblp) {
    if (byDblp.has(s.dblp)) warn(file, `dblp ${s.dblp} is also on ${byDblp.get(s.dblp)}; rank matching treats a dblp key alone as unconfirmed`);
    byDblp.set(s.dblp, s.id);
  }
  checkSourceIds(file, 'periodicity', s.periodicity);
  const guess = defaultDirectionGuess(s);
  if (guess) warn(file, `still has the CCF category default ${s.directions.join(', ')} but its name reads as ${guess} (DATA_GUIDE §9.2)`);
}

/**
 * An upstream series whose directions are still its CCF category's default
 * (第 5 类 → cs/db, 第 7 类 → cs/graphics, 第 8 类 → cs/ml) while its name
 * says vision, language, mining or speech: the direction it should likely
 * have, for a warning. DATA_GUIDE §9.2 asks for these to be corrected.
 */
function defaultDirectionGuess(s: SeriesFile): string | undefined {
  const sub = s.ccfddl?.split('/')[0];
  const def = tax?.value.category_directions.find((c) => c.ccfddl_sub === sub)?.directions;
  if (!sub || !['AI', 'DB', 'CG'].includes(sub) || !def || s.directions.join() !== def.join()) return undefined;
  const name = `${s.acronym} ${s.full_name ?? ''}`.toLowerCase();
  const hits: [string, RegExp][] = [
    ['cs/speech', /\b(speech|spoken|acoustic|audio|signal processing)\b/],
    ['cs/cv', /\b(vision|visual|image|video|pattern recognition|face|gesture|document analysis)\b/],
    ['cs/nlp', /\b(language|linguistic|nlp|text|translation)\b/],
    ['cs/dm', /\b(data mining|knowledge discovery|mining|recommender|information retrieval|retrieval)\b/],
  ];
  const own = def[0];
  return hits.find(([d, re]) => d !== own && re.test(name))?.[0];
}

const manifest = data.upstream;
const upstreamKeys = new Set<string>();
if (manifest) {
  if (!validateUpstream(manifest.value)) schemaErrors(manifest.file, validateUpstream);
  else {
    if (!noticeText.includes(CCFDDL_NOTICE) || !noticeText.includes('MIT License')) err(manifest.file, `NOTICE must carry the ccfddl MIT licence (${CCFDDL_NOTICE})`);
    for (const r of manifest.value.series) {
      if (upstreamKeys.has(r.key)) err(manifest.file, `${r.key}: listed twice`);
      upstreamKeys.add(r.key);
      const s = seriesById.get(r.series);
      if (!s) err(manifest.file, `${r.key}: series ${r.series} has no data/series/${r.series}.yml`);
      else if (s.ccfddl !== r.key) err(manifest.file, `${r.key}: data/series/${r.series}.yml has ccfddl ${s.ccfddl ?? '(none)'}`);
    }
  }
}
for (const [key, id] of byCcfddl) if (manifest && !upstreamKeys.has(key)) warn(`data/series/${id}.yml`, `ccfddl ${key} is not in data/upstream/ccfddl.yml (renamed or dropped upstream?)`);

const mapping = data.rankMapping;
if (mapping && !validateRankMapping(mapping.value)) schemaErrors(mapping.file, validateRankMapping);
const rankInfo: string[] = [];
if (!errors.length) {
  const res = resolveRanks([...seriesById.values()], [...rankListById.values()], mapping?.value ?? { links: [], not: [] }, manifest?.value ?? null);
  for (const p of res.report.problems) err(mapping?.file ?? 'data/ranks/mapping.yml', p);
  // Every CCF-listed conference can be found in the app (the owner's "import ALL CCF conferences"):
  // each ccf7 entry needs a series, even one with no edition yet.
  for (const u of res.report.unlinked.filter((x) => x.list === 'ccf7'))
    err('data/ranks/ccf7.yml', `${u.entry} (${u.acronym ?? ''} ${u.tier}) has no series: add data/series/<id>.yml (or a link in mapping.yml); pnpm ranks:report --unlinked --list ccf7`);
  const labelled = [...res.labels.values()].filter((ls) => ls.some((l) => !l.upstream)).length;
  const open = res.report.ambiguous.length + res.report.shared.length;
  rankInfo.push(
    `rank labels: ${labelled}/${seriesById.size} series labelled from the lists; ${open} ambiguous, ` +
      `${res.report.unconfirmed.length} unconfirmed, ${res.report.pending.length} link(s) waiting for a series file (pnpm ranks:report)`,
  );
}

// Editions
const editions = new Map<string, Set<string>>();
const editionLevel = new Map<string, Edition['data_level']>();
for (const { file, value: ed } of data.editions) {
  if (!validateEdition(ed)) {
    schemaErrors(file, validateEdition);
    continue;
  }
  if (basename(file, '.yml') !== ed.id) err(file, `file name must be ${ed.id}.yml`);
  editions.set(ed.id, new Set(ed.milestones.map((m) => m.type)));
  editionLevel.set(ed.id, ed.data_level);
  const series = seriesById.get(ed.series);
  if (!series) err(file, `series ${ed.series} has no data/series/${ed.series}.yml`);
  if (!wanted(ed.id)) continue;
  const upstream = ed.data_level === 'upstream';
  if (upstream) {
    if (series && series.ccfddl !== ed.upstream?.key) err(file, `upstream.key ${ed.upstream?.key} is not the ccfddl key of data/series/${ed.series}.yml (${series.ccfddl ?? 'none'})`);
    if (!noticeText.includes(CCFDDL_NOTICE)) err(file, `upstream data from ccfddl needs its MIT licence in NOTICE (${CCFDDL_NOTICE})`);
    for (const m of ed.milestones) {
      if (m.src || m.quote) err(file, `milestone ${m.type}: upstream milestones carry no src/quote (they are not checked against official pages)`);
      if (m.status === 'estimated') err(file, `milestone ${m.type}: upstream milestones are confirmed (as ccfddl has them) or tba, never estimated`);
    }
  } else {
    if (ed.submission_type && !ed.submission_evidence) err(file, 'submission_type needs submission_evidence (src + quote) on a curated edition');
    if (ed.federated_with && !ed.federated_with.quote) err(file, 'federated_with needs src + quote on a curated edition');
  }
  if (ed.submission_evidence && !ed.submission_type) err(file, 'submission_evidence without submission_type');
  for (const x of ed.federated_with?.with ?? []) if (!seriesById.has(x)) warn(file, `federated_with.with: no data/series/${x}.yml yet`);
  checkSourceIds(file, 'submission_evidence', ed.submission_evidence);
  checkSourceIds(file, 'federated_with', ed.federated_with);
  checkEvidenceHasSource(file, ed.federated_with, 'federated_with');
  const siteIds = new Set<string>();
  for (const site of ed.sites ?? []) {
    if (siteIds.has(site.id)) err(file, `sites: duplicate id ${site.id}`);
    siteIds.add(site.id);
    if (!isValidTimeZone(site.tz)) err(file, `sites ${site.id}: unknown tz "${site.tz}"`);
  }
  for (const m of ed.milestones) {
    const where = `milestone ${m.type}${m.site ? ` (${m.site})` : ''}`;
    if (!isValidTimeZone(m.tz)) err(file, `${where}: unknown tz "${m.tz}"`);
    if (m.src && !sourceIds.has(m.src)) err(file, `${where}: unknown source ${m.src}`);
    if (m.status !== 'tba' && !m.src && !upstream) warn(file, `${where}: no source`);
    if (m.site !== undefined && !siteIds.has(m.site)) err(file, `${where}: site ${m.site} is not in sites[]`);
    if (m.tentative && (m.status !== 'confirmed' || !m.quote || upstream)) err(file, `${where}: tentative is for a date the venue itself marks tentative: status confirmed, with its quote`);
    if (POST_ACCEPT_ONLY.has(m.type) && m.tz === BEIJING && !m.note_zh) {
      err(file, `${where}: Asia/Shanghai only when the venue gives no zone and Beijing is the safer reading; say so in note_zh`);
    }
    try {
      for (const t of [m.at, m.start, m.end]) if (t) toInstant(t, m.tz);
      if (m.start && m.end && toInstant(m.start, m.tz) > toInstant(m.end, m.tz)) err(file, `${where}: start after end`);
    } catch (e) {
      err(file, `${where}: ${(e as Error).message}`);
    }
  }
  checkSourceIds(file, 'sites', ed.sites);
  checkSourceIds(file, 'logistics', ed.logistics);
  checkEvidenceHasSource(file, ed.sites, 'sites');
  checkEvidenceHasSource(file, ed.logistics, 'logistics');
  if (ed.logistics) checkLogistics(file, ed, ed.logistics);
}

/** Effect fields that name a milestone of the same edition. */
function effectMilestones(r: RuleCard): [string, string][] {
  const e = r.effect as Record<string, unknown> | undefined;
  if (!e) return [];
  const out: [string, string][] = [];
  for (const key of ['full_until', 'request_by', 'until'] as const) if (typeof e[key] === 'string') out.push([key, e[key] as string]);
  const c = e.condition as { applied_by?: string } | undefined;
  if (c?.applied_by) out.push(['condition.applied_by', c.applied_by]);
  return out;
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
  if (editionLevel.get(r.edition) === 'upstream') err(file, `${r.edition} is upstream data; curate the edition (data_level: curated, quoted dates) before writing rules for it`);
  for (const key of ['from', 'until'] as const) {
    const t = r.applies?.[key];
    if (t && milestones && !milestones.has(t)) warn(file, `applies.${key}=${t} but ${r.edition} has no such milestone`);
  }
  for (const [key, t] of effectMilestones(r)) {
    if (milestones && !milestones.has(t)) warn(file, `effect.${key}=${t} but ${r.edition} has no such milestone`);
  }
  for (const q of r.quotes) {
    if (!sourceIds.has(q.src)) err(file, `quote source ${q.src} not found in data/sources`);
    if (q.text.length > 600) warn(file, `quote from ${q.src} is ${q.text.length} chars; keep quotes to 1–2 sentences`);
  }
  for (const s of r.checked_sources ?? []) if (!sourceIds.has(s)) err(file, `checked source ${s} not found`);
  if (r.inherited_from && !r.inherited_from.match(/^[a-z0-9-]+$/)) err(file, `bad inherited_from`);
  if (r.verification === 'inherited' && r.conf === 'high') warn(file, 'inherited rule marked conf: high');
}

// Visa files (data/visa/<regime>.yml)
const today = formatIn(new Date(), BEIJING).slice(0, 10);
const daysSince = (date: string) => Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
const regimes = new Set<string>();
for (const { file, value: v } of data.visa) {
  if (!validateVisa(v)) {
    schemaErrors(file, validateVisa);
    continue;
  }
  if (basename(file, '.yml') !== v.id) err(file, `file name must be ${v.id}.yml`);
  regimes.add(v.id);
  const age = daysSince(v.last_checked);
  if (age > 60) err(file, `last_checked ${v.last_checked} is ${age} days old; re-check the official pages (limit 60)`);
  else if (age > 30) warn(file, `last_checked ${v.last_checked} is ${age} days old; the app shows it in amber after 30`);
  checkSourceIds(file, '', v);
  checkEvidenceHasSource(file, v);
}
const missingRegimes = [...new Set(countryRegime.values())].filter((r) => r !== 'none' && !regimes.has(r));
if (missingRegimes.length) warn(countries!.file, `no file yet for ${missingRegimes.join(', ')} (the app shows "未收录")`);
for (const id of regimes) {
  if (![...countryRegime.values()].includes(id)) warn(`data/visa/${id}.yml`, 'no country in data/visa/countries.yml points here');
}

// Cities (data/cities.yml): every edition's city resolves to a Chinese name (or is listed as unknown),
// every country has a Chinese name, and a curated conference zone agrees with its city's.
if (!data.cities) err('data/cities.yml', 'missing: the venue pages name cities in Chinese from it');
else if (!validateCities(data.cities.value)) schemaErrors(data.cities.file, validateCities);
else if (!args.edition) {
  const p = placeProblems(
    data.editions.filter((e) => e.value?.milestones),
    data.cities.value,
  );
  for (const e of p.errors) errors.push(e);
  for (const w of p.warnings) warnings.push(w);
  // Every place (curated or read from ccfddl) has a visa route, and every Schengen state goes to schengen.
  if (countries) for (const e of visaRouteProblems(data.editions.filter((e) => e.value?.milestones), data.cities.value, countries.value)) errors.push(e);
}

// China: holidays and school rules
const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
/** The notice writes "10月10日（周六）": the day and, when given, its weekday must match. */
function dateInQuote(date: string, quote: string, short = false): boolean {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  const full = new RegExp(`(?<!\\d)${m}月${d}日(?:（(周.)[、）]|（[^）]*、(周.)）)?`).exec(quote);
  const hit = full ?? (short ? new RegExp(`至${d}日(?:（(周.)[、）]|（[^）]*、(周.)）)?`).exec(quote) : null);
  if (!hit) return false;
  const wd = hit[1] ?? hit[2];
  return !wd || wd === WEEKDAY_ZH[weekdayOf(date)];
}
function checkHolidayFile(file: string, h: HolidayFile): void {
  if (basename(file, '.yml') !== `holidays-${h.year}`) err(file, `file name must be holidays-${h.year}.yml`);
  const inYear = (d: string) => d.startsWith(`${h.year}-`);
  const seen = new Map<string, string>();
  for (const r of h.holidays) {
    const where = `holiday ${r.name_zh}`;
    if (!inYear(r.start) || !inYear(r.end) || r.start > r.end) err(file, `${where}: bad range ${r.start}..${r.end}`);
    for (let t = Date.parse(r.start); t <= Date.parse(r.end); t += 86_400_000) {
      const d = new Date(t).toISOString().slice(0, 10);
      if (seen.has(d)) err(file, `${where}: ${d} also in ${seen.get(d)}`);
      seen.set(d, r.name_zh);
    }
    if (h.status === 'confirmed') {
      if (!dateInQuote(r.start, r.quote ?? '')) err(file, `${where}: ${r.start} (and its weekday) not in the quote`);
      if (!dateInQuote(r.end, r.quote ?? '', true)) err(file, `${where}: ${r.end} (and its weekday) not in the quote`);
    }
    for (const d of r.statutory ?? []) if (d < r.start || d > r.end) err(file, `${where}: statutory day ${d} outside ${r.start}..${r.end}`);
  }
  for (const w of h.workdays) {
    const where = `workday ${w.date}`;
    if (!inYear(w.date)) err(file, `${where}: not in ${h.year}`);
    const wd = weekdayOf(w.date);
    if (wd !== 0 && wd !== 6) err(file, `${where}: 调休上班日 must be a Saturday or Sunday`);
    if (seen.has(w.date)) err(file, `${where}: also a day off (${seen.get(w.date)})`);
    if (!dateInQuote(w.date, w.quote ?? '')) err(file, `${where}: date (and its weekday) not in the quote`);
  }
}
for (const { file, value: h } of data.holidays) {
  if (!validateHolidays(h)) {
    schemaErrors(file, validateHolidays);
    continue;
  }
  checkHolidayFile(file, h);
  checkSourceIds(file, '', h);
  checkEvidenceHasSource(file, h);
}
try {
  workCalendar(data.holidays.map((x) => x.value));
} catch (e) {
  err('data/china', (e as Error).message);
}
if (data.chinaAdmin) {
  const { file, value: a } = data.chinaAdmin;
  if (!validateChinaAdmin(a)) schemaErrors(file, validateChinaAdmin);
  else {
    const ids = new Set<string>();
    for (const it of a.items) {
      if (ids.has(it.id)) err(file, `duplicate id ${it.id}`);
      ids.add(it.id);
      if ((it.n === undefined) !== (it.unit === undefined)) err(file, `${it.id}: n and unit go together`);
    }
    checkSourceIds(file, '', a);
  }
}

// Past statistics (MOBILE_SPEC §11, DATA_GUIDE §8): acceptance rows in
// data/stats/<series>.yml, official per-area numbers in data/stats/areas/,
// and top topics among accepted papers in data/topics/ (written by
// scripts/topics/dblp_topics.py; CI only checks the files).
const TRACK_ORDER = ['main', 'findings', 'main_and_findings', 'cycle1', 'cycle2'];
const noticeFile = join(ROOT, 'NOTICE');
const notice = existsSync(noticeFile) ? readFileSync(noticeFile, 'utf8') : '';
const DATASET_NOTICE: Record<string, string> = { lixin4ever: 'lixin4ever/Conference-Acceptance-Rate' };
/** A snapshot-checked quote's src must be the page named by source_url, and have a snapshot. */
function checkStatsSrc(file: string, where: string, src: string | undefined, url: string | undefined): void {
  if (!src) return;
  const s = data.sources.get(src);
  if (!s) {
    err(file, `${where}: unknown source ${src}`);
    return;
  }
  if (s.url !== url) err(file, `${where}: source_url must be ${s.url} (the url of ${src})`);
  if (!s.snapshot) err(file, `${where}: ${src} has no snapshot; use quote_check: manual`);
}
const statsRows = new Map<string, StatsRow>();
const statsSeries = new Set<string>();
const thisYear = Number(today.slice(0, 4));
for (const { file, value: f } of data.stats) {
  if (!validateStats(f)) {
    schemaErrors(file, validateStats);
    continue;
  }
  if (basename(file, '.yml') !== f.series) err(file, `file name must be ${f.series}.yml`);
  statsSeries.add(f.series);
  let last = '';
  for (const r of f.rows) {
    const where = `${r.year} ${r.track}`;
    const key = `${r.year}-${TRACK_ORDER.indexOf(r.track)}`;
    if (key <= last) err(file, `${where}: rows go by year, then track (${TRACK_ORDER.join(', ')}), once each`);
    last = key;
    statsRows.set(`${f.series}-${r.year}-${r.track}`, r);
    for (const p of statsRowProblems(r)) err(file, p);
    checkStatsSrc(file, where, r.src, r.source_url);
    (r.also ?? []).forEach((a, i) => checkStatsSrc(file, `${where} also[${i}]`, a.src, a.source_url));
    if (r.dataset && !notice.includes(DATASET_NOTICE[r.dataset]!)) err(file, `${where}: data from ${r.dataset} needs its licence notice in NOTICE`);
    if (r.checked > today) err(file, `${where}: checked ${r.checked} is in the future`);
    if (r.year > thisYear) err(file, `${where}: no statistics before the conference year`);
    if (r.decided && r.decided > today) err(file, `${where}: decided ${r.decided} is in the future`);
  }
  for (const a of f.areas_none ?? []) {
    for (const y of a.years) {
      if (data.areas.some((x) => x.value?.series === f.series && x.value?.year === y)) {
        err(file, `areas_none lists ${y}, but data/stats/areas/${f.series}-${y}.yml exists`);
      }
    }
  }
}
for (const { file, value: sf } of data.sourceFiles) {
  if (!sf?.edition?.startsWith('stats-')) continue;
  for (const s of sf.sources ?? []) {
    for (const u of [s.url, s.mirror_url]) {
      const bad = u ? unlicensedSource(u) : null;
      if (bad) err(file, `${s.id}: ${bad} has no licence; use it as a lead only, never as a source`);
    }
  }
}
for (const { file, value: a } of data.areas) {
  if (!validateAreas(a)) {
    schemaErrors(file, validateAreas);
    continue;
  }
  if (basename(file, '.yml') !== `${a.series}-${a.year}`) err(file, `file name must be ${a.series}-${a.year}.yml`);
  if (!statsSeries.has(a.series)) err(file, `no data/stats/${a.series}.yml for this series`);
  for (const p of areaProblems(a)) err(file, p);
  checkStatsSrc(file, 'source', a.src, a.source_url);
}
const taxonomy = data.topicTaxonomy;
if (taxonomy && !validateTaxonomy(taxonomy.value)) schemaErrors(taxonomy.file, validateTaxonomy);
if (data.topics.length && !taxonomy) err('data/topics', 'taxonomy.json is missing');
for (const { file, value: t } of data.topics) {
  if (!validateTopics(t)) {
    schemaErrors(file, validateTopics);
    continue;
  }
  if (basename(file, '.json') !== t.edition) err(file, `file name must be ${t.edition}.json`);
  for (const p of topicsProblems(t, taxonomy?.value ?? null)) err(file, p);
  const o = t.official_accepted;
  checkStatsSrc(file, 'official_accepted', o.src, o.source_url);
  const row = statsRows.get(`${t.series}-${t.year}-main`);
  if (!row) err(file, `no main-track row for ${t.year} in data/stats/${t.series}.yml`);
  else if (row.accepted !== o.value || row.source_url !== o.source_url || row.quote !== o.quote || row.src !== o.src) {
    err(file, `official_accepted must repeat data/stats/${t.series}.yml ${t.year} main (accepted, source_url, quote, src)`);
  }
  for (const x of t.topics) {
    if (x.prev && !data.topics.some((p) => p.value?.series === t.series && p.value?.year === x.prev!.year)) {
      err(file, `${x.id}: prev.year ${x.prev.year} has no data/topics file`);
    }
  }
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
for (const i of rankInfo) console.log(`info  ${i}`);
for (const e of errors) console.log(red(`error ${e}`));
const upstreamEditions = data.editions.filter((e) => e.value?.data_level === 'upstream').length;
const counts =
  `${data.sourceFiles.length} source files, ${data.series.length} series, ${data.editions.length} editions (${upstreamEditions} upstream), ` +
  `${data.rankLists.length} rank lists, ${data.rules.length} rules, ` +
  `${data.visa.length} visa files, ${data.holidays.length} holiday years, ${data.chinaAdmin?.value.items?.length ?? 0} school rules, ` +
  `${data.stats.length} stats series, ${data.areas.length} area files, ${data.topics.length} topic files`;
if (errors.length) {
  console.log(red(`✗ ${errors.length} error(s) — ${counts}`));
  process.exit(1);
}
console.log(green(`✓ valid — ${counts}${warnings.length ? `, ${warnings.length} warning(s)` : ''}`));
