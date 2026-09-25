// Copyright (c) 2026 Zayier Xie. All rights reserved.

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
  /** Same publisher's copy of `url`, fetched instead when `url` refuses our fetcher (e.g. HTTP 403). */
  mirror_url?: string;
  /** The page draws its text with JavaScript from a payload in the page itself; the snapshot also holds that payload's text. */
  embedded?: boolean;
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
  // After acceptance (MOBILE_SPEC §10)
  'site_preference',
  'site_assignment',
  'financial_aid',
  'financial_aid_result',
  'registration_open',
  'early_registration',
  'standard_registration',
  'visa_letter',
  'visa_refund_apply_by',
  'refund_cutoff',
  'visa_refund_request_by',
  'presentation_format_final',
  'poster',
] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

/**
 * How the post-acceptance checklist treats a milestone type. Lives in code,
 * not in the data: hard = an official deadline with consequences; advice =
 * missing it only costs money; notice = an announcement; condition = a date
 * that decides whether some other right applies (e.g. a visa refund).
 */
export type StepKind = 'hard' | 'advice' | 'notice' | 'condition';

export const POST_ACCEPT: Partial<Record<MilestoneType, { zh: string; kind: StepKind }>> = {
  camera_ready: { zh: '提交终稿', kind: 'hard' },
  author_registration: { zh: '作者注册截止', kind: 'hard' },
  site_preference: { zh: '报告会场意向表截止', kind: 'hard' },
  site_assignment: { zh: '会场分配公布', kind: 'notice' },
  financial_aid: { zh: '资助 / 志愿者申请截止', kind: 'hard' },
  financial_aid_result: { zh: '资助结果公布', kind: 'notice' },
  registration_open: { zh: '注册开放', kind: 'notice' },
  early_registration: { zh: '优惠注册截止', kind: 'advice' },
  standard_registration: { zh: '标准价注册截止', kind: 'advice' },
  visa_letter: { zh: '签证邀请函申请', kind: 'hard' },
  visa_refund_apply_by: { zh: '拒签退款：须在此前递签', kind: 'condition' },
  refund_cutoff: { zh: '全额退款截止', kind: 'hard' },
  visa_refund_request_by: { zh: '拒签退款申请截止', kind: 'hard' },
  presentation_format_final: { zh: '报告形式锁定', kind: 'hard' },
  poster: { zh: '海报材料截止', kind: 'hard' },
  conference: { zh: '会议举办', kind: 'notice' },
};

/** Types that only matter once a paper is accepted; the pre-acceptance screens leave them out. */
export const POST_ACCEPT_ONLY: ReadonlySet<MilestoneType> = new Set<MilestoneType>([
  'site_preference',
  'site_assignment',
  'financial_aid',
  'financial_aid_result',
  'registration_open',
  'early_registration',
  'standard_registration',
  'visa_letter',
  'visa_refund_apply_by',
  'refund_cutoff',
  'visa_refund_request_by',
  'presentation_format_final',
  'poster',
]);

export interface Milestone {
  type: MilestoneType;
  label_zh?: string;
  /** Point in time, local to `tz`: YYYY-MM-DD or YYYY-MM-DDTHH:mm. */
  at?: string;
  /** Window, local to `tz`. */
  start?: string;
  end?: string;
  tz: string;
  /** The venue wrote no time zone; `tz` is this app's assumption (note_zh says which). */
  tz_assumed?: boolean;
  /** The venue itself marks this date tentative; it is still the venue's date (status confirmed), shown as 官网暂定. */
  tentative?: boolean;
  status: 'confirmed' | 'estimated' | 'tba';
  /** Only for one site of a multi-site edition: a `sites[].id`. */
  site?: string;
  src?: string;
  quote?: string;
  note_zh?: string;
}

// ---------- evidence ----------

/**
 * Where a value comes from. `quote` must occur verbatim in the snapshot of
 * `src`; for a JSON source, `json_path` + `json_value` replace the quote.
 * An object without its own `src` uses the nearest enclosing object's.
 * `anchor` (optional) must occur within 1000 characters before the quote,
 * e.g. a hotel's name before its "Cutoff Date".
 */
export interface Evidence {
  src?: string;
  quote?: string;
  json_path?: string;
  json_value?: string;
  anchor?: string;
  note_zh?: string;
}

/** Not published yet: say so, and list what was read. */
export interface Tba {
  status: 'tba';
  checked_sources: string[];
  note_zh?: string;
}

/** Not published for this edition, but last edition's value, shown as "上届参考" and never used in calculations. */
export type WithReference<T> = Tba & { reference?: T & { from: string } };

/** A value backed by a quote, or not published (optionally with last edition's value for reference). */
export type Fact<T> = (T & Evidence) | WithReference<T & Evidence>;

export const COUNTRY_CODE = /^[A-Z]{2}$/;

export interface Venue {
  name: string;
  /** Street address, or "tba". */
  address: string;
}

export interface Site {
  id: string;
  city: string;
  country_code: string;
  tz: string;
  venue?: Fact<Venue>;
}

export type RegCategory = 'student' | 'academic' | 'industry';

export interface FeeRow {
  id: string;
  label_zh: string;
  for: RegCategory[];
  /** none: no membership needed; current: existing member; new: joins or renews with this registration. */
  member: 'none' | 'current' | 'new';
  /** False for passes (e.g. virtual) that do not satisfy the author-registration rule. */
  covers_author: boolean;
  /** One amount per tier, in the order of `tiers` (or of this row's `tiers`). */
  amounts: number[];
  /** Subset of the table's tier ids when this row has fewer tiers. */
  tiers?: string[];
  quote?: string;
}

export interface FeeTable {
  /** Multi-site editions: the `sites[].id` these prices are for. */
  site?: string;
  currency: string;
  /** Price periods in order; each but the last ends at a milestone type of this edition. */
  tiers: { id: string; until?: MilestoneType }[];
  rows: FeeRow[];
}

export interface Coverage {
  /** author: one registration covers all of that author's papers; paper: one per paper. */
  per: 'author' | 'paper' | 'unspecified';
  /** Papers one registration may cover; null = no limit. */
  max_papers?: number | null;
  /** The rate that counts for authors. */
  rate?: 'any' | 'in_person' | 'non_student_in_person';
  extra_zh?: string;
}

export interface VisaLetter {
  /** What must be done before the letter can be requested. */
  after: 'paid_registration' | 'registration' | 'none';
  how_zh: string;
  /** Multi-site editions: how it works at each site (keys are `sites[].id`); the app shows only the paper's site. */
  how_site_zh?: Record<string, string>;
  /** Official turnaround, or "tba". */
  lead: 'tba' | { n: number; unit: 'day' | 'business_day' | 'week'; quote?: string };
  url: string;
}

export interface VisaGuidance {
  country_code: string;
  /** Organizer's advice: apply at least N (or N–M) weeks before travel. */
  weeks: number | [number, number];
}

export interface Aid {
  id: string;
  name: string;
  covers_zh?: string;
  url: string;
}

export interface Hotel {
  name: string;
  address?: string;
  rate?: { amount: number; currency: string };
  /** Group-rate cutoff, local date. */
  cutoff: string;
}

export interface Poster {
  size_zh: string;
}

export const LINK_KINDS = ['registration', 'visa', 'venue', 'hotels', 'aid', 'contact', 'program'] as const;

export interface Logistics {
  /** Single-site editions; multi-site editions use `sites[].venue`. */
  venue?: Fact<Venue>;
  /** One table per site (or one for all); a site whose prices are not out is `status: tba` with its `site`. */
  fees?: ((FeeTable & Evidence) | (WithReference<FeeTable & Evidence> & { site?: string }))[];
  coverage?: Fact<Coverage>;
  visa_letter?: Fact<VisaLetter>;
  visa_guidance?: (VisaGuidance & Evidence)[];
  aid?: (Aid & Evidence)[] | Tba;
  hotels?: (Hotel & Evidence)[] | Tba;
  sold_out?: ({ site?: string } & Evidence)[];
  poster?: Fact<Poster>;
  links?: { kind: (typeof LINK_KINDS)[number]; url: string; site?: string }[];
}

export const SUBMISSION_TYPES = ['full_paper', 'extended_abstract', 'abstract', 'mixed'] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

/** Where an upstream edition came from (data_level: upstream). */
export interface UpstreamRef {
  source: 'ccfddl';
  /** ccfddl series key "<sub>/<title>". */
  key: string;
  /** ccfddl's id of this edition: "aaai27". */
  conf_id: string;
  /** As ccfddl writes them, kept for provenance. */
  link?: string;
  place?: string;
  date?: string;
  timezone?: string;
}

/** A federated event this edition is held within (CPS-IoT Week, FCRC, ETAPS). */
export interface Federation extends Evidence {
  name: string;
  url?: string;
  /** Our series ids of the other venues in it. */
  with?: string[];
}

export interface Edition {
  id: string;
  series: string;
  name: string;
  year: number;
  kind: 'conference' | 'arr_cycle';
  /** curated: our data, every fact quoted; upstream: imported from ccfddl, never shown as verified. */
  data_level: 'curated' | 'upstream';
  /** What a submission is: full paper, extended abstract (2–4 pages), abstract only, or several tracks of different kinds. */
  submission_type?: SubmissionType;
  /** The quote behind submission_type (required for curated editions). */
  submission_evidence?: Evidence;
  federated_with?: Federation;
  /** Provenance of an upstream edition. */
  upstream?: UpstreamRef;
  /** For editions whose dates are projected from a previous edition. */
  derived_from?: string;
  location?: { city?: string; country?: string; country_code?: string };
  /** Only for editions held in several places at once (e.g. NeurIPS 2026). */
  sites?: Site[];
  dates?: { start: string; end: string };
  milestones: Milestone[];
  /** What authors need after acceptance: venue, fees, visa letter, aid, hotels, links. */
  logistics?: Logistics;
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
  'registration',
  'refund',
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
  /** Short label (≤16 chars) for list rows on small screens. */
  short_zh?: string;
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
  effect?: Effect;
  last_checked: string;
}

export const EFFECT_KINDS = ['lock', 'cap', 'exclusive', 'withdraw', 'requires', 'refund', 'hold', 'fallback'] as const;

/**
 * For the scheduling engine. Post-acceptance kinds:
 *  - requires: { target: paid_registration, before: visa_letter }
 *  - refund:   { trigger, full_until?, then?, condition?: { applied_by }, request_by?, evidence? }
 *  - hold:     { target: registration_nudge, while: aid_applied, until }
 *  - fallback: { substitute, virtual }  (what a presenter who cannot travel may do)
 * Fields that name a milestone hold a milestone type of the same edition.
 */
export interface Effect {
  kind: (typeof EFFECT_KINDS)[number];
  [k: string]: unknown;
}

// ---------- visa (data/visa/<regime>.yml, data/visa/countries.yml) ----------

/** ISO 3166-1 alpha-2 → visa regime id (data/visa/<id>.yml), or "none" when no visa is needed (mainland China). */
export type VisaCountries = Record<string, string>;

export type VisaFee =
  | ({ item: string; amount: number; currency: string } & Evidence)
  | { item: string; status: 'unverified'; note_zh: string };

export type VisaFact =
  | ({ id: string; label_zh: string; text_zh: string } & Evidence)
  | { id: string; label_zh: string; status: 'tba' | 'unverified'; note_zh: string };

export interface Span {
  n: number;
  unit: 'day' | 'workday' | 'week' | 'month';
}

/** This app's own allowance, never an official figure. */
export interface AppBuffer {
  weeks: number;
  basis: 'assumption';
  note_zh?: string;
}

export type VisaLead =
  | {
      /** Work back from departure: D − official − app_buffer. */
      kind: 'processing_time';
      official: { value: number; unit: Span['unit']; max?: number } & Evidence;
      as_of: { date: string } & Evidence;
      includes?: ({ what: string } & Evidence)[];
      excludes?: ({ what: string } & Evidence)[];
      caveat?: Evidence;
      app_buffer: AppBuffer;
    }
  | {
      /** Compare only: earliest interview ≈ max(today, as_of) + wait; never worked back. */
      kind: 'appointment_wait';
      as_of: { date: string } & Evidence;
      /** e.g. "We calculate months in 30-day increments". */
      unit?: Evidence;
      posts: ({ id: string; name_zh: string; months: number; qualifier?: 'lt'; avg_months?: number } & Evidence)[];
      excludes?: ({ what: string } & Evidence)[];
    }
  | { status: 'tba' | 'unverified'; note_zh: string };

export interface VisaRegime {
  id: string;
  name_zh: string;
  /** Whose passport this guidance is for; other passports only get the links. */
  passport: 'cn_ordinary';
  last_checked: string;
  requirement: {
    answer: 'required' | 'visa_free' | 'not_needed';
    visa_zh: string;
    /** The short tag on a venue's place block when the answer's word does not fit (港澳通行证). */
    short_zh?: string;
    conditions_zh?: string;
    /** Last day of a temporary visa exemption. */
    until?: string;
    conf: 'high' | 'medium' | 'low';
  } & Evidence;
  apply?: { label_zh: string; url: string }[];
  fees?: VisaFee[];
  /** When one may apply: earliest (before travel) and latest (before travel). */
  window?: { earliest?: Span & Evidence; latest?: Span & Evidence };
  facts?: VisaFact[];
  lead?: VisaLead;
  documents?: ({ item_zh: string } & Evidence)[] | { status: 'tba'; note_zh: string };
  notices?: ({ text_zh: string; date?: string; url?: string } & Evidence)[];
  transit?: ({ item_zh: string } & Evidence)[];
  links?: { label_zh: string; url: string }[];
  note_zh?: string;
}

// ---------- China: holidays (data/china/holidays-<year>.yml) and school rules (data/china/admin.yml) ----------

export interface HolidayRange extends Evidence {
  name_zh: string;
  start: string;
  end: string;
  /** Estimated years: the days the law itself makes holidays. */
  statutory?: string[];
  /** Estimated years: the law and the lunar-calendar rows behind `statutory`. */
  evidence?: Evidence[];
}

export interface HolidayFile {
  year: number;
  /** confirmed: from the State Council notice; estimated: the notice is not out yet. */
  status: 'confirmed' | 'estimated';
  basis?: 'assumption';
  src?: string;
  notice_zh?: string;
  method_zh?: string;
  /** Days off, including weekend days inside the range. */
  holidays: HolidayRange[];
  /** 调休上班日: weekend days that are working days. */
  workdays: ({ date: string; name_zh: string } & Evidence)[];
  last_checked: string;
  note_zh?: string;
}

export const ADMIN_TOPICS = [
  'approval_lead',
  'stay_limit',
  'online_approval',
  'passport',
  'post_trip',
  'reimburse',
  'funding',
  'other',
] as const;

export interface ChinaAdminItem extends Evidence {
  id: string;
  /** e.g. 上海交通大学 · 电子信息与电气工程学院 */
  org_zh: string;
  who: 'student' | 'staff' | 'all';
  topic: (typeof ADMIN_TOPICS)[number];
  /** One sentence in our words; the quote carries the official wording. */
  text_zh: string;
  n?: number;
  unit?: 'day' | 'workday' | 'month';
  /** hard: a floor the school enforces; advice: a recommendation. */
  kind?: 'hard' | 'advice';
  /** Date the page or rule was issued, when it says so. */
  issued?: string;
}

export interface ChinaAdmin {
  last_checked: string;
  note_zh: string;
  items: ChinaAdminItem[];
}
