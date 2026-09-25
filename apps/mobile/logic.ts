// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Pure logic for the mobile app: time formatting, relative time, which
// milestone comes next, and how rules attach to milestones. No DOM here, so
// it can be unit-tested.

import { POST_ACCEPT_ONLY } from '../../packages/core/src/types.ts';
import type { AppEdition, AppMilestone, AppRule, Answer, ResolvedTime } from './types.ts';

// ---------- words ----------

export const ANSWER_WORD: Record<Answer, string> = {
  allowed: '可以',
  not_allowed: '不能',
  required: '必须',
  conditional: '有条件',
  unspecified: '未规定',
  not_required: '不要求',
  contradictory: '说法矛盾',
};

export const ANSWER_MEANING: Record<Answer, string> = {
  allowed: '官方明确允许。',
  not_allowed: '官方明确不允许，违反可能被 desk reject。',
  required: '官方要求必须做到，通常有截止时间。',
  conditional: '只在特定时间段或条件下可以，看解释。',
  unspecified: '查过官方页面，没有找到相关规定。',
  not_required: '官方明确不要求。',
  contradictory: '官方不同页面说法不一致。本应用并列几种读法，不替你选。',
};

export const MILESTONE_ZH: Record<string, string> = {
  abstract: '摘要截止',
  paper_registration: '论文注册截止',
  paper: '正文截止',
  supplementary: '补充材料截止',
  profile_deadline: '作者资料截止',
  reviewer_registration: '审稿人注册截止',
  reviewing: '审稿期',
  phase1_notification: '第一轮结果',
  reviews_out: '审稿意见发布',
  author_response: '作者回复期',
  discussion: '讨论期',
  meta_reviews: '领域主席评审',
  commitment: '提交到会议截止',
  notification: '最终结果',
  camera_ready: '终稿截止',
  author_registration: '作者注册截止',
  conference: '会议举办',
  // After acceptance (MOBILE_SPEC §10); only accepted papers' checklists show these.
  site_preference: '会场意向表截止',
  site_assignment: '会场分配公布',
  financial_aid: '资助申请截止',
  financial_aid_result: '资助结果公布',
  registration_open: '注册开放',
  early_registration: '优惠注册截止',
  standard_registration: '标准价注册截止',
  visa_letter: '邀请函申请',
  visa_refund_apply_by: '拒签退款：递签截止',
  refund_cutoff: '全额退款截止',
  visa_refund_request_by: '拒签退款申请截止',
  presentation_format_final: '报告形式锁定',
  poster: '海报截止',
};

/** Only an accepted paper's checklist shows these; 下一步, venue cards and "全部" leave them out (MOBILE_SPEC §10). */
export const isPostAcceptOnly = (m: { type: string }) => POST_ACCEPT_ONLY.has(m.type as never);

/** Only an abstract is submitted (AACR, SfN, EGU): submission_type abstract. */
export const isAbstractOnly = (ed: Pick<AppEdition, 'submission_type'>) => ed.submission_type === 'abstract';

/**
 * The way in is an abstract deadline: an abstract-only meeting, or an
 * edition whose data holds abstract deadlines and no paper deadline at all
 * (ADA 2027: regular and late-breaking abstracts; the type is not written
 * without a quote that says so). The first abstract deadline is its entry.
 */
export const isAbstractEntry = (ed: Pick<AppEdition, 'submission_type' | 'milestones'>) =>
  isAbstractOnly(ed) || (!ed.milestones.some((m) => m.type === 'paper' || m.type === 'paper_registration') && ed.milestones.some((m) => m.type === 'abstract'));

/**
 * A second call for abstracts at an abstract-only meeting (AACR's and
 * ESMO's late-breaking abstracts, ECR's Late Breaking): only new results of
 * note may come in, so it is never a deadline to submit to (§12.3). It is
 * listed on the timeline and the phase list, and nowhere else: not in 下一步,
 * 全部, the venue list or a route.
 */
export function isLateAbstract(ed: Pick<AppEdition, 'submission_type' | 'milestones'>, m: AppMilestone): boolean {
  if (!isAbstractEntry(ed) || m.type !== 'abstract') return false;
  const when = (x: AppMilestone) => {
    const t = x.status === 'tba' ? undefined : (x.at_resolved ?? x.end_resolved ?? x.start_resolved);
    return t ? Date.parse(t.utc) : Number.POSITIVE_INFINITY;
  };
  const first = ed.milestones.filter((x) => x.type === 'abstract').sort((a, b) => when(a) - when(b))[0];
  return !!first && first !== m;
}

/**
 * Whether the lists show a milestone before acceptance. Post-acceptance
 * steps stay on the accepted paper's checklist, except the early
 * registration of an abstract-only meeting: everyone who goes registers,
 * with or without an abstract, so it is one of its four key dates (摘要截止,
 * 摘要结果, 优惠注册截止, 会议举办).
 */
export const shownBeforeAccept = (ed: Pick<AppEdition, 'submission_type'>, m: { type: string }) =>
  !isPostAcceptOnly(m) || (isAbstractOnly(ed) && m.type === 'early_registration');

/** Milestones where the author has to act; the Today card prefers these over announcements. */
export const ACTION_TYPES = new Set([
  'abstract',
  'paper_registration',
  'paper',
  'supplementary',
  'profile_deadline',
  'reviewer_registration',
  'reviewing',
  'author_response',
  'discussion',
  'commitment',
  'camera_ready',
  'author_registration',
  // Listed only for abstract-only meetings (shownBeforeAccept): registering is something to do.
  'early_registration',
]);

export interface Topic {
  id: string;
  name: string;
  families: string[];
}

export const TOPICS: Topic[] = [
  { id: 'author', name: '作者', families: ['author_list', 'profile', 'cap'] },
  { id: 'edit', name: '修改与格式', families: ['content_edit', 'format'] },
  { id: 'review', name: '审稿与回复', families: ['reciprocal_reviewing', 'rebuttal'] },
  { id: 'withdraw', name: '撤稿与多投', families: ['withdrawal', 'dual_submission', 'visibility', 'resubmission'] },
  { id: 'llm', name: 'LLM', families: ['llm_policy'] },
  { id: 'after', name: '录用后', families: ['presentation', 'registration', 'refund'] },
  { id: 'other', name: '其他', families: ['submission', 'other'] },
];

export function topicOf(family: string): Topic {
  return TOPICS.find((t) => t.families.includes(family)) ?? TOPICS[TOPICS.length - 1]!;
}

// ---------- time formatting ----------

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BEIJING_OFFSET = 8 * HOUR; // China has no DST.
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function parts(date: string): [number, number, number] {
  return [Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10))];
}

/** "2026-09-26…" → "9/26" */
export function md(date: string): string {
  const [, m, d] = parts(date);
  return `${m}/${d}`;
}

export function weekday(date: string): string {
  const [y, m, d] = parts(date);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
}

export const hasTime = (local: string) => local.includes('T');

function hhmm(s: string): string {
  // Works for both "YYYY-MM-DD HH:mm" and "YYYY-MM-DDTHH:mm".
  return s.slice(11, 16);
}

/** "2026-09-26 19:59" (Beijing) → "9/26 周六 19:59" */
export function fmtBeijing(beijing: string): string {
  return `${md(beijing)} ${weekday(beijing)} ${hhmm(beijing)}`;
}

/** The calendar day a time is shown on: Beijing day when the venue gave a time, else the official day. */
export const shownDate = (t: ResolvedTime) => (hasTime(t.local) ? t.beijing.slice(0, 10) : t.local.slice(0, 10));

/**
 * Whether a day needs its year to be read right: it is ten months or more
 * away (2027/9/19 next to the 9/19 that just passed), or in the past and in
 * another year. Nearer days stay short ("1/24").
 */
export function needsYear(date: string, now: number): boolean {
  const today = beijingDate(now);
  const diff = dayDiff(date, today);
  return diff >= 300 || (diff < 0 && date.slice(0, 4) !== today.slice(0, 4));
}

/** "9/19", or "2027/9/19" when `now` is given and the day needs its year. */
export function dayText(date: string, now?: number): string {
  return now !== undefined && needsYear(date, now) ? `${date.slice(0, 4)}/${md(date)}` : md(date);
}

/** A point in time as the app shows it: Beijing date and time when the venue gave a time, else only the official date. */
export function fmtPoint(t: ResolvedTime, now?: number): string {
  return hasTime(t.local) ? `${dayText(t.beijing, now)} ${weekday(t.beijing)} ${hhmm(t.beijing)}` : dayText(t.local, now);
}

/** Just the day: Beijing day for a timed deadline, the official day otherwise. */
export function fmtDay(t: ResolvedTime, now?: number): string {
  return dayText(shownDate(t), now);
}

/**
 * "11/5–11/18"; a year is named once, at the start, when either end needs it
 * ("2027/7/19–7/23", not "7/19–2027/7/23"); across a new year both ends carry it.
 */
function dayRange(s: ResolvedTime, e: ResolvedTime, now?: number): string {
  const sd = shownDate(s);
  const ed = shownDate(e);
  const year = now !== undefined && (needsYear(sd, now) || needsYear(ed, now));
  const same = sd.slice(0, 4) === ed.slice(0, 4);
  const withYear = (d: string) => `${d.slice(0, 4)}/${md(d)}`;
  if (!year) return `${md(sd)}–${md(ed)}`;
  return `${withYear(sd)}–${same ? md(ed) : withYear(ed)}`;
}

/**
 * A milestone's time as lists show it. An estimate is last year's date moved
 * on a year, so its weekday means nothing; its Beijing clock time stays, so
 * the day matches the official AoE date: "约 5/5 19:59", "约 11/5–11/18".
 */
export function fmtMilestoneTime(m: AppMilestone, now?: number): string {
  if (m.status === 'tba') return '待公布';
  const s = m.start_resolved;
  const e = m.end_resolved;
  if (m.status === 'estimated') {
    // The weekday of a moved date means nothing, but the clock time does: AoE 5/4 is 5/5 19:59 in Beijing.
    if (m.at_resolved) return `约 ${fmtDay(m.at_resolved, now)}${hasTime(m.at_resolved.local) ? ` ${hhmm(m.at_resolved.beijing)}` : ''}`;
    if (s && e) return `约 ${dayRange(s, e, now)}`;
    if (s) return `约 ${fmtDay(s, now)} 起`;
    if (e) return `约 ${fmtDay(e, now)} 前`;
    return '待公布';
  }
  if (m.at_resolved) return fmtPoint(m.at_resolved, now);
  if (s && e) return `${dayRange(s, e, now)}${hasTime(e.local) ? ` ${hhmm(e.beijing)}` : ''}`;
  if (s) return `${fmtPoint(s, now)} 起`;
  if (e) return `至 ${fmtPoint(e, now)}`;
  return '待公布';
}

export function tzLabel(tz: string): string {
  if (tz === 'AoE' || tz.startsWith('UTC')) return tz;
  // "当地时间" would read as the venue's clock to someone going to Sydney.
  if (tz === 'Asia/Shanghai') return '北京时间';
  if (tz === 'America/Los_Angeles') return '太平洋时间';
  if (tz === 'America/Toronto' || tz === 'America/New_York') return '美东时间';
  return '当地时间';
}

/** What the app says when the venue wrote no time zone and the app counts in Beijing time (DATA_GUIDE §7.1). */
export const TZ_ASSUMED = '没写时区，按北京时间算';

/**
 * How the venue itself writes the time: "9/25 23:59 AoE", "11/5 AoE",
 * "11/5–11/18 AoE". When the venue wrote no zone the app's assumption is
 * not passed off as theirs: "10/2（没写时区，按北京时间算）".
 */
export function fmtOfficial(m: AppMilestone): string {
  const one = (t: ResolvedTime) => (hasTime(t.local) ? `${md(t.local)} ${hhmm(t.local)}` : md(t.local));
  const zone = m.tz_assumed ? `（${TZ_ASSUMED}）` : ` ${tzLabel(m.tz)}`;
  if (m.status === 'tba') return '待公布';
  if (m.at_resolved) return `${one(m.at_resolved)}${zone}`;
  if (m.start_resolved && m.end_resolved) return `${one(m.start_resolved)}–${one(m.end_resolved)}${zone}`;
  return '—';
}

export function beijingDate(ms: number): string {
  return new Date(ms + BEIJING_OFFSET).toISOString().slice(0, 10);
}

/** "北京时间 9月24日 周四 22:30" */
export function nowLine(now: number): string {
  const iso = new Date(now + BEIJING_OFFSET).toISOString();
  const [, m, d] = parts(iso);
  return `北京时间 ${m}月${d}日 ${weekday(iso)} ${iso.slice(11, 16)}`;
}

/** Calendar days from `b` to `a` (both YYYY-MM-DD). */
export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / DAY);
}

export interface Target {
  ms: number;
  /** The calendar day users compare against: Beijing day when timed, official day otherwise. */
  date: string;
  /** Whether the venue gave a time of day (so hours are meaningful). */
  precise: boolean;
}

export function targetOf(t: ResolvedTime): Target {
  const precise = hasTime(t.local);
  return { ms: Date.parse(t.utc), date: precise ? t.beijing.slice(0, 10) : t.local.slice(0, 10), precise };
}
const targetOfTime = targetOf;

/** "1 天 21 小时", "21 小时", "35 分钟". */
export function durationText(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)} 分钟`;
  const hours = Math.floor(minutes / 60);
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  if (d === 0) return `${h} 小时`;
  return h ? `${d} 天 ${h} 小时` : `${d} 天`;
}

/** Relative time for list rows: 今天 / 明天 / "1 天 21 小时" (timed, under 48 h) / "47 天". */
export function relativeText(target: Target, now: number): string {
  const diff = dayDiff(target.date, beijingDate(now));
  if (diff <= 0) return '今天';
  if (diff === 1) return '明天';
  if (target.precise && target.ms - now < 48 * HOUR) return durationText(target.ms - now);
  return `${diff} 天`;
}

export interface CountPart {
  n?: string;
  u: string;
}

/** Big countdown, split into number and unit so numbers can be drawn larger. */
export function countdown(target: Target, now: number): CountPart[] {
  const ms = target.ms - now;
  if (target.precise && ms < 48 * HOUR) {
    const out: CountPart[] = [];
    const re = /(\d+) (天|小时|分钟)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(durationText(ms)))) out.push({ n: m[1]!, u: m[2]! });
    return out;
  }
  const diff = dayDiff(target.date, beijingDate(now));
  if (diff <= 0) return [{ u: '今天' }];
  if (diff === 1) return [{ u: '明天' }];
  return [{ n: String(diff), u: '天' }];
}

export function parseNow(param: string | null | undefined): number | undefined {
  if (!param) return undefined;
  // A literal "+" in a query string arrives as a space.
  const t = Date.parse(param.trim().replace(/ (\d{2}:?\d{2})$/, '+$1'));
  return Number.isNaN(t) ? undefined : t;
}

// ---------- data as shipped ----------

type Slim = { local: string; utc: string; tz?: string; beijing?: string };

/** "2026-09-26 19:59": Beijing wall clock of an instant (China has no DST). */
export const beijingOf = (utc: string) => new Date(Date.parse(utc) + BEIJING_OFFSET).toISOString().slice(0, 16).replace('T', ' ');

/**
 * The page ships milestone times without what can be worked out again
 * (scripts/app-data.ts `slimEditions`): each resolved time keeps its wall
 * clock and instant; its zone is the milestone's and its Beijing time
 * follows from the instant. Upstream milestones carry neither their flag
 * nor the venue link, which the edition has. This puts them back, once, at
 * start-up, and words an abstract-only meeting's result "摘要结果".
 */
export function prepareEditions(editions: AppEdition[]): AppEdition[] {
  for (const ed of editions) {
    const up = ed.data_level === 'upstream';
    const abs = isAbstractOnly(ed);
    for (const m of ed.milestones) {
      for (const k of ['at_resolved', 'start_resolved', 'end_resolved'] as const) {
        const r = m[k] as Slim | undefined;
        if (!r) continue;
        r.tz ??= m.tz;
        r.beijing ??= beijingOf(r.utc);
      }
      if (up) {
        m.upstream = true;
        m.deep_link ??= ed.upstream?.link;
      }
      if (abs && m.type === 'notification' && !m.label_zh) m.label_zh = '摘要结果';
    }
  }
  return editions;
}

// ---------- milestones ----------

export function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? 1 : 0.55;
  return w;
}

export function milestoneName(m: AppMilestone): string {
  return m.label_zh ?? MILESTONE_ZH[m.type] ?? m.type;
}

const mostlyLatin = (s: string) => [...s].filter((ch) => ch.charCodeAt(0) < 0x80).length * 2 > [...s].length;

/**
 * A name short enough for a list row: the venue's own label without asides,
 * or the standard name. Labels that are mostly English ("Author feedback")
 * fall back to the Chinese name.
 */
export function milestoneShort(m: AppMilestone): string {
  const base = MILESTONE_ZH[m.type] ?? m.type;
  if (!m.label_zh) return base;
  const stripped = m.label_zh.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
  // "ARR 投稿截止" on an ACL row reads as another venue's deadline: "投稿截止（经 ARR）".
  const arr = /^ARR\s*(\S.*)$/.exec(stripped);
  if (arr && !mostlyLatin(arr[1]!)) return `${arr[1]}（经 ARR）`;
  return stripped && !mostlyLatin(stripped) && textWidth(stripped) <= 9 ? stripped : base;
}

/**
 * The venue without its year, as people say it: "NeurIPS 2027" → "NeurIPS",
 * "AAAI-27" → "AAAI", "The Web Conference 2027 (WWW 2027)" → "WWW"; ARR cycles → "ARR".
 */
export function seriesName(ed: AppEdition): string {
  if (ed.kind === 'arr_cycle') return 'ARR';
  const paren = /\(([^()]+?)\s+\d{4}\)\s*$/.exec(ed.name);
  if (paren) return paren[1]!;
  // "VTC2027-Fall", "ECS 2027 Spring", "ASHRAE 2027 Winter Conference": the year sits inside the name.
  const inner = /^(\D+?)[\s-]?\d{4}(?:[\s-][A-Za-z]+)+$/.exec(ed.name);
  if (inner) return inner[1]!;
  return ed.name.replace(/[\s-]+\d{2,4}$/, '').trim() || ed.series.toUpperCase();
}

/** A name short enough for route stops and list rows: "The Web Conference 2027 (WWW 2027)" → "WWW 2027". */
export function editionShort(ed: AppEdition): string {
  return /\(([^()]+\d{4})\)\s*$/.exec(ed.name)?.[1] ?? ed.name;
}

export function venueShort(ed: AppEdition): string {
  return seriesName(ed);
}

/** Conference days: the edition's dates, else its conference milestone (estimated for editions not yet announced). */
export function conferenceDays(ed: AppEdition): { text: string; estimated: boolean } | undefined {
  if (ed.dates) return { text: `${md(ed.dates.start)}–${md(ed.dates.end)}`, estimated: false };
  const c = ed.milestones.find((m) => m.type === 'conference' && m.status !== 'tba' && m.start_resolved && m.end_resolved);
  if (!c) return undefined;
  return { text: `${md(c.start_resolved!.local)}–${md(c.end_resolved!.local)}`, estimated: c.status === 'estimated' };
}

/** "cvpr-2026" → "CVPR 2026", "aaai-26" → "AAAI-26", "arr-2026-08" → "ARR 2026 年 8 月轮". */
export function prettyEditionId(id: string): string {
  let m = /^([a-z]+)-(\d{4})-(\d{2})$/.exec(id);
  if (m) return `${m[1]!.toUpperCase()} ${m[2]} 年 ${Number(m[3])} 月轮`;
  m = /^([a-z]+)-(\d{2})$/.exec(id);
  if (m) return `${m[1]!.toUpperCase()}-${m[2]}`;
  m = /^([a-z]+)-(\d{4})$/.exec(id);
  if (m) return `${m[1]!.toUpperCase()} ${m[2]}`;
  return id;
}

/** The tag on dates imported from ccfddl (data_level: upstream): they are not checked against the venue. */
export const UPSTREAM_TAG = '未核对';

/** The one line an upstream venue carries on its page and step sheets (MOBILE_SPEC §12). */
export const UPSTREAM_NOTE = '数据来自 ccfddl · 未逐条核对官网';

export const isUpstream = (ed: Pick<AppEdition, 'data_level'>) => ed.data_level === 'upstream';

/** Where a date's wording comes from, for the line under a milestone: the venue, or ccfddl for upstream editions. */
export const officialWord = (ed: Pick<AppEdition, 'data_level'>) => (isUpstream(ed) ? 'ccfddl 写法' : '官网写法');

export function venueSubtitle(ed: AppEdition): string {
  const out: string[] = [];
  if (ed.place?.city) out.push(ed.place.city);
  const days = conferenceDays(ed);
  if (days) out.push(days.text);
  if (!out.length && ed.kind === 'arr_cycle') out.push('ACL Rolling Review');
  return out.join(' · ');
}

export type Phase = 'due' | 'starts' | 'ends';

export interface Upcoming {
  edition: AppEdition;
  milestone: AppMilestone;
  target: Target;
  phase: Phase;
}

/** The next boundary of a milestone still ahead of `now`, or null if it is over or has no date yet. */
export function nextBoundary(m: AppMilestone, now: number): { target: Target; phase: Phase } | null {
  if (m.status === 'tba') return null;
  // An estimate has no meaningful hour: count it in days only.
  const targetOf = (t: ResolvedTime): Target => {
    const x = targetOfTime(t);
    return m.status === 'estimated' ? { ...x, precise: false } : x;
  };
  if (m.at_resolved) {
    const t = targetOf(m.at_resolved);
    return t.ms > now ? { target: t, phase: 'due' } : null;
  }
  if (m.start_resolved) {
    const s = targetOf(m.start_resolved);
    if (s.ms > now) return { target: s, phase: m.end_resolved ? 'starts' : 'due' };
  }
  if (m.end_resolved) {
    const e = targetOf(m.end_resolved);
    if (e.ms > now) return { target: e, phase: 'ends' };
  }
  return null;
}

export function isPast(m: AppMilestone, now: number): boolean {
  return m.status !== 'tba' && !!(m.at_resolved || m.end_resolved || m.start_resolved) && !nextBoundary(m, now);
}

export function upcoming(editions: AppEdition[], now: number): Upcoming[] {
  const out: Upcoming[] = [];
  for (const edition of editions)
    for (const milestone of edition.milestones) {
      if (!shownBeforeAccept(edition, milestone) || isLateAbstract(edition, milestone)) continue;
      const b = nextBoundary(milestone, now);
      if (b) out.push({ edition, milestone, ...b });
    }
  return out.sort((a, b) => a.target.ms - b.target.ms || a.edition.id.localeCompare(b.edition.id));
}

export function tbaMilestones(editions: AppEdition[]): { edition: AppEdition; milestone: AppMilestone }[] {
  return editions.flatMap((edition) =>
    edition.milestones.filter((m) => m.status === 'tba' && shownBeforeAccept(edition, m) && !isLateAbstract(edition, m)).map((milestone) => ({ edition, milestone })),
  );
}

/** Whether the author has to do something by this milestone (vs. an announcement or the conference itself). */
export const isAction = (m: AppMilestone) => ACTION_TYPES.has(m.type);

/** Results and review releases: nothing for the author to do at that moment (the conference itself is neither). */
export const isAnnouncement = (m: AppMilestone) => !ACTION_TYPES.has(m.type) && m.type !== 'conference';

/** The Today card: the nearest deadline the author has to act on, else the nearest anything. */
export function pickHero(items: Upcoming[]): Upcoming | undefined {
  return items.find((i) => isAction(i.milestone)) ?? items[0];
}

/** Emphasise a list row's relative time: only for deadlines the author acts on, within about two days. */
export function isUrgent(item: Upcoming, now: number): boolean {
  if (!isAction(item.milestone)) return false;
  return dayDiff(item.target.date, beijingDate(now)) <= 1 || (item.target.precise && item.target.ms - now < 48 * HOUR);
}

export const BUCKETS = ['7 天内', '30 天内', '更晚'] as const;

export function bucketOf(item: Upcoming, now: number): 0 | 1 | 2 {
  const diff = dayDiff(item.target.date, beijingDate(now));
  return diff <= 7 ? 0 : diff <= 30 ? 1 : 2;
}

/** Right-hand relative text for an upcoming item; windows say whether they start ("7 天后") or end ("剩 8 天"). */
export function upcomingRelative(item: Upcoming, now: number): string {
  const rel = relativeText(item.target, now);
  const word = rel === '今天' || rel === '明天';
  if (item.phase === 'starts') return word ? `${rel}开始` : `${rel}后`;
  if (item.phase === 'ends') return word ? `${rel}结束` : `剩 ${rel}`;
  // A bare "41 天" is a countdown to act on; a result or a review release "41 天后" is just when it happens.
  if (!isAction(item.milestone) && !word) return `${rel}后`;
  return rel;
}

/**
 * A milestone by its key in links: the type ("paper"), or "type~i" for the
 * i-th of that type when an edition has several (KDD 2027's 第一轮 and 2 月轮
 * rebuttal, WACV's Round 1 and Round 2 正文). A plain type is the first one.
 */
export function milestoneOf(ed: AppEdition, key: string | undefined): AppMilestone | undefined {
  if (!key) return undefined;
  const [type, i] = key.split('~');
  return ed.milestones.filter((m) => m.type === type)[Number(i ?? 0)];
}

/** The key of a milestone for links: its type, with "~i" from the second of a type on. */
export function milestoneKey(ed: AppEdition, m: AppMilestone): string {
  const i = ed.milestones.filter((x) => x.type === m.type).indexOf(m);
  return i > 0 ? `${m.type}~${i}` : m.type;
}

// ---------- rules ----------

const LEAD_WORDS: Partial<Record<Answer, string[]>> = {
  not_allowed: ['不能', '不允许', '不可以'],
  allowed: ['可以', '允许'],
  required: ['必须'],
  not_required: ['不要求', '不需要', '不必'],
};

const INHERITED_PREFIX = /^[^。；]{0,60}?以下为[^。；：:]{0,24}?规则[：:]\s*/;

/**
 * The explanation under the big answer word: drops a leading "不能。" that only
 * repeats the answer, and the "2027 作者指南尚未公布，以下为 2026 规则：" style
 * prefix (the 沿用 tag says that instead).
 */
export function stripSummary(summary: string, answer: Answer): string {
  let s = summary.trim();
  for (let pass = 0; pass < 2; pass++) {
    s = s.replace(INHERITED_PREFIX, '');
    for (const w of LEAD_WORDS[answer] ?? []) {
      if (s.startsWith(`${w}。`)) {
        s = s.slice(w.length + 1).trimStart();
        break;
      }
    }
  }
  return s;
}

export interface MilestoneGroups {
  /** 截止前必须做到: until = this milestone, answer required or conditional. */
  mustBefore: AppRule[];
  /** 截止后就改不了: from = this milestone, answer not_allowed. */
  lockedAfter: AppRule[];
  /** 其他相关: every other rule that starts or ends at this milestone. */
  other: AppRule[];
}

export function groupRulesForMilestone(rules: AppRule[], type: string): MilestoneGroups {
  const mustBefore: AppRule[] = [];
  const lockedAfter: AppRule[] = [];
  const other: AppRule[] = [];
  for (const r of rules) {
    const from = r.applies?.from === type;
    const until = r.applies?.until === type;
    if (until && (r.answer === 'required' || r.answer === 'conditional')) mustBefore.push(r);
    else if (from && r.answer === 'not_allowed') lockedAfter.push(r);
    else if (from || until) other.push(r);
  }
  return { mustBefore, lockedAfter, other };
}

const LOCK_NOUN: Record<string, string> = {
  withdraw_private: '撤稿',
  author_membership: '作者名单',
  author_order: '作者顺序',
  title_abstract: '标题摘要',
  topics: '主题',
  submission_content: 'PDF',
  pdf: 'PDF',
  paper_content: '正文',
};

export const LOCK_VERB: Record<string, string> = {
  withdraw_private: '撤稿不公开',
  author_membership: '增删作者',
  author_order: '调作者顺序',
  title_abstract: '改标题摘要',
  topics: '改主题',
  submission_content: '改 PDF',
  pdf: '改 PDF',
  paper_content: '改正文',
};

function lockRules(rules: AppRule[], type: string): AppRule[] {
  const locks = rules.filter(
    (r) =>
      r.applies?.from === type &&
      r.effect?.kind === 'lock' &&
      !!r.effect.target &&
      (r.answer === 'not_allowed' || r.answer === 'conditional'),
  );
  return locks.sort((a, b) => Number(b.answer === 'not_allowed') - Number(a.answer === 'not_allowed'));
}

export const DISPUTED_TAG = '日期说法不一';

/**
 * At most one tag for a list row: "日期说法不一" when official pages give
 * different dates for the milestone itself, else what it locks ("锁作者名单",
 * "锁 PDF"). A contradictory rule attached to the milestone does not make its
 * date disputed.
 */
export function milestoneTag(rules: AppRule[], m: AppMilestone): string | undefined {
  if (m.disputed) return DISPUTED_TAG;
  const lock = lockRules(rules, m.type).find((r) => LOCK_NOUN[r.effect!.target!]);
  if (!lock) return undefined;
  const noun = LOCK_NOUN[lock.effect!.target!]!;
  return /^[A-Za-z]/.test(noun) ? `锁 ${noun}` : `锁${noun}`;
}

/**
 * What stops being possible once this milestone passes: "改 PDF", "撤稿不公开",
 * "一稿多投"… (at most `max`). Exclusivity rules only cover the same or a
 * substantially similar paper, so they read "一稿多投", never "投别的会".
 */
export function afterPhrases(rules: AppRule[], type: string, max = 3): string[] {
  const out: string[] = [];
  for (const r of lockRules(rules, type)) {
    const v = LOCK_VERB[r.effect!.target!];
    if (v && !out.includes(v)) out.push(v);
  }
  for (const r of rules)
    if (r.applies?.from === type && r.answer === 'not_allowed' && r.effect?.kind === 'exclusive' && !out.includes('一稿多投'))
      out.push('一稿多投');
  return out.slice(0, max);
}

interface Bound {
  ms?: number;
  day?: string;
  point?: string;
  name: string;
}

function bound(m: AppMilestone | undefined, type: string, t: ResolvedTime | undefined, now?: number): Bound {
  const name = m ? milestoneShort(m) : (MILESTONE_ZH[type] ?? type);
  if (!t || m?.status === 'tba') return { name };
  // An estimated day is only a day: "约 9/19", no weekday or minute.
  if (m?.status === 'estimated') return { ms: Date.parse(t.utc), day: `约 ${fmtDay(t, now)}`, point: `约 ${fmtDay(t, now)}`, name };
  return { ms: Date.parse(t.utc), day: fmtDay(t, now), point: fmtPoint(t, now), name };
}

const startBound = (m: AppMilestone | undefined, type: string, now?: number) => bound(m, type, m?.at_resolved ?? m?.start_resolved, now);
const endBound = (m: AppMilestone | undefined, type: string, now?: number) => bound(m, type, m?.at_resolved ?? m?.end_resolved, now);

const after = (name: string) => `${name}${/[A-Za-z]$/.test(name) ? ' ' : ''}后`;

/** "9/19–9/26"; two estimates share one 约: "约 9/19–9/26". */
const span = (a: string, b: string) => (a.startsWith('约 ') && b.startsWith('约 ') ? `${a}–${b.slice(2)}` : `${a}–${b}`);

/** Grey line under a rule row: "摘要截止后", "至 9/26 周六 19:59", "11/5–11/18". */
export function ruleTimeShort(rule: AppRule, ed: AppEdition, now?: number): string | undefined {
  const a = rule.applies;
  if (!a || (!a.from && !a.until)) return undefined;
  const fm = milestoneOf(ed, a.from);
  const um = milestoneOf(ed, a.until);
  if (a.from && a.from === a.until) return fm && fm.status !== 'tba' ? fmtMilestoneTime(fm, now) : undefined;
  const f = a.from ? startBound(fm, a.from, now) : undefined;
  const u = a.until ? endBound(um, a.until, now) : undefined;
  if (f && u) {
    if (f.day && u.day) return f.day === u.day ? `至 ${u.point}` : span(f.day, u.day);
    if (u.day) return `${after(f.name)}，至 ${u.day}`;
    return after(f.name);
  }
  if (f) return after(f.name);
  if (u) return u.point ? `至 ${u.point}` : `至${u.name}`;
  return undefined;
}

export type RuleState = 'active' | 'ended' | 'upcoming';

export function ruleState(rule: AppRule, ed: AppEdition, now: number): RuleState | undefined {
  const a = rule.applies;
  if (!a || (!a.from && !a.until)) return undefined;
  const f = a.from ? startBound(milestoneOf(ed, a.from), a.from) : undefined;
  const u = a.until ? endBound(milestoneOf(ed, a.until), a.until) : undefined;
  if (u?.ms !== undefined && now >= u.ms) return 'ended';
  if (f?.ms !== undefined && now < f.ms) return 'upcoming';
  if (f?.ms === undefined && u?.ms === undefined) return undefined;
  return 'active';
}

export const RULE_STATE_ZH: Record<RuleState, string> = { active: '生效中', ended: '已结束', upcoming: '未开始' };

/** One line for the rule sheet: "摘要截止后 · 9/19 周六 19:59 起", "9/19–11/18 · 从摘要截止到讨论期结束". */
export function ruleTimeLong(rule: AppRule, ed: AppEdition, now?: number): string | undefined {
  const a = rule.applies;
  if (!a || (!a.from && !a.until)) return undefined;
  const fm = milestoneOf(ed, a.from);
  const um = milestoneOf(ed, a.until);
  if (a.from && a.from === a.until && fm) return `${milestoneShort(fm)} · ${fmtMilestoneTime(fm, now)}`;
  // Standard names keep this to one line ("讨论期", not the venue's longer label).
  const std = (b: Bound, type: string): Bound => ({ ...b, name: MILESTONE_ZH[type] ?? b.name });
  const f = a.from ? std(startBound(fm, a.from, now), a.from) : undefined;
  const u = a.until ? std(endBound(um, a.until, now), a.until) : undefined;
  // "until" a window means until it ends.
  const untilName = u ? `${u.name}${um && !um.at_resolved && um.end_resolved ? '结束' : ''}` : '';
  if (f && u) {
    if (f.day && u.day && f.day === u.day) return `至${untilName} · ${u.point}`;
    if (f.day && u.day) return `${span(f.day, u.day)} · 从${f.name}到${untilName}`;
    return u.day ? `从${f.name}到${untilName}（${u.day}）` : `从${f.name}到${untilName}`;
  }
  if (f) return f.point ? `${after(f.name)} · ${f.point} 起` : after(f.name);
  if (u) return u.point ? `至${untilName} · ${u.point}` : `至${untilName}`;
  return undefined;
}

export interface PaperStatus {
  word: '已锁定' | '必须' | '还可以' | '有条件' | '注意' | '不能';
  tone: 'locked' | 'must' | 'open' | 'cond';
  line: string;
  /** Row label when it should differ from short_zh: locks name the action ("改 PDF"). */
  label?: string;
  sortKey: number;
}

const TONE_ORDER: Record<PaperStatus['tone'], number> = { must: 0, cond: 1, open: 2, locked: 3 };

/**
 * "现在的状态" for one rule on a paper, or null when it says nothing about
 * the paper right now:
 *   lock rules      还可以 · 至 <lock time>  → 已锁定 · 自<milestone>起
 *   quotas (cap)    注意 · 截至 <time> 核对篇数, while the count still matters
 *   required        必须 · 至 <until>
 *   conditional     有条件 · 至 <until> (never 还可以: the condition matters)
 *   allowed         还可以 · 至 <until>
 *   other not_allowed (e.g. 一稿多投) 不能 · 至 <until>, once started
 */
export function paperStatus(rule: AppRule, ed: AppEdition, now: number): PaperStatus | null {
  const a = rule.applies;
  if (!a) return null;
  const f = a.from ? startBound(milestoneOf(ed, a.from), a.from) : undefined;
  const u = a.until ? endBound(milestoneOf(ed, a.until), a.until) : undefined;
  const fromKnown = f?.ms !== undefined;
  const fromPassed = fromKnown && now >= f!.ms!;
  const fromAhead = fromKnown && now < f!.ms!;
  const untilAhead = u?.ms !== undefined && now < u.ms;
  const untilPassed = u?.ms !== undefined && now >= u.ms;
  if (untilPassed) return null;
  const kind = rule.effect?.kind;

  if (kind === 'lock' && ['not_allowed', 'conditional', 'contradictory'].includes(rule.answer)) {
    const label = LOCK_VERB[rule.effect?.target ?? ''];
    if (fromAhead) return { word: '还可以', tone: 'open', line: `至 ${f!.point}`, label, sortKey: f!.ms! };
    if (fromPassed && rule.answer !== 'contradictory')
      return { word: '已锁定', tone: 'locked', line: `自${f!.name}起`, label, sortKey: 4e15 + f!.ms! };
    return null;
  }
  if (kind === 'cap' && rule.answer !== 'required') {
    const due = untilAhead ? u! : fromAhead ? f! : undefined;
    return due ? { word: '注意', tone: 'cond', line: `截至 ${due.point} 核对篇数`, sortKey: due.ms! } : null;
  }
  if (rule.answer === 'not_allowed') {
    if (!fromPassed) return null;
    return { word: '不能', tone: 'locked', line: u?.point ? `至 ${u.point}` : `自${f!.name}起`, sortKey: 3e15 + (u?.ms ?? f!.ms!) };
  }
  if (!untilAhead) return null;
  const line = `至 ${u!.point}`;
  if (rule.answer === 'required') return { word: '必须', tone: 'must', line, sortKey: u!.ms! };
  if (fromAhead) return null;
  if (rule.answer === 'conditional') return { word: '有条件', tone: 'cond', line, sortKey: u!.ms! };
  if (rule.answer === 'allowed') return { word: '还可以', tone: 'open', line, sortKey: u!.ms! };
  return null;
}

export interface PaperRow {
  rule: AppRule;
  status: PaperStatus;
}

/**
 * All rows for a paper, soonest first (then 必须 before 有条件 before 还可以),
 * locked ones last. When one lock target is already locked, a later rule on
 * the same target ("定稿时增删作者") must not claim it is still open.
 */
export function paperRows(rules: AppRule[], ed: AppEdition, now: number): PaperRow[] {
  const rows = rules.flatMap((rule) => {
    const status = paperStatus(rule, ed, now);
    return status ? [{ rule, status }] : [];
  });
  const target = (r: PaperRow) => (r.rule.effect?.kind === 'lock' ? r.rule.effect.target : undefined);
  const locked = new Set(rows.filter((r) => r.status.word === '已锁定').map(target));
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      const t = target(r);
      if (!t) return true;
      if (r.status.word === '还可以' && locked.has(t)) return false;
      const key = `${t}:${r.status.word}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.status.sortKey - b.status.sortKey || TONE_ORDER[a.status.tone] - TONE_ORDER[b.status.tone]);
}

// ---------- readings (说法矛盾) ----------

export interface Reading {
  label?: string;
  body: string;
  /** Holds under every reading (common ground or a shared consequence), so it is listed after the real readings. */
  common: boolean;
}

/** "严格读法（注册截止前撤）：…" → label + body; items about "两种读法都…" or "一致" are common ground. */
export function splitReading(text: string): Reading {
  const i = text.indexOf('：');
  const label = i > 0 && i <= 40 ? text.slice(0, i) : undefined;
  const body = label ? text.slice(i + 1) : text;
  return { label, body, common: !!label && /都|一致/.test(label) };
}
