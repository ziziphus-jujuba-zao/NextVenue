// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Submission preferences and the submission route (docs/MOBILE_SPEC.md §9):
// research directions, the venue series a user ranks as 首选 / 备选, which
// edition of a series the lists show, and the route itself: one venue at a
// time, the next one taken once the previous result is out. No DOM here.

import { MILESTONE_ZH, beijingDate, fmtPoint, isAbstractEntry, isAbstractOnly, md, nextBoundary, seriesName, shownDate, targetOf, type Target } from './logic.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

// ---------- directions ----------

/** A research direction: a taxonomy id, "cs/ml", "eng/control" (data/taxonomy.yml, apps/mobile/taxonomy.ts). */
export type Direction = string;

/**
 * The v0.3 picker's ids (stored in nv.topics and in papers before v0.6, and
 * the `topics` of old editions) → taxonomy ids. data/taxonomy.yml `legacy`.
 */
export const LEGACY_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ml: 'cs/ml',
  ai: 'cs/ml',
  cv: 'cs/cv',
  nlp: 'cs/nlp',
  robotics: 'cs/robotics',
  dm: 'cs/dm',
};

export const isDirection = (s: unknown): s is Direction => typeof s === 'string' && /^[a-z]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

/** Common 首选 per direction, prefilled on first run. Only the v0.3 directions have them; elsewhere the user picks. */
export const DEFAULT_FIRST: Readonly<Record<Direction, string[]>> = {
  'cs/ml': ['neurips', 'iclr', 'icml'],
  'cs/cv': ['cvpr', 'iccv', 'eccv'],
  'cs/nlp': ['acl', 'emnlp', 'naacl'],
  'cs/robotics': ['icra', 'iros', 'corl'],
  'cs/dm': ['kdd', 'www', 'sigir'],
};

/** An edition's directions: its series' taxonomy directions (main first); old data only has v0.3 topics. */
export function directionsOf(ed: AppEdition): Direction[] {
  if (ed.directions?.length) return [...ed.directions];
  return cleanDirections(ed.topics ?? []);
}

/**
 * Directions as stored or passed in: v0.3 ids become taxonomy ids ("ml" →
 * "cs/ml"), unknown values and repeats go, the order stays. With `known`,
 * only those ids are kept.
 */
export function cleanDirections(v: unknown, known?: ReadonlySet<string>): Direction[] {
  const out: Direction[] = [];
  for (const x of Array.isArray(v) ? v : []) {
    const id = typeof x === 'string' ? (LEGACY_DIRECTIONS[x] ?? x) : undefined;
    if (isDirection(id) && (!known || known.has(id)) && !out.includes(id)) out.push(id);
  }
  return out;
}

// ---------- series ----------

export interface Series {
  id: string;
  /** "NeurIPS", "WWW". */
  name: string;
  directions: Direction[];
  /** Its editions in the data, earliest first. */
  editions: AppEdition[];
}

function firstMs(ed: AppEdition): number {
  let best = Number.POSITIVE_INFINITY;
  for (const m of ed.milestones)
    for (const t of [m.at_resolved, m.start_resolved, m.end_resolved]) if (t && m.status !== 'tba') best = Math.min(best, Date.parse(t.utc));
  return best;
}

/** A series the data names but holds no edition of yet (CRYPTO, most CCF C venues): it can still be found and followed. */
export interface SeriesStub {
  id: string;
  name: string;
  directions: Direction[];
}

/**
 * Conference series (ARR cycles are review cycles, not venues one ranks):
 * those with editions, and `stubs` for the ones without any (every CCF-listed
 * conference is here, dates or not).
 */
export function seriesCatalog(editions: AppEdition[], stubs: readonly SeriesStub[] = []): Series[] {
  const map = new Map<string, AppEdition[]>();
  for (const e of editions) {
    if (e.kind !== 'conference') continue;
    const list = map.get(e.series) ?? [];
    list.push(e);
    map.set(e.series, list);
  }
  const withEditions = [...map.entries()].map(([id, eds]) => {
    const sorted = [...eds].sort((a, b) => a.year - b.year || firstMs(a) - firstMs(b));
    // The latest edition's directions first (the series file's order, main one first).
    const dirs = [...new Set([...sorted].reverse().flatMap(directionsOf))];
    return {
      id,
      name: seriesName(sorted[sorted.length - 1]!),
      directions: dirs,
      editions: sorted,
    };
  });
  const bare = stubs.filter((x) => !map.has(x.id) && x.directions.length).map((x) => ({ id: x.id, name: x.name, directions: [...x.directions], editions: [] }));
  return [...withEditions, ...bare].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Where a series stands for a new paper: `open`, a deadline it can still
 * make; `tba`, an edition not over whose submission deadline is not
 * published yet (ASCO 2027); `closed`, every deadline in the data passed;
 * `none`, no edition in the data at all (its dates are not collected).
 */
export type SeriesState = 'open' | 'tba' | 'closed' | 'none';

export function seriesState(s: Series, now: number): SeriesState {
  if (nextOpenEntry(s, now)) return 'open';
  if (!s.editions.length) return 'none';
  return s.editions.some((ed) => tbaEntry(ed, now)) ? 'tba' : 'closed';
}

/** The submission step of an edition that is not published yet (its abstract or paper deadline is 待公布), while the edition is not over. */
export function tbaEntry(ed: AppEdition, now: number): AppMilestone | undefined {
  if (ed.kind !== 'conference') return undefined;
  const c = ed.milestones.find((m) => m.type === 'conference' && m.status !== 'tba');
  const end = c && (c.end_resolved ?? c.at_resolved ?? c.start_resolved);
  if (end && Date.parse(end.utc) < now) return undefined;
  return ed.milestones.find((m) => m.status === 'tba' && (m.type === 'abstract' || m.type === 'paper_registration' || m.type === 'paper'));
}

/** At least one edition was checked against the venue's own pages (data_level curated). */
export const isCurated = (s: Series) => s.editions.some((e) => e.data_level !== 'upstream');

/**
 * The picker's order (§9.1, the owner's "largest first"): venues this project
 * checked against their own pages first, then by their best tier in the
 * Chinese lists (`tier`: 0 for A, 1 B, 2 C, 3 none), then by the next
 * deadline a new paper can still make. NeurIPS, ICLR, ICML and AAAI lead the
 * 机器学习 list, not whichever small workshop is due next.
 */
export function pickerOrder(list: readonly Series[], now: number, tier: (s: Series) => number): Series[] {
  const key = new Map(list.map((s) => [s.id, [isCurated(s) ? 0 : 1, tier(s), openKey(s, now)] as const]));
  const cmp = (x: number, y: number) => (x === y ? 0 : x < y ? -1 : 1);
  return [...list].sort((a, b) => {
    const x = key.get(a.id)!;
    const y = key.get(b.id)!;
    return cmp(x[0], y[0]) || cmp(x[1], y[1]) || cmp(x[2], y[2]) || a.name.localeCompare(b.name);
  });
}

/**
 * The edition the lists show for a series: the one holding its soonest
 * upcoming milestone. ICLR 2027 stays until its conference is over, then
 * ICLR 2028 takes over; two editions of one series are never listed together.
 */
export function nearestEdition(s: Series, now: number): AppEdition | undefined {
  let best: { ed: AppEdition; ms: number } | undefined;
  for (const ed of s.editions)
    for (const m of ed.milestones) {
      const b = nextBoundary(m, now);
      if (b && (!best || b.target.ms < best.ms)) best = { ed, ms: b.target.ms };
    }
  return best?.ed;
}

// ---------- submission entries ----------

/** One way into an edition: a paper deadline, the abstract or registration step before it, and the result. */
export interface Entry {
  edition: AppEdition;
  paper: AppMilestone;
  paperT: Target;
  paperAt: ResolvedTime;
  /** Abstract or paper registration that must happen first, if the venue has one. */
  pre?: AppMilestone;
  preT?: Target;
  preAt?: ResolvedTime;
  result?: AppMilestone;
  resultT?: Target;
  resultAt?: ResolvedTime;
  /** 1-based round when the edition has several paper deadlines (WACV Round 1 / Round 2). */
  round?: number;
  estimated: boolean;
}

const at = (m: AppMilestone): ResolvedTime | undefined => (m.status === 'tba' ? undefined : (m.at_resolved ?? m.end_resolved));

const ENTRIES = new WeakMap<AppEdition, Entry[]>();

/**
 * Every entry of an edition, earliest first; an edition without a known
 * paper deadline has none. An abstract-only edition has one: its first
 * abstract deadline (a later "late-breaking" call is for new results only,
 * so it is listed on the timeline but never offered as a way in).
 */
export function entriesOf(ed: AppEdition): Entry[] {
  let out = ENTRIES.get(ed);
  if (!out) ENTRIES.set(ed, (out = computeEntries(ed)));
  return out;
}

function computeEntries(ed: AppEdition): Entry[] {
  const byTime = (a: AppMilestone, b: AppMilestone) => targetOf(at(a)!).ms - targetOf(at(b)!).ms;
  const abstractOnly = isAbstractEntry(ed);
  const papers = abstractOnly
    ? ed.milestones.filter((m) => m.type === 'abstract' && at(m)).sort(byTime).slice(0, 1)
    : ed.milestones.filter((m) => m.type === 'paper' && at(m)).sort(byTime);
  const pres = abstractOnly ? [] : ed.milestones.filter((m) => (m.type === 'abstract' || m.type === 'paper_registration') && at(m));
  // Each round's result is the first one after its paper deadline (KDD: 11/14 for 一轮, 5/16 for 二轮; WACV shares one).
  const results = ed.milestones
    .filter((m) => m.type === 'notification' && m.status !== 'tba' && (m.at_resolved ?? m.end_resolved ?? m.start_resolved))
    .map((m) => {
      const t = (m.at_resolved ?? m.end_resolved ?? m.start_resolved)!;
      return { m, t, target: targetOf(t) };
    })
    .sort((a, b) => a.target.ms - b.target.ms);
  return papers.map((paper, i) => {
    const paperT = targetOf(at(paper)!);
    const prevMs = i ? targetOf(at(papers[i - 1]!)!).ms : Number.NEGATIVE_INFINITY;
    // The registration step of this round: the earliest one after the previous round's paper deadline.
    const pre = pres
      .filter((m) => {
        const ms = targetOf(at(m)!).ms;
        return ms <= paperT.ms && ms > prevMs;
      })
      .sort((a, b) => targetOf(at(a)!).ms - targetOf(at(b)!).ms)[0];
    const r = results.find((x) => x.target.ms > paperT.ms);
    const result = r?.m;
    return {
      edition: ed,
      paper,
      paperT,
      paperAt: at(paper)!,
      pre,
      preT: pre ? targetOf(at(pre)!) : undefined,
      preAt: pre ? at(pre) : undefined,
      result,
      resultT: r?.target,
      resultAt: r?.t,
      round: papers.length > 1 ? i + 1 : undefined,
      estimated: [paper, pre, result].some((m) => m?.status === 'estimated'),
    };
  });
}

/** Still possible to submit here: the registration step (if any) and the paper deadline are both ahead. */
export const isOpen = (e: Entry, now: number) => e.paperT.ms > now && (!e.preT || e.preT.ms > now);

/** The first deadline of an entry: the abstract or registration when there is one, else the paper. */
export const firstStep = (e: Entry): { m: AppMilestone; t: Target } => (e.pre && e.preT ? { m: e.pre, t: e.preT } : { m: e.paper, t: e.paperT });

/**
 * The next entry of a series a new paper can still make: ICLR 2028 on
 * 2026-09-25, because ICLR 2027's abstract closed on 9/19 although its paper
 * deadline is the next day. Earliest first step first.
 */
export function nextOpenEntry(s: Series, now: number): Entry | undefined {
  // Pickers sort hundreds of series by this; one answer per series and moment.
  const hit = NEXT_OPEN.get(s);
  if (hit && hit.now === now) return hit.entry;
  const entry = s.editions
    .flatMap(entriesOf)
    .filter((e) => isOpen(e, now))
    .sort((a, b) => firstStep(a).t.ms - firstStep(b).t.ms)[0];
  NEXT_OPEN.set(s, { now, entry });
  return entry;
}

const NEXT_OPEN = new WeakMap<Series, { now: number; entry: Entry | undefined }>();

/**
 * The edition takes no new papers now: it has a deadline, none is still
 * open, and one has already passed (ICLR 2027 after its abstract closed).
 * Only a paper already submitted there cares about its later milestones.
 */
export function closedToNew(ed: AppEdition, now: number): boolean {
  const es = entriesOf(ed);
  return es.length > 0 && !es.some((e) => isOpen(e, now)) && es.some((e) => firstStep(e).t.ms <= now);
}

/** Something was already submitted here (a first step passed); for 正在投 and migrated papers. */
export const started = (ed: AppEdition, now: number) => entriesOf(ed).some((e) => firstStep(e).t.ms <= now);

// ---------- preferences ----------

/** Ranked venue series: 首选 then 备选. Numbers run across both (首选 1–3, 备选 4–5). */
export interface Prefs {
  first: string[];
  backup: string[];
}

export type Tier = 'first' | 'backup';

export const prefSeries = (p: Prefs) => [...p.first, ...p.backup];

export function rankOf(p: Prefs, series: string): { tier: Tier; rank: number } | undefined {
  const i = p.first.indexOf(series);
  if (i >= 0) return { tier: 'first', rank: i + 1 };
  const j = p.backup.indexOf(series);
  return j >= 0 ? { tier: 'backup', rank: p.first.length + j + 1 } : undefined;
}

/** Stored or passed-in preferences, keeping only known series, each once. */
export function cleanPrefs(v: unknown, known: Set<string>): Prefs | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as { first?: unknown; backup?: unknown };
  const seen = new Set<string>();
  const list = (x: unknown) =>
    (Array.isArray(x) ? x : []).filter((s): s is string => {
      if (typeof s !== 'string' || !known.has(s) || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  return { first: list(o.first), backup: list(o.backup) };
}

/** "?prefs=neurips,iclr,icml|acl,emnlp" → 首选 NeurIPS, ICLR, ICML; 备选 ACL, EMNLP. */
export function parsePrefsParam(s: string, known: Set<string>): Prefs {
  const [a = '', b = ''] = s.toLowerCase().split('|');
  const split = (x: string) => x.split(',').map((t) => t.trim()).filter(Boolean);
  return cleanPrefs({ first: split(a), backup: split(b) }, known)!;
}

/**
 * The prefilled 首选: the usual venues of the first direction the user
 * picked (NeurIPS, ICLR, ICML for 机器学习; ACL, EMNLP, NAACL for NLP; none
 * for 控制). Venues of the other directions are listed unranked, so adding
 * NLP after 机器学习 never pushes ACL, EMNLP, NAACL into 首选.
 */
export function defaultPrefs(dirs: Direction[], known: Set<string>): Prefs {
  return cleanPrefs({ first: dirs.length ? (DEFAULT_FIRST[dirs[0]!] ?? []) : [], backup: [] }, known)!;
}

/**
 * Tap on a venue in the first-run picker: add it to the end of `tier`; a
 * venue already in the other tier moves there; a second tap in the same tier
 * takes it out.
 */
export function togglePick(p: Prefs, series: string, tier: Tier): Prefs {
  const r = rankOf(p, series);
  const rest = removePick(p, series);
  if (r?.tier === tier) return rest;
  return tier === 'first' ? { first: [...rest.first, series], backup: rest.backup } : { first: rest.first, backup: [...rest.backup, series] };
}

export function removePick(p: Prefs, series: string): Prefs {
  return { first: p.first.filter((s) => s !== series), backup: p.backup.filter((s) => s !== series) };
}

/**
 * ↑ / ↓ on the preferences page. Inside a tier it swaps with the neighbour.
 * At the line between tiers only the moved venue changes tier: ↓ on the last
 * 首选 makes it 备选 1, ↑ on the first 备选 makes it the last 首选. The last
 * remaining 首选 cannot move down.
 */
export function movePick(p: Prefs, series: string, dir: -1 | 1): Prefs {
  const swap = (list: string[], i: number, j: number) => {
    const out = [...list];
    [out[i], out[j]] = [out[j]!, out[i]!];
    return out;
  };
  const i = p.first.indexOf(series);
  if (i >= 0) {
    if (dir === -1) return i === 0 ? p : { first: swap(p.first, i, i - 1), backup: p.backup };
    if (i < p.first.length - 1) return { first: swap(p.first, i, i + 1), backup: p.backup };
    return p.first.length === 1 ? p : { first: p.first.slice(0, -1), backup: [series, ...p.backup] };
  }
  const j = p.backup.indexOf(series);
  if (j < 0) return p;
  if (dir === 1) return j === p.backup.length - 1 ? p : { first: p.first, backup: swap(p.backup, j, j + 1) };
  return j > 0 ? { first: p.first, backup: swap(p.backup, j, j - 1) } : { first: [...p.first, series], backup: p.backup.slice(1) };
}

export const canMove = (p: Prefs, series: string, dir: -1 | 1) => movePick(p, series, dir) !== p;

/**
 * Preferences for a new paper. The paper's direction is a label: it follows
 * the global preferences (all of them, 备选 included) whenever any ranked
 * venue fits it. Only a direction none of them covers (a robotics paper for
 * an ML user) gets its own copy: that direction's usual 首选.
 */
export function prefsForPaper(dirs: Direction[], global: Prefs, catalog: Series[], known: Set<string>): Prefs | undefined {
  const fits = prefSeries(global).some((id) => catalog.find((s) => s.id === id)?.directions.some((d) => dirs.includes(d)));
  if (fits || !dirs.length) return undefined;
  const own = defaultPrefs(dirs, known);
  return own.first.length ? own : undefined;
}

/** The directions of some series, each once, in the order met (each series' main direction first). */
export function directionsOfSeries(ids: string[], catalog: Series[]): Direction[] {
  return [...new Set(ids.flatMap((id) => catalog.find((s) => s.id === id)?.directions ?? []))];
}

/**
 * v0.1 stored followed edition ids (nv.follows). Each becomes its series as a
 * 首选, soonest paper deadline first. An ARR cycle becomes the conferences
 * that take it (the same paper deadline: arr-2026-10 → NAACL 2027).
 */
export function migrateFollows(ids: string[], editions: AppEdition[], now: number): { prefs: Prefs; directions: Direction[] } {
  const catalog = seriesCatalog(editions);
  const series = new Set<string>();
  for (const id of ids) {
    const ed = editions.find((e) => e.id === id);
    if (!ed) continue;
    if (ed.kind === 'conference') series.add(ed.series);
    else {
      const paper = entriesOf(ed)[0];
      for (const c of editions)
        if (c.kind === 'conference' && paper && entriesOf(c).some((e) => e.paperT.ms === paper.paperT.ms)) series.add(c.series);
    }
  }
  const next = (id: string) => {
    const s = catalog.find((x) => x.id === id);
    const e = s && nextOpenEntry(s, now);
    return e ? firstStep(e).t.ms : Number.POSITIVE_INFINITY;
  };
  const first = [...series].sort((a, b) => next(a) - next(b) || a.localeCompare(b));
  return { prefs: { first, backup: [] }, directions: directionsOfSeries(first, catalog) };
}

// ---------- the route (§9.5) ----------

export interface RouteStop {
  entry: Entry;
  /** Where the series sits in the preferences; absent for a submitted venue the user never ranked. */
  pref?: { tier: Tier; rank: number };
  /** The paper is already submitted here (正在投), so the stop stays after its deadline. */
  current?: boolean;
  /** 先注册摘要: this stop's abstract or registration closes before the previous stop's result is out. */
  preFirst?: boolean;
  /** Its series is already an earlier stop (AISTATS 2028 after AISTATS 2027): the same target, a year later. */
  repeat?: boolean;
}

export interface RouteInsert {
  /** Index of the stop it can follow; it fits before stops[after + 1]. */
  after: number;
  entry: Entry;
  pref: { tier: Tier; rank: number };
}

export interface Missed {
  edition: AppEdition;
  /** The deadline that closed it (the latest one already past). */
  milestone: AppMilestone;
  target: Target;
}

export interface Route {
  stops: RouteStop[];
  inserts: RouteInsert[];
  missed: Missed[];
  /** Some date on the route is an estimate: the card says so once. */
  estimated: boolean;
}

export interface RouteInput {
  prefs: Prefs;
  editions: AppEdition[];
  now: number;
  /** Days to revise after a result before the next deadline (default 7). */
  prepDays?: number;
  /** Edition the paper is already submitted to. */
  current?: string;
  maxStops?: number;
  horizonMonths?: number;
  /** Allow a stop whose abstract closes before the previous result (先注册摘要). Default true. */
  abstractFirst?: boolean;
}

export const PREP_DAYS = 7;
export const INSERT_GAP_DAYS = 120;

function addMonths(ms: number, n: number): number {
  const d = new Date(ms);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.getTime();
}

const DAY = 86_400_000;

/** Wall clock minus UTC for a resolved time (a date-only time is 23:59 of that day). */
function zoneOffset(t: ResolvedTime): number {
  const [d, hm = '23:59'] = t.local.split('T');
  return Date.parse(`${d}T${hm}:00Z`) - Date.parse(t.utc);
}

/**
 * Whole days from the start of the result day to a deadline, both in the
 * deadline's own time zone. ICML results on 4/30 (AoE) leave 5 days to the
 * NeurIPS abstract (5/4 23:59 AoE) and 7 to its paper (5/6 23:59 AoE); the
 * Beijing days the app shows (5/5, 5/7) give the same numbers.
 */
export function daysUntil(result: ResolvedTime, deadline: ResolvedTime): number {
  const off = zoneOffset(deadline);
  const day = result.local.includes('T') ? new Date(Date.parse(result.utc) + off).toISOString().slice(0, 10) : result.local.slice(0, 10);
  const start = Date.parse(`${day}T00:00:00Z`) - off;
  return Math.floor((Date.parse(deadline.utc) + 60_000 - start) / DAY);
}

/**
 * Can `e` follow a stop whose result comes out on `result`? Either
 *   - its paper deadline leaves at least `prep` days (daysUntil), or
 *   - (with `abstractFirst`) its abstract / registration closes by the end of
 *     the result day and the paper deadline is on a later day: register
 *     first, submit the paper once the result is out (NeurIPS 9/24 → ICLR
 *     2028 9/26). That stop carries the 先注册摘要 warning, and the card
 *     shows how few days are left.
 */
export function canFollow(e: Entry, result: ResolvedTime, prep: number, abstractFirst = true): boolean {
  if (daysUntil(result, e.paperAt) >= prep) return true;
  return abstractFirst && preFirst(e, result);
}

/** 摘要提醒: the abstract or registration closes by the end of the result day, the paper deadline on a later day. */
export function preFirst(e: Entry, result: ResolvedTime): boolean {
  return !!e.preAt && daysUntil(result, e.preAt) <= 1 && daysUntil(result, e.paperAt) >= 2;
}

/** Days a hop leaves: from the previous result to this stop's abstract (when after it) and paper deadline. */
export interface Gap {
  pre?: number;
  paper: number;
  /** Fewer than `prep` days for the paper. */
  short: boolean;
}

export function gapAfter(prev: Entry, next: Entry, prep = PREP_DAYS): Gap | undefined {
  if (!prev.resultAt) return undefined;
  const paper = daysUntil(prev.resultAt, next.paperAt);
  const pre = next.preAt ? daysUntil(prev.resultAt, next.preAt) : undefined;
  return { pre: pre !== undefined && pre > 1 ? pre : undefined, paper, short: paper < prep };
}

const earliest = (list: Entry[]) => [...list].sort((a, b) => a.paperT.ms - b.paperT.ms || a.edition.id.localeCompare(b.edition.id))[0];

/**
 * The submission route for one paper:
 *   ① the earliest 首选 edition still open now (by time, not by rank), or the
 *     edition the paper is already submitted to while its result is pending;
 *   next: the earliest 首选 edition that `canFollow` the previous result
 *     (the same series may come back a year later: ICLR 2027 → ICLR 2028);
 *   at most `maxStops` stops, none past now + `horizonMonths`.
 * Between two stops more than 120 days apart (from result + prep to the next
 * deadline), the best-ranked 备选 whose deadline is after result + prep and
 * whose result comes before the next deadline is offered as 备选可插入.
 * 已错过 lists up to two 首选 editions whose deadline passed in the cycle still
 * under way (their result is still ahead), the closest miss first.
 */
export function planRoute(input: RouteInput): Route {
  const { prefs, editions, now } = input;
  const prep = input.prepDays ?? PREP_DAYS;
  const abstractFirst = input.abstractFirst ?? true;
  const maxStops = input.maxStops ?? 4;
  const horizon = addMonths(now, input.horizonMonths ?? 15);
  const ranked = editions.filter((e) => e.kind === 'conference' && rankOf(prefs, e.series));
  const entries = ranked.flatMap(entriesOf);
  const tierOf = (e: Entry) => rankOf(prefs, e.edition.series)!.tier;
  const firstTier = entries.filter((e) => tierOf(e) === 'first');
  const backupTier = entries.filter((e) => tierOf(e) === 'backup');

  const stops: RouteStop[] = [];
  const used = new Set<string>();
  const push = (entry: Entry, extra: Partial<RouteStop> = {}) => {
    stops.push({ entry, pref: rankOf(prefs, entry.edition.series), ...extra });
    used.add(entry.edition.id);
  };

  const cur = currentEntry(input);
  if (cur) push(cur, { current: true });
  if (!stops.length) {
    const first = earliest(firstTier.filter((e) => isOpen(e, now)));
    if (first && first.paperT.ms <= horizon) push(first);
  }

  while (stops.length && stops.length < maxStops) {
    const prev = stops[stops.length - 1]!.entry;
    const result = prev.resultAt;
    if (!result) break;
    const next = earliest(
      firstTier.filter(
        (e) => !used.has(e.edition.id) && isOpen(e, now) && e.paperT.ms > prev.paperT.ms && canFollow(e, result, prep, abstractFirst),
      ),
    );
    if (!next || next.paperT.ms > horizon) break;
    push(next, { preFirst: preFirst(next, result) });
  }

  const inserts: RouteInsert[] = [];
  for (let i = 0; i + 1 < stops.length; i++) {
    const result = stops[i]!.entry.resultAt!;
    const next = stops[i + 1]!.entry;
    if (daysUntil(result, next.paperAt) - prep <= INSERT_GAP_DAYS) continue;
    const fits = backupTier.filter(
      (e) =>
        !used.has(e.edition.id) &&
        isOpen(e, now) &&
        daysUntil(result, e.paperAt) >= prep &&
        !!e.resultAt &&
        daysUntil(e.resultAt, next.paperAt) >= 2,
    );
    const rank = (e: Entry) => rankOf(prefs, e.edition.series)!.rank;
    const best = [...fits].sort((a, b) => rank(a) - rank(b) || a.paperT.ms - b.paperT.ms)[0];
    if (best) inserts.push({ after: i, entry: best, pref: rankOf(prefs, best.edition.series)! });
  }

  return {
    stops,
    inserts,
    missed: missedOf(ranked.filter((ed) => rankOf(prefs, ed.series)!.tier === 'first'), now, input.current),
    estimated: stops.some((s) => s.entry.estimated) || inserts.some((x) => x.entry.estimated),
  };
}

/** The entry of the edition the paper is submitted to, while its result is still ahead: the round still open, else the last one. */
function currentEntry(input: { editions: AppEdition[]; now: number; current?: string }): Entry | undefined {
  const cur = input.current ? input.editions.find((e) => e.id === input.current) : undefined;
  if (!cur) return undefined;
  const es = entriesOf(cur);
  const entry = es.find((e) => e.paperT.ms > input.now) ?? es[es.length - 1];
  return entry && (!entry.resultT || entry.resultT.ms > input.now) ? entry : undefined;
}

/** 已错过: up to two of `eds` whose deadline passed in the cycle still under way (result still ahead), closest miss first. */
function missedOf(eds: AppEdition[], now: number, current?: string): Missed[] {
  const missed: Missed[] = [];
  for (const ed of eds) {
    if (ed.id === current) continue;
    const es = entriesOf(ed);
    if (!es.length || es.some((e) => isOpen(e, now))) continue;
    const resultT = es[es.length - 1]!.resultT;
    if (!resultT || resultT.ms <= now) continue;
    const passed = es
      .flatMap((e) => [e.pre, e.paper])
      .filter((m): m is AppMilestone => !!m && targetOf(at(m)!).ms <= now)
      .map((m) => ({ m, t: targetOf(at(m)!) }))
      .sort((a, b) => b.t.ms - a.t.ms)[0];
    if (passed) missed.push({ edition: ed, milestone: passed.m, target: passed.t });
  }
  return missed.sort((a, b) => b.target.ms - a.target.ms).slice(0, 2);
}

// ---------- 目标会议: each paper's own targets (§9.7) ----------

/** A paper names at most this many target venues. */
export const MAX_TARGETS = 3;

/** Stored targets: known series, each once, at most 3; undefined when there is no list at all (a paper saved before targets). */
export function cleanTargets(v: unknown, known: Set<string>): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const s of v) if (typeof s === 'string' && known.has(s) && !out.includes(s)) out.push(s);
  return out.slice(0, MAX_TARGETS);
}

/**
 * Targets for a paper saved before targets existed: the first 3 of the
 * interest list by rank (首选, then 备选). `pinned` goes first: the venue a
 * v0.1 paper was filed under.
 */
export function defaultTargets(interest: Prefs, pinned: string[] = []): string[] {
  return [...new Set([...pinned, ...prefSeries(interest)])].slice(0, MAX_TARGETS);
}

/**
 * The targets of a stored paper, in priority order (the order is saved, so
 * it is read as is). Papers saved before targets existed get theirs here:
 *   v0.2 papers: the first 3 of their own preferences if they had some,
 *     else of the interest list, by rank;
 *   v0.1 papers ({ edition }): the venue they were filed under is target 1.
 */
export function storedTargets(
  paper: { targets?: unknown; prefs?: unknown; edition?: unknown; [k: string]: unknown },
  interest: Prefs,
  editions: AppEdition[],
  known: Set<string>,
): string[] {
  const saved = cleanTargets(paper.targets, known);
  if (saved) return saved;
  const own = cleanPrefs(paper.prefs, known);
  const legacy = typeof paper.edition === 'string' ? editions.find((e) => e.id === paper.edition) : undefined;
  const pinned = legacy && known.has(legacy.series) ? [legacy.series] : [];
  return defaultTargets(own ?? interest, pinned);
}

/** Tap in the target picker: select or deselect. A 4th pick changes nothing and says so (`full`). */
export function toggleTarget(targets: string[], id: string, max = MAX_TARGETS): { targets: string[]; full: boolean } {
  if (targets.includes(id)) return { targets: targets.filter((x) => x !== id), full: false };
  if (targets.length >= max) return { targets, full: true };
  return { targets: [...targets, id], full: false };
}

/** When a new paper can first act on a series: its next open entry's first step (+∞ when none). */
export function openKey(s: Series | undefined, now: number): number {
  const e = s && nextOpenEntry(s, now);
  return e ? firstStep(e).t.ms : Number.POSITIVE_INFINITY;
}

const byOpenKey = (catalog: Map<string, Series>, now: number) => (a: string, b: string) => {
  const ka = openKey(catalog.get(a), now);
  const kb = openKey(catalog.get(b), now);
  return ka !== kb ? (ka < kb ? -1 : 1) : a.localeCompare(b);
};

/**
 * Priority of a paper's targets, 1 first:
 *   targets in the interest list, by their rank there (首选 before 备选);
 *   then the others, by next open deadline (earliest first).
 * Interest NeurIPS, ICLR, ICML | ACL, EMNLP and picks {ICML, AISTATS,
 * NeurIPS} give NeurIPS, ICML, AISTATS.
 *
 * `base` is the order already saved (修改 on a paper): those targets keep
 * their order, so priorities never move by themselves when a deadline
 * passes; each new pick goes in front of the first saved one the rule puts
 * after it. With no base (添加论文) this is the plain rule.
 */
export function targetPriority(targets: string[], interest: Prefs, catalog: Series[], now: number, base: string[] = []): string[] {
  const map = new Map(catalog.map((s) => [s.id, s]));
  const time = byOpenKey(map, now);
  const cmp = (a: string, b: string) => {
    const ra = rankOf(interest, a)?.rank;
    const rb = rankOf(interest, b)?.rank;
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return time(a, b);
  };
  const picked = [...new Set(targets)];
  const out = base.filter((id, i) => picked.includes(id) && base.indexOf(id) === i);
  for (const id of picked.filter((x) => !out.includes(x)).sort(cmp)) {
    const at = out.findIndex((y) => cmp(id, y) < 0);
    out.splice(at < 0 ? out.length : at, 0, id);
  }
  return out;
}

/** The target picker's sections, top to bottom. */
export interface TargetLists {
  /** 你感兴趣的会议: the interest list, 首选 then 备选, in rank order. */
  interest: string[];
  /** 其他会议（按截止时间）: the rest of the paper's directions, next open deadline first. */
  direction: string[];
  /** 其他方向的会议: everything else, by time too. */
  others: string[];
}

export function targetLists(interest: Prefs, dirs: Direction[], catalog: Series[], now: number): TargetLists {
  const map = new Map(catalog.map((s) => [s.id, s]));
  const time = byOpenKey(map, now);
  const mine = prefSeries(interest).filter((id) => map.has(id));
  const rest = catalog.filter((s) => !mine.includes(s.id));
  const fits = (s: Series) => s.directions.some((d) => dirs.includes(d));
  return {
    interest: mine,
    direction: rest.filter(fits).map((s) => s.id).sort(time),
    others: rest.filter((s) => !fits(s)).map((s) => s.id).sort(time),
  };
}

/**
 * The route of a paper from its targets only (`targets` in priority order;
 * the card tags each stop "目标 N"). The global 备选 play no part. The stops
 * follow the §9.5 rules (by time, one venue at a time, prep days from the
 * result day, 先注册摘要, 15 months, 4 stops), but when two targets clash the
 * higher priority stays. Of every feasible route (a handful: 3 targets, about
 * 2 editions each) it takes the one that reaches target 1 soonest (a route
 * without it counts as never), then target 2 soonest, then target 3; then
 * the one with more stops; then the earliest deadlines.
 *   {NeurIPS, ICML, ACL}: ICML 2027 → NeurIPS 2027, not ACL 2027 → NeurIPS 2027.
 *   {CVPR, NAACL, ICLR}: CVPR 2027 → ICLR 2028, not NAACL 2027 → CVPR 2028
 *   (that one keeps NAACL, but puts target 1 off by a year).
 */
export function targetRoute(input: Omit<RouteInput, 'prefs'> & { targets: string[] }): Route {
  const { targets, editions, now } = input;
  const prefs: Prefs = { first: targets, backup: [] };
  const prep = input.prepDays ?? PREP_DAYS;
  const abstractFirst = input.abstractFirst ?? true;
  const maxStops = input.maxStops ?? 4;
  const horizon = addMonths(now, input.horizonMonths ?? 15);
  const eds = editions.filter((e) => e.kind === 'conference' && targets.includes(e.series));
  const pool = eds.flatMap(entriesOf).filter((e) => isOpen(e, now) && e.paperT.ms <= horizon);
  const cur = currentEntry(input);

  // Smaller is better: when target 1, 2, 3 is first reached (+∞: not at all); more stops; earlier deadlines.
  const score = (path: Entry[]) => [
    ...targets.map((id) => path.find((e) => e.edition.series === id)?.paperT.ms ?? Number.POSITIVE_INFINITY),
    -path.length,
    ...path.map((e) => e.paperT.ms),
  ];
  const better = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] ?? Number.NEGATIVE_INFINITY;
      const y = b[i] ?? Number.NEGATIVE_INFINITY;
      if (x !== y) return x < y;
    }
    return false;
  };
  let best: Entry[] = cur ? [cur] : [];
  let bestScore = score(best);
  const visit = (path: Entry[]) => {
    const sc = score(path);
    if (better(sc, bestScore)) [best, bestScore] = [path, sc];
    if (path.length >= maxStops) return;
    const prev = path[path.length - 1];
    if (prev && !prev.resultAt) return;
    for (const e of pool) {
      if (path.some((p) => p.edition.id === e.edition.id)) continue;
      if (prev && !(e.paperT.ms > prev.paperT.ms && canFollow(e, prev.resultAt!, prep, abstractFirst))) continue;
      visit([...path, e]);
    }
  };
  visit(cur ? [cur] : []);

  const stops: RouteStop[] = best.map((entry, i) => {
    const prev = best[i - 1];
    const stop: RouteStop = { entry, pref: rankOf(prefs, entry.edition.series) };
    if (i === 0 && cur) stop.current = true;
    if (prev?.resultAt && preFirst(entry, prev.resultAt)) stop.preFirst = true;
    if (best.slice(0, i).some((p) => p.edition.series === entry.edition.series)) stop.repeat = true;
    return stop;
  });
  return { stops, inserts: [], missed: missedOf(eds, now, input.current), estimated: stops.some((s) => s.entry.estimated) };
}

/**
 * How an entry clashes with a route stop (one venue at a time):
 *   inside: its deadline falls while the stop is under review;
 *   short: the stop's result is out, but fewer than the prep days before it;
 *   covers: it would still be under review at the stop's deadline.
 */
export type Clash = 'inside' | 'short' | 'covers';

export function clashOf(e: Entry, stop: Entry, prep = PREP_DAYS, abstractFirst = true): Clash | undefined {
  if (e.edition.id === stop.edition.id) return undefined;
  if (e.paperT.ms > stop.paperT.ms) {
    if (stop.resultAt && canFollow(e, stop.resultAt, prep, abstractFirst)) return undefined;
    return stop.resultT && e.paperT.ms >= stop.resultT.ms ? 'short' : 'inside';
  }
  if (e.resultAt && stop.paperT.ms > e.paperT.ms && canFollow(stop, e.resultAt, prep, abstractFirst)) return undefined;
  return 'covers';
}

/** A target the route could not place, and why. */
export interface Unplaced {
  series: string;
  /**
   * none: no open deadline in the data; later: the next one is past the
   * route horizon; busy: it clashes with `during`, a stop kept for a higher
   * priority (or the paper's 在投 venue); full: the route already has its stops.
   */
  why: 'none' | 'later' | 'busy' | 'full';
  /** Its next open entry. */
  next?: Entry;
  during?: RouteStop;
  clash?: Clash;
}

export function unplacedTargets(
  route: Route,
  targets: string[],
  catalog: Series[],
  now: number,
  opts: { prepDays?: number; maxStops?: number; horizonMonths?: number } = {},
): Unplaced[] {
  const prep = opts.prepDays ?? PREP_DAYS;
  const horizon = addMonths(now, opts.horizonMonths ?? 15);
  const placed = new Set(route.stops.map((s) => s.entry.edition.series));
  // The stop that explains it best: the 在投 venue, else the best priority.
  const weight = (s: RouteStop) => (s.current ? 0 : (s.pref?.rank ?? 99));
  const out: Unplaced[] = [];
  for (const id of targets) {
    if (placed.has(id)) continue;
    const s = catalog.find((x) => x.id === id);
    const next = s && nextOpenEntry(s, now);
    if (!next) {
      out.push({ series: id, why: 'none' });
      continue;
    }
    if (next.paperT.ms > horizon) {
      out.push({ series: id, why: 'later', next });
      continue;
    }
    const during = route.stops
      .map((st) => ({ st, clash: clashOf(next, st.entry, prep) }))
      .filter((x) => x.clash)
      .sort((a, b) => weight(a.st) - weight(b.st) || a.st.entry.paperT.ms - b.st.entry.paperT.ms)[0];
    if (during) out.push({ series: id, why: 'busy', next, during: during.st, clash: during.clash });
    else out.push({ series: id, why: route.stops.length >= (opts.maxStops ?? 4) ? 'full' : 'busy', next });
  }
  return out;
}

// ---------- wording ----------

/**
 * The first deadline a new paper can still make, as the picker rows word it:
 * "摘要 9/30", "摘要 约 2027/1/24". A day in another year than now carries
 * its year, as on the route card, so the same deadline reads the same on
 * both.
 */
export function firstStepText(e: Entry, now: number): string {
  const { m } = firstStep(e);
  const at = (m.at_resolved ?? m.end_resolved)!;
  return `${stepName(m)} ${m.status === 'estimated' ? '约 ' : ''}${dayIn(at, yearCtx(now))}`;
}

const STEP_ZH: Record<string, string> = { abstract: '摘要', paper_registration: '论文注册', paper: '正文' };

/** "摘要", "论文注册", "正文". */
export const stepName = (m: AppMilestone) => STEP_ZH[m.type] ?? MILESTONE_ZH[m.type] ?? m.type;

/**
 * The year a route card is reading in. The card names a year the first time
 * a date leaves the current one ("约 2027/1/24"), and again whenever it
 * changes; dates in between stay short ("约 1/29").
 */
export interface YearCtx {
  year: string;
}

export const yearCtx = (now: number): YearCtx => ({ year: beijingDate(now).slice(0, 4) });

function dayIn(t: ResolvedTime, ctx?: YearCtx): string {
  const d = shownDate(t);
  if (!ctx) return md(d);
  const y = d.slice(0, 4);
  const out = y !== ctx.year ? `${y}/${md(d)}` : md(d);
  ctx.year = y;
  return out;
}

/**
 * A deadline or result as the route card shows it: "约 1/29" (the day only)
 * when estimated, else as everywhere else in the app ("9/26 周六 19:59",
 * or the official date "12/16" when the venue gave no time).
 */
export function routeDay(m: AppMilestone, ctx?: YearCtx): string {
  const t = m.at_resolved ?? m.end_resolved ?? m.start_resolved;
  if (!t || m.status === 'tba') return '待公布';
  if (m.status === 'estimated') return `约 ${dayIn(t, ctx)}`;
  if (!t.local.includes('T')) return dayIn(t, ctx);
  const day = dayIn(t, ctx);
  return fmtPoint(t).replace(/^\d{1,2}\/\d{1,2}/, day);
}

/**
 * The deadlines of a route stop, the first one first: "摘要 约 1/24 ·
 * 正文 约 1/29" (missing the abstract is what closes a venue), or
 * "正文截止 10/13 周二 19:59" when there is only the paper.
 */
export function stopParts(e: Entry, ctx?: YearCtx, now?: number): string[] {
  const round = e.round ? `第 ${e.round} 轮` : '';
  // "正文截止", or "摘要截止" at an abstract-only venue.
  const main = stepName(e.paper);
  // A step already behind (the abstract of a paper under review) is not repeated.
  if (!e.pre || (now !== undefined && e.preT!.ms <= now)) return [`${round}${main}截止 ${routeDay(e.paper, ctx)}`];
  return [`${round}${stepName(e.pre)} ${routeDay(e.pre, ctx)}`, `${main} ${routeDay(e.paper, ctx)}`];
}

/** What comes out at a stop's result: "出结果", or "出摘要结果" at an abstract-only venue. */
export const resultWord = (ed: Pick<AppEdition, 'submission_type'>) => (isAbstractOnly(ed) ? '出摘要结果' : '出结果');

export const stopLine = (e: Entry, ctx?: YearCtx) => stopParts(e, ctx).join(' · ');

/** "没中的话 5 天后交摘要，" / "7 天后交正文": the turnaround under a result, in pieces that never break inside. */
export function gapParts(g: Gap, next: Entry): string[] {
  const paper = `${g.paper} 天后交${stepName(next.paper)}`;
  if (g.pre === undefined || !next.pre) return [`没中的话 ${paper}`];
  const pre = next.pre.type === 'paper_registration' ? '注册论文' : `交${stepName(next.pre)}`;
  return [`没中的话 ${g.pre} 天后${pre}，`, paper];
}

export const gapText = (g: Gap, next: Entry) => gapParts(g, next).join('');

/**
 * Editions a paper can be waiting on now, for "正在投": something was
 * already submitted (a deadline passed) and the result is still ahead.
 */
export function inReview(editions: AppEdition[], now: number): Entry[] {
  const out: Entry[] = [];
  for (const ed of editions) {
    if (ed.kind !== 'conference') continue;
    const es = entriesOf(ed);
    const last = es[es.length - 1];
    if (!last || !last.resultT || last.resultT.ms <= now) continue;
    const first = es.find((e) => firstStep(e).t.ms <= now);
    if (first) out.push(first);
  }
  return out.sort((a, b) => a.resultT!.ms - b.resultT!.ms);
}
