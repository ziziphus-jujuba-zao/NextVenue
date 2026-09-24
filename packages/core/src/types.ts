// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Mirrors schema/*.schema.json. The JSON Schemas are the source of truth for
// validation; these types exist so code reading the data is checked.

export type SourceKind =
  | 'cfp'
  | 'author_guide'
  | 'dates'
  | 'faq'
  | 'policy'
  | 'blog'
  | 'form'
  | 'repo'
  | 'other';

export interface Source {
  id: string;
  url: string;
  title: string;
  kind: SourceKind;
  fetched_at: string;
  http_status: number;
  /** sha256 of snapshots/<sha>.txt; absent when the page could not be fetched. */
  snapshot?: string;
  note_zh?: string;
}

export interface SourceFile {
  edition: string;
  sources: Source[];
}

export const MILESTONE_TYPES = [
  'abstract',
  'paper_registration',
  'paper',
  'supplementary',
  'profile_deadline',
  'reviewer_registration',
  'reviewing',
  'phase1_notification',
  'reviews_out',
  'author_response',
  'discussion',
  'meta_reviews',
  'commitment',
  'notification',
  'camera_ready',
  'author_registration',
  'conference',
] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

export interface Milestone {
  type: MilestoneType;
  label_zh?: string;
  /** Point in time, local to `tz`: YYYY-MM-DD or YYYY-MM-DDTHH:mm. */
  at?: string;
  /** Window, local to `tz`. */
  start?: string;
  end?: string;
  tz: string;
  status: 'confirmed' | 'estimated' | 'tba';
  src?: string;
  quote?: string;
  note_zh?: string;
}

export interface Edition {
  id: string;
  series: string;
  name: string;
  year: number;
  kind: 'conference' | 'arr_cycle';
  location?: { city?: string; country?: string };
  dates?: { start: string; end: string };
  ranks?: { ccf?: 'A' | 'B' | 'C' | 'N'; ccf_edition?: number; core?: string };
  milestones: Milestone[];
  last_checked: string;
  note_zh?: string;
}

export const ANSWERS = [
  'required',
  'allowed',
  'not_allowed',
  'conditional',
  'unspecified',
  'not_required',
  'contradictory',
] as const;
export type Answer = (typeof ANSWERS)[number];

export const VERIFICATIONS = ['human', 'correspondence', 'upstream', 'inherited', 'machine'] as const;
export type Verification = (typeof VERIFICATIONS)[number];

export const FAMILIES = [
  'author_list',
  'content_edit',
  'submission',
  'cap',
  'reciprocal_reviewing',
  'profile',
  'dual_submission',
  'withdrawal',
  'visibility',
  'rebuttal',
  'llm_policy',
  'format',
  'presentation',
  'resubmission',
  'other',
] as const;
export type Family = (typeof FAMILIES)[number];

export interface Quote {
  src: string;
  text: string;
  /** Required on each quote of a `contradictory` card: what this reading implies. */
  reading_zh?: string;
}

export interface RuleCard {
  id: string;
  edition: string;
  family: Family;
  question_zh: string;
  answer: Answer;
  verification: Verification;
  conf: 'high' | 'medium' | 'low';
  applies?: { from?: MilestoneType; until?: MilestoneType; note_zh?: string };
  summary_zh: string;
  detail_zh?: string;
  quotes: Quote[];
  /** For `unspecified`: sources that were read and found silent. */
  checked_sources?: string[];
  inherited_from?: string;
  changed_from_prev_zh?: string;
  effect?: { kind: 'lock' | 'cap' | 'exclusive' | 'withdraw' | 'requires'; [k: string]: unknown };
  last_checked: string;
}
