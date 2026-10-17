// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Rank labels (CCF, CAA, CAAI, 科协; CORE and THCPL as ccfddl carries them)
// for our series. A label is never guessed: it comes from an explicit link in
// data/ranks/mapping.yml, or from an automatic match strong enough to name
// one entry of one list for one series. Everything weaker goes to the report
// (pnpm ranks:report) and gets no label until someone links or denies it.
//
// Automatic matching compares normalized keys:
//   acronym:<normAcronym>  "IEEE VR" → "vr", "S&P" → "sp", "CCC2025" → "ccc"
//   name:<normName>        IEEE/ACM, SIG names, small words, years and ordinals dropped
//   dblp:<conf/key>        from a dblp URL or a bare ccfddl key
// and scores a candidate entry
//   3  same name; or same dblp key and same acronym
//   2  same dblp key and a similar name (overlap of the distinctive words ≥ 0.5)
//   1  same acronym and a similar name
//   0  same acronym, or same dblp key, and nothing else: only reported
// A series takes the one entry with its top score (a tie is "ambiguous"); an
// entry several series take goes to the one with the top score (a tie is
// "shared"). Score 0 never makes a label: CAAI's ITS is ACM Interactive
// Tabletops and Surfaces, not the ITS World Congress; CCF's CCC is
// Computational Complexity, not the Chinese Control Conference.

import type { CcfddlSeriesRecord, RankEntry, RankList, RankListKind, RankMapping, SeriesFile, UpstreamManifest } from './catalog.ts';

// ---------- normalization ----------

const LEADING_PUBLISHER = /^(?:(?:ieee|acm|ifip|cvf|rsj)(?:[\s/-]+|$))+/;
const TRAILING_YEAR = /(?:[\s'’-]*(?:19|20)\d{2}|['’]\d{2})$/;

function fold(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** "IEEE VR" → "vr"; "S&P" → "sp"; "HSCC+ICCPS" → "hscciccps"; "CCC2025" → "ccc". */
export function normAcronym(s: string): string {
  let t = fold(s).trim();
  const bare = t.replace(LEADING_PUBLISHER, '');
  if (/[a-z0-9]/.test(bare)) t = bare;
  t = t.replace(TRAILING_YEAR, '');
  return t.replace(/[^a-z0-9]/g, '');
}

/** Small words, and the publishers lists add or leave out ("IEEE/CVF", "ACM SIGIR"). */
const NAME_STOP = new Set(['the', 'a', 'an', 'of', 'on', 'and', 'for', 'in', 'at', 'to', 'with', 'ieee', 'acm', 'cvf', 'rsj']);
/** Words most venue names have: kept in the name key (a symposium is not a conference), left out when comparing similarity. */
const GENERIC = new Set(['international', 'annual', 'conference', 'conferences', 'symposium', 'meeting', 'congress', 'workshop', 'forum', 'joint']);
const CJK = /[\u3400-\u9fff]/;

/**
 * A venue name reduced for comparison. English: folded, "&" → "and",
 * parentheses, years, ordinals, SIG names and NAME_STOP words dropped.
 * Chinese: 第N届 and years dropped, only CJK letters and digits kept.
 */
export function normName(s: string): string {
  if (CJK.test(s)) {
    return s
      .normalize('NFKC')
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/第[0-9一二三四五六七八九十百零〇两]+[届次]/g, '')
      .replace(/(?:19|20)\d{2}年?/g, '')
      .replace(/[^\u3400-\u9fff0-9a-z]/gi, '')
      .toLowerCase();
  }
  return fold(s)
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !NAME_STOP.has(w) && !/^sig[a-z]+$/.test(w))
    .join(' ');
}

/** "http://dblp.uni-trier.de/db/conf/hybrid/" → "conf/hybrid"; "aaai" → "conf/aaai"; search URLs → null. */
export function normDblp(s: string): string | null {
  const t = s.trim().toLowerCase();
  const m = /\/db\/(conf|journals)\/([^/?#]+)/.exec(t);
  if (m) return `${m[1]}/${m[2]}`;
  if (/^(conf|journals)\/[a-z0-9_.-]+$/.test(t)) return t;
  if (/^[a-z0-9_.-]+$/.test(t)) return `conf/${t}`;
  return null;
}

/** The words of a normalized name that tell venues apart. */
function distinctive(n: string): string[] {
  return CJK.test(n) ? [n] : n.split(' ').filter((w) => w && !GENERIC.has(w));
}

/** A name key only when it still says something: two or more distinctive words, or four or more Chinese characters. */
function nameKey(s: string): string | null {
  const n = normName(s);
  if (!n) return null;
  if (CJK.test(n)) return n.length >= 4 ? `name:${n}` : null;
  return distinctive(n).length >= 2 ? `name:${n}` : null;
}

function acronymKey(s: string): string | null {
  const a = normAcronym(s);
  return a ? `acronym:${a}` : null;
}

/** The keys a list entry is matched on, from its acronyms, names and dblp links. */
export function entryKeys(e: { acronyms?: (string | null | undefined)[]; names?: (string | null | undefined)[]; dblp?: (string | null | undefined)[] }): string[] {
  const out = new Set<string>();
  for (const a of e.acronyms ?? []) if (a) for (const k of [acronymKey(a)]) if (k) out.add(k);
  for (const n of e.names ?? []) if (n) for (const k of [nameKey(n)]) if (k) out.add(k);
  for (const d of e.dblp ?? []) if (d) for (const k of [normDblp(d)]) if (k) out.add(`dblp:${k}`);
  return [...out];
}

/** A stored match key is well formed: known prefix, and its value already normalized. */
export function matchKeyProblem(key: string): string | null {
  const m = /^(acronym|name|dblp):(.+)$/.exec(key);
  if (!m) return `match key "${key}" must start with acronym:, name: or dblp:`;
  const [, kind, v] = m;
  if (kind === 'acronym' && normAcronym(v!) !== v) return `match key "${key}" is not normalized (want acronym:${normAcronym(v!)})`;
  if (kind === 'name' && normName(v!) !== v) return `match key "${key}" is not normalized (want name:${normName(v!)})`;
  if (kind === 'dblp' && normDblp(v!) !== v) return `match key "${key}" is not a dblp key (conf/<key>)`;
  return null;
}

function tokens(nameKeyValue: string): Set<string> {
  return new Set(distinctive(nameKeyValue));
}

/** Overlap (Jaccard) of the distinctive words of two normalized names. */
export function nameSimilarity(a: string, b: string): number {
  const x = tokens(a);
  const y = tokens(b);
  let both = 0;
  for (const t of x) if (y.has(t)) both++;
  const union = x.size + y.size - both;
  return union ? both / union : 0;
}

export const SIMILAR_NAME = 0.5;

// ---------- series keys ----------

export interface SeriesKeys {
  id: string;
  acronyms: Set<string>;
  names: Set<string>;
  dblp: Set<string>;
}

/** Keys of a series: its acronym, names and aliases, dblp key, and what ccfddl calls it. */
export function seriesKeys(s: SeriesFile, upstream?: Pick<CcfddlSeriesRecord, 'title' | 'description' | 'dblp'>): SeriesKeys {
  const acr = [s.acronym, ...(s.aliases ?? []), upstream?.title];
  const names = [s.full_name, s.name_zh, ...(s.aliases ?? []), upstream?.description];
  const keys = entryKeys({ acronyms: acr, names, dblp: [s.dblp, upstream?.dblp] });
  const pick = (p: string) => new Set(keys.filter((k) => k.startsWith(p)).map((k) => k.slice(p.length)));
  return { id: s.id, acronyms: pick('acronym:'), names: pick('name:'), dblp: pick('dblp:') };
}

// ---------- labels ----------

export type MatchMethod = 'explicit' | 'name' | 'dblp' | 'acronym_name' | 'upstream';

export interface RankLabel {
  /** ccf7, caa2024, caai2024, cast2025; core and thcpl for ccfddl's values. */
  list: string;
  label_zh: string;
  kind: RankListKind;
  tier: string;
  entry?: string;
  scope?: 'international' | 'domestic';
  qualifier_zh?: string;
  /** Edition-attached lists (CAST): the label holds for the edition held this year only. */
  year?: number;
  category_zh?: string;
  match: MatchMethod;
  /** Taken from ccfddl as it stands; not checked against the list. */
  upstream?: true;
  note_zh?: string;
}

/** Order labels are shown in: CCF, CAAI, 科协, then ccfddl's CORE and THCPL. CAA is not shipped (版权所有 不得转载). */
export const LABEL_ORDER = ['ccf7', 'caai2024', 'cast2025', 'core', 'thcpl'];

/** "CCF A", "CAA 国内A", "CAA A（GNC 分会）", "科协", "CORE A*". */
export function labelText(l: Pick<RankLabel, 'label_zh' | 'tier' | 'scope' | 'qualifier_zh'>): string {
  const tier = l.tier === 'listed' ? '' : ` ${l.scope === 'domestic' ? '国内' : ''}${l.tier}`;
  return `${l.label_zh}${tier}${l.qualifier_zh ? `（${l.qualifier_zh}）` : ''}`;
}

/** The labels an edition shows: series labels, and edition-attached ones only in their own year. */
export function labelsForEdition(labels: RankLabel[], year: number): RankLabel[] {
  return labels.filter((l) => l.year === undefined || l.year === year);
}

// ---------- matching ----------

interface Candidate {
  entry: RankEntry;
  /** 3 same name, or dblp + acronym; 2 dblp + similar name; 1 acronym + similar name; 0 report only. */
  score: number;
  method: MatchMethod;
  why: string;
}

export interface RankReport {
  /** One series, one list, several entries accepted: nothing is labelled. */
  ambiguous: { series: string; list: string; candidates: { entry: string; why: string }[] }[];
  /** Acronym or dblp key alone: not enough, nothing is labelled. */
  unconfirmed: { series: string; list: string; entry: string; why: string }[];
  /** One entry matched automatically by several series: nothing is labelled. */
  shared: { list: string; entry: string; series: string[] }[];
  /** ccfddl's CCF tier differs from the CCF list (or CCF has no entry). */
  ccfddl_disagree: { series: string; ccfddl: string; list: string | null }[];
  /** List entries no series is linked to yet ("import all CCF conferences" backlog). */
  unlinked: { list: string; entry: string; acronym: string | null; tier: string }[];
  /** Links and denials in mapping.yml that cannot apply. */
  problems: string[];
  /** Links to series that have no file yet (they apply once it exists). */
  pending: string[];
}

export interface RankResolution {
  labels: Map<string, RankLabel[]>;
  report: RankReport;
}

function labelOf(list: RankList, e: RankEntry, match: MatchMethod, extra: Partial<RankLabel> = {}): RankLabel {
  const cat = list.categories.find((c) => c.id === e.category);
  const l: RankLabel = { list: list.id, label_zh: list.label_zh, kind: list.kind, tier: e.tier, entry: e.id, match };
  if (e.scope) l.scope = e.scope;
  if (cat) l.category_zh = cat.name_zh;
  if (list.attach === 'edition' && list.covers_year) l.year = list.covers_year;
  return { ...l, ...extra };
}

function candidateFor(s: SeriesKeys, e: RankEntry): Candidate | null {
  const keys = e.match_keys;
  const names = keys.filter((k) => k.startsWith('name:')).map((k) => k.slice(5));
  const nameHit = names.find((n) => s.names.has(n));
  if (nameHit) return { entry: e, score: 3, method: 'name', why: `same name "${nameHit}"` };
  const acrHit = keys.find((k) => k.startsWith('acronym:') && s.acronyms.has(k.slice(8)))?.slice(8);
  const dblpHit = keys.find((k) => k.startsWith('dblp:') && s.dblp.has(k.slice(5)))?.slice(5);
  let sim = 0;
  for (const a of s.names) for (const b of names) sim = Math.max(sim, nameSimilarity(a, b));
  const simText = `name overlap ${sim.toFixed(2)}`;
  if (dblpHit && acrHit) return { entry: e, score: 3, method: 'dblp', why: `dblp ${dblpHit} and acronym ${acrHit}` };
  if (dblpHit && sim >= SIMILAR_NAME) return { entry: e, score: 2, method: 'dblp', why: `dblp ${dblpHit}, ${simText}` };
  if (acrHit && sim >= SIMILAR_NAME) return { entry: e, score: 1, method: 'acronym_name', why: `acronym ${acrHit}, ${simText}` };
  if (acrHit) return { entry: e, score: 0, method: 'acronym_name', why: `acronym ${acrHit} only, ${simText}` };
  if (dblpHit) return { entry: e, score: 0, method: 'dblp', why: `dblp ${dblpHit} only, ${simText}` };
  return null;
}

function indexEntries(list: RankList): Map<string, RankEntry[]> {
  const idx = new Map<string, RankEntry[]>();
  for (const e of list.entries) for (const k of e.match_keys) idx.set(k, [...(idx.get(k) ?? []), e]);
  return idx;
}

function seriesLookupKeys(s: SeriesKeys): string[] {
  return [...[...s.acronyms].map((a) => `acronym:${a}`), ...[...s.names].map((n) => `name:${n}`), ...[...s.dblp].map((d) => `dblp:${d}`)];
}

const UPSTREAM_TIERS: Record<string, { label_zh: string; kind: RankListKind; tiers: string[] }> = {
  core: { label_zh: 'CORE', kind: 'international', tiers: ['A*', 'A', 'B', 'C'] },
  thcpl: { label_zh: 'THCPL', kind: 'university', tiers: ['A', 'B'] },
};

/**
 * Labels for every series, and the report of what could not be decided.
 * `series` are the series files; `upstream` is the ccfddl manifest (its
 * CORE and THCPL values become labels marked upstream, and its CCF values
 * are compared with the CCF list).
 */
export function resolveRanks(series: SeriesFile[], lists: RankList[], mapping: RankMapping, upstream: UpstreamManifest | null): RankResolution {
  const labels = new Map<string, RankLabel[]>(series.map((s) => [s.id, []]));
  const report: RankReport = { ambiguous: [], unconfirmed: [], shared: [], ccfddl_disagree: [], unlinked: [], problems: [], pending: [] };
  const seriesIds = new Set(series.map((s) => s.id));
  const up = new Map((upstream?.series ?? []).map((r) => [r.series, r]));
  const keys = series.map((s) => seriesKeys(s, up.get(s.id)));
  const listIds = new Set(lists.map((l) => l.id));
  for (const l of [...mapping.links, ...mapping.not]) if (!listIds.has(l.list)) report.problems.push(`${l.series} → ${l.list}/${l.entry}: unknown list ${l.list}`);

  for (const list of lists) {
    const byId = new Map(list.entries.map((e) => [e.id, e]));
    const links = mapping.links.filter((l) => l.list === list.id);
    const denied = new Set(mapping.not.filter((d) => d.list === list.id).map((d) => `${d.series}|${d.entry}`));
    for (const d of mapping.not.filter((x) => x.list === list.id)) {
      if (!byId.has(d.entry)) report.problems.push(`not ${d.series} → ${list.id}/${d.entry}: no such entry`);
      if (links.some((l) => l.series === d.series && l.entry === d.entry)) report.problems.push(`${d.series} → ${list.id}/${d.entry} is both linked and denied`);
    }
    const linkedSeries = new Set<string>();
    const linkedEntries = new Set<string>();
    const seen = new Set<string>();
    for (const l of links) {
      const e = byId.get(l.entry);
      if (!e) {
        report.problems.push(`${l.series} → ${list.id}/${l.entry}: no such entry`);
        continue;
      }
      if (seen.has(`${l.series}|${l.entry}`)) report.problems.push(`${l.series} → ${list.id}/${l.entry}: linked twice`);
      seen.add(`${l.series}|${l.entry}`);
      if (l.year !== undefined && list.attach !== 'edition') report.problems.push(`${l.series} → ${list.id}/${l.entry}: year only applies to edition-attached lists`);
      linkedEntries.add(e.id);
      if (!seriesIds.has(l.series)) {
        report.pending.push(`${l.series} → ${list.id}/${l.entry}`);
        continue;
      }
      linkedSeries.add(l.series);
      const extra: Partial<RankLabel> = {};
      if (l.qualifier_zh) extra.qualifier_zh = l.qualifier_zh;
      if (l.note_zh) extra.note_zh = l.note_zh;
      if (l.year !== undefined) extra.year = l.year;
      labels.get(l.series)!.push(labelOf(list, e, 'explicit', extra));
    }
    for (const s of series) {
      const own = links.filter((l) => l.series === s.id);
      if (list.attach === 'series' && new Set(own.map((l) => l.entry)).size > 1 && !own.every((l) => l.qualifier_zh)) {
        report.problems.push(`${s.id} is linked to ${own.length} entries of ${list.id}; give each a qualifier_zh or keep one`);
      }
    }

    // Automatic matches, for series without an explicit link to this list.
    const idx = indexEntries(list);
    const accepted = new Map<string, Candidate>();
    for (const sk of keys) {
      if (linkedSeries.has(sk.id)) continue;
      const found = new Map<string, Candidate>();
      for (const k of seriesLookupKeys(sk)) {
        for (const e of idx.get(k) ?? []) {
          if (found.has(e.id) || linkedEntries.has(e.id) || denied.has(`${sk.id}|${e.id}`)) continue;
          const c = candidateFor(sk, e);
          if (c) found.set(e.id, c);
        }
      }
      const all = [...found.values()];
      const top = Math.max(0, ...all.map((c) => c.score));
      const best = all.filter((c) => c.score === top);
      if (top > 0 && best.length === 1) accepted.set(sk.id, best[0]!);
      else if (top > 0) {
        report.ambiguous.push({ series: sk.id, list: list.id, candidates: best.map((c) => ({ entry: c.entry.id, why: c.why })) });
      } else {
        for (const c of all) report.unconfirmed.push({ series: sk.id, list: list.id, entry: c.entry.id, why: c.why });
      }
    }
    const byEntry = new Map<string, string[]>();
    for (const [sid, c] of accepted) byEntry.set(c.entry.id, [...(byEntry.get(c.entry.id) ?? []), sid]);
    for (const [entry, sids] of byEntry) {
      const top = Math.max(...sids.map((sid) => accepted.get(sid)!.score));
      const winners = sids.filter((sid) => accepted.get(sid)!.score === top);
      if (winners.length > 1) {
        report.shared.push({ list: list.id, entry, series: winners.sort() });
        continue;
      }
      const winner = winners[0]!;
      const c = accepted.get(winner)!;
      labels.get(winner)!.push(labelOf(list, c.entry, c.method));
      linkedEntries.add(entry);
      for (const sid of sids) {
        if (sid !== winner) report.unconfirmed.push({ series: sid, list: list.id, entry, why: `${accepted.get(sid)!.why}; ${winner} matches it better` });
      }
    }
    for (const e of list.entries) {
      if (!linkedEntries.has(e.id)) report.unlinked.push({ list: list.id, entry: e.id, acronym: e.acronym, tier: e.tier });
    }
  }

  // ccfddl: CORE and THCPL as it carries them; its CCF tier only cross-checked.
  const ccf = lists.find((l) => l.id === 'ccf7');
  for (const s of series) {
    const r = up.get(s.id);
    if (!r) continue;
    for (const [list, meta] of Object.entries(UPSTREAM_TIERS)) {
      const tier = r.rank[list as 'core' | 'thcpl'];
      if (tier && meta.tiers.includes(tier)) {
        labels.get(s.id)!.push({ list, label_zh: meta.label_zh, kind: meta.kind, tier, match: 'upstream', upstream: true, note_zh: '取自 ccfddl，未与原目录核对' });
      }
    }
    if (ccf && r.rank.ccf && r.rank.ccf !== 'N') {
      const mine = labels.get(s.id)!.find((l) => l.list === ccf.id);
      if (!mine || mine.tier !== r.rank.ccf) report.ccfddl_disagree.push({ series: s.id, ccfddl: r.rank.ccf, list: mine?.tier ?? null });
    }
  }
  for (const [id, ls] of labels) labels.set(id, ls.sort((a, b) => LABEL_ORDER.indexOf(a.list) - LABEL_ORDER.indexOf(b.list)));
  return { labels, report };
}
