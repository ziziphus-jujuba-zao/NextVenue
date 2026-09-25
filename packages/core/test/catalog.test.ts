// Copyright (c) 2026 Zayier Xie. All rights reserved.

import { describe, expect, it } from 'vitest';
import {
  ccfddlLocal,
  ccfddlSeriesSlug,
  ccfddlTimeZone,
  entryKeys,
  formatIn,
  isUpcoming,
  labelText,
  labelsForEdition,
  legacyTopics,
  matchKeyProblem,
  normAcronym,
  normDblp,
  normName,
  parseCcfddlDates,
  parseCcfddlPlace,
  resolveRanks,
  toInstant,
  upstreamEdition,
  type RankEntry,
  type RankList,
  type SeriesFile,
  type Taxonomy,
  type UpstreamManifest,
} from '../src/index.ts';

describe('normalization for rank matching', () => {
  it('reduces acronyms', () => {
    expect(normAcronym('IEEE VR')).toBe('vr');
    expect(normAcronym('S&P')).toBe('sp');
    expect(normAcronym('HSCC+ICCPS')).toBe('hscciccps');
    expect(normAcronym('CCC2025')).toBe('ccc');
    expect(normAcronym("ICRA'26")).toBe('icra');
    expect(normAcronym('ACM SIGOPS ATC')).toBe('sigopsatc');
    expect(normAcronym('3DV')).toBe('3dv');
  });
  it('reduces names, keeping what tells venues apart', () => {
    expect(normName('IEEE/CVF International Conference on Computer Vision')).toBe('international conference computer vision');
    expect(normName('The 44th Chinese Control Conference (CCC2025)')).toBe('chinese control conference');
    expect(normName('International ACM SIGIR Conference on Research and Development in Information Retrieval')).toBe(
      'international conference research development information retrieval',
    );
    // A symposium is not a conference: SoCC and IEEE CLOUD stay apart.
    expect(normName('ACM Symposium on Cloud Computing')).not.toBe(normName('IEEE International Conference on Cloud Computing'));
    expect(normName('第44届中国控制会议')).toBe('中国控制会议');
    expect(normName('2025中国自动化大会')).toBe('中国自动化大会');
  });
  it('reads dblp keys from URLs and bare keys', () => {
    expect(normDblp('http://dblp.uni-trier.de/db/conf/hybrid/')).toBe('conf/hybrid');
    expect(normDblp('http://dblp.uni-trier.de/db/conf/usenix/index.html')).toBe('conf/usenix');
    expect(normDblp('nips')).toBe('conf/nips');
    expect(normDblp('https://dblp.uni-trier.de/search?q=NCMMSC')).toBeNull();
  });
  it('builds and checks match keys', () => {
    expect(entryKeys({ acronyms: ['HSCC'], names: ['International Conference on Hybrid Systems: Computation and Control'], dblp: ['http://dblp.uni-trier.de/db/conf/hybrid/'] })).toEqual([
      'acronym:hscc',
      'name:international conference hybrid systems computation control',
      'dblp:conf/hybrid',
    ]);
    // Too generic to be a name key: "The Web Conference" is one distinctive word.
    expect(entryKeys({ names: ['The Web Conference'] })).toEqual([]);
    expect(matchKeyProblem('acronym:hscc')).toBeNull();
    expect(matchKeyProblem('acronym:HSCC')).toMatch(/not normalized/);
    expect(matchKeyProblem('title:x')).toMatch(/must start/);
  });
});

const entry = (id: string, acronym: string | null, full_name: string, tier: string, extra: Partial<RankEntry> = {}, dblp: string[] = []): RankEntry => ({
  id,
  acronym,
  full_name,
  tier,
  category: extra.category ?? '1',
  match_keys: entryKeys({ acronyms: [acronym], names: [full_name, extra.name_zh], dblp }),
  ...extra,
});

const list = (id: string, label_zh: string, entries: RankEntry[], extra: Partial<RankList> = {}): RankList => ({
  id,
  label_zh,
  name_zh: id,
  issuer_zh: id,
  kind: 'society',
  edition: '1',
  edition_zh: '1',
  released: '2026-01-01',
  official_url: 'https://example.org',
  tiers: ['A', 'B', 'C'],
  attach: 'series',
  license: { display: 'tier_and_citation', note_zh: '-' },
  categories: [{ id: '1', name_zh: '类一' }],
  verified: { date: '2026-09-25', method_zh: '-' },
  entries,
  ...extra,
});

const series = (id: string, acronym: string, full_name: string, extra: Partial<SeriesFile> = {}): SeriesFile => ({
  id,
  acronym,
  full_name,
  directions: ['cs/ml'],
  data_level: 'curated',
  ...extra,
});

const CCF = list('ccf7', 'CCF', [
  entry('hscc', 'HSCC', 'International Conference on Hybrid Systems: Computation and Control', 'B', {}, ['http://dblp.uni-trier.de/db/conf/hybrid/']),
  entry('ccc', 'CCC', 'Conference on Computational Complexity', 'B', {}, ['http://dblp.uni-trier.de/db/conf/coco/']),
  entry('iccv', 'ICCV', 'International Conference on Computer Vision', 'A', {}, ['http://dblp.uni-trier.de/db/conf/iccv/']),
]);
const CAA = list('caa2024', 'CAA', [
  entry('ccc', 'CCC', 'Chinese Control Conference', 'A'),
  entry('cac', 'CAC', 'China Automation Congress', 'A', { scope: 'domestic' }),
  entry('rss', 'RSS', 'Robotics: Science and Systems International Conference', 'B'),
]);
const CAAI = list('caai2024', 'CAAI', [entry('its', 'ITS', 'ACM International Conference on Interactive Tabletops and Surfaces', 'B')]);
const CAST = list('cast2025', '科协', [entry('314', 'CCC', 'The 44th Chinese Control Conference (CCC2025)', 'listed', { name_zh: '第44届中国控制会议' })], {
  tiers: ['listed'],
  attach: 'edition',
  covers_year: 2025,
  kind: 'government',
});
const LISTS = [CCF, CAA, CAAI, CAST];

describe('resolveRanks', () => {
  const SERIES = [
    series('hscc', 'HSCC+ICCPS', 'ACM/IEEE International Conference on Cyber-Physical and Autonomous Systems', { aliases: ['HSCC'], directions: ['cs/theory', 'eng/control'] }),
    series('ccc-control', 'CCC', 'Chinese Control Conference', { name_zh: '中国控制会议' }),
    series('ccc', 'CCC', 'Computational Complexity Conference', { dblp: 'conf/coco' }),
    series('its-wc', 'ITS World Congress', 'ITS World Congress', { aliases: ['ITS'] }),
    series('rss', 'RSS', 'Robotics: Science and Systems'),
    series('iccv', 'ICCV', 'IEEE/CVF International Conference on Computer Vision', { dblp: 'conf/iccv' }),
    series('cvc', 'CVC', 'Computer Vision Conference', { data_level: 'upstream', ccfddl: 'AI/CVC' }),
  ];
  const mapping = {
    links: [
      { series: 'hscc', list: 'ccf7', entry: 'hscc', note_zh: 'renamed' },
      { series: 'cac', list: 'caa2024', entry: 'cac', note_zh: 'waits for data/series/cac.yml' },
    ],
    not: [{ series: 'its-wc', list: 'caai2024', entry: 'its', note_zh: 'different venue' }],
  };
  const upstream: UpstreamManifest = {
    source: 'ccfddl',
    repo: 'https://github.com/ccfddl/ccf-deadlines',
    license: 'MIT',
    pin: { kind: 'file', url: 'x', as_of: '2026-09-25', sha256: '0'.repeat(64) },
    series: [{ key: 'AI/CVC', series: 'cvc', title: 'CVC', description: 'Computer Vision Conference', sub: 'AI', rank: { ccf: 'N', core: 'B', thcpl: 'N' } }],
  };
  const { labels, report } = resolveRanks(SERIES, LISTS, mapping, upstream);
  const texts = (id: string) => labels.get(id)!.map((l) => `${labelText(l)}${l.year ? `@${l.year}` : ''}`);

  it('links HSCC+ICCPS to CCF HSCC explicitly (renamed, merged)', () => {
    expect(texts('hscc')).toEqual(['CCF B']);
    expect(labels.get('hscc')![0]!.match).toBe('explicit');
  });
  it('keeps the two CCCs apart: CCF for Computational Complexity, CAA and 科协 for the Chinese Control Conference', () => {
    expect(texts('ccc')).toEqual(['CCF B']);
    expect(texts('ccc-control')).toEqual(['CAA A', '科协@2025']);
    expect(report.unconfirmed.some((u) => u.series === 'ccc' && u.list === 'caa2024')).toBe(true);
  });
  it('never gives the ITS World Congress the CAAI ITS label', () => {
    expect(texts('its-wc')).toEqual([]);
  });
  it('matches RSS by name despite the list misprinting its organizer', () => {
    expect(texts('rss')).toEqual(['CAA B']);
  });
  it('does not let a generic name take ICCV, and keeps ccfddl CORE as upstream', () => {
    expect(texts('iccv')).toEqual(['CCF A']);
    expect(labels.get('cvc')!.map((l) => [labelText(l), l.upstream])).toEqual([['CORE B', true]]);
  });
  it('holds links to series that do not exist yet', () => {
    expect(report.pending).toEqual(['cac → caa2024/cac']);
    expect(report.problems).toEqual([]);
  });
  it('shows an edition-attached label only on its year', () => {
    const l = labels.get('ccc-control')!;
    expect(labelsForEdition(l, 2025).map(labelText)).toEqual(['CAA A', '科协']);
    expect(labelsForEdition(l, 2027).map(labelText)).toEqual(['CAA A']);
  });
  it('reports two series claiming one entry equally, and mapping errors', () => {
    const twins = [series('a', 'XYZ', 'Foo Bar Baz'), series('b', 'XYZ', 'Foo Bar Baz')];
    const r = resolveRanks(twins, [list('ccf7', 'CCF', [entry('xyz', 'XYZ', 'Foo Bar Baz', 'A')])], { links: [{ series: 'a', list: 'ccf7', entry: 'nope', note_zh: '-' }], not: [] }, null);
    expect(r.report.problems).toEqual(['a → ccf7/nope: no such entry']);
    expect(r.report.shared).toEqual([{ list: 'ccf7', entry: 'xyz', series: ['a', 'b'] }]);
    expect(r.labels.get('a')).toEqual([]);
    expect(r.labels.get('b')).toEqual([]);
  });
  it('writes labels the way the app shows them', () => {
    expect(labelText({ label_zh: 'CAA', tier: 'A', scope: 'domestic' })).toBe('CAA 国内A');
    expect(labelText({ label_zh: 'CAA', tier: 'A', qualifier_zh: 'GNC 分会' })).toBe('CAA A（GNC 分会）');
    expect(labelText({ label_zh: '科协', tier: 'listed' })).toBe('科协');
  });
});

describe('taxonomy helpers', () => {
  const t: Taxonomy = {
    version: 1,
    disciplines: [
      { id: 'cs', name_zh: '计算机', name_en: 'CS', directions: [{ id: 'cs/ml', name_zh: '机器学习', name_en: 'ML', legacy: ['ml', 'ai'] }, { id: 'cs/theory', name_zh: '理论', name_en: 'Theory' }] },
      { id: 'eng', name_zh: '工程', name_en: 'Eng', directions: [{ id: 'eng/control', name_zh: '控制', name_en: 'Control' }] },
    ],
    category_directions: [],
  };
  it('derives the v0.3 topics from directions', () => {
    expect(legacyTopics(t, ['cs/ml', 'eng/control'])).toEqual(['ml']);
    expect(legacyTopics(t, ['cs/theory'])).toEqual([]);
  });
});

describe('reading ccfddl', () => {
  it('converts its time zones', () => {
    expect(ccfddlTimeZone('AoE')).toBe('AoE');
    expect(ccfddlTimeZone('UTC-12')).toBe('UTC-12');
    expect(ccfddlTimeZone('UTC+0')).toBe('UTC');
    expect(ccfddlTimeZone('UTC')).toBe('UTC');
    expect(ccfddlTimeZone('UTC+8')).toBe('UTC+8');
    expect(ccfddlTimeZone('UTC-7')).toBe('UTC-7');
    expect(ccfddlTimeZone('PT')).toBe('America/Los_Angeles');
    expect(ccfddlTimeZone('Mars/Olympus')).toBeNull();
    expect(ccfddlLocal('2026-07-28 23:59:59')).toBe('2026-07-28T23:59');
    expect(ccfddlLocal('TBD')).toBeNull();
  });
  it('lands AoE, UTC-7 and PT deadlines on the right Beijing time', () => {
    expect(formatIn(toInstant(ccfddlLocal('2026-11-05 23:59:59')!, ccfddlTimeZone('AoE')!))).toBe('2026-11-06 19:59');
    expect(formatIn(toInstant(ccfddlLocal('2026-09-16 23:59:59')!, ccfddlTimeZone('UTC-7')!))).toBe('2026-09-17 14:59');
    // PT follows daylight saving: PDT in September, PST in December.
    expect(formatIn(toInstant(ccfddlLocal('2026-09-16 23:59:59')!, ccfddlTimeZone('PT')!))).toBe('2026-09-17 14:59');
    expect(formatIn(toInstant(ccfddlLocal('2026-12-01 23:59:59')!, ccfddlTimeZone('PT')!))).toBe('2026-12-02 15:59');
  });
  it('reads conference dates, and refuses inexact ones', () => {
    expect(parseCcfddlDates('February 16-23, 2027')).toEqual({ start: '2027-02-16', end: '2027-02-23' });
    expect(parseCcfddlDates('29 June - 3 July, 2026')).toEqual({ start: '2026-06-29', end: '2026-07-03' });
    expect(parseCcfddlDates('January 31 - 4 February, 2026')).toEqual({ start: '2026-01-31', end: '2026-02-04' });
    expect(parseCcfddlDates('Oct. 6-10, 2025')).toEqual({ start: '2025-10-06', end: '2025-10-10' });
    expect(parseCcfddlDates('August 7-13 and August 15-17, 2027')).toEqual({ start: '2027-08-07', end: '2027-08-17' });
    expect(parseCcfddlDates('December 30 - January 2, 2027')).toEqual({ start: '2026-12-30', end: '2027-01-02' });
    for (const t of ['TBD', 'Dec, 2025', 'March-April, 2025', 'May 2027 (exact dates TBD)', 'September 31, 2026']) expect(parseCcfddlDates(t), t).toBeNull();
  });
  it('reads places without guessing countries', () => {
    expect(parseCcfddlPlace('Vancouver, British Columbia, Canada')).toEqual({ city: 'Vancouver', country: 'Canada', country_code: 'CA' });
    expect(parseCcfddlPlace('Honolulu, HI')).toEqual({ city: 'Honolulu' });
    expect(parseCcfddlPlace('Singapore')).toEqual({ city: 'Singapore', country: 'Singapore', country_code: 'SG' });
    expect(parseCcfddlPlace('Singapore EXPO')).toBeUndefined();
  });
  it('makes an upstream edition: rounds by comment, TBD as tba, provenance kept', () => {
    const s = { title: 'IEEE CEC', description: 'IEEE Congress on Evolutionary Computation', sub: 'AI', rank: { ccf: 'C' }, dblp: 'cec' };
    const { edition, notes } = upstreamEdition(
      s,
      {
        year: 2027,
        id: 'cec27',
        link: 'https://example.org',
        timeline: [{ deadline: '2026-11-01 23:59:59', comment: 'Round 1' }, { abstract_deadline: 'TBD', deadline: '2027-01-15 23:59:59', comment: 'Round 2' }],
        timezone: 'UTC-12',
        date: 'June 28 - July 2, 2027',
        place: 'Kyoto, Japan',
      },
      'cec',
      '2026-09-25',
    );
    expect(notes).toEqual([]);
    expect(edition).toMatchObject({ id: 'cec-2027', series: 'cec', name: 'IEEE CEC 2027', data_level: 'upstream', last_checked: '2026-09-25' });
    expect(edition.upstream).toEqual({ source: 'ccfddl', key: 'AI/IEEE CEC', conf_id: 'cec27', link: 'https://example.org', place: 'Kyoto, Japan', date: 'June 28 - July 2, 2027', timezone: 'UTC-12' });
    expect(edition.location).toEqual({ city: 'Kyoto', country: 'Japan', country_code: 'JP' });
    expect(edition.milestones).toEqual([
      { type: 'paper', at: '2026-11-01T23:59', tz: 'UTC-12', status: 'confirmed', label_zh: 'Round 1' },
      { type: 'abstract', tz: 'UTC-12', status: 'tba', label_zh: 'Round 2' },
      { type: 'paper', at: '2027-01-15T23:59', tz: 'UTC-12', status: 'confirmed', label_zh: 'Round 2' },
      { type: 'conference', start: '2027-06-28', end: '2027-07-02', tz: 'UTC-12', status: 'confirmed' },
    ]);
  });
  it('knows what is upcoming on the pin date', () => {
    expect(isUpcoming({ year: 2026, id: 'x26', date: 'September 20-24, 2026' }, '2026-09-25')).toBe(false);
    expect(isUpcoming({ year: 2026, id: 'x26', date: 'September 24-26, 2026' }, '2026-09-25')).toBe(true);
    expect(isUpcoming({ year: 2027, id: 'x27', date: 'TBD' }, '2026-09-25')).toBe(true);
  });
  it('makes series ids from titles', () => {
    expect(ccfddlSeriesSlug('IEEE VR')).toBe('vr');
    expect(ccfddlSeriesSlug('S&P')).toBe('sp');
    expect(ccfddlSeriesSlug('IEEE/ACM CGO')).toBe('cgo');
    expect(ccfddlSeriesSlug('USENIX Security')).toBe('usenix-security');
    expect(ccfddlSeriesSlug('IFIP WG 11.9')).toBe('ifip-wg-11-9');
  });
});
