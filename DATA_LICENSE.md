# Data

Copyright (c) 2026 Zayier Xie. All rights reserved.

The data this project writes itself — everything under `data/` that is not
listed below, such as rule cards, answers, summaries, explanations, city and
visa files, taxonomies and `data/ranks/mapping.yml` — is proprietary, like the
code (see [LICENSE](LICENSE)). No licence is granted to copy, republish, mirror
or scrape it, in whole or in substantial part.

Not ours, and not restricted by the above:

- **Official quotes** inside rule cards (`quotes[].text`, milestone `quote`,
  and every `quote` under `data/stats/` and `data/topics/`) and the **page
  snapshots** under `snapshots/`. Their copyright belongs to the respective
  conferences and organizers. They are short excerpts kept for citation and
  verification; the snapshots stay in this private repository and are never
  shipped in the app. Organizers who want a quote or snapshot removed can
  write to zayierxie@gmail.com; we act within 72 hours.
- **Third-party data** listed in [NOTICE](NOTICE) (for example rows marked
  `dataset: lixin4ever` in `data/stats/`, dblp titles in `data/topics/`, and
  everything marked `data_level: upstream` or kept in `data/upstream/`, which
  comes from ccfddl). It stays under its own licence, and nothing here limits
  what that licence allows.
- **Rank lists** in `data/ranks/<list>.yml` (CCF, CAAI, CAST): facts extracted
  from lists their issuers publish without an open licence, kept only to
  attach tier labels with a citation. Each file carries its issuer's reuse
  note.

本项目自己整理和编写的数据（`data/` 下除以下几类以外的全部内容，例如规则卡、答案、摘要、说明、城市和签证文件、分类和 `data/ranks/mapping.yml`）与代码一样保留所有权利，未经书面许可不得整体或大量复制、转载、镜像或抓取。

- 卡片中引用的官方原文和 `snapshots/` 下的官网快照，版权归各会议和主办方所有，仅作引用和校验之用；快照只留在私有仓库，不随应用发布。主办方如需删除，请写信到 zayierxie@gmail.com，72 小时内处理。
- `NOTICE` 列出的第三方数据（例如 `data/stats/` 里标 `dataset: lixin4ever` 的行、`data/topics/` 里的 dblp 标题、标 `data_level: upstream` 的 ccfddl 数据）按各自的许可证使用，本声明不限制这些许可证允许的用途。
- `data/ranks/` 下的三份目录（CCF、CAAI、科协）是从发布方的目录里抽出的事实，只用来挂等级标签并注明出处；每个文件写了发布方的转载说明。
