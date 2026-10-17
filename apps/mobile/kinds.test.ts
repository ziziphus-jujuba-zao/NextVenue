// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Two kinds of venue the lists treat differently (docs/MOBILE_SPEC.md §12):
// abstract-only meetings (submission_type abstract: AACR, SfN, EGU), whose
// key dates are 摘要截止, 摘要结果, 优惠注册截止 and 会议举办; and upstream
// editions (dates from ccfddl), which the page ships slim and the app marks
// 未核对. Editions follow data/editions/aacr-2027.yml and a ccfddl record.

import { BEIJING, formatIn, toInstant } from '@nextvenue/core';
import { describe, expect, it } from 'vitest';
import {
  UPSTREAM_NOTE,
  UPSTREAM_TAG,
  TZ_ASSUMED,
  beijingOf,
  fmtOfficial,
  isAction,
  isLateAbstract,
  isAnnouncement,
  milestoneName,
  milestoneShort,
  officialWord,
  prepareEditions,
  shownBeforeAccept,
  tbaMilestones,
  upcoming,
} from './logic.ts';
import { entriesOf, firstStepText, gapAfter, gapParts, nextOpenEntry, resultWord, seriesCatalog, stopParts, targetRoute } from './route.ts';
import { laneMarks, axisOf, phaseBands, phaseName } from './timeline.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

const NOW = Date.parse('2026-09-25T21:00:00+08:00');
const ET = 'America/New_York';

function rt(local: string, tz: string): ResolvedTime {
  const i = toInstant(local, tz);
  return { local, tz, utc: i.toISOString().replace(/\.\d{3}Z$/, 'Z'), beijing: formatIn(i, BEIJING) };
}
const at = (type: string, local: string, tz = ET, extra: Partial<AppMilestone> = {}): AppMilestone => ({ type, tz, status: 'confirmed', at_resolved: rt(local, tz), ...extra });
const span = (type: string, a: string, b: string, tz = ET, extra: Partial<AppMilestone> = {}): AppMilestone => ({
  type,
  tz,
  status: 'confirmed',
  start_resolved: rt(a, tz),
  end_resolved: rt(b, tz),
  ...extra,
});

/** AACR 2027 as in the data: abstracts 11/10 23:59 ET, late-breaking 12/1–1/6, results 12/21, early registration 12/7, meeting 4/2–4/7. */
function aacr(): AppEdition {
  return prepareEditions([
    {
      id: 'aacr-2027',
      series: 'aacr',
      name: 'AACR 2027',
      year: 2027,
      kind: 'conference',
      directions: ['life/cellmol', 'med/oncology'],
      submission_type: 'abstract',
      last_checked: '2026-09-25',
      milestones: [
        at('abstract', '2026-11-10T23:59'),
        at('financial_aid', '2026-11-10'),
        at('early_registration', '2026-12-07'),
        at('notification', '2026-12-21'),
        span('abstract', '2026-12-01', '2027-01-06T23:59', ET, { label_zh: '晚到摘要截止' }),
        span('conference', '2027-04-02', '2027-04-07', 'America/New_York'),
      ],
    },
  ])[0]!;
}

/** The same shape as a full-paper venue: early registration stays on the accepted paper's checklist. */
function fullPaper(): AppEdition {
  return prepareEditions([
    {
      id: 'acc-2027',
      series: 'acc',
      name: 'ACC 2027',
      year: 2027,
      kind: 'conference',
      directions: ['eng/control'],
      submission_type: 'full_paper',
      last_checked: '2026-09-25',
      milestones: [at('paper', '2026-10-01'), at('early_registration', '2027-04-01'), at('notification', '2027-02-15'), span('conference', '2027-07-07', '2027-07-09')],
    },
  ])[0]!;
}

describe('an abstract-only meeting (AACR 2027)', () => {
  const ed = aacr();

  it('lists 摘要截止, 摘要结果, 优惠注册截止 and 会议举办; other after-acceptance steps stay on the checklist', () => {
    const items = upcoming([ed], NOW).map((i) => milestoneShort(i.milestone));
    // One 摘要截止: the late-breaking call is not a deadline to submit to (§12.3), so 下一步 never lists it.
    expect(items).toEqual(['摘要截止', '优惠注册截止', '摘要结果', '会议举办']);
    expect(isLateAbstract(ed, ed.milestones[4]!)).toBe(true);
    expect(isLateAbstract(ed, ed.milestones[0]!)).toBe(false);
    expect(milestoneName(ed.milestones[4]!)).toBe('晚到摘要截止');
    expect(milestoneShort(ed.milestones[4]!)).toBe('晚到摘要截止');
    expect(shownBeforeAccept(ed, { type: 'early_registration' })).toBe(true);
    expect(shownBeforeAccept(ed, { type: 'financial_aid' })).toBe(false);
    // Registering is something to do (not 无需操作); the result is an announcement.
    expect(isAction(ed.milestones[2]!)).toBe(true);
    expect(isAnnouncement(ed.milestones[3]!)).toBe(true);
  });

  it('keeps a full-paper venue as it was: early registration only after acceptance', () => {
    const acc = fullPaper();
    expect(upcoming([acc], NOW).map((i) => i.milestone.type)).toEqual(['paper', 'notification', 'conference']);
    expect(acc.milestones.find((m) => m.type === 'notification')!.label_zh).toBeUndefined();
    expect(tbaMilestones([acc])).toEqual([]);
  });

  it('is entered through its first abstract deadline, never the late-breaking call', () => {
    const es = entriesOf(ed);
    expect(es).toHaveLength(1);
    expect(es[0]!.paper.type).toBe('abstract');
    expect(es[0]!.pre).toBeUndefined();
    expect(es[0]!.result?.type).toBe('notification');
    const s = seriesCatalog([ed])[0]!;
    expect(firstStepText(nextOpenEntry(s, NOW)!, NOW)).toBe('摘要 11/11');
    // After 11/10 ET nothing is open: the late-breaking window is not a way in.
    expect(nextOpenEntry(s, Date.parse('2026-11-12T00:00:00+08:00'))).toBeUndefined();
  });

  it('words the route in abstracts: 摘要截止, 出摘要结果, 交摘要', () => {
    const e = entriesOf(ed)[0]!;
    expect(stopParts(e)).toEqual(['摘要截止 11/11 周三 12:59']);
    expect(resultWord(ed)).toBe('出摘要结果');
    expect(resultWord(fullPaper())).toBe('出结果');
    const route = targetRoute({ targets: ['aacr'], editions: [ed], now: NOW });
    expect(route.stops.map((x) => x.entry.edition.id)).toEqual(['aacr-2027']);
    // Days from the ACC result (2/15) to a later abstract deadline read "交摘要".
    const next = { ...e, paperAt: rt('2027-03-01T23:59', ET), paperT: { ms: Date.parse(rt('2027-03-01T23:59', ET).utc), date: '2027-03-02', precise: true } };
    const g = gapAfter(entriesOf(fullPaper())[0]!, next)!;
    expect(gapParts(g, next)[0]).toMatch(/天后交摘要$/);
  });

  it('draws the phase bar and the lane from the abstract to 摘要结果', () => {
    const bar = phaseBands(ed, NOW, 280);
    const names = bar.rows.flatMap((r) => r.marks.map((m) => m.name));
    expect(names).toContain('摘要结果');
    expect(names).not.toContain('出结果');
    // One "摘要" under the bar: the late window is drawn without a name of its own; early registration is a ▲ named 注册.
    const labelled = bar.rows.flatMap((r) => r.marks.filter((m) => m.line !== undefined).map((m) => m.name));
    expect(labelled.filter((n) => n === '摘要')).toHaveLength(1);
    expect(names).toContain('注册');
    expect(bar.rows[0]!.marks.find((m) => m.type === 'early_registration')?.kind).toBe('submit');
    expect(phaseName({ type: 'notification', tz: ET, status: 'confirmed' }, false, true)).toBe('摘要结果');
    const lane = laneMarks(ed, axisOf(NOW), NOW);
    expect(lane.segs).toHaveLength(1);
    expect(lane.segs[0]!.aria).toBe('AACR 2027，摘要截止 11/11 周三 12:59，12/21 出摘要结果，2027/4/2–4/7 开会');
  });
});

describe('an edition whose only deadlines are abstracts, type not written (ADA 2027)', () => {
  const ada = prepareEditions([
    {
      id: 'ada-2027',
      series: 'ada',
      name: 'ADA 2027',
      year: 2027,
      kind: 'conference',
      directions: ['med/metabolic'],
      last_checked: '2026-09-25',
      milestones: [
        span('abstract', '2026-09-28', '2027-01-05', 'Asia/Shanghai', { tz_assumed: true }),
        span('abstract', '2027-01-25', '2027-03-08', 'Asia/Shanghai', { tz_assumed: true, label_zh: '晚到摘要截止' }),
        span('conference', '2027-06-18', '2027-06-21'),
      ],
    },
  ])[0]!;

  it('is entered through its first abstract deadline; the late-breaking call is not listed as one', () => {
    const es = entriesOf(ada);
    expect(es).toHaveLength(1);
    expect(es[0]!.paper.type).toBe('abstract');
    expect(firstStepText(nextOpenEntry(seriesCatalog([ada])[0]!, NOW)!, NOW)).toBe('摘要 2027/1/5');
    expect(isLateAbstract(ada, ada.milestones[1]!)).toBe(true);
    expect(upcoming([ada], NOW).map((i) => milestoneShort(i.milestone))).toEqual(['摘要截止', '会议举办']);
  });
});

describe('a date the venue gave without a time zone', () => {
  // ACC 2027's paper deadline: the site gives the day only; the app counts it in Beijing time (DATA_GUIDE §7.1).
  const m = at('paper', '2026-10-02', 'Asia/Shanghai', { tz_assumed: true });
  it('is never passed off as the venue\'s wording', () => {
    expect(fmtOfficial(m)).toBe('10/2（没写时区，按北京时间算）');
    expect(fmtOfficial(m)).not.toMatch(/ 北京时间$/);
    expect(TZ_ASSUMED).toBe('没写时区，按北京时间算');
    // A zone the venue did write reads as before.
    expect(fmtOfficial(at('paper', '2026-10-02T23:59', 'AoE'))).toBe('10/2 23:59 AoE');
  });
});

describe('an upstream edition (ccfddl), shipped slim', () => {
  // As the page carries it (scripts/app-data.ts slimEditions): times without zone or Beijing time,
  // milestones without the upstream flag or the venue link.
  const slim = (): AppEdition =>
    ({
      id: 'eurographics-2027',
      series: 'eurographics',
      name: 'Eurographics 2027',
      year: 2027,
      kind: 'conference',
      directions: ['cs/graphics'],
      data_level: 'upstream',
      upstream: { source: 'ccfddl', link: 'https://eg2027.example.org/' },
      last_checked: '2026-09-25',
      milestones: [
        { type: 'abstract', tz: 'UTC', status: 'confirmed', at_resolved: { local: '2026-09-25T23:59', utc: '2026-09-25T23:59:00Z' } },
        { type: 'paper', tz: 'UTC', status: 'confirmed', at_resolved: { local: '2026-10-01T23:59', utc: '2026-10-01T23:59:00Z' } },
        { type: 'conference', tz: 'UTC', status: 'tba' },
      ],
    }) as unknown as AppEdition;

  it('gets its zone, Beijing time, 未核对 flag and venue link back at start-up', () => {
    const ed = prepareEditions([slim()])[0]!;
    const paper = ed.milestones[1]!;
    expect(paper.at_resolved).toEqual({ local: '2026-10-01T23:59', utc: '2026-10-01T23:59:00Z', tz: 'UTC', beijing: '2026-10-02 07:59' });
    expect(paper.upstream).toBe(true);
    expect(paper.deep_link).toBe('https://eg2027.example.org/');
    expect(ed.milestones.every((m) => m.upstream)).toBe(true);
    expect(beijingOf('2026-09-26T11:59:00Z')).toBe('2026-09-26 19:59');
  });

  it('says where its dates come from, and never as the venue', () => {
    const ed = prepareEditions([slim()])[0]!;
    expect(officialWord(ed)).toBe('ccfddl 写法');
    expect(officialWord(aacr())).toBe('官网写法');
    expect(UPSTREAM_TAG).toBe('未核对');
    expect(UPSTREAM_NOTE).toBe('数据来自 ccfddl · 未逐条核对官网');
    // Curated editions stay unmarked.
    expect(aacr().milestones.some((m) => m.upstream)).toBe(false);
  });

  it('leaves full data as it is (tests and old pages carry every field)', () => {
    const ed = aacr();
    const again = prepareEditions([structuredClone(ed)])[0]!;
    expect(again).toEqual(ed);
  });
});
