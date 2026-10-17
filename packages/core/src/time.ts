// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Deadline time handling. Venues publish deadlines in AoE (UTC-12), fixed
// offsets, or a named zone such as Pacific Time; users need them as an exact
// instant and in their own zone (Beijing time for most of our users).

export const BEIJING = 'Asia/Shanghai';

const FIXED = /^UTC(?:([+-])(\d{1,2})(?::?(\d{2}))?)?$/;

/** Offset in minutes east of UTC for a fixed-offset label, or null for IANA zones. */
export function fixedOffsetMinutes(tz: string): number | null {
  if (tz === 'AoE') return -12 * 60;
  const m = FIXED.exec(tz);
  if (!m) return null;
  if (!m[1]) return 0;
  const minutes = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === '-' ? -minutes : minutes;
}

function zoneOffsetMinutes(timeZone: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(utcMs))) p[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return (asUtc - utcMs) / 60000;
}

export function isValidTimeZone(tz: string): boolean {
  if (fixedOffsetMinutes(tz) !== null) return true;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

/**
 * Convert a wall-clock time in `tz` to a UTC instant.
 * A date without a time is treated as 23:59 in that zone, the usual meaning
 * of "deadline: <date>".
 */
export function toInstant(local: string, tz: string): Date {
  const m = LOCAL.exec(local);
  if (!m) throw new Error(`Bad local time "${local}" (want YYYY-MM-DD or YYYY-MM-DDTHH:mm)`);
  const wallAsUtc = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    m[4] === undefined ? 23 : Number(m[4]),
    m[5] === undefined ? 59 : Number(m[5]),
  );
  const fixed = fixedOffsetMinutes(tz);
  if (fixed !== null) return new Date(wallAsUtc - fixed * 60000);
  if (!isValidTimeZone(tz)) throw new Error(`Unknown time zone "${tz}"`);
  // Two passes settle the offset, including across DST transitions.
  let guess = wallAsUtc - zoneOffsetMinutes(tz, wallAsUtc) * 60000;
  guess = wallAsUtc - zoneOffsetMinutes(tz, guess) * 60000;
  return new Date(guess);
}

/** Format an instant as "YYYY-MM-DD HH:mm" in the given zone (default Beijing). */
export function formatIn(instant: Date, tz: string = BEIJING): string {
  const fixed = fixedOffsetMinutes(tz);
  if (fixed !== null) {
    const d = new Date(instant.getTime() + fixed * 60000);
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }
  const p: Record<string, string> = {};
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}
