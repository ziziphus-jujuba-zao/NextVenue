# Data

Copyright (c) 2026 Zayier Xie

The data this project writes itself — everything under `data/` that is not
listed below, such as rule cards, answers, summaries, explanations, city and
visa files, taxonomies and `data/ranks/mapping.yml` — is licensed under the
[Creative Commons Attribution-ShareAlike 4.0 International licence](https://creativecommons.org/licenses/by-sa/4.0/)
(CC BY-SA 4.0). When you reuse it, credit "NextVenue（投稿下一站）, Zayier Xie"
with a link to https://github.com/ziziphus-jujuba-zao/NextVenue, say what you
changed, and share your adapted data under the same licence. The code is under
the AGPL (see [LICENSE](LICENSE)).

Not ours, and not covered by the above:

- **Official quotes** inside rule cards (`quotes[].text`, milestone `quote`,
  and every `quote` under `data/stats/` and `data/topics/`) and the **page
  snapshots** under `snapshots/`. Their copyright belongs to the respective
  conferences and organizers. The quotes are short excerpts kept for citation;
  the snapshots are kept only so that anyone can check that each quote appears
  verbatim on the official page (`pnpm check:quotes`), and are never shipped
  in the app. Organizers who want a quote or snapshot removed can write to
  zayierxie@gmail.com; we act within 72 hours.
- **Third-party data** listed in [NOTICE](NOTICE) (for example rows marked
  `dataset: lixin4ever` in `data/stats/`, dblp titles in `data/topics/`, and
  everything marked `data_level: upstream` or kept in `data/upstream/`, which
  comes from ccfddl). It stays under its own licence.
- **Rank lists** in `data/ranks/<list>.yml` (CCF, CAAI, CAST): facts extracted
  from lists their issuers publish without an open licence, kept only to
  attach tier labels with a citation. Each file carries its issuer's reuse
  note.

本项目自己整理和编写的数据（`data/` 下除以下几类以外的全部内容，例如规则卡、答案、摘要、说明、城市和签证文件、分类和 `data/ranks/mapping.yml`）按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans) 授权：转载或改编请署名“NextVenue（投稿下一站），Zayier Xie”并附仓库链接，注明改动，改编后的数据以相同许可证共享。代码按 AGPL 授权，见 LICENSE。

以下几类不归本项目，不在上述授权范围内：

- 卡片中引用的官方原文和 `snapshots/` 下的官网快照，版权归各会议和主办方所有。原文仅作引用；快照只用来让任何人都能复核每条原文确实出自官网（`pnpm check:quotes`），不随应用发布。主办方如需删除，请写信到 zayierxie@gmail.com，72 小时内处理。
- `NOTICE` 列出的第三方数据（例如 `data/stats/` 里标 `dataset: lixin4ever` 的行、`data/topics/` 里的 dblp 标题、标 `data_level: upstream` 的 ccfddl 数据）按各自的许可证使用。
- `data/ranks/` 下的三份目录（CCF、CAAI、科协）是从发布方的目录里抽出的事实，只用来挂等级标签并注明出处；每个文件写了发布方的转载说明。
