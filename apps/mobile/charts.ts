// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Markup for the graphic timeline and past data (docs/MOBILE_SPEC.md §11):
// the overview lanes, the zoomed phase bar, the acceptance-rate bars, the top
// topics, official per-area rows, the route's mini chart, and the bodies of
// their source sheets. Plain DOM (absolutely placed boxes), no chart library;
// positions come from timeline.ts and stats.ts.

import * as L from './logic.ts';
import * as S from './stats.ts';
import * as TL from './timeline.ts';
import type { AppAreaFile, AppStatRow, AppStatsSeries, AppTopics } from './types.ts';
import { html, icon, raw, type Raw } from './ui.ts';

/** Width of the sticky venue-name column of the overview on a small phone; style.css --tl-name (92px from 414px up) is what is drawn. */
export const NAME_PX = 76;
/** A position after the name column, whatever its width on this phone. */
const afterName = (x: number) => `calc(var(--tl-name, ${NAME_PX}px) + ${px(x)})`;
const LANE_H = 44;

const px = (n: number) => `${Math.round(n * 10) / 10}px`;
const pct = (f: number) => `${Math.round(f * 10000) / 100}%`;
const tag = (t: string, cls = '') => html`<span class="tag ${cls}">${t}</span>`;

// ---------- overview (§11.2) ----------

export interface LaneView extends TL.Lane {
  /** Colour slot 0–8. */
  color: number;
  /** What the venue name opens and says. */
  href: string;
  aria: string;
}

/** Bar geometry inside a 44px lane: one row, or two thinner ones. */
function barBox(row: number, rows: number): { top: number; h: number } {
  return rows > 1 ? { top: row ? 24 : 8, h: 12 } : { top: 15, h: 14 };
}

function laneTrack(l: LaneView, axis: TL.Axis, today: number, from: number): Raw {
  const parts: Raw[] = [];
  const font = l.rows > 1 ? 9 : 10;
  for (const s of l.segs) {
    const b = barBox(s.row, l.rows);
    const w = Math.max(3, s.x1 - s.x0);
    const mid = b.top + b.h / 2;
    if (s.pre !== undefined)
      parts.push(
        html`<span class="tl-pre-line${s.est ? ' est' : ''}" style="left:${px(s.pre)};width:${px(s.x0 - s.pre)};top:${px(mid - 1)}"></span><span class="tl-pre${s.est ? ' est' : ''}${s.pre < s.past ? ' past' : ''}" style="left:${px(s.pre - 3.5)};top:${px(mid - 3.5)}"></span>`,
      );
    // The label sits on the part still ahead and sticks beside the name column (timeline.ts labelAt).
    let text = s.label;
    let at = TL.labelAt(s, text, today, l.dots, font, from);
    if (at === undefined && s.short) {
      text = s.short;
      at = TL.labelAt(s, text, today, l.dots, font, from);
    }
    parts.push(
      html`<a class="tl-bar${s.est ? ' est' : ''}${s.fade ? ' fade' : ''}" href="#/venue/${s.edition}/timeline" aria-label="${s.aria}" style="left:${px(s.x0)};width:${px(w)};top:${px(b.top)};height:${px(b.h)}">${
        s.past > s.x0 ? html`<i class="tl-past" style="width:${px(s.past - s.x0)}"></i>` : ''
      }${at !== undefined ? html`<span class="tl-lb" style="margin-left:${px(at)}">${text}</span>` : ''}</a>`,
    );
    // Commitment to the venue (*ACL): a notch cut into the bar, not a line that could pass for today's.
    for (const t of s.ticks) parts.push(html`<span class="tl-tick" style="left:${px(t - 1)};top:${px(b.top)};height:${px(b.h)}"></span>`);
  }
  for (const d of l.dots) {
    const b = barBox(d.row, l.rows);
    parts.push(html`<span class="tl-dot${d.est ? ' est' : ''}${d.past ? ' past' : ''}" style="left:${px(d.x - 5)};top:${px(b.top + b.h / 2 - 5)}"></span>`);
  }
  const spans = l.spans.map((s) => `${s.edition}:${Math.round(s.from)}:${Math.round(s.to)}`).join(',');
  return html`<div class="tl-track c${l.color}" data-act="lane" data-spans="${spans}" data-open="${l.open ?? ''}" style="width:${px(axis.width)}">${parts}</div>`;
}

const svgIcon = (w: number, body: string) => `<svg width="${w}" height="12" viewBox="0 0 ${w} 12" aria-hidden="true">${body}</svg>`;
const HATCH =
  '<defs><pattern id="lg-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="4" fill="currentColor"/></pattern></defs>';

/** The overview's legend, in neutral grey (every lane has its own colour); 提交会议 only when an ARR row shows one. */
function overviewLegend(commit: boolean): Raw {
  const items: [string, string][] = [
    [svgIcon(18, '<rect x="0" y="2" width="18" height="8" rx="2" fill="currentColor"/>'), '投稿到出结果'],
    [svgIcon(18, '<rect x="0" y="2" width="18" height="8" rx="2" fill="currentColor" opacity=".35"/>'), '已过去'],
    [
      svgIcon(
        30,
        `${HATCH}<rect x=".5" y="2.5" width="15" height="7" rx="2" fill="url(#lg-h)" stroke="currentColor" stroke-dasharray="2 1.5"/><circle cx="24" cy="6" r="4" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.4"/>`,
      ),
      '预计',
    ],
    [svgIcon(18, '<path d="M5 6h13" stroke="currentColor" stroke-width="2"/><circle cx="4" cy="6" r="2.8" style="fill:var(--card)" stroke="currentColor" stroke-width="1.5"/>'), '摘要或注册'],
    [svgIcon(12, '<circle cx="6" cy="6" r="4.5" fill="currentColor"/>'), '开会'],
  ];
  if (commit) items.push([svgIcon(18, '<rect x="0" y="2" width="18" height="8" rx="2" fill="currentColor"/><rect x="8" y="1" width="2" height="10" style="fill:var(--card)"/>'), '提交会议']);
  items.push([svgIcon(8, '<path d="M4 0v12" style="stroke:var(--now)" stroke-width="1.6"/>'), '今天']);
  return html`${items.map(([i, t]) => html`<span>${raw(i)}${t}</span>`)}`;
}

/**
 * 会议 → 时间线: the month header sticks under the navigation bar (page
 * scroll) and follows the card sideways; the venue names stay on the left
 * with each one's next date under it; today's line runs through every lane.
 */
export function overviewHtml(lanes: LaneView[], axis: TL.Axis, now: number): Raw {
  const today = TL.xOfMs(now, axis);
  const start = TL.monthStartX(now, axis);
  const months = axis.months.map(
    (m) => html`<div class="tl-m${m.m === 1 ? ' jan' : ''}"><span class="y">${m.year ?? ''}</span><span>${m.label}</span></div>`,
  );
  const rows = lanes.map(
    (l) => html`<div class="tl-lane">
      <a class="tl-name c${l.color}" href="${l.href}" aria-label="${l.aria}"><span class="sw"></span><span class="nm">${l.name}</span>${
        l.next ? html`<span class="tl-nx${l.next.soon ? ' soon' : ''}">${l.next.text}</span>` : ''
      }</a>
      ${laneTrack(l, axis, today, start)}</div>`,
  );
  // In a month's first days the tag starts at the line instead of centring on it, so the corner does not cover half of it.
  const edge = today - start < 16 ? ' l' : '';
  const commit = lanes.some((l) => l.segs.some((s) => s.ticks.length));
  return html`<p class="tl-meta"><span>关注 ${lanes.length} 个 · 按下一个截止排</span><button class="tl-back" data-act="tl-today" hidden>回到今天</button></p>
    <div class="tl-card" style="--mpx:${px(axis.monthPx)}">
      <div class="tl-head" aria-hidden="true"><div class="tl-corner"><span class="tl-yr">${TL.yearAt(axis, start)}</span></div><div class="tl-hclip"><div class="tl-months" style="width:${px(axis.width)}">${months}<span class="tl-now-k${edge}" style="left:${px(today)}">今天</span></div></div></div>
      <div class="tl-scroll" data-start="${Math.round(start)}" data-y0="${axis.start}" data-mpx="${axis.monthPx}" data-day="${L.beijingDate(now)}">
        <div class="tl-grid" style="width:${afterName(axis.width)}">
          <div class="tl-snaps" aria-hidden="true">${axis.months.map(() => html`<i></i>`)}</div>
          ${rows}
          <span class="tl-now" style="left:${afterName(today)}" aria-hidden="true"></span>
        </div></div></div>
    <div class="tl-legend" aria-hidden="true">${overviewLegend(commit)}</div>`;
}

// ---------- the zoomed phase bar (§11.3) ----------

/**
 * The phase symbols, neutral (the venue's colour is its own): ▲ 交稿 and ◆
 * 公布 are shapes, ▇ 回复 a dark band, ─ 等待 a light line, ▭ 开会 an
 * outlined block. The next step is in the accent colour, past steps fade,
 * an estimate is drawn hollow with a dashed edge.
 */
const SHAPE: Partial<Record<TL.PhaseKind, string>> = {
  submit: '<path d="M6 1.2 11 10.8H1Z"/>',
  announce: '<path d="M6 1 11 6 6 11 1 6Z"/>',
};

const shapeSvg = (kind: TL.PhaseKind) => (SHAPE[kind] ? raw(`<svg viewBox="0 0 12 12" aria-hidden="true">${SHAPE[kind]}</svg>`) : '');

/** The symbol at the start of a phase-list row: the list is the legend too. */
export const phaseSym = (kind: TL.PhaseKind, est = false) => html`<span class="sym k-${kind}${est ? ' est' : ''}" aria-hidden="true">${shapeSvg(kind)}</span>`;

function phaseMarks(row: TL.PhaseRow): Raw {
  const out: Raw[] = [];
  if (row.base) out.push(html`<span class="ph-base" style="left:${pct(row.base[0])};width:${pct(row.base[1] - row.base[0])}"></span>`);
  for (const m of row.marks) {
    const cls = `${m.est ? ' est' : ''}${m.past ? ' past' : ''}${m.next ? ' next' : ''}`;
    if (m.x1 !== undefined) out.push(html`<span class="ph-band k-${m.kind}${cls}" style="left:${pct(m.x0)};width:${pct(Math.max(0.012, m.x1 - m.x0))}"></span>`);
    else out.push(html`<span class="ph-pt k-${m.kind}${cls}" style="left:${pct(m.x0)}">${shapeSvg(m.kind)}</span>`);
  }
  const labels = row.marks
    .filter((m) => m.line !== undefined)
    .map((m) => {
      const at = m.x1 !== undefined ? (m.x0 + m.x1) / 2 : m.x0;
      const side = at < 0.08 ? 'l' : at > 0.92 ? 'r' : 'c';
      return html`<span class="ph-l ln${m.line} ${side}${m.past ? ' past' : ''}${m.next ? ' next' : ''}" style="left:${pct(at)}">${m.name}</span>`;
    });
  return html`<div class="ph-track">${out}</div><div class="ph-labels">${labels}</div>`;
}

export function phaseHtml(bar: TL.PhaseBar): Raw {
  if (!bar.rows.length) return html``;
  const cut = bar.cut && bar.conf;
  const conf = bar.conf;
  // With the gap cut, the conference is a fixed block at the right; else it sits on the scale.
  const confBlock = (withLabel: boolean) =>
    conf
      ? cut
        ? html`<div class="ph-cut" aria-hidden="true">≈</div><div class="ph-conf"><span class="ph-band k-conf${conf.est ? ' est' : ''}${conf.past ? ' past' : ''}" style="left:0;width:100%"></span>${
            withLabel ? html`<span class="ph-l ln0 c" style="left:50%">开会</span>` : ''
          }</div>`
        : ''
      : '';
  const inScale = (row: TL.PhaseRow, withLabel: boolean) =>
    conf && !cut
      ? html`<span class="ph-band k-conf${conf.est ? ' est' : ''}${conf.past ? ' past' : ''}" style="left:${pct(conf.x0)};width:${pct(Math.max(0.02, conf.x1 - conf.x0))}"></span>${
          withLabel && !row.marks.some((m) => m.line === 0 && Math.abs(m.x0 - conf.x0) < 0.08) ? html`<span class="ph-l ln0 c" style="left:${pct((conf.x0 + conf.x1) / 2)}">开会</span>` : ''
        }`
      : '';
  // The conference belongs to the venue: *ACL's ARR row has none; WACV's rounds each have it (labelled once, on the last row).
  const last = bar.rows.length - 1;
  const rows = bar.rows.map((r, i) => {
    const has = !r.title?.startsWith('ARR 审稿');
    return html`${r.title ? html`<p class="ph-rt">${r.title}</p>` : ''}<div class="ph-row"><div class="ph-main">${phaseMarks(r)}${has ? inScale(r, i === last) : ''}</div>${
      has ? confBlock(i === last) : cut ? html`<div class="ph-cut"></div><div class="ph-conf"></div>` : ''
    }</div>`;
  });
  const review = bar.review
    ? html`<div class="ph-row rev"><div class="ph-main"><div class="ph-track"><span class="ph-rev${bar.review.est ? ' est' : ''}${bar.review.past ? ' past' : ''}" style="left:${pct(bar.review.x0)};width:${pct(Math.max(0.01, bar.review.x1 - bar.review.x0))}"></span><span class="ph-rev-l" style="left:${pct(bar.review.x1)}">兼审稿${bar.review.est ? '（预计）' : ''}</span></div></div>${
        cut ? html`<div class="ph-cut"></div><div class="ph-conf"></div>` : ''
      }</div>`
    : '';
  const ticks = html`<div class="ph-ticks"><div class="ph-main">${bar.ticks.map((t) => html`<span class="ph-tk" style="left:${pct(t.x)}">${t.label}</span>`)}${
    bar.today !== undefined ? html`<span class="ph-now-k" style="left:${pct(bar.today)}">今天</span>` : ''
  }</div>${cut ? html`<div class="ph-cut"></div><div class="ph-conf"><span class="ph-tk c">${conf!.month}</span></div>` : ''}</div>`;
  const now = bar.today !== undefined ? html`<span class="ph-now" style="left:calc((100% - var(--cutw)) * ${bar.today.toFixed(4)})"></span>` : '';
  // The legend names only what this bar draws.
  const marks = bar.rows.flatMap((r) => r.marks);
  const kinds = new Set<TL.PhaseKind>(marks.map((m) => m.kind));
  if (bar.rows.some((r) => r.base)) kinds.add('wait');
  if (conf) kinds.add('conf');
  const est = marks.some((m) => m.est) || !!conf?.est || !!bar.review?.est;
  const legend = (['submit', 'reply', 'wait', 'announce', 'conf'] as TL.PhaseKind[]).filter((k) => kinds.has(k));
  return html`<div class="ph-card${cut ? ' cut' : ''}" aria-hidden="true">${ticks}<div class="ph-body">${now}${rows}${review}</div>
    <div class="ph-legend">${legend.map((k) => html`<span>${phaseSym(k)}${TL.PHASE_ZH[k]}</span>`)}${
      bar.review ? html`<span><span class="sym k-rev" aria-hidden="true"></span>兼审稿</span>` : ''
    }${est ? html`<span>${phaseSym('submit', true)}预计</span>` : ''}<span><span class="sym k-next" aria-hidden="true">${shapeSvg('submit')}</span>下一步</span></div></div>`;
}

// ---------- acceptance rates (§11.4.1) ----------

function statAria(name: string, c: S.StatCell): string {
  const r = c.row;
  const what = r.status === 'none' ? S.sumText(r) : c.top || S.sumText(r);
  const rest = r.status === 'none' || !c.top ? '' : `，${S.sumText(r).replace(`${S.rateText(r)} · `, '')}`;
  return `${name} ${S.sumLabel(c)} 录用率：${what}${r.status === 'third_party' ? '（第三方）' : ''}${rest}`;
}

/** Bar zone height in px: the top of the 0–50% scale. */
const BAR_PX = 80;

/**
 * 录用率（%）: a bar a year on a 0–50% scale shared by every venue, the
 * latest drawn year in the accent colour, each bar opening its source. A
 * year with two cycles (KDD) has two thin cells, each named under itself;
 * a cell with no bar says why in its own column ("仅录用数", "—").
 */
export function rateBlock(file: AppStatsSeries | undefined, name: string, tab: S.StatTab): Raw {
  if (!file?.rows.length) return html`<div class="st-card"><div class="st-h"><span class="st-t">录用率</span></div><p class="st-none">录用率：暂未收录</p></div>`;
  const chart = S.statChart(file, tab);
  const tabs =
    chart.tabs.length > 1
      ? html`<div class="seg st-seg" role="tablist">${chart.tabs.map(
          (t) => html`<button role="tab" data-act="stat-tab" data-id="${t}" data-series="${file.series}" class="${t === tab ? 'on' : ''}" aria-selected="${t === tab}">${S.TAB_ZH[t]}</button>`,
        )}</div>`
      : html`<span class="st-k">主会</span>`;
  const slots = chart.slots.map((slot) => {
    const multi = slot.cells.length > 1;
    const cells = slot.cells.map((c) => {
      const bar = c.bar === 'none' ? '' : html`<i class="st-bar ${c.bar}${c.latest ? ' latest' : ''}" style="height:${px(Math.max(2, c.h * BAR_PX))}"></i>`;
      // The venue's own wording without the unit (the title says %): "31", "约 17.5".
      const top = c.top.replace(/%$/, '');
      const why = multi && c.bar === 'none' ? html`<span class="st-v">${c.under}</span>` : '';
      return html`<a class="st-cell" href="${S.statHref(file.series, c.row)}" aria-label="${statAria(name, c)}">${why}<span class="st-top${c.latest ? ' latest' : ''}">${top}</span>${bar}</a>`;
    });
    const under = multi
      ? html`<span class="st-cyc">${slot.cells.map((c) => html`<span>${(c.cycle ?? '').replace(/\s*月轮$/, '月')}</span>`)}</span>${
          slot.cells.some((c) => c.under === '第三方') ? html`<span class="st-u">第三方</span>` : ''
        }`
      : slot.cells[0]?.under
        ? html`<span class="st-u">${slot.cells[0].under}</span>`
        : '';
    return html`<div class="st-slot${multi ? ' multi' : ''}${slot.cells.length ? '' : ' empty'}"><div class="st-bars">${cells}</div>
      <span class="st-y${slot.year === chart.accent ? ' latest' : ''}">${slot.year}</span>${under}</div>`;
  });
  const sums = S.summaryRows(chart).map(
    (c) => html`<a class="row st-sum" href="${S.statHref(file.series, c.row)}"><span class="t"><b>${S.sumLabel(c)}</b> · ${S.sumText(c.row)}${c.row.status === 'third_party' ? tag('第三方', 'third') : ''}</span>${icon.chev}</a>`,
  );
  const hatched = chart.slots.some((s) => s.cells.some((c) => c.bar === 'hatched'));
  const combined = chart.slots.some((s) => s.cells.some((c) => c.combined));
  return html`<div class="st-card"><div class="st-h"><span class="st-t">录用率（%）</span>${tabs}</div>
    <div class="st-chart">${slots}</div>
    ${hatched ? html`<p class="st-note"><i class="st-key hatched"></i>斜线：第三方数字，官方没公布</p>` : ''}
    ${combined ? html`<p class="st-note">「合计」是主会和 Findings 加在一起的篇数，不是主会录用数</p>` : ''}
    <div class="st-sums">${sums}</div></div>`;
}

/** The source sheet of one bar (wireframe E). */
export function statSheetBody(name: string, row: AppStatRow): Raw {
  const d = S.statDetail(row);
  const track = row.track === 'findings' ? ' · Findings' : row.track_zh ? ` · ${row.track_zh}` : row.track === 'main_and_findings' ? ' · 主会和 Findings 合计' : '';
  const quote = row.quote
    ? html`<details><summary><span>原句</span>${icon.down}</summary><div class="fold-body"><figure><blockquote>${row.quote}</blockquote>${
        row.source_url ? html`<a href="${row.link ?? row.source_url}" target="_blank" rel="noopener">${S.hostOf(row.source_url)} ↗</a>` : ''
      }</figure></div></details>`
    : row.count_url || (row.source_url && row.count_method_zh)
      ? html`<details><summary><span>怎么数的</span>${icon.down}</summary><div class="fold-body"><p>${row.count_method_zh ?? ''}</p><a href="${row.count_url ?? row.source_url}" target="_blank" rel="noopener">${S.hostOf(row.count_url ?? row.source_url)} ↗</a></div></details>`
      : '';
  const also = row.also?.length
    ? html`<details><summary><span>其他说法 ${row.also.length} 条</span>${icon.down}</summary><div class="fold-body">${row.also.map(
        (a) => html`<figure><blockquote>${a.quote}</blockquote>${a.note_zh ? html`<figcaption>${a.note_zh}</figcaption>` : ''}<a href="${a.link ?? a.source_url}" target="_blank" rel="noopener">${S.hostOf(a.source_url)} ↗</a></figure>`,
      )}${row.status === 'official' || row.status === 'partial' ? html`<p class="nochoice">都是官方说法，本应用不替你选</p>` : ''}</div></details>`
    : '';
  const checked = row.checked_urls?.length
    ? html`<details${row.status === 'none' ? ' open' : ''}><summary><span>查过的页面 ${row.checked_urls.length} 个</span>${icon.down}</summary><div class="fold-body">${row.checked_urls.map(
        (u) => html`<p><a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '')}</a></p>`,
      )}</div></details>`
    : '';
  const how = row.status === 'none' ? '' : row.manual ? '人工核对' : '快照核对';
  return html`<p class="eyebrow">${name} ${row.year} · 录用率${track}</p>
    <div class="big stat-big${row.status === 'none' ? ' none' : ''}">${d.big}${d.tags.map((t) => tag(t, t === '第三方' ? 'third' : ''))}</div>
    ${d.counts ? html`<p class="keytime stat-counts"><span>${d.counts}</span></p>` : ''}
    ${d.notes.map((n) => html`<p class="explain">${n}</p>`)}
    ${d.button ? html`<a class="btn" href="${d.button.href}" target="_blank" rel="noopener">${d.button.label}</a>` : ''}
    <div class="folds">${quote}${also}${checked}</div>
    <p class="foot">${[S.hostOf(row.source_url), how, `核对于 ${L.md(row.checked)}`].filter(Boolean).join(' · ')}</p>`;
}

// ---------- top topics (§11.4.2) ----------

export const TOPIC_METHOD = '按 dblp 收录的录用论文标题归类统计 · 一篇论文可计入多个主题 · 只数录用篇数，不代表好中';

function yearSeg(act: string, series: string, years: number[], on: number): Raw {
  if (years.length < 2) return html``;
  return html`<div class="seg st-seg years" role="tablist">${years.map(
    (y) => html`<button role="tab" data-act="${act}" data-id="${y}" data-series="${series}" class="${y === on ? 'on' : ''}" aria-selected="${y === on}">${y}</button>`,
  )}</div>`;
}

/** 录用数量最多的 10 个主题: rank (ties share one), topic, papers, share, and the change from the year before. */
export function topicsBlock(series: string, all: AppTopics[], year: number | undefined): Raw {
  const years = S.topicYears(all, series);
  const title = (chip: boolean) => html`<div class="st-h"><span class="st-t">录用数量最多的 10 个主题</span>${chip ? html`<span class="st-k">本应用估算</span>` : ''}</div>`;
  if (!years.length) return html`<div class="st-card">${title(false)}<p class="st-none">暂未收录这个会的主题统计</p></div>`;
  const y = year && years.includes(year) ? year : years.at(-1)!;
  const t = all.find((x) => x.series === series && x.year === y)!;
  const lines = S.topicLines(t);
  const prevYear = t.topics.find((x) => x.prev)?.prev?.year;
  const stars = lines.some((l) => l.star);
  const tied = lines.some((l) => l.tied);
  return html`<div class="st-card">${title(true)}${yearSeg('topic-year', series, years, y)}
    <p class="st-sub">${TOPIC_METHOD}</p>
    <ol class="tp-list">
      <li class="tp tp-hd" aria-hidden="true"><span class="tp-r"></span><span class="tp-n"></span><span class="tp-c">篇数</span><span class="tp-s">占比</span><span class="tp-d">${prevYear ? '比上年' : ''}</span></li>
      ${lines.map(
        (l) => html`<li class="tp"><span class="tp-r">${l.rank}</span><span class="tp-n">${l.label}${l.star ? html`<sup>*</sup>` : ''}</span><span class="tp-c">${l.count}</span><span class="tp-s">${l.share}</span>${
          l.delta ? html`<span class="tp-d ${l.delta.dir}">${l.delta.text}${l.delta.dir === 'flat' ? '' : html`<small>点</small>`}</span>` : html`<span class="tp-d"></span>`
        }</li>`,
      )}</ol>
    <p class="st-foot">占比：占 ${y} 年全部录用论文${prevYear ? ` · 比上年：占比比 ${prevYear} 年增减几个百分点` : ''}${tied ? ' · 篇数相同的名次并列，都列出' : ''}${
      stars ? ' · * 误配较多' : ''
    }</p>
    <a class="row st-more" href="#/topics/${series}/${y}"><span class="t">怎么算的</span><span class="val">dblp · v${t.method_version}</span>${icon.chev}</a></div>`;
}

/** 「怎么算的」 (generated from the file). */
export function topicsSheetBody(name: string, t: AppTopics, now: number): Raw {
  const o = t.official_accepted;
  return html`<p class="eyebrow">${name} ${t.year} · 录用数量最多的主题</p>
    <h2 class="q">怎么算的</h2>
    <ol class="method">
      <li><b>数据</b>：dblp 收录的 ${name} ${t.year}${t.scope_zh ? `（${t.scope_zh}）` : ''}录用论文标题 ${S.num(t.papers_used)} 篇；官方录用 ${S.num(o.value)} 篇。dblp 的数据是 CC0，取数于 ${L.dayText(t.source.retrieved_at.slice(0, 10), now)}。</li>
      <li><b>方法 v${t.method_version}</b>：每个主题一组英文关键词，只看标题。一篇论文可以计入几个主题，所以各行加起来超过 100%。</li>
      <li><b>会漏的</b>：标题里没写关键词的论文不算。例如只写 "Chain-of-thought …" 的算进「推理」，不算进「大语言模型」。</li>
      <li><b>不能说明的</b>：占比高可能只是投这个方向的人多，不代表好中。各会的标题习惯不同，只比同一个会的年度变化。</li>
      <li><b>不能算录用率</b>：dblp 只有录用的论文，没有被拒的。</li>
    </ol>
    ${t.source.tocs[0] ? html`<a class="btn" href="${t.source.tocs[0]}" target="_blank" rel="noopener">查看 dblp 目录 ↗</a>` : ''}
    <div class="folds">
      <details><summary><span>官方录用数原句</span>${icon.down}</summary><div class="fold-body"><figure><blockquote>${o.quote}</blockquote><a href="${o.link ?? o.source_url}" target="_blank" rel="noopener">${S.hostOf(o.source_url)} ↗</a></figure></div></details>
      <details><summary><span>各主题的例子</span>${icon.down}</summary><div class="fold-body">${t.topics.map(
        (x) => html`<p class="k">${x.rank}. ${x.label_zh}</p>${(x.examples ?? []).map((e) => html`<p class="ex" lang="en">${e}</p>`)}`,
      )}</div></details>
    </div>
    <p class="foot">${t.citation_zh}</p>`;
}

// ---------- official per-area statistics (§11.4.3) ----------

function areaLines(v: S.AreaView, lines: S.AreaLine[]): Raw {
  // Name and the number on one line; the bar (and the count, when a rate leads) under it.
  return html`<div class="ar-list${v.ref !== undefined ? ' has-ref' : ''}">${lines.map(
    (l) => html`<div class="ar"><div class="ar-1"><span class="ar-n">${l.area}${l.small ? tag('样本少') : ''}</span><b class="ar-v">${l.rate ?? l.count ?? ''}</b></div>
      <div class="ar-2">${l.bar !== undefined ? html`<div class="ar-track"><i style="width:${pct(l.bar)}"></i>${v.ref !== undefined ? html`<span class="ar-ref" style="left:${pct(v.ref)}"></span>` : ''}</div>` : ''}${
        l.rate && l.count ? html`<span class="ar-c">${l.count}</span>` : ''
      }</div></div>`,
  )}</div>`;
}

function areaHead(a: AppAreaFile, count: number): string {
  const only = count === 1 ? '官方只公布过这一年' : `官方公布过 ${count} 年`;
  return [only, a.page_zh].filter(Boolean).join(' · ');
}

/** What the rows under the title are. */
function areaOrder(v: S.AreaView): string {
  if (v.lines.length === v.all.length) return `${v.all.length} 个领域，${v.order}`;
  // KDD 2023: only one area reaches 100 submissions.
  if (v.order === '按投稿数排' && v.lines.length === v.all.length - v.smallCount) return `投稿 ≥ ${S.MIN_AREA_SUBMISSIONS} 篇的只有 ${v.lines.length} 个领域`;
  if (v.order === '按投稿数排') return `投稿最多的 ${v.lines.length} 个领域`;
  if (v.order === '按篇数排') return `篇数最多的 ${v.lines.length} 个领域`;
  return `前 ${v.lines.length} 个领域，${v.order}`;
}

/** The caption under a per-area rate list: the rate describes everyone who submitted there, not a way in. */
const AREA_CAPTION = '领域录用率反映该领域全部投稿，不代表换领域更容易中';

/**
 * 各领域录用率 of one year (only official figures): at most five of the
 * largest areas, the whole-conference line, then 全部 N 个领域. Years with
 * counts only (NeurIPS 2024) are listed on the 全部 page.
 */
export function areasBlock(series: string, name: string, files: AppAreaFile[], year: number | undefined): Raw {
  if (!files.length) return html``;
  const shown = S.areaFilesShown(files);
  const years = shown.map((f) => f.year).sort((a, b) => a - b);
  const y = year && years.includes(year) ? year : S.defaultAreaYear(files)!;
  const a = shown.find((f) => f.year === y)!;
  const v = S.areaView(a);
  const body = v.sentence
    ? html`<p class="ar-sentence">${v.sentence}</p>`
    : html`<p class="st-sub">${areaOrder(v)}${v.approx ? ' · 约值' : ''}</p>
      ${S.isRateFile(a) ? html`<p class="st-note">${AREA_CAPTION}</p>` : ''}
      ${v.refText ? html`<p class="ar-refk"><span class="ar-ref-key"></span>${v.refText}</p>` : ''}${areaLines(v, v.lines)}
      ${v.smallCount ? html`<p class="ar-rest">其余 ${v.smallCount} 个领域投稿不足 ${S.MIN_AREA_SUBMISSIONS} 篇，数字波动大</p>` : ''}`;
  const more = v.all.length > v.lines.length ? `全部 ${v.all.length} 个领域 · ` : '';
  return html`<div class="st-card"><div class="st-h"><span class="st-t">${v.title} · ${name} ${y}</span></div>${yearSeg('area-year', series, years, y)}
    <p class="st-sub">${areaHead(a, shown.length)}</p>
    ${body}
    ${v.notes.length || a.note_zh ? html`<p class="st-foot">${[...v.notes, a.note_zh].filter(Boolean).join('；')}</p>` : ''}
    <a class="row st-more" href="#/areas/${series}/${y}"><span class="t">${more}来源和口径</span>${icon.chev}</a></div>`;
}

/** 各领域 · 全部 (pushed): every row (largest first, 样本少 last), where the numbers come from, and the other years. */
export function areasPageBody(name: string, a: AppAreaFile, now: number, others: AppAreaFile[] = []): Raw {
  const v = S.areaView(a);
  const rows = v.sentence
    ? html`<p class="ar-sentence">${v.sentence}</p>`
    : html`<p class="st-sub">${v.all.length} 个领域，${v.order}${v.smallCount ? `；不足 ${S.MIN_AREA_SUBMISSIONS} 篇的标「样本少」，排在后面` : ''}</p>${
        S.isRateFile(a) ? html`<p class="st-note">${AREA_CAPTION}</p>` : ''
      }${v.refText ? html`<p class="ar-refk"><span class="ar-ref-key"></span>${v.refText}</p>` : ''}${areaLines(v, v.all)}`;
  const years = others.length
    ? html`<h2 class="h2">其他年份</h2><div class="group">${[...others]
        .sort((x, y) => y.year - x.year)
        .map((o) => html`<a class="row" href="#/areas/${o.series}/${o.year}"><span class="t">${name} ${o.year}</span><span class="val">${S.areaView(o).title}</span>${icon.chev}</a>`)}</div>`
    : '';
  return html`<header class="large-head"><h1>${name} ${a.year} ${v.title}</h1><p class="sub">${a.track_zh}${v.approx ? ' · 约值' : ''}</p></header>
    <div class="st-card flat">${rows}</div>
    <h2 class="h2">来源</h2>
    <div class="st-card flat src">
      ${a.page_zh ? html`<p class="st-sub">${a.page_zh}</p>` : ''}
      ${a.quote ? html`<blockquote class="src-q">${a.quote}</blockquote>` : ''}
      ${a.count_method_zh ? html`<p class="explain">${a.count_method_zh}</p>` : ''}
      ${a.note_zh ? html`<p class="explain">${a.note_zh}</p>` : ''}
      ${v.notes.map((n) => html`<p class="explain">${n}</p>`)}
      <a class="btn" href="${a.link ?? a.source_url}" target="_blank" rel="noopener">查看官方原文 ↗</a>
      ${(a.figure_urls ?? []).map((u, i) => html`<a class="src-link" href="${u}" target="_blank" rel="noopener">官方原图 ${i + 1} ↗</a>`)}
      <p class="foot">${S.hostOf(a.source_url)} · ${a.manual ? '人工核对' : '快照核对'} · 核对于 ${L.dayText(a.checked, now)}</p>
    </div>
    ${years}`;
}

// ---------- 口径说明 (§11.4.4) ----------

export function aboutStatsBody(): Raw {
  return html`<p class="eyebrow">往年数据</p><h2 class="q">口径说明</h2>
    <ul class="method">
      <li><b>录用率</b> = 录用篇数 ÷ 投稿篇数，只算主会或主赛道；Workshop、Datasets & Benchmarks、Position 等赛道不算。柱顶照官方写法（单位 %），柱子一律按 0–50% 的刻度画。</li>
      <li><b>分母各会不同</b>：有的是全部有效投稿，有的是进入审稿的投稿，有的是政策审查后仍在审的。不同会的录用率不能直接比，同一个会不同年份也可能换口径。点柱子能看到那一年的原句。</li>
      <li><b>第三方</b>：官方没公布，只有第三方转述或 MIT 许可数据集（lixin4ever，见 NOTICE）的年份，画斜线柱并标「第三方」。只出现在没有许可证的聚合站上的年份，写「官方未公布」。</li>
      <li><b>Findings</b>（*ACL）单独一张图，不和主会相加；官方只给了主会和 Findings 合计的年份（EMNLP 2026）标「合计」，两张图都有，不当主会录用数。<b>分轮</b>（KDD）各轮并排，只有官方给了合计才写合计。</li>
      <li><b>主题排名</b>：按 dblp 收录的录用论文标题归类，数每个主题的篇数，取前 10，和第 10 名篇数相同的也列出。这是本应用的估算，一篇论文可以计入几个主题；只数录用的篇数，不代表好中。</li>
      <li><b>各领域录用率</b>：只摆官方按领域公布的数字；从官方图表上量出来的写「约」。会议页只列投稿最多的 5 个领域（不足 100 篇的不列），其余在「全部 N 个领域」里。领域录用率反映该领域全部投稿，不代表换领域更容易中。</li>
      <li><b>往年数据，不代表今年</b>：本应用不预测录用率，也不用这些数字排路线。</li>
    </ul>`;
}

// ---------- the paper's route, small (§11.5) ----------

export function miniRouteHtml(m: TL.MiniRoute, colors: Record<string, number>, names: string[]): Raw {
  if (!m.rows.length) return html``;
  return html`<div class="mini">
    <div class="mini-ticks"><span class="mini-sp"></span><div class="mini-main"><span class="now">今天</span>${m.ticks.filter((t) => t.x < 0.9).map((t) => html`<span style="left:${pct(t.x)}">${t.label}</span>`)}</div></div>
    ${m.rows.map(
      (r, i) => html`<a class="mini-row c${colors[r.series] ?? 0}" href="#/venue/${r.edition}/timeline" aria-label="${names[i] ?? r.name} 时间线"><span class="mini-n"><span class="num">${i + 1}</span>${
        names[i] ?? r.name
      }</span><span class="mini-main">${
        r.pre !== undefined ? html`<span class="mini-pre" style="left:${pct(r.pre)}"></span><span class="mini-line" style="left:${pct(r.pre)};width:${pct(Math.max(0, r.x0 - r.pre))}"></span>` : ''
      }<span class="mini-bar${r.est ? ' est' : ''}" style="left:${pct(r.x0)};width:${pct(Math.max(0.01, r.x1 - r.x0))}"></span>${
        r.warn && r.pre !== undefined ? html`<span class="mini-warn" style="left:${pct(r.pre)}">⚠</span>` : ''
      }</span></a>`,
    )}</div>`;
}
