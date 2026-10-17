// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Where a venue is held, as the venue page shows it (docs/MOBILE_SPEC.md
// §3.4.1): the city and country in Chinese, the days and how far the local
// clock is from Beijing, the building, and whether a mainland passport needs
// a visa. Tapping it opens the place sheet: address, map, local and Beijing
// times, zone, visa. Pure: no DOM, so all of it is unit-tested.

import { BEIJING, formatIn, toInstant } from '../../packages/core/src/time.ts';
import { beijingDate, md, weekday } from './logic.ts';
import { addDays, conferenceDays, offsetMinutes, offsetParts, siteCity, tzOffsetText, visaFor } from './trip.ts';
import { isTba, type AppData, type AppEdition, type AppMilestone, type AppPlace, type AppSite, type AppVenue } from './types.ts';

/** Mainland China, and the regions a mainland map app (高德) covers well. */
const CHINA_MAP = new Set(['CN', 'HK', 'MO', 'TW']);

/**
 * The place's name in one line: "西雅图 · 美国"; "中国香港", "新加坡" when the
 * country already says the city; "中国 · 城市待公布" when only the country is
 * known; ccfddl's own words when no city could be read from them.
 */
export function placeName(p: AppPlace): string {
  if (p.raw) return p.raw;
  const country = p.country ?? p.country_en;
  if (p.city && country) return country.endsWith(p.city) ? country : `${p.city} · ${country}`;
  if (p.city) return p.city;
  return country ? `${country} · 城市待公布` : '';
}

/** "悉尼 · 亚特兰大 · 巴黎": the count goes on the next line ("3 地 · 12/6–12/13"), so the visa tag fits beside the names. */
export function sitesName(sites: Pick<AppSite, 'city' | 'place'>[]): string {
  return sites.map(siteCity).join(' · ');
}

/**
 * The site a milestone of a multi-site edition belongs to ("悉尼" for NeurIPS
 * 2026's first 会议举办): the next-deadline card names it, so Sydney's
 * 12/6–12/12 does not read as the whole 12/6–12/13 the place card shows.
 */
export function milestoneSite(ed: Pick<AppEdition, 'sites'>, m: Pick<AppMilestone, 'site'>): string | undefined {
  const site = m.site ? ed.sites?.find((x) => x.id === m.site) : undefined;
  return site ? siteCity(site) : undefined;
}

export type PlaceKind = 'city' | 'country' | 'raw' | 'multi' | 'tba';

export function placeKind(ed: Pick<AppEdition, 'place' | 'sites'>): PlaceKind {
  if (ed.sites && ed.sites.length > 1) return 'multi';
  const p = ed.place;
  if (!p) return 'tba';
  if (p.raw) return 'raw';
  return p.city ? 'city' : 'country';
}

/**
 * The city a list row or a route stop adds after the dates: "西雅图",
 * "悉尼等 3 地"; the region's own name where it holds the city ("中国香港",
 * "新加坡"), as on the venue page; the country when no city is known
 * ("中国台湾"); nothing when the place is not published or could not be read.
 */
export function placeShort(ed: Pick<AppEdition, 'place' | 'sites'>): string | undefined {
  if (ed.sites && ed.sites.length > 1) return `${siteCity(ed.sites[0]!)}等 ${ed.sites.length} 地`;
  const p = ed.place;
  if (!p || p.raw) return undefined;
  if (p.city && p.country?.endsWith(p.city)) return p.country;
  return p.city ?? p.country;
}

/**
 * "2027/6/20–6/25": the year once, at the start, when the days are not in
 * this (Beijing) year; across a new year both ends carry it.
 */
export function daysText(start: string, end: string, now: number): string {
  const year = beijingDate(now).slice(0, 4);
  const y = (d: string) => `${d.slice(0, 4)}/${md(d)}`;
  if (start.slice(0, 4) !== end.slice(0, 4)) return `${y(start)}–${y(end)}`;
  const s = start.slice(0, 4) === year ? md(start) : y(start);
  return start === end ? s : `${s}–${md(end)}`;
}

/** "当地比北京慢 15 小时", "和北京同一时间"; a clock change inside the days gives two parts. */
export function localOffsetText(tz: string, start: string, end: string): string {
  return tzOffsetText(tz, start, end, { local: true, dst: false });
}

/** "UTC−7", "UTC+5:30", "UTC+8" at noon UTC of `day`. */
export function utcText(tz: string, day: string): string {
  const off = offsetMinutes(tz, Date.parse(`${day}T12:00:00Z`));
  const a = Math.abs(off);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `UTC${off < 0 ? '−' : '+'}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/**
 * The zone line under 时差 when the days are not published: "UTC+8 ·
 * Asia/Hong_Kong", for a zone that keeps one offset all year (the same
 * test as `steadyOffsetText`).
 */
export function steadyZoneText(tz: string, year: number): string {
  return `${utcText(tz, `${year}-01-15`)} · ${tz}`;
}

/** The zone line: "UTC−7 · 当地夏令时" (a change inside the days names both offsets). */
export function zoneText(tz: string, start: string, end: string): string {
  const parts = offsetParts(tz, start, end);
  return parts.map((p) => `${utcText(tz, p.from)}${p.dst ? ' · 当地夏令时' : ''}`).join('，之后 ');
}

/** "2027/8/29 周日 – 9/2 周四": the local days with their weekdays, the year as in `daysText`. */
export function daysWeekText(start: string, end: string, now: number): string {
  const year = beijingDate(now).slice(0, 4);
  const y = (d: string, force: boolean) => `${force ? `${d.slice(0, 4)}/` : ''}${md(d)} ${weekday(d)}`;
  const cross = start.slice(0, 4) !== end.slice(0, 4);
  const first = y(start, cross || start.slice(0, 4) !== year);
  return start === end ? first : `${first} – ${y(end, cross)}`;
}

/**
 * The conference days as Beijing clock times: from local midnight of the
 * first day to local midnight after the last. "6/20 15:00 – 6/26 15:00" for
 * Seattle 6/20–6/25 (UTC−7); a year only where Beijing's day is in another
 * year than the local one. Undefined when the local clock is Beijing's.
 */
export function beijingSpan(tz: string, start: string, end: string): string | undefined {
  const a = formatIn(toInstant(`${start}T00:00`, tz), BEIJING);
  const b = formatIn(toInstant(`${addDays(end, 1)}T00:00`, tz), BEIJING);
  if (a.slice(0, 10) === start && a.slice(11, 16) === '00:00') return undefined;
  const day = (x: string, withYear: boolean) => `${withYear ? `${x.slice(0, 4)}/` : ''}${md(x)} ${x.slice(11, 16)}`;
  return `${day(a, a.slice(0, 4) !== start.slice(0, 4))} – ${day(b, b.slice(0, 4) !== a.slice(0, 4))}`;
}

/**
 * How far the local clock is from Beijing when the days are not published:
 * only for a zone without daylight saving that year (Hong Kong, Tokyo), where
 * the answer does not depend on the days.
 */
export function steadyOffsetText(tz: string, year: number): string | undefined {
  const jan = `${year}-01-15`;
  const jul = `${year}-07-15`;
  if (offsetMinutes(tz, Date.parse(`${jan}T12:00:00Z`)) !== offsetMinutes(tz, Date.parse(`${jul}T12:00:00Z`))) return undefined;
  return localOffsetText(tz, jan, jan);
}

export type ChipKind = 'need' | 'ok' | 'warn';

/**
 * The visa tag for a mainland ordinary passport, from data/visa: "需要签证";
 * "港澳通行证" (the file's own short word); "免签"; "中国举办 · 无需签证".
 * An exemption that ends before the conference leads with that: the tag says
 * "会期不在免签期" (amber), never a word starting 免签 that reads as
 * visa-free at a glance; the sheet says until when (`visaSentence`). None
 * when the country has no file (the app does not guess).
 */
export function visaChip(visa: AppData['visa'], cc: string | undefined, start?: string): { text: string; kind: ChipKind; regimeId?: string } | undefined {
  const v = visaFor(visa, cc);
  if (v.need === 'not_needed') return { text: '中国举办 · 无需签证', kind: 'ok' };
  if (v.need === 'unknown' || !v.regime) return undefined;
  const r = v.regime.requirement;
  if (v.need === 'visa_free') {
    if (lapses(r.until, start)) return { text: '会期不在免签期', kind: 'warn', regimeId: v.regimeId };
    return { text: r.short_zh ?? '免签', kind: 'ok', regimeId: v.regimeId };
  }
  return { text: r.short_zh ?? '需要签证', kind: 'need', regimeId: v.regimeId };
}

/** The exemption ends before the conference starts. */
const lapses = (until: string | undefined, start: string | undefined) => !!until && !!start && start > until;

/** Regions a mainland resident enters with a permit from the exit-entry administration, not a visa from an embassy. */
const PERMIT_REGIONS = new Set(['HK', 'MO', 'TW']);

/** Where to ask when the app has no file: "出入境管理部门" for Hong Kong, Macau and Taiwan, else "使馆官网". */
export function visaAuthority(cc: string | undefined): string {
  return cc && PERMIT_REGIONS.has(cc) ? '出入境管理部门' : '使馆官网';
}

/**
 * The sheet's 签证 row: the conclusion and the kind of visa ("需要签证 · B-1
 * 商务签证"; "港澳通行证" once, not twice); for an exemption that ends before
 * the conference, until when ("免签只到 2026/12/31，会期在这之后"). When the
 * app has no file: where to look, the exit-entry administration for Hong
 * Kong, Macau and Taiwan, else the embassy.
 */
export function visaSentence(visa: AppData['visa'], cc: string | undefined, start?: string): { text: string; sub?: string; regimeId?: string; known: boolean } {
  const v = visaFor(visa, cc);
  if (v.need === 'not_needed') return { text: '中国大陆举办，不需要签证', known: true };
  if (v.need === 'unknown' || !v.regime) {
    const what = cc && PERMIT_REGIONS.has(cc) ? '入境证件' : '签证';
    return { text: '未收录', sub: `本应用还没收录这里的${what}要求，请看会议官网的签证说明和${visaAuthority(cc)}`, known: false };
  }
  const r = v.regime.requirement;
  if (v.need === 'visa_free' && lapses(r.until, start))
    return { text: `免签只到 ${r.until!.slice(0, 4)}/${md(r.until!)}，会期在这之后`, sub: r.conditions_zh, regimeId: v.regimeId, known: true };
  const word = visaChip(visa, cc, start)?.text ?? '';
  const kind = r.visa_zh;
  const text = kind ? (kind.includes(word) ? kind : `${word} · ${kind}`) : word;
  return { text, sub: v.need === 'visa_free' ? r.conditions_zh : undefined, regimeId: v.regimeId, known: true };
}

/** The venue building of an edition or a site, when the data names one (not "待公布"). */
export function venueOf(ed: Pick<AppEdition, 'logistics'>, site?: Pick<AppSite, 'venue'>): AppVenue | undefined {
  const v = site ? site.venue : ed.logistics?.venue;
  return v && !isTba(v) ? v : undefined;
}

/** The building line under the dates: the venue's name, or the hall ccfddl names ("McCormick Place"). */
export function buildingOf(ed: Pick<AppEdition, 'logistics' | 'place'>, site?: Pick<AppSite, 'venue'>): string | undefined {
  return venueOf(ed, site)?.name ?? (site ? undefined : ed.place?.building);
}

/** The English name of a country code ("AU" → "Australia"), for an address when the data gives only the code. */
function countryEn(cc: string | undefined): string | undefined {
  if (!cc) return undefined;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc);
  } catch {
    return undefined;
  }
}

/**
 * The address to copy and search: the venue and its street address when
 * published, else the building; then the city and country as the data
 * writes them ("Seattle, USA"); ccfddl's own words when no city could be read.
 */
export function addressText(ed: Pick<AppEdition, 'logistics' | 'place'>, site?: Pick<AppSite, 'venue' | 'city' | 'country_code' | 'place'>): string {
  const p: AppPlace | undefined = site ? { country_code: site.country_code, ...site.place, city_en: site.place?.city_en ?? site.city } : ed.place;
  if (!p) return '';
  if (p.raw) return p.raw;
  const v = venueOf(ed, site);
  const street = v && v.address !== 'tba' ? v.address : undefined;
  const parts = [v?.name ?? p.building, street];
  const has = (x: string | undefined) => !!x && parts.some((y) => y?.toLowerCase().includes(x.toLowerCase()));
  if (p.city_en && !has(p.city_en)) parts.push(p.city_en);
  const country = p.country_en ?? countryEn(p.country_code);
  if (country && !has(country)) parts.push(country);
  return parts.filter(Boolean).join(', ');
}

/**
 * A map search that opens in China: 高德 (uri.amap.com) for the mainland,
 * Hong Kong, Macau and Taiwan, searched in Chinese in the venue's city;
 * elsewhere, where 高德 has few places, Apple 地图 on an iPhone's own browser
 * (it opens the Maps app; `prefersAppleMaps`) and OpenStreetMap's search on
 * other browsers and inside WeChat. The mini program copies the address
 * instead.
 */
export function mapLink(p: AppPlace | undefined, address: string, opts: { apple?: boolean } = {}): { url: string; label: string } | undefined {
  // Only a country (CCC 2027: China) is nothing to search for.
  if (!p || !address || !searchable(p)) return undefined;
  if (p.country_code && CHINA_MAP.has(p.country_code)) {
    const q = [p.building, p.city ?? p.country].filter(Boolean).join(' ');
    // city= keeps 高德 on the venue's city rather than near the phone; src= is the caller 高德 asks web links to name.
    const city = p.city && !p.raw ? `&city=${encodeURIComponent(p.city)}` : '';
    return { url: `https://uri.amap.com/search?keyword=${encodeURIComponent(q || address)}${city}&src=nextvenue`, label: '高德地图' };
  }
  if (opts.apple) return { url: `https://maps.apple.com/?q=${encodeURIComponent(address)}`, label: 'Apple 地图' };
  return { url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`, label: 'OpenStreetMap' };
}

/** A place with something to search or copy beyond its country (CCC 2027 is only "China"). */
export function searchable(p: AppPlace): boolean {
  return !!(p.city || p.building || p.raw);
}

/**
 * Apple 地图 hands off to the Maps app only from an iPhone or iPad browser
 * that is not an in-app one: WeChat blocks that hand-off (MicroMessenger),
 * and elsewhere maps.apple.com is a web page that may not load in China.
 */
export function prefersAppleMaps(ua: string, touchMac = false): boolean {
  if (/MicroMessenger|QQ\/|Weibo|DingTalk/i.test(ua)) return false;
  return /iPhone|iPad|iPod/.test(ua) || (touchMac && /Macintosh/.test(ua));
}

/** A site's place with its city and zone filled in from the site itself. */
export function sitePlaceOf(site: AppSite): AppPlace {
  return { country_code: site.country_code, tz: site.tz, ...site.place, city: siteCity(site), city_en: site.place?.city_en ?? site.city };
}

/** What the place block says, line by line (the venue page, §3.4.1). */
export interface PlaceBlock {
  kind: PlaceKind;
  /** Line 1: "西雅图 · 美国", "悉尼 · 亚特兰大 · 巴黎", "地点待公布". */
  name: string;
  /** Several sites: how many, said first on line 2 ("3 地 · 12/6–12/13"). */
  sites?: number;
  /** Line 2: "2027/6/20–6/25", with 约 when the days are an estimate; for several sites, from the first site's first day to the last one's last. */
  days?: string;
  estimated?: boolean;
  /** "当地比北京慢 15 小时"; for several sites, that days and clocks differ by site. */
  offset?: string;
  /** Line 3: the building. */
  building?: string;
  chip?: { text: string; kind: ChipKind; regimeId?: string };
  /** Opens the place sheet (nothing to show while the place is not published). */
  tappable: boolean;
}

export function placeBlock(ed: AppEdition, visa: AppData['visa'], now: number): PlaceBlock {
  const kind = placeKind(ed);
  // Several sites: the whole span (NeurIPS 2026 12/6–12/13), not the first site's days.
  const days = kind === 'multi' && ed.dates ? { ...ed.dates, estimated: false } : conferenceDays(ed);
  const out: PlaceBlock = { kind, name: '地点待公布', tappable: kind !== 'tba' };
  if (days) {
    out.days = daysText(days.start, days.end, now);
    out.estimated = days.estimated;
  }
  if (kind === 'multi') {
    const sites = ed.sites!;
    out.name = sitesName(sites);
    out.sites = sites.length;
    out.offset = '各地会期、时差见详情';
    const chips = sites.map((s) => visaChip(visa, s.country_code, conferenceDays(ed, s.id)?.start));
    const first = chips[0];
    if (first && chips.every((c) => c?.text === first.text)) out.chip = { text: first.text, kind: first.kind };
    // Kyoto needs a visa, Hengqin does not: say that the tag depends on the site rather than show none.
    else if (chips.every(Boolean)) out.chip = { text: '签证各地不同', kind: 'warn' };
    return out;
  }
  const p = ed.place;
  if (!p) return out;
  out.name = placeName(p);
  if (p.tz) out.offset = days ? localOffsetText(p.tz, days.start, days.end) : steadyOffsetText(p.tz, ed.year);
  out.building = buildingOf(ed);
  out.chip = visaChip(visa, p.country_code, days?.start);
  return out;
}
