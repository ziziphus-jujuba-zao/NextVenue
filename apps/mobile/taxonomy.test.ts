// Copyright (c) 2026 Zayier Xie
// SPDX-License-Identifier: AGPL-3.0-or-later

// 学科 → 方向 as the pickers use it (docs/MOBILE_SPEC.md §9.1): which
// venues a choice of directions lists, how the list is grouped by 学科, and
// the search box. The taxonomy is a slice of data/taxonomy.yml.

import { describe, expect, it } from 'vitest';
import { DEFAULT_FIRST, cleanDirections, defaultPrefs } from './route.ts';
import {
  SEARCH_FROM,
  byDiscipline,
  chosenIn,
  dirCounts,
  dirNames,
  disciplineOf,
  groupByDiscipline,
  groupOf,
  inDirs,
  matches,
  openAtFirst,
  pickDir,
  sameNames,
  search,
  secondName,
  sortDirs,
  taxonomyOf,
  toggleDir,
  type Searchable,
} from './taxonomy.ts';

const TAX = taxonomyOf({
  disciplines: [
    {
      id: 'cs',
      name_zh: '计算机',
      see_also: ['eng/eda'],
      directions: [
        { id: 'cs/ml', name_zh: '机器学习与人工智能', short_zh: '机器学习' },
        { id: 'cs/robotics', name_zh: '机器人' },
        { id: 'cs/theory', name_zh: '理论与形式化', short_zh: '理论形式化' },
      ],
    },
    {
      id: 'eng',
      name_zh: '工程',
      see_also: ['cs/robotics'],
      directions: [
        { id: 'eng/control', name_zh: '控制与自动化', short_zh: '控制' },
        { id: 'eng/av', name_zh: '自动驾驶与智能车', short_zh: '自动驾驶' },
        { id: 'eng/eda', name_zh: 'EDA' },
      ],
    },
    { id: 'med', name_zh: '医学', directions: [{ id: 'med/oncology', name_zh: '肿瘤' }] },
  ],
});

const V = (id: string, name: string, directions: string[], extra: Partial<Searchable> = {}): Searchable => ({ id, name, directions, ...extra });
const NEURIPS = V('neurips', 'NeurIPS', ['cs/ml']);
const HSCC = V('hscc', 'HSCC+ICCPS', ['cs/theory', 'eng/control'], { full_name: 'ACM/IEEE International Conference on Cyber-Physical and Autonomous Systems' });
const CDC = V('cdc', 'CDC', ['eng/control'], { full_name: 'IEEE Conference on Decision and Control' });
const ACC = V('acc', 'ACC', ['eng/control'], { full_name: 'American Control Conference' });
const CCC = V('ccc-control', 'CCC', ['eng/control'], { full_name: 'Chinese Control Conference', name_zh: '中国控制会议' });
const CORL = V('corl', 'CoRL', ['cs/robotics', 'cs/ml', 'eng/av']);
const CAV = V('cav', 'CAV', ['cs/theory', 'cs/se']);
const AACR = V('aacr', 'AACR', ['life/cellmol', 'med/oncology']);
const ALL = [NEURIPS, ACC, HSCC, CDC, CCC, CORL, CAV, AACR];

describe('the taxonomy as the picker reads it', () => {
  it('keeps 学科 and directions in the data order, with chip names and borrowed directions', () => {
    expect(TAX.disciplines.map((d) => d.id)).toEqual(['cs', 'eng', 'med']);
    const eng = TAX.disciplines[1]!;
    expect(eng.directions.map((d) => d.short)).toEqual(['控制', '自动驾驶', 'EDA']);
    // 工程 also lists 机器人: the same direction, so a tap there is the same choice.
    expect(eng.seeAlso.map((d) => d.id)).toEqual(['cs/robotics']);
    expect(TAX.byId.get('cs/robotics')?.short).toBe('机器人');
    expect(disciplineOf('eng/control')).toBe('eng');
    expect(dirNames(TAX, ['cs/ml', 'eng/control'])).toBe('机器学习、控制');
    expect(sortDirs(TAX, ['med/oncology', 'eng/control', 'cs/theory'])).toEqual(['cs/theory', 'eng/control', 'med/oncology']);
  });

  it('counts a choice in every 学科 row that lists its chip and opens those 学科 first (计算机 when nothing is chosen)', () => {
    const [cs, eng] = TAX.disciplines;
    expect(chosenIn(cs!, ['cs/ml', 'cs/robotics', 'eng/control'])).toBe(2);
    // 工程 lists 机器人 under 也看: a chip that is on there counts in its header too.
    expect(chosenIn(eng!, ['cs/robotics'])).toBe(1);
    expect(openAtFirst(TAX, ['eng/control', 'cs/ml'])).toEqual(['cs', 'eng']);
    expect(openAtFirst(TAX, ['cs/robotics'])).toEqual(['cs']);
    expect(openAtFirst(TAX, [])).toEqual(['cs']);
  });

  it('counts the venues each direction lists', () => {
    const n = dirCounts(ALL);
    expect(n.get('eng/control')).toBe(4);
    expect(n.get('cs/theory')).toBe(2);
    expect(n.get('med/cardio')).toBeUndefined();
  });

  it('toggles a direction keeping the order picked, across 学科', () => {
    expect(toggleDir(['cs/ml'], 'eng/control')).toEqual(['cs/ml', 'eng/control']);
    expect(toggleDir(['cs/ml', 'eng/control'], 'cs/ml')).toEqual(['eng/control']);
    // Stored v0.3 ids read as taxonomy ids; unknown ids go.
    expect(cleanDirections(['ml', 'eng/control', 'eng/nope'], TAX.known)).toEqual(['cs/ml', 'eng/control']);
  });
});

describe('the preselected 机器学习 on first run', () => {
  const start = { dirs: ['cs/ml'], defaulted: true };

  it('gives way to the first other chip: a control PhD gets 控制 alone, and no 首选 prefilled', () => {
    const c = pickDir(start, 'eng/control');
    expect(c).toEqual({ dirs: ['eng/control'], defaulted: false });
    expect(defaultPrefs(c.dirs, new Set(['neurips', 'iclr', 'icml', 'cdc']))).toEqual({ first: [], backup: [] });
    // An oncology researcher likewise.
    expect(pickDir(start, 'med/oncology').dirs).toEqual(['med/oncology']);
  });

  it('prefills an NLP student with ACL, EMNLP, NAACL, not ML venues', () => {
    const c = pickDir(start, 'cs/nlp');
    expect(c.dirs).toEqual(['cs/nlp']);
    expect(defaultPrefs(c.dirs, new Set(['neurips', 'iclr', 'icml', 'acl', 'emnlp', 'naacl'])).first).toEqual(DEFAULT_FIRST['cs/nlp']);
    expect(DEFAULT_FIRST['cs/nlp']).toEqual(['acl', 'emnlp', 'naacl']);
  });

  it('turns off on its own chip, and after the first tap chips toggle as usual', () => {
    expect(pickDir(start, 'cs/ml')).toEqual({ dirs: [], defaulted: false });
    const c = pickDir(pickDir(start, 'eng/control'), 'cs/theory');
    expect(c.dirs).toEqual(['eng/control', 'cs/theory']);
    // A user who picked 机器学习 themselves (not the default) keeps it when adding more.
    expect(pickDir({ dirs: ['cs/ml'], defaulted: false }, 'cs/nlp').dirs).toEqual(['cs/ml', 'cs/nlp']);
  });
});

describe('venues for a choice of directions', () => {
  it('lists a venue under any of its directions', () => {
    expect(ALL.filter((s) => inDirs(s, ['eng/control'])).map((s) => s.id)).toEqual(['acc', 'hscc', 'cdc', 'ccc-control']);
    expect(ALL.filter((s) => inDirs(s, ['cs/theory'])).map((s) => s.id)).toEqual(['hscc', 'cav']);
  });

  it('files a two-学科 venue under the 学科 the user chose it by, in the order they picked', () => {
    expect(groupOf(HSCC, ['eng/control'])).toBe('eng');
    expect(groupOf(HSCC, ['cs/theory', 'eng/control'])).toBe('cs');
    // 控制 picked before 理论形式化: HSCC+ICCPS is a control venue for this user.
    expect(groupOf(HSCC, ['eng/control', 'cs/theory'])).toBe('eng');
    expect(groupOf(CORL, ['eng/av'])).toBe('eng');
    expect(groupOf(HSCC, [])).toBe('cs');
  });

  it('groups by 学科 only when the directions span several, keeping each group in list order', () => {
    const control = ALL.filter((s) => inDirs(s, ['eng/control']));
    const one = groupByDiscipline(control, ['eng/control'], TAX);
    expect(one).toHaveLength(1);
    expect(one[0]!.discipline).toBeUndefined();

    const dirs = ['eng/control', 'cs/ml'];
    const both = groupByDiscipline(ALL.filter((s) => inDirs(s, dirs)), dirs, TAX);
    // 工程 before 计算机 (the order the user picked), HSCC+ICCPS under 工程 (chosen by control), CoRL under 计算机.
    expect(both.map((g) => [g.discipline?.name, g.items.map((s) => s.id)])).toEqual([
      ['工程', ['acc', 'hscc', 'cdc', 'ccc-control']],
      ['计算机', ['neurips', 'corl']],
    ]);
    expect(groupByDiscipline([], dirs, TAX)).toEqual([]);
  });

  it('files every other venue under its main 学科, in taxonomy order', () => {
    expect(byDiscipline([AACR, CDC, NEURIPS, HSCC], TAX).map((g) => [g.discipline?.id, g.items.map((s) => s.id)])).toEqual([
      ['cs', ['neurips', 'hscc']],
      ['eng', ['cdc']],
      [undefined, ['aacr']],
    ]);
  });
});

describe('the venue search box', () => {
  it('shows above 20 venues', () => {
    expect(SEARCH_FROM).toBe(20);
  });

  it('matches name, id, full name, Chinese name and direction, ignoring case, spaces and punctuation', () => {
    expect(matches(HSCC, 'hscc')).toBe(true);
    expect(matches(HSCC, 'hscc iccps')).toBe(true);
    expect(matches(HSCC, 'cyber-physical')).toBe(true);
    expect(matches(CCC, '中国控制')).toBe(true);
    expect(matches(CDC, 'decision and control')).toBe(true);
    expect(matches(CDC, '控制')).toBe(false);
    expect(matches(CDC, '控制', TAX)).toBe(true);
    expect(matches(NEURIPS, '')).toBe(true);
    expect(matches(NEURIPS, 'icml')).toBe(false);
  });

  it('matches a full name by word starts, never across words; and former names', () => {
    const EUROGP = V('eurogp', 'EuroGP', ['cs/ml'], { full_name: 'European Conference on Genetic Programming' });
    // "ICPR" is not "genet-ic pr-ogramming".
    expect(matches(EUROGP, 'icpr')).toBe(false);
    expect(matches(EUROGP, 'genetic prog')).toBe(true);
    const H = { ...HSCC, aliases: ['HSCC', 'International Conference on Hybrid Systems: Computation and Control'] };
    expect(matches(HSCC, 'hybrid systems')).toBe(false);
    expect(matches(H, 'hybrid systems')).toBe(true);
    expect(search([NEURIPS, H], 'hscc').map((s) => s.id)).toEqual(['hscc']);
    expect(matches(CCC, '控制')).toBe(true);
  });

  it('puts name hits before full-name hits', () => {
    // "acc": ACC by name; CCC and CDC do not contain it; none of the others either.
    expect(search(ALL, 'acc').map((s) => s.id)).toEqual(['acc']);
    // "control": no name has it; the full names in list order (ACC, CDC, CCC).
    expect(search(ALL, 'control').map((s) => s.id)).toEqual(['acc', 'cdc', 'ccc-control']);
    // "c": names starting with it first (CDC, CCC, CoRL, CAV), then names containing it (ACC, HSCC+ICCPS, AACR…).
    expect(search(ALL, 'c').slice(0, 4).map((s) => s.id)).toEqual(['cdc', 'ccc-control', 'corl', 'cav']);
    expect(search(ALL, '').map((s) => s.id)).toEqual(ALL.map((s) => s.id));
  });
});

describe('venues that share an acronym', () => {
  const CCC_CT = V('ccc', 'CCC', ['cs/theory'], { full_name: 'Computational Complexity Conference' });

  it('are found, and each gets a second name', () => {
    const same = sameNames([CCC, CCC_CT, CDC]);
    expect([...same]).toEqual(['ccc']);
    expect(secondName(CCC, true)).toBe('中国控制会议');
    expect(secondName(CCC_CT, true)).toBe('Computational Complexity Conference');
    // Without a clash only a Chinese name is added.
    expect(secondName(CDC, false)).toBeUndefined();
    expect(secondName(CCC, false)).toBe('中国控制会议');
    // Publisher prefixes go: "ACM/IEEE International Conference on …" reads from "International".
    expect(secondName(HSCC, true)).toBe('International Conference on Cyber-Physical and Autonomous Systems');
  });
});
