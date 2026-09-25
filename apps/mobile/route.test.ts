// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// The submission route (docs/MOBILE_SPEC.md §9.5) on editions copied from
// data/editions as of 2026-09-25, so the cases stay realistic but do not
// move when an estimate is replaced by the official date.

import { BEIJING, formatIn, toInstant } from '@nextvenue/core';
import { describe, expect, it } from 'vitest';
import {
  canFollow,
  canMove,
  cleanPrefs,
  closedToNew,
  daysUntil,
  defaultPrefs,
  directionsOf,
  entriesOf,
  gapAfter,
  gapText,
  inReview,
  migrateFollows,
  movePick,
  nearestEdition,
  nextOpenEntry,
  parsePrefsParam,
  planRoute,
  prefsForPaper,
  rankOf,
  routeDay,
  seriesCatalog,
  started,
  stopLine,
  togglePick,
  yearCtx,
  type Prefs,
  type Route,
} from './route.ts';
import type { AppEdition, AppMilestone, ResolvedTime } from './types.ts';

const NOW = Date.parse('2026-09-25T21:00:00+08:00');

function rt(local: string, tz: string): ResolvedTime {
  const i = toInstant(local, tz);
  return { local, tz, utc: i.toISOString().replace(/\.\d{3}Z$/, 'Z'), beijing: formatIn(i, BEIJING) };
}

type Status = AppMilestone['status'];

/** A deadline or result: "2027-05-06T23:59" or a date. */
function m(type: string, local: string, status: Status = 'estimated', tz = 'AoE', label_zh?: string): AppMilestone {
  return { type, tz, status, label_zh, at_resolved: rt(local, tz) };
}

function conf(start: string, end: string, status: Status = 'estimated', tz = 'AoE'): AppMilestone {
  return { type: 'conference', tz, status, start_resolved: rt(start, tz), end_resolved: rt(end, tz) };
}

function ed(id: string, name: string, topics: string[], milestones: AppMilestone[], kind: AppEdition['kind'] = 'conference'): AppEdition {
  return { id, series: id.split('-')[0]!, name, year: Number(/\d{4}/.exec(name)?.[0] ?? 2027), kind, topics, last_checked: '2026-09-25', milestones };
}

const PT = 'America/Los_Angeles';
const C: Status = 'confirmed';

const EDITIONS: AppEdition[] = [
  ed('iclr-2027', 'ICLR 2027', ['ml', 'ai'], [
    m('abstract', '2026-09-18T23:59', C),
    m('paper', '2026-09-25T23:59', C),
    m('notification', '2026-12-16', C),
    conf('2027-04-26', '2027-04-30', C, PT),
  ]),
  ed('iclr-2028', 'ICLR 2028', ['ml', 'ai'], [
    m('abstract', '2027-09-18T23:59'),
    m('paper', '2027-09-25T23:59'),
    m('notification', '2027-12-16'),
    conf('2028-04-26', '2028-04-30'),
  ]),
  ed('icml-2027', 'ICML 2027', ['ml', 'ai'], [
    m('abstract', '2027-01-23T23:59'),
    m('paper', '2027-01-28T23:59'),
    m('notification', '2027-04-30'),
    conf('2027-07-06', '2027-07-11'),
  ]),
  ed('neurips-2027', 'NeurIPS 2027', ['ml', 'ai'], [
    m('abstract', '2027-05-04T23:59'),
    m('paper', '2027-05-06T23:59'),
    m('notification', '2027-09-24'),
    conf('2027-12-06', '2027-12-12'),
  ]),
  ed('acl-2027', 'ACL 2027', ['nlp'], [
    m('paper', '2027-01-05T23:59', 'estimated', 'AoE', 'ARR 投稿截止（2027 年 1 月轮）'),
    m('notification', '2027-04-04'),
    conf('2027-08-17', '2027-08-22', C, 'Asia/Tokyo'),
  ]),
  ed('emnlp-2027', 'EMNLP 2027', ['nlp'], [
    m('paper', '2027-05-25T23:59'),
    m('notification', '2027-08-20'),
    conf('2027-10-24', '2027-10-29'),
  ]),
  ed('naacl-2027', 'NAACL 2027', ['nlp'], [
    m('paper', '2026-10-12T23:59', C),
    m('notification', '2027-02-10', C),
    conf('2027-06-01', '2027-06-05', C, PT),
  ]),
  ed('colm-2027', 'COLM 2027', ['nlp', 'ml'], [
    m('abstract', '2027-03-26T23:59'),
    m('paper', '2027-03-31T23:59'),
    m('notification', '2027-07-08'),
    conf('2027-10-06', '2027-10-09'),
  ]),
  ed('arr-2026-10', 'ARR 2026 年 10 月轮', ['nlp'], [m('paper', '2026-10-12T23:59', C), m('notification', '2027-02-10', C)], 'arr_cycle'),
  ed('icra-2027', 'ICRA 2027', ['robotics'], [
    m('paper', '2026-09-16T23:59', C, PT),
    m('notification', '2027-01-31', C, PT),
    conf('2027-05-24', '2027-05-28', C, 'Asia/Seoul'),
  ]),
  ed('icra-2028', 'ICRA 2028', ['robotics'], [
    m('paper', '2027-09-15T23:59', 'estimated', PT),
    m('notification', '2028-01-31', 'estimated', PT),
    conf('2028-05-15', '2028-05-19', C, 'America/Sao_Paulo'),
  ]),
  ed('iros-2027', 'IROS 2027', ['robotics'], [
    m('paper', '2027-03-02', 'estimated', PT),
    m('notification', '2027-06-16', 'estimated', PT),
    conf('2027-09-26', '2027-10-01', C, 'Europe/Rome'),
  ]),
  ed('corl-2027', 'CoRL 2027', ['robotics', 'ml'], [
    m('abstract', '2027-05-25T23:59'),
    m('paper', '2027-05-28T23:59'),
    m('notification', '2027-09-04'),
    conf('2027-11-09', '2027-11-12'),
  ]),
  ed('rss-2027', 'RSS 2027', ['robotics'], [
    m('abstract', '2027-01-23T23:59'),
    m('paper', '2027-01-30T23:59'),
    m('notification', '2027-04-27T23:59'),
    conf('2027-07-06', '2027-07-11', C, 'Europe/Athens'),
  ]),
  ed('cvpr-2027', 'CVPR 2027', ['cv'], [
    m('paper_registration', '2026-11-10T23:59', C),
    m('paper', '2026-11-16T23:59', C),
    m('notification', '2027-02-25', C),
    conf('2027-06-20', '2027-06-25', C, PT),
  ]),
  ed('iccv-2027', 'ICCV 2027', ['cv'], [
    m('paper_registration', '2027-03-03T23:59'),
    m('paper', '2027-03-07T23:59'),
    m('notification', '2027-06-25'),
    conf('2027-10-02', '2027-10-08', C, 'Asia/Hong_Kong'),
  ]),
  ed('cvpr-2028', 'CVPR 2028', ['cv'], [
    m('paper_registration', '2027-11-10T23:59'),
    m('paper', '2027-11-16T23:59'),
    m('notification', '2028-02-25'),
    conf('2028-06-20', '2028-06-25'),
  ]),
  ed('eccv-2028', 'ECCV 2028', ['cv'], [
    m('paper_registration', '2028-02-26T22:00', 'estimated', 'UTC'),
    m('paper', '2028-03-05T22:00', 'estimated', 'UTC'),
    m('notification', '2028-06-17'),
    conf('2028-09-08', '2028-09-12'),
  ]),
  ed('wacv-2028', 'WACV 2028', ['cv'], [
    m('paper_registration', '2027-06-19T23:59', 'estimated', 'AoE', 'Round 1 论文注册'),
    m('paper', '2027-06-26T23:59', 'estimated', 'AoE', 'Round 1 正文'),
    m('paper_registration', '2027-08-21T23:59', 'estimated', 'AoE', 'Round 2 新论文注册'),
    m('paper', '2027-08-28T23:59', 'estimated', 'AoE', 'Round 2 正文'),
    m('notification', '2027-10-09'),
    conf('2028-01-04', '2028-01-08'),
  ]),
];

const ids = (r: Route) => r.stops.map((s) => s.entry.edition.id);
const OWNER: Prefs = { first: ['neurips', 'iclr', 'icml'], backup: ['acl', 'emnlp'] };
const plan = (prefs: Prefs, extra: { now?: number; current?: string; prepDays?: number; abstractFirst?: boolean } = {}) =>
  planRoute({ prefs, editions: EDITIONS, now: extra.now ?? NOW, current: extra.current, prepDays: extra.prepDays, abstractFirst: extra.abstractFirst });
const edition = (id: string) => EDITIONS.find((e) => e.id === id)!;

describe("the owner's example: 首选 NeurIPS, ICLR, ICML; 备选 ACL, EMNLP on 2026-09-25", () => {
  const r = plan(OWNER);

  it('starts with the earliest open 首选 by time, not by rank: ICML 2027', () => {
    expect(ids(r)).toEqual(['icml-2027', 'neurips-2027', 'iclr-2028']);
    expect(r.stops.map((s) => s.pref)).toEqual([
      { tier: 'first', rank: 3 },
      { tier: 'first', rank: 1 },
      { tier: 'first', rank: 2 },
    ]);
  });

  it('shows the days the card prints', () => {
    const [icml, neurips, iclr] = r.stops.map((s) => s.entry);
    expect([routeDay(icml!.paper), routeDay(icml!.result!)]).toEqual(['约 1/29', '约 4/30']);
    expect([routeDay(neurips!.paper), routeDay(neurips!.result!)]).toEqual(['约 5/7', '约 9/24']);
    expect([routeDay(iclr!.pre!), routeDay(iclr!.paper), routeDay(iclr!.result!)]).toEqual(['约 9/19', '约 9/26', '约 12/16']);
  });

  it('shows the abstract first on each stop, with the year once it changes', () => {
    const [icml, neurips, iclr] = r.stops.map((s) => s.entry);
    const ctx = yearCtx(NOW);
    expect(stopLine(icml!, ctx)).toBe('摘要 约 2027/1/24 · 正文 约 1/29');
    expect(stopLine(neurips!, ctx)).toBe('摘要 约 5/5 · 正文 约 5/7');
    expect(stopLine(iclr!, ctx)).toBe('摘要 约 9/19 · 正文 约 9/26');
    expect(stopLine(neurips!)).toContain('摘要 约 5/5');
  });

  it('counts prep days from the result day to the deadline in the deadline’s own zone', () => {
    const [icml, neurips, iclr] = r.stops.map((s) => s.entry);
    // ICML results 4/30 (AoE); NeurIPS abstract 5/4 23:59 AoE, paper 5/6 23:59 AoE.
    expect(daysUntil(icml!.resultAt!, neurips!.preAt!)).toBe(5);
    expect(daysUntil(icml!.resultAt!, neurips!.paperAt)).toBe(7);
    // NeurIPS results 9/24; ICLR 2028 paper 9/25 23:59 AoE.
    expect(daysUntil(neurips!.resultAt!, iclr!.paperAt)).toBe(2);
    expect(daysUntil(neurips!.resultAt!, iclr!.preAt!)).toBe(-5);
    expect(canFollow(neurips!, icml!.resultAt!, 7)).toBe(true);
  });

  it('prints the turnaround of each hop, short when under the prep days', () => {
    const [icml, neurips, iclr] = r.stops.map((s) => s.entry);
    const g1 = gapAfter(icml!, neurips!)!;
    expect(g1).toEqual({ pre: 5, paper: 7, short: false });
    expect(gapText(g1, neurips!)).toBe('没中的话 5 天后交摘要，7 天后交正文');
    const g2 = gapAfter(neurips!, iclr!)!;
    expect(g2).toEqual({ pre: undefined, paper: 2, short: true });
    expect(gapText(g2, iclr!)).toBe('没中的话 2 天后交正文');
  });

  it('with 8 days of prep NeurIPS 2027 is out of reach; ICLR 2028 follows ICML directly', () => {
    expect(ids(plan(OWNER, { prepDays: 8 }))).toEqual(['icml-2027', 'iclr-2028']);
  });

  it('under the strict rule (no 先注册摘要 clause) ICLR 2028 cannot follow NeurIPS', () => {
    expect(ids(plan(OWNER, { abstractFirst: false }))).toEqual(['icml-2027', 'neurips-2027']);
    expect(ids(plan(OWNER, { abstractFirst: false, prepDays: 8 }))).toEqual(['icml-2027', 'iclr-2028']);
  });

  it('warns to register the ICLR 2028 abstract before NeurIPS results', () => {
    expect(r.stops.map((s) => !!s.preFirst)).toEqual([false, false, true]);
  });

  it('lists ICLR 2027 as missed: its abstract closed on 9/18 AoE although the paper deadline is tomorrow', () => {
    expect(r.missed.map((x) => [x.edition.id, x.milestone.type])).toEqual([['iclr-2027', 'abstract']]);
  });

  it('marks the route as estimated, and offers no 备选 where no gap is over 120 days', () => {
    expect(r.estimated).toBe(true);
    expect(r.inserts).toEqual([]);
  });

  it('keeps an ICLR 2027 submission as stop ① and continues from its result', () => {
    const cur = plan(OWNER, { current: 'iclr-2027' });
    expect(ids(cur)).toEqual(['iclr-2027', 'icml-2027', 'neurips-2027', 'iclr-2028']);
    expect(cur.stops[0]!.current).toBe(true);
    expect(cur.missed).toEqual([]);
    // Once the result is out, the submission no longer anchors the route.
    const later = plan(OWNER, { current: 'iclr-2027', now: Date.parse('2026-12-20T12:00:00+08:00') });
    expect(ids(later)).toEqual(['icml-2027', 'neurips-2027', 'iclr-2028']);
  });

  it('stops at four venues and at 15 months', () => {
    expect(plan(OWNER, { current: 'iclr-2027' }).stops).toHaveLength(4);
    // From 2026-06-01 the horizon ends 2027-09-01: ICLR 2028 (9/25) is past it.
    const early = plan(OWNER, { now: Date.parse('2026-06-01T12:00:00+08:00') });
    expect(ids(early)).toEqual(['iclr-2027', 'icml-2027', 'neurips-2027']);
  });
});

describe('an NLP-only user', () => {
  const prefs = defaultPrefs(['nlp'], new Set(seriesCatalog(EDITIONS).map((s) => s.id)));

  it('gets ACL, EMNLP, NAACL as default 首选', () => {
    expect(prefs).toEqual({ first: ['acl', 'emnlp', 'naacl'], backup: [] });
  });

  it('goes NAACL 2027 (ARR October) → EMNLP 2027; ACL 2027 closes before NAACL results', () => {
    const r = plan(prefs);
    expect(ids(r)).toEqual(['naacl-2027', 'emnlp-2027']);
    expect(r.stops[0]!.entry.estimated).toBe(false);
    expect(routeDay(r.stops[0]!.entry.paper)).toBe('10/13 周二 19:59');
    expect(r.missed).toEqual([]);
  });

  it('never routes to an ARR cycle itself', () => {
    expect(plan({ first: ['arr'], backup: [] }).stops).toEqual([]);
  });
});

describe('a robotics user', () => {
  const r = plan({ first: ['icra', 'iros', 'corl'], backup: ['rss'] });

  it('goes IROS 2027 → ICRA 2028; CoRL 2027 closes before IROS results', () => {
    expect(ids(r)).toEqual(['iros-2027', 'icra-2028']);
    // IROS gives dates only (Pacific time): the card keeps the official day.
    expect(routeDay(r.stops[0]!.entry.paper)).toBe('约 3/2');
    expect(routeDay(r.stops[1]!.entry.paper)).toBe('约 9/16');
  });

  it('lists ICRA 2027 (9/16 Pacific) as missed', () => {
    expect(r.missed.map((x) => [x.edition.id, x.milestone.type])).toEqual([['icra-2027', 'paper']]);
  });

  it('offers no 备选 when the gap is under 120 days (6/23 → 9/16)', () => {
    expect(r.inserts).toEqual([]);
  });
});

describe('备选可插入', () => {
  const cv: Prefs = { first: ['cvpr', 'iccv', 'eccv'], backup: ['wacv'] };
  const r = plan(cv);

  it('fits WACV 2028 Round 2 into the 138 days between ICCV 2027 results and CVPR 2028', () => {
    expect(ids(r)).toEqual(['cvpr-2027', 'iccv-2027', 'cvpr-2028']);
    expect(r.inserts).toHaveLength(1);
    const x = r.inserts[0]!;
    expect(x.after).toBe(1);
    expect(x.entry.edition.id).toBe('wacv-2028');
    // Round 1 (6/26) is 2 days after ICCV results; Round 2 (8/28) is the one that fits.
    expect(x.entry.round).toBe(2);
    expect(x.pref).toEqual({ tier: 'backup', rank: 4 });
  });

  it('needs the 备选 result before the next deadline', () => {
    const late = EDITIONS.map((e) =>
      e.id === 'wacv-2028' ? { ...e, milestones: e.milestones.map((x) => (x.type === 'notification' ? m('notification', '2027-11-20') : x)) } : e,
    );
    expect(planRoute({ prefs: cv, editions: late, now: NOW }).inserts).toEqual([]);
  });

  it('only fills gaps over 120 days', () => {
    // The ICML → NeurIPS → ICLR route has no such gap; ACL and EMNLP stay out.
    expect(plan(OWNER).inserts).toEqual([]);
    // Without NeurIPS, ICML results (4/30) to ICLR 2028 (9/26) is 149 days: EMNLP 2027 fits (5/26 → 8/20).
    const r2 = plan({ first: ['iclr', 'icml'], backup: ['acl', 'emnlp'] });
    expect(ids(r2)).toEqual(['icml-2027', 'iclr-2028']);
    expect(r2.inserts.map((x) => [x.after, x.entry.edition.id])).toEqual([[0, 'emnlp-2027']]);
  });

  it('takes the better-ranked 备选 when several fit', () => {
    const r2 = plan({ first: ['iclr', 'icml'], backup: ['colm', 'emnlp'] });
    // COLM (3/31) is before ICML results, so only EMNLP fits even though COLM ranks higher.
    expect(r2.inserts.map((x) => x.entry.edition.id)).toEqual(['emnlp-2027']);
    const r3 = plan({ first: ['iclr', 'icml'], backup: ['emnlp', 'corl'] });
    expect(r3.inserts.map((x) => x.entry.edition.id)).toEqual(['emnlp-2027']);
  });
});

describe('摘要提醒', () => {
  it('fires when the abstract closes before the previous result and the paper deadline is after it', () => {
    const r = plan({ first: ['neurips', 'iclr'], backup: [] });
    expect(ids(r)).toEqual(['neurips-2027', 'iclr-2028']);
    expect(r.stops[1]!.preFirst).toBe(true);
    // NeurIPS results 9/24; ICLR 2028 abstract 9/19 (Beijing), paper 9/26.
    const [neurips, iclr] = r.stops.map((s) => s.entry);
    expect(neurips!.resultT!.date).toBe('2027-09-24');
    expect([iclr!.preT!.date, iclr!.paperT.date]).toEqual(['2027-09-19', '2027-09-26']);
  });

  it('does not fire when the abstract is after the result', () => {
    const r = plan(OWNER);
    // NeurIPS abstract 5/5 comes after ICML results 4/30.
    expect(r.stops[1]!.preFirst).toBeFalsy();
  });

  it('does not let a venue whose paper deadline is on the result day follow it', () => {
    const iclr = entriesOf(edition('iclr-2028'))[0]!;
    expect(canFollow(iclr, rt('2027-09-25', 'AoE'), 7)).toBe(false);
    expect(canFollow(iclr, rt('2027-09-24', 'AoE'), 7)).toBe(true);
  });
});

describe('已错过', () => {
  it('shows at most two, the closest miss first, and only while that cycle is under way', () => {
    const r = plan({ first: ['icra', 'iclr', 'cvpr'], backup: [] });
    expect(r.missed.map((x) => x.edition.id)).toEqual(['iclr-2027', 'icra-2027']);
    // After ICLR 2027 results (12/16) it is no longer "this cycle".
    const later = plan({ first: ['iclr', 'icml'], backup: [] }, { now: Date.parse('2026-12-20T12:00:00+08:00') });
    expect(later.missed).toEqual([]);
  });

  it('never counts 备选 venues as missed', () => {
    expect(plan({ first: ['icml'], backup: ['iclr'] }).missed).toEqual([]);
  });

  it('cites the paper deadline once both steps are past', () => {
    const r = plan({ first: ['iclr'], backup: [] }, { now: Date.parse('2026-10-01T12:00:00+08:00') });
    expect(r.missed.map((x) => x.milestone.type)).toEqual(['paper']);
  });
});

describe('lists show one edition per series', () => {
  const iclr = seriesCatalog(EDITIONS).find((s) => s.id === 'iclr')!;
  it('knows ICLR 2027 takes no new papers once its abstract closed; ICLR 2028 is the next one open', () => {
    expect(closedToNew(edition('iclr-2027'), NOW)).toBe(true);
    expect(closedToNew(edition('icml-2027'), NOW)).toBe(false);
    expect(nextOpenEntry(iclr, NOW)?.edition.id).toBe('iclr-2028');
  });
  it('keeps ICLR 2027 until its conference is over, then ICLR 2028', () => {
    expect(nearestEdition(iclr, NOW)?.id).toBe('iclr-2027');
    expect(nearestEdition(iclr, Date.parse('2027-03-01T12:00:00+08:00'))?.id).toBe('iclr-2027');
    expect(nearestEdition(iclr, Date.parse('2027-05-02T12:00:00+08:00'))?.id).toBe('iclr-2028');
  });
  it('names series the way people say them', () => {
    const names = Object.fromEntries(seriesCatalog(EDITIONS).map((s) => [s.id, s.name]));
    expect(names).toMatchObject({ neurips: 'NeurIPS', corl: 'CoRL', iclr: 'ICLR' });
    expect(names.arr).toBeUndefined();
  });
  it('files general-AI topics under 机器学习', () => {
    expect(directionsOf({ ...EDITIONS[0]!, topics: ['ai', 'ml'] })).toEqual(['ml']);
    expect(directionsOf({ ...EDITIONS[0]!, topics: ['robotics', 'ml'] })).toEqual(['ml', 'robotics']);
  });
});

describe('preferences', () => {
  const known = new Set(seriesCatalog(EDITIONS).map((s) => s.id));

  it('reads ?prefs=neurips,iclr,icml|acl,emnlp', () => {
    expect(parsePrefsParam('neurips,iclr,icml|acl,emnlp', known)).toEqual(OWNER);
    expect(parsePrefsParam('NeurIPS,nope,iclr,neurips', known)).toEqual({ first: ['neurips', 'iclr'], backup: [] });
  });

  it('numbers across both tiers', () => {
    expect(rankOf(OWNER, 'icml')).toEqual({ tier: 'first', rank: 3 });
    expect(rankOf(OWNER, 'acl')).toEqual({ tier: 'backup', rank: 4 });
    expect(rankOf(OWNER, 'cvpr')).toBeUndefined();
  });

  it('adds a tapped venue to the end of the current tier and removes it on a second tap', () => {
    const p = togglePick(OWNER, 'colm', 'backup');
    expect(p.backup).toEqual(['acl', 'emnlp', 'colm']);
    expect(togglePick(p, 'colm', 'backup')).toEqual(OWNER);
  });

  it('moves a venue ranked in the other tier instead of removing it', () => {
    expect(togglePick(OWNER, 'iclr', 'backup')).toEqual({ first: ['neurips', 'icml'], backup: ['acl', 'emnlp', 'iclr'] });
    expect(togglePick(OWNER, 'acl', 'first')).toEqual({ first: ['neurips', 'iclr', 'icml', 'acl'], backup: ['emnlp'] });
  });

  it('moves with ↑↓; at the 首选 / 备选 line only the moved venue changes tier', () => {
    expect(movePick(OWNER, 'icml', -1).first).toEqual(['neurips', 'icml', 'iclr']);
    expect(movePick(OWNER, 'icml', 1)).toEqual({ first: ['neurips', 'iclr'], backup: ['icml', 'acl', 'emnlp'] });
    expect(movePick(OWNER, 'acl', -1)).toEqual({ first: ['neurips', 'iclr', 'icml', 'acl'], backup: ['emnlp'] });
    expect(movePick(OWNER, 'neurips', -1)).toBe(OWNER);
    expect(movePick(OWNER, 'emnlp', 1)).toBe(OWNER);
    // Down into an empty 备选 works; the last 首选 stays.
    expect(movePick({ first: ['neurips', 'iclr'], backup: [] }, 'iclr', 1)).toEqual({ first: ['neurips'], backup: ['iclr'] });
    expect(canMove({ first: ['neurips'], backup: [] }, 'neurips', 1)).toBe(false);
  });

  it('prefills 首选 from the first direction only', () => {
    expect(defaultPrefs(['ml', 'nlp'], known)).toEqual({ first: ['neurips', 'iclr', 'icml'], backup: [] });
  });

  it('keeps a new paper on the global preferences unless none of them fits its direction', () => {
    const catalog = seriesCatalog(EDITIONS);
    // An ML paper for the owner keeps ACL and EMNLP as 备选 and follows later changes.
    expect(prefsForPaper(['ml'], OWNER, catalog, known)).toBeUndefined();
    expect(prefsForPaper(['robotics'], OWNER, catalog, known)).toEqual({ first: ['icra', 'iros', 'corl'], backup: [] });
  });

  it('drops unknown or repeated series from stored data', () => {
    expect(cleanPrefs({ first: ['iclr', 'iclr', 42, 'x'], backup: ['iclr', 'acl'] }, known)).toEqual({ first: ['iclr'], backup: ['acl'] });
    expect(cleanPrefs('nonsense', known)).toBeNull();
  });

  it('migrates v0.1 follows: each edition becomes its series, ARR becomes the venue that takes the cycle', () => {
    const { prefs, directions } = migrateFollows(['iclr-2027', 'arr-2026-10', 'cvpr-2027', 'gone-2025'], EDITIONS, NOW);
    // Soonest deadline a new paper can still make first: ICLR's is ICLR 2028 (2027/9/19).
    expect(prefs).toEqual({ first: ['naacl', 'cvpr', 'iclr'], backup: [] });
    expect(directions).toEqual(['ml', 'cv', 'nlp']);
  });
});

describe('正在投', () => {
  it('offers venues with a deadline already past and the result still ahead', () => {
    expect(inReview(EDITIONS, NOW).map((e) => e.edition.id)).toEqual(['iclr-2027', 'icra-2027']);
  });
  it('treats a venue as submitted only once its first step has passed (a migrated CVPR 2027 paper is not)', () => {
    expect(started(edition('cvpr-2027'), NOW)).toBe(false);
    expect(started(edition('iclr-2027'), NOW)).toBe(true);
  });
});
