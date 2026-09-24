// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Text normalization used to compare an official quote with a page snapshot.
// Both sides go through the same function, so typographic differences
// (curly quotes, en dashes, non-breaking spaces, line wraps) never cause a
// false "quote disappeared" alarm, while any change in wording still does.

const INVISIBLE = /[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g;
const SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B\u2032]/g;
const DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g;
const DASHES = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g;

export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKC')
    .replace(INVISIBLE, '')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse runs of whitespace only; keeps the quote as the page shows it. */
export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}
