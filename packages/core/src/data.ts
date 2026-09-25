// Copyright (c) 2026 Zayier Xie. All rights reserved.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import type { RankList, RankMapping, SeriesFile, Taxonomy, UpstreamManifest } from './catalog.ts';
import type { CitiesFile } from './place.ts';
import type { AreaFile, StatsFile, TopicTaxonomy, TopicsFile } from './stats.ts';
import type {
  ChinaAdmin,
  Edition,
  HolidayFile,
  RuleCard,
  Source,
  SourceFile,
  VisaCountries,
  VisaRegime,
} from './types.ts';

export interface Loaded<T> {
  file: string;
  value: T;
}

export interface RepoData {
  root: string;
  sourceFiles: Loaded<SourceFile>[];
  editions: Loaded<Edition>[];
  /** data/series/<id>.yml: one per venue series. */
  series: Loaded<SeriesFile>[];
  /** data/taxonomy.yml: disciplines → directions. */
  taxonomy: Loaded<Taxonomy> | null;
  /** data/ranks/<list>.yml: official recommendation lists (CCF, CAA, CAAI, CAST). */
  rankLists: Loaded<RankList>[];
  /** data/ranks/mapping.yml: explicit series → list-entry links and denials. */
  rankMapping: Loaded<RankMapping> | null;
  /** data/upstream/ccfddl.yml: what scripts/import-ccfddl.ts last read, and ccfddl's per-series record. */
  upstream: Loaded<UpstreamManifest> | null;
  rules: Loaded<RuleCard>[];
  /** data/visa/<regime>.yml */
  visa: Loaded<VisaRegime>[];
  /** data/visa/countries.yml */
  visaCountries: Loaded<VisaCountries> | null;
  /** data/china/holidays-<year>.yml */
  holidays: Loaded<HolidayFile>[];
  /** data/china/admin.yml */
  chinaAdmin: Loaded<ChinaAdmin> | null;
  /** data/cities.yml: Chinese city and country names, city time zones. */
  cities: Loaded<CitiesFile> | null;
  /** data/stats/<series>.yml: past acceptance statistics. */
  stats: Loaded<StatsFile>[];
  /** data/stats/areas/<series>-<year>.yml: official per-area statistics. */
  areas: Loaded<AreaFile>[];
  /** data/topics/<series>-<year>.json: top topics among accepted papers (dblp titles). */
  topics: Loaded<TopicsFile>[];
  /** data/topics/taxonomy.json: the topic map those were counted with. */
  topicTaxonomy: Loaded<TopicTaxonomy> | null;
  sources: Map<string, Source>;
}

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...yamlFiles(p));
    else if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) out.push(p);
  }
  return out.sort();
}

function load<T>(root: string, file: string): Loaded<T> {
  return { file: relative(root, file), value: parse(readFileSync(file, 'utf8')) as T };
}

/** Files directly in `dir` (not in subdirectories) with the extension, sorted. */
function filesIn(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => join(dir, e.name))
    .sort();
}

function loadJson<T>(root: string, file: string): Loaded<T> {
  return { file: relative(root, file), value: JSON.parse(readFileSync(file, 'utf8')) as T };
}

export function loadRepoData(root: string): RepoData {
  const sourceFiles = yamlFiles(join(root, 'data/sources')).map((f) => load<SourceFile>(root, f));
  const editions = yamlFiles(join(root, 'data/editions')).map((f) => load<Edition>(root, f));
  const rules = yamlFiles(join(root, 'data/rules')).map((f) => load<RuleCard>(root, f));
  const series = filesIn(join(root, 'data/series'), '.yml').map((f) => load<SeriesFile>(root, f));
  const taxonomyFile = join(root, 'data/taxonomy.yml');
  const taxonomy = existsSync(taxonomyFile) ? load<Taxonomy>(root, taxonomyFile) : null;
  const ranksDir = join(root, 'data/ranks');
  const mappingFile = join(ranksDir, 'mapping.yml');
  const rankLists = filesIn(ranksDir, '.yml')
    .filter((f) => f !== mappingFile)
    .map((f) => load<RankList>(root, f));
  const rankMapping = existsSync(mappingFile) ? load<RankMapping>(root, mappingFile) : null;
  const upstreamFile = join(root, 'data/upstream/ccfddl.yml');
  const upstream = existsSync(upstreamFile) ? load<UpstreamManifest>(root, upstreamFile) : null;
  const visaDir = join(root, 'data/visa');
  const countriesFile = join(visaDir, 'countries.yml');
  const visa = yamlFiles(visaDir)
    .filter((f) => f !== countriesFile)
    .map((f) => load<VisaRegime>(root, f));
  const visaCountries = existsSync(countriesFile) ? load<VisaCountries>(root, countriesFile) : null;
  const chinaDir = join(root, 'data/china');
  const holidays = yamlFiles(chinaDir)
    .filter((f) => /(^|\/)holidays-\d{4}\.ya?ml$/.test(f))
    .map((f) => load<HolidayFile>(root, f));
  const adminFile = join(chinaDir, 'admin.yml');
  const chinaAdmin = existsSync(adminFile) ? load<ChinaAdmin>(root, adminFile) : null;
  const citiesFile = join(root, 'data/cities.yml');
  const cities = existsSync(citiesFile) ? load<CitiesFile>(root, citiesFile) : null;
  const stats = filesIn(join(root, 'data/stats'), '.yml').map((f) => load<StatsFile>(root, f));
  const areas = filesIn(join(root, 'data/stats/areas'), '.yml').map((f) => load<AreaFile>(root, f));
  const topicsDir = join(root, 'data/topics');
  const topicMapFile = join(topicsDir, 'taxonomy.json');
  const topics = filesIn(topicsDir, '.json')
    .filter((f) => f !== topicMapFile)
    .map((f) => loadJson<TopicsFile>(root, f));
  const topicTaxonomy = existsSync(topicMapFile) ? loadJson<TopicTaxonomy>(root, topicMapFile) : null;
  const sources = new Map<string, Source>();
  for (const sf of sourceFiles) for (const s of sf.value?.sources ?? []) sources.set(s.id, s);
  return {
    root,
    sourceFiles,
    editions,
    series,
    taxonomy,
    rankLists,
    rankMapping,
    upstream,
    rules,
    visa,
    visaCountries,
    holidays,
    chinaAdmin,
    cities,
    stats,
    areas,
    topics,
    topicTaxonomy,
    sources,
  };
}

export function snapshotPath(root: string, sha: string): string {
  return join(root, 'snapshots', `${sha}.txt`);
}

export function readSnapshot(root: string, source: Source): string | null {
  if (!source.snapshot) return null;
  const p = snapshotPath(root, source.snapshot);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}
