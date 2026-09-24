// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import type { Edition, RuleCard, Source, SourceFile } from './types.ts';

export interface Loaded<T> {
  file: string;
  value: T;
}

export interface RepoData {
  root: string;
  sourceFiles: Loaded<SourceFile>[];
  editions: Loaded<Edition>[];
  rules: Loaded<RuleCard>[];
  sources: Map<string, Source>;
}

function yamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...yamlFiles(p));
    else if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) out.push(p);
  }
  return out.sort();
}

function load<T>(root: string, file: string): Loaded<T> {
  return { file: relative(root, file), value: parse(readFileSync(file, 'utf8')) as T };
}

export function loadRepoData(root: string): RepoData {
  const sourceFiles = yamlFiles(join(root, 'data/sources')).map((f) => load<SourceFile>(root, f));
  const editions = yamlFiles(join(root, 'data/editions')).map((f) => load<Edition>(root, f));
  const rules = yamlFiles(join(root, 'data/rules')).map((f) => load<RuleCard>(root, f));
  const sources = new Map<string, Source>();
  for (const sf of sourceFiles) for (const s of sf.value?.sources ?? []) sources.set(s.id, s);
  return { root, sourceFiles, editions, rules, sources };
}

export function snapshotPath(root: string, sha: string): string {
  return join(root, 'snapshots', `${sha}.txt`);
}

export function readSnapshot(root: string, source: Source): string | null {
  if (!source.snapshot) return null;
  const p = snapshotPath(root, source.snapshot);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}
