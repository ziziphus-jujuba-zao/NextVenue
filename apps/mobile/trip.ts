// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// After acceptance (docs/MOBILE_SPEC.md §10): when to ask "录用了吗？", the
// checklist of an accepted paper (出发前 / 在外 / 回国后), which step the
// "下一件事" card shows, the visa date, the venue's time difference, the
// school-approval date in Chinese working days, and the calendar file.
// Pure: no DOM, no storage, so all of it is unit-tested.

import { POST_ACCEPT } from '../../packages/core/src/types.ts';
import {
  holidayOn,
  isEstimated,
  isWorkday,
  weekdayOf,
  workCalendar,
  workdaysBefore,
  workdaysBetween,
  type WorkCalendar,
} from '../../packages/core/src/workday.ts';
import { beijingDate, dayDiff, fmtOfficial, md, targetOf, tzLabel, weekday, type Target } from './logic.ts';
import {
  isTba,
  type AppData,
  type AppEdition,
  type AppFeeTable,
  type AppHolidayYear,
  type AppMilestone,
  type AppRule,
  type AppSite,
  type AppTba,
  type AppVisa,
  type RegCategory,
  type ResolvedTime,
} from './types.ts';

// ---------- settings and the paper's trip state (stored on this phone only) ----------

export type Passport = 'cn_ordinary' | 'cn_official' | 'other';

/** 出行设置 (§10.7): the same for every trip. */
export interface TripSettings {
  passport: Passport;
  /** 需要学校审批. Off: the checklist has no 学校审批 step. */
  approval: boolean;
  /** 审批提前量, in Chinese working days. */
  leadDays: number;
  /** Which fee rows apply (学生 / 学术 / 工业). */
  identity: RegCategory;
  /** US consular post the user applies at (北京, 上海…); its wait comes first. */
  city?: string;
  /** 回国后报销期限, in days after return. */
  reimburseDays: number;
  /** Per visa file id: 已有有效签证, EVUS 已更新, 递签日期. */
  visas: Record<string, { have?: boolean; evus?: boolean; applied?: string }>;
}

export const DEFAULT_TRIP: TripSettings = {
  passport: 'cn_ordinary',
  approval: true,
  leadDays: 40,
  identity: 'student',
  reimburseDays: 30,
  visas: {},
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v: unknown): v is string => typeof v === 'string' && DATE.test(v);
const intIn = (v: unknown, lo: number, hi: number, dflt: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : dflt;

/** Stored settings with every field checked; anything odd falls back to the default. */
export function cleanTrip(v: unknown): TripSettings {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const visas: TripSettings['visas'] = {};
  if (o.visas && typeof o.visas === 'object')
    for (const [k, x] of Object.entries(o.visas as Record<string, unknown>)) {
      if (!x || typeof x !== 'object') continue;
      const s = x as Record<string, unknown>;
      visas[k] = { have: s.have === true || undefined, evus: s.evus === true || undefined, applied: isDay(s.applied) ? s.applied : undefined };
    }
  return {
    passport: o.passport === 'cn_official' || o.passport === 'other' ? o.passport : 'cn_ordinary',
    approval: o.approval !== false,
    leadDays: intIn(o.leadDays, 1, 200, DEFAULT_TRIP.leadDays),
    identity: o.identity === 'academic' || o.identity === 'industry' ? o.identity : 'student',
    city: typeof o.city === 'string' && o.city ? o.city : undefined,
    reimburseDays: intIn(o.reimburseDays, 1, 365, DEFAULT_TRIP.reimburseDays),
    visas,
  };
}

/** What an accepted paper keeps about its trip (a slice of the stored paper). */
export interface TripPaper {
  id: string;
  name: string;
  /** Edition it is submitted to (在投); the ask card watches its result. */
  current?: string;
  /** Marked accepted: at which edition, on which (Beijing) day. */
  accepted?: { edition: string; at: string };
  /** Who presents: me (default) or a co-author. */
  presenter?: 'me' | 'coauthor';
  /** Multi-site editions: the site asked for (会场意向) and the one assigned. */
  site?: string;
  assigned?: string;
  /** Departure (D) and return (R), when the user changed the defaults. */
  depart?: string;
  back?: string;
  /** Steps ticked off. Kept when the paper goes back to 审稿中, so marking it again restores them. */
  done?: string[];
  /** Optional steps the user said no to (资助 「不申请」): filed with the done ones, never ticked. */
  skip?: string[];
  /** 还没看到: no ask card until this instant (ms). */
  snooze?: number;
  /** What each step's date was when last exported to the calendar. */
  cal?: Record<string, string>;
}

// ---------- names ----------

/** A site's city in Chinese (data/cities.yml via the build), else as the data writes it. */
export const siteCity = (site: Pick<AppSite, 'city' | 'place'>) => site.place?.city ?? site.city;

/** A site's country or region in Chinese (中国香港), else its code. */
export const siteCountry = (site: Pick<AppSite, 'country_code' | 'place'>) => site.place?.country ?? site.country_code;

export const IDENTITY_ZH: Record<RegCategory, string> = { student: '学生', academic: '学术', industry: '工业' };

// ---------- days ----------

const DAY_MS = 86_400_000;

function dayNum(d: string): number {
  return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / DAY_MS;
}
const dayOf = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);

export const addDays = (d: string, n: number) => dayOf(dayNum(d) + n);

export function addMonths(d: string, n: number): string {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7)) - 1 + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const x = new Date(Date.UTC(y, m, Math.min(Number(d.slice(8, 10)), last)));
  return x.toISOString().slice(0, 10);
}

/** A Beijing calendar day as a deadline: the end of that day (23:59 Beijing). */
export function dayTime(d: string): ResolvedTime {
  return { local: d, tz: 'Asia/Shanghai', utc: new Date(Date.parse(`${d}T23:59:00+08:00`)).toISOString().replace('.000', ''), beijing: `${d} 23:59` };
}

const minDay = (a: string | undefined, b: string | undefined) => (!a ? b : !b ? a : a < b ? a : b);

/** The Chinese holiday a day falls in, as the card words it: "国庆假期". */
export function holidayText(day: string, cal: WorkCalendar): string | undefined {
  const h = holidayOn(day, cal);
  if (!h) return undefined;
  const name = h.name_zh === '劳动节' ? '五一' : h.name_zh.length > 2 ? h.name_zh.replace(/节$/, '') : h.name_zh;
  return `${name}假期${h.estimated ? '（预计）' : ''}`;
}

export function calendarOf(years: AppHolidayYear[]): WorkCalendar {
  return workCalendar(years);
}

// ---------- the edition, per site ----------

/** The milestone of `type` for a site: the site's own one first, then one for every site. */
export function siteMilestone(ed: AppEdition, type: string, site?: string): AppMilestone | undefined {
  const all = ed.milestones.filter((m) => m.type === type);
  return all.find((m) => site && m.site === site) ?? all.find((m) => !m.site) ?? (site ? undefined : all[0]);
}

/** The site this paper goes to: assigned, else the one asked for, else the first (multi-site editions only). */
export function siteOf(paper: Pick<TripPaper, 'site' | 'assigned'>, ed: AppEdition): AppSite | undefined {
  const sites = ed.sites ?? [];
  if (!sites.length) return undefined;
  return sites.find((s) => s.id === paper.assigned) ?? sites.find((s) => s.id === paper.site) ?? sites[0];
}

/** Conference days at the site (local dates), and whether they are an estimate. */
export function conferenceDays(ed: AppEdition, site?: string): { start: string; end: string; estimated: boolean; milestone?: AppMilestone } | undefined {
  const m = siteMilestone(ed, 'conference', site);
  if (m && m.status !== 'tba' && m.start_resolved && m.end_resolved)
    return { start: m.start_resolved.local.slice(0, 10), end: m.end_resolved.local.slice(0, 10), estimated: m.status === 'estimated', milestone: m };
  if (ed.dates) return { start: ed.dates.start, end: ed.dates.end, estimated: false };
  return undefined;
}

export function countryOf(ed: AppEdition, site?: AppSite): string | undefined {
  return site?.country_code ?? ed.place?.country_code;
}

export function cityOf(ed: AppEdition, site?: AppSite): string {
  return site ? siteCity(site) : (ed.place?.city ?? '');
}

// ---------- 录用了吗？ (§10.1) ----------

export interface AcceptPrompt {
  edition: AppEdition;
  milestone: AppMilestone;
  /** The official result day is over in the venue's own time zone ("已出结果"); before that it is the result day ("出结果日"). */
  over: boolean;
}

/** The result milestone the ask card watches. */
export const notificationOf = (ed: AppEdition) =>
  ed.milestones.find((m) => m.type === 'notification' && m.status !== 'tba' && (m.at_resolved ?? m.end_resolved));

/**
 * When the paper page asks "录用了吗？": the paper is 在投 somewhere, not yet
 * marked, the official result day has begun in the venue's time zone (AoE
 * 11/30 begins at 20:00 Beijing), 还没看到 is not holding it back, and the
 * conference is not over. The app never decides the result itself.
 */
export function acceptPrompt(paper: TripPaper, editions: AppEdition[], now: number): AcceptPrompt | null {
  if (paper.accepted || !paper.current) return null;
  const ed = editions.find((e) => e.id === paper.current);
  const m = ed && notificationOf(ed);
  if (!ed || !m) return null;
  const t = (m.at_resolved ?? m.end_resolved)!;
  const end = Date.parse(t.utc) + 60_000;
  const start = t.local.includes('T') ? Date.parse(t.utc) : end - DAY_MS;
  if (now < start) return null;
  if (paper.snooze && now < paper.snooze) return null;
  const confEnd = ed.milestones
    .filter((x) => x.type === 'conference' && x.end_resolved)
    .map((x) => Date.parse(x.end_resolved!.utc))
    .sort((a, b) => b - a)[0];
  if (confEnd !== undefined && now > confEnd) return null;
  return { edition: ed, milestone: m, over: now >= end };
}

// ---------- 分到哪？ (§10.1): multi-site editions after the assignment ----------

/** When the sites are assigned (NeurIPS 2026: 10/6 17:00 UTC = 10/7 01:00 Beijing). */
export function assignmentAt(ed: AppEdition): ResolvedTime | undefined {
  const m = siteMilestone(ed, 'site_assignment');
  return m && m.status !== 'tba' ? (m.at_resolved ?? m.end_resolved) : undefined;
}

/**
 * Once the organizer has announced where each paper goes, and until the user
 * says where this one went, the 下一件事 card asks "分到哪？" (the checklist
 * was worked out for the site asked for; the random allocation may differ).
 * Only for the user's own trip (not when a co-author presents).
 */
export function assignPrompt(paper: TripPaper, ed: AppEdition, now: number): ResolvedTime | null {
  if (!ed.sites?.length || paper.assigned || (paper.presenter ?? 'me') !== 'me' || paper.accepted?.edition !== ed.id) return null;
  const at = assignmentAt(ed);
  if (!at || Date.parse(at.utc) > now) return null;
  const end = conferenceDays(ed, siteOf(paper, ed)?.id)?.end;
  if (end && end < beijingDate(now)) return null;
  return at;
}

// ---------- time difference (§10.6) ----------

/** UTC offset of `tz` at an instant, in minutes east. */
export function offsetMinutes(tz: string, ms: number): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(ms).find((p) => p.type === 'timeZoneName')?.value ??
    'GMT';
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!m) return 0;
  const v = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === '-' ? -v : v;
}

function hoursText(min: number): string {
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} 小时 ${r} 分` : `${h} 小时`;
}

/** The venue's UTC offset (minutes east) through the days, in runs; `dst`: ahead of the zone's standard time. */
export function offsetParts(tz: string, start: string, end: string): { from: string; to: string; off: number; dst: boolean }[] {
  const year = Number(start.slice(0, 4));
  const std = Math.min(offsetMinutes(tz, Date.UTC(year, 0, 1, 12)), offsetMinutes(tz, Date.UTC(year, 6, 1, 12)));
  const parts: { from: string; to: string; off: number; dst: boolean }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const off = offsetMinutes(tz, Date.parse(`${d}T12:00:00Z`));
    const last = parts[parts.length - 1];
    if (last && last.off === off) last.to = d;
    else parts.push({ from: d, to: d, off, dst: off > std });
    if (parts.length > 3) break;
  }
  return parts;
}

/**
 * How far the venue's clock is from Beijing during the conference, with
 * daylight saving named: "比北京快 3 小时（当地夏令时）". A clock change
 * inside the days gives two parts: "10/24 比北京慢 6 小时（当地夏令时），
 * 10/25 起慢 7 小时". `local`: "当地比北京慢 15 小时" (the place block);
 * `dst: false` leaves daylight saving unnamed.
 */
export function tzOffsetText(tz: string, start: string, end: string, opts: { local?: boolean; dst?: boolean } = {}): string {
  const parts = offsetParts(tz, start, end);
  const one = (p: { off: number; dst: boolean }, short = false) => {
    const diff = p.off - 480;
    const dst = p.dst && opts.dst !== false ? '（当地夏令时）' : '';
    if (diff === 0) return `和北京同一时间${dst}`;
    const w = diff > 0 ? '快' : '慢';
    return `${short ? '' : `${opts.local ? '当地' : ''}比北京`}${w} ${hoursText(Math.abs(diff))}${dst}`;
  };
  if (parts.length === 1) return one(parts[0]!);
  return parts
    .map((p, i) => (i === 0 ? `${p.from === p.to ? md(p.from) : `${md(p.from)}–${md(p.to)}`} ${one(p)}` : `${md(p.from)} 起${one(p, true)}`))
    .join('，');
}

// ---------- visa (§10.6) ----------

export type VisaNeed = 'required' | 'visa_free' | 'not_needed' | 'unknown';

export interface Interview {
  id: string;
  name_zh: string;
  /** Earliest interview if booked today: max(today, as_of) + months × 30 days. */
  day: string;
  months: number;
  lt: boolean;
  /** Later than departure. */
  afterD: boolean;
}

export interface VisaPlan {
  cc?: string;
  /** "澳大利亚", "法国". */
  countryZh: string;
  regimeId?: string;
  regime?: AppVisa;
  need: VisaNeed;
  /** 建议最晚递交 (a Beijing day), when something official lets the app work it out. */
  applyBy?: string;
  /** Which side the date follows: the visa office's processing time, or the organizer's advice. */
  basis?: 'official' | 'organizer';
  /** "官方 35 天（含生物信息）+ 默认缓冲 3 周". */
  officialText?: string;
  officialDay?: string;
  /** "主办方建议出发前 6–8 周递交". */
  organizerText?: string;
  organizerDay?: string;
  /** Earliest day one may apply (Schengen: 6 months before), and the latest the office accepts. */
  earliest?: string;
  latest?: string;
  /** Appointment-wait visas (US): earliest interview per post, when booked today. */
  interviews?: Interview[];
  asOf?: string;
  /** NeurIPS 2026: apply by 10/20 to keep the visa refund. */
  refundApplyBy?: { milestone: AppMilestone; day: string };
}

const UNIT_ZH: Record<string, string> = { day: '天', workday: '个工作日', week: '周', month: '个月', business_day: '个工作日' };
const INCLUDES_ZH: Record<string, string> = { biometrics: '含生物信息' };

function minusSpan(d: string, n: number, unit: string): string {
  if (unit === 'week') return addDays(d, -7 * n);
  if (unit === 'month') return addMonths(d, -n);
  if (unit === 'workday' || unit === 'business_day') {
    let x = d;
    for (let left = n; left > 0; ) {
      x = addDays(x, -1);
      const w = weekdayOf(x);
      if (w !== 0 && w !== 6) left--;
    }
    return x;
  }
  return addDays(d, -n);
}

export function visaFor(visa: AppData['visa'], cc: string | undefined): { need: VisaNeed; regimeId?: string; regime?: AppVisa } {
  if (!cc) return { need: 'unknown' };
  const id = visa?.countries[cc];
  if (id === 'none') return { need: 'not_needed' };
  const regime = id ? visa?.regimes.find((r) => r.id === id) : undefined;
  if (!regime) return { need: 'unknown', regimeId: id };
  return { need: regime.requirement.answer, regimeId: id, regime };
}

/**
 * 建议最晚递交 for a destination (§10.6):
 *   processing-time visas (Canada, Schengen): D − official time − the app's
 *     default buffer (basis: assumption), never earlier than the first day
 *     one may apply;
 *   the organizer's own advice ("at least 6 to 8 weeks prior"): D − the
 *     longer figure; when both exist the earlier date wins and says whose;
 *   appointment-wait visas (US): no date; the earliest interview per post
 *     if booked today, and whether that is after D;
 *   nothing official: no date.
 */
export function visaApplyBy(
  visa: AppData['visa'],
  ed: AppEdition,
  D: string | undefined,
  now: number,
  opts: { cc?: string; site?: string; city?: string } = {},
): VisaPlan {
  const cc = opts.cc;
  const v = visaFor(visa, cc);
  const site = ed.sites?.find((x) => x.id === opts.site && x.country_code === cc);
  const name = site?.place?.country ?? (ed.place?.country_code === cc ? ed.place?.country : undefined);
  const plan: VisaPlan = { cc, countryZh: name ?? v.regime?.name_zh ?? '', ...v };
  const refund = siteMilestone(ed, 'visa_refund_apply_by', opts.site);
  if (refund && refund.status !== 'tba' && refund.at_resolved) plan.refundApplyBy = { milestone: refund, day: refund.at_resolved.local.slice(0, 10) };
  if (v.need !== 'required' || !D) return plan;
  const r = v.regime!;
  const lead = r.lead;
  if (lead?.kind === 'processing_time' && lead.official && lead.app_buffer) {
    const o = lead.official;
    const incl = (lead.includes ?? []).map((x) => INCLUDES_ZH[x.what]).filter(Boolean);
    plan.officialDay = addDays(minusSpan(D, o.value, o.unit), -7 * lead.app_buffer.weeks);
    const extra = [...incl, ...(o.max ? [`最长 ${o.max} ${UNIT_ZH[o.unit]}`] : [])];
    plan.officialText = `官方 ${o.value} ${UNIT_ZH[o.unit]}${extra.length ? `（${extra.join('，')}）+` : ' +'} 默认缓冲 ${lead.app_buffer.weeks} 周`;
    plan.asOf = lead.as_of?.date;
  }
  const g = ed.logistics?.visa_guidance?.find((x) => x.country_code === cc);
  if (g) {
    const [a, b] = Array.isArray(g.weeks) ? g.weeks : [g.weeks, g.weeks];
    plan.organizerDay = addDays(D, -7 * Math.max(a, b));
    plan.organizerText = `主办方建议出发前 ${a === b ? a : `${a}–${b}`} 周递交`;
  }
  const day = minDay(plan.officialDay, plan.organizerDay);
  if (day) {
    plan.applyBy = day;
    plan.basis = day === plan.officialDay ? 'official' : 'organizer';
  }
  if (r.window?.earliest) {
    plan.earliest = minusSpan(D, r.window.earliest.n, r.window.earliest.unit);
    if (plan.applyBy && plan.applyBy < plan.earliest) plan.applyBy = plan.earliest;
  }
  if (r.window?.latest) plan.latest = minusSpan(D, r.window.latest.n, r.window.latest.unit);
  if (lead?.kind === 'appointment_wait' && lead.posts?.length) {
    const today = beijingDate(now);
    const base = lead.as_of && lead.as_of.date > today ? lead.as_of.date : today;
    plan.asOf = lead.as_of?.date;
    const list = lead.posts.map((p) => {
      const d = addDays(base, Math.round(p.months * 30));
      return { id: p.id, name_zh: p.name_zh, day: d, months: p.months, lt: p.qualifier === 'lt', afterD: d > D };
    });
    // The user's own post first (出发城市), then the data's order.
    plan.interviews = [...list.filter((p) => p.id === opts.city), ...list.filter((p) => p.id !== opts.city)];
  }
  return plan;
}

// ---------- the checklist (§10.4) ----------

export type StepId =
  | 'site'
  | 'aid'
  | 'register'
  | 'approval'
  | 'passport'
  | 'visa'
  | 'hotel'
  | 'refund'
  | 'camera'
  | 'poster'
  | 'conference'
  | 'visarefund'
  | 'reimburse';

export const STEP_ORDER: StepId[] = [
  'site',
  'aid',
  'register',
  'approval',
  'passport',
  'visa',
  'hotel',
  'refund',
  'camera',
  'poster',
  'conference',
  'visarefund',
  'reimburse',
];

export const isStepId = (s: string): s is StepId => (STEP_ORDER as string[]).includes(s);

/**
 * One tag per row: 硬性 (an official deadline with consequences), 选做 (an
 * official deadline for something optional, e.g. 资助申请), 建议 (a date this
 * app works out from official data and its own buffer), 按设置 (a date taken
 * straight from your own number in 出行设置: 学校审批, 报销), 预计 (it relies
 * on something not yet published, e.g. next year's holidays), 待公布.
 */
export type StepTag = 'hard' | 'optional' | 'advice' | 'settings' | 'estimated' | 'tba' | 'none';

export const TAG_ZH: Record<StepTag, string> = { hard: '硬性', optional: '选做', advice: '建议', settings: '按设置', estimated: '预计', tba: '待公布', none: '' };

export type StepGroup = 'before' | 'away' | 'after';

export const GROUP_ZH: Record<StepGroup, string> = { before: '出发前', away: '在外', after: '回国后' };

export interface Step {
  id: StepId;
  group: StepGroup;
  /** Row name: "会场意向表". */
  name: string;
  /** What to do, for the card and 下一步: "确认会场意向表". */
  action: string;
  /** After the name: the country or city ("递交签证 · 澳大利亚"). */
  suffix?: string;
  tag: StepTag;
  /** When: an official time (shown in Beijing time when the venue gave one) or a Beijing day the app worked out. */
  at?: ResolvedTime;
  /** The conference: local days. */
  range?: { start: string; end: string };
  target?: Target;
  /** Instead of a date: 注册后, 待公布, 等会期公布后自动算, 尽早预约… */
  text?: string;
  /** A small extra line: "10/7 01:00 公布分配", "注册后才能开签证邀请函". */
  note?: string;
  /** A red line: 来不及, 面签在出发之后. */
  alert?: string;
  /** 怎么算的 (advice and estimated dates). */
  how: string[];
  milestone?: AppMilestone;
  rules: AppRule[];
  /** Where the task itself is done (the registration page, the aid form), and the button's words ("去注册 ↗"). */
  link?: string;
  linkLabel?: string;
  /** The official sentence behind the step (text-fragment link): 「查看官网原句 ↗」 when there is no `link`. */
  src?: string;
  done: boolean;
  /** Said no to (optional steps): counted as done, shown as 不申请. */
  skipped?: boolean;
  /** No longer actionable, and not late either (会场意向表 once the sites are assigned). */
  closed?: boolean;
  /** 学校审批: Chinese working days left until its day ("7 个工作日" instead of "17 天"). */
  workdays?: number;
  /** Ticked off by a setting rather than by hand (已有有效签证). */
  auto?: string;
  past: boolean;
  /** An official deadline passed and the step is not done. */
  overdue: boolean;
  /** Only matters if something happens (cancel, visa refused): never 下一件事, never overdue. */
  conditional: boolean;
  /** Optional (资助): never overdue. */
  optional: boolean;
  /** Only information (免签): never 下一件事. */
  info?: boolean;
  estimated: boolean;
  /** Sorts right after this step (办因公护照 after 学校审批). */
  anchor?: StepId;
}

export interface Trip {
  edition: AppEdition;
  site?: AppSite;
  /** Departure and return (D, R): the user's, else the day before / after the conference. */
  D?: string;
  R?: string;
  Dset: boolean;
  Rset: boolean;
  days?: { start: string; end: string; estimated: boolean; milestone?: AppMilestone };
  visa: VisaPlan;
  steps: Step[];
  presenter: 'me' | 'coauthor';
}

const kindOf = (type: string) => POST_ACCEPT[type as keyof typeof POST_ACCEPT]?.kind;

/** Rules of the edition tied to a step. */
function stepRules(id: StepId, rules: AppRule[]): AppRule[] {
  const at = (r: AppRule, ...types: string[]) => types.includes(r.applies?.from ?? '') || types.includes(r.applies?.until ?? '');
  const e = (r: AppRule) => r.effect ?? { kind: '' };
  switch (id) {
    case 'site':
      // What the assignment locks first (the card's consequence line), then how the form works.
      return [
        ...rules.filter((r) => at(r, 'site_preference', 'site_assignment') && r.family === 'presentation' && e(r).kind === 'lock'),
        ...rules.filter((r) => r.applies?.until === 'site_preference' && r.family === 'presentation' && !e(r).kind),
      ];
    case 'aid':
      return rules.filter((r) => e(r).kind === 'hold' || at(r, 'financial_aid', 'financial_aid_result'));
    case 'register':
      // What makes registering a must comes first, then the timing rules (资助结果前注册), the
      // visa letter (it needs a paid registration) and the refund on cancelling.
      return [
        ...rules.filter((r) => r.family === 'presentation' && e(r).kind === 'requires'),
        ...rules.filter((r) => e(r).kind === 'hold' || (r.family === 'registration' && e(r).kind !== 'requires')),
        ...rules.filter((r) => e(r).kind === 'requires' && (e(r).before === 'visa_letter' || e(r).target === 'paid_registration')),
        ...rules.filter((r) => e(r).kind === 'refund' && e(r).trigger === 'cancel'),
      ];
    case 'visa':
      // Visa refund first, then what to do if the visa is late (代讲 / 线上).
      return [
        ...rules.filter((r) => (e(r).kind === 'refund' && e(r).trigger !== 'cancel') || (r.family === 'refund' && !e(r).kind && /拒签|签证/.test(r.question_zh))),
        ...rules.filter((r) => e(r).kind === 'fallback'),
      ];
    case 'refund':
      return rules.filter((r) => e(r).kind === 'refund' && e(r).trigger === 'cancel');
    case 'visarefund':
      return rules.filter((r) => e(r).kind === 'refund' && e(r).trigger !== 'cancel');
    case 'camera':
      return rules.filter((r) => at(r, 'camera_ready') && r.family !== 'refund' && r.family !== 'registration');
    case 'poster':
      return rules.filter((r) => at(r, 'poster'));
    case 'conference':
      return rules.filter((r) => r.family === 'presentation');
    default:
      return [];
  }
}

/** Short row name from a venue label: "退款申请截止（每笔扣 $100 手续费）" → "退款申请截止". */
const bare = (s: string) => s.replace(/（[^）]*）|\([^)]*\)/g, '').trim();

function linkOf(ed: AppEdition, kind: string, site?: string): string | undefined {
  const ls = ed.logistics?.links ?? [];
  return (ls.find((l) => l.kind === kind && l.site === site) ?? ls.find((l) => l.kind === kind && !l.site))?.url;
}

/** "10/7 01:00": a short time for notes (Beijing when timed). */
export function shortTime(t: ResolvedTime): string {
  return t.local.includes('T') ? `${md(t.beijing)} ${t.beijing.slice(11, 16)}` : md(t.local);
}

/** Working-day back-calculation for 学校审批, with what it walked over. */
export interface Approval {
  day: string;
  estimated: boolean;
  /** Working days from today to `day` (negative: too late). */
  left: number;
  how: string[];
}

export function approvalDate(D: string, n: number, cal: WorkCalendar, now: number): Approval {
  const r = workdaysBefore(D, n, cal);
  const today = beijingDate(now);
  const left = workdaysBetween(today, r.date, cal);
  const how = [`${md(D)} 出发，往前数 ${n} 个工作日是 ${md(r.date)} ${weekday(r.date)}。`];
  // Holidays and make-up working days from today (or the date, if earlier) to departure, in order.
  const seen = new Set<string>();
  const notes: string[] = [];
  const from = today < r.date ? addDays(today, 1) : r.date;
  for (let d = from; d <= D; d = addDays(d, 1)) {
    const h = holidayOn(d, cal);
    if (h && !seen.has(h.name_zh + d.slice(0, 4))) {
      seen.add(h.name_zh + d.slice(0, 4));
      let b = d;
      let e = d;
      while (holidayOn(addDays(b, -1), cal)?.name_zh === h.name_zh) b = addDays(b, -1);
      while (holidayOn(addDays(e, 1), cal)?.name_zh === h.name_zh) e = addDays(e, 1);
      notes.push(`${md(b)}–${md(e)} ${h.name_zh}放假${h.estimated ? '（预计）' : ''}`);
    }
    const w = weekdayOf(d);
    if ((w === 0 || w === 6) && isWorkday(d, cal)) notes.push(`${md(d)} ${weekday(d)}调休上班`);
  }
  if (notes.length) how.push(`${notes.join('，')}。`);
  how.push(left.count >= 0 ? `今天起到 ${md(r.date)} 还剩 ${left.count} 个工作日。` : `已经过了 ${-left.count} 个工作日。`);
  if (r.estimated) {
    const years = [...new Set([r.date, D].map((d) => d.slice(0, 4)))].filter((y) => isEstimated(`${y}-01-01`, cal));
    how.push(`${years.join('、')} 年放假安排还没公布，按放假办法和农历估算，不算调休上班日，所以日期偏早（预计）。`);
  }
  return { day: r.date, estimated: r.estimated, left: left.count, how };
}

/**
 * The crunch of a multi-site edition before its assignment (§10.4): the site
 * is announced at `at`, and only `left` working days remain after it until
 * the approval day (NeurIPS 2026: 10/7 01:00, then 10/8, 10/9, 10/10 调休,
 * 10/12 = 4). Undefined once the sites are out or when nothing is squeezed.
 */
export function approvalAfterAssignment(ed: AppEdition, paper: Pick<TripPaper, 'assigned'>, day: string, cal: WorkCalendar, now: number): { at: ResolvedTime; left: number } | undefined {
  const at = assignmentAt(ed);
  if (!ed.sites?.length || paper.assigned || !at || Date.parse(at.utc) <= now) return undefined;
  const from = at.beijing.slice(0, 10);
  if (from >= day) return undefined;
  return { at, left: workdaysBetween(from, day, cal).count };
}

/**
 * 学校审批 at the other sites of a multi-site edition, while the paper is
 * unassigned: "分到亚特兰大、巴黎：10/13 周二" (their conference starts later).
 * Sites that share a day are grouped; the paper's own site is left out.
 */
export function approvalAtOtherSites(paper: TripPaper, ed: AppEdition, settings: TripSettings, cal: WorkCalendar, now: number): { cities: string[]; day: string; estimated: boolean }[] {
  const mine = siteOf(paper, ed);
  if (!ed.sites?.length || paper.assigned || paper.depart || !settings.approval) return [];
  const own = conferenceDays(ed, mine?.id);
  const ownDay = own ? approvalDate(addDays(own.start, -1), settings.leadDays, cal, now).day : undefined;
  const out: { cities: string[]; day: string; estimated: boolean }[] = [];
  for (const s of ed.sites) {
    if (s.id === mine?.id) continue;
    const d = conferenceDays(ed, s.id);
    if (!d) continue;
    const a = approvalDate(addDays(d.start, -1), settings.leadDays, cal, now);
    if (a.day === ownDay) continue;
    const same = out.find((x) => x.day === a.day);
    if (same) same.cities.push(siteCity(s));
    else out.push({ cities: [siteCity(s)], day: a.day, estimated: a.estimated });
  }
  return out;
}

/**
 * The checklist of an accepted paper (§10.4): the steps the edition has,
 * with dates, one tag each, and groups (出发前 / 在外 / 回国后). Steps the
 * venue does not have are left out; steps it has but has not dated say 待公布.
 * Dates the app works out (学校审批, 递交签证, 报销) never pass as official.
 */
export function tripSteps(
  paper: TripPaper,
  ed: AppEdition,
  rules: AppRule[],
  visa: AppData['visa'],
  settings: TripSettings,
  cal: WorkCalendar,
  now: number,
): Trip {
  const site = siteOf(paper, ed);
  const sid = site?.id;
  const days = conferenceDays(ed, sid);
  const D = paper.depart ?? (days ? addDays(days.start, -1) : undefined);
  const R = paper.back ?? (days ? addDays(days.end, 1) : undefined);
  const cc = countryOf(ed, site);
  const plan = visaApplyBy(visa, ed, D, now, { cc, site: sid, city: settings.city });
  const presenter = paper.presenter ?? 'me';
  const done = new Set(paper.done ?? []);
  const skip = new Set(paper.skip ?? []);
  const vstate = (plan.regimeId && settings.visas[plan.regimeId]) || {};
  const haveVisa = !!vstate.have && plan.need === 'required';
  const steps: Step[] = [];
  const ms = (type: string) => siteMilestone(ed, type, sid);

  const add = (s: Omit<Step, 'done' | 'past' | 'overdue' | 'rules' | 'how' | 'conditional' | 'optional' | 'estimated'> & Partial<Step>) => {
    const target = s.target ?? (s.at ? targetOf(s.at) : undefined);
    const auto = s.auto;
    const skipped = !done.has(s.id) && !auto && skip.has(s.id) && !!s.optional;
    const isDone = done.has(s.id) || !!auto || skipped;
    const past = !!target && target.ms <= now;
    const step: Step = {
      rules: stepRules(s.id, rules),
      how: [],
      conditional: false,
      optional: false,
      estimated: false,
      ...s,
      target,
      done: isDone,
      skipped: skipped || undefined,
      past,
      overdue: false,
    };
    step.overdue = step.tag === 'hard' && past && !isDone && !step.conditional && !step.optional && !step.closed;
    steps.push(step);
    return step;
  };

  /** A step dated by an official milestone: its time, 硬性 (选做 when optional, or 待公布). */
  const official = (id: StepId, type: string, name: string, action: string, group: StepGroup, extra: Partial<Step> = {}) => {
    const m = ms(type);
    if (!m) return undefined;
    const at = m.status === 'tba' ? undefined : (m.at_resolved ?? m.end_resolved);
    const hard = kindOf(type) === 'hard' ? (extra.optional ? 'optional' : 'hard') : 'advice';
    const tag: StepTag = m.status === 'tba' ? 'tba' : m.status === 'estimated' ? 'estimated' : hard;
    return add({ id, group, name, action, tag, at, text: at ? undefined : '待公布', milestone: m, src: m.deep_link, ...extra });
  };

  // The price deadline to plan registration by: the early-bird one, or once it has passed
  // (an abstract-only meeting's early rate often closes before its results: AACR 12/7, results
  // 12/21) the next price step still ahead (AACR's 2/12 advance rate).
  const priceSteps = ['early_registration', 'standard_registration']
    .map((t) => ms(t))
    .filter((m): m is AppMilestone => !!m && m.status !== 'tba' && !!m.at_resolved);
  const early = priceSteps.find((m) => Date.parse(m.at_resolved!.utc) > now) ?? ms('early_registration');
  const earlyAt = early && early.status !== 'tba' ? early.at_resolved : undefined;
  const authorReg = ms('author_registration');
  const regLink = linkOf(ed, 'registration', sid);
  const reg = regLink ? { link: regLink, linkLabel: '去注册 ↗' } : {};
  const assignAt = assignmentAt(ed);
  const assignOut = !!assignAt && Date.parse(assignAt.utc) <= now;
  const needVisa = (plan.need === 'required' || plan.need === 'unknown') && !haveVisa;
  // NeurIPS: apply for the visa by 10/20 to keep the visa refund; the letter needs a paid registration first.
  const refundBy = plan.need === 'required' && !haveVisa ? plan.refundApplyBy?.day : undefined;

  /**
   * 作者注册: the official deadline if there is one; else the earliest of the
   * early-bird price, the visa date and (NeurIPS) the visa-refund condition,
   * since the letter needs a paid registration. A multi-site edition before
   * the assignment says to register at the site assigned (the reserved seat
   * is tied to it); otherwise the second line is the visa letter.
   */
  const register = (name: string, action: string, withVisa: boolean) => {
    const note =
      withVisa && ed.sites?.length && !paper.assigned && assignAt
        ? `${md(assignAt.beijing)} 分配后，按分到的会场注册`
        : withVisa && needVisa
          ? '注册后才能开签证邀请函'
          : undefined;
    if (authorReg && authorReg.status !== 'tba' && authorReg.at_resolved)
      return official('register', 'author_registration', name, action, 'before', { ...reg, note });
    const visaDay = withVisa && plan.need === 'required' && !haveVisa ? minDay(plan.applyBy, refundBy) : undefined;
    const earlyDay = earlyAt ? (earlyAt.local.includes('T') ? earlyAt.beijing.slice(0, 10) : earlyAt.local) : undefined;
    const open = ms('registration_open');
    const openAt = open && open.status !== 'tba' ? open.at_resolved : undefined;
    const opens = openAt && Date.parse(openAt.utc) > now ? [`${shortTime(openAt)} 起可注册。`] : [];
    const earlyHow = earlyAt ? [`优惠价 ${shortTime(earlyAt)} 截止（北京时间），过了只是价格变高。`] : [];
    if (visaDay && (!earlyDay || visaDay < earlyDay)) {
      const why =
        visaDay === plan.applyBy
          ? `邀请函要先付费注册，所以不晚于递交签证的建议日 ${md(visaDay)}。`
          : `${md(visaDay)} 前递签才保留拒签退差价的资格，邀请函要先注册。`;
      return add({ id: 'register', group: 'before', name, action, tag: 'advice', at: dayTime(visaDay), ...reg, note, how: [why, ...earlyHow, ...opens] });
    }
    if (early && earlyAt)
      return add({
        id: 'register',
        group: 'before',
        name,
        action,
        tag: 'advice',
        at: earlyAt,
        milestone: early,
        ...(regLink ? reg : { src: early.deep_link }),
        note,
        how: [`作者注册截止${authorReg ? '还没公布' : '官方没写'}，先按优惠价截止排；过了只是价格变高。`, ...opens],
      });
    return add({
      id: 'register',
      group: 'before',
      name,
      action,
      tag: authorReg ? 'tba' : 'none',
      text: authorReg ? '待公布' : '尽早',
      milestone: authorReg,
      ...reg,
      note,
      how: opens,
    });
  };

  if (presenter === 'coauthor') {
    official('camera', 'camera_ready', '提交终稿', '提交终稿', 'before');
    const c = register('确认合作者已注册', '确认合作者已注册', false);
    if (c?.link) c.linkLabel = '看注册页 ↗';
    const r = official('refund', 'refund_cutoff', '全额退款截止', '全额退款截止', 'before', { conditional: true });
    if (r?.milestone?.label_zh) r.name = r.action = bare(r.milestone.label_zh);
  } else {
    // 会场意向 (multi-site editions): the organizers mailed the form to the authors; this
    // step is to check it before its deadline. The assignment goes in a line under it; once
    // it is out, the form can no longer be acted on (closed, never late), and marking where
    // the paper went (分到哪) ticks it.
    if (ed.sites?.length) {
      const form = stepRules('site', rules).find((r) => r.applies?.until === 'site_preference');
      official('site', 'site_preference', '会场意向表', '确认会场意向表', 'before', {
        note: assignAt ? (assignOut ? undefined : `${shortTime(assignAt)} 公布分配`) : ms('site_assignment') ? '分配日期待公布' : undefined,
        ...(form?.quotes[0] ? { src: form.quotes[0].deep_link } : {}),
        auto: paper.assigned && site ? `分配到${siteCity(site)}` : undefined,
        closed: assignOut || undefined,
      });
    }
    // 资助 / 志愿者 (when the venue runs one).
    const aidM = ms('financial_aid');
    if (aidM) {
      const label = aidM.label_zh ?? '';
      const nm = /资助|Financial/.test(label) || !/志愿者/.test(label) ? '资助申请' : '志愿者申请';
      const res = ms('financial_aid_result');
      const resAt = res && res.status !== 'tba' ? res.at_resolved : undefined;
      const aids = Array.isArray(ed.logistics?.aid) ? ed.logistics.aid : [];
      official('aid', 'financial_aid', nm, `提交${nm}`, 'before', {
        optional: true,
        ...(aids[0]?.url ? { link: aids[0].url, linkLabel: '去申请 ↗' } : {}),
        note: resAt ? `${shortTime(resAt)} 前公布结果` : res ? '结果日期待公布' : undefined,
      });
    }
    // 作者注册; the visa letter is its second line (it needs a paid registration) and its sheet.
    register('作者注册', '完成作者注册', true);
    // 学校审批: D minus N Chinese working days.
    if (settings.approval) {
      if (D) {
        const a = approvalDate(D, settings.leadDays, cal, now);
        // D minus your own N from 出行设置: 按设置 (预计 when next year's holidays are a guess).
        add({
          id: 'approval',
          group: 'before',
          name: '学校审批',
          action: '提交学校审批',
          tag: a.estimated || days?.estimated ? 'estimated' : 'settings',
          at: dayTime(a.day),
          how: a.how,
          estimated: a.estimated,
          workdays: a.left >= 0 ? a.left : undefined,
          alert: a.left < 0 && !done.has('approval') ? '来不及' : undefined,
        });
      } else add({ id: 'approval', group: 'before', name: '学校审批', action: '提交学校审批', tag: 'none', text: '等会期公布后自动算' });
      if (settings.passport === 'cn_official')
        add({ id: 'passport', group: 'before', name: '办因公护照', action: '办因公护照', tag: 'none', text: '批件下来后', anchor: 'approval' });
    }
    // 递交签证.
    if (plan.need !== 'not_needed') {
      const nm = settings.passport === 'cn_official' ? '经外办办签证' : '递交签证';
      const base = { id: 'visa' as const, group: 'before' as const, name: nm, action: nm, suffix: plan.countryZh || undefined, auto: haveVisa ? '已有有效签证' : undefined };
      const anchor = settings.passport === 'cn_official' && settings.approval ? ({ anchor: 'passport' } as const) : {};
      if (plan.need === 'visa_free') add({ ...base, tag: 'none', text: '免签', auto: undefined, info: true });
      else if (plan.need === 'unknown') add({ ...base, tag: 'none', text: '未收录', link: linkOf(ed, 'visa') });
      else if (settings.passport === 'other') add({ ...base, tag: 'none', text: '看官方链接' });
      else if (plan.applyBy)
        add({
          ...base,
          ...anchor,
          tag: 'advice',
          at: dayTime(plan.applyBy),
          how: [
            ...(plan.officialText && plan.officialDay ? [`${plan.officialText}：${md(plan.officialDay)}。`] : []),
            ...(plan.organizerText && plan.organizerDay ? [`${plan.organizerText}：${md(plan.organizerDay)}。`] : []),
            ...(plan.officialDay && plan.organizerDay ? [`取更早的日期（按${plan.basis === 'official' ? '签证官方处理时间' : '主办方建议'}）。`] : []),
            `出发日按 ${md(D!)}${paper.depart ? '（你填的）' : '（会议前一天）'}算。`,
          ],
        });
      else if (plan.interviews?.length) {
        // Appointment visas (US): nothing to work back from, so book now; where the venue ties
        // the visa refund to an application date (NeurIPS: 10/20), that date is the one to keep.
        const first = plan.interviews[0]!;
        const interview = `现在约，${first.name_zh}最早约 ${md(first.day)} 面签`;
        const alert = first.afterD && !haveVisa ? '面签在出发之后' : undefined;
        if (refundBy)
          add({
            ...base,
            ...anchor,
            tag: 'advice',
            at: dayTime(refundBy),
            note: `尽早预约 · ${interview}`,
            alert,
            how: [`${md(refundBy)} 前递签才保留拒签退差价的资格（主办方条款）。`, '美国签证按面签预约排队，本应用不倒推递交日：尽早预约。'],
          });
        else add({ ...base, ...anchor, tag: 'none', text: '尽早预约', note: interview, alert });
      } else add({ ...base, ...anchor, tag: 'none', text: D ? '尽早递交' : '等会期公布后再看' });
    }
    // 机票和酒店: the earliest group-rate cutoff.
    const hotels = ed.logistics?.hotels;
    if (Array.isArray(hotels) && hotels.length) {
      const h = [...hotels].sort((a, b) => a.cutoff.localeCompare(b.cutoff))[0]!;
      add({
        id: 'hotel',
        group: 'before',
        name: '机票和酒店',
        action: '订机票和协议酒店',
        tag: 'advice',
        at: dayTime(h.cutoff),
        note: `${h.name} 协议价截止`,
        link: linkOf(ed, 'hotels', sid) ?? h.link,
        linkLabel: '去订酒店 ↗',
        how: [`协议酒店里最早的一家 ${md(h.cutoff)} 截止（官网日期），过了按市场价。`],
      });
    }
    const refund = official('refund', 'refund_cutoff', '全额退款截止', '全额退款截止', 'before', { conditional: true });
    if (refund?.milestone?.label_zh) refund.name = refund.action = bare(refund.milestone.label_zh);
    official('camera', 'camera_ready', '提交终稿', '提交终稿', 'before');
    official('poster', 'poster', '海报', '提交海报', 'before');
  }

  // 开会 (the site chosen or assigned); a co-author's trip is not the user's.
  if (presenter === 'coauthor') {
    /* only 终稿, 确认合作者已注册 and 退款 (§10.9) */
  } else if (days) {
    const start = days.milestone?.start_resolved ?? dayTime(days.start);
    const end = days.milestone?.end_resolved;
    const t = targetOf(start);
    add({
      id: 'conference',
      group: 'away',
      name: '开会',
      action: '开会',
      suffix: cityOf(ed, site) || undefined,
      tag: days.estimated ? 'estimated' : 'none',
      range: { start: days.start, end: days.end },
      target: { ...t, ms: Date.parse(start.utc) - 86_340_000 },
      milestone: days.milestone,
      auto: end && Date.parse(end.utc) < now ? '会议已结束' : undefined,
    });
  } else {
    const c = ms('conference');
    if (c && presenter === 'me') add({ id: 'conference', group: 'away', name: '开会', action: '开会', suffix: cityOf(ed, site) || undefined, tag: 'tba', text: '待公布', milestone: c });
  }

  if (presenter === 'me') {
    official('visarefund', 'visa_refund_request_by', '拒签退款申请', '申请拒签退款', 'after', { conditional: true });
    if (R)
      add({
        id: 'reimburse',
        group: 'after',
        name: '报销',
        action: '报销和回国手续',
        tag: 'settings',
        at: dayTime(addDays(R, settings.reimburseDays)),
        how: [`${md(R)} 回国${paper.back ? '（你填的）' : '（会议结束后一天）'}，加出行设置里的 ${settings.reimburseDays} 天。`],
      });
  }

  return { edition: ed, site, D, R, Dset: !!paper.depart, Rset: !!paper.back, days, visa: plan, steps: sortSteps(steps), presenter };
}

/** In each group: by date, ties in the usual order; a step anchored to another follows it; undated steps last. */
export function sortSteps(steps: Step[]): Step[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const key = (s: Step, depth = 0): number => {
    const a = s.anchor && depth < 4 ? byId.get(s.anchor) : undefined;
    if (a) return key(a, depth + 1);
    return s.target?.ms ?? Number.POSITIVE_INFINITY;
  };
  const groups: StepGroup[] = ['before', 'away', 'after'];
  return [...steps].sort(
    (a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || key(a) - key(b) || STEP_ORDER.indexOf(a.id) - STEP_ORDER.indexOf(b.id),
  );
}

// ---------- the 下一件事 card (§10.3) ----------

export type NextThing = { step: Step; overdue: boolean } | { waiting: Step[] } | { allDone: true; conference?: Step };

/**
 * Which step the card shows (§10.3):
 *   1. an official deadline that passed with the step not done (red "已过 N 天");
 *   then, 出发前 first and 回国后 only once 出发前 is clear:
 *   2. among the steps still to do and still ahead, the earliest day, whatever
 *      its tag (硬性, 建议, 按设置, 预计); on the same day a 硬性 deadline wins;
 *   3. a worked-out date that passed with the step not done;
 *   4. a step with no date that still needs doing (美签 "尽早预约");
 *   5. an optional step (资助申请, 志愿者申请): only once nothing else is left;
 *   6. only 待公布 left: waiting for the venue.
 * Nothing left: "都办完了". Steps that only matter if something happens
 * (退款), information rows (免签), a closed step (会场意向表 after the
 * assignment) and the conference itself never lead.
 */
export function nextStep(steps: Step[], now: number): NextThing {
  const open = steps.filter((s) => !s.done && s.id !== 'conference' && !s.conditional && !s.info && !s.closed);
  const byTime = (a: Step, b: Step) => a.target!.ms - b.target!.ms;
  const lead = (a: Step, b: Step) =>
    a.target!.date.localeCompare(b.target!.date) ||
    Number(b.tag === 'hard') - Number(a.tag === 'hard') ||
    byTime(a, b) ||
    STEP_ORDER.indexOf(a.id) - STEP_ORDER.indexOf(b.id);
  const overdue = open.filter((s) => s.overdue && s.target).sort(byTime)[0];
  if (overdue) return { step: overdue, overdue: true };
  for (const pool of [open.filter((s) => s.group === 'before'), open.filter((s) => s.group !== 'before')]) {
    const ahead = pool.filter((s) => s.target && s.target.ms > now && s.tag !== 'tba' && s.tag !== 'none');
    const pick = ahead.filter((s) => !s.optional).sort(lead)[0];
    if (pick) return { step: pick, overdue: false };
    const late = pool.filter((s) => s.target && s.past && !s.optional && s.tag !== 'tba').sort(byTime)[0];
    if (late) return { step: late, overdue: true };
    const undated = pool.find((s) => !s.target && s.tag !== 'tba' && !s.optional);
    if (undated) return { step: undated, overdue: false };
    const optional = ahead.filter((s) => s.optional).sort(lead)[0];
    if (optional) return { step: optional, overdue: false };
    const waiting = pool.filter((s) => s.tag === 'tba');
    if (waiting.length) return { waiting };
  }
  return { allDone: true, conference: steps.find((s) => s.id === 'conference') };
}

// ---------- how a step's date reads ----------

/** "10/1 周四 19:59", "10/10 周六", "2027/1/12" (another year: the year, no weekday), "12/6–12/12". */
export function stepWhen(s: Step, now: number): string {
  const year = beijingDate(now).slice(0, 4);
  if (s.range) {
    const y = s.range.start.slice(0, 4) !== year ? `${s.range.start.slice(0, 4)}/` : '';
    return `${y}${md(s.range.start)}–${md(s.range.end)}`;
  }
  if (!s.at) return s.text ?? '';
  const timed = s.at.local.includes('T');
  const day = timed ? s.at.beijing.slice(0, 10) : s.at.local.slice(0, 10);
  const other = day.slice(0, 4) !== year;
  const d = other ? `${day.slice(0, 4)}/${md(day)}` : `${md(day)} ${weekday(day)}`;
  return timed ? `${d} ${s.at.beijing.slice(11, 16)}` : d;
}

/** Right-hand text of a row: "6 天", "明天", "已过 3 天", "7 个工作日" (学校审批), or nothing for undated steps. */
export function stepRelative(s: Step, now: number): string {
  if (!s.target) return '';
  const today = beijingDate(now);
  const diff = dayDiff(s.target.date, today);
  if (s.id === 'conference' && s.range) {
    if (s.range.end < today) return '已结束';
    if (s.range.start <= today) return '进行中';
  }
  if (s.past) return diff >= 0 ? '已过' : `已过 ${-diff} 天`;
  // A school office counts working days: 17 calendar days over National Day are 7 of them.
  if (s.workdays !== undefined) return s.workdays <= 0 ? '今天' : `${s.workdays} 个工作日`;
  if (diff <= 0) return '今天';
  if (diff === 1) return '明天';
  return `${diff} 天`;
}

/**
 * The official wording of a step's own milestone: "9/30 23:59 AoE". When the
 * venue wrote no time zone, say so rather than name one: "12/20（没写时区，按北京时间算）".
 */
export function stepOfficial(s: Step): string | undefined {
  const m = s.milestone;
  if (!m || m.status === 'tba') return undefined;
  if (m.tz_assumed && m.at_resolved) return `${md(m.at_resolved.local)}（没写时区，按${tzLabel(m.tz)}算）`;
  return fmtOfficial(m);
}

// ---------- 作者注册: price and coverage (§10.5) ----------

const TIER_ZH: Record<string, string> = { early: '优惠', standard: '标准', late: '晚注册', regular: '标准', onsite: '现场' };
const CUR: Record<string, string> = { USD: '$', EUR: '€', CAD: 'C$', AUD: 'A$', GBP: '£' };

export const money = (n: number, cur: string) => (CUR[cur] ? `${CUR[cur]}${n}` : `${n} ${cur}`);

export interface PriceRow {
  label: string;
  member: 'none' | 'current' | 'new';
  prices: { tier: string; amount: string; until?: string; now: boolean }[];
  link?: string;
}

export type Prices =
  | { rows: PriceRow[]; note?: string; link?: string }
  | {
      tba: true;
      note?: string;
      checked: { title: string; url: string }[];
      /** Last edition's prices (上届参考): shown, never used in any date or sum. */
      reference?: { from: string; rows: PriceRow[]; note?: string; link?: string };
    };

/** Rows of a fee table that count for authors, for one identity; `ends` are the tiers' end times (when known). */
function priceRows(t: Pick<AppFeeTable, 'tiers' | 'rows' | 'currency'>, identity: RegCategory, ends: (ResolvedTime | undefined)[], now: number): PriceRow[] {
  const cur = ends.some(Boolean) ? ends.findIndex((e) => !e || Date.parse(e.utc) > now) : -1;
  return t.rows
    .filter((r) => r.for.includes(identity) && r.covers_author)
    .map((r) => {
      const ids = r.tiers ?? t.tiers.map((x) => x.id);
      return {
        label: r.label_zh,
        member: r.member,
        link: r.link,
        prices: ids.map((id, i) => {
          const ti = t.tiers.findIndex((x) => x.id === id);
          const end = ends[ti];
          return { tier: TIER_ZH[id] ?? id, amount: money(r.amounts[i]!, t.currency), until: end ? shortTime(end) : undefined, now: ti === cur };
        }),
      };
    });
}

/** Author-registration prices for an identity at a site: rows that count for authors, each tier with its end (Beijing time). */
export function pricesFor(ed: AppEdition, site: string | undefined, identity: RegCategory, now: number): Prices | undefined {
  const tables = (ed.logistics?.fees ?? []).filter((t) => !t.site || t.site === site);
  const t = tables.find((x) => !isTba(x)) as AppFeeTable | undefined;
  if (!t) {
    const tba = tables.find((x) => isTba(x)) as (AppTba & { site?: string }) | undefined;
    if (!tba) return undefined;
    const ref = tba.reference as (AppFeeTable & { from: string }) | undefined;
    return {
      tba: true,
      note: tba.note_zh,
      checked: tba.checked ?? [],
      reference:
        ref && Array.isArray(ref.rows) && Array.isArray(ref.tiers)
          ? { from: ref.from, rows: priceRows(ref, identity, [], now), note: ref.note_zh, link: ref.link }
          : undefined,
    };
  }
  const ends = t.tiers.map((tier) => {
    const m = tier.until ? siteMilestone(ed, tier.until, site) : undefined;
    return m && m.status !== 'tba' ? m.at_resolved : undefined;
  });
  return { rows: priceRows(t, identity, ends, now), note: t.note_zh, link: t.link };
}

/** "一位作者多篇只需 1 份注册" and the like, from logistics.coverage. */
export function coverageText(ed: AppEdition): string | undefined {
  const c = ed.logistics?.coverage;
  if (!c) return undefined;
  if (isTba(c)) return c.note_zh ? `待公布：${c.note_zh}` : '官方还没写一份注册覆盖几篇';
  const rate = c.rate === 'in_person' ? '，要线下价' : c.rate === 'non_student_in_person' ? '，要非学生的线下价' : '';
  if (c.per === 'author')
    return c.max_papers ? `一份注册最多覆盖 ${c.max_papers} 篇${rate}` : `一位作者有几篇都只需 1 份注册${rate}`;
  if (c.per === 'paper') return `每篇论文要 1 份注册${rate}`;
  return `官方没写一份注册覆盖几篇${rate}`;
}

/**
 * 同一届录用 2 篇以上、都是我报告 (§10.9): how many registrations, by
 * logistics.coverage. "2 篇 · 1 份注册", "3 篇 · 需要 2 份", or
 * "未规定 · 建议问主办方".
 */
export function registrationsNeeded(papers: TripPaper[], editions: AppEdition[]): { edition: AppEdition; papers: number; text: string }[] {
  const by = new Map<string, number>();
  for (const p of papers) if (p.accepted && (p.presenter ?? 'me') === 'me') by.set(p.accepted.edition, (by.get(p.accepted.edition) ?? 0) + 1);
  const out: { edition: AppEdition; papers: number; text: string }[] = [];
  for (const [id, k] of by) {
    const ed = editions.find((e) => e.id === id);
    if (!ed || k < 2) continue;
    const c = ed.logistics?.coverage;
    let text: string;
    if (!c || isTba(c) || c.per === 'unspecified') text = `${k} 篇 · 未规定 · 建议问主办方`;
    else if (c.per === 'paper') text = `${k} 篇 · 需要 ${k} 份注册`;
    else if (c.max_papers) {
      const n = Math.ceil(k / c.max_papers);
      text = `${k} 篇 · ${n === 1 ? '1 份注册' : `需要 ${n} 份`}${c.rate === 'non_student_in_person' ? ' · 非学生价' : ''}`;
    } else text = `${k} 篇 · 1 份注册`;
    out.push({ edition: ed, papers: k, text });
  }
  return out;
}

/** Two accepted trips overlap (在外 days): "与 X 撞期" on both 开会 rows. */
export function tripsClash(a: Trip, b: Trip): boolean {
  if (!a.D || !a.R || !b.D || !b.R) return false;
  return a.D <= b.R && b.D <= a.R;
}

// ---------- 加入日历 (§10.8) ----------

const compact = (d: string) => d.replace(/-/g, '');

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 line folding: at most 75 octets per line, continuation lines start with a space. */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** What a step's date is, as stored when exported: changes mean "重新导出". */
export function calKey(s: Step): string | undefined {
  if (s.range) return `${s.range.start}/${s.range.end}`;
  if (!s.at) return undefined;
  return s.at.local.includes('T') ? s.at.beijing : s.at.local.slice(0, 10);
}

/** Steps whose date differs from the one exported (or that lost their date). */
export function calChanged(stored: Record<string, string> | undefined, steps: Step[]): Step[] {
  if (!stored) return [];
  return steps.filter((s) => stored[s.id] !== undefined && calKey(s) !== stored[s.id]);
}

/** Steps a calendar file carries: dated, not 待公布, not done. */
export const exportable = (steps: Step[]) => steps.filter((s) => !s.done && s.tag !== 'tba' && calKey(s) !== undefined);

/**
 * The paper's checklist as an .ics file (Asia/Shanghai): a timed deadline is
 * an event at that minute with two alerts (1 day and 2 hours before); a day
 * the app worked out is an all-day event (its title ends in "（建议）"); the
 * conference is an all-day event over its days. UIDs are fixed per paper and
 * step, so importing again updates the same events.
 */
export function icsFor(paper: { id: string; name: string }, edName: string, steps: Step[], now: number): { text: string; keys: Record<string, string> } {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NextVenue//投稿下一站//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(`${paper.name} · ${edName}`)}`,
    'X-WR-TIMEZONE:Asia/Shanghai',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Shanghai',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:CST',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
  const keys: Record<string, string> = {};
  for (const s of exportable(steps)) {
    const soft = s.tag === 'advice' || s.tag === 'settings' || s.tag === 'estimated';
    const title = `${s.action}${s.suffix ? ` · ${s.suffix}` : ''}${soft ? '（建议）' : s.tag === 'optional' ? '（选做）' : ''} · ${edName}`;
    const url = s.link ?? s.src;
    const desc = [`${paper.name} · ${GROUP_ZH[s.group]}`, ...s.how, s.note ?? '', url ? `官网：${url}` : ''].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${paper.id}-${s.id}@nextvenue`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEscape(title)}`);
    if (s.range) {
      lines.push(`DTSTART;VALUE=DATE:${compact(s.range.start)}`, `DTEND;VALUE=DATE:${compact(addDays(s.range.end, 1))}`, 'TRANSP:TRANSPARENT');
    } else if (s.at!.local.includes('T')) {
      const b = s.at!.beijing;
      lines.push(`DTSTART;TZID=Asia/Shanghai:${compact(b.slice(0, 10))}T${b.slice(11, 13)}${b.slice(14, 16)}00`);
    } else {
      const d = s.at!.local.slice(0, 10);
      lines.push(`DTSTART;VALUE=DATE:${compact(d)}`, `DTEND;VALUE=DATE:${compact(addDays(d, 1))}`, 'TRANSP:TRANSPARENT');
    }
    lines.push(`DESCRIPTION:${icsEscape(desc)}`);
    if (url) lines.push(`URL:${url}`);
    const alarm = (trigger: string) => lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(title)}`, `TRIGGER:${trigger}`, 'END:VALARM');
    if (s.at?.local.includes('T')) {
      alarm('-P1D');
      alarm('-PT2H');
    } else if (!s.range) alarm('-PT15H');
    lines.push('END:VEVENT');
    keys[s.id] = calKey(s)!;
  }
  lines.push('END:VCALENDAR');
  return { text: `${lines.map(fold).join('\r\n')}\r\n`, keys };
}

/** "nv-论文A-neurips-2026.ics" */
export const icsName = (paperName: string, edId: string) => `nv-${paperName.replace(/[\s/\\:*?"<>|]+/g, '')}-${edId}.ics`;

// ---------- small words ----------

/** "D − 12/5 往前数" helper for the header: "出发 12/5". */
export const dayShort = (d: string, now: number) => (d.slice(0, 4) !== beijingDate(now).slice(0, 4) ? `${d.slice(0, 4)}/${md(d)}` : md(d));

/** Whole days since a check date: the visa page warns after 30. */
export const daysSince = (day: string, now: number) => dayDiff(beijingDate(now), day);
