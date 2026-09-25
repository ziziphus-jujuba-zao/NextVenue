// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// The slim data the app ships inline. scripts/build-app.ts derives it from
// dist/bundle.json; only fields the screens read are kept.

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
}

export interface AppEdition {
  id: string;
  series: string;
  name: string;
  year: number;
  kind: 'conference' | 'arr_cycle';
  /** Research directions (ml, cv, nlp, robotics, dm, ai); the app's direction picker and routes use them. */
  topics?: string[];
  /** Whole-edition dates shifted from this earlier edition (e.g. neurips-2026) because the venue has not published yet. */
  derived_from?: string;
  location?: { city?: string; country?: string };
  dates?: { start: string; end: string };
  ranks?: { ccf?: string };
  note_zh?: string;
  last_checked: string;
  milestones: AppMilestone[];
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
  effect?: { kind: string; target?: string };
  quotes: AppQuote[];
  checked?: { title: string; url: string }[];
  last_checked: string;
}

export interface AppData {
  bundle_hash: string;
  built_at: string;
  editions: AppEdition[];
  rules: AppRule[];
}
