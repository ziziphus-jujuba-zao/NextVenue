// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

import { normalizeForMatch } from './normalize.ts';

export interface QuoteMatch {
  found: boolean;
  /** Offset in the normalized snapshot, or -1. */
  index: number;
}

export function findQuote(quote: string, snapshotText: string): QuoteMatch {
  const q = normalizeForMatch(quote);
  if (!q) return { found: false, index: -1 };
  const index = normalizeForMatch(snapshotText).indexOf(q);
  return { found: index >= 0, index };
}

/**
 * Diagnostic for a missing quote: the longest leading run of the quote's
 * words that still occurs in the snapshot, with some surrounding context.
 * Helps a contributor see whether the page reworded the rule or the quote
 * was mistyped.
 */
export function nearestMatch(
  quote: string,
  snapshotText: string,
): { matchedWords: number; totalWords: number; context: string } | null {
  const words = normalizeForMatch(quote).split(' ').filter(Boolean);
  const text = normalizeForMatch(snapshotText);
  let lo = 0;
  let hi = words.length;
  // Binary search on prefix length; a longer prefix occurring implies a shorter one does.
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (text.includes(words.slice(0, mid).join(' '))) lo = mid;
    else hi = mid - 1;
  }
  if (lo === 0) return null;
  const prefix = words.slice(0, lo).join(' ');
  const at = text.indexOf(prefix);
  const context = text.slice(Math.max(0, at - 40), at + prefix.length + 120);
  return { matchedWords: lo, totalWords: words.length, context };
}
