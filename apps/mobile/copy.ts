// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// App wording layered over data/ when the app is built (scripts/app-data.ts).
// data/ holds the verified cards; this file only changes how the phone app
// words them:
//   - list labels read as "[label]？[answer]" (每人投超 20 篇 · 不能);
//   - Chinese text names a deadline in Beijing time, never as a bare AoE date,
//     so a sheet never shows 9/25 next to a key time of 9/26;
//   - one card that answers two questions is split into two rows.
// English quotes are never touched. Every `find` below must still occur in
// data/; pnpm validate and scripts/app-data.test.ts fail when one goes stale.

import type { AppData, AppEdition, AppRule, Answer } from './types.ts';

/** List labels, written as the action the question asks about (≤16 chars). */
export const SHORT_ZH: Record<string, string> = {
  'aaai-27/dual-submission': '一稿多投',
  'aaai-27/in-person-presentation': '到现场报告',
  'aaai-27/submission-cap': '每人最多几篇',
  'arr-2026-10/contributor-registration-deadline': '审稿人注册截止日',
  'arr-2026-10/limitations-section': '写 Limitations 一节',
  'arr-2026-10/openreview-profile-orcid': '填全资料和 ORCID',
  'arr-2026-10/per-author-cap': '每轮超 20 篇或一作超 5 篇',
  'arr-2026-10/service-contributor': '指定审稿承担人',
  'cvpr-2027/author-guidelines-status': '2027 作者指南',
  'cvpr-2027/dual-submission-scope': '相似稿件投别处',
  'cvpr-2027/dual-submission-window': '审稿期一稿多投',
  'cvpr-2027/openreview-profile': '作者建好 OpenReview',
  'cvpr-2027/per-author-cap': '每人投超 25 篇',
  'cvpr-2027/reviewer-service': '作者担任审稿人',
  'iclr-2027/ai-use-section': '写 AI 使用说明一节',
  'iclr-2027/author-quota-20': '每人投超 20 篇',
  'iclr-2027/coauthor-openreview-profile': '合作者注册 OpenReview',
  'iclr-2027/dual-submission': '一稿多投',
  'iclr-2027/no-reviewer-paper-quota': '超 1 篇无互审作者的论文',
  'iclr-2027/page-limit': '正文不超 9 页',
  'iclr-2027/public-deanonymized': '接受论文和审稿公开',
  'iclr-2027/reciprocal-reviewer-per-paper': '每篇出一名作者审稿',
  'iclr-2027/reviewer-duty-3-papers': '挂名 3 篇以上审 6 篇',
  'iclr-2027/reviewer-llm-policy': '审稿时用 LLM',
};

/** Questions short enough for two lines at 20px. */
export const QUESTION_ZH: Record<string, string> = {
  'aaai-27/author-feedback-format': 'rebuttal 何时写？长度和内容有什么限制？',
  'aaai-27/llm-duplicates-prompt-injection': '用 LLM 改写重复投稿，或做 prompt injection，会怎样？',
  'aaai-27/topics-locked': '摘要截止后还能改 primary / secondary topics 吗？',
  'arr-2026-10/openreview-profile-orcid': '所有作者都要有完整的 OpenReview 资料和 ORCID 吗？',
  'arr-2026-10/service-contributor': '每篇投稿都要指定一名 service contributor 吗？',
  'cvpr-2027/dual-submission-window': 'CVPR 审稿期间，能把相似论文同时投别处吗？',
  'cvpr-2027/iclr-overlap-withdraw-deadline': 'ICLR 在审的论文转投 CVPR，最晚何时撤 ICLR？',
  'cvpr-2027/reviewer-penalty': '审稿迟交或极不负责，自己的论文会被 desk reject 吗？',
};

export type TextField = 'question_zh' | 'summary_zh' | 'detail_zh' | 'note_zh' | number;

export interface TextFix {
  id: string;
  /** A text field, or the index of a quote whose reading_zh is edited. */
  field: TextField;
  find: string;
  replace: string;
}

/** Targeted edits for dates the automatic pass (beijingText) cannot place. */
export const TEXT_FIXES: TextFix[] = [
  { id: 'aaai-27/author-membership-freeze', field: 'summary_zh', find: '后到 7/28 之间', replace: '后到正文截止之间' },
  { id: 'arr-2026-10/contributor-registration-deadline', field: 'summary_zh', find: '按最早的 10/12 排', replace: '按最早的日期排' },
  { id: 'arr-2026-10/contributor-registration-deadline', field: 0, find: '即 10/14 AoE', replace: '即 10/15 19:59' },
  { id: 'arr-2026-10/author-order', field: 2, find: '从 10/12 截止到', replace: '从投稿截止到' },
  {
    id: 'cvpr-2027/supplementary-no-updated-paper',
    field: 'detail_zh',
    find: '补充材料截止为 11/24 北京时间 19:59（11/23 AoE）',
    replace: '补充材料截止为 11/24 19:59',
  },
  { id: 'iclr-2027/author-order', field: 'summary_zh', find: '只有 9/25 前调整', replace: '只有正文截止前调整' },
  { id: 'iclr-2027/title-abstract-edit', field: 'summary_zh', find: '和 9/18 注册的摘要', replace: '和摘要截止时提交的摘要' },
  {
    id: 'cvpr-2027/iclr-overlap-withdraw-deadline',
    field: 0,
    find: '严格读法（11/10）：',
    replace: '严格读法（注册截止前撤）：',
  },
  {
    id: 'cvpr-2027/iclr-overlap-withdraw-deadline',
    field: 0,
    find: '按此理解，11/10 在 CVPR 注册时论文就不应再在 ICLR 审稿中，须在 11/10 AoE 前撤掉 ICLR。',
    replace: '按此理解，在 CVPR 注册时论文就不应再在 ICLR 审稿中，须在 CVPR 论文注册截止（11/11 19:59）前撤掉 ICLR。',
  },
  {
    id: 'cvpr-2027/iclr-overlap-withdraw-deadline',
    field: 1,
    find: '字面读法（11/16）：2027 CFP 只说“投稿”，并把审稿期写为从 11/16 开始。按此理解，11/10 只做注册不构成一稿多投，在 11/16 AoE 正文截止前撤掉 ICLR 即可。',
    replace: '字面读法（正文截止前撤）：2027 CFP 只说“投稿”，并把审稿期的起点写为正文截止那天。按此理解，只做注册不构成一稿多投，在 CVPR 正文截止（11/17 19:59）前撤掉 ICLR 即可。',
  },
  {
    id: 'cvpr-2027/iclr-overlap-withdraw-deadline',
    field: 4,
    find: '撤稿即刻去匿名',
    replace: '两种读法都要考虑：撤稿即刻去匿名',
  },
];

/** Milestone labels whose list form (label without the aside) would mislead. */
export const MILESTONE_LABEL: Record<string, string> = {
  // "审稿人写审稿" alone reads as if every author has to review.
  'iclr-2027/reviewing': '审稿期（作者兼审稿人适用）',
};

/** Milestones whose date itself differs between official pages (see each note_zh). */
export const DISPUTED = new Set([
  'arr-2026-10/reviewer_registration',
  'arr-2026-10/meta_reviews',
  // WWW 2027: the CFP moved results to 12/21 and rebuttal to 12/21–31 on 2026-09-25; Important Dates still says 12/15 and 12/15–20.
  'www-2027/reviews_out',
  'www-2027/author_response',
]);

export interface Split {
  /** The card to split. */
  id: string;
  /** Changes to the original card. */
  patch: Partial<AppRule>;
  /** The second card: its id and the fields that differ from the original. */
  add: Partial<AppRule> & { id: string; question_zh: string; short_zh: string; answer: Answer; summary_zh: string };
  /** Which of the original quotes the second card shows, first one first. */
  quotes: number[];
}

/**
 * iclr-2027/withdrawal answers two questions: "can I withdraw" (yes, until the
 * decision) and "does a withdrawal stay private" (only before the paper
 * deadline). As one 有条件 row the moment that matters, the paper deadline,
 * was hidden; as two rows the second one locks at 正文截止 like any other lock.
 */
export const SPLITS: Split[] = [
  {
    id: 'iclr-2027/withdrawal',
    patch: {
      question_zh: '出最终结果前，还能撤稿吗？',
      short_zh: '出结果前撤稿',
      answer: 'allowed',
      summary_zh: '出最终结果前随时可以撤稿。注意：正文截止（9/26 19:59）后撤稿，论文会公开并立即显示作者。',
      applies: { until: 'notification', note_zh: '出最终结果前都可以撤；撤稿是否公开以正文截止为界' },
      effect: undefined,
    },
    add: {
      id: 'iclr-2027/withdrawal-public',
      question_zh: '正文截止后撤稿，论文还能不公开吗？',
      short_zh: '撤稿不公开',
      answer: 'not_allowed',
      summary_zh:
        '不能。正文截止前撤稿，论文会从 OpenReview 删除；正文截止后撤稿，论文会公开留在 “withdrawn papers” 区，并立即去匿名、显示作者。',
      applies: { from: 'paper', note_zh: '正文截止前撤稿会被删除；截止后撤稿就公开并显示作者' },
      effect: { kind: 'lock', target: 'withdraw_private' },
    },
    quotes: [2, 3, 1, 4],
  },
];

// ---------- dates in Chinese text ----------

export interface DateRef {
  edition: string;
  type: string;
  /** Names the text uses for this milestone, longest first. */
  names: string[];
  /** Official day, "9/25". */
  aoe: string;
  /** Beijing day and time, "9/26 19:59". */
  beijing: string;
}

const NAMES: Record<string, string[]> = {
  abstract: ['摘要截止'],
  paper_registration: ['论文注册截止', '论文注册'],
  paper: ['正文截止'],
  supplementary: ['补充材料截止'],
  profile_deadline: ['资料截止'],
  camera_ready: ['camera-ready 截止'],
  commitment: ['commit 截止'],
};

const md = (s: string) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Deadlines the venue gave a time for: their official day and Beijing time. */
export function dateRefs(editions: AppEdition[]): DateRef[] {
  const out: DateRef[] = [];
  for (const e of editions)
    for (const m of e.milestones)
      for (const t of [m.at_resolved, m.start_resolved, m.end_resolved])
        if (t && t.local.includes('T') && m.status !== 'tba')
          out.push({ edition: e.id, type: m.type, names: NAMES[m.type] ?? [], aoe: md(t.local), beijing: `${md(t.beijing)} ${t.beijing.slice(11, 16)}` });
  return out;
}

/** Days the app shows as official dates (the venue gave no time), per edition. */
function untimedDays(editions: AppEdition[], edition?: string): Set<string> {
  const out = new Set<string>();
  for (const m of editions.find((e) => e.id === edition)?.milestones ?? [])
    for (const t of [m.at_resolved, m.start_resolved, m.end_resolved]) if (t && !t.local.includes('T')) out.add(md(t.local));
  return out;
}

const D = '\\d{1,2}/\\d{1,2}';

/**
 * Rewrites official (AoE) days in Chinese text so they match the Beijing
 * times the app shows:
 *   "9/25 AoE（北京时间 9/26 19:59）" → "9/26 19:59"
 *   "正文截止（9/25）" / "9/18 摘要截止" → the name alone
 *   "10/12 AoE" (a known deadline)     → "10/13 19:59"
 * Days the app itself shows as official dates (11/18 for a window the venue
 * gave no time for) keep both forms. `edition` refs come first so a day
 * shared by two venues resolves to this one.
 */
export function beijingText(text: string, refs: DateRef[], edition?: string, keep: Set<string> = new Set()): string {
  // Keep a space before following text: "7/29 19:59 正文截止", not "7/29 19:59正文截止".
  const spaced = (t: string, rest: string) => (rest === '' || /^[\s，。；、：:）)]/.test(rest) ? t : `${t} `);
  let s = text;
  for (const re of [
    new RegExp(`(${D}) AoE[（(]北京时间 (${D} \\d{2}:\\d{2})[）)]`, 'g'),
    new RegExp(`(${D}) AoE[，,]\\s*北京时间 (${D} \\d{2}:\\d{2})`, 'g'),
  ])
    s = s.replace(re, (m: string, a: string, b: string, off: number, all: string) =>
      keep.has(a) ? m : spaced(b, all.slice(off + m.length)),
    );
  const ordered = [...refs.filter((r) => r.edition === edition), ...refs.filter((r) => r.edition !== edition)];
  for (const r of ordered) {
    const day = escRe(r.aoe);
    for (const name of r.names) {
      const n = escRe(name);
      s = s.replace(new RegExp(`(${n})[（(]${day}[）)]`, 'g'), '$1');
      // "定在 7/28 正文截止" → "定在正文截止"; a space stays after Latin text.
      s = s.replace(new RegExp(`(^|[^\\d/\\s])(\\s?)${day} (?=(?:[A-Z]+ )?${n})`, 'g'), (_m: string, pre: string, sp: string) =>
        /[A-Za-z0-9)]$/.test(pre) ? `${pre}${sp}` : pre,
      );
      // "正文 11/16 截止" → "正文截止"
      const stem = name.replace(/截止$/, '');
      if (stem !== name) s = s.replace(new RegExp(`${escRe(stem)} ${day} 截止`, 'g'), name);
    }
  }
  for (const r of ordered) s = s.replace(new RegExp(`(?<![\\d/])${escRe(r.aoe)} AoE`, 'g'), r.beijing);
  return s;
}

/** Bare official days left in `text` that equal a timed deadline of `edition` (ranges like "11/16 至 2/22" are periods, not deadlines). */
export function bareAoeDays(text: string, refs: DateRef[], edition: string): string[] {
  const days = new Set(refs.filter((r) => r.edition === edition).map((r) => r.aoe));
  const out: string[] = [];
  const re = new RegExp(`(?<![\\d/])(${D})(?![\\d/])`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const after = text.slice(m.index + m[0].length);
    const before = text.slice(0, m.index);
    if (!days.has(m[1]!)) continue;
    if (/^\s*(AoE|\d{2}:\d{2})/.test(after) || /^\s*(至|–|-)/.test(after) || /从\s*$/.test(before)) continue;
    out.push(m[1]!);
  }
  return out;
}

// ---------- quotation marks ----------

/**
 * A Chinese phrase in ASCII quotes ("有效期", "分配后换会场或报告人") reads
 * as code on a phone: it becomes 「有效期」. English inside quotes (an
 * official wording like "before Nov 04") keeps its quotes.
 */
export function cjkQuotes(text: string): string {
  const parts = text.split('"');
  // Pairs only: an odd number of marks is left as written.
  if (parts.length < 3 || parts.length % 2 === 0) return text;
  return parts
    .map((p, i) => (i % 2 === 0 ? p : /[\u4e00-\u9fff]/.test(p) && !/[A-Za-z]/.test(p) ? `「${p}」` : `"${p}"`))
    .join('');
}

/** Every `*_zh` string under `v`, with cjkQuotes applied. */
function zhQuotes<T>(v: T): T {
  if (Array.isArray(v)) return v.map(zhQuotes) as T;
  if (!v || typeof v !== 'object') return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = typeof x === 'string' && k.endsWith('_zh') ? cjkQuotes(x) : zhQuotes(x);
  return out as T;
}

// ---------- applying it ----------

function edit(text: string | undefined, fixes: TextFix[], field: TextField): string | undefined {
  if (text === undefined) return undefined;
  let s = text;
  for (const f of fixes) if (f.field === field) s = s.replace(f.find, f.replace);
  return s;
}

/** Stale entries: overrides whose rule or text no longer exists in the data. */
export function staleCopy(data: AppData): string[] {
  const rules = new Map(data.rules.map((r) => [r.id, r]));
  const out: string[] = [];
  for (const id of [...Object.keys(SHORT_ZH), ...Object.keys(QUESTION_ZH), ...SPLITS.map((s) => s.id)])
    if (!rules.has(id)) out.push(`${id}: no such rule`);
  for (const f of TEXT_FIXES) {
    const r = rules.get(f.id);
    const text =
      typeof f.field === 'number' ? r?.quotes[f.field]?.reading_zh : f.field === 'note_zh' ? r?.applies?.note_zh : r?.[f.field];
    if (!text?.includes(f.find)) out.push(`${f.id} ${f.field}: "${f.find}" not found`);
  }
  for (const key of [...Object.keys(MILESTONE_LABEL), ...DISPUTED]) {
    const [ed, type] = key.split('/');
    if (!data.editions.find((e) => e.id === ed)?.milestones.some((m) => m.type === type)) out.push(`${key}: no such milestone`);
  }
  return out;
}

export function applyCopy(data: AppData): AppData {
  const editions = data.editions.map((e) => ({
    ...e,
    sites: zhQuotes(e.sites),
    logistics: zhQuotes(e.logistics),
    milestones: e.milestones.map((m) => {
      const key = `${e.id}/${m.type}`;
      return { ...m, label_zh: MILESTONE_LABEL[key] ?? m.label_zh, note_zh: m.note_zh === undefined ? undefined : cjkQuotes(m.note_zh), disputed: DISPUTED.has(key) || undefined };
    }),
  }));
  const refs = dateRefs(editions);
  const rules: AppRule[] = [];
  for (const r0 of data.rules) {
    const split = SPLITS.find((s) => s.id === r0.id);
    const base = split ? { ...r0, ...split.patch } : r0;
    const variants: AppRule[] = [base];
    if (split) variants.push({ ...r0, ...split.add, quotes: split.quotes.map((i) => r0.quotes[i]!).filter(Boolean) });
    const keep = untimedDays(editions, r0.edition);
    for (const r of variants) {
      const fixes = r === base ? TEXT_FIXES.filter((f) => f.id === r.id) : [];
      const fix = (t: string | undefined, field: TextField) => {
        const s = edit(t, fixes, field);
        return s === undefined ? undefined : cjkQuotes(beijingText(s, refs, r.edition, keep));
      };
      rules.push({
        ...r,
        short_zh: r === base ? (SHORT_ZH[r.id] ?? r.short_zh) : r.short_zh,
        question_zh: fix(QUESTION_ZH[r.id] ?? r.question_zh, 'question_zh')!,
        summary_zh: fix(r.summary_zh, 'summary_zh')!,
        detail_zh: fix(r.detail_zh, 'detail_zh'),
        applies: r.applies ? { ...r.applies, note_zh: fix(r.applies.note_zh, 'note_zh') } : undefined,
        quotes: r.quotes.map((q, i) => (q.reading_zh ? { ...q, reading_zh: fix(q.reading_zh, i) } : q)),
      });
    }
  }
  return { ...data, editions, rules, visa: zhQuotes(data.visa), china: zhQuotes(data.china) };
}

// ---------- checks (pnpm validate, tests) ----------

const ANSWER_LEAD = /^(必须|不能|可以|不可以|不允许)/;

export interface CopyLint {
  errors: string[];
  warnings: string[];
}

/** Wording rules for the effective (post-copy) data. */
export function lintCopy(data: AppData): CopyLint {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refs = dateRefs(data.editions);
  for (const r of data.rules) {
    const s = r.short_zh;
    if (!s) warnings.push(`${r.id}: no short_zh`);
    else {
      if (s.length > 16) errors.push(`${r.id}: short_zh "${s}" is over 16 chars`);
      if (ANSWER_LEAD.test(s)) errors.push(`${r.id}: short_zh "${s}" starts with an answer word; name the action instead`);
      if (r.answer === 'required' && s.includes('须')) errors.push(`${r.id}: short_zh "${s}" repeats 须 next to 必须`);
    }
    if (r.question_zh.length > 40) warnings.push(`${r.id}: question_zh is ${r.question_zh.length} chars (over 2 lines at 20px)`);
    const texts: [string, string][] = [
      ['question_zh', r.question_zh],
      ['summary_zh', r.summary_zh],
      ...r.quotes.map((q, i): [string, string] => [`reading ${i}`, q.reading_zh ?? '']),
    ];
    for (const [field, text] of texts) {
      const bare = bareAoeDays(text, refs, r.edition);
      if (bare.length) warnings.push(`${r.id} ${field}: official day ${bare.join(', ')} next to Beijing times; name the deadline or write it in Beijing time`);
    }
  }
  return { errors, warnings };
}
