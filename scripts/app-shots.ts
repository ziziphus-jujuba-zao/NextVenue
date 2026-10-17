// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

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
  /** Capture the whole page at this phone size (the layout stays w×h; the image is as tall as the page). */
  full?: boolean;
  /**
   * Steps run in the page before the capture: a CSS selector to tap, "!<js>"
   * to evaluate, or a wait in ms. A tap is a real pointer press at the
   * element's centre once it is scrolled into view; the shot fails if
   * something else (a footer, the tab bar) is on top of that point.
   */
  steps?: (string | number)[];
  /** navigator.userAgent for the page (default: headless Chrome's own). The place sheet picks its map by it. */
  ua?: string;
}

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

/** The owner's example: 首选 1 NeurIPS, 2 ICLR, 3 ICML; 备选 4 ACL, 5 EMNLP. */
const OWNER = 'prefs=neurips,iclr,icml|acl,emnlp&topics=ml';
const pick = (id: string) => `[data-act="pick"][data-id="${id}"]`;
/**
 * First run as the owner would tap it (7 taps): 下一步 (机器学习 is preselected),
 * 备选, 其他方向的会议, 计算机 (the others fold by 学科 since v0.6), ACL, EMNLP, then 开始.
 */
const OWNER_TAPS: (string | number)[] = ['[data-act="welcome-next"]', 450, '[data-act="tier"][data-id="backup"]', 80,
  '[data-act="show-others"]', 120, '[data-act="disc-fold"][data-id="others-cs"]', 150, pick('acl'), 80, pick('emnlp'), 150, '!scrollTo(0, 0)', 100];
/** v0.1 storage (followed editions, a paper filed under one edition), then a reload on `hash`: the app migrates it. */
const legacy = (hash: string) =>
  `!(localStorage.clear(), localStorage.setItem('nv.follows', '["aaai-27","iclr-2027","arr-2026-10","cvpr-2027"]'), localStorage.setItem('nv.papers', '[{"id":"old1","name":"论文 A","edition":"cvpr-2027"}]'), location.replace(location.href.replace('reset=1', 'x=1').replace(/#.*$/, '#${hash}')))`;

/** v0.2 storage: the owner's preferences and a paper saved before 目标会议 existed; reloaded on `hash`, the app gives it targets. */
const v2Paper = (hash: string) =>
  `!(localStorage.clear(), localStorage.setItem('nv.prefs', '{"first":["neurips","iclr","icml"],"backup":["acl","emnlp"]}'), localStorage.setItem('nv.topics', '["ml"]'), localStorage.setItem('nv.papers', '[{"id":"p1","name":"论文 A","dirs":["ml"]}]'), location.replace(location.href.replace('reset=1', 'x=1').replace(/#.*$/, '#${hash}')))`;
/** 目标会议 picker (§9.7): open 添加论文 from 我的, pick NeurIPS, ICML, AISTATS (in that order of taps). */
const tgt = (id: string) => `[data-act="target"][data-id="${id}"]`;
const OPEN_NEW: (string | number)[] = ['a[href="#/me/paper/new"]', 600];
const PICK_3: (string | number)[] = [...OPEN_NEW, tgt('neurips'), 150, tgt('icml'), 150, tgt('aistats'), 200];
/** Scroll the sheet so "选择目标会议" is at its top: the interest list and AISTATS are then in view. */
const TO_PICKS = `!(() => { const b = document.querySelector('.sheet-body'), h = document.querySelector('.pick-h'); if (b && h) b.scrollTop += h.getBoundingClientRect().top - b.getBoundingClientRect().top - 4; })()`;
const TOP = '!(document.querySelector(".sheet-body") || document.scrollingElement).scrollTop = 0';
const ADD: (string | number)[] = ['[data-act="add-paper"]', 900, '!scrollTo(0, 0)', 100];

/**
 * v0.4 storage (§10): papers as the app saves them (and optionally 出行设置),
 * then a reload on `hash`. The owner's preferences come along.
 */
const seed = (papers: unknown[], hash: string, trip?: unknown) =>
  `!(localStorage.clear(), localStorage.setItem('nv.prefs', '{"first":["neurips","iclr","icml"],"backup":["acl","emnlp"]}'), localStorage.setItem('nv.topics', '["ml"]'), localStorage.setItem('nv.papers', ${JSON.stringify(
    JSON.stringify(papers),
  )}), ${trip ? `localStorage.setItem('nv.trip', ${JSON.stringify(JSON.stringify(trip))}), ` : ''}location.replace(location.href.replace('reset=1', 'x=1').replace(/#.*$/, '#${hash}')))`;
/** A NeurIPS 2026 paper under review (在投), the result out on 9/24. */
const NEURIPS = { id: 'p1', name: '论文 A', dirs: ['ml'], targets: ['neurips', 'iclr', 'icml'], current: 'neurips-2026' };
/** The same paper marked accepted, site preference Sydney (the spec's example, §10.4). */
const NEURIPS_OK = { ...NEURIPS, accepted: { edition: 'neurips-2026', at: '2026-09-25' }, site: 'sydney' };
/** An AAAI-27 paper; its result comes out 11/30 (AoE). */
const AAAI = { id: 'p2', name: '论文 B', dirs: ['ml'], targets: ['aaai', 'icml', 'ijcai'], current: 'aaai-27' };
const AAAI_OK = { ...AAAI, accepted: { edition: 'aaai-27', at: '2026-12-01' } };
const AAAI_NOW = '2026-12-01T10:00+08:00';
/** NeurIPS has assigned the sites (10/6 17:00 UTC = 10/7 01:00 Beijing). */
const AFTER_ASSIGN = '2026-10-07T09:00+08:00';
const PAPER = (papers: unknown[], hash = '/me/paper/p1', trip?: unknown) => [seed(papers, hash, trip), 900, '!scrollTo(0, 0)', 100];
/** 录用了 on the ask card → 悉尼 in the site sheet (that tap marks it): the page turns into the checklist. */
const ACCEPT_TAPS: (string | number)[] = [...PAPER([NEURIPS]), '[data-act="accept-yes"]', 700, '[data-act="accept-site"][data-id="sydney"]', 900, '!scrollTo(0, 0)', 150];
/** The same, once the 撤销 toast has gone. */
const ACCEPTED: (string | number)[] = [...ACCEPT_TAPS, 4300];
const row = (href: string) => `.step-row a[href${href}]`;
const OPEN_FOLD = (n: number) => `!document.querySelectorAll('.sheet details')[${n}]?.setAttribute('open', '')`;

/** §11 graphic timeline: scroll the overview card sideways by `px`. */
const SCROLL_TL = (px: number) => `!(document.querySelector('.tl-scroll').scrollLeft += ${px})`;
const ROUTE_PAPER = { id: 'p1', name: '论文 A', dirs: ['ml'], targets: ['neurips', 'iclr', 'icml'] };

/** v0.6: a user in control and computing (§9.1, §12): 首选 CDC, ACC, HSCC+ICCPS; 备选 NeurIPS, ICRA. */
const CTRL = 'prefs=cdc,acc,hscc|neurips,icra&topics=eng/control,cs/theory';
/** Mixed disciplines on one timeline: computing, control, formal methods, oncology, neuroscience. */
const MIXED = 'prefs=iclr,cdc,acc,hscc,cav|aacr,sfn,icra&topics=cs/ml,eng/control';
const disc = (id: string) => `[data-act="disc"][data-id="${id}"]`;
/** A control PhD's first run: 工程, 控制 (it replaces the preselected 机器学习), 下一步. */
const CONTROL_TAPS: (string | number)[] = [disc('eng'), 200, '[data-act="dir"][data-id="eng/control"]', 150, '[data-act="welcome-next"]', 500];
const TYPE = (sel: string, text: string) =>
  `!(() => { const el = document.querySelector('${sel}'); el.focus(); el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input', { bubbles: true })); })()`;

/** v0.7 开会地点 (§3.4.1): venues across cities, countries and data levels. */
const PLACE = 'prefs=cvpr,neurips,iclr,icml,mm|fse-se,middleware,coling,interspeech&topics=cs/ml,cs/cv';
const PLACE_Q = `reset=1&${PLACE}`;
/** A paper whose route stops are somewhere known: CVPR (Seattle), ICCV and ACM MM (Hong Kong). */
const PLACE_PAPER = { id: 'p1', name: '论文 A', dirs: ['cs/cv'], targets: ['cvpr', 'iccv', 'mm'] };
const OPEN_PLACE: (string | number)[] = ['a.place-card', 700];

const SHOTS: Shot[] = [
  // 版权与第三方数据 under 我的 (AGPL source link; NOTICE ships with the app), and 我的 itself.
  { name: 'v8-01-me', hash: '/me', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v8-02-legal', hash: '/me/legal', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v8-03-legal-dark', hash: '/me/legal', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark', full: true },
  // v0.7 deliverables, 390×844, 2026-09-25 21:00 Beijing, as an iPhone: the place card under the name, and its sheet.
  // 01–05 are the set handed to the owner; the rest are for review.
  { name: 'v7-01-cvpr-location', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-02-neurips-sites', hash: '/venue/neurips-2026', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-03-fse-shenzhen', hash: '/venue/fse-se-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-04-location-sheet', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-05-venues-list', hash: '/venues/list', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-06-mm-hongkong', hash: '/venue/mm-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-07-upstream-middleware', hash: '/venue/middleware-2026', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-08-tba-icml', hash: '/venue/icml-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-09-neurips-sheet', hash: '/venue/neurips-2026', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-10-upstream-sheet', hash: '/venue/middleware-2026', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-11-route-stops', hash: '/me/paper/p1', query: PLACE_Q, ua: IPHONE_UA, steps: PAPER([PLACE_PAPER]) },
  { name: 'v7-12-coling-macau', hash: '/venue/coling-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-13-interspeech-brazil', hash: '/venue/interspeech-2027', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-14-ijcai-two-sites', hash: '/venue/ijcai-2027', query: PLACE_Q, ua: IPHONE_UA },
  { name: 'v7-15-fse-sheet', hash: '/venue/fse-se-2027', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-16-mm-sheet', hash: '/venue/mm-2027', query: PLACE_Q, ua: IPHONE_UA, steps: OPEN_PLACE },
  { name: 'v7-17-neurips-sheet-tall', hash: '/venue/neurips-2026/place', query: PLACE_Q, ua: IPHONE_UA, steps: [600], full: true },
  { name: 'v7-18-sheet-copied', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, steps: [...OPEN_PLACE, '.copy-b', 300] },
  // Schengen members the curated data had not met (ccfddl): Stockholm gets the same tag as Paris.
  { name: 'v7-19-stockholm-schengen', hash: '/venue/dis-2027', query: PLACE_Q, ua: IPHONE_UA },
  // Android and WeChat: no Apple 地图 hand-off there, so the sheet searches OpenStreetMap.
  { name: 'v7-25-sheet-android', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: ANDROID_UA, steps: OPEN_PLACE },
  { name: 'v7-26-mm-2027-steady-zone', hash: '/venue/mm-2027/place', query: PLACE_Q, ua: IPHONE_UA, steps: [600] },
  { name: 'v7-27-taiwan-unknown-visa', hash: '/venue/pkc-2027/place', query: PLACE_Q, ua: IPHONE_UA, steps: [600] },
  // Dark.
  { name: 'v7-20-cvpr-dark', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark' },
  { name: 'v7-21-sheet-dark', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark', steps: OPEN_PLACE },
  { name: 'v7-22-list-dark', hash: '/venues/list', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark' },
  { name: 'v7-23-neurips-dark', hash: '/venue/neurips-2026', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark' },
  { name: 'v7-24-tba-dark', hash: '/venue/icml-2027', query: PLACE_Q, ua: IPHONE_UA, scheme: 'dark' },
  // 375×667.
  { name: 'v7-30-cvpr-375', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667 },
  { name: 'v7-31-neurips-375', hash: '/venue/neurips-2026', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667 },
  { name: 'v7-32-list-375', hash: '/venues/list', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667, full: true },
  { name: 'v7-33-sheet-375', hash: '/venue/cvpr-2027', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667, steps: OPEN_PLACE },
  { name: 'v7-34-upstream-375', hash: '/venue/middleware-2026', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667 },
  { name: 'v7-35-route-375', hash: '/me/paper/p1', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667, steps: PAPER([PLACE_PAPER]) },
  // 320: the list drops the city whole where the dates leave no room for it.
  { name: 'v7-36-list-320', hash: '/venues/list', query: PLACE_Q, ua: IPHONE_UA, w: 320, h: 640 },
  { name: 'v7-37-neurips-320', hash: '/venue/neurips-2026', query: PLACE_Q, ua: IPHONE_UA, w: 320, h: 640 },
  { name: 'v7-38-ijcai-375', hash: '/venue/ijcai-2027', query: PLACE_Q, ua: IPHONE_UA, w: 375, h: 667 },
  // v0.6 deliverables, 390×844, 2026-09-25 21:00 Beijing. The first-run shots tap through the flow as a
  // user does (no ?topics=): 机器学习 is preselected softly and gives way to the first other direction.
  // 1. First screen: all nine 学科, closed; the bar says 已选 机器学习（默认）.
  { name: 'v6-01-discipline-picker', hash: '/welcome', query: 'reset=1' },
  // 2. A control PhD: 工程 → 控制 → 下一步 (3 taps): control venues with their badges, nothing prefilled.
  { name: 'v6-02-control-venues-badges', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, '!scrollTo(0, 0)', 100] },
  // 3. 会议 list of a control + theory user, with badges and second names.
  { name: 'v6-03-venues-list-badges', hash: '/venues/list', query: `reset=1&${CTRL}` },
  // 4–5. The small prestigious venues the owner asked about.
  { name: 'v6-04-hscc', hash: '/venue/hscc-2027', query: `reset=1&${CTRL}` },
  { name: 'v6-05-cav', hash: '/venue/cav-2027', query: `reset=1&${CTRL}` },
  // 6. ASCO: abstract deadline not published yet, so that is the next thing to know, with the official page.
  { name: 'v6-06-asco-abstract', hash: '/venue/asco-2027', query: `reset=1&${MIXED}` },
  // 7. Timeline across disciplines (no badges in the lanes: they answer "when").
  { name: 'v6-07-timeline-mixed', hash: '/venues/timeline', query: `reset=1&${MIXED}` },
  // 8. The rank sheet, from the HSCC+ICCPS header badge.
  { name: 'v6-08-badge-sheet', hash: '/venue/hscc-2027', query: `reset=1&${CTRL}`, steps: ['.rbs.hd .rb[data-list="ccf7"]', 700] },
  // Review set: the personas' flows, tap by tap, and the states the reviews named.
  { name: 'r6-01-control-flow-today', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, pick('cdc'), 80, pick('acc'), 80, pick('hscc'), 80, '[data-act="start"]', 700] },
  { name: 'r6-02-control-hero-detail', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, pick('cdc'), 80, pick('acc'), 80, '[data-act="start"]', 700, 'a.hero', 700] },
  { name: 'r6-03-onco-step2', hash: '/welcome', query: 'reset=1', steps: [disc('med'), 200, '[data-act="dir"][data-id="med/oncology"]', 150, '[data-act="welcome-next"]', 500, '!scrollTo(0, 0)', 100] },
  { name: 'r6-03b-onco-step2-tall', hash: '/welcome', query: 'reset=1', steps: [disc('med'), 200, '[data-act="dir"][data-id="med/oncology"]', 150, '[data-act="welcome-next"]', 500], full: true },
  { name: 'r6-04-onco-today', hash: '/welcome', query: 'reset=1', steps: [disc('med'), 200, '[data-act="dir"][data-id="med/oncology"]', 150, '[data-act="welcome-next"]', 500, pick('aacr'), 80, pick('asco'), 80, pick('esmo'), 80, '[data-act="start"]', 700] },
  { name: 'r6-05-nlp-step2', hash: '/welcome', query: 'reset=1', steps: [disc('cs'), 200, '[data-act="dir"][data-id="cs/nlp"]', 150, '[data-act="welcome-next"]', 500, '!scrollTo(0, 0)', 100] },
  { name: 'r6-06-ml-step2', hash: '/welcome', query: 'reset=1', steps: ['[data-act="welcome-next"]', 500, '!scrollTo(0, 0)', 100], full: true },
  { name: 'r6-07-search-crypto', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, TYPE('[data-search]', 'crypto'), 200, '!document.activeElement.blur()', 100] },
  { name: 'r6-08-search-ccc', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, TYPE('[data-search]', 'ccc'), 200, '!document.activeElement.blur()', 100] },
  { name: 'r6-09-search-kbd', hash: '/welcome', query: 'reset=1', h: 480, steps: [...CONTROL_TAPS, '[data-search]', 300, TYPE('[data-search]', 'hscc'), 400] },
  { name: 'r6-10-crypto-page', hash: '/series/crypto', query: `reset=1&${CTRL}` },
  { name: 'r6-11-aacr-tall', hash: '/venue/aacr-2027', query: `reset=1&${MIXED}`, full: true },
  { name: 'r6-12-today-mixed', hash: '/today', query: `reset=1&${MIXED}`, full: true },
  { name: 'r6-13-acc-milestone', hash: '/m/acc-2027/paper', query: `reset=1&${CTRL}` },
  { name: 'r6-14-others-by-discipline', hash: '/welcome', query: 'reset=1', steps: [...CONTROL_TAPS, '[data-act="show-others"]', 200, '[data-act="disc-fold"][data-id="others-med"]', 200], full: true },
  { name: 'r6-15-hscc-tentative-source', hash: '/m/hscc-2027/camera_ready/source', query: `reset=1&${CTRL}`, steps: [500] },
  { name: 'r6-16-prefs-375', hash: '/me/prefs', query: `reset=1&${CTRL}`, w: 375, h: 667, full: true },
  { name: 'r6-17-prefs-320', hash: '/me/prefs', query: 'reset=1&prefs=neurips,iclr,icml,tacas|aiaa-scitech&topics=cs/ml', w: 320, h: 640 },
  { name: 'r6-18-dirs-375', hash: '/welcome', query: 'reset=1', w: 375, h: 667 },
  { name: 'r6-19-list-375', hash: '/venues/list', query: 'reset=1&prefs=cdc,acc,hscc,tacas,ccc-control|ccc,aiaa-scitech,ifac-wc&topics=eng/control,cs/theory', w: 375, h: 667, full: true },
  { name: 'r6-20-timeline-430', hash: '/venues/timeline', query: `reset=1&${MIXED}`, w: 430, h: 932 },
  { name: 'r6-21-rank-tacas', hash: '/rank/tacas-2027/ccf7', query: `reset=1&${CTRL}`, steps: [600] },
  { name: 'r6-22-esmo', hash: '/venue/esmo-2026', query: `reset=1&${MIXED}`, full: true },
  { name: 'r6-23-dark-list', hash: '/venues/list', query: `reset=1&${CTRL}`, scheme: 'dark' },
  { name: 'r6-24-dark-sheet', hash: '/venue/hscc-2027', query: `reset=1&${CTRL}`, scheme: 'dark', steps: ['.rbs.hd .rb[data-list="ccf7"]', 700] },
  { name: 'r6-26-chips-counts', hash: '/welcome', query: 'reset=1', steps: [disc('eng'), 200, disc('med'), 200, '[data-act="dir"][data-id="eng/control"]', 150, '!scrollTo(0, 0)', 100], full: true },
  { name: 'r6-27-control-step2-375', hash: '/welcome', query: 'reset=1', w: 375, h: 667, steps: [...CONTROL_TAPS, '!scrollTo(0, 0)', 100] },
  { name: 'r6-25-target-picker', hash: '/me', query: `reset=1&${CTRL}`, steps: ['a[href="#/me/paper/new"]', 600, '[data-act="target-others"]', 300], full: true },
  // v0.5 deliverables: 图形时间线与往年数据 (§11), 390×844, owner's preferences, now 2026-09-25 21:00 Beijing.
  // 01–06 are the set handed to the owner; the rest are for review (other venues, sheets, dark, 375, other dates).
  { name: 'v5-01-timeline', hash: '/venues/timeline', query: `reset=1&${OWNER}` },
  { name: 'v5-02-timeline-scrolled', hash: '/venues/timeline', query: `reset=1&${OWNER}`, steps: [SCROLL_TL(320), 500] },
  // Tap the NeurIPS name ("约 5/5" under it): NeurIPS 2027 opens on its phases.
  { name: 'v5-03-neurips-zoom-tall', hash: '/venues/timeline', query: `reset=1&${OWNER}`, steps: ['.tl-name[href*="neurips"]', 700, '!scrollTo(0, 0)', 100], full: true },
  { name: 'v5-04-cvpr-stats-tall', hash: '/venue/cvpr-2027/timeline', query: `reset=1&${OWNER}`, full: true },
  { name: 'v5-05-acl-rounds-topics-tall', hash: '/venue/acl-2027/timeline', query: `reset=1&${OWNER}`, full: true },
  { name: 'v5-06-timeline-dark', hash: '/venues/timeline', query: `reset=1&${OWNER}`, scheme: 'dark' },
  // 会议 → 列表 → tap 时间线 (the segment is remembered).
  { name: 'v5-10-list-to-timeline', hash: '/venues', query: `reset=1&${OWNER}`, steps: ['[data-act="venues-seg"][data-id="timeline"]', 500] },
  { name: 'v5-11-iclr-zoom-tall', hash: '/venue/iclr-2027/timeline', query: `reset=1&${OWNER}`, full: true },
  // NeurIPS 2026 (result out 9/24): 下一届 NeurIPS 2027 under the next-step card.
  { name: 'v5-12-neurips-2026-tall', hash: '/venue/neurips-2026/timeline', query: `reset=1&${OWNER}`, full: true },
  { name: 'v5-13-stat-sheet-iclr-2023', hash: '/venue/iclr-2027/timeline', query: `reset=1&${OWNER}`, steps: ['a.st-cell[href="#/stat/iclr/2023"]', 700] },
  { name: 'v5-14-stat-sheet-neurips-2026', hash: '/stat/neurips/2026', query: `reset=1&${OWNER}`, steps: [500] },
  { name: 'v5-15-topics-sheet', hash: '/venue/iclr-2027/timeline', query: `reset=1&${OWNER}`, steps: ['a[href="#/topics/iclr/2025"]', 700] },
  { name: 'v5-16-areas-cvpr', hash: '/areas/cvpr/2024', query: `reset=1&${OWNER}`, full: true },
  { name: 'v5-17-paper-mini-route', hash: '/me', query: 'reset=1', steps: PAPER([ROUTE_PAPER]) },
  { name: 'v5-18-wacv-rounds-tall', hash: '/venue/wacv-2027/timeline', query: 'reset=1&prefs=cvpr,wacv,iccv|eccv&topics=cv', full: true },
  { name: 'v5-19-kdd-cycles-tall', hash: '/venue/kdd-2027/timeline', query: 'reset=1&prefs=kdd,www,sigir|cikm,wsdm&topics=dm', full: true },
  { name: 'v5-20-timeline-many', hash: '/venues/timeline', query: 'reset=1&prefs=neurips,iclr,icml,cvpr,aaai,wacv,kdd,aistats|acl,emnlp,naacl&topics=ml' },
  { name: 'v5-21-about-stats', hash: '/about/stats', query: `reset=1&${OWNER}`, steps: [500] },
  { name: 'v5-22-emnlp-zoom-tall', hash: '/venue/emnlp-2027/timeline', query: `reset=1&${OWNER}`, full: true },
  { name: 'v5-23-aaai-zoom-tall', hash: '/venue/aaai-28/timeline', query: 'reset=1&prefs=aaai,ijcai|neurips&topics=ml', full: true },
  // Dark.
  { name: 'v5-24-neurips-dark-tall', hash: '/venue/neurips-2027/timeline', query: `reset=1&${OWNER}`, scheme: 'dark', full: true },
  { name: 'v5-25-paper-mini-dark', hash: '/me', query: 'reset=1', scheme: 'dark', steps: PAPER([ROUTE_PAPER]) },
  { name: 'v5-26-timeline-many-dark', hash: '/venues/timeline', query: 'reset=1&prefs=neurips,iclr,icml,cvpr,aaai,wacv,kdd,aistats|acl,emnlp,naacl&topics=ml', scheme: 'dark' },
  // Other dates: the year in the corner, today's tag near a month start, labels on bars under review.
  { name: 'v5-27-timeline-oct20', hash: '/venues/timeline', query: 'reset=1&prefs=neurips,iclr,icml,cvpr,aaai,wacv,kdd,aistats|acl,emnlp,naacl&topics=ml', now: '2026-10-20T10:00+08:00' },
  { name: 'v5-28-timeline-jan3', hash: '/venues/timeline', query: 'reset=1&prefs=neurips,iclr,icml,cvpr,aaai,wacv,kdd,aistats|acl,emnlp,naacl&topics=ml', now: '2027-01-03T10:00+08:00' },
  // 375 wide.
  { name: 'v5-30-timeline-375', hash: '/venues/timeline', query: `reset=1&${OWNER}`, w: 375, h: 667 },
  { name: 'v5-31-cvpr-375-tall', hash: '/venue/cvpr-2027/timeline', query: `reset=1&${OWNER}`, w: 375, h: 667, full: true },
  { name: 'v5-32-acl-375-tall', hash: '/venue/acl-2027/timeline', query: `reset=1&${OWNER}`, w: 375, h: 667, full: true },
  { name: 'v5-33-paper-mini-375', hash: '/me', query: 'reset=1', w: 375, h: 667, steps: PAPER([ROUTE_PAPER]) },
  // 11 venues on a small phone: the page scrolls, the month header sticks under the bar.
  { name: 'v5-34-timeline-many-375-scrolled', hash: '/venues/timeline', query: 'reset=1&prefs=neurips,iclr,icml,cvpr,aaai,wacv,kdd,aistats|acl,emnlp,naacl&topics=ml', w: 375, h: 667, steps: ['!scrollTo(0, 300)', 400] },
  { name: 'v5-35-timeline-320', hash: '/venues/timeline', query: `reset=1&${OWNER}`, w: 320, h: 640 },
  // v0.4 deliverables: 录用之后 (§10), 390×844 light; now 2026-09-25 21:00 Beijing.
  // 录用了 → 悉尼 marks the paper (2 taps on the paper page): the page turns into the checklist.
  { name: 'v4-01-accepted-top', hash: '/me', query: 'reset=1', steps: ACCEPTED },
  { name: 'v4-02-checklist-tall', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK]), full: true },
  { name: 'v4-03-step-detail', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/register"'), 700] },
  { name: 'v4-04-venue-visa', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('^="#/visa/au"'), 700] },
  { name: 'v4-05-travel-settings', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.trip-line', 700] },
  // The app opens on 下一步: the result to mark is the main card, with its two answers.
  { name: 'v4-06-ask-card', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS], '/today') },
  // Review set (r4): every other new screen and state.
  { name: 'r4-00-accepted-toast', hash: '/me', query: 'reset=1', steps: ACCEPT_TAPS },
  { name: 'r4-01-neurips-ask', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS]) },
  { name: 'r4-02-accept-sheet', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS]), '[data-act="accept-yes"]', 700] },
  { name: 'r4-03-today-accepted', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK, AAAI], '/today') },
  { name: 'r4-04-today-only-a', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK], '/today'), h: 1400 },
  { name: 'r4-05-today-overdue', hash: '/me', query: 'reset=1', now: '2026-10-02T10:00+08:00', steps: PAPER([NEURIPS_OK], '/today') },
  { name: 'r4-06-today-accept-2-taps', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS], '/today'), '[data-act="accept-yes"]', 700, '[data-act="accept-site"][data-id="sydney"]', 900, '!scrollTo(0, 0)', 100] },
  { name: 'r4-07-assign-card', hash: '/me', query: 'reset=1', now: AFTER_ASSIGN, steps: PAPER([{ ...NEURIPS_OK, done: ['site'] }]) },
  { name: 'r4-08-today-assign', hash: '/me', query: 'reset=1', now: AFTER_ASSIGN, steps: PAPER([NEURIPS_OK], '/today') },
  { name: 'r4-09-assigned-atlanta-tall', hash: '/me', query: 'reset=1', now: AFTER_ASSIGN, steps: [...PAPER([NEURIPS_OK]), '[data-act="set-assigned"][data-value="atlanta"]', 500, '!scrollTo(0, 0)', 100], full: true },
  { name: 'r4-10-step-site', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/site"'), 700] },
  { name: 'r4-11-step-register-tall', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/register"'), 700], h: 1500 },
  { name: 'r4-12-step-approval', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/approval"'), 700, OPEN_FOLD(0), OPEN_FOLD(1), 150], h: 1300 },
  { name: 'r4-13-step-aid', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/aid"'), 700] },
  { name: 'r4-14-step-reimburse', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/reimburse"'), 700] },
  { name: 'r4-15-venue', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/venue"'), 700] },
  { name: 'r4-16-venue-paris', hash: '/me', query: 'reset=1', steps: [...PAPER([{ ...NEURIPS_OK, site: 'paris' }]), row('$="/venue"'), 700] },
  { name: 'r4-17-visa-au-tall', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('^="#/visa/au"'), 700], full: true },
  { name: 'r4-18-visa-us-atlanta', hash: '/me', query: 'reset=1', steps: [...PAPER([{ ...NEURIPS_OK, site: 'atlanta' }]), row('^="#/visa/us"'), 700], full: true },
  { name: 'r4-19-atlanta-tall', hash: '/me', query: 'reset=1', steps: PAPER([{ ...NEURIPS_OK, site: 'atlanta' }]), full: true },
  { name: 'r4-20-aaai-ask', hash: '/me', query: 'reset=1', now: AAAI_NOW, steps: PAPER([AAAI], '/me/paper/p2') },
  { name: 'r4-21-aaai-accepted-tall', hash: '/me', query: 'reset=1', now: AAAI_NOW, steps: PAPER([AAAI_OK], '/me/paper/p2'), full: true },
  { name: 'r4-22-aaai-step-approval', hash: '/me', query: 'reset=1', now: AAAI_NOW, steps: [...PAPER([AAAI_OK], '/me/paper/p2'), row('$="/step/approval"'), 700, OPEN_FOLD(0), 150] },
  { name: 'r4-23-visa-ca', hash: '/me', query: 'reset=1', now: AAAI_NOW, steps: [...PAPER([AAAI_OK], '/me/paper/p2'), row('^="#/visa/ca"'), 700], full: true },
  { name: 'r4-24-me-accepted', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK, AAAI], '/me') },
  { name: 'r4-25-more-sheet', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.nav-more', 500] },
  { name: 'r4-26-done-and-folded', hash: '/me', query: 'reset=1', steps: [...PAPER([{ ...NEURIPS_OK, done: ['site'], skip: ['aid'] }]), '.done-fold summary', 200], full: true },
  { name: 'r4-27-coauthor', hash: '/me', query: 'reset=1', steps: PAPER([{ ...NEURIPS_OK, presenter: 'coauthor' }]), full: true },
  { name: 'r4-28-late-approval', hash: '/me', query: 'reset=1', now: '2026-11-20T10:00+08:00', steps: [...PAPER([{ ...NEURIPS_OK, done: ['site', 'aid'], assigned: 'sydney' }]), row('$="/step/approval"'), 700] },
  { name: 'r4-29-mark-row', hash: '/me', query: 'reset=1', steps: PAPER([{ ...NEURIPS, current: undefined }]), full: true },
  { name: 'r4-30-tick-step', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.step-row .ck', 400, '!scrollTo(0, 0)', 100] },
  { name: 'r4-31-skip-aid', hash: '/me', query: 'reset=1', steps: [...PAPER([{ ...NEURIPS_OK, done: ['site'] }]), row('$="/step/aid"'), 700, '[data-act="step-skip"]', 900, '!scrollTo(0, 0)', 100] },
  { name: 'r4-32-unaccept', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.nav-more', 400, '[data-act="unaccept"]', 500, '!scrollTo(0, 0)', 100] },
  {
    name: 'r4-33-set-coauthor',
    hash: '/me',
    query: 'reset=1',
    steps: [...PAPER([NEURIPS_OK]), '.trip-line', 600, `!(() => { const el = document.querySelector('[data-set="presenter"]'); el.value = 'coauthor'; el.dispatchEvent(new Event('change', { bubbles: true })); })()`, 300, '[data-act="back"]', 600],
  },
  { name: 'r4-34-rejected', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS]), '[data-act="accept-no"]', 400, '!scrollTo(0, 0)', 100] },
  { name: 'r4-35-aaai-accept-in-place', hash: '/me', query: 'reset=1', now: AAAI_NOW, steps: [...PAPER([AAAI], '/me/paper/p2'), '[data-act="accept-yes"]', 500] },
  {
    name: 'r4-36-wacv-register-reference',
    hash: '/me',
    query: 'reset=1',
    now: '2026-10-12T10:00+08:00',
    steps: [...PAPER([{ id: 'p3', name: '论文 C', dirs: ['cv'], targets: ['wacv', 'cvpr'], current: 'wacv-2027', accepted: { edition: 'wacv-2027', at: '2026-10-10' } }], '/me/paper/p3'), row('$="/step/register"'), 700, '!document.querySelector(".sheet-body").scrollTop = 400', 150],
  },
  /** Exported earlier with other dates (出发 moved since): the page offers to export again, and the export clears it. */
  { name: 'r4-37-cal-changed', hash: '/me', query: 'reset=1', steps: PAPER([{ ...NEURIPS_OK, cal: { site: '2026-10-01 19:59', approval: '2026-10-09', visa: '2026-10-08' } }]) },
  { name: 'r4-38-cal-exported', hash: '/me', query: 'reset=1', steps: [...PAPER([{ ...NEURIPS_OK, cal: { site: '2026-10-01 19:59', approval: '2026-10-09', visa: '2026-10-08' } }]), '.cal-banner', 500, '!scrollTo(0, 0)', 100] },
  // Dark mode.
  { name: 'r4-40-accepted-dark', hash: '/me', query: 'reset=1', steps: PAPER([{ ...NEURIPS_OK, done: ['site'] }]), scheme: 'dark', full: true },
  { name: 'r4-41-step-dark', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/register"'), 700], scheme: 'dark' },
  { name: 'r4-42-visa-au-dark', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('^="#/visa/au"'), 700], scheme: 'dark' },
  { name: 'r4-43-trip-dark', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.trip-line', 700], scheme: 'dark' },
  { name: 'r4-44-today-ask-dark', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS], '/today'), scheme: 'dark' },
  // Small and large phones.
  { name: 'r4-50-accepted-375', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK]), w: 375, h: 667 },
  { name: 'r4-51-accepted-375-tall', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK]), w: 375, h: 667, full: true },
  { name: 'r4-52-step-375', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/register"'), 700], w: 375, h: 667 },
  { name: 'r4-53-visa-au-375', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('^="#/visa/au"'), 700], w: 375, h: 667 },
  { name: 'r4-54-trip-375', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.trip-line', 700], w: 375, h: 667 },
  { name: 'r4-55-venue-375', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/venue"'), 700], w: 375, h: 667 },
  { name: 'r4-56-today-ask-375', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS], '/today'), w: 375, h: 667 },
  { name: 'r4-57-assign-375', hash: '/me', query: 'reset=1', now: AFTER_ASSIGN, steps: PAPER([NEURIPS_OK]), w: 375, h: 667 },
  { name: 'r4-60-accepted-430', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK]), w: 430, h: 932 },
  { name: 'r4-61-step-register-430', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('$="/step/register"'), 700], w: 430, h: 932 },
  { name: 'r4-62-visa-au-430', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), row('^="#/visa/au"'), 700], w: 430, h: 932 },
  { name: 'r4-63-trip-430', hash: '/me', query: 'reset=1', steps: [...PAPER([NEURIPS_OK]), '.trip-line', 700], w: 430, h: 932 },
  { name: 'r4-70-accepted-320', hash: '/me', query: 'reset=1', steps: PAPER([NEURIPS_OK]), w: 320, h: 640, full: true },
  // v0.3 deliverables: each paper picks up to 3 目标会议 (§9.7), 390×844 light unless named.
  { name: 'v3-01-add-empty', hash: '/me', query: `reset=1&${OWNER}`, steps: OPEN_NEW },
  { name: 'v3-02-add-picked', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, TO_PICKS, 150] },
  { name: 'v3-03-paper', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD] },
  { name: 'v3-04-edit-targets', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD, 'a[href$="/targets"]', 600, TOP, 100] },
  // Review set for v0.3.
  { name: 'v3-05-add-4th-pick', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, tgt('iclr'), 150, TO_PICKS, 100] },
  { name: 'v3-06-paper-tall', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD], h: 1800 },
  { name: 'v3-07-paper-clash', hash: '/me', query: `reset=1&${OWNER}`, steps: [...OPEN_NEW, tgt('neurips'), 150, tgt('icml'), 150, tgt('acl'), 150, ...ADD], h: 1300 },
  { name: 'v3-08-discard', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, '.sheet .close', 500] },
  { name: 'v3-09-edit-changed', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD, 'a[href$="/targets"]', 600, tgt('aistats'), 150, tgt('acl'), 150, TOP, 100] },
  { name: 'v3-10-dirs-open', hash: '/me', query: `reset=1&${OWNER}`, steps: [...OPEN_NEW, '[data-act="new-dirs"]', 300] },
  { name: 'v3-11-others-open', hash: '/me', query: `reset=1&${OWNER}`, steps: [...OPEN_NEW, '[data-act="target-others"]', 200, '[data-act="disc-fold"][data-id="others-cs"]', 200, tgt('cvpr'), 150], h: 2400 },
  { name: 'v3-12-migrated-v1-paper', hash: '/me/paper/old1', query: 'reset=1', steps: [legacy('/me/paper/old1'), 900, '!scrollTo(0, 0)', 100], h: 1500 },
  { name: 'v3-13-migrated-v2-paper', hash: '/me/paper/p1', query: 'reset=1', steps: [v2Paper('/me/paper/p1'), 900, '!scrollTo(0, 0)', 100], h: 1500 },
  { name: 'v3-14-add-picked-dark', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, TO_PICKS, 150], scheme: 'dark' },
  { name: 'v3-15-paper-dark', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD], scheme: 'dark', h: 1500 },
  { name: 'v3-16-add-375', hash: '/me', query: `reset=1&${OWNER}`, steps: OPEN_NEW, w: 375, h: 667 },
  { name: 'v3-17-add-4th-375', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, tgt('iclr'), 150], w: 375, h: 667 },
  { name: 'v3-18-paper-375', hash: '/me', query: `reset=1&${OWNER}`, steps: [...PICK_3, ...ADD], w: 375, h: 667 },
  { name: 'v3-19-migrated-v1-me', hash: '/me', query: 'reset=1', steps: [legacy('/me'), 900] },
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
  { name: 'x-paper-new-robotics', hash: '/me', query: `reset=1&${OWNER}`, steps: ['a[href="#/me/paper/new"]', 500, '[data-act="new-dirs"]', 150, '[data-act="dir"][data-ctx="new"][data-id="cs/robotics"]', 80, '[data-act="dir"][data-ctx="new"][data-id="cs/ml"]', 200] },
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

  const failed: string[] = [];
  try {
    // Optional name filters: pnpm shots 02 rule
    const only = process.argv.slice(2);
    for (const s of SHOTS.filter((x) => !only.length || only.some((o) => x.name.includes(o)))) {
      const w = s.w ?? 390;
      const h = s.h ?? 844;
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.scheme ?? 'light' }] });
      // An empty override puts Chrome's own user agent back for the next shot.
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: s.ua ?? '' });
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
          const miss = await tap(cdp, step);
          if (miss) {
            failed.push(`${s.name}: ${miss}`);
            console.error(red(`  ${s.name}: ${miss}`));
          }
        }
      }
      const overflow = await cdp.send('Runtime.evaluate', {
        expression: 'document.documentElement.scrollWidth - innerWidth',
        returnByValue: true,
      });
      if (s.full) {
        // The whole page at this phone width: grow the viewport to the page's height (fixed bars
        // then sit at its bottom, as they would after scrolling), capture, and the next shot resets it.
        const hh = await cdp.send('Runtime.evaluate', {
          expression: 'Math.max(document.documentElement.scrollHeight, innerHeight)',
          returnByValue: true,
        });
        const full = Number((hh.result as { value?: number }).value ?? h);
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: full, deviceScaleFactor: 2, mobile: true });
        // Let the fixed tab bar move to the new bottom before the capture.
        await cdp.send('Runtime.evaluate', {
          expression: 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(scrollY))))',
          awaitPromise: true,
        });
        await cdp.send('Runtime.evaluate', { expression: 'scrollTo(0, 0)' });
        await sleep(400);
      }
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
  if (failed.length) {
    console.error(red(`${failed.length} tap(s) did not land on their target:`));
    for (const f of failed) console.error(red(`  ${f}`));
    process.exitCode = 1;
  }
}

/**
 * Tap `selector` as a finger would: scroll it to the middle of its scroller,
 * check that it (or a child) is what sits at its centre, then press and
 * release there. Returns why the tap missed, or undefined when it landed.
 */
async function tap(cdp: Cdp, selector: string): Promise<string | undefined> {
  const r = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { miss: 'nothing matches' };
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const b = el.getBoundingClientRect();
      const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === el || el.contains(hit))) return { miss: 'covered by ' + (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ').join('.') : 'nothing'), x, y };
      return { x, y };
    })()`,
    returnByValue: true,
  });
  const v = (r.result as { value?: { miss?: string; x: number; y: number } }).value;
  if (!v || v.miss) return `${selector}: ${v?.miss ?? 'no result'}`;
  await sleep(60);
  for (const type of ['mousePressed', 'mouseReleased'])
    await cdp.send('Input.dispatchMouseEvent', { type, x: v.x, y: v.y, button: 'left', clickCount: 1 });
  return undefined;
}

await main();
