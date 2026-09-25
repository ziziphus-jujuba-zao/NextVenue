// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Reading ccfddl (github.com/ccfddl/ccf-deadlines, MIT): its series records
// and their editions, turned into our upstream editions. Pure functions; the
// file handling is in scripts/import-ccfddl.ts.
//
// ccfddl writes deadlines as "YYYY-MM-DD HH:mm:ss" in the edition's
// `timezone`: "AoE", "UTC-12", "UTC+8", "UTC", "UTC+0", or "PT" (Pacific time,
// daylight saving included). Conference dates are free text ("February 16-23,
// 2027", "29 June - 3 July, 2026", "TBD").

import type { Edition, Milestone, UpstreamRef } from './types.ts';
import { isValidTimeZone, toInstant } from './time.ts';

export interface CcfddlTimelineItem {
  abstract_deadline?: string;
  deadline?: string;
  comment?: string;
}

export interface CcfddlConf {
  year: number;
  id: string;
  link?: string;
  timeline?: CcfddlTimelineItem[];
  timezone?: string;
  date?: string;
  place?: string;
}

export interface CcfddlSeries {
  title: string;
  description: string;
  sub: string;
  rank?: { ccf?: string; core?: string; thcpl?: string };
  dblp?: string;
  confs?: CcfddlConf[];
}

/** Our key for a ccfddl series: "<sub>/<title>" (titles repeat across subs: SE/FSE and SC/FSE). */
export const ccfddlKey = (s: Pick<CcfddlSeries, 'sub' | 'title'>) => `${s.sub}/${s.title}`;

/**
 * ccfddl's `timezone` as one of ours: AoE and fixed offsets as written
 * ("UTC+0" → "UTC"), "PT" → America/Los_Angeles. Null when unknown.
 */
export function ccfddlTimeZone(tz: string | undefined): string | null {
  if (!tz) return null;
  const t = tz.trim();
  if (/^aoe$/i.test(t)) return 'AoE';
  if (/^(PT|PST|PDT|Pacific)$/i.test(t)) return 'America/Los_Angeles';
  const m = /^(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(t);
  if (m) {
    const h = Number(m[2]);
    const min = m[3] ? Number(m[3]) : 0;
    if (h === 0 && min === 0) return 'UTC';
    if (h > 14 || min >= 60) return null;
    return `UTC${m[1]}${h}${min ? `:${String(min).padStart(2, '0')}` : ''}`;
  }
  if (/^(UTC|GMT|Z)$/i.test(t)) return 'UTC';
  return isValidTimeZone(t) ? t : null;
}

/** "2026-07-28 23:59:59" → "2026-07-28T23:59"; "TBD" or garbage → null. Seconds are dropped (never rounded up). */
export function ccfddlLocal(s: string | undefined): string | null {
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?$/.exec(String(s).trim());
  if (!m) return null;
  return m[2] ? `${m[1]}T${m[2]}:${m[3]}` : m[1]!;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const month = (w: string) => MONTHS[w.toLowerCase().replace(/\.$/, '').slice(0, w.toLowerCase().startsWith('sept') ? 4 : 3)];
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function validDate(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/**
 * ccfddl's conference dates as { start, end }, or null when they are not
 * exact days ("TBD", "Dec, 2025", "May 2027 (exact dates TBD)").
 * Handles "February 16-23, 2027", "February 22 - March 1, 2022",
 * "November 29-December 2, 2026", "29 June - 3 July, 2026",
 * "January 31 - 4 February, 2026", "Oct. 6-10, 2025", "July 5, 2026",
 * "November 22-26 2026" and "August 7-13 and August 15-17, 2027" (first to last day).
 */
export function parseCcfddlDates(text: string | undefined, fallbackYear?: number): { start: string; end: string } | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
  const ym = /(?:,\s*|\s)((?:19|20)\d{2})\s*$/.exec(t);
  const year = ym ? Number(ym[1]) : fallbackYear;
  if (!year) return null;
  const body = (ym ? t.slice(0, ym.index) : t).replace(/,\s*$/, '').trim();
  // Day-month pairs in order of appearance: "Month D" or "D Month" (only month names count as months: "13 and August 15").
  const M = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
  const re = new RegExp(`\\b${M}\\s+(\\d{1,2})(?!\\d)|(\\d{1,2})\\s+${M}\\b|(\\d{1,2})(?!\\d)`, 'gi');
  const days: { m?: number; d: number }[] = [];
  for (const m of body.matchAll(re)) {
    if (m[1] && m[2]) {
      const mo = month(m[1]);
      if (!mo) return null;
      days.push({ m: mo, d: Number(m[2]) });
    } else if (m[3] && m[4]) {
      const mo = month(m[4]);
      if (!mo) return null;
      days.push({ m: mo, d: Number(m[3]) });
    } else if (m[5]) days.push({ d: Number(m[5]) });
  }
  if (!days.length || days[0]!.m === undefined) {
    // "29 June - 3 July": the first number may carry its month only after it.
    if (days.length && days[1]?.m !== undefined && days[0]!.m === undefined) days[0]!.m = days[1]!.m;
    else return null;
  }
  // A bare day takes the month of the nearest day before it, or after it for a leading day.
  for (let i = 0; i < days.length; i++) if (days[i]!.m === undefined) days[i]!.m = days[i - 1]?.m ?? days[i + 1]?.m;
  const first = days[0]!;
  const last = days[days.length - 1]!;
  let startYear = year;
  if (last.m! < first.m!) startYear = year - 1; // "December 30 - January 2, 2027"
  if (!validDate(startYear, first.m!, first.d) || !validDate(year, last.m!, last.d)) return null;
  const start = iso(startYear, first.m!, first.d);
  const end = iso(year, last.m!, last.d);
  return start <= end ? { start, end } : null;
}

/** Country name as ccfddl writes it → ISO 3166-1 alpha-2. Unlisted names get no code (we do not guess). */
export const COUNTRY_CODES: Record<string, string> = {
  usa: 'US', us: 'US', 'united states': 'US', 'united states of america': 'US', america: 'US',
  canada: 'CA', mexico: 'MX', brazil: 'BR', argentina: 'AR', chile: 'CL', colombia: 'CO', peru: 'PE', uruguay: 'UY',
  'costa rica': 'CR', panama: 'PA', barbados: 'BB',
  china: 'CN', 'hong kong': 'HK', 'hong kong sar': 'HK', 'hong kong, china': 'HK', macau: 'MO', macao: 'MO', taiwan: 'TW',
  japan: 'JP', korea: 'KR', 'south korea': 'KR', 'republic of korea': 'KR', singapore: 'SG', malaysia: 'MY',
  thailand: 'TH', vietnam: 'VN', 'viet nam': 'VN', indonesia: 'ID', philippines: 'PH', india: 'IN', pakistan: 'PK',
  bangladesh: 'BD', 'sri lanka': 'LK', nepal: 'NP', kazakhstan: 'KZ', cambodia: 'KH',
  australia: 'AU', 'new zealand': 'NZ',
  uk: 'GB', 'united kingdom': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', ireland: 'IE',
  france: 'FR', germany: 'DE', italy: 'IT', spain: 'ES', portugal: 'PT', netherlands: 'NL', 'the netherlands': 'NL',
  belgium: 'BE', luxembourg: 'LU', switzerland: 'CH', austria: 'AT', denmark: 'DK', sweden: 'SE', norway: 'NO',
  finland: 'FI', iceland: 'IS', poland: 'PL', czechia: 'CZ', 'czech republic': 'CZ', slovakia: 'SK', hungary: 'HU',
  slovenia: 'SI', croatia: 'HR', serbia: 'RS', romania: 'RO', bulgaria: 'BG', greece: 'GR', cyprus: 'CY', malta: 'MT',
  estonia: 'EE', latvia: 'LV', lithuania: 'LT', turkey: 'TR', turkiye: 'TR', 'türkiye': 'TR', israel: 'IL',
  'united arab emirates': 'AE', uae: 'AE', qatar: 'QA', 'saudi arabia': 'SA', jordan: 'JO', egypt: 'EG', morocco: 'MA',
  tunisia: 'TN', 'south africa': 'ZA', kenya: 'KE', nigeria: 'NG', rwanda: 'RW',
};

/** "Vancouver, British Columbia, Canada" → city Vancouver, country Canada, CA. One-part places give no city. */
export function parseCcfddlPlace(place: string | undefined): { city?: string; country?: string; country_code?: string } | undefined {
  if (!place) return undefined;
  const parts = place.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) {
    const code = parts[0] ? COUNTRY_CODES[parts[0].toLowerCase()] : undefined;
    return code ? { city: parts[0], country: parts[0], country_code: code } : undefined;
  }
  const last = parts[parts.length - 1]!;
  const code = COUNTRY_CODES[last.toLowerCase()];
  const out: { city?: string; country?: string; country_code?: string } = { city: parts[0] };
  if (code) {
    out.country = last;
    out.country_code = code;
  }
  return out;
}

export interface UpstreamEditionPlan {
  edition: Edition;
  /** What could not be read and was left out or marked tba. */
  notes: string[];
}

/**
 * One ccfddl edition as our upstream edition: abstract and paper deadlines
 * (one pair per timeline row; several rows are rounds, named by ccfddl's
 * comment), and the conference itself. Dates ccfddl marks TBD become tba.
 */
export function upstreamEdition(s: CcfddlSeries, c: CcfddlConf, seriesId: string, asOf: string): UpstreamEditionPlan {
  const notes: string[] = [];
  const tz = ccfddlTimeZone(c.timezone);
  if (!tz) notes.push(`timezone "${c.timezone ?? ''}" not understood; deadlines left tba`);
  const zone = tz ?? 'AoE';
  const rows = c.timeline ?? [];
  const milestones: Milestone[] = [];
  const rounds = rows.length > 1;
  rows.forEach((row, i) => {
    const label = rounds ? (row.comment?.trim() || `Round ${i + 1}`) : undefined;
    const note = !rounds && row.comment ? `ccfddl: ${row.comment.trim()}` : undefined;
    for (const [field, type] of [['abstract_deadline', 'abstract'], ['deadline', 'paper']] as const) {
      const raw = row[field];
      if (raw === undefined) continue;
      const at = tz ? ccfddlLocal(raw) : null;
      const m: Milestone = at ? { type, at, tz: zone, status: 'confirmed' } : { type, tz: zone, status: 'tba' };
      if (tz && !at && String(raw).trim().toUpperCase() !== 'TBD') notes.push(`${field} "${raw}" not understood; left tba`);
      if (at) {
        try {
          toInstant(at, zone);
        } catch (e) {
          notes.push(`${field} "${raw}": ${(e as Error).message}`);
          continue;
        }
      }
      if (label) m.label_zh = label;
      if (note) m.note_zh = note;
      milestones.push(m);
    }
  });
  const dates = parseCcfddlDates(c.date, c.year);
  if (!dates && c.date && c.date.trim().toUpperCase() !== 'TBD') notes.push(`date "${c.date}" not exact days; conference left tba`);
  // Conference days are the venue's local days; ccfddl gives no venue zone, so the deadline zone stands in (days only, no time).
  milestones.push(dates ? { type: 'conference', start: dates.start, end: dates.end, tz: zone, status: 'confirmed' } : { type: 'conference', tz: zone, status: 'tba' });

  const upstream: UpstreamRef = { source: 'ccfddl', key: ccfddlKey(s), conf_id: c.id };
  if (c.link) upstream.link = c.link;
  if (c.place) upstream.place = c.place;
  if (c.date) upstream.date = c.date;
  if (c.timezone) upstream.timezone = c.timezone;
  const location = parseCcfddlPlace(c.place);
  // Keys in the order curated editions use, so the files read the same.
  const edition: Edition = {
    id: `${seriesId}-${c.year}`,
    series: seriesId,
    name: `${s.title} ${c.year}`,
    year: c.year,
    kind: 'conference',
    data_level: 'upstream',
    upstream,
    ...(location ? { location } : {}),
    ...(dates ? { dates } : {}),
    milestones,
    last_checked: asOf,
  };
  return { edition, notes };
}

/**
 * Still ahead on `asOf`: the conference has not ended, or (dates unknown) a
 * deadline is still ahead or the edition's year has not passed.
 */
export function isUpcoming(c: CcfddlConf, asOf: string): boolean {
  const d = parseCcfddlDates(c.date, c.year);
  if (d) return d.end >= asOf;
  const deadlines = (c.timeline ?? []).flatMap((r) => [r.abstract_deadline, r.deadline]).map((x) => ccfddlLocal(x)).filter((x): x is string => !!x);
  if (deadlines.some((x) => x.slice(0, 10) >= asOf)) return true;
  return c.year >= Number(asOf.slice(0, 4));
}

const PUBLISHER_WORD = /^(?:ieee\/acm|acm\/ieee|ieee\/cvf|ieee|acm)\s+/i;

/** A series id for a new ccfddl series: its title without IEEE/ACM, "&" dropped, lower-case, hyphens ("IEEE VR" → "vr", "S&P" → "sp"). */
export function ccfddlSeriesSlug(title: string): string {
  const t = title.trim();
  const bare = t.replace(PUBLISHER_WORD, '');
  const base = /[A-Za-z0-9]/.test(bare) ? bare : t;
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
