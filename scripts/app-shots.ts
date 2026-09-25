// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Screenshots of the built app at real phone sizes, via headless Chrome's
// DevTools protocol (Node built-ins only). Plain `chrome --screenshot` cannot
// do this on macOS: it lays pages out at least 500px wide.
//   pnpm build && pnpm shots            → dist/shots/*.png
//   pnpm shots today rule               → only shots whose name contains "today" or "rule"
// Set CHROME=/path/to/chrome if Chrome is not in the default macOS location.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, green, red } from './lib.ts';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = join(ROOT, 'dist', 'shots');
const PAGE = pathToFileURL(join(ROOT, 'dist', 'site', 'index.html')).href;
const NOW = '2026-09-25T21:00+08:00';

interface Shot {
  name: string;
  hash: string;
  query?: string;
  w?: number;
  h?: number;
  scheme?: 'light' | 'dark';
  /** ISO time for ?now= (default 2026-09-25 21:00 Beijing). */
  now?: string;
  /** Steps run in the page before the capture: a CSS selector to click, "!<js>" to evaluate, or a wait in ms. */
  steps?: (string | number)[];
}

/** The owner's example: 首选 1 NeurIPS, 2 ICLR, 3 ICML; 备选 4 ACL, 5 EMNLP. */
const OWNER = 'prefs=neurips,iclr,icml|acl,emnlp&topics=ml';
const pick = (id: string) => `[data-act="pick"][data-id="${id}"]`;
/**
 * First run as the owner would tap it (6 taps): 下一步 (机器学习 is preselected),
 * 备选, 其他方向的会议, ACL, EMNLP, then 开始.
 */
const OWNER_TAPS: (string | number)[] = ['[data-act="welcome-next"]', 450, '[data-act="tier"][data-id="backup"]', 80,
  '[data-act="show-others"]', 120, pick('acl'), 80, pick('emnlp'), 150, '!scrollTo(0, 0)', 100];
/** v0.1 storage (followed editions, a paper filed under one edition), then a reload on `hash`: the app migrates it. */
const legacy = (hash: string) =>
  `!(localStorage.clear(), localStorage.setItem('nv.follows', '["aaai-27","iclr-2027","arr-2026-10","cvpr-2027"]'), localStorage.setItem('nv.papers', '[{"id":"old1","name":"论文 A","edition":"cvpr-2027"}]'), location.replace(location.href.replace('reset=1', 'x=1').replace(/#.*$/, '#${hash}')))`;

const SHOTS: Shot[] = [
  // v0.2 deliverables (docs/MOBILE_SPEC.md §9), 390×844, light unless named dark.
  { name: 'v2-01-topics', hash: '/welcome', query: 'reset=1' },
  { name: 'v2-02-rank', hash: '/welcome', query: 'reset=1', steps: OWNER_TAPS },
  { name: 'v2-03-today', hash: '/today', query: `reset=1&${OWNER}` },
  { name: 'v2-04-paper-route', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}` },
  { name: 'v2-05-prefs', hash: '/me/prefs', query: `reset=1&${OWNER}` },
  { name: 'v2-06-venue-norules', hash: '/venue/neurips-2027', query: `reset=1&${OWNER}` },
  { name: 'v2-07-route-dark', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, scheme: 'dark' },
  // Review set: every other new screen and state.
  { name: 'x-welcome-2-ml', hash: '/welcome', query: 'reset=1', steps: ['[data-act="welcome-next"]', 500] },
  { name: 'x-welcome-2-owner-tall', hash: '/welcome', query: 'reset=1', steps: OWNER_TAPS, h: 2000 },
  { name: 'x-welcome-start-today', hash: '/welcome', query: 'reset=1', steps: [...OWNER_TAPS, '[data-act="start"]', 600] },
  { name: 'x-today-tall', hash: '/today', query: `reset=1&${OWNER}`, h: 1700 },
  { name: 'x-all', hash: '/all', query: `reset=1&${OWNER}`, h: 2600 },
  { name: 'x-venues', hash: '/venues', query: `reset=1&${OWNER}` },
  { name: 'x-prefs-tall', hash: '/me/prefs', query: `reset=1&${OWNER}`, h: 2200 },
  { name: 'x-prefs-moved', hash: '/me/prefs', query: `reset=1&${OWNER}`, steps: ['[data-act="move"][data-id="icml"][data-dir="1"]', 300] },
  { name: 'x-prefs-removed', hash: '/me/prefs', query: `reset=1&${OWNER}`, steps: ['[data-act="remove"][data-id="icml"]', 300] },
  { name: 'x-prefs-others', hash: '/me/prefs', query: `reset=1&${OWNER}`, steps: ['[data-act="show-others"]', 300], h: 2600 },
  { name: 'x-me', hash: '/me', query: `reset=1&demo=1&${OWNER}` },
  { name: 'x-paper-route-tall', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, h: 1700 },
  { name: 'x-paper-in-review-tall', hash: '/me/paper/demo-b', query: `reset=1&demo=1&${OWNER}`, h: 2400 },
  { name: 'x-paper-current-sheet', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, steps: ['a[href="#/me/paper/demo/current"]', 600] },
  { name: 'x-paper-prefs', hash: '/me/paper/demo/prefs', query: `reset=1&demo=1&${OWNER}` },
  { name: 'x-paper-new', hash: '/me', query: `reset=1&${OWNER}`, steps: ['a[href="#/me/paper/new"]', 600] },
  { name: 'x-paper-new-robotics', hash: '/me', query: `reset=1&${OWNER}`, steps: ['a[href="#/me/paper/new"]', 500, '[data-act="dir"][data-ctx="new"][data-id="ml"]', 80, '[data-act="dir"][data-ctx="new"][data-id="robotics"]', 200] },
  { name: 'x-route-cv-insert', hash: '/me/paper/demo', query: 'reset=1&demo=1&prefs=cvpr,iccv,eccv|wacv&topics=cv', h: 1300 },
  { name: 'x-route-robotics', hash: '/me/paper/demo', query: 'reset=1&demo=1&prefs=icra,iros,corl|rss&topics=robotics', h: 1300 },
  { name: 'x-route-nlp', hash: '/me/paper/demo', query: 'reset=1&demo=1&topics=nlp&prefs=acl,emnlp,naacl', h: 1300 },
  { name: 'x-venue-norules-rules', hash: '/venue/neurips-2027/rules', query: `reset=1&${OWNER}` },
  { name: 'x-venue-iclr2028-rules', hash: '/venue/iclr-2028/rules', query: `reset=1&${OWNER}` },
  { name: 'x-venue-iclr2028-timeline', hash: '/venue/iclr-2028', query: `reset=1&${OWNER}` },
  { name: 'x-venue-naacl-arr', hash: '/venue/naacl-2027/rules', query: 'reset=1&prefs=acl,emnlp,naacl' },
  { name: 'x-venue-info-derived', hash: '/venue/neurips-2027/info', query: `reset=1&${OWNER}` },
  { name: 'x-milestone-iclr2028-abstract', hash: '/m/iclr-2028/abstract', query: `reset=1&${OWNER}`, h: 1200 },
  { name: 'x-rule-ref', hash: '/m/iclr-2028/abstract', query: `reset=1&${OWNER}`, steps: ['a[href$="placeholder-abstract/for/iclr-2028"]', 600] },
  { name: 'x-milestone-estimated', hash: '/m/neurips-2027/paper', query: `reset=1&${OWNER}` },
  { name: 'x-milestone-estimated-source', hash: '/m/neurips-2027/paper/source', query: `reset=1&${OWNER}` },
  { name: 'x-migrated-me', hash: '/me', query: 'reset=1', steps: [legacy('/me'), 900] },
  { name: 'x-migrated-paper', hash: '/me/paper/old1', query: 'reset=1', steps: [legacy('/me/paper/old1'), 900, '!scrollTo(0, 0)', 100], h: 1400 },
  { name: 'x-migrated-current-sheet', hash: '/me/paper/old1', query: 'reset=1', steps: [legacy('/me/paper/old1'), 900, 'a[href="#/me/paper/old1/current"]', 600] },
  { name: 'x-migrated-venues', hash: '/venues', query: 'reset=1', steps: [legacy('/venues'), 900] },
  // Dark mode and small phones.
  { name: 'x-today-dark', hash: '/today', query: `reset=1&${OWNER}`, scheme: 'dark' },
  { name: 'x-prefs-dark', hash: '/me/prefs', query: `reset=1&${OWNER}&theme=dark` },
  { name: 'x-welcome-2-dark', hash: '/welcome', query: 'reset=1&theme=dark', steps: OWNER_TAPS },
  { name: 'x-venue-dark', hash: '/venue/neurips-2027', query: `reset=1&${OWNER}`, scheme: 'dark' },
  { name: 'x-route-cv-dark', hash: '/me/paper/demo', query: 'reset=1&demo=1&prefs=cvpr,iccv,eccv|wacv&topics=cv&theme=dark', h: 1300 },
  { name: 'x-welcome-1-375', hash: '/welcome', query: 'reset=1', w: 375, h: 667 },
  { name: 'x-welcome-2-375', hash: '/welcome', query: 'reset=1', w: 375, h: 667, steps: OWNER_TAPS },
  { name: 'x-today-375', hash: '/today', query: `reset=1&${OWNER}`, w: 375, h: 667 },
  { name: 'x-route-375', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, w: 375, h: 1300 },
  { name: 'x-prefs-375', hash: '/me/prefs', query: `reset=1&${OWNER}`, w: 375, h: 667 },
  { name: 'x-venues-375', hash: '/venues', query: `reset=1&${OWNER}`, w: 375, h: 667 },
  { name: 'x-route-cv-375', hash: '/me/paper/demo', query: 'reset=1&demo=1&prefs=cvpr,iccv,eccv|wacv&topics=cv', w: 375, h: 1300 },
  { name: 'x-route-320', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, w: 320, h: 1400 },
  { name: 'x-venues-320', hash: '/venues', query: `reset=1&${OWNER}`, w: 320, h: 640 },
  { name: 'x-prefs-320', hash: '/me/prefs', query: `reset=1&${OWNER}`, w: 320, h: 640 },
  // v0.1 screens, still reached the same way.
  { name: '02-today', hash: '/today', query: 'reset=1&follow=all' },
  { name: '03-milestone-iclr-paper', hash: '/m/iclr-2027/paper', query: `reset=1&${OWNER}` },
  { name: '05-venue-cvpr', hash: '/venue/cvpr-2027', query: 'reset=1&follow=all' },
  { name: '06-rule-iclr-author-freeze', hash: '/rule/iclr-2027/author-membership-freeze', query: `reset=1&${OWNER}` },
  { name: '07-rule-cvpr-iclr-overlap', hash: '/rule/cvpr-2027/iclr-overlap-withdraw-deadline', query: 'reset=1&follow=all' },
  { name: '11-venue-iclr-timeline', hash: '/venue/iclr-2027/timeline', query: `reset=1&${OWNER}` },
  { name: '12-all', hash: '/all', query: `reset=1&${OWNER}` },
  { name: '14-venue-info-cvpr', hash: '/venue/cvpr-2027/info', query: 'reset=1&follow=all' },
  { name: '15-me-empty', hash: '/me', query: `reset=1&${OWNER}` },
  { name: '20-today-dark-param', hash: '/today', query: `reset=1&${OWNER}&theme=dark` },
  { name: '27-venue-arr-tall', hash: '/venue/arr-2026-10', query: 'reset=1&follow=all', h: 2000 },
  { name: '32-flow-3-milestone', hash: '/today', query: `reset=1&${OWNER}`, steps: ['.hero', 600] },
  { name: '33-flow-4-rule', hash: '/m/iclr-2027/paper', query: `reset=1&${OWNER}`, steps: ['.group .row', 600] },
  { name: '49-desktop', hash: '/me/paper/demo', query: `reset=1&demo=1&${OWNER}`, w: 1024, h: 900 },
];

type Msg = { id?: number; method?: string; result?: Record<string, unknown>; error?: { message: string } };

class Cdp {
  private id = 0;
  private waiting = new Map<number, (m: Msg) => void>();
  private listeners: ((m: Msg) => void)[] = [];
  constructor(private ws: WebSocket) {
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(String(e.data)) as Msg;
      if (m.id !== undefined) this.waiting.get(m.id)?.(m);
      else for (const l of this.listeners) l(m);
    });
  }
  send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) =>
      this.waiting.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result ?? {}))),
    );
  }
  once(method: string, timeoutMs = 8000): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, timeoutMs);
      const l = (m: Msg) => {
        if (m.method === method) {
          clearTimeout(t);
          this.listeners = this.listeners.filter((x) => x !== l);
          resolve();
        }
      };
      this.listeners.push(l);
    });
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'nv-shots-'));
  const chrome = spawn(
    CHROME,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const wsUrl = await new Promise<string>((resolve, reject) => {
    let buf = '';
    chrome.stderr.on('data', (d: Buffer) => {
      buf += d.toString();
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) resolve(m[1]!);
    });
    chrome.on('exit', () => reject(new Error(`Chrome exited; is it at ${CHROME}?`)));
  });
  const port = new URL(wsUrl).port;
  const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
  const target = list.find((t) => t.type === 'page')!;
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  try {
    // Optional name filters: pnpm shots 02 rule
    const only = process.argv.slice(2);
    for (const s of SHOTS.filter((x) => !only.length || only.some((o) => x.name.includes(o)))) {
      const w = s.w ?? 390;
      const h = s.h ?? 844;
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.scheme ?? 'light' }] });
      await cdp.send('Page.navigate', { url: 'about:blank' });
      await sleep(50);
      const loaded = cdp.once('Page.loadEventFired');
      const now = encodeURIComponent(s.now ?? NOW);
      await cdp.send('Page.navigate', { url: `${PAGE}?now=${now}${s.query ? `&${s.query}` : ''}#${s.hash}` });
      await loaded;
      await sleep(450);
      for (const step of s.steps ?? []) {
        if (typeof step === 'number') await sleep(step);
        else if (step.startsWith('!')) await cdp.send('Runtime.evaluate', { expression: step.slice(1) });
        else {
          const r = await cdp.send('Runtime.evaluate', {
            expression: `(() => { const el = document.querySelector(${JSON.stringify(step)}); if (!el) return false; el.click(); return true; })()`,
            returnByValue: true,
          });
          if (!(r.result as { value?: boolean }).value) console.error(red(`  ${s.name}: nothing matches ${step}`));
        }
      }
      const overflow = await cdp.send('Runtime.evaluate', {
        expression: 'document.documentElement.scrollWidth - innerWidth',
        returnByValue: true,
      });
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(OUT, `${s.name}.png`), Buffer.from(String(shot.data), 'base64'));
      const ov = Number((overflow.result as { value?: number }).value ?? 0);
      console.log(`${ov > 0 ? red(`✗ horizontal overflow ${ov}px`) : green('✓')} ${s.name} (${w}×${h})`);
    }
  } finally {
    ws.close();
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

await main();
