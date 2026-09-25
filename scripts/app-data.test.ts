// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// The app's wording (apps/mobile/copy.ts) against the real data: overrides
// still match, list labels read as "[label]？[answer]", and the answers a
// user sees on their paper page on 2026-09-24 are the right ones.

import { describe, expect, it } from 'vitest';
import { beijingText, dateRefs, lintCopy, staleCopy } from '../apps/mobile/copy.ts';
import { afterPhrases, groupRulesForMilestone, paperRows } from '../apps/mobile/logic.ts';
import { nearestEdition, planRoute, routeDay, seriesCatalog } from '../apps/mobile/route.ts';
import { appData, toAppData } from './app-data.ts';
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
    // Every conference edition can be ranked through its direction.
    for (const s of catalog) expect(s.directions.length, s.id).toBeGreaterThan(0);
  });
});
