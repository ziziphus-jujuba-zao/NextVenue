// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

import { collapseWhitespace } from './normalize.ts';

// Text Fragments (https://wicg.github.io/scroll-to-text-fragment/) let a link
// open the official page scrolled to, and highlighting, the quoted sentence.
// Browsers without support simply open the page.

const SHORT_QUOTE_WORDS = 10;
const EDGE_WORDS = 5;

function encodePart(s: string): string {
  // encodeURIComponent leaves '-' alone, but the directive syntax reserves it.
  return encodeURIComponent(s).replace(/-/g, '%2D');
}

export function textFragmentUrl(url: string, quote: string): string {
  const base = url.split('#')[0] ?? url;
  const words = collapseWhitespace(quote).split(' ').filter(Boolean);
  if (words.length === 0) return base;
  if (words.length <= SHORT_QUOTE_WORDS) {
    return `${base}#:~:text=${encodePart(words.join(' '))}`;
  }
  const start = words.slice(0, EDGE_WORDS).join(' ');
  const end = words.slice(-EDGE_WORDS).join(' ');
  return `${base}#:~:text=${encodePart(start)},${encodePart(end)}`;
}
