// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Past acceptance statistics (data/stats/<series>.yml), official per-area
// statistics (data/stats/areas/<series>-<year>.yml) and top topics among
// accepted papers (data/topics/<series>-<year>.json). The types mirror
// schema/stats.schema.json, schema/stats-areas.schema.json and
// schema/topics.schema.json; the checks below are what the schemas cannot say.

export type StatsStatus = 'official' | 'partial' | 'third_party' | 'none';
export type StatsTrack = 'main' | 'findings' | 'main_and_findings' | 'cycle1' | 'cycle2';
export type RateBasis = 'stated' | 'computed' | 'approx' | 'estimate';
export type QuoteCheck = 'snapshot' | 'manual';

export interface StatsAlso {
  source_url: string;
  quote: string;
  src?: string;
  quote_check: QuoteCheck;
  note_zh?: string;
}

export interface StatsRow {
  year: number;
  track: StatsTrack;
  track_zh?: string;
  status: StatsStatus;
  submissions?: number;
  accepted?: number;
  /** Percent, for the bar height. */
  rate?: number;
  /** Shown as is: the official wording ("31%", "25.28%"), or one decimal when computed. */
  rate_text?: string;
  rate_basis?: RateBasis;
  definition_zh?: string;
  source_url?: string;
  quote?: string;
  src?: string;
  quote_check?: QuoteCheck;
  relay_zh?: string;
  dataset?: 'lixin4ever';
  count_method_zh?: string;
  count_url?: string;
  mismatch_zh?: string;
  note_zh?: string;
  also?: StatsAlso[];
  reason?: 'unpublished' | 'unlicensed_only' | 'doubtful';
  decided?: string;
  checked_urls?: string[];
  checked: string;
}

export interface StatsFile {
  series: string;
  rows: StatsRow[];
  areas_none?: { years: number[]; scope_zh?: string; checked: string; checked_urls: string[] }[];
}

export type AreaKind = 'rates' | 'rate_only' | 'submissions_only' | 'accepted_only' | 'share_of_accepted' | 'theme_track';

export interface AreaRow {
  area: string;
  label_on_source?: string;
  submissions?: number;
  accepted?: number;
  rate?: number;
  findings_accepted?: number;
  findings_rate?: number;
  share_pct?: number;
  quote?: string;
}

export interface AreaFile {
  series: string;
  year: number;
  kind: AreaKind;
  precision: 'exact' | 'chart_read' | 'our_count';
  track_zh: string;
  tolerance?: { count?: number; pct?: number };
  names_mapped?: true;
  source_url: string;
  page_zh?: string;
  quote?: string;
  src?: string;
  quote_check: QuoteCheck;
  figure_urls?: string[];
  count_method_zh?: string;
  total?: { label_zh?: string; submissions?: number; accepted?: number; rate?: number; findings_rate?: number; quote?: string };
  gap_note_zh?: string;
  note_zh?: string;
  checked: string;
  rows: AreaRow[];
}

export interface TopicRow {
  rank: number;
  id: string;
  label_zh: string;
  label_en: string;
  count: number;
  share_pct: number;
  prev?: { year: number; count: number; share_pct: number; delta_pp: number };
  low_precision?: true;
  examples?: string[];
}

export interface TopicsFile {
  schema: 1;
  edition: string;
  series: string;
  year: number;
  method_version: string;
  citation_zh: string;
  scope_zh?: string;
  source: { name: 'dblp'; license: 'CC0 1.0'; tocs: string[]; retrieved_at: string };
  papers_used: number;
  official_accepted: { value: number; source_url: string; quote: string; src?: string; quote_check: QuoteCheck };
  coverage: number;
  topics: TopicRow[];
}

export interface TopicTaxonomy {
  method_version: string;
  note_zh?: string;
  low_precision?: string[];
  topics: { id: string; label_zh: string; label_en: string; patterns: string[] }[];
}

/** How many topics the app shows; the files keep up to 15 for checking. */
export const TOPICS_SHOWN = 10;

/**
 * Datasets without a licence: leads only, never a source (csconfstats,
 * Paper Copilot, emeryberger/csconferences, tranhungnghiep/AI-Conference-Info),
 * plus OpenAccept, whose CC BY-SA would bind our data.
 */
export const UNLICENSED_SOURCES: { name: string; test: RegExp }[] = [
  { name: 'csconfstats', test: /(^|\.)xoveexu\.com$|github\.com\/xovee\//i },
  { name: 'Paper Copilot', test: /(^|\.)papercopilot\.com$|github\.com\/papercopilot\/|huggingface\.co\/datasets\/papercopilot\//i },
  { name: 'emeryberger/csconferences', test: /github\.com\/emeryberger\/|(^|\.)csconferences\.org$|emeryberger\.github\.io/i },
  { name: 'tranhungnghiep/AI-Conference-Info', test: /github\.com\/tranhungnghiep\//i },
  { name: 'OpenAccept', test: /(^|\.)openaccept\.org$/i },
];

/** The unlicensed dataset a URL points into, if any. */
export function unlicensedSource(url: string): string | null {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  const full = `${host}${url.replace(/^https?:\/\/[^/]+/, '')}`.replace(/^www\./, '');
  for (const s of UNLICENSED_SOURCES) if (s.test.test(host) || s.test.test(full)) return s.name;
  return null;
}

/** accepted / submissions in percent, rounded to one decimal. */
export function computedRate(accepted: number, submissions: number): number {
  return Math.round((1000 * accepted) / submissions) / 10;
}

/** Decimals in "27.4%" → 1, "31%" → 0. */
function decimals(rateText: string): number {
  return /\.(\d+)%$/.exec(rateText)?.[1]?.length ?? 0;
}

/**
 * The number appears in the text as a number: "1,574", "1574", "3, 937"
 * (a PDF text layer's thin space) and "47,5%" all count, and "2,334" is not
 * found inside "12,334" or "2,3345". Pass a string ("15.0") to keep its
 * trailing zeros.
 */
export function numberInText(n: number | string, text: string): boolean {
  const t = text.replace(/(\d),(\d{1,2})\s*%/g, '$1.$2%').replace(/(\d)(?:, ?|[\u2009\u202f])(?=\d{3}(?!\d))/g, '$1');
  const s = String(n).replace('.', '\\.');
  return new RegExp(`(?<![\\d.])${s}(?!\\d|\\.\\d)`).test(t);
}

/** Everything in a row that the schema cannot check. Empty when the row is fine. */
export function statsRowProblems(row: StatsRow): string[] {
  const out: string[] = [];
  const where = `${row.year} ${row.track}`;
  const { submissions: sub, accepted: acc, rate } = row;
  const shown = [sub, acc, rate].filter((x) => x !== undefined).length;
  if (row.status === 'official' && shown < 3) out.push(`${where}: official rows need submissions, accepted and rate (else status: partial)`);
  if (row.status === 'partial' && (shown === 0 || shown === 3)) out.push(`${where}: partial rows show one or two of submissions, accepted, rate`);
  if (row.status === 'third_party' && shown === 0) out.push(`${where}: third_party row without a number`);
  if (sub !== undefined && acc !== undefined && acc > sub) out.push(`${where}: more accepted than submitted`);

  if (rate !== undefined && row.rate_text !== undefined) {
    if (Number.parseFloat(row.rate_text) !== rate) out.push(`${where}: rate_text ${row.rate_text} is not rate ${rate}`);
    if (row.rate_basis === 'computed') {
      if (sub === undefined || acc === undefined) out.push(`${where}: a computed rate needs both counts`);
      else if (decimals(row.rate_text) !== 1 || Math.abs(rate - computedRate(acc, sub)) > 0.05) {
        out.push(`${where}: computed rate must be ${computedRate(acc, sub).toFixed(1)}% (accepted / submissions, one decimal)`);
      }
    } else if (sub !== undefined && acc !== undefined) {
      const exact = (100 * acc) / sub;
      const tolerance = 0.5 * 10 ** -decimals(row.rate_text) + 0.05;
      const off = Math.abs(rate - exact) > tolerance;
      if (off && !row.mismatch_zh) {
        out.push(`${where}: stated ${row.rate_text} but ${acc}/${sub} = ${exact.toFixed(2)}%; explain in mismatch_zh`);
      }
      if (!off && row.mismatch_zh) out.push(`${where}: mismatch_zh but the stated rate matches the counts`);
    }
  }

  // Every number shown is in a quote, or is our own count (accepted), or is computed.
  const quotes = [row.quote ?? '', ...(row.also ?? []).map((a) => a.quote)].join('\n');
  for (const [name, n] of [['submissions', sub], ['accepted', acc]] as const) {
    if (n === undefined) continue;
    if (numberInText(n, quotes)) continue;
    if (name === 'accepted' && row.count_method_zh && numberInText(n, row.count_method_zh)) continue;
    out.push(`${where}: ${name} ${n} is not in any quote${name === 'accepted' ? ' (or count_method_zh)' : ''}`);
  }
  if (rate !== undefined && row.rate_basis !== 'computed' && !numberInText(row.rate_text?.replace('%', '') ?? rate, quotes)) {
    out.push(`${where}: rate ${row.rate_text} is not in any quote`);
  }
  if (row.status !== 'none' && !row.quote && !row.count_method_zh) out.push(`${where}: needs a quote or count_method_zh`);
  if (row.quote_check === 'manual' && row.src) out.push(`${where}: manual rows cite source_url only (drop src)`);

  for (const url of [row.source_url, row.count_url, ...(row.also ?? []).map((a) => a.source_url), ...(row.checked_urls ?? [])]) {
    const bad = url ? unlicensedSource(url) : null;
    if (bad) out.push(`${where}: ${bad} has no licence; use it as a lead only, never as a source (${url})`);
  }
  if (row.dataset === 'lixin4ever' && !/github\.com\/lixin4ever\//.test(row.source_url ?? '')) {
    out.push(`${where}: dataset lixin4ever but source_url is not the lixin4ever repository`);
  }
  return out;
}

const AREA_FIELDS: Record<AreaKind, { need: (keyof AreaRow)[]; forbid: (keyof AreaRow)[] }> = {
  rates: { need: ['submissions', 'rate'], forbid: ['share_pct'] },
  rate_only: { need: ['rate'], forbid: ['submissions', 'accepted'] },
  submissions_only: { need: ['submissions'], forbid: ['accepted', 'rate', 'findings_rate', 'share_pct'] },
  accepted_only: { need: ['accepted'], forbid: ['submissions', 'rate', 'findings_rate', 'share_pct'] },
  share_of_accepted: { need: ['share_pct'], forbid: ['submissions', 'rate', 'findings_rate'] },
  theme_track: { need: ['submissions', 'accepted', 'rate'], forbid: ['share_pct'] },
};

/** Checks on an area file beyond its schema. */
export function areaProblems(a: AreaFile): string[] {
  const out: string[] = [];
  const rule = AREA_FIELDS[a.kind];
  const names = new Set<string>();
  for (const r of a.rows) {
    if (names.has(r.area)) out.push(`duplicate area ${r.area}`);
    names.add(r.area);
    for (const k of rule.need) if (r[k] === undefined) out.push(`${r.area}: ${a.kind} rows need ${k}`);
    for (const k of rule.forbid) if (r[k] !== undefined) out.push(`${r.area}: ${a.kind} rows must not have ${k}`);
    if (r.submissions !== undefined && r.accepted !== undefined && r.accepted > r.submissions) out.push(`${r.area}: more accepted than submitted`);
    if (r.rate !== undefined && r.submissions !== undefined && r.accepted !== undefined) {
      const exact = (100 * r.accepted) / r.submissions;
      // Chart readings: counts ± tolerance.count move the rate; allow for that plus the rate tolerance.
      const slack = a.precision === 'chart_read' ? (a.tolerance?.pct ?? 0) + (200 * (a.tolerance?.count ?? 0)) / r.submissions : 0.051;
      if (Math.abs(r.rate - exact) > slack + 0.05) out.push(`${r.area}: rate ${r.rate} does not follow from ${r.accepted}/${r.submissions}`);
    }
  }
  if (a.precision === 'chart_read' && !a.tolerance?.pct && !a.tolerance?.count) out.push('chart_read needs a tolerance');
  const sum = a.rows.reduce((s, r) => s + (r.submissions ?? 0), 0);
  if (a.total?.submissions && sum && Math.abs(sum - a.total.submissions) / a.total.submissions > 0.02 && !a.gap_note_zh) {
    out.push(`rows sum to ${sum} submissions but the total is ${a.total.submissions}; explain in gap_note_zh`);
  }
  for (const url of [a.source_url, ...(a.figure_urls ?? [])]) {
    const bad = unlicensedSource(url);
    if (bad) out.push(`${bad} has no licence; never a source (${url})`);
  }
  return out;
}

/** Checks on a topics file beyond its schema (taxonomy: the curated topic map it was counted with). */
export function topicsProblems(t: TopicsFile, taxonomy: TopicTaxonomy | null): string[] {
  const out: string[] = [];
  if (t.edition !== `${t.series}-${t.year}`) out.push(`edition must be ${t.series}-${t.year}`);
  const cov = Math.round((10000 * t.papers_used) / t.official_accepted.value) / 10000;
  if (Math.abs(cov - t.coverage) > 0.0001) out.push(`coverage must be papers_used / official_accepted.value = ${cov}`);
  const byId = new Map((taxonomy?.topics ?? []).map((x) => [x.id, x]));
  if (taxonomy && taxonomy.method_version !== t.method_version) out.push(`method_version ${t.method_version} but taxonomy.json is ${taxonomy.method_version}`);
  const low = new Set(taxonomy?.low_precision ?? []);
  const seen = new Set<string>();
  t.topics.forEach((x, i) => {
    const w = `topics[${i}] ${x.id}`;
    if (x.rank !== i + 1) out.push(`${w}: rank must be ${i + 1}`);
    if (i > 0 && x.count > t.topics[i - 1]!.count) out.push(`${w}: topics must be ordered by count, highest first`);
    if (seen.has(x.id)) out.push(`${w}: duplicate topic`);
    seen.add(x.id);
    if (Math.abs(x.share_pct - (100 * x.count) / t.papers_used) > 0.051) out.push(`${w}: share_pct must be count / papers_used`);
    const tax = byId.get(x.id);
    if (taxonomy && !tax) out.push(`${w}: not in taxonomy.json`);
    if (tax && (tax.label_zh !== x.label_zh || tax.label_en !== x.label_en)) out.push(`${w}: labels differ from taxonomy.json`);
    if (taxonomy && low.has(x.id) !== Boolean(x.low_precision)) out.push(`${w}: low_precision must follow taxonomy.json`);
    if (x.prev) {
      if (x.prev.year !== t.year - 1) out.push(`${w}: prev.year must be ${t.year - 1}`);
      if (Math.abs(x.prev.delta_pp - (x.share_pct - x.prev.share_pct)) > 0.051) out.push(`${w}: delta_pp must be share_pct - prev.share_pct`);
    }
  });
  return out;
}

export interface StatsQuote {
  file: string;
  where: string;
  src: string;
  quote: string;
}

/**
 * Every quote in data/stats, data/stats/areas and data/topics that CI checks
 * against a snapshot (quote_check: snapshot). Quotes may skip text; see
 * checkQuoteParts.
 */
export function statsQuotes(
  stats: { file: string; value: StatsFile }[],
  areas: { file: string; value: AreaFile }[],
  topics: { file: string; value: TopicsFile }[],
): StatsQuote[] {
  const out: StatsQuote[] = [];
  for (const { file, value } of stats) {
    for (const r of value?.rows ?? []) {
      const where = `${r.year} ${r.track}`;
      if (r.quote_check === 'snapshot' && r.src && r.quote) out.push({ file, where, src: r.src, quote: r.quote });
      (r.also ?? []).forEach((a, i) => {
        if (a.quote_check === 'snapshot' && a.src) out.push({ file, where: `${where} also[${i}]`, src: a.src, quote: a.quote });
      });
    }
  }
  for (const { file, value: a } of areas) {
    if (!a || a.quote_check !== 'snapshot' || !a.src) continue;
    if (a.quote) out.push({ file, where: 'quote', src: a.src, quote: a.quote });
    if (a.total?.quote) out.push({ file, where: 'total', src: a.src, quote: a.total.quote });
    for (const r of a.rows ?? []) if (r.quote) out.push({ file, where: r.area, src: a.src, quote: r.quote });
  }
  for (const { file, value: t } of topics) {
    const o = t?.official_accepted;
    if (o?.quote_check === 'snapshot' && o.src) out.push({ file, where: 'official_accepted', src: o.src, quote: o.quote });
  }
  return out;
}
