// Copyright (c) 2026 Zayier Xie. All rights reserved.

// The ccfddl import plan: new series and editions come in as upstream,
// curated editions are never touched, a second run writes nothing, and a
// ccfddl series that looks like one of ours waits for a person.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { CcfddlSeries, Edition, SeriesFile, Taxonomy, UpstreamManifest } from '@nextvenue/core';
import { planImport, type Existing, type PlanInput } from './ccfddl-plan.ts';

const TAXONOMY: Taxonomy = {
  version: 1,
  disciplines: [{ id: 'cs', name_zh: '计算机', name_en: 'CS', directions: [{ id: 'cs/ml', name_zh: 'ML', name_en: 'ML' }, { id: 'cs/theory', name_zh: '理论', name_en: 'Theory' }, { id: 'cs/cross', name_zh: '交叉', name_en: 'X' }] }],
  category_directions: [
    { list: 'ccf7', category: '6', ccfddl_sub: 'CT', directions: ['cs/theory'] },
    { list: 'ccf7', category: '8', ccfddl_sub: 'AI', directions: ['cs/ml'] },
  ],
};

const PIN: UpstreamManifest['pin'] = { kind: 'file', url: 'https://ccfddl.com/conference/allconf.yml', as_of: '2026-09-25', sha256: 'a'.repeat(64) };

const CCFDDL: CcfddlSeries[] = [
  {
    title: 'HSCC',
    description: 'International Conference on Hybrid Systems: Computation and Control',
    sub: 'CT',
    rank: { ccf: 'B', core: 'N', thcpl: 'B' },
    dblp: 'hybrid',
    confs: [
      { year: 2026, id: 'hscc26', timeline: [{ deadline: '2025-10-30 23:59:59' }], timezone: 'AoE', date: 'May 11-14, 2026', place: 'Saint Malo, France' },
      { year: 2027, id: 'hscc27', link: 'https://hscc.acm.org/2027/', timeline: [{ abstract_deadline: '2026-10-29 23:59:59', deadline: '2026-11-05 23:59:59' }], timezone: 'AoE', date: 'May 17-20, 2027', place: 'Boulder, Colorado, USA' },
    ],
  },
  {
    title: 'ICLR',
    description: 'International Conference on Learning Representations',
    sub: 'AI',
    rank: { ccf: 'A', core: 'A*', thcpl: 'A' },
    dblp: 'iclr',
    confs: [{ year: 2027, id: 'iclr27', timeline: [{ abstract_deadline: '2026-09-18 23:59:59', deadline: '2026-09-24 23:59:59' }], timezone: 'UTC-12', date: 'April 26-30, 2027', place: 'San Francisco, USA' }],
  },
  {
    title: 'SIGKDD',
    description: 'ACM Knowledge Discovery and Data Mining',
    sub: 'DB',
    rank: { ccf: 'A', core: 'A*', thcpl: 'A' },
    dblp: 'kdd',
    confs: [{ year: 2027, id: 'sigkdd27', timeline: [{ deadline: '2026-07-26 23:59:59' }], timezone: 'AoE', date: 'August 8-12, 2027', place: 'Jeju, Korea' }],
  },
];

const ex = <T,>(file: string, value: T): Existing<T> => ({ file, value, text: `# fixture\n${JSON.stringify(value)}` });

const ICLR_SERIES: SeriesFile = { id: 'iclr', acronym: 'ICLR', full_name: 'International Conference on Learning Representations', directions: ['cs/ml'], dblp: 'conf/iclr', ccfddl: 'AI/ICLR', data_level: 'curated' };
const KDD_SERIES: SeriesFile = { id: 'kdd', acronym: 'KDD', full_name: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining', directions: ['cs/dm'], dblp: 'conf/kdd', data_level: 'curated' };
const ICLR_2027: Edition = {
  id: 'iclr-2027',
  series: 'iclr',
  name: 'ICLR 2027',
  year: 2027,
  kind: 'conference',
  data_level: 'curated',
  milestones: [{ type: 'paper', at: '2026-09-25T23:59', tz: 'AoE', status: 'confirmed', src: 'iclr-2027-dates', quote: 'Paper Deadline' }],
  last_checked: '2026-09-25',
};

const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  ccfddl: CCFDDL,
  pin: PIN,
  series: [ex('data/series/iclr.yml', ICLR_SERIES), ex('data/series/kdd.yml', KDD_SERIES)],
  editions: [ex('data/editions/iclr-2027.yml', ICLR_2027)],
  manifest: null,
  taxonomy: TAXONOMY,
  ...over,
});

/** Apply a plan's writes to the repo state, as the CLI would. */
function apply(state: PlanInput, writes: { file: string; text: string }[]): PlanInput {
  const series = new Map(state.series.map((s) => [s.file, s]));
  const editions = new Map(state.editions.map((e) => [e.file, e]));
  let manifest = state.manifest;
  for (const w of writes) {
    const value = parse(w.text);
    if (w.file.startsWith('data/series/')) series.set(w.file, { file: w.file, value, text: w.text });
    else if (w.file.startsWith('data/editions/')) editions.set(w.file, { file: w.file, value, text: w.text });
    else manifest = { file: w.file, value, text: w.text };
  }
  return { ...state, series: [...series.values()], editions: [...editions.values()], manifest };
}

describe('planImport', () => {
  const first = planImport(input());

  it('creates an upstream series and its upcoming edition, and skips past editions', () => {
    expect(first.summary.series.created).toEqual(['CT/HSCC → hscc']);
    const hscc = parse(first.writes.find((w) => w.file === 'data/series/hscc.yml')!.text);
    expect(hscc).toEqual({
      id: 'hscc',
      acronym: 'HSCC',
      full_name: 'International Conference on Hybrid Systems: Computation and Control',
      directions: ['cs/theory'],
      dblp: 'conf/hybrid',
      ccfddl: 'CT/HSCC',
      data_level: 'upstream',
    });
    expect(first.summary.editions.created).toEqual(['hscc-2027']);
    expect(first.summary.editions.past).toBe(1);
    const ed = parse(first.writes.find((w) => w.file === 'data/editions/hscc-2027.yml')!.text) as Edition;
    expect(ed.data_level).toBe('upstream');
    expect(ed.upstream).toMatchObject({ source: 'ccfddl', key: 'CT/HSCC', conf_id: 'hscc27' });
    expect(ed.milestones.map((m) => [m.type, m.at ?? m.start, m.tz])).toEqual([
      ['abstract', '2026-10-29T23:59', 'AoE'],
      ['paper', '2026-11-05T23:59', 'AoE'],
      ['conference', '2027-05-17', 'AoE'],
    ]);
  });

  it('never touches a curated edition, and says when ccfddl differs', () => {
    expect(first.writes.some((w) => w.file === 'data/editions/iclr-2027.yml')).toBe(false);
    expect(first.summary.editions.curated).toEqual([{ id: 'iclr-2027', differs: 'ccfddl paper 2026-09-25T11:59:00.000Z vs ours 2026-09-26T11:59:00.000Z' }]);
  });

  it('holds back a ccfddl series that looks like one of ours', () => {
    expect(first.summary.series.conflicts).toEqual(['DB/SIGKDD: dblp conf/kdd is data/series/kdd.yml; if it is the same venue add "ccfddl: DB/SIGKDD" there']);
    expect(first.writes.some((w) => w.file.includes('sigkdd'))).toBe(false);
  });

  it('records the pin and every series it linked or created', () => {
    const m = parse(first.writes.find((w) => w.file === 'data/upstream/ccfddl.yml')!.text) as UpstreamManifest;
    expect(m.pin).toEqual(PIN);
    expect(m.series.map((r) => [r.key, r.series, r.rank.ccf])).toEqual([
      ['AI/ICLR', 'iclr', 'A'],
      ['CT/HSCC', 'hscc', 'B'],
    ]);
  });

  it('writes nothing the second time', () => {
    const again = planImport(apply(input(), first.writes));
    expect(again.writes).toEqual([]);
    expect(again.summary.editions.unchanged).toEqual(['hscc-2027']);
    expect(again.summary.series.linked).toContain('CT/HSCC → hscc');
  });

  it('updates an upstream edition when ccfddl moves a date, and flags editions ccfddl dropped', () => {
    const state = apply(input(), first.writes);
    const moved = CCFDDL.map((s) => (s.title === 'HSCC' ? { ...s, confs: [{ ...s.confs![1]!, timeline: [{ deadline: '2026-11-12 23:59:59' }] }] } : s));
    const next = planImport({ ...state, ccfddl: moved });
    expect(next.summary.editions.updated).toEqual(['hscc-2027']);
    const gone = planImport({ ...state, ccfddl: CCFDDL.filter((s) => s.title !== 'HSCC') });
    expect(gone.summary.editions.stale).toEqual(['hscc-2027']);
    expect(gone.writes.some((w) => w.file === 'data/editions/hscc-2027.yml')).toBe(false);
  });

  it('leaves an edition alone once a person curates it', () => {
    const state = apply(input(), first.writes);
    const curated = state.editions.map((e) => (e.value.id === 'hscc-2027' ? { ...e, value: { ...e.value, data_level: 'curated' as const, upstream: undefined } } : e));
    const next = planImport({ ...state, editions: curated });
    expect(next.writes.some((w) => w.file === 'data/editions/hscc-2027.yml')).toBe(false);
    expect(next.summary.editions.curated.map((c) => c.id)).toContain('hscc-2027');
  });
});
