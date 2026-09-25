// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// NextVenue mobile app: hash router, screens, bottom sheets and local state.
// Data is inlined in the page (#nv-data); the app makes no network requests.

import * as L from './logic.ts';
import * as R from './route.ts';
import type { AppData, AppEdition, AppMilestone, AppRule, Answer } from './types.ts';
import { html, icon, type Raw } from './ui.ts';

// ---------- data ----------

const DATA = JSON.parse(document.getElementById('nv-data')!.textContent!) as AppData;
const EDITIONS = DATA.editions;
const ED = new Map(EDITIONS.map((e) => [e.id, e]));
const RULE = new Map(DATA.rules.map((r) => [r.id, r]));
const RULES_BY_ED = new Map<string, AppRule[]>();
for (const r of DATA.rules) {
  const list = RULES_BY_ED.get(r.edition) ?? [];
  list.push(r);
  RULES_BY_ED.set(r.edition, list);
}
const rulesOf = (id: string) => RULES_BY_ED.get(id) ?? [];
const SOURCE_URL = 'https://github.com/ziziphus-jujuba-zao/NextVenue';
/** Venue series one can rank (conferences; ARR cycles are reached through the venues that take them). */
const SERIES = R.seriesCatalog(EDITIONS);
const SERIES_BY_ID = new Map(SERIES.map((s) => [s.id, s]));
const KNOWN = new Set(SERIES_BY_ID.keys());
const NO_PREFS: R.Prefs = { first: [], backup: [] };

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

interface Paper {
  id: string;
  name: string;
  dirs: R.Direction[];
  /** The paper's own preferences; absent = follow the global ones. */
  prefs?: R.Prefs;
  /** Edition the paper is submitted to (正在投). v0.1 papers named one edition; it lands here. */
  current?: string;
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

function getDirs(): R.Direction[] | null {
  const v = readJson(K_DIRS);
  const d = R.cleanDirections(v);
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
  let dirs = R.cleanDirections(o.dirs);
  if (!dirs.length && legacy) dirs = R.directionsOf(ED.get(legacy)!);
  if (!dirs.length && current) dirs = R.directionsOf(ED.get(current)!);
  if (!dirs.length) dirs = getDirs() ?? ['ml'];
  const prefs = R.cleanPrefs(o.prefs, KNOWN) ?? undefined;
  return { id: o.id, name: o.name, dirs, prefs, current };
}

function getPapers(): Paper[] {
  const v = readJson(K_PAPERS);
  return Array.isArray(v) ? v.map(paperOf).filter((p): p is Paper => !!p) : [];
}
const setPapers = (p: Paper[]) => writeKey(K_PAPERS, JSON.stringify(p));
const updatePaper = (id: string, f: (p: Paper) => Paper) => setPapers(getPapers().map((p) => (p.id === id ? f(p) : p)));

function followsToPrefs(ids: string[]) {
  const m = R.migrateFollows(ids, EDITIONS, now());
  setPrefs(m.prefs);
  setDirs(m.directions.length ? m.directions : ['ml']);
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
  const d = R.cleanDirections(topicsParam.split(','));
  if (d.length) setDirs(d);
}
const prefsParam = params.get('prefs');
if (prefsParam !== null) {
  const p = R.parsePrefsParam(prefsParam, KNOWN);
  setPrefs(p);
  if (!topicsParam) setDirs(R.directionsOfSeries(R.prefSeries(p), SERIES).length ? R.directionsOfSeries(R.prefSeries(p), SERIES) : ['ml']);
}
if (params.get('demo') === '1' && getPapers().length === 0)
  setPapers([
    { id: 'demo', name: '论文 A', dirs: getDirs() ?? ['ml'] },
    { id: 'demo-b', name: '论文 B', dirs: ['ml'], current: ED.has('iclr-2027') ? 'iclr-2027' : undefined },
  ]);

// ---------- shared bits ----------

type Tab = 'today' | 'venues' | 'me';

const nextOf = (ed: AppEdition) => L.upcoming([ed], now())[0];

interface Followed {
  series: R.Series;
  /** The one edition the lists show (ICLR 2027 now, ICLR 2028 once 2027 is over). */
  edition: AppEdition;
  pref: { tier: R.Tier; rank: number };
}

/** Followed venues = the 首选 and 备选 series, in rank order. */
function followedVenues(): Followed[] {
  const p = getPrefs() ?? NO_PREFS;
  return R.prefSeries(p).flatMap((id) => {
    const series = SERIES_BY_ID.get(id);
    if (!series) return [];
    const edition = R.nearestEdition(series, now()) ?? series.editions[series.editions.length - 1]!;
    return [{ series, edition, pref: R.rankOf(p, id)! }];
  });
}

const followed = () => followedVenues().map((v) => v.edition);

/** Preferences a paper routes by: its own, else the global ones. */
const paperPrefs = (p: Paper) => p.prefs ?? getPrefs() ?? NO_PREFS;

function paperRoute(p: Paper): R.Route {
  return R.planRoute({ prefs: paperPrefs(p), editions: EDITIONS, now: now(), current: p.current });
}

/** Editions a paper of the user is submitted to (正在投). */
const submittedTo = () => new Set(getPapers().flatMap((p) => (p.current ? [p.current] : [])));

/**
 * An edition that takes no new papers and holds none of the user's (ICLR
 * 2027 once its abstract closed): its paper deadline only concerns papers
 * whose abstract is registered, and its review stages do not concern the user.
 */
const notMine = (ed: AppEdition, mine: Set<string>, t: number) => !mine.has(ed.id) && R.closedToNew(ed, t);

interface Items {
  items: L.Upcoming[];
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
    if (!notMine(i.edition, mine, t) || i.milestone.type === 'conference') items.push(i);
    else if (i.milestone.type === 'paper') {
      items.push(i);
      onlyRegistered.add(i);
    } else hidden.set(i.edition, (hidden.get(i.edition) ?? 0) + 1);
  }
  const tbas = L.tbaMilestones(eds).filter((x) => !notMine(x.edition, mine, t));
  return { items, onlyRegistered, folded: [...hidden].map(([edition, n]) => ({ edition, n })), tbas };
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
const mHref = (ed: AppEdition, m: AppMilestone) => `#/m/${ed.id}/${m.type}`;
const tag = (t: string, cls = '') => html`<span class="tag ${cls}">${t}</span>`;
const ansWord = (a: Answer) => html`<span class="ans a-${a}">${L.ANSWER_WORD[a]}</span>`;
const statusTag = (m: AppMilestone) => (m.status === 'estimated' ? tag('预计') : '');

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
  if (m.status === 'estimated') return { text, label: '按往年推算' };
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

function upRow(item: L.Upcoming, onlyRegistered = false): Raw {
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
    <div class="main"><div class="t"><span class="v">${L.venueShort(ed)}</span>${L.milestoneShort(m)}</div>
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

// ---------- preferences: directions and ranked venues ----------

/** Direction tags (机器学习 · 计算机视觉 · NLP · 机器人 · 数据挖掘), multi-select. */
function dirChips(ctx: string, dirs: R.Direction[], big = false): Raw {
  return html`<div class="chips${big ? ' big' : ''}" role="group" aria-label="方向">${R.DIRECTIONS.map((d) => {
    const on = dirs.includes(d.id);
    return html`<button class="chip${on ? ' on' : ''}" data-act="dir" data-ctx="${ctx}" data-id="${d.id}" aria-pressed="${on}">${icon.check}<span>${d.name}</span></button>`;
  })}</div>`;
}

/** "正在选：首选 | 备选". */
function tierSeg(ctx: string, tier: R.Tier): Raw {
  const b = (t: R.Tier, label: string) =>
    html`<button role="tab" data-act="tier" data-ctx="${ctx}" data-id="${t}" class="${tier === t ? 'on' : ''}" aria-selected="${tier === t}">${label}</button>`;
  return html`<div class="seg-row"><span class="seg-k">正在选</span><div class="seg" role="tablist">${b('first', '首选')}${b('backup', '备选')}</div></div>`;
}

/** Soonest deadline a new paper can still make; series with none sort last. */
function pickKey(s: R.Series): number {
  const e = R.nextOpenEntry(s, now());
  return e ? R.firstStep(e).t.ms : Number.POSITIVE_INFINITY;
}

/** Unranked series passing `keep`, soonest open deadline first (a stable order: rows never jump). */
function pickerSeries(p: R.Prefs, keep: (s: R.Series) => boolean): R.Series[] {
  return SERIES.filter((s) => !R.rankOf(p, s.id) && keep(s)).sort((a, b) => pickKey(a) - pickKey(b) || a.name.localeCompare(b.name));
}

/**
 * "摘要 约 1/24 预计": the first deadline a new paper can still make, worded
 * like the route stops. ICLR shows ICLR 2028 ("约 2027/9/19"), since ICLR
 * 2027's abstract closed.
 */
function nextDeadlineLine(s: R.Series): Raw {
  const t = now();
  const nx = R.nextOpenEntry(s, t);
  if (!nx) return html`<span>暂无可投的截止</span>`;
  const { m } = R.firstStep(nx);
  const at = (m.at_resolved ?? m.end_resolved)!;
  const est = m.status === 'estimated';
  return html`<span>${R.stepName(m)} ${est ? '约 ' : ''}${L.fmtDay(at, t)}</span>${est ? tag('预计') : ''}`;
}

/**
 * One venue in a picker: rank badge (1, 2, 3… blue for 首选, grey for 备选),
 * name, next deadline. In the first-run picker a tap adds it to the current
 * tier, moves it there, or takes it out. On the preferences pages ranked rows
 * are not buttons: ⊖ removes (with 撤销), ↑ ↓ reorder.
 */
function pickRow(s: R.Series, ctx: string, p: R.Prefs, edit = false): Raw {
  const r = R.rankOf(p, s.id);
  const none = !R.nextOpenEntry(s, now());
  const inner = html`<span class="rank ${r ? r.tier : 'none'}">${r ? r.rank : ''}</span>
    <div class="main"><div class="t b">${s.name}</div><div class="s">${nextDeadlineLine(s)}</div></div>`;
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

/** 首选 and 备选 in rank order; `edit` adds ⊖ and ↑↓ (preferences pages). */
function rankedGroups(ctx: string, p: R.Prefs, edit: boolean, tier: R.Tier): Raw {
  const rows = (ids: string[]) => ids.map((id) => pickRow(SERIES_BY_ID.get(id)!, ctx, p, edit));
  const hint = (t: string) => group(html`<div class="row hint"><span class="t">${t}</span></div>`);
  const addHere = edit ? '在下面“添加会议”里点选' : '在下面点选会议';
  return html`${cap('首选')}${p.first.length ? group(rows(p.first)) : hint(`还没有首选。${addHere}。`)}
    ${cap('备选')}${p.backup.length ? group(rows(p.backup)) : hint(tier === 'backup' ? `${addHere}，加到备选。` : '没有备选。切到「备选」再点会议。')}`;
}

/**
 * Venues to add: those of the directions, then one row "其他方向的会议 ›"
 * that opens every other series (a backup from another field without
 * changing directions).
 */
function addLists(ctx: string, dirs: R.Direction[], p: R.Prefs, tier: R.Tier, others: boolean): Raw {
  const mine = pickerSeries(p, (s) => s.directions.some((d) => dirs.includes(d)));
  const rest = pickerSeries(p, (s) => !s.directions.some((d) => dirs.includes(d)));
  const where = tier === 'first' ? '首选' : '备选';
  return html`${mine.length ? html`${cap(`点一下，加到${where}末尾`)}${group(mine.map((s) => pickRow(s, ctx, p)))}` : ''}
    ${
      rest.length
        ? others
          ? html`${cap('其他方向的会议')}${group(rest.map((s) => pickRow(s, ctx, p)))}`
          : group(html`<button class="row" data-act="show-others" data-ctx="${ctx}"><span class="t accent">其他方向的会议</span><span class="val">${rest.length} 个</span>${chev}</button>`, 'mt8')
        : ''
    }`;
}

/**
 * The preferences page body (global or one paper): what is ranked comes
 * first (⊖, ↑↓); then "添加会议" with the direction filter, the tier switch
 * (sticky inside this section only) and the venues to add.
 */
function prefsEditor(ctx: string, dirs: R.Direction[], p: R.Prefs): Raw {
  return html`${rankedGroups(ctx, p, true, pickTier)}
    <section class="add-sec">${h2('添加会议')}
      <p class="cap">方向</p>${dirChips(ctx, dirs)}
      <div class="sticky-seg">${tierSeg(ctx, pickTier)}</div>
      ${addLists(ctx, dirs, p, pickTier, showOthers)}</section>`;
}

// ---------- route card (paper detail) ----------

/** ① ICML 2027 首选 3 预计 / 摘要 约 2027/1/24 · 正文 约 1/29. The abstract comes first: missing it closes the venue. */
function stopRow(s: R.RouteStop, i: number, ctx: R.YearCtx): Raw {
  const e = s.entry;
  const rank = s.pref ? html`<span class="rk">${s.pref.tier === 'first' ? '首选' : '备选'} ${s.pref.rank}</span>` : '';
  const parts = R.stopParts(e, ctx, now());
  return html`<a class="stop" href="#/venue/${e.edition.id}"><span class="num">${i + 1}</span>
    <div class="main"><div class="t"><span class="nm">${L.editionShort(e.edition)}</span>${rank}${e.estimated ? tag('预计') : ''}${
      s.current ? tag('在投', 'current') : ''
    }</div>
    <div class="s">${parts.map((x, j) => html`<span class="nw">${x}${j < parts.length - 1 ? ' ·' : ''}</span>`)}</div></div>${chev}</a>`;
}

/**
 * ↓ 约 4/30 出结果, and under it the turnaround to the next stop:
 * "没中的话 5 天后交摘要，7 天后交正文" (amber with "准备不足 7 天" when the
 * paper gets fewer days than the prep time).
 */
function hopRow(s: R.RouteStop, next: R.RouteStop | undefined, ctx: R.YearCtx): Raw {
  const r = s.entry.result;
  const when = r ? `${R.routeDay(r, ctx)} 出结果` : '出结果时间待公布';
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
 * 投稿路线 (§9.4): stops in order, the result and turnaround between them,
 * 先注册摘要 where it falls in time, 备选 in long gaps, then 已错过 and why
 * the 备选 are not on it. Years show once they change ("约 2027/1/24").
 */
function routeCard(route: R.Route, paper: Paper): Raw {
  if (!route.stops.length)
    return html`<div class="route empty"><p>偏好里的首选会议，目前都没有来得及投的截止。</p><a class="btn small" href="#/me/paper/${paper.id}/prefs">调整偏好</a></div>`;
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
  const backup = paperPrefs(paper).backup.map((id) => SERIES_BY_ID.get(id)?.name ?? id);
  if (backup.length && !route.inserts.length)
    foot.push(
      html`<p><span class="k">备选</span>${backup.join('、')}：${
        route.stops.length > 1
          ? html`两站间没有 <span class="nw">4 个月以上</span>的空档，<span class="nw">暂不插入</span>`
          : html`只在两站间空出 <span class="nw">4 个月以上</span>时插入`
      }</p>`,
    );
  if (route.estimated) foot.push(html`<p>预计日期按往年推算，以官网公布为准</p>`);
  return html`<div class="route">${parts}${foot.length ? html`<div class="route-foot">${foot}</div>` : ''}</div>`;
}

function nextCard(ed: AppEdition, label = '下一个节点'): Raw {
  const n = nextOf(ed);
  if (!n) return html`<div class="next-card muted"><div class="main"><div class="k">${label}</div><div class="t">本届节点都已过去</div></div></div>`;
  const parts = L.countdown(n.target, now());
  const w = whenOf(n.milestone);
  return html`<a class="next-card" href="${mHref(ed, n.milestone)}">
    <div class="main"><div class="k">${label}</div><div class="t">${L.milestoneShort(n.milestone)}${statusTag(n.milestone)}</div>
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
  mount?: (el: HTMLElement) => void;
}

interface Welcome {
  dirs: R.Direction[];
  /** Directions in the order they were picked; the first one prefills 首选. */
  order: R.Direction[];
  prefs: R.Prefs;
  tier: R.Tier;
  /** The user changed the prefilled venues; new directions then add to them instead of replacing them. */
  edited: boolean;
  /** "其他方向的会议" is open. */
  others: boolean;
}

let welcome: Welcome | null = null;

function welcomeState(): Welcome {
  if (!welcome) {
    // 机器学习 is preselected so two taps (下一步, 开始) are enough to start.
    const dirs = getDirs() ?? ['ml'];
    const stored = getPrefs();
    welcome = { dirs, order: dirs, prefs: stored ?? R.defaultPrefs(dirs, KNOWN), tier: 'first', edited: !!stored, others: false };
  }
  return welcome;
}

/** First run, step 1: "你做什么方向？" */
function screenWelcome(): View {
  const w = welcomeState();
  return {
    title: '方向',
    tab: 'today',
    root: true,
    noTabs: true,
    body: html`<header class="large-head welcome-head"><p class="eyebrow">1 / 2</p><h1>你做什么方向？</h1><p class="sub">可以多选。下一步按方向列出会议。</p></header>
      ${dirChips('welcome', w.dirs, true)}
      <div class="bottom-bar"><div class="bottom-inner">
        <button class="btn" data-act="welcome-next"${w.dirs.length ? '' : ' disabled'}>下一步</button>
        <p class="btn-note">${w.dirs.length ? '只存在这台手机上' : '至少选 1 个方向'}</p></div></div>`,
  };
}

/** First run, step 2: "按喜好依次点选会议" (首选 prefilled from the first direction). */
function screenWelcomeVenues(): View {
  const w = welcomeState();
  const n = w.prefs.first.length;
  const m = w.prefs.backup.length;
  return {
    title: '选会议',
    tab: 'today',
    noTabs: true,
    body: html`<header class="large-head"><p class="eyebrow">2 / 2</p><h1>按喜好依次点选会议</h1><p class="sub">点一下加到当前这一栏末尾，再点一下取消。首选排出投稿路线；备选只在两站之间空出 4 个月以上时插入。</p></header>
      <div class="sticky-seg">${tierSeg('welcome', w.tier)}</div>
      ${rankedGroups('welcome', w.prefs, false, w.tier)}
      ${addLists('welcome', w.dirs, w.prefs, w.tier, w.others)}
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
  if (!eds.length) return view(emptyState('还没有关注的会议。选好之后，这里会显示最近的截止时间。', '选择会议', '#/me/prefs'));
  const { items, onlyRegistered, tbas } = followedItems(eds, t);
  // A paper deadline only open to registered abstracts (ICLR 2027 after 9/19) is never the main card.
  // First-choice venues outrank backups: a backup deadline only leads when no first choice has one.
  const open = items.filter((i) => !onlyRegistered.has(i));
  const firstSeries = new Set((getPrefs() ?? NO_PREFS).first);
  const hero = L.pickHero(open.filter((i) => firstSeries.has(i.edition.series))) ?? L.pickHero(open) ?? items[0];
  if (!hero) return view(emptyState('关注的会议都没有后续节点了。', '调整投稿偏好', '#/me/prefs'));

  const ed = hero.edition;
  const m = hero.milestone;
  const rules = rulesOf(ed.id);
  const parts = L.countdown(hero.target, t);
  const after = L.afterPhrases(rules, m.type);
  const must = L.groupRulesForMilestone(rules, m.type).mustBefore.length;
  const w = whenOf(m);
  const heroHtml = html`<a class="hero" href="${mHref(ed, m)}">
    <div class="hero-k"><span class="hero-name">${L.editionShort(ed)} · ${nowrapAside(L.milestoneShort(m))}</span>${statusTag(m)}${chev}</div>
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

  const rest = items.filter((i) => i !== hero);
  const buckets: L.Upcoming[][] = [[], [], []];
  for (const i of rest) buckets[L.bucketOf(i, t)]!.push(i);
  const total = items.length + tbas.length;
  const later = buckets[2]!;
  const hidden = later.length - Math.min(3, later.length) + tbas.length;
  const allRow = html`<a class="row more" href="#/all"><span class="t">全部 ${total} 项</span>${chev}</a>`;
  const row = (i: L.Upcoming) => upRow(i, onlyRegistered.has(i));
  const sections: Raw[] = [];
  buckets.forEach((list, i) => {
    if (!list.length) return;
    const shown = i === 2 ? list.slice(0, 3) : list;
    sections.push(html`${cap(L.BUCKETS[i]!)}${group(html`${shown.map(row)}${i === 2 && hidden > 0 ? allRow : ''}`)}`);
  });
  if (!later.length && hidden > 0) sections.push(group(allRow, 'mt'));
  // The route is the headline feature: until a paper exists, point to it right
  // under the main card, before the list.
  const paperLink = getPapers().length
    ? ''
    : group(
        html`<a class="row two" href="#/me/paper/new"><div class="main"><div class="t accent">添加论文，排出投稿路线</div><div class="s"><span>按偏好排先投哪个、没中再投哪个</span></div></div>${chev}</a>`,
        'mt16',
      );
  return view(html`${heroHtml}${paperLink}${sections.length ? html`${h2('接下来')}${sections}` : ''}`);
}

function screenAll(): View {
  const t = now();
  const eds = followed();
  const { items, onlyRegistered, folded, tbas } = followedItems(eds, t);
  const buckets: L.Upcoming[][] = [[], [], []];
  for (const i of items) buckets[L.bucketOf(i, t)]!.push(i);
  const row = (i: L.Upcoming) => upRow(i, onlyRegistered.has(i));
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

function screenMilestone(edId: string, type: string): View {
  const ed = ED.get(edId);
  const m = ed && L.milestoneOf(ed, type);
  if (!ed || !m) return notFound(lastTab);
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
  // An estimate is last year's date moved on a year, not what the venue wrote for this edition.
  const est = m.status === 'estimated';
  const basis = ed.derived_from ? `按 ${editionLabel(ed.derived_from)} 推算` : '按往年推算';
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
            ? html`<p class="when dim">官方还没给出时间</p>`
            : html`<p class="when">${w.text}${w.label && !est ? html`<span class="lbl">${w.label}</span>` : ''}</p>`
        }
        ${
          tba
            ? ''
            : est
              ? html`<a class="official" href="#/m/${ed.id}/${type}/source">${basis}${
                  m.quote || m.note_zh ? html`<span class="dotsep"> · </span><span class="link">依据 ›</span>` : ''
                }</a>`
              : html`<a class="official" href="#/m/${ed.id}/${type}/source">官网写法：${L.fmtOfficial(m)}${
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

/** "Seoul · 5/24–5/28 · CCF A", with 预计 right after the dates when they are an estimate (unless the row already says 预计 once). */
function venueSub(ed: AppEdition, withRank: boolean, tagDays = true): Raw {
  const days = L.conferenceDays(ed);
  const parts: Raw[] = [];
  if (ed.location?.city) parts.push(html`<span>${ed.location.city}</span>`);
  if (days) parts.push(html`<span class="days">${days.estimated ? '约 ' : ''}${days.text}</span>${days.estimated && tagDays ? tag('预计') : ''}`);
  if (!parts.length && ed.kind === 'arr_cycle') parts.push(html`<span>ACL Rolling Review</span>`);
  if (withRank && ed.ranks?.ccf && ed.ranks.ccf !== 'N') parts.push(html`<span>CCF ${ed.ranks.ccf}</span>`);
  return html`${parts.map((x, i) => html`${i ? html`<span class="dot">·</span>` : ''}${x}`)}`;
}

function screenVenues(): View {
  const t = now();
  const vs = followedVenues();
  const mine = submittedTo();
  const row = ({ edition: ed }: Followed) => {
    const n = nextOf(ed);
    // An edition whose dates are all shifted from last year says 预计 once, after its name.
    const derived = isDerived(ed);
    let right: Raw;
    if (!n) right = html`<div class="nx-n">已结束</div>`;
    else if (notMine(ed, mine, t))
      // ICLR 2027 after its abstract closed: the paper deadline is only for registered abstracts.
      right =
        n.milestone.type === 'paper'
          ? html`<div class="nx-n">${L.milestoneShort(n.milestone)} ${L.upcomingRelative(n, t)}</div><div class="nx-r cond">${registeredOnly(ed)}</div>`
          : html`<div class="nx-n">审稿中</div><div class="nx-r quiet">你没有在投</div>`;
    else
      // The narrow right column drops the aside: "投稿截止", not "投稿截止（经 ARR）".
      right = html`<div class="nx-n">${L.milestoneShort(n.milestone).replace(/（[^）]*）$/, '')}</div><div class="nx-r${L.isUrgent(n, t) ? ' soon' : ''}">${
        n.milestone.status === 'estimated' && !derived ? tag('预计') : ''
      }${L.upcomingRelative(n, t)}</div>`;
    return html`<a class="row two" href="#/venue/${ed.id}">
      <div class="main"><div class="t b">${L.editionShort(ed)}${derived ? tag('预计') : ''}</div><div class="s">${venueSub(ed, false, !derived)}</div></div>
      <div class="nx">${right}</div>${chev}</a>`;
  };
  const first = vs.filter((v) => v.pref.tier === 'first');
  const backup = vs.filter((v) => v.pref.tier === 'backup');
  return {
    title: '会议',
    tab: 'venues',
    root: true,
    body: html`<header class="large-head"><h1>会议</h1></header>
      ${
        vs.length
          ? html`${first.length ? html`${cap('首选')}${group(first.map(row))}` : ''}${backup.length ? html`${cap('备选')}${group(backup.map(row))}` : ''}`
          : emptyState('还没有关注的会议。', '调整投稿偏好', '#/me/prefs')
      }
      ${group(html`<a class="row" href="#/me/prefs"><span class="t accent">调整投稿偏好</span>${chev}</a>`, 'mt')}`,
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

function screenVenue(edId: string, segParam: string): View {
  const ed = ED.get(edId);
  if (!ed) return notFound('venues');
  const t = now();
  const rules = rulesOf(ed.id);
  // Without rule cards the page opens on the timeline; 规则 then says 规则未收录.
  const seg = segParam || (rules.length ? 'rules' : 'timeline');
  const { inh, status } = inheritedInfo(ed);
  const banner = inh.length
    ? html`<a class="banner" href="#/venue/${ed.id}/info"><span>${
        status ? `${ed.year} 作者指南未发布，${inh.length} 条沿用上届` : `${inh.length} 条规则沿用上届`
      }</span>${chev}</a>`
    : isDerived(ed)
      ? html`<a class="banner" href="#/venue/${ed.id}/info"><span>官网还没公布，日期按 ${editionLabel(ed.derived_from!)} 推算</span>${chev}</a>`
      : '';
  const rulesHref = rules.length ? `#/venue/${ed.id}` : `#/venue/${ed.id}/rules`;
  const tlHref = rules.length ? `#/venue/${ed.id}/timeline` : `#/venue/${ed.id}`;
  const segHtml = html`<div class="seg" role="tablist">
    <button role="tab" data-act="seg" data-href="${rulesHref}" class="${seg === 'rules' ? 'on' : ''}" aria-selected="${seg === 'rules'}">规则</button>
    <button role="tab" data-act="seg" data-href="${tlHref}" class="${seg === 'timeline' ? 'on' : ''}" aria-selected="${seg === 'timeline'}">时间线</button></div>`;

  let content: Raw;
  if (seg === 'timeline') {
    const past = ed.milestones.filter((m) => L.isPast(m, t));
    const next = nextOf(ed)?.milestone;
    const tl = (m: AppMilestone) => {
      const b = L.nextBoundary(m, t);
      const state = L.isPast(m, t) ? 'past' : m === next ? 'next' : 'future';
      const rel = b ? L.upcomingRelative({ edition: ed, milestone: m, ...b }, t) : '';
      return html`<a class="row two tl ${state}" href="${mHref(ed, m)}"><span class="dot"></span>
        <div class="main"><div class="t">${L.milestoneShort(m)}</div><div class="s">${
          m.status === 'tba' ? tag('待公布') : html`<span>${L.fmtMilestoneTime(m, t)}</span>${statusTag(m)}`
        }</div></div>
        ${rel ? html`<span class="rel${state === 'next' ? ' soon' : ''}">${rel}</span>` : ''}${chev}</a>`;
    };
    content = group(
      html`${past.length ? html`<button class="row past-toggle" data-act="expand-past"><span class="dot"></span><span class="t">已过 ${past.length} 项</span>${chev}</button>` : ''}${ed.milestones.map(tl)}`,
      'timeline',
    );
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
  return {
    title: ed.name,
    tab: 'venues',
    body: html`<header class="large-head"><h1>${ed.name}</h1><p class="sub sub-tags">${venueSub(ed, true)}</p></header>
      ${banner}${nextCard(ed)}${segHtml}${content}
      ${group(html`<a class="row" href="#/venue/${ed.id}/info"><span class="t">关于这些数据</span>${chev}</a>`, 'mt')}`,
  };
}

function screenMe(): View {
  const t = now();
  const papers = getPapers();
  const prefs = getPrefs() ?? NO_PREFS;
  const lastChecked = DATA.rules.map((r) => r.last_checked).sort().at(-1) ?? '';
  const paperRows = papers.map((p) => {
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
      ${group(html`<a class="row" href="#/me/prefs"><span class="t">投稿偏好</span><span class="val">${prefsVal}</span>${chev}</a>`)}
      ${h2('关于')}
      ${group(html`
        <a class="row" href="#/me/answers"><span class="t">答案含义说明</span>${chev}</a>
        <a class="row" href="#/me/install"><span class="t">添加到主屏幕</span>${chev}</a>
        <a class="row" href="all-rules.html"><span class="t">全部规则（桌面版）</span>${chev}</a>
        <a class="row" href="${SOURCE_URL}" target="_blank" rel="noopener"><span class="t">源代码</span><span class="val">GitHub ↗</span></a>`)}
      <p class="fine">仅供参考，以官网为准<br>规则核对于 ${lastChecked ? L.md(lastChecked) : '—'} · 数据版本 ${DATA.bundle_hash.slice(0, 7)}</p>`,
  };
}

/** 投稿偏好 (§9.2): the first-run picker plus ↑↓. The followed venues are exactly these. */
function screenPrefs(): View {
  return {
    title: '投稿偏好',
    tab: 'me',
    body: html`<header class="large-head"><h1>投稿偏好</h1><p class="sub">关注的会议就是这里的首选和备选。首选排出投稿路线；备选只在两站之间空出 4 个月以上时插入。</p></header>
      ${prefsEditor('global', getDirs() ?? ['ml'], getPrefs() ?? NO_PREFS)}`,
  };
}

/** One paper's preferences: starts as a copy of the global ones; "恢复为同投稿偏好" drops the copy. */
function screenPaperPrefs(id: string): View {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return notFound('me');
  const own = !!p.prefs;
  return {
    title: '这篇的偏好',
    tab: 'me',
    body: html`<header class="large-head"><p class="eyebrow">${p.name}</p><h1>这篇论文的偏好</h1><p class="sub">${
      own ? '单独设置，只影响这篇论文。' : '现在和投稿偏好相同。在这里改动只影响这篇论文。'
    }</p></header>
      ${prefsEditor(`paper:${p.id}`, p.dirs, paperPrefs(p))}
      ${own ? group(html`<button class="row" data-act="follow-global" data-id="${p.id}"><span class="t accent">恢复为同投稿偏好</span></button>`, 'mt') : ''}`,
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

/**
 * 论文详情 (§9.4): the route first; then preferences and where the paper is
 * submitted; then the next milestone and "现在的状态" of the route's first stop.
 */
function screenPaper(id: string): View {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return notFound('me');
  const t = now();
  const route = paperRoute(p);
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
    body: html`<header class="large-head"><h1>${p.name}</h1><p class="sub">${p.dirs.map(R.directionName).join(' · ')}</p></header>
      <div class="h2-block">${h2('投稿路线')}<p class="h2-cap">按截止先后排，一次投一个；没中再投下一站</p></div>
      ${routeCard(route, p)}
      ${group(
        html`<a class="row" href="#/me/paper/${p.id}/prefs"><span class="t">偏好</span><span class="val">${p.prefs ? '单独设置' : '同投稿偏好'}</span>${chev}</a>
        <a class="row" href="#/me/paper/${p.id}/current"><span class="t">在投</span><span class="val">${current}</span>${chev}</a>`,
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

// ---------- sheets ----------

interface SheetView {
  label: string;
  /** Centred title on the ✕ line (form sheets such as 添加论文). */
  title?: string;
  body: Raw;
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
  return {
    label: est ? '推算依据' : '官网原文',
    body: html`<p class="eyebrow">${ed.name} · ${L.milestoneShort(m)}</p>
      <h2 class="q">${est ? '按往年推算' : '官网写法'}</h2>
      <div class="big small">${L.fmtOfficial(m)}${est ? tag('预计') : ''}</div>
      ${w.label ? html`<p class="keytime">${icon.clock}<span>${w.label}：${w.text}</span></p>` : ''}
      ${m.quote ? html`<figure class="quote-card"><blockquote lang="en">${m.quote}</blockquote>${m.src_title ? html`<figcaption>${est ? '往年原文 · ' : ''}${m.src_title}</figcaption>` : ''}</figure>` : ''}
      ${m.note_zh ? html`<p class="explain">${m.note_zh}</p>` : ''}
      ${m.deep_link ? html`<a class="btn" href="${m.deep_link}" target="_blank" rel="noopener">${est ? '查看往年官网原句 ↗' : '查看官网原句 ↗'}</a>` : ''}`,
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
      ${ed.note_zh ? html`<p class="explain">${ed.note_zh}</p>` : ''}
      <p class="foot">核对于 ${L.md(ed.last_checked)}${rulesOf(ed.id).length ? ' · 每条规则都附官网原句' : ''}</p>`,
  };
}

/** Directions picked in the open 添加论文 sheet (starts as the global ones). */
let newPaperDirs: R.Direction[] | null = null;

/** What the new paper's route will follow, said before 添加. */
function paperNewNote(dirs: R.Direction[]): string {
  const own = R.prefsForPaper(dirs, getPrefs() ?? NO_PREFS, SERIES, KNOWN);
  if (!own) return '路线按投稿偏好排，以后改偏好也会跟着变。';
  const names = own.first.map((id) => SERIES_BY_ID.get(id)?.name ?? id).join('、');
  return `投稿偏好里没有${dirs.map(R.directionName).join('、')}的会议。这篇先按 ${names} 排路线，不跟随投稿偏好。`;
}

/** 添加论文 (§9.3): 代号 → 方向 → 添加. */
function sheetPaperNew(): SheetView {
  if (!newPaperDirs) newPaperDirs = getDirs() ?? ['ml'];
  const used = new Set(getPapers().map((p) => p.name));
  const letter = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find((c) => !used.has(`论文 ${c}`)) ?? 'A';
  return {
    label: '添加论文',
    title: '添加论文',
    body: html`<label class="cap" for="paper-name">代号</label>
      <div class="group inset"><input id="paper-name" class="input" type="text" value="论文 ${letter}" maxlength="24" autocomplete="off" enterkeyhint="done"></div>
      <p class="cap">方向</p>
      ${dirChips('new', newPaperDirs)}
      <p class="sheet-note" data-note>${paperNewNote(newPaperDirs)}</p>
      <button class="btn" data-act="add-paper"${newPaperDirs.length ? '' : ' disabled'}>添加</button>`,
  };
}

/** "其他方向" is open in the 在投 sheet. */
let currentOthers = false;

/**
 * 在投: where the paper waits for a result, so the route starts there. Venues
 * in the paper's preferences first, then others of its directions; the rest
 * behind one row. The stored choice is always shown checked, even when it is
 * no longer (or not yet) under review.
 */
function sheetPaperCurrent(id: string): SheetView | null {
  const p = getPapers().find((x) => x.id === id);
  if (!p) return null;
  const t = now();
  const ranked = new Set(R.prefSeries(paperPrefs(p)));
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
      <div class="group inset">${radio('', '还没投', '按偏好从最近的截止排')}${storedRow}</div>
      ${mineList.length ? html`<p class="cap">偏好里的会</p><div class="group inset">${mineList.map(option)}</div>` : ''}
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

// ---------- router ----------

interface Route {
  name: string;
  p: string[];
  hash: string;
}

const ROOTS = new Set(['today', 'venues', 'me', 'welcome']);
const SHEETS = new Set(['rule', 'msource', 'venueinfo', 'paperNew', 'paperCurrent']);
const ME_ROUTES = ['paperNew', 'paper', 'prefs', 'paperPrefs', 'paperCurrent', 'answers', 'install'];

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
      return r('venues');
    case 'venue':
      if (b) return c === 'info' ? r('venueinfo', [b]) : r('venue', [b, c === 'timeline' || c === 'rules' ? c : '']);
      break;
    case 'rule':
      if (b && c) return r('rule', d === 'for' && e ? [`${b}/${c}`, e] : [`${b}/${c}`]);
      break;
    case 'me':
      if (b === 'paper' && c === 'new') return r('paperNew');
      if (b === 'paper' && c && d === 'prefs') return r('paperPrefs', [c]);
      if (b === 'paper' && c && d === 'current') return r('paperCurrent', [c]);
      if (b === 'paper' && c) return r('paper', [c]);
      // v0.1's 关注的会议 is now 投稿偏好 (followed venues = 首选 + 备选).
      if (b === 'prefs' || b === 'follows') return r('prefs');
      if (b === 'answers' || b === 'install') return r(b);
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
      return `#/venue/${r.p[0]}`;
    case 'welcome2':
      return '#/welcome';
    case 'paperPrefs':
    case 'paperCurrent':
      return `#/me/paper/${r.p[0]}`;
    case 'paperNew':
    case 'paper':
    case 'prefs':
    case 'answers':
    case 'install':
      return '#/me';
    case 'milestone':
    case 'all':
      return lastTab === 'venues' ? '#/venues' : '#/today';
    default:
      return '#/today';
  }
}

function tabFor(r: Route): Tab {
  if (r.name === 'venues' || r.name === 'venue' || r.name === 'venueinfo') return 'venues';
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
      return screenVenues();
    case 'venue':
      return screenVenue(r.p[0]!, r.p[1]!);
    case 'me':
      return screenMe();
    case 'prefs':
      return screenPrefs();
    case 'paperPrefs':
      return screenPaperPrefs(r.p[0]!);
    case 'answers':
      return screenAnswers();
    case 'install':
      return screenInstall();
    case 'paper':
      return screenPaper(r.p[0]!);
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
    case 'paperNew':
      return sheetPaperNew();
    case 'paperCurrent':
      return sheetPaperCurrent(r.p[0]!);
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
function navbar(title: string, backTitle?: string): Raw {
  return html`<div class="navbar"><button class="back" data-act="back" aria-label="返回${backTitle ? ` ${backTitle}` : ''}">${icon.back}<span class="back-t">${backTitle ?? '返回'}</span></button><div class="nav-title">${title}</div></div>`;
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
  const chrome = view.root ? (view.noTabs ? '' : rootBar(view.title).s) : navbar(view.title, prev ? titleMemo.get(prev) : undefined).s;
  el.innerHTML = `${chrome}${view.body.s}`;
  if (base) scrollMemo.set(base.route.hash, scrollY);
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
  const r = parse(location.hash);
  const inWelcome = (x: Route) => x.name === 'welcome' || x.name === 'welcome2';
  if (getPrefs() === null && !inWelcome(r)) {
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
  else if (base.route.hash === r.hash || (base.route.name === 'venue' && r.name === 'venue' && base.route.p[0] === r.p[0])) dir = 'same';
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
  if ((r.name === 'prefs' || r.name === 'paperPrefs') && dir !== 'same') {
    pickTier = 'first';
    showOthers = false;
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
    <div class="sheet-body">${view.body}</div>`;
  if (sheet) {
    const panel = sheet.wrap.querySelector<HTMLElement>('.sheet')!;
    panel.className = `sheet${view.full ? ' full' : ''}`;
    panel.setAttribute('aria-label', view.label);
    panel.innerHTML = body.s;
    sheet.route = r;
    view.mount?.(panel);
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = html`<div class="backdrop" data-act="close-sheet"></div><div class="sheet${view.full ? ' full' : ''}" role="dialog" aria-modal="true" aria-label="${view.label}">${body}</div>`.s;
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
  newPaperDirs = null;
  currentOthers = false;
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

function requestCloseSheet() {
  if (!sheet) return;
  const r = sheet.route;
  if (sheetInApp.get(r.hash)) history.back();
  else location.replace(base ? base.route.hash : parentHash(r));
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
      panel.style.transform = `translateY(${dy}px)`;
    },
    { passive: false },
  );
  panel.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    const fast = dy > 40 && Date.now() - t0 < 250;
    if (dy > 110 || fast) requestCloseSheet();
    else if (dy > 0) {
      panel.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 200, easing: 'ease-out' });
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

/** A short note above the tab bar, with 撤销 when `undo` is given; gone after 4 s. */
function showToast(text: string, undo?: () => void) {
  hideToast();
  toastUndo = undo ?? null;
  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = html`<span>${text}</span>${undo ? html`<button data-act="undo">撤销</button>` : ''}`.s;
  document.body.append(toastEl);
  toastTimer = window.setTimeout(hideToast, 4000);
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

/** A picker's state: first run (in memory until 开始), the global preferences, or one paper's ("paper:<id>"). */
function pickCtx(ctx: string): PickCtx | null {
  if (ctx === 'welcome') {
    const w = welcomeState();
    return { dirs: w.dirs, prefs: w.prefs, tier: w.tier };
  }
  if (ctx === 'global') return { dirs: getDirs() ?? ['ml'], prefs: getPrefs() ?? NO_PREFS, tier: pickTier };
  const p = ctx.startsWith('paper:') ? getPapers().find((x) => x.id === ctx.slice(6)) : undefined;
  return p ? { dirs: p.dirs, prefs: paperPrefs(p), tier: pickTier } : null;
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
  } else if (ctx.startsWith('paper:'))
    updatePaper(ctx.slice(6), (p) => ({ ...p, dirs: next.dirs ?? p.dirs, prefs: next.prefs ?? p.prefs }));
}

/** Redraw the current screen in place (same scroll position). */
function rerender() {
  if (base) show(base.route, 'same');
}

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
    case 'seg':
      location.replace(el.dataset.href!);
      break;
    case 'dir': {
      const d = id as R.Direction;
      const ctx = el.dataset.ctx ?? '';
      if (ctx === 'new') {
        // 添加论文 sheet: toggle in place so the typed 代号 stays.
        const cur = newPaperDirs ?? [];
        newPaperDirs = cur.includes(d) ? cur.filter((x) => x !== d) : R.cleanDirections([...cur, d]);
        el.classList.toggle('on', newPaperDirs.includes(d));
        el.setAttribute('aria-pressed', String(newPaperDirs.includes(d)));
        const sheetEl = el.closest('.sheet');
        sheetEl?.querySelector('[data-act="add-paper"]')?.toggleAttribute('disabled', !newPaperDirs.length);
        const note = sheetEl?.querySelector<HTMLElement>('[data-note]');
        if (note) note.textContent = newPaperDirs.length ? paperNewNote(newPaperDirs) : '至少选 1 个方向。';
        break;
      }
      const c = pickCtx(ctx);
      if (!c) break;
      const dirs = c.dirs.includes(d) ? c.dirs.filter((x) => x !== d) : R.cleanDirections([...c.dirs, d]);
      // First run may be emptied (下一步 then waits); saved directions keep at least one.
      if (!dirs.length && ctx !== 'welcome') break;
      setPickCtx(ctx, { dirs });
      rerender();
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
    case 'show-others': {
      if (el.dataset.ctx === 'welcome') welcomeState().others = true;
      else showOthers = true;
      rerender();
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
    case 'follow-global':
      updatePaper(id, (p) => ({ ...p, prefs: undefined }));
      rerender();
      break;
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
      const input = document.getElementById('paper-name') as HTMLInputElement | null;
      const name = (input?.value ?? '').trim() || '论文';
      const dirs = newPaperDirs ?? getDirs() ?? ['ml'];
      if (!dirs.length) return;
      const papers = getPapers();
      const paperId = Math.random().toString(36).slice(2, 8);
      papers.push({ id: paperId, name, dirs, prefs: R.prefsForPaper(dirs, getPrefs() ?? NO_PREFS, SERIES, KNOWN) });
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
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheet) requestCloseSheet();
});

addEventListener('hashchange', onHash);
addEventListener('scroll', onScroll, { passive: true });

function refreshLive() {
  if (sheet || !base || document.visibilityState !== 'visible') return;
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
