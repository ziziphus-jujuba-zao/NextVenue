// Copyright (c) 2026 Zayier Xie. All rights reserved.

import { describe, expect, it } from 'vitest';
import { checkEvidence, collectEvidence, jsonAt } from '../src/index.ts';

describe('collectEvidence', () => {
  it('finds quotes at any depth and inherits the nearest src', () => {
    const logistics = {
      fees: [
        {
          currency: 'USD',
          src: 'reg',
          rows: [
            { id: 'member', amounts: [750], quote: 'AAAI Member Technical $750' },
            { id: 'virtual', amounts: [80], quote: 'Virtual Regular $80', src: 'other' },
          ],
        },
      ],
      coverage: { status: 'tba', checked_sources: ['reg'], reference: { from: 'x-2026', per: 'author', src: 'old', quote: 'one registration' } },
    };
    const refs = collectEvidence(logistics, 'logistics');
    expect(refs.map((r) => [r.path, r.src])).toEqual([
      ['logistics.fees[0].rows[0]', 'reg'],
      ['logistics.fees[0].rows[1]', 'other'],
      ['logistics.coverage.reference', 'old'],
    ]);
  });
  it('reports a quote with no src anywhere above it', () => {
    expect(collectEvidence({ venue: { name: 'X', quote: 'X hall' } })[0]?.src).toBeUndefined();
  });
});

describe('checkEvidence', () => {
  const hotels = [
    'Le Westin Montréal',
    'Rate: CAD $239',
    'Cutoff Date: January 25, 2027',
    'DoubleTree by Hilton Montréal',
    'Rate: CAD $245',
    'Cutoff Date: January 15, 2027',
    'Embassy Suites by Hilton Montréal',
    'Cutoff Date: January 15, 2027',
  ].join('\n');
  it('ties a repeated cutoff to the hotel named just before it', () => {
    const q = { path: 'h', src: 's', quote: 'Cutoff Date: January 15, 2027' };
    expect(checkEvidence({ ...q, anchor: 'DoubleTree by Hilton Montréal' }, hotels)).toBeNull();
    expect(checkEvidence({ ...q, anchor: 'Embassy Suites by Hilton Montréal' }, hotels)).toBeNull();
    // Le Westin's own cutoff comes first, so January 15 is not its date.
    expect(checkEvidence({ ...q, anchor: 'Le Westin Montréal' }, hotels)).toMatch(/not the nearest/);
  });
  it('checks JSON sources by path and value', () => {
    const json = JSON.stringify({ 'visitor-outside-canada': { CN: '35 days', lastupdated: 'September 22, 2026' } });
    expect(jsonAt(JSON.parse(json), 'visitor-outside-canada.CN')).toBe('35 days');
    const ref = { path: 'lead.official', src: 'ircc', json_path: 'visitor-outside-canada.CN', json_value: '35 days' };
    expect(checkEvidence(ref, json)).toBeNull();
    expect(checkEvidence({ ...ref, json_value: '30 days' }, json)).toMatch(/not "30 days"/);
    expect(checkEvidence({ ...ref, json_path: 'visitor-outside-canada.IN' }, json)).toMatch(/no value/);
    expect(checkEvidence(ref, '<html>')).toBe('snapshot is not JSON');
  });
  it('normalizes typography like the rule-card check', () => {
    expect(checkEvidence({ path: 'x', src: 's', quote: '10月1日（周四）至7日（周三）' }, '七、国庆节：10月1日(周四)至7日(周三)放假')).toBeNull();
  });
});
