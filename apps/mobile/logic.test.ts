// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import {
  afterPhrases,
  countdown,
  fmtBeijing,
  fmtMilestoneTime,
  fmtOfficial,
  groupRulesForMilestone,
  isAnnouncement,
  milestoneShort,
  milestoneTag,
  nowLine,
  paperRows,
  paperStatus,
  parseNow,
  pickHero,
  prettyEditionId,
  seriesName,
  isUrgent,
  relativeText,
  ruleTimeLong,
  ruleTimeShort,
  splitReading,
  stripSummary,
  targetOf,
  tbaMilestones,
  upcoming,
  upcomingRelative,
} from './logic.ts';
import type { AppEdition, AppMilestone, AppRule, ResolvedTime } from './types.ts';

// 2026-09-24 22:30 Beijing time.
const NOW = Date.parse('2026-09-24T22:30:00+08:00');

function rt(local: string, utc: string, beijing: string, tz = 'AoE'): ResolvedTime {
  return { local, tz, utc, beijing };
}

const abstract: AppMilestone = {
  type: 'abstract',
  tz: 'AoE',
  status: 'confirmed',
  at_resolved: rt('2026-09-18T23:59', '2026-09-19T11:59:00Z', '2026-09-19 19:59'),
};
const paper: AppMilestone = {
  type: 'paper',
  tz: 'AoE',
  status: 'confirmed',
  at_resolved: rt('2026-09-25T23:59', '2026-09-26T11:59:00Z', '2026-09-26 19:59'),
};
const reviewsOut: AppMilestone = {
  type: 'reviews_out',
  tz: 'AoE',
  status: 'confirmed',
  at_resolved: rt('2026-11-05', '2026-11-06T11:59:00Z', '2026-11-06 19:59'),
};
const discussion: AppMilestone = {
  type: 'discussion',
  label_zh: '作者-审稿人讨论期',
  tz: 'AoE',
  status: 'confirmed',
  start_resolved: rt('2026-11-05', '2026-11-06T11:59:00Z', '2026-11-06 19:59'),
  end_resolved: rt('2026-11-18', '2026-11-19T11:59:00Z', '2026-11-19 19:59'),
};
const phase1: AppMilestone = {
  type: 'phase1_notification',
  tz: 'AoE',
  status: 'confirmed',
  at_resolved: rt('2026-09-24', '2026-09-25T11:59:00Z', '2026-09-25 19:59'),
};

const ed: AppEdition = {
  id: 'iclr-2027',
  series: 'iclr',
  name: 'ICLR 2027',
  year: 2027,
  kind: 'conference',
  last_checked: '2026-09-24',
  milestones: [abstract, paper, reviewsOut, discussion],
};

function rule(id: string, answer: AppRule['answer'], applies?: AppRule['applies'], extra: Partial<AppRule> = {}): AppRule {
  return {
    id: `iclr-2027/${id}`,
    edition: 'iclr-2027',
    family: 'author_list',
    question_zh: id,
    short_zh: id,
    answer,
    verification: 'human',
    applies,
    summary_zh: '',
    quotes: [],
    last_checked: '2026-09-24',
    ...extra,
  };
}

describe('time formatting', () => {
  it('shows Beijing date, weekday and time', () => {
    expect(fmtBeijing('2026-09-26 19:59')).toBe('9/26 周六 19:59');
    expect(nowLine(NOW)).toBe('北京时间 9月24日 周四 22:30');
  });
  it('shows only the official date when no time was given', () => {
    expect(fmtMilestoneTime(reviewsOut)).toBe('11/5');
    expect(fmtMilestoneTime(discussion)).toBe('11/5–11/18');
    expect(fmtMilestoneTime({ ...paper, status: 'tba', at_resolved: undefined })).toBe('待公布');
  });
  it('keeps the venue’s own wording for the official line', () => {
    expect(fmtOfficial(paper)).toBe('9/25 23:59 AoE');
    expect(fmtOfficial(discussion)).toBe('11/5–11/18 AoE');
  });
  it('parses ?now= even when "+" arrived as a space', () => {
    expect(parseNow('2026-09-24T22:30+08:00')).toBe(NOW);
    expect(parseNow('2026-09-24T22:30 08:00')).toBe(NOW);
    expect(parseNow('nonsense')).toBeUndefined();
  });
});

describe('estimates and years', () => {
  const est = (m: AppMilestone): AppMilestone => ({ ...m, status: 'estimated' });
  it('shows an estimated date as "约 M/D HH:mm" in Beijing time, without a weekday', () => {
    expect(fmtMilestoneTime(est(paper))).toBe('约 9/26 19:59');
    expect(fmtMilestoneTime(est(discussion))).toBe('约 11/5–11/18');
  });
  it('counts an estimate in days, never hours', () => {
    const [item] = upcoming([{ ...ed, milestones: [est(paper)] }], NOW);
    expect(item!.target.precise).toBe(false);
    expect(relativeText(item!.target, NOW)).toBe('2 天');
  });
  it('names the year of a day ten months or more away, once per range', () => {
    const next: AppMilestone = { ...paper, at_resolved: rt('2027-09-25T23:59', '2027-09-26T11:59:00Z', '2027-09-26 19:59') };
    expect(fmtMilestoneTime(next, NOW)).toBe('2027/9/26 周日 19:59');
    expect(fmtMilestoneTime(est(next), NOW)).toBe('约 2027/9/26 19:59');
    // Near days stay short; so does a day that just passed.
    expect(fmtMilestoneTime(paper, NOW)).toBe('9/26 周六 19:59');
    expect(fmtMilestoneTime(abstract, NOW)).toBe('9/19 周六 19:59');
    const conf: AppMilestone = {
      type: 'conference',
      tz: 'AoE',
      status: 'estimated',
      start_resolved: rt('2027-12-06', '2027-12-07T11:59:00Z', '2027-12-07 19:59'),
      end_resolved: rt('2027-12-12', '2027-12-13T11:59:00Z', '2027-12-13 19:59'),
    };
    expect(fmtMilestoneTime(conf, NOW)).toBe('约 2027/12/6–12/12');
  });
});

describe('relative time', () => {
  it('uses days and hours under 48 hours', () => {
    expect(relativeText(targetOf(paper.at_resolved!), NOW)).toBe('1 天 21 小时');
    expect(countdown(targetOf(paper.at_resolved!), NOW)).toEqual([
      { n: '1', u: '天' },
      { n: '21', u: '小时' },
    ]);
  });
  it('says 今天 / 明天 by calendar day', () => {
    const tomorrow = rt('2026-09-25T12:00', '2026-09-25T04:00:00Z', '2026-09-25 12:00', 'UTC+8');
    expect(relativeText(targetOf(tomorrow), NOW)).toBe('明天');
    // A date-only milestone on today's official date is "today", not "tomorrow in Beijing".
    expect(relativeText(targetOf(phase1.at_resolved!), NOW)).toBe('今天');
    expect(countdown(targetOf(phase1.at_resolved!), NOW)).toEqual([{ u: '今天' }]);
  });
  it('counts whole calendar days beyond 48 hours', () => {
    expect(relativeText(targetOf(reviewsOut.at_resolved!), NOW)).toBe('42 天');
  });
  it('says "N 天后" for a result or review release, a bare "N 天" only for deadlines', () => {
    const [out] = upcoming([{ ...ed, milestones: [reviewsOut] }], NOW);
    expect(upcomingRelative(out!, NOW)).toBe('42 天后');
    const [due] = upcoming([{ ...ed, milestones: [paper] }], Date.parse('2026-09-01T12:00:00+08:00'));
    expect(upcomingRelative(due!, Date.parse('2026-09-01T12:00:00+08:00'))).toBe('25 天');
  });
  it('says whether a window starts or ends', () => {
    const [item] = upcoming([{ ...ed, milestones: [discussion] }], Date.parse('2026-11-10T12:00:00+08:00'));
    expect(item?.phase).toBe('ends');
    expect(upcomingRelative(item!, Date.parse('2026-11-10T12:00:00+08:00'))).toBe('剩 8 天');
    // A window that opens in 7 days must not read like a deadline in 7 days.
    const [opens] = upcoming([{ ...ed, milestones: [discussion] }], Date.parse('2026-10-30T12:00:00+08:00'));
    expect(opens?.phase).toBe('starts');
    expect(upcomingRelative(opens!, Date.parse('2026-10-30T12:00:00+08:00'))).toBe('6 天后');
  });
});

describe('upcoming and the Today card', () => {
  it('drops past milestones and sorts the rest', () => {
    const items = upcoming([ed], NOW);
    expect(items.map((i) => i.milestone.type)).toEqual(['paper', 'reviews_out', 'discussion']);
  });
  it('leaves post-acceptance dates to the accepted paper', () => {
    const early = { ...paper, type: 'early_registration' };
    expect(upcoming([{ ...ed, milestones: [early, paper] }], NOW).map((i) => i.milestone.type)).toEqual(['paper']);
    expect(tbaMilestones([{ ...ed, milestones: [{ ...early, status: 'tba' as const }] }])).toEqual([]);
  });
  it('prefers a deadline the author acts on over an announcement', () => {
    const items = upcoming([{ ...ed, milestones: [phase1, paper] }], NOW);
    expect(items[0]?.milestone.type).toBe('phase1_notification');
    expect(pickHero(items)?.milestone.type).toBe('paper');
    // Only the deadline is emphasised; a result announced today stays grey.
    expect(isUrgent(items[0]!, NOW)).toBe(false);
    expect(isUrgent(items[1]!, NOW)).toBe(true);
    // The grey row says there is nothing to do; the conference itself is not an announcement.
    expect(isAnnouncement(phase1)).toBe(true);
    expect(isAnnouncement(paper)).toBe(false);
    expect(isAnnouncement({ ...paper, type: 'conference' })).toBe(false);
  });
  it('shortens long milestone labels for list rows', () => {
    expect(milestoneShort(discussion)).toBe('作者-审稿人讨论期');
    expect(milestoneShort({ ...paper, type: 'profile_deadline', label_zh: '全体作者 OpenReview profile 完成截止' })).toBe('作者资料截止');
    expect(milestoneShort({ ...paper, type: 'reviewing', label_zh: '审稿人写审稿（作者兼审稿人适用）' })).toBe('审稿人写审稿');
  });
  it('uses the Chinese name when the venue label is English', () => {
    expect(milestoneShort({ ...paper, type: 'author_response', label_zh: 'Author feedback（仅 Phase 2 论文）' })).toBe('作者回复期');
    expect(milestoneShort(phase1)).toBe('第一轮结果');
    // An ACL row names ARR as the route, not as the deadline's owner.
    expect(milestoneShort({ ...paper, label_zh: 'ARR 投稿截止（2027 年 1 月轮）' })).toBe('投稿截止（经 ARR）');
  });
});

describe('milestone → rules grouping', () => {
  const rules = [
    rule('ai-section', 'required', { until: 'paper' }),
    rule('title-edit', 'conditional', { from: 'abstract', until: 'paper' }),
    rule('quota', 'not_allowed', { from: 'abstract', until: 'paper' }),
    rule('edit-freeze', 'not_allowed', { from: 'paper', until: 'reviews_out' }, { effect: { kind: 'lock', target: 'submission_content' } }),
    rule('dual', 'not_allowed', { from: 'paper', until: 'notification' }, { effect: { kind: 'exclusive' } }),
    rule('arxiv', 'allowed', { from: 'paper', until: 'notification' }),
    rule('unrelated', 'required', { until: 'abstract' }),
    rule('no-time', 'allowed'),
  ];
  it('splits into must-before, locked-after and other', () => {
    const g = groupRulesForMilestone(rules, 'paper');
    expect(g.mustBefore.map((r) => r.short_zh)).toEqual(['ai-section', 'title-edit']);
    expect(g.lockedAfter.map((r) => r.short_zh)).toEqual(['edit-freeze', 'dual']);
    expect(g.other.map((r) => r.short_zh)).toEqual(['quota', 'arxiv']);
  });
  it('names what locks once the milestone passes', () => {
    expect(milestoneTag(rules, paper)).toBe('锁 PDF');
    // Exclusivity covers the same paper only: "一稿多投", never "投别的会".
    expect(afterPhrases(rules, 'paper')).toEqual(['改 PDF', '一稿多投']);
  });
  it('marks a date as disputed only when the date itself is', () => {
    // A contradictory rule about the discussion does not make its date disputed.
    expect(milestoneTag([rule('order', 'contradictory', { until: 'discussion' })], discussion)).toBeUndefined();
    expect(milestoneTag([], { ...discussion, disputed: true })).toBe('日期说法不一');
  });
  it('writes the grey time line under a rule', () => {
    expect(ruleTimeShort(rules[0]!, ed)).toBe('至 9/26 周六 19:59');
    expect(ruleTimeShort(rules[1]!, ed)).toBe('9/19–9/26');
    expect(ruleTimeShort(rule('x', 'not_allowed', { from: 'abstract' }), ed)).toBe('摘要截止后');
    expect(ruleTimeShort(rule('x', 'allowed', { from: 'reviews_out', until: 'discussion' }), ed)).toBe('11/5–11/18');
    expect(ruleTimeShort(rule('x', 'allowed', { from: 'discussion', until: 'discussion' }), ed)).toBe('11/5–11/18');
    expect(ruleTimeShort(rules[7]!, ed)).toBeUndefined();
    expect(ruleTimeLong(rule('x', 'allowed', { from: 'abstract', until: 'discussion' }), ed)).toBe(
      '9/19–11/18 · 从摘要截止到讨论期结束',
    );
  });
  it('says what a paper can still do now', () => {
    expect(paperStatus(rules[0]!, ed, NOW)).toMatchObject({ word: '必须', line: '至 9/26 周六 19:59' });
    expect(paperStatus(rule('x', 'allowed', { from: 'abstract', until: 'paper' }), ed, NOW)).toMatchObject({ word: '还可以' });
    const lock = { effect: { kind: 'lock', target: 'author_membership' } };
    expect(paperStatus(rule('x', 'not_allowed', { from: 'abstract' }, lock), ed, NOW)).toMatchObject({
      word: '已锁定',
      line: '自摘要截止起',
      label: '增删作者',
    });
  });
  it('never turns a conditional answer into 还可以', () => {
    expect(paperStatus(rules[1]!, ed, NOW)).toMatchObject({ word: '有条件', tone: 'cond', line: '至 9/26 周六 19:59' });
  });
  it('shows a lock that is still ahead as open until the lock time', () => {
    expect(paperStatus(rules[3]!, ed, NOW)).toMatchObject({ word: '还可以', line: '至 9/26 周六 19:59', label: '改 PDF' });
    expect(paperStatus(rules[3]!, ed, Date.parse('2026-10-01T00:00:00+08:00'))).toMatchObject({ word: '已锁定' });
    expect(paperStatus(rules[3]!, ed, Date.parse('2026-11-10T00:00:00+08:00'))).toBeNull(); // unlocked again after reviews
  });
  it('asks to check quotas instead of calling them locked', () => {
    const cap = rule('quota', 'not_allowed', { from: 'abstract', until: 'paper' }, { effect: { kind: 'cap' } });
    expect(paperStatus(cap, ed, NOW)).toMatchObject({ word: '注意', line: '截至 9/26 周六 19:59 核对篇数' });
    expect(paperStatus(cap, ed, Date.parse('2026-10-01T00:00:00+08:00'))).toBeNull();
    // A page limit is a cap too, but a requirement: 必须.
    const pages = rule('pages', 'required', { until: 'paper' }, { effect: { kind: 'cap' } });
    expect(paperStatus(pages, ed, NOW)).toMatchObject({ word: '必须' });
  });
  it('does not call a lock open when another rule already locked the same thing', () => {
    const lock = { effect: { kind: 'lock', target: 'author_membership' } };
    const rows = paperRows(
      [rule('freeze', 'not_allowed', { from: 'abstract' }, lock), rule('camera', 'not_allowed', { from: 'reviews_out' }, lock), rules[0]!],
      ed,
      NOW,
    );
    expect(rows.map((r) => [r.rule.short_zh, r.status.word])).toEqual([
      ['ai-section', '必须'],
      ['freeze', '已锁定'],
    ]);
  });
});

describe('summary prefix stripping', () => {
  it('drops a leading word that repeats the answer', () => {
    expect(stripSummary('不能。作者名单在摘要截止时冻结。', 'not_allowed')).toBe('作者名单在摘要截止时冻结。');
    expect(stripSummary('不允许。两者都被列为伦理违规。', 'not_allowed')).toBe('两者都被列为伦理违规。');
    expect(stripSummary('可以。审稿期间允许发 arXiv。', 'allowed')).toBe('审稿期间允许发 arXiv。');
    expect(stripSummary('必须。每篇论文都要有一节。', 'required')).toBe('每篇论文都要有一节。');
  });
  it('keeps words that do not merely repeat the answer', () => {
    expect(stripSummary('可以。只到 7/28。', 'conditional')).toBe('可以。只到 7/28。');
    expect(stripSummary('必须在 11/10 前建好投稿。', 'required')).toBe('必须在 11/10 前建好投稿。');
    expect(stripSummary('会，所有作者须确认。', 'required')).toBe('会，所有作者须确认。');
  });
  it('drops the "inherited from last year" prefix', () => {
    expect(stripSummary('2027 作者指南尚未公布，以下为 2026 规则：必须在 11/10 前建好投稿。', 'not_allowed')).toBe(
      '必须在 11/10 前建好投稿。',
    );
    expect(stripSummary('2027 规则尚未公布，以下为 2026 规则：不能。补充材料里不能放新 PDF。', 'not_allowed')).toBe(
      '补充材料里不能放新 PDF。',
    );
    expect(stripSummary('AAAI-27 的 author feedback 细则尚未公布，以下为 AAAI-26 规则：只能提交一份。', 'conditional')).toBe(
      '只能提交一份。',
    );
    // Not a rule-inheritance prefix: keep it.
    const s = '10 月轮表单尚未发布；以下为 8 月轮表单里的说明：截止后多给两天。';
    expect(stripSummary(s, 'conditional')).toBe(s);
  });
});

describe('readings', () => {
  it('labels a reading with its own words and moves common ground after the readings', () => {
    expect(splitReading('严格读法（注册截止前撤）：须在注册截止前撤。')).toEqual({
      label: '严格读法（注册截止前撤）',
      body: '须在注册截止前撤。',
      common: false,
    });
    expect(splitReading('两种读法都要承担的后果：撤稿会公开。').common).toBe(true);
    expect(splitReading('两处一致的部分：正文截止前可以改。').common).toBe(true);
    expect(splitReading('没有冒号的一段话')).toEqual({ label: undefined, body: '没有冒号的一段话', common: false });
  });
});

describe('names', () => {
  it('prints edition ids the way people say them', () => {
    expect(prettyEditionId('cvpr-2026')).toBe('CVPR 2026');
    expect(prettyEditionId('aaai-26')).toBe('AAAI-26');
    expect(prettyEditionId('arr-2026-08')).toBe('ARR 2026 年 8 月轮');
  });

  it('names a series without its year, wherever the year sits', () => {
    const e = (name: string) => ({ id: 'x', series: 'x', name, year: 2027, kind: 'conference', last_checked: '2026-09-25', milestones: [] }) as AppEdition;
    expect(seriesName(e('NeurIPS 2027'))).toBe('NeurIPS');
    expect(seriesName(e('AAAI-27'))).toBe('AAAI');
    expect(seriesName(e('The Web Conference 2027 (WWW 2027)'))).toBe('WWW');
    // VTC2027-Fall is VTC's, not a series called "VTC2027-Fall" (which read "VTC2027-Fall 2027" in rows).
    expect(seriesName(e('VTC2027-Fall'))).toBe('VTC');
    expect(seriesName(e('ECS 2027 Spring'))).toBe('ECS');
    expect(seriesName(e('ASHRAE 2027 Winter Conference'))).toBe('ASHRAE');
  });
});
