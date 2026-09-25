// Copyright (c) 2026 Zayier Xie. All rights reserved.

// The graphic timeline (docs/MOBILE_SPEC.md §11.2, §11.3, §11.5): one month
// axis shared by every followed venue, one lane per venue, the zoomed phase
// bar of one edition, and the small route chart on the paper page. Positions
// and words only; no DOM here, so all of it is unit-tested.

import { MILESTONE_ZH, beijingDate, dayDiff, hasTime, isAbstractOnly, isAction, isLateAbstract, md, needsYear, shownBeforeAccept, shownDate, targetOf, textWidth, weekday } from './logic.ts';
import { entriesOf, resultWord, stepName, type Series } from './route.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

// ---------- the month axis (§11.2) ----------

/** Width of one month on the overview: this month to March fits on a 390px phone. */
export const MONTH_PX = 40;

export interface Month {
  y: number;
  m: number;
  /** Left edge, px from the start of the axis. */
  x: number;
  label: string;
  /** Printed over each January; the sticky corner names the year at the left edge. */
  year?: string;
}

export interface Axis {
  /** y * 12 + (m - 1) of the first month. */
  start: number;
  months: Month[];
  monthPx: number;
  width: number;
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** From the start of the month `before` months back to the end of the month `after` months on (Beijing calendar). */
export function axisOf(now: number, before = 3, after = 15, monthPx = MONTH_PX): Axis {
  const today = beijingDate(now);
  const start = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1 - before;
  const months: Month[] = [];
  for (let i = 0; i <= before + after; i++) {
    const k = start + i;
    const y = Math.floor(k / 12);
    const m = (k % 12) + 1;
    // Not over the current month: the view opens there and the corner already says its year (no "今天27" on 1/3).
    months.push({ y, m, x: i * monthPx, label: `${m}月`, year: m === 1 && i !== before ? String(y) : undefined });
  }
  return { start, months, monthPx, width: months.length * monthPx };
}

/** The year of the month at `x` (the left edge of the visible part), for the sticky corner. */
export function yearAt(axis: Axis, x: number): number {
  const i = Math.min(axis.months.length - 1, Math.max(0, Math.floor((x + 1) / axis.monthPx)));
  return axis.months[i]!.y;
}

/** Day `d` of month y/m at fraction `f` of that day. Months are equally wide, so a day is a little wider in February. */
function xAt(axis: Axis, y: number, m: number, d: number, f: number): number {
  const i = y * 12 + m - 1 - axis.start;
  return (i + (d - 1 + f) / daysIn(y, m)) * axis.monthPx;
}

/** The middle of a calendar day (YYYY-MM-DD). */
export const xOfDay = (day: string, axis: Axis) => xAt(axis, Number(day.slice(0, 4)), Number(day.slice(5, 7)), Number(day.slice(8, 10)), 0.5);

/** A moment on the Beijing clock: the today line. */
export function xOfMs(ms: number, axis: Axis): number {
  const iso = new Date(ms + 8 * 3_600_000).toISOString();
  const f = (Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16))) / 1440;
  return xAt(axis, Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10)), f);
}

/** A milestone time, on the day the lists show it (Beijing day when timed, the official day otherwise). */
export const xOf = (t: ResolvedTime, axis: Axis) => xOfDay(shownDate(t), axis);

/** Left edge of the current month: where the overview opens. */
export function monthStartX(now: number, axis: Axis): number {
  const today = beijingDate(now);
  return xAt(axis, Number(today.slice(0, 4)), Number(today.slice(5, 7)), 1, 0);
}

// ---------- rounds and review cycles ----------

export const ROUND_ZH = ['', '一轮', '二轮', '三轮'];

/**
 * The round a milestone belongs to, read from its label ("Round 1 正文",
 * "2 月轮（第二轮）正文截止", "第一轮出结果"); 0 when it is shared by the
 * rounds or the venue has none.
 */
export function roundOf(m: AppMilestone): number {
  const l = m.label_zh ?? '';
  const one = /Round\s*1|一轮/.test(l);
  const two = /Round\s*2|二轮/.test(l);
  return one === two ? 0 : one ? 1 : 2;
}

/** The rounds an edition has (WACV 1 and 2; KDD 2027 only its second). */
export const roundsOf = (ed: AppEdition) => [...new Set(ed.milestones.map(roundOf).filter((r) => r > 0))].sort();

/** A venue that takes papers through ACL Rolling Review: its reviews end at the commitment step. */
export const isArrVenue = (ed: AppEdition) => ed.kind === 'conference' && ed.milestones.some((m) => m.type === 'commitment');

/** "ARR 10 月轮", from the label ("ARR 投稿截止（2026 年 10 月轮）") or the deadline's own month. */
export function arrCycleName(paper: AppMilestone): string {
  const m = /(\d{1,2})\s*月轮/.exec(paper.label_zh ?? '');
  const t = paper.at_resolved ?? paper.end_resolved;
  return `ARR ${m ? Number(m[1]) : t ? Number(t.local.slice(5, 7)) : ''} 月轮`;
}

const pointOf = (m: AppMilestone): ResolvedTime | undefined => (m.status === 'tba' ? undefined : (m.at_resolved ?? m.end_resolved ?? m.start_resolved));

/** First and last day of the conference (the earliest site when there are several), or of the edition's dates. */
export function conferenceSpan(ed: AppEdition): { start: string; end: string; est: boolean } | undefined {
  const cs = ed.milestones.filter((m) => m.type === 'conference' && m.status !== 'tba' && m.start_resolved);
  const first = cs.sort((a, b) => shownDate(a.start_resolved!).localeCompare(shownDate(b.start_resolved!)))[0];
  if (first) {
    const end = cs.map((m) => shownDate(m.end_resolved ?? m.start_resolved!)).sort().at(-1)!;
    return { start: shownDate(first.start_resolved!), end, est: first.status === 'estimated' };
  }
  return ed.dates ? { start: ed.dates.start, end: ed.dates.end, est: false } : undefined;
}

// ---------- lanes (§11.2) ----------

export interface Seg {
  edition: string;
  /** From the paper deadline (the ARR deadline for *ACL venues) to the result, clipped to the axis. */
  x0: number;
  x1: number;
  /** Abstract or registration dot, joined to the bar by a thin line; absent when it is off the axis. */
  pre?: number;
  /** Written in the bar when it fits: "2027", "ARR 10 月轮", "2027 一轮". */
  label: string;
  /** The shorter label when the full one does not fit: "一轮". */
  short?: string;
  /** Any end is an estimate: lighter, hatched, dashed edge. */
  est: boolean;
  /** The result date is not published: the bar stops at the last known step and fades out. */
  fade: boolean;
  /** The part before today ends here (x0 when none of it is past). */
  past: number;
  /** Commitment to the venue (*ACL): a notch in the bar. */
  ticks: number[];
  /** Sub-row inside the lane (two when rounds overlap). */
  row: number;
  /** What a screen reader says for this bar. */
  aria: string;
}

export interface Dot {
  edition: string;
  x: number;
  est: boolean;
  past: boolean;
  row: number;
}

/** The second line under the venue name (§11.2): the next thing that concerns the user, and the edition it belongs to. */
export interface LaneNext {
  edition: string;
  /** "明天 19:59", "10/2", "约 5/5"; "结果 12/16" for an edition holding the user's paper. */
  text: string;
  /** Within 7 days: drawn in the accent colour. */
  soon: boolean;
  /** Read after the venue name: "下一个截止：摘要 约 2027/5/5 19:59（预计）". */
  aria: string;
}

export interface Lane {
  series: string;
  name: string;
  segs: Seg[];
  dots: Dot[];
  /** Sub-rows used (1, or 2 when two bars overlap). */
  rows: number;
  /** Each edition's extent, for a tap between bars (the nearest edition opens). */
  spans: { edition: string; from: number; to: number }[];
  next?: LaneNext;
  /** The edition a tap on the venue name opens: the one its second line is about, else the nearest one not yet over. */
  open?: string;
}

const SUBMIT_TYPES = new Set(['abstract', 'paper_registration', 'paper']);

/** The earliest of a list of times, as a Target ms. */
const msOf = (t: ResolvedTime) => targetOf(t).ms;

const DAY_MS = 86_400_000;

/** "9/26", "约 2027/7/27": the year whenever it is not this year's, one rule for every date in a sentence. */
function ariaDay(day: string, est: boolean, now: number): string {
  const y = day.slice(0, 4) === beijingDate(now).slice(0, 4) ? md(day) : `${day.slice(0, 4)}/${md(day)}`;
  return `${est ? '约 ' : ''}${y}`;
}

/** A deadline for a screen reader: "9/26 周六 19:59"; an estimate has no weekday ("约 2027/5/5 19:59"). */
function ariaTime(m: AppMilestone, t: ResolvedTime, now: number): string {
  const est = m.status === 'estimated';
  const day = shownDate(t);
  if (!hasTime(t.local)) return ariaDay(day, est, now);
  return `${ariaDay(day, est, now)}${est ? '' : ` ${weekday(day)}`} ${t.beijing.slice(11, 16)}`;
}

/** "ICLR 2027，摘要截止 9/19 周六 19:59，正文截止 9/26 周六 19:59，12/16 出结果，2027/4/26–4/30 开会". */
function ariaOf(ed: AppEdition, e: ReturnType<typeof entriesOf>[number], round: string, now: number): string {
  const parts = [`${ed.name}${round ? ` ${round}` : ''}`];
  if (e.pre && e.preAt) parts.push(`${stepName(e.pre)}截止 ${ariaTime(e.pre, e.preAt, now)}`);
  parts.push(`${isArrVenue(ed) ? '经 ARR 投稿截止' : `${stepName(e.paper)}截止`} ${ariaTime(e.paper, e.paperAt, now)}`);
  const res = resultWord(ed);
  parts.push(e.result && e.resultAt ? `${ariaDay(shownDate(e.resultAt), e.result.status === 'estimated', now)} ${res}` : `${res}时间待公布`);
  const c = conferenceSpan(ed);
  if (c) parts.push(`${ariaDay(c.start, c.est, now)}–${c.end.slice(0, 4) === c.start.slice(0, 4) ? md(c.end) : ariaDay(c.end, false, now)} 开会`);
  return parts.join('，');
}

/** The bars and conference dot of one edition on the axis (rows not yet packed). */
export function laneMarks(ed: AppEdition, axis: Axis, now: number): { segs: Seg[]; dots: Dot[] } {
  const today = xOfMs(now, axis);
  const entries = entriesOf(ed);
  const arr = isArrVenue(ed);
  const segs: Seg[] = [];
  for (const e of entries) {
    let x0 = xOf(e.paperAt, axis);
    let x1: number;
    let fade = false;
    if (e.resultAt) x1 = xOf(e.resultAt, axis);
    else {
      // Draw to the last step that has a date (reviews out, rebuttal…), then fade; never guess the result.
      const known = ed.milestones
        .filter((m) => m.type !== 'conference' && shownBeforeAccept(ed, m) && pointOf(m) && msOf(pointOf(m)!) > e.paperT.ms)
        .map((m) => xOf(pointOf(m)!, axis));
      x1 = known.length ? Math.max(...known) : x0 + 16;
      fade = true;
    }
    if (x1 < 0 || x0 > axis.width) continue;
    let pre = e.preAt ? xOf(e.preAt, axis) : undefined;
    if (pre !== undefined && (pre < 0 || pre >= x0)) pre = undefined;
    x0 = Math.max(0, x0);
    x1 = Math.min(axis.width, x1);
    const r = e.round ?? roundOf(e.paper);
    const round = r ? ROUND_ZH[r]! : '';
    const label = round ? `${ed.year} ${round}` : arr ? arrCycleName(e.paper) : String(ed.year);
    const commit = arr ? ed.milestones.find((m) => m.type === 'commitment' && pointOf(m)) : undefined;
    const tick = commit ? xOf(pointOf(commit)!, axis) : undefined;
    segs.push({
      edition: ed.id,
      x0,
      x1,
      pre,
      label,
      short: round || undefined,
      est: e.estimated,
      fade,
      past: Math.min(Math.max(today, x0), x1),
      ticks: tick !== undefined && tick > x0 && tick < x1 ? [tick] : [],
      row: 0,
      aria: ariaOf(ed, e, round, now) + (e.estimated ? '（预计）' : ''),
    });
  }
  const dots: Dot[] = [];
  const c = conferenceSpan(ed);
  if (c) {
    const x = xOfDay(c.start, axis);
    if (x >= 0 && x <= axis.width) dots.push({ edition: ed.id, x, est: c.est, past: dayEnd(c.end) <= now, row: 0 });
  }
  return { segs, dots };
}

const dayEnd = (day: string) => Date.parse(`${day}T23:59:59+08:00`);

/**
 * Put bars that overlap on separate sub-rows (WACV's two rounds); bars that
 * follow each other share one (KDD 2027 一轮, 二轮, then KDD 2028 一轮). A
 * conference dot stays on its edition's last row, drawn over any later bar
 * with a ring (KDD 2027 meets while KDD 2028's first round is in review).
 * Returns the number of rows used.
 */
export function packRows(segs: Seg[], dots: Dot[], gap = 4): number {
  const ends: number[] = [];
  for (const s of [...segs].sort((a, b) => (a.pre ?? a.x0) - (b.pre ?? b.x0))) {
    const from = s.pre ?? s.x0;
    let r = ends.findIndex((end) => from >= end + gap);
    if (r < 0) {
      r = ends.length;
      ends.push(s.x1);
    } else ends[r] = s.x1;
    s.row = r;
  }
  for (const d of dots) d.row = Math.max(0, ...segs.filter((s) => s.edition === d.edition).map((s) => s.row));
  return Math.max(1, ends.length);
}

/**
 * When a series next asks for something (§11.2 排序：时间优先): the next
 * submission deadline still ahead (abstract, registration or paper), else
 * the next result. ICLR on 9/25: the abstract closed, the paper deadline
 * 9/26 has not, so it comes first.
 */
export function laneKey(s: Series, now: number): { deadline: number; result: number } {
  let deadline = Number.POSITIVE_INFINITY;
  let result = Number.POSITIVE_INFINITY;
  for (const ed of s.editions)
    for (const m of ed.milestones) {
      const t = pointOf(m);
      if (!t) continue;
      const ms = msOf(t);
      if (ms <= now) continue;
      if (SUBMIT_TYPES.has(m.type)) deadline = Math.min(deadline, ms);
      else if (m.type === 'notification') result = Math.min(result, ms);
    }
  return { deadline, result };
}

/** Lanes top to bottom: the next deadline first; venues with none in sight go last, by their next result; ties keep the follow order. */
export function laneOrder(series: Series[], now: number): Series[] {
  const keys = new Map(series.map((s, i) => [s.id, { ...laneKey(s, now), i }]));
  return [...series].sort((a, b) => {
    const ka = keys.get(a.id)!;
    const kb = keys.get(b.id)!;
    return ka.deadline - kb.deadline || ka.result - kb.result || ka.i - kb.i;
  });
}

/**
 * "今天 19:59", "明天 19:59", "10/2", "约 5/5": short enough for the 60px
 * under a venue name. A day ten months or more away carries its year, short
 * ("约 27/9/16"), so it never reads as a day that has just passed.
 */
export function dayWord(t: ResolvedTime, est: boolean, now: number): string {
  const day = shownDate(t);
  const diff = dayDiff(day, beijingDate(now));
  const time = hasTime(t.local) ? ` ${t.beijing.slice(11, 16)}` : '';
  if (!est && diff === 0) return `今天${time}`;
  if (!est && diff === 1) return `明天${time}`;
  return `${est ? '约 ' : ''}${needsYear(day, now) ? `${day.slice(2, 4)}/` : ''}${md(day)}`;
}

/**
 * The second line under a venue name, and the edition the name opens
 * (§11.2). An edition holding the user's paper (正在投) with its result
 * still ahead says when: "结果 12/16". Otherwise the next submission
 * deadline of the series: NeurIPS on 9/25 says "约 5/5" and opens NeurIPS
 * 2027, not the 2026 edition whose result is already out.
 */
export function laneNext(s: Series, now: number, mine: ReadonlySet<string> = new Set()): LaneNext | undefined {
  for (const ed of s.editions) {
    if (!mine.has(ed.id)) continue;
    const res = ed.milestones
      .filter((m) => m.type === 'notification' && pointOf(m) && dayEnd(shownDate(pointOf(m)!)) > now)
      .sort((a, b) => msOf(pointOf(a)!) - msOf(pointOf(b)!))[0];
    if (!res) continue;
    const t = pointOf(res)!;
    const est = res.status === 'estimated';
    return {
      edition: ed.id,
      text: `结果 ${dayWord(t, est, now).replace(/ \d\d:\d\d$/, '')}`,
      soon: msOf(t) - now < 7 * DAY_MS,
      aria: `你在投的 ${ed.name}，${ariaDay(shownDate(t), est, now)} 出结果${est ? '（预计）' : ''}`,
    };
  }
  let best: { ed: AppEdition; m: AppMilestone; t: ResolvedTime; ms: number } | undefined;
  for (const ed of s.editions) {
    if (ed.kind !== 'conference') continue;
    for (const m of ed.milestones) {
      const t = pointOf(m);
      if (!t || !SUBMIT_TYPES.has(m.type)) continue;
      const ms = msOf(t);
      if (ms > now && (!best || ms < best.ms)) best = { ed, m, t, ms };
    }
  }
  if (!best) return undefined;
  const est = best.m.status === 'estimated';
  return {
    edition: best.ed.id,
    text: dayWord(best.t, est, now),
    soon: best.ms - now < 7 * DAY_MS,
    aria: `下一个截止：${best.ed.name} ${stepName(best.m)} ${ariaTime(best.m, best.t, now)}${est ? '（预计）' : ''}`,
  };
}

/** One lane: every edition of the series with something on the axis. */
export function laneOf(s: Series, axis: Axis, now: number, mine: ReadonlySet<string> = new Set()): Lane {
  const segs: Seg[] = [];
  const dots: Dot[] = [];
  const spans: Lane['spans'] = [];
  let open: { id: string; ms: number } | undefined;
  for (const ed of s.editions) {
    if (ed.kind !== 'conference') continue;
    const m = laneMarks(ed, axis, now);
    segs.push(...m.segs);
    dots.push(...m.dots);
    const xs = [...m.segs.flatMap((x) => [x.pre ?? x.x0, x.x1]), ...m.dots.map((d) => d.x)];
    if (xs.length) spans.push({ edition: ed.id, from: Math.min(...xs), to: Math.max(...xs) });
    // Without a next line: the nearest edition whose conference is not over.
    const c = conferenceSpan(ed);
    const end = c ? dayEnd(c.end) : Math.max(...ed.milestones.map((x) => (pointOf(x) ? msOf(pointOf(x)!) : 0)));
    if (end > now && (!open || end < open.ms)) open = { id: ed.id, ms: end };
  }
  const rows = packRows(segs, dots);
  const next = laneNext(s, now, mine);
  return { series: s.id, name: s.name, segs, dots, rows, spans, next, open: next?.edition ?? open?.id };
}

/** The edition to open for a tap at `x` between bars: the one whose extent is nearest. */
export function nearestAt(lane: Pick<Lane, 'spans' | 'open'>, x: number): string | undefined {
  let best: { id: string; d: number } | undefined;
  for (const s of lane.spans) {
    const d = x < s.from ? s.from - x : x > s.to ? x - s.to : 0;
    if (!best || d < best.d) best = { id: s.edition, d };
  }
  return best?.id ?? lane.open;
}

/**
 * Where a bar's label starts, px from the bar's left edge: on the part
 * still ahead (from today), so it is not on the faded past; else from the
 * bar's start or the left edge of the view when the card opens (`from`),
 * whichever is later. It moves right of a conference dot on its row, never
 * straddles today's line, and then sticks beside the name column while its
 * bar scrolls under it. Undefined when it does not fit in what is visible
 * (the bar's aria label still has it).
 */
export function labelAt(s: Seg, text: string, today: number, dots: Dot[] = [], fontPx = 10, from = Number.NEGATIVE_INFINITY): number | undefined {
  const w = textWidth(text) * fontPx + 8;
  const starts = today > s.x0 && today < s.x1 ? [today + 2, Math.max(s.x0, from + 2)] : [Math.max(s.x0, from + 2)];
  for (let at of starts) {
    const dot = dots.find((d) => d.row === s.row && d.x + 6 > at && d.x - 6 < at + w);
    if (dot) at = dot.x + 7;
    if (at + w <= s.x1 && !(at < today && at + w > today)) return at - s.x0;
  }
  return undefined;
}

// ---------- colours (§11.2 颜色) ----------

export const LANE_SLOTS = 8;

/**
 * A colour slot (1–8) per followed series, handed out in follow order and
 * kept when the list is reordered: a series keeps its slot while followed,
 * a new one gets the lowest free slot, the 9th and later get 0 (grey).
 */
export function laneColors(stored: Record<string, number>, follow: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  const used = new Set<number>();
  for (const id of follow) {
    const s = stored[id];
    if (s && s >= 1 && s <= LANE_SLOTS && !used.has(s)) {
      out[id] = s;
      used.add(s);
    }
  }
  for (const id of follow) {
    if (out[id] !== undefined) continue;
    let slot = 0;
    for (let i = 1; i <= LANE_SLOTS; i++)
      if (!used.has(i)) {
        slot = i;
        break;
      }
    out[id] = slot;
    if (slot) used.add(slot);
  }
  return out;
}

// ---------- the zoomed phase bar of one edition (§11.3) ----------

/** 交稿 ▲, 回复 ▓, 等待 ─, 公布 ◆, 开会 ▇. */
export type PhaseKind = 'submit' | 'reply' | 'wait' | 'announce' | 'conf';

export const PHASE_ZH: Record<PhaseKind, string> = { submit: '交稿', reply: '回复', wait: '等待', announce: '公布', conf: '开会' };

const isWindow = (m: AppMilestone) => !m.at_resolved && !!m.start_resolved && !!m.end_resolved;

/**
 * What the author does at a milestone, by type: deadlines are 交稿 (WACV's
 * revision, a point, too), rebuttal and discussion windows are 回复, review
 * and AC windows are 等待, releases are 公布. A meta-review release (a point:
 * ARR 12/18) is 公布. Other types (profile, registration) get no mark on the
 * bar; the list gives them a symbol by whether the author acts.
 */
export function phaseKind(m: AppMilestone): PhaseKind | undefined {
  switch (m.type) {
    case 'conference':
      return 'conf';
    case 'abstract':
    case 'paper_registration':
    case 'paper':
    case 'supplementary':
    case 'camera_ready':
    case 'commitment':
      return 'submit';
    case 'author_response':
    case 'discussion':
      return isWindow(m) ? 'reply' : 'submit';
    case 'reviewing':
      return 'wait';
    case 'meta_reviews':
      return isWindow(m) ? 'wait' : 'announce';
    case 'phase1_notification':
    case 'reviews_out':
    case 'notification':
      return 'announce';
    default:
      return undefined;
  }
}

/** Where a step sits in an edition when it has no date yet: the order a venue runs through them. */
const TYPE_ORDER = [
  'abstract',
  'paper_registration',
  'paper',
  'supplementary',
  'profile_deadline',
  'reviewer_registration',
  'reviewing',
  'phase1_notification',
  'reviews_out',
  'author_response',
  'discussion',
  'meta_reviews',
  'commitment',
  'notification',
  'camera_ready',
  'author_registration',
  'refund_cutoff',
];
const typeRank = (t: string) => (t === 'conference' ? 100 : TYPE_ORDER.includes(t) ? TYPE_ORDER.indexOf(t) : 90);

/**
 * The phase list's order (§11.3): dated steps by time (a window by its
 * start), each 待公布 step before the first step that comes after it in a
 * venue's usual order, so KDD's 作者注册截止 is not listed after 会议举办.
 */
export function listOrder(ms: AppMilestone[]): AppMilestone[] {
  const start = (m: AppMilestone) => {
    const t = m.status === 'tba' ? undefined : (m.at_resolved ?? m.start_resolved ?? m.end_resolved);
    return t ? msOf(t) : undefined;
  };
  const out = ms
    .filter((m) => start(m) !== undefined)
    .map((m, i) => ({ m, i }))
    .sort((a, b) => start(a.m)! - start(b.m)! || a.i - b.i)
    .map((x) => x.m);
  for (const m of ms.filter((x) => start(x) === undefined)) {
    const at = out.findIndex((x) => typeRank(x.type) > typeRank(m.type));
    out.splice(at < 0 ? out.length : at, 0, m);
  }
  return out;
}

/** A step that is a period at every venue, for a 待公布 row that has no dates to tell (AAAI's 讨论期 is not a ▲). */
const TBA_KIND: Record<string, PhaseKind> = { author_response: 'reply', discussion: 'reply', reviewing: 'wait', meta_reviews: 'wait' };

/** The symbol a list row gets: its phase, or 交稿 / 公布 by whether the author acts. */
export const listKind = (m: AppMilestone): PhaseKind =>
  (m.status === 'tba' ? TBA_KIND[m.type] : undefined) ?? phaseKind(m) ?? (isAction(m) ? 'submit' : 'announce');

const SHORT: Record<string, string> = {
  abstract: '摘要',
  paper_registration: '注册',
  paper: '正文',
  supplementary: '补充',
  camera_ready: '终稿',
  commitment: '提交会议',
  author_response: '回复',
  discussion: '讨论',
  phase1_notification: '初审',
  reviews_out: '出审稿',
  meta_reviews: 'AC 意见',
  notification: '出结果',
};

export interface PhaseMark {
  type: string;
  kind: PhaseKind;
  /** Fractions of the drawn span, 0–1 (x1 for windows). */
  x0: number;
  x1?: number;
  name: string;
  est: boolean;
  past: boolean;
  /** The next step (or the window under way): drawn in the accent colour, as the list's bold row. */
  next?: boolean;
  /** Label line under the bar (0 or 1); absent when there is no room (the list has it). */
  line?: 0 | 1;
}

export interface PhaseRow {
  /** "一轮", "ARR 审稿"… when the bar has several rows. */
  title?: string;
  marks: PhaseMark[];
  /** The grey waiting line: from the row's first step to its last. */
  base?: [number, number];
}

export interface PhaseBar {
  rows: PhaseRow[];
  /** 兼审稿: the reviewing window of authors who also review. */
  review?: { x0: number; x1: number; est: boolean; past: boolean };
  /** Result or camera-ready is more than 6 weeks before the conference: the gap is cut ("≈") and the conference drawn at a fixed width. */
  cut: boolean;
  conf?: { x0: number; x1: number; est: boolean; past: boolean; month: string };
  ticks: { x: number; label: string }[];
  today?: number;
  /** Steps that are not published yet: only the list has them. */
  tba: number;
}

const DAY = 86_400_000;
const noon = (day: string) => Date.parse(`${day}T12:00:00+08:00`);

/**
 * The short name under a mark, the same word the list uses: a point-type
 * author_response is a revision deadline (WACV "修改稿"), a point-type
 * meta_reviews is a release ("AC 意见"), an ARR paper deadline is "投稿".
 */
export function phaseName(m: AppMilestone, arr: boolean, abstractOnly = false): string {
  if (m.type === 'paper' && arr) return '投稿';
  if (m.type === 'notification' && abstractOnly) return '摘要结果';
  if (m.type === 'author_response' && !isWindow(m)) return '修改稿';
  return SHORT[m.type] ?? MILESTONE_ZH[m.type] ?? m.type;
}

/**
 * The phase bar of one edition. The scale runs from 3 days before the first
 * step to 3 days after the last one before the conference; when the
 * conference is more than 6 weeks after that, it is cut off with "≈" and
 * drawn as a fixed block (`cut`). Rows: one; one per round (WACV, with the
 * shared result, camera-ready and conference on each); or "ARR 审稿" and
 * "会议录用" for *ACL venues, which meet at the commitment step. Labels go
 * under the marks, on a second line when they collide, else they are left
 * to the list (`trackPx` is the drawn width in px).
 */
export function phaseBands(ed: AppEdition, now: number, trackPx = 280): PhaseBar {
  const marks: (PhaseMark & { round: number; ms0: number; ms1?: number })[] = [];
  let review: { ms0: number; ms1: number; est: boolean } | undefined;
  let tba = 0;
  const arr = isArrVenue(ed);
  const abstractOnly = isAbstractOnly(ed);
  for (const m of ed.milestones) {
    if (!shownBeforeAccept(ed, m)) continue;
    // An abstract-only meeting's early registration is one of its four key dates (§12.3): a ▲ named 注册.
    const kind = phaseKind(m) ?? (abstractOnly && m.type === 'early_registration' ? 'submit' : undefined);
    if (!kind || kind === 'conf') continue;
    if (m.status === 'tba') {
      tba++;
      continue;
    }
    const s = m.at_resolved ?? m.start_resolved;
    const e = m.at_resolved ? undefined : m.end_resolved;
    if (!s) continue;
    const ms0 = noon(shownDate(s));
    const ms1 = e ? noon(shownDate(e)) : undefined;
    if (m.type === 'reviewing') {
      review = { ms0, ms1: ms1 ?? ms0, est: m.status === 'estimated' };
      continue;
    }
    // A waiting window is the grey line itself; only the list names it.
    if (kind === 'wait') continue;
    // A late-breaking call is drawn but not named: its "摘要" would read as a second deadline (the list names it).
    const name = isLateAbstract(ed, m) ? '' : m.type === 'early_registration' ? '注册' : phaseName(m, arr, abstractOnly);
    marks.push({ type: m.type, kind, x0: 0, x1: undefined, name, est: m.status === 'estimated', past: (ms1 ?? ms0) + 12 * 3_600_000 <= now, round: roundOf(m), ms0, ms1 });
  }
  const conf = conferenceSpan(ed);
  const times = [...marks.flatMap((x) => [x.ms0, x.ms1 ?? x.ms0]), ...(review ? [review.ms0, review.ms1] : [])];
  if (!times.length) return { rows: [], cut: false, ticks: [], tba };
  const lastStep = Math.max(...times);
  const cut = !!conf && noon(conf.start) - lastStep > 42 * DAY;
  const t0 = Math.min(...times) - 3 * DAY;
  const t1 = conf && !cut ? noon(conf.end) + DAY : lastStep + 3 * DAY;
  const f = (ms: number) => Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
  for (const x of marks) {
    x.x0 = f(x.ms0);
    if (x.ms1 !== undefined) x.x1 = f(x.ms1);
  }
  // The next step: the earliest mark not over (WACV's shared result is next on both rows).
  const ahead = marks.filter((x) => !x.past).map((x) => x.ms0);
  const nextMs = ahead.length ? Math.min(...ahead) : undefined;
  for (const x of marks) if (x.ms0 === nextMs) x.next = true;
  const confMark = conf
    ? {
        x0: cut ? 0 : f(noon(conf.start)),
        x1: cut ? 1 : f(noon(conf.end)),
        est: conf.est,
        past: dayEnd(conf.end) <= now,
        month: `${Number(conf.start.slice(5, 7))}月`,
      }
    : undefined;

  // Rows.
  const rounds = [...new Set(marks.map((x) => x.round).filter((r) => r > 0))].sort();
  const plain = (xs: PhaseMark[]) => xs.map(({ type, kind, x0, x1, name, est, past, next }) => ({ type, kind, x0, x1, name, est, past, next }));
  let rows: PhaseRow[];
  if (rounds.length > 1) rows = rounds.map((r) => ({ title: ROUND_ZH[r], marks: plain(marks.filter((x) => x.round === r || x.round === 0)) }));
  else if (arr && marks.some((x) => x.type === 'commitment')) {
    const commit = marks.find((x) => x.type === 'commitment')!;
    const arrSide = marks.filter((x) => x.ms0 <= commit.ms0 && x.type !== 'notification');
    const venueSide = marks.filter((x) => x.ms0 >= commit.ms0 && !arrSide.includes(x));
    const paper = ed.milestones.find((m) => m.type === 'paper');
    rows = [
      { title: `ARR 审稿${paper ? `（${arrCycleName(paper).replace(/^ARR /, '')}）` : ''}`, marks: plain(arrSide) },
      { title: '会议录用', marks: plain([commit, ...venueSide]) },
    ];
  } else rows = [{ marks: plain(marks) }];
  for (const row of rows) {
    row.marks.sort((a, b) => a.x0 - b.x0);
    const xs = row.marks.flatMap((x) => [x.x0, x.x1 ?? x.x0]);
    if (xs.length > 1) row.base = [Math.min(...xs), Math.max(...xs)];
    placeLabels(row.marks, trackPx);
  }

  // Month ticks inside the scale, and the month the scale starts in at its left edge (so the first ▲ has a month).
  const ticks: PhaseBar['ticks'] = [];
  const first = new Date(t0 + 8 * 3_600_000);
  let y = first.getUTCFullYear();
  let mo = first.getUTCMonth() + 2;
  ticks.push({ x: 0, label: `${first.getUTCMonth() + 1}月` });
  for (;;) {
    if (mo > 12) {
      mo = 1;
      y++;
    }
    const ms = Date.parse(`${y}-${String(mo).padStart(2, '0')}-01T00:00:00+08:00`);
    if (ms >= t1) break;
    ticks.push({ x: f(ms), label: `${mo}月` });
    mo++;
  }
  // The start label gives way when the next month begins within a label's width of it;
  // on a long scale (KDD's two rounds, 11 months) every other month goes, so labels never touch.
  if (ticks.length > 1 && ticks[1]!.x * trackPx < 30) ticks.shift();
  for (let i = 1; i < ticks.length; )
    if ((ticks[i]!.x - ticks[i - 1]!.x) * trackPx < 32) ticks.splice(i, 1);
    else i++;
  const today = now > t0 && now < t1 ? f(now) : undefined;
  // With the conference cut off, a month label too near the end would run into its "≈".
  if (cut) while (ticks.length && ticks.at(-1)!.x > 1 - 34 / trackPx) ticks.pop();
  return {
    rows,
    review: review ? { x0: f(review.ms0), x1: f(review.ms1), est: review.est, past: review.ms1 <= now } : undefined,
    cut,
    conf: confMark,
    ticks,
    today,
    tba,
  };
}

/** Labels under the marks, left to right: first line, else the second, else none (the list has every step). */
function placeLabels(marks: PhaseMark[], trackPx: number) {
  const ends: [number, number] = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const m of marks) {
    if (!m.name) continue;
    const center = (m.x1 !== undefined ? (m.x0 + m.x1) / 2 : m.x0) * trackPx;
    const w = textWidth(m.name) * 12 + 6;
    const from = Math.max(0, Math.min(trackPx - w, center - w / 2));
    for (const line of [0, 1] as const) {
      if (from >= ends[line]) {
        m.line = line;
        ends[line] = from + w;
        break;
      }
    }
  }
}

// ---------- the paper's route, small (§11.5) ----------

export interface MiniRow {
  edition: string;
  series: string;
  name: string;
  pre?: number;
  x0: number;
  x1: number;
  est: boolean;
  /** 先注册摘要: this stop's abstract closes before the previous result. */
  warn: boolean;
}

export interface MiniRoute {
  rows: MiniRow[];
  ticks: { x: number; label: string }[];
}

/**
 * Route stops on one axis, from today to the last result (at most 15
 * months): an abstract dot and a bar from the paper deadline to the result
 * per stop. Fractions 0–1 of the width; no scrolling. Ticks every 3 months
 * from the current one ("12", "3", "6"…).
 */
export function miniRoute(stops: { entry: ReturnType<typeof entriesOf>[number]; preFirst?: boolean }[], now: number): MiniRoute {
  if (!stops.length) return { rows: [], ticks: [] };
  const t0 = now;
  const ends = stops.map((s) => (s.entry.resultAt ? noon(shownDate(s.entry.resultAt)) : noon(shownDate(s.entry.paperAt)) + 30 * DAY));
  const t1 = Math.min(Math.max(...ends) + 10 * DAY, t0 + 470 * DAY);
  const f = (ms: number) => Math.min(1, Math.max(0, (ms - t0) / (t1 - t0)));
  const rows = stops.map((s, i) => {
    const e = s.entry;
    return {
      edition: e.edition.id,
      series: e.edition.series,
      name: e.edition.name,
      pre: e.preAt && e.preT!.ms > now ? f(noon(shownDate(e.preAt))) : undefined,
      x0: f(noon(shownDate(e.paperAt))),
      x1: f(ends[i]!),
      est: e.estimated,
      warn: !!s.preFirst,
    };
  });
  const ticks: MiniRoute['ticks'] = [];
  const today = beijingDate(now);
  const k0 = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
  for (let k = k0 + 3; ; k += 3) {
    const ms = Date.parse(`${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}-01T00:00:00+08:00`);
    if (ms >= t1) break;
    const m = (k % 12) + 1;
    ticks.push({ x: f(ms), label: m === 1 ? `${Math.floor(k / 12)}/1` : `${m}月` });
  }
  return { rows, ticks };
}
