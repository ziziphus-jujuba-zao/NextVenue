// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// Fetch official pages, store a text snapshot, and record it as a source.
//
//   pnpm snapshot add --edition iclr-2027 --id iclr-2027-author-guidelines \
//       --kind author_guide --title "ICLR 2027 Author Guidelines" \
//       --url https://iclr.cc/Conferences/2027/AuthorGuidelines
//   pnpm snapshot refresh [--edition iclr-2027] [--id <source-id>]
//
// When the official page refuses our fetcher (e.g. HTTP 403), add
// --mirror-url <same publisher's copy>: `url` stays the official address and
// the snapshot is taken from the mirror. PDFs need `pdftotext` (poppler).
// A page whose body is drawn by JavaScript from a payload in the page itself
// (Nuxt, Next: esmo.org) takes --embedded: the snapshot then also holds the
// text of the HTML strings in that payload (`embedded: true` in the source).
//
// Snapshots are content-addressed (snapshots/<sha256>.txt), so an old
// snapshot that a rule card was checked against is never overwritten.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { convert } from 'html-to-text';
import { parse, stringify } from 'yaml';
import type { Source, SourceFile, SourceKind } from '@nextvenue/core';
import { checkEvidence, checkQuoteParts, collectEvidence, findQuote, loadRepoData, readSnapshot, statsQuotes } from '@nextvenue/core';
import { ROOT, green, parseArgs, red, yellow } from './lib.ts';

const USER_AGENT =
  'NextVenue-bot/0.0 (open-source rules snapshotter; +https://github.com/ziziphus-jujuba-zao/NextVenue)';
const KINDS: SourceKind[] = ['cfp', 'author_guide', 'dates', 'faq', 'policy', 'blog', 'form', 'repo', 'other'];

export function htmlToSnapshotText(html: string): string {
  // Some CMS pages (gov.cn) close </html> after an included header and carry
  // on with the article; the parser would stop there. Both end tags are
  // optional in HTML, so drop them.
  html = html.replace(/<\/(?:body|html)\s*>/gi, '');
  const text = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
      { selector: 'noscript', format: 'skip' },
      { selector: 'svg', format: 'skip' },
      { selector: 'h1', options: { uppercase: false } },
      { selector: 'h2', options: { uppercase: false } },
      { selector: 'h3', options: { uppercase: false } },
      { selector: 'h4', options: { uppercase: false } },
      { selector: 'h5', options: { uppercase: false } },
      { selector: 'h6', options: { uppercase: false } },
      { selector: 'table', format: 'dataTable', options: { uppercaseHeaderCells: false } },
    ],
  });
  return (
    text
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

/**
 * The text of a JavaScript-built page's own payload: every HTML string in its
 * inline data scripts (Nuxt's and Next's JSON, window.__NUXT__), decoded and turned into
 * text the way a page is. Only strings that hold markup and some words are
 * kept (ids, class names and URLs are not text a quote can come from).
 */
export function embeddedText(html: string): string {
  const parts: string[] = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const body = m[2] ?? '';
    if (!/application\/json/i.test(m[1] ?? '') && !/__NUXT__|__NEXT_DATA__/.test(body)) continue;
    for (const lit of body.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
      let s: string;
      try {
        s = JSON.parse(`"${lit[1]}"`) as string;
      } catch {
        continue;
      }
      if (/<[a-z][^>]*>/i.test(s) && /[A-Za-z\u3400-\u9fff]{3,}\s+\S+/.test(s.replace(/<[^>]*>/g, ' '))) parts.push(s);
    }
  }
  return parts.length ? htmlToSnapshotText(`<div>${parts.join('</div><div>')}</div>`) : '';
}

/** The page's charset from the Content-Type header or a <meta> tag; UTF-8 when neither says. */
export function charsetOf(contentType: string, head: Uint8Array): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  if (fromHeader) return fromHeader.toLowerCase();
  const ascii = new TextDecoder('latin1').decode(head.subarray(0, 4096));
  return (/<meta[^>]+charset=["']?([\w-]+)/i.exec(ascii)?.[1] ?? 'utf-8').toLowerCase();
}

function pdfToText(bytes: Uint8Array): string {
  const dir = mkdtempSync(join(tmpdir(), 'nextvenue-pdf-'));
  try {
    const file = join(dir, 'page.pdf');
    writeFileSync(file, bytes);
    return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  } catch (e) {
    throw new Error(`PDF snapshot needs pdftotext (poppler): ${(e as Error).message}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function fetchText(url: string, embedded = false): Promise<{ status: number; text: string | null }> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/plain,text/markdown;q=0.9,*/*;q=0.5' },
    redirect: 'follow',
  });
  if (!res.ok) return { status: res.status, text: null };
  const type = res.headers.get('content-type') ?? '';
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Compare bytes: some Node versions return a Buffer from a latin1 TextDecoder, which never equals a string.
  if (type.includes('pdf') || String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-') {
    return { status: res.status, text: pdfToText(bytes) };
  }
  let body: string;
  try {
    body = new TextDecoder(charsetOf(type, bytes)).decode(bytes);
  } catch {
    body = new TextDecoder('utf-8').decode(bytes);
  }
  const isHtml = type.includes('html') || /^\s*<(!doctype|html)/i.test(body);
  let text = isHtml ? htmlToSnapshotText(body) : body;
  if (isHtml && embedded) {
    const more = embeddedText(body);
    if (!more) throw new Error('--embedded: the page carries no HTML payload in its scripts');
    text = `${text}\n--- page payload (text the page draws with JavaScript) ---\n\n${more}`;
  }
  return { status: res.status, text };
}

function storeSnapshot(text: string): string {
  const sha = createHash('sha256').update(text, 'utf8').digest('hex');
  const dir = join(ROOT, 'snapshots');
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${sha}.txt`);
  if (!existsSync(p)) writeFileSync(p, text, 'utf8');
  return sha;
}

function sourceFilePath(edition: string): string {
  return join(ROOT, 'data/sources', `${edition}.yml`);
}

function readSourceFile(edition: string): SourceFile {
  const p = sourceFilePath(edition);
  if (!existsSync(p)) return { edition, sources: [] };
  return parse(readFileSync(p, 'utf8')) as SourceFile;
}

function writeSourceFile(sf: SourceFile): void {
  mkdirSync(join(ROOT, 'data/sources'), { recursive: true });
  const header = '# Managed by `pnpm snapshot`. Edit titles/notes freely; fetched_at, http_status and snapshot are rewritten on refresh.\n';
  writeFileSync(sourceFilePath(sf.edition), header + stringify(sf, { lineWidth: 0 }), 'utf8');
}

async function snapshotSource(src: Source): Promise<Source> {
  const { status, text } = await fetchText(src.mirror_url ?? src.url, src.embedded === true);
  const next: Source = { ...src, fetched_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), http_status: status };
  if (text) next.snapshot = storeSnapshot(text);
  else delete next.snapshot;
  return next;
}

/** After a refresh, report quotes that no longer appear in the new snapshot. */
function reportQuoteDrift(sourceIds: Set<string>): number {
  const data = loadRepoData(ROOT);
  let missing = 0;
  for (const { file, value: rule } of data.rules) {
    for (const q of rule.quotes ?? []) {
      if (!sourceIds.has(q.src)) continue;
      const src = data.sources.get(q.src);
      const text = src ? readSnapshot(ROOT, src) : null;
      if (!text || !findQuote(q.text, text).found) {
        missing++;
        console.log(yellow(`  quote no longer found: ${rule.id} (${file}) ← ${q.src}`));
      }
    }
  }
  // Quotes in editions (milestones, logistics), visa and China files. Anchors
  // are left to check:quotes, which knows the sibling items.
  const files = [...data.editions, ...data.visa, ...data.holidays, ...(data.chinaAdmin ? [data.chinaAdmin] : [])];
  for (const { file, value } of files) {
    for (const ref of collectEvidence(value)) {
      if (!ref.src || !sourceIds.has(ref.src)) continue;
      const src = data.sources.get(ref.src);
      const text = src ? readSnapshot(ROOT, src) : null;
      if (!text || checkEvidence({ ...ref, anchor: undefined }, text)) {
        missing++;
        console.log(yellow(`  quote no longer found: ${file} ${ref.path} ← ${ref.src}`));
      }
    }
  }
  // Statistics quotes (data/stats, data/stats/areas, data/topics).
  for (const q of statsQuotes(data.stats, data.areas, data.topics)) {
    if (!sourceIds.has(q.src)) continue;
    const src = data.sources.get(q.src);
    const text = src ? readSnapshot(ROOT, src) : null;
    if (!text || checkQuoteParts(q.quote, text)) {
      missing++;
      console.log(yellow(`  quote no longer found: ${q.file} ${q.where} ← ${q.src}`));
    }
  }
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (cmd === 'add') {
    const { edition, id, url, kind, title } = args;
    if ([edition, id, url, kind, title].some((v) => typeof v !== 'string')) {
      throw new Error('usage: pnpm snapshot add --edition E --id ID --url URL --kind KIND --title TITLE [--mirror-url URL] [--embedded]');
    }
    if (!KINDS.includes(kind as SourceKind)) throw new Error(`--kind must be one of ${KINDS.join(', ')}`);
    const sf = readSourceFile(edition as string);
    const existing = sf.sources.findIndex((s) => s.id === id);
    const mirror = args['mirror-url'];
    const base: Source = {
      id: id as string,
      url: url as string,
      ...(typeof mirror === 'string' ? { mirror_url: mirror } : {}),
      ...(args.embedded ? { embedded: true } : {}),
      title: title as string,
      kind: kind as SourceKind,
      fetched_at: '',
      http_status: 0,
    };
    const src = await snapshotSource(existing >= 0 ? { ...sf.sources[existing]!, ...base } : base);
    if (existing >= 0) sf.sources[existing] = src;
    else sf.sources.push(src);
    writeSourceFile(sf);
    const ok = src.http_status === 200 && src.snapshot;
    console.log(
      ok
        ? green(`✓ ${src.id} → snapshots/${src.snapshot}.txt`)
        : red(`✗ ${src.id}: HTTP ${src.http_status}, no snapshot stored (recorded as a source anyway)`),
    );
    return;
  }

  if (cmd === 'refresh') {
    const data = loadRepoData(ROOT);
    const onlyEdition = typeof args.edition === 'string' ? args.edition : null;
    const onlyId = typeof args.id === 'string' ? args.id : null;
    const touched = new Set<string>();
    for (const { value: sf } of data.sourceFiles) {
      if (onlyEdition && sf.edition !== onlyEdition) continue;
      let changed = false;
      for (let i = 0; i < sf.sources.length; i++) {
        const s = sf.sources[i]!;
        if (onlyId && s.id !== onlyId) continue;
        try {
          const next = await snapshotSource(s);
          const moved = next.snapshot !== s.snapshot;
          console.log(`${moved ? yellow('changed') : 'same   '} ${s.id} (HTTP ${next.http_status})`);
          sf.sources[i] = next;
          touched.add(s.id);
          changed = true;
        } catch (e) {
          console.log(red(`error   ${s.id}: ${(e as Error).message}`));
        }
      }
      if (changed) writeSourceFile(sf);
    }
    const missing = reportQuoteDrift(touched);
    if (missing) console.log(yellow(`${missing} quote(s) need review.`));
    return;
  }

  throw new Error('usage: pnpm snapshot <add|refresh> ...');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(red((e as Error).message));
    process.exit(1);
  });
}
