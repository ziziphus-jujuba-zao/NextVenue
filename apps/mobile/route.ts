// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Submission preferences and the submission route (docs/MOBILE_SPEC.md §9):
// research directions, the venue series a user ranks as 首选 / 备选, which
// edition of a series the lists show, and the route itself: one venue at a
// time, the next one taken once the previous result is out. No DOM here.

import { MILESTONE_ZH, beijingDate, fmtPoint, md, nextBoundary, seriesName, shownDate, targetOf, type Target } from './logic.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

// ---------- directions ----------

export type Direction = 'ml' | 'cv' | 'nlp' | 'robotics' | 'dm';

/** The first-run choices (§9.1), in display order. */
export const DIRECTIONS: { id: Direction; name: string }[] = [
  { id: 'ml', name: '机器学习' },
  { id: 'cv', name: '计算机视觉' },
  { id: 'nlp', name: 'NLP' },
  { id: 'robotics', name: '机器人' },
  { id: 'dm', name: '数据挖掘' },
];

export const isDirection = (s: unknown): s is Direction => DIRECTIONS.some((d) => d.id === s);

export const directionName = (d: Direction) => DIRECTIONS.find((x) => x.id === d)!.name;

/** Common 首选 per direction, prefilled on first run. */
export const DEFAULT_FIRST: Record<Direction, string[]> = {
  ml: ['neurips', 'iclr', 'icml'],
  cv: ['cvpr', 'iccv', 'eccv'],
  nlp: ['acl', 'emnlp', 'naacl'],
  robotics: ['icra', 'iros', 'corl'],
  dm: ['kdd', 'www', 'sigir'],
};

/** An edition's data topics as picker directions; general-AI venues (AAAI, IJCAI) count as 机器学习. */
export function directionsOf(ed: AppEdition): Direction[] {
  const out = new Set<Direction>();
  for (const t of ed.topics ?? []) {
    if (t === 'ai') out.add('ml');
    else if (isDirection(t)) out.add(t);
  }
  return DIRECTIONS.map((d) => d.id).filter((d) => out.has(d));
}

/** Directions in display order, without duplicates or unknown values. */
export function cleanDirections(v: unknown): Direction[] {
  const set = new Set(Array.isArray(v) ? v.filter(isDirection) : []);
  return DIRECTIONS.map((d) => d.id).filter((d) => set.has(d));
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

/** Conference series (ARR cycles are review cycles, not venues one ranks). */
export function seriesCatalog(editions: AppEdition[]): Series[] {
  const map = new Map<string, AppEdition[]>();
  for (const e of editions) {
    if (e.kind !== 'conference') continue;
    const list = map.get(e.series) ?? [];
    list.push(e);
    map.set(e.series, list);
  }
  return [...map.entries()]
    .map(([id, eds]) => {
      const sorted = [...eds].sort((a, b) => a.year - b.year || firstMs(a) - firstMs(b));
      const dirs = new Set(sorted.flatMap(directionsOf));
      return {
        id,
        name: seriesName(sorted[sorted.length - 1]!),
        directions: DIRECTIONS.map((d) => d.id).filter((d) => dirs.has(d)),
        editions: sorted,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
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

/** Every entry of an edition, earliest first; an edition without a known paper deadline has none. */
export function entriesOf(ed: AppEdition): Entry[] {
  const papers = ed.milestones.filter((m) => m.type === 'paper' && at(m)).sort((a, b) => targetOf(at(a)!).ms - targetOf(at(b)!).ms);
  const pres = ed.milestones.filter((m) => (m.type === 'abstract' || m.type === 'paper_registration') && at(m));
  const res = ed.milestones.find((m) => m.type === 'notification' && m.status !== 'tba' && (m.at_resolved ?? m.end_resolved ?? m.start_resolved));
  const resAt = res ? (res.at_resolved ?? res.end_resolved ?? res.start_resolved)! : undefined;
  const resT = resAt ? targetOf(resAt) : undefined;
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
    const result = resT && resT.ms > paperT.ms ? res : undefined;
    return {
      edition: ed,
      paper,
      paperT,
      paperAt: at(paper)!,
      pre,
      preT: pre ? targetOf(at(pre)!) : undefined,
      preAt: pre ? at(pre) : undefined,
      result,
      resultT: result ? resT : undefined,
      resultAt: result ? resAt : undefined,
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
  return s.editions
    .flatMap(entriesOf)
    .filter((e) => isOpen(e, now))
    .sort((a, b) => firstStep(a).t.ms - firstStep(b).t.ms)[0];
}

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
 * The prefilled 首选: the usual venues of the first direction picked
 * (NeurIPS, ICLR, ICML for 机器学习). Venues of the other directions are
 * listed unranked, so adding NLP never pushes ACL, EMNLP, NAACL into 首选.
 */
export function defaultPrefs(dirs: Direction[], known: Set<string>): Prefs {
  return cleanPrefs({ first: dirs.length ? DEFAULT_FIRST[dirs[0]!] : [], backup: [] }, known)!;
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
  return defaultPrefs(dirs, known);
}

export function directionsOfSeries(ids: string[], catalog: Series[]): Direction[] {
  const set = new Set(ids.flatMap((id) => catalog.find((s) => s.id === id)?.directions ?? []));
  return DIRECTIONS.map((d) => d.id).filter((d) => set.has(d));
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

  const cur = input.current ? editions.find((e) => e.id === input.current) : undefined;
  if (cur) {
    const es = entriesOf(cur);
    // The round still ahead, else the last one (already submitted).
    const entry = es.find((e) => e.paperT.ms > now) ?? es[es.length - 1];
    if (entry && (!entry.resultT || entry.resultT.ms > now)) push(entry, { current: true });
  }
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

  const missed: Missed[] = [];
  for (const ed of ranked) {
    if (rankOf(prefs, ed.series)!.tier !== 'first' || ed.id === cur?.id) continue;
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
  missed.sort((a, b) => b.target.ms - a.target.ms);

  return {
    stops,
    inserts,
    missed: missed.slice(0, 2),
    estimated: stops.some((s) => s.entry.estimated) || inserts.some((x) => x.entry.estimated),
  };
}

// ---------- wording ----------

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
  // A step already behind (the abstract of a paper under review) is not repeated.
  if (!e.pre || (now !== undefined && e.preT!.ms <= now)) return [`${round}正文截止 ${routeDay(e.paper, ctx)}`];
  return [`${round}${stepName(e.pre)} ${routeDay(e.pre, ctx)}`, `正文 ${routeDay(e.paper, ctx)}`];
}

export const stopLine = (e: Entry, ctx?: YearCtx) => stopParts(e, ctx).join(' · ');

/** "没中的话 5 天后交摘要，" / "7 天后交正文": the turnaround under a result, in pieces that never break inside. */
export function gapParts(g: Gap, next: Entry): string[] {
  const paper = `${g.paper} 天后交正文`;
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
