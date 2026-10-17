// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Past data on the zoomed venue page (docs/MOBILE_SPEC.md §11.4): what each
// acceptance-rate bar shows and what its source sheet says, the top topics by
// accepted papers with the change from the year before, and official
// per-area rows. Words and numbers only; no DOM here.

import type { AppAreaFile, AppStatRow, AppStatsSeries, AppTopics } from './types.ts';

/** "19,525". */
export const num = (n: number) => n.toLocaleString('en-US');

// ---------- acceptance rates (§11.4.1) ----------

/** 主会 (with KDD's cycles) or Findings: drawn apart, never added up. EMNLP 2026's combined count is on both, labelled 合计. */
export type StatTab = 'main' | 'findings';

export const tabOf = (row: AppStatRow): StatTab => (row.track === 'findings' ? 'findings' : 'main');

/** A row drawn on a tab: its own, or a 主会 + Findings total, which belongs to neither and shows on both. */
export const onTab = (row: AppStatRow, tab: StatTab) => row.track === 'main_and_findings' || tabOf(row) === tab;

export const TAB_ZH: Record<StatTab, string> = { main: '主会', findings: 'Findings' };

/** "27.4%", "约 17.5%" (the venue itself wrote "~"). */
export function rateText(row: AppStatRow): string {
  if (!row.rate_text) return '';
  return row.rate_basis === 'approx' ? `约 ${row.rate_text}` : row.rate_text;
}

export interface StatCell {
  row: AppStatRow;
  /** solid: official; hatched: third party; none: nothing to draw. */
  bar: 'solid' | 'hatched' | 'none';
  /** Bar height, 0–1 of the chart (zero-based, one scale per chart). */
  h: number;
  /** Over the bar. */
  top: string;
  /** Under the year: 第三方 / 仅录用数 / 合计 / —. */
  under: string;
  /** KDD's cycles: "8 月轮". */
  cycle?: string;
  /** 主会 + Findings together (EMNLP 2026): never read as a main-conference count. */
  combined?: boolean;
  latest: boolean;
}

/**
 * How one row shows, from its status only (§11.4.1):
 *   official             solid bar, rate_text
 *   partial with a rate  solid bar, rate_text (ICML 2025 "27%")
 *   partial, no rate     no bar, "仅录用数" (ICLR 2022)
 *   third_party          hatched bar, rate_text, "第三方"
 *   none                 no bar, "—" (the sheet says 官方未公布, or 数字存疑 for ICRA 2020)
 */
export function statCell(row: AppStatRow): Omit<StatCell, 'h' | 'latest'> {
  const cycle = row.track === 'cycle1' || row.track === 'cycle2' ? row.track_zh : undefined;
  const has = row.rate !== undefined;
  if (row.track === 'main_and_findings' && row.status !== 'none')
    return { row, bar: has ? (row.status === 'third_party' ? 'hatched' : 'solid') : 'none', top: rateText(row), under: '合计', combined: true };
  switch (row.status) {
    case 'official':
      return { row, bar: has ? 'solid' : 'none', top: rateText(row), under: '', cycle };
    case 'partial':
      return has
        ? { row, bar: 'solid', top: rateText(row), under: '', cycle }
        : { row, bar: 'none', top: '', under: row.accepted !== undefined ? '仅录用数' : '仅投稿数', cycle };
    case 'third_party':
      return { row, bar: has ? 'hatched' : 'none', top: rateText(row), under: '第三方', cycle };
    default:
      return { row, bar: 'none', top: '', under: '—', cycle };
  }
}

export interface StatSlot {
  year: number;
  cells: StatCell[];
}

export interface StatChart {
  tab: StatTab;
  tabs: StatTab[];
  /** One slot a year, from the first row to the latest year; a year without a row keeps its place. */
  slots: StatSlot[];
  latest: number;
  /** The latest year with a bar drawn: its bars and year take the accent (NeurIPS 2025 while 2026 is 官方未公布). */
  accent: number;
  /** The rate at the top of the chart: 50%, the same on every venue page, so bar heights compare (more only above 50%). */
  scale: number;
}

const TRACK_ORDER = ['main', 'main_and_findings', 'cycle1', 'cycle2', 'findings'];

export function statTabs(file: AppStatsSeries): StatTab[] {
  return file.rows.some((r) => tabOf(r) === 'findings') ? ['main', 'findings'] : ['main'];
}

/** The bars of one tab, zero-based on a fixed 0–50% scale (a 25% gridline), so a bar is as tall on every page. */
export function statChart(file: AppStatsSeries, tab: StatTab = 'main'): StatChart {
  const rows = file.rows.filter((r) => onTab(r, tab));
  const tabs = statTabs(file);
  const top = Math.max(50, Math.ceil(Math.max(0, ...rows.map((r) => r.rate ?? 0)) / 10) * 10);
  if (!rows.length) return { tab, tabs, slots: [], latest: 0, accent: 0, scale: top };
  const years = rows.map((r) => r.year);
  const first = Math.min(...years);
  const latest = Math.max(...years);
  const drawn = rows.filter((r) => statCell(r).bar !== 'none').map((r) => r.year);
  const accent = drawn.length ? Math.max(...drawn) : 0;
  const slots: StatSlot[] = [];
  for (let y = first; y <= latest; y++) {
    const cells = rows
      .filter((r) => r.year === y)
      .sort((a, b) => TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track))
      .map((r) => ({ ...statCell(r), h: (r.rate ?? 0) / top, latest: y === accent }));
    slots.push({ year: y, cells });
  }
  return { tab, tabs, slots, latest, accent, scale: top };
}

/**
 * The lines under the chart: the latest year (every cycle of it), and when
 * that year has no count yet (NeurIPS 2026, 官方未公布), also the latest
 * year that has one.
 */
export function summaryRows(chart: StatChart): StatCell[] {
  const cells = chart.slots.flatMap((s) => s.cells);
  const last = cells.filter((c) => c.row.year === chart.latest);
  const counted = (c: StatCell) => c.row.submissions !== undefined || c.row.accepted !== undefined;
  if (last.some(counted)) return last;
  const prev = [...cells].reverse().find(counted);
  return prev ? [...last, ...cells.filter((c) => c.row.year === prev.row.year && counted(c))] : last;
}

/** "投稿 19,525 · 录用 5,355", leaving out what is not published; "官方未公布" when neither is. */
export function countsText(row: AppStatRow): string {
  const parts: string[] = [];
  if (row.submissions !== undefined) parts.push(`投稿 ${num(row.submissions)}`);
  if (row.accepted !== undefined) parts.push(`录用 ${num(row.accepted)}`);
  return parts.length ? parts.join(' · ') : '官方未公布';
}

/** A summary line's head: "2026", "2025 8 月轮", "2026 主会+Findings 合计". */
export const sumLabel = (c: Pick<StatCell, 'row' | 'cycle' | 'combined'>) =>
  `${c.row.year}${c.cycle ? ` ${c.cycle}` : ''}${c.combined ? ' 主会+Findings 合计' : ''}`;

/**
 * What a summary line (and a bar's screen-reader label) says after the year:
 * the counts; a rate without counts says so ("约 17.5% · 篇数官方未公布",
 * AAAI-26, not a bare 官方未公布 under its own bar); 官方未公布 only when the
 * row has nothing.
 */
export function sumText(row: AppStatRow): string {
  if (row.status === 'none') return row.reason === 'doubtful' ? '数字存疑，不显示' : '官方未公布';
  if (row.submissions !== undefined || row.accepted !== undefined) return countsText(row);
  return row.rate_text ? `${rateText(row)} · 篇数官方未公布` : '官方未公布';
}

/** The route of a row's source sheet: #/stat/<series>/<year>[/<track>]. */
export const statHref = (series: string, row: AppStatRow) => `#/stat/${series}/${row.year}${row.track === 'main' ? '' : `/${row.track}`}`;

export function findRow(file: AppStatsSeries | undefined, year: number, track = 'main'): AppStatRow | undefined {
  return file?.rows.find((r) => r.year === year && r.track === track);
}

export interface StatDetail {
  /** The big line: "27.4%", "约 17.5%", "官方未公布", "数字存疑，不显示", "仅录用数". */
  big: string;
  /** "投稿 19,525 · 录用 5,355"; missing counts say 官方未公布. */
  counts?: string;
  /** Small grey tags after the big line. */
  tags: string[];
  /** Lines under it, in order. */
  notes: string[];
  /** The main button. */
  button?: { label: string; href: string };
}

/**
 * The source sheet of one bar (§11.4.1, wireframe E): the number as the
 * venue wrote it, the counts, what the rate counts, and every label that
 * says how sure it is (第三方, 约, 官方估算, 按官方数字计算, 官网名单计数).
 */
export function statDetail(row: AppStatRow): StatDetail {
  const tags: string[] = [];
  const notes: string[] = [];
  if (row.status === 'none') {
    const doubtful = row.reason === 'doubtful';
    if (row.note_zh) notes.push(row.note_zh);
    if (row.reason === 'unlicensed_only') notes.push('只在没有许可证的聚合站上见到这一年的数字，本应用不转载');
    return { big: doubtful ? '数字存疑，不显示' : '官方未公布', tags, notes };
  }
  if (row.status === 'third_party') tags.push('第三方');
  if (row.rate_basis === 'estimate') tags.push('官方估算');
  if (row.rate_basis === 'computed') tags.push('按官方数字计算');
  if (row.count_method_zh) tags.push('官网名单计数');
  const big = rateText(row) || (row.accepted !== undefined ? '仅录用数' : row.submissions !== undefined ? '仅投稿数' : '—');
  // Only what the venue gave; a partial row names what is missing.
  const parts: string[] = [];
  if (row.submissions !== undefined) parts.push(`投稿 ${num(row.submissions)}`);
  else if (row.status === 'partial') parts.push('投稿数官方未公布');
  if (row.accepted !== undefined) parts.push(`录用 ${num(row.accepted)}`);
  else if (row.status === 'partial') parts.push('录用数官方未公布');
  if (row.status === 'partial' && row.rate === undefined && row.submissions === undefined) parts.push('录用率官方未公布');
  if (row.definition_zh) notes.push(`口径：${row.definition_zh}`);
  if (row.relay_zh) notes.push(row.relay_zh.startsWith('第三方') ? row.relay_zh : `第三方：${row.relay_zh}`);
  if (row.dataset === 'lixin4ever') notes.push('按 MIT 许可转载，署名和许可证见 NOTICE');
  if (row.rate_basis === 'computed') notes.push('录用率按官方数字计算（录用 ÷ 投稿，一位小数）');
  if (row.rate_basis === 'estimate') notes.push('官方说这个录用率是估算');
  if (row.mismatch_zh) notes.push(row.mismatch_zh);
  if (row.count_method_zh) notes.push(row.count_method_zh);
  if (row.note_zh) notes.push(row.note_zh);
  const href = row.link ?? row.source_url;
  return {
    big,
    counts: parts.length ? parts.join(' · ') : undefined,
    tags,
    notes,
    button: href ? { label: row.status === 'third_party' ? '查看第三方原文 ↗' : '查看官网原句 ↗', href } : undefined,
  };
}

/** "blog.iclr.cc" for the sheet's foot. */
export function hostOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ---------- top topics (§11.4.2) ----------

export interface TopicLine {
  /** Topics with the same count share a rank (ICLR 2025: 图学习 and 优化与学习理论 are both 10). */
  rank: number;
  tied: boolean;
  /** The name without its examples in brackets ("3D 视觉"); the sheet has the full one. */
  label: string;
  /** Many false matches: "*" after the name. */
  star: boolean;
  count: string;
  share: string;
  /** Bar length, 0–1: the first topic fills it. */
  bar: number;
  /** Change in share from the year before, in percentage points; absent without last year's count. */
  delta?: { dir: 'up' | 'down' | 'flat'; text: string };
}

/** Share now minus share a year ago, in points, one decimal (−0 is 0). */
export function deltaPp(share: number, prevShare: number): number {
  const d = Math.round((share - prevShare) * 10) / 10;
  return d === 0 ? 0 : d;
}

export function deltaOf(share: number, prevShare: number): TopicLine['delta'] {
  const d = deltaPp(share, prevShare);
  if (d === 0) return { dir: 'flat', text: '±0' };
  return d > 0 ? { dir: 'up', text: `▲${d.toFixed(1)}` } : { dir: 'down', text: `▼${Math.abs(d).toFixed(1)}` };
}

/** The topic name for one line: the examples in brackets go ("高效化（量化/剪枝/蒸馏/KV 缓存）" → "高效化"). */
export const topicShort = (label: string) => label.replace(/\s*（[^）]*）$/, '') || label;

/**
 * The top topics by accepted papers, highest first: the first `shown` (10),
 * and any topic tied with the 10th (never cut one of two equal counts).
 */
export function topicLines(t: AppTopics, shown = 10): TopicLine[] {
  const all = [...t.topics].sort((a, b) => b.count - a.count || a.rank - b.rank);
  const cut = all[shown - 1]?.count;
  const rows = all.filter((r, i) => i < shown || r.count === cut);
  const top = rows[0]?.share_pct ?? 1;
  return rows.map((r) => ({
    rank: 1 + all.filter((x) => x.count > r.count).length,
    tied: all.filter((x) => x.count === r.count).length > 1,
    label: topicShort(r.label_zh),
    star: !!r.low_precision,
    count: num(r.count),
    share: `${r.share_pct.toFixed(1)}%`,
    bar: r.share_pct / top,
    delta: r.prev ? deltaOf(r.share_pct, r.prev.share_pct) : undefined,
  }));
}

/** The years with topics for a series, latest last. */
export const topicYears = (all: AppTopics[], series: string) => all.filter((t) => t.series === series).map((t) => t.year).sort((a, b) => a - b);

// ---------- official per-area statistics (§11.4.3) ----------

export interface AreaLine {
  area: string;
  rate?: string;
  /** Bar length against the highest rate shown, 0–1. */
  bar?: number;
  count?: string;
  small?: boolean;
}

export interface AreaView {
  /** "各领域录用率" / "各领域投稿数" / "各领域录用数" / "特别主题 track" / "占录用论文的比例". */
  title: string;
  /**
   * On the venue page: at most AREA_INLINE rows, largest first (by
   * submissions, or the count shown), only areas with ≥ 100 submissions
   * when the counts are known; in the official order when they are not.
   */
  lines: AreaLine[];
  /** 全部 N 个领域: the ≥ 100 areas, then the 样本少 ones (tagged), each largest first. */
  all: AreaLine[];
  /** Areas under 100 submissions. */
  smallCount: number;
  /** "按投稿数排" / "按官方顺序" / "按篇数排". */
  order: string;
  /** The whole conference's (or track's) rate: a reference line. */
  ref?: number;
  /** "全会 23.6%", "直投合计 20.73%", "研究赛道合计 约 22.1%". */
  refText?: string;
  /** One-line kinds: the sentence itself. */
  sentence?: string;
  /** Grey notes: "约值", 名称为本应用对照, the gap to the total. */
  notes: string[];
  approx: boolean;
}

export const MIN_AREA_SUBMISSIONS = 100;
/** Rows on the venue page; the rest are one tap away (owner: 不要太复杂). */
export const AREA_INLINE = 5;

/** "约 35%" read off a chart (rounded), "22.12%" from a table. */
export const areaRate = (rate: number, precision: AppAreaFile['precision']) => (precision === 'chart_read' ? `约 ${Math.round(rate)}%` : `${rate.toFixed(2)}%`);

const areaCount = (n: number, precision: AppAreaFile['precision']) => `${precision === 'chart_read' ? '约 ' : ''}${num(n)} 篇`;

/** Files with per-area rates come first on the venue page; counts-only years sit on 全部 (NeurIPS 2024). */
export const isRateFile = (a: AppAreaFile) => a.kind === 'rates' || a.kind === 'rate_only';

export function areaView(a: AppAreaFile): AreaView {
  const approx = a.precision === 'chart_read';
  const notes: string[] = [];
  if (a.names_mapped) notes.push('领域名称为本应用对照补全');
  if (a.gap_note_zh) notes.push(a.gap_note_zh);
  const base = { notes, approx, lines: [] as AreaLine[], all: [] as AreaLine[], smallCount: 0, order: '' };
  switch (a.kind) {
    case 'theme_track': {
      const r = a.rows[0]!;
      const rate = r.submissions && r.accepted !== undefined ? ((100 * r.accepted) / r.submissions).toFixed(1) : undefined;
      return {
        ...base,
        title: '特别主题 track',
        sentence: `投稿 ${num(r.submissions ?? 0)} · 录用 ${num(r.accepted ?? 0)}${rate ? ` · ${rate}%（按官方数字计算）` : ''}`,
      };
    }
    case 'share_of_accepted': {
      const r = a.rows[0]!;
      return { ...base, title: '占录用论文的比例', sentence: `官方：${r.area} 占录用论文 ${r.share_pct}%` };
    }
    case 'submissions_only':
    case 'accepted_only': {
      const key = a.kind === 'submissions_only' ? 'submissions' : 'accepted';
      const rows = [...a.rows].sort((x, y) => (y[key] ?? 0) - (x[key] ?? 0));
      const max = Math.max(...rows.map((r) => r[key] ?? 0), 1);
      const all = rows.map((r) => ({ area: r.area, count: areaCount(r[key] ?? 0, a.precision), bar: (r[key] ?? 0) / max }));
      return { ...base, title: a.kind === 'submissions_only' ? '各领域投稿数' : '各领域录用数', lines: all.slice(0, AREA_INLINE), all, order: '按篇数排' };
    }
    default: {
      const known = a.rows.some((r) => r.submissions !== undefined);
      if (!known) notes.unshift('官方没给每个领域的篇数');
      const max = Math.max(...a.rows.map((r) => r.rate ?? 0), a.total?.rate ?? 0, 1);
      const line = (r: (typeof a.rows)[number], small = false): AreaLine => ({
        area: r.area,
        rate: r.rate !== undefined ? areaRate(r.rate, a.precision) : undefined,
        bar: (r.rate ?? 0) / max,
        count: r.submissions !== undefined ? `投稿 ${areaCount(r.submissions, a.precision)}` : undefined,
        small: small || undefined,
      });
      // By size, not by rate: a list sorted by rate reads as "which area is easiest" (and puts
      // KDD 2023's 16-paper areas on top). Readers look up their own area; the rate is the value.
      const bySize = [...a.rows].sort((x, y) => (y.submissions ?? 0) - (x.submissions ?? 0));
      const big = known ? bySize.filter((r) => (r.submissions ?? 0) >= MIN_AREA_SUBMISSIONS) : a.rows;
      const small = known ? bySize.filter((r) => (r.submissions ?? 0) < MIN_AREA_SUBMISSIONS) : [];
      const ref = a.total?.rate;
      const all = [...big.map((r) => line(r)), ...small.map((r) => line(r, true))];
      return {
        ...base,
        title: '各领域录用率',
        lines: all.filter((l) => !l.small).slice(0, AREA_INLINE),
        all,
        smallCount: small.length,
        order: known ? '按投稿数排' : '按官方顺序',
        ref: ref !== undefined ? ref / max : undefined,
        // A total with only a rate beside a chart reading is the venue's own "~17.5%" (AAAI-26).
        refText: ref !== undefined ? `${a.total?.label_zh ?? '全会'} ${approx && a.total?.submissions === undefined ? '约 ' : ''}${ref}%` : undefined,
      };
    }
  }
}

/** The files the venue page steps through: those with per-area rates when there are any, else all (WWW's counts). */
export function areaFilesShown(files: AppAreaFile[]): AppAreaFile[] {
  const rated = files.filter(isRateFile);
  return rated.length ? rated : files;
}

/** The area file shown first: the latest year with rates, else the latest. */
export function defaultAreaYear(files: AppAreaFile[]): number | undefined {
  return areaFilesShown(files)
    .map((f) => f.year)
    .sort((a, b) => b - a)[0];
}
