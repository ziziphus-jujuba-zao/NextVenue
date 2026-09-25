// Copyright (c) 2026 Zayier Xie. All rights reserved.

// 学科 → 方向 (data/taxonomy.yml) as the pickers use it: the two-level
// direction picker, which venues a choice of directions lists, how a list
// is grouped by 学科, and the search box of a long venue list
// (docs/MOBILE_SPEC.md §9.1). No DOM here.

import type { Direction } from './route.ts';
import type { AppTaxonomy } from './types.ts';

export interface Dir {
  id: Direction;
  /** Full name: "机器学习与人工智能". */
  name: string;
  /** Chip text: "机器学习". */
  short: string;
  discipline: string;
}

export interface Discipline {
  id: string;
  name: string;
  /** Its own directions, largest first. */
  directions: Dir[];
  /** Directions of another 学科 it also lists (工程 lists 机器人, 语音与信号). */
  seeAlso: Dir[];
}

export interface Tax {
  disciplines: Discipline[];
  byId: Map<Direction, Dir>;
  known: Set<Direction>;
  /** Discipline and direction order of the taxonomy (for sorting). */
  order: Map<string, number>;
}

/** The taxonomy as the pickers read it. */
export function taxonomyOf(t: AppTaxonomy | undefined): Tax {
  const byId = new Map<Direction, Dir>();
  const order = new Map<string, number>();
  let i = 0;
  for (const d of t?.disciplines ?? []) {
    order.set(d.id, i++);
    for (const x of d.directions) {
      byId.set(x.id, { id: x.id, name: x.name_zh, short: x.short_zh ?? x.name_zh, discipline: d.id });
      order.set(x.id, i++);
    }
  }
  const disciplines = (t?.disciplines ?? []).map((d) => ({
    id: d.id,
    name: d.name_zh,
    directions: d.directions.map((x) => byId.get(x.id)!),
    seeAlso: (d.see_also ?? []).flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
  }));
  return { disciplines, byId, known: new Set(byId.keys()), order };
}

/** "eng/control" → "eng". */
export const disciplineOf = (dir: Direction) => dir.split('/')[0]!;

/** Chip text of a direction ("控制"); the id itself when the taxonomy does not have it. */
export const dirShort = (tax: Tax, id: Direction) => tax.byId.get(id)?.short ?? id;

/** "机器学习、控制" for a row that names the chosen directions. */
export const dirNames = (tax: Tax, ids: Direction[], sep = '、') => ids.map((id) => dirShort(tax, id)).join(sep);

/** Directions in taxonomy order (学科 by size, then direction by size). */
export const sortDirs = (tax: Tax, ids: Direction[]) =>
  [...ids].sort((a, b) => (tax.order.get(a) ?? 1e9) - (tax.order.get(b) ?? 1e9) || a.localeCompare(b));

/**
 * How many of the chosen directions a 学科 row lists: its own and the ones it
 * borrows (工程 lists 机器人), so a chip that is on is always counted in the
 * row it sits under.
 */
export const chosenIn = (d: Discipline, dirs: readonly Direction[]) => [...d.directions, ...d.seeAlso].filter((x) => dirs.includes(x.id)).length;

/** The 学科 opened on first sight: those holding a chosen direction; 计算机 when nothing is chosen. */
export function openAtFirst(tax: Tax, dirs: Direction[]): string[] {
  const open = tax.disciplines.filter((d) => d.directions.some((x) => dirs.includes(x.id))).map((d) => d.id);
  return open.length ? open : tax.disciplines.slice(0, 1).map((d) => d.id);
}

/** Toggle a direction; the order of picking is kept (the first one prefills 首选). */
export const toggleDir = (dirs: Direction[], id: Direction) => (dirs.includes(id) ? dirs.filter((x) => x !== id) : [...dirs, id]);

/** The first-run choice: the directions, and whether they are still the app's default (机器学习, not picked by the user). */
export interface DirChoice {
  dirs: Direction[];
  defaulted: boolean;
}

/**
 * A chip tap on first run. 机器学习 is preselected so an ML user starts with
 * two taps, but only softly: while it is the default, the first tap on any
 * other chip replaces it (a control PhD who taps 控制 gets [控制], not
 * [机器学习, 控制] with NeurIPS prefilled); a tap on 机器学习 itself turns it
 * off. After that first tap, chips toggle as usual.
 */
export function pickDir(c: DirChoice, id: Direction): DirChoice {
  if (c.defaulted) return { dirs: c.dirs.includes(id) ? c.dirs.filter((x) => x !== id) : [id], defaulted: false };
  return { dirs: toggleDir(c.dirs, id), defaulted: false };
}

/** How many venues each direction lists (a venue counts under each of its directions); a chip with none says so. */
export function dirCounts(items: readonly { directions: Direction[] }[]): Map<Direction, number> {
  const out = new Map<Direction, number>();
  for (const s of items) for (const d of new Set(s.directions)) out.set(d, (out.get(d) ?? 0) + 1);
  return out;
}

/** A venue belongs to a choice of directions when one of its directions is chosen. */
export const inDirs = (s: { directions: Direction[] }, dirs: readonly Direction[]) => s.directions.some((d) => dirs.includes(d));

/**
 * The 学科 a venue is listed under for a choice of directions: that of the
 * user's first-picked direction the venue has (HSCC+ICCPS [cs/theory,
 * eng/control] sits under 工程 for a user who picked 控制 before 理论与形式化,
 * under 计算机 for one who picked 理论与形式化 first); else its main one.
 */
export function groupOf(s: { directions: Direction[] }, dirs: readonly Direction[]): string {
  const d = dirs.find((x) => s.directions.includes(x)) ?? s.directions[0];
  return d ? disciplineOf(d) : '';
}

export interface Group<T> {
  discipline?: Discipline;
  items: T[];
}

/**
 * A venue list under the chosen directions: one group when they are all in
 * one 学科, else one group per 学科 in the order the user picked them (a
 * control user who added 理论与形式化 sees 工程 first). Items keep their order
 * inside a group.
 */
export function groupByDiscipline<T extends { directions: Direction[] }>(items: T[], dirs: readonly Direction[], tax: Tax): Group<T>[] {
  const discs = new Set(dirs.map(disciplineOf));
  if (discs.size < 2) return items.length ? [{ items }] : [];
  const by = new Map<string, T[]>();
  for (const s of items) {
    const g = groupOf(s, dirs);
    const list = by.get(g) ?? [];
    list.push(s);
    by.set(g, list);
  }
  const picked = [...new Set(dirs.map(disciplineOf))];
  const rank = (id: string) => (picked.includes(id) ? picked.indexOf(id) : picked.length + (tax.order.get(id) ?? 1e9));
  return [...by.entries()].sort(([a], [b]) => rank(a) - rank(b)).map(([id, list]) => ({ discipline: tax.disciplines.find((d) => d.id === id), items: list }));
}

/**
 * Every venue by 学科 (its main direction's), in taxonomy order: the
 * "其他方向的会议" list, one fold per 学科 instead of one list of hundreds.
 */
export function byDiscipline<T extends { directions: Direction[] }>(items: T[], tax: Tax): Group<T>[] {
  const by = new Map<string, T[]>();
  for (const s of items) {
    const g = s.directions[0] ? disciplineOf(s.directions[0]) : '';
    by.set(g, [...(by.get(g) ?? []), s]);
  }
  return [...by.entries()]
    .sort(([a], [b]) => (tax.order.get(a) ?? 1e9) - (tax.order.get(b) ?? 1e9))
    .map(([id, list]) => ({ discipline: tax.disciplines.find((d) => d.id === id), items: list }));
}

// ---------- search ----------

/** The venue list gets a search box above this many venues (§9.1). */
export const SEARCH_FROM = 20;

/** Lower case, no spaces or punctuation: "HSCC+ICCPS" and "hscc iccps" meet at "hscciccps". */
export const norm = (s: string) => s.toLowerCase().replace(/[\s\-_+./:,&()'’（）·]/g, '');

/** Lower-case words (Latin letters and digits) and CJK runs of a name, for matching the start of a word. */
const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+|[\u3400-\u9fff]+/g) ?? [];

export interface Searchable {
  id: string;
  /** "NeurIPS", "HSCC+ICCPS". */
  name: string;
  full_name?: string;
  name_zh?: string;
  /** Former and other names ("HSCC", "Hybrid Systems: Computation and Control"). */
  aliases?: string[];
  directions: Direction[];
}

/**
 * Whether a typed query matches a longer name: every typed word starts a
 * word of the name, in order and adjacent ("decision and control",
 * "hybrid sys"); a Chinese query may start anywhere in a Chinese run
 * ("中国控制" in 中国控制会议, "控制" too). "icpr" does not match
 * "genet-ic pr-ogramming": words are not glued together.
 */
function phraseMatch(name: string, query: string): boolean {
  const q = words(query);
  const w = words(name);
  if (!q.length) return false;
  if (q.length === 1 && /[\u3400-\u9fff]/.test(q[0]!)) return w.some((x) => x.includes(q[0]!));
  for (let i = 0; i + q.length <= w.length; i++) {
    let ok = true;
    for (let j = 0; j < q.length && ok; j++) {
      const last = j === q.length - 1;
      ok = last ? w[i + j]!.startsWith(q[j]!) : w[i + j] === q[j] || (/[\u3400-\u9fff]/.test(q[j]!) && w[i + j]!.endsWith(q[j]!));
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Whether a venue matches what was typed: its name, id or an alias written
 * together ("cdc", "hscc iccps" → "hscciccps"), a word start in its full
 * name, Chinese name or an alias ("hybrid systems", "中国控制"), or one of its
 * directions ("控制", "自动驾驶"). An empty query matches everything.
 */
export function matches(s: Searchable, query: string, tax?: Tax): boolean {
  const q = norm(query);
  if (!q) return true;
  const short = [s.name, s.id, ...(s.aliases ?? []).filter((a) => a.length <= 16 && !/\s/.test(a))];
  if (short.some((h) => norm(h).includes(q))) return true;
  const long = [s.full_name ?? '', s.name_zh ?? '', ...(s.aliases ?? [])];
  if (long.some((h) => phraseMatch(h, query))) return true;
  if (!tax) return false;
  return s.directions.some((d) => [tax.byId.get(d)?.name ?? '', tax.byId.get(d)?.short ?? ''].some((h) => h && norm(h).includes(q)));
}

/** Name hits first (typed "acc": ACC before venues whose full name has "acc" in it), otherwise the list order. */
export function search<T extends Searchable>(list: T[], query: string, tax?: Tax): T[] {
  const q = norm(query);
  if (!q) return list;
  const hits = list.filter((s) => matches(s, query, tax));
  const rank = (s: T) => {
    const n = norm(s.name);
    const al = (s.aliases ?? []).map(norm);
    return n === q || s.id === q ? 0 : al.includes(q) ? 1 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 3;
  };
  return hits.map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i).map((x) => x.s);
}

/**
 * Venue names that read the same in a list: two series share the acronym
 * ("CCC": 中国控制会议 and the Computational Complexity Conference). Rows of
 * these venues add a second name so the two can be told apart.
 */
export function sameNames(list: readonly { name: string }[]): Set<string> {
  const seen = new Map<string, number>();
  for (const s of list) seen.set(norm(s.name), (seen.get(norm(s.name)) ?? 0) + 1);
  return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}

/**
 * The second name a row shows after the acronym, when it needs one: the
 * Chinese name, else a short full name ("中国控制会议", "Computational
 * Complexity Conference"). `force` for search results and colliding names;
 * a Chinese name is always worth showing.
 */
export function secondName(s: { name: string; full_name?: string; name_zh?: string }, force: boolean): string | undefined {
  if (s.name_zh && norm(s.name_zh) !== norm(s.name)) return s.name_zh;
  if (!force || !s.full_name || norm(s.full_name) === norm(s.name)) return undefined;
  return s.full_name.replace(/^(?:(?:IEEE|ACM|IFIP|USENIX|AAAI|ACM\/IEEE|IEEE\/ACM|IEEE\/CVF)[\s/]+)+/, '').replace(/\s*\([^)]*\)\s*$/, '');
}
