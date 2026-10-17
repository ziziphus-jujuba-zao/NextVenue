// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { findQuote, formatIn, nearestMatch, normalizeForMatch, textFragmentUrl, toInstant } from '../src/index.ts';

describe('normalizeForMatch', () => {
  it('unifies typography but keeps wording', () => {
    expect(normalizeForMatch('No\u00A0authors  can be \u201Cadded\u201D \u2014 no\nexceptions\u2019')).toBe(
      'No authors can be "added" - no exceptions\'',
    );
  });
  it('drops soft hyphens and zero-width characters', () => {
    expect(normalizeForMatch('sub\u00ADmission\u200B deadline')).toBe('submission deadline');
  });
});

describe('findQuote', () => {
  const page = 'Authors\nmay be reordered.\n\nNo  authors can be added or removed after the abstract deadline.';
  it('matches across line breaks and spacing', () => {
    expect(findQuote('No authors can be added or removed after the abstract deadline.', page).found).toBe(true);
  });
  it('fails when a word changed', () => {
    expect(findQuote('No authors can be added after the abstract deadline.', page).found).toBe(false);
  });
  it('reports the longest matching prefix', () => {
    const near = nearestMatch('No authors can be added after the paper deadline.', page);
    expect(near?.matchedWords).toBe(5);
  });
});

describe('textFragmentUrl', () => {
  it('uses the full text for short quotes and escapes hyphens', () => {
    expect(textFragmentUrl('https://x.org/p#old', 'Camera-ready is final')).toBe(
      'https://x.org/p#:~:text=Camera%2Dready%20is%20final',
    );
  });
  it('uses start,end for long quotes', () => {
    const url = textFragmentUrl('https://x.org/p', 'one two three four five six seven eight nine ten eleven twelve');
    expect(url).toBe('https://x.org/p#:~:text=one%20two%20three%20four%20five,eight%20nine%20ten%20eleven%20twelve');
  });
});

describe('time', () => {
  it('converts AoE to Beijing time', () => {
    const t = toInstant('2026-09-25T23:59', 'AoE');
    expect(t.toISOString()).toBe('2026-09-26T11:59:00.000Z');
    expect(formatIn(t)).toBe('2026-09-26 19:59');
  });
  it('treats a bare date as 23:59 local', () => {
    expect(toInstant('2026-11-10', 'AoE').toISOString()).toBe('2026-11-11T11:59:00.000Z');
  });
  it('handles Pacific time with daylight saving', () => {
    // ICRA 2027 extended deadline: Sep 16 2026 23:59 Pacific (PDT, UTC-7)
    expect(toInstant('2026-09-16T23:59', 'America/Los_Angeles').toISOString()).toBe('2026-09-17T06:59:00.000Z');
    // In winter the same zone is UTC-8
    expect(toInstant('2026-12-01T23:59', 'America/Los_Angeles').toISOString()).toBe('2026-12-02T07:59:00.000Z');
  });
  it('parses fixed offsets', () => {
    expect(toInstant('2026-07-28T23:59', 'UTC-12').toISOString()).toBe('2026-07-29T11:59:00.000Z');
    expect(formatIn(toInstant('2026-03-05T23:00', 'UTC+1'), 'UTC')).toBe('2026-03-05 22:00');
  });
});
