// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';
import { findQuote } from '@nextvenue/core';
import { htmlToSnapshotText } from './snapshot.ts';

describe('htmlToSnapshotText', () => {
  const html = `<!doctype html><html><head><style>p{}</style><script>var x=1</script></head>
    <body><h2>Author List</h2><p>No authors can be <a href="/faq">added</a> after the
    <strong>abstract</strong> deadline.</p><ul><li>Order may change until Sep 25.</li></ul></body></html>`;
  const text = htmlToSnapshotText(html);

  it('keeps visible text and drops scripts, styles and link targets', () => {
    expect(text).toContain('Author List');
    expect(text).not.toContain('var x');
    expect(text).not.toContain('/faq');
  });
  it('keeps sentences split by inline tags matchable', () => {
    expect(findQuote('No authors can be added after the abstract deadline.', text).found).toBe(true);
  });
});
