// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The venue page's place block and sheet (docs/MOBILE_SPEC.md §3.4.1) on the
// real data, 2026-09-25 21:00 Beijing: city and country in Chinese, the time
// difference during the conference (daylight saving included), several
// sites, a place not published yet, and the visa tag.

import { describe, expect, it } from 'vitest';
import { SCHENGEN, loadRepoData, visaRouteProblems } from '@nextvenue/core';
import { appData } from '../../scripts/app-data.ts';
import { buildBundle } from '../../scripts/bundle.ts';
import { ROOT } from '../../scripts/lib.ts';
import { prepareEditions, upcoming } from './logic.ts';
import {
  addressText,
  beijingSpan,
  daysText,
  daysWeekText,
  localOffsetText,
  mapLink,
  milestoneSite,
  placeBlock,
  placeName,
  placeShort,
  prefersAppleMaps,
  steadyOffsetText,
  steadyZoneText,
  utcText,
  visaChip,
  visaSentence,
  zoneText,
} from './place.ts';
import { conferenceDays } from './trip.ts';

const data = appData(buildBundle());
const editions = prepareEditions(data.editions);
const ed = (id: string) => editions.find((e) => e.id === id)!;
const NOW = Date.parse('2026-09-25T21:00:00+08:00');
const block = (id: string) => placeBlock(ed(id), data.visa, NOW);

describe('time difference during the conference', () => {
  it('Seattle in June is on daylight time (UTC−7): 15 hours behind Beijing; in January 16', () => {
    expect(localOffsetText('America/Los_Angeles', '2027-06-20', '2027-06-25')).toBe('当地比北京慢 15 小时');
    expect(localOffsetText('America/Los_Angeles', '2027-01-10', '2027-01-12')).toBe('当地比北京慢 16 小时');
    expect(utcText('America/Los_Angeles', '2027-06-20')).toBe('UTC−7');
    expect(zoneText('America/Los_Angeles', '2027-06-20', '2027-06-25')).toBe('UTC−7 · 当地夏令时');
    expect(zoneText('America/Los_Angeles', '2027-01-10', '2027-01-12')).toBe('UTC−8');
  });

  it('Sydney in December is on daylight time: 3 hours ahead', () => {
    expect(localOffsetText('Australia/Sydney', '2026-12-06', '2026-12-12')).toBe('当地比北京快 3 小时');
    expect(utcText('Australia/Sydney', '2026-12-06')).toBe('UTC+11');
  });

  it('a clock change inside the days gives two parts (Budapest, 10/25/2026)', () => {
    expect(localOffsetText('Europe/Budapest', '2026-10-24', '2026-10-26')).toBe('10/24 当地比北京慢 6 小时，10/25 起慢 7 小时');
    expect(zoneText('Europe/Budapest', '2026-10-24', '2026-10-26')).toBe('UTC+2 · 当地夏令时，之后 UTC+1');
  });

  it('half hours, and the same time as Beijing', () => {
    expect(localOffsetText('Asia/Kolkata', '2027-01-10', '2027-01-12')).toBe('当地比北京慢 2 小时 30 分');
    expect(utcText('Asia/Kolkata', '2027-01-10')).toBe('UTC+5:30');
    expect(localOffsetText('Asia/Hong_Kong', '2027-01-10', '2027-01-12')).toBe('和北京同一时间');
  });

  it('without published days, only a zone that keeps one offset all year says it', () => {
    expect(steadyOffsetText('Asia/Hong_Kong', 2027)).toBe('和北京同一时间');
    expect(steadyOffsetText('Asia/Tokyo', 2027)).toBe('当地比北京快 1 小时');
    expect(steadyOffsetText('America/Los_Angeles', 2027)).toBeUndefined();
    // The zone line under it has the offset too, as it does when the days are known.
    expect(steadyZoneText('Asia/Hong_Kong', 2027)).toBe('UTC+8 · Asia/Hong_Kong');
  });

  it('the days in Beijing time: local midnight to the midnight after the last day', () => {
    expect(beijingSpan('America/Los_Angeles', '2027-06-20', '2027-06-25')).toBe('6/20 15:00 – 6/26 15:00');
    expect(beijingSpan('Australia/Sydney', '2026-12-06', '2026-12-12')).toBe('12/5 21:00 – 12/12 21:00');
    expect(beijingSpan('Asia/Shanghai', '2027-07-12', '2027-07-16')).toBeUndefined();
    expect(beijingSpan('America/New_York', '2027-12-29', '2027-12-31')).toBe('12/29 13:00 – 2028/1/1 13:00');
  });

  it('writes the year when the days are not this year', () => {
    expect(daysText('2027-06-20', '2027-06-25', NOW)).toBe('2027/6/20–6/25');
    expect(daysText('2026-12-06', '2026-12-13', NOW)).toBe('12/6–12/13');
    expect(daysText('2026-12-30', '2027-01-02', NOW)).toBe('2026/12/30–2027/1/2');
    expect(daysWeekText('2027-06-20', '2027-06-25', NOW)).toBe('2027/6/20 周日 – 6/25 周五');
  });
});

describe('the place block, 2026-09-25', () => {
  it('CVPR 2027: 西雅图 · 美国, the days, 15 hours behind, visa needed', () => {
    expect(block('cvpr-2027')).toEqual({
      kind: 'city',
      name: '西雅图 · 美国',
      days: '2027/6/20–6/25',
      estimated: false,
      offset: '当地比北京慢 15 小时',
      building: undefined,
      chip: { text: '需要签证', kind: 'need', regimeId: 'us' },
      tappable: true,
    });
  });

  it('NeurIPS 2026: three sites, the whole span, one visa tag since all three need one', () => {
    const b = block('neurips-2026');
    // Line 1 is the cities (the tag fits beside them); line 2 says 3 地 before the span, and that each site has its own days.
    expect(b).toMatchObject({ kind: 'multi', name: '悉尼 · 亚特兰大 · 巴黎', sites: 3, days: '12/6–12/13', offset: '各地会期、时差见详情', tappable: true });
    expect(b.chip).toEqual({ text: '需要签证', kind: 'need' });
    expect(placeShort(ed('neurips-2026'))).toBe('悉尼等 3 地');
  });

  it('NeurIPS 2026: the next-deadline card under the block names the site whose days it shows', () => {
    const e = ed('neurips-2026');
    const next = upcoming([e], NOW)[0]!.milestone;
    expect(next.type).toBe('conference');
    const own = conferenceDays(e, next.site)!;
    expect(daysText(own.start, own.end, NOW)).toBe('12/6–12/12');
    // Not the block's span, so it must say whose days these are.
    expect(daysText(own.start, own.end, NOW)).not.toBe(block('neurips-2026').days);
    expect(milestoneSite(e, next)).toBe('悉尼');
    // An edition held in one place has no site to name.
    expect(milestoneSite(ed('cvpr-2027'), upcoming([ed('cvpr-2027')], NOW)[0]!.milestone)).toBeUndefined();
  });

  it('IJCAI 2027 in Kyoto and Hengqin: the visa differs by site, and the tag says so', () => {
    const b = block('ijcai-2027');
    expect(b.name).toBe('京都 · 横琴');
    expect(b.sites).toBe(2);
    expect(b.chip).toEqual({ text: '签证各地不同', kind: 'warn' });
  });

  it('a place not published yet (ICML 2027): 地点待公布, nothing to open', () => {
    const b = block('icml-2027');
    expect(b).toMatchObject({ kind: 'tba', name: '地点待公布', tappable: false, days: '2027/7/6–7/11', estimated: true });
    expect(b.chip).toBeUndefined();
    expect(placeShort(ed('icml-2027'))).toBeUndefined();
  });

  it('FSE 2027 in Shenzhen: held in China, no visa', () => {
    expect(block('fse-se-2027')).toMatchObject({ name: '深圳 · 中国', offset: '和北京同一时间', chip: { text: '中国举办 · 无需签证', kind: 'ok' } });
  });

  it('ACM MM 2027 in Hong Kong and COLING 2027 in Macau: the permit, not a visa', () => {
    expect(block('mm-2027')).toMatchObject({ name: '中国香港', offset: '和北京同一时间', chip: { text: '港澳通行证', kind: 'need' } });
    expect(block('coling-2027')).toMatchObject({ name: '中国澳门', chip: { text: '港澳通行证', kind: 'need', regimeId: 'mo' } });
    // The list and the route say the same name as the page.
    expect(placeShort(ed('mm-2027'))).toBe('中国香港');
    expect(placeShort(ed('coling-2027'))).toBe('中国澳门');
    expect(placeShort(ed('cvpr-2027'))).toBe('西雅图');
  });

  it('Brazil is visa-free only until the end of 2026: Interspeech 2027 (August) leads with that, not with 免签', () => {
    const chip = block('interspeech-2027').chip!;
    expect(chip).toEqual({ text: '会期不在免签期', kind: 'warn', regimeId: 'br' });
    expect(chip.text.startsWith('免签')).toBe(false);
    expect(visaSentence(data.visa, 'BR', '2027-08-23')).toMatchObject({ text: '免签只到 2026/12/31，会期在这之后', regimeId: 'br', known: true });
    expect(visaChip(data.visa, 'BR', '2026-11-01')).toMatchObject({ text: '免签', kind: 'ok' });
  });

  it('the sheet\'s visa line: the kind of visa once, and where to look when the app has none', () => {
    // "港澳通行证" is inside the kind of document: said once.
    expect(visaSentence(data.visa, 'HK', '2027-10-01')).toMatchObject({ text: '往来港澳通行证 + 签注（学术交流一般办「其他签注（Q）」）', regimeId: 'hk', known: true });
    expect(visaSentence(data.visa, 'US', '2027-06-20').text).toMatch(/^需要签证 · /);
    expect(visaSentence(data.visa, 'CN')).toMatchObject({ text: '中国大陆举办，不需要签证', known: true });
    // Singapore: routed, no file yet.
    expect(visaChip(data.visa, 'SG', '2027-01-01')).toBeUndefined();
    expect(visaSentence(data.visa, 'SG')).toMatchObject({ text: '未收录', known: false });
    expect(visaSentence(data.visa, 'SG').sub).toContain('使馆官网');
    // Taiwan: no embassy applies.
    expect(visaSentence(data.visa, 'TW').sub).toContain('出入境管理部门');
    expect(visaSentence(data.visa, 'TW').sub).not.toContain('使馆');
  });

  it('upstream (ccfddl): the city read from the free text, the hall as the building, the city zone', () => {
    expect(block('middleware-2026')).toMatchObject({
      name: '塔拉戈纳 · 西班牙',
      days: '12/14–12/18',
      offset: '当地比北京慢 7 小时',
      building: 'Universitat Rovira i Virgili',
      chip: { text: '需要签证' },
    });
    expect(block('sc-2026')).toMatchObject({ name: '芝加哥 · 美国', building: 'McCormick Place' });
    // Only a region in ccfddl's place: the region, and that the city is not known.
    expect(block('ats-2026').name).toBe('中国台湾 · 城市待公布');
  });

  it('the names of a place', () => {
    expect(placeName({ city: '新加坡', country: '新加坡' })).toBe('新加坡');
    expect(placeName({ city: '香港', country: '中国香港' })).toBe('中国香港');
    expect(placeName({ city: 'Springfield', country_en: 'USA' })).toBe('Springfield · USA');
    expect(placeName({ raw: 'Some Hall, Somewhere' })).toBe('Some Hall, Somewhere');
  });
});

describe('visa routing covers every place', () => {
  it('every country an edition or a site is held in has a route; every Schengen state goes to schengen', () => {
    const repo = loadRepoData(ROOT);
    expect(visaRouteProblems(repo.editions.filter((e) => e.value?.milestones), repo.cities!.value, repo.visaCountries!.value)).toEqual([]);
    for (const e of editions) for (const cc of [e.place?.country_code, ...(e.sites ?? []).map((s) => s.country_code)]) if (cc) expect(data.visa!.countries[cc], `${e.id}: ${cc}`).toBeDefined();
    for (const cc of SCHENGEN) expect(data.visa!.countries[cc], cc).toBe('schengen');
    expect(SCHENGEN).toHaveLength(29);
  });

  it('ccfddl venues in Schengen states the curated data had not met get the Schengen tag (Stockholm, Kraków, Tallinn…)', () => {
    for (const id of ['dis-2027', 'gecco-2027', 'wicon-2026', 'iui-2027', 'interact-2027', 'euvip-2026']) expect(block(id).chip, id).toEqual({ text: '需要签证', kind: 'need', regimeId: 'schengen' });
    expect(block('dis-2027').name).toBe('斯德哥尔摩 · 瑞典');
  });

  it('a new country with no line fails the check', () => {
    const repo = loadRepoData(ROOT);
    const { SE: _se, ...without } = repo.visaCountries!.value;
    const p = visaRouteProblems(repo.editions.filter((e) => e.value?.milestones), repo.cities!.value, without);
    expect(p.some((x) => x.includes('dis-2027') && x.includes('SE'))).toBe(true);
    expect(p.some((x) => x.includes('SE is a Schengen state'))).toBe(true);
  });
});

describe('the place sheet', () => {
  it('copies the venue, city and country as written; the street when published', () => {
    expect(addressText(ed('cvpr-2027'))).toBe('Seattle, USA');
    expect(addressText(ed('icra-2027'))).toBe('Coex – Convention & Exhibition Center, 513, Yeongdong-daero, Gangnam-gu, 06164 Seoul, South Korea');
    expect(addressText(ed('middleware-2026'))).toBe('Universitat Rovira i Virgili, Tarragona, Spain');
    const [sydney, , paris] = ed('neurips-2026').sites!;
    expect(addressText(ed('neurips-2026'), sydney)).toBe('ICC Sydney, Australia');
    expect(addressText(ed('neurips-2026'), paris)).toBe('Palais des Congrès de Paris, 2 Place de la Porte Maillot, Paris 17, France');
  });

  it('searches 高德 in the venue\'s city for the mainland, Hong Kong and Macau; Apple 地图 on an iPhone, OpenStreetMap elsewhere', () => {
    const hk = ed('mm-2027');
    const k = encodeURIComponent('香港');
    expect(mapLink(hk.place, addressText(hk))).toEqual({ url: `https://uri.amap.com/search?keyword=${k}&city=${k}&src=nextvenue`, label: '高德地图' });
    const sz = ed('fse-se-2027');
    expect(mapLink(sz.place, addressText(sz))?.url).toContain(`&city=${encodeURIComponent('深圳')}&src=nextvenue`);
    const sea = ed('cvpr-2027');
    expect(mapLink(sea.place, addressText(sea), { apple: true })).toEqual({ url: 'https://maps.apple.com/?q=Seattle%2C%20USA', label: 'Apple 地图' });
    expect(mapLink(sea.place, addressText(sea))).toEqual({ url: 'https://www.openstreetmap.org/search?query=Seattle%2C%20USA', label: 'OpenStreetMap' });
    // Only a country: nothing to search for.
    const ccc = ed('ccc-control-2027');
    expect(mapLink(ccc.place, addressText(ccc))).toBeUndefined();
    expect(placeBlock(ccc, data.visa, NOW)).toMatchObject({ kind: 'country', name: '中国 · 城市待公布', chip: { text: '中国举办 · 无需签证' } });
  });

  it('Apple 地图 only from an iPhone\'s or iPad\'s own browser, not inside WeChat or on Android', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
    expect(prefersAppleMaps(iphone)).toBe(true);
    expect(prefersAppleMaps(`${iphone} MicroMessenger/8.0.50(0x1800322d) NetType/WIFI Language/zh_CN`)).toBe(false);
    expect(prefersAppleMaps('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36')).toBe(false);
    // iPadOS Safari says Macintosh; its touch screen tells it apart from a Mac.
    expect(prefersAppleMaps('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15', true)).toBe(true);
    expect(prefersAppleMaps('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15')).toBe(false);
  });
});
