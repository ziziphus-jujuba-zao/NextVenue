// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { findQuote } from '@nextvenue/core';
import { charsetOf, embeddedText, htmlToSnapshotText } from './snapshot.ts';

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

describe('pages the parser used to cut short', () => {
  it('keeps the article after an early </html> (gov.cn header include)', () => {
    const html = `<html><body><div>header</div></body></html>
      <div id="UCAP-CONTENT"><p>七、国庆节：10月1日（周四）至7日（周三）放假调休，共7天。</p></div>`;
    expect(htmlToSnapshotText(html)).toContain('10月1日（周四）至7日（周三）放假调休');
  });
  it('reads the charset from the header, then from <meta>', () => {
    const bytes = (s: string) => new TextEncoder().encode(s);
    expect(charsetOf('text/html; charset=GBK', bytes(''))).toBe('gbk');
    expect(charsetOf('text/html', bytes('<meta http-equiv="Content-Type" content="text/html; charset=gb2312">'))).toBe('gb2312');
    expect(charsetOf('text/html', bytes('<html>'))).toBe('utf-8');
  });
});

describe('embeddedText', () => {
  it('reads the HTML strings of a Nuxt payload, not ids or URLs', () => {
    const html = `<html><body><div id="__nuxt"></div><script>window.__NUXT__=(function(a){return {data:[{body:"\\u003Ch3\\u003EAbstract presenter registration\\u003C\\u002Fh3\\u003E\\n\\u003Cp\\u003EThe presenting author must be registered by&nbsp; 30 September 2026 .\\u003C\\u002Fp\\u003E",id:"abc-123",url:"\\u002Fmeeting-calendar"}]}}(1))</script></body></html>`;
    const text = embeddedText(html);
    expect(findQuote('The presenting author must be registered by 30 September 2026', text).found).toBe(true);
    expect(text).not.toContain('abc-123');
    expect(text).not.toContain('meeting-calendar');
  });
  it('is empty for a page without a payload', () => {
    expect(embeddedText('<html><body><p>Plain page text here.</p><script>var x = "<b>not a payload</b> at all"</script></body></html>')).toBe('');
  });
});
