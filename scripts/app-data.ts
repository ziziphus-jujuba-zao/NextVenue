// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// The slim data the mobile app ships inline: only the fields its screens
// read, with the app's wording (apps/mobile/copy.ts) applied on top.

import { textFragmentUrl } from '@nextvenue/core';
import { applyCopy } from '../apps/mobile/copy.ts';
import type { AppData } from '../apps/mobile/types.ts';
import type { Bundle } from './bundle.ts';

/** Keep only what the app reads; precompute deep links for milestone quotes. */
export function toAppData(bundle: Bundle): AppData {
  const sources = new Map(bundle.sources.map((s) => [s.id, s]));
  return {
    bundle_hash: bundle.bundle_hash,
    built_at: bundle.built_at,
    editions: bundle.editions.map((e) => ({
      id: e.id,
      series: e.series,
      name: e.name,
      year: e.year,
      kind: e.kind,
      topics: e.topics,
      derived_from: e.derived_from,
      location: e.location,
      dates: e.dates,
      ranks: e.ranks?.ccf ? { ccf: e.ranks.ccf } : undefined,
      note_zh: e.note_zh,
      last_checked: e.last_checked,
      milestones: e.milestones.map((m) => {
        const s = m.src ? sources.get(m.src) : undefined;
        return {
          type: m.type,
          label_zh: m.label_zh,
          tz: m.tz,
          status: m.status,
          at_resolved: m.at_resolved,
          start_resolved: m.start_resolved,
          end_resolved: m.end_resolved,
          note_zh: m.note_zh,
          quote: m.quote,
          src_title: s?.title,
          deep_link: s ? (m.quote ? textFragmentUrl(s.url, m.quote) : s.url) : undefined,
        };
      }),
    })),
    rules: bundle.rules.map((r) => ({
      id: r.id,
      edition: r.edition,
      family: r.family,
      question_zh: r.question_zh,
      short_zh: r.short_zh,
      answer: r.answer,
      verification: r.verification,
      inherited_from: r.inherited_from,
      applies: r.applies,
      summary_zh: r.summary_zh,
      detail_zh: r.detail_zh,
      changed_from_prev_zh: r.changed_from_prev_zh,
      effect: r.effect
        ? { kind: r.effect.kind, target: typeof r.effect.target === 'string' ? r.effect.target : undefined }
        : undefined,
      quotes: r.quotes.map((q) => ({
        text: q.text,
        reading_zh: q.reading_zh,
        deep_link: q.deep_link,
        source_title: q.source_title,
      })),
      checked: r.checked_sources_resolved?.map((c) => ({ title: c.title, url: c.url })),
      last_checked: r.last_checked,
    })),
  };
}

/** What index.html inlines: the slim data plus the app wording. */
export function appData(bundle: Bundle): AppData {
  return applyCopy(toAppData(bundle));
}
