// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Rank badges (docs/MOBILE_SPEC.md §12.2): at most two, from the Chinese
// lists only, the list that matters for the direction first; the sheet
// lists every label, the tapped one first. Labels as scripts/bundle.ts
// makes them for real venues (data/ranks, 2026-09-25).

import { describe, expect, it } from 'vitest';
import { BADGE_LISTS, MAX_BADGES, badgeLine, badgeShort, listOrderFor, pickBadges, relevantDir, sheetOrder } from './badges.ts';
import type { AppRankLabel } from './types.ts';

const L = (list: string, text: string, extra: Partial<AppRankLabel> = {}): AppRankLabel => ({
  list,
  text,
  tier: text.split(' ').at(-1)!.replace(/^国内/, ''),
  kind: list === 'cast2025' ? 'government' : list === 'thcpl' ? 'university' : list === 'core' ? 'international' : 'society',
  ...extra,
});

const ICRA = [L('ccf7', 'CCF B'), L('caai2024', 'CAAI A'), L('core', 'CORE A*', { upstream: true }), L('thcpl', 'THCPL A', { upstream: true })];
const NEURIPS = [L('ccf7', 'CCF A'), L('caai2024', 'CAAI A'), L('core', 'CORE A*', { upstream: true })];
const HSCC = [L('ccf7', 'CCF B', { note_zh: 'CCF 第七版仍写 HSCC' }), L('thcpl', 'THCPL B', { upstream: true })];
const SMC = [L('ccf7', 'CCF C'), L('caai2024', 'CAAI C')];
const CCC_2025 = [L('cast2025', '科协', { tier: 'listed', year: 2025 })];
// A CAA label must never be shown, even if one reached the app (owner decision, 2026-09-25).
const WITH_CAA = [L('caa2024', 'CAA A'), L('ccf7', 'CCF C')];
const ASCO: AppRankLabel[] = [];
const texts = (ls: AppRankLabel[]) => ls.map((l) => l.text);

describe('which list matters for a direction', () => {
  it('computing and engineering lead with CCF, other disciplines with 科协', () => {
    expect(listOrderFor('cs/ml')[0]).toBe('ccf7');
    expect(listOrderFor('cs/ml')[1]).toBe('caai2024');
    expect(listOrderFor('eng/control')[0]).toBe('ccf7');
    expect(listOrderFor('med/oncology')[0]).toBe('cast2025');
    expect(listOrderFor(undefined)[0]).toBe('cast2025');
    for (const d of ['cs/ml', 'cs/robotics', 'eng/control', 'eng/av', 'med/oncology', undefined]) expect(listOrderFor(d)).not.toContain('caa2024');
  });

  it('reads a venue by its first direction (main one first) that the user chose, else its main one', () => {
    expect(relevantDir(['cs/theory', 'eng/control'], ['eng/control', 'cs/ml'])).toBe('eng/control');
    expect(relevantDir(['cs/theory', 'eng/control'], ['cs/ml'])).toBe('cs/theory');
    expect(relevantDir(['cs/cv', 'eng/av'], ['eng/av', 'cs/cv'])).toBe('cs/cv');
    expect(relevantDir(['cs/robotics'], [])).toBe('cs/robotics');
    expect(relevantDir(undefined, ['cs/ml'])).toBeUndefined();
  });
});

describe('the badges after a name', () => {
  it('shows at most two, from CCF / CAAI / 科协 only, most relevant first', () => {
    expect(MAX_BADGES).toBe(2);
    expect(BADGE_LISTS).toEqual(['ccf7', 'caai2024', 'cast2025']);
    expect(texts(pickBadges(ICRA, ['cs/robotics']))).toEqual(['CCF B', 'CAAI A']);
    expect(badgeLine(pickBadges(ICRA, ['cs/robotics']))).toBe('CCF B · CAAI A');
    expect(texts(pickBadges(NEURIPS, ['cs/ml']))).toEqual(['CCF A', 'CAAI A']);
    expect(texts(pickBadges(SMC, ['eng/control']))).toEqual(['CCF C', 'CAAI C']);
  });

  it('never shows CAA, ccfddl values (CORE, THCPL) or nothing', () => {
    expect(texts(pickBadges(WITH_CAA, ['eng/control']))).toEqual(['CCF C']);
    expect(texts(pickBadges(HSCC, ['cs/theory', 'eng/control'], ['eng/control']))).toEqual(['CCF B']);
    expect(pickBadges([L('core', 'CORE A', { upstream: true })], ['cs/se'])).toEqual([]);
    expect(pickBadges(ASCO, ['med/oncology'])).toEqual([]);
    expect(pickBadges(undefined, ['cs/ml'])).toEqual([]);
  });

  it('shows 科协 only where the data put it (the listed edition)', () => {
    expect(texts(pickBadges(CCC_2025, ['eng/control']))).toEqual(['科协']);
    expect(texts(pickBadges([L('cast2025', '科协', { tier: 'listed', year: 2025 }), L('ccf7', 'CCF C')], ['earth/general']))).toEqual(['科协', 'CCF C']);
  });
});

describe('a badge inside a row', () => {
  it('keeps a plain label whole and shortens a qualified one to a star', () => {
    expect(badgeShort(L('ccf7', 'CCF A'))).toBe('CCF A');
    expect(badgeShort(L('ccf7', 'CCF B（ETAPS 成员会）', { tier: 'B', qualifier_zh: 'ETAPS 成员会' }))).toBe('CCF B*');
  });
});

describe('the sheet a badge opens', () => {
  it('lists the shown lists: the tapped list first, then by relevance, then ccfddl; never CAA', () => {
    expect(texts(sheetOrder(ICRA, ['cs/robotics'], 'caai2024'))).toEqual(['CAAI A', 'CCF B', 'CORE A*', 'THCPL A']);
    expect(texts(sheetOrder(ICRA, ['cs/robotics']))).toEqual(['CCF B', 'CAAI A', 'CORE A*', 'THCPL A']);
    expect(texts(sheetOrder(HSCC, ['cs/theory', 'eng/control'], 'ccf7'))).toEqual(['CCF B', 'THCPL B']);
    expect(texts(sheetOrder(WITH_CAA, ['eng/control']))).toEqual(['CCF C']);
    expect(sheetOrder(undefined, ['cs/ml'])).toEqual([]);
  });
});
