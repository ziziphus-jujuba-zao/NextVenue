// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The venue catalog around the editions: series files (data/series/),
// the discipline → direction taxonomy (data/taxonomy.yml), the rank lists
// (data/ranks/<list>.yml) with explicit links (data/ranks/mapping.yml), and
// the upstream manifest written by scripts/import-ccfddl.ts
// (data/upstream/ccfddl.yml). Mirrors schema/{series,taxonomy,rank-list,
// rank-mapping,upstream-ccfddl}.schema.json.

import type { Evidence } from './types.ts';

// ---------- data level ----------

/**
 * curated: written by us from official pages, every fact quoted.
 * upstream: written by an import script from a third-party dataset
 * (ccfddl, MIT); shown as such and never as verified.
 */
export const DATA_LEVELS = ['curated', 'upstream'] as const;
export type DataLevel = (typeof DATA_LEVELS)[number];

// ---------- series (data/series/<id>.yml) ----------

export const CYCLES = ['annual', 'twice_yearly', 'biennial', 'triennial', 'quadrennial', 'irregular'] as const;
export type Cycle = (typeof CYCLES)[number];

/**
 * How often a series meets. basis official: the venue says so (src + quote);
 * observed: read off the years past editions were held (note_zh says how),
 * which the app labels as a pattern, not a promise.
 */
export interface Periodicity extends Evidence {
  cycle: Cycle;
  /** Biennial series: held in even or odd years. */
  parity?: 'even' | 'odd';
  /** The cycle holds from this year on (FM becomes annual in 2027). */
  since?: number;
  basis: 'official' | 'observed';
}

export interface SeriesFile {
  id: string;
  /** As the venue writes it today: "NeurIPS", "HSCC+ICCPS". */
  acronym: string;
  full_name?: string;
  name_zh?: string;
  /** Former or other acronyms and names ("HSCC", "USENIX ATC"); rank matching reads them. */
  aliases?: string[];
  /** Taxonomy direction ids, main one first: ["cs/theory", "eng/control"]. */
  directions: string[];
  periodicity?: Periodicity;
  /** dblp stream key: "conf/aaai". */
  dblp?: string;
  /** ccfddl series key "<sub>/<title>" (e.g. "AI/AAAI"); the importer attaches upstream editions only through it. */
  ccfddl?: string;
  data_level: DataLevel;
  note_zh?: string;
}

// ---------- taxonomy (data/taxonomy.yml) ----------

export interface TaxonomyDirection {
  /** "<discipline>/<direction>": "cs/ml", "eng/control". */
  id: string;
  name_zh: string;
  name_en: string;
  /** Chip label when name_zh is long. */
  short_zh?: string;
  /** v0.3 `topics` values this direction replaces; the app still reads them (ml, cv, nlp, robotics, dm, ai). */
  legacy?: string[];
  note_zh?: string;
}

export interface TaxonomyDiscipline {
  id: string;
  name_zh: string;
  name_en: string;
  directions: TaxonomyDirection[];
  /** Directions of other disciplines this discipline's picker also lists (工程 → 机器人). */
  see_also?: string[];
  note_zh?: string;
}

/** A rank-list category and the directions a series in it defaults to. */
export interface CategoryDirections {
  list: string;
  category: string;
  /** ccfddl's `sub` code for the same CCF category (DS, NW, SC, SE, DB, CT, CG, AI, HI, MX). */
  ccfddl_sub?: string;
  directions: string[];
  note_zh?: string;
}

export interface Taxonomy {
  version: number;
  disciplines: TaxonomyDiscipline[];
  category_directions: CategoryDirections[];
  note_zh?: string;
}

/** Every direction id in display order. */
export function directionIds(t: Taxonomy): string[] {
  return t.disciplines.flatMap((d) => d.directions.map((x) => x.id));
}

/** v0.3 topic value → direction id ("ai" and "ml" both → "cs/ml"). */
export function legacyTopicMap(t: Taxonomy): Map<string, string> {
  const out = new Map<string, string>();
  for (const d of t.disciplines) for (const x of d.directions) for (const l of x.legacy ?? []) out.set(l, x.id);
  return out;
}

/**
 * The v0.3 `topics` the app's direction picker still reads, from direction
 * ids: each direction's first legacy value ("cs/ml" → "ml").
 */
export function legacyTopics(t: Taxonomy, directions: string[]): string[] {
  const first = new Map<string, string>();
  for (const d of t.disciplines) for (const x of d.directions) if (x.legacy?.[0]) first.set(x.id, x.legacy[0]);
  return [...new Set(directions.flatMap((id) => (first.has(id) ? [first.get(id)!] : [])))];
}

/** Default directions of a series in a rank-list category (CCF 8 人工智能 → cs/ml). */
export function categoryDirections(t: Taxonomy, list: string, category: string): string[] {
  return t.category_directions.find((c) => c.list === list && c.category === category)?.directions ?? [];
}

/** Same, by ccfddl's `sub` code. */
export function ccfddlSubDirections(t: Taxonomy, sub: string): string[] {
  return t.category_directions.find((c) => c.ccfddl_sub === sub)?.directions ?? [];
}

// ---------- rank lists (data/ranks/<list>.yml) ----------

export const RANK_LIST_KINDS = ['society', 'government', 'university', 'international'] as const;
export type RankListKind = (typeof RANK_LIST_KINDS)[number];

export interface RankEntry {
  /** Unique within the list: slug of the acronym ("hscc", "fse-3" when two share it), or the entry number ("314"). */
  id: string;
  acronym: string | null;
  full_name: string;
  /** The list's own Chinese name, where the list gives one and it is needed to match (CAST, CAA domestic). */
  name_zh?: string;
  tier: string;
  /** Id of one of the list's `categories`. */
  category: string;
  /** CAA only: international and domestic conferences are tiered separately ("CAA 国内A"). */
  scope?: 'international' | 'domestic';
  /** Page of the official PDF (CCF). */
  page?: number;
  /** CAST: the society that recommended the entry. */
  society_zh?: string;
  note?: string;
  /** "acronym:<normAcronym>", "name:<normName>", "dblp:<conf/key>"; see packages/core/src/ranks.ts. */
  match_keys: string[];
}

export interface RankList {
  id: string;
  /** Label prefix: "CCF", "CAA", "CAAI", "科协". */
  label_zh: string;
  name_zh: string;
  name_en?: string;
  issuer_zh: string;
  issuer_en?: string;
  kind: RankListKind;
  edition: string;
  edition_zh: string;
  /** Date the issuer published it. */
  released: string;
  note_zh?: string;
  official_url: string;
  document?: { url: string; sha256: string; pages?: number; retrieved_via?: string; note_zh?: string };
  tiers: string[];
  tier_meaning_zh?: Record<string, string>;
  /** series: a label holds for the series; edition: only for the edition of `covers_year` (CAST lists specific editions). */
  attach: 'series' | 'edition';
  covers_year?: number;
  license: {
    /** tier_and_citation: the app shows the tier with the list's name, edition and link, never the list itself. */
    display: 'tier_and_citation';
    note_zh: string;
    /** The issuer's own words on reuse, verbatim (CAA: 版权所有 不得转载). */
    site_notice?: string;
  };
  /** The issuer's disclaimer, verbatim. */
  disclaimer_zh?: string;
  categories: { id: string; name_zh: string; name_en?: string; code?: string }[];
  verified: { date: string; method_zh: string };
  counts?: { total: number; by_tier?: Record<string, number> };
  entries: RankEntry[];
}

// ---------- explicit links (data/ranks/mapping.yml) ----------

export interface RankLink {
  series: string;
  list: string;
  entry: string;
  /** Edition-attached lists (CAST): the year of the listed edition, when it is not the list's covers_year. */
  year?: number;
  /** Shown with the tier: "CAA A（GNC 分会）". */
  qualifier_zh?: string;
  note_zh?: string;
}

export interface RankDeny {
  series: string;
  list: string;
  entry: string;
  note_zh: string;
}

export interface RankMapping {
  links: RankLink[];
  not: RankDeny[];
}

// ---------- upstream manifest (data/upstream/ccfddl.yml) ----------

export interface CcfddlSeriesRecord {
  /** "<sub>/<title>": "AI/AAAI". */
  key: string;
  /** Our series id. */
  series: string;
  title: string;
  description: string;
  sub: string;
  dblp?: string;
  rank: { ccf?: string; core?: string; thcpl?: string };
}

export interface UpstreamManifest {
  source: 'ccfddl';
  repo: string;
  license: 'MIT';
  pin: {
    kind: 'commit' | 'file' | 'url';
    commit?: string;
    url?: string;
    /** The date the data is as of; upstream editions' last_checked. */
    as_of: string;
    sha256: string;
  };
  series: CcfddlSeriesRecord[];
}
