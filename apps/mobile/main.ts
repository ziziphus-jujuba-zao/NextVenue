// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// NextVenue mobile app: hash router, screens, bottom sheets and local state.
// Data is inlined in the page (#nv-data); the app makes no network requests.

import * as B from './badges.ts';
import * as CH from './charts.ts';
import * as L from './logic.ts';
import * as P from './place.ts';
import * as R from './route.ts';
import * as S from './stats.ts';
import * as TL from './timeline.ts';
import * as T from './trip.ts';
import * as TX from './taxonomy.ts';
import {
  isTba,
  type AppAreaFile,
  type AppData,
  type AppEdition,
  type AppMilestone,
  type AppRankLabel,
  type AppRule,
  type AppStatsSeries,
  type AppTopics,
  type AppVisa,
  type Answer,
  type ResolvedTime,
} from './types.ts';
import { html, icon, raw, type Raw } from './ui.ts';

// ---------- data ----------

const DATA = JSON.parse(document.getElementById('nv-data')!.textContent!) as AppData;
/** Milestone times come slim (scripts/app-data.ts); put back what follows from them, once. */
const EDITIONS = L.prepareEditions(DATA.editions);
const ED = new Map(EDITIONS.map((e) => [e.id, e]));
const RULE = new Map(DATA.rules.map((r) => [r.id, r]));
const RULES_BY_ED = new Map<string, AppRule[]>();
for (const r of DATA.rules) {
  const list = RULES_BY_ED.get(r.edition) ?? [];
  list.push(r);
  RULES_BY_ED.set(r.edition, list);
}
const rulesOf = (id: string) => RULES_BY_ED.get(id) ?? [];
/** Full and Chinese names and former names of each series, for search ("中国控制会议", "hybrid systems") and rows. */
const NAMES = new Map((DATA.series ?? []).map((x) => [x.id, x]));
/**
 * Venue series one can rank (conferences; ARR cycles are reached through the
 * venues that take them), including those with no edition in the data yet:
 * every CCF-listed conference can be found and followed.
 */
const SERIES = R.seriesCatalog(
  EDITIONS,
  (DATA.series ?? []).flatMap((x) => (x.acronym && x.directions?.length ? [{ id: x.id, name: x.acronym, directions: x.directions }] : [])),
);
const SERIES_BY_ID = new Map(SERIES.map((s) => [s.id, s]));
const KNOWN = new Set(SERIES_BY_ID.keys());
/** Acronyms two venues share ("CCC"): their rows add a second name. */
const SAME_NAMES = TX.sameNames(SERIES);
const NO_PREFS: R.Prefs = { first: [], backup: [] };
/** 学科 → 方向 (data/taxonomy.yml): the direction picker and the venue groups. */
const TAX = TX.taxonomyOf(DATA.taxonomy);
/** How many venues each direction lists: a chip with none is dimmed and says 暂未收录. */
const DIR_COUNTS = TX.dirCounts(SERIES);
/** First run preselects 机器学习 (softly: the first other chip replaces it), so two taps (下一步, 开始) are enough to start. */
const DEFAULT_DIRS: R.Direction[] = ['cs/ml'];
const cleanDirs = (v: unknown) => R.cleanDirections(v, TAX.known.size ? TAX.known : undefined);
const searchable = (s: R.Series): TX.Searchable => {
  const n = NAMES.get(s.id);
  return { ...s, full_name: n?.full_name, name_zh: n?.name_zh, aliases: n?.aliases };
};
/** After acceptance: visa files by destination, the Chinese working-day calendar, school-rule examples. */
const VISA = DATA.visa;
/** Apple 地图 opens the Maps app only from an iPhone's (or iPad's) own browser; elsewhere the place sheet searches OpenStreetMap (§3.4.1). */
const APPLE_MAPS = typeof navigator !== 'undefined' && P.prefersAppleMaps(navigator.userAgent, (navigator.maxTouchPoints ?? 0) > 1);
const CAL = T.calendarOf(DATA.china?.holidays ?? []);
const ADMIN = DATA.china?.admin ?? [];
/**
 * Past data (§11.4): acceptance rows by series, official per-area files, top
 * topics. The build ships them as stats.js beside the page (loaded the first
 * time a page needs them, so the page itself stays small; it also works from
 * file://); older or test pages may still carry them inline.
 */
let STATS = new Map<string, AppStatsSeries>();
let AREAS: AppAreaFile[] = [];
let TOPICS: AppTopics[] = [];
let statsState: 'none' | 'loading' | 'ready' | 'failed' = 'none';
function takeStats(d: Pick<AppData, 'stats' | 'areas' | 'topics'>) {
  STATS = new Map((d.stats ?? []).map((s) => [s.series, s]));
  AREAS = d.areas ?? [];
  TOPICS = d.topics ?? [];
  statsState = 'ready';
}
if (DATA.stats) takeStats(DATA);

/** Load stats.js once; the page that asked is drawn again when it arrives. */
function needStats(): boolean {
  if (statsState === 'ready') return true;
  if (statsState === 'none') {
    statsState = 'loading';
    const el = document.createElement('script');
    el.src = 'stats.js';
    el.onload = () => {
      const d = (window as unknown as { NV_STATS?: AppData }).NV_STATS;
      if (d) takeStats(d);
      else statsState = 'failed';
      statsArrived();
    };
    el.onerror = () => {
      statsState = 'failed';
      statsArrived();
    };
    document.head.append(el);
  }
  return false;
}

// ---------- test hooks: ?now= ?theme= ?reset=1 ?demo=1 ?prefs=a,b|c ?topics=ml ?follow=all ----------

const params = new URLSearchParams(location.search);
const FIXED_NOW = L.parseNow(params.get('now'));
const now = () => FIXED_NOW ?? Date.now();
const themeParam = params.get('theme');
if (themeParam === 'dark' || themeParam === 'light') document.documentElement.dataset.theme = themeParam;

// ---------- storage (localStorage only; falls back to memory) ----------

const memory = new Map<string, string>();
function readKey(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return memory.get(k) ?? null;
  }
}
function writeKey(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    memory.set(k, v);
  }
}

/** Ranked venue series (首选 / 备选); the followed venues are exactly these. */
const K_PREFS = 'nv.prefs';
/** Research directions picked on first run. */
const K_DIRS = 'nv.topics';
/** v0.1: followed edition ids. Read once to build nv.prefs, then left alone. */
const K_FOLLOWS = 'nv.follows';
const K_PAPERS = 'nv.papers';
/** 出行设置 (§10.7): passport, school approval, fee identity, reimbursement days, visa status. */
const K_TRIP = 'nv.trip';
/** 会议 tab: 列表 or 时间线, as last chosen (§3.3). */
const K_VENUES_SEG = 'nv.venuesSeg';
/** Lane colour slot per followed series (§11.2): kept when the list is reordered. */
const K_COLORS = 'nv.colors';

/**
 * A paper. After acceptance it also keeps its trip (T.TripPaper): which
 * edition accepted it, who presents, the site, D and R when changed, the
 * steps ticked off (kept when it goes back to 审稿中), what was exported.
 */
interface Paper extends T.TripPaper {
  dirs: R.Direction[];
  /** 目标会议: up to 3 series, in priority order (1 first). The order is fixed when saved (R.targetPriority); the route uses only these. */
  targets: string[];
  /** Edition the paper is submitted to (正在投). v0.1 papers named one edition; it lands here. */
  current?: string;
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

/** The stored trip fields of a paper, each checked. */
function tripFields(o: Record<string, unknown>, known: (x: unknown) => string | undefined): Omit<T.TripPaper, 'id' | 'name' | 'current'> {
  const acc = o.accepted && typeof o.accepted === 'object' ? (o.accepted as Record<string, unknown>) : undefined;
  const edition = acc && known(acc.edition);
  const cal: Record<string, string> = {};
  if (o.cal && typeof o.cal === 'object') for (const [k, v] of Object.entries(o.cal as Record<string, unknown>)) if (typeof v === 'string') cal[k] = v;
  return {
    accepted: edition ? { edition, at: isDay(acc!.at) ? acc!.at : '' } : undefined,
    presenter: o.presenter === 'coauthor' ? 'coauthor' : undefined,
    site: str(o.site),
    assigned: str(o.assigned),
    depart: isDay(o.depart) ? o.depart : undefined,
    back: isDay(o.back) ? o.back : undefined,
    done: Array.isArray(o.done) ? [...new Set(o.done.filter((x): x is string => typeof x === 'string'))] : undefined,
    skip: Array.isArray(o.skip) ? [...new Set(o.skip.filter((x): x is string => typeof x === 'string'))] : undefined,
    snooze: typeof o.snooze === 'number' && Number.isFinite(o.snooze) ? o.snooze : undefined,
    cal: Object.keys(cal).length ? cal : undefined,
  };
}

function readJson(k: string): unknown {
  const s = readKey(k);
  if (s === null) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

function getPrefs(): R.Prefs | null {
  return R.cleanPrefs(readJson(K_PREFS), KNOWN);
}
const setPrefs = (p: R.Prefs) => writeKey(K_PREFS, JSON.stringify(p));

/** Stored directions; v0.3 ids ("ml") read as taxonomy ids ("cs/ml"). */
function getDirs(): R.Direction[] | null {
  const d = cleanDirs(readJson(K_DIRS));
  return d.length ? d : null;
}
const setDirs = (d: R.Direction[]) => writeKey(K_DIRS, JSON.stringify(d));

function paperOf(v: unknown): Paper | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return null;
  const known = (x: unknown) => (typeof x === 'string' && ED.has(x) ? x : undefined);
  // v0.1 papers are { id, name, edition }: the venue they were filed under becomes
  // 正在投 only once something was submitted there (CVPR 2027 before its 11/11
  // registration is a plan, not a submission; the route puts it first anyway).
  const legacy = known(o.edition);
  const current = known(o.current) ?? (legacy && R.started(ED.get(legacy)!, now()) ? legacy : undefined);
  let dirs = cleanDirs(o.dirs);
  if (!dirs.length && legacy) dirs = R.directionsOf(ED.get(legacy)!);
  if (!dirs.length && current) dirs = R.directionsOf(ED.get(current)!);
  if (!dirs.length) dirs = getDirs() ?? DEFAULT_DIRS;
  // Papers saved before targets existed get the first 3 of their venue list by rank (the
  // interest list, or the paper's own v0.2 list); a v0.1 paper's own venue is target 1.
  // Rewritten once at start-up, so that order is then saved like any other.
  const targets = R.storedTargets(o, getPrefs() ?? NO_PREFS, EDITIONS, KNOWN);
  return { id: o.id, name: o.name, dirs, targets, current, ...tripFields(o, known) };
}

function getPapers(): Paper[] {
  const v = readJson(K_PAPERS);
  return Array.isArray(v) ? v.map(paperOf).filter((p): p is Paper => !!p) : [];
}
const setPapers = (p: Paper[]) => writeKey(K_PAPERS, JSON.stringify(p));
const getTrip = () => T.cleanTrip(readJson(K_TRIP));

/** Colour slot (1–8, 0 grey) per followed series; new venues get the lowest free slot, saved so reordering never recolours. */
function laneColorMap(): Record<string, number> {
  const v = readJson(K_COLORS);
  const stored: Record<string, number> = {};
  if (v && typeof v === 'object') for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === 'number') stored[k] = n;
  const map = TL.laneColors(stored, R.prefSeries(getPrefs() ?? NO_PREFS));
  const same = Object.keys(map).length === Object.keys(stored).length && Object.entries(map).every(([k, n]) => stored[k] === n);
  if (!same) writeKey(K_COLORS, JSON.stringify(map));
  return map;
}
const setTrip = (t: T.TripSettings) => writeKey(K_TRIP, JSON.stringify(t));
const updatePaper = (id: string, f: (p: Paper) => Paper) => setPapers(getPapers().map((p) => (p.id === id ? f(p) : p)));

function followsToPrefs(ids: string[]) {
  const m = R.migrateFollows(ids, EDITIONS, now());
  setPrefs(m.prefs);
  setDirs(m.directions.length ? m.directions : DEFAULT_DIRS);
}

if (params.get('reset') === '1') {
  try {
    localStorage.clear();
  } catch {
    /* storage blocked */
  }
  memory.clear();
}
// v0.1 → v0.2, once: followed editions become ranked 首选 series (nothing is
// lost; the user can reorder later), papers are rewritten in the new shape.
if (readKey(K_PREFS) === null) {
  const legacy = readJson(K_FOLLOWS);
  if (Array.isArray(legacy)) followsToPrefs(legacy.filter((x): x is string => typeof x === 'string'));
}
if (readKey(K_PAPERS) !== null) setPapers(getPapers());

const followParam = params.get('follow');
if (followParam === 'all' || params.get('demo') === '1') followsToPrefs(EDITIONS.map((e) => e.id));
else if (followParam) followsToPrefs(followParam.split(',').filter((id) => ED.has(id)));
const topicsParam = params.get('topics');
if (topicsParam) {
  const d = cleanDirs(topicsParam.split(','));
  if (d.length) setDirs(d);
}
const prefsParam = params.get('prefs');
if (prefsParam !== null) {
  const p = R.parsePrefsParam(prefsParam, KNOWN);
  setPrefs(p);
  if (!topicsParam) setDirs(R.directionsOfSeries(R.prefSeries(p), SERIES).length ? R.directionsOfSeries(R.prefSeries(p), SERIES) : DEFAULT_DIRS);
}
if (params.get('demo') === '1' && getPapers().length === 0) {
  const targets = R.defaultTargets(getPrefs() ?? NO_PREFS);
  setPapers([
    { id: 'demo', name: '论文 A', dirs: getDirs() ?? DEFAULT_DIRS, targets },
    { id: 'demo-b', name: '论文 B', dirs: DEFAULT_DIRS, targets, current: ED.has('iclr-2027') ? 'iclr-2027' : undefined },
  ]);
}

// ---------- shared bits ----------

type Tab = 'today' | 'venues' | 'me';

const nextOf = (ed: AppEdition) => L.upcoming([ed], now())[0];

interface Followed {
  series: R.Series;
  /** The one edition the lists show (ICLR 2027 now, ICLR 2028 once 2027 is over); none when the data holds no edition of it. */
  edition?: AppEdition;
  pref: { tier: R.Tier; rank: number };
}

/** Followed venues = the 首选 and 备选 series, in rank order. */
function followedVenues(): Followed[] {
  const p = getPrefs() ?? NO_PREFS;
  return R.prefSeries(p).flatMap((id) => {
    const series = SERIES_BY_ID.get(id);
    if (!series) return [];
    const edition = R.nearestEdition(series, now()) ?? series.editions.at(-1);
    return [{ series, edition, pref: R.rankOf(p, id)! }];
  });
}

const followed = () => followedVenues().flatMap((v) => (v.edition ? [v.edition] : []));

/**
 * An edition's name split so the year never shrinks away: ["NeurIPS", "2027"],
 * ["VTC", "2027-Fall"], ["WWW", "2027"] for "The Web Conference 2027 (WWW 2027)".
 */
function nameYear(ed: AppEdition): [string, string] {
  const short = L.editionShort(ed);
  const m = /^(.*?)[\s-]?(\d{4}(?:[\s-][A-Za-z]+)*)$/.exec(short);
  return m && m[1] ? [m[1], m[2]!] : [L.seriesName(ed), String(ed.year)];
}

/** Where a series row leads: its edition's page, or the series page when the data holds no edition. */
function seriesHref(s: R.Series): string {
  const ed = rowEdition(s);
  return ed ? `#/venue/${ed.id}` : `#/series/${s.id}`;
}

/** The interest list (投稿偏好: 首选 then 备选) that orders targets and the picker. */
const interest = () => getPrefs() ?? NO_PREFS;

/** A paper's route: its targets only, in their saved priority order; the global 备选 play no part. */
function paperRoute(p: Paper): R.Route {
  return R.targetRoute({ targets: p.targets, editions: EDITIONS, now: now(), current: p.current });
}

/** Editions a paper of the user is submitted to (正在投). */
const submittedTo = () => new Set(getPapers().flatMap((p) => (p.current ? [p.current] : [])));

/**
 * An edition that takes no new papers and holds none of the user's (ICLR
 * 2027 once its abstract closed): its paper deadline only concerns papers
 * whose abstract is registered, and its review stages do not concern the user.
 */
const notMine = (ed: AppEdition, mine: Set<string>, t: number) => !mine.has(ed.id) && R.closedToNew(ed, t);

/**
 * A review step of a round that no longer takes papers, in an edition that
 * still does and holds none of the user's (KDD 2027's 第一轮 rebuttal while
 * the 2 月轮 is open): it only concerns papers already in that round.
 */
function closedRound(ed: AppEdition, m: AppMilestone, mine: Set<string>, t: number): boolean {
  const r = TL.roundOf(m);
  if (!r || mine.has(ed.id)) return false;
  const e = R.entriesOf(ed).find((x) => x.round === r);
  return !!e && !R.isOpen(e, t) && R.firstStep(e).t.ms <= t && m.type !== 'conference';
}

interface Items {
  items: L.Upcoming[];
  /** A multi-site milestone shown once for all its sites (NeurIPS 会议举办 · 悉尼等 3 地): how many sites. */
  sites: Map<L.Upcoming, number>;
  /** Paper deadlines only open to registered abstracts. */
  onlyRegistered: Set<L.Upcoming>;
  /** Editions whose review stages were left out, with how many. */
  folded: { edition: AppEdition; n: number }[];
  tbas: { edition: AppEdition; milestone: AppMilestone }[];
}

/** What 下一步 and 全部 list for the followed editions. */
function followedItems(eds: AppEdition[], t: number): Items {
  const mine = submittedTo();
  const items: L.Upcoming[] = [];
  const onlyRegistered = new Set<L.Upcoming>();
  const hidden = new Map<AppEdition, number>();
  for (const i of L.upcoming(eds, t)) {
    // An abstract-only meeting's early registration concerns someone who can still send an abstract, or has one there
    // (RSNA 2026 on 9/25: abstracts closed in spring, so its 优惠注册 is not a step for this user).
    if (i.milestone.type === 'early_registration' && !mine.has(i.edition.id) && !R.entriesOf(i.edition).some((e) => R.isOpen(e, t))) continue;
    if ((!notMine(i.edition, mine, t) && !closedRound(i.edition, i.milestone, mine, t)) || i.milestone.type === 'conference') items.push(i);
    else if (i.milestone.type === 'paper') {
      items.push(i);
      onlyRegistered.add(i);
    } else hidden.set(i.edition, (hidden.get(i.edition) ?? 0) + 1);
  }
  const tbas = L.tbaMilestones(eds).filter((x) => !notMine(x.edition, mine, t));
  const one = oneSite(items);
  return { items: one.items, sites: one.sites, onlyRegistered, folded: [...hidden].map(([edition, n]) => ({ edition, n })), tbas };
}

/**
 * One row per multi-site milestone: the user goes to one place. With an
 * accepted paper there, only its site (assigned, else asked for); otherwise
 * the earliest site, counting the others ("悉尼等 3 地").
 */
function oneSite(items: L.Upcoming[]): { items: L.Upcoming[]; sites: Map<L.Upcoming, number> } {
  const going = new Map(getPapers().flatMap((p) => (p.accepted && (p.assigned ?? p.site) ? [[p.accepted.edition, p.assigned ?? p.site!] as const] : [])));
  const first = new Map<string, L.Upcoming>();
  const sites = new Map<L.Upcoming, number>();
  const out: L.Upcoming[] = [];
  for (const i of items) {
    const site = i.milestone.site;
    if (!site) {
      out.push(i);
      continue;
    }
    const mine = going.get(i.edition.id);
    if (mine) {
      if (site === mine) out.push(i);
      continue;
    }
    const key = `${i.edition.id}/${i.milestone.type}`;
    const f = first.get(key);
    if (f) sites.set(f, (sites.get(f) ?? 1) + 1);
    else {
      first.set(key, i);
      out.push(i);
    }
  }
  return { items: out, sites };
}

/** "仅限已注册摘要": the paper deadline of an edition whose abstract (or registration) closed. */
function registeredOnly(ed: AppEdition): string {
  const pre = R.entriesOf(ed).find((e) => e.pre)?.pre;
  return pre?.type === 'paper_registration' ? '仅限已注册的论文' : '仅限已注册摘要';
}

/** "ICLR 2027" for an edition id that may not be in the data (derived_from: "neurips-2026"). */
function editionLabel(id: string): string {
  const ed = ED.get(id);
  if (ed) return L.editionShort(ed);
  const m = /^([a-z0-9]+)-(\d{2}|\d{4})$/.exec(id);
  const name = m && SERIES_BY_ID.get(m[1]!)?.name;
  if (!m || !name) return L.prettyEditionId(id);
  return m[2]!.length === 2 ? `${name}-${m[2]}` : `${name} ${m[2]}`;
}

const chev = icon.chev;
/** "投稿截止（经 ARR）" with the aside kept whole when the line wraps. */
function nowrapAside(t: string): Raw {
  const i = t.indexOf('（');
  return i > 0 ? html`${t.slice(0, i)}<span class="nw">${t.slice(i)}</span>` : html`${t}`;
}
/** A milestone's page; the second of a type (KDD's 2 月轮 and 第一轮 rebuttal) gets its own key. */
const mHref = (ed: AppEdition, m: AppMilestone) => `#/m/${ed.id}/${L.milestoneKey(ed, m)}`;
/** " · 悉尼" after a milestone that is for one site of a multi-site edition (NeurIPS 2026 会议举办 × 3). */
const siteSuffix = (ed: AppEdition, m: AppMilestone, sites = 1) => {
  const city = P.milestoneSite(ed, m);
  return city ? html`<span class="sfx"> · ${city}${sites > 1 ? `等 ${sites} 地` : ''}</span>` : '';
};
const tag = (t: string, cls = '') => html`<span class="tag ${cls}">${t}</span>`;
const ansWord = (a: Answer) => html`<span class="ans a-${a}">${L.ANSWER_WORD[a]}</span>`;
const statusTag = (m: AppMilestone) =>
  m.status === 'estimated' ? tag('预计') : m.upstream ? tag(L.UPSTREAM_TAG) : m.tentative ? tag(TENTATIVE_TAG) : '';
/** A date the venue itself marks tentative: its own date, which may still move. */
const TENTATIVE_TAG = '官网暂定';
/** How an estimate was made: from an earlier edition's page, or from this edition's own loose wording ("mid March"). */
const estBasis = (ed: AppEdition, m: AppMilestone) =>
  ed.derived_from ? `按 ${editionLabel(ed.derived_from)} 推算` : m.from_prev ? '按往年推算' : '按官网的说法推算';

const ANSWER_ORDER: Answer[] = ['not_allowed', 'required', 'contradictory', 'conditional', 'allowed', 'not_required', 'unspecified'];
const byAnswer = (a: AppRule, b: AppRule) => ANSWER_ORDER.indexOf(a.answer) - ANSWER_ORDER.indexOf(b.answer);

function phaseSuffix(phase: L.Phase, parts: L.CountPart[]): string {
  if (phase === 'due') return '';
  const word = parts.length === 1 && !parts[0]!.n;
  if (phase === 'starts') return word ? '开始' : '后开始';
  return word ? '结束' : '后结束';
}

function countHtml(parts: L.CountPart[], suffix = ''): Raw {
  const last = parts.length - 1;
  return html`${parts.map((p, i) =>
    p.n ? html`<b>${p.n}</b><i class="${suffix && i === last ? 'tight' : ''}">${p.u}</i>` : html`<b class="w">${p.u}</b>`,
  )}${suffix ? html`<i class="sfx">${suffix}</i>` : ''}`;
}

/** Time text plus what kind of time it is: Beijing time, the official date, or an estimate ("约 5/5", 按往年推算). */
function whenOf(m: AppMilestone): { text: string; label: string } {
  const text = L.fmtMilestoneTime(m, now());
  if (m.status === 'tba') return { text, label: '' };
  if (m.status === 'estimated') return { text, label: m.from_prev ? '按往年推算' : '推算' };
  // A day the venue gave without a zone is counted in Beijing time: not "the official date".
  if (m.tz_assumed) return { text, label: '没写时区' };
  const timed = [m.at_resolved, m.start_resolved, m.end_resolved].some((t) => t && L.hasTime(t.local));
  return { text, label: timed ? '北京时间' : '官方日期' };
}

function verificationLine(r: AppRule): string {
  const d = L.md(r.last_checked);
  switch (r.verification) {
    case 'human':
      return `人工核对 · ${d}`;
    case 'correspondence':
      return `PC 书面答复 · 核对 ${d}`;
    case 'upstream':
      return `上游数据 · 核对 ${d}`;
    case 'inherited':
      return `沿用 ${r.inherited_from ? L.prettyEditionId(r.inherited_from) : '上一届'} · 核对 ${d}`;
    default:
      return `机器抽取，待人工核对 · ${d}`;
  }
}

// ---------- rows ----------

function upRow(item: L.Upcoming, onlyRegistered = false, sites = 1): Raw {
  const { edition: ed, milestone: m } = item;
  const t = now();
  const csq = L.milestoneTag(rulesOf(ed.id), m);
  const rel = L.upcomingRelative(item, t);
  // Only deadlines the author acts on get the blue emphasis; announcements stay grey
  // and say so, and a bare date that only repeats "今天" is dropped. A deadline only
  // open to registered abstracts stays grey and says so.
  const urgent = !onlyRegistered && L.isUrgent(item, t);
  const quiet = L.isAnnouncement(m);
  const sameDay = !item.target.precise && (rel === '今天' || rel === '明天');
  const time = quiet && sameDay ? '' : html`<span>${L.fmtMilestoneTime(m, t)}</span>`;
  const note = onlyRegistered
    ? html`<span class="csq a-conditional">${registeredOnly(ed)}</span>`
    : csq
      ? html`<span class="csq ${csq === L.DISPUTED_TAG ? 'a-contradictory' : 'a-not_allowed'}">${csq}</span>`
      : quiet
        ? html`<span class="csq quiet">${time ? '· ' : ''}无需操作</span>`
        : '';
  return html`<a class="row two" href="${mHref(ed, m)}">
    <div class="main"><div class="t"><span class="v">${L.venueShort(ed)}</span>${L.milestoneShort(m)}${siteSuffix(ed, m, sites)}</div>
    <div class="s">${time}${statusTag(m)}${note}</div></div>
    <span class="rel${urgent ? ' soon' : ''}">${rel}</span>${chev}</a>`;
}

function tbaRow(ed: AppEdition, m: AppMilestone): Raw {
  return html`<a class="row two" href="${mHref(ed, m)}">
    <div class="main"><div class="t"><span class="v">${L.venueShort(ed)}</span>${L.milestoneShort(m)}</div>
    <div class="s">${tag('待公布')}</div></div>${chev}</a>`;
}

/** A rule row: label (+ 沿用 at the end of the line), grey time line when known, answer word on the right. */
function ruleRow(r: AppRule, ed: AppEdition, withTime: boolean, hideInherited = false, forEd?: string): Raw {
  const label = r.short_zh ?? r.question_zh;
  let time = withTime ? L.ruleTimeShort(r, ed, now()) : undefined;
  // "注册截止后增删作者" already says when; don't repeat "论文注册截止后" under it.
  if (time && label.includes(time.replace(/^论文/, ''))) time = undefined;
  const inh = !hideInherited && r.verification === 'inherited';
  return html`<a class="row${time ? ' two' : ''}" href="#/rule/${r.id}${forEd ? `/for/${forEd}` : ''}">
    <div class="main"><div class="t wrap">${label}${inh ? tag('沿用') : ''}</div>${
      time ? html`<div class="s"><span>${time}</span></div>` : ''
    }</div>${ansWord(r.answer)}${chev}</a>`;
}

// ---------- rank badges (§12.2) ----------

/** The edition a series row stands for: the one a new paper can still enter, else the nearest, else the last; none without editions. */
function rowEdition(s: R.Series): AppEdition | undefined {
  const t = now();
  return R.nextOpenEntry(s, t)?.edition ?? R.nearestEdition(s, t) ?? s.editions.at(-1);
}

/** What a badge row needs of a venue: its labels and directions, and the id its rank sheet opens under (an edition, or a series without one). */
interface Ranked {
  id: string;
  labels?: AppRankLabel[];
  directions?: string[];
}
const rankedEdition = (ed: AppEdition): Ranked => ({ id: ed.id, labels: ed.labels, directions: ed.directions });
function rankedSeries(s: R.Series): Ranked {
  const ed = rowEdition(s);
  return ed ? rankedEdition(ed) : { id: s.id, labels: NAMES.get(s.id)?.labels, directions: s.directions };
}

/**
 * At most two rank badges after a venue name ("CCF B", "CAA A"), the list
 * that matters most for the venue's (or the user's) direction first. In a
 * row they are plain words (the whole row selects or opens; a qualified
 * label shortens to "CCF B*"); in a page header (`hd`) they are buttons of
 * their own that open the lists they come from (#/rank/<id>/<list>). None
 * without a label.
 */
function badges(v: Ranked, context: readonly string[] = [], max = B.MAX_BADGES, cls = ''): Raw | '' {
  const ls = B.pickBadges(v.labels, v.directions, context, max);
  if (!ls.length) return '';
  if (cls === 'hd')
    return html`<span class="rbs hd">${ls.map(
      (l) => html`<button class="rb" data-act="rank" data-id="${v.id}" data-list="${l.list}" aria-label="${l.text}，点开看是哪份目录">${B.badgeText(l)}</button>`,
    )}</span>`;
  return html`<span class="rbs${cls ? ` ${cls}` : ''}">${ls.map((l) => {
    const short = B.badgeShort(l);
    return short === l.text ? html`<span class="rb">${short}</span>` : html`<span class="rb"><span aria-hidden="true">${short}</span><span class="vh">${l.text}</span></span>`;
  })}</span>`;
}

/** 0 for an A (or 科协-listed) venue, 1 B, 2 C, 3 none: the picker's second key after "checked against its own pages". */
function tierOf(s: R.Series): number {
  const ls = (rankedSeries(s).labels ?? []).filter((l) => !l.upstream && B.BADGE_LISTS.includes(l.list));
  const one = (l: AppRankLabel) => (l.list === 'cast2025' ? 0 : ({ A: 0, B: 1, C: 2 } as Record<string, number>)[l.tier] ?? 3);
  return ls.length ? Math.min(...ls.map(one)) : 3;
}

/** "中国控制会议" or a short full name after an acronym two venues share, or any Chinese name; also in search results. */
function asideText(s: R.Series, force = false): string | undefined {
  const n = NAMES.get(s.id);
  return TX.secondName({ name: s.name, full_name: n?.full_name, name_zh: n?.name_zh }, force || SAME_NAMES.has(TX.norm(s.name)));
}
function nameAside(s: R.Series, force = false): Raw | '' {
  const x = asideText(s, force);
  return x ? html`<span class="nm2">${x}</span>` : '';
}

/** A row's name line after the acronym (and year): the second name when it needs one, then the badges (one when a second name shares the line). */
function nameTail(s: R.Series, v: Ranked, context: readonly string[], force = false): Raw {
  // A long name ("IFAC World Congress") already says what it is; a second name would only squeeze it.
  const aside = s.name.length <= 12 || force ? nameAside(s, force) : '';
  return html`${aside}${badges(v, context, aside ? 1 : B.MAX_BADGES)}`;
}

// ---------- preferences: directions and ranked venues ----------

/**
 * 学科 → 方向 (§9.1): one row per 学科 (计算机, 工程, 物理与天文…) with how
 * many of its directions are chosen; a tap opens its direction chips under
 * it (several can be open); chips toggle across 学科. 工程 also lists the
 * computing directions it shares (机器人, 语音与信号): the same choice.
 */
function dirPicker(ctx: string, dirs: R.Direction[], open: readonly string[], big = false): Raw {
  // Each chip says how many venues it lists; a direction with none yet is dimmed and says so (it can still be chosen).
  const chip = (d: TX.Dir) => {
    const on = dirs.includes(d.id);
    const n = DIR_COUNTS.get(d.id) ?? 0;
    return html`<button class="chip${on ? ' on' : ''}${n ? '' : ' empty'}" data-act="dir" data-ctx="${ctx}" data-id="${d.id}" aria-pressed="${on}" aria-label="${d.short}，${
      n ? `${n} 个会议` : '暂未收录会议'
    }">${icon.check}<span>${d.short}</span><span class="chip-n">${n || '暂未收录'}</span></button>`;
  };
  return html`<div class="discs${big ? ' lg' : ''}" role="group" aria-label="学科和方向">${TAX.disciplines.map((d) => {
    const isOpen = open.includes(d.id);
    const n = TX.chosenIn(d, dirs);
    return html`<div class="disc${isOpen ? ' open' : ''}">
      <button class="disc-h" data-act="disc" data-ctx="${ctx}" data-id="${d.id}" aria-expanded="${isOpen}"><span class="disc-n">${d.name}</span>${
        n ? html`<span class="disc-c">已选 ${n}</span>` : html`<span class="disc-c dim">${d.directions.length} 个方向</span>`
      }${icon.down}</button>
      ${
        isOpen
          ? html`<div class="chips disc-chips">${d.directions.map(chip)}${
              d.seeAlso.length ? html`<span class="also-k">也看</span>${d.seeAlso.map(chip)}` : ''
            }</div>`
          : ''
      }</div>`;
  })}</div>`;
}

/** "机器学习、控制" (at most 3, then "等 N 个"). */
function dirsText(dirs: R.Direction[]): string {
  const names = dirs.map((d) => TX.dirShort(TAX, d));
  return names.length > 3 ? `${names.slice(0, 3).join('、')} 等 ${names.length} 个` : names.join('、');
}

/** "正在选：首选 | 备选". */
function tierSeg(ctx: string, tier: R.Tier): Raw {
  const b = (t: R.Tier, label: string) =>
    html`<button role="tab" data-act="tier" data-ctx="${ctx}" data-id="${t}" class="${tier === t ? 'on' : ''}" aria-selected="${tier === t}">${label}</button>`;
  return html`<div class="seg-row"><span class="seg-k">正在选</span><div class="seg" role="tablist">${b('first', '首选')}${b('backup', '备选')}</div></div>`;
}

/**
 * Unranked series passing `keep`, the best-known first: checked against their
 * own pages, then A before B before C, then the next deadline (a stable
 * order: rows never jump). R.pickerOrder.
 */
function pickerSeries(p: R.Prefs, keep: (s: R.Series) => boolean): R.Series[] {
  return R.pickerOrder(
    SERIES.filter((s) => !R.rankOf(p, s.id) && keep(s)),
    now(),
    tierOf,
  );
}

/**
 * "摘要 约 1/24 预计": the first deadline a new paper can still make, worded
 * like the route stops. ICLR shows ICLR 2028 ("约 2027/9/19"), since ICLR
 * 2027's abstract closed.
 */
function nextDeadlineLine(s: R.Series): Raw {
  const t = now();
  const nx = R.nextOpenEntry(s, t);
  if (!nx) return html`<span>${closedLine(s)}</span>`;
  const m = R.firstStep(nx).m;
  return html`<span>${R.firstStepText(nx, t)}</span>${m.status === 'estimated' ? tag('预计') : m.upstream ? tag(L.UPSTREAM_TAG) : ''}`;
}

/**
 * Why a series has no deadline a new paper can make, in its own words: the
 * deadline is not published yet ("摘要截止 待公布": ASCO 2027), every one in
 * the data has passed ("2026 已截止 · 下一届未收录"), or the data holds no
 * edition at all ("日期暂未收录": most CCF C venues).
 */
function closedLine(s: R.Series): string {
  const t = now();
  const st = R.seriesState(s, t);
  if (st === 'none') return '日期暂未收录';
  if (st === 'tba') {
    const m = s.editions.map((ed) => R.tbaEntry(ed, t)).find(Boolean)!;
    return `${R.stepName(m)}截止 待公布`;
  }
  const last = s.editions.at(-1)!;
  return `${last.year} 已截止 · 下一届未收录`;
}

/**
 * A target venue row (picker and paper detail): priority badge (1–3, or an
 * empty ring), "ICLR 2028" (the edition a new paper can still enter), rank
 * badges, its first open deadline, and how far off that is.
 */
function targetInner(s: R.Series, prio: number | undefined, context: readonly string[] = [], force = false): Raw {
  const t = now();
  const nx = R.nextOpenEntry(s, t);
  const step = nx && R.firstStep(nx);
  // An estimate is a day, not a minute: count it in days.
  const rel = step ? L.relativeText({ ...step.t, precise: step.t.precise && step.m.status !== 'estimated' }, t) : '';
  return html`<span class="rank ${prio ? 'first' : 'none'}">${prio ?? ''}</span>
    <div class="main"><div class="t nb"><span class="b">${s.name}</span>${nx ? html`<span class="yr">${nx.edition.year}</span>` : ''}${nameTail(s, rankedSeries(s), context, force)}</div>
    <div class="s">${nextDeadlineLine(s)}</div></div>${rel ? html`<span class="rel">${rel}</span>` : ''}`;
}

function targetRow(s: R.Series, prio: number | undefined, context: readonly string[] = [], force = false): Raw {
  const on = prio !== undefined;
  const none = ['closed', 'none'].includes(R.seriesState(s, now()));
  return html`<button class="row two pick tgt${on ? ' on' : ''}${none && !on ? ' muted' : ''}" data-act="target" data-id="${s.id}" aria-pressed="${on}">${targetInner(s, prio, context, force)}</button>`;
}

/**
 * One venue in a picker: rank badge (1, 2, 3… blue for 首选, grey for 备选),
 * name and its list badges, next deadline. In the first-run picker a tap
 * adds it to the current tier, moves it there, or takes it out. On the
 * preferences pages ranked rows are not buttons: ⊖ removes (with 撤销), ↑ ↓
 * reorder.
 */
function pickRow(s: R.Series, ctx: string, p: R.Prefs, edit = false, context: readonly string[] = [], force = false): Raw {
  const r = R.rankOf(p, s.id);
  // Greyed: nothing to submit to in the data (all passed, or no dates). A deadline not published yet (ASCO) is not greyed.
  const none = ['closed', 'none'].includes(R.seriesState(s, now()));
  const inner = html`<span class="rank ${r ? r.tier : 'none'}">${r ? r.rank : ''}</span>
    <div class="main"><div class="t nb"><span class="b">${s.name}</span>${nameTail(s, rankedSeries(s), context, force)}</div><div class="s">${nextDeadlineLine(s)}</div></div>`;
  if (edit && r)
    return html`<div class="row two pick on moving">
      <button class="rm" data-act="remove" data-ctx="${ctx}" data-id="${s.id}" aria-label="移除 ${s.name}">${icon.minus}</button>
      <div class="pick-main">${inner}</div>
      <button class="mv" data-act="move" data-dir="-1" data-ctx="${ctx}" data-id="${s.id}" aria-label="${s.name} 上移"${R.canMove(p, s.id, -1) ? '' : ' disabled'}>${icon.up}</button>
      <button class="mv" data-act="move" data-dir="1" data-ctx="${ctx}" data-id="${s.id}" aria-label="${s.name} 下移"${R.canMove(p, s.id, 1) ? '' : ' disabled'}>${icon.dn}</button></div>`;
  return html`<button class="row two pick${r ? ' on' : ''}${none && !r ? ' muted' : ''}" data-act="pick" data-ctx="${ctx}" data-id="${s.id}" aria-pressed="${!!r}">${inner}</button>`;
}

let pickTier: R.Tier = 'first';
/** "其他方向的会议" is open on the preferences pages (first run keeps its own flag). */
let showOthers = false;
/** 投稿偏好: the 方向 row is open, which 学科 are open in it, and what the search box holds. */
let prefsDirsOpen = false;
let prefsDiscs: string[] | null = null;
let prefsQuery = '';
/** Groups whose venues without an open deadline were unfolded ("<ctx>:<学科>"). */
const closedOpen = new Set<string>();

/** 首选 and 备选 in rank order; `edit` adds ⊖ and ↑↓ (preferences pages). First run shows one line until something is picked. */
function rankedGroups(ctx: string, p: R.Prefs, edit: boolean, tier: R.Tier, context: readonly string[] = []): Raw {
  const rows = (ids: string[]) => ids.map((id) => pickRow(SERIES_BY_ID.get(id)!, ctx, p, edit, context));
  const hint = (t: string) => group(html`<div class="row hint"><span class="t">${t}</span></div>`);
  const addHere = edit ? '在下面“添加会议”里点选' : '在下面点选会议';
  // First run with nothing picked (控制, 医学…: no usual 首选): one line, so the venues start higher up.
  if (!edit && !p.first.length && !p.backup.length) return html`<p class="pick-hint">点下面的会议，按喜好先后点</p>`;
  return html`${cap('首选')}${p.first.length ? group(rows(p.first)) : hint(`还没有首选。${addHere}。`)}
    ${cap('备选')}${p.backup.length ? group(rows(p.backup)) : hint(tier === 'backup' ? `${addHere}，加到备选。` : '没有备选。切到「备选」再点会议。')}`;
}

/** The search box of a long venue list; typing redraws only the list under it (`data-results`), so the keyboard stays up. */
function searchBox(ctx: string, q: string): Raw {
  return html`<div class="search-wrap">${icon.search}<input class="search" type="search" data-search="${ctx}" value="${q}" placeholder="搜索：缩写、全称或方向" aria-label="搜索会议" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false">${
    html`<button class="search-x" data-act="search-clear" data-ctx="${ctx}" aria-label="清除"${q ? '' : ' hidden'}>${icon.close}</button>`
  }</div>`;
}

/**
 * Venues to add (§9.1): those of the chosen directions, the best-known
 * first, one group per 学科 when the directions span several (计算机,
 * 工程…); then one row "其他方向的会议 ›" that opens every other series, by
 * 学科. The search box is always there: it covers every venue, whatever the
 * direction (CRYPTO for a control user).
 */
function addLists(ctx: string, dirs: R.Direction[], p: R.Prefs, tier: R.Tier, others: boolean, q = ''): Raw {
  return html`${searchBox(ctx, q)}<div data-results="${ctx}">${pickResults(ctx, dirs, p, tier, others, q)}</div>`;
}

/** Search hits shown at once; more say how many and ask for another letter. */
const MAX_HITS = 60;

/** The list under the search box: search hits, or the direction groups and the other directions. */
function pickResults(ctx: string, dirs: R.Direction[], p: R.Prefs, tier: R.Tier, others: boolean, q: string): Raw {
  const all = pickerSeries(p, () => true);
  const row = (s: R.Series, force = false) => pickRow(s, ctx, p, false, dirs, force);
  const where = tier === 'first' ? '首选' : '备选';
  if (q.trim()) {
    const hits = TX.search(all.map(searchable), q, TAX).map((x) => SERIES_BY_ID.get(x.id)!);
    return hits.length
      ? html`${cap(`找到 ${hits.length} 个 · 点一下，加到${where}末尾`)}${group(hits.slice(0, MAX_HITS).map((x) => row(x, true)))}${
          hits.length > MAX_HITS ? html`<p class="note">还有 ${hits.length - MAX_HITS} 个，多打几个字缩小范围。</p>` : ''
        }`
      : html`<p class="note">没有找到“${q.trim()}”。试试缩写（CDC）、全称里的词或方向（控制）。</p>`;
  }
  const mine = all.filter((s) => TX.inDirs(s, dirs));
  const rest = all.filter((s) => !TX.inDirs(s, dirs));
  const groups = TX.groupByDiscipline(mine, dirs, TAX);
  const head = cap(`点一下，加到${where}末尾 · 核对过、等级高的在前`);
  return html`${
    groups.length
      ? html`${groups.length > 1 ? head : ''}${groups.map(
          (g, i) => html`${g.discipline ? cap(`${g.discipline.name} · ${g.items.length} 个`) : i === 0 ? head : ''}${foldedRows(ctx, g.items, g.discipline?.id ?? '', row)}`,
        )}`
      : html`<p class="note">这些方向暂时没有收录会议。可以在上面搜索，或看其他方向的会议。</p>`
  }
    ${rest.length ? othersBlock(ctx, rest, others, row) : ''}`;
}

/**
 * A group of venues: those with a deadline a new paper can make, or one not
 * published yet (ASCO: 摘要截止 待公布), are rows; those whose deadlines all
 * passed or whose dates are not collected fold into one row (§9.1).
 */
function foldedRows(ctx: string, items: R.Series[], key: string, row: (s: R.Series) => Raw): Raw {
  const t = now();
  const live = items.filter((x) => ['open', 'tba'].includes(R.seriesState(x, t)));
  const shown = closedOpen.has(`${ctx}:${key}`) || !live.length ? items : live;
  const n = items.length - live.length;
  return group(
    html`${shown.map((x) => row(x))}${
      shown.length < items.length
        ? html`<button class="row" data-act="show-closed" data-ctx="${ctx}" data-id="${key}"><span class="t accent">已截止或日期未收录的 ${n} 个</span>${chev}</button>`
        : ''
    }`,
  );
}

/**
 * "其他方向的会议": one row until opened; then one fold per 学科
 * ("工程 · 40 个 ›"), each opening its venues, instead of one list of hundreds.
 */
function othersBlock(ctx: string, rest: R.Series[], open: boolean, row: (s: R.Series) => Raw): Raw {
  if (!open)
    return group(html`<button class="row" data-act="show-others" data-ctx="${ctx}"><span class="t accent">其他方向的会议</span><span class="val">${rest.length} 个</span>${chev}</button>`, 'mt8');
  return html`${cap('其他方向的会议 · 按学科')}${TX.byDiscipline(rest, TAX).map((g) => {
    const key = `others-${g.discipline?.id ?? 'x'}`;
    const on = closedOpen.has(`${ctx}:${key}:disc`);
    return on
      ? html`<p class="cap disc-cap"><button class="cap-btn" data-act="disc-fold" data-ctx="${ctx}" data-id="${key}" aria-expanded="true">${g.discipline?.name ?? '其他'} · ${g.items.length} 个 ⌃</button></p>${foldedRows(ctx, g.items, key, row)}`
      : group(
          html`<button class="row" data-act="disc-fold" data-ctx="${ctx}" data-id="${key}" aria-expanded="false"><span class="t">${g.discipline?.name ?? '其他'}</span><span class="val">${g.items.length} 个</span>${chev}</button>`,
          'mt8',
        );
  })}`;
}

/**
 * The preferences page body: what is ranked comes first (⊖, ↑↓); then
 * "添加会议": one row "方向 | 机器学习、控制 ⌄" that opens the 学科 → 方向
 * picker in place, the tier switch (sticky inside this section only) and the
 * venues to add.
 */
function prefsEditor(ctx: string, dirs: R.Direction[], p: R.Prefs): Raw {
  const open = prefsDiscs ?? TX.openAtFirst(TAX, dirs);
  return html`${rankedGroups(ctx, p, true, pickTier, dirs)}
    <section class="add-sec">${h2('添加会议')}
      <div class="group form">
        <button class="row field dir-row${prefsDirsOpen ? ' open' : ''}" data-act="prefs-dirs" aria-expanded="${prefsDirsOpen}"><span class="k">方向</span><span class="v">${dirsText(dirs)}</span>${icon.down}</button>
        ${prefsDirsOpen ? html`<div class="row chips-row">${dirPicker(ctx, dirs, open)}</div>` : ''}
      </div>
      <div class="sticky-seg">${tierSeg(ctx, pickTier)}</div>
      ${addLists(ctx, dirs, p, pickTier, showOthers, prefsQuery)}</section>`;
}

// ---------- route card (paper detail) ----------

/** ① ICML 2027 目标 2 预计 / 摘要 约 2027/1/24 · 正文 约 1/29. The abstract comes first: missing it closes the venue. */
function stopRow(s: R.RouteStop, i: number, ctx: R.YearCtx): Raw {
  const e = s.entry;
  // A paper's route ranks its targets as 首选 1–3: the rank is the target's priority. The
  // same target a year later (AISTATS 2028 after AISTATS 2027) is a second try, not a 4th venue.
  const rank = s.pref
    ? s.repeat
      ? html`<span class="rk tgt again">目标 ${s.pref.rank} · 再投</span>`
      : html`<span class="rk tgt">目标 ${s.pref.rank}</span>`
    : '';
  const parts = R.stopParts(e, ctx, now());
  // Where it is held, after the dates when the line has room ("· 首尔").
  const city = P.placeShort(e.edition);
  return html`<a class="stop" href="#/venue/${e.edition.id}"><span class="num">${i + 1}</span>
    <div class="main"><div class="t"><span class="nm">${L.editionShort(e.edition)}</span>${rank}${e.estimated ? tag('预计') : ''}${
      s.current ? tag('在投', 'current') : ''
    }</div>
    <div class="s">${parts.map((x, j) => html`<span class="nw">${x}${j < parts.length - 1 ? ' ·' : ''}</span>`)}${city ? fitCity(city) : ''}</div></div>${chev}</a>`;
}

/**
 * ↓ 约 4/30 出结果, and under it the turnaround to the next stop:
 * "没中的话 5 天后交摘要，7 天后交正文" (amber with "准备不足 7 天" when the
 * paper gets fewer days than the prep time).
 */
function hopRow(s: R.RouteStop, next: R.RouteStop | undefined, ctx: R.YearCtx): Raw {
  const r = s.entry.result;
  const res = R.resultWord(s.entry.edition);
  const when = r ? `${R.routeDay(r, ctx)} ${res}` : `${res}时间待公布`;
  const g = next && R.gapAfter(s.entry, next.entry);
  return html`<div class="hop${next ? '' : ' end'}"><span class="arrow">${next ? '↓' : ''}</span><div class="hop-t"><div>${when}</div>${
    g && next
      ? html`<div class="gap${g.short ? ' short' : ''}">${R.gapParts(g, next.entry).map((x) => html`<span class="nw">${x}</span>`)}${
          g.short ? html` <span class="nw">· 准备不足 ${R.PREP_DAYS} 天</span>` : ''
        }</div>`
      : ''
  }</div></div>`;
}

/** The placeholder-abstract card of this series, if any edition has one (ICLR 2027's for ICLR 2028). */
function placeholderRule(ed: AppEdition): AppRule | undefined {
  const same = [...EDITIONS.filter((e) => e.series === ed.series)].sort((a, b) => Number(b.id === ed.id) - Number(a.id === ed.id) || b.year - a.year);
  for (const e of same) {
    const r = rulesOf(e.id).find((x) => x.id.endsWith('/placeholder-abstract') || x.effect?.target === 'genuine_abstract');
    if (r) return r;
  }
  return undefined;
}

/**
 * ⚠ 约 9/19 前先注册 ICLR 2028 摘要: its abstract closes before the previous
 * stop's result is out. Placed where it falls in time (before that result).
 * Opens the ICLR 2028 abstract page, which lists the ICLR 2027 cards to go by.
 */
function warnRow(s: R.RouteStop, prev: R.RouteStop, ctx: R.YearCtx): Raw {
  const e = s.entry;
  const pre = e.pre!;
  const rule = pre.type === 'abstract' ? placeholderRule(e.edition) : undefined;
  const step = R.stepName(pre);
  const from = rule && rule.edition !== e.edition.id ? `按 ${editionLabel(rule.edition)} 规则：` : '';
  return html`<a class="warn" href="${mHref(e.edition, pre)}">${icon.warn}<div class="main">
    <div class="t">${R.routeDay(pre, ctx)} 前先注册 <span class="nw">${L.editionShort(e.edition)} ${pre.type === 'abstract' ? '摘要' : '论文'}</span></div>
    <div class="s">${step}在 ${L.seriesName(prev.entry.edition)} 出结果前截止</div>
    ${rule ? html`<div class="s"><span class="nw">${from}</span><span class="nw">占位${step}会被删</span></div>` : ''}
    </div>${chev}</a>`;
}

function insertRow(x: R.RouteInsert, ctx: R.YearCtx): Raw {
  const e = x.entry;
  return html`<a class="alt" href="#/venue/${e.edition.id}"><div class="main">
    <div class="k">备选可插入</div>
    <div class="t">${L.editionShort(e.edition)}<span class="rk">备选 ${x.pref.rank}</span>${e.estimated ? tag('预计') : ''}</div>
    <div class="s">${R.stopParts(e, ctx).map((p, j, all) => html`<span class="nw">${p}${j < all.length - 1 ? ' ·' : ''}</span> `)}</div>
    <div class="s">${R.routeDay(e.result!, ctx)} 出结果</div>
    </div>${chev}</a>`;
}

/**
 * 排不进: one line on why a target is not on the route. A clash names the
 * stop that was kept and its priority: "ACL 2027 和 ICML（目标 2）撞审稿期".
 */
function unplacedLine(u: R.Unplaced): Raw {
  const name = SERIES_BY_ID.get(u.series)?.name ?? u.series;
  const ed = u.next ? L.editionShort(u.next.edition) : name;
  switch (u.why) {
    case 'none':
      return html`<span class="nw">${name}</span> 暂无可投的截止`;
    case 'later':
      return html`<span class="nw">${ed}</span> <span class="nw">${R.firstStepText(u.next!, now())}，</span><span class="nw">超出 15 个月</span>`;
    case 'full':
      return html`<span class="nw">${ed}</span> 路线已排满 4 站`;
    default: {
      const st = u.during;
      if (!st) return html`<span class="nw">${ed}</span> 截止和其他站的审稿期重叠`;
      const why = st.current ? '在投' : st.pref ? `目标 ${st.pref.rank}` : '';
      // "ICML（目标 2）撞审稿期" (no space after the bracket), "ICML 审稿期间" without one.
      const other = html`<span class="nw">${L.seriesName(st.entry.edition)}${why ? `（${why}）` : ' '}</span>`;
      if (u.clash === 'short') return html`<span class="nw">${ed}</span> 截止离 ${other}出结果不足 ${R.PREP_DAYS} 天`;
      if (u.clash === 'inside') return html`<span class="nw">${ed}</span> 截止在 ${other}审稿期间`;
      return html`<span class="nw">${ed}</span> 和 ${other}撞审稿期`;
    }
  }
}

/**
 * 投稿路线 (§9.4, §9.7): the paper's targets only. Stops in order, the result
 * and turnaround between them, 先注册摘要 where it falls in time, then 已错过
 * and any target that cannot be placed. Years show once they change
 * ("约 2027/1/24").
 */
function routeCard(route: R.Route, paper: Paper, unplaced: R.Unplaced[]): Raw {
  if (!route.stops.length)
    return html`<div class="route empty"><p>${
      paper.targets.length ? '目标会议目前都没有来得及投的截止。' : '还没有目标会议。'
    }</p><a class="btn small" href="#/me/paper/${paper.id}/targets">${paper.targets.length ? '修改目标会议' : '选择目标会议'}</a></div>`;
  const t = now();
  const ctx = R.yearCtx(t);
  const parts: Raw[] = [];
  route.stops.forEach((s, i) => {
    const next = route.stops[i + 1];
    parts.push(stopRow(s, i, ctx));
    if (next?.preFirst) parts.push(warnRow(next, s, ctx));
    parts.push(hopRow(s, next, ctx));
    for (const x of route.inserts.filter((y) => y.after === i)) parts.push(insertRow(x, ctx));
  });
  const foot: Raw[] = [];
  if (route.missed.length)
    foot.push(
      html`<p class="missed"><span class="k">已错过</span>${route.missed.map((m) => {
        const at = (m.milestone.at_resolved ?? m.milestone.end_resolved)!;
        return html`<span class="nw">${L.editionShort(m.edition)}（${R.stepName(m.milestone)} ${L.fmtDay(at, t)} 已截止）</span>`;
      })}</p>`,
    );
  for (const u of unplaced) foot.push(html`<p class="unplaced"><span class="k">排不进</span><span>${unplacedLine(u)}</span></p>`);
  if (route.estimated) foot.push(html`<p>预计日期按往年推算，以官网公布为准</p>`);
  // §11.5: the same route drawn small on a time axis, in each venue's lane colour.
  const mini = route.stops.length > 1 ? CH.miniRouteHtml(TL.miniRoute(route.stops, t), laneColorMap(), route.stops.map((x) => L.seriesName(x.entry.edition))) : '';
  return html`<div class="route">${mini}${parts}${foot.length ? html`<div class="route-foot">${foot}</div>` : ''}</div>`;
}

function nextCard(ed: AppEdition, label = '下一个节点'): Raw {
  const n = nextOf(ed);
  // The submission deadline is not published yet and nothing but the meeting is ahead (ASCO 2027):
  // that deadline is the next thing to know, not "会议举办 252 天后开始".
  const tba = R.tbaEntry(ed, now());
  if (tba && (!n || n.milestone.type === 'conference'))
    return html`<a class="next-card" href="${mHref(ed, tba)}"><div class="main"><div class="k">${label}</div><div class="t">${L.milestoneShort(tba)}${tag('待公布')}</div>
      <div class="s"><span>官方还没公布${ed.home ? ' · 看官网' : ''}</span></div></div>${chev}</a>`;
  if (!n) return html`<div class="next-card muted"><div class="main"><div class="k">${label}</div><div class="t">本届节点都已过去</div></div></div>`;
  const parts = L.countdown(n.target, now());
  const w = whenOf(n.milestone);
  // A site's milestone names its site (NeurIPS 2026: 会议举办 · 悉尼 12/6–12/12), so its days are not read as the place card's whole span.
  return html`<a class="next-card" href="${mHref(ed, n.milestone)}">
    <div class="main"><div class="k">${label}</div><div class="t">${L.milestoneShort(n.milestone)}${siteSuffix(ed, n.milestone)}${statusTag(n.milestone)}</div>
    <div class="s"><span class="nw">${w.text}</span>${w.label ? html` <span class="lbl">${w.label}</span>` : ''}</div></div>
    <div class="cd">${countHtml(parts, phaseSuffix(n.phase, parts))}</div>${chev}</a>`;
}

const group = (rows: Raw[] | Raw, cls = '') => html`<div class="group ${cls}">${rows}</div>`;
const h2 = (t: string, extra: Raw | string = '') => html`<h2 class="h2">${t}${extra}</h2>`;
const cap = (t: string) => html`<p class="cap">${t}</p>`;

// ---------- screens ----------

interface View {
  title: string;
  body: Raw;
  tab: Tab;
  root?: boolean;
  noTabs?: boolean;
  /** A button on the right of a pushed screen's nav bar (⋯). */
  navRight?: Raw;
  mount?: (el: HTMLElement) => void;
}

interface Welcome {
  dirs: R.Direction[];
  /** The directions are still the app's default (机器学习), not the user's: the first other chip replaces it. */
  defaulted: boolean;
  /** Directions in the order they were picked; the first one prefills 首选. */
  order: R.Direction[];
  /** 学科 open in the picker. */
  open: string[];
  prefs: R.Prefs;
  tier: R.Tier;
  /** The user changed the prefilled venues; new directions then add to them instead of replacing them. */
  edited: boolean;
  /** "其他方向的会议" is open. */
  others: boolean;
  /** What the venue search box holds. */
  q: string;
}

let welcome: Welcome | null = null;

function welcomeState(): Welcome {
  if (!welcome) {
    // 机器学习 is preselected, softly, so two taps (下一步, 开始) are enough to start; every 学科
    // starts closed, so all nine fit on the first screen and none looks missing.
    const stored = getDirs();
    const dirs = stored ?? DEFAULT_DIRS;
    const prefs = getPrefs();
    welcome = {
      dirs,
      defaulted: !stored,
      order: dirs,
      open: stored ? TX.openAtFirst(TAX, dirs) : [],
      prefs: prefs ?? R.defaultPrefs(dirs, KNOWN),
      tier: 'first',
      edited: !!prefs,
      others: false,
      q: '',
    };
  }
  return welcome;
}

/**
 * First run, step 1 (§9.1): "你做什么方向？" nine 学科 rows, all closed, each
 * opening its direction chips; several directions across 学科. The bar
 * names what is chosen ("已选 机器学习（默认）"), so closed 学科 hide nothing.
 */
function screenWelcome(): View {
  const w = welcomeState();
  const n = w.dirs.length;
  const chosen = `已选 ${dirsText(w.dirs)}${w.defaulted ? '（默认）' : ''}`;
  return {
    title: '方向',
    tab: 'today',
    root: true,
    noTabs: true,
    body: html`<header class="large-head welcome-head"><p class="eyebrow">1 / 2</p><h1>你做什么方向？</h1><p class="sub">点学科，再点方向，可以多选。</p></header>
      ${dirPicker('welcome', w.dirs, w.open, true)}
      <div class="bottom-bar"><div class="bottom-inner">
        <button class="btn" data-act="welcome-next"${n ? '' : ' disabled'}>下一步</button>
        <p class="btn-note">${n ? html`<span class="nw">${chosen}</span> · <span class="nw">只存在这台手机上</span>` : '至少选 1 个方向'}</p></div></div>`,
  };
}

/** First run, step 2: "按喜好依次点选会议" — the chosen directions' venues by next deadline (首选 prefilled for the usual CS directions). */
function screenWelcomeVenues(): View {
  const w = welcomeState();
  const n = w.prefs.first.length;
  const m = w.prefs.backup.length;
  return {
    title: '选会议',
    tab: 'today',
    noTabs: true,
    body: html`<header class="large-head"><p class="eyebrow">2 / 2 · ${dirsText(w.dirs)}</p><h1>按喜好依次点选会议</h1><p class="sub">点一下加到当前这一栏末尾，再点取消。这些会议的截止会出现在「下一步」。</p></header>
      <div class="sticky-seg">${tierSeg('welcome', w.tier)}</div>
      ${rankedGroups('welcome', w.prefs, false, w.tier, w.dirs)}
      ${addLists('welcome', w.dirs, w.prefs, w.tier, w.others, w.q)}
      <div class="bottom-bar"><div class="bottom-inner">
        <button class="btn" data-act="start"${n ? '' : ' disabled'}>开始</button>
        <p class="btn-note">${n ? `首选 ${n} 个${m ? ` · 备选 ${m} 个` : ''} · 只存在这台手机上` : '至少选 1 个首选'}</p></div></div>`,
  };
}

function emptyState(text: string, btn: string, href: string): Raw {
  // One quiet button; the screen's big card or list stays the main action.
  // Centred copy breaks after the first "，" rather than mid-phrase.
  const i = text.indexOf('，');
  const p = i > 0 && i < text.length - 1 ? html`${text.slice(0, i + 1)}<br>${text.slice(i + 1)}` : text;
  return html`<div class="group empty"><p>${p}</p><a class="btn small" href="${href}">${btn}</a></div>`;
}

function screenToday(): View {
  const t = now();
  const eds = followed();
  const head = html`<header class="large-head"><h1>下一步</h1><p class="sub">${L.nowLine(t)}</p></header>`;
  const view = (body: Raw): View => ({ title: '下一步', tab: 'today', root: true, body: html`${head}${body}` });
  // Papers first (§3.1): a result to mark, a site to mark, an accepted paper's 下一件事.
  const leads = paperLeads(t);
  if (!eds.length && !leads.length) return view(emptyState('还没有关注的会议。选好之后，这里会显示最近的截止时间。', '选择会议', '#/me/prefs'));
  const { items, sites, onlyRegistered, tbas } = followedItems(eds, t);
  // A paper deadline only open to registered abstracts (ICLR 2027 after 9/19) is never the main card.
  // First-choice venues outrank backups: a backup deadline only leads when no first choice has one.
  const open = items.filter((i) => !onlyRegistered.has(i));
  const firstSeries = new Set((getPrefs() ?? NO_PREFS).first);
  const hero = L.pickHero(open.filter((i) => firstSeries.has(i.edition.series))) ?? L.pickHero(open) ?? items[0];
  // The main card is the most urgent thing: a paper's question (出结果了 / 分配出来了) or overdue
  // step; else its next step when that comes first, or is an official deadline within 14 days
  // while the venues' next deadline is not due within 2 days.
  const top = leads[0];
  const paperFirst =
    !!top && (top.urgent || !hero || top.ms < hero.target.ms || (top.soon && (onlyRegistered.has(hero) || !L.isUrgent(hero, t))));
  if (!hero && !top) return view(emptyState('关注的会议都没有后续节点了。', '调整投稿偏好', '#/me/prefs'));

  let heroHtml: Raw | '' = '';
  if (!paperFirst && hero) {
    const ed = hero.edition;
    const m = hero.milestone;
    const rules = rulesOf(ed.id);
    const parts = L.countdown(hero.target, t);
    const after = L.afterPhrases(rules, m.type);
    const must = L.groupRulesForMilestone(rules, m.type).mustBefore.length;
    const w = whenOf(m);
    heroHtml = html`<a class="hero" href="${mHref(ed, m)}">
    <div class="hero-k"><span class="hero-name">${L.editionShort(ed)} · ${nowrapAside(L.milestoneShort(m))}${siteSuffix(ed, m, sites.get(hero))}</span>${statusTag(m)}${chev}</div>
    <div class="count">${countHtml(parts, phaseSuffix(hero.phase, parts))}</div>
    <div class="when">${w.text}${w.label ? html`<span class="lbl">${w.label}</span>` : ''}</div>
    ${
      onlyRegistered.has(hero)
        ? html`<div class="after cond">${registeredOnly(ed)}</div>`
        : after.length
          ? html`<div class="after"><span class="lbl">之后不能：</span>${after.join(' · ')}</div>`
          : must
            ? html`<div class="after"><span class="lbl">截止前必须做到 ${must} 项</span></div>`
            : ''
    }</a>`;
  }

  // With a paper on the main card, the venues' next deadline is an ordinary row in its group.
  const rest = paperFirst ? items : items.filter((i) => i !== hero);
  const buckets: L.Upcoming[][] = [[], [], []];
  for (const i of rest) buckets[L.bucketOf(i, t)]!.push(i);
  const total = items.length + tbas.length;
  const later = buckets[2]!;
  const hidden = later.length - Math.min(3, later.length) + tbas.length;
  const allRow = html`<a class="row more" href="#/all"><span class="t">全部 ${total} 项</span>${chev}</a>`;
  const row = (i: L.Upcoming) => upRow(i, onlyRegistered.has(i), sites.get(i));
  const sections: Raw[] = [];
  buckets.forEach((list, i) => {
    if (!list.length) return;
    const shown = i === 2 ? list.slice(0, 3) : list;
    sections.push(html`${cap(L.BUCKETS[i]!)}${group(html`${shown.map(row)}${i === 2 && hidden > 0 ? allRow : ''}`)}`);
  });
  if (!later.length && hidden > 0) sections.push(group(allRow, 'mt'));
  const paperRows = (paperFirst ? leads.slice(1) : leads).map((x) => x.row);
  // The route is the headline feature: until a paper exists, point to it right
  // under the main card, before the list.
  const paperLink = getPapers().length
    ? ''
    : group(
        html`<a class="row two" href="#/me/paper/new"><div class="main"><div class="t accent">添加论文，排出投稿路线</div><div class="s"><span>选 3 个目标会议，排先投哪个、没中再投哪个</span></div></div>${chev}</a>`,
        'mt16',
      );
  return view(
    html`${paperFirst ? top!.card : heroHtml}${paperRows.length ? group(paperRows, 'mt16') : ''}${paperLink}${sections.length ? html`${h2('接下来')}${sections}` : ''}`,
  );
}

/** A paper's line on 下一步 (§3.1): the big card when it is the most urgent thing, else a row. */
interface Lead {
  /** 出结果了 / 分配出来了 lead first (-Infinity); a step by its time. */
  ms: number;
  /** A question to answer or an overdue step: it always takes the main card. */
  urgent: boolean;
  /** A step within 14 days: it takes the main card unless a venue deadline is due within 2 days. */
  soon: boolean;
  card: Raw;
  row: Raw;
}

/**
 * 下一步's lines for papers, most urgent first: "论文 A · 出结果了，标一下"
 * once its 在投 venue's result day begins; "分配出来了，标一下" once a
 * multi-site venue assigned the sites; else an accepted paper's 下一件事.
 * Post-acceptance milestones never show in the lists themselves.
 */
function paperLeads(t: number): Lead[] {
  const today = L.beijingDate(t);
  const out = getPapers().flatMap((p): Lead[] => {
    const ask = T.acceptPrompt(p, EDITIONS, t);
    if (ask)
      return [
        {
          ms: -Infinity,
          urgent: true,
          soon: true,
          card: askCard(p, ask, true),
          row: html`<a class="row two" href="#/me/paper/${p.id}"><div class="main"><div class="t"><span class="v">${p.name}</span>出结果了，标一下</div>
          <div class="s"><span>${L.editionShort(ask.edition)} · 录用了吗？</span></div></div>${chev}</a>`,
        },
      ];
    const trip = tripOf(p);
    if (!trip) return [];
    const assign = T.assignPrompt(p, trip.edition, t);
    if (assign)
      return [
        {
          ms: -Infinity,
          urgent: true,
          soon: true,
          card: assignCard(p, trip, assign, true),
          row: html`<a class="row two" href="#/me/paper/${p.id}"><div class="main"><div class="t"><span class="v">${p.name}</span>分配出来了，标一下</div>
          <div class="s"><span>${L.seriesName(trip.edition)} ${T.shortTime(assign)} 已公布 · 分到哪？</span></div></div>${chev}</a>`,
        },
      ];
    const n = T.nextStep(trip.steps, t);
    if (!('step' in n)) return [];
    const s = n.step;
    const rel = T.stepRelative(s, t);
    const days = s.target ? L.dayDiff(s.target.date, today) : Infinity;
    return [
      {
        ms: s.target?.ms ?? Infinity,
        urgent: n.overdue,
        soon: days <= 14,
        card: taskCard(p, trip, true),
        row: html`<a class="row two" href="#/me/paper/${p.id}"><div class="main"><div class="t"><span class="v">${p.name}</span>${s.action}</div>
        <div class="s"><span>${s.at || s.range ? T.stepWhen(s, t) : (s.text ?? '')}</span>${stepTag(s)}</div></div>${
          rel ? html`<span class="rel${n.overdue ? ' late' : s.tag === 'hard' && days <= 7 ? ' soon' : ''}">${rel}</span>` : ''
        }${chev}</a>`,
      },
    ];
  });
  return out.sort((a, b) => Number(b.urgent) - Number(a.urgent) || (a.ms === b.ms ? 0 : a.ms < b.ms ? -1 : 1));
}

function screenAll(): View {
  const t = now();
  const eds = followed();
  const { items, sites, onlyRegistered, folded, tbas } = followedItems(eds, t);
  const buckets: L.Upcoming[][] = [[], [], []];
  for (const i of items) buckets[L.bucketOf(i, t)]!.push(i);
  const row = (i: L.Upcoming) => upRow(i, onlyRegistered.has(i), sites.get(i));
  return {
    title: '全部节点',
    tab: 'today',
    body: html`<header class="large-head"><h1>全部节点</h1><p class="sub">关注的 ${eds.length} 个会议 · 按时间排序</p></header>
      ${buckets.map((list, i) => (list.length ? html`${cap(L.BUCKETS[i]!)}${group(list.map(row))}` : ''))}
      ${tbas.length ? html`${cap('时间待公布')}${group(tbas.map((x) => tbaRow(x.edition, x.milestone)))}` : ''}
      ${
        folded.length
          ? html`${cap('没有在投，已收起')}${group(
              folded.map(
                (f) => html`<a class="row two" href="#/venue/${f.edition.id}/timeline"><div class="main"><div class="t">${L.editionShort(f.edition)} 审稿中 · 你没有在投</div>
                  <div class="s"><span>审稿和结果 ${f.n} 个节点</span></div></div>${chev}</a>`,
              ),
            )}`
          : ''
      }`,
  };
}

function notFound(tab: Tab): View {
  return {
    title: '找不到',
    tab,
    body: html`<header class="large-head"><h1>找不到这一页</h1></header>${emptyState('链接可能已经过期。', '回到下一步', '#/today')}`,
  };
}

function screenMilestone(edId: string, key: string): View {
  const ed = ED.get(edId);
  const m = ed && L.milestoneOf(ed, key);
  if (!ed || !m) return notFound(lastTab);
  const type = m.type;
  const t = now();
  const b = L.nextBoundary(m, t);
  const past = L.isPast(m, t);
  const short = L.milestoneShort(m);
  const full = L.milestoneName(m);
  const w = whenOf(m);
  const parts = b ? L.countdown(b.target, t) : [];
  const tba = m.status === 'tba';
  const cd = b
    ? html`<div class="count mid">${countHtml(parts, phaseSuffix(b.phase, parts))}</div>`
    : tba
      ? ''
      : html`<div class="count mid"><b class="w dim">${past ? '已过' : '待公布'}</b></div>`;
  const g = L.groupRulesForMilestone(rulesOf(ed.id), type);
  const sec = (title: string, rs: AppRule[]) => (rs.length ? html`${h2(title)}${group(rs.map((r) => ruleRow(r, ed, false)))}` : '');
  const none = !g.mustBefore.length && !g.lockedAfter.length && !g.other.length;
  const hasRules = rulesOf(ed.id).length > 0;
  // An estimate is last year's date moved on a year, or this edition's loose wording made a day: not what the venue wrote.
  const est = m.status === 'estimated';
  const basis = estBasis(ed, m);
  // No cards for this edition: the previous edition's cards for this step, marked as a reference
  // (ICLR 2028 摘要截止 → ICLR 2027: 先交占位摘要 不能, 一稿多投 …).
  const ref = hasRules ? undefined : referenceRules(ed, type);
  return {
    title: short,
    tab: lastTab,
    body: html`<header class="large-head">
        <p class="eyebrow">${ed.name}</p>
        <h1>${short}${statusTag(m)}${tba ? tag('待公布') : ''}${m.disputed ? tag(L.DISPUTED_TAG, 'disputed') : ''}</h1>
        ${full !== short ? html`<p class="sub">${full}</p>` : ''}
        ${cd}
        ${
          tba
            ? html`<p class="when dim">官方还没给出时间</p>${
                ed.home ? html`<a class="official" href="${ed.home}" target="_blank" rel="noopener"><span class="link">看官网 ↗</span></a>` : ''
              }`
            : html`<p class="when">${w.text}${w.label && !est ? html`<span class="lbl">${w.label}</span>` : ''}</p>`
        }
        ${
          tba
            ? ''
            : est
              ? html`<a class="official" href="#/m/${ed.id}/${key}/source">${basis}${
                  m.quote || m.note_zh ? html`<span class="dotsep"> · </span><span class="link">依据 ›</span>` : ''
                }</a>`
              : L.isUpstream(ed)
                ? html`<a class="official" href="#/m/${ed.id}/${key}/source">${L.officialWord(ed)}：${L.fmtOfficial(m)}<span class="dotsep"> · </span><span class="link">来源 ›</span></a><p class="up-note">${L.UPSTREAM_NOTE}</p>`
                : html`<a class="official" href="#/m/${ed.id}/${key}/source">官网写法：${L.fmtOfficial(m)}${
                    m.quote || m.note_zh ? html`<span class="dotsep"> · </span><span class="link">原文 ›</span>` : ''
                  }</a>`
        }
      </header>
      ${sec('截止前必须做到', g.mustBefore)}
      ${sec('截止后就改不了', g.lockedAfter)}
      ${sec('其他相关', g.other)}
      ${
        ref?.rules.length
          ? html`${h2(`参考 ${L.editionShort(ref.edition)} 的规则`)}<p class="cap">${L.editionShort(ed)} 的规则还没公布，上一届这样规定</p>${group(
              ref.rules.map((r) => ruleRow(r, ref.edition, false, false, ed.id)),
            )}`
          : none
            ? html`<p class="note">${hasRules ? '这个节点没有单独关联的规则。' : `${L.editionShort(ed)} 的规则未收录。`}</p>`
            : ''
      }
      ${group(
        html`<a class="row" href="#/venue/${ed.id}"><span class="t">${hasRules ? `${ed.name} 全部规则` : `${L.editionShort(ed)} 时间线`}</span>${chev}</a>`,
        'mt',
      )}`,
  };
}

/**
 * A short grey city at the end of a line ("· 西雅图") that is dropped whole,
 * not cut, when the line has no room for it: in a one-line box it follows a
 * zero-width space, so when it does not fit it wraps to the hidden second
 * line instead (style.css .fit).
 */
function fitCity(text: string, dot = true): Raw {
  return html`<span class="fit">​<span class="fit-t">${dot ? '· ' : ''}${text}</span></span>`;
}

/** "5/24–5/28 · 首尔", with 预计 right after the dates when they are an estimate (unless the row already says 预计 once); the city only when there is room. */
function venueSub(ed: AppEdition, tagDays = true): Raw {
  const days = L.conferenceDays(ed);
  const parts: Raw[] = [];
  if (days) parts.push(html`<span class="days">${days.estimated ? '约 ' : ''}${days.text}</span>${days.estimated && tagDays ? tag('预计') : ''}`);
  if (!parts.length && ed.kind === 'arr_cycle') parts.push(html`<span>ACL Rolling Review</span>`);
  const city = P.placeShort(ed);
  return html`${parts.map((x, i) => html`${i ? html`<span class="dot">·</span>` : ''}${x}`)}${city ? fitCity(city, parts.length > 0) : ''}`;
}

/**
 * 开会地点 (§3.4.1): right under the venue's name, before its next deadline.
 * The city and country in large type, the days and how far the local clock
 * is from Beijing, the building when known, and the visa tag for a mainland
 * passport. Tapping it opens the place sheet.
 */
/**
 * A place name that breaks only between its parts, never inside a city, and
 * before a "·", not after it ("悉尼 · 亚特兰大" / "· 巴黎"); ccfddl's raw
 * words wrap freely.
 */
function placeNameHtml(name: string, raw: boolean): Raw {
  if (raw) return html`${name}`;
  return html`${name.split(' · ').map((x, i) => html`${i ? ' ' : ''}<span class="nw">${i ? '· ' : ''}${x}</span>`)}`;
}

function placeCard(ed: AppEdition): Raw | '' {
  if (ed.kind !== 'conference') return '';
  const b = P.placeBlock(ed, VISA, now());
  const chip = b.chip ? html`<span class="vchip vc-${b.chip.kind}">${b.chip.text}</span>` : '';
  const when = html`<span class="nw">${b.sites ? `${b.sites} 地 · ` : ''}${b.days ? `${b.estimated ? '约 ' : ''}${b.days}` : '会期待公布'}</span>${b.estimated ? tag('预计') : ''}${
    b.offset ? html`<span class="dot">·</span><span>${b.offset}</span>` : ''
  }`;
  const inner = html`<div class="main">
    <div class="pl-name"><span class="pl-lead">${icon.pin}<span class="pl-t">${placeNameHtml(b.name, b.kind === 'raw')}</span></span>${chip}</div>
    <div class="pl-when">${when}</div>
    ${b.building ? html`<div class="pl-bld">${b.building}</div>` : ''}</div>`;
  const aria = [`开会地点 ${b.name}`, b.sites ? `${b.sites} 地` : undefined, b.days, b.offset, b.building, b.chip?.text].filter(Boolean).join('，');
  return b.tappable
    ? html`<a class="place-card" href="#/venue/${ed.id}/place" aria-label="${aria}">${inner}${chev}</a>`
    : html`<div class="place-card tba" role="group" aria-label="${aria}">${inner}</div>`;
}

/**
 * 会议 → 时间线 (§11.2): one lane per followed venue on a shared month axis,
 * the next deadline first. Each bar opens that edition's phases.
 */
function timelineOverview(all: Followed[]): { body: Raw; mount?: (el: HTMLElement) => void } {
  if (!all.length) return { body: emptyState('还没有关注的会议。选好之后，这里画出每个会从投稿到出结果的时间。', '选会议', '#/me/prefs') };
  // A venue with no edition in the data has nothing to draw: one line under the chart names them.
  const vs = all.filter((v) => v.edition);
  const bare = all.filter((v) => !v.edition);
  const t = now();
  const axis = TL.axisOf(t);
  const colors = laneColorMap();
  const mine = submittedTo();
  // Lanes answer "when"; rank badges are on the list, the venue page and the pickers (§12.2).
  const lanes = TL.laneOrder(
    vs.map((v) => v.series),
    t,
  ).map((s) => {
    // The name says (second line) and opens the same thing: the paper's edition, else the next deadline's.
    const lane = TL.laneOf(s, axis, t, mine);
    const open = lane.open ?? vs.find((v) => v.series.id === s.id)!.edition!.id;
    const aria = `${s.name}，${lane.next ? lane.next.aria : '时间线'}`;
    return { ...lane, color: colors[s.id] ?? 0, href: `#/venue/${open}/timeline`, aria };
  });
  const note = bare.length ? html`<p class="note">日期未收录，没画出来：${bare.map((v, i) => html`${i ? '、' : ''}<a href="#/series/${v.series.id}">${v.series.name}</a>`)}</p>` : '';
  return { body: html`${vs.length ? CH.overviewHtml(lanes, axis, t) : ''}${note}`, mount: vs.length ? mountOverview : undefined };
}

/** Horizontal position of the overview to restore on redraw or back (per route hash). */
const hMemo = new Map<string, number>();
let restoreH: number | undefined;

/**
 * Open on this month (or where the user left it). The month header sits
 * outside the sideways scroller so it can stick under the navigation bar
 * while the page scrolls; it follows the card with a transform, and the
 * corner names the year at the left edge. 回到今天 shows while today's line
 * is off the card.
 */
function mountOverview(el: HTMLElement) {
  const sc = el.querySelector<HTMLElement>('.tl-scroll');
  if (!sc) return;
  const months = el.querySelector<HTMLElement>('.tl-months');
  const yr = el.querySelector<HTMLElement>('.tl-yr');
  const y0 = Number(sc.dataset.y0 ?? 0);
  const mpx = Number(sc.dataset.mpx ?? TL.MONTH_PX);
  let shownYear = '';
  const sync = () => {
    const x = sc.scrollLeft;
    if (months) months.style.transform = `translateX(${-x}px)`;
    const year = String(Math.floor((y0 + Math.max(0, Math.floor((x + 1) / mpx))) / 12));
    if (yr && year !== shownYear) yr.textContent = shownYear = year;
  };
  sc.addEventListener('scroll', sync, { passive: true });
  sc.scrollLeft = restoreH ?? Number(sc.dataset.start ?? 0);
  sync();
  const line = el.querySelector('.tl-now');
  const back = el.querySelector<HTMLElement>('.tl-back');
  if (line && back && typeof IntersectionObserver === 'function')
    new IntersectionObserver((es) => (back.hidden = es.some((x) => x.isIntersecting)), {
      root: sc,
      rootMargin: `0px 0px 0px -${parseFloat(getComputedStyle(el).getPropertyValue('--tl-name')) || CH.NAME_PX}px`,
    }).observe(line);
}

/** Move today's line and tag on the overview (the once-a-minute tick); false when the day changed and the screen needs redrawing. */
function tickOverview(el: HTMLElement): boolean {
  const sc = el.querySelector<HTMLElement>('.tl-scroll');
  if (!sc || sc.dataset.day !== L.beijingDate(now())) return false;
  const axis = TL.axisOf(now());
  const x = TL.xOfMs(now(), axis);
  el.querySelector<HTMLElement>('.tl-now')?.style.setProperty('left', `calc(var(--tl-name, ${CH.NAME_PX}px) + ${x}px)`);
  el.querySelector<HTMLElement>('.tl-now-k')?.style.setProperty('left', `${x}px`);
  return true;
}

function screenVenues(segParam = ''): View {
  const t = now();
  const vs = followedVenues();
  const seg = segParam === 'timeline' || segParam === 'list' ? segParam : readKey(K_VENUES_SEG) === 'timeline' ? 'timeline' : 'list';
  const segHtml = html`<div class="seg top-seg" role="tablist">${(['list', 'timeline'] as const).map(
    (x) => html`<button role="tab" data-act="venues-seg" data-id="${x}" class="${seg === x ? 'on' : ''}" aria-selected="${seg === x}">${x === 'list' ? '列表' : '时间线'}</button>`,
  )}</div>`;
  const prefsRow = group(html`<a class="row" href="#/me/prefs"><span class="t accent">调整投稿偏好</span>${chev}</a>`, 'mt');
  if (seg === 'timeline') {
    const tl = timelineOverview(vs);
    return {
      title: '会议',
      tab: 'venues',
      root: true,
      body: html`<header class="large-head"><h1>会议</h1></header>${segHtml}${tl.body}${prefsRow}`,
      mount: tl.mount,
    };
  }
  const mine = submittedTo();
  const dirs = getDirs() ?? [];
  const row = ({ series, edition: shown }: Followed) => {
    if (!shown)
      // No edition in the data (CRYPTO): the name, its badges, and that its dates are not collected.
      return html`<a class="row two vrow" href="#/series/${series.id}">
      <div class="main"><div class="t nb"><span class="b">${series.name}</span>${nameTail(series, rankedSeries(series), dirs)}</div><div class="s"><span>${
        NAMES.get(series.id)?.full_name ?? ''
      }</span></div></div>
      <div class="nx"><div class="nx-n">日期未收录</div></div>${chev}</a>`;
    // An edition under review that holds no paper of the user's (CDC 2026 on 9/25) says nothing to a new user:
    // show the next one they can still submit to (CDC 2027) instead.
    const nextOpen = notMine(shown, mine, t) ? R.nextOpenEntry(series, t)?.edition : undefined;
    const ed = nextOpen && nextOpen.id !== shown.id ? nextOpen : shown;
    // A round already in review (KDD 2027 第一轮) is skipped unless a paper of the user's is there.
    const n = L.upcoming([ed], t).find((i) => !closedRound(ed, i.milestone, mine, t));
    // An edition whose dates are all shifted from last year says 预计 once, after its name.
    const derived = isDerived(ed);
    let right: Raw;
    const tba = !n ? R.tbaEntry(ed, t) : undefined;
    if (tba) right = html`<div class="nx-n">${L.milestoneShort(tba)}</div><div class="nx-r quiet">待公布</div>`;
    else if (!n) right = html`<div class="nx-n">下一届未收录</div>`;
    else if (notMine(ed, mine, t))
      // ICLR 2027 after its abstract closed: the paper deadline is only for registered abstracts.
      right =
        n.milestone.type === 'paper'
          ? html`<div class="nx-n">${L.milestoneShort(n.milestone)} ${L.upcomingRelative(n, t)}</div><div class="nx-r cond">${registeredOnly(ed)}</div>`
          : html`<div class="nx-n">审稿中</div><div class="nx-r quiet">下一届未收录</div>`;
    else
      // The narrow right column drops the aside: "投稿截止", not "投稿截止（经 ARR）".
      right = html`<div class="nx-n">${L.milestoneShort(n.milestone).replace(/（[^）]*）$/, '')}</div><div class="nx-r${L.isUrgent(n, t) ? ' soon' : ''}">${
        n.milestone.status === 'estimated' && !derived ? tag('预计') : ''
      }${L.upcomingRelative(n, t)}</div>`;
    return html`<a class="row two vrow" href="#/venue/${ed.id}">
      <div class="main"><div class="t nb"><span class="b">${nameYear(ed)[0]}</span><span class="yr">${nameYear(ed)[1]}</span>${derived ? tag('预计') : ''}${nameTail(series, rankedEdition(ed), dirs)}</div><div class="s">${venueSub(ed, !derived)}</div></div>
      <div class="nx">${right}</div>${chev}</a>`;
  };
  const first = vs.filter((v) => v.pref.tier === 'first');
  const backup = vs.filter((v) => v.pref.tier === 'backup');
  return {
    title: '会议',
    tab: 'venues',
    root: true,
    body: html`<header class="large-head"><h1>会议</h1></header>${segHtml}
      ${
        vs.length
          ? html`${first.length ? html`${cap('首选')}${group(first.map(row))}` : ''}${backup.length ? html`${cap('备选')}${group(backup.map(row))}` : ''}`
          : emptyState('还没有关注的会议。', '调整投稿偏好', '#/me/prefs')
      }
      ${prefsRow}`,
  };
}

/**
 * Where to read rules when this edition has none yet: the latest earlier
 * edition of the series that has cards (ICLR 2028 → ICLR 2027), or the ARR
 * cycle it takes submissions from (NAACL 2027 → ARR 2026 年 10 月轮).
 */
function relatedRules(ed: AppEdition): { edition: AppEdition; title: string; sub: string } | undefined {
  const prev = EDITIONS.filter((e) => e.series === ed.series && e.id !== ed.id && e.year <= ed.year && rulesOf(e.id).length).sort(
    (a, b) => b.year - a.year,
  )[0];
  if (prev) return { edition: prev, title: `参考 ${L.editionShort(prev)} 的规则`, sub: '上一届的规则，这一届可能会变' };
  const arr = arrCycleOf(ed);
  return arr ? { edition: arr, title: `${arr.name}的规则`, sub: `${L.editionShort(ed)} 通过 ARR 投稿，适用这一轮的规则` } : undefined;
}

/**
 * Cards to go by at one step of an edition without its own: the previous
 * edition's cards for the same step, and for a registration or paper step
 * also its dual-submission cards (registering while another venue reviews
 * the paper is exactly that question).
 */
function referenceRules(ed: AppEdition, type: string): { edition: AppEdition; rules: AppRule[] } | undefined {
  const alt = relatedRules(ed);
  if (!alt || alt.edition.kind !== 'conference') return undefined;
  const rs = rulesOf(alt.edition.id);
  const g = L.groupRulesForMilestone(rs, type);
  const out = [...g.mustBefore, ...g.lockedAfter, ...g.other];
  if (['abstract', 'paper_registration', 'paper'].includes(type))
    for (const r of rs) if (r.family === 'dual_submission' && !out.includes(r)) out.push(r);
  // What decides whether to register at all comes first: a real abstract, then dual submission.
  const weight = (r: AppRule) => (r.effect?.target === 'genuine_abstract' ? 0 : r.family === 'dual_submission' ? 1 : 2);
  return { edition: alt.edition, rules: out.map((r, i) => ({ r, i })).sort((a, b) => weight(a.r) - weight(b.r) || a.i - b.i).map((x) => x.r) };
}

/** The ARR cycle a venue takes submissions from: the one with the same paper deadline (NAACL 2027 → ARR 2026 年 10 月轮). */
function arrCycleOf(ed: AppEdition): AppEdition | undefined {
  const paper = R.entriesOf(ed)[0];
  if (!paper) return undefined;
  return EDITIONS.find((e) => e.kind === 'arr_cycle' && rulesOf(e.id).length && R.entriesOf(e).some((x) => x.paperT.ms === paper.paperT.ms));
}

function inheritedInfo(ed: AppEdition) {
  const rules = rulesOf(ed.id);
  const inh = rules.filter((r) => r.verification === 'inherited');
  const status = rules.find((r) => r.id.endsWith('/author-guidelines-status') && r.answer === 'unspecified');
  const from = inh[0]?.inherited_from ? L.prettyEditionId(inh[0].inherited_from) : '上一届';
  return { inh, status, from };
}

/** Dates shifted from an earlier edition because the venue has not published this one yet. */
const isDerived = (ed: AppEdition) => !!ed.derived_from && ed.milestones.some((m) => m.status === 'estimated');

/**
 * 阶段列表 (§11.3): every step before acceptance, in time order, with the
 * phase-bar symbol (so the list is the legend too); past steps fold into
 * "已过 N 项". Venues with rounds (WACV, KDD) list each round, then the
 * shared steps; the group holding the next step comes first.
 */
function phaseList(ed: AppEdition, t: number): Raw {
  const next = nextOf(ed)?.milestone;
  const tl = (m: AppMilestone) => {
    // A late-breaking call counts down to its close, not to the day it opens.
    const late = L.isLateAbstract(ed, m);
    const b = late && m.end_resolved && Date.parse(m.end_resolved.utc) > t ? { target: L.targetOf(m.end_resolved), phase: 'due' as const } : L.nextBoundary(m, t);
    const state = L.isPast(m, t) ? 'past' : m === next ? 'next' : 'future';
    const rel = b ? L.upcomingRelative({ edition: ed, milestone: m, ...b }, t) : '';
    // A meta-review release is a moment (ARR 12/18), named as on the bar, not the AC's reviewing period.
    // A second step of one type (AACR's late-breaking abstracts) keeps the venue's own words, or two rows would read the same.
    // (Rounds are grouped apart, so they keep the short name.)
    const twin =
      !!m.label_zh && /[\u4e00-\u9fff]/.test(m.label_zh) && !TL.roundOf(m) && L.milestoneShort(m) === L.MILESTONE_ZH[m.type] && ed.milestones.filter((x) => x.type === m.type && !x.site).length > 1;
    const name = m.type === 'meta_reviews' && m.at_resolved ? '出 AC 意见' : twin ? m.label_zh! : L.milestoneShort(m);
    return html`<a class="row two tl ${state}" href="${mHref(ed, m)}">${CH.phaseSym(TL.listKind(m), m.status === 'estimated')}
      <div class="main"><div class="t">${name}${siteSuffix(ed, m)}</div><div class="s">${
        m.status === 'tba' ? tag('待公布') : html`<span>${L.fmtMilestoneTime(m, t)}</span>${statusTag(m)}`
      }</div></div>
      ${rel ? html`<span class="rel${state === 'next' ? ' soon' : ''}">${rel}</span>` : ''}${chev}</a>`;
  };
  const block = (ms: AppMilestone[]) => {
    const past = ms.filter((m) => L.isPast(m, t));
    return group(
      html`${past.length ? html`<button class="row past-toggle" data-act="expand-past"><span class="dot"></span><span class="t">已过 ${past.length} 项</span>${chev}</button>` : ''}${ms.map(tl)}`,
      'timeline',
    );
  };
  // Steps after acceptance live on the accepted paper's checklist (§10), not here.
  const ms = TL.listOrder(ed.milestones.filter((m) => L.shownBeforeAccept(ed, m)));
  const zone = cap('时间为北京时间');
  const rounds = TL.roundsOf(ed);
  if (rounds.length < 2) return html`${zone}${block(ms)}`;
  const groups = [...rounds.map((r) => ({ title: TL.ROUND_ZH[r]!, ms: ms.filter((m) => TL.roundOf(m) === r) })), { title: '两轮共用', ms: ms.filter((m) => TL.roundOf(m) === 0) }];
  const first = groups.filter((g) => next && g.ms.includes(next));
  return html`${zone}${[...first, ...groups.filter((g) => !first.includes(g))].map((g) => html`${cap(g.title)}${block(g.ms)}`)}`;
}

/** The venue's lane colour before its name (followed venues only), as on the overview. */
function swatch(series: string): Raw | '' {
  const c = laneColorMap()[series];
  return c === undefined ? '' : html`<span class="sw c${c}" aria-hidden="true"></span>`;
}

/** Series with past data (stats.js), so a page knows before loading it whether there is anything to show. */
const PAST = new Set(DATA.past_series ?? [...(DATA.stats ?? []).map((x) => x.series), ...(DATA.areas ?? []).map((x) => x.series), ...(DATA.topics ?? []).map((x) => x.series)]);

/** Display name of a series ("NeurIPS", "WWW"). */
const seriesLabel = (id: string) => SERIES_BY_ID.get(id)?.name ?? id.toUpperCase();

/** UI state of the past-data blocks, per series: 主会 / Findings, the topics year, the areas year. */
const statTab = new Map<string, S.StatTab>();
const topicYear = new Map<string, number>();
const areaYear = new Map<string, number>();

/**
 * 往年数据 (§11.4), at the bottom of the zoomed page: 录用率, then the top
 * 10 topics by accepted papers, then official per-area figures (only when
 * the venue published some). Never used to rank or predict anything.
 */
function pastData(ed: AppEdition): Raw {
  if (ed.kind !== 'conference') return html``;
  const name = seriesLabel(ed.series);
  // Most of the 400+ venues have no past data yet: one line says so, not three empty blocks.
  if (!PAST.has(ed.series)) return html`<p class="note past-none">${name} 往年数据：暂未收录</p>`;
  if (!needStats())
    return html`<div class="h2-block">${h2(`${name} 往年数据`)}</div><p class="note">${statsState === 'failed' ? '往年数据没能载入，联网后再打开这一页。' : '载入中…'}</p>`;
  return html`<div class="h2-block">${h2(`${name} 往年数据`)}<p class="h2-cap">往年的数字，不代表今年 · 点柱子看官方原句</p></div>
    ${CH.rateBlock(STATS.get(ed.series), name, statTab.get(ed.series) ?? 'main')}
    ${CH.topicsBlock(ed.series, TOPICS, topicYear.get(ed.series))}
    ${CH.areasBlock(
      ed.series,
      name,
      AREAS.filter((a) => a.series === ed.series),
      areaYear.get(ed.series),
    )}
    ${group(html`<a class="row" href="#/about/stats"><span class="t">录用率和主题的口径说明</span>${chev}</a>`, 'mt16')}`;
}

/**
 * Under the next-step card of an edition whose result is out (NeurIPS 2026
 * on 9/25): where the series takes papers next, one tap away.
 */
function nextEditionRow(ed: AppEdition, t: number): Raw | '' {
  const es = R.entriesOf(ed);
  if (ed.kind !== 'conference' || !es.length || es.some((e) => !e.resultT || e.resultT.ms > t)) return '';
  const s = SERIES_BY_ID.get(ed.series);
  const e = s && R.nextOpenEntry(s, t);
  if (!e || e.edition.id === ed.id) return '';
  const f = R.firstStep(e);
  return group(
    html`<a class="row two" href="#/venue/${e.edition.id}/timeline"><div class="main"><div class="t accent">下一届 ${e.edition.name}</div><div class="s"><span>${R.stepName(f.m)} ${L.fmtMilestoneTime(f.m, t)}</span>${statusTag(f.m)}</div></div>${chev}</a>`,
    'mt8',
  );
}

function screenVenue(edId: string, segParam: string): View {
  const ed = ED.get(edId);
  if (!ed) return notFound('venues');
  const t = now();
  const rules = rulesOf(ed.id);
  // Without rule cards the page opens on the timeline; 规则 then says 规则未收录.
  const seg = segParam || (rules.length ? 'rules' : 'timeline');
  const { inh, status } = inheritedInfo(ed);
  // No cards here and none to go by (an earlier edition's, the ARR cycle's): the page is the timeline, and says 规则未收录 once at the end.
  const noRules = !rules.length && !relatedRules(ed);
  const banner = L.isUpstream(ed)
    ? html`<a class="banner up" href="#/venue/${ed.id}/info"><span>${L.UPSTREAM_NOTE}</span>${chev}</a>`
    : inh.length
    ? html`<a class="banner" href="#/venue/${ed.id}/info"><span>${
        status ? `${ed.year} 作者指南未发布，${inh.length} 条沿用上届` : `${inh.length} 条规则沿用上届`
      }</span>${chev}</a>`
    : isDerived(ed)
      ? html`<a class="banner" href="#/venue/${ed.id}/info"><span>${
          ed.milestones.some((m) => m.status === 'confirmed' && m.type === 'paper') ? '部分日期官网还没公布' : '官网还没公布'
        }，日期按 ${editionLabel(ed.derived_from!)} 推算</span>${chev}</a>`
      : '';
  const rulesHref = rules.length ? `#/venue/${ed.id}` : `#/venue/${ed.id}/rules`;
  const tlHref = rules.length ? `#/venue/${ed.id}/timeline` : `#/venue/${ed.id}`;
  const segHtml = html`<div class="seg" role="tablist">
    <button role="tab" data-act="seg" data-href="${rulesHref}" class="${seg === 'rules' ? 'on' : ''}" aria-selected="${seg === 'rules'}">规则</button>
    <button role="tab" data-act="seg" data-href="${tlHref}" class="${seg === 'timeline' ? 'on' : ''}" aria-selected="${seg === 'timeline'}">时间线</button></div>`;

  let content: Raw;
  if (seg === 'timeline' || noRules) {
    // The phase bar's drawn width: the card less its padding and the cut-off conference block.
    const trackPx = Math.min(innerWidth, 480) - 64 - 72;
    content = html`${CH.phaseHtml(TL.phaseBands(ed, t, trackPx))}${phaseList(ed, t)}${pastData(ed)}`;
  } else if (!rules.length) {
    const alt = relatedRules(ed);
    const altRow = alt
      ? group(
          html`<a class="row two" href="#/venue/${alt.edition.id}"><div class="main"><div class="t accent">${alt.title}</div><div class="s"><span>${alt.sub}</span></div></div>${chev}</a>`,
          'mt8',
        )
      : '';
    // A venue reached through ARR (NAACL 2027) does have rules: the cycle's. Say that first.
    content =
      alt?.edition.kind === 'arr_cycle'
        ? html`${altRow}<p class="note">${L.editionShort(ed)} 自己的规则未收录。</p>`
        : html`<div class="group empty none"><p class="none-t">规则未收录</p><p>这一届的投稿规则还没整理成卡片。</p></div>${altRow}`;
  } else {
    content = html`${L.TOPICS.map((topic) => {
      const rs = rules.filter((r) => L.topicOf(r.family).id === topic.id).sort(byAnswer);
      return rs.length ? html`${cap(topic.name)}${group(rs.map((r) => ruleRow(r, ed, true)))}` : '';
    })}`;
  }
  const form = SUBMISSION_ZH[ed.submission_type ?? ''];
  const fed = ed.federated_with;
  const noRulesNote = noRules ? html`<p class="note">规则未收录 · 这一届的投稿规则还没整理成卡片</p>` : '';
  // A conference's city and days are in the place block below; the line under the name keeps the badges.
  const tagsHtml = html`${form ? tag(form, 'form') : ''}${badges(ed, getDirs() ?? [], B.MAX_BADGES, 'hd')}`;
  const subTags = ed.kind === 'conference' ? (tagsHtml.s ? tagsHtml : '') : html`${venueSub(ed)}${tagsHtml}`;
  return {
    title: ed.name,
    tab: 'venues',
    body: html`<header class="large-head"><h1>${swatch(ed.series)}${ed.name}</h1>${subTags ? html`<p class="sub sub-tags">${subTags}</p>` : ''}${
      fed ? html`<p class="sub fed">${fed.url ? html`<a href="${fed.url}" target="_blank" rel="noopener">在 ${fed.name} 内举办 ↗</a>` : `在 ${fed.name} 内举办`}</p>` : ''
    }</header>
      ${placeCard(ed)}${banner}${nextCard(ed)}${nextEditionRow(ed, t)}${noRules ? '' : segHtml}${content}${noRulesNote}
      ${group(html`<a class="row" href="#/venue/${ed.id}/info"><span class="t">${noRules ? '关于这些数据' : '关于时间和规则的数据'}</span>${chev}</a>`, 'mt')}`,
  };
}

/**
 * A series the data holds no edition of (CRYPTO, most CCF C venues): its
 * names and badges, that its dates are not collected, and where to look.
 * #/series/<id>. A series with editions goes to its edition page.
 */
function screenSeries(id: string): View {
  const s = SERIES_BY_ID.get(id);
  if (!s) return notFound('venues');
  const ed = rowEdition(s);
  if (ed) return screenVenue(ed.id, '');
  const n = NAMES.get(id);
  const pref = R.rankOf(getPrefs() ?? NO_PREFS, id);
  const dirs = s.directions.map((d) => TX.dirShort(TAX, d)).join(' · ');
  return {
    title: s.name,
    tab: 'venues',
    body: html`<header class="large-head"><h1>${swatch(id)}${s.name}</h1>${n?.name_zh ? html`<p class="sub">${n.name_zh}</p>` : ''}${
      n?.full_name ? html`<p class="sub">${n.full_name}</p>` : ''
    }<p class="sub sub-tags"><span>${dirs}</span>${badges(rankedSeries(s), getDirs() ?? [], B.MAX_BADGES, 'hd')}</p></header>
      <div class="next-card muted"><div class="main"><div class="k">下一届</div><div class="t">日期暂未收录</div><div class="s"><span>本应用还没有收录这个会任何一届的日期，请看会议官网。</span></div></div></div>
      ${group(
        html`${n?.dblp ? html`<a class="row" href="https://dblp.org/db/${n.dblp}/" target="_blank" rel="noopener"><span class="t">往届论文（dblp）</span><span class="val">↗</span></a>` : ''}
        <a class="row" href="#/me/prefs"><span class="t">${pref ? `已在${pref.tier === 'first' ? '首选' : '备选'} · 调整投稿偏好` : '加到投稿偏好'}</span>${chev}</a>`,
        'mt16',
      )}
      <p class="note">能搜到它，是因为它在推荐目录里（点上面的等级看是哪一份）。有了日期后，它会和其他会议一样出现在「下一步」和时间线里。</p>`,
  };
}

/** How papers are submitted, when the venue says so and it is not the usual full paper. */
const SUBMISSION_ZH: Record<string, string> = { abstract: '只交摘要', extended_abstract: '扩展摘要' };

function screenMe(): View {
  const t = now();
  const papers = getPapers();
  const prefs = getPrefs() ?? NO_PREFS;
  const lastChecked = DATA.rules.map((r) => r.last_checked).sort().at(-1) ?? '';
  const paperRows = papers.map((p) => {
    // An accepted paper: 已录用 and its 下一件事.
    const trip = tripOf(p);
    if (trip) {
      const n = T.nextStep(trip.steps, t);
      const line = 'step' in n ? `${n.step.action}${T.stepRelative(n.step, t) ? ` · ${T.stepRelative(n.step, t)}` : ''}` : 'allDone' in n ? '都办完了' : '等官方公布日期';
      return html`<a class="row two" href="#/me/paper/${p.id}">
      <div class="main"><div class="t"><span class="b">${p.name}</span> · ${L.editionShort(trip.edition)}${tag('已录用', 'ok')}</div>
      <div class="s"><span>${line}</span></div></div>${chev}</a>`;
    }
    // The venue the paper is at or heading to: the route's first stop.
    const ed = paperRoute(p).stops[0]?.entry.edition;
    const n = ed && nextOf(ed);
    return html`<a class="row two" href="#/me/paper/${p.id}">
      <div class="main"><div class="t"><span class="b">${p.name}</span>${ed ? ` · ${L.editionShort(ed)}` : ''}</div>
      <div class="s">${
        n
          ? html`<span>${L.milestoneShort(n.milestone)} · ${L.upcomingRelative(n, t)}</span>${statusTag(n.milestone)}`
          : html`<span>${ed ? '本届节点都已过去' : '还没有投稿路线'}</span>`
      }</div></div>${chev}</a>`;
  });
  const prefsVal = prefs.first.length ? `首选 ${prefs.first.length}${prefs.backup.length ? ` · 备选 ${prefs.backup.length}` : ''}` : '未设置';
  return {
    title: '我的',
    tab: 'me',
    root: true,
    body: html`<header class="large-head"><h1>我的</h1></header>
      <div class="h2-row">${h2('我的论文')}<a class="icon-btn" href="#/me/paper/new" aria-label="添加论文">${icon.plus}</a></div>
      ${
        papers.length
          ? group(paperRows)
          : emptyState('添加论文，排出它的投稿路线和现在还能改什么。', '添加一篇论文', '#/me/paper/new')
      }
      ${h2('偏好')}
      ${group(html`<a class="row" href="#/me/prefs"><span class="t">投稿偏好</span><span class="val">${prefsVal}</span>${chev}</a>
        ${papers.some((p) => p.accepted) ? html`<a class="row" href="#/me/trip"><span class="t">出行设置</span><span class="val">${tripVal()}</span>${chev}</a>` : ''}`)}
      ${h2('关于')}
      ${group(html`
        <a class="row" href="#/me/answers"><span class="t">答案含义说明</span>${chev}</a>
        <a class="row" href="#/me/install"><span class="t">添加到主屏幕</span>${chev}</a>
        <a class="row" href="all-rules.html"><span class="t">全部规则（桌面版）</span>${chev}</a>
        <a class="row" href="#/me/legal"><span class="t">版权与第三方数据</span>${chev}</a>`)}
      <p class="fine">仅供参考，以官网为准<br>规则核对于 ${lastChecked ? L.md(lastChecked) : '—'} · 数据版本 ${DATA.bundle_hash.slice(0, 7)}</p>`,
  };
}

/** "学生 · 审批 40 个工作日" for 我的 → 出行设置 (shown once a paper is accepted; before that it is reached from nowhere it matters). */
function tripVal(): string {
  const s = getTrip();
  return `${T.IDENTITY_ZH[s.identity]}${s.approval ? ` · 审批 ${s.leadDays} 个工作日` : ''}`;
}

/** 投稿偏好 (§9.2): the first-run picker plus ↑↓. The followed venues are exactly these. */
function screenPrefs(): View {
  return {
    title: '投稿偏好',
    tab: 'me',
    body: html`<header class="large-head"><h1>投稿偏好</h1><p class="sub">关注的会议就是这里的首选和备选。给论文选目标会议时，它们排在最前，也按这个顺序定优先级。</p></header>
      ${prefsEditor('global', getDirs() ?? DEFAULT_DIRS, getPrefs() ?? NO_PREFS)}`,
  };
}

function screenAnswers(): View {
  const answers: Answer[] = ['allowed', 'not_allowed', 'required', 'conditional', 'contradictory', 'unspecified', 'not_required'];
  return {
    title: '答案含义',
    tab: 'me',
    body: html`<header class="large-head"><h1>答案含义</h1></header>
      ${group(answers.map((a) => html`<div class="row legend"><span class="ans left a-${a}">${L.ANSWER_WORD[a]}</span><div class="main"><div class="s wrap">${L.ANSWER_MEANING[a]}</div></div></div>`))}
      ${cap('标签')}
      ${group(html`
        <div class="row legend"><span class="left">${tag('沿用')}</span><div class="main"><div class="s wrap">新一届规则还没公布，按上一届推断，可能会变。</div></div></div>
        <div class="row legend"><span class="left">${tag('预计')}</span><div class="main"><div class="s wrap">日期是根据往年或官方草案推算的。</div></div></div>
        <div class="row legend"><span class="left">${tag('待公布')}</span><div class="main"><div class="s wrap">官方还没给出时间。</div></div></div>`)}
      ${cap('时间')}
      ${group(html`<div class="row legend"><div class="main"><div class="s wrap">所有时刻都换算成北京时间。官方只给日期时，只显示日期，不编造时刻。AoE（Anywhere on Earth，UTC−12）的 23:59 是北京时间第二天 19:59。</div></div></div>`)}`,
  };
}

let installPrompt: (Event & { prompt?: () => Promise<void> }) | null = null;
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});

function screenInstall(): View {
  const standalone = matchMedia('(display-mode: standalone)').matches;
  return {
    title: '添加到主屏幕',
    tab: 'me',
    body: html`<header class="large-head"><h1>添加到主屏幕</h1><p class="sub">像 App 一样打开，离线也能看。</p></header>
      ${standalone ? html`<p class="note">已经在主屏幕上了。</p>` : ''}
      ${installPrompt ? html`<div class="pad"><button class="btn" data-act="install">安装到主屏幕</button></div>` : ''}
      ${cap('iPhone（Safari）')}
      ${group(html`<div class="row"><span class="step">1</span><span class="t">点底部的“分享”按钮</span></div>
        <div class="row"><span class="step">2</span><span class="t">选“添加到主屏幕”</span></div>`)}
      ${cap('安卓（Chrome）')}
      ${group(html`<div class="row"><span class="step">1</span><span class="t">点右上角的 ⋮ 菜单</span></div>
        <div class="row"><span class="step">2</span><span class="t">选“安装应用”或“添加到主屏幕”</span></div>`)}`,
  };
}

/** The open data the app reuses (NOTICE): the source, what it gives, its licence. */
const THIRD_PARTY: { name: string; what: string; license: string; href: string }[] = [
  { name: 'ccfddl', what: '标“未核对”的截止日期、时区和地点', license: 'MIT', href: 'https://github.com/ccfddl/ccf-deadlines' },
  { name: 'lixin4ever', what: '标“第三方”的往年录用数', license: 'MIT', href: 'https://github.com/lixin4ever/Conference-Acceptance-Rate' },
  { name: 'ACL Anthology', what: 'ACL 2023 分领域投稿和录用数', license: 'CC BY 4.0', href: 'https://aclanthology.org/' },
  { name: 'dblp', what: '主题排名用到的录用论文标题', license: 'CC0', href: 'https://dblp.org/' },
];

/** Where the source is: AGPL-3.0 §13 asks a hosted copy to offer it to its users. */
const SOURCE_URL = 'https://github.com/ziziphus-jujuba-zao/NextVenue';

/**
 * 版权与第三方数据: the code is AGPL and its own data CC BY-SA, with a link to
 * the source; the open data it reuses keeps its own licence, and NOTICE
 * (inlined at build) ships with it as MIT and CC BY require.
 */
function screenLegal(): View {
  return {
    title: '版权与第三方数据',
    tab: 'me',
    body: html`<header class="large-head"><h1>版权与第三方数据</h1><p class="sub">© 2026 Zayier Xie。代码按 AGPL-3.0 开源，自己整理的数据按 CC BY-SA 4.0 授权；“投稿下一站”“NextVenue”名称和图标不在授权范围内。</p></header>
      ${group(html`<a class="row two" href="${SOURCE_URL}" target="_blank" rel="noopener"><div class="main"><div class="t">源代码</div><div class="s wrap"><span>GitHub 公开仓库</span></div></div><span class="val">AGPL-3.0 ↗</span></a>`)}
      ${cap('用到的第三方数据，按各自的许可证使用')}
      ${group(
        THIRD_PARTY.map(
          (t) =>
            html`<a class="row two" href="${t.href}" target="_blank" rel="noopener"><div class="main"><div class="t">${t.name}</div><div class="s wrap"><span>${t.what}</span></div></div><span class="val">${t.license} ↗</span></a>`,
        ),
      )}
      <p class="note">会议等级标签取自 CCF、中国人工智能学会和中国科协的目录，只标等级并注明目录和版次，不转载目录本身。规则卡里的官网原句版权归各会议所有，仅作引用。</p>
      ${DATA.notice ? html`${cap('许可证全文')}<pre class="notice">${DATA.notice}</pre>` : ''}`,
  };
}

/**
 * 目标会议 on the paper page, under the route: the targets in their saved
 * priority order, each with its next open deadline, then 修改目标会议.
 */
function targetsGroup(p: Paper): Raw {
  const rows = p.targets.flatMap((id, i) => {
    const s = SERIES_BY_ID.get(id);
    if (!s) return [];
    return [html`<a class="row two pick tgt on" href="${seriesHref(s)}">${targetInner(s, i + 1, p.dirs)}${chev}</a>`];
  });
  return html`${h2('目标会议')}
    ${group(html`${rows}<a class="row" href="#/me/paper/${p.id}/targets"><span class="t accent">${p.targets.length ? '修改目标会议' : '选择目标会议'}</span><span class="val">${p.targets.length} / ${R.MAX_TARGETS}</span>${chev}</a>`)}`;
}

/**
 * 论文详情 (§9.4, §9.7): the route first (the answer), then the targets it
 * comes from (修改 there); then where the paper is submitted; then the next
 * milestone and "现在的状态" of the route's first stop.
 */
function screenPaper(id: string): View {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return notFound('me');
  const accepted = tripOf(p);
  if (accepted) return screenAccepted(p, accepted);
  const t = now();
  const ask = T.acceptPrompt(p, EDITIONS, t);
  const route = paperRoute(p);
  const unplaced = R.unplacedTargets(route, p.targets, SERIES, t);
  const first = route.stops[0];
  const ed = first?.entry.edition;
  const current = first?.current ? L.editionShort(first.entry.edition) : '无';
  // A venue reached through ARR (NAACL 2027) has no cards of its own; the ARR cycle's rules are the ones that apply.
  const ruleEd = ed && (rulesOf(ed.id).length ? ed : (arrCycleOf(ed) ?? ed));
  // Lock rows are named by the action ("改 PDF 还可以 · 至 9/26"), others by their list label.
  const rows = ruleEd
    ? L.paperRows(rulesOf(ruleEd.id), ruleEd, t).map(
        ({ rule: r, status: s }) => html`<a class="row two" href="#/rule/${r.id}"><div class="main"><div class="t wrap">${s.label ?? r.short_zh ?? r.question_zh}</div>
      <div class="s"><span>${s.line}</span></div></div><span class="ans st-${s.tone}">${s.word}</span>${chev}</a>`,
      )
    : [];
  const noCards = !!ruleEd && !rulesOf(ruleEd.id).length;
  const stateNote = !ruleEd ? '' : noCards ? `${L.editionShort(ruleEd)} 的规则未收录。` : '这个会议目前没有带时间范围的规则。';
  // Nothing to list: somewhere to go instead (the previous edition's cards, the timeline).
  const alt = ed && noCards ? relatedRules(ed) : undefined;
  const noRowsLinks =
    ed && noCards
      ? group(
          html`${alt ? html`<a class="row" href="#/venue/${alt.edition.id}"><span class="t">${alt.title}</span>${chev}</a>` : ''}
          <a class="row" href="#/venue/${ed.id}/timeline"><span class="t">${L.editionShort(ed)} 时间线</span>${chev}</a>`,
          'mt8',
        )
      : '';
  return {
    title: p.name,
    tab: 'me',
    body: html`<header class="large-head"><h1>${p.name}</h1><p class="sub">${p.dirs.map((d) => TX.dirShort(TAX, d)).join(' · ')}</p></header>
      ${ask ? askCard(p, ask) : ''}
      <div class="h2-block">${h2('投稿路线')}<p class="h2-cap">按截止先后投，没中再投下一站；撞期时留优先级高的</p></div>
      ${routeCard(route, p, unplaced)}
      ${targetsGroup(p)}
      ${group(
        html`<a class="row" href="#/me/paper/${p.id}/current"><span class="t">在投</span><span class="val">${current}</span>${chev}</a>${
          ask ? '' : html`<a class="row" href="#/me/paper/${p.id}/accept"><span class="t accent">标记为已录用</span>${chev}</a>`
        }`,
        'mt16',
      )}
      ${
        ed
          ? html`${nextCard(ed, `${L.editionShort(ed)} · 下一个节点`)}
        ${h2('现在的状态', html`<span class="h2-sub">${L.editionShort(ed)}</span>`)}
        ${ruleEd && ruleEd !== ed ? html`<p class="cap">按 ${ruleEd.name}的规则</p>` : ''}
        ${rows.length ? group(rows) : html`<p class="note">${stateNote}</p>${noRowsLinks}`}`
          : ''
      }
      ${group(html`<button class="row danger" data-act="delete-paper" data-id="${p.id}"><span class="t">删除这篇论文</span></button>`, 'mt')}`,
  };
}

// ---------- after acceptance (§10): the paper page, venue, visa, 出行设置 ----------

/** The trip of an accepted paper: checklist, D and R, the site, the visa plan. */
function tripOf(p: Paper): T.Trip | undefined {
  const ed = p.accepted && ED.get(p.accepted.edition);
  return ed ? T.tripSteps(p, ed, rulesOf(ed.id), VISA, getTrip(), CAL, now()) : undefined;
}

const stepHref = (p: Paper, s: T.Step, trip: T.Trip) =>
  s.id === 'conference'
    ? `#/me/paper/${p.id}/venue`
    : s.id === 'visa' && trip.visa.regime
      ? `#/visa/${trip.visa.regimeId}/${p.id}`
      : `#/me/paper/${p.id}/step/${s.id}`;

const stepTag = (s: T.Step) => (s.tag === 'none' ? '' : tag(T.TAG_ZH[s.tag], `t-${s.tag}`));

/**
 * The step's one outward button, the same on the card and in its sheet:
 * where the task is done ("去注册 ↗", "去申请 ↗"), else the official
 * sentence behind it ("查看官网原句 ↗": 会场意向表 is mailed to authors,
 * there is no page to fill it in).
 */
function stepGo(s: T.Step): { url: string; label: string } | undefined {
  if (s.link) return { url: s.link, label: s.linkLabel ?? '去官网 ↗' };
  if (s.src) return { url: s.src, label: '查看官网原句 ↗' };
  return undefined;
}

/** The Chinese holiday a step's day falls in: "· 国庆假期". */
function holidayOf(s: T.Step): string | undefined {
  const at = s.at;
  if (!at) return undefined;
  return T.holidayText(at.local.includes('T') ? at.beijing.slice(0, 10) : at.local.slice(0, 10), CAL);
}

/** "分配后换会场或报告人 不能": a step's first rule as label + answer word. */
function consequence(s: T.Step): Raw | '' {
  const r = s.rules.find((x) => x.short_zh);
  return r ? html`<span>${r.short_zh}</span> ${ansWord(r.answer)}` : '';
}

/**
 * "录用了吗？" (§10.1): at the top of the paper page once the result day of
 * its 在投 venue begins; on 下一步 (`named`) it is the main card, with the
 * same two answers, so marking takes 2 taps from launch.
 */
function askCard(p: Paper, ask: T.AcceptPrompt, named = false): Raw {
  const ed = ask.edition;
  const at = ask.milestone.at_resolved!;
  return html`<section class="ask" aria-label="录用了吗">
    <p class="ask-k">${named ? html`<b>${p.name}</b> · ` : ''}${L.editionShort(ed)} ${L.isAbstractOnly(ed) ? (ask.over ? '已出摘要结果' : '摘要出结果日') : ask.over ? '已出结果' : '出结果日'}${
      named ? '' : ` · 官方 ${L.md(at.local)}${at.local.includes('T') ? '' : ` ${L.tzLabel(ask.milestone.tz)}`}`
    }</p>
    <h2 class="ask-t">录用了吗？</h2>
    <div class="ask-b"><button class="btn" data-act="accept-yes" data-id="${p.id}">录用了</button><button class="btn ghost" data-act="accept-no" data-id="${p.id}">没中</button></div>
    <button class="ask-later" data-act="accept-later" data-id="${p.id}">还没看到</button></section>`;
}

/**
 * 分到哪？ (§10.1): once a multi-site venue has assigned the sites and until
 * the user says where this paper went. One tap re-works the checklist (visa,
 * registration, school approval) for that site.
 */
function assignCard(p: Paper, trip: T.Trip, at: ResolvedTime, named = false): Raw {
  const ed = trip.edition;
  const sites = ed.sites ?? [];
  // All three look the same: the answer is the organizer's, not the one asked for.
  return html`<section class="ask" aria-label="分到哪个会场">
    <p class="ask-k">${named ? html`<b>${p.name}</b> · ` : ''}${L.seriesName(ed)} ${T.shortTime(at)} 已公布分配</p>
    <h2 class="ask-t">分到哪？</h2>
    <div class="ask-b sites">${sites.map(
      (x) => html`<button class="btn ghost" data-act="set-assigned" data-id="${p.id}" data-value="${x.id}">${T.siteCity(x)}</button>`,
    )}</div>
    <p class="ask-note">按主办方发来的分配结果点，清单会按那个会场重算</p></section>`;
}

/**
 * 下一件事 (§10.3), the page's only card: the step, a big countdown (red
 * "已过 N 天" when an official deadline passed; working days for 学校审批),
 * the Beijing time and any Chinese holiday it falls in, the rule behind it,
 * then its one outward button and 已完成. On 下一步 (`named`) it starts with
 * the paper. A multi-site venue that has assigned the sites asks 分到哪 first.
 */
function taskCard(p: Paper, trip: T.Trip, named = false): Raw {
  const t = now();
  const assign = T.assignPrompt(p, trip.edition, t);
  if (assign) return assignCard(p, trip, assign, named);
  const n = T.nextStep(trip.steps, t);
  const k = named ? html`<p class="task-k"><b>${p.name}</b> · ${L.editionShort(trip.edition)}</p>` : '';
  // On 下一步 the quiet cards open the paper; on the paper page they are just text.
  const quiet = (inner: Raw) =>
    named ? html`<a class="task all-done" href="#/me/paper/${p.id}"><div class="task-main">${k}${inner}</div></a>` : html`<div class="task all-done"><div class="task-main">${inner}</div></div>`;
  if ('allDone' in n) {
    const c = n.conference;
    return quiet(html`<div class="hero-k"><span class="hero-name">都办完了</span></div>
      ${c && c.range ? html`<div class="when">${T.stepWhen(c, t)} ${c.suffix ?? ''}开会</div>` : ''}`);
  }
  if ('waiting' in n)
    return quiet(html`<div class="hero-k"><span class="hero-name">暂时没有要办的</span></div>
      <div class="when">${n.waiting.map((s) => s.name.replace(/^提交/, '')).join('、')}的日期官方还没公布</div>`);
  const s = n.step;
  const href = named ? `#/me/paper/${p.id}` : stepHref(p, s, trip);
  const late = n.overdue && s.target;
  const parts = s.target && !s.past ? L.countdown(s.target, t) : [];
  const days = s.target ? L.dayDiff(L.beijingDate(t), s.target.date) : 0;
  const count = late
    ? html`<b class="w late">已过 ${Math.max(days, 1)} 天</b>`
    : s.workdays !== undefined && s.workdays > 0
      ? html`<b>${s.workdays}</b><i>个工作日</i>`
      : parts.length
        ? countHtml(parts)
        : html`<b class="w">${s.text ?? ''}</b>`;
  const hol = holidayOf(s);
  const csq = consequence(s);
  const go = stepGo(s);
  return html`<div class="task${late ? ' is-late' : ''}"><a class="task-main" href="${href}">${k}
      <div class="hero-k"><span class="hero-name">${s.action}${s.suffix ? html`<span class="sfx"> · ${s.suffix}</span>` : ''}</span>${chev}</div>
      <div class="count">${count}</div>
      ${s.at || s.range ? html`<div class="when">${T.stepWhen(s, t)}${s.at?.local.includes('T') ? html`<span class="lbl">北京时间</span>` : ''}${hol ? html`<span class="hol"> · ${hol}</span>` : ''}</div>` : ''}
      ${csq ? html`<div class="after">${csq}</div>` : ''}</a>
    <div class="task-b">${
      go ? html`<a class="btn small" href="${go.url}" target="_blank" rel="noopener">${go.label}</a>` : html`<a class="btn small" href="${stepHref(p, s, trip)}">看详情</a>`
    }<button class="btn-text" data-act="step-done" data-id="${p.id}" data-step="${s.id}">已完成</button></div></div>`;
}

/** One checklist row (§10.4): ○ / ✓ / red dot, the step, its day and one tag, the relative time. */
function stepRow(p: Paper, s: T.Step, trip: T.Trip): Raw {
  const t = now();
  const rel = T.stepRelative(s, t);
  const lateRel = !s.done && s.past && !s.conditional && !s.optional && !s.closed;
  const soon = !s.done && !s.past && s.tag === 'hard' && !!s.target && L.dayDiff(s.target.date, L.beijingDate(t)) <= 7;
  const dated = !!(s.at || s.range);
  const line = s.tag === 'tba' ? stepTag(s) : html`<span>${dated ? T.stepWhen(s, t) : (s.text ?? '')}</span>${dated ? stepTag(s) : ''}`;
  const state = s.skipped ? '不申请' : s.done ? '已完成' : s.overdue ? '已过截止' : '未完成';
  const quiet = s.skipped ? '不申请' : s.auto;
  return html`<div class="row two step-row${s.done ? ' is-done' : ''}${s.skipped ? ' is-skip' : ''}${s.overdue ? ' is-late' : ''}">
    <button class="ck" data-act="toggle-done" data-id="${p.id}" data-step="${s.id}" role="checkbox" aria-checked="${s.done}" aria-label="${s.name}：${state}">${
      s.done && !s.skipped ? icon.check : ''
    }</button>
    <a class="step-main" href="${stepHref(p, s, trip)}"><div class="main">
      <div class="t">${s.name}${s.suffix ? html`<span class="sfx"> · ${s.suffix}</span>` : ''}</div>
      <div class="s">${line}${s.alert ? html`<span class="csq a-not_allowed">${s.alert}</span>` : ''}${quiet ? html`<span class="csq quiet">${quiet}</span>` : ''}</div>
      ${s.note && !s.done ? html`<div class="s sub2"><span>${s.note}</span></div>` : ''}
    </div>${rel && !s.done ? html`<span class="rel${lateRel ? ' late' : soon ? ' soon' : ''}">${rel}</span>` : ''}${chev}</a></div>`;
}

/** Papers whose 已完成 fold is open (kept across redraws, e.g. after ticking a step). */
const doneOpen = new Set<string>();

/**
 * 清单 (§10.4): 出发前 / 在外 / 回国后, by date, about 7 rows. Steps only
 * for when something goes wrong (全额退款截止, 拒签退款申请) are not rows:
 * they are in the 作者注册 sheet and the visa page, and in the calendar file.
 * Steps the venue has not dated share one grey line ("终稿、海报：待公布").
 * Ticked steps, and those that no longer matter (a closed form, an optional
 * deadline that passed), fold into one row at the end.
 */
function checklist(p: Paper, trip: T.Trip): Raw {
  const folded = (s: T.Step) => s.done || !!s.closed || (s.past && s.optional);
  const out: Raw[] = [];
  for (const g of ['before', 'away', 'after'] as T.StepGroup[]) {
    const list = trip.steps.filter((s) => s.group === g && !folded(s) && !s.conditional);
    const tba = list.filter((s) => s.tag === 'tba');
    const rows = list.filter((s) => s.tag !== 'tba').map((s) => stepRow(p, s, trip));
    if (tba.length)
      rows.push(html`<div class="row tba-line"><span class="t">${tba.map((s) => s.name.replace(/^提交/, '')).join('、')}：待公布</span></div>`);
    if (rows.length) out.push(html`${cap(T.GROUP_ZH[g])}${group(rows, 'steps')}`);
  }
  const rest = trip.steps.filter((s) => folded(s) && !s.conditional);
  if (rest.length) {
    const past = rest.some((s) => !s.done);
    out.push(
      html`<details class="group steps done-fold mt16" data-paper="${p.id}"${doneOpen.has(p.id) ? ' open' : ''}><summary><span>${past ? '已完成或已过' : '已完成'} ${rest.length} 项</span>${icon.down}</summary>${rest.map(
        (s) => stepRow(p, s, trip),
      )}</details>`,
    );
  }
  return html`${out}`;
}

/** "你报告 · 意向悉尼 · 出发 12/5 ✎" under the title. */
function tripLine(p: Paper, trip: T.Trip): string {
  const t = now();
  const parts = [trip.presenter === 'me' ? '你报告' : '合作者报告'];
  if (trip.edition.sites?.length && trip.site)
    parts.push(`${p.assigned ? '分配到' : p.site ? '意向' : '意向未选 · 按'}${T.siteCity(trip.site)}`);
  if (trip.D && trip.presenter === 'me') parts.push(`出发 ${T.dayShort(trip.D, t)}`);
  return parts.join(' · ');
}

/**
 * 论文详情 once accepted (§10.2), four blocks: the title (已录用 · venue,
 * who presents, the site, departure ✎); the 下一件事 card; the checklist;
 * 加入日历 and 出行设置. The route is folded away below, then 删除.
 */
function screenAccepted(p: Paper, trip: T.Trip): View {
  const t = now();
  const ed = trip.edition;
  const changed = T.calChanged(p.cal, trip.steps);
  const n = T.exportable(trip.steps).length;
  const route = paperRoute(p);
  return {
    title: p.name,
    tab: 'me',
    navRight: html`<button class="nav-more" data-act="paper-more" data-id="${p.id}" aria-label="更多">${icon.more}</button>`,
    body: html`<header class="large-head"><h1>${p.name}</h1>
        <p class="sub acc">${tag('已录用', 'ok')}<span>${L.editionShort(ed)}</span></p>
        <a class="sub trip-line" href="#/me/trip/${p.id}"><span>${tripLine(p, trip)}</span>${icon.pen}</a></header>
      ${
        changed.length
          ? html`<button class="banner cal-banner" data-act="export-ics" data-id="${p.id}"><span>${changed.length} 个日期变了，重新导出日历</span>${chev}</button>`
          : ''
      }
      ${cap('下一件事')}${taskCard(p, trip)}
      ${checklist(p, trip)}
      ${group(
        html`<button class="row" data-act="export-ics" data-id="${p.id}">${icon.cal}<span class="t">加入日历</span><span class="val">${n} 项</span>${chev}</button>
        <a class="row" href="#/me/trip/${p.id}">${icon.gear}<span class="t">出行设置</span>${chev}</a>`,
        'mt links',
      )}
      <p class="fine">建议、按设置、预计的日期是本应用算的，不是官方截止<br>数据核对于 ${L.md(ed.last_checked)} · 以官网为准</p>
      <details class="route-fold"><summary><span>投稿路线（已录用，不再需要）</span>${icon.down}</summary>${routeCard(route, p, R.unplacedTargets(route, p.targets, SERIES, t))}</details>
      ${group(html`<button class="row danger" data-act="delete-paper" data-id="${p.id}"><span class="t">删除这篇论文</span></button>`, 'mt')}`,
  };
}

/** A labelled line of a detail page: label on the left, value (and a link) on the right. */
const infoRow = (k: string, v: Raw | string, href?: string, sub?: string) =>
  href
    ? html`<a class="row info${sub ? ' two' : ''}" href="${href}"${href.startsWith('http') ? html` target="_blank" rel="noopener"` : ''}><span class="k">${k}</span><div class="main"><div class="v">${v}</div>${
        sub ? html`<div class="s wrap">${sub}</div>` : ''
      }</div>${href.startsWith('http') ? html`<span class="ext">↗</span>` : chev}</a>`
    : html`<div class="row info${sub ? ' two' : ''}"><span class="k">${k}</span><div class="main"><div class="v">${v}</div>${sub ? html`<div class="s wrap">${sub}</div>` : ''}</div></div>`;

/** The first sentence of a note ("官网没有给参会者的场馆地址。"); the rest stays on the official page. */
const firstSentence = (s: string | undefined) => (s ? s.slice(0, s.indexOf('。') + 1 || s.length) : undefined);

/** "正会 12/8–10，Workshop 12/11–12" from a site's conference label ("悉尼：Expo 12/6，…"). */
const programOf = (m: AppMilestone | undefined) => (m?.label_zh?.includes('：') ? m.label_zh.split('：')[1] : undefined);

/** The in-person rule of an edition (effect requires in_person_presentation), for "现场报告 必须 ›". */
const inPersonRule = (ed: AppEdition) =>
  rulesOf(ed.id).find((r) => r.family === 'presentation' && r.effect?.kind === 'requires') ?? rulesOf(ed.id).find((r) => r.family === 'presentation');

/**
 * 会场详情 (§10.6), from the 开会 row: the place, the days (and the program
 * by day), the time difference with Beijing during those days, and whether
 * someone must present in person. A multi-site edition before its
 * assignment lists every site under "X 公布分配".
 */
function screenPaperVenue(id: string): View {
  const p = getPapers().find((x) => x.id === id);
  const trip = p && tripOf(p);
  if (!p || !trip) return notFound('me');
  const t = now();
  const ed = trip.edition;
  const site = trip.site;
  const venue = site?.venue ?? ed.logistics?.venue;
  const days = trip.days;
  const venueName = venue && !isTba(venue) ? venue.name : undefined;
  const addr = venue && !isTba(venue) ? venue : undefined;
  const city = T.cityOf(ed, site);
  const rule = inPersonRule(ed);
  const assign = T.siteMilestone(ed, 'site_assignment');
  const assignAt = assign && assign.status !== 'tba' ? assign.at_resolved : undefined;
  const beforeAssign = !!ed.sites?.length && !p.assigned && (!assignAt || Date.parse(assignAt.utc) > t);
  const tz = site?.tz ?? days?.milestone?.tz;
  const offset = tz && days ? T.tzOffsetText(tz, days.start, days.end) : undefined;
  const sold = (ed.logistics?.sold_out ?? []).filter((x) => !x.site || x.site === site?.id);
  const siteRow = (s: NonNullable<AppEdition['sites']>[number]) => {
    const d = T.conferenceDays(ed, s.id);
    const v = s.venue && !isTba(s.venue) ? s.venue.name : '';
    const mine = s.id === site?.id;
    return html`<div class="row two"><div class="main"><div class="t"><span class="b">${T.siteCity(s)}</span>${v ? html`<span class="yr">${v}</span>` : ''}${
      mine ? tag(p.assigned ? '分配到' : '意向', 'ok') : ''
    }</div><div class="s"><span>${d ? `${L.md(d.start)}–${L.md(d.end)}` : '会期待公布'} · ${d ? T.tzOffsetText(s.tz, d.start, d.end) : ''}</span></div></div></div>`;
  };
  const links = (ed.logistics?.links ?? []).filter((l) => ['venue', 'registration', 'hotels', 'program'].includes(l.kind) && (!l.site || l.site === site?.id));
  const LINK_ZH: Record<string, string> = { venue: '会场信息', registration: '注册', hotels: '酒店', program: '日程' };
  return {
    title: city || '会场',
    tab: 'me',
    body: html`<header class="large-head"><p class="eyebrow">${L.editionShort(ed)} · 会场</p><h1>${city}${venueName ? html`<span class="h1-sub"> · ${venueName}</span>` : ''}</h1></header>
      ${group(html`
        ${infoRow('地址', addr && addr.address !== 'tba' ? addr.address : html`<span class="dim">待公布</span>`, addr?.link, addr?.address === 'tba' ? firstSentence(addr.note_zh) : undefined)}
        ${infoRow('会期', days ? html`${days.estimated ? '约 ' : ''}${L.md(days.start)}–${L.md(days.end)}` : html`<span class="dim">待公布</span>`, days?.milestone?.deep_link, programOf(days?.milestone))}
        ${offset ? infoRow('时差', offset) : ''}
        ${rule ? infoRow('报告', html`<span class="ansv a-${rule.answer}">${L.ANSWER_WORD[rule.answer]}</span>到现场`, `#/rule/${rule.id}`) : infoRow('报告', html`<span class="dim">未收录</span>`)}`)}
      ${sold.length ? html`<p class="cap-note amber">${site ? `${T.siteCity(site)}` : ''}公众票官方写明已售罄${ed.sites?.length ? '；指定报告作者在分到的会场有保留名额' : ''}。</p>` : ''}
      ${
        ed.sites?.length && beforeAssign
          ? html`${cap(assignAt ? `${T.shortTime(assignAt)} 公布分配 · ${ed.sites.length} 个会场` : `${ed.sites.length} 个会场 · 分配日期待公布`)}${group(ed.sites.map(siteRow))}`
          : ''
      }
      ${links.length ? html`${cap('官网')}${group(links.map((l) => html`<a class="row" href="${l.url}" target="_blank" rel="noopener"><span class="t">${LINK_ZH[l.kind] ?? l.kind}</span><span class="ext">↗</span></a>`))}` : ''}
      <p class="fine">时差按会期那几天算 · 以官网为准</p>`,
  };
}

/** The visa files' names for items ("visa" → 签证费). */
const FEE_ZH: Record<string, string> = {
  visa: '签证费',
  biometrics: '生物信息费',
  evus: 'EVUS 登记费',
  visa_integrity_fee: '签证诚信费',
  service: '服务费',
};
const NEED_ZH: Record<T.VisaNeed, string> = { required: '需要签证', visa_free: '免签', not_needed: '不需要签证', unknown: '未收录' };

/** A fold of a detail page: a summary row that opens its body. */
const fold = (title: string, body: Raw | (Raw | '')[], open = false) =>
  html`<details${open ? ' open' : ''}><summary><span>${title}</span>${icon.down}</summary><div class="fold-body">${body}</div></details>`;

const quoteFig = (q: { quote?: string; link?: string; src_title?: string }) =>
  q.quote ? html`<figure><blockquote lang="en">${q.quote}</blockquote>${q.link ? html`<a href="${q.link}" target="_blank" rel="noopener">${q.src_title ?? '官网原文'} ↗</a>` : ''}</figure>` : '';

/**
 * 签证详情 (§10.6), from the 递交签证 row (with the paper, so the date can be
 * worked out) or on its own. 结论 first, then 建议最晚递交 (or, for the US,
 * the earliest interview per post), 我的状态, and folded details. Only the
 * mainland ordinary passport gets guidance; other passports get the links.
 */
function screenVisa(regimeId: string, paperId: string): View {
  const regime = VISA?.regimes.find((r) => r.id === regimeId);
  if (!regime) return notFound('me');
  const t = now();
  const settings = getTrip();
  const p = paperId ? getPapers().find((x) => x.id === paperId) : undefined;
  const trip = p && tripOf(p);
  const plan = trip && trip.visa.regimeId === regimeId ? trip.visa : undefined;
  const country = plan?.countryZh || regime.name_zh;
  const st = settings.visas[regimeId] ?? {};
  const lead = regime.lead;
  const need = regime.requirement.answer;
  const stale = T.daysSince(regime.last_checked, t) > 30;
  const officialOnly = settings.passport !== 'cn_ordinary';
  const ext = (url: string, label: string) =>
    html`<a class="row" href="${url}" target="_blank" rel="noopener"><span class="t wrap">${label}</span><span class="ext">↗</span></a>`;
  const linkRows = (skipApply: boolean) => [...(regime.apply ?? []).slice(skipApply ? 1 : 0), ...(regime.links ?? [])].map((l) => ext(l.url, l.label_zh));
  // NeurIPS: the visa refund (§10.4 moved it here from the checklist). Before the full-refund
  // cutoff a refused visa is an ordinary cancellation; after it, only with the application in
  // by 10/20, and the request by 12/20.
  const refundLines = (): Raw | '' => {
    if (!plan?.refundApplyBy || !trip) return '';
    const full = T.siteMilestone(trip.edition, 'refund_cutoff', trip.site?.id)?.at_resolved;
    const ask = trip.steps.find((s) => s.id === 'visarefund');
    const rule = ask?.rules[0];
    const fullDay = full ? L.md(full.beijing) : '';
    return html`${full ? html`<p class="s">${fullDay} 前被拒签：按取消注册全额退款</p>` : ''}
      <p class="s cond">${L.md(plan.refundApplyBy.day)} 前递签：${fullDay ? `${fullDay} 后` : ''}被拒签或没出签，可转线上退差价</p>
      ${ask?.at ? html`<p class="s">${rule ? html`<a href="#/rule/${rule.id}">${T.stepWhen(ask, t)} 前申请，附递签日期证明 ›</a>` : `${T.stepWhen(ask, t)} 前申请，附递签日期证明`}</p>` : ''}`;
  };
  let planHtml: Raw | '' = '';
  if (plan && need === 'required' && !officialOnly) {
    if (plan.applyBy) {
      const how = [plan.basis === 'official' ? plan.officialText : plan.organizerText, plan.officialDay && plan.organizerDay ? `另一方：${plan.basis === 'official' ? plan.organizerText : plan.officialText}，${L.md(plan.basis === 'official' ? plan.organizerDay : plan.officialDay)}` : ''].filter(Boolean);
      planHtml = html`<div class="plan"><div class="k">建议最晚递交</div><div class="d">${L.md(plan.applyBy)} ${L.weekday(plan.applyBy)}${tag('建议', 't-advice')}</div>
        ${how.map((x) => html`<p class="s">${x}</p>`)}
        <p class="s">出发 ${L.md(trip!.D!)}${trip!.Dset ? '（你填的）' : '（会议前一天）'}往前算</p>
        ${plan.earliest && plan.earliest > L.beijingDate(t) ? html`<p class="s">最早 ${L.md(plan.earliest)} 起可以递交（官方：出发前 ${regime.window?.earliest?.n} ${regime.window?.earliest?.unit === 'month' ? '个月' : '天'}内）</p>` : ''}
        ${plan.latest ? html`<p class="s">官方最晚：${L.md(plan.latest)}（出发前 ${regime.window?.latest?.n} 天）</p>` : ''}
        ${refundLines()}</div>`;
    } else if (plan.interviews?.length) {
      const first = plan.interviews[0]!;
      planHtml = html`<div class="plan"><div class="k">现在预约，最早约何时面签</div>
        <div class="plain-rows">${plan.interviews.map(
          (i) => html`<div class="row"><span class="t">${i.name_zh}</span><span class="val${i.afterD ? ' late' : ''}">约 ${L.md(i.day)}${i.lt ? '（不到 ' : '（'}${i.months} 个月）</span></div>`,
        )}</div>
        ${first.afterD ? html`<p class="s late">按官方等待时间，${first.name_zh}的面签在出发（${L.md(trip!.D!)}）之后</p>` : ''}
        <p class="s">官方 ${plan.asOf ? L.md(plan.asOf) : ''} 更新的「下一个可约」时间。不倒推递交日。</p>
        ${(lead?.excludes ?? []).map((x) => html`<p class="s">${x.what === 'administrative_processing' ? '不含行政审查的时间。' : x.what === 'passport_return' ? '不含寄回护照的时间。' : ''}</p>`)}
        ${refundLines()}</div>`;
    } else {
      planHtml = html`<div class="plan"><div class="k">建议最晚递交</div><div class="d dim">没有可靠的处理时间</div><p class="s">${lead?.note_zh ?? '官方没有公布处理时间。尽早递交。'}</p>
        ${refundLines()}</div>`;
    }
  }
  // Folds hold only what has an official source; the rest is one line to the application site.
  const verifiedFees = (regime.fees ?? []).filter((f) => f.status !== 'unverified' && f.amount !== undefined);
  const fees = verifiedFees.map(
    (f) =>
      html`<p><span class="k">${FEE_ZH[f.item] ?? f.item}</span>${T.money(f.amount!, f.currency!)}${f.note_zh ? ` · ${f.note_zh}` : ''}${
        f.link ? html` <a href="${f.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''
      }</p>`,
  );
  const docItems = Array.isArray(regime.documents) ? regime.documents : [];
  const docs = docItems.length ? html`<div class="group inset rules-in">${docItems.map((d) => (d.link ? ext(d.link, d.item_zh) : html`<div class="row"><span class="t wrap">${d.item_zh}</span></div>`))}</div>` : '';
  const facts = [
    ...(regime.facts ?? []).map(
      (f) =>
        html`<p><span class="k">${f.label_zh}</span>${f.text_zh ?? (f.status === 'tba' ? '待公布' : '未核实')}${f.note_zh && !f.text_zh ? `：${f.note_zh}` : ''}${
          f.link ? html` <a href="${f.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''
        }</p>`,
    ),
    ...(regime.notices ?? []).map((x) => html`<p>${x.date ? html`<span class="k">${x.date}</span>` : ''}${x.text_zh}${x.link ? html` <a href="${x.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''}</p>`),
  ];
  const transitItems = regime.transit ?? [];
  const transit = transitItems.length
    ? html`<div class="group inset rules-in">${transitItems.map((x) => (x.link ? ext(x.link, x.item_zh) : html`<div class="row"><span class="t wrap">${x.item_zh}</span></div>`))}</div>`
    : '';
  const apply = regime.apply?.[0];
  const applyName = apply ? (/在 (.+?) 在线申请/.exec(apply.label_zh)?.[1] ?? '官方申请页') : undefined;
  const missing = [!fees.length ? '费用' : '', !docs ? '材料' : ''].filter(Boolean).join('和');
  const verdict = need === 'required' ? 'required' : 'allowed';
  const oneLine = !officialOnly && !!missing && !!apply;
  const links = linkRows(oneLine);
  return {
    title: country,
    tab: 'me',
    body: html`<header class="large-head"><p class="eyebrow">签证 · ${settings.passport === 'cn_ordinary' ? '中国大陆普通护照' : settings.passport === 'cn_official' ? '因公护照' : '其他护照'}</p><h1>${country}${
      officialOnly ? '' : html`<span class="h1-sub a-${verdict}"> · ${NEED_ZH[need]}</span>`
    }</h1></header>
      ${
        officialOnly
          ? html`<p class="note">${settings.passport === 'cn_official' ? '因公护照的签证经省外办或学校统一办理，按单位通知走。下面只列官方链接。' : '本应用只整理了中国大陆普通护照的要求。其他护照请直接看官方链接。'}</p>`
          : html`<div class="verdict"><p class="explain">${regime.requirement.visa_zh}${regime.requirement.conditions_zh ? `。${regime.requirement.conditions_zh}` : ''}</p>
        ${regime.requirement.link ? html`<a class="src-link" href="${regime.requirement.link}" target="_blank" rel="noopener">${regime.requirement.src_title ?? '官网原文'} ↗</a>` : ''}</div>`
      }
      ${planHtml}
      ${
        need === 'required' && !officialOnly
          ? html`${cap('我的状态')}${group(html`
        <label class="row setting"><span class="t">我已有有效签证</span><input type="checkbox" class="switch" role="switch" data-set="visa-have" data-id="${regimeId}"${st.have ? ' checked' : ''}></label>
        ${regimeId === 'us' && st.have ? html`<label class="row setting"><span class="t">EVUS 已更新</span><input type="checkbox" class="switch" role="switch" data-set="visa-evus" data-id="${regimeId}"${st.evus ? ' checked' : ''}></label>` : ''}
        <label class="row setting date-row"><span class="t">递签日期</span>${dateField('visa-applied', regimeId, st.applied, '未记录')}</label>`)}
        <p class="cap-note">只存在这台手机上。打开「已有有效签证」后，清单里的递交签证收起。${plan?.refundApplyBy ? '申请拒签退款时要用递签日期。' : ''}</p>`
          : ''
      }
      ${
        officialOnly
          ? ''
          : html`<div class="folds page-folds">
        ${fees.length ? fold('类型和费用', fees) : ''}
        ${docs ? fold('所需材料', docs) : ''}
        ${facts.length ? fold('注意', facts) : ''}
        ${transit ? fold('转机', transit) : ''}
      </div>
      ${oneLine ? group(ext(apply!.url, `${missing}以 ${applyName} 为准`), 'mt16') : ''}`
      }
      ${links.length ? html`${cap('官方链接')}${group(links)}` : ''}
      <p class="fine${stale ? ' stale' : ''}">${stale ? '已超过 30 天未核对，请先看官网' : `以使馆官网为准 · 核对于 ${L.md(regime.last_checked)}`}</p>`,
  };
}

/**
 * A date setting row's value: "12/5 周六" (or "未记录"), with the native date
 * input laid over the whole row, so a tap anywhere opens the picker and an
 * empty field is never invisible (iOS draws nothing for an empty date input).
 */
function dateField(set: string, id: string, value: string | undefined, empty: string): Raw {
  const t = now();
  const text = value ? `${T.dayShort(value, t)} ${L.weekday(value)}` : empty;
  return html`<span class="date-v${value ? '' : ' dim'}">${text}</span><input type="date" class="date-in over" data-set="${set}" data-id="${id}" value="${value ?? ''}" aria-label="${text}">`;
}

/** The 常见要求 examples (data/china/admin.yml) for a topic, closest to the user's identity first. */
function adminExamples(topics: string[], who: 'student' | 'staff', except: string[] = []): Raw {
  const items = ADMIN.filter((i) => topics.includes(i.topic) && (i.who === who || i.who === 'all') && !except.includes(i.id));
  return html`${items.slice(0, 6).map(
    (i) => html`<p><span class="k">${i.org_zh}</span>${i.text_zh}${i.link ? html` <a href="${i.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''}</p>`,
  )}<p class="dim">以本校最新通知为准</p>`;
}

/** "上海交大电院学生 15 个工作日，南科大教职工 40 个工作日": the approval examples for the 出行设置 note, from the data. */
function leadExamples(): string {
  const short = (org: string) =>
    org.replace('上海交通大学 · 电子信息与电气工程学院', '上海交大电院').replace('南方科技大学 · 国际合作部', '南科大').replace(/ · .*$/, '');
  return ADMIN.filter((i) => i.topic === 'approval_lead' && i.unit === 'workday' && i.kind === 'hard' && i.n && i.n >= 10)
    .slice(0, 2)
    .map((i) => `${short(i.org_zh)}${i.who === 'student' ? '学生' : i.who === 'staff' ? '教职工' : ''} ${i.n} 个工作日`)
    .join('，');
}

const US_POSTS = [
  ['beijing', '北京'],
  ['shanghai', '上海'],
  ['guangzhou', '广州'],
  ['shenyang', '沈阳'],
  ['wuhan', '武汉'],
] as const;

/**
 * 出行设置 (§10.7). From an accepted paper it starts with that trip (报告人,
 * 会场意向 and 分配, 出发, 回国); then what holds for every trip. Saved as
 * soon as it changes; nothing here leaves the phone.
 */
function screenTripSettings(paperId: string): View {
  const s = getTrip();
  const t = now();
  const p = paperId ? getPapers().find((x) => x.id === paperId) : undefined;
  const trip = p && tripOf(p);
  const ed = trip?.edition;
  const opt = (v: string, label: string, cur: string | undefined) => html`<option value="${v}"${cur === v ? ' selected' : ''}>${label}</option>`;
  const assign = ed && T.siteMilestone(ed, 'site_assignment');
  const assignOut = !!assign?.at_resolved && Date.parse(assign.at_resolved.utc) <= t;
  // A few usual values (the spec's example, 上海交大电院 15 个工作日, is one tap), always with the current one.
  const choose = (key: string, cur: number, values: number[], unit: string) =>
    html`<select data-set="${key}">${[...new Set([...values, cur])].sort((a, b) => a - b).map((v) => opt(String(v), `${v} ${unit}`, String(cur)))}</select>`;
  const seg = html`<div class="seg mini" role="radiogroup" aria-label="注册身份">${(['student', 'academic', 'industry'] as const).map(
    (k) => html`<button role="radio" data-act="identity" data-id="${k}" class="${s.identity === k ? 'on' : ''}" aria-checked="${s.identity === k}">${T.IDENTITY_ZH[k]}</button>`,
  )}</div>`;
  const paperPart =
    p && trip && ed
      ? html`${cap(`${p.name} · ${L.editionShort(ed)}`)}${group(html`
        <label class="row setting"><span class="t">报告人</span><select data-set="presenter" data-id="${p.id}">${opt('me', '我', p.presenter ?? 'me')}${opt('coauthor', '合作者', p.presenter)}</select></label>
        ${
          ed.sites?.length
            ? html`<label class="row setting"><span class="t">会场意向</span><select data-set="site" data-id="${p.id}">${ed.sites.map((x) => opt(x.id, T.siteCity(x), p.site ?? trip.site?.id))}</select></label>
          ${
            assignOut || p.assigned
              ? html`<label class="row setting"><span class="t">分配到</span><select data-set="assigned" data-id="${p.id}">${opt('', '还没看到', p.assigned ?? '')}${ed.sites.map((x) => opt(x.id, T.siteCity(x), p.assigned))}</select></label>`
              : ''
          }`
            : ''
        }
        <label class="row setting date-row"><span class="t">出发</span>${dateField('depart', p.id, trip.D, '待定')}</label>
        <label class="row setting date-row"><span class="t">回国</span>${dateField('back', p.id, trip.R, '待定')}</label>`)}
        <p class="cap-note">${trip.Dset || trip.Rset ? html`出发和回国是你填的。<button class="link-btn" data-act="reset-dates" data-id="${p.id}">恢复默认</button>` : '默认会议前一天出发、结束后一天回国。'}</p>`
      : '';
  return {
    title: '出行设置',
    tab: 'me',
    body: html`<header class="large-head"><h1>出行设置</h1><p class="sub">录用后清单按这些算。只存在这台手机上。</p></header>
      ${paperPart}
      ${cap('所有行程')}${group(html`
        <label class="row setting"><span class="t">护照</span><select data-set="passport">${opt('cn_ordinary', '中国大陆普通护照', s.passport)}${opt('cn_official', '因公护照', s.passport)}${opt('other', '其他', s.passport)}</select></label>
        <label class="row setting"><span class="t">需要学校审批</span><input type="checkbox" class="switch" role="switch" data-set="approval"${s.approval ? ' checked' : ''}></label>
        ${s.approval ? html`<label class="row setting"><span class="t">审批提前量</span>${choose('leadDays', s.leadDays, [5, 10, 15, 20, 30, 40, 60], '个工作日')}</label>` : ''}
        <div class="row setting"><span class="t">注册身份</span>${seg}</div>
        <label class="row setting"><span class="t">美签领区</span><select data-set="city">${opt('', '不填', s.city ?? '')}${US_POSTS.map(([v, l]) => opt(v, l, s.city))}</select></label>
        <label class="row setting"><span class="t">回国后报销期限</span>${choose('reimburseDays', s.reimburseDays, [15, 30, 60, 90], '天')}</label>`)}
      ${s.approval ? html`<p class="cap-note">审批提前量按本校最新通知填。例：${leadExamples()}。</p>` : ''}
      <p class="fine">不问姓名、护照号、出生日期、签证申请号</p>`,
  };
}

// ---------- sheets ----------

interface SheetView {
  label: string;
  /** Centred title on the ✕ line (form sheets such as 添加论文). */
  title?: string;
  body: Raw;
  /** Pinned under the scrolling body (count and primary button of a picker). */
  foot?: Raw;
  full?: boolean;
  mount?: (el: HTMLElement) => void;
}

/**
 * 说法矛盾: each reading is labelled by its own words ("严格读法（注册截止前撤）",
 * "按 ARR checklist"); what holds under every reading comes after them under
 * one sub-header, so the card never suggests more readings than there are.
 */
function readingsCard(r: AppRule): Raw {
  const items = r.quotes.map((q) => ({ q, ...L.splitReading(q.reading_zh ?? q.text) }));
  const own = items.filter((x) => !x.common);
  const shared = items.filter((x) => x.common);
  const item = (x: (typeof items)[number], label: string | undefined) => html`<div class="reading${label ? '' : ' common'}">
      ${label ? html`<div class="n">${label}</div>` : ''}<p class="clamp">${x.body}</p>
      <div class="actions"><a class="src" href="${x.q.deep_link}" target="_blank" rel="noopener">${x.q.source_title} ↗</a><button class="more" data-act="more" hidden>展开</button></div></div>`;
  // What holds under every reading is secondary: one collapsed row, opened on tap.
  return html`<div class="readings"><div class="readings-h">几种读法</div>${own.map((x, i) => item(x, x.label ?? `依据 ${i + 1}`))}${
    shared.length
      ? html`<details class="shared"><summary><span>${own.length === 2 ? '两种读法都适用' : '各种读法都适用'} ${shared.length} 条</span>${icon.down}</summary>${shared.map((x) => item(x, undefined))}</details>`
      : ''
  }<p class="nochoice">本应用不替你选</p></div>`;
}

/**
 * A rule card. `forId` names another edition it is read for (ICLR 2027's card
 * opened from ICLR 2028's abstract page): the card is then a reference, so
 * it shows no 已结束 state or last year's key time, but that edition's
 * estimated time for the same step.
 */
function sheetRule(id: string, forId?: string): SheetView | null {
  const r = RULE.get(id);
  const ed = r && ED.get(r.edition);
  if (!r || !ed) return null;
  const refEd = forId && forId !== ed.id ? ED.get(forId) : undefined;
  const time = refEd ? L.ruleTimeLong(r, refEd, now()) : L.ruleTimeLong(r, ed, now());
  // "生效中" says nothing next to 未规定 / 不要求.
  const state = refEd || r.answer === 'unspecified' || r.answer === 'not_required' ? undefined : L.ruleState(r, ed, now());
  const contra = r.answer === 'contradictory';
  const first = r.quotes[0];
  const details: Raw[] = [];
  if (contra) details.push(html`<p>${L.stripSummary(r.summary_zh, r.answer)}</p>`);
  if (r.detail_zh) details.push(html`<p>${r.detail_zh}</p>`);
  if (r.applies?.note_zh) details.push(html`<p><span class="k">适用时间</span>${r.applies.note_zh}</p>`);
  if (r.changed_from_prev_zh) details.push(html`<p><span class="k">较上一届</span>${r.changed_from_prev_zh}</p>`);
  if (r.checked?.length)
    details.push(
      html`<p><span class="k">查过但没找到相关规定</span>${r.checked.map(
        (c, i) => html`${i ? '、' : ''}<a href="${c.url}" target="_blank" rel="noopener">${c.title}</a>`,
      )}</p>`,
    );
  return {
    label: r.short_zh ?? r.question_zh,
    full: true,
    body: html`<p class="eyebrow">${refEd ? `${L.editionShort(refEd)} · 参考 ${L.editionShort(ed)} 的规则` : `${ed.name} · ${L.topicOf(r.family).name}`}</p>
      <h2 class="q">${r.question_zh}</h2>
      <div class="big"><span class="a-${r.answer}">${L.ANSWER_WORD[r.answer]}</span>${
        state ? tag(L.RULE_STATE_ZH[state], `st-${state}`) : ''
      }${refEd ? tag(`参考 ${L.editionShort(ed)}`) : ''}${r.verification === 'inherited' ? tag('沿用上届') : ''}</div>
      ${time ? html`<p class="keytime">${icon.clock}<span>${refEd ? `${L.editionShort(refEd)} 预计：` : ''}${time}</span></p>` : ''}
      ${refEd ? html`<p class="ref-note">${L.editionShort(refEd)} 的规则还没公布。这是 ${L.editionShort(ed)} 的规则，新一届可能会变。</p>` : ''}
      ${contra ? readingsCard(r) : html`<p class="explain">${L.stripSummary(r.summary_zh, r.answer)}</p>`}
      ${first ? html`<a class="btn" href="${first.deep_link}" target="_blank" rel="noopener">查看官网原句 ↗</a>` : ''}
      <div class="folds">
        ${
          r.quotes.length
            ? html`<details><summary><span>英文原句 ${r.quotes.length} 条</span>${icon.down}</summary><div class="fold-body">${r.quotes.map(
                (q) => html`<figure><blockquote lang="en">${q.text}</blockquote><a href="${q.deep_link}" target="_blank" rel="noopener">${q.source_title} ↗</a></figure>`,
              )}</div></details>`
            : ''
        }
        ${details.length ? html`<details><summary><span>细节</span>${icon.down}</summary><div class="fold-body">${details}</div></details>` : ''}
      </div>
      <p class="foot">${verificationLine(r)}</p>`,
    mount: (el) => {
      for (const p of el.querySelectorAll<HTMLElement>('.reading .clamp')) {
        const more = p.closest('.reading')?.querySelector<HTMLElement>('.more');
        if (more && p.scrollHeight > p.clientHeight + 2) more.hidden = false;
      }
    },
  };
}

function sheetMilestoneSource(edId: string, type: string): SheetView | null {
  const ed = ED.get(edId);
  const m = ed && L.milestoneOf(ed, type);
  if (!ed || !m) return null;
  const w = whenOf(m);
  // An estimate quotes last year's official line; the sheet says so instead of "官网写法".
  const est = m.status === 'estimated';
  if (L.isUpstream(ed)) {
    return {
      label: '数据来源',
      body: html`<p class="eyebrow">${ed.name} · ${L.milestoneShort(m)}</p>
      <h2 class="q">${L.officialWord(ed)}</h2>
      <div class="big small">${L.fmtOfficial(m)}${tag(L.UPSTREAM_TAG)}</div>
      ${w.label ? html`<p class="keytime">${icon.clock}<span>${w.label}：${w.text}</span></p>` : ''}
      <p class="explain">这个日期来自 ccfddl（社区维护的截止日期数据，MIT 许可），本应用还没对照会议官网核对。以官网为准。</p>
      ${m.note_zh ? html`<p class="explain">${m.note_zh}</p>` : ''}
      ${ed.upstream?.link ? html`<a class="btn" href="${ed.upstream.link}" target="_blank" rel="noopener">打开会议网站 ↗</a>` : ''}
      <p class="foot">${L.UPSTREAM_NOTE} · 截至 ${L.md(ed.last_checked)}</p>`,
    };
  }
  // "往年" only when the quote is an earlier edition's page; this edition's own words ("mid March", "tentative") are not last year's.
  const prev = est && (!!ed.derived_from || !!m.from_prev);
  return {
    label: est ? '推算依据' : '官网原文',
    body: html`<p class="eyebrow">${ed.name} · ${L.milestoneShort(m)}</p>
      <h2 class="q">${est ? estBasis(ed, m) : '官网写法'}</h2>
      <div class="big small">${L.fmtOfficial(m)}${est ? tag('预计') : m.tentative ? tag(TENTATIVE_TAG) : ''}</div>
      ${w.label ? html`<p class="keytime">${icon.clock}<span>${w.label}：${w.text}</span></p>` : ''}
      ${m.quote ? html`<figure class="quote-card"><blockquote lang="en">${m.quote}</blockquote>${m.src_title ? html`<figcaption>${prev ? '往年原文 · ' : ''}${m.src_title}</figcaption>` : ''}</figure>` : ''}
      ${m.note_zh ? html`<p class="explain">${m.note_zh}</p>` : ''}
      ${m.deep_link ? html`<a class="btn" href="${m.deep_link}" target="_blank" rel="noopener">${prev ? '查看往年官网原句 ↗' : '查看官网原句 ↗'}</a>` : ''}`,
  };
}

function sheetVenueInfo(edId: string): SheetView | null {
  const ed = ED.get(edId);
  if (!ed) return null;
  const { inh, status, from } = inheritedInfo(ed);
  return {
    label: `关于 ${ed.name}`,
    full: inh.length > 0,
    body: html`<p class="eyebrow">${ed.name}</p>
      <h2 class="q">关于这些数据</h2>
      ${
        inh.length
          ? html`<p class="explain">${
              status ? `${ed.year} 作者指南还没发布。` : ''
            }标了“沿用”的 ${inh.length} 条规则按 ${from} 推断，新规则公布后会更新。</p>
            <div class="group inset">${inh.map((r) => ruleRow(r, ed, false, true))}</div>`
          : ''
      }
      ${
        isDerived(ed)
          ? html`<p class="explain">${L.editionShort(ed)} 官网还没公布日期。标了“预计”的日期按 ${editionLabel(ed.derived_from!)} 推算，官网公布后会更新。</p>`
          : ''
      }
      ${
        L.isUpstream(ed)
          ? html`<p class="explain">${L.editionShort(ed)} 的日期、地点来自 ccfddl（github.com/ccfddl/ccf-deadlines，MIT 许可），本应用还没对照官网核对，标“${L.UPSTREAM_TAG}”。以会议官网为准。</p>`
          : ''
      }
      ${ed.note_zh ? html`<p class="explain">${ed.note_zh}</p>` : ''}
      <p class="foot">${L.isUpstream(ed) ? `ccfddl 数据截至 ${L.md(ed.last_checked)}` : `核对于 ${L.md(ed.last_checked)}`}${rulesOf(ed.id).length ? ' · 每条规则都附官网原句' : ''}</p>`,
  };
}

/** The official page that names the venue: its venue page, else the page quoting the building, else (upstream) the conference site. */
function venueLink(ed: AppEdition, site?: NonNullable<AppEdition['sites']>[number]): { url: string; label: string; sub?: string } | undefined {
  const page = (ed.logistics?.links ?? []).find((l) => l.kind === 'venue' && (!l.site || l.site === site?.id));
  if (page) return { url: page.url, label: '会场信息' };
  const v = P.venueOf(ed, site);
  if (v?.link) return { url: v.link, label: '写会场的官网原句', sub: v.src_title };
  if (!site && L.isUpstream(ed) && ed.upstream?.link) return { url: ed.upstream.link, label: '会议官网', sub: 'ccfddl 给的链接' };
  return undefined;
}

/**
 * The rows of one place in the place sheet: the address (venue, street,
 * city, country) with 复制地址, a map search, the local days and the same
 * span in Beijing time, the time difference and zone, the visa for a
 * mainland passport, the official page.
 */
function placeRows(ed: AppEdition, site?: NonNullable<AppEdition['sites']>[number]): Raw {
  const t = now();
  const p = site ? P.sitePlaceOf(site) : ed.place;
  if (!p) return html``;
  const days = T.conferenceDays(ed, site?.id);
  const venue = P.venueOf(ed, site);
  const addr = P.addressText(ed, site);
  const map = P.mapLink(p, addr, { apple: APPLE_MAPS });
  const visa = P.visaSentence(VISA, p.country_code, days?.start);
  const link = venueLink(ed, site);
  const note = L.isUpstream(ed) ? 'ccfddl 写法，未对照官网' : venue && venue.address === 'tba' ? '街道地址官网还没公布' : !venue ? '场馆官网还没公布' : undefined;
  // Only a country ("China") is nothing to paste into a map or a form.
  const copy = addr && P.searchable(p) ? html`<button class="copy-b" data-act="copy" data-value="${addr}" aria-label="复制地址 ${addr}">复制地址</button>` : '';
  const addrRow = html`<div class="row info${note ? ' two' : ''}"><span class="k">地址</span><div class="main"><div class="v">${
    addr || html`<span class="dim">待公布</span>`
  }</div>${note ? html`<div class="s wrap">${note}</div>` : ''}</div>${copy}</div>`;
  const span = p.tz && days ? P.beijingSpan(p.tz, days.start, days.end) : undefined;
  const steady = p.tz && !days ? P.steadyOffsetText(p.tz, ed.year) : undefined;
  return group(
    html`
    ${addrRow}
    ${map ? infoRow('地图', `在${/^[A-Za-z]/.test(map.label) ? ' ' : ''}${map.label}${/[A-Za-z]$/.test(map.label) ? ' ' : ''}中查看`, map.url) : ''}
    ${infoRow('会期', days ? `${days.estimated ? '约 ' : ''}${P.daysWeekText(days.start, days.end, t)}` : html`<span class="dim">待公布</span>`, undefined, days ? (span ? `北京时间 ${span}` : '当地日期，和北京时间相同') : undefined)}
    ${p.tz && days ? infoRow('时差', P.localOffsetText(p.tz, days.start, days.end), undefined, `${P.zoneText(p.tz, days.start, days.end)} · ${p.tz}`) : ''}
    ${steady && p.tz ? infoRow('时差', steady, undefined, P.steadyZoneText(p.tz, ed.year)) : ''}
    ${
      visa.known
        ? infoRow('签证', visa.text, visa.regimeId && VISA?.regimes.some((r) => r.id === visa.regimeId) ? `#/visa/${visa.regimeId}` : undefined, visa.sub)
        : infoRow('签证', html`<span class="dim">${visa.text}</span>`, undefined, visa.sub)
    }
    ${link ? infoRow('官网', link.label, link.url, link.sub) : ''}`,
    'inset pl-g',
  );
}

/**
 * 开会地点 (§3.4.1, #/venue/<edition>/place): the full address to copy and
 * look up on a map, the days in local and Beijing time, the time zone, the
 * visa, the official page. A multi-site edition lists each site.
 */
function sheetPlace(edId: string): SheetView | null {
  const ed = ED.get(edId);
  if (!ed || ed.kind !== 'conference' || P.placeKind(ed) === 'tba') return null;
  const b = P.placeBlock(ed, VISA, now());
  const chip = (c: P.PlaceBlock['chip']) => (c ? html`<span class="vchip vc-${c.kind}">${c.text}</span>` : '');
  const multi = b.kind === 'multi';
  const sites = ed.sites ?? [];
  const assign = T.siteMilestone(ed, 'site_assignment');
  const assignAt = assign && assign.status !== 'tba' ? assign.at_resolved : undefined;
  const title = multi ? sites.map(T.siteCity).join(' · ') : b.name;
  const body = multi
    ? html`<p class="pl-sub">${sites.length} 地 · 官方分配会场${assignAt ? ` · ${T.shortTime(assignAt)} 公布` : ''}</p>${sites.map((x) => {
        const sp = P.sitePlaceOf(x);
        return html`<h3 class="pl-site">${P.placeName(sp)}${chip(P.visaChip(VISA, sp.country_code, T.conferenceDays(ed, x.id)?.start))}</h3>${placeRows(ed, x)}`;
      })}`
    : placeRows(ed);
  const foot = L.isUpstream(ed) ? `地点来自 ccfddl，未对照官网核对 · 数据截至 ${L.md(ed.last_checked)}` : `以官网为准 · 核对于 ${L.md(ed.last_checked)}`;
  return {
    label: `${ed.name} 开会地点`,
    full: multi,
    body: html`<p class="eyebrow">${ed.name} · 开会地点</p>
      <h2 class="pl-h"><span class="pl-lead">${icon.pin}<span class="pl-ht">${placeNameHtml(title, b.kind === 'raw')}</span></span>${multi ? '' : chip(b.chip)}</h2>
      ${body}
      <p class="foot">${foot}<br>中文地名和时差由本应用对照 · 签证按中国大陆普通护照</p>`,
  };
}

/**
 * 推荐目录 (§12.2), opened from a rank badge in a venue header: every label
 * of the edition (or of a series with no edition), the tapped list first. An
 * official list shows its tier, category, full name, edition and release
 * date, why a hand-made link holds, and the official page; the publisher's
 * own disclaimer is folded. CORE and THCPL say they are ccfddl's values,
 * unchecked. The lists' licence notes are for the maintainer
 * (docs/RANK_MATCHING.md), not shown here. #/rank/<edition or series>[/<list>]
 */
function sheetRank(id: string, first?: string): SheetView | null {
  const ed = ED.get(id);
  const s = ed ? SERIES_BY_ID.get(ed.series) : SERIES_BY_ID.get(id);
  const v = ed ? rankedEdition(ed) : s ? rankedSeries(s) : undefined;
  if (!v?.labels?.length) return null;
  const title = ed ? ed.name : s!.name;
  const lists = new Map((DATA.rank_lists ?? []).map((l) => [l.id, l]));
  const card = (l: AppRankLabel) => {
    const rl = lists.get(l.list);
    if (l.upstream || !rl)
      return html`<div class="rkc up"><div class="rkc-h"><span class="rkc-t">${l.text}</span>${tag('取自 ccfddl')}</div>
        <p class="rkc-name">${l.kind === 'university' ? `${l.list.toUpperCase()}（高校目录）` : l.kind === 'international' ? `${l.list.toUpperCase()}（国际会议排名）` : l.list}</p>
        <p class="rkc-meta">ccfddl 标注的等级，本应用没有对照原目录核对，也不当作徽章显示。</p></div>`;
    const cast = l.year !== undefined;
    return html`<div class="rkc${l.list === first ? ' tapped' : ''}"><div class="rkc-h"><span class="rkc-t">${l.text}</span>${
      l.category_zh ? html`<span class="rkc-cat">${l.category_zh}</span>` : ''
    }</div>
      <p class="rkc-name">${rl.name_zh}</p>
      <p class="rkc-meta">${rl.edition_zh} · ${rl.released.slice(0, 4)}/${L.md(rl.released)} 发布${cast ? ` · 只属于 ${l.year} 年那一届` : ''}</p>
      ${l.qualifier_zh || l.note_zh ? html`<p class="rkc-note">${tag('本应用对应')}${l.qualifier_zh ? `只算${l.qualifier_zh}。` : ''}${l.note_zh ?? ''}</p>` : ''}
      <a class="rkc-link" href="${rl.official_url}" target="_blank" rel="noopener">目录官网 ↗</a>
      ${rl.disclaimer_zh ? html`<details class="rkc-more"><summary><span>发布方说明</span>${icon.down}</summary><p>${rl.disclaimer_zh}</p></details>` : ''}</div>`;
  };
  const full = NAMES.get(ed?.series ?? id)?.full_name;
  // A label that is this app's reading of the list (a qualifier, a hand-made link) says so in the footer too.
  const read = v.labels.some((l) => !l.upstream && (l.qualifier_zh || l.note_zh));
  return {
    label: `${title} 的等级`,
    full: v.labels.length > 2,
    body: html`<h2 class="q">${title} 的等级</h2>${full ? html`<p class="rk-full">${full}</p>` : ''}
      ${B.sheetOrder(v.labels, v.directions, first, getDirs() ?? []).map(card)}
      <p class="foot">${read ? '等级照录目录原文；标“本应用对应”的是本应用对条目的解读' : '等级照录目录原文，本应用不推断'}</p>`,
  };
}

/** 录用率 source (§11.4.1): #/stat/<series>/<year>[/<track>]. */
/** While stats.js is on its way, a sheet or page that needs it says so (and is drawn again when it lands). */
const statsWait = (label: string): SheetView => ({ label, body: html`<p class="note">${statsState === 'failed' ? '往年数据没能载入，联网后再试。' : '载入中…'}</p>` });

function sheetStat(series: string, year: string, track: string): SheetView | null {
  if (!needStats()) return statsWait('录用率');
  const row = S.findRow(STATS.get(series), Number(year), track || 'main');
  if (!row) return null;
  const name = seriesLabel(series);
  return { label: `${name} ${year} 录用率`, body: CH.statSheetBody(name, row) };
}

/** 主题排名：怎么算的 (§11.4.2). */
function sheetTopics(series: string, year: string): SheetView | null {
  if (!needStats()) return statsWait('怎么算的');
  const t = TOPICS.find((x) => x.series === series && x.year === Number(year));
  if (!t) return null;
  return { label: '怎么算的', full: true, body: CH.topicsSheetBody(seriesLabel(series), t, now()) };
}

/** 口径说明 (§11.4.4). */
function sheetAboutStats(): SheetView {
  return { label: '口径说明', body: CH.aboutStatsBody() };
}

/** The edition page a stats route sits on: the series' nearest edition, zoomed. */
function seriesHome(series: string): string {
  const s = SERIES_BY_ID.get(series);
  const ed = s && (R.nearestEdition(s, now()) ?? s.editions.at(-1));
  return ed ? `#/venue/${ed.id}/timeline` : '#/venues';
}

/** 各领域 · 全部 (pushed from the areas block): every area, then the source. */
function screenAreas(series: string, year: string): View {
  if (!needStats()) return { title: '各领域', tab: 'venues', body: html`<p class="note">${statsState === 'failed' ? '往年数据没能载入，联网后再试。' : '载入中…'}</p>` };
  const a = AREAS.find((x) => x.series === series && x.year === Number(year));
  if (!a) return notFound('venues');
  const name = seriesLabel(series);
  const others = AREAS.filter((x) => x.series === series && x !== a);
  return { title: `${name} ${a.year} 各领域`, tab: 'venues', body: CH.areasPageBody(name, a, now(), others) };
}

/**
 * The open target picker (§9.7): 添加论文 (key "new") or 修改 for one paper
 * (key = its id). Nothing is saved until 添加 / 完成; closing with changes
 * asks first (放弃 / 继续编辑).
 */
interface TargetDraft {
  key: string;
  name: string;
  dirs: R.Direction[];
  /** Picked series, in tap order; the badges show draftOrder(). */
  targets: string[];
  /** The saved priority order (修改): those targets keep their order, new picks go in by the rule. Empty for a new paper. */
  base: string[];
  /** What the sheet opened with, to tell whether closing loses anything. */
  start: { name: string; dirs: R.Direction[]; targets: string[] };
  /** "其他方向的会议" is open. */
  others: boolean;
  /** The 方向 chips are open under the 方向 row (添加论文), and which 学科 in them. */
  dirsOpen: boolean;
  open: string[];
  /** What the search box holds. */
  q: string;
}

let draft: TargetDraft | null = null;

function newDraft(key: string, name: string, dirs: R.Direction[], targets: string[]): TargetDraft {
  return {
    key,
    name,
    dirs,
    targets: [...targets],
    base: [...targets],
    start: { name, dirs, targets: [...targets] },
    others: false,
    dirsOpen: false,
    open: TX.openAtFirst(TAX, dirs),
    q: '',
  };
}

/** The picks in priority order: the interest list first (by rank), then by next open deadline; a saved order stays as it is. */
const draftOrder = (d: TargetDraft) => R.targetPriority(d.targets, interest(), SERIES, now(), d.base);

/** Closing would lose something: a pick, a direction or the name changed since the sheet opened. */
function draftChanged(d: TargetDraft): boolean {
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  return d.name.trim() !== d.start.name.trim() || !same(d.dirs, d.start.dirs) || !same(d.targets, d.start.targets);
}

/**
 * The venue lists of the picker: 你感兴趣的会议 (the interest list in the
 * user's order, a thin 备选 line before the 备选), 其他会议 of the paper's
 * directions by time, then "其他方向的会议 ›" (opened by itself when a pick
 * is in there). Nothing is preselected.
 */
function targetPicker(d: TargetDraft): Raw {
  const lists = R.targetLists(interest(), d.dirs, SERIES, now());
  const many = lists.interest.length + lists.direction.length + (d.others ? lists.others.length : 0) > TX.SEARCH_FROM;
  return html`${many || d.q ? searchBox('target', d.q) : ''}<div data-results="target">${targetResults(d)}</div>`;
}

/** The target picker's lists under its search box (a search covers every venue). */
function targetResults(d: TargetDraft): Raw {
  const p = interest();
  const lists = R.targetLists(p, d.dirs, SERIES, now());
  const order = draftOrder(d);
  const row = (id: string, force = false) => targetRow(SERIES_BY_ID.get(id)!, order.indexOf(id) + 1 || undefined, d.dirs, force);
  const list = (title: string, ids: string[], force = false): Raw =>
    ids.length ? html`${cap(title)}<div class="group inset">${ids.map((id) => row(id, force))}</div>` : html``;
  if (d.q.trim()) {
    const all = [...lists.interest, ...lists.direction, ...lists.others].map((id) => searchable(SERIES_BY_ID.get(id)!));
    const hits = TX.search(all, d.q, TAX);
    return hits.length
      ? html`${list(`找到 ${hits.length} 个`, hits.slice(0, MAX_HITS).map((x) => x.id), true)}${
          hits.length > MAX_HITS ? html`<p class="note">还有 ${hits.length - MAX_HITS} 个，多打几个字缩小范围。</p>` : ''
        }`
      : html`<p class="note">没有找到“${d.q.trim()}”。试试缩写、全称里的词或方向。</p>`;
  }
  const firsts = lists.interest.filter((id) => p.first.includes(id));
  const backups = lists.interest.filter((id) => !p.first.includes(id));
  const open = d.others || d.targets.some((id) => lists.others.includes(id));
  return html`${
    lists.interest.length
      ? html`${cap('你感兴趣的会议 · 按投稿偏好顺序')}<div class="group inset">${firsts.map((id) => row(id))}${
          firsts.length && backups.length ? html`<div class="row tier-div" role="presentation">备选</div>` : ''
        }${backups.map((id) => row(id))}</div>`
      : ''
  }
    ${targetDirection(d, lists.direction, (id) => row(id))}
    ${
      !lists.others.length
        ? ''
        : open
          ? targetOthers(d, lists.others, (id) => row(id))
          : html`<div class="group inset mt8"><button class="row" data-act="target-others"><span class="t accent">其他方向的会议</span><span class="val">${lists.others.length} 个</span>${chev}</button></div>`
    }`;
}

/**
 * 其他会议（按截止时间）: the paper's directions; venues with nothing to submit to in the data (all passed, no
 * dates collected) fold into one row, as in the preferences picker. A folded venue already picked stays open.
 */
function targetDirection(d: TargetDraft, ids: string[], row: (id: string) => Raw): Raw {
  if (!ids.length) return html``;
  const t = now();
  const dead = (id: string) => ['closed', 'none'].includes(R.seriesState(SERIES_BY_ID.get(id)!, t)) && !d.targets.includes(id);
  const open = closedOpen.has('target:direction');
  const shown = open ? ids : ids.filter((id) => !dead(id));
  const n = ids.length - shown.length;
  return html`${cap('其他会议（按截止时间）')}<div class="group inset">${shown.map(row)}${
    n ? html`<button class="row" data-act="show-closed" data-ctx="target" data-id="direction"><span class="t accent">已截止或日期未收录的 ${n} 个</span>${chev}</button>` : ''
  }</div>`;
}

/**
 * The target picker's "其他方向的会议", by 学科 (each a fold, "工程 · 40 个 ›"),
 * in time order inside; a 学科 holding a pick opens by itself.
 */
function targetOthers(d: TargetDraft, ids: string[], row: (id: string) => Raw): Raw {
  const series = ids.map((id) => SERIES_BY_ID.get(id)!);
  return html`${cap('其他方向的会议（按截止时间）')}${TX.byDiscipline(series, TAX).map((g) => {
    const key = `others-${g.discipline?.id ?? 'x'}`;
    const on = closedOpen.has(`target:${key}:disc`) || g.items.some((x) => d.targets.includes(x.id));
    return on
      ? html`<p class="cap disc-cap"><button class="cap-btn" data-act="disc-fold" data-ctx="target" data-id="${key}" aria-expanded="true">${g.discipline?.name ?? '其他'} · ${g.items.length} 个 ⌃</button></p><div class="group inset">${g.items.map((x) => row(x.id))}</div>`
      : html`<div class="group inset mt8"><button class="row" data-act="disc-fold" data-ctx="target" data-id="${key}" aria-expanded="false"><span class="t">${g.discipline?.name ?? '其他'}</span><span class="val">${g.items.length} 个</span>${chev}</button></div>`;
  })}`;
}

const PICK_RULE = '感兴趣的在前，其余按截止时间';

/**
 * Sticky footer: "已选 2 / 3" and the picks in priority order, the rule
 * under them (it stays in view while the list scrolls; a 4th pick turns it
 * into "最多选 3 个，先取消一个" for a moment), and the primary button.
 */
function targetFoot(d: TargetDraft, act: string, label: string, ok: boolean, id = ''): Raw {
  const order = draftOrder(d);
  const names = order.map((x, i) => html`<span class="nw"><b>${i + 1}</b> ${SERIES_BY_ID.get(x)?.name ?? x}</span>`);
  return html`<div class="pick-foot"><span class="cnt" data-count>已选 <b>${order.length}</b> / ${R.MAX_TARGETS}</span><span class="order">${
    order.length ? names : '从上面点选'
  }</span></div>
    <p class="pick-note" data-note role="status" aria-live="polite">优先级：${PICK_RULE}</p>
    <button class="btn" data-act="${act}" data-id="${id}"${ok ? '' : ' disabled'}>${label}</button>`;
}

/** 添加论文 (§9.3, §9.7): 代号 and 方向 as two form rows → 选择目标会议（最多 3 个）→ 添加. */
function sheetPaperNew(): SheetView {
  if (draft?.key !== 'new') {
    const used = new Set(getPapers().map((p) => p.name));
    const letter = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find((c) => !used.has(`论文 ${c}`)) ?? 'A';
    draft = newDraft('new', `论文 ${letter}`, getDirs() ?? DEFAULT_DIRS, []);
  }
  const d = draft;
  const dirText = dirsText(d.dirs);
  return {
    label: '添加论文',
    title: '添加论文',
    full: true,
    body: html`<div class="group inset form">
        <label class="row field"><span class="k">代号</span><input id="paper-name" class="input" type="text" value="${d.name}" maxlength="24" autocomplete="off" enterkeyhint="done"></label>
        <button class="row field dir-row${d.dirsOpen ? ' open' : ''}" data-act="new-dirs" aria-expanded="${d.dirsOpen}"><span class="k">方向</span><span class="v">${dirText}</span>${icon.down}</button>
        ${d.dirsOpen ? html`<div class="row chips-row">${dirPicker('new', d.dirs, d.open)}</div>` : ''}
      </div>
      <h3 class="pick-h">选择目标会议<span>最多 ${R.MAX_TARGETS} 个</span></h3>
      ${targetPicker(d)}`,
    foot: targetFoot(d, 'add-paper', '添加', d.targets.length > 0),
  };
}

/** 修改 (paper page): the same picker on the paper's targets, keeping the 3-limit and the saved order. */
function sheetPaperTargets(id: string): SheetView | null {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return null;
  if (draft?.key !== p.id) draft = newDraft(p.id, p.name, p.dirs, p.targets);
  const d = draft;
  return {
    label: `${p.name} 的目标会议`,
    title: '目标会议',
    full: true,
    body: targetPicker(d),
    foot: targetFoot(d, 'save-targets', '完成', d.targets.length > 0, p.id),
  };
}

/** "其他方向" is open in the 在投 sheet. */
let currentOthers = false;

/**
 * 在投: where the paper waits for a result, so the route starts there. The
 * paper's target venues first, then others of its directions; the rest
 * behind one row. The stored choice is always shown checked, even when it is
 * no longer (or not yet) under review.
 */
function sheetPaperCurrent(id: string): SheetView | null {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return null;
  const t = now();
  const ranked = new Set(p.targets);
  const all = R.inReview(EDITIONS, t);
  const inDirs = (e: R.Entry) => R.directionsOf(e.edition).some((d) => p.dirs.includes(d));
  const mineList = all.filter((e) => ranked.has(e.edition.series));
  const dirList = all.filter((e) => !ranked.has(e.edition.series) && inDirs(e));
  const rest = all.filter((e) => !ranked.has(e.edition.series) && !inDirs(e));
  const active = p.current ?? '';
  const stored = p.current && !all.some((e) => e.edition.id === p.current) ? ED.get(p.current) : undefined;
  const radio = (value: string, title: string, sub: Raw | string) =>
    html`<button class="row two radio${active === value ? ' on' : ''}" data-act="set-current" data-id="${p.id}" data-value="${value}" role="radio" aria-checked="${active === value}">
      <div class="main"><div class="t">${title}</div><div class="s">${sub}</div></div><span class="tick">${icon.check}</span></button>`;
  const option = (e: R.Entry) => {
    const step = R.firstStep(e).m;
    const at = (step.at_resolved ?? step.end_resolved)!;
    return radio(
      e.edition.id,
      L.editionShort(e.edition),
      html`<span>${R.stepName(step)}截止 ${L.fmtDay(at, t)} · ${R.routeDay(e.result!)} 出结果</span>${e.estimated ? tag('预计') : ''}`,
    );
  };
  const storedRow = stored
    ? radio(stored.id, L.editionShort(stored), R.started(stored, t) ? '已出结果，路线不再从它排' : '还没到截止，路线照常从它排起')
    : '';
  return {
    label: '在投',
    title: '在投哪个会？',
    body: html`<p class="sheet-note top">已经投出（或注册了摘要）、还没出结果的会。选了以后，路线从它出结果那天往后排。</p>
      <div class="group inset">${radio('', '还没投', '按目标会议从最近的截止排')}${storedRow}</div>
      ${mineList.length ? html`<p class="cap">目标会议</p><div class="group inset">${mineList.map(option)}</div>` : ''}
      ${dirList.length ? html`<p class="cap">其他会议</p><div class="group inset">${dirList.map(option)}</div>` : ''}
      ${
        rest.length
          ? currentOthers
            ? html`<p class="cap">其他方向</p><div class="group inset">${rest.map(option)}</div>`
            : html`<div class="group inset mt8"><button class="row" data-act="current-others"><span class="t accent">其他方向</span><span class="val">${rest.length} 个</span>${chev}</button></div>`
          : ''
      }`,
  };
}


/** 标记为已录用 (§10.1): which edition (the 在投 one first) and, for a multi-site edition, the site asked for. */
let acceptDraft: { paper: string; edition?: string; site?: string } | null = null;

/** Editions a paper can be marked accepted at: its 在投 one, then its targets' editions whose result is out or near, conference not over. */
function acceptOptions(p: Paper): AppEdition[] {
  const t = now();
  const ids = new Set<string>();
  if (p.current) ids.add(p.current);
  for (const s of p.targets) for (const e of SERIES_BY_ID.get(s)?.editions ?? []) ids.add(e.id);
  const ok = (e: AppEdition) => {
    const m = T.notificationOf(e);
    if (!m || m.status === 'estimated') return false;
    const at = Date.parse((m.at_resolved ?? m.end_resolved)!.utc);
    const days = T.conferenceDays(e);
    const over = days ? days.end < L.beijingDate(t) : false;
    return !over && at - t < 60 * 86_400_000 && t - at < 240 * 86_400_000;
  };
  const list = [...ids].map((id) => ED.get(id)).filter((e): e is AppEdition => !!e && e.kind === 'conference' && ok(e));
  const at = (e: AppEdition) => Date.parse((T.notificationOf(e)!.at_resolved ?? T.notificationOf(e)!.end_resolved)!.utc);
  return list.sort((a, b) => Number(b.id === p.current) - Number(a.id === p.current) || at(a) - at(b));
}

function sheetAccept(id: string): SheetView | null {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return null;
  const t = now();
  const options = acceptOptions(p);
  if (acceptDraft?.paper !== p.id) acceptDraft = { paper: p.id, edition: options[0]?.id, site: p.site };
  const d = acceptDraft;
  const ed = d.edition ? ED.get(d.edition) : undefined;
  const sites = ed?.sites ?? [];
  const assignAt = ed && T.assignmentAt(ed);
  const out = !!assignAt && Date.parse(assignAt.utc) <= t;
  const resultDay = (e: AppEdition) => {
    const m = T.notificationOf(e)!;
    return `${m.at_resolved ? `${L.fmtDay(m.at_resolved, t)} 出结果` : ''}${e.id === p.current ? ' · 在投' : ''}`;
  };
  const edRow = (e: AppEdition) => {
    const on = d.edition === e.id;
    return html`<button class="row two radio${on ? ' on' : ''}" data-act="accept-edition" data-id="${e.id}" role="radio" aria-checked="${on}"><div class="main"><div class="t">${L.editionShort(e)}</div><div class="s"><span>${resultDay(e)}</span></div></div><span class="tick">${icon.check}</span></button>`;
  };
  // A site row marks the paper at once (撤销 in the toast): where, which days, and the clock there.
  const siteRow = (s: NonNullable<AppEdition['sites']>[number]) => {
    const days = T.conferenceDays(ed!, s.id);
    const when = days ? `${L.md(days.start)}–${L.md(days.end)} · ${T.tzOffsetText(s.tz, days.start, days.end)}` : '会期待公布';
    return html`<button class="row two" data-act="accept-site" data-id="${s.id}"><div class="main"><div class="t">${T.siteCity(s)}<span class="yr">${T.siteCountry(s)}</span></div><div class="s"><span>${when}</span></div></div>${chev}</button>`;
  };
  const head = !options.length
    ? html`<p class="sheet-note top">目标会议里没有近期出结果的会。先在「在投」里选好投的是哪一届。</p>`
    : options.length === 1
      ? html`<p class="sheet-lead">${L.editionShort(options[0]!)} · ${resultDay(options[0]!)}</p>`
      : html`${cap('哪个会录用的')}<div class="group inset">${options.map(edRow)}</div>`;
  return {
    label: '标记为已录用',
    title: '标记为已录用',
    body: html`${head}${
      sites.length
        ? html`${cap(out ? '分到哪个会场？点一下就标记' : '会场意向表的第一志愿？点一下就标记')}<div class="group inset">${sites.map(siteRow)}</div>
          <p class="sheet-note">${out ? '按主办方发来的分配结果选。' : '清单里的签证、注册和时差按它算；分配结果出来后再标分到哪。'}</p>`
        : ''
    }`,
    foot: sites.length ? undefined : html`<button class="btn" data-act="confirm-accept" data-id="${p.id}"${ed ? '' : ' disabled'}>标记为已录用</button>`,
  };
}

/**
 * The ways out when 学校审批 is too late, as the venue's cards answer them;
 * the choice stays with the user. Once the sites are assigned (NeurIPS 2026)
 * the presenter cannot change, so a co-author presenting is not offered.
 */
function lateOptions(ed: AppEdition): Raw {
  const t = now();
  const rules = rulesOf(ed.id);
  const fb = rules.find((r) => r.effect?.kind === 'fallback');
  const lock = rules.find((r) => r.effect?.kind === 'lock' && r.effect.target === 'presenting_site');
  const from = lock?.applies?.from ? T.siteMilestone(ed, lock.applies.from) : undefined;
  const fromAt = from && from.status !== 'tba' ? (from.at_resolved ?? from.end_resolved) : undefined;
  const locked = !!lock && (!fromAt || Date.parse(fromAt.utc) <= t);
  const word = (a: string | undefined) => (a && a in L.ANSWER_WORD ? L.ANSWER_WORD[a as Answer] : '看规则卡');
  return html`<ul class="opts"><li>${
    locked
      ? html`<a href="#/rule/${lock!.id}">换报告人：不能（分配后） ›</a>`
      : fb
        ? html`<a href="#/rule/${fb.id}">请合作者代讲：${word(fb.effect?.substitute)} ›</a>`
        : '请合作者去报告'
  }</li><li>${fb ? html`<a href="#/rule/${fb.id}">线上报告：${word(fb.effect?.virtual)} ›</a>` : '按规则卡看能不能线上报告'}</li><li>问学校能不能加急</li></ul>`;
}

/** What a step needs most, in one or two sentences, plus the one key extra (§10.5). */
function stepBody(p: Paper, trip: T.Trip, s: T.Step): Raw {
  const t = now();
  const ed = trip.edition;
  const lg = ed.logistics;
  const settings = getTrip();
  const city = trip.site ? T.siteCity(trip.site) : '';
  switch (s.id) {
    case 'site': {
      const sites = ed.sites ?? [];
      const at = T.assignmentAt(ed);
      const when = at ? T.shortTime(at) : '';
      const radios = (act: string, cur: string | undefined) =>
        html`<div class="group inset">${sites.map(
          (x) =>
            html`<button class="row radio${cur === x.id ? ' on' : ''}" data-act="${act}" data-id="${p.id}" data-value="${x.id}" role="radio" aria-checked="${cur === x.id}"><span class="t">${T.siteCity(x)}<span class="yr">${T.siteCountry(x)}</span></span><span class="tick">${icon.check}</span></button>`,
        )}</div>`;
      if (s.closed)
        return html`<p class="explain">${when ? `${when} ` : ''}已公布分配，之后不能再换会场和报告人。按主办方发来的结果标分到哪，清单会按那个会场重算。</p>
          ${cap('分到哪')}${radios('set-assigned', p.assigned)}`;
      return html`<p class="explain">会场意向表是主办方（EventHost）出结果前发给作者的，填指定报告作者和会场意向；截止前可以改。${when ? `${when} 公布分配，` : '分配后'}之后不能再换会场和报告人。</p>
        ${cap('你的意向（清单按它算）')}${radios('set-site', trip.site?.id)}`;
    }
    case 'aid': {
      const aids = Array.isArray(lg?.aid) ? lg!.aid : [];
      return html`${aids.map((a) => html`<p class="explain"><b>${a.name}</b>${a.covers_zh ? `：${a.covers_zh}。` : ''}</p>`)}
        ${s.note ? html`<p class="explain">${s.note}。</p>` : ''}`;
    }
    case 'register': {
      const coauthor = trip.presenter === 'coauthor';
      const pr = T.pricesFor(ed, trip.site?.id, settings.identity, t);
      const cov = T.coverageText(ed);
      const multi = T.registrationsNeeded(getPapers(), EDITIONS).find((x) => x.edition.id === ed.id);
      const hold = rulesOf(ed.id).find((r) => r.effect?.kind === 'hold');
      const seat = seatQuotes(trip);
      const at = T.assignmentAt(ed);
      const lead = coauthor
        ? '确认报告的合作者已按要求注册。'
        : seat.length
          ? p.assigned
            ? `按分到的${city}注册：指定报告作者在那里有保留名额。`
            : `指定报告作者的注册名额绑定分到的会场：${at ? `${T.shortTime(at)} ` : ''}分配后按分到的会场注册。先注册了别的会场，要取消再重新注册。`
          : '每篇录用论文至少要有一位作者注册。';
      const vl = lg?.visa_letter;
      const needLetter = !coauthor && (trip.visa.need === 'required' || trip.visa.need === 'unknown') && !trip.steps.find((x) => x.id === 'visa')?.auto;
      const letter = vl && !isTba(vl) ? (vl.how_site_zh?.[trip.site?.id ?? ''] ?? vl.how_zh) : '先注册才能开，以会议签证页为准。';
      const refund = trip.steps.find((x) => x.id === 'refund');
      const rr = refund?.rules[0];
      const sold = (lg?.sold_out ?? []).some((x) => !x.site || x.site === trip.site?.id) && !!rr?.quotes.some((q) => /re-register|reserve pool/.test(q.text));
      const facts: Raw[] = [
        ...s.how.map((x) => html`<li>${x}</li>`),
        ...(needLetter ? [html`<li>邀请函：${letter}</li>`] : []),
        ...(refund?.at
          ? [
              html`<li>${refund.name}：${T.stepWhen(refund, t)}${sold ? '；已售罄，取消后很可能无法再注册' : ''}。${
                rr ? html`<a href="#/rule/${rr.id}">看规则 ›</a>` : ''
              }</li>`,
            ]
          : []),
        ...(multi ? [html`<li><b>${multi.text}</b></li>`] : cov ? [html`<li>${cov.replace(/。$/, '')}。</li>`] : []),
        ...(hold
          ? [html`<li class="cond">申请了${/志愿者/.test(hold.question_zh) ? '志愿者' : '资助'}的：${hold.short_zh} ${L.ANSWER_WORD[hold.answer]}。<a href="#/rule/${hold.id}">看规则 ›</a></li>`]
          : []),
        // No verifiable price: one line, no identity switch (the button below opens the page that has them).
        ...(pr && 'tba' in pr ? [html`<li>价格待公布 · 看官网注册页</li>`] : []),
      ];
      let prices: Raw;
      if (!pr) prices = html``;
      else if ('tba' in pr)
        prices = html`${
          pr.reference?.rows.length
            ? html`<div class="prices ref"><p class="ref-h">${tag('上届')}${editionLabel(pr.reference.from)} 的价格，只作参考</p>${pr.reference.rows.map(
                (r) => html`<div class="price"><div class="pl">${r.label}</div><div class="pv">${r.prices.map((x) => html`<span>${x.tier} <b>${x.amount}</b></span>`)}</div></div>`,
              )}${pr.reference.link ? html`<a class="src-link" href="${pr.reference.link}" target="_blank" rel="noopener">上届原文 ↗</a>` : ''}</div>`
            : ''
        }`;
      else {
        const seg = html`<div class="seg mini" role="radiogroup" aria-label="注册身份">${(['student', 'academic', 'industry'] as const).map(
          (k) => html`<button role="radio" data-act="identity" data-id="${k}" class="${settings.identity === k ? 'on' : ''}" aria-checked="${settings.identity === k}">${T.IDENTITY_ZH[k]}</button>`,
        )}</div>`;
        prices = html`<div class="id-row"><span>注册身份</span>${seg}</div>${
          !pr.rows.length
            ? html`<p class="explain dim">没有这个身份的作者注册价。</p>`
            : html`<div class="prices">${pr.rows.map(
                (r) => html`<div class="price"><div class="pl">${r.label}</div><div class="pv">${r.prices.map(
                  (x) => html`<span class="${x.now ? 'now' : ''}">${x.tier} <b>${x.amount}</b>${x.until ? html`<i>${x.until} 前</i>` : ''}</span>`,
                )}</div>${r.link ? html`<a class="src-link" href="${r.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''}</div>`,
              )}${pr.note ? html`<p class="cap-note in">${pr.note}</p>` : ''}</div>`
        }`;
      }
      return html`<p class="explain">${lead}</p>
        ${facts.length ? html`<ul class="facts">${facts}</ul>` : ''}${prices}`;
    }
    case 'approval': {
      const a = trip.D ? T.approvalDate(trip.D, settings.leadDays, CAL, t) : undefined;
      const crunch = a && trip.presenter === 'me' ? T.approvalAfterAssignment(ed, p, a.day, CAL, t) : undefined;
      const others = T.approvalAtOtherSites(p, ed, settings, CAL, t);
      return html`<p class="explain">按出行设置，出发前 ${settings.leadDays} 个工作日提交出国（境）审批。${settings.passport === 'cn_official' ? '批件下来后再办因公护照、经外办办签证。' : ''}</p>
        ${a && a.left < 0 ? html`<p class="big-line late">来不及：已过 ${-a.left} 个工作日</p>${lateOptions(ed)}` : !a ? html`<p class="explain dim">等会期公布后自动算。</p>` : ''}
        ${crunch ? html`<p class="explain cond">会场 ${T.shortTime(crunch.at)} 公布；之后到 ${L.md(a!.day)} 只有 ${crunch.left} 个工作日。</p>` : ''}
        ${others.map((o) => html`<p class="explain">分到${o.cities.join('、')}：${L.md(o.day)} ${L.weekday(o.day)}${o.estimated ? '（预计）' : ''}。</p>`)}`;
    }
    case 'passport':
      return html`<p class="explain">学校批件下来后办因公护照，再经外办办签证。</p>`;
    case 'visa':
      return html`<p class="explain">${trip.visa.need === 'unknown' ? `${trip.visa.countryZh || '这个国家'}的签证要求本应用还没收录。请看会议的签证页和${P.visaAuthority(trip.visa.cc)}。` : '看签证详情。'}</p>`;
    case 'hotel': {
      const hs = Array.isArray(lg?.hotels) ? [...lg!.hotels].sort((a, b) => a.cutoff.localeCompare(b.cutoff)) : [];
      return html`<p class="explain">协议价酒店按截止日排，过了截止按市场价。机票按批件上的日期订。</p>
        <div class="group inset">${hs.map(
          (h) =>
            html`<a class="row two" href="${h.link ?? '#'}" target="_blank" rel="noopener"><div class="main"><div class="t wrap">${h.name}</div><div class="s"><span>${L.md(h.cutoff)} 截止${h.rate ? ` · ${T.money(h.rate.amount, h.rate.currency)}/晚` : ''}</span></div></div><span class="ext">↗</span></a>`,
        )}</div>`;
    }
    case 'refund': {
      const r = s.rules[0];
      const sold = (lg?.sold_out ?? []).some((x) => !x.site || x.site === trip.site?.id);
      const q = r?.quotes.find((x) => /re-register|reserve pool/.test(x.text));
      return html`<p class="explain">${r ? L.stripSummary(r.summary_zh, r.answer) : '取消注册在这之前申请退款。'}</p>
        ${sold && q ? html`<div class="quote-card warnq"><p class="k">会议已售罄</p><blockquote lang="en">${q.text}</blockquote><a href="${q.deep_link}" target="_blank" rel="noopener">${q.source_title} ↗</a></div>` : ''}`;
    }
    case 'camera':
      return html`<p class="explain">${s.milestone?.note_zh ?? '按官方要求提交终稿。'}</p>`;
    case 'poster': {
      const ps = lg?.poster;
      return html`<p class="explain">${ps && !isTba(ps) ? ps.size_zh : (ps?.note_zh ?? s.milestone?.note_zh ?? '海报要求官方还没公布。')}</p>`;
    }
    case 'visarefund': {
      const r = s.rules[0];
      const applied = trip.visa.regimeId ? settings.visas[trip.visa.regimeId]?.applied : undefined;
      return html`<p class="explain">${r ? L.stripSummary(r.summary_zh, r.answer) : ''}</p>
        ${applied ? html`<p class="explain">你记下的递签日期：${L.md(applied)}${trip.visa.refundApplyBy ? (applied <= trip.visa.refundApplyBy.day ? `，在 ${L.md(trip.visa.refundApplyBy.day)} 之前` : html`，<span class="a-not_allowed">晚于 ${L.md(trip.visa.refundApplyBy.day)}</span>`) : ''}。</p>` : ''}`;
    }
    case 'reimburse': {
      // Only what the rules say (财行〔2013〕516号), each with its sentence.
      const keep = ADMIN.filter((i) => REIMBURSE_DOCS.includes(i.id));
      return html`<p class="explain">回国后按学校规定报销、交回手续。</p>
        ${keep.length ? html`<p class="cap in">要留的材料 · ${keep[0]!.org_zh}</p><ul class="facts">${keep.map(
          (i) => html`<li>${i.text_zh}${i.link ? html` <a href="${i.link}" target="_blank" rel="noopener">原文 ↗</a>` : ''}</li>`,
        )}</ul>` : ''}`;
    }
    default:
      return html``;
  }
}

/**
 * NeurIPS 2026: the presenter's seat is tied to the assigned site, and
 * registering elsewhere means cancelling (official sentences, for the 作者注册 sheet's fold).
 */
function seatQuotes(trip: T.Trip): AppRule['quotes'] {
  if (trip.presenter === 'coauthor' || !trip.edition.sites?.length) return [];
  const lock = rulesOf(trip.edition.id).find((r) => r.effect?.kind === 'lock' && r.effect.target === 'presenting_site');
  return (lock?.quotes ?? []).filter((q) => /guaranteed registration|registered already/.test(q.text));
}

/** The reimbursement material rules shown in the 报销 sheet (and so left out of its 常见要求 fold). */
const REIMBURSE_DOCS = ['fin-2013-516-registration-receipt', 'fin-2013-516-audit-documents'];

/**
 * 步骤详情 (§10.5): the step and its countdown, the key time (and how the
 * venue wrote it), what to do in a sentence or two plus its one key extra,
 * the step's one outward button (the same as on the card), then folds
 * (怎么算的, 相关规则, 常见要求, 官网原文). At the bottom only one filled
 * button: 已完成 (an optional step adds 不申请), and 加入日历.
 */
function sheetStep(paperId: string, stepId: string): SheetView | null {
  const p = getPapers().find((x) => x.id === paperId);
  const trip = p && tripOf(p);
  const s = trip?.steps.find((x) => x.id === stepId);
  if (!p || !trip || !s) return null;
  const t = now();
  const parts = s.target && !s.past ? L.countdown(s.target, t) : [];
  const official = T.stepOfficial(s);
  const hol = holidayOf(s);
  const who = getTrip().identity === 'student' ? 'student' : 'staff';
  const m = s.milestone;
  const soft = s.tag === 'advice' || s.tag === 'settings' || s.tag === 'estimated';
  const go = stepGo(s);
  const folds: Raw[] = [];
  const seat = s.id === 'register' ? seatQuotes(trip) : [];
  if (seat.length)
    folds.push(fold(`官网原句 ${seat.length} 条`, seat.map((q) => quoteFig({ quote: q.text, link: q.deep_link, src_title: q.source_title }))));
  // 作者注册 lists its reasons in the body; the others fold them.
  if (s.how.length && s.id !== 'register' && soft) folds.push(fold('怎么算的', s.how.map((x) => html`<p>${x}</p>`)));
  if (s.rules.length)
    folds.push(
      fold(
        `相关规则 ${s.rules.length} 条`,
        html`<div class="group inset rules-in">${s.rules.map(
          (r) => html`<a class="row" href="#/rule/${r.id}"><span class="t wrap">${r.short_zh ?? r.question_zh}</span>${ansWord(r.answer)}${chev}</a>`,
        )}</div>`,
      ),
    );
  if (s.id === 'approval') folds.push(fold('常见要求', adminExamples(['approval_lead', 'online_approval'], who)));
  if (s.id === 'passport') folds.push(fold('常见要求', adminExamples(['passport'], 'staff')));
  if (s.id === 'reimburse') folds.push(fold('常见要求', adminExamples(['post_trip', 'reimburse'], who, REIMBURSE_DOCS)));
  if (m?.quote && m.deep_link !== go?.url) folds.push(fold('官网原文', html`${quoteFig({ quote: m.quote, link: m.deep_link, src_title: m.src_title })}${m.note_zh ? html`<p>${m.note_zh}</p>` : ''}`));
  const count =
    s.workdays !== undefined && s.workdays > 0 && !s.done
      ? html`<div class="count mid"><b>${s.workdays}</b><i>个工作日</i></div>`
      : parts.length
        ? html`<div class="count mid">${countHtml(parts)}</div>`
        : s.past && !s.done && !s.closed
          ? html`<div class="count mid"><b class="w late">已过</b></div>`
          : '';
  const dated = !!(s.at || s.range);
  const footLine =
    s.tag === 'hard' || s.tag === 'optional'
      ? `官方截止${s.tag === 'optional' ? ' · 选做' : ''}`
      : s.tag === 'tba'
        ? '官方还没公布'
        : dated && soft
          ? '本应用算的日期，不是官方截止'
          : '';
  const optionalOpen = s.optional && !s.done;
  return {
    label: s.name,
    full: true,
    body: html`<p class="eyebrow">${L.editionShort(trip.edition)} · ${T.GROUP_ZH[s.group]}</p>
      <h2 class="step-h">${s.name}${s.suffix ? html`<span class="sfx"> · ${s.suffix}</span>` : ''}${stepTag(s)}</h2>
      ${count}
      ${
        dated
          ? html`<p class="keytime">${icon.clock}<span>${T.stepWhen(s, t)}${s.at?.local.includes('T') ? ' 北京时间' : ''}${hol ? html`<span class="hol"> · ${hol}</span>` : ''}${soft ? '（本应用算的）' : ''}</span></p>`
          : html`<p class="keytime">${icon.clock}<span>${s.text ?? ''}</span></p>`
      }
      ${official ? html`<p class="official-line">${L.officialWord(trip.edition)}：${official}</p>` : ''}
      ${L.isUpstream(trip.edition) ? html`<p class="up-note">${L.UPSTREAM_NOTE}</p>` : ''}
      ${s.note && !['site', 'aid', 'register'].includes(s.id) ? html`<p class="official-line">${s.note}</p>` : ''}
      ${stepBody(p, trip, s)}
      ${go ? html`<a class="btn ghost" href="${go.url}" target="_blank" rel="noopener">${go.label}</a>` : ''}
      ${folds.length ? html`<div class="folds">${folds}</div>` : ''}
      <p class="foot">${footLine ? `${footLine} · ` : ''}${L.isUpstream(trip.edition) ? `ccfddl 数据截至 ${L.md(trip.edition.last_checked)}` : `核对于 ${L.md(trip.edition.last_checked)}`}</p>`,
    foot: html`<div class="two-btns"><button class="btn${s.done ? ' ghost' : ''}" data-act="step-done" data-id="${p.id}" data-step="${s.id}" data-close="1">${
      s.skipped ? '改为要申请' : s.done ? '标为未完成' : s.optional ? '已申请' : '已完成'
    }</button>${
      optionalOpen
        ? html`<button class="btn ghost" data-act="step-skip" data-id="${p.id}" data-step="${s.id}">不申请</button>`
        : T.calKey(s) && s.tag !== 'tba' && !s.done
          ? html`<button class="btn ghost" data-act="export-step" data-id="${p.id}" data-step="${s.id}">加入日历</button>`
          : ''
    }</div>`,
  };
}

// ---------- router ----------

interface Route {
  name: string;
  p: string[];
  hash: string;
}

const ROOTS = new Set(['today', 'venues', 'me', 'welcome']);
const SHEETS = new Set(['rule', 'msource', 'venueinfo', 'place', 'paperNew', 'paperCurrent', 'paperTargets', 'paperAccept', 'paperStep', 'stat', 'topics', 'aboutStats', 'rank']);
/** Past-data routes (§11.10): all under the 会议 tab. */
const STATS_ROUTES = ['stat', 'topics', 'aboutStats', 'areas'];
const ME_ROUTES = ['paperNew', 'paper', 'prefs', 'paperTargets', 'paperCurrent', 'answers', 'install', 'legal', 'paperAccept', 'paperStep', 'paperVenue', 'visa', 'trip'];

function parse(hash: string): Route {
  const seg = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  const h = `#/${seg.join('/')}`;
  const [a, b, c, d, e] = seg;
  const r = (name: string, p: string[] = []): Route => ({ name, p, hash: h });
  switch (a) {
    case 'welcome':
      return b === 'venues' ? r('welcome2') : r('welcome');
    case 'all':
      return r('all');
    case 'm':
      if (b && c) return d === 'source' ? r('msource', [b, c]) : r('milestone', [b, c]);
      break;
    case 'venues':
      return r('venues', [b === 'timeline' || b === 'list' ? b : '']);
    case 'stat':
      if (b && c) return r('stat', [b, c, d ?? '']);
      break;
    case 'topics':
      if (b && c) return r('topics', [b, c]);
      break;
    case 'areas':
      if (b && c) return r('areas', [b, c]);
      break;
    case 'about':
      if (b === 'stats') return r('aboutStats');
      break;
    case 'rank':
      if (b) return r('rank', [b, c ?? '']);
      break;
    case 'visa':
      // #/visa/<regime>, or #/visa/<regime>/<paper> from an accepted paper's checklist.
      if (b) return r('visa', [b, c ?? '']);
      break;
    case 'venue':
      if (b) return c === 'info' ? r('venueinfo', [b]) : c === 'place' ? r('place', [b]) : r('venue', [b, c === 'timeline' || c === 'rules' ? c : '']);
      break;
    case 'series':
      if (b) return r('series', [b]);
      break;
    case 'rule':
      if (b && c) return r('rule', d === 'for' && e ? [`${b}/${c}`, e] : [`${b}/${c}`]);
      break;
    case 'me':
      if (b === 'paper' && c === 'new') return r('paperNew');
      // v0.2's per-paper preferences are now the paper's target venues.
      if (b === 'paper' && c && (d === 'targets' || d === 'prefs')) return r('paperTargets', [c]);
      if (b === 'paper' && c && d === 'current') return r('paperCurrent', [c]);
      // After acceptance (§10.13).
      if (b === 'paper' && c && d === 'accept') return r('paperAccept', [c]);
      if (b === 'paper' && c && d === 'step' && e) return r('paperStep', [c, e]);
      if (b === 'paper' && c && d === 'venue') return r('paperVenue', [c]);
      if (b === 'trip') return r('trip', [c ?? '']);
      if (b === 'paper' && c) return r('paper', [c]);
      // v0.1's 关注的会议 is now 投稿偏好 (followed venues = 首选 + 备选).
      if (b === 'prefs' || b === 'follows') return r('prefs');
      if (b === 'answers' || b === 'install' || b === 'legal') return r(b);
      return r('me');
  }
  return { name: 'today', p: [], hash: '#/today' };
}

function parentHash(r: Route): string {
  switch (r.name) {
    case 'venue':
      return '#/venues';
    case 'rule':
      return `#/venue/${r.p[1] ?? r.p[0]!.split('/')[0]}`;
    case 'msource':
      return `#/m/${r.p[0]}/${r.p[1]}`;
    case 'venueinfo':
    case 'place':
      return `#/venue/${r.p[0]}`;
    case 'rank':
      // A rank sheet sits on its edition's page, or on the page of a series without editions.
      return ED.has(r.p[0]!) ? `#/venue/${r.p[0]}` : `#/series/${r.p[0]}`;
    case 'series':
      return '#/venues';
    case 'welcome2':
      return '#/welcome';
    case 'stat':
    case 'topics':
    case 'areas':
      return seriesHome(r.p[0]!);
    case 'aboutStats':
      return '#/venues';
    case 'paperTargets':
    case 'paperCurrent':
    case 'paperAccept':
    case 'paperStep':
    case 'paperVenue':
      return `#/me/paper/${r.p[0]}`;
    case 'trip':
      return r.p[0] ? `#/me/paper/${r.p[0]}` : '#/me';
    case 'visa':
      return r.p[1] ? `#/me/paper/${r.p[1]}` : '#/me';
    case 'paperNew':
    case 'paper':
    case 'prefs':
    case 'answers':
    case 'install':
    case 'legal':
      return '#/me';
    case 'milestone':
    case 'all':
      return lastTab === 'venues' ? '#/venues' : '#/today';
    default:
      return '#/today';
  }
}

function tabFor(r: Route): Tab {
  if (r.name === 'venues' || r.name === 'venue' || r.name === 'series' || r.name === 'venueinfo' || r.name === 'place' || STATS_ROUTES.includes(r.name)) return 'venues';
  // A visa page opened from a venue's place sheet stays under 会议; from a paper's checklist it is under 我的.
  if (r.name === 'visa' && !r.p[1]) return lastTab;
  if (r.name === 'rank') return lastTab;
  if (r.name === 'me' || ME_ROUTES.includes(r.name)) return 'me';
  if (r.name === 'milestone' || r.name === 'msource' || r.name === 'rule') return lastTab;
  return 'today';
}

function buildView(r: Route): View {
  switch (r.name) {
    case 'welcome':
      return screenWelcome();
    case 'welcome2':
      return screenWelcomeVenues();
    case 'all':
      return screenAll();
    case 'milestone':
      return screenMilestone(r.p[0]!, r.p[1]!);
    case 'venues':
      return screenVenues(r.p[0]);
    case 'areas':
      return screenAreas(r.p[0]!, r.p[1]!);
    case 'venue':
      return screenVenue(r.p[0]!, r.p[1]!);
    case 'series':
      return screenSeries(r.p[0]!);
    case 'me':
      return screenMe();
    case 'prefs':
      return screenPrefs();
    case 'answers':
      return screenAnswers();
    case 'install':
      return screenInstall();
    case 'legal':
      return screenLegal();
    case 'paper':
      return screenPaper(r.p[0]!);
    case 'paperVenue':
      return screenPaperVenue(r.p[0]!);
    case 'visa':
      return screenVisa(r.p[0]!, r.p[1] ?? '');
    case 'trip':
      return screenTripSettings(r.p[0] ?? '');
    default:
      return screenToday();
  }
}

function buildSheet(r: Route): SheetView | null {
  switch (r.name) {
    case 'rule':
      return sheetRule(r.p[0]!, r.p[1]);
    case 'msource':
      return sheetMilestoneSource(r.p[0]!, r.p[1]!);
    case 'venueinfo':
      return sheetVenueInfo(r.p[0]!);
    case 'place':
      return sheetPlace(r.p[0]!);
    case 'paperNew':
      return sheetPaperNew();
    case 'paperCurrent':
      return sheetPaperCurrent(r.p[0]!);
    case 'paperTargets':
      return sheetPaperTargets(r.p[0]!);
    case 'paperAccept':
      return sheetAccept(r.p[0]!);
    case 'paperStep':
      return sheetStep(r.p[0]!, r.p[1]!);
    case 'stat':
      return sheetStat(r.p[0]!, r.p[1]!, r.p[2] ?? '');
    case 'topics':
      return sheetTopics(r.p[0]!, r.p[1]!);
    case 'aboutStats':
      return sheetAboutStats();
    case 'rank':
      return sheetRank(r.p[0]!, r.p[1] || undefined);
    default:
      return null;
  }
}

type Dir = 'push' | 'pop' | 'none' | 'same';

const screensEl = document.getElementById('screens')!;
const tabbarEl = document.getElementById('tabbar')!;
const sheetRoot = document.getElementById('sheet-root')!;

let base: { route: Route; el: HTMLElement } | null = null;
let stack: string[] = [];
let lastTab: Tab = 'today';
let dirty = false;
const scrollMemo = new Map<string, number>();
const sheetInApp = new Map<string, boolean>();
let sheet: { route: Route; wrap: HTMLElement } | null = null;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Push screens: "‹ <parent title>" like iOS ("返回" when opened from a link), title fades in on scroll. */
function navbar(title: string, backTitle?: string, right?: Raw): Raw {
  return html`<div class="navbar"><button class="back" data-act="back" aria-label="返回${backTitle ? ` ${backTitle}` : ''}">${icon.back}<span class="back-t">${backTitle ?? '返回'}</span></button><div class="nav-title">${title}</div>${right ?? ''}</div>`;
}

/** Root tabs: no back button; a compact title bar appears once the large title scrolls away. */
function rootBar(title: string): Raw {
  return html`<div class="navbar root-bar" aria-hidden="true"><div class="nav-title">${title}</div></div>`;
}

const titleMemo = new Map<string, string>();

const TABS: { id: Tab; label: string; href: string; icon: Raw }[] = [
  { id: 'today', label: '下一步', href: '#/today', icon: icon.today },
  { id: 'venues', label: '会议', href: '#/venues', icon: icon.venues },
  { id: 'me', label: '我的', href: '#/me', icon: icon.me },
];
tabbarEl.innerHTML = html`<div class="tabs">${TABS.map(
  (t) => html`<a class="tab" data-tab="${t.id}" href="${t.href}">${t.icon}<span>${t.label}</span></a>`,
)}</div>`.s;

function syncTabbar(tab: Tab) {
  for (const a of tabbarEl.querySelectorAll<HTMLElement>('.tab')) {
    const on = a.dataset.tab === tab;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function swap(old: HTMLElement | undefined, el: HTMLElement, dir: Dir, y: number) {
  const animate = !!old && (dir === 'push' || dir === 'pop') && !reducedMotion() && typeof el.animate === 'function';
  if (!old || !animate) {
    old?.remove();
    screensEl.append(el);
    scrollTo(0, y);
    return;
  }
  old.style.top = `${-scrollY}px`;
  old.classList.add('leaving');
  screensEl.append(el);
  scrollTo(0, y);
  const opts: KeyframeAnimationOptions = { duration: 250, easing: 'cubic-bezier(.25,.8,.25,1)' };
  if (dir === 'push') {
    el.style.zIndex = '2';
    el.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], opts);
    old.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-30%)', opacity: 0.6 }], { ...opts, fill: 'forwards' });
  } else {
    old.style.zIndex = '3';
    el.animate([{ transform: 'translateX(-30%)', opacity: 0.6 }, { transform: 'translateX(0)', opacity: 1 }], opts);
    old.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { ...opts, fill: 'forwards' });
  }
  setTimeout(() => {
    old.remove();
    el.style.zIndex = '';
  }, 270);
}

function show(r: Route, dir: Dir) {
  const view = buildView(r);
  const el = document.createElement('div');
  el.className = `screen ${view.root ? 'root' : 'push'}`;
  titleMemo.set(r.hash, view.title);
  const prev = stack.length > 1 ? stack[stack.length - 2] : undefined;
  const chrome = view.root ? (view.noTabs ? '' : rootBar(view.title).s) : navbar(view.title, prev ? titleMemo.get(prev) : undefined, view.navRight).s;
  el.innerHTML = `${chrome}${view.body.s}`;
  if (base) scrollMemo.set(base.route.hash, scrollY);
  // The timeline card keeps its sideways position on a redraw and on the way back.
  const h = base?.el.querySelector<HTMLElement>('.tl-scroll')?.scrollLeft;
  if (base && h !== undefined) hMemo.set(base.route.hash, h);
  restoreH = dir === 'push' ? undefined : hMemo.get(r.hash);
  const y = dir === 'push' ? 0 : dir === 'same' ? scrollY : (scrollMemo.get(r.hash) ?? 0);
  const old = base?.el;
  base = { route: r, el };
  document.body.classList.toggle('no-tabs', !!view.noTabs);
  syncTabbar(view.tab);
  swap(old, el, dir, y);
  view.mount?.(el);
  document.title = view.root && view.title === '下一步' ? '投稿下一站' : `${view.title} · 投稿下一站`;
  onScroll();
}

function onHash() {
  closeActionSheet();
  const r = parse(location.hash);
  const inWelcome = (x: Route) => x.name === 'welcome' || x.name === 'welcome2';
  // A rank badge in the first-run picker opens its sheet over the picker.
  if (getPrefs() === null && !inWelcome(r) && !(r.name === 'rank' && base && inWelcome(base.route))) {
    location.replace('#/welcome');
    return;
  }
  if (SHEETS.has(r.name)) {
    openSheet(r);
    return;
  }
  if (sheet) closeSheetUI();
  if (base && base.route.hash === r.hash && !dirty) {
    syncTabbar(tabFor(r));
    return;
  }
  let dir: Dir;
  if (!base || (inWelcome(base.route) && !inWelcome(r))) dir = 'none';
  else if (
    base.route.hash === r.hash ||
    (base.route.name === 'venue' && r.name === 'venue' && base.route.p[0] === r.p[0]) ||
    (base.route.name === 'venues' && r.name === 'venues')
  )
    dir = 'same';
  else if (ROOTS.has(r.name)) dir = !ROOTS.has(base.route.name) && tabFor(r) === tabFor(base.route) ? 'pop' : 'none';
  else if (stack.length >= 2 && stack[stack.length - 2] === r.hash) dir = 'pop';
  else dir = 'push';

  if (dir === 'pop') {
    const i = stack.lastIndexOf(r.hash);
    stack = i >= 0 ? stack.slice(0, i + 1) : [r.hash];
  } else if (dir === 'push') stack.push(r.hash);
  else if (dir === 'same') stack[Math.max(0, stack.length - 1)] = r.hash;
  else stack = [r.hash];

  if (r.name !== 'milestone' && r.name !== 'all') lastTab = tabFor(r);
  // A preferences page opens on 首选 with other directions closed, whatever the last one was left on.
  if (r.name === 'prefs' && dir !== 'same') {
    pickTier = 'first';
    showOthers = false;
    prefsDirsOpen = false;
    prefsDiscs = null;
    prefsQuery = '';
    for (const k of [...closedOpen]) if (k.startsWith('global:')) closedOpen.delete(k);
  }
  if (dir !== 'same') hideToast();
  dirty = false;
  show(r, dir);
}

function goBack() {
  if (!base) return;
  if (stack.length > 1) history.back();
  else location.replace(parentHash(base.route));
}

function lockScroll(on: boolean) {
  document.documentElement.classList.toggle('locked', on);
}

function openSheet(r: Route) {
  const view = buildSheet(r);
  if (!view) {
    location.replace(parentHash(r));
    return;
  }
  // Can ✕ use history.back()? Not when the sheet was the first page loaded; a sheet
  // reopened by going back from a nested sheet keeps what it had.
  if (!base) sheetInApp.set(r.hash, false);
  else if (!sheet || !sheetInApp.has(r.hash)) sheetInApp.set(r.hash, true);
  if (!base) {
    const pr = parse(parentHash(r));
    lastTab = tabFor(pr);
    stack = [pr.hash];
    show(pr, 'none');
  }
  const body = html`<div class="sheet-head${view.title ? ' has-title' : ''}"><div class="grabber"></div>${
    view.title ? html`<h2 class="sheet-title">${view.title}</h2>` : ''
  }<button class="close" data-act="close-sheet" aria-label="关闭">${icon.close}</button></div>
    <div class="sheet-body">${view.body}</div>${view.foot ? html`<div class="sheet-foot">${view.foot}</div>` : ''}`;
  const cls = `sheet${view.full ? ' full' : ''}${view.foot ? ' has-foot' : ''}`;
  if (sheet) {
    const panel = sheet.wrap.querySelector<HTMLElement>('.sheet')!;
    panel.className = cls;
    panel.setAttribute('aria-label', view.label);
    panel.innerHTML = body.s;
    sheet.route = r;
    view.mount?.(panel);
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = html`<div class="backdrop" data-act="close-sheet"></div><div class="${cls}" role="dialog" aria-modal="true" aria-label="${view.label}">${body}</div>`.s;
  sheetRoot.append(wrap);
  sheet = { route: r, wrap };
  lockScroll(true);
  const panel = wrap.querySelector<HTMLElement>('.sheet')!;
  view.mount?.(panel);
  attachDrag(panel);
  if (!reducedMotion() && typeof panel.animate === 'function') {
    panel.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.25,1)' });
    wrap.querySelector('.backdrop')!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  }
  panel.querySelector<HTMLElement>('.close')?.focus({ preventScroll: true });
}

function closeSheetUI() {
  if (!sheet) return;
  const { wrap } = sheet;
  sheet = null;
  draft = null;
  acceptDraft = null;
  currentOthers = false;
  hideToast();
  lockScroll(false);
  const panel = wrap.querySelector<HTMLElement>('.sheet')!;
  if (reducedMotion() || typeof panel.animate !== 'function') {
    wrap.remove();
    return;
  }
  wrap.style.pointerEvents = 'none';
  const from = panel.style.transform || 'translateY(0)';
  panel.animate([{ transform: from }, { transform: 'translateY(100%)' }], { duration: 250, easing: 'ease-in', fill: 'forwards' });
  wrap.querySelector('.backdrop')!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
  setTimeout(() => wrap.remove(), 260);
}

/** Redraw the open sheet in place: same scroll position, focus back on `focus` (the row just tapped). */
function refreshSheet(focus?: string) {
  if (!sheet) return;
  const y = sheet.wrap.querySelector('.sheet-body')?.scrollTop ?? 0;
  openSheet(sheet.route);
  const body = sheet?.wrap.querySelector<HTMLElement>('.sheet-body');
  if (body) body.scrollTop = y;
  if (focus) sheet?.wrap.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
}

/**
 * ✕, the backdrop, a swipe down, Esc. A picker with unsaved changes asks
 * first (放弃 / 继续编辑) instead of dropping them; `force` skips that (after
 * 完成, or 放弃). Returns whether the sheet is closing.
 */
function requestCloseSheet(force = false): boolean {
  if (!sheet) return false;
  if (!force && closeBlocked()) {
    askDiscard();
    return false;
  }
  const r = sheet.route;
  if (sheetInApp.get(r.hash)) history.back();
  else location.replace(base ? base.route.hash : parentHash(r));
  return true;
}

/** The open sheet is a target picker holding changes that closing would lose. */
const closeBlocked = () => !!sheet && !!draft && ['paperNew', 'paperTargets'].includes(sheet.route.name) && draftChanged(draft);

/** iOS-style action sheet over the picker: "放弃这篇论文？" / "放弃修改？" with 放弃 and 继续编辑. */
function askDiscard() {
  if (!sheet || sheet.wrap.querySelector('.as-wrap')) return;
  const isNew = sheet.route.name === 'paperNew';
  const el = document.createElement('div');
  el.className = 'as-wrap';
  el.innerHTML = html`<div class="as-backdrop" data-act="keep-editing"></div>
    <div class="as" role="alertdialog" aria-modal="true" aria-label="${isNew ? '放弃这篇论文？' : '放弃修改？'}">
      <div class="as-group"><p class="as-t">${isNew ? '放弃这篇论文？' : '放弃修改？'}</p><p class="as-s">${isNew ? '选好的会议不会保存。' : '目标会议保持原样。'}</p>
      <button class="as-b danger" data-act="discard">放弃</button></div>
      <button class="as-b cancel" data-act="keep-editing">继续编辑</button></div>`.s;
  sheet.wrap.append(el);
  if (!reducedMotion() && typeof el.animate === 'function') {
    el.querySelector('.as')!.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 250, easing: 'cubic-bezier(.2,.9,.25,1)' });
    el.querySelector('.as-backdrop')!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  }
  el.querySelector<HTMLElement>('.cancel')?.focus({ preventScroll: true });
}

function closeDiscard(): boolean {
  const el = sheet?.wrap.querySelector('.as-wrap');
  el?.remove();
  return !!el;
}

function attachDrag(panel: HTMLElement) {
  let startY = 0;
  let dy = 0;
  let t0 = 0;
  let dragging = false;
  panel.addEventListener(
    'touchstart',
    (e) => {
      const body = panel.querySelector<HTMLElement>('.sheet-body');
      const onHead = !!(e.target as Element).closest('.sheet-head');
      if (!onHead && body && body.scrollTop > 0) return;
      dragging = true;
      startY = e.touches[0]!.clientY;
      dy = 0;
      t0 = Date.now();
    },
    { passive: true },
  );
  // With unsaved picks the sheet only gives a little (like an iOS sheet that is being edited),
  // springs back, and asks.
  const shown = () => (closeBlocked() ? dy * 0.3 : dy);
  panel.addEventListener(
    'touchmove',
    (e) => {
      if (!dragging) return;
      dy = e.touches[0]!.clientY - startY;
      if (dy <= 0) {
        panel.style.transform = '';
        return;
      }
      e.preventDefault();
      panel.style.transform = `translateY(${shown()}px)`;
    },
    { passive: false },
  );
  panel.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    const fast = dy > 40 && Date.now() - t0 < 250;
    const at = shown();
    if ((dy > 110 || fast) && requestCloseSheet()) return;
    if (dy > 0) {
      panel.animate([{ transform: `translateY(${at}px)` }, { transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' });
      panel.style.transform = '';
    }
  });
}

function onScroll() {
  const nav = base?.el.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', scrollY > 44);
}

// ---------- toast (撤销) ----------

let toastEl: HTMLElement | null = null;
let toastTimer = 0;
let toastUndo: (() => void) | null = null;

/**
 * A short note above the tab bar, with 撤销 when `undo` is given; gone after
 * 4 s (2.5 s without 撤销). Over an open sheet it sits above the sheet's footer.
 */
function showToast(text: string, undo?: () => void) {
  hideToast();
  toastUndo = undo ?? null;
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = html`<span>${text}</span>${undo ? html`<button data-act="undo">撤销</button>` : ''}`.s;
  if (sheet) {
    const foot = sheet.wrap.querySelector<HTMLElement>('.sheet-foot');
    toastEl.classList.add('over-sheet');
    toastEl.style.bottom = `${(foot?.offsetHeight ?? 0) + 12}px`;
  }
  document.body.append(toastEl);
  toastTimer = window.setTimeout(hideToast, undo ? 4000 : 2500);
}

let noteTimer = 0;

/** The picker footer's rule line turns into `text` (red) for 2.5 s, then back; nothing moves. */
function flashNote(text: string) {
  const note = sheet?.wrap.querySelector<HTMLElement>('[data-note]');
  if (!note) return;
  const rule = note.dataset.rule ?? note.textContent ?? '';
  note.dataset.rule = rule;
  note.textContent = text;
  note.classList.add('alert');
  clearTimeout(noteTimer);
  noteTimer = window.setTimeout(() => {
    note.textContent = rule;
    note.classList.remove('alert');
  }, 2500);
}

function hideToast() {
  clearTimeout(toastTimer);
  toastEl?.remove();
  toastEl = null;
  toastUndo = null;
}

// ---------- actions ----------

interface PickCtx {
  dirs: R.Direction[];
  prefs: R.Prefs;
  tier: R.Tier;
}

/** A preferences picker's state: first run (in memory until 开始) or the global preferences. */
function pickCtx(ctx: string): PickCtx | null {
  if (ctx === 'welcome') {
    const w = welcomeState();
    return { dirs: w.dirs, prefs: w.prefs, tier: w.tier };
  }
  if (ctx === 'global') return { dirs: getDirs() ?? DEFAULT_DIRS, prefs: getPrefs() ?? NO_PREFS, tier: pickTier };
  return null;
}

/** Saves right away (the preferences pages have no Save button); first run keeps it until 开始. */
function setPickCtx(ctx: string, next: Partial<PickCtx>) {
  if (ctx === 'welcome') {
    const w = welcomeState();
    if (next.dirs) {
      const dirs = next.dirs;
      w.order = [...w.order.filter((d) => dirs.includes(d)), ...dirs.filter((d) => !w.order.includes(d))];
      w.dirs = dirs;
      // Until the user touches the list, it follows the first direction's usual 首选.
      if (!w.edited) w.prefs = R.defaultPrefs(w.order, KNOWN);
    }
    if (next.prefs) {
      w.prefs = next.prefs;
      w.edited = true;
    }
    if (next.tier) w.tier = next.tier;
    return;
  }
  if (next.tier) pickTier = next.tier;
  if (ctx === 'global') {
    if (next.dirs) setDirs(next.dirs);
    if (next.prefs) setPrefs(next.prefs);
  }
}

/** Redraw the current screen in place (same scroll position). */
function rerender() {
  if (base) show(base.route, 'same');
}

// ---------- after acceptance: actions ----------

const findPaper = (id: string) => getPapers().find((x) => x.id === id);

/** A note after a sheet closes (closing clears toasts). */
function toastLater(text: string, undo?: () => void) {
  setTimeout(() => showToast(text, undo), 320);
}

function markAccepted(id: string, edition: string, site?: string, assigned?: string) {
  const before = findPaper(id);
  if (!before) return;
  updatePaper(id, (p) => ({ ...p, accepted: { edition, at: L.beijingDate(now()) }, site: site ?? p.site, assigned: assigned ?? p.assigned, snooze: undefined }));
  return () => updatePaper(id, (p) => ({ ...p, accepted: before.accepted, site: before.site, assigned: before.assigned }));
}

/**
 * Tick a step off (or back on). Ticks stay with the paper even if it goes
 * back to 审稿中. A step said no to (不申请) goes back to open.
 */
function toggleStep(id: string, step: string): boolean {
  const p = findPaper(id);
  if (!p) return false;
  if ((p.skip ?? []).includes(step) && !(p.done ?? []).includes(step)) {
    updatePaper(id, (x) => ({ ...x, skip: (x.skip ?? []).filter((d) => d !== step) }));
    return false;
  }
  const on = !(p.done ?? []).includes(step);
  updatePaper(id, (x) => ({ ...x, done: on ? [...(x.done ?? []), step] : (x.done ?? []).filter((d) => d !== step) }));
  return on;
}

/** 分到哪 (§10.1): the site the paper was assigned; the checklist is worked out again for it. */
function setAssigned(id: string, site: string) {
  const p = findPaper(id);
  const ed = p?.accepted && ED.get(p.accepted.edition);
  const x = ed?.sites?.find((s) => s.id === site);
  if (!p || !ed || !x) return;
  const before = p.assigned;
  updatePaper(id, (q) => ({ ...q, assigned: site }));
  const note = `清单已按${T.siteCity(x)}重算`;
  const undo = () => {
    updatePaper(id, (q) => ({ ...q, assigned: before }));
    rerender();
  };
  if (sheet) {
    dirty = true;
    requestCloseSheet(true);
    toastLater(note, undo);
    return;
  }
  rerender();
  showToast(note, undo);
}

function download(name: string, text: string, type = 'text/calendar;charset=utf-8') {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch {
    showToast('这个浏览器不能下载文件');
  }
}

/** 加入日历 (§10.8): the paper's checklist (or one step) as an .ics file; remembers what was exported. */
function exportCalendar(id: string, only?: string) {
  const p = findPaper(id);
  const trip = p && tripOf(p);
  if (!p || !trip) return;
  const steps = only ? trip.steps.filter((x) => x.id === only) : trip.steps;
  const { text, keys } = T.icsFor(p, L.editionShort(trip.edition), steps, now());
  const n = Object.keys(keys).length;
  if (!n) {
    showToast('没有可以导出的日期');
    return;
  }
  download(only ? `nv-${p.name.replace(/\s+/g, '')}-${only}.ics` : T.icsName(p.name, trip.edition.id), text);
  updatePaper(id, (x) => ({ ...x, cal: { ...(x.cal ?? {}), ...keys } }));
  if (!sheet) rerender();
  showToast(n === 1 ? '已导出 1 项，用日历打开文件' : `已导出 ${n} 项，用日历打开文件`);
}

/** iOS-style action sheet over a page (⋯): a title, actions, 取消. */
function actionSheet(title: string, buttons: { label: string; act: string; id: string; danger?: boolean }[]) {
  closeActionSheet();
  const el = document.createElement('div');
  el.className = 'as-wrap page-as';
  el.innerHTML = html`<div class="as-backdrop" data-act="as-close"></div>
    <div class="as" role="alertdialog" aria-modal="true" aria-label="${title}"><div class="as-group"><p class="as-t">${title}</p>${buttons.map(
      (b) => html`<button class="as-b${b.danger ? ' danger' : ''}" data-act="${b.act}" data-id="${b.id}">${b.label}</button>`,
    )}</div><button class="as-b cancel" data-act="as-close">取消</button></div>`.s;
  document.body.append(el);
  if (!reducedMotion() && typeof el.animate === 'function') {
    el.querySelector('.as')!.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 250, easing: 'cubic-bezier(.2,.9,.25,1)' });
    el.querySelector('.as-backdrop')!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  }
  el.querySelector<HTMLElement>('.cancel')?.focus({ preventScroll: true });
}

function closeActionSheet(): boolean {
  const el = document.querySelector('.page-as');
  el?.remove();
  return !!el;
}

/** 出行设置 and the visa page's switches: saved at once, then the page redraws. */
function applySetting(key: string, id: string, value: string | boolean) {
  const v = typeof value === 'string' ? value : '';
  if (['presenter', 'site', 'assigned', 'depart', 'back'].includes(key)) {
    updatePaper(id, (p) => {
      if (key === 'presenter') return { ...p, presenter: v === 'coauthor' ? 'coauthor' : undefined };
      if (key === 'site') return { ...p, site: v || undefined };
      if (key === 'assigned') return { ...p, assigned: v || undefined };
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
      return key === 'depart' ? { ...p, depart: ok } : { ...p, back: ok };
    });
    return;
  }
  const t = getTrip();
  if (key === 'passport') t.passport = v === 'cn_official' || v === 'other' ? v : 'cn_ordinary';
  else if (key === 'approval') t.approval = value === true;
  else if (key === 'city') t.city = v || undefined;
  else if (key === 'leadDays') t.leadDays = Math.min(200, Math.max(1, Math.round(Number(v)) || t.leadDays));
  else if (key === 'reimburseDays') t.reimburseDays = Math.min(365, Math.max(1, Math.round(Number(v)) || t.reimburseDays));
  else if (key.startsWith('visa-')) {
    const cur = { ...(t.visas[id] ?? {}) };
    if (key === 'visa-have') cur.have = value === true || undefined;
    if (key === 'visa-evus') cur.evus = value === true || undefined;
    if (key === 'visa-applied') cur.applied = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
    t.visas = { ...t.visas, [id]: cur };
  }
  setTrip(t);
}

document.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  const key = el.dataset?.set;
  if (!key) return;
  applySetting(key, el.dataset.id ?? '', el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value);
  if (sheet) {
    dirty = true;
    refreshSheet();
  } else rerender();
});

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const tab = target.closest<HTMLAnchorElement>('.tab');
  if (tab && base && tab.getAttribute('href') === base.route.hash) {
    e.preventDefault();
    scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    return;
  }
  const el = target.closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id ?? '';
  switch (act) {
    case 'back':
      goBack();
      break;
    case 'close-sheet':
      requestCloseSheet();
      break;
    case 'discard':
      closeDiscard();
      requestCloseSheet(true);
      break;
    case 'keep-editing':
      closeDiscard();
      break;
    case 'new-dirs':
      // 添加论文: the 方向 row opens its chips in place.
      if (!draft) break;
      draft.dirsOpen = !draft.dirsOpen;
      refreshSheet('[data-act="new-dirs"]');
      break;
    case 'seg':
      location.replace(el.dataset.href!);
      break;
    case 'venues-seg':
      // 列表 | 时间线 on the 会议 tab; remembered for next time.
      writeKey(K_VENUES_SEG, id === 'timeline' ? 'timeline' : 'list');
      location.replace(`#/venues/${id === 'timeline' ? 'timeline' : 'list'}`);
      break;
    case 'stat-tab':
      statTab.set(el.dataset.series ?? '', id === 'findings' ? 'findings' : 'main');
      rerender();
      break;
    case 'topic-year':
      topicYear.set(el.dataset.series ?? '', Number(id));
      rerender();
      break;
    case 'area-year':
      areaYear.set(el.dataset.series ?? '', Number(id));
      rerender();
      break;
    case 'tl-today': {
      const sc = base?.el.querySelector<HTMLElement>('.tl-scroll');
      sc?.scrollTo({ left: Number(sc.dataset.start ?? 0), behavior: reducedMotion() ? 'auto' : 'smooth' });
      break;
    }
    case 'lane': {
      // A bar is a link of its own; a tap between bars opens the nearest edition.
      if (target.closest('a')) return;
      const x = (e as MouseEvent).clientX - el.getBoundingClientRect().left;
      const spans = (el.dataset.spans ?? '')
        .split(',')
        .filter(Boolean)
        .map((p) => {
          const [edition = '', from = '0', to = '0'] = p.split(':');
          return { edition, from: Number(from), to: Number(to) };
        });
      const ed = TL.nearestAt({ spans, open: el.dataset.open || undefined }, x);
      if (ed) location.hash = `#/venue/${ed}/timeline`;
      break;
    }
    case 'rank':
      // A rank badge: its lists, not the row it sits in.
      e.preventDefault();
      location.hash = `#/rank/${id}${el.dataset.list ? `/${el.dataset.list}` : ''}`;
      break;
    case 'disc': {
      // 学科 row: open or close its directions (several can be open).
      const ctx = el.dataset.ctx ?? '';
      const flip = (open: string[]) => (open.includes(id) ? open.filter((x) => x !== id) : [...open, id]);
      if (ctx === 'welcome') welcomeState().open = flip(welcomeState().open);
      else if (ctx === 'new' && draft) {
        draft.open = flip(draft.open);
        refreshSheet(`[data-act="disc"][data-id="${id}"]`);
        break;
      } else if (ctx === 'global') prefsDiscs = flip(prefsDiscs ?? TX.openAtFirst(TAX, getDirs() ?? DEFAULT_DIRS));
      rerender();
      base?.el.querySelector<HTMLElement>(`[data-act="disc"][data-id="${id}"]`)?.focus({ preventScroll: true });
      break;
    }
    case 'prefs-dirs':
      // 投稿偏好: the 方向 row opens the 学科 → 方向 picker in place.
      prefsDirsOpen = !prefsDirsOpen;
      rerender();
      break;
    case 'search-clear': {
      const ctx = el.dataset.ctx ?? '';
      setQuery(ctx, '');
      if (ctx === 'target') refreshSheet();
      else rerender();
      break;
    }
    case 'dir': {
      const d = id as R.Direction;
      const ctx = el.dataset.ctx ?? '';
      if (ctx === 'new') {
        // 添加论文 sheet: the direction decides which venues are listed under 其他会议.
        if (!draft) break;
        const next = TX.toggleDir(draft.dirs, d);
        if (!next.length) {
          showToast('至少选 1 个方向');
          break;
        }
        draft.dirs = next;
        refreshSheet(`[data-act="dir"][data-id="${d}"]`);
        break;
      }
      const c = pickCtx(ctx);
      if (!c) break;
      if (ctx === 'welcome') {
        // The preselected 机器学习 gives way to the first other chip (TX.pickDir); first run may be emptied (下一步 then waits).
        const w = welcomeState();
        const next = TX.pickDir({ dirs: w.dirs, defaulted: w.defaulted }, d);
        w.defaulted = next.defaulted;
        setPickCtx(ctx, { dirs: next.dirs });
      } else {
        const dirs = TX.toggleDir(c.dirs, d);
        // Saved directions keep at least one.
        if (!dirs.length) break;
        setPickCtx(ctx, { dirs });
      }
      rerender();
      base?.el.querySelector<HTMLElement>(`[data-act="dir"][data-id="${d}"]`)?.focus({ preventScroll: true });
      break;
    }
    case 'tier':
      setPickCtx(el.dataset.ctx ?? '', { tier: id === 'backup' ? 'backup' : 'first' });
      rerender();
      break;
    case 'pick': {
      const ctx = el.dataset.ctx ?? '';
      const c = pickCtx(ctx);
      if (!c) break;
      setPickCtx(ctx, { prefs: R.togglePick(c.prefs, id, c.tier) });
      rerender();
      break;
    }
    case 'remove': {
      // Preferences pages: ⊖ takes a venue out; 撤销 puts it back for a few seconds.
      const ctx = el.dataset.ctx ?? '';
      const c = pickCtx(ctx);
      if (!c) break;
      const next = R.removePick(c.prefs, id);
      if (!next.first.length) {
        showToast('至少留 1 个首选');
        break;
      }
      setPickCtx(ctx, { prefs: next });
      rerender();
      const before = c.prefs;
      showToast(`已移除 ${SERIES_BY_ID.get(id)?.name ?? id}`, () => {
        setPickCtx(ctx, { prefs: before });
        rerender();
      });
      break;
    }
    case 'undo':
      toastUndo?.();
      hideToast();
      break;
    case 'show-closed':
      closedOpen.add(`${el.dataset.ctx ?? ''}:${id}`);
      if (el.dataset.ctx === 'target') refreshSheet();
      else rerender();
      break;
    case 'disc-fold': {
      // "其他方向的会议" by 学科: open or close one 学科's venues.
      const k = `${el.dataset.ctx ?? ''}:${id}:disc`;
      if (closedOpen.has(k)) closedOpen.delete(k);
      else closedOpen.add(k);
      if (el.dataset.ctx === 'target') refreshSheet(`[data-act="disc-fold"][data-id="${id}"]`);
      else {
        rerender();
        base?.el.querySelector<HTMLElement>(`[data-act="disc-fold"][data-id="${id}"]`)?.focus({ preventScroll: true });
      }
      break;
    }
    case 'show-others': {
      if (el.dataset.ctx === 'welcome') welcomeState().others = true;
      else showOthers = true;
      rerender();
      break;
    }
    case 'target': {
      // Target picker: select / deselect; a 4th pick changes nothing and says why.
      if (!draft) break;
      const r = R.toggleTarget(draft.targets, id);
      if (r.full) {
        // Said in the footer, where the picks are listed: nothing in the list is covered.
        flashNote(`最多选 ${R.MAX_TARGETS} 个，先取消一个`);
        const cnt = sheet?.wrap.querySelector<HTMLElement>('[data-count]');
        if (cnt && typeof cnt.animate === 'function' && !reducedMotion())
          cnt.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], {
            duration: 240,
            iterations: 2,
          });
        break;
      }
      draft.targets = r.targets;
      refreshSheet(`[data-act="target"][data-id="${id}"]`);
      break;
    }
    case 'target-others':
      if (!draft) break;
      draft.others = true;
      refreshSheet();
      break;
    case 'save-targets': {
      const d = draft;
      if (!d || !d.targets.length) return;
      // The priority is fixed here, and stays until the next 修改.
      updatePaper(id, (p) => ({ ...p, targets: draftOrder(d) }));
      dirty = true;
      requestCloseSheet(true);
      break;
    }
    case 'current-others':
      currentOthers = true;
      if (sheet) openSheet(sheet.route);
      break;
    case 'move': {
      const ctx = el.dataset.ctx ?? '';
      const c = pickCtx(ctx);
      if (!c) break;
      setPickCtx(ctx, { prefs: R.movePick(c.prefs, id, el.dataset.dir === '-1' ? -1 : 1) });
      rerender();
      // Keep the focus on the moved row's arrow so repeated taps keep moving it.
      base?.el.querySelector<HTMLElement>(`[data-act="move"][data-id="${id}"][data-dir="${el.dataset.dir}"]:not([disabled])`)?.focus({ preventScroll: true });
      break;
    }
    case 'welcome-next':
      if (!welcomeState().dirs.length) return;
      location.hash = '#/welcome/venues';
      break;
    case 'start': {
      const w = welcomeState();
      if (!w.prefs.first.length) return;
      setDirs(w.dirs);
      setPrefs(w.prefs);
      welcome = null;
      location.replace('#/today');
      break;
    }
    case 'set-current': {
      const value = el.dataset.value || undefined;
      updatePaper(id, (p) => ({ ...p, current: value }));
      dirty = true;
      requestCloseSheet();
      break;
    }
    case 'expand-past':
      el.closest('.group')?.classList.add('show-past');
      el.remove();
      break;
    case 'more':
      el.closest('.reading')?.classList.add('open');
      el.hidden = true;
      break;
    case 'add-paper': {
      const d = draft;
      if (!d || !d.targets.length || !d.dirs.length) return;
      const input = document.getElementById('paper-name') as HTMLInputElement | null;
      const name = (input?.value ?? d.name).trim() || '论文';
      const papers = getPapers();
      const paperId = Math.random().toString(36).slice(2, 8);
      papers.push({ id: paperId, name, dirs: d.dirs, targets: draftOrder(d) });
      setPapers(papers);
      dirty = true;
      // Land on the new paper's status, not back on the list. The sheet's own
      // history entry becomes the paper page, so ‹ goes back to where it opened.
      const target = `#/me/paper/${paperId}`;
      if (sheet && sheetInApp.get(sheet.route.hash)) location.replace(target);
      else {
        history.replaceState(null, '', '#/me');
        location.hash = target;
      }
      break;
    }
    case 'delete-paper': {
      const p = getPapers().find((x) => x.id === id);
      if (!p || !confirm(`删除「${p.name}」？`)) return;
      setPapers(getPapers().filter((x) => x.id !== id));
      dirty = true;
      goBack();
      break;
    }
    case 'install':
      void installPrompt?.prompt?.();
      break;
    // ---------- after acceptance ----------
    case 'accept-yes': {
      const p = findPaper(id);
      const ed = p?.current ? ED.get(p.current) : undefined;
      if (!p || !ed) break;
      // A multi-site edition first asks which site (it decides visa, fees and dates).
      if (ed.sites?.length) {
        acceptDraft = { paper: p.id, edition: ed.id, site: p.site };
        location.hash = `#/me/paper/${p.id}/accept`;
        break;
      }
      const undo = markAccepted(p.id, ed.id);
      rerender();
      scrollTo(0, 0);
      showToast(`已标记为录用：${L.editionShort(ed)}`, () => {
        undo?.();
        rerender();
      });
      break;
    }
    case 'accept-no': {
      const p = findPaper(id);
      if (!p) break;
      const cur = p.current;
      updatePaper(id, (x) => ({ ...x, current: undefined, snooze: undefined }));
      rerender();
      showToast('已清掉在投，路线从下一站排', () => {
        updatePaper(id, (x) => ({ ...x, current: cur }));
        rerender();
      });
      break;
    }
    case 'accept-later':
      updatePaper(id, (x) => ({ ...x, snooze: now() + 24 * 3_600_000 }));
      rerender();
      showToast('24 小时后再问', () => {
        updatePaper(id, (x) => ({ ...x, snooze: undefined }));
        rerender();
      });
      break;
    case 'accept-edition':
      if (!acceptDraft) break;
      acceptDraft.edition = id;
      if (!ED.get(id)?.sites?.some((x) => x.id === acceptDraft!.site)) acceptDraft.site = undefined;
      refreshSheet(`[data-act="accept-edition"][data-id="${id}"]`);
      break;
    case 'accept-site': {
      // A site marks the paper at once; 撤销 in the toast.
      const d = acceptDraft;
      const ed = d?.edition ? ED.get(d.edition) : undefined;
      const x = ed?.sites?.find((s) => s.id === id);
      if (!d || !ed || !x) break;
      const at = T.assignmentAt(ed);
      const out = !!at && Date.parse(at.utc) <= now();
      const undo = markAccepted(d.paper, ed.id, id, out ? id : undefined);
      dirty = true;
      requestCloseSheet(true);
      toastLater(`已标记为录用 · ${out ? '分到' : '意向'}${T.siteCity(x)}`, () => {
        undo?.();
        rerender();
      });
      break;
    }
    case 'set-assigned':
      setAssigned(id, el.dataset.value ?? '');
      break;
    case 'step-skip': {
      const step = el.dataset.step ?? '';
      const name = tripOf(findPaper(id)!)?.steps.find((x) => x.id === step)?.name ?? '';
      updatePaper(id, (x) => ({ ...x, skip: [...new Set([...(x.skip ?? []), step])], done: (x.done ?? []).filter((d) => d !== step) }));
      const undo = () => {
        updatePaper(id, (x) => ({ ...x, skip: (x.skip ?? []).filter((d) => d !== step) }));
        rerender();
      };
      if (sheet) {
        dirty = true;
        requestCloseSheet(true);
        toastLater(`已记为不申请：${name}`, undo);
      } else {
        rerender();
        showToast(`已记为不申请：${name}`, undo);
      }
      break;
    }
    case 'confirm-accept': {
      const d = acceptDraft;
      if (!d?.edition) break;
      const ed = ED.get(d.edition)!;
      if (ed.sites?.length) break;
      const undo = markAccepted(id, d.edition);
      dirty = true;
      requestCloseSheet(true);
      toastLater(`已标记为录用：${L.editionShort(ed)}`, () => {
        undo?.();
        rerender();
      });
      break;
    }
    case 'paper-more': {
      const p = findPaper(id);
      if (p) actionSheet(p.name, [{ label: '改回审稿中', act: 'unaccept', id }]);
      break;
    }
    case 'as-close':
      closeActionSheet();
      break;
    case 'unaccept': {
      closeActionSheet();
      const p = findPaper(id);
      if (!p?.accepted) break;
      const acc = p.accepted;
      updatePaper(id, (x) => ({ ...x, accepted: undefined }));
      rerender();
      scrollTo(0, 0);
      showToast('已改回审稿中，勾过的步骤留着', () => {
        updatePaper(id, (x) => ({ ...x, accepted: acc }));
        rerender();
      });
      break;
    }
    case 'toggle-done':
    case 'step-done': {
      const step = el.dataset.step ?? '';
      const before = findPaper(id);
      const on = toggleStep(id, step);
      const name = tripOf(findPaper(id)!)?.steps.find((x) => x.id === step)?.name ?? '';
      const undo = () => {
        if (before) updatePaper(id, (x) => ({ ...x, done: before.done, skip: before.skip }));
        rerender();
      };
      if (el.dataset.close && sheet) {
        dirty = true;
        requestCloseSheet(true);
        toastLater(on ? `已完成：${name}` : `标为未完成：${name}`, undo);
        break;
      }
      rerender();
      if (on) showToast(`已完成：${name}`, undo);
      break;
    }
    case 'export-ics':
      exportCalendar(id);
      break;
    case 'export-step':
      exportCalendar(id, el.dataset.step);
      break;
    case 'set-site':
      updatePaper(id, (x) => ({ ...x, site: el.dataset.value || undefined }));
      dirty = true;
      refreshSheet(`[data-act="set-site"][data-value="${el.dataset.value}"]`);
      break;
    case 'identity': {
      const t = getTrip();
      t.identity = id === 'academic' || id === 'industry' ? id : 'student';
      setTrip(t);
      if (sheet) {
        dirty = true;
        refreshSheet(`[data-act="identity"][data-id="${id}"]`);
      } else rerender();
      break;
    }
    case 'reset-dates':
      updatePaper(id, (x) => ({ ...x, depart: undefined, back: undefined }));
      rerender();
      break;
    case 'copy':
      copyText(el.dataset.value ?? '').then((ok) => showToast(ok ? '已复制地址' : '没能复制，请长按地址手动复制'));
      break;
  }
});

/**
 * Put `text` on the clipboard. The async API needs a secure page (https or
 * localhost); a phone opening the app over the LAN (http://10.x) falls back
 * to a selected hidden field and the older copy command.
 */
async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the older way */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  (sheet?.wrap ?? document.body).append(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

// The 已完成 fold stays as the user left it when the page redraws (e.g. after a tick).
document.addEventListener(
  'toggle',
  (e) => {
    const d = e.target as HTMLDetailsElement;
    const id = d.classList?.contains('done-fold') ? d.dataset.paper : undefined;
    if (!id) return;
    if (d.open) doneOpen.add(id);
    else doneOpen.delete(id);
  },
  true,
);

// A date row: the native input lies over the whole row; on desktop open its picker on a tap.
document.addEventListener('click', (e) => {
  const el = e.target as HTMLInputElement;
  if (!el.classList?.contains('date-in')) return;
  try {
    el.showPicker?.();
  } catch {
    /* not allowed here; the browser's own behaviour stays */
  }
});

// The typed 代号 survives redraws of the 添加论文 sheet.
document.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'paper-name' && draft) draft.name = el.value;
  // A venue search box: only the list under it is redrawn, so the keyboard and caret stay.
  const ctx = el.dataset?.search;
  if (ctx) {
    setQuery(ctx, el.value);
    redrawResults(ctx);
    el.parentElement?.querySelector<HTMLElement>('.search-x')?.toggleAttribute('hidden', !el.value);
  }
});

// A venue search box on a page: bring it up under the bar, so the results (not the 首选 card above it) fill
// the room the keyboard leaves; the fixed 开始 bar steps aside meanwhile (style.css).
document.addEventListener('focusin', (e) => {
  const el = e.target as HTMLElement;
  if (!el.matches?.('.search') || el.closest('.sheet')) return;
  setTimeout(() => el.closest('.search-wrap')?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' }), 50);
});

/** What a venue search box holds, per picker: first run, 投稿偏好, the target picker. */
function setQuery(ctx: string, q: string) {
  if (ctx === 'welcome') welcomeState().q = q;
  else if (ctx === 'global') prefsQuery = q;
  else if (ctx === 'target' && draft) draft.q = q;
}

function redrawResults(ctx: string) {
  const root = ctx === 'target' ? sheet?.wrap : base?.el;
  const box = root?.querySelector<HTMLElement>(`[data-results="${ctx}"]`);
  if (!box) return;
  if (ctx === 'target') {
    if (draft) box.innerHTML = targetResults(draft).s;
    return;
  }
  const c = pickCtx(ctx);
  if (!c) return;
  const others = ctx === 'welcome' ? welcomeState().others : showOthers;
  box.innerHTML = pickResults(ctx, c.dirs, c.prefs, c.tier, others, ctx === 'welcome' ? welcomeState().q : prefsQuery).s;
}

/** stats.js arrived (or failed): draw again what was waiting for it. */
function statsArrived() {
  if (sheet && ['stat', 'topics'].includes(sheet.route.name)) refreshSheet();
  if (base && ['venue', 'areas'].includes(base.route.name)) rerender();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (closeActionSheet()) return;
  if (sheet && !closeDiscard()) requestCloseSheet();
});

addEventListener('hashchange', onHash);
addEventListener('scroll', onScroll, { passive: true });

function refreshLive() {
  if (sheet || !base || document.visibilityState !== 'visible') return;
  // The timeline only moves its line (a redraw would reset a fling, the header and VoiceOver focus), unless the day changed.
  if (base.route.name === 'venues' && tickOverview(base.el)) return;
  if (['today', 'all', 'venues'].includes(base.route.name)) show(base.route, 'same');
}
if (FIXED_NOW === undefined) {
  setInterval(refreshLive, 60_000);
  document.addEventListener('visibilitychange', refreshLive);
}

if (/^https?:$/.test(location.protocol) && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

onHash();
