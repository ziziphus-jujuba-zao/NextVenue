// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Fetch official pages, store a text snapshot, and record it as a source.
//
//   pnpm snapshot add --edition iclr-2027 --id iclr-2027-author-guidelines \
//       --kind author_guide --title "ICLR 2027 Author Guidelines" \
//       --url https://iclr.cc/Conferences/2027/AuthorGuidelines
//   pnpm snapshot refresh [--edition iclr-2027] [--id <source-id>]
//
// Snapshots are content-addressed (snapshots/<sha256>.txt), so an old
// snapshot that a rule card was checked against is never overwritten.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { convert } from 'html-to-text';
import { parse, stringify } from 'yaml';
import type { Source, SourceFile, SourceKind } from '@nextvenue/core';
import { findQuote, loadRepoData, readSnapshot } from '@nextvenue/core';
import { ROOT, green, parseArgs, red, yellow } from './lib.ts';

const USER_AGENT =
  'NextVenue-bot/0.0 (open-source rules snapshotter; +https://github.com/ziziphus-jujuba-zao/NextVenue)';
const KINDS: SourceKind[] = ['cfp', 'author_guide', 'dates', 'faq', 'policy', 'blog', 'form', 'repo', 'other'];

export function htmlToSnapshotText(html: string): string {
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

async function fetchText(url: string): Promise<{ status: number; text: string | null }> {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/plain,text/markdown;q=0.9,*/*;q=0.5' },
    redirect: 'follow',
  });
  if (!res.ok) return { status: res.status, text: null };
  const type = res.headers.get('content-type') ?? '';
  const body = await res.text();
  if (type.includes('pdf')) throw new Error(`${url} is a PDF; PDF snapshots are not supported yet`);
  const text = type.includes('html') || /^\s*<(!doctype|html)/i.test(body) ? htmlToSnapshotText(body) : body;
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
  const { status, text } = await fetchText(src.url);
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
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  if (cmd === 'add') {
    const { edition, id, url, kind, title } = args;
    if ([edition, id, url, kind, title].some((v) => typeof v !== 'string')) {
      throw new Error('usage: pnpm snapshot add --edition E --id ID --url URL --kind KIND --title TITLE');
    }
    if (!KINDS.includes(kind as SourceKind)) throw new Error(`--kind must be one of ${KINDS.join(', ')}`);
    const sf = readSourceFile(edition as string);
    const existing = sf.sources.findIndex((s) => s.id === id);
    const base: Source = {
      id: id as string,
      url: url as string,
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
