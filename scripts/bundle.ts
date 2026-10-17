// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// The bundle every client downloads in one piece: data/ with times resolved
// to UTC and Beijing, and quotes linked to their sources. Each edition gets
// its series' directions (and the v0.3 `topics` derived from them) and its
// rank labels (data/ranks + mapping, CAST only in the listed year), and
// where it is held in Chinese (data/cities.yml: city, country, zone). Visa
// files, the China files (holidays, school rules) and past statistics
// (acceptance rates, per-area files, top topics) ride along as they are. Pure
// (no files written), so tests can build it in memory; scripts/build.ts
// writes it out.

import { createHash } from 'node:crypto';
import type {
  AreaFile,
  ChinaAdmin,
  CitiesFile,
  Edition,
  HolidayFile,
  Milestone,
  Place,
  RankLabel,
  RankList,
  RuleCard,
  SeriesFile,
  Site,
  StatsFile,
  Taxonomy,
  TopicsFile,
  VisaCountries,
  VisaRegime,
} from '@nextvenue/core';
import { BEIJING, cityIndex, editionPlace, formatIn, labelsForEdition, legacyTopics, loadRepoData, resolveRanks, sitePlace, textFragmentUrl, toInstant } from '@nextvenue/core';
import { ROOT } from './lib.ts';

export interface ResolvedTime {
  local: string;
  tz: string;
  utc: string;
  beijing: string;
}

export interface BundleMilestone extends Milestone {
  at_resolved?: ResolvedTime;
  start_resolved?: ResolvedTime;
  end_resolved?: ResolvedTime;
}

export interface BundleEdition extends Omit<Edition, 'milestones' | 'sites'> {
  milestones: BundleMilestone[];
  /** Where it is held, in Chinese (data/cities.yml); absent when not published, or when `sites` hold it. */
  place?: Place;
  /** Each site with its place in Chinese. */
  sites?: (Site & { place: Place })[];
  /** The series' taxonomy directions ("cs/ml", "eng/control"). */
  directions: string[];
  /** v0.3 direction values derived from `directions` (ml, cv, nlp, robotics, dm); the app's picker reads them. */
  topics: string[];
  /** Rank labels that hold for this edition, in display order (CCF, CAA, CAAI, 科协, CORE, THCPL). */
  labels: RankLabel[];
  /** Kept for v0.3 readers: the CCF tier from `labels`. */
  ranks?: { ccf: string; ccf_edition: string };
}

/** A rank list without its entries: what a label's citation card needs. */
export type BundleRankList = Omit<RankList, 'entries' | 'categories' | 'counts'>;

export interface BundleQuote {
  src: string;
  text: string;
  reading_zh?: string;
  deep_link: string;
  source_title: string;
  source_url: string;
  fetched_at: string;
}

export interface BundleRule extends Omit<RuleCard, 'quotes'> {
  quotes: BundleQuote[];
  checked_sources_resolved?: { id: string; title: string; url: string }[];
}

export interface Bundle {
  schema_version: 1;
  bundle_hash: string;
  built_at: string;
  editions: BundleEdition[];
  rules: BundleRule[];
  /** Visa guidance by destination: country code → regime id, and the regime files. */
  visa: { countries: VisaCountries; regimes: VisaRegime[] };
  /** Holiday years for the working-day engine (packages/core/src/workday.ts) and school-rule examples. */
  china: { holidays: HolidayFile[]; admin: ChinaAdmin | null };
  /** Series files with their labels (a series without editions still has its names and labels). */
  series: (SeriesFile & { labels: RankLabel[] })[];
  /** Disciplines → directions. */
  taxonomy: Taxonomy | null;
  /** Chinese city and country names, city time zones (data/cities.yml). */
  cities: CitiesFile | null;
  /** The lists labels cite: name, edition, release date, link, licence note, disclaimer. */
  rank_lists: BundleRankList[];
  /** What upstream editions came from (ccfddl pin), when any were imported. */
  upstream: { source: string; repo: string; license: string; as_of: string; commit?: string } | null;
  /** Past acceptance statistics (data/stats), official per-area files (data/stats/areas), top topics (data/topics). */
  stats: StatsFile[];
  areas: AreaFile[];
  topics: TopicsFile[];
  sources: { id: string; url: string; title: string; kind: string; fetched_at: string; http_status: number }[];
}

function resolve(local: string | undefined, tz: string): ResolvedTime | undefined {
  if (!local) return undefined;
  const instant = toInstant(local, tz);
  return { local, tz, utc: instant.toISOString().replace(/\.\d{3}Z$/, 'Z'), beijing: formatIn(instant, BEIJING) };
}

export function buildBundle(): Bundle {
  const data = loadRepoData(ROOT);
  const sourceOf = (id: string) => {
    const s = data.sources.get(id);
    if (!s) throw new Error(`unknown source ${id}; run pnpm validate`);
    return s;
  };

  const seriesFiles = data.series.map((s) => s.value);
  const seriesById = new Map(seriesFiles.map((s) => [s.id, s]));
  const lists = data.rankLists.map((l) => l.value);
  const { labels } = resolveRanks(seriesFiles, lists, data.rankMapping?.value ?? { links: [], not: [] }, data.upstream?.value ?? null);
  const taxonomy = data.taxonomy?.value ?? null;
  const ccf = lists.find((l) => l.id === 'ccf7');
  const cities = data.cities?.value ?? null;
  const index = cities ? cityIndex(cities) : null;

  const editions: BundleEdition[] = data.editions
    .map(({ value: ed }) => {
      const directions = seriesById.get(ed.series)?.directions ?? [];
      const own = labelsForEdition(labels.get(ed.series) ?? [], ed.year);
      const ccfLabel = own.find((l) => l.list === 'ccf7');
      return {
      ...ed,
      directions,
      topics: taxonomy ? legacyTopics(taxonomy, directions) : [],
      labels: own,
      ranks: ccfLabel && ccf ? { ccf: ccfLabel.tier, ccf_edition: ccf.edition } : undefined,
      place: cities && index ? editionPlace(ed, cities, index) : undefined,
      sites: ed.sites?.map((x) => ({ ...x, place: cities && index ? sitePlace(x, cities, index) : { city: x.city, country_code: x.country_code, tz: x.tz } })),
      milestones: ed.milestones.map((m) => ({
        ...m,
        at_resolved: resolve(m.at, m.tz),
        start_resolved: resolve(m.start, m.tz),
        end_resolved: resolve(m.end, m.tz),
      })),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const series = seriesFiles.map((s) => ({ ...s, labels: labels.get(s.id) ?? [] })).sort((a, b) => a.id.localeCompare(b.id));
  const rank_lists: BundleRankList[] = lists
    .map(({ entries: _e, categories: _c, counts: _n, ...meta }) => meta)
    .sort((a, b) => a.id.localeCompare(b.id));
  const pin = data.upstream?.value;
  const upstream = pin ? { source: pin.source, repo: pin.repo, license: pin.license, as_of: pin.pin.as_of, commit: pin.pin.commit } : null;

  const rules: BundleRule[] = data.rules
    .map(({ value: r }) => ({
      ...r,
      quotes: r.quotes.map((q) => {
        const s = sourceOf(q.src);
        return {
          ...q,
          deep_link: textFragmentUrl(s.url, q.text),
          source_title: s.title,
          source_url: s.url,
          fetched_at: s.fetched_at,
        };
      }),
      checked_sources_resolved: r.checked_sources?.map((id) => {
        const s = sourceOf(id);
        return { id, title: s.title, url: s.url };
      }),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const sources = [...data.sources.values()]
    .map(({ id, url, title, kind, fetched_at, http_status }) => ({ id, url, title, kind, fetched_at, http_status }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const visa = {
    countries: data.visaCountries?.value ?? {},
    regimes: data.visa.map((v) => v.value).sort((a, b) => a.id.localeCompare(b.id)),
  };
  const china = {
    holidays: data.holidays.map((h) => h.value).sort((a, b) => a.year - b.year),
    admin: data.chinaAdmin?.value ?? null,
  };

  const stats = data.stats.map((s) => s.value).sort((a, b) => a.series.localeCompare(b.series));
  const areas = data.areas.map((a) => a.value).sort((a, b) => a.series.localeCompare(b.series) || a.year - b.year);
  const topics = data.topics.map((t) => t.value).sort((a, b) => a.series.localeCompare(b.series) || a.year - b.year);

  const content = { schema_version: 1 as const, editions, series, taxonomy, cities, rank_lists, upstream, rules, visa, china, stats, areas, topics, sources };
  const bundle_hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  return { ...content, bundle_hash, built_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') };
}
