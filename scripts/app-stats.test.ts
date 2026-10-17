// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The graphic timeline and past data (docs/MOBILE_SPEC.md §11.8) on the
// data the app ships, 2026-09-25 21:00 Beijing: lane order and bars for the
// owner's venues, the zoomed phase bars, what each acceptance row shows, the
// per-area files and the top topics (ties included).

import { unlicensedSource } from '@nextvenue/core';
import { describe, expect, it } from 'vitest';
import { seriesCatalog } from '../apps/mobile/route.ts';
import { areaFilesShown, areaView, statCell, statChart, statDetail, sumLabel, sumText, summaryRows, topicLines } from '../apps/mobile/stats.ts';
import { axisOf, laneOf, laneOrder, phaseBands, xOfDay, xOfMs } from '../apps/mobile/timeline.ts';
import { appData } from './app-data.ts';
import { buildBundle } from './bundle.ts';

const data = appData(buildBundle());
const NOW = Date.parse('2026-09-25T21:00:00+08:00');
const catalog = seriesCatalog(data.editions);
const series = (id: string) => catalog.find((s) => s.id === id)!;
const axis = axisOf(NOW);
const edition = (id: string) => data.editions.find((e) => e.id === id)!;
const stat = (s: string, year: number, track = 'main') => data.stats!.find((f) => f.series === s)!.rows.find((r) => r.year === year && r.track === track)!;

describe('the overview on 9/25', () => {
  it("orders the owner's venues by next deadline: ICLR first", () => {
    const order = laneOrder(['neurips', 'iclr', 'icml', 'acl', 'emnlp'].map(series), NOW).map((s) => s.id);
    expect(order[0]).toBe('iclr');
    expect(order).toEqual(['iclr', 'acl', 'icml', 'neurips', 'emnlp']);
  });

  it('draws ICLR 2027 from 9/26 19:59 to 12/16 with the abstract dot already past; the names say when each venue next asks', () => {
    const lane = laneOf(series('iclr'), axis, NOW);
    const iclr = lane.segs.find((s) => s.edition === 'iclr-2027')!;
    expect(iclr.x0).toBeCloseTo(xOfDay('2026-09-26', axis), 6);
    expect(iclr.x1).toBeCloseTo(xOfDay('2026-12-16', axis), 6);
    expect(iclr.pre!).toBeLessThan(iclr.x0);
    expect(lane.next).toMatchObject({ text: '明天 19:59', soon: true, edition: 'iclr-2027' });
    // NeurIPS: 2026's result came out 9/24; the name says 2027's abstract and opens NeurIPS 2027.
    const neurips = laneOf(series('neurips'), axis, NOW);
    expect(neurips.next).toMatchObject({ text: '约 5/5', edition: 'neurips-2027' });
    expect(neurips.open).toBe('neurips-2027');
    expect(laneOf(series('acl'), axis, NOW).next?.text).toBe('约 1/6');
  });

  it('splits WACV 2027 into two thin bars, and keeps KDD on one row: 2027 一轮, 2027 二轮, 2028 一轮', () => {
    const wacv = laneOf(series('wacv'), axis, NOW);
    expect(wacv.rows).toBe(2);
    expect(wacv.segs.filter((s) => s.edition === 'wacv-2027').map((s) => [s.label, s.row])).toEqual([
      ['2027 一轮', 0],
      ['2027 二轮', 1],
    ]);
    // KDD 2027's first cycle is in review on 9/25 (rebuttal 9/29–10/13, result 11/14): its bar crosses today.
    const kdd = laneOf(series('kdd'), axis, NOW);
    expect(kdd.rows).toBe(1);
    expect(kdd.segs.map((s) => s.label)).toEqual(['2027 一轮', '2027 二轮', '2028 一轮']);
    expect(kdd.segs[0]!.x0).toBeLessThan(xOfMs(NOW, axis));
    expect(kdd.segs[0]!.x1).toBeCloseTo(xOfDay('2026-11-14', axis), 6);
  });

  it('draws NAACL 2027 from the ARR deadline 10/13 to 2/10, with the commitment tick on 12/24', () => {
    const [s] = laneOf(series('naacl'), axis, NOW).segs;
    expect(s!.label).toBe('ARR 10 月轮');
    expect(s!.x0).toBeCloseTo(xOfDay('2026-10-13', axis), 6);
    expect(s!.x1).toBeCloseTo(xOfDay('2027-02-10', axis), 6);
    expect(s!.ticks).toEqual([xOfDay('2026-12-24', axis)]);
  });
});

describe('the zoomed phase bar', () => {
  it('ICLR 2027: result to conference cut with ≈; camera-ready is 待公布, so only in the list', () => {
    const bar = phaseBands(edition('iclr-2027'), NOW, 254);
    expect(bar.cut).toBe(true);
    expect(bar.rows[0]!.marks.some((m) => m.type === 'camera_ready')).toBe(false);
    expect(bar.tba).toBeGreaterThan(0);
    expect(bar.review?.est).toBe(true);
  });

  it('WACV 2027 and KDD 2027 have a row per round; NAACL 2027 has ARR and venue rows', () => {
    expect(phaseBands(edition('wacv-2027'), NOW).rows.map((r) => r.title)).toEqual(['一轮', '二轮']);
    expect(phaseBands(edition('kdd-2027'), NOW).rows.map((r) => r.title)).toEqual(['一轮', '二轮']);
    expect(phaseBands(edition('naacl-2027'), NOW).rows.map((r) => r.title)).toEqual(['ARR 审稿（10 月轮）', '会议录用']);
  });

  it('ACL 2027: the ARR row has an estimated author response between the deadline and the AC reviews', () => {
    const arr = phaseBands(edition('acl-2027'), NOW).rows[0]!;
    expect(arr.marks.map((m) => m.name)).toEqual(['投稿', '回复', 'AC 意见', '提交会议']);
    expect(arr.marks[1]).toMatchObject({ kind: 'reply', est: true });
  });
});

describe('acceptance rows as shipped', () => {
  it('shows each status the way §11.4.1 says', () => {
    expect(statCell(stat('iclr', 2023)).top).toBe('31%');
    expect(statDetail(stat('iclr', 2023)).notes.join()).toMatch(/31\.9%/);
    expect(statDetail(stat('iclr', 2021)).tags).toContain('按官方数字计算');
    expect(statCell(stat('iclr', 2022)).under).toBe('仅录用数');
    expect(statCell(stat('icml', 2022))).toMatchObject({ bar: 'hatched', under: '第三方' });
    expect(statCell(stat('neurips', 2026))).toMatchObject({ bar: 'none', under: '—' });
    expect(statDetail(stat('neurips', 2026)).big).toBe('官方未公布');
    expect(statDetail(stat('www', 2025)).big).toBe('官方未公布');
    expect(statDetail(stat('icra', 2020)).big).toBe('数字存疑，不显示');
    expect(statCell(stat('naacl', 2025)).top).toBe('22%');
    expect(statDetail(stat('naacl', 2025)).tags).toContain('官方估算');
    expect(statCell(stat('aaai', 2026)).top).toBe('约 17.5%');
    // The line under the AAAI chart agrees with its bar.
    expect(sumText(stat('aaai', 2026))).toBe('约 17.5% · 篇数官方未公布');
  });

  it('labels EMNLP 2026 as 主会 + Findings 合计 on both tabs', () => {
    const f = data.stats!.find((x) => x.series === 'emnlp')!;
    for (const tab of ['main', 'findings'] as const) {
      const c = statChart(f, tab).slots.at(-1)!.cells[0]!;
      expect(c).toMatchObject({ combined: true, under: '合计' });
      expect(summaryRows(statChart(f, tab)).map((x) => `${sumLabel(x)} · ${sumText(x.row)}`)).toContain('2026 主会+Findings 合计 · 录用 5,252');
    }
  });

  it('never shows a number without a source link, and never cites an unlicensed aggregator', () => {
    for (const f of data.stats!)
      for (const r of f.rows) {
        const shown = r.rate !== undefined || r.submissions !== undefined || r.accepted !== undefined;
        if (r.status === 'none') expect(shown, `${f.series} ${r.year}`).toBe(false);
        if (shown) expect(r.link ?? r.count_url, `${f.series} ${r.year}`).toBeTruthy();
        for (const u of [r.source_url, r.link, r.count_url, ...(r.also ?? []).map((a) => a.source_url)]) if (u) expect(unlicensedSource(u), u).toBeNull();
      }
  });
});

describe('areas and topics as shipped', () => {
  const areas = (series: string, year: number) => areaView(data.areas!.find((a) => a.series === series && a.year === year)!);

  it('CVPR 2024: the 5 largest areas inline, all 36 on 全部 (9 样本少 last), the whole conference at 23.6%', () => {
    const v = areas('cvpr', 2024);
    expect(v.lines).toHaveLength(5);
    expect(v.all).toHaveLength(36);
    expect(v.all.slice(-9).every((l) => l.small)).toBe(true);
    expect(v.smallCount).toBe(9);
    expect(v.refText).toBe('全会 23.6%');
    const n = (l: { count?: string }) => Number((l.count ?? '').replace(/[^\d]/g, ''));
    for (let i = 1; i < v.lines.length; i++) expect(n(v.lines[i]!)).toBeLessThanOrEqual(n(v.lines[i - 1]!));
  });

  it('KDD 2023: only Graphs and Networks inline, the 27 small areas after it on 全部; the line is 研究赛道合计', () => {
    const v = areas('kdd', 2023);
    expect(v.lines.map((l) => l.small)).toEqual([undefined]);
    expect(v.smallCount).toBe(27);
    expect(v.all[0]!.small).toBeUndefined();
    expect(v.refText).toBe('研究赛道合计 22.1%');
  });

  it('ACL 2023: the reference line is 直投合计 20.73%, not 全会', () => {
    expect(areas('acl', 2023).refText).toBe('直投合计 20.73%');
  });

  it('NeurIPS: the venue page steps through 2018–2020 (rates); 2024 (submissions only) is on the 全部 page', () => {
    expect(areaFilesShown(data.areas!.filter((a) => a.series === 'neurips')).map((a) => a.year)).toEqual([2018, 2019, 2020]);
  });

  it('ICLR 2025: 11 topics (10th tied at 171), 大语言模型 651 papers, 17.6%, ▲5.2; benchmarks and robustness starred', () => {
    const lines = topicLines(data.topics!.find((t) => t.series === 'iclr' && t.year === 2025)!);
    expect(lines[0]).toMatchObject({ label: '大语言模型', count: '651', share: '17.6%', delta: { text: '▲5.2' } });
    expect(lines.filter((l) => l.star).map((l) => l.label)).toEqual(['基准、数据集与评测', '鲁棒性与对抗攻击']);
    expect(lines.filter((l) => l.rank === 10).map((l) => [l.label, l.count])).toEqual([
      ['图学习 / GNN', '171'],
      ['优化与学习理论', '171'],
    ]);
  });

  it('ACL 2024: the three topics tied at 40 are all shown with one rank', () => {
    const lines = topicLines(data.topics!.find((t) => t.series === 'acl' && t.year === 2024)!);
    const tied = lines.filter((l) => l.count === '40');
    expect(tied).toHaveLength(3);
    expect(new Set(tied.map((l) => l.rank)).size).toBe(1);
  });

  it('every topic list is the 10 largest counts, ties at the 10th kept, in descending order', () => {
    for (const t of data.topics!) {
      const lines = topicLines(t);
      const counts = lines.map((l) => Number(l.count.replace(/,/g, '')));
      expect(lines.length, `${t.series} ${t.year}`).toBeGreaterThanOrEqual(10);
      for (let i = 1; i < counts.length; i++) expect(counts[i]!).toBeLessThanOrEqual(counts[i - 1]!);
      if (lines.length > 10) expect(counts.slice(9).every((c) => c === counts[9])).toBe(true);
    }
  });
});
