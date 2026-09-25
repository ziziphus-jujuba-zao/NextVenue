// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Evidence inside edition logistics, visa files and China files: any object
// with a `quote` (or `json_path` + `json_value`) is checked against the
// snapshot of its `src`, or of the nearest enclosing object's `src`.

import { normalizeForMatch } from './normalize.ts';

export interface EvidenceRef {
  /** Where it sits, e.g. "logistics.fees[0].rows[2]". */
  path: string;
  src?: string;
  quote?: string;
  json_path?: string;
  json_value?: string;
  anchor?: string;
}

/** How far before the quote an `anchor` may occur, in normalized characters. */
export const ANCHOR_WINDOW = 1000;

const SKIP = new Set(['checked_sources']);

/** Every quote-bearing object under `value`, with the source it inherits. */
export function collectEvidence(value: unknown, path = '', src?: string): EvidenceRef[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => collectEvidence(v, `${path}[${i}]`, src));
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  const here = typeof obj.src === 'string' ? obj.src : src;
  const out: EvidenceRef[] = [];
  if (typeof obj.quote === 'string' || typeof obj.json_path === 'string') {
    out.push({
      path: path || '/',
      src: here,
      quote: typeof obj.quote === 'string' ? obj.quote : undefined,
      json_path: typeof obj.json_path === 'string' ? obj.json_path : undefined,
      json_value: obj.json_value === undefined ? undefined : String(obj.json_value),
      anchor: typeof obj.anchor === 'string' ? obj.anchor : undefined,
    });
  }
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP.has(k) || !v || typeof v !== 'object') continue;
    out.push(...collectEvidence(v, path ? `${path}.${k}` : k, here));
  }
  return out;
}

/**
 * Where a statistics quote (data/stats, data/topics) leaves text out: "A ... B",
 * "A [...] B", an editor's marker such as "[table]", or a table-cell break
 * "A | B". Applied after normalizeForMatch, which turns "…" into "...".
 */
const QUOTE_GAP = / ?(?:\[[^\]]*\]|\.\.\.| \| ) ?/;

const CJK = '[\\u3000-\\u30ff\\u3400-\\u9fff\\uff00-\\uffef]';
const CJK_SPACE = new RegExp(`(?<=${CJK}) | (?=${CJK})`, 'g');

/**
 * normalizeForMatch, plus two repairs for PDF text layers that statistics
 * quotes run into: a thin space inside a digit group ("3, 350" is "3,350"),
 * and line breaks inside Chinese or Japanese text (no spaces there).
 */
export function normalizeStats(input: string): string {
  return normalizeForMatch(input)
    .replace(/(\d), (?=\d{3}(?!\d))/g, '$1,')
    .replace(CJK_SPACE, '');
}

/** The verbatim parts of a quote that may skip text (see QUOTE_GAP), normalized. */
export function quoteParts(quote: string): string[] {
  return normalizeForMatch(quote)
    .split(QUOTE_GAP)
    .map((p) => normalizeStats(p))
    .filter(Boolean);
}

/**
 * A quote that may skip text holds when each of its parts occurs verbatim
 * (after normalization) in the snapshot, in order. Returns null when it holds,
 * else the first part that could not be found. Pass `normalized` when the
 * snapshot already went through normalizeStats (callers checking many quotes
 * against one long snapshot).
 */
export function checkQuoteParts(quote: string, snapshotText: string, normalized = false): string | null {
  const parts = quoteParts(quote);
  if (!parts.length) return 'empty quote';
  const text = normalized ? snapshotText : normalizeStats(snapshotText);
  let from = 0;
  for (const part of parts) {
    const at = text.indexOf(part, from);
    if (at < 0) return text.includes(part) ? `part out of order: "${part}"` : `part not found: "${part}"`;
    from = at + part.length;
  }
  return null;
}

/** Value at a dotted path ("visitor-outside-canada.CN", "a.0.b") in a JSON document. */
export function jsonAt(doc: unknown, path: string): unknown {
  let cur: unknown = doc;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/**
 * Check one piece of evidence against its snapshot text; null when it holds,
 * else the reason. With an `anchor`, the quote must be the first passage
 * after the anchor that opens with the quote's first two words, and no other
 * item of the same list (`siblingAnchors`, e.g. the other hotels) may stand
 * in between: "Cutoff Date: January 15, 2027" then belongs to that hotel.
 */
export function checkEvidence(ref: EvidenceRef, snapshotText: string, siblingAnchors: string[] = []): string | null {
  if (ref.json_path !== undefined) {
    let doc: unknown;
    try {
      doc = JSON.parse(snapshotText);
    } catch {
      return 'snapshot is not JSON';
    }
    const got = jsonAt(doc, ref.json_path);
    if (got === undefined) return `no value at ${ref.json_path}`;
    if (ref.json_value === undefined) return 'json_path without json_value';
    if (String(got) !== ref.json_value) return `${ref.json_path} is "${String(got)}", not "${ref.json_value}"`;
    if (ref.quote === undefined) return null;
  }
  const text = normalizeForMatch(snapshotText);
  const q = normalizeForMatch(ref.quote ?? '');
  if (!q) return 'empty quote';
  let at = text.indexOf(q);
  if (at < 0) return 'quote not found';
  if (!ref.anchor) return null;
  const anchor = normalizeForMatch(ref.anchor);
  const others = siblingAnchors.map(normalizeForMatch).filter((a) => a && a !== anchor);
  const lead = q.split(' ').slice(0, 2).join(' ');
  for (; at >= 0; at = text.indexOf(q, at + 1)) {
    const a = text.lastIndexOf(anchor, at);
    if (a < 0 || at - a > ANCHOR_WINDOW) continue;
    const between = text.slice(a + anchor.length, at);
    if (!others.some((o) => between.includes(o)) && !between.includes(lead)) return null;
  }
  return `anchor "${ref.anchor}" is not the nearest item (within ${ANCHOR_WINDOW} characters) before the quote`;
}
