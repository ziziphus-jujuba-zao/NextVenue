// Copyright (c) 2026 Zayier Xie. All rights reserved.

// Rank badges next to venue names (docs/MOBILE_SPEC.md §12.2): which of an
// edition's labels to show, in which order, and in what words. Labels come
// from the data only (data/ranks, scripts/bundle.ts); nothing is inferred
// here. No DOM here.

import type { AppRankLabel } from './types.ts';

/**
 * Lists that can be a badge: the Chinese society and government lists. CORE
 * and THCPL come from ccfddl unchecked (THCPL is a university list); they are
 * only listed in the sheet, marked as such.
 */
// CAA (中国自动化学会) tiers are not shown: its site says 版权所有 不得转载 (owner decision, 2026-09-25).
export const BADGE_LISTS: readonly string[] = ['ccf7', 'caai2024', 'cast2025'];

/** At most this many badges after a name. */
export const MAX_BADGES = 2;

/**
 * The lists in order of relevance for a direction: computing and engineering
 * venues lead with CCF, then CAAI; other disciplines with 科协, the one list
 * that covers them.
 */
export function listOrderFor(dir: string | undefined): string[] {
  const disc = dir?.split('/')[0];
  if (disc === 'eng') return ['ccf7', 'caai2024', 'cast2025'];
  if (dir === 'cs/robotics') return ['ccf7', 'caai2024', 'cast2025'];
  if (disc === 'cs') return ['ccf7', 'caai2024', 'cast2025'];
  return ['cast2025', 'ccf7', 'caai2024'];
}

/**
 * The direction that decides the order: the venue's first direction (main
 * one first) that the user chose, else its main one.
 */
export const relevantDir = (dirs: readonly string[] | undefined, context: readonly string[] = []) =>
  dirs?.find((d) => context.includes(d)) ?? dirs?.[0];

/**
 * The badges after a venue name: at most two labels from the Chinese lists,
 * the most relevant list first ("CCF B · CAAI A" for ICRA). None when the
 * venue has no such label (CDC, ACC: not on the CCF list).
 */
export function pickBadges(labels: AppRankLabel[] | undefined, dirs: readonly string[] | undefined, context: readonly string[] = [], max = MAX_BADGES): AppRankLabel[] {
  const order = listOrderFor(relevantDir(dirs, context));
  return (labels ?? [])
    .filter((l) => !l.upstream && BADGE_LISTS.includes(l.list))
    .sort((a, b) => order.indexOf(a.list) - order.indexOf(b.list))
    .slice(0, max);
}

/** The words on a badge: the label as the data words it ("CCF A", "科协", "CCF B（ETAPS 成员会）"). */
export const badgeText = (l: AppRankLabel) => l.text;

/**
 * The words on a badge inside a row or lane, where the name needs the room:
 * a label with a qualifier drops it for a star ("CCF B*" for "CCF B（ETAPS
 * 成员会）"); the venue header and the rank sheet keep the whole text.
 */
export const badgeShort = (l: AppRankLabel) => (l.qualifier_zh ? `${l.text.replace(/（[^）]*）$/, '')}*` : l.text);

/** "CCF B · CAAI A", or "" without badges: the same line a screen reader hears. */
export const badgeLine = (labels: AppRankLabel[]) => labels.map(badgeText).join(' · ');

/**
 * Every label of an edition in the order the sheet lists them: the tapped
 * list first, then the badge lists by relevance, then ccfddl's CORE and
 * THCPL (marked as taken from ccfddl).
 */
export function sheetOrder(labels: AppRankLabel[] | undefined, dirs: readonly string[] | undefined, first?: string, context: readonly string[] = []): AppRankLabel[] {
  const order = [...listOrderFor(relevantDir(dirs, context)), 'core', 'thcpl'];
  const w = (l: AppRankLabel) => (l.list === first ? -1 : order.includes(l.list) ? order.indexOf(l.list) : 99);
  // Only lists the app may show; anything else (e.g. CAA, not shown by decision) never reaches the sheet.
  return (labels ?? []).filter((l) => order.includes(l.list)).sort((a, b) => w(a) - w(b));
}
