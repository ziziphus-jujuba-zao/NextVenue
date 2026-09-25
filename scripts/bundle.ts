// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// The bundle every client downloads in one piece: data/ with times resolved
// to UTC and Beijing, and quotes linked to their sources. Pure (no files
// written), so tests can build it in memory; scripts/build.ts writes it out.

import { createHash } from 'node:crypto';
import type { Edition, Milestone, RuleCard } from '@nextvenue/core';
import { BEIJING, formatIn, loadRepoData, textFragmentUrl, toInstant } from '@nextvenue/core';
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

export interface BundleEdition extends Omit<Edition, 'milestones'> {
  milestones: BundleMilestone[];
}

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

  const editions: BundleEdition[] = data.editions
    .map(({ value: ed }) => ({
      ...ed,
      milestones: ed.milestones.map((m) => ({
        ...m,
        at_resolved: resolve(m.at, m.tz),
        start_resolved: resolve(m.start, m.tz),
        end_resolved: resolve(m.end, m.tz),
      })),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

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

  const content = { schema_version: 1 as const, editions, rules, sources };
  const bundle_hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  return { ...content, bundle_hash, built_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') };
}
