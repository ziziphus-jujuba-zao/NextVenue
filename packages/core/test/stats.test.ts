// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import type { AreaFile, StatsRow, TopicsFile, TopicTaxonomy } from '../src/index.ts';
import {
  areaProblems,
  checkQuoteParts,
  computedRate,
  numberInText,
  quoteParts,
  statsRowProblems,
  topicsProblems,
  unlicensedSource,
} from '../src/index.ts';

describe('checkQuoteParts', () => {
  const text = 'Program Committee Statistics ● 11,603 submissions, 3704 accepted ○ 32% acceptance rate (last year: 31%) ○ more';
  it('accepts parts in order, split at "...", "[...]" and " | "', () => {
    expect(quoteParts('A ... B [...] C | D')).toEqual(['A', 'B', 'C', 'D']);
    expect(checkQuoteParts('11,603 submissions, 3704 accepted ... 32% acceptance rate (last year: 31%)', text)).toBeNull();
  });
  it('rejects a part that is missing or out of order', () => {
    expect(checkQuoteParts('11,603 submissions ... 33% acceptance rate', text)).toMatch(/not found/);
    expect(checkQuoteParts('32% acceptance rate ... 3704 accepted', text)).toMatch(/out of order/);
  });
  it('repairs thin spaces in digit groups and line breaks in CJK text', () => {
    expect(checkQuoteParts('out of the 3,350 full submissions', 'out of the 3, 350 full submissions')).toBeNull();
    expect(checkQuoteParts('採択率は全体で 45.5%であり，1,266 件の採択となった．', '採択率は全体で 45.5%であり,1,266 件の採択となっ\nた.')).toBeNull();
  });
});

describe('numberInText', () => {
  it('finds numbers with or without thousands separators', () => {
    expect(numberInText(1574, '4,938 submissions 1,574 accepted papers')).toBe(true);
    expect(numberInText(3937, 'We received 3, 937 paper submissions')).toBe(true);
    expect(numberInText('47.5', 'an acceptance rate of 47,5%.')).toBe(true);
    expect(numberInText('15.0', '|AAAI\'22 | 15.0% (1349/9020) | - |')).toBe(true);
  });
  it('does not match inside a longer number or across table cells', () => {
    expect(numberInText(2334, '12,334 papers')).toBe(false);
    expect(numberInText(31, '31.9% acceptance')).toBe(false);
    expect(numberInText(752, 'Total 3,359 752 22.4%')).toBe(true);
    expect(numberInText(3359752, 'Total 3,359 752 22.4%')).toBe(false);
  });
});

const base: StatsRow = {
  year: 2024,
  track: 'main',
  status: 'official',
  submissions: 7262,
  accepted: 2260,
  rate: 31,
  rate_text: '31%',
  rate_basis: 'stated',
  definition_zh: '单一赛道',
  source_url: 'https://media.iclr.cc/Conferences/ICLR2024/ICLR2024-Fact_Sheet.pdf',
  quote: '7262 submissions, 2260 accepted ... 31% acceptance rate (last year: 31%)',
  src: 'iclr-2024-fact-sheet',
  quote_check: 'snapshot',
  checked: '2026-09-25',
};

describe('statsRowProblems', () => {
  it('passes a stated rate that matches the counts within its precision', () => {
    expect(statsRowProblems(base)).toEqual([]);
  });
  it('wants a note when the stated rate does not follow from the counts (ICLR 2023: 31% vs 31.9%)', () => {
    const r = { ...base, submissions: 4938, accepted: 1574, quote: '4,938 submissions 1,574 accepted papers ... 31% acceptance rate' };
    expect(statsRowProblems(r)).toEqual([expect.stringMatching(/mismatch_zh/)]);
    expect(statsRowProblems({ ...r, mismatch_zh: '官方写 31%，按官方数字算是 31.9%' })).toEqual([]);
  });
  it('checks a computed rate to one decimal', () => {
    const r: StatsRow = { ...base, rate: 28.7, rate_text: '28.7%', rate_basis: 'computed', submissions: 2997, accepted: 860,
      quote: 'Out of the 2997 full submissions that were received, a total of 860 have been accepted' };
    expect(computedRate(860, 2997)).toBe(28.7);
    expect(statsRowProblems(r)).toEqual([]);
    expect(statsRowProblems({ ...r, rate: 28.6, rate_text: '28.6%' })).toEqual([expect.stringMatching(/must be 28\.7%/)]);
  });
  it('needs every shown number in a quote, or an own count for accepted', () => {
    expect(statsRowProblems({ ...base, accepted: 2261 })).toEqual([expect.stringMatching(/accepted 2261 is not in any quote/)]);
    const counted: StatsRow = { year: 2021, track: 'main', status: 'partial', accepted: 406, definition_zh: '主会',
      source_url: 'https://openaccess.thecvf.com/WACV2021', quote_check: 'manual',
      count_method_zh: 'CVF Open Access 上共 406 篇（本应用计数）', checked: '2026-09-25' };
    expect(statsRowProblems(counted)).toEqual([]);
  });
  it('keeps official, partial and third-party rows honest', () => {
    expect(statsRowProblems({ ...base, submissions: undefined })).toEqual([expect.stringMatching(/status: partial/)]);
    expect(statsRowProblems({ ...base, status: 'partial' })).toEqual([expect.stringMatching(/one or two/)]);
  });
  it('never accepts an unlicensed aggregator as a source', () => {
    expect(unlicensedSource('https://csconfstats.xoveexu.com/conferences/neurips/2026/')).toBe('csconfstats');
    expect(unlicensedSource('https://papercopilot.com/statistics/colm-statistics/')).toBe('Paper Copilot');
    expect(unlicensedSource('https://github.com/emeryberger/csconferences/blob/main/csconferences.csv')).toBe('emeryberger/csconferences');
    expect(unlicensedSource('https://github.com/lixin4ever/Conference-Acceptance-Rate')).toBeNull();
    const r = { ...base, source_url: 'https://csconfstats.xoveexu.com/conferences/iclr/2024/', src: undefined, quote_check: 'manual' as const };
    expect(statsRowProblems(r)).toEqual([expect.stringMatching(/csconfstats has no licence/)]);
  });
});

describe('areaProblems', () => {
  const area: AreaFile = {
    series: 'kdd', year: 2023, kind: 'rates', precision: 'chart_read', track_zh: '研究赛道', tolerance: { count: 1, pct: 0.5 },
    source_url: 'https://sites.cs.ucsb.edu/~xyan/KDD23-ResearchTrack-Banquet-Talk.pdf', quote: 'Submission & Acceptance By Topics',
    quote_check: 'manual', checked: '2026-09-25', total: { submissions: 200 }, gap_note_zh: '图里没有包括全部论文',
    rows: [{ area: 'Graphs and Networks', submissions: 161, accepted: 46, rate: 28.5 }],
  };
  it('accepts chart readings within their tolerance', () => {
    expect(areaProblems(area)).toEqual([]);
  });
  it('rejects rates where only counts were published, and unexplained gaps', () => {
    const subsOnly: AreaFile = { ...area, kind: 'submissions_only', gap_note_zh: undefined, rows: [{ area: 'Vision', submissions: 100, rate: 20 }] };
    expect(areaProblems(subsOnly)).toEqual([
      expect.stringMatching(/must not have rate/),
      expect.stringMatching(/gap_note_zh/),
    ]);
  });
});

describe('topicsProblems', () => {
  const taxonomy: TopicTaxonomy = {
    method_version: '0.1.0',
    low_precision: ['benchmark'],
    topics: [
      { id: 'llm', label_zh: '大语言模型', label_en: 'LLMs / language models', patterns: ['\\bllms?\\b'] },
      { id: 'benchmark', label_zh: '基准、数据集与评测', label_en: 'Benchmarks, datasets & evaluation', patterns: ['\\bbenchmark'] },
    ],
  };
  const t: TopicsFile = {
    schema: 1, edition: 'iclr-2025', series: 'iclr', year: 2025, method_version: '0.1.0', citation_zh: '来源：dblp',
    source: { name: 'dblp', license: 'CC0 1.0', tocs: ['https://dblp.org/db/conf/iclr/iclr2025'], retrieved_at: '2026-09-25T09:49:15Z' },
    papers_used: 3704,
    official_accepted: { value: 3704, source_url: 'https://media.iclr.cc/x.pdf', quote: '3704 accepted', quote_check: 'manual' },
    coverage: 1,
    topics: [
      { rank: 1, id: 'llm', label_zh: '大语言模型', label_en: 'LLMs / language models', count: 651, share_pct: 17.6,
        prev: { year: 2024, count: 281, share_pct: 12.4, delta_pp: 5.2 } },
      { rank: 2, id: 'benchmark', label_zh: '基准、数据集与评测', label_en: 'Benchmarks, datasets & evaluation', count: 275, share_pct: 7.4, low_precision: true },
    ],
  };
  it('accepts topics ranked by count, highest first', () => {
    expect(topicsProblems(t, taxonomy)).toEqual([]);
  });
  it('rejects a ranking that is not by count, and a wrong share', () => {
    const [a, b] = t.topics;
    const bad = { ...t, topics: [{ ...b!, rank: 1 }, { ...a!, rank: 2, share_pct: 18 }] };
    const problems = topicsProblems(bad, taxonomy);
    expect(problems).toContainEqual(expect.stringMatching(/ordered by count/));
    expect(problems).toContainEqual(expect.stringMatching(/share_pct/));
  });
});
