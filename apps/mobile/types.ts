// Copyright (c) 2026 Zayier Xie. All rights reserved.

// The slim data the app ships inline. scripts/build-app.ts derives it from
// dist/bundle.json; only fields the screens read are kept.

import type { AreaFile, StatsAlso, StatsFile, StatsRow, TopicRow, TopicsFile } from '../../packages/core/src/stats.ts';

export type Answer =
  | 'required'
  | 'allowed'
  | 'not_allowed'
  | 'conditional'
  | 'unspecified'
  | 'not_required'
  | 'contradictory';

export interface ResolvedTime {
  /** Wall-clock time in `tz`: YYYY-MM-DD or YYYY-MM-DDTHH:mm. */
  local: string;
  tz: string;
  /** ISO instant, e.g. 2026-09-26T11:59:00Z. */
  utc: string;
  /** "YYYY-MM-DD HH:mm" in Beijing time. */
  beijing: string;
}

export interface AppMilestone {
  type: string;
  label_zh?: string;
  tz: string;
  /** The venue wrote no time zone; `tz` is this app's assumption. */
  tz_assumed?: boolean;
  /** The venue marks the date tentative (官网暂定); it is still the venue's own date. */
  tentative?: boolean;
  /** An estimate built from an earlier edition's page (往年原文), not from this edition's own wording ("mid March"). */
  from_prev?: true;
  status: 'confirmed' | 'estimated' | 'tba';
  at_resolved?: ResolvedTime;
  start_resolved?: ResolvedTime;
  end_resolved?: ResolvedTime;
  note_zh?: string;
  /** Official pages disagree on this date (app wording, apps/mobile/copy.ts). */
  disputed?: boolean;
  quote?: string;
  src_title?: string;
  deep_link?: string;
  /** Only for one site of a multi-site edition (a `sites[].id`). */
  site?: string;
  /** From an upstream edition (ccfddl): shown with the 未核对 tag, never as the venue's own wording. */
  upstream?: true;
}

// ---------- after acceptance (MOBILE_SPEC §10) ----------

/**
 * Where a value comes from, as the app shows it: the official wording and a
 * link that opens the page at it. Built from `src` + `quote` (or a JSON
 * source's URL) when the app data is made; `src` itself is not shipped.
 */
export interface Linked {
  quote?: string;
  link?: string;
  src_title?: string;
  note_zh?: string;
}

/** Not published yet, and the pages that were read. `reference` is last edition's value, never used in calculations. */
export interface AppTba {
  status: 'tba';
  checked?: { title: string; url: string }[];
  note_zh?: string;
  reference?: Record<string, unknown> & Linked & { from: string };
}

export const isTba = (v: unknown): v is AppTba => !!v && typeof v === 'object' && (v as { status?: unknown }).status === 'tba';

export interface AppVenue extends Linked {
  name: string;
  /** Street address, or "tba". */
  address: string;
}

/**
 * Where an edition (or one site) is held, in Chinese: data/cities.yml gives
 * the city's Chinese name, the country's and the city's zone; the build
 * reads ccfddl's free-text place into them (packages/core/src/place.ts).
 */
export interface AppPlace {
  /** 西雅图; the English name when no Chinese one is known. */
  city?: string;
  /** "Seattle", as the data writes it: the address and a map search. */
  city_en?: string;
  country_code?: string;
  /** 美国, 中国香港. */
  country?: string;
  /** "USA", as the data writes it. */
  country_en?: string;
  /** IANA zone of the venue, for the time difference. */
  tz?: string;
  /** A hall or campus named in ccfddl's place ("McCormick Place"). */
  building?: string;
  /** ccfddl's place as written, when no city could be read from it. */
  raw?: string;
}

export interface AppSite {
  id: string;
  city: string;
  country_code: string;
  tz: string;
  venue?: AppVenue | AppTba;
  /** The site's city and country in Chinese. */
  place?: AppPlace;
}

export type RegCategory = 'student' | 'academic' | 'industry';

export interface AppFeeRow extends Linked {
  id: string;
  label_zh: string;
  for: RegCategory[];
  member: 'none' | 'current' | 'new';
  covers_author: boolean;
  amounts: number[];
  tiers?: string[];
}

export interface AppFeeTable extends Linked {
  site?: string;
  currency: string;
  tiers: { id: string; until?: string }[];
  rows: AppFeeRow[];
}

export interface AppLogistics {
  venue?: AppVenue | AppTba;
  fees?: (AppFeeTable | (AppTba & { site?: string }))[];
  coverage?:
    | (Linked & {
        per: 'author' | 'paper' | 'unspecified';
        max_papers?: number | null;
        rate?: 'any' | 'in_person' | 'non_student_in_person';
        extra_zh?: string;
      })
    | AppTba;
  visa_letter?:
    | (Linked & {
        after: 'paid_registration' | 'registration' | 'none';
        how_zh: string;
        how_site_zh?: Record<string, string>;
        lead: 'tba' | { n: number; unit: 'day' | 'business_day' | 'week'; quote?: string };
        url: string;
      })
    | AppTba;
  visa_guidance?: (Linked & { country_code: string; weeks: number | [number, number] })[];
  aid?: (Linked & { id: string; name: string; covers_zh?: string; url: string })[] | AppTba;
  hotels?: (Linked & { name: string; address?: string; rate?: { amount: number; currency: string }; cutoff: string })[] | AppTba;
  sold_out?: (Linked & { site?: string })[];
  poster?: (Linked & { size_zh: string }) | AppTba;
  links?: { kind: string; url: string; site?: string }[];
}

export interface AppVisaLead {
  kind?: 'processing_time' | 'appointment_wait';
  status?: 'tba' | 'unverified';
  note_zh?: string;
  official?: Linked & { value: number; unit: 'day' | 'workday' | 'week' | 'month'; max?: number };
  as_of?: Linked & { date: string };
  includes?: (Linked & { what: string })[];
  excludes?: (Linked & { what: string })[];
  caveat?: Linked;
  app_buffer?: { weeks: number; basis: 'assumption'; note_zh?: string };
  unit?: Linked;
  posts?: (Linked & { id: string; name_zh: string; months: number; qualifier?: 'lt'; avg_months?: number })[];
}

export interface AppVisa {
  id: string;
  name_zh: string;
  passport: 'cn_ordinary';
  last_checked: string;
  requirement: Linked & {
    answer: 'required' | 'visa_free' | 'not_needed';
    visa_zh: string;
    /** The short tag on a venue's place block (港澳通行证); else the answer's word. */
    short_zh?: string;
    conditions_zh?: string;
    until?: string;
  };
  apply?: { label_zh: string; url: string }[];
  fees?: (Linked & { item: string; amount?: number; currency?: string; status?: 'unverified' })[];
  window?: {
    earliest?: Linked & { n: number; unit: 'day' | 'workday' | 'week' | 'month' };
    latest?: Linked & { n: number; unit: 'day' | 'workday' | 'week' | 'month' };
  };
  facts?: (Linked & { id: string; label_zh: string; text_zh?: string; status?: 'tba' | 'unverified' })[];
  lead?: AppVisaLead;
  documents?: (Linked & { item_zh: string })[] | { status: 'tba'; note_zh: string };
  notices?: (Linked & { text_zh: string; date?: string; url?: string })[];
  transit?: (Linked & { item_zh: string })[];
  links?: { label_zh: string; url: string }[];
  note_zh?: string;
}

export interface AppHolidayYear {
  year: number;
  status: 'confirmed' | 'estimated';
  holidays: { name_zh: string; start: string; end: string }[];
  workdays: { date: string; name_zh: string }[];
  notice_zh?: string;
  method_zh?: string;
  link?: string;
}

export interface AppAdminItem extends Linked {
  id: string;
  org_zh: string;
  who: 'student' | 'staff' | 'all';
  topic: string;
  text_zh: string;
  n?: number;
  unit?: 'day' | 'workday' | 'month';
  kind?: 'hard' | 'advice';
}

/** A rank label as the app shows it: "CCF A", "CAA 国内A", "科协" (CAST, only on the listed edition), "CORE A*" (from ccfddl). */
export interface AppRankLabel {
  list: string;
  text: string;
  tier: string;
  kind: 'society' | 'government' | 'university' | 'international';
  category_zh?: string;
  qualifier_zh?: string;
  /** Edition-attached lists (CAST): the year of the listed edition. */
  year?: number;
  /** Taken from ccfddl as it stands, not checked against the list. */
  upstream?: true;
  /** Why a hand-made link holds (data/ranks/mapping.yml), e.g. the list still names HSCC. Only explicit links carry one. */
  note_zh?: string;
}

/** What a label's citation card shows: which list, which edition, where to read it. */
export interface AppRankList {
  id: string;
  label_zh: string;
  name_zh: string;
  edition_zh: string;
  released: string;
  official_url: string;
  kind: AppRankLabel['kind'];
  disclaimer_zh?: string;
}

/**
 * A series as search and the lists need it beyond its editions: full and
 * Chinese names, former names. A series with no edition in the data (most
 * CCF C venues, CRYPTO) also carries what its row and page show: acronym,
 * directions, rank labels and its dblp key.
 */
export interface AppSeriesName {
  id: string;
  full_name?: string;
  name_zh?: string;
  aliases?: string[];
  /** Only for a series without editions (else the editions carry these). */
  acronym?: string;
  directions?: string[];
  labels?: AppRankLabel[];
  dblp?: string;
}

export interface AppTaxonomy {
  disciplines: { id: string; name_zh: string; see_also?: string[]; directions: { id: string; name_zh: string; short_zh?: string }[] }[];
}

export interface AppEdition {
  id: string;
  series: string;
  name: string;
  year: number;
  kind: 'conference' | 'arr_cycle';
  /** v0.3 research directions (ml, cv, nlp, robotics, dm). No longer shipped; read only when `directions` is missing (tests, old data). */
  topics?: string[];
  /** Taxonomy directions of the series, main one first ("cs/theory", "eng/control"). */
  directions?: string[];
  /** Absent means curated. upstream: dates imported from ccfddl, not checked against the venue (MOBILE_SPEC §12). */
  data_level?: 'curated' | 'upstream';
  /** Upstream editions: the venue link ccfddl gives. */
  upstream?: { source: 'ccfddl'; link?: string };
  /** Rank labels in display order (CCF, CAA, CAAI, 科协, then ccfddl's CORE and THCPL). */
  labels?: AppRankLabel[];
  submission_type?: 'full_paper' | 'extended_abstract' | 'abstract' | 'mixed';
  /** The federated event this edition is held within (CPS-IoT Week). */
  federated_with?: { name: string; url?: string };
  /** Whole-edition dates shifted from this earlier edition (e.g. neurips-2026) because the venue has not published yet. */
  derived_from?: string;
  /** Where it is held (absent: 地点待公布, or `sites` hold it). */
  place?: AppPlace;
  /** Editions held in several places at once (NeurIPS 2026: Sydney, Atlanta, Paris). */
  sites?: AppSite[];
  dates?: { start: string; end: string };
  note_zh?: string;
  last_checked: string;
  milestones: AppMilestone[];
  /** What authors need after acceptance: venue, fees, visa letter, aid, hotels, links. */
  logistics?: AppLogistics;
  /** An official page of this edition, for "看官网" beside dates not published yet (curated editions with a 待公布 step). */
  home?: string;
}

export interface AppQuote {
  text: string;
  reading_zh?: string;
  deep_link: string;
  source_title: string;
}

export interface AppRule {
  id: string;
  edition: string;
  family: string;
  question_zh: string;
  short_zh?: string;
  answer: Answer;
  verification: string;
  inherited_from?: string;
  applies?: { from?: string; until?: string; note_zh?: string };
  summary_zh: string;
  detail_zh?: string;
  changed_from_prev_zh?: string;
  /** Milestone-typed fields of post-acceptance effects are kept (refund, hold, fallback, requires). */
  effect?: {
    kind: string;
    target?: string;
    trigger?: string;
    full_until?: string;
    then?: string;
    condition?: { applied_by?: string };
    request_by?: string;
    while?: string;
    until?: string;
    before?: string;
    substitute?: string;
    virtual?: string;
  };
  quotes: AppQuote[];
  checked?: { title: string; url: string }[];
  last_checked: string;
}

// ---------- past statistics (MOBILE_SPEC §11.4) ----------

/**
 * Where a number comes from, as the app shows it: `link` opens the page at
 * the quote (a text fragment on the quote's first part); `manual` marks a
 * quote checked by hand (a post or PDF that cannot be snapshotted).
 */
interface Cited {
  link?: string;
  manual?: boolean;
}

export type AppStatAlso = Omit<StatsAlso, 'src' | 'quote_check'> & Cited;

/** One year (and track) of acceptance statistics: data/stats/<series>.yml. */
export type AppStatRow = Omit<StatsRow, 'src' | 'quote_check' | 'also'> & Cited & { also?: AppStatAlso[] };

export type AppStatsSeries = Omit<StatsFile, 'rows'> & { rows: AppStatRow[] };

/** Official per-area statistics of one year: data/stats/areas/<series>-<year>.yml. */
export type AppAreaFile = Omit<AreaFile, 'src' | 'quote_check' | 'tolerance'> & Cited;

/** Top topics among accepted papers (dblp titles), the first TOPICS_SHOWN only: data/topics/<series>-<year>.json. */
export type AppTopics = Omit<TopicsFile, 'schema' | 'topics' | 'official_accepted'> & {
  official_accepted: { value: number; source_url: string; quote: string } & Cited;
  topics: TopicRow[];
};

export interface AppData {
  bundle_hash: string;
  built_at: string;
  editions: AppEdition[];
  rules: AppRule[];
  /** Destination country (ISO alpha-2) → visa file id, or "none" (mainland China); and the visa files. */
  visa?: { countries: Record<string, string>; regimes: AppVisa[] };
  /** Holiday years for the working-day engine, and school-rule examples. */
  china?: { holidays: AppHolidayYear[]; admin: AppAdminItem[]; admin_note_zh?: string };
  /** The lists rank labels cite. */
  rank_lists?: AppRankList[];
  /** Disciplines → directions, for the direction picker. */
  taxonomy?: AppTaxonomy;
  /** Series names beyond the acronym, for search and the venue header: "Chinese Control Conference", "中国控制会议". */
  series?: AppSeriesName[];
  /** Where upstream editions came from, for the credit line (ccfddl, MIT). */
  upstream?: { source: string; repo: string; license: string; as_of: string };
  /** Series that have past data: the page knows without loading stats.js (§11.4). */
  past_series?: string[];
  /** The third-party notices (NOTICE), shown under 我的 → 版权与第三方数据. */
  notice?: string;
  /** Past acceptance statistics by series, official per-area files, top topics (§11.4). Shipped as stats.js beside the page. */
  stats?: AppStatsSeries[];
  areas?: AppAreaFile[];
  topics?: AppTopics[];
}
