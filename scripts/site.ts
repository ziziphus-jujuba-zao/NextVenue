// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: MIT

// Static rules site (v0.0): one page, rendered at build time, no tracking.
import type { Bundle, BundleEdition, BundleMilestone, BundleRule } from './bundle.ts';

const ANSWER_ZH: Record<string, string> = {
  required: '必须',
  allowed: '允许',
  not_allowed: '不允许',
  conditional: '有条件',
  unspecified: '官方未规定',
  not_required: '不要求',
  contradictory: '官方说法矛盾 †',
};

const VERIFICATION_ZH: Record<string, string> = {
  human: '已人工对照原文',
  correspondence: 'PC 书面答复',
  upstream: '来自上游数据',
  inherited: '沿用上一届规则',
  machine: '机器抽取，待核',
};

const CONF_ZH: Record<string, string> = { high: '置信度高', medium: '置信度中', low: '置信度低' };

const FAMILY_ZH: Record<string, string> = {
  author_list: '作者名单',
  content_edit: '标题、摘要与正文修改',
  submission: '投稿要求',
  cap: '投稿数量上限',
  reciprocal_reviewing: '作者审稿义务',
  profile: '账号与资料',
  dual_submission: '一稿多投',
  withdrawal: '撤稿',
  visibility: '公开与匿名',
  rebuttal: 'Rebuttal 与讨论',
  llm_policy: 'LLM 使用',
  format: '格式与页数',
  presentation: '注册与现场报告',
  resubmission: '重投',
  other: '其他',
};

export const MILESTONE_ZH: Record<string, string> = {
  abstract: '摘要截止',
  paper_registration: '论文注册截止',
  paper: '正文截止',
  supplementary: '补充材料截止',
  profile_deadline: '作者资料截止',
  reviewer_registration: '审稿人注册截止',
  reviewing: '审稿期',
  phase1_notification: 'Phase 1 结果',
  reviews_out: '审稿意见发布',
  author_response: '作者回复期',
  discussion: '讨论期',
  meta_reviews: 'Meta-review 发布',
  commitment: 'Commit 截止',
  notification: '最终结果',
  camera_ready: 'Camera-ready 截止',
  author_registration: '作者注册截止',
  conference: '会议举办',
};

const esc = (s: string | undefined | null) =>
  (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const date = (iso: string) => iso.slice(0, 10);

function milestoneTime(m: BundleMilestone): { local: string; beijing: string } {
  if (m.status === 'tba') return { local: '待公布', beijing: '—' };
  if (m.at_resolved) return { local: `${m.at_resolved.local.replace('T', ' ')} ${m.tz}`, beijing: m.at_resolved.beijing };
  if (m.start_resolved && m.end_resolved) {
    return {
      local: `${m.start_resolved.local.replace('T', ' ')} → ${m.end_resolved.local.replace('T', ' ')} ${m.tz}`,
      beijing: `${m.start_resolved.beijing} → ${m.end_resolved.beijing}`,
    };
  }
  return { local: '—', beijing: '—' };
}

function renderTimeline(ed: BundleEdition): string {
  if (!ed.milestones.length) return '';
  const rows = ed.milestones
    .map((m) => {
      const t = milestoneTime(m);
      const status = m.status === 'estimated' ? '<span class="pill warn">估计</span>' : m.status === 'tba' ? '<span class="pill muted">待公布</span>' : '';
      return `<tr><td>${esc(m.label_zh ?? MILESTONE_ZH[m.type] ?? m.type)} ${status}</td><td class="mono">${esc(t.local)}</td><td class="mono">${esc(t.beijing)}</td></tr>`;
    })
    .join('');
  return `<details class="timeline"><summary>时间线（会议时区 / 北京时间）</summary><div class="table-wrap"><table><thead><tr><th>节点</th><th>官方时间</th><th>北京时间</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function renderRule(r: BundleRule, ed: BundleEdition | undefined): string {
  const applies = r.applies
    ? [
        r.applies.from ? `自「${MILESTONE_ZH[r.applies.from] ?? r.applies.from}」起` : '',
        r.applies.until ? `至「${MILESTONE_ZH[r.applies.until] ?? r.applies.until}」` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';
  const fromM = r.applies?.from ? ed?.milestones.find((m) => m.type === r.applies!.from) : undefined;
  const fromTime = fromM?.at_resolved ? `（${fromM.at_resolved.local.replace('T', ' ')} ${fromM.tz}，北京时间 ${fromM.at_resolved.beijing}）` : '';
  const quotes = r.quotes
    .map(
      (q) => `<figure class="quote">
        ${q.reading_zh ? `<div class="reading">${esc(q.reading_zh)}</div>` : ''}
        <blockquote lang="en">${esc(q.text)}</blockquote>
        <figcaption><a href="${esc(q.deep_link)}" target="_blank" rel="noopener">${esc(q.source_title)} ↗</a> · 抓取于 ${esc(date(q.fetched_at))}</figcaption>
      </figure>`,
    )
    .join('');
  const checked = r.checked_sources_resolved?.length
    ? `<p class="checked">已查阅但未找到相关规定：${r.checked_sources_resolved
        .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`)
        .join('、')}</p>`
    : '';
  const badges = [
    `<span class="pill ${r.verification === 'human' || r.verification === 'correspondence' ? 'ok' : 'warn'}">${esc(VERIFICATION_ZH[r.verification])}${r.inherited_from ? `（${esc(r.inherited_from)}）` : ''}</span>`,
    `<span class="pill muted">${esc(CONF_ZH[r.conf])}</span>`,
  ].join('');
  const search = [r.question_zh, r.summary_zh, r.detail_zh, ...r.quotes.map((q) => q.text)].join(' ').toLowerCase();
  return `<article class="card" id="${esc(r.id.replace('/', '--'))}" data-search="${esc(search)}">
    <header><h4>${esc(r.question_zh)}</h4><span class="answer a-${esc(r.answer)}">${esc(ANSWER_ZH[r.answer])}</span></header>
    <p class="summary">${esc(r.summary_zh)}</p>
    ${applies ? `<p class="applies">适用：${esc(applies)}${esc(fromTime)}${r.applies?.note_zh ? `。${esc(r.applies.note_zh)}` : ''}</p>` : r.applies?.note_zh ? `<p class="applies">${esc(r.applies.note_zh)}</p>` : ''}
    ${r.detail_zh ? `<details class="detail"><summary>细节</summary><p>${esc(r.detail_zh)}</p></details>` : ''}
    ${quotes}${checked}
    ${r.changed_from_prev_zh ? `<p class="changed"><strong>较上一届：</strong>${esc(r.changed_from_prev_zh)}</p>` : ''}
    <footer>${badges}<span class="last">核对于 ${esc(r.last_checked)}</span><a class="permalink" href="#${esc(r.id.replace('/', '--'))}">#</a></footer>
  </article>`;
}

function renderEdition(ed: BundleEdition, rules: BundleRule[]): string {
  const byFamily = new Map<string, BundleRule[]>();
  for (const r of rules) byFamily.set(r.family, [...(byFamily.get(r.family) ?? []), r]);
  const order = Object.keys(FAMILY_ZH);
  const groups = [...byFamily.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([fam, rs]) => `<h3>${esc(FAMILY_ZH[fam] ?? fam)}</h3><div class="cards">${rs.map((r) => renderRule(r, ed)).join('')}</div>`)
    .join('');
  const meta = [
    ed.location?.city ? `${ed.location.city}${ed.location.country ? `, ${ed.location.country}` : ''}` : '',
    ed.dates ? `${ed.dates.start} → ${ed.dates.end}` : '',
    ed.ranks?.ccf ? `CCF ${ed.ranks.ccf}${ed.ranks.ccf_edition ? `（第${ed.ranks.ccf_edition}版）` : ''}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return `<section class="edition" id="${esc(ed.id)}">
    <h2>${esc(ed.name)} <span class="count">${rules.length} 张规则卡</span></h2>
    ${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
    ${ed.note_zh ? `<p class="note">${esc(ed.note_zh)}</p>` : ''}
    ${renderTimeline(ed)}
    ${groups}
  </section>`;
}

export function renderSite(bundle: Bundle): string {
  const editions = bundle.editions.filter((ed) => bundle.rules.some((r) => r.edition === ed.id));
  const nav = editions
    .map((ed) => `<a class="chip" href="#${esc(ed.id)}">${esc(ed.name)}</a>`)
    .join('');
  const sections = editions.map((ed) => renderEdition(ed, bundle.rules.filter((r) => r.edition === ed.id))).join('');
  const lastChecked = bundle.rules.map((r) => r.last_checked).sort().at(-1) ?? '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>投稿下一站 · 规则卡</title>
<meta name="description" content="CS/AI 顶会投稿规则：每条都附官方原文。摘要截止后能改什么、作者名单何时冻结、撤稿是否公开。">
<style>
:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a65;--line:#e4e1d8;--card:#ffffff;--accent:#2f5d8a;
--ok:#1f7a4d;--ok-bg:#e3f3ea;--no:#a83232;--no-bg:#f8e3e3;--req:#2f5d8a;--req-bg:#e2ecf6;--cond:#8a5a00;--cond-bg:#fbefd6;
--unk:#5b5b5b;--unk-bg:#ecebe7;--contra:#6b3fa0;--contra-bg:#efe6f8;--warn:#8a5a00;--warn-bg:#fbefd6;--quote:#f4f2ec}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#161615;--fg:#ecebe6;--muted:#a3a19a;--line:#33322f;--card:#1e1e1c;--accent:#8db7e0;
--ok:#7fd1a4;--ok-bg:#1d3327;--no:#f0a3a3;--no-bg:#3d2020;--req:#9cc3ea;--req-bg:#1f2d3b;--cond:#f0c77a;--cond-bg:#3a2e17;
--unk:#c4c2bb;--unk-bg:#2c2b28;--contra:#cfb2f0;--contra-bg:#2f2440;--warn:#f0c77a;--warn-bg:#3a2e17;--quote:#242421}}
:root[data-theme="dark"]{--bg:#161615;--fg:#ecebe6;--muted:#a3a19a;--line:#33322f;--card:#1e1e1c;--accent:#8db7e0;
--ok:#7fd1a4;--ok-bg:#1d3327;--no:#f0a3a3;--no-bg:#3d2020;--req:#9cc3ea;--req-bg:#1f2d3b;--cond:#f0c77a;--cond-bg:#3a2e17;
--unk:#c4c2bb;--unk-bg:#2c2b28;--contra:#cfb2f0;--contra-bg:#2f2440;--warn:#f0c77a;--warn-bg:#3a2e17;--quote:#242421}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.65 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif}
main,header.top,footer.bottom{max-width:960px;margin:0 auto;padding:0 16px}
header.top{padding-top:24px}
.back{margin:0 0 16px;font-size:14px}.back a{color:var(--accent);text-decoration:none}
h1{font-size:28px;margin:0 0 6px;letter-spacing:.01em}
h1 .en{font-size:17px;font-weight:500;color:var(--muted);margin-left:6px}
.tagline{margin:0 0 12px;color:var(--muted)}
.disclaimer{font-size:13px;border-left:3px solid var(--warn);background:var(--warn-bg);padding:8px 12px;border-radius:4px}
.toolbar{position:sticky;top:0;background:var(--bg);padding:12px 0;border-bottom:1px solid var(--line);z-index:1}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.chip{border:1px solid var(--line);border-radius:999px;padding:3px 12px;color:var(--fg);text-decoration:none;font-size:14px;background:var(--card)}
.chip:hover{border-color:var(--accent)}
input[type=search]{width:100%;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg);font-size:15px}
h2{font-size:22px;margin:40px 0 4px}
h2 .count{font-size:13px;color:var(--muted);font-weight:400;margin-left:8px}
h3{font-size:15px;color:var(--muted);margin:24px 0 10px;font-weight:600;letter-spacing:.02em}
.meta,.note{margin:0 0 8px;color:var(--muted);font-size:14px}
.timeline{margin:8px 0 0;font-size:14px}
.timeline summary{cursor:pointer;color:var(--accent)}
.table-wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;margin-top:8px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;color:var(--muted);font-size:13px}
.mono{font-variant-numeric:tabular-nums;white-space:nowrap}
.cards{display:grid;gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.card header{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}
.card h4{margin:0;font-size:16px;line-height:1.5}
.answer{flex:none;font-size:13px;font-weight:600;padding:2px 10px;border-radius:999px;white-space:nowrap}
.a-allowed{color:var(--ok);background:var(--ok-bg)}.a-not_allowed{color:var(--no);background:var(--no-bg)}
.a-required{color:var(--req);background:var(--req-bg)}.a-conditional{color:var(--cond);background:var(--cond-bg)}
.a-unspecified,.a-not_required{color:var(--unk);background:var(--unk-bg)}.a-contradictory{color:var(--contra);background:var(--contra-bg)}
.summary{margin:8px 0 4px}
.applies,.checked,.changed{font-size:13px;color:var(--muted);margin:4px 0}
.detail{font-size:14px;margin:6px 0}.detail summary{cursor:pointer;color:var(--accent)}
.quote{margin:10px 0 0;background:var(--quote);border-radius:8px;padding:10px 12px}
.quote blockquote{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:14.5px;line-height:1.6}
.quote figcaption{font-size:12.5px;color:var(--muted);margin-top:6px}
.quote a,.checked a{color:var(--accent)}
.reading{font-size:13px;font-weight:600;color:var(--contra);margin-bottom:4px}
.card footer{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:12.5px}
.pill{padding:1px 8px;border-radius:999px;font-size:12px}
.pill.ok{color:var(--ok);background:var(--ok-bg)}.pill.warn{color:var(--warn);background:var(--warn-bg)}.pill.muted{color:var(--unk);background:var(--unk-bg)}
.last{color:var(--muted)}
.permalink{margin-left:auto;color:var(--muted);text-decoration:none}
footer.bottom{color:var(--muted);font-size:13px;padding-top:40px;padding-bottom:60px}
.hidden{display:none}
@media (max-width:560px){.card header{flex-direction:column;gap:6px}h1{font-size:24px}}
</style>
</head>
<body>
<header class="top">
  <p class="back"><a href="./">‹ 返回投稿下一站 App</a></p>
  <h1>投稿下一站 <span class="en">NextVenue</span></h1>
  <p class="tagline">投稿规则卡。摘要截止后能改什么？作者名单什么时候冻结？撤稿会不会公开？每条回答都附官方原文，点击直达官网原句。</p>
  <p class="disclaimer">仅供决策参考，以官网为准。“沿用上一届”表示新一届尚未公布，按上一届规则推断；“官方说法矛盾 †”会并列两种读法，不替你选。最近核对：${esc(lastChecked)}。</p>
</header>
<main>
  <div class="toolbar">
    <div class="chips">${nav}</div>
    <input type="search" id="q" placeholder="搜索：作者、撤稿、rebuttal、上限……" aria-label="搜索规则">
  </div>
  ${sections}
</main>
<footer class="bottom">
  <p>共 ${bundle.rules.length} 张规则卡，${editions.length} 个会议。数据 bundle <span class="mono">${esc(bundle.bundle_hash.slice(0, 12))}</span>，构建于 ${esc(date(bundle.built_at))}。本页不做任何访问统计。</p>
  <p>NextVenue ／ 投稿下一站 · © 2026 Zayier Xie · 代码 MIT。本项目自有数据以 CC BY 4.0 发布；引用的官方原文版权归各会议所有，仅作引用。发现错误？请在 <a href="https://github.com/ziziphus-jujuba-zao/NextVenue/issues">GitHub</a> 提 issue，并附官网原文。</p>
</footer>
<script>
(() => {
  const q = document.getElementById('q');
  const cards = [...document.querySelectorAll('.card')];
  const sections = [...document.querySelectorAll('.edition')];
  q.addEventListener('input', () => {
    const terms = q.value.trim().toLowerCase().split(/\\s+/).filter(Boolean);
    for (const c of cards) c.classList.toggle('hidden', !terms.every((t) => c.dataset.search.includes(t)));
    for (const s of sections) s.classList.toggle('hidden', !s.querySelector('.card:not(.hidden)'));
  });
})();
</script>
</body>
</html>
`;
}
