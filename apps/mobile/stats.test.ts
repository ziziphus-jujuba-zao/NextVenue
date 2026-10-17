// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Past data on the zoomed venue page (docs/MOBILE_SPEC.md §11.4): which bar
// and words each acceptance row gets, the chart's slots and scale, the top
// topics with the change from the year before, and official per-area rows.
// Rows are copied from data/stats as of 2026-09-25.

import { describe, expect, it } from 'vitest';
import {
  areaFilesShown,
  areaRate,
  areaView,
  countsText,
  defaultAreaYear,
  deltaOf,
  deltaPp,
  rateText,
  statCell,
  statChart,
  statDetail,
  statHref,
  statTabs,
  sumLabel,
  sumText,
  summaryRows,
  topicLines,
  topicShort,
  topicYears,
} from './stats.ts';
import type { AppAreaFile, AppStatRow, AppStatsSeries, AppTopics } from './types.ts';

const row = (r: Partial<AppStatRow> & Pick<AppStatRow, 'year' | 'status'>): AppStatRow => ({ track: 'main', checked: '2026-09-25', ...r });

const ICLR: AppStatsSeries = {
  series: 'iclr',
  rows: [
    row({ year: 2020, status: 'official', submissions: 2594, accepted: 687, rate: 26.5, rate_text: '26.5%', rate_basis: 'stated' }),
    row({ year: 2021, status: 'official', submissions: 2997, accepted: 860, rate: 28.7, rate_text: '28.7%', rate_basis: 'computed', definition_zh: '单一赛道' }),
    row({ year: 2022, status: 'partial', accepted: 1095, count_method_zh: '官方会议数据里共有 1,095 个 Poster 活动', note_zh: '官方没公布投稿数' }),
    row({ year: 2023, status: 'official', submissions: 4938, accepted: 1574, rate: 31, rate_text: '31%', rate_basis: 'stated', mismatch_zh: '官方写 31%，按官方数字算是 31.9%' }),
    row({ year: 2026, status: 'official', submissions: 19525, accepted: 5355, rate: 27.4, rate_text: '27.4%', rate_basis: 'stated', source_url: 'https://blog.iclr.cc/x', link: 'https://blog.iclr.cc/x#:~:text=ICLR' }),
  ],
};

describe('acceptance-rate bars (§11.4.1)', () => {
  it('ICLR 2023 shows "31%" as written, and the sheet explains the mismatch', () => {
    const c = statCell(ICLR.rows[3]!);
    expect(c).toMatchObject({ bar: 'solid', top: '31%', under: '' });
    const d = statDetail(ICLR.rows[3]!);
    expect(d.big).toBe('31%');
    expect(d.notes).toContain('官方写 31%，按官方数字算是 31.9%');
  });

  it('ICLR 2021 "28.7%" says it was computed from official counts', () => {
    const d = statDetail(ICLR.rows[1]!);
    expect(d.big).toBe('28.7%');
    expect(d.tags).toEqual(['按官方数字计算']);
    expect(d.notes[0]).toBe('口径：单一赛道');
  });

  it('ICLR 2022: no bar, "仅录用数", and the sheet names what is missing and how it was counted', () => {
    expect(statCell(ICLR.rows[2]!)).toMatchObject({ bar: 'none', under: '仅录用数', top: '' });
    const d = statDetail(ICLR.rows[2]!);
    expect(d.big).toBe('仅录用数');
    expect(d.counts).toBe('投稿数官方未公布 · 录用 1,095 · 录用率官方未公布');
    expect(d.tags).toContain('官网名单计数');
  });

  it('ICML 2022 (lixin4ever, MIT): hatched bar labelled 第三方, a third-party button', () => {
    const r = row({
      year: 2022,
      status: 'third_party',
      submissions: 5630,
      accepted: 1235,
      rate: 21.9,
      rate_text: '21.9%',
      rate_basis: 'stated',
      relay_zh: '第三方数据集 lixin4ever/Conference-Acceptance-Rate（MIT），未注明出处',
      dataset: 'lixin4ever',
      source_url: 'https://github.com/lixin4ever/Conference-Acceptance-Rate/blob/x/README.md',
    });
    expect(statCell(r)).toMatchObject({ bar: 'hatched', top: '21.9%', under: '第三方' });
    const d = statDetail(r);
    expect(d.tags).toEqual(['第三方']);
    expect(d.notes).toContain('第三方数据集 lixin4ever/Conference-Acceptance-Rate（MIT），未注明出处');
    expect(d.notes).toContain('按 MIT 许可转载，署名和许可证见 NOTICE');
    expect(d.button?.label).toBe('查看第三方原文 ↗');
  });

  it('NeurIPS 2026 and WWW 2025: "—" and 官方未公布, no number at all', () => {
    const n = row({ year: 2026, status: 'none', reason: 'unpublished', note_zh: '9/24 已出结果，官方还没公布投稿数和录用数', checked_urls: ['https://blog.neurips.cc/'] });
    const w = row({ year: 2025, status: 'none', reason: 'unlicensed_only', checked_urls: ['https://www2025.thewebconf.org/'] });
    for (const r of [n, w]) {
      expect(statCell(r)).toMatchObject({ bar: 'none', top: '', under: '—' });
      expect(statDetail(r).big).toBe('官方未公布');
      expect(statDetail(r).counts).toBeUndefined();
      expect(statDetail(r).button).toBeUndefined();
    }
    expect(statDetail(n).notes).toEqual(['9/24 已出结果，官方还没公布投稿数和录用数']);
    expect(statDetail(w).notes[0]).toMatch(/没有许可证的聚合站/);
    expect(statDetail(row({ year: 2020, status: 'none', reason: 'doubtful' })).big).toBe('数字存疑，不显示');
  });

  it('NAACL 2025 "22%" is an official estimate; AAAI-26 is "约 17.5%"', () => {
    const naacl = row({ year: 2025, status: 'official', submissions: 1, accepted: 1, rate: 22, rate_text: '22%', rate_basis: 'estimate' });
    expect(statCell(naacl).top).toBe('22%');
    expect(statDetail(naacl).tags).toEqual(['官方估算']);
    const aaai = row({ year: 2026, status: 'partial', rate: 17.5, rate_text: '17.5%', rate_basis: 'approx' });
    expect(rateText(aaai)).toBe('约 17.5%');
    expect(statCell(aaai)).toMatchObject({ bar: 'solid', top: '约 17.5%' });
    expect(statDetail(aaai).counts).toBe('投稿数官方未公布 · 录用数官方未公布');
    // The line under the chart agrees with the bar: the rate is out, only the counts are not.
    expect(sumText(aaai)).toBe('约 17.5% · 篇数官方未公布');
    expect(sumText(row({ year: 2026, status: 'none', reason: 'unpublished' }))).toBe('官方未公布');
    expect(sumText(row({ year: 2020, status: 'none', reason: 'doubtful' }))).toBe('数字存疑，不显示');
  });

  it('EMNLP 2026: the 主会 + Findings total is labelled 合计 on both tabs, never as a main-conference count', () => {
    const emnlp: AppStatsSeries = {
      series: 'emnlp',
      rows: [
        row({ year: 2025, status: 'official', submissions: 8174, accepted: 1811, rate: 22.16, rate_text: '22.16%' }),
        row({ year: 2025, track: 'findings', status: 'official', accepted: 1400 }),
        row({ year: 2026, track: 'main_and_findings', status: 'partial', accepted: 5252 }),
      ],
    };
    for (const tab of ['main', 'findings'] as const) {
      const chart = statChart(emnlp, tab);
      const c = chart.slots.at(-1)!.cells[0]!;
      expect(c).toMatchObject({ combined: true, under: '合计', bar: 'none' });
      expect(summaryRows(chart).map((x) => `${sumLabel(x)} · ${sumText(x.row)}`)).toEqual(['2026 主会+Findings 合计 · 录用 5,252']);
    }
  });

  it('gives every year a slot (missing years too), one zero-based scale, the accent on the latest drawn year', () => {
    const chart = statChart(ICLR);
    expect(chart.slots.map((s) => s.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025, 2026]);
    expect(chart.slots[4]!.cells).toEqual([]);
    const h = Object.fromEntries(chart.slots.flatMap((s) => s.cells.map((c) => [s.year, c.h])));
    // One fixed 0–50% scale on every venue page.
    expect(chart.scale).toBe(50);
    expect(h[2023]).toBeCloseTo(31 / 50, 6);
    expect(h[2020]! / h[2023]!).toBeCloseTo(26.5 / 31, 6);
    expect(h[2022]).toBe(0);
    expect(chart.accent).toBe(2026);
    expect(chart.slots.at(-1)!.cells[0]!.latest).toBe(true);
    expect(summaryRows(chart).map((c) => countsText(c.row))).toEqual(['投稿 19,525 · 录用 5,355']);
  });

  it('when the latest year has nothing yet, the accent and the summary also name the latest counted year', () => {
    const f: AppStatsSeries = {
      series: 'neurips',
      rows: [
        row({ year: 2025, status: 'official', submissions: 21575, accepted: 5290, rate: 24.52, rate_text: '24.52%' }),
        row({ year: 2026, status: 'none', reason: 'unpublished' }),
      ],
    };
    const chart = statChart(f);
    expect(chart.latest).toBe(2026);
    expect(chart.accent).toBe(2025);
    expect(summaryRows(chart).map((c) => [c.row.year, countsText(c.row)])).toEqual([
      [2026, '官方未公布'],
      [2025, '投稿 21,575 · 录用 5,290'],
    ]);
  });

  it('draws KDD cycles side by side (never added up) and Findings on their own tab', () => {
    const kdd: AppStatsSeries = {
      series: 'kdd',
      rows: [
        row({ year: 2025, track: 'cycle2', track_zh: '2 月轮', status: 'partial', accepted: 365 }),
        row({ year: 2025, track: 'cycle1', track_zh: '8 月轮', status: 'official', submissions: 967, accepted: 187, rate: 19, rate_text: '19%' }),
      ],
    };
    const chart = statChart(kdd);
    expect(chart.slots[0]!.cells.map((c) => [c.cycle, c.bar])).toEqual([
      ['8 月轮', 'solid'],
      ['2 月轮', 'none'],
    ]);
    expect(statHref('kdd', kdd.rows[0]!)).toBe('#/stat/kdd/2025/cycle2');
    const acl: AppStatsSeries = {
      series: 'acl',
      rows: [row({ year: 2024, status: 'official', rate: 21.3, rate_text: '21.3%' }), row({ year: 2024, track: 'findings', status: 'official', rate: 22.1, rate_text: '22.1%' })],
    };
    expect(statTabs(acl)).toEqual(['main', 'findings']);
    expect(statChart(acl, 'findings').slots[0]!.cells.map((c) => c.top)).toEqual(['22.1%']);
    expect(statChart(acl, 'main').slots[0]!.cells.map((c) => c.top)).toEqual(['21.3%']);
    expect(statTabs(ICLR)).toEqual(['main']);
  });
});

const topic = (rank: number, label_zh: string, count: number, share_pct: number, prev?: number, low?: boolean) => ({
  rank,
  id: `t${rank}`,
  label_zh,
  label_en: label_zh,
  count,
  share_pct,
  prev: prev === undefined ? undefined : { year: 2024, count: 0, share_pct: prev, delta_pp: Math.round((share_pct - prev) * 10) / 10 },
  low_precision: low ? (true as const) : undefined,
});

const ICLR25: AppTopics = {
  edition: 'iclr-2025',
  series: 'iclr',
  year: 2025,
  method_version: '0.1.0',
  citation_zh: '',
  source: { name: 'dblp', license: 'CC0 1.0', tocs: [], retrieved_at: '2026-09-25T09:49:15Z' },
  papers_used: 3704,
  official_accepted: { value: 3704, source_url: 'https://media.iclr.cc/x.pdf', quote: '3704 accepted' },
  coverage: 1,
  topics: [
    topic(1, '大语言模型', 651, 17.6, 12.4),
    topic(2, '扩散模型 / 流匹配', 313, 8.5, 7.6),
    topic(3, '基准、数据集与评测', 275, 7.4, 4.8, true),
    topic(4, '多模态 / 视觉-语言', 262, 7.1, 3.6),
    topic(5, '鲁棒性与对抗攻击', 197, 5.3, 6.9, true),
    topic(6, 'Transformer / 注意力', 195, 5.3, 5.1),
    topic(7, '高效化（量化/剪枝/蒸馏/KV 缓存）', 181, 4.9, 4.5),
    topic(8, '安全与对齐', 179, 4.8, 1.9),
    topic(9, '强化学习', 175, 4.7, 7.1),
    topic(10, '图学习 / GNN', 171, 4.6, 5.8),
    topic(11, '优化与学习理论', 170, 4.6, 5.3),
  ],
};

describe('top topics by accepted papers (§11.4.2)', () => {
  it('ICLR 2025: 10 rows, 大语言模型 first with 651, 17.6%, ▲5.2; the noisy topics are starred', () => {
    const lines = topicLines(ICLR25);
    expect(lines).toHaveLength(10);
    expect(lines[0]).toMatchObject({ rank: 1, label: '大语言模型', count: '651', share: '17.6%', bar: 1, delta: { dir: 'up', text: '▲5.2' } });
    expect(lines.filter((l) => l.star).map((l) => l.label)).toEqual(['基准、数据集与评测', '鲁棒性与对抗攻击']);
    expect(lines[4]!.delta).toEqual({ dir: 'down', text: '▼1.6' });
    expect(lines.map((l) => l.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('computes the change in share points, one decimal, and agrees with the file', () => {
    expect(deltaPp(17.6, 12.4)).toBe(5.2);
    expect(deltaPp(5.3, 6.9)).toBe(-1.6);
    expect(deltaPp(7.3, 7.3)).toBe(0);
    expect(deltaOf(7.3, 7.3)).toEqual({ dir: 'flat', text: '±0' });
    expect(deltaOf(4.84, 4.8)).toEqual({ dir: 'flat', text: '±0' });
    for (const t of ICLR25.topics) expect(deltaPp(t.share_pct, t.prev!.share_pct)).toBe(t.prev!.delta_pp);
  });

  it('lists every topic tied with the 10th, with the same rank', () => {
    const tied = { ...ICLR25, topics: [...ICLR25.topics.slice(0, 10), topic(11, '优化与学习理论', 171, 4.6, 5.3), topic(12, '其他', 160, 4.3)] };
    const lines = topicLines(tied);
    expect(lines).toHaveLength(11);
    expect(lines.slice(-2).map((l) => [l.rank, l.label, l.tied])).toEqual([
      [10, '图学习 / GNN', true],
      [10, '优化与学习理论', true],
    ]);
    expect(lines[0]!.tied).toBe(false);
    expect(topicLines(ICLR25)).toHaveLength(10);
  });

  it('drops the examples in brackets from a topic name on the card', () => {
    expect(topicShort('高效化（量化/剪枝/蒸馏/KV 缓存）')).toBe('高效化');
    expect(topicShort('大语言模型')).toBe('大语言模型');
    expect(topicLines(ICLR25)[6]!.label).toBe('高效化');
  });

  it('shows no change when there is no earlier year', () => {
    const t = { ...ICLR25, topics: [topic(1, '强化学习', 116, 7.4)] };
    expect(topicLines(t)[0]!.delta).toBeUndefined();
  });

  it('lists the years with topics for the year switcher', () => {
    expect(topicYears([{ ...ICLR25, year: 2023 }, ICLR25, { ...ICLR25, series: 'acl', year: 2026 }], 'iclr')).toEqual([2023, 2025]);
  });
});

const area = (a: Partial<AppAreaFile> & Pick<AppAreaFile, 'kind' | 'precision' | 'rows'>): AppAreaFile => ({
  series: 'cvpr',
  year: 2024,
  track_zh: '主会',
  source_url: 'https://example.org/slides.pdf',
  checked: '2026-09-25',
  ...a,
});

describe('official per-area figures (§11.4.3)', () => {
  it('lists the 5 largest areas with ≥ 100 submissions (by size, not by rate), the rest under 全部, with the whole-conference line', () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ area: `A${i}`, submissions: 100 + i * 50, accepted: 30, rate: 20 + i }));
    rows.push({ area: 'Vision + graphics', submissions: 159, accepted: 56, rate: 35.2 }, { area: 'Tiny', submissions: 40, accepted: 20, rate: 50 });
    const v = areaView(area({ kind: 'rates', precision: 'chart_read', rows, total: { label_zh: '全会', submissions: 11532, accepted: 2719, rate: 23.6 } }));
    expect(v.title).toBe('各领域录用率');
    expect(v.lines.map((l) => l.area)).toEqual(['A7', 'A6', 'A5', 'A4', 'A3']);
    expect(v.lines[0]).toMatchObject({ rate: '约 27%', count: '投稿 约 450 篇' });
    expect(v.all).toHaveLength(10);
    expect(v.all.at(-1)).toMatchObject({ area: 'Tiny', small: true });
    expect(v.smallCount).toBe(1);
    expect(v.order).toBe('按投稿数排');
    expect(v.refText).toBe('全会 23.6%');
    expect(v.ref).toBeCloseTo(23.6 / 50, 6);
    expect(v.approx).toBe(true);
  });

  it('KDD 2023: the one area with ≥ 100 submissions inline, the 样本少 ones only on 全部, after it', () => {
    const rows = [
      { area: 'Few-shot', submissions: 36, accepted: 13, rate: 36 },
      { area: 'Graphs', submissions: 161, accepted: 47, rate: 29 },
      { area: 'Small', submissions: 40, accepted: 9, rate: 22 },
    ];
    const v = areaView(area({ series: 'kdd', year: 2023, kind: 'rates', precision: 'chart_read', rows, total: { label_zh: '研究赛道合计', submissions: 1416, accepted: 313, rate: 22.1 } }));
    expect(v.lines.map((l) => l.area)).toEqual(['Graphs']);
    expect(v.all.map((l) => [l.area, !!l.small])).toEqual([
      ['Graphs', false],
      ['Small', true],
      ['Few-shot', true],
    ]);
    expect(v.smallCount).toBe(2);
    expect(v.refText).toBe('研究赛道合计 22.1%');
  });

  it('names the reference line from the file: ACL 2023 is 直投合计, not 全会', () => {
    const v = areaView(area({ series: 'acl', year: 2023, kind: 'rates', precision: 'exact', rows: [{ area: 'Generation', submissions: 175, rate: 25.71 }], total: { label_zh: '直投合计', submissions: 4559, rate: 20.73 } }));
    expect(v.refText).toBe('直投合计 20.73%');
  });

  it('prints table rates with two decimals and chart readings as 约; rate-only files have no counts', () => {
    expect(areaRate(22.12, 'exact')).toBe('22.12%');
    expect(areaRate(34.6, 'chart_read')).toBe('约 35%');
    const v = areaView(area({ series: 'aaai', year: 2026, kind: 'rate_only', precision: 'chart_read', names_mapped: true, rows: [{ area: 'Computer Vision', rate: 16.3 }], total: { rate: 17.5 } }));
    expect(v.notes).toEqual(['官方没给每个领域的篇数', '领域名称为本应用对照补全']);
    expect(v.lines[0]).toMatchObject({ rate: '约 16%', count: undefined });
    expect(v.refText).toBe('全会 约 17.5%');
    expect(v.order).toBe('按官方顺序');
  });

  it('turns a theme track and a share into one sentence, and counts-only files into counts', () => {
    expect(areaView(area({ series: 'acl', kind: 'theme_track', precision: 'exact', rows: [{ area: 'Theme', submissions: 55, accepted: 22, rate: 40 }] })).sentence).toBe(
      '投稿 55 · 录用 22 · 40.0%（按官方数字计算）',
    );
    expect(areaView(area({ series: 'icml', kind: 'share_of_accepted', precision: 'exact', rows: [{ area: 'deep learning: large language models', share_pct: 17.6 }] })).sentence).toBe(
      '官方：deep learning: large language models 占录用论文 17.6%',
    );
    const v = areaView(area({ kind: 'accepted_only', precision: 'our_count', rows: [{ area: 'Web mining', accepted: 12 }, { area: 'Search', accepted: 30 }] }));
    expect(v.title).toBe('各领域录用数');
    expect(v.all.map((l) => [l.area, l.count, l.rate])).toEqual([
      ['Search', '30 篇', undefined],
      ['Web mining', '12 篇', undefined],
    ]);
  });

  it('opens on the latest year with rates (NeurIPS 2020, not the 2024 submissions-only file)', () => {
    const files = [2018, 2019, 2020].map((year) => area({ series: 'neurips', year, kind: 'rate_only', precision: 'chart_read', rows: [] }));
    files.push(area({ series: 'neurips', year: 2024, kind: 'submissions_only', precision: 'chart_read', rows: [] }));
    expect(defaultAreaYear(files)).toBe(2020);
    expect(defaultAreaYear([files[3]!])).toBe(2024);
    // The venue page steps through the rate years only (官方公布过 3 年); 2024 is on the 全部 page.
    expect(areaFilesShown(files).map((f) => f.year)).toEqual([2018, 2019, 2020]);
  });
});
