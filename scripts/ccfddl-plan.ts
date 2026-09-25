// Copyright (c) 2026 Zayier Xie. All rights reserved.

// What an import from ccfddl would write, computed without touching files, so
// the import is testable and idempotent: the same ccfddl data and the same
// repo give no writes the second time.
//
// Rules (docs/DATA_GUIDE.md §9):
//  - A ccfddl series attaches to our series only through the series file's
//    `ccfddl` key. A new ccfddl series gets a new upstream series file, unless
//    its slug, dblp key or full name points at a series we already have: then
//    it is a conflict for a person to settle (add the `ccfddl` key, or rename).
//  - Every upcoming ccfddl edition becomes, or updates, an upstream edition.
//    A curated edition of the same series and year is never touched; when its
//    deadlines differ from ccfddl's, the summary says so.
//  - Upstream series files are created, never rewritten: people fix their
//    directions and names. The manifest data/upstream/ccfddl.yml is rewritten
//    whole: pin, and per series ccfddl's title, description, sub, dblp, ranks.

import { stringify } from 'yaml';
import {
  ccfddlKey,
  ccfddlSeriesSlug,
  ccfddlSubDirections,
  isUpcoming,
  normDblp,
  normName,
  toInstant,
  upstreamEdition,
  type CcfddlSeries,
  type CcfddlSeriesRecord,
  type Edition,
  type SeriesFile,
  type Taxonomy,
  type UpstreamManifest,
} from '@nextvenue/core';

export interface Existing<T> {
  /** Repo-relative path. */
  file: string;
  value: T;
  text: string;
}

export interface PlanInput {
  ccfddl: CcfddlSeries[];
  pin: UpstreamManifest['pin'];
  series: Existing<SeriesFile>[];
  editions: Existing<Edition>[];
  manifest: Existing<UpstreamManifest> | null;
  taxonomy: Taxonomy;
}

export interface Write {
  file: string;
  text: string;
  kind: 'create' | 'update';
}

export interface PlanSummary {
  series: { linked: string[]; created: string[]; conflicts: string[] };
  editions: {
    created: string[];
    updated: string[];
    unchanged: string[];
    /** Curated editions left alone, with how ccfddl differs when it does. */
    curated: { id: string; differs?: string }[];
    past: number;
    stale: string[];
  };
  notes: string[];
}

export interface Plan {
  writes: Write[];
  summary: PlanSummary;
}

export const EDITION_HEADER = '# 由 scripts/import-ccfddl.ts 从 ccfddl（MIT）生成，data_level: upstream。要人工核对：改成 curated，删掉 upstream，每个日期补 src + quote。\n';
export const SERIES_HEADER = '# 由 scripts/import-ccfddl.ts 从 ccfddl 建立。方向按 CCF 类别给的默认值，名称取 ccfddl 的写法；可以手改，导入不会覆盖。\n';
export const MANIFEST_HEADER = '# 由 scripts/import-ccfddl.ts 写入，不要手改。ccfddl（github.com/ccfddl/ccf-deadlines）MIT 许可，全文见 NOTICE。\n';

const yamlText = (header: string, v: unknown) => header + stringify(v, { lineWidth: 0 });

/** Paper deadlines as instants, for comparing a curated edition with ccfddl's. */
function paperInstants(e: Edition): string[] {
  return e.milestones
    .filter((m) => m.type === 'paper' && m.at && m.status !== 'tba')
    .map((m) => toInstant(m.at!, m.tz).toISOString())
    .sort();
}

export function planImport(input: PlanInput): Plan {
  const { pin, taxonomy } = input;
  const asOf = pin.as_of;
  const writes: Write[] = [];
  const summary: PlanSummary = {
    series: { linked: [], created: [], conflicts: [] },
    editions: { created: [], updated: [], unchanged: [], curated: [], past: 0, stale: [] },
    notes: [],
  };
  const seriesById = new Map(input.series.map((s) => [s.value.id, s.value]));
  const byKey = new Map(input.series.filter((s) => s.value.ccfddl).map((s) => [s.value.ccfddl!, s.value]));
  const byDblp = new Map(input.series.filter((s) => s.value.dblp && !s.value.ccfddl).map((s) => [s.value.dblp!, s.value.id]));
  const byName = new Map(
    input.series.filter((s) => s.value.full_name && !s.value.ccfddl).map((s) => [normName(s.value.full_name!), s.value.id]),
  );
  const editionsBySeriesYear = new Map(input.editions.map((e) => [`${e.value.series}|${e.value.year}`, e]));
  const editionFiles = new Map(input.editions.map((e) => [e.value.id, e]));
  const records: CcfddlSeriesRecord[] = [];
  const seen = new Set<string>();

  const sorted = [...input.ccfddl].sort((a, b) => ccfddlKey(a).localeCompare(ccfddlKey(b)));
  const keysNow = new Set(sorted.map(ccfddlKey));
  for (const s of sorted) {
    const key = ccfddlKey(s);
    if (seen.has(key)) {
      summary.notes.push(`${key}: listed twice in ccfddl; the first one is used`);
      continue;
    }
    seen.add(key);
    let series = byKey.get(key);
    if (series) summary.series.linked.push(`${key} → ${series.id}`);
    else {
      // A series we linked whose ccfddl key is gone, with the same title under another sub: ccfddl re-filed it.
      const moved = input.series.find((x) => x.value.ccfddl && !keysNow.has(x.value.ccfddl) && x.value.ccfddl.split('/').slice(1).join('/') === s.title);
      const dblp = s.dblp ? normDblp(s.dblp) : null;
      const slug = ccfddlSeriesSlug(s.title);
      const taken = (id: string) => seriesById.has(id);
      const id = !taken(slug) ? slug : `${slug}-${s.sub.toLowerCase()}`;
      const clash =
        moved
          ? `data/series/${moved.value.id}.yml has ccfddl ${moved.value.ccfddl}; ccfddl now files it as ${key} (update the key if it is the same venue)`
          : dblp && byDblp.has(dblp)
            ? `dblp ${dblp} is data/series/${byDblp.get(dblp)}.yml; if it is the same venue add "ccfddl: ${key}" there`
            : byName.has(normName(s.description))
              ? `"${s.description}" is data/series/${byName.get(normName(s.description))}.yml; if it is the same venue add "ccfddl: ${key}" there`
              : taken(slug) && !seriesById.get(slug)!.ccfddl
                ? `data/series/${slug}.yml exists without a ccfddl key; add "ccfddl: ${key}" there if it is the same venue, or give one of them another id`
                : taken(id)
                  ? `ids ${slug} and ${id} are both taken`
                  : !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)
                    ? `no usable id from title "${s.title}"`
                    : null;
      if (clash) {
        summary.series.conflicts.push(`${key}: ${clash}`);
        continue;
      }
      const directions = ccfddlSubDirections(taxonomy, s.sub);
      series = {
        id,
        acronym: s.title,
        full_name: s.description,
        directions: directions.length ? directions : ['cs/cross'],
        ...(dblp ? { dblp } : {}),
        ccfddl: key,
        data_level: 'upstream',
      };
      seriesById.set(id, series);
      byKey.set(key, series);
      writes.push({ file: `data/series/${id}.yml`, text: yamlText(SERIES_HEADER, series), kind: 'create' });
      summary.series.created.push(`${key} → ${id}`);
    }
    const rank: CcfddlSeriesRecord['rank'] = {};
    for (const k of ['ccf', 'core', 'thcpl'] as const) if (s.rank?.[k]) rank[k] = String(s.rank[k]);
    const record: CcfddlSeriesRecord = { key, series: series.id, title: s.title, description: s.description, sub: s.sub, rank };
    const d = s.dblp ? normDblp(s.dblp) : null;
    if (d) record.dblp = d;
    records.push(record);

    for (const c of s.confs ?? []) {
      if (!isUpcoming(c, asOf)) {
        summary.editions.past++;
        continue;
      }
      const { edition, notes } = upstreamEdition(s, c, series.id, asOf);
      for (const n of notes) summary.notes.push(`${key} ${c.id}: ${n}`);
      const existing = editionsBySeriesYear.get(`${series.id}|${c.year}`);
      if (existing && existing.value.data_level !== 'upstream') {
        const mine = paperInstants(existing.value);
        const theirs = paperInstants(edition);
        const differs = theirs.length && mine.length && theirs.join() !== mine.join() ? `ccfddl paper ${theirs.join(', ')} vs ours ${mine.join(', ')}` : undefined;
        summary.editions.curated.push(differs ? { id: existing.value.id, differs } : { id: existing.value.id });
        continue;
      }
      if (existing && existing.value.upstream?.key !== key) {
        summary.notes.push(`${existing.file}: upstream edition from ${existing.value.upstream?.key}, not ${key}; left alone`);
        continue;
      }
      const file = existing?.file ?? `data/editions/${edition.id}.yml`;
      if (!existing && editionFiles.has(edition.id)) {
        summary.notes.push(`${key} ${c.id}: ${file} already holds another series' edition; skipped`);
        continue;
      }
      const text = yamlText(EDITION_HEADER, edition);
      if (!existing) {
        writes.push({ file, text, kind: 'create' });
        summary.editions.created.push(edition.id);
      } else if (existing.text !== text) {
        writes.push({ file, text, kind: 'update' });
        summary.editions.updated.push(edition.id);
      } else summary.editions.unchanged.push(edition.id);
    }
  }

  const live = new Set(sorted.flatMap((s) => (s.confs ?? []).map((c) => `${ccfddlKey(s)}|${c.id}`)));
  for (const e of input.editions) {
    const u = e.value.upstream;
    if (e.value.data_level === 'upstream' && u && !live.has(`${u.key}|${u.conf_id}`)) summary.editions.stale.push(e.value.id);
  }

  const manifest: UpstreamManifest = {
    source: 'ccfddl',
    repo: 'https://github.com/ccfddl/ccf-deadlines',
    license: 'MIT',
    pin,
    series: records,
  };
  const manifestText = yamlText(MANIFEST_HEADER, manifest);
  if (input.manifest?.text !== manifestText) {
    writes.push({ file: 'data/upstream/ccfddl.yml', text: manifestText, kind: input.manifest ? 'update' : 'create' });
  }
  return { writes, summary };
}
