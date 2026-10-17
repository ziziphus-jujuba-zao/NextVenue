// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// After acceptance (docs/MOBILE_SPEC.md §10) on the real data: the NeurIPS
// 2026 checklist of the spec's example, the school-approval date in Chinese
// working days over National Day, AAAI-27 with next year's estimated
// holidays, 待公布 handling, the visa dates, the ask card and the calendar.

import { describe, expect, it } from 'vitest';
import { appData } from '../../scripts/app-data.ts';
import { buildBundle } from '../../scripts/bundle.ts';
import {
  DEFAULT_TRIP,
  TAG_ZH,
  acceptPrompt,
  approvalAfterAssignment,
  approvalAtOtherSites,
  approvalDate,
  assignPrompt,
  calChanged,
  calendarOf,
  cleanTrip,
  holidayText,
  icsFor,
  nextStep,
  pricesFor,
  registrationsNeeded,
  siteMilestone,
  stepOfficial,
  stepRelative,
  stepWhen,
  tripSteps,
  tzOffsetText,
  visaApplyBy,
  type Step,
  type TripPaper,
  type TripSettings,
} from './trip.ts';
import type { AppEdition } from './types.ts';

const data = appData(buildBundle());
const cal = calendarOf(data.china!.holidays);
const ed = (id: string) => data.editions.find((e) => e.id === id)!;
const rules = (id: string) => data.rules.filter((r) => r.edition === id);
const at = (s: string) => Date.parse(s);

/** The spec's example (§10.4): NeurIPS 2026, a student, default settings, Sydney, today 9/25 21:00 Beijing. */
const NOW = at('2026-09-25T21:00+08:00');
const neurips = ed('neurips-2026');
const paperA: TripPaper = { id: 'p1', name: '论文 A', current: 'neurips-2026', accepted: { edition: 'neurips-2026', at: '2026-09-25' }, site: 'sydney' };

function trip(p: TripPaper, e: AppEdition, now: number, settings: TripSettings = DEFAULT_TRIP) {
  return tripSteps(p, e, rules(e.id), data.visa, settings, cal, now);
}

/** A row as the checklist shows it: name (· suffix) | day | tag. */
const line = (s: Step, now: number) => [s.suffix ? `${s.name} · ${s.suffix}` : s.name, stepWhen(s, now), TAG_ZH[s.tag]].join(' | ');

describe('NeurIPS 2026, Sydney, today 9/25 (§10.4 example)', () => {
  const t = trip(paperA, neurips, NOW);
  const by = (id: string) => t.steps.find((s) => s.id === id)!;

  it('lists the steps the spec shows, grouped and in order, one tag each', () => {
    const rows = (g: string) => t.steps.filter((s) => s.group === g).map((s) => line(s, NOW));
    // 资助 is optional (选做); 学校审批 is D minus your own N (按设置). The page hides the
    // cancel-only rows (全额退款截止, 拒签退款申请) and folds 待公布 into one line; the
    // calendar keeps them.
    expect(rows('before')).toEqual([
      '会场意向表 | 10/1 周四 19:59 | 硬性',
      '资助申请 | 10/7 周三 19:59 | 选做',
      '作者注册 | 10/10 周六 | 建议',
      '递交签证 · 澳大利亚 | 10/10 周六 | 建议',
      '学校审批 | 10/12 周一 | 按设置',
      '全额退款截止 | 11/4 周三 19:59 | 硬性',
      '提交终稿 | 待公布 | 待公布',
      '海报 | 待公布 | 待公布',
    ]);
    expect(t.steps.filter((s) => s.conditional).map((s) => s.id)).toEqual(['refund', 'visarefund']);
    expect(rows('away')).toEqual(['开会 · 悉尼 | 12/6–12/12 | ']);
    // 报销: R (12/13) + the 30 days of 出行设置, the user's own number.
    expect(rows('after')).toEqual(['拒签退款申请 | 12/20 周日 | 硬性', '报销 | 2027/1/12 | 按设置']);
  });

  it('puts the site assignment and the aid result under their rows', () => {
    expect(by('site').note).toBe('10/7 01:00 公布分配');
    expect(by('site').action).toBe('确认会场意向表');
    expect(by('aid').note).toBe('10/15 19:59 前公布结果');
  });

  it('points 会场意向表 at the official sentence (the form is mailed to authors), the others at where the task is done', () => {
    expect(by('site').link).toBeUndefined();
    expect(by('site').src).toContain('blog.neurips.cc');
    expect(by('site').src).toContain('text=Prior%20to%20the%20acceptance%20announcements');
    expect(by('register')).toMatchObject({ link: 'https://neurips.cc/Register/view-registration', linkLabel: '去注册 ↗' });
    expect(by('aid')).toMatchObject({ linkLabel: '去申请 ↗' });
  });

  it('works 学校审批 back over National Day: 12/5 − 40 working days = 10/12, 7 working days left', () => {
    expect(t.D).toBe('2026-12-05');
    const a = approvalDate('2026-12-05', 40, cal, NOW);
    expect(a).toMatchObject({ day: '2026-10-12', left: 7, estimated: false });
    // Mid-Autumn and National Day off, Saturday 10/10 a make-up working day.
    expect(a.how.join('')).toContain('10/1–10/7 国庆节放假');
    expect(a.how.join('')).toContain('10/10 周六调休上班');
    expect(by('approval').tag).toBe('settings');
    // The office counts working days: the row says 7 of them, not 17 calendar days.
    expect(stepRelative(by('approval'), NOW)).toBe('7 个工作日');
  });

  it('says how few working days the assignment leaves, and the other sites’ approval day', () => {
    // 10/7 01:00 assignment, then 10/8, 10/9, 10/10 (调休), 10/12.
    expect(approvalAfterAssignment(neurips, paperA, '2026-10-12', cal, NOW)).toMatchObject({ left: 4, at: { beijing: '2026-10-07 01:00' } });
    expect(approvalAfterAssignment(neurips, paperA, '2026-10-12', cal, at('2026-10-07T02:00+08:00'))).toBeUndefined();
    // Atlanta and Paris start 12/9, so D = 12/8 and 40 working days back is 10/13.
    expect(approvalAtOtherSites(paperA, neurips, DEFAULT_TRIP, cal, NOW)).toEqual([{ cities: ['亚特兰大', '巴黎'], day: '2026-10-13', estimated: false }]);
    expect(approvalAtOtherSites({ ...paperA, assigned: 'sydney' }, neurips, DEFAULT_TRIP, cal, NOW)).toEqual([]);
  });

  it('reads the refund cutoff as the earliest wording: 11/3 23:59 AoE = 11/4 周三 19:59 Beijing', () => {
    const m = siteMilestone(neurips, 'refund_cutoff', 'sydney')!;
    expect(m.at_resolved).toMatchObject({ local: '2026-11-03T23:59', beijing: '2026-11-04 19:59' });
    expect(by('refund').conditional).toBe(true);
  });

  it('has a different early-bird cutoff per site: Paris 10/31 06:59, Sydney and Atlanta 10/31 19:59 Beijing', () => {
    expect(siteMilestone(neurips, 'early_registration', 'paris')!.at_resolved!.beijing).toBe('2026-10-31 06:59');
    expect(siteMilestone(neurips, 'early_registration', 'sydney')!.at_resolved!.beijing).toBe('2026-10-31 19:59');
    expect(siteMilestone(neurips, 'early_registration', 'atlanta')!.at_resolved!.beijing).toBe('2026-10-31 19:59');
    expect(by('register').how).toContain('优惠价 10/31 19:59 截止（北京时间），过了只是价格变高。');
  });

  it('tells to register at the assigned site until the assignment is known, then names the visa letter', () => {
    expect(by('register').note).toBe('10/7 分配后，按分到的会场注册');
    const assigned = trip({ ...paperA, assigned: 'sydney' }, neurips, NOW);
    expect(assigned.steps.find((s) => s.id === 'register')!.note).toBe('注册后才能开签证邀请函');
  });

  it('dates the visa by the organizer: "at least 6 to 8 weeks" before 12/5 is 10/10, with the 10/20 refund condition', () => {
    expect(t.visa).toMatchObject({ need: 'required', countryZh: '澳大利亚', applyBy: '2026-10-10', basis: 'organizer' });
    expect(t.visa.refundApplyBy?.day).toBe('2026-10-20');
  });

  it('shows 会场意向表 on the 下一件事 card, on a National Day evening', () => {
    const n = nextStep(t.steps, NOW);
    expect('step' in n && n.step.id).toBe('site');
    expect('step' in n && n.step.action).toBe('确认会场意向表');
    expect(holidayText('2026-10-01', cal)).toBe('国庆假期');
    expect(stepRelative(by('site'), NOW)).toBe('6 天');
  });

  it('leads with the earliest day whatever its tag, never with an optional step while a required one is ahead', () => {
    // With the form ticked, optional 资助 (10/7) does not push out 作者注册 and 递交签证 (10/10).
    const n = nextStep(trip({ ...paperA, done: ['site'] }, neurips, NOW).steps, NOW);
    expect('step' in n && n.step.id).toBe('register');
    const v = nextStep(trip({ ...paperA, done: ['site', 'register'] }, neurips, NOW).steps, NOW);
    expect('step' in v && v.step.id).toBe('visa');
  });

  it('never lets 待公布 or a refund cutoff lead; an optional step leads only once nothing else is left', () => {
    const done = trip({ ...paperA, done: ['site', 'register', 'visa', 'approval'] }, neurips, NOW);
    const n = nextStep(done.steps, NOW);
    // The refund cutoff (11/4) is only for cancelling; 资助 is optional but still ahead.
    expect('step' in n && n.step.id).toBe('aid');
    const all = trip({ ...paperA, done: ['site', 'register', 'visa', 'approval'], skip: ['aid'] }, neurips, NOW);
    expect(all.steps.find((s) => s.id === 'aid')).toMatchObject({ done: true, skipped: true });
    const w = nextStep(all.steps, NOW);
    expect('waiting' in w && w.waiting.map((s) => s.id)).toEqual(['camera', 'poster']);
  });

  it('asks 分到哪 once the sites are out; the form is then closed, never late; the answer re-works the list', () => {
    const after = at('2026-10-07T02:00+08:00');
    expect(assignPrompt(paperA, neurips, NOW)).toBeNull();
    expect(assignPrompt(paperA, neurips, after)).toMatchObject({ beijing: '2026-10-07 01:00' });
    expect(assignPrompt({ ...paperA, presenter: 'coauthor' }, neurips, after)).toBeNull();
    const open = trip(paperA, neurips, after);
    expect(open.steps.find((s) => s.id === 'site')).toMatchObject({ closed: true, overdue: false, done: false });
    const n = nextStep(open.steps, after);
    expect('step' in n && n.step.id).not.toBe('site');
    // Randomly sent to Atlanta: the form is ticked, the visa is the US one, departure moves to 12/8.
    const atl = trip({ ...paperA, assigned: 'atlanta' }, neurips, after);
    expect(assignPrompt({ ...paperA, assigned: 'atlanta' }, neurips, after)).toBeNull();
    expect(atl.steps.find((s) => s.id === 'site')).toMatchObject({ done: true, auto: '分配到亚特兰大' });
    expect(atl).toMatchObject({ D: '2026-12-08', visa: { countryZh: '美国' } });
  });

  it('names the assumed time zone instead of calling it local time', () => {
    expect(stepOfficial(by('visarefund'))).toBe('12/20（没写时区，按北京时间算）');
    expect(stepOfficial(by('site'))).toBe('9/30 23:59 AoE');
  });

  it('flags a passed official deadline first, in red', () => {
    const late = trip(paperA, neurips, at('2026-10-02T10:00+08:00'));
    const n = nextStep(late.steps, at('2026-10-02T10:00+08:00'));
    expect(n).toMatchObject({ overdue: true, step: { id: 'site' } });
  });

  it('follows the site: Paris has no visa-refund deadline and dates the Schengen visa by processing time', () => {
    const p = trip({ ...paperA, site: 'paris' }, neurips, NOW);
    expect(p.steps.some((s) => s.id === 'visarefund')).toBe(false);
    expect(p.visa).toMatchObject({ countryZh: '法国', basis: 'official', applyBy: '2026-10-12' });
    expect(p.steps.find((s) => s.id === 'conference')!.suffix).toBe('巴黎');
  });

  it('for a US site compares the interview wait, says when it falls after departure, and keeps the 10/20 refund date', () => {
    const u = trip({ ...paperA, site: 'atlanta' }, neurips, NOW);
    const v = u.steps.find((s) => s.id === 'visa')!;
    // 9/25 + 4.5 months (30-day months) = 2/7; Atlanta departure 12/8.
    expect(v.note).toBe('尽早预约 · 现在约，北京最早约 2/7 面签');
    expect(v.alert).toBe('面签在出发之后');
    expect(u.visa.applyBy).toBeUndefined();
    // Apply by 10/20 to keep the visa refund; the letter needs a paid registration first.
    expect(line(v, NOW)).toBe('递交签证 · 美国 | 10/20 周二 | 建议');
    const r = u.steps.find((s) => s.id === 'register')!;
    expect(line(r, NOW)).toBe('作者注册 | 10/20 周二 | 建议');
    expect(r.how[0]).toBe('10/20 前递签才保留拒签退差价的资格，邀请函要先注册。');
  });

  it('keeps only 终稿, 确认合作者已注册 and 退款 when a co-author presents', () => {
    const c = trip({ ...paperA, presenter: 'coauthor' }, neurips, NOW);
    expect(c.steps.map((s) => s.name)).toEqual(['确认合作者已注册', '全额退款截止', '提交终稿']);
  });

  it('folds the visa away once the user has a valid visa, and drops the letter line', () => {
    const v = trip({ ...paperA, assigned: 'sydney' }, neurips, NOW, { ...DEFAULT_TRIP, visas: { au: { have: true } } });
    expect(v.steps.find((s) => s.id === 'visa')).toMatchObject({ done: true, auto: '已有有效签证' });
    expect(v.steps.find((s) => s.id === 'register')!.note).toBeUndefined();
    // Without the visa date, registration goes by the early-bird price.
    expect(stepWhen(v.steps.find((s) => s.id === 'register')!, NOW)).toBe('10/31 周六 19:59');
  });

  it('drops 学校审批 when the school needs none, and orders an official passport approval → passport → visa', () => {
    expect(trip(paperA, neurips, NOW, { ...DEFAULT_TRIP, approval: false }).steps.some((s) => s.id === 'approval')).toBe(false);
    const o = trip(paperA, neurips, NOW, { ...DEFAULT_TRIP, passport: 'cn_official' });
    const ids = o.steps.map((s) => s.id);
    expect(ids.indexOf('approval')).toBeLessThan(ids.indexOf('passport'));
    expect(ids.indexOf('passport')).toBeLessThan(ids.indexOf('visa'));
    expect(o.steps.find((s) => s.id === 'visa')!.name).toBe('经外办办签证');
  });
});

describe('AAAI-27, accepted 11/30 (§10.11 test 2)', () => {
  const aaai = ed('aaai-27');
  const p: TripPaper = { id: 'p2', name: '论文 B', current: 'aaai-27', accepted: { edition: 'aaai-27', at: '2026-11-30' } };
  const accepted = at('2026-11-30T21:00+08:00');

  it('counts 40 working days back from D = 2/15 to 12/9 周三, 7 left after acceptance, marked 预计', () => {
    const t = trip(p, aaai, accepted);
    expect(t.D).toBe('2027-02-15');
    const a = approvalDate('2027-02-15', 40, cal, accepted);
    expect(a).toMatchObject({ day: '2026-12-09', left: 7, estimated: true });
    const s = t.steps.find((x) => x.id === 'approval')!;
    expect(s.tag).toBe('estimated');
    expect(stepWhen(s, accepted)).toBe('12/9 周三');
  });

  it('leads with 学校审批 (12/9) once the volunteer form is done, not the later camera-ready', () => {
    const now = at('2026-12-01T10:00+08:00');
    const first = nextStep(trip(p, aaai, now).steps, now);
    // The optional volunteer form (12/5) never pushes out a required step.
    expect('step' in first && first.step.id).toBe('approval');
    const n = nextStep(trip({ ...p, done: ['aid'] }, aaai, now).steps, now);
    expect('step' in n && n.step.id).toBe('approval');
  });

  it('reads 11:59 PM EST on 12/15 as 12/16 12:59 Beijing for the early price', () => {
    const t = trip(p, aaai, accepted);
    expect(t.steps.find((x) => x.id === 'register')).toMatchObject({ tag: 'advice', at: { beijing: '2026-12-16 12:59' } });
    const pr = pricesFor(aaai, undefined, 'student', accepted);
    expect(pr && 'rows' in pr && pr.rows[0]!.prices[0]).toMatchObject({ tier: '优惠', amount: '$350', until: '12/16 12:59', now: true });
  });

  it('works the Canadian visa back from processing time: 2/15 − 35 days − 3 weeks = 12/21', () => {
    const v = visaApplyBy(data.visa, aaai, '2027-02-15', accepted, { cc: 'CA' });
    expect(v).toMatchObject({ applyBy: '2026-12-21', basis: 'official', officialText: '官方 35 天（含生物信息）+ 默认缓冲 3 周' });
  });

  it('names the volunteer program, and has no visa-refund step (AAAI has no such clause)', () => {
    const t = trip(p, aaai, accepted);
    expect(t.steps.find((x) => x.id === 'aid')).toMatchObject({ name: '志愿者申请', tag: 'optional', optional: true });
    expect(t.steps.some((x) => x.id === 'visarefund')).toBe(false);
    expect(t.steps.find((x) => x.id === 'refund')!.name).toBe('退款申请截止');
  });
});

describe('待公布', () => {
  it('lists a step the venue has but has not dated, never computes with it, never exports it', () => {
    const t = trip(paperA, neurips, NOW);
    const cam = t.steps.find((s) => s.id === 'camera')!;
    expect(cam).toMatchObject({ tag: 'tba', text: '待公布', target: undefined, overdue: false });
    const ics = icsFor(paperA, 'NeurIPS 2026', t.steps, NOW);
    expect(Object.keys(ics.keys)).not.toContain('camera');
    expect(Object.keys(ics.keys)).not.toContain('poster');
  });

  it('waits for the conference days before working anything back from them', () => {
    const noDays: AppEdition = { ...neurips, sites: undefined, dates: undefined, milestones: neurips.milestones.filter((m) => m.type !== 'conference') };
    const t = trip({ ...paperA, site: undefined }, noDays, NOW);
    expect(t.D).toBeUndefined();
    expect(t.steps.find((s) => s.id === 'approval')).toMatchObject({ text: '等会期公布后自动算', target: undefined });
    expect(t.steps.some((s) => s.id === 'reimburse')).toBe(false);
  });

  it('keeps last edition’s prices as 上届参考, apart from this edition’s (WACV 2027)', () => {
    const w = pricesFor(ed('wacv-2027'), undefined, 'student', NOW);
    expect(w).toMatchObject({ tba: true, reference: { from: 'wacv-2026' } });
    expect(w && 'tba' in w && w.reference!.rows.map((r) => r.prices.map((x) => `${x.tier} ${x.amount}${x.until ?? ''}`).join('/'))).toEqual([
      '优惠 $475/标准 $575',
      '优惠 $525/标准 $625',
    ]);
  });

  it('shows prices as 待公布 where the venue gave none (NeurIPS Sydney)', () => {
    expect(pricesFor(neurips, 'sydney', 'student', NOW)).toMatchObject({ tba: true });
    const paris = pricesFor(neurips, 'paris', 'student', NOW);
    expect(paris && 'rows' in paris && paris.rows.map((r) => r.prices.map((x) => x.amount).join('/'))).toEqual(['€380/€480', '€250/€300']);
  });
});

describe('录用了吗？ (§10.1)', () => {
  const submitted: TripPaper = { id: 'p1', name: '论文 A', current: 'neurips-2026' };

  it('asks once the official result day has begun, and says whether that day is over', () => {
    // NeurIPS: 9/24 AoE began at 9/24 20:00 Beijing and ended 9/25 19:59.
    expect(acceptPrompt(submitted, data.editions, at('2026-09-24T19:00+08:00'))).toBeNull();
    expect(acceptPrompt(submitted, data.editions, at('2026-09-24T21:00+08:00'))).toMatchObject({ over: false });
    expect(acceptPrompt(submitted, data.editions, NOW)).toMatchObject({ edition: { id: 'neurips-2026' }, over: true });
    // AAAI-27: 11/30 AoE is still under way at 12/1 10:00 Beijing.
    expect(acceptPrompt({ id: 'p2', name: 'B', current: 'aaai-27' }, data.editions, at('2026-12-01T10:00+08:00'))).toMatchObject({ over: false });
  });

  it('stays away once marked, while 还没看到 holds it, without a 在投 venue, and after the conference', () => {
    expect(acceptPrompt({ ...submitted, accepted: { edition: 'neurips-2026', at: '2026-09-25' } }, data.editions, NOW)).toBeNull();
    expect(acceptPrompt({ ...submitted, snooze: NOW + 3_600_000 }, data.editions, NOW)).toBeNull();
    expect(acceptPrompt({ ...submitted, snooze: NOW - 1 }, data.editions, NOW)).not.toBeNull();
    expect(acceptPrompt({ ...submitted, current: undefined }, data.editions, NOW)).toBeNull();
    expect(acceptPrompt(submitted, data.editions, at('2026-12-20T10:00+08:00'))).toBeNull();
  });
});

describe('time difference (§10.6, §10.11 test 4)', () => {
  it('names daylight saving: Sydney in December is 3 hours ahead of Beijing', () => {
    expect(tzOffsetText('Australia/Sydney', '2026-12-06', '2026-12-12')).toBe('比北京快 3 小时（当地夏令时）');
    expect(tzOffsetText('America/New_York', '2026-12-09', '2026-12-13')).toBe('比北京慢 13 小时');
  });
  it('splits a clock change inside the conference (EMNLP 2026 Budapest, 10/25)', () => {
    expect(tzOffsetText('Europe/Budapest', '2026-10-24', '2026-10-28')).toBe('10/24 比北京慢 6 小时（当地夏令时），10/25 起慢 7 小时');
  });
});

describe('加入日历 (§10.8)', () => {
  const t = trip(paperA, neurips, NOW);
  const { text, keys } = icsFor(paperA, 'NeurIPS 2026', t.steps, NOW);

  it('writes Beijing-time events with fixed UIDs and two alerts for timed deadlines', () => {
    expect(text).toContain('BEGIN:VTIMEZONE\r\nTZID:Asia/Shanghai');
    expect(text).toContain('UID:p1-site@nextvenue');
    expect(text).toContain('DTSTART;TZID=Asia/Shanghai:20261001T195900');
    const site = text.slice(text.indexOf('UID:p1-site@'), text.indexOf('END:VEVENT', text.indexOf('UID:p1-site@')));
    expect(site.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(site).toContain('TRIGGER:-P1D');
    expect(site).toContain('TRIGGER:-PT2H');
  });

  it('makes the app’s dates all-day events titled （建议）, and the conference a span', () => {
    expect(text).toContain('DTSTART;VALUE=DATE:20261012');
    expect(text).toMatch(/SUMMARY:提交学校审批（建议） · NeurIPS 2026/);
    expect(text).toContain('DTSTART;VALUE=DATE:20261206\r\nDTEND;VALUE=DATE:20261213');
    for (const l of text.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });

  it('tells which exported dates changed', () => {
    expect(calChanged(keys, t.steps)).toEqual([]);
    const moved = trip({ ...paperA, depart: '2026-12-03' }, neurips, NOW);
    expect(calChanged(keys, moved.steps).map((s) => s.id)).toEqual(expect.arrayContaining(['approval', 'register', 'visa']));
  });
});

describe('settings and registrations', () => {
  it('cleans stored settings', () => {
    expect(cleanTrip(undefined)).toEqual(DEFAULT_TRIP);
    expect(cleanTrip({ leadDays: 15, passport: 'cn_official', identity: 'academic', visas: { us: { have: true, applied: 'x' } } })).toMatchObject({
      leadDays: 15,
      passport: 'cn_official',
      identity: 'academic',
      visas: { us: { have: true, applied: undefined } },
    });
    expect(cleanTrip({ leadDays: -3 }).leadDays).toBe(40);
  });

  it('counts registrations for two papers at one venue by its coverage rule', () => {
    const two = [paperA, { ...paperA, id: 'p3' }];
    expect(registrationsNeeded(two, data.editions)).toEqual([expect.objectContaining({ papers: 2, text: '2 篇 · 1 份注册' })]);
    const aaai = [
      { id: 'a', name: 'A', accepted: { edition: 'aaai-27', at: '' } },
      { id: 'b', name: 'B', accepted: { edition: 'aaai-27', at: '' } },
    ];
    expect(registrationsNeeded(aaai, data.editions)[0]!.text).toBe('2 篇 · 未规定 · 建议问主办方');
  });
});

describe('an abstract accepted at an abstract-only meeting (AACR 2027, results 12/21)', () => {
  const now = at('2026-12-22T10:00+08:00');
  const p: TripPaper = { id: 'p9', name: '摘要 A', current: 'aacr-2027', accepted: { edition: 'aacr-2027', at: '2026-12-22' } };
  const t = trip(p, ed('aacr-2027'), now);

  it('asks on the result day like any venue', () => {
    expect(acceptPrompt({ id: 'p9', name: '摘要 A', current: 'aacr-2027' }, data.editions, at('2026-12-21T20:00+08:00'))?.edition.id).toBe('aacr-2027');
  });

  it('plans registration by the next price step still ahead: the early rate (12/7) closed before the results', () => {
    const reg = t.steps.find((s) => s.id === 'register')!;
    expect(reg.tag).toBe('advice');
    expect(stepWhen(reg, now)).toBe('2027/2/12');
    expect(reg.overdue).toBe(false);
    expect(t.steps.find((s) => s.id === 'conference')).toBeDefined();
  });
});
