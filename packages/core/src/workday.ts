// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Chinese working days, for school travel approval ("至少提前 40 个工作日").
// A working day is Monday to Friday, minus the days off in the State
// Council's holiday notice, plus its 调休 working weekends. The notice for a
// year comes out in the November before, so later years are estimates
// (data/china/holidays-<year>.yml, status: estimated); every answer says
// whether it relied on one. No I/O here, so the app can bundle it.

import type { HolidayFile } from './types.ts';

export interface WorkCalendar {
  /** Day off → the holiday it belongs to. */
  off: Map<string, { name_zh: string; estimated: boolean }>;
  /** 调休上班日: weekend days that are working days. */
  on: Map<string, { name_zh: string }>;
  /** Years with data, and whether that data is the published notice. */
  years: Map<number, 'confirmed' | 'estimated'>;
}

export interface WorkdayResult {
  date: string;
  /** True when a day on the way lies in a year without a published notice. */
  estimated: boolean;
}

const DAY_MS = 86_400_000;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Longest span we walk (about 14 years of working days); guards against bad input. */
const MAX_STEPS = 3660;

function dayNumber(date: string): number {
  const m = DATE.exec(date);
  if (!m) throw new Error(`Bad date "${date}" (want YYYY-MM-DD)`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS;
}

function dateOf(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): number {
  return new Date(dayNumber(date) * DAY_MS).getUTCDay();
}

export function workCalendar(files: Pick<HolidayFile, 'year' | 'status' | 'holidays' | 'workdays'>[]): WorkCalendar {
  const cal: WorkCalendar = { off: new Map(), on: new Map(), years: new Map() };
  for (const f of files) {
    if (cal.years.has(f.year)) throw new Error(`Two holiday files for ${f.year}`);
    cal.years.set(f.year, f.status);
    const estimated = f.status !== 'confirmed';
    for (const h of f.holidays) {
      for (let d = dayNumber(h.start); d <= dayNumber(h.end); d++) cal.off.set(dateOf(d), { name_zh: h.name_zh, estimated });
    }
    for (const w of f.workdays) cal.on.set(w.date, { name_zh: w.name_zh });
  }
  return cal;
}

/** Whether the day's year has no published notice (estimated or missing). */
export function isEstimated(date: string, cal: WorkCalendar): boolean {
  return cal.years.get(Number(date.slice(0, 4))) !== 'confirmed';
}

/** The holiday a day off belongs to (weekend days inside the holiday included), or null. */
export function holidayOn(date: string, cal: WorkCalendar): { name_zh: string; estimated: boolean } | null {
  dayNumber(date);
  return cal.off.get(date) ?? null;
}

/** A day off under the holiday notice (not an ordinary weekend). */
export function isHoliday(date: string, cal: WorkCalendar): boolean {
  return holidayOn(date, cal) !== null;
}

export function isWorkday(date: string, cal: WorkCalendar): boolean {
  if (cal.on.has(date)) return true;
  if (cal.off.has(date)) return false;
  const wd = weekdayOf(date);
  return wd !== 0 && wd !== 6;
}

/**
 * The |n|-th working day after (n > 0) or before (n < 0) `date`, not counting
 * `date` itself. `addWorkdays(D, -40)` is the last day to apply when a school
 * wants 40 working days before departure D.
 */
export function addWorkdays(date: string, n: number, cal: WorkCalendar): WorkdayResult {
  if (!Number.isInteger(n) || Math.abs(n) > MAX_STEPS) throw new Error(`Bad number of working days: ${n}`);
  let day = dayNumber(date);
  let estimated = n !== 0 && isEstimated(date, cal);
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0; ) {
    day += step;
    const d = dateOf(day);
    if (isEstimated(d, cal)) estimated = true;
    if (isWorkday(d, cal)) left--;
  }
  return { date: dateOf(day), estimated };
}

/** `addWorkdays(date, -n)`: the latest day that still leaves n working days before `date`. */
export function workdaysBefore(date: string, n: number, cal: WorkCalendar): WorkdayResult {
  return addWorkdays(date, -n, cal);
}

/**
 * Working days d with from < d ≤ to ("今天起还剩 N 个工作日" when `from` is
 * today and `to` the deadline). Negative when `to` is before `from`.
 */
export function workdaysBetween(from: string, to: string, cal: WorkCalendar): { count: number; estimated: boolean } {
  const a = dayNumber(from);
  const b = dayNumber(to);
  const [lo, hi, sign] = a <= b ? [a, b, 1] : [b, a, -1];
  if (hi - lo > MAX_STEPS * 2) throw new Error(`Span too long: ${from} → ${to}`);
  let count = 0;
  let estimated = false;
  for (let day = lo + 1; day <= hi; day++) {
    const d = dateOf(day);
    if (isEstimated(d, cal)) estimated = true;
    if (isWorkday(d, cal)) count++;
  }
  return { count: sign * count, estimated };
}
