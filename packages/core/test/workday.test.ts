// Copyright (c) 2026 Zayier Xie. All rights reserved.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  addWorkdays,
  holidayOn,
  isEstimated,
  isHoliday,
  isWorkday,
  loadRepoData,
  weekdayOf,
  workCalendar,
  workdaysBefore,
  workdaysBetween,
} from '../src/index.ts';

// The real data: 2026 from the State Council notice, 2027 estimated.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const cal = workCalendar(loadRepoData(ROOT).holidays.map((h) => h.value));

describe('2026 holiday notice (国办发明电〔2025〕7号)', () => {
  it('National Day: 10/1–10/7 off, 10/8 back to work', () => {
    for (const d of ['2026-10-01', '2026-10-04', '2026-10-07']) {
      expect(isHoliday(d, cal)).toBe(true);
      expect(isWorkday(d, cal)).toBe(false);
    }
    expect(holidayOn('2026-10-02', cal)).toEqual({ name_zh: '国庆节', estimated: false });
    expect(isWorkday('2026-10-08', cal)).toBe(true);
  });
  it('调休: Saturday 10/10 and Sunday 9/20 are working days; Sunday 10/11 is not', () => {
    expect(weekdayOf('2026-10-10')).toBe(6);
    expect(isWorkday('2026-10-10', cal)).toBe(true);
    expect(isHoliday('2026-10-10', cal)).toBe(false);
    expect(isWorkday('2026-09-20', cal)).toBe(true);
    expect(isWorkday('2026-10-11', cal)).toBe(false);
  });
  it('Mid-Autumn 9/25–9/27 and Spring Festival make-up Saturdays', () => {
    expect(isHoliday('2026-09-25', cal)).toBe(true);
    expect(isWorkday('2026-09-28', cal)).toBe(true);
    expect(isWorkday('2026-02-14', cal)).toBe(true);
    expect(isWorkday('2026-02-28', cal)).toBe(true);
    expect(isHoliday('2026-02-23', cal)).toBe(true);
  });
  it('an ordinary weekend is neither a holiday nor a working day', () => {
    expect(isHoliday('2026-10-17', cal)).toBe(false);
    expect(isWorkday('2026-10-17', cal)).toBe(false);
  });
});

describe('addWorkdays / workdaysBetween', () => {
  it('steps over National Day and lands on the 调休 Saturday', () => {
    expect(addWorkdays('2026-09-30', 1, cal)).toEqual({ date: '2026-10-08', estimated: false });
    expect(addWorkdays('2026-10-09', 1, cal).date).toBe('2026-10-10');
    expect(addWorkdays('2026-10-10', 1, cal).date).toBe('2026-10-12');
    expect(addWorkdays('2026-10-12', 0, cal).date).toBe('2026-10-12');
  });
  it('NeurIPS 2026 Sydney: 40 working days before a 12/5 departure is Mon 10/12, 7 working days from 9/25', () => {
    expect(workdaysBefore('2026-12-05', 40, cal)).toEqual({ date: '2026-10-12', estimated: false });
    expect(workdaysBetween('2026-09-25', '2026-10-12', cal)).toEqual({ count: 7, estimated: false });
    // After the 10/7 site assignment only 10/8, 10/9, 10/10 (调休) and 10/12 are left.
    expect(workdaysBetween('2026-10-07', '2026-10-12', cal).count).toBe(4);
  });
  it('a 15-working-day floor for a 10/23 departure falls on Mon 9/28', () => {
    expect(workdaysBefore('2026-10-23', 15, cal).date).toBe('2026-09-28');
  });
  it('round-trips and counts backwards', () => {
    const back = addWorkdays('2026-12-05', -40, cal).date;
    expect(workdaysBetween(back, '2026-12-04', cal).count).toBe(39);
    expect(workdaysBetween('2026-10-12', '2026-09-25', cal).count).toBe(-7);
  });
  it('AAAI-27: dates in 2027 use the estimate and say so', () => {
    // D = 2/15; Spring Festival estimated 2/4–2/12, no make-up days predicted.
    const r = workdaysBefore('2027-02-15', 40, cal);
    expect(r).toEqual({ date: '2026-12-09', estimated: true });
    expect(workdaysBetween('2026-11-30', r.date, cal)).toEqual({ count: 7, estimated: false });
    expect(workdaysBefore('2027-02-15', 15, cal)).toEqual({ date: '2027-01-14', estimated: true });
    expect(isEstimated('2027-02-05', cal)).toBe(true);
    expect(holidayOn('2027-02-06', cal)).toEqual({ name_zh: '春节', estimated: true });
  });
  it('a year with no file at all counts weekends only and is estimated', () => {
    const r = addWorkdays('2028-03-03', 1, cal);
    expect(r).toEqual({ date: '2028-03-06', estimated: true });
  });
  it('rejects bad input', () => {
    expect(() => addWorkdays('2026-9-1', 1, cal)).toThrow();
    expect(() => addWorkdays('2026-09-01', 1.5, cal)).toThrow();
    expect(() => workCalendar([{ year: 2026, status: 'confirmed', holidays: [], workdays: [] }, { year: 2026, status: 'estimated', holidays: [], workdays: [] }])).toThrow();
  });
});
