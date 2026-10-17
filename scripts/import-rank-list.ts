// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Convert a machine-readable extract of an official recommendation list into
// data/ranks/<list>.yml: the list's name, edition, release date, official
// page, licence note and its entries with match keys. The extracts are made
// from the official PDFs (tiers reconciled with the PDF numbering) and carry
// that provenance in their `meta`.
//   pnpm ranks:import --list ccf7 --from path/to/ccf7_conferences.yml [--dry-run]
// Lists: ccf7, caa2024, caai2024, cast2025.

import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify, parse } from 'yaml';
import { entryKeys, normAcronym, normName, type RankEntry, type RankList } from '@nextvenue/core';
import { ROOT, green, parseArgs, red } from './lib.ts';

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const date = (v: unknown) => /\d{4}-\d{2}-\d{2}/.exec(String(v ?? ''))?.[0];

/** Entry ids: the acronym as a slug, "-<category>" when two entries share it. */
function assignIds(entries: (Omit<RankEntry, 'id'> & { base: string })[]): RankEntry[] {
  const count = new Map<string, number>();
  for (const e of entries) count.set(e.base, (count.get(e.base) ?? 0) + 1);
  const used = new Set<string>();
  return entries.map(({ base, ...e }) => {
    let id = count.get(base)! > 1 ? `${base}-${e.category}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') : base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    return { id, ...e };
  });
}

const slug = (s: string) => normAcronym(s) || s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function ccf7(raw: Raw): RankList {
  const meta = raw.meta as Raw;
  const confs = raw.conferences as Raw[];
  const cats = new Map<string, { id: string; name_zh: string; name_en?: string; code?: string }>();
  const entries = confs.map((c) => {
    const category = String(c.category_no);
    if (!cats.has(category)) cats.set(category, { id: category, name_zh: String(c.category_zh), name_en: str(c.category_en), code: str(c.ccf_category_code) });
    const acronym = String(c.acronym);
    const names = [String(c.full_name), str(c.former_full_name)];
    const e: Omit<RankEntry, 'id'> & { base: string } = {
      base: slug(acronym),
      acronym,
      full_name: String(c.full_name),
      tier: String(c.tier),
      category,
      page: Number(c.source_pdf_page) || undefined,
      match_keys: entryKeys({ acronyms: [acronym, str(c.former_acronym)], names, dblp: (c.dblp as string[] | null) ?? [] }),
    };
    const note = [str(c.note), c.former_acronym ? `former acronym ${c.former_acronym}` : undefined, c.former_full_name ? `former name ${c.former_full_name}` : undefined].filter(Boolean).join('; ');
    if (note) e.note = note;
    if (!e.page) delete e.page;
    return e;
  });
  const counts = meta.counts as Raw;
  return {
    id: 'ccf7',
    label_zh: 'CCF',
    name_zh: '中国计算机学会推荐国际学术会议和期刊目录（第七版）· 会议部分',
    name_en: 'CCF Recommended List of International Conferences and Journals, 7th edition (conferences)',
    issuer_zh: '中国计算机学会',
    issuer_en: 'China Computer Federation (CCF)',
    kind: 'society',
    edition: '7',
    edition_zh: '第七版',
    released: date(meta.released)!,
    note_zh: '2026-04-09 修正一处勘误。ccf.org.cn 各分类网页截至 2026-09-25 仍是第六版数据，以 PDF 为准。只有正式论文（full/regular paper）算在目录内。',
    official_url: String(meta.official_page),
    document: { url: String(meta.official_pdf), sha256: String(meta.pdf_sha256), pages: Number(meta.pdf_pages) },
    tiers: ['A', 'B', 'C'],
    tier_meaning_zh: { A: '国际上极少数的顶级刊物和会议', B: '国际上著名和非常重要的会议、刊物', C: '国际学术界所认可的重要会议、刊物' },
    attach: 'series',
    license: {
      display: 'tier_and_citation',
      note_zh: '目录没有公开许可。界面只显示“CCF A/B/C（第七版）”、所属类别和官方链接，不转载 PDF，不整表展示。',
    },
    disclaimer_zh: String(meta.official_disclaimer),
    categories: [...cats.values()].sort((a, b) => Number(a.id) - Number(b.id)),
    verified: { date: '2026-09-25', method_zh: '从 ccf.org.cn 官方地址下载 PDF（sha256 与本文件一致），逐条按缩写和等级核对 386 条；5 条缩写在 PDF 里折行的人工核对。' },
    counts: { total: Number(counts.conferences), by_tier: { A: Number(counts.tier_A), B: Number(counts.tier_B), C: Number(counts.tier_C) } },
    entries: assignIds(entries),
  };
}

function caa2024(raw: Raw): RankList {
  const meta = raw.meta as Raw;
  const confs = raw.conferences as Raw[];
  const cats = new Map<string, { id: string; name_zh: string; name_en?: string }>();
  const entries = confs.map((c) => {
    const category = String(c.field_zh);
    if (!cats.has(category)) cats.set(category, { id: category, name_zh: category, name_en: str(c.field_en) });
    const acronym = str(c.acronym) ?? null;
    const scope = c.scope === 'domestic' ? 'domestic' : 'international';
    const nameEn = str(c.name_en);
    const nameZh = str(c.name_zh);
    const e: Omit<RankEntry, 'id'> & { base: string } = {
      base: acronym ? slug(acronym) : `${scope}-${String(c.tier).toLowerCase()}-${c.seq_in_list}`,
      acronym,
      full_name: nameEn ?? nameZh!,
      tier: String(c.tier),
      category,
      scope,
      match_keys: entryKeys({ acronyms: [acronym], names: [nameEn, scope === 'domestic' || !nameEn ? nameZh : undefined] }),
    };
    // Chinese names only where they are needed to match (domestic conferences); the list is 不得转载.
    if (scope === 'domestic' && nameZh) e.name_zh = nameZh;
    const note = str(c.note);
    if (note) e.note = note;
    return e;
  });
  const counts = meta.counts as Raw;
  return {
    id: 'caa2024',
    label_zh: 'CAA',
    name_zh: '中国自动化学会推荐学术会议目录（2024 年）',
    name_en: 'CAA Recommended Academic Conference List (2024)',
    issuer_zh: '中国自动化学会',
    issuer_en: 'Chinese Association of Automation (CAA)',
    kind: 'society',
    edition: '2024',
    edition_zh: '2024 版',
    released: '2025-04-09',
    note_zh: '第二版（第一版 2022 年）；PDF 落款 2025 年 3 月。国际会议和国内会议分表定级，国内表显示为“CAA 国内A”。',
    official_url: String(meta.official_page),
    document: {
      url: String(meta.official_pdf),
      sha256: String(meta.pdf_sha256),
      pages: Number(meta.pdf_pages),
      retrieved_via: `https://web.archive.org/web/2025id_/${String(meta.official_pdf)}`,
      note_zh: 'caa.org.cn 从我们的网络连不上，PDF 取自 Internet Archive 保存的同一官方地址；上线前要在国内网络直连核对一次。',
    },
    tiers: ['A', 'B', 'C'],
    tier_meaning_zh: { A: '国际上极少数的顶级会议', B: '国际上著名和非常重要的会议', C: '国际学术界所认可的重要会议' },
    attach: 'series',
    license: {
      display: 'tier_and_citation',
      note_zh: '官网页脚写“版权所有 不得转载”。只存匹配所需的字段（缩写、英文名、等级、领域；国内会议另存中文名），界面只显示等级和出处（目录名、版次、官方链接），不转载目录内容。大规模展示前建议先征得学会同意。',
      site_notice: String(meta.site_copyright).replace(/^caa\.org\.cn footer:\s*/, '').replace(/^[“"]|[”"]$/g, ''),
    },
    disclaimer_zh: String(meta.official_disclaimer),
    categories: [...cats.values()],
    verified: { date: '2026-09-25', method_zh: '从 Internet Archive 保存的官方 PDF 地址重新下载（sha256 与本文件一致），192 条有缩写的按缩写、国际/国内和等级逐条核对，5 条没有缩写的国内会议按中文名核对。' },
    counts: { total: Number(counts.total) },
    entries: assignIds(entries),
  };
}

function caai2024(raw: Raw): RankList {
  const meta = raw.meta as Raw;
  const confs = raw.conferences as Raw[];
  const cats = new Map<string, { id: string; name_zh: string; name_en?: string }>();
  const entries = confs.map((c) => {
    const category = String(c.category_zh);
    if (!cats.has(category)) cats.set(category, { id: category, name_zh: category, name_en: str(c.category_en) });
    const acronym = String(c.acronym);
    const e: Omit<RankEntry, 'id'> & { base: string } = {
      base: slug(acronym),
      acronym,
      full_name: String(c.full_name),
      tier: String(c.tier),
      category,
      match_keys: entryKeys({ acronyms: [acronym], names: [String(c.full_name)], dblp: (c.url_in_list as string[] | null) ?? [] }),
    };
    const note = str(c.note);
    if (note) e.note = note;
    return e;
  });
  const counts = meta.counts as Raw;
  return {
    id: 'caai2024',
    label_zh: 'CAAI',
    name_zh: '中国人工智能学会推荐国际学术会议和国际/国内期刊目录 · 国际学术会议部分',
    name_en: 'CAAI Recommended International Conferences and International/Domestic Journals (conferences)',
    issuer_zh: '中国人工智能学会',
    issuer_en: 'Chinese Association for Artificial Intelligence (CAAI)',
    kind: 'society',
    edition: '2024',
    edition_zh: '2024 版',
    released: '2024-08-24',
    note_zh: '第一版（2024-01 征求意见稿）。截至 2026-09-25 没有找到更新的版本（未核实）。',
    official_url: String(meta.official_page),
    document: { url: String(meta.official_pdf).replace(/\s*\(.*$/, ''), sha256: String(meta.pdf_sha256), pages: Number(meta.pdf_pages) },
    tiers: ['A', 'B', 'C'],
    tier_meaning_zh: { A: '该领域内最顶尖的学术会议或刊物', B: '在国际上广泛认可的重要学术会议或刊物', C: '国际学术界所认可的重要学术会议或刊物' },
    attach: 'series',
    license: {
      display: 'tier_and_citation',
      note_zh: '© 中国人工智能学会，没有公开许可。界面只显示等级和出处（目录名、版次、官方链接），不转载 PDF。',
    },
    disclaimer_zh: String(meta.official_disclaimer),
    categories: [...cats.values()],
    verified: { date: '2026-09-25', method_zh: '从官方附件地址重新下载 PDF（sha256 与本文件一致），158 条按缩写和等级逐条核对。' },
    counts: { total: Number(counts.conferences), by_tier: { A: Number(counts.tier_A), B: Number(counts.tier_B), C: Number(counts.tier_C) } },
    entries: assignIds(entries),
  };
}

/** "The 44th Chinese Control Conference (CCC2025)" → acronym CCC; "CAC 2025" → CAC. */
function castAcronym(nameEn: string): string | null {
  const paren = /\(([A-Z][A-Za-z0-9&+\-]{1,15})\s*(?:(?:19|20)\d{2})?\)\s*$/.exec(nameEn);
  if (paren) return paren[1]!.replace(/(?:19|20)\d{2}$/, '');
  const bare = /^([A-Z][A-Z0-9&+\-]{1,12})\s*(?:(?:19|20)\d{2})?$/.exec(nameEn.trim());
  if (bare) return bare[1]!;
  const tail = /,\s*([A-Z][A-Z0-9&+\-]{1,12})(?:(?:19|20)\d{2})?\s*$/.exec(nameEn);
  return tail ? tail[1]! : null;
}

function cast2025(raw: Raw): RankList {
  const meta = raw.meta as Raw;
  const confs = raw.conferences as Raw[];
  const cats = new Map<string, { id: string; name_zh: string; name_en?: string }>();
  const entries: RankEntry[] = confs.map((c) => {
    const category = str(c.discipline_code) ?? 'forum';
    if (!cats.has(category)) {
      cats.set(category, category === 'forum' ? { id: 'forum', name_zh: '第二十七届中国科协年会专题论坛', name_en: 'Specialized Forum of the 27th CAST Annual Meeting' } : { id: category, name_zh: String(c.discipline_zh), name_en: str(c.discipline_en) });
    }
    const nameEn = String(c.name_en);
    const nameZh = String(c.name_zh);
    const acronym = castAcronym(nameEn);
    return {
      id: String(c.no),
      acronym,
      full_name: nameEn,
      name_zh: nameZh,
      tier: 'listed',
      category,
      society_zh: str(c.recommending_society_zh),
      match_keys: entryKeys({ acronyms: [acronym], names: [nameEn, nameZh] }),
    } as RankEntry;
  }).map((e) => {
    if (!e.society_zh) delete e.society_zh;
    if (!e.match_keys.length) e.match_keys = [`name:${normName(e.name_zh ?? e.full_name)}`];
    return e;
  });
  const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'forum'];
  return {
    id: 'cast2025',
    label_zh: '科协',
    name_zh: '中国科协《重要学术会议目录（2025）》',
    name_en: 'CAST List of Top Academic Conferences 2025',
    issuer_zh: '中国科学技术协会',
    issuer_en: 'China Association for Science and Technology (CAST)',
    kind: 'government',
    edition: '2025',
    edition_zh: '2025 年目录',
    released: '2025-12-31',
    note_zh: '回顾性目录：收录的是 2025 年举办的具体届次（如第 44 届中国控制会议），不分等级。标签只挂在被收录的那一届上，不能挂在 2026、2027 届。',
    official_url: String(meta.official_page),
    document: { url: String(meta.official_pdf_zh), sha256: String((meta.pdf_sha256 as Raw).zh), note_zh: `英文版 PDF sha256 ${String((meta.pdf_sha256 as Raw).en)}` },
    tiers: ['listed'],
    tier_meaning_zh: { listed: '入选（不分等级）' },
    attach: 'edition',
    covers_year: 2025,
    license: {
      display: 'tier_and_citation',
      note_zh: '政府机构公开发布的目录。界面只写“入选《重要学术会议目录（2025）》”和条目号、官方链接，不转载 PDF。',
    },
    categories: order.filter((id) => cats.has(id)).map((id) => cats.get(id)!),
    verified: { date: '2026-09-25', method_zh: '从官方地址重新下载中文 PDF（sha256 与本文件一致）；708 条英文名全部在英文 PDF 中找到，中文名 682 条原样找到，其余 26 条是 PDF 折行的长名字（已抽查）。' },
    counts: { total: confs.length },
    entries,
  };
}

const CONVERT: Record<string, (raw: Raw) => RankList> = { ccf7, caa2024, caai2024, cast2025 };

const args = parseArgs(process.argv.slice(2));
const list = String(args.list ?? '');
const from = typeof args.from === 'string' ? args.from : '';
if (!CONVERT[list] || !from) {
  console.log(red(`usage: pnpm ranks:import --list ${Object.keys(CONVERT).join('|')} --from <extract.yml> [--dry-run]`));
  process.exit(2);
}
const out = CONVERT[list]!(parse(readFileSync(from, 'utf8')) as Raw);
const header = `# ${out.name_zh} — ${out.entries.length} 条。由 scripts/import-rank-list.ts 从官方 PDF 的逐条抽取稿生成；改动请重新生成，不要手改条目。\n# 许可：${out.license.note_zh}\n`;
const text = header + stringify(out, { lineWidth: 0 });
if (args['dry-run']) {
  console.log(green(`✓ ${list}: ${out.entries.length} entries (dry run, nothing written)`));
} else {
  writeFileSync(join(ROOT, 'data/ranks', `${list}.yml`), text);
  console.log(green(`✓ wrote data/ranks/${list}.yml: ${out.entries.length} entries`));
}
