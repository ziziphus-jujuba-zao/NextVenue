// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Where an edition is held, in Chinese. data/cities.yml maps the English
// city names in the data (a curated edition's location.city, a site's city,
// a part of ccfddl's free-text place) to a Chinese name, a country and the
// city's time zone. Upstream places are read best-effort ("McCormick Place,
// Chicago, Illinois, USA" → 芝加哥, building McCormick Place); what cannot be
// read stays as ccfddl wrote it. Pure: the build, validate and tests share it.

import { COUNTRY_CODES } from './ccfddl.ts';
import type { Edition, Site } from './types.ts';

export interface CityEntry {
  /** The English name as the data writes it. */
  name: string;
  name_zh: string;
  country_code: string;
  /** IANA zone of the city. */
  tz: string;
  aliases?: string[];
  /** The name is also a state (Washington, New York): a city only as the first part of a place. */
  region?: boolean;
  /** When a state follows the city in a place, it must be one of these ("Columbia, SC"). */
  state?: string[];
}

export interface CitiesFile {
  /** ISO 3166-1 alpha-2 → 中文国家或地区名. */
  countries: Record<string, string>;
  cities: CityEntry[];
  /** Place names in the data that name no city (only a country or region). */
  unknown?: string[];
}

/** Where an edition (or one site) is held, as the app shows it. */
export interface Place {
  /** The city in Chinese; its English name when no Chinese one is known. */
  city?: string;
  /** The city as the data writes it, for the address and a map search. */
  city_en?: string;
  country_code?: string;
  /** 中文国家或地区名: 美国, 中国香港. */
  country?: string;
  /** The country as the data writes it ("USA"). */
  country_en?: string;
  /** IANA zone of the venue: a site's, a curated edition's conference zone, else the city's. */
  tz?: string;
  /** A hall or campus named before the city in ccfddl's place ("McCormick Place"). */
  building?: string;
  /** ccfddl's place as written, when no city could be read from it. */
  raw?: string;
}

/**
 * The 29 Schengen states (since 2025-01-01, when Bulgaria and Romania joined
 * fully). One short-stay visa covers them all, so data/visa/countries.yml
 * routes each to `schengen`; validate checks it, so a venue in a member the
 * data had not met before (Stockholm, Kraków) keeps its visa tag.
 */
export const SCHENGEN = [
  'AT', 'BE', 'BG', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IS',
  'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

/** Case, accents, dots and commas do not count: "Washington, D.C." = "washington dc", "Montréal" = "montreal". */
export function placeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’‘]/g, '')
    .replace(/[\s,，]+/g, ' ')
    .trim();
}

interface Hit {
  entry: CityEntry;
  /** Matched the entry's own name (not an alias): `region` applies. */
  primary: boolean;
}

export type CityIndex = Map<string, Hit[]>;

export function cityIndex(file: Pick<CitiesFile, 'cities'>): CityIndex {
  const out: CityIndex = new Map();
  const add = (k: string, h: Hit) => {
    const list = out.get(k) ?? [];
    if (!list.some((x) => x.entry === h.entry)) list.push(h);
    out.set(k, list);
  };
  for (const entry of file.cities) {
    add(placeKey(entry.name), { entry, primary: true });
    for (const a of entry.aliases ?? []) add(placeKey(a), { entry, primary: false });
  }
  return out;
}

/** Hong Kong, Macau and Taiwan places are often written "…, China": a hint of CN accepts them. */
const inCountry = (entryCc: string, cc: string | undefined) => !cc || entryCc === cc || (cc === 'CN' && ['HK', 'MO', 'TW'].includes(entryCc));

let englishNames: Map<string, string> | undefined;

/** Every country's English name (from the runtime's region names), for a country ccfddl's table does not list ("Jamaica"). */
function englishCountries(): Map<string, string> {
  if (englishNames) return englishNames;
  englishNames = new Map();
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    const A = 65;
    for (let i = 0; i < 26; i++)
      for (let j = 0; j < 26; j++) {
        const code = String.fromCharCode(A + i, A + j);
        let name: string | undefined;
        try {
          name = dn.of(code);
        } catch {
          name = undefined;
        }
        if (name && name !== code && !/unknown/i.test(name)) englishNames.set(placeKey(name), code);
      }
  } catch {
    /* no region names in this runtime: ccfddl's table only */
  }
  return englishNames;
}

/** The country a name stands for ("USA", "The Netherlands", "Türkiye", "Jamaica"), as ccfddl writes it. */
export function countryCodeOf(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return COUNTRY_CODES[name.trim().toLowerCase()] ?? COUNTRY_CODES[placeKey(name)] ?? englishCountries().get(placeKey(name));
}

/**
 * The city `text` names. `cc`: only one in that country. `first`: the text
 * is the first part of a place (or the whole city field), so a name that is
 * also a state counts. `state`: the part after it, when that is a state.
 */
export function findCity(index: CityIndex, text: string, opts: { cc?: string; first?: boolean; state?: string } = {}): CityEntry | undefined {
  const hits = (index.get(placeKey(text)) ?? []).filter(
    (h) =>
      inCountry(h.entry.country_code, opts.cc) &&
      (opts.first || !h.primary || !h.entry.region) &&
      (!opts.state || !h.entry.state || h.entry.state.some((s) => placeKey(s) === placeKey(opts.state!))),
  );
  return hits.length === 1 ? hits[0]!.entry : undefined;
}

const TBD = new Set(['tbd', 'tba', 'online', 'virtual']);

/**
 * Read ccfddl's free-text place: the first part that is a known city is the
 * city, parts before it are the building; the last part may be the country.
 * A part that only contains a city name ("Grand Hyatt San Antonio Riverwalk")
 * is read when no part is a city. Nothing readable: `raw` (or only the
 * country, for "Taiwan").
 */
export function parsePlace(text: string, index: CityIndex, ccHint?: string): { city?: CityEntry; cityText?: string; country_code?: string; country_en?: string; building?: string; raw?: string } | undefined {
  const clean = text
    .replace(/\s*\((?:hybrid|virtual|online)\)/gi, '')
    .replace(/\s+(?:&|and)\s+(?:virtual|online)\s*$/i, '')
    .trim();
  if (!clean || TBD.has(placeKey(clean))) return undefined;
  const parts = clean.split(/\s*[,，]\s*/).filter(Boolean);
  const last = parts[parts.length - 1]!;
  const lastCc = countryCodeOf(last);
  const cc = lastCc ?? ccHint;
  // Parts that may name the city: all but a trailing country (a lone "Singapore" is both).
  const n = lastCc && parts.length > 1 ? parts.length - 1 : parts.length;
  const stateAfter = (i: number) => (i + 1 < n ? parts[i + 1] : undefined);
  const country_en = lastCc ? last : undefined;
  for (let i = 0; i < n; i++) {
    const city = findCity(index, parts[i]!, { cc, first: i === 0, state: stateAfter(i) });
    if (city) return { city, cityText: parts[i], country_code: city.country_code, country_en, building: parts.slice(0, i).join(', ') || undefined };
  }
  // A city-state as the country part: "Nanyang Technological University, Singapore".
  const state = n < parts.length ? findCity(index, last, { cc, first: true }) : undefined;
  if (state) return { city: state, cityText: last, country_code: state.country_code, country_en, building: parts.slice(0, n).join(', ') || undefined };
  // "Santa Clara University", "Grand Hyatt San Antonio Riverwalk": a known city inside a longer name.
  for (let i = 0; i < n; i++) {
    const words = ` ${placeKey(parts[i]!)} `;
    for (const [k, hits] of index) {
      // Only inside a longer name: a part that is the name itself was already tried (and ruled out by its country or state).
      if (k.length < 5 || words === ` ${k} ` || !words.includes(` ${k} `)) continue;
      const h = hits.filter((x) => inCountry(x.entry.country_code, cc) && !(x.primary && x.entry.region));
      if (h.length === 1) return { city: h[0]!.entry, cityText: h[0]!.entry.name, country_code: h[0]!.entry.country_code, country_en, building: parts.slice(0, i + 1).join(', ') };
    }
  }
  if (parts.length === 1 && lastCc) return { country_code: lastCc, country_en: last };
  return { country_code: cc, country_en, raw: clean };
}

/** Is the venue's own conference zone usable (an IANA zone, not AoE or a fixed offset)? */
const ianaZone = (tz: string | undefined) => (tz && tz.includes('/') ? tz : undefined);

/**
 * Where an edition is held, in Chinese. Undefined when not published (or
 * for a multi-site edition: each site has its own, `sitePlace`). A curated
 * edition's conference zone is the venue's own and wins; an upstream one
 * only has its deadline zone, so the city's zone stands in.
 */
export function editionPlace(ed: Pick<Edition, 'data_level' | 'location' | 'sites' | 'milestones' | 'upstream' | 'kind'>, file: CitiesFile, index: CityIndex): Place | undefined {
  if (ed.kind !== 'conference' || ed.sites?.length) return undefined;
  const conf = ed.milestones.find((m) => m.type === 'conference' && !m.site);
  const ownTz = ed.data_level === 'upstream' ? undefined : ianaZone(conf?.tz);
  const hint = ed.location?.country_code ?? countryCodeOf(ed.location?.country);
  const withCountry = (p: Place): Place => {
    if (p.country_code && file.countries[p.country_code]) p.country = file.countries[p.country_code];
    for (const k of Object.keys(p) as (keyof Place)[]) if (p[k] === undefined) delete p[k];
    return p;
  };
  if (ed.data_level === 'upstream' && ed.upstream?.place) {
    const p = parsePlace(ed.upstream.place, index, hint);
    if (!p) return undefined;
    return withCountry({
      city: p.city?.name_zh,
      city_en: p.cityText,
      country_code: p.country_code,
      country_en: p.country_en ?? ed.location?.country,
      tz: p.city?.tz,
      building: p.building,
      raw: p.raw,
    });
  }
  const loc = ed.location;
  if (!loc || (!loc.city && !loc.country && !loc.country_code)) return undefined;
  const city = loc.city ? findCity(index, loc.city, { cc: hint, first: true }) : undefined;
  return withCountry({
    city: city?.name_zh ?? loc.city,
    city_en: loc.city,
    country_code: city?.country_code ?? hint,
    country_en: loc.country,
    tz: ownTz ?? city?.tz,
  });
}

/** One site of a multi-site edition (NeurIPS 2026: Sydney, Atlanta, Paris). */
export function sitePlace(site: Pick<Site, 'city' | 'country_code' | 'tz'>, file: CitiesFile, index: CityIndex): Place {
  const city = findCity(index, site.city, { cc: site.country_code, first: true });
  const out: Place = { city: city?.name_zh ?? site.city, city_en: site.city, country_code: site.country_code, tz: site.tz };
  const country = file.countries[site.country_code];
  if (country) out.country = country;
  return out;
}

/** UTC offset of `tz` at noon UTC of `day`, in minutes east. */
function offsetAt(tz: string, day: string): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(Date.parse(`${day}T12:00:00Z`)).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!m) return 0;
  const v = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === '-' ? -v : v;
}

/**
 * What is wrong with the cities file against the editions: a city that does
 * not resolve (and is not listed as unknown), a curated conference zone that
 * disagrees with the city's, a country without a Chinese name, a name two
 * entries of one country share, an unknown entry no edition uses.
 */
export function placeProblems(
  editions: { file: string; value: Edition }[],
  file: CitiesFile,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const index = cityIndex(file);
  const unknown = new Set((file.unknown ?? []).map(placeKey));
  const usedUnknown = new Set<string>();

  const seen = new Map<string, string>();
  for (const c of file.cities) {
    if (!file.countries[c.country_code]) errors.push(`data/cities.yml: ${c.name}: country ${c.country_code} has no Chinese name in countries`);
    for (const n of [c.name, ...(c.aliases ?? [])]) {
      const k = `${placeKey(n)}|${c.country_code}`;
      const other = seen.get(k);
      if (other && other !== c.name) errors.push(`data/cities.yml: "${n}" names both ${other} and ${c.name} in ${c.country_code}`);
      seen.set(k, c.name);
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: c.tz });
    } catch {
      errors.push(`data/cities.yml: ${c.name}: unknown tz ${c.tz}`);
    }
  }
  for (const code of new Set(Object.values(COUNTRY_CODES)))
    if (!file.countries[code]) errors.push(`data/cities.yml: countries has no Chinese name for ${code} (a country ccfddl places may name)`);

  for (const { file: f, value: ed } of editions) {
    if (ed.kind !== 'conference') continue;
    for (const s of ed.sites ?? []) {
      if (!findCity(index, s.city, { cc: s.country_code, first: true })) errors.push(`${f}: site ${s.id}: city "${s.city}" (${s.country_code}) is not in data/cities.yml`);
    }
    if (ed.sites?.length) continue;
    const p = editionPlace(ed, file, index);
    if (!p) continue;
    const named = [ed.upstream?.place, ed.location?.city].filter((x): x is string => !!x);
    if (!p.city || p.raw || p.city === p.city_en) {
      const listed = named.find((x) => unknown.has(placeKey(x)));
      if (listed) usedUnknown.add(placeKey(listed));
      else if (named.length)
        errors.push(`${f}: "${ed.data_level === 'upstream' ? ed.upstream?.place : ed.location?.city}" has no city in data/cities.yml (add it, or list the name under unknown)`);
    }
    // A curated edition's conference zone and its city's must agree during the conference.
    const conf = ed.milestones.find((m) => m.type === 'conference' && !m.site);
    const city = ed.data_level !== 'upstream' && ed.location?.city ? findCity(index, ed.location.city, { cc: p.country_code, first: true }) : undefined;
    const day = ed.dates?.start ?? conf?.start;
    if (city && conf && ianaZone(conf.tz) && day && offsetAt(conf.tz, day) !== offsetAt(city.tz, day))
      errors.push(`${f}: conference tz ${conf.tz} disagrees with ${city.name}'s ${city.tz} on ${day}`);
  }
  for (const u of file.unknown ?? []) if (!usedUnknown.has(placeKey(u))) warnings.push(`data/cities.yml: unknown "${u}" is not used by any edition`);
  return { errors, warnings };
}

/**
 * What is missing from the visa routing table (data/visa/countries.yml):
 * a country an edition or a site is held in (curated, or read from ccfddl's
 * place) with no line, and a Schengen state not routed to `schengen`. A line
 * may name a visa file not written yet (GB: uk): the app then says 未收录
 * instead of silently showing no tag for a country it never looked at.
 */
export function visaRouteProblems(editions: { file: string; value: Edition }[], file: CitiesFile, countries: Record<string, string>): string[] {
  const out: string[] = [];
  const index = cityIndex(file);
  for (const { file: f, value: ed } of editions) {
    if (ed.kind !== 'conference') continue;
    const codes = new Set([editionPlace(ed, file, index)?.country_code, ...(ed.sites ?? []).map((s) => s.country_code)]);
    for (const cc of codes)
      if (cc && !countries[cc]) out.push(`${f}: held in ${cc}, which has no line in data/visa/countries.yml (route it to its visa file, or to the id of one not written yet)`);
  }
  for (const cc of SCHENGEN)
    if (countries[cc] !== 'schengen') out.push(`data/visa/countries.yml: ${cc} is a Schengen state; route it to schengen (it is ${countries[cc] ?? 'missing'})`);
  return out;
}
