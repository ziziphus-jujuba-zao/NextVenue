// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The app's wording (apps/mobile/copy.ts) against the real data: overrides
// still match, list labels read as "[label]？[answer]", and the answers a
// user sees on their paper page on 2026-09-24 are the right ones.

import { describe, expect, it } from 'vitest';
import { beijingText, cjkQuotes, dateRefs, lintCopy, staleCopy } from '../apps/mobile/copy.ts';
import { afterPhrases, groupRulesForMilestone, paperRows, prepareEditions } from '../apps/mobile/logic.ts';
import { LEGACY_DIRECTIONS, nearestEdition, planRoute, routeDay, seriesCatalog } from '../apps/mobile/route.ts';
import { search } from '../apps/mobile/taxonomy.ts';
import { appData, shippedData, slimEditions, toAppData } from './app-data.ts';
import { buildBundle } from './bundle.ts';

const bundle = buildBundle();
const data = appData(bundle);
const NOW = Date.parse('2026-09-24T22:30:00+08:00');
const iclr = data.editions.find((e) => e.id === 'iclr-2027')!;
const iclrRules = data.rules.filter((r) => r.edition === 'iclr-2027');
const rule = (id: string) => data.rules.find((r) => r.id === id)!;

describe('app wording over the data', () => {
  it('has no stale overrides and no wording errors', () => {
    expect(staleCopy(toAppData(bundle))).toEqual([]);
    expect(lintCopy(data).errors).toEqual([]);
  });

  it('names the action in list labels, never the answer word', () => {
    for (const r of data.rules) {
      expect(r.short_zh, r.id).toBeTruthy();
      expect(r.short_zh!.length, r.id).toBeLessThanOrEqual(16);
      expect(r.short_zh, r.id).not.toMatch(/^(必须|不能|可以)/);
    }
    expect(rule('iclr-2027/author-quota-20').short_zh).toBe('每人投超 20 篇');
  });

  it('splits ICLR withdrawal into "can I withdraw" and "does it stay private"', () => {
    expect(rule('iclr-2027/withdrawal').answer).toBe('allowed');
    const pub = rule('iclr-2027/withdrawal-public');
    expect(pub.answer).toBe('not_allowed');
    expect(pub.applies?.from).toBe('paper');
    expect(pub.quotes[0]?.text).toMatch(/withdrawn papers/i);
    // It now shows under 正文截止 and on the big card.
    expect(groupRulesForMilestone(iclrRules, 'paper').lockedAfter.map((r) => r.id)).toContain('iclr-2027/withdrawal-public');
    expect(afterPhrases(iclrRules, 'paper')).toContain('撤稿不公开');
    expect(afterPhrases(iclrRules, 'paper')).not.toContain('投别的会');
  });

  it('writes deadlines in Chinese text in Beijing time', () => {
    const refs = dateRefs(data.editions);
    expect(beijingText('正文截止（9/25）后不能改', refs, 'iclr-2027')).toBe('正文截止后不能改');
    expect(beijingText('9/25 AoE（北京时间 9/26 19:59）前', refs, 'iclr-2027')).toBe('9/26 19:59 前');
    expect(rule('cvpr-2027/iclr-overlap-withdraw-deadline').question_zh.length).toBeLessThanOrEqual(40);
  });

  it('puts Chinese phrases in 「」 rather than ASCII quotes; English wording keeps its quotes', () => {
    expect(cjkQuotes('见"有效期"一条')).toBe('见「有效期」一条');
    expect(cjkQuotes('结果 "by 20 Oct 23:59 AoE" 公布。截止后不能改（"YOUR LOCATION"）')).toBe('结果 "by 20 Oct 23:59 AoE" 公布。截止后不能改（"YOUR LOCATION"）');
    expect(cjkQuotes('只有一个 "引号')).toBe('只有一个 "引号');
    const us = data.visa!.regimes.find((r) => r.id === 'us')!;
    expect(JSON.stringify(us)).toContain('见「有效期」一条');
    expect(rule('neurips-2026/substitute-or-virtual').detail_zh).toContain('先看「拒签退注册费」卡');
  });
});

describe('an ICLR paper on 2026-09-24 22:30', () => {
  const rows = paperRows(iclrRules, iclr, NOW);
  const byId = new Map(rows.map((r) => [r.rule.id, r.status]));

  it('never shows a conditional answer as 还可以', () => {
    for (const { rule: r, status } of rows) if (r.answer === 'conditional') expect(status.word, r.id).not.toBe('还可以');
    expect(byId.get('iclr-2027/title-abstract-edit')?.word).toBe('有条件');
  });

  it('shows the private-withdrawal cut-off, 9/26 19:59', () => {
    const s = byId.get('iclr-2027/withdrawal-public');
    expect(s).toMatchObject({ word: '还可以', label: '撤稿不公开' });
    expect(s?.line).toBe('至 9/26 周六 19:59');
  });

  it('shows locks still ahead as open, and caps as a count to check', () => {
    expect(rows.some((r) => r.status.label === '改 PDF' && r.status.word === '还可以')).toBe(true);
    expect(byId.get('iclr-2027/author-quota-20')?.word).toBe('注意');
    for (const { rule: r, status } of rows) if (status.word === '已锁定') expect(r.effect?.kind, r.id).toBe('lock');
  });
});

describe('the route on the shipped data, 2026-09-25 21:00 Beijing', () => {
  const now = Date.parse('2026-09-25T21:00:00+08:00');
  const route = planRoute({ prefs: { first: ['neurips', 'iclr', 'icml'], backup: ['acl', 'emnlp'] }, editions: data.editions, now });

  it("routes the owner's example ICML 2027 → NeurIPS 2027 → ICLR 2028", () => {
    expect(route.stops.map((s) => [s.entry.edition.id, routeDay(s.entry.paper), routeDay(s.entry.result!)])).toEqual([
      ['icml-2027', '约 1/29', '约 4/30'],
      ['neurips-2027', '约 5/7', '约 9/24'],
      ['iclr-2028', '约 9/26', '约 12/16'],
    ]);
    expect(route.stops[2]!.preFirst).toBe(true);
    expect(route.missed.map((m) => m.edition.id)).toEqual(['iclr-2027']);
  });

  it('gives every series with an edition in range exactly one listed edition', () => {
    const catalog = seriesCatalog(data.editions);
    expect(nearestEdition(catalog.find((s) => s.id === 'iclr')!, now)?.id).toBe('iclr-2027');
    for (const s of catalog) expect(s.editions.every((e) => e.series === s.id)).toBe(true);
    // Every conference edition has a taxonomy direction (data/series), and every direction is one
    // the two-level picker offers (学科 → 方向), so every series can be reached from first run.
    const known = new Set(bundle.taxonomy!.disciplines.flatMap((d) => d.directions.map((x) => x.id)));
    for (const s of catalog) {
      for (const e of s.editions) expect(e.directions?.length, e.id).toBeGreaterThan(0);
      expect(s.directions.length, s.id).toBeGreaterThan(0);
      for (const d of s.directions) expect(known.has(d), `${s.id} ${d}`).toBe(true);
    }
    expect(catalog.find((s) => s.id === 'corl')?.directions).toEqual(['cs/robotics', 'cs/ml', 'eng/av']);
    expect(catalog.find((s) => s.id === 'hscc')?.directions).toEqual(['cs/theory', 'eng/control']);
  });
});

describe('directions, rank labels and data level as shipped', () => {
  const ed = (id: string) => data.editions.find((e) => e.id === id)!;

  it('ships the series directions, not the v0.3 topics', () => {
    expect(ed('aaai-27').directions).toEqual(['cs/ml']);
    expect(ed('aaai-27').topics).toBeUndefined();
    expect(ed('corl-2027').directions).toEqual(['cs/robotics', 'cs/ml', 'eng/av']);
  });

  it('maps every v0.3 direction the app still reads (nv.topics, old papers) as the taxonomy does', () => {
    const legacy = Object.fromEntries(
      bundle.taxonomy!.disciplines.flatMap((d) => d.directions.flatMap((x) => (x.legacy ?? []).map((l) => [l, x.id] as const))),
    );
    expect(LEGACY_DIRECTIONS).toEqual(legacy);
  });

  // Labels from the four lists; ccfddl's CORE and THCPL (once imported) follow them, marked upstream.
  const listed = (id: string) => (ed(id).labels ?? []).filter((l) => !l.upstream).map((l) => l.text);

  it('labels from the lists, CCF first; explicit links keep their reason', () => {
    expect(listed('iclr-2027')).toEqual(['CCF A', 'CAAI A']);
    expect(listed('ijcai-2027')[0]).toBe('CCF B');
    // RSS: not in CCF; CAAI only (CAA tiers are not shipped).
    expect(listed('rss-2027')).toEqual(['CAAI A']);
    // HSCC+ICCPS: CCF B through the hand-made link, which says why (the list still names HSCC).
    const hscc = ed('hscc-2027').labels!.find((l) => l.list === 'ccf7')!;
    expect(hscc.text).toBe('CCF B');
    expect(hscc.note_zh).toMatch(/HSCC/);
    expect(ed('iclr-2027').labels!.every((l) => !l.note_zh)).toBe(true);
    for (const e of data.editions) for (const l of e.labels ?? []) if (l.list === 'core' || l.list === 'thcpl') expect(l.upstream, e.id).toBe(true);
    // The lists' licence notes are for the maintainer (docs/RANK_MATCHING.md); the app does not ship them.
    expect(JSON.stringify(data.rank_lists)).not.toMatch(/不得转载/);
  });

  it('marks nothing as upstream in curated data', () => {
    for (const e of data.editions) if (e.data_level !== 'upstream') for (const m of e.milestones) expect(m.upstream, e.id).toBeUndefined();
  });
});

describe('the page as shipped', () => {
  it('leaves out only what start-up puts back (zone, Beijing time, upstream flag and link)', () => {
    const slim = slimEditions(structuredClone(data.editions));
    const t = slim.find((e) => e.id === 'iclr-2027')!.milestones.find((m) => m.type === 'paper')!.at_resolved!;
    expect(Object.keys(t).sort()).toEqual(['local', 'utc']);
    expect(slim.find((e) => e.data_level === 'upstream')!.milestones.every((m) => m.upstream === undefined)).toBe(true);
    // (Start-up also words abstract-only results "摘要结果", with or without the slim step.)
    expect(prepareEditions(slim)).toEqual(prepareEditions(structuredClone(data.editions)));
  });

  it('is smaller for it, and keeps series names for search', () => {
    const shipped = shippedData(bundle);
    expect(JSON.stringify(shipped.editions).length).toBeLessThan(JSON.stringify(data.editions).length * 0.9);
    expect(shipped.series?.find((x) => x.id === 'ccc-control')).toMatchObject({ full_name: 'Chinese Control Conference', name_zh: '中国控制会议' });
    // HSCC's former name is searchable.
    expect(shipped.series?.find((x) => x.id === 'hscc')?.aliases).toContain('HSCC');
  });

  it('ships every series, so every CCF-listed conference can be found, dates or not', () => {
    const shipped = shippedData(bundle);
    const ids = new Set((shipped.series ?? []).map((x) => x.id));
    // Each ccf7 entry is linked to a series (validate enforces it), and each of those series ships.
    const ccf = new Set(bundle.series.filter((x) => x.labels.some((l) => l.list === 'ccf7')).map((x) => x.id));
    expect(ccf.size).toBeGreaterThanOrEqual(386);
    for (const id of ccf) expect(ids.has(id), id).toBe(true);
    // A series with no edition carries what its row and page show.
    const crypto = shipped.series!.find((x) => x.id === 'crypto')!;
    expect(data.editions.some((e) => e.series === 'crypto')).toBe(false);
    expect(crypto).toMatchObject({ acronym: 'CRYPTO', directions: ['cs/security'] });
    expect(crypto.labels?.map((l) => l.text)).toContain('CCF A');
    // A series with editions only needs its names (the editions carry the rest).
    expect(shipped.series!.find((x) => x.id === 'iclr')?.acronym).toBeUndefined();
    // Searching "crypto" finds CRYPTO first, among the other crypto venues.
    const catalog = seriesCatalog(
      data.editions,
      (shipped.series ?? []).flatMap((x) => (x.acronym && x.directions ? [{ id: x.id, name: x.acronym, directions: x.directions }] : [])),
    );
    const names = new Map((shipped.series ?? []).map((x) => [x.id, x]));
    const hits = search(
      catalog.map((x) => ({ ...x, full_name: names.get(x.id)?.full_name, aliases: names.get(x.id)?.aliases })),
      'crypto',
    );
    expect(hits[0]?.id).toBe('crypto');
    // HSCC's old name finds it.
    expect(search(catalog.map((x) => ({ ...x, full_name: names.get(x.id)?.full_name, aliases: names.get(x.id)?.aliases })), 'hybrid systems').map((x) => x.id)).toContain('hscc');
  });

  it('marks the abstract-only meetings the data says are, with their evidence behind them', () => {
    const abs = data.editions.filter((e) => e.submission_type === 'abstract').map((e) => e.id);
    expect(abs).toContain('aacr-2027');
    expect(abs).toContain('sfn-2026');
    // ASCO's pages could not be snapshotted: no submission type is claimed for it.
    expect(data.editions.find((e) => e.id === 'asco-2027')?.submission_type).toBeUndefined();
  });
});
