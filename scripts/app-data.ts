// Copyright (c) 2026 Zayier Xie. All rights reserved.

// The slim data the mobile app ships inline: only the fields its screens
// read, with the app's wording (apps/mobile/copy.ts) applied on top.

import { TOPICS_SHOWN, labelText, textFragmentUrl, type AreaFile, type RankLabel, type StatsFile, type TopicsFile } from '@nextvenue/core';
import { applyCopy } from '../apps/mobile/copy.ts';
import type { AppAdminItem, AppAreaFile, AppData, AppEdition, AppHolidayYear, AppRankLabel, AppSeriesName, AppStatsSeries, AppTopics, AppVisa } from '../apps/mobile/types.ts';
import type { Bundle } from './bundle.ts';

type Sources = Map<string, Bundle['sources'][number]>;

/** Evidence fields the app does not read: it gets `link` and `src_title` instead. */
const DROP = new Set(['src', 'anchor', 'json_path', 'json_value', 'checked_sources', 'basis_note']);

/** A rank label as the app shows it: its words, and what the citation card needs. */
function appLabel(l: RankLabel): AppRankLabel {
  const out: AppRankLabel = { list: l.list, text: labelText(l), tier: l.tier, kind: l.kind };
  if (l.category_zh) out.category_zh = l.category_zh;
  if (l.qualifier_zh) out.qualifier_zh = l.qualifier_zh;
  if (l.year !== undefined) out.year = l.year;
  if (l.upstream) out.upstream = true;
  // Why a hand-made link holds ("CCF 第七版仍写 HSCC"): the sheet says it. Automatic matches need no note.
  if (l.match === 'explicit' && l.note_zh) out.note_zh = l.note_zh;
  return out;
}

/**
 * Post-acceptance data (logistics, visa files, school rules) as the app
 * reads it: every object that carries a quote (or a JSON source) gets a
 * `link` that opens the official page at that quote, and `src_title`. A
 * quote without its own `src` uses the nearest enclosing one, as in the data.
 * `checked_sources` become titled links (`checked`) for "待公布".
 */
export function linked<T>(v: T, sources: Sources, src?: string): T {
  if (Array.isArray(v)) return v.map((x) => linked(x, sources, src)) as T;
  if (!v || typeof v !== 'object') return v;
  const o = v as Record<string, unknown>;
  const own = typeof o.src === 'string' ? o.src : src;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(o)) if (!DROP.has(k)) out[k] = linked(x, sources, own);
  if (Array.isArray(o.checked_sources))
    out.checked = o.checked_sources.flatMap((id) => {
      const s = sources.get(String(id));
      return s ? [{ title: s.title, url: s.url }] : [];
    });
  const s = own ? sources.get(own) : undefined;
  if (s && (typeof o.quote === 'string' || typeof o.json_path === 'string')) {
    out.link = typeof o.quote === 'string' ? textFragmentUrl(s.url, o.quote) : s.url;
    out.src_title = s.title;
  }
  return out as T;
}

/**
 * A link that opens `url` at the quote. A stats quote may skip text ("...",
 * "[...]") or run across table cells (" | "); the link uses its first part.
 */
export function quoteLink(url: string, quote: string | undefined): string {
  if (!quote) return url;
  const first = quote.split(/\s+(?:\.\.\.|\[\.\.\.\]|\|)\s+/)[0] ?? quote;
  return textFragmentUrl(url, first.replace(/^\.\.\.\s*|\s*\.\.\.$/g, ''));
}

/** Evidence as the app reads it: the snapshot id goes, a link and a hand-checked flag come in. */
function cited<T extends { source_url?: string; quote?: string; src?: string; quote_check?: string }>(o: T): Omit<T, 'src' | 'quote_check'> & { link?: string; manual?: boolean } {
  const { src: _src, quote_check, ...rest } = o;
  return { ...rest, link: o.source_url ? quoteLink(o.source_url, o.quote) : undefined, manual: quote_check === 'manual' || undefined };
}

/** Past statistics for the app: every quote gets its link; topics keep only the rows shown (TOPICS_SHOWN, plus ties). */
export function statsData(stats: StatsFile[], areas: AreaFile[], topics: TopicsFile[]): Pick<AppData, 'stats' | 'areas' | 'topics'> {
  return {
    stats: stats.map((f): AppStatsSeries => ({ ...f, rows: f.rows.map((r) => ({ ...cited(r), also: r.also?.map(cited) })) })),
    areas: areas.map((a): AppAreaFile => {
      const { tolerance: _t, ...rest } = cited(a);
      return rest;
    }),
    topics: topics.map((t): AppTopics => {
      const { schema: _s, ...rest } = t;
      // The first TOPICS_SHOWN, and any tied with the last of them (two topics with 171 papers are both shown).
      const cut = [...t.topics].sort((a, b) => b.count - a.count)[TOPICS_SHOWN - 1]?.count;
      return { ...rest, official_accepted: cited(t.official_accepted), topics: t.topics.filter((x) => x.rank <= TOPICS_SHOWN || x.count === cut) };
    }),
  };
}

/** Keep only what the app reads; precompute deep links for milestone quotes. */
export function toAppData(bundle: Bundle): AppData {
  const sources: Sources = new Map(bundle.sources.map((s) => [s.id, s]));
  const holidays: AppHolidayYear[] = bundle.china.holidays.map((h) => {
    const s = h.src ? sources.get(h.src) : undefined;
    return {
      year: h.year,
      status: h.status,
      holidays: h.holidays.map((x) => ({ name_zh: x.name_zh, start: x.start, end: x.end })),
      workdays: h.workdays.map((w) => ({ date: w.date, name_zh: w.name_zh })),
      notice_zh: h.notice_zh,
      method_zh: h.method_zh,
      link: s?.url,
    };
  });
  const admin = bundle.china.admin;
  return {
    bundle_hash: bundle.bundle_hash,
    built_at: bundle.built_at,
    editions: bundle.editions.map((e) => ({
      id: e.id,
      series: e.series,
      name: e.name,
      year: e.year,
      kind: e.kind,
      directions: e.directions.length ? e.directions : undefined,
      data_level: e.data_level === 'upstream' ? 'upstream' : undefined,
      upstream: e.upstream ? { source: e.upstream.source, link: e.upstream.link } : undefined,
      labels: e.labels.length ? e.labels.map(appLabel) : undefined,
      submission_type: e.submission_type,
      federated_with: e.federated_with ? { name: e.federated_with.name, url: e.federated_with.url } : undefined,
      derived_from: e.derived_from,
      place: e.place,
      sites: e.sites ? (linked(e.sites, sources) as unknown as AppEdition['sites']) : undefined,
      dates: e.dates,
      note_zh: e.note_zh,
      last_checked: e.last_checked,
      milestones: e.milestones.map((m) => {
        const s = m.src ? sources.get(m.src) : undefined;
        return {
          type: m.type,
          label_zh: m.label_zh,
          tz: m.tz,
          tz_assumed: m.tz_assumed,
          tentative: m.tentative,
          status: m.status,
          // An estimate quoting another edition's page (the previous year's) reads "往年原文"; one from this edition's own words does not.
          from_prev: m.status === 'estimated' && m.src && !m.src.startsWith(`${e.id}-`) ? (true as const) : undefined,
          at_resolved: m.at_resolved,
          start_resolved: m.start_resolved,
          end_resolved: m.end_resolved,
          note_zh: m.note_zh,
          quote: m.quote,
          src_title: s?.title,
          deep_link: s ? (m.quote ? textFragmentUrl(s.url, m.quote) : s.url) : e.data_level === 'upstream' ? e.upstream?.link : undefined,
          site: m.site,
          upstream: e.data_level === 'upstream' ? (true as const) : undefined,
        };
      }),
      logistics: e.logistics ? (linked(e.logistics, sources) as unknown as AppEdition['logistics']) : undefined,
      home: homeOf(e, bundle),
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
      effect: r.effect ? effectOf(r.effect) : undefined,
      quotes: r.quotes.map((q) => ({
        text: q.text,
        reading_zh: q.reading_zh,
        deep_link: q.deep_link,
        source_title: q.source_title,
      })),
      checked: r.checked_sources_resolved?.map((c) => ({ title: c.title, url: c.url })),
      last_checked: r.last_checked,
    })),
    visa: {
      countries: bundle.visa.countries,
      regimes: bundle.visa.regimes.map((v) => linked(v, sources) as unknown as AppVisa),
    },
    china: {
      holidays,
      admin: admin ? admin.items.map((i) => linked(i, sources) as AppAdminItem) : [],
      admin_note_zh: admin?.note_zh,
    },
    rank_lists: bundle.rank_lists.map((l) => ({
      id: l.id,
      label_zh: l.label_zh,
      name_zh: l.name_zh,
      edition_zh: l.edition_zh,
      released: l.released,
      official_url: l.official_url,
      kind: l.kind,
      disclaimer_zh: l.disclaimer_zh,
    })),
    taxonomy: bundle.taxonomy
      ? {
          disciplines: bundle.taxonomy.disciplines.map((d) => ({
            id: d.id,
            name_zh: d.name_zh,
            see_also: d.see_also,
            directions: d.directions.map((x) => ({ id: x.id, name_zh: x.name_zh, short_zh: x.short_zh })),
          })),
        }
      : undefined,
    series: (() => {
      // Every series ships, so every CCF-listed conference can be found and followed: one with
      // editions only needs its names; one without also needs what its row and page show.
      const used = new Set(bundle.editions.filter((e) => e.kind === 'conference').map((e) => e.series));
      const arr = new Set(bundle.editions.filter((e) => e.kind !== 'conference').map((e) => e.series));
      return bundle.series
        .filter((x) => used.has(x.id) || !arr.has(x.id))
        .map((x) => {
          const out: AppSeriesName = { id: x.id, full_name: x.full_name, name_zh: x.name_zh };
          if (x.aliases?.length) out.aliases = x.aliases;
          if (!used.has(x.id)) {
            out.acronym = x.acronym;
            out.directions = x.directions;
            // A label held by one listed edition (科协) belongs to that edition, not to the series.
            const ls = x.labels.filter((l) => l.year === undefined).map(appLabel);
            if (ls.length) out.labels = ls;
            if (x.dblp) out.dblp = x.dblp;
          }
          return out;
        });
    })(),
    upstream: bundle.upstream ? { source: bundle.upstream.source, repo: bundle.upstream.repo, license: bundle.upstream.license, as_of: bundle.upstream.as_of } : undefined,
    ...statsData(bundle.stats ?? [], bundle.areas ?? [], bundle.topics ?? []),
  };
}

/**
 * An official page of a curated edition with a step not published yet
 * (ASCO 2027's abstract deadline), for "看官网": its dates page, else its
 * call for papers, else any page of its own that was fetched.
 */
function homeOf(e: Bundle['editions'][number], bundle: Bundle): string | undefined {
  if (e.data_level === 'upstream' || !e.milestones.some((m) => m.status === 'tba')) return undefined;
  const own = bundle.sources.filter((s) => s.id.startsWith(`${e.id}-`) && s.http_status === 200);
  const rank = (k: string) => ['dates', 'cfp', 'other', 'author_guide', 'faq'].indexOf(k) + 1 || 9;
  return own.sort((a, b) => rank(a.kind) - rank(b.kind))[0]?.url;
}

const EFFECT_STRINGS = ['target', 'trigger', 'full_until', 'then', 'request_by', 'while', 'until', 'before', 'substitute', 'virtual'] as const;

/** The effect fields the app reads: its kind and every field that names a milestone or an answer. */
function effectOf(e: { kind: string; [k: string]: unknown }): NonNullable<AppData['rules'][number]['effect']> {
  const out: NonNullable<AppData['rules'][number]['effect']> = { kind: e.kind };
  for (const k of EFFECT_STRINGS) if (typeof e[k] === 'string') out[k] = e[k] as string;
  const c = e.condition as { applied_by?: unknown } | undefined;
  if (c && typeof c.applied_by === 'string') out.condition = { applied_by: c.applied_by };
  return out;
}

/** The slim data plus the app wording, as the app works with it (tests read this). */
export function appData(bundle: Bundle): AppData {
  return applyCopy(toAppData(bundle));
}

/**
 * What index.html inlines: `appData` without what the app works out again
 * at start-up (apps/mobile/logic.ts `prepareEditions`). A resolved time
 * keeps its wall clock and instant (its zone is the milestone's; its Beijing
 * time follows from the instant); upstream milestones drop their flag and
 * the venue link, which the edition carries. About a quarter of the page.
 */
export function shippedData(bundle: Bundle): AppData {
  const data = appData(bundle);
  return { ...data, editions: slimEditions(data.editions) };
}

export function slimEditions(editions: AppEdition[]): AppEdition[] {
  return editions.map((e) => ({
    ...e,
    milestones: e.milestones.map((m) => {
      const out = { ...m } as Record<string, unknown>;
      for (const k of ['at_resolved', 'start_resolved', 'end_resolved'] as const) {
        const r = m[k];
        if (r) out[k] = { local: r.local, utc: r.utc };
      }
      if (e.data_level === 'upstream') {
        delete out.upstream;
        if (out.deep_link === e.upstream?.link) delete out.deep_link;
      }
      return out as unknown as AppEdition['milestones'][number];
    }),
  }));
}

/** Bytes of the shipped data by 学科 (an edition counts under its main direction), for the build line and a mini-program split. */
export function sizeByDiscipline(data: AppData): Record<string, number> {
  const out: Record<string, number> = {};
  const rulesBy = new Map<string, number>();
  for (const r of data.rules) rulesBy.set(r.edition, (rulesBy.get(r.edition) ?? 0) + Buffer.byteLength(JSON.stringify(r)));
  for (const e of data.editions) {
    const d = e.directions?.[0]?.split('/')[0] ?? 'other';
    out[d] = (out[d] ?? 0) + Buffer.byteLength(JSON.stringify(e)) + (rulesBy.get(e.id) ?? 0);
  }
  return out;
}
