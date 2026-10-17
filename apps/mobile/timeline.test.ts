// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The graphic timeline (docs/MOBILE_SPEC.md §11.2, §11.3, §11.5): the month
// axis and today's line, lane order, bars and row packing, colour slots, the
// next date under each venue name, bar labels, the zoomed phase bar and its
// list order, and the route's mini chart. Editions
// are copied from data/editions as of 2026-09-25 so the cases stay put.

import { BEIJING, formatIn, toInstant } from '@nextvenue/core';
import { describe, expect, it } from 'vitest';
import { seriesCatalog, targetRoute } from './route.ts';
import {
  MONTH_PX,
  arrCycleName,
  axisOf,
  dayWord,
  labelAt,
  laneColors,
  laneMarks,
  laneNext,
  laneOf,
  laneOrder,
  listKind,
  listOrder,
  miniRoute,
  monthStartX,
  nearestAt,
  packRows,
  phaseBands,
  phaseKind,
  roundOf,
  roundsOf,
  xOfDay,
  xOfMs,
  yearAt,
  type Dot,
  type Seg,
} from './timeline.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

const NOW = Date.parse('2026-09-25T21:00:00+08:00');

function rt(local: string, tz: string): ResolvedTime {
  const i = toInstant(local, tz);
  return { local, tz, utc: i.toISOString().replace(/\.\d{3}Z$/, 'Z'), beijing: formatIn(i, BEIJING) };
}

type Status = AppMilestone['status'];
const C: Status = 'confirmed';
const PT = 'America/Los_Angeles';

function m(type: string, local: string, status: Status = 'estimated', label_zh?: string, tz = 'AoE'): AppMilestone {
  return { type, tz, status, label_zh, at_resolved: rt(local, tz) };
}
function win(type: string, start: string, end: string, status: Status = 'estimated', label_zh?: string, tz = 'AoE'): AppMilestone {
  return { type, tz, status, label_zh, start_resolved: rt(start, tz), end_resolved: rt(end, tz) };
}
const tba = (type: string): AppMilestone => ({ type, tz: 'AoE', status: 'tba' });
function conf(start: string, end: string, status: Status = 'estimated', tz = PT): AppMilestone {
  return { type: 'conference', tz, status, start_resolved: rt(start, tz), end_resolved: rt(end, tz) };
}
function ed(id: string, name: string, milestones: AppMilestone[], year = Number(/\d{4}/.exec(name)?.[0] ?? 2027)): AppEdition {
  return { id, series: id.split('-')[0]!, name, year, kind: 'conference', topics: ['ml'], last_checked: '2026-09-25', milestones };
}

const ICLR27 = ed('iclr-2027', 'ICLR 2027', [
  m('abstract', '2026-09-18T23:59', C),
  m('paper', '2026-09-25T23:59', C),
  win('reviewing', '2026-10-01', '2026-10-21', 'estimated', '审稿人写审稿（作者兼审稿人适用）'),
  m('reviews_out', '2026-11-05', C),
  win('discussion', '2026-11-05', '2026-11-18', C),
  win('meta_reviews', '2026-11-19', '2026-12-16', C),
  m('notification', '2026-12-16', C),
  tba('camera_ready'),
  conf('2027-04-26', '2027-04-30', C),
]);
const ICLR28 = ed('iclr-2028', 'ICLR 2028', [m('abstract', '2027-09-18T23:59'), m('paper', '2027-09-25T23:59'), m('notification', '2027-12-16'), conf('2028-04-26', '2028-04-30')]);
const ICML27 = ed('icml-2027', 'ICML 2027', [m('abstract', '2027-01-23T23:59'), m('paper', '2027-01-28T23:59'), m('notification', '2027-04-30'), conf('2027-07-06', '2027-07-11')]);
const NEURIPS26 = ed('neurips-2026', 'NeurIPS 2026', [
  m('abstract', '2026-05-04T23:59', C),
  m('paper', '2026-05-06T23:59', C),
  m('notification', '2026-09-24', C),
  conf('2026-12-06', '2026-12-12', C, 'Australia/Sydney'),
]);
const NEURIPS27 = ed('neurips-2027', 'NeurIPS 2027', [m('abstract', '2027-05-04T23:59'), m('paper', '2027-05-06T23:59'), m('notification', '2027-09-24'), conf('2027-12-06', '2027-12-12')]);
const NAACL27 = ed('naacl-2027', 'NAACL 2027', [
  m('paper', '2026-10-12T23:59', C, 'ARR 投稿截止（2026 年 10 月轮）'),
  win('author_response', '2026-11-24', '2026-11-30', C, 'ARR 作者回复期'),
  m('meta_reviews', '2026-12-18', C),
  m('commitment', '2026-12-23T23:59', C),
  m('notification', '2027-02-10', C),
  m('camera_ready', '2027-03-03T23:59', C),
  conf('2027-06-01', '2027-06-05', C),
]);
const WACV27 = ed('wacv-2027', 'WACV 2027', [
  m('paper_registration', '2026-06-19T23:59', C, 'Round 1 论文注册'),
  m('paper', '2026-06-26T23:59', C, 'Round 1 正文'),
  m('phase1_notification', '2026-08-09', C, 'Round 1 审稿意见与初步决定'),
  m('paper_registration', '2026-08-21T23:59', C, 'Round 2 新论文注册'),
  m('paper', '2026-08-28T23:59', C, 'Round 2 正文'),
  m('author_response', '2026-08-28T23:59', C, 'Round 1 rebuttal 与修改稿'),
  m('notification', '2026-10-09', C, '最终结果（Round 1 修改稿与 Round 2 新投稿）'),
  m('camera_ready', '2026-11-02T23:59', C),
  conf('2027-01-04', '2027-01-08', C, 'America/New_York'),
]);
const KDD27 = ed('kdd-2027', 'KDD 2027', [
  m('abstract', '2027-02-01T23:59', 'estimated', '2 月轮（第二轮）摘要截止'),
  m('paper', '2027-02-08T23:59', 'estimated', '2 月轮（第二轮）正文截止'),
  win('author_response', '2027-04-04', '2027-04-17T23:59', 'estimated', '2 月轮（第二轮）rebuttal'),
  m('notification', '2027-05-16', 'estimated', '2 月轮（第二轮）出结果'),
  conf('2027-08-01', '2027-08-05', C),
  tba('author_registration'),
  m('abstract', '2026-07-19T23:59', C, '第一轮摘要截止'),
  m('paper', '2026-07-26T23:59', C, '第一轮正文截止'),
  win('author_response', '2026-09-29', '2026-10-13T23:59', C, '第一轮 rebuttal'),
  m('notification', '2026-11-14', C, '第一轮出结果'),
]);
const KDD28 = ed('kdd-2028', 'KDD 2028', [
  m('abstract', '2027-07-19T23:59', 'estimated', '第一轮摘要截止'),
  m('paper', '2027-07-26T23:59', 'estimated', '第一轮正文截止'),
  m('notification', '2027-11-14', 'estimated', '第一轮出结果'),
  conf('2028-08-01', '2028-08-05'),
]);
const CVPR27 = ed('cvpr-2027', 'CVPR 2027', [
  m('paper_registration', '2026-11-10T23:59', C, undefined, PT),
  m('paper', '2026-11-16T23:59', C, undefined, PT),
  m('notification', '2027-02-25', C, undefined, PT),
  tba('camera_ready'),
  conf('2027-06-20', '2027-06-25', C),
]);

const ALL = [ICLR27, ICLR28, ICML27, NEURIPS26, NEURIPS27, NAACL27, WACV27, KDD27, KDD28, CVPR27];
const CATALOG = seriesCatalog(ALL);
const series = (id: string) => CATALOG.find((s) => s.id === id)!;
const AXIS = axisOf(NOW);

describe('the month axis and today', () => {
  it('runs from 3 months back to 15 ahead, one width per month; the year over each January, the corner names the rest', () => {
    expect(AXIS.months).toHaveLength(19);
    expect(AXIS.months[0]).toMatchObject({ y: 2026, m: 6, x: 0, label: '6月' });
    expect(AXIS.months[0]!.year).toBeUndefined();
    expect(AXIS.months.at(-1)).toMatchObject({ y: 2027, m: 12 });
    expect(AXIS.months.find((x) => x.y === 2027 && x.m === 1)?.year).toBe('2027');
    expect(AXIS.months.find((x) => x.m === 7)?.year).toBeUndefined();
    expect(AXIS.width).toBe(19 * MONTH_PX);
    // Scrolled so May 2027 is at the left edge, the corner says 2027.
    expect(yearAt(AXIS, monthStartX(NOW, AXIS))).toBe(2026);
    expect(yearAt(AXIS, 11 * MONTH_PX)).toBe(2027);
    // On 1/3 the view opens on January: its year is in the corner, not over the month (no "今天27").
    const jan = axisOf(Date.parse('2027-01-03T10:00:00+08:00'));
    expect(jan.months[3]).toMatchObject({ y: 2027, m: 1 });
    expect(jan.months[3]!.year).toBeUndefined();
  });

  it('fits today to March on a 390px phone', () => {
    expect(390 - 32 - 76).toBeGreaterThanOrEqual(6.5 * MONTH_PX);
  });

  it('places a day in the middle of its slot, and this month at the left edge when opening', () => {
    expect(monthStartX(NOW, AXIS)).toBe(3 * MONTH_PX);
    expect(xOfDay('2026-09-01', AXIS)).toBeCloseTo(3 * MONTH_PX + (0.5 / 30) * MONTH_PX, 6);
    expect(xOfDay('2026-10-16', AXIS)).toBeCloseTo(4.5 * MONTH_PX, 6);
    // February is as wide as any month, so its days are wider: from mid-2/28 to mid-3/1 is half of each.
    expect(xOfDay('2027-03-01', AXIS) - xOfDay('2027-02-28', AXIS)).toBeCloseTo((0.5 / 28 + 0.5 / 31) * MONTH_PX, 6);
    expect(xOfDay('2027-02-02', AXIS) - xOfDay('2027-02-01', AXIS)).toBeCloseTo(MONTH_PX / 28, 6);
  });

  it('draws today on the Beijing clock: 9/25 21:00 is 24.875 days into September', () => {
    expect(xOfMs(NOW, AXIS)).toBeCloseTo(3 * MONTH_PX + (24.875 / 30) * MONTH_PX, 6);
    // 2026-09-30 17:00 UTC is already October in Beijing.
    expect(xOfMs(Date.parse('2026-09-30T17:00:00Z'), AXIS)).toBeCloseTo(4 * MONTH_PX + (1 / 24 / 31) * MONTH_PX, 6);
  });
});

describe('lanes: order, bars, rows', () => {
  it('puts the next deadline first: ICLR (paper 9/26 still open) before ICML, NeurIPS; results only go last', () => {
    const order = laneOrder([series('neurips'), series('iclr'), series('icml')], NOW).map((s) => s.id);
    expect(order).toEqual(['iclr', 'icml', 'neurips']);
    const noDeadline = { id: 'x', name: 'X', directions: [], editions: [ed('x-2026', 'X 2026', [m('notification', '2026-10-01', C)])] };
    expect(laneOrder([noDeadline, series('neurips')], NOW).map((s) => s.id)).toEqual(['neurips', 'x']);
  });

  it('draws ICLR 2027 from the paper deadline to 12/16, the abstract dot passed, and ICLR 2028 on the same lane', () => {
    const lane = laneOf(series('iclr'), AXIS, NOW);
    const [s27, s28] = lane.segs;
    expect(s27).toMatchObject({ edition: 'iclr-2027', label: '2027', est: false, row: 0 });
    expect(s27!.x0).toBeCloseTo(xOfDay('2026-09-26', AXIS), 6);
    expect(s27!.x1).toBeCloseTo(xOfDay('2026-12-16', AXIS), 6);
    expect(s27!.pre).toBeCloseTo(xOfDay('2026-09-19', AXIS), 6);
    expect(s27!.pre!).toBeLessThan(xOfMs(NOW, AXIS));
    expect(s27!.past).toBe(s27!.x0);
    expect(s27!.aria).toBe('ICLR 2027，摘要截止 9/19 周六 19:59，正文截止 9/26 周六 19:59，12/16 出结果，2027/4/26–4/30 开会');
    expect(s28!.aria).toBe('ICLR 2028，摘要截止 约 2027/9/19 19:59，正文截止 约 2027/9/26 19:59，约 2027/12/16 出结果，约 2028/4/26–4/30 开会（预计）');
    expect(s28).toMatchObject({ edition: 'iclr-2028', est: true, row: 0 });
    expect(lane.rows).toBe(1);
    expect(lane.dots.map((d) => d.edition)).toEqual(['iclr-2027']);
    // Under the name: the paper deadline tomorrow, in the accent colour; the name opens ICLR 2027.
    expect(lane.next).toMatchObject({ edition: 'iclr-2027', text: '明天 19:59', soon: true });
    expect(lane.open).toBe('iclr-2027');
  });

  it('writes NeurIPS 2027\'s "约 5/5" under the name, and the name opens NeurIPS 2027 (2026\'s result is out)', () => {
    const lane = laneOf(series('neurips'), AXIS, NOW);
    expect(lane.next).toEqual({ edition: 'neurips-2027', text: '约 5/5', soon: false, aria: '下一个截止：NeurIPS 2027 摘要 约 2027/5/5 19:59（预计）' });
    expect(lane.open).toBe('neurips-2027');
    // NeurIPS 2026 is over bar-wise; its conference dot is ahead and not past; its bar still opens 2026.
    expect(lane.segs[0]).toMatchObject({ edition: 'neurips-2026', x0: 0 });
    expect(lane.segs[0]!.past).toBe(lane.segs[0]!.x1);
    expect(lane.dots[0]).toMatchObject({ edition: 'neurips-2026', past: false });
    // With a paper in NeurIPS 2026 the name is about that paper while its result is ahead.
    const before = Date.parse('2026-09-20T12:00:00+08:00');
    expect(laneNext(series('neurips'), before, new Set(['neurips-2026']))).toMatchObject({ edition: 'neurips-2026', text: '结果 9/24', soon: true });
    expect(laneNext(series('neurips'), NOW, new Set(['neurips-2026']))?.edition).toBe('neurips-2027');
  });

  it('says a deadline in a few characters: today or tomorrow with the time, else the day, 约 for an estimate', () => {
    const t = (local: string, tz = 'AoE') => rt(local, tz);
    expect(dayWord(t('2026-09-25T23:59'), false, NOW)).toBe('明天 19:59');
    expect(dayWord(t('2026-09-25T12:00', 'Asia/Shanghai'), false, Date.parse('2026-09-25T08:00:00+08:00'))).toBe('今天 12:00');
    expect(dayWord(t('2026-10-01T23:59'), false, NOW)).toBe('10/2');
    expect(dayWord(t('2027-01-05T23:59'), true, NOW)).toBe('约 1/6');
    // ICRA 2028's 9/16 beside ICRA 2027's bar: a year away, so it says which year.
    expect(dayWord(t('2027-09-15T23:59', 'America/Los_Angeles'), true, NOW)).toBe('约 27/9/16');
  });

  it('puts a bar label on the part still ahead, clear of a conference dot, or leaves it out', () => {
    const seg: Seg = { edition: 'a', x0: 0, x1: 200, label: '2027', est: false, fade: false, past: 0, ticks: [], row: 0, aria: '' };
    expect(labelAt(seg, '2027', -10)).toBe(0);
    expect(labelAt(seg, '2027', 100)).toBe(102);
    // Too little left after today: back to the bar's start, unless it would straddle today's line.
    expect(labelAt(seg, '2027', 190)).toBe(0);
    expect(labelAt({ ...seg, x1: 40 }, '2027', 20)).toBeUndefined();
    // The part left of where the card opens is out of sight: the label starts there, or is left out.
    expect(labelAt(seg, '2027', -10, [], 10, 50)).toBe(52);
    expect(labelAt(seg, '2027', -10, [], 10, 180)).toBeUndefined();
    expect(labelAt({ ...seg, x1: 20 }, '2027', -10)).toBeUndefined();
    const dot: Dot = { edition: 'b', x: 10, est: false, past: false, row: 0 };
    expect(labelAt(seg, '2027', -10, [dot])).toBe(17);
    expect(labelAt(seg, '2027', -10, [{ ...dot, row: 1 }])).toBe(0);
  });

  it('splits WACV 2027 into two thin rows (the rounds overlap) with the rounds named', () => {
    const lane = laneOf(series('wacv'), AXIS, NOW);
    expect(lane.rows).toBe(2);
    expect(lane.segs.map((s) => [s.label, s.short, s.row])).toEqual([
      ['2027 一轮', '一轮', 0],
      ['2027 二轮', '二轮', 1],
    ]);
    expect(lane.segs[0]!.x1).toBe(lane.segs[1]!.x1);
  });

  it('keeps KDD on one row: 2027 一轮 (in review on 9/25), 2027 二轮, then 2028 一轮, each round to its own result', () => {
    const lane = laneOf(series('kdd'), AXIS, NOW);
    expect(lane.rows).toBe(1);
    expect(lane.segs.map((s) => [s.edition, s.label, s.short, s.row])).toEqual([
      ['kdd-2027', '2027 一轮', '一轮', 0],
      ['kdd-2027', '2027 二轮', '二轮', 0],
      ['kdd-2028', '2028 一轮', '一轮', 0],
    ]);
    const [r1, r2] = lane.segs;
    expect(r1!.x1).toBeCloseTo(xOfDay('2026-11-14', AXIS), 6);
    expect(r1!.x0).toBeLessThan(xOfMs(NOW, AXIS));
    expect(r2!.x1).toBeCloseTo(xOfDay('2027-05-16', AXIS), 6);
    expect(lane.dots).toEqual([expect.objectContaining({ edition: 'kdd-2027', row: 0 })]);
  });

  it('draws NAACL 2027 from the ARR deadline (10/13) to 2/10 with a commitment tick on 12/24', () => {
    const { segs } = laneMarks(NAACL27, AXIS, NOW);
    expect(segs).toHaveLength(1);
    expect(segs[0]!.label).toBe('ARR 10 月轮');
    expect(segs[0]!.x0).toBeCloseTo(xOfDay('2026-10-13', AXIS), 6);
    expect(segs[0]!.x1).toBeCloseTo(xOfDay('2027-02-10', AXIS), 6);
    expect(segs[0]!.ticks).toEqual([xOfDay('2026-12-24', AXIS)]);
    expect(arrCycleName(m('paper', '2027-01-05T23:59'))).toBe('ARR 1 月轮');
  });

  it('fades a bar whose result is not published, ending at the last known step', () => {
    const e = ed('x-2027', 'X 2027', [m('paper', '2026-11-01T23:59', C), m('reviews_out', '2027-01-10', C), tba('notification')]);
    const [s] = laneMarks(e, AXIS, NOW).segs;
    expect(s).toMatchObject({ fade: true });
    expect(s!.x1).toBeCloseTo(xOfDay('2027-01-10', AXIS), 6);
  });

  it('packs rows first-fit, and a dot follows its own edition', () => {
    const seg = (edition: string, x0: number, x1: number): Seg => ({ edition, x0, x1, label: '', est: false, fade: false, past: x0, ticks: [], row: 0, aria: '' });
    const segs = [seg('a', 0, 100), seg('b', 50, 120), seg('c', 110, 200)];
    const dots: Dot[] = [{ edition: 'b', x: 300, est: false, past: false, row: 0 }];
    expect(packRows(segs, dots)).toBe(2);
    expect(segs.map((s) => s.row)).toEqual([0, 1, 0]);
    expect(dots[0]!.row).toBe(1);
  });

  it('opens the nearest edition for a tap between bars', () => {
    const lane = { spans: [{ edition: 'iclr-2027', from: 180, to: 570 }, { edition: 'iclr-2028', from: 810, to: 960 }] };
    expect(nearestAt(lane, 600)).toBe('iclr-2027');
    expect(nearestAt(lane, 780)).toBe('iclr-2028');
    expect(nearestAt({ spans: [], open: 'x' }, 10)).toBe('x');
  });
});

describe('colour slots', () => {
  it('hands out slots in follow order, keeps them when reordered, greys the 9th', () => {
    const first = laneColors({}, ['neurips', 'iclr', 'icml']);
    expect(first).toEqual({ neurips: 1, iclr: 2, icml: 3 });
    expect(laneColors(first, ['icml', 'neurips', 'iclr'])).toEqual({ icml: 3, neurips: 1, iclr: 2 });
    const nine = laneColors({}, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(nine.h).toBe(8);
    expect(nine.i).toBe(0);
  });

  it('frees the slot of a venue no longer followed for the next new one', () => {
    expect(laneColors({ neurips: 1, iclr: 2, icml: 3 }, ['iclr', 'icml', 'acl'])).toEqual({ iclr: 2, icml: 3, acl: 1 });
  });
});

describe('the zoomed phase bar', () => {
  it('ICLR 2027: cuts the gap to the conference with ≈, keeps tba steps for the list, shows 兼审稿 and today', () => {
    const bar = phaseBands(ICLR27, NOW, 280);
    expect(bar.cut).toBe(true);
    expect(bar.tba).toBe(1);
    expect(bar.rows).toHaveLength(1);
    const marks = bar.rows[0]!.marks;
    expect(marks.map((x) => [x.name, x.kind])).toEqual([
      ['摘要', 'submit'],
      ['正文', 'submit'],
      ['出审稿', 'announce'],
      ['讨论', 'reply'],
      ['出结果', 'announce'],
    ]);
    expect(marks[0]!.past).toBe(true);
    expect(marks[1]!.past).toBe(false);
    expect(marks.find((x) => x.type === 'camera_ready')).toBeUndefined();
    expect(bar.review).toMatchObject({ est: true, past: false });
    expect(bar.today).toBeGreaterThan(marks[0]!.x0);
    expect(bar.today).toBeLessThan(marks[1]!.x0);
    expect(bar.conf).toMatchObject({ month: '4月', est: false });
    // The first ▲ has its month: the scale starts on 9/15, labelled 9月 at the left edge.
    expect(bar.ticks[0]).toEqual({ x: 0, label: '9月' });
    expect(bar.ticks[1]!.label).toBe('10月');
    expect(marks.filter((x) => x.next).map((x) => x.name)).toEqual(['正文']);
    expect(bar.rows[0]!.base).toEqual([marks[0]!.x0, marks.at(-1)!.x0]);
    // Every mark gets a label line or none; 正文 right after 摘要 drops to the second line.
    expect(marks[1]!.line).toBe(1);
  });

  it('WACV 2027: one row per round, the shared result and camera-ready on both', () => {
    expect(roundsOf(WACV27)).toEqual([1, 2]);
    const bar = phaseBands(WACV27, NOW, 280);
    expect(bar.rows.map((r) => r.title)).toEqual(['一轮', '二轮']);
    for (const r of bar.rows) expect(r.marks.filter((x) => x.type === 'notification' || x.type === 'camera_ready')).toHaveLength(2);
    // The Round 1 revision is a deadline (▲), named as one.
    expect(bar.rows[0]!.marks.find((x) => x.type === 'author_response')).toMatchObject({ kind: 'submit', name: '修改稿' });
    expect(bar.rows[1]!.marks.map((x) => x.name)).not.toContain('初审');
    // The shared result on 10/9 is the next step, on both rows.
    for (const r of bar.rows) expect(r.marks.filter((x) => x.next).map((x) => x.type)).toEqual(['notification']);
  });

  it('NAACL 2027: ARR review and venue acceptance rows meet at commit', () => {
    const bar = phaseBands(NAACL27, NOW, 280);
    expect(bar.rows.map((r) => r.title)).toEqual(['ARR 审稿（10 月轮）', '会议录用']);
    expect(bar.rows[0]!.marks.map((x) => x.name)).toEqual(['投稿', '回复', 'AC 意见', '提交会议']);
    expect(bar.rows[1]!.marks.map((x) => x.name)).toEqual(['提交会议', '出结果', '终稿']);
    expect(bar.today).toBeUndefined();
    // The scale starts in October: its left edge is labelled 10月.
    expect(bar.ticks[0]).toEqual({ x: 0, label: '10月' });
    expect(bar.rows[0]!.marks[0]!.next).toBe(true);
  });

  it('keeps the conference on the scale when it follows within six weeks', () => {
    const e = ed('y-2026', 'Y 2026', [m('paper', '2026-10-01T23:59', C), m('notification', '2026-11-01', C), conf('2026-11-20', '2026-11-22', C)]);
    const bar = phaseBands(e, NOW, 280);
    expect(bar.cut).toBe(false);
    expect(bar.conf!.x1).toBeLessThanOrEqual(1);
    expect(bar.conf!.x0).toBeGreaterThan(bar.rows[0]!.marks.at(-1)!.x0);
  });

  it('KDD 2027: a row per round, the 一轮 rebuttal is next; the list runs in time order with 待公布 before the conference', () => {
    expect(roundsOf(KDD27)).toEqual([1, 2]);
    const bar = phaseBands(KDD27, NOW, 254);
    expect(bar.rows.map((r) => r.title)).toEqual(['一轮', '二轮']);
    expect(bar.rows[0]!.marks.find((x) => x.next)).toMatchObject({ type: 'author_response', kind: 'reply' });
    const order = listOrder(KDD27.milestones).map((x) => x.label_zh ?? x.type);
    expect(order).toEqual([
      '第一轮摘要截止',
      '第一轮正文截止',
      '第一轮 rebuttal',
      '第一轮出结果',
      '2 月轮（第二轮）摘要截止',
      '2 月轮（第二轮）正文截止',
      '2 月轮（第二轮）rebuttal',
      '2 月轮（第二轮）出结果',
      'author_registration',
      'conference',
    ]);
  });

  it('names what the author does at each step', () => {
    expect(phaseKind(m('author_response', '2026-08-28T23:59'))).toBe('submit');
    expect(phaseKind(win('author_response', '2026-11-24', '2026-11-30'))).toBe('reply');
    expect(phaseKind(win('meta_reviews', '2026-11-19', '2026-12-16'))).toBe('wait');
    expect(phaseKind(m('meta_reviews', '2026-12-18'))).toBe('announce');
    expect(phaseKind(m('profile_deadline', '2026-11-01'))).toBeUndefined();
    expect(listKind(m('profile_deadline', '2026-11-01'))).toBe('submit');
    expect(listKind(tba('discussion'))).toBe('reply');
    expect(listKind(tba('camera_ready'))).toBe('submit');
    expect(roundOf(m('paper', '2027-02-08', 'estimated', '2 月轮（第二轮）正文截止'))).toBe(2);
    expect(roundOf(m('notification', '2026-10-09', C, '最终结果（Round 1 修改稿与 Round 2 新投稿）'))).toBe(0);
  });
});

describe('the route, small (§11.5)', () => {
  it('draws the owner example ICML 2027 → NeurIPS 2027 → ICLR 2028 from today, with ⚠ on ICLR 2028', () => {
    const route = targetRoute({ targets: ['neurips', 'iclr', 'icml'], editions: ALL, now: NOW });
    expect(route.stops.map((s) => s.entry.edition.id)).toEqual(['icml-2027', 'neurips-2027', 'iclr-2028']);
    const mini = miniRoute(route.stops, NOW);
    expect(mini.rows.map((r) => [r.series, r.warn])).toEqual([
      ['icml', false],
      ['neurips', false],
      ['iclr', true],
    ]);
    for (let i = 1; i < mini.rows.length; i++) expect(mini.rows[i]!.x0).toBeGreaterThan(mini.rows[i - 1]!.x0);
    expect(mini.rows.at(-1)!.x1).toBeLessThan(1);
    expect(mini.rows[0]!.pre).toBeLessThan(mini.rows[0]!.x0);
    expect(mini.ticks.map((t) => t.label)).toEqual(['12月', '3月', '6月', '9月', '12月']);
  });
});
