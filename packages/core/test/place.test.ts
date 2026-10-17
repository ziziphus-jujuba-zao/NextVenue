// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Chinese city names (data/cities.yml) and reading ccfddl's free-text place:
// every edition's city resolves or is listed as unknown, the owner's list of
// cities has its standard names, and the tricky places read right.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cityIndex, editionPlace, findCity, loadRepoData, parsePlace, placeKey, placeProblems, sitePlace, type CitiesFile, type Edition } from '../src/index.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const data = loadRepoData(ROOT);
const file = data.cities!.value;
const index = cityIndex(file);
const edition = (id: string) => data.editions.find((e) => e.value.id === id)!.value;
const placeOf = (id: string) => editionPlace(edition(id), file, index);

describe('data/cities.yml against every edition', () => {
  it('resolves every edition city (or lists it as unknown), with Chinese names for every country', () => {
    const p = placeProblems(data.editions, file);
    expect(p.errors).toEqual([]);
    expect(p.warnings).toEqual([]);
  });

  it('gives every edition with a place a Chinese city, or only a country for a name listed as unknown', () => {
    const unknown = new Set((file.unknown ?? []).map(placeKey));
    for (const { value: ed } of data.editions) {
      if (ed.kind !== 'conference') continue;
      for (const s of ed.sites ?? []) expect(sitePlace(s, file, index).city, `${ed.id} ${s.id}`).toMatch(/[一-鿿]/);
      const p = editionPlace(ed, file, index);
      if (!p) continue;
      if (p.city) expect(p.city, ed.id).toMatch(/[一-鿿]/);
      // Only a country: the data names no city (CCC 2027: China), or its name is listed as unknown (ccfddl: "Taiwan").
      else if (ed.upstream?.place ?? ed.location?.city) expect(unknown.has(placeKey(ed.upstream?.place ?? ed.location?.city ?? '')), ed.id).toBe(true);
      expect(p.raw, ed.id).toBeUndefined();
      if (p.country_code) expect(p.country, ed.id).toBe(file.countries[p.country_code]);
    }
  });

  it('uses the standard Chinese names', () => {
    const zh = (name: string, cc?: string) => findCity(index, name, { cc, first: true })?.name_zh;
    expect({
      Seattle: zh('Seattle'),
      'San Francisco': zh('San Francisco'),
      Montréal: zh('Montréal'),
      Montreal: zh('Montreal'),
      Vancouver: zh('Vancouver'),
      Sydney: zh('Sydney'),
      Seoul: zh('Seoul'),
      Kyoto: zh('Kyoto'),
      Tokyo: zh('Tokyo'),
      Singapore: zh('Singapore'),
      Vienna: zh('Vienna'),
      'Hong Kong': zh('Hong Kong'),
      Shenzhen: zh('Shenzhen'),
      Boulder: zh('Boulder'),
      Honolulu: zh('Honolulu'),
      Lisbon: zh('Lisbon'),
      Amsterdam: zh('Amsterdam'),
      Athens: zh('Athens'),
      Copenhagen: zh('Copenhagen'),
      Brussels: zh('Brussels'),
      Chicago: zh('Chicago'),
      Philadelphia: zh('Philadelphia'),
      'Washington, D.C.': zh('Washington, D.C.'),
    }).toEqual({
      Seattle: '西雅图',
      'San Francisco': '旧金山',
      Montréal: '蒙特利尔',
      Montreal: '蒙特利尔',
      Vancouver: '温哥华',
      Sydney: '悉尼',
      Seoul: '首尔',
      Kyoto: '京都',
      Tokyo: '东京',
      Singapore: '新加坡',
      Vienna: '维也纳',
      'Hong Kong': '香港',
      Shenzhen: '深圳',
      Boulder: '博尔德',
      Honolulu: '檀香山',
      Lisbon: '里斯本',
      Amsterdam: '阿姆斯特丹',
      Athens: '雅典',
      Copenhagen: '哥本哈根',
      Brussels: '布鲁塞尔',
      Chicago: '芝加哥',
      Philadelphia: '费城',
      'Washington, D.C.': '华盛顿',
    });
    expect(file.countries).toMatchObject({ US: '美国', CN: '中国', HK: '中国香港', MO: '中国澳门', TW: '中国台湾', GB: '英国', FR: '法国' });
  });
});

describe('places of real editions', () => {
  it('CVPR 2027: Seattle, the venue zone from the curated conference', () => {
    expect(placeOf('cvpr-2027')).toEqual({ city: '西雅图', city_en: 'Seattle', country_code: 'US', country: '美国', country_en: 'USA', tz: 'America/Los_Angeles' });
  });

  it('FSE 2027 in Shenzhen, ACM MM 2027 in Hong Kong (HK, not CN), COLING 2027 in Macau', () => {
    expect(placeOf('fse-se-2027')).toMatchObject({ city: '深圳', country: '中国', country_code: 'CN', tz: 'Asia/Shanghai' });
    expect(placeOf('mm-2027')).toMatchObject({ city: '香港', country: '中国香港', country_code: 'HK' });
    expect(placeOf('coling-2027')).toMatchObject({ city: '澳门', country: '中国澳门', country_code: 'MO' });
  });

  it('NeurIPS 2026 has no single place: each site has one', () => {
    const ed = edition('neurips-2026');
    expect(editionPlace(ed, file, index)).toBeUndefined();
    expect(ed.sites!.map((s) => sitePlace(s, file, index).city)).toEqual(['悉尼', '亚特兰大', '巴黎']);
  });

  it('a place not published is undefined (ICML 2027, ccfddl "TBD")', () => {
    expect(placeOf('icml-2027')).toBeUndefined();
    expect(placeOf('mobicom-2027')).toBeUndefined();
  });

  it('upstream: the city zone stands in for the deadline zone, the hall before the city is the building', () => {
    // ccfddl gives Snowbird's deadlines in Pacific time; the venue is in Utah.
    expect(placeOf('dcc-2027')).toMatchObject({ city: '雪鸟', tz: 'America/Denver' });
    expect(placeOf('sc-2026')).toMatchObject({ city: '芝加哥', building: 'McCormick Place', tz: 'America/Chicago' });
    // "Hong Kong SAR, China": Hong Kong, not mainland China (its visa differs).
    expect(placeOf('aplas-2026')).toMatchObject({ city: '香港', country_code: 'HK' });
    expect(placeOf('ats-2026')).toEqual({ country_code: 'TW', country: '中国台湾', country_en: 'Taiwan' });
  });
});

describe('parsePlace', () => {
  const small: CitiesFile = {
    countries: {},
    cities: [
      { name: 'San Antonio', name_zh: '圣安东尼奥', country_code: 'US', tz: 'America/Chicago' },
      { name: 'Singapore', name_zh: '新加坡', country_code: 'SG', tz: 'Asia/Singapore' },
      { name: 'Hong Kong', name_zh: '香港', country_code: 'HK', tz: 'Asia/Hong_Kong', aliases: ['Hong Kong SAR'] },
      { name: 'Hsinchu', name_zh: '新竹', country_code: 'TW', tz: 'Asia/Taipei' },
      { name: 'Washington', name_zh: '华盛顿', country_code: 'US', tz: 'America/New_York', region: true, aliases: ['Washington DC'] },
      { name: 'Columbia', name_zh: '哥伦比亚', country_code: 'US', tz: 'America/New_York', state: ['SC', 'South Carolina'] },
      { name: 'Kingston', name_zh: '金斯顿', country_code: 'CA', tz: 'America/Toronto' },
      { name: 'Montréal', name_zh: '蒙特利尔', country_code: 'CA', tz: 'America/Toronto' },
    ],
  };
  const idx = cityIndex(small);
  const city = (text: string, cc?: string) => parsePlace(text, idx, cc)?.city?.name_zh;

  it('ignores case, accents and dots', () => {
    expect(placeKey('Washington, D.C.')).toBe('washington dc');
    expect(city('Montreal, Canada')).toBe('蒙特利尔');
  });

  it('reads a city inside a longer name when no part is a city', () => {
    expect(parsePlace('Grand Hyatt San Antonio Riverwalk, TX, USA', idx)).toMatchObject({ city: { name: 'San Antonio' }, building: 'Grand Hyatt San Antonio Riverwalk' });
  });

  it('takes a city-state from the country part', () => {
    expect(parsePlace('Nanyang Technological University, Singapore', idx)).toMatchObject({ city: { name: 'Singapore' }, building: 'Nanyang Technological University' });
  });

  it('accepts Hong Kong and Taiwan places written "…, China", and fullwidth commas', () => {
    expect(city('Hong Kong SAR, China')).toBe('香港');
    expect(city('Hsinchu, Taiwan， China')).toBe('新竹');
  });

  it('takes a state name as a city only in first place, and checks a US state', () => {
    expect(city('Washington, D.C., USA')).toBe('华盛顿');
    expect(city('Spokane, Washington, USA')).toBeUndefined();
    expect(city('Columbia, SC, USA')).toBe('哥伦比亚');
    expect(city('Columbia, MO, USA')).toBeUndefined();
    // A known country rules out a namesake elsewhere (Kingston, Jamaica).
    expect(city('Kingston, Jamaica')).toBeUndefined();
    expect(city('Kingston, Canada')).toBe('金斯顿');
  });

  it('keeps the words when no city can be read, and a lone country as the country', () => {
    expect(parsePlace('Somewhere Hall, Nowhere', idx)).toEqual({ raw: 'Somewhere Hall, Nowhere', country_code: undefined, country_en: undefined });
    expect(parsePlace('Barbados', idx)).toEqual({ country_code: 'BB', country_en: 'Barbados' });
    expect(parsePlace('TBD', idx)).toBeUndefined();
    expect(parsePlace('Mainz, Germany (hybrid)', cityIndex({ cities: [{ name: 'Mainz', name_zh: '美因茨', country_code: 'DE', tz: 'Europe/Berlin' }] }))?.city?.name_zh).toBe('美因茨');
  });

  it('a curated edition keeps its own conference zone', () => {
    const ed = {
      kind: 'conference',
      data_level: 'curated',
      location: { city: 'Singapore', country: 'Singapore', country_code: 'SG' },
      milestones: [{ type: 'conference', tz: 'Asia/Singapore', status: 'tba' }],
    } as unknown as Edition;
    expect(editionPlace(ed, { ...small, countries: { SG: '新加坡' } }, idx)).toEqual({
      city: '新加坡',
      city_en: 'Singapore',
      country_code: 'SG',
      country: '新加坡',
      country_en: 'Singapore',
      tz: 'Asia/Singapore',
    });
  });
});
