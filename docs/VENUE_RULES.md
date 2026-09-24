# NextVenue 会议规则知识库（VENUE_RULES）

> 本文件的规则于 2026-09-24 逐条对照官方来源（CFP、作者指南、FAQ、OpenReview / PaperCept 表单与配置、官方博客）核对，并经过一轮挑错式复核；二手来源一律不用。
> **"未规定"表示官方来源对此没有说法。不要拿其他会议或往年的规则去填这个空。**
> 规则随时会改。撤稿、改作者、转投之前，先回到对应官方页面重新确认。

**图例**

- 答案标签：**必须 / 允许 / 不允许 / 有条件 / 未规定 / 不要求**，分别对应核对表的 `required / allowed / not_allowed / conditional / unspecified / not_required`。
- 置信度：高 / 中 / 低。速查表里，依据是低置信度规则的格子标"（待核）"。
- **†** 表示官方来源彼此矛盾，细节见第 3 节该会议末尾的"官方来源矛盾与注意事项"。
- 日期、时间、数字都按官方原文的英文写法保留，时区以原文为准（AoE、UTC、PST/PT、CET/CEST、EST 等）。
- 届次：ICML、ECCV、IJCAI-ECAI、IROS、CoRL 用的是 2026 这一届（周期已结束或下一届 CFP 未出）；CVPR 2027 大部分细则沿用 2026 规则（2027 Author Guidelines 仍是 404），表中标 "2026"。

**目录**

1. [速查表一：作者名单与投稿内容能改什么](#1-速查表一作者名单与投稿内容能改什么)
2. [速查表二：上限、审稿、rebuttal、撤稿、arXiv、参会](#2-速查表二上限审稿rebuttal撤稿arxiv参会)
3. [逐会议规则](#3-逐会议规则)
4. [更多常见规则问题](#4-更多常见规则问题)
5. [数据结构建议](#5-数据结构建议)

## 1. 速查表一：作者名单与投稿内容能改什么

"摘要截止"对 CVPR、ECCV 指论文注册截止（paper registration deadline）；ARR、ICRA、IROS 没有单独的摘要注册，只有一个投稿截止。

| 会议 | 作者名单何时冻结（增删） | 顺序能否改 | 摘要截止后标题/摘要能否改 | 截稿后 PDF 能否改 | camera-ready 能改什么 |
|---|---|---|---|---|---|
| **NeurIPS 2026** | 摘要截止（May 4, 2026 AoE）冻结，此后任何阶段都不能增删，无例外流程 | camera-ready 可自由调序；正文截止到 camera-ready 之间未写明 † | 摘要截止到正文截止之间 2026 未规定（表单未标冻结）；author response 期间不能改 | 不能；正文截止（May 6）后直到 camera-ready | 标题、摘要（handbook 还写了关键词）可改但不得实质不同；可调序，不可增删；正文 10 页 |
| **ICLR 2027** | 摘要截止（Sep 18, 2026 AoE）冻结，'no exceptions whatsoever' | 可改到正文截止（Sep 25）；讨论期能否改 †；camera-ready 2027 未规定 | 可改到 Sep 25，但不得 'read like a different paper'；Sep 25 到 Nov 5 冻结；Nov 5-18 摘要可随修订改，标题 † | Sep 25 到 Nov 5 冻结；Nov 5-18 可多次上传修订版（10 页） | 2027 指南未规定（说明 mid-February 2027 发布）；10 页；作者增删的总禁令没有结束日期 |
| **ICML 2026** | 摘要截止（Jan 23, 2026 AoE）冻结；CFP 名义上可书面申请，FAQ 称一律未批准 † | 摘要截止后可调，camera-ready 也可 | 可改到正文截止（Jan 28），占位摘要被大改有 desk reject 风险 | 不能；审稿、rebuttal、讨论期都不能改 | 核心内容不变前提下可改进；标题摘要只能小改（大改需 PC 批准）；9 页；须加 lay summary；可调序，不可增删 |
| **CVPR 2027**（多为 2026 规则） | 论文注册截止（Nov 10, 2026 AOE）冻结，无例外 | 可改到正文截止（Nov 16）；录用后能否调序 † | 可改到正文截止（Nov 16） | 不能；补充材料（至 Nov 23）不得含修正版论文 | 标题、摘要未规定；不可增删 |
| **ECCV 2026** | 论文注册截止（Feb 26, 2026, 11:00 PM CET）冻结，任何理由都不受理 | 可改到投稿截止（Mar 5）；政策称此后不可，但 Jun 23 公告允许在 camera-ready PDF 调序、换通讯作者 † | 可改到 Mar 5 | 不能；补充材料（至 Mar 12）不得含修正版 PDF | 标题须与审稿时一致（审稿要求的调整除外）；内容只按审稿人/AC 要求调整；可调序；不可增删；15 页（不含参考文献） |
| **AAAI-27** | 正文截止（Jul 28, 2026 AoE）冻结；Jul 21 到 Jul 28 仍可增删 † | 可改到 Jul 28；camera-ready 未规定（AAAI-26 明确禁止） | Jul 21 到 Jul 28 可编辑但不得实质改变；之后到通知都不能改 | Jul 28 后不能；Jul 28 到 Jul 31 只能改补充材料 | 可在 camera-ready 网站申请改标题；摘要未规定；作者 'cannot be added or deleted under any circumstances'；7+2 页，可买 2 页（$300/页） |
| **IJCAI-ECAI 2026** | Author Information 截止，即正文截止（Jan 19, 2026）冻结 | 主会 camera-ready 期间可调；审稿期间未规定；AI and Health track 连顺序也冻结 † | 到 Jan 19 可 'minor edits' | 不能（从截止结构推断） | 可调序，不可增删；标题摘要未规定；7+2 页，可买 2 页（USD 300/页） |
| **ARR 2026** | 投稿即冻结（不晚于本轮截止，如 Oct 12, 2026 AoE）；只能在下一轮重投时附理由加人；删人须走 ACL 审批 | ARR 称投稿即定；commit 时可改顺序；决定后到 camera-ready 可调其他作者；一作永不可换 † | 截止前随意改；截止后只有元数据宽限期（表单写 'two extra days'，10 月轮未确认） | 不能；只能到下一轮重投 | 多 1 页（9 或 5 页）；EMNLP 2026 可在 camera-ready 表单改标题；按 ACL 政策可删人、调序（一作除外） |
| **ICRA 2027** | 未规定；首次提交（Sept 16, 2026）须录入全部作者 PIN | 未规定 | 未规定 | 不能；Sept 16 后只能补传视频（至 Sept 22）；终稿 Feb 6 - Mar 6, 2027 | 2027 终稿说明未发布；PaperCept 通用手册称终稿可更新标题、作者、摘要（视会议设置） |
| **IROS 2026** | 未规定（待核）；实际最后机会是终稿（PaperCept Jul 27 与网站 Jul 16 不一致 †） | 未规定；通用手册要求终稿顺序与 PDF 一致（待核） | Mar 2 到 Mar 5 宽限期可 'modify'，具体字段未公布（待核） | 可在 3 天宽限期内更新到 Mar 5；之后只有录用论文的终稿 | 通用手册称可更新标题、作者、摘要（待核） |
| **CoRL 2026** | 摘要截止（May 25, 2026 AoE）冻结；可邮件 OpenReview Chair 申请例外 | 不能（表单说作者名单不可改，推定含顺序） | 摘要截止后可改，何时截止未规定 | 不能；rebuttal 期间也不能改 † | 9 页；OpenReview 标题须与 PDF 一致；作者增删未规定 |
| **KDD 2027** | 摘要截止（Jul 19, 2026 AoE）冻结，连顺序一起，无例外 | 摘要截止后不能改 | 小改可以（隐含），大改可能 desk reject | 正文截止后未明确，推断不能（待核） | 12 页（9 页正文）；标题摘要未规定；作者不能改 |

## 2. 速查表二：上限、审稿、rebuttal、撤稿、arXiv、参会

| 会议 | 每人投稿上限 | 作者须审稿 | rebuttal 能否传新 PDF 或新实验 | 撤稿与公开 | arXiv 规则 | 必须现场参会 |
|---|---|---|---|---|---|---|
| **NeurIPS 2026** | 无上限（未规定）；署名 4 篇及以上自动登记为审稿人 | 必须：每篇提名一位合格作者审稿人（约 4 篇）；严重失职可 desk reject | 不能传任何文件或修订 PDF；每条 10,000 字符；可给新结果；不能放链接（审稿人要代码时可给 AC 匿名链接） | 审稿过程中随时可撤；撤稿不公开（据配置推断）；被拒论文通知后两周内 opt-in 才公开 | 允许，未规定禁发期；模板须用 preprint 选项，不得写 'Under review at NeurIPS'；高调宣传可能算违规 | 必须：至少一位作者注册（非 Virtual Only Pass）并在主会场或卫星会场现场报告，否则可撤销录用 |
| **ICLR 2027** | 每人 20 篇；每人最多参与 1 篇无合格互审作者的论文；超限随机 desk reject | 必须：投 3 篇及以上审至少 6 篇；每篇至少一位合格作者审至少 3 篇 | 没有单独的 rebuttal PDF，但 Nov 5-18 可不限次上传修订版（10 页）；审稿人可要求范围有限的补充实验 | 通知（Dec 16, 2026）前随时可撤；正文截止前撤会被删除，之后撤稿立即公开并去匿名；所有论文通知后去匿名公开 | 允许，审稿期间也可；社交媒体未规定 | 至少一位作者须持 'Conference and Workshops' 注册；是否须现场 2027 未规定（2026 要求） |
| **ICML 2026** | 无上限；投 4 篇及以上须当审稿人；一人最多为 2 篇当互审审稿人 | 必须：每篇指定合格互审审稿人（约 5-6 篇）；497 篇因互审人违反 Policy A 被 desk reject | 不能传修改版 PDF（含修改段落的 PDF 会被忽略）；每条 5000 字符；链接须匿名，主要放图表 | 可撤，截止未规定；撤稿和 desk reject 不公开（配置）；被拒论文 opt-in 公开；录用论文强制公开原稿与审稿 | 允许，无匿名期；审稿期间不得宣传为 ICML 投稿（含社交媒体） | 不必须：可选 proceedings-only（Conference 或 Virtual Pass 注册即可） |
| **CVPR 2027** | 2026 为每人 25 篇，超出 desk reject；2027 未公布 | 必须：所有作者受邀即须担任审稿人/AC/SAC；迟交或不负责审稿可致本人论文 desk reject（2026） | 一页 PDF（2026）；不能附修改稿；新结果不鼓励（除非被要求）† | 撤稿截止与流程未规定；撤稿、被拒论文和审稿都不公开 | 允许（2026）；不得称 'under submission to CVPR'；录用前不得与媒体讨论 | 必须（2026）：至少一位作者注册并报告；无法出行可线上，但仍付作者注册费 |
| **ECCV 2026** | 未规定 | 必须：所有作者自动进审稿池（有豁免）；迟交或 'highly irresponsible' 审稿可致本人全部论文 desk reject | 一页两栏 PDF（含参考文献）；不能改 PDF、不能改或加代码；尽量不加新贡献或新结果（尤其审稿人没要求时） | 撤稿截止与流程未规定；撤稿不公开（配置）；审稿永不公开 | 允许，但不得标为 ECCV 投稿；Jan 29, 2026 到 Jun 17, 2026 有媒体禁令 | 每篇须一个 full 注册（非学生、非线上）；期望现场报告，无人到场且未说明可能被移出论文集 |
| **AAAI-27** | 10 篇（技术 track；是否含 AI Alignment、AISI 两份文件说法不同 †） | 必须：合格作者都须可审；每篇提名一位合格作者审至多 6 篇 | 未规定（只定了 Oct 19-25, 2026 窗口；AAAI-26 的 2500 字符、无链接、无新结果未确认沿用） | 可撤，撤稿不可撤回；撤稿不公开（配置）；被拒论文公开与否未规定 | 允许；投稿不得引用公开版，公开版不得说投了 AAAI-27 | 必须：至少一位作者以现场价注册并现场报告，无线上报告 |
| **IJCAI-ECAI 2026** | 每人 8 篇（PPI 覆盖的 track）；Survey、Human-Centred AI、AI and Health 各 1 篇；非 primary 论文每篇 USD 100 | 所有作者进审稿池；官方未规定失职的 desk reject 处罚 | 一页 PDF 模板；不能加新实验、代码链接或上传；可加解释性图或例子；没有修改版 PDF | 有撤稿（S4 情形下必须撤）；一般截止未公布；撤稿、被拒论文及审稿都不公开 | 允许，未规定匿名期；投稿本身须完全匿名 | 必须：Bremen 现场报告，无混合；无人报告则移出论文集 |
| **ARR 2026** | 自 2026 年 10 月轮起每轮 20 篇，其中一作（含共同一作）5 篇；之前的轮次无上限 | 必须：自 10 月轮起每篇一名合格 service contributor（一人最多 2 篇），否则进抽签 | 纯文本评论；带外链即 desk reject；不能传修改版 PDF；新结果只限回答审稿人问题的小补充 | 随时可撤；截止 48 小时后撤稿须隔一轮才能重投；撤稿和 desk reject 不公开（配置）；审稿永不公开 | 允许，无匿名期；须在表单声明预印本状态，选了"不发非匿名预印本"就要守到 meta-review 发布 | 须报告（现场或线上）才能进论文集；EMNLP 2026 未按时注册的论文被移出 |
| **ICRA 2027** | 未规定（RAS 自 Jan 1, 2026 起跟踪审稿与投稿之比，将来可能限投） | 不要求（期望每投 1 篇审 1 篇，目前仅作提醒） | 未规定：ICRA 2027 来源未提及 rebuttal 阶段，时间线从审稿直接到通知 | 撤稿截止和可见性都未规定 | 允许，只要未同时投别处；社交媒体未规定 | 必须：只能现场报告，无人到场按 no-show 处理 |
| **IROS 2026** | 未规定（同 RAS 跟踪） | 不要求（强烈鼓励） | 不允许：没有 rebuttal 阶段 | 未规定（待核） | 允许；社交媒体未规定 | 必须：作者或 knowledgeable proxy 现场报告；不能出行的可申请录播或文字答疑 |
| **CoRL 2026** | 未规定；投 3 篇及以上须审稿；近重复多投可致其全部论文 desk reject † | 必须：每篇指定至少一位合格作者审稿 | 一页匿名 PDF 模板；不能改论文、不能外链；2026 未禁止新实验（2025 禁止） | 可撤（据配置，作者页未提）；撤稿和被拒论文都不公开；录用论文公开审稿与 rebuttal | 允许此前以技术报告（如 arXiv）形式出现过的论文；审稿期间发帖和社交媒体未规定 | 须一位作者 full 注册；是否必须现场报告未规定 |
| **KDD 2027** | Research track 每人每轮 7 篇，超出部分按 submission id desk reject | 必须：每篇提名一位合格作者审稿人；迟交则本人和合作者看不到自己论文的审稿 | 回应每条审稿；不允许超链接；新 PDF、长度、新实验都未规定 | 随时可撤；审稿发布后撤稿须等 12 个月；撤稿不公开（配置）；被拒论文公开与否未明确（待核） | 允许，已有预印本也可投且无须引用；审稿期间发帖未规定 | 必须（'planned to be' 全现场）：每篇单独一个非学生全额注册；无人到场可能被撤出 |

## 3. 逐会议规则

每个会议先给届次（`edition_used`）和投稿系统（`submission_system`），再逐条列规则：中文问题、答案与细节、置信度、来源链接；原文引文较短（不超过 200 个字符）时附上英文原句。rule id 与 `rules_matrix.json` 一致；除 21 条通用规则外，个别会议还有专门补充的规则（标"会议特有"）。最后是"较去年变化"和"官方来源矛盾与注意事项"。

### 3.1 NeurIPS 2026

> NeurIPS 2026 (Main Track; Sydney main site Dec 6-12, with official satellites in Atlanta Dec 8-13 and Paris Dec 9-13, 2026)

- **届次（edition_used）：** NeurIPS 2026。来源：CFP、Main Track Handbook V2026.3、Dates page、OpenReview Submission invitation 及 venue group 设置、2026 博客（Mar 23 的 AC 试点；Apr、May、Jun、Jul 和 Aug 的 newsletter；Aug 27 的多会场注册文章）、AI-reviewing-experiment page 以及 NeurIPS 通用 FAQ。2025 CFP、2025 author FAQ、2025 LLM policy 和 2025 投稿表单仅用于与去年对比。没有 2026 author FAQ 或 LLM 页面（两个 URL 均返回 404），Dates page 也尚未列出 camera-ready 截止日期。
- **投稿系统（submission_system）：** OpenReview (https://openreview.net/group?id=NeurIPS.cc/2026/Conference)。新投稿表单：截止 May 5, 2026 11:59 UTC（= May 4 AoE），12:29 UTC 失效。会议完整投稿截止：May 7, 2026 11:59 UTC（= May 6 AoE）。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。摘要（连同标题、全部作者、领域、contribution type 和审稿人提名）截止于 May 4, 2026 AoE。在 OpenReview 上，新投稿 invitation 截止于 May 5 11:59 UTC，并于 12:29 UTC 失效，此后无法再创建新投稿。正文截止为 May 6 AoE。2026 年文件对占位摘要未规定；2025 CFP 曾警告占位摘要 'risk being removed without consideration'。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/CallForPapers>
- 原文："Abstract submission deadline: May 4, 2026 (AOE). All authors must have an OpenReview profile when submitting"

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。摘要截止至正文截止之间（May 4-6）：2026 年文件未规定。与领域、contribution type 和审稿人提名不同，表单上的标题字段未被标注为冻结。审稿期间，handbook 禁止在 author response 期间修改论文，且没有任何来源提供在 camera-ready 之前修改的途径。camera-ready 时，只要与原稿无实质差异，可修改标题；camera-ready 日期尚未公布。
- 置信度：中｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："The Camera Ready file can make edits to the title, keywords and the abstract, as long as they do not substantially differ from the original submission."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要截止至正文截止之间：2026 年未规定，表单上的摘要字段也未被标注为冻结（2025 明确允许修改至正文截止）。author response 期间不得修改。camera-ready 时，只要与原稿无实质差异，可修改摘要。
- 置信度：中｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："The Camera Ready file can make edits to the title, keywords and the abstract, as long as they do not substantially differ from the original submission."

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。所有作者必须在摘要截止 May 4, 2026 AoE（OpenReview May 5 11:59 UTC）前录入。此后任何阶段（包括 camera-ready）均不能添加作者。每位作者还必须拥有 OpenReview profile。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："All author names must be entered into the submission form by the abstract submission deadline. After this, no changes can be made, except to the author order."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。只能在摘要截止 May 4, 2026 AoE 之前删除作者。此后任何阶段均不允许删除，camera-ready 规则也重申了这一点。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："You can reorder the author lists freely, but we will not allow additions nor removal of authors."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**允许**。摘要截止后，调整作者顺序是唯一允许的作者列表变更，且在 camera-ready 时明确允许 'freely' 调整。2026 handbook 未规定正文截止至 camera-ready 之间是否可以调整顺序。其相关语句表述混乱（'If/when your paper is accepted, but we will not allow additions nor removal of authors'），而 2025 将调整顺序限定在投稿截止前和 camera-ready 时。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："All author names must be entered into the submission form by the abstract submission deadline. After this, no changes can be made, except to the author order."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**不允许**。作者名单在摘要截止 May 4, 2026 AoE（OpenReview May 5 11:59 UTC）时冻结；此后只能调整顺序，包括 camera-ready 时。官方未规定任何例外或申请流程，也未规定具体处罚。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："All author names must be entered into the submission form by the abstract submission deadline. After this, no changes can be made, except to the author order."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**不允许**。primary area（可多选）、secondary area、contribution type 和审稿人提名均被标注为 May 4 AoE 之后不可更改；领域和 contribution type 用于匹配。2026 表单没有 keywords 字段，但 handbook 仍称 camera-ready 时可修改 keywords。不能切换 track 或类型。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=NeurIPS.cc/2026/Conference/-/Submission&expired=true>
- 原文："[Note: cannot be changed after May 4th AOE, will be used for matching] Please indicate the primary subject areas (you can choose more than 1) that best describe the paper."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。单一 PDF（正文部分、参考文献、附录和 checklist）只能在正文截止 May 6, 2026 AoE（OpenReview May 7 11:59 UTC）之前更新。之后没有补充材料窗口。handbook 禁止在 author response 期间修改论文或补充材料；下一次修改即 camera-ready（10 页内容页）。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=NeurIPS.cc/2026/Conference/-/Submission&expired=true>
- 原文："The paper PDF can be updated until the full paper submission deadline."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料与正文同时截止，即 May 6, 2026 AoE，没有单独截止日期。补充材料为一个匿名化压缩包（zip/tgz/gz，最大 100MB），用于代码或数据；文字形式的附录必须放在主 PDF 中。视频未规定（未提及）。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=NeurIPS.cc/2026/Conference/-/Submission&expired=true>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。正文限 9 页内容页，含图和表。参考文献、附录和必需的 checklist 不计入，缺少 checklist 即 desk reject。camera-ready 可增加一页（10），文件大小上限为 50MB，违反格式或页数限制可能被 desk reject。'broader impacts' 部分为可选，但任何此类讨论都计入页数限制。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。CFP、handbook 和投稿表单均未规定每位作者的投稿数量上限。在 4 篇或以上论文中署名为作者的人会被自动登记为审稿人，除非其已担任审稿人、AC、SAC 或组织者（organizer）。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=NeurIPS.cc/2026/Conference/-/Submission&expired=true>

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。每篇投稿必须提名至少一名合格的作者审稿人（author-reviewer；至少 2 篇一作或 5 篇合著的 archival 论文），该作者承诺完成约 4 篇审稿；提名在 May 4 AoE 之后不可更改，未提名一位可用的合格作者可能导致 desk reject。逾期的审稿人作者和 AC 作者将无法查看自己论文的审稿意见（最长至 rebuttal 结束前 2 天）。严重失职的审稿人作者（在 meta-review 阶段）和 AC 作者（meta-review 之后的阶段）的论文可能被 desk reject。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=NeurIPS.cc/2026/Conference/-/Submission&expired=true>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。每位作者都须在摘要截止 May 4, 2026 AoE 前拥有有效且最新的 OpenReview profile（全部发表论文、当前单位、利益冲突）；profile 未妥善更新有被 desk reject 的风险。域名冲突依据 Education & Career History 中最近 3 年的记录判定。没有机构邮箱的新 profile 审核可能需要长达 2 周，April newsletter 表示，对截止前不足 2 周创建的账户不予例外。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："All authors, reviewers, ACs, and SACs will need an active OpenReview profile by the abstract submission deadline."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。非匿名预印本（arXiv、个人网站、社交媒体）不会导致拒稿，禁发期（embargo）未规定。使用 NeurIPS 模板的预印本必须使用 'preprint' 选项，且不得写明 'Under review at NeurIPS'。对在审论文进行激进宣传可能被视为违反双盲规定。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："Note: While having a nonanonymized preprint alone is not a violation of the double-blind reviewing policy, aggressive advertising of papers under submission may be deemed a violation."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。允许非 archival 的 workshop 版本。作者有重叠的其他 archival 投稿被视为先前工作（prior work），两者都可能被拒；这包括 thin slicing（切片式拆分发表）以及同时投 main track 和 E&D track。在 NeurIPS 审稿期间将该工作投往其他 archival venue 被明确禁止，任何时候都可能被 desk reject。对此前在别处被拒的论文未规定。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："The reviewing process will treat any other archival submission by an overlapping set of authors as prior work (dual submissions to nonarchival workshops are permitted)."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。审稿意见于 Jul 22, 2026 AoE 发布，rebuttal 和评论可发布至 Aug 3 AoE。July newsletter 将 Jul 27-Aug 3 称为 author response 时间，并要求作者自 Jul 28 起通过评论回复初始 AC meta-review（meta-review 的发布日期未公布）。每条回复限 10,000 字符，可用纯文本或 markdown，不能上传文件，也不能提交修改后的 PDF 或补充材料，但允许多条评论合计超过 10,000 字符。允许提供新结果；不允许附链接，唯一例外是审稿人要求代码时，通过 Official Comment 向 AC 发送匿名化代码链接。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："The per-review rebuttal limit is 10,000 characters. You may use plain text with markdown formatting supported by OpenReview, but you cannot upload any additional files."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。在审稿流程中的任何时候都可以撤稿；handbook 对决定公布后的撤稿未规定。handbook 对可见性未规定。会议的 OpenReview 配置（`public_withdrawn_submissions=false`、`withdrawn_submission_reveal_authors=false`）表明撤稿论文保持不公开，且不公开作者姓名，但这是根据设置推断的，并非明文政策。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："Please note that you can withdraw your submission at any point in the reviewing process."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**有条件**。仅限 opt-in。对于录用论文，审稿意见、meta-review 和讨论会公开，审稿人、AC 和 SAC 身份保持匿名。被拒论文保持不公开，除非作者在通知后两周内 opt-in（通知日期为 Sep 24, 2026 AoE，因此约为 Oct 8, 2026 AoE，此为推算日期）。opt-in 的论文将以去匿名（公开作者姓名）形式显示为被拒，且不计为 NeurIPS 发表。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："Authors of rejected papers will have two weeks after the notification date to opt in to make their deanonymized rejected papers public in OpenReview."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。作者可使用任何工具。当 agent 或 LLM 的使用是方法中重要、原创或非标准的组成部分时，必须在实验设置部分（或同等部分）加以说明；拼写/语法检查、编辑帮助和基础代码辅助无需说明。作者对全部内容负完全责任（幻觉引用违反 Code of Conduct），agent 和 LLM 不能作为作者，投稿表单包含一份保密的 LLM 使用情况调查，严禁 prompt injection 或其他操纵审稿的行为。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："Finally, we note that attempts at prompt injections as well as other attempts to manipulate reviewing is strictly prohibited."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇录用论文至少须有一位作者注册主会（Virtual Only Pass 不算；学生注册即可；一个注册可覆盖多篇论文），poster 必须在主会场或卫星会场展示，但在严重的特殊情况下允许由他人代为展示。每篇论文为其指定报告人提供一个有保障的注册名额，与分配的会场绑定；会场偏好表（site preference form）截止于 Sep 30 AoE，分配结果于 Oct 6 17:00 UTC 公布，分配最终确定后报告人和会场即被锁定。早鸟注册于 Oct 30 AoE 截止，退款截止为 Nov 4 AoE；作者注册截止日期未公布，但若无作者注册并亲自到场报告，录用可能被撤销；oral 报告缺席者可能被降级或撤销录用。
- 置信度：高｜来源：<https://neurips.cc/Conferences/2026/MainTrackHandbook>
- 原文："We reserve the right to revoke accepted publication status if no authors registered and presented the paper in the conference in person in our official locations."

#### 较去年变化（changes_vs_previous_year）

- 截止日期：摘要截止 May 4，正文截止 May 6, 2026 AoE（相隔 2 天）。2025 年分别为 May 11 和 May 15（相隔 4 天）。
- 单独的补充材料/附录截止已取消（2025: May 22）。补充材料现在与正文同时截止，文字附录必须放在主 PDF 中；2025 允许在 ZIP 中附带附录 PDF。
- OpenReview profile 现在必须在摘要截止前处于有效且最新状态；2025 年在正文截止前满足即可。
- 新增投稿字段：可多选的 primary area、secondary area 以及 Contribution Type（General、Theory、Use-Inspired、Concept & Feasibility、Negative Results）。这些字段和审稿人提名均被标注为 May 4 AoE 之后不可更改，keywords 字段已被移除。
- 2026 handbook 不再像 2025 FAQ 那样将作者顺序调整限定在 'before the submission deadline'；2026 年的相关语句表述混乱。摘要截止后仍禁止添加和删除作者。
- 互审（reciprocal reviewing）：被提名的作者审稿人承诺审约 4 篇论文（2025: 约 6 篇）。资格门槛（至少 2 篇一作或 5 篇合著的 archival 论文）现已在表单上写明，署名 4 篇或以上论文的作者仍会被自动登记为审稿人。
- 负责任审稿规则现在也适用于 AC 作者：在其完成 meta-review 之前，其自己论文的审稿意见和 meta-review 将被扣留，其论文可能被 desk reject。新增初始 AC meta-review，在 author response 之前发出。
- LLM 政策移入 handbook，并扩展到 agent。新明确禁止 prompt injection 及其他操纵审稿的行为，并写明幻觉引用违反 Code of Conduct；2025 已将未经核实的 LLM 生成参考文献列为违规示例。
- 新增可选作者工具：Google Paper Assistant Tool 反馈（一个 voucher，截至 May 4）以及 opt-in 的 AI 辅助审稿实验。未 opt-in 的作者不能以审稿人身份参与该实验。
- 2025 CFP 中关于占位摘要的警告，以及标题和摘要可修改至正文截止的说明，均未出现在 2026 年文件中。
- rebuttal 说明（July 2026 newsletter）：'rebuttal' 和 'official comment' 按钮同等对待，允许多条评论合计超过 10,000 字符，回复可发布至 Aug 3 AoE。
- 多会场形式扩大。2025 使用 San Diego 加 Mexico City 试点；2026 以 Sydney 为主会场，并在 Atlanta 和 Paris 设官方卫星会场。每篇录用论文为指定报告人提供一个有保障的注册名额，与分配的会场绑定（偏好表截止 Sep 30，分配结果 Oct 6），分配最终确定后报告人和会场不可更改。
- 录用的 main track 论文作者现在被要求上传 lay summary（通俗摘要）；2025 CFP 仅对 position track 提及。camera-ready 现在除 2025 已要求的资助声明外，还要求披露竞争利益（competing interests）。
- Datasets & Benchmarks 更名为 Evaluations & Datasets。不能切换 track 和类型，重复投稿有被所有 track desk reject 的风险。
- 同期工作（contemporaneous work）的截止日期改为 March 1, 2026。

#### 官方来源矛盾与注意事项

- **作者顺序：** 2026 handbook 的相关句子是残缺的（'If/when your paper is accepted, but we will not allow additions nor removal of authors'），只明确允许在 camera-ready "freely" 调序。正文截止到 camera-ready 之间能否调序没有写明；2025 FAQ 限定为投稿截止前和 camera-ready。
- **关键词：** handbook 仍说 camera-ready 可以改 keywords，但 2026 投稿表单已经没有 keywords 字段。
- **参会地点：** 通用 NeurIPS FAQ 还是 2025 的旧说法 'official locations of SD or MX'，以 handbook 和博客为准。
- **撤稿可见性：** 撤稿论文不公开这一点来自 OpenReview 配置（`public_withdrawn_submissions=false`），不是书面政策。
- **被拒论文 opt-in 截止：** about Oct 8, 2026 AoE 是按"通知后两周"推算的日期，官方没有单独公布。

### 3.2 ICLR 2027

> ICLR 2027 (Fifteenth International Conference on Learning Representations)

- **届次（edition_used）：** ICLR 2027，于 2026-09-24 对照以下在线官方来源核对：2027 Author Guidelines、CFP、Dates page、主页、AI Policy for Authors、AI Policy for Reviewers 和 Reviewer Guide（均位于 iclr.cc/Conferences/2027/）；iclr.cc/FAQ；Sep 2 和 Sep 10, 2026 的 PC 博客文章；以及通过 api2.openreview.net 读取的 OpenReview 2027 venue group 和 Submission invitation。并与 ICLR 2026 Author Guide、2026 CFP 及 2026 OpenReview Submission invitation 进行了对比。目前尚无其他 2027 博客文章。
- **投稿系统（submission_system）：** OpenReview（https://openreview.net/group?id=ICLR.cc/2027/Conference）。公开的 Submission invitation 已于 2026-09-19 11:59 UTC（即 Sep 18 AoE 结束时）关闭。Sep 19 至 Sep 25 正文截止之间的修改通过每篇论文各自的 `Full_Submission` invitation 进行，该 invitation 仅对该论文的作者可见。由于公开 API 无法读取它，该时间段内仍可编辑的字段列表无法核实。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。摘要注册已于 Sep 18, 2026 AoE 截止（OpenReview 上的截止时间为 2026-09-19 11:59 UTC）。正文截止为 Sep 25, 2026 11:59 PM AoE（= Sep 26, 11:59 UTC），截止时间不作任何通融。摘要阶段 PDF 为可选，但表单还要求填写：标题、作者（以 OpenReview profile ID 录入）、关键词、primary area、code-of-ethics、paper-visibility 和 submission-requirements 勾选项、AI 使用问题、指定的互审审稿人 (reciprocal reviewer) 以及豁免选项。后两项在摘要截止后不可更改。占位摘要或重复摘要会被删除，因为审稿人竞标（bidding）要用到这些摘要。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Abstracts submitted by the abstract submission deadline must be genuine; placeholder or duplicate abstracts will be removed."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。标题可在 Sep 18 至正文截止（Sep 25, 2026 11:59 PM AoE）之间修改，前提是论文与注册时的摘要相比不会 'read like a different paper'；否则论文将被拒。从 Sep 25 到 Nov 5 审稿意见发布之前，无法进行任何修改。关于 rebuttal 阶段，指南自相矛盾：指南正文称 'until the end of the discussion period' 不得修改标题，而讨论阶段的 FAQ 称 rebuttal 期间（Nov 5-18）可以修改标题。2027 指南未规定 camera-ready 阶段能否修改标题。
- 置信度：中｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："No changes to title are permitted after the submission deadline until the end of the discussion period."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要截止后仍可修改摘要，直至 Sep 25, 2026 11:59 PM AoE，但必须与最初注册的摘要保持接近，否则论文将被拒。Sep 25 至 Nov 5 期间摘要被冻结。根据讨论阶段的 FAQ，Nov 5-18 期间可通过论文修订版再次修改摘要，且应将改动告知审稿人和 AC。未规定 camera-ready 阶段的修改。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。摘要截止（Sep 18, 2026 AoE）后不得添加任何作者。PC 表示 'no exceptions whatsoever'，并要求作者不要为此发邮件。讨论阶段的 FAQ 确认 rebuttal 期间作者成员不可更改。2027 指南没有关于此事的 camera-ready FAQ，但其一般性表述 'No changes to authors are permitted after the submission deadline' 没有设定结束日期；2026 指南曾明确禁止在 camera-ready 阶段添加或删除作者。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Please note that no authors can be added or removed after the abstract submission deadline (author order can be changed after the abstract submission deadline up to the full paper deadline)."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。摘要截止（Sep 18, 2026 AoE）后不得删除任何作者，没有例外；只有在此之前才可删除。OpenReview 表单中作者字段的帮助文本也有相同表述。2027 指南正文现在写的是 'added or removed'（2026 指南正文只写了 'added'）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。摘要截止后仍可调整作者顺序，直至正文截止（Sep 25, 2026 11:59 PM AoE）。指南正文、一条 FAQ 和 OpenReview 表单均如此说明。关于此后的修改，说法相互矛盾：指南正文称 'No changes to authors are permitted after the submission deadline'，但讨论阶段的 FAQ 称 rebuttal 期间 'the order can be changed'。2027 未规定 camera-ready 阶段的情况（2026 指南允许在 camera-ready 阶段调整作者顺序）。
- 置信度：中｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Note that the order of authors can be changed if the contribution among the authors changes but this is allowed only until the submission deadline."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**有条件**。作者名单的成员在摘要截止（Sep 18, 2026 AoE）时即被冻结，没有申请流程，且 'no exceptions whatsoever'。作者顺序在 Sep 25, 2026 11:59 PM AoE 之前仍可修改；rebuttal 期间能否修改，指南内部说法矛盾（见 `author_reorder`）。合作者没有 OpenReview profile 不能作为更改名单的理由：根据 FAQ，该作者应创建 profile 并确认投稿邮件，从而关联到该论文。表单还会在摘要截止后锁定 reciprocal-reviewer、recent-qualifying-paper 和 exemption 字段。
- 置信度：中｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Author order may be edited after the abstract deadline, but new authors cannot be added or removed. No changes to authors are permitted after the submission deadline."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**未规定**。表单要求填写一个 `primary_area`（从 21 个选项中选择）以及关键词。没有任何 2027 官方来源说明这些内容在摘要截止或正文截止后能否修改（官方未规定），且每篇论文的 `Full_Submission` invitation 无法公开读取。Sep 25 至 Nov 5 审稿意见发布之前的一般冻结规则同样适用。只有互审（reciprocal reviewing）相关字段被标明在摘要截止后锁定。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=ICLR.cc/2027/Conference/-/Submission&expired=true>
- 原文："Please choose the closest area that your submission falls into."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**有条件**。在 Sep 25, 2026 11:59 PM AoE 之前，PDF 和补充材料可自由修改。此后直到 Nov 5 审稿意见发布，不允许任何修改，'no matter how small'。Nov 5 至 Nov 18, 2026 期间再次允许修订（页数上限 10 页）。这些修订版会通过 pdfdiff 与原稿比较，AC 和审稿人可以忽略差异显著的改动。camera-ready 说明将于 mid-February 2027 发布。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Submissions can be edited on OpenReview until the submission deadline, following which edits are not allowed till the release of the reviews."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料与论文的截止时间相同（Sep 25, 2026 11:59 PM AoE）。附录可放在主 PDF 的参考文献之后（鼓励使用单一文件），也可作为单独文件提交。补充材料为一个自包含的 zip 或 PDF，大小不超过 100MB（主 PDF 不超过 50MB），对公众可见，且必须匿名。代码可以是 zip、论文中的匿名代码仓库链接，或在论坛开放后仅向审稿人和 AC 发布的链接。演示（demo）或视频链接必须匿名，且须托管在不追踪访问者的平台上。审稿人不必阅读补充材料。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Either is allowed: you can include the appendices at the end of the main pdf after the references, or you can include it as a separate file for the supplementary materials."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。投稿时正文不超过 9 页，讨论阶段和 camera-ready 阶段不超过 10 页。该规定严格执行：超长论文将被 desk reject。以下内容均不计入页数限制：参考文献、参考文献之后的附录、必需的 AI 使用声明、可选的伦理声明（不超过 1 页）、可选的可复现性声明以及致谢。指南未提及是否有单独的 checklist（未规定）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。共有两项上限，均为 2027 新增。(1) 任何人合著的论文不得超过 20 篇。(2) 每位作者最多只能出现在 1 篇“没有任何作者是合格互审审稿人 (reciprocal reviewer)”的论文中，资格依据截至摘要截止时已被接收的论文确定。超额论文会在摘要阶段被标记；若到正文截止时仍超额，将随机 desk reject 超额论文，直至每位作者都不超额。为规避上限而使用重复的 OpenReview profile，可能导致你的所有论文被 desk reject，并被 OpenReview 封禁 6 个月或更久。我们的推断，非官方说明：由于 Sep 18 之后不能删除作者，在 Sep 25 之前撤稿是剩下的唯一降到配额以内的办法。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。名下有 3 篇或以上论文的作者必须审至少 6 篇论文；AC、SAC 和 organizing chairs 豁免。每篇投稿还需至少有一位合格作者注册为审稿人，审至少 3 篇论文。该作者在表单中指定，该字段在摘要截止后锁定。合格的 venue 为 ICLR、NeurIPS、ICML、UAI、AISTATS、JMLR、TMLR、ACL family、COLM、CVPR、ICCV、ECCV、PAMI、3DV、AAAI、IJCAI、JAIR、ICRA、IROS、RSS、CoRL、KDD 和 COLT。只计算正式（primary）论文（包括 Findings 和 Datasets & Benchmarks；不包括 workshop、tiny、position 和 demo 论文）。若没有作者符合资格，该论文豁免此要求，但受 1 篇论文的上限约束。Reviewer Guide 时间线：bidding Sep 18-25，审稿 Oct 1-21。逾期的审稿人及其合作者在完成审稿之前，无法看到自己论文的审稿意见。审稿意见缺失、不完整或质量低，审稿意见中存在 LLM 编造内容，或没有注册审稿人，均可能导致 desk reject。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。所有作者都必须有 OpenReview profile；未使用机构邮箱创建的 profile 最长可能需要两周（two weeks）才能获批。profile 必须保持最新，因为互审审稿人资格依据 profile 判定，profile 信息不正确可作为 desk reject 的理由。时间要求前后不一致：FAQ 称只要所有作者在正文截止（Sep 25）前拥有账号，论文就不会被 desk reject；但表单称需要 'prior to submitting' 拥有 profile，且其作者字段只接受 profile ID（`~Name1`）。未规定利益冲突（conflict-of-interest）信息的填写截止时间。
- 置信度：中｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Eligibility will be determined based on OpenReview profiles. Incorrect information on your profile will be grounds for desk rejection."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。允许在 arXiv 上发布，包括审稿期间，指南未提及任何禁发期（embargo period，未规定）。只要投稿不明确提及几乎相同的 arXiv 版本，该版本就不会破坏匿名性；你自己的相关 arXiv 论文应以第三人称引用。没有任何 2027 官方来源提及社交媒体宣传（未规定）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Submission of the paper to archival repositories such as arXiv is allowed during the review period."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。投稿不得与已发表或已被接收的工作相同或实质相似，也不得与同时投往其他会议或期刊的工作相同或实质相似。该规定在整个审稿期间执行。非存档（non-archival）的 workshop（无论文集）和 arXiv 不受影响。有一条 FAQ 允许在论文仍在 NeurIPS 审稿时注册 ICLR 摘要，若被接收则撤稿，因为重复投稿检查仅适用于完整投稿（full submissions）。被 ICLR 拒稿的论文属于非存档，可以投往其他地方；指南对此前在其他地方被拒的论文没有规定（未规定）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**允许**。作者在 Nov 5 至 Nov 18, 2026 期间通过 OpenReview 评论进行回复。每条评论有字数限制（具体数字未公布，未规定），但发布评论的数量不限。指南未描述单独的 rebuttal PDF；作者改为在 Nov 18 之前随意多次上传论文修订版（页数上限 10 页）。修订版可以修改标题、摘要、内容和补充材料，但不能修改作者成员，且应清楚标出改动。审稿人可以要求补充实验，但这些实验的范围应有限。代码链接可以通过论坛评论仅发给审稿人和 AC。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："You can upload revisions until the discussion period ends, but reviewers and area chairs are not required to look at every revision."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。在接收/拒稿决定（Dec 16, 2026）公布之前可随时撤稿。若在正文截止（Sep 25, 2026 11:59 PM AoE）前撤稿，论文将被删除。该截止之后撤稿，论文将公开保留在 OpenReview 的 'withdrawn papers' 版块中，并立即去匿名（公开作者姓名）。表单还说明，审稿一旦开始，论文不能被删除、隐藏或撤回（retracted）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Authors have the right to withdraw papers from consideration at any time until an accept or reject decision has been announced."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**必须**。此项为强制性要求，不可 opt-out，作者需在表单的勾选项中确认。投稿在审稿开始时公开，审稿意见匿名且公开。Dec 16, 2026 公布决定后，所有论文（已接收、被拒或已撤稿）都会去匿名（公开作者姓名），论文、审稿意见和评论保持公开。CFP 称被拒和已撤稿的投稿 'will remain public with authors’ names attached to them'。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："All submitted papers (accepted, rejected or withdrawn) will be deanonymized after the notification. The submissions and reviews will be released to the public."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**必须**。每篇论文都必须包含一个 AI 使用披露章节（不计入页数限制），并且还须在投稿表单中披露 AI 使用情况。AI Policy for Authors 列出了必须披露的任务（例如协助撰写证明或实现方法）以及仅建议披露的任务（例如为提高可读性而进行的编辑）。表单警告，遗漏披露可能导致 desk reject；LLM 生成的虚假内容或抄袭算作作者违反 Code of Ethics。2027 政策未提及隐藏的 prompt injection（未规定）；只有 iclr.cc/FAQ 仍载有 Aug 2025（ICLR 2026）的政策，该政策将其视为试图串通（attempted collusion）。
- 置信度：高｜来源：<https://iclr.cc/Conferences/2027/AIPolicyForAuthors>
- 原文："Additionally, we require authors to disclose AI use in a mandatory section in their paper (this section will not be counted towards the page limit)."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇被接收论文至少须有一位作者持有 'Conference and Workshops' 注册。学生作者持学生注册即可，一份注册可覆盖多篇论文。2027 页面未规定是否要求线下参会，未给出注册截止日期，也未说明无人注册的后果；2026 指南曾要求线下（in-person）注册。iclr.cc/FAQ 称签证邀请函需要线下注册。会议于 Apr 26-28, 2027 举行，workshop 于 Apr 29-30 举行（主页写的是 'California'，OpenReview 列出的地点为 San Francisco）。camera-ready 说明将于 mid-February 2027 发布。
- 置信度：中｜来源：<https://iclr.cc/Conferences/2027/AuthorGuidelines>
- 原文："Yes, if you have an accepted paper, one of the authors of your paper must have a "Conference and Workshops" registration."

#### 较去年变化（changes_vs_previous_year）

- 新增投稿上限：每位作者最多 20 篇论文；每位作者最多 1 篇“没有任何作者是合格互审审稿人 (reciprocal reviewer)”的论文。若到正文截止时仍超额，超额论文将被随机 desk reject。
- 互审审稿人 (reciprocal reviewer) 资格由 'a previous ICLR/NeurIPS/ICML conference or equivalent journal' 改为明确的 venue 列表：ICLR、NeurIPS、ICML、UAI、AISTATS、JMLR、TMLR、ACL family、COLM、CVPR、ICCV、ECCV、PAMI、3DV、AAAI、IJCAI、JAIR、ICRA、IROS、RSS、CoRL、KDD 和 COLT。只计算正式（primary）论文，包括 Findings 和 Datasets & Benchmarks。资格在摘要截止时确定，因此仅凭 NeurIPS 2026 接收不能获得资格。
- OpenReview 表单新增：reciprocal-reviewer、recent-qualifying-paper 和 exemption 字段在摘要截止后不可更改（2026 表单没有这种锁定）。
- 审稿处罚现在涵盖未能提交 'complete, high-quality reviews' 的情况（2026: 未能 'finish reviews'）。单独的 AI Policy for Reviewers 允许对审稿意见含有 LLM 编造内容或质量低的审稿人，desk reject 其所有论文。
- 现在每篇论文都需要一个 AI 使用章节（不计入页数限制），其依据是新的 AI Policy for Authors，该政策列出了必须披露与建议披露的情形。2026 年只有在 LLM 发挥 'significant role' 时才需要该章节。
- 指南正文现在写明摘要截止后作者不能被 'added or removed'（2026 指南正文: 只写了 'cannot be added'；2026 FAQ 已写明添加或删除）。
- 新增 'Author Identity' 章节：未使用机构邮箱的新 OpenReview profile 获批最长可能需要 2 周。表单警告，重复 profile 可能导致所有论文被 desk reject，并被 OpenReview 封禁 6 个月或更久。
- 新增关于受制裁实体的章节：与美国 OFAC 名单所列实体有关联的投稿将被 desk reject。
- 时间线整体提前：摘要 Sep 18（2025: Sep 19），正文 Sep 25（2025: Sep 24），审稿意见 Nov 5（Nov 11），讨论结束 Nov 18（Dec 3），决定 Dec 16, 2026。关于 2026 的决定日期，Author Guide 写的是 Jan 22, 2026，CFP 写的是 Jan 25, 2026。作者与审稿人的讨论期约为 2 周，而此前约为 3 周。
- 新增可选的投稿前 AI 反馈，由 Google 的 Paper Assistant Tool (PAT) 提供，时间为 Sep 11-18, 2026 AoE。每位作者获得一张 voucher，每篇论文只能运行一次，审稿人、AC 和 PC 无法看到该反馈。
- 新增 FAQ：论文在 NeurIPS 审稿期间，可以注册 ICLR 摘要，若被接收则撤稿，因为重复投稿检查仅适用于完整投稿。
- 投稿表单新增 'paper_visibility' 勾选项：论文在审稿开始时公开，在结束时去匿名（公开作者姓名）（已撤稿论文则立即去匿名），且不能被删除、隐藏或撤回（retracted）。2026 表单中关于 'no acknowledgement section' 和 'no identifying URL' 的声明，以及关于重投和学生作者统计的问题，已被删除。
- 若干 2026 关于 camera-ready 和会务安排的 FAQ（尚）未出现在 2027 Author Guide 中：线下注册、camera-ready 阶段调整作者顺序以及签证邀请函。2027 指南只保留了一条一般性的 'one author must register' FAQ；iclr.cc/FAQ 仍称签证邀请函需要线下注册。
- 样式文件从 GitHub（iclr2026.zip）移至 media.iclr.cc（iclr-2027-style-files.zip）。

#### 官方来源矛盾与注意事项

- **rebuttal 期间改标题：** 指南正文写 'No changes to title are permitted after the submission deadline until the end of the discussion period'，讨论阶段 FAQ 却说 rebuttal（Nov 5-18）期间可以改标题。
- **rebuttal 期间调作者顺序：** 指南正文写 'No changes to authors are permitted after the submission deadline'，讨论阶段 FAQ 却说 rebuttal 期间 'the order can be changed'。作者增删则两处一致：不允许。
- **profile 时限：** FAQ 说只要所有作者在正文截止（Sep 25）前有账号就不会被 desk reject；OpenReview 表单要求 'prior to submitting'，作者栏也只接受 profile ID。按更早的时间准备。
- **会议地点：** 主页写 'California'，OpenReview 写 San Francisco，Dates 页写 location TBA。
- **prompt injection：** 2027 AI 政策没有提；只有 iclr.cc/FAQ 还挂着 Aug 2025（ICLR 2026）的政策，把它视为 attempted collusion。
- **2026 决定日期（上一届）：** 2026 Author Guide 写 Jan 22, 2026，2026 CFP 写 Jan 25, 2026。
- **核对表自身的表述：** "较去年变化"里说时间线整体提前，但同一条列出的正文截止 Sep 25 比 2025 的 Sep 24 晚一天；按原文保留，未改动。

### 3.3 ICML 2026

> ICML (International Conference on Machine Learning)

- **届次（edition_used）：** ICML 2026（43rd ICML），Seoul，July 6-11, 2026。截至 2026-09-24，尚无 ICML 2027 CFP：icml.cc/Conferences/2027/CallForPapers 返回 HTTP 404 'Page not found'，官方 Future Meetings 页面仅列出 '2027 -- South America'。
- **投稿系统（submission_system）：** OpenReview。main track 位于 openreview.net/group?id=ICML.cc/2026/Conference，position paper 使用单独的站点 ICML.cc/2026/Position_Paper_Track。摘要注册 invitation 于 Jan 24, 2026 11:59 UTC 关闭，正文截止为 Jan 29, 2026 11:59 UTC（AoE Jan 28）。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。摘要注册为强制要求：标题、完整作者列表和完整摘要须在 Jan 23, 2026 AoE（Jan 24, 12:00 UTC）前提交。同一表单还要求指定互审审稿人 (reciprocal reviewer) 或申报豁免，并就审稿中使用 LLM 选择 Policy A/B。正文截止为 Jan 28, 2026 AoE，不延期，也不接受仅含摘要的投稿。Peer-review Ethics（Jan 24, 2026 修订）将占位摘要，以及注册摘要与最终摘要差异过大，列为 desk reject 的理由。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`changes_between_abstract_and_full_deadline`｜摘要截止到正文截止之间，哪些能改、哪些不能改？**（会议特有）

- 答案：**有条件**。在 Jan 23 至 Jan 28, 2026 AoE 之间，作者仍可编辑标题和摘要（但不得大幅改写占位摘要）、上传或替换完整 PDF、上传补充材料，以及调整作者顺序。不能添加或删除作者。互审审稿人 (reciprocal reviewer) 只能通过更正字段（correction fields）更正，截止 Jan 27 6pm EST。官方页面未规定 primary area、keywords、TL;DR 或 Policy A/B 选择能否修改。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/PeerReviewFAQ>
- 原文："After submitting the abstract, it will be possible to modify the submission to also upload the full paper PDF, which must be uploaded by the Full paper submission deadline."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。在正文截止（Jan 28, 2026 AoE）前可自由编辑标题；CFP 仅允许在此之前修改标题，且标题应与 PDF 一致。下一次机会是 camera-ready（截止 May 28, 2026 AoE），届时允许轻微修改；大幅修改需获得 Program Chair 许可并有正当理由，例如 meta-reviewer 的建议。position track 论文的标题必须以 'Position:' 开头。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/AuthorInstructions>

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要（OpenReview 字段，最多 5000 字符）可在正文截止 Jan 28, 2026 AoE 前编辑。根据 Peer-review Ethics，大幅改写占位摘要或与注册摘要差异过大属于 desk reject 理由。审稿期间不能修改。camera-ready 时仅允许轻微修改，且 OpenReview 中填写的摘要必须与 PDF 完全一致（一段，最好 4-6 句）。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。摘要截止（Jan 23, 2026 AoE）后不能添加作者。CFP 形式上允许在特殊情况下向 Program Chairs 提交书面申请、逐案审批，但 FAQ 称他们刻意未批准任何豁免，包括此前承诺会考虑的申请。camera-ready 页面同样禁止添加作者。仅有的替代方案是在 Acknowledgments 部分致谢此人，或撤稿。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/PeerReviewFAQ>

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。冻结同样适用于删除作者。只能在摘要截止（Jan 23, 2026 AoE）前删除作者，此后不允许删除，包括 camera-ready 阶段。实际上 Program Chairs 未批准任何豁免（见 `author_add`）。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/AuthorInstructions>
- 原文："You are allowed to change the author order on the camera-ready submission page, but no author additions or deletions are allowed."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**允许**。摘要截止后可调整作者顺序，包括在 camera-ready 页面（截止 May 28, 2026 AoE）。OpenReview 中的作者顺序必须与 camera-ready PDF 一致，网站会从 OpenReview 的 camera-ready 版本读取标题、摘要和作者顺序。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**必须**。作者列表在摘要截止（Jan 23, 2026 AoE）时冻结。提交作者必须勾选一个强制勾选项以确认此规定，且每位作者都需要 OpenReview profile。camera-ready 说明允许更正错误的 OpenReview ID（区别于更换作者本人）：发邮件至 program-chairs@icml.cc，主题为 'INCORRECT AUTHOR OpenReview ID'，列出两个 ID，并抄送所有作者。OpenReview 中的姓名应与 camera-ready PDF 一致。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=ICML.cc/2026/Conference/-/Submission&expired=true>
- 原文："I have double-checked the author list and understand that additions and removals will not be allowed after the abstract submission deadline."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**未规定**。OpenReview 表单要求填写 `primary_area`（从分层下拉列表中选择）和 keywords。官方页面未规定这些字段在摘要注册后或正文截止后能否修改。position paper 使用单独的 OpenReview 站点，未找到关于在 track 之间转移论文的规则。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=ICML.cc/2026/Conference/-/Submission&expired=true>
- 原文："Please indicate the primary subject area that best describes the paper."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。摘要注册后至正文截止（Jan 28, 2026 AoE）前可上传或替换 PDF。此后在审稿、rebuttal 或讨论期间，PDF 和补充材料均不能修改。下一次机会是 camera-ready（May 28, 2026 AoE），修改须保持论文核心内容不变；之后在 PMLR 出版前还有一个会后修订窗口。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/PeerReviewFAQ>
- 原文："Similar to previous years, the original submission (PDF and supplemental material) cannot be revised in OpenReview during the discussion period."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料没有单独的截止时间，须与论文一同在 Jan 28, 2026 AoE 前提交。附录必须放在主 PDF 末尾（最大 50MB）。补充材料上传为一个自包含、匿名的文件，最大 100MB：表单接受 zip/pdf/tgz/gz，而说明中写的是 zip 或 pdf。其内容包括代码/数据、匿名化的被引论文，以及被引用的同期 ICML 投稿的匿名 PDF（若引用则必须提供）。匿名 GitHub 链接仅在指向截止后未修改的 branch 时允许。camera-ready 阶段没有补充材料。对于录用论文，原始补充材料会在 OpenReview 上公开，作者可就同期投稿 PDF 申请例外。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/AuthorInstructions>
- 原文："There is no separate deadline for Supplementary Material: All supplementary material must be submitted by the same deadline as the paper submission."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。正文最多 8 页；正文超长将被自动拒稿。参考文献、impact statement（main track 必须提供，position track 不要求）和附录不限页数且不计入页数，不允许通过修改模板来获得更多空间。camera-ready 正文可为 9 页。文件大小上限为：投稿 PDF 50MB，camera-ready 20MB。US letter 纸张尺寸被列为 camera-ready 的要求。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>
- 原文："Papers must be prepared and submitted as a single file: 8 pages for the main paper, with unlimited pages for references, the impact statement, and appendices."

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。官方来源未规定每位作者的投稿数量上限。投稿数为 4 篇或以上的作者，除非获得豁免，必须担任审稿人，且 Program Chairs 可能将该门槛降至 3 篇。同一人最多可作为 2 篇投稿的指定互审审稿人 (reciprocal reviewer)。另外，同一作者的相关 ICML 投稿必须相互引用并讨论，违反可能导致这些作者的所有投稿被 desk reject。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>
- 原文："Additionally, every author with 4 or more submissions must agree to serve as a reviewer for ICML (in that case, the author can act as the reciprocal reviewer for up to 2 of their submissions)."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。每篇 main track 投稿除非获得豁免，都必须在摘要表单中指定一名合格的互审审稿人 (reciprocal reviewer)，同一人最多可为 2 篇投稿担任此角色。position paper 免除此要求。Reviewer Registration 表单截止于 Jan 29, 2026 AoE，审稿量约 5-6 篇，不提供减量。未满足任一要求可能导致 desk reject；任何失职的审稿人（包括违反审稿中使用 LLM 的政策）其本人的投稿都可能被 desk reject。2026 年，有 497 篇论文因其指定的互审审稿人（398 人）违反 Policy A 而被 desk reject。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`reciprocal_reviewer_correction`｜摘要截止后还能更换指定的互审审稿人吗？**（会议特有）

- 答案：**有条件**。摘要注册后，指定的互审审稿人或豁免状态只能通过投稿表单中的更正字段（correction fields）修改，并须说明理由，截止 Jan 27, 2026 6pm EST。新增的审稿人必须在 Jan 29, 11:59pm AoE 前注册且符合资格。据 FAQ，此后不再接受修改；善意提名但事后发现不符合资格的情况不会受到处罚。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=ICML.cc/2026/Conference/-/Submission&expired=true>
- 原文："You must enter this correction by January 27, 6pm EST."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。每位作者都需要 OpenReview 账号。建议在 Jan 8, 2026 前创建，因为非机构邮箱的激活可能需要长达 2 周。提交作者的账号须在摘要截止前激活，共同作者的账号须在正文截止前激活。利益冲突在 profile 中申报：域名冲突填在 Career & Education History（仅使用最近 3 年），个人冲突填在 Advisors & Other Relations。虚假申报冲突可能导致该作者的所有论文被拒；camera-ready 时 profile 中的机构信息必须与 PDF 一致。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/PeerReviewFAQ>

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**有条件**。作者可随时在 arXiv 上发布并做报告，没有匿名期。从投稿到公布录用结果（Apr 30, 2026）期间，不得将该工作宣传为 ICML 投稿，包括在社交媒体上。若存在非匿名版本，投稿 PDF 中不得提及该版本。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。禁止投稿与已在其他会议或期刊发表、录用或在审的工作相同或实质相似的论文。此类论文须在正文截止前已不在其他地方审稿中。没有正式出版论文集的 workshop 不受限制。作者有重叠的同期 ICML 投稿视为已有工作（prior work），不引用并讨论相关投稿可能导致这些作者的所有投稿被 desk reject。对于此前在其他地方被拒的论文，官方未规定。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>
- 原文："Note that submissions that have been or are being presented at workshops without published proceedings do not violate the dual-submission policy."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。每篇投稿可针对每条 official review 提交一条文本回复，最多 5000 字符，截止 Mar 30, 2026 AoE；任何作者均可撰写或编辑。此后，作者可针对每位审稿人的 follow-up 提交一条最终回复（最多 5000 字符，截止 Apr 7 AoE），并可在 Apr 7 前发送 Author-AC 保密评论；若审稿意见在 Mar 27 之后才到达，可在 Apr 1 前通过 AC comment 提交 rebuttal。不能上传修改后的 PDF，包含修改稿章节的 PDF 将被忽略。链接必须匿名（不得使用个人网站或短链接），审稿人无须点开，且链接应主要用于带标题说明的图/表，而非新工作。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/PeerReviewFAQ>
- 原文："In particular, reviewers and area chairs are instructed to disregard any PDFs that contain a revised manuscript or sections/paragraphs of the manuscript—you must use your 5000-word responses for this!"

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。作者可通过 OpenReview 撤稿。在正文截止前还可以删除论文；2026 FAQ 甚至向已录用论文提供撤稿选项，作为更改作者的替代方案。2026 年的官方页面均未规定撤稿截止时间；未完成截止于 May 28, 2026 AoE 的 camera-ready 步骤的论文可能会被 ICML 撤稿。venue config 设定撤稿和被 desk reject 的论文不公开且隐藏作者。retraction 是已录用论文的另一条途径：论文保留在 OpenReview 上并标记为 retracted，相关声明公开。
- 置信度：中｜来源：<https://api2.openreview.net/groups?id=ICML.cc/2026/Conference>
- 原文：""public_withdrawn_submissions": false"

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**有条件**。被拒论文保持不公开，除非作者 opt-in 公开原始投稿、审稿意见、meta-review、rebuttal 和讨论。对于录用论文，camera-ready 截止后在 OpenReview 上公开是强制性的，内容包括：原始 PDF 和补充材料、匿名审稿意见、meta-review、rebuttal 和讨论。根据 venue config，被 desk reject 和撤稿的论文不公开。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>
- 原文："The authors of rejected submissions will also have an option to have their originally submitted version, reviews, meta-reviews, rebuttal, and reviewer-author discussion published."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。作者可将 LLM 用于写作和研究，但须对内容负全部责任。鼓励披露较重要的使用情况，LLM 不能作为作者。prompt injection 将导致同一作者的所有投稿被 desk reject，不过 2/14/2026 的更新豁免了仅用于检测审稿人是否使用 LLM 的 prompt；幻觉参考文献和 AI slop 同样是 desk reject 的理由。每篇论文需选择 'requires Policy A'（审稿中禁用 LLM）或 'allows Policy B'；Policy A 论文的作者在担任审稿人时必须遵守 Policy A。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/CallForPapers>

**`camera_ready_content_change`｜camera-ready 能改哪些内容？**（会议特有）

- 答案：**有条件**。camera-ready（截止 May 28, 2026 AoE）可纳入审稿人建议的修改及其他改进，只要核心内容不变。camera-ready 可有 9 页，必须包含 lay summary、适用时的 Conflict of Interest Disclosure 段落，以及对自动参考文献检查所标记参考文献的修正，并要经过 ICML format checker 检查。标题和摘要只能轻微修改，作者可调整顺序但不能添加或删除，之后还有一个会后更正窗口。
- 置信度：高｜来源：<https://icml.cc/Conferences/2026/AuthorInstructions>

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**有条件**。线下参会为可选。in-person 论文需要至少一名作者以 'Conference' 选项注册；proceedings-only 论文需要 Conference 或 Virtual Pass 注册。学生注册即可满足要求，一个注册可覆盖多篇论文。注册属于须在 May 28, 2026 AoE 前完成的 camera-ready 步骤之一，以免论文被撤稿；线下参会问卷截止于 May 11 AoE。之后可通过 poster session 切换状态，视容量而定。早鸟价于 May 24 结束，申请签证邀请函须先完成注册；全额退款截止日期据 May 24 blog 为 June 15，但据 Dates 页面为 June 17。
- 置信度：中｜来源：<https://icml.cc/Conferences/2026/AuthorInstructions>

#### 较去年变化（changes_vs_previous_year）

- 参会变为可选。ICML 2025 FAQ 要求除特殊情况外至少一名作者注册并线下报告。2026 新增 proceedings-only 论文，只需一个线上注册，且仍有资格获奖以及获得 oral/spotlight 标记。
- 录用论文的公开范围扩大。2025 仅公开 camera-ready 版本和审稿意见，补充材料不公开也不存档。2026 还会公开原始 PDF、原始补充材料、meta-review、rebuttal 和讨论。被拒论文仍为 opt-in，且 opt-in 现在也涵盖原始投稿。
- 新增互审上限：同一人最多可作为 2 篇投稿的互审审稿人 (reciprocal reviewer)。强制审稿的 4 篇投稿门槛可能降至 3 篇。目标审稿量从约 5 篇（2025）增至 5-6 篇（2026）；两年均不提供减量。排名前 25% 的审稿人可获免费注册。
- 新增审稿中使用 LLM 的双政策框架：每篇论文要么要求 Policy A，要么允许 Policy B。基于水印的检测导致 497 篇论文被 desk reject，这些论文指定的互审审稿人（398 人）违反了 Policy A。
- CFP 现明确禁止 prompt injection，违者同一作者的所有投稿将被 desk reject（仅用于检测 LLM 使用的 prompt 于 2/14/2026 获豁免）。Peer-review Ethics（Jan 24, 2026 修订）新增了明确的 desk reject 理由清单，包括幻觉参考文献、AI slop 以及注册摘要与最终摘要差异过大。'placeholder abstract' 移除规则与 2025 相同。
- 同期投稿规则更严格，针对 'thinly sliced contributions'。同一作者的相关 ICML 投稿必须在正文中相互引用并讨论，并在补充材料中附上匿名 PDF。违规可能连带导致违规作者的所有论文被 desk reject。
- 新增财务利益冲突披露：投稿时需填写一个勾选项及说明，camera-ready 版本还需在引言末尾加入 'Conflict of Interest Disclosure' 段落。
- camera-ready 措辞从 'no author additions'（2025）改为 'no author additions or deletions'（2026）。2026 FAQ 称 Program Chairs 未对作者列表冻结批准任何例外。
- rebuttal 链接的用途收窄。2025 链接可包含图/表、证明或代码；2026 主要用于带标题说明的图/表，包含修改稿文本的 PDF 将被忽略。2026 FAQ 规定每条回复上限 5000 字符，而 2025 FAQ 未规定，因此无法确认该限制是否为新规。
- 新增截止前可选的 LLM 反馈（Google Paper Assistant Tool；该计划于 Jan 22, 2026 5pm EST 结束），以及 camera-ready 阶段的自动参考文献正确性检查。作者自评排序（self-rankings）此前已有，但现在用于标记排序与审稿分数严重不一致的论文。
- 日期变化：2026 摘要截止为 Jan 23，正文截止为 Jan 28；2025 分别为 Jan 23 和 Jan 30。建议的 OpenReview 账号创建日期为 Jan 8, 2026，对比 Jan 9, 2025。

#### 官方来源矛盾与注意事项

- **作者增删的例外：** CFP 写特殊情况下可书面申请、由 PC 逐案批准；PeerReviewFAQ 说 PC 刻意一律不批准，包括此前答应会考虑的请求。实际按"不可能"处理。
- **rebuttal 长度单位：** FAQ 规定每条回复 5000 characters，但同一 FAQ 的引文写的是 'your 5000-word responses'。按字符数准备更稳妥。
- **全额退款截止：** May 24 博客写 June 15，Dates 页写 June 17。
- **届次：** ICML 2027 CFP 仍是 404，本节全部是 ICML 2026 的规则。

### 3.4 CVPR 2027（多数细则沿用 2026）

> CVPR 2027 (IEEE/CVF Conference on Computer Vision and Pattern Recognition), Seattle WA, June 20-25, 2027 (workshops/tutorials June 20-21, main conference June 22-25)

- **届次（edition_used）：** 检查日期 2026-09-24。CVPR 2027 的主页、Call for Papers、Dates 页面和 OpenReview venue group 已上线。其他 2027 页面均尚不存在：Author Guidelines、Reviewer Guidelines、CompleteYourORProfile、Pricing2 和 FAQ 均返回 404，2027 OpenReview Submission invitation 也返回 404。以下内容来自 2027 页面：日期、会议地点、一稿多投（dual-submission）窗口、审稿义务、profile 要求、LLM 声明、同期工作（contemporaneous-work）规则以及 OpenReview 可见性设置。其余所有详细规则均来自 2026 官方来源，并标注为 "2026"：Author Guidelines、Reviewer Guidelines、Pricing2、Dates、CompleteYourORProfile、ComputeReporting、OpenReview Submission invitation 以及 2026 LaTeX author kit。在 2027 Author Guidelines 发布之前，这些仅来自 2026 的规则置信度最高评为 medium。
- **投稿系统（submission_system）：** OpenReview（https://openreview.net/group?id=thecvf.com/CVPR/2027/Conference）。2027 Submission 表单尚未开放，也未公开。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。2027：Paper Registration Deadline（论文注册截止）为 Nov 10, 2026 AOE；正文截止为 Nov 16, 2026 AOE；两者均为固定日期，不延期。根据 2026 FAQ，注册是指在 OpenReview 创建投稿，填写标题、摘要并添加全部（ALL）共同作者，且这些作者的 profile 和 enrollment 表单均已完成。此截止之后不能再创建新投稿。不完整的投稿会被删除。是否允许占位摘要或 dummy 摘要未规定（unspecified）。
- 置信度：高｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>

**`edits_after_registration`｜论文注册截止到正文截止之间，哪些能改？**（会议特有）

- 答案：**有条件**。2026 规则映射到 2027 日期。在注册（Nov 10）与正文截止（Nov 16, 2026 AOE）之间，可以编辑标题、摘要、作者顺序（ORDER）、subject area、关键词、student-paper 标记以及 PDF。补充材料（以及 2026 年强制提交的 compute report）可编辑至 Nov 23。Nov 10 之后不能增删作者，也不能创建新投稿。审稿期间论文的任何内容都不能修改。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。注册后标题可编辑至正文截止（2027 窗口：Nov 10 至 Nov 16, 2026 AOE）。2026 OpenReview 表单写明 'Can be updated until the submission deadline'，且未提供审稿期间修改的途径。camera-ready 阶段能否修改标题未规定。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："You can update the title and abstract until the paper submission deadline."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要（2026 表单中最多 5000 个字符）可编辑至正文截止（2027：Nov 16, 2026 AOE），之后不可修改。camera-ready 阶段能否修改摘要未规定。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=thecvf.com/CVPR/2026/Conference/-/Submission&expired=true>
- 原文："Enter the paper abstract, which can be updated until the submission deadline."

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。2026：只能在摘要/论文注册截止前添加作者（2027 对应日期：Nov 10, 2026 AOE）。截止后不允许添加，包括录用后和 camera-ready 阶段。PC 不予任何例外。每位新增作者必须已有 OpenReview profile。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："To avoid undeclared conflicts, authors cannot be added or deleted after the abstract submission deadline (Nov 06 2025), but only reordered."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。2026：只能在摘要/论文注册截止前删除作者（2027 对应日期：Nov 10, 2026 AOE）。截止后不得删除，包括录用后。2026 OpenReview 表单和 profile 页面的说法相同。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Q. Can I add/remove authors after my paper has been accepted? A. NO. After the abstract registration deadline, the author list is considered final."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。2026：作者顺序可修改至正文截止（2027：Nov 16, 2026 AOE）。2026 指南对之后能否修改说法自相矛盾。Conflict 部分称不得修改，'including for accepted papers'。FAQ 称录用后调整顺序 'may be considered, but only in special circumstances'。应将正文截止时的顺序视为最终顺序。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："The order of the author list is considered final after the paper submission deadline (Nov 13 2025) and no changes are allowed thereafter, including for accepted papers."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**必须**。2026 有两个冻结点。(1) 作者集合在论文注册截止时冻结（2027：Nov 10, 2026 AOE）。(2) 作者顺序在正文截止时冻结（2027：Nov 16, 2026 AOE）。增删作者没有任何例外；仅录用后调整顺序在特殊情况下 'may be considered'。2026 各来源对摘要截止日期说法不一：AG 的 Conflict 部分和 Reviewer timeline 写的是 Nov 6, 2025，而 CFP、Dates 页面和 OpenReview invitation（关闭于 Nov 7, 23:59 AoE）写的是 Nov 7。2027 AG 发布后需重新核对。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=thecvf.com/CVPR/2026/Conference/-/Submission&expired=true>
- 原文："No authors can be added or removed after the abstract deadline."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**有条件**。2026 表单：唯一的 subject area 和关键词可修改至正文截止，之后锁定。没有由作者自选的 track。2026 Findings Track 仅通过 AC 推荐、随后发出邀请的方式产生。2027 CFP 的主题列表已重写，因此 2027 的下拉菜单很可能（likely）会不同。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=thecvf.com/CVPR/2026/Conference/-/Submission&expired=true>
- 原文："Please select the closest subject area for your submission, which can be updated until the submission deadline."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**有条件**。2026：主 PDF（上限 50 MB）可上传或替换至正文截止（2027：Nov 16, 2026 AOE），审稿期间不允许修订。根据 2026 Reviewer Guidelines，补充材料不得包含更新或修正后的论文 PDF，也不得包含改进方法的结果。2026 Author Guidelines 页面本身未写明这一点。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=thecvf.com/CVPR/2026/Conference/-/Submission&expired=true>
- 原文："Upload the paper submission as a PDF file, which can be updated until the submission deadline. File size limit is 50 MB."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。2027 补充材料截止：Nov 23, 2026 AOE。2026 格式：一个 ZIP 或 PDF，最大 200 MB，与 8 页的主 PDF 分开提交（author kit 提醒要从投稿中删除附录页）。可包含视频、证明、额外的图和表、更完整的分析以及匿名化的同期投稿；鼓励提供代码。必须匿名化，且不得包含扩展内容的外部链接、改进后的结果或修正后的论文。2026 年有一份强制（MANDATORY）的 compute-reporting 表单需与补充材料一同提交。
- 置信度：高｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Supplementary material may include videos, proofs, additional figures or tables, more detailed analysis of experiments presented in the paper, or a concurrent submission to another conference."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**有条件**。2026：8 页，包含图和表。参考文献页不限且不计入页数。任何附录都计入页数，因此必须放在补充材料中。超过 8 页、或明显改动页边距或格式的论文将不经审稿直接拒稿。未提及 paper checklist。人类受试者/IRB 相关讨论可放在正文或补充材料中。camera-ready 是否有额外页未规定。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Papers are limited to eight pages, including figures and tables, in the CVPR style. Additional pages containing only cited references are allowed."

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。2026：每位作者最多 25 篇投稿，超出 25 篇的投稿会被 desk reject。2027 的上限尚未公布。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Each author is limited to a maximum of 25 paper submissions. If an author registers more than 25 papers, the Program Chairs (PCs) will desk-reject any submissions exceeding this limit."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。2027：所有作者在受邀时必须担任审稿人、AC 或 SAC。仅在因特殊原因提前说明并经 PC 批准的情况下才可豁免。2026：通过 Help Desk 表单申请豁免，对 CV 领域的新人或领域外作者以及组织者自动豁免。审稿迟交、'highly irresponsible' 的审稿或由 LLM 撰写的审稿，可能导致该审稿人的所有论文被 desk reject（由 PC 酌情决定），且迟交审稿人的共同作者会收到通知。
- 置信度：高｜来源：<https://cvpr.thecvf.com/Conferences/2027/CallForPapers>
- 原文："All authors commit to serve as reviewers, area chairs, or senior area chairs when invited by the program chairs."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。2027：每位共同作者都需要有最新的 OpenReview profile 才能投稿。没有机构邮箱的 profile 审核可能需要长达 2 周，因此应在 ~Oct 27, 2026 之前创建。2026 各来源对截止日期说法冲突：Dates 页面列出的 profile 和 enrollment 表单截止为 Nov 16, 2025，但 OpenReview 表单和 FAQ 要求两者都在摘要截止（Nov 7）前完成。应以注册截止为准。完整的 profile 需满足 8 项标准（包括 DBLP、带域名的职业经历、利益冲突），且必须对组织者可见；不完整将导致 desk reject。2027 Dates 页面尚未列出 profile 或 enrollment 截止日期。
- 置信度：高｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Papers with authors who have not completed their profiles will be desk-rejected."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**有条件**。2026：允许在 arXiv 上发布，也允许提供视频链接和项目网站；未说明任何时间限制或静默期（quiet period）。录用前不得与媒体讨论论文，不得标注为 'under submission to CVPR'，也不得在公开网站上列出。类似 'will be submitted to CVPR' 的说明被强烈不建议，并可能导致 desk reject。违反 embargo 将导致论文被从会议和论文集中移除。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："However, please note that any mention of the paper as “under submission to CVPR” is in violation of the policy."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**不允许**。2027 审稿期：Nov 16, 2026 至 Feb 22, 2027；在此期间不得将实质相似的论文投往其他地方。2026 AG：重叠 20%+ 即算，范围也涵盖期刊，且超过 4 页（不含参考文献）的经同行评审的 workshop 论文即使没有论文集也算作发表；arXiv 不算。违规将导致拒稿，并通报给另一方 venue。重投在其他地方被拒的论文未规定（unspecified）。
- 置信度：高｜来源：<https://cvpr.thecvf.com/Conferences/2027/CallForPapers>

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。2027 rebuttal 期：Jan 25 至 Feb 1, 2027 AOE（仅见于 CFP）。2026：可选的一页 PDF，使用 CVPR rebuttal 模板，参考文献和图计入页数。超长或改动格式的 rebuttal 不予审阅。必须匿名、不含外部链接，不允许提交修订版论文。除非被要求，不鼓励提供新结果，但允许给出来自投稿、补充材料或其他论文的结果表格。Reviewer Guidelines 允许审稿人要求做小规模实验。给 AC 的保密评论仅限特殊情况使用。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："The rebuttal is limited to a one-page PDF file using the rebuttal template included in the CVPR 2026 Submission Template. Responses longer than one page will simply not be reviewed."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**未规定**。官方未规定撤稿截止日期或流程，且 OpenReview 的撤稿 invitation 不公开。可见性：2027 OpenReview 配置（与 2026 相同）设置了 `public_withdrawn_submissions=false` 和 `withdrawn_submission_reveal_authors=false`，因此撤稿论文及其作者不会公开。这是系统设置，而非书面政策。审稿意见永不公开。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："Consistent with the review process for previous CVPR conferences, submissions under review will be visible only to their assigned members of the program committee (area chairs and reviewers)."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**不允许**。2026：审稿意见和 author response 永不公开。2027 OpenReview 配置设置了 `public_submissions=false`，因此被拒论文不会公开发布。未提及可 opt-in 公开。2026 年，只有当受邀作者选择投向 Findings Track 时，审稿意见才会转交给 Findings Track 委员会。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>
- 原文："The reviews and author responses will never be made public, and we will not be soliciting comments from the general public during the reviewing process."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。2026：作者可使用任何工具，但须对内容负全部责任。引用不存在的工作或存在明显错误可能导致不经审稿直接拒稿。Prompt injection 属于违反伦理，会导致 desk reject 并可能受到进一步制裁；2026 表单有一个勾选项，用于确认不含 prompt injection 且不含扩展内容的链接。2027 CFP 称 CVPR 将在部分流程中使用 LLM；使用范围和允许的用途将在截止前公布。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines>

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。2026：至少一名作者必须注册并做报告。每篇论文需要一个付费的 AUTHOR 注册，每个注册最多覆盖 3 篇论文；virtual 注册不覆盖任何论文。无法出行的作者可线上参会，但仍须支付 author 注册费。官方未规定录用论文的注册截止日期或未注册的处罚。2026 日期：早鸟价截至 Apr 23, 2026；May 13, 2026 之前取消需收取 $65 手续费，之后不退款；注册可免费更换姓名。
- 置信度：中｜来源：<https://cvpr.thecvf.com/Conferences/2026/Pricing2>
- 原文："Each paper (Main Conference AND Workshop) MUST be registered under an AUTHOR registration type. (There is a student registration under AUTHOR) One registration may cover up to three papers."

#### 较去年变化（changes_vs_previous_year）

- 新日期：论文注册 Nov 10, 2026 AOE（2026：Nov 7, 2025）；正文 Nov 16, 2026（2026：Nov 13, 2025）；补充材料 Nov 23, 2026（2026：Nov 20, 2025）；审稿意见发布 Jan 25, 2027，rebuttal 为 Jan 25 至 Feb 1, 2027（2026：Jan 22-29, 2026）；决定 Feb 25, 2027（2026：Feb 20, 2026）。从注册到正文的间隔仍为 6 天。
- 2027 页面称之为 'Paper Registration Deadline'；2026 使用的是 'Abstract Submission Deadline'。
- 2027 Dates 页面不再列出 'Enrollment Form Deadline' 或 'Open Review Profile Deadline'（2026 年两者均为 Nov 16, 2025），也未列出 rebuttal 期，rebuttal 期仅见于 CFP。
- 一稿多投窗口现为 Nov 16, 2026 至 Feb 22, 2027。它在 Feb 25 公布决定前 3 天结束；2026 的窗口在决定日 Feb 20 结束。
- CFP 新增 'LLM Usage' 部分（2026 CFP 中没有）：CVPR 2027 将在会议和审稿流程的部分环节使用 LLM。使用范围和允许的用途仍在确定中，将在投稿截止前公布。
- 新增 'Contemporaneous Work' 规则（2026 年没有）：Sept 15, 2026 之后上线的论文视为同期工作，投稿不会基于与这些论文的比较而被拒。作者仍被期望（EXPECTED）在可行时引用、讨论并进行实证比较。这在语气上比 2026 FAQ 更严格，后者称作者无需与近期 arXiv 报告进行比较。arXiv 论文与已发表论文同等对待。
- Subject areas 已重写。新增条目包括 Agentic AI；Physical AI: World Models, VLA, Planning, Simulation；Reasoning & Reinforcement Learning；AI for Science and Scientific Discovery；AI for Education；Generative AI Safety and Authenticity；Multimodal Generative and Foundation Models。删除或合并的条目包括 Event-based cameras 和 Adversarial attack and defense。预计 OpenReview 下拉菜单会更新。
- 会议地点从 Denver（June 3-7, 2026）移至 Seattle（June 20-25, 2027）。
- 2027 Author Guidelines、Reviewer Guidelines、profile 页面和注册页面均仍为 404。因此，25 篇论文上限、作者列表冻结规则、profile 和 enrollment 截止日期、rebuttal 格式以及审稿人 desk reject 处罚在 2027 年均未确认。
- 低置信度：2027 OpenReview venue 配置仅列出 'Accept (Oral)' 和 'Accept (Poster)'。2026 配置还包含 'Accept (Highlight)' 以及一个 Findings 决定标题。这可能只是占位设置（placeholder）。

#### 官方来源矛盾与注意事项

- **大部分细则来自 2026：** 2027 Author Guidelines、Reviewer Guidelines、profile 页、注册页和 FAQ 都还是 404，标 "2026" 的内容在 2027 未确认。
- **录用后调序（2026）：** Author Guidelines 的 Conflict 部分说作者顺序在正文截止后 'no changes are allowed thereafter, including for accepted papers'；同一页 FAQ 说录用后调序 'may be considered, but only in special circumstances'。
- **2026 摘要截止日期：** AG 的 Conflict 部分和审稿时间线写 Nov 6, 2025；CFP、Dates 页和 OpenReview invitation 写 Nov 7。
- **2026 profile / enrollment 截止：** Dates 页写 Nov 16, 2025；OpenReview 表单和 FAQ 要求在摘要截止前完成。按注册截止准备。
- **补充材料不得含改进结果或修正版 PDF：** 这条只出现在 Reviewer Guidelines，该页说出自 Author Guidelines，但 Author Guidelines 里没有这句。
- **rebuttal 新结果：** AG 说审稿人被要求忽略新结果；Reviewer Guidelines 允许审稿人要求小实验，并说不应因额外结果扣分。
- **一稿多投范围：** 2026 AG 覆盖期刊以及在别处 'registered' 的论文；2027 CFP 的句子只点名 conference 和 workshop。
- **2027 OpenReview 决定类型（低置信度）：** 配置里只有 'Accept (Oral)' 和 'Accept (Poster)'，2026 还有 'Accept (Highlight)' 和 Findings，可能只是占位。

### 3.5 ECCV 2026

> ECCV 2026 (19th European Conference on Computer Vision, Malmö, Sweden; workshops/tutorials Sep 8-9, main conference Sep 10-12, 2026)

- **届次（edition_used）：** ECCV 2026。本届投稿周期已结束：论文注册 Feb 26, 2026 11:00 PM CET（OpenReview 截止时间为 21:59 UTC），投稿 Mar 5 11:00 PM CET，补充材料 Mar 12 11:00 PM CET，审稿意见发布 May 2，rebuttal May 11 11:00 PM CEST，最终决定 Jun 17，camera-ready Jun 30 AoE（于 Jun 23 延期），作者注册 Jul 17 CEST，会议 Sep 8-12, 2026。ECCV 每两年举办一次。eccv.ecva.net/Conferences/2028 返回 404，因此目前尚无 ECCV 2028 规则。以 ECCV 2024 作为上一届进行对比。
- **投稿系统（submission_system）：** 投稿、审稿和 rebuttal 使用 OpenReview（venue id `thecvf.com/ECCV/2026/Conference`）。Camera-ready PDF、源文件和 License-to-Publish 通过 Springer Meteor 提交，每篇论文只上传一次。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。论文必须在 Feb 26, 2026, 11:00 PM CET 之前在 OpenReview 上注册（OpenReview invitation 的截止时间为 21:59 UTC，硬性过期时间为 22:29 UTC）。注册是指创建投稿，并填写标题、摘要、全部合作者和投稿问题。此截止之后不能再创建新投稿，且不予延期。没有任何官方规则提及占位摘要或 dummy 摘要（官方未规定），但 FAQ 称，不完整或不符合要求的投稿将被删除。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/FAQs>
- 原文："Before the paper registration deadline, you need to create a submission in Open Review, add a title and an abstract for your paper, add all your co-authors, and complete the submission questions."

**`post_registration_edits`｜论文注册截止后，哪些能改、哪些不能改？**（会议特有）

- 答案：**有条件**。在论文注册截止（Feb 26）与投稿截止（Mar 5, 2026, 11:00 PM CET）之间，作者可以编辑标题、摘要、PDF、subject area、'student paper' 标记以及作者顺序。作者不能创建新投稿，也不能添加或删除作者。Mar 5 之后只有补充材料文件仍可修改（至 Mar 12, 11:00 PM CET）。官方来源未规定注册后能否编辑 Contribution Type。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/FAQs>

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。FAQ 和 OpenReview 表单字段均说明，注册后至投稿截止（Mar 5, 2026, 11:00 PM CET）之前可自由编辑标题。此后未说明作者可做任何编辑。在 camera-ready 阶段（Jun 30, 2026 AoE，Springer Meteor），标题必须与审稿时的标题一致，审稿人或 AC 要求的调整除外。
- 置信度：高｜来源：<https://docs.google.com/document/d/1DCMcCdtZbrYtG1oi7qeT8--D3GPc9mLg>

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。根据 FAQ 和 OpenReview 字段说明，OpenReview 上的摘要可在投稿截止（Mar 5, 2026, 11:00 PM CET）之前更新。没有任何规定允许此后修改。在 camera-ready 阶段，只有在审稿人或 AC 要求时才可调整 'paper content'，且没有规则专门涉及 camera-ready 摘要（未规定）。FAQ 建议不超过 OpenReview 的 4,000 字符限制，但表单字段实际可接受最多 5,000 字符。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/FAQs>
- 原文："You can update the title and abstract until the paper submission deadline."

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。论文注册截止（Feb 26, 2026, 11:00 PM CET）之后不能添加任何作者。这涵盖注册截止与投稿截止之间、投稿之后、录用之后以及 camera-ready 阶段（'Adding or removing authors is not allowed'，Jun 23, 2026 公告）。作者必须已有 OpenReview profile 才能被添加到投稿中。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>
- 原文："To avoid undeclared conflicts, authors cannot be added or deleted after the paper registration deadline (Feb 26, 2026, at 11:00 PM CET), but only reordered."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。只能在论文注册截止（Feb 26, 2026, 11:00 PM CET）之前删除作者。此后不允许删除，包括录用之后和 camera-ready 阶段（Jun 23 公告；camera-ready 说明称 'Authors cannot be added or deleted at this point'）。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/FAQs>
- 原文："A. NO. After the paper registration deadline, the author list is considered final."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。作者顺序可在投稿截止（Mar 5, 2026, 11:00 PM CET）之前自由调整。此后，Submission Policies 称 'no changes are allowed thereafter, including for accepted papers'，FAQ 称录用后修改顺序 'will not be possible'。然而，之后的 Jun 23, 2026 camera-ready 公告允许作者在 camera-ready PDF 中调整作者顺序并更换通讯作者（corresponding author）。Meteor 上传完成后（截止 Jun 30 AoE），作者顺序和姓名拼写即永久固定。
- 置信度：中｜来源：<https://eccv.ecva.net/Conferences/2026>

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**不允许**。作者成员（添加或删除）在注册截止（Feb 26, 2026, 11:00 PM CET）时冻结。政策称整个作者列表在投稿截止（Mar 5, 2026, 11:00 PM CET）后即为最终版本，但 Jun 23 公告随后允许在 camera-ready PDF 中调整顺序并更换通讯作者。在 Meteor camera-ready 上传时，一切永久固定。没有例外流程：无论理由如何，PC 都不会考虑修改作者列表的请求。除拒绝请求外，未规定其他处罚。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/AuthorGuide>
- 原文："Requests to modify lists of authors will not be considered, regardless of the justification provided."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**有条件**。OpenReview 表单称，单一的 subject area 以及 'student paper' 标记可在投稿截止（Mar 5, 2026）之前更新。每篇论文还需选择一个主要 Contribution Type。Contribution Type 并非独立的 track，表单也未规定能否编辑它。审稿之后，若 PC、SAC 和 AC 认同审稿人有充分理由的重新定位，可按不同的 Contribution Type 评估论文；作者可在 rebuttal 中对此作出回应。表单没有关键词（keywords）字段。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=thecvf.com/ECCV/2026/Conference/-/Submission&expired=true>
- 原文："Please select the closest subject area for your submission. Can be updated until the submission deadline."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。主 PDF（最大 50 MB）只能在投稿截止（Mar 5, 2026, 11:00 PM CET）之前更新。补充材料窗口（至 Mar 12）不能用来修改主 PDF：补充材料不得包含论文 PDF 的更新版或更正版，也不得包含改进后方法得到的结果。rebuttal 期间无法修改 PDF。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>
- 原文："It may not include results obtained with an improved version of the method (e.g., following additional parameter tuning or training), or an updated or corrected version of the submission PDF."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料为可选项，截止 Mar 12, 2026, 11:00 PM CET，须为单个 ZIP 或 PDF，最大 200 MB。其内容必须在投稿时已经准备好。主论文中不允许附录，附录应放入补充材料。补充材料可包含视频、证明、额外的图或表、更详细的分析、同期投稿（concurrent submissions）以及匿名代码（鼓励提供，但为可选）。不允许外部链接、匿名 GitHub 链接和数据集链接。rebuttal 期间不能修改或添加代码。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**有条件**。投稿限 14 页，采用 Springer LNCS 格式，含图和表。仅包含参考文献的页面为额外页，且不限数量；不允许附录。更改字体（例如使用 CVPR 2026 字体）、页边距或格式的论文将被 desk reject。未提及 checklist 或伦理声明页（未规定）。Camera-ready 允许 15 页（不含参考文献），至少 6 页，致谢放在第 15 页。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>
- 原文："Papers are limited to 14 pages, including figures and tables, in the LNCS style of Springer. Additional pages containing only cited references are allowed."

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。ECCV 2026 的所有官方页面（Call for Papers、Submission Policies、FAQs、What's New、Author Guide、OpenReview 表单）均未规定每位作者的最大投稿数量，因此也未规定超出上限的处罚（未规定）。唯一与每篇论文相关的数字限制在注册方面：一个全额注册（full registration）最多可覆盖 2 篇论文。
- 置信度：中｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。除豁免者外，所有作者都会被自动加入审稿人池；PC 随后会审查审稿人资格。豁免对象：在 ECCV 2026 担任其他角色的作者、计算机视觉领域的新人或领域外人士，以及本科生或硕士生。特殊情况可凭 OpenReview ID 申请豁免（'too busy' 不算理由）。审稿人若错过审稿截止（Apr 21, 2026），或写出 'highly irresponsible' 的审稿意见（包括 LLM 生成的审稿意见），其作为作者的所有论文将面临 desk reject，由 PC 酌情决定。迟交审稿的审稿人的合作者会收到通知。'highly irresponsible' 的 AC 面临同样的处罚。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/ReviewerGuide>
- 原文："Any reviewer who fails to submit their assigned reviews by the deadline will face a desk rejection of all papers on which they are an author at the discretion of the PCs."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。每位作者都需要一个完整且组织者可见的 OpenReview profile。它必须满足 8 项标准，包括含机构域名的教育和职业经历，以及导师/关系/利益冲突（advisors/relations/conflicts）。作者还必须声明域名冲突和个人冲突，并填写 Author Enrollment Form。截止时间最初为 Feb 26 注册截止，后延至 Mar 2（Submission Policies 页面仍显示 Mar 2），最终延至 Friday Mar 6, 2026, 11 PM CET（Mar 4 首页公告）。profile 或 enrollment 不完整将导致 desk reject，利益冲突信息不准确可能导致直接拒稿（summary rejection）。没有机构邮箱的新 profile 可能需要长达 2 周的审核。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026>
- 原文："We have extended the deadline for completing OpenReview profiles and author/reviewer/AC/SAC enrollments to Friday, March 6th, 11 pm CET. This deadline is final and will not be extended."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**有条件**。允许在 arXiv 上发布，也允许添加视频链接或项目主页，但不得将该工作标注为 ECCV 投稿（否则有被 desk reject 的风险）。媒体禁令期（media embargo）从 Jan 29, 2026 持续到决定公布（Jun 17, 2026）：论文可以在媒体和社交媒体上讨论，但不得标明为计划投稿、已投稿或正在审稿的 ECCV 2026 论文。违规将导致拒稿，或被从会议和论文集中移除。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/FAQs>
- 原文："Q. Can I post my submission on arXiv? A. Yes. But you cannot label it as an ECCV submission, otherwise this would be at risk of desk rejection."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。自 Mar 13, 2026 至最终决定期间，实质相似的论文不得在其他地方处于审稿中（Call for Papers 给出的是 Mar 13 – Jun 17, 2026）。违规将导致拒稿，并通报另一 venue。'publication' 指经过同行评审、已被接收且篇幅超过 4 页（不含参考文献）的工作。4 页及以下的 workshop 论文、arXiv 预印本和技术报告是允许的，但超过 4 页的同行评审 workshop 论文即使是 non-archival 也算作 publication。没有规则涉及在其他地方被拒的论文（未规定）。政策提到来自 CVPR 2026 的重投稿件时，仅要求其使用 ECCV 字体。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。rebuttal 为可选项：一页双栏 PDF（含参考文献），使用 ECCV 2026 rebuttal 模板，截止 May 11, 2026, 11:00 PM CEST（审稿意见于 May 2 发布）。超出篇幅，或更改了页边距或格式的回复将不被审阅。rebuttal 必须保持匿名，不得包含外部链接，指向不属于本投稿的已有软件的链接除外。作者应避免提出新的贡献或结果，尤其是在审稿人未要求时。不能修改或添加代码（FAQ），且 Mar 5 之后没有更新论文 PDF 的机制。仅在特殊情况下才允许向 AC 发送保密评论。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**未规定**。没有任何官方网页规定撤稿截止时间或流程（未规定）。OpenReview venue 配置使撤稿的投稿保持非公开，且不公开其作者；desk reject 的投稿同样如此。撤稿论文对该论文的 PC、SAC、AC 和审稿人仍然可见。Submission Policies 还称，审稿意见和 author response 永远不会公开。
- 置信度：中｜来源：<https://api2.openreview.net/groups?id=thecvf.com/ECCV/2026/Conference>
- 原文："public_withdrawn_submissions : false; withdrawn_submission_reveal_authors : false"

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**不允许**。被拒论文和所有审稿意见均保持私密；没有可将其公开的 opt-in 选项。审稿中的投稿仅对其分配的程序委员会（PC、SAC、AC、审稿人）可见。审稿意见仅对作者、该论文的审稿人、AC 和 SAC 以及 PC 可见。OpenReview 设置为 `public_submissions=false` 和 `public_desk_rejected_submissions=false`。即使是被录用的论文，审稿意见也保持私密。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>
- 原文："The reviews and author responses will never be made public, and ECCV will not solicit comments from the general public during the reviewing process."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**允许**。作者可以使用任何工具（包括 LLM），但须对内容负全部责任。引用不存在的材料或出现明显事实错误将导致拒稿，可能不经审稿，且 'an LLM did it' 不能作为辩解。未规定披露要求。隐藏的 prompt injection 可能导致 desk reject 及进一步处罚，投稿表单要求通过一个勾选项确认不存在 prompt injection。camera-ready 论文可能会接受针对 AI 生成内容或幻觉的最终检查，即使已被录用也可能被拒。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/SubmissionPolicies>
- 原文："Finally, if a submission is found to contain prompt injection, it may be desk-rejected without review, and the authors may be subject to further sanctions."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇论文都必须由一位署名作者以全额注册（full registration，非学生、非线上）覆盖；主会论文作者须在 Jul 17, 2026（CEST）之前注册。一个全额注册最多可覆盖 2 篇论文。论文收录进论文集需要满足该注册要求并按时提交 camera-ready。论文应由作者或授权代表现场报告。如果无人到场且未向 PC 提交理由说明，论文可能会被从论文集中移除。
- 置信度：高｜来源：<https://eccv.ecva.net/Conferences/2026/Registration>
- 原文："Every paper must be covered by a full registration by a listed author of the paper."

#### 较去年变化（changes_vs_previous_year）

- 投稿系统：ECCV 2024 使用 CMT，CMT profile 中的域名冲突和 DBLP ID 须在论文注册截止前填写。ECCV 2026 使用 OpenReview，要求完整的 OpenReview profile 以及 Enrollment Form（最终截止 Mar 6, 2026, 11 PM CET）；profile 不完整将导致 desk reject。
- 2026 新增：每篇论文选择一个主要 Contribution Type（Algorithms/General、Theory/Foundational、Applied/Systems、Datasets/Benchmarks、Concept & Feasibility）。Datasets/Benchmarks 论文必须最迟在 camera-ready 时公开其数据，否则将被从论文集中移除。
- 审稿义务收紧。2024 仅 'expected' 作者愿意审稿。2026 作者会被自动加入审稿人池（有豁免），迟交或 'highly irresponsible' 的审稿人，以及 'highly irresponsible' 的 AC，其作为作者的所有论文将面临 desk reject。
- 2026 新增：明确禁止 prompt injection（desk reject 并加以处罚），投稿表单上设有确认勾选项。2026 camera-ready 说明还新增了 AI 内容和幻觉检查。
- 外部链接：2024 FAQ 允许在满足 4 个条件时链接到大型补充图片或视频。2026 禁止在论文、补充材料和 rebuttal 中使用扩展内容的外部链接，并禁止匿名 GitHub 链接和数据集链接。
- 2026 明确规定主论文中不允许附录，附录必须放入补充材料。2024 的页面没有此类说明。
- 2026 模板使用新字体。使用其他字体，或页边距、格式有显著改动的重投稿件（例如来自 CVPR 2026）将被 desk reject。
- 录用后的作者顺序：2024 FAQ 称修改 'may be considered, but only in special circumstances'，尽管 2024 Submission Policies 已称投稿截止后不允许修改。2026 FAQ 称此类修改 'will not be possible'，但 Jun 23, 2026 公告允许在 camera-ready PDF 中调整顺序并更换通讯作者。两年均禁止在注册后添加或删除作者。
- arXiv：2024 对在决定公布前未在 arXiv 上发布的录用论文给予特别认可。2026 没有此类激励。
- 出席：2026 新增规定，若论文没有作者或代表到场，且未向 PC 提交理由说明，论文可能会被从论文集中移除。
- 注册：2024 一个主会全额注册可覆盖 1 篇主会论文加 1 篇 workshop 论文，作者须在 Jul 17, 2024 AoE 之前注册。2026 一个全额（非学生、非线上）注册最多可覆盖 2 篇论文，作者须在 Jul 17, 2026 CEST 之前注册。
- 一稿多投的审稿期现在有明确日期：Mar 13, 2026 至最终决定（Jun 17, 2026）。
- 摘要长度：2024 建议约 150 词。2026 建议不超过 4,000 字符的 OpenReview 限制。
- Rebuttal：2026 规定一页限制包含参考文献；2024 仅称 'one page'。
- 审稿人的 LLM 规则：2024 允许审稿人用 LLM 润色措辞，但禁止将投稿展示给 LLM。2026 禁止使用 LLM 撰写审稿意见或 meta-review，或与 LLM 共享论文或审稿内容；What's New 仍允许背景调研和短语级语法检查。违规将被视为 'highly irresponsible'，并可能导致该审稿人自己的论文被 desk reject。

#### 官方来源矛盾与注意事项

- **camera-ready 调序：** Submission Policies 说投稿截止后 'no changes are allowed thereafter, including for accepted papers'，FAQ 说录用后改顺序 'will not be possible'；但 Jun 23, 2026 的 camera-ready 公告允许在 PDF 中调序并更换通讯作者，Meteor 再从 PDF 提取。上传 Meteor（Jun 30 AoE）后顺序和姓名拼写彻底固定。
- **profile 截止：** Submission Policies 页仍显示 Mar 2（没有更新），Mar 4 首页公告已定为 Mar 6, 2026, 11 PM CET。
- **摘要长度：** FAQ 建议不超过 4,000 字符，OpenReview 表单实际接受 5,000 字符。
- **2024 的旧矛盾（仅供对照）：** ECCV 2024 的 Submission Policies 说投稿后名单即定、'including for accepted papers'，而 2024 FAQ 说录用后调序 'may be considered'。

### 3.6 AAAI-27

> AAAI-27 (41st AAAI Conference on Artificial Intelligence), Main Technical Track, Montréal, Canada, Feb 16-23, 2027

- **届次（edition_used）：** AAAI-27，即本届会议。于 2026-09-24 核对了 aaai.org 线上页面（CFP、Submission Instructions、Paper Modification Guidelines、Review Process、Supplementary Material、Paper Publication and Conference Attendance、Policies for AAAI-27 Authors、Registration、AI Alignment 和 AISI 征稿通知）、Jul-Aug 2026 的 Wayback 存档、OpenReview API（group `AAAI.org/2027/Conference` 以及 invitation `AAAI.org/2027/Conference/-/Submission`，最后修改于 2026-08-18），以及 Aug 2026 关于 2-cycles 的 PDF 公开信。目前尚无 AAAI-27 rebuttal FAQ，也还没有审稿人说明页面：两个猜测的 URL 均返回 404，OpenReview 上也看不到公开的 Rebuttal invitation。
- **投稿系统（submission_system）：** OpenReview（venue id `AAAI.org/2027/Conference`）。作者注册于 Jun 17, 2026 开放，投稿于 Jun 30, 2026 开放。摘要注册表单于 Jul 21, 2026 AoE 关闭（OpenReview duedate 为 2026-07-22 11:59 UTC），正文截止为 Jul 28, 2026 AoE，补充材料截止为 Jul 31, 2026 AoE。AI Alignment track 使用单独的投稿网站和自己的日期。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。每篇论文都必须在 Jul 21, 2026 11:59 PM AoE 前完成摘要注册，然后在 Jul 28, 2026 AoE 前提交正文，'no individual exceptions'。注册时必须填写完整标题和完整摘要；OpenReview 表单中的 TL;DR 字段同样为必填。占位或空白的标题和摘要会被删除，这些作者不得提交正文。若摘要在两个截止日期之间发生实质性变化，PC 可不经审稿直接拒稿。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/submission-instructions/>

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。Jul 21 至 Jul 28 期间可以编辑标题，但不得作实质性改动；若标题所描述的研究在性质上不同，将不经审稿直接拒稿。Jul 28 之后直至通知，标题不能修改：此时只有补充材料可以修改，截至 Jul 31。camera-ready 阶段（截止 Dec 14, 2026），作者可通过 camera-ready 投稿网站申请修改标题。Dec 14 之后，只有在出版方要求时才会进行修改。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："During camera-ready submission (deadline December 14), authors may request to modify their paper title through the camera-ready submission site."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。Jul 21 至 Jul 28 期间可以编辑摘要和 TL;DR，但不应作实质性改动；若摘要在性质上不同，将不经审稿直接拒稿。从 Jul 28 直至通知，摘要的任何内容都不能修改。规则未规定 camera-ready 阶段能否修改摘要；明确允许的只有标题修改申请。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："If the Program Chairs determine that an abstract or title has been changed to the extent that it describes research that is qualitatively different, the paper will be rejected without review."

**`author_add`｜截止后还能加作者吗？**

- 答案：**有条件**。Paper Modification Guidelines 将 'list of authors' 和 'author order' 列为从 Jul 21 摘要截止到 Jul 28 正文截止（11:59 PM AoE）期间可修改的项目，因此可在此窗口内添加作者。每位新增作者都需要 OpenReview profile，且须在 10 篇投稿的上限之内。Jul 28 之后不能再添加任何作者。Submission Instructions 写有 'authors may not be added to papers following submission'，但又让读者参阅 Modification Guidelines 了解完整政策，因此其中的 'submission' 最可能指正文提交。camera-ready 阶段，作者 'cannot be added or deleted under any circumstances'。稳妥的做法是在 Jul 28 之前确定作者名单。
- 置信度：中｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："Note that authors cannot be added or deleted under any circumstances."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**有条件**。作者名单（包括删除作者）只能在正文截止 Jul 28, 2026 AoE 之前修改。从 Jul 28 直至通知，任何内容都不能修改，且 AAAI 不会在规定窗口之外 'correct author information'。camera-ready 阶段（Dec 14, 2026）在任何情况下都不能删除作者。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："After the July 21 abstract deadline and until the July 28 paper submission deadline, the following items can be changed"

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。作者顺序明确可以在 Jul 28, 2026 AoE 之前修改，此后直至通知不能修改。AAAI-27 的 camera-ready 规则只提到添加和删除作者，未提及顺序。AAAI-26 曾明确禁止在 camera-ready 阶段修改作者顺序，但 AAAI-27 对此未作说明，因此 camera-ready 阶段能否调整顺序未规定；请向 workflowchairs@aaai.zendesk.com 确认。
- 置信度：中｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："After the July 31 deadline and before notification NOTHING can be changed."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**必须**。作者的添加和删除在正文截止 Jul 28, 2026 11:59 PM AoE 时冻结，并一直冻结到 camera-ready 阶段（'cannot be added or deleted under any circumstances'）。camera-ready 之后，只有在出版方要求时才会修改。AAAI 表示不会在规定窗口之外受理更正已提交材料的请求，'including ... correcting author information'，且不予任何例外。未规定正式的申请流程或额外处罚。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/submission-instructions/>
- 原文："MODIFICATIONS TO SUBMISSIONS ARE ONLY ALLOWED UNTIL THE FULL PAPER DEADLINE (July 28 for Phase 1 submissions). No exceptions will be granted."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**不允许**。从 Jul 21 摘要截止直至审稿结束，primary topic、secondary topics（表单中为 1-5 个）以及提名的互审审稿人（reciprocal reviewer）都不能修改。论文不能在 main track 与 AISI 或 AI Alignment track 之间转移。若要投 AI Alignment（单独网站；摘要 Aug 14，论文 Aug 21, 2026），作者必须将 main track 论文撤稿并新建投稿。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："After the July 21 abstract deadline and until the end of review process the following items cannot be changed:"

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**有条件**。正文 PDF（'submitted paper'）只能在 Jul 28, 2026 AoE 之前替换。Jul 28 至 Jul 31 期间只能修改补充材料。Jul 31 之后直至通知，任何内容都不能修改，包括 Oct 19-25 的 feedback 窗口期间。这也包括替换上传错误的文件。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："After the July 28 paper submission deadline, and until the July 31 supplementary material deadline, the following items can be changed:"

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。可选的补充材料截止于 Jul 31, 2026 11:59 PM AoE，分三个独立的 OpenReview 字段提交：Technical Supplement PDF（最大 10MB）、Media Supplement ZIP（最大 50MB）和 Code and Data Supplement ZIP（最大 50MB）。这些大小限制只出现在 OpenReview 表单中，aaai.org 页面上没有。禁止放置网络链接，包括 Anonymous GitHub 和 Hugging Face。正文必须自成一体，审稿人无需查看补充材料。由于正文 PDF 的第 8-9 页只能放参考文献，附录实际上应放在单独的 PDF 中。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/supplementary-material/>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。投稿允许 7 页正文内容、总计 9 页，其中第 8-9 页只能放参考文献。任何伦理声明都必须放在 7 页正文内容之内，且须省略致谢。可复现性检查表（reproducibility checklist）单独上传，不属于 PDF。camera-ready 论文可有 7 页加最多 2 页致谢/参考文献，并可按每页 $300 购买最多 2 页额外正文内容。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/submission-instructions/>
- 原文："Acknowledgements should be omitted from papers submitted for review, and any ethical statements or similar considerations, if included, must be included in the 7 content pages."

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。每位作者最多可出现在 10 篇 technical track 投稿中，Submission Instructions 将 AI Alignment 和 AISI track 排除在外。CFP 摘要只写了 'Authors may be listed on at most 10 AAAI-27 submissions'，没有这一排除说明。未规定超出上限的自动后果。不过 CFP 的伦理违规清单确实涵盖了为规避投稿数量限制而进行的隐蔽投稿或 'shotgun' 投稿，处罚从 desk reject 到多年禁投不等。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/submission-instructions/>

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。CFP 规定，除非有特殊情况，所有符合资格的作者都必须能够参与审稿（工作量较轻）；Submission Instructions 仍然写的是所有作者 'expected' 加入审稿人池。每篇论文须提名一位符合资格的作者：不能是 SPC、AC 或组织者，且至少在经同行评审的存档类（archival）venue 上发表过 2 篇第一作者论文或 5 篇合著论文（workshop 论文不计）。被提名者同意审最多 6 篇论文，提名在 Jul 21 AoE 之后不能更改。作者也可以改为声明没有作者符合资格，但若该声明被证明不实，须接受 desk reject。如果存在符合资格的作者却未提名，或被提名者未完成其审稿任务，论文可能被 desk reject。串通互审或 bidding 约定属于伦理违规；Aug 2026 的公开信新增了防止审稿人 2-cycles 的硬约束和软约束。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=AAAI.org/2027/Conference/-/Submission&expired=true>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。每位作者在被列入投稿之前都必须拥有 OpenReview profile。对最初的作者而言，这意味着须在 Jul 21 摘要注册时已有 profile；在 Jul 21-28 窗口内新增的作者需在被添加之前拥有 profile。profile 必须包含完整的发表署名（full publication name）、当前职位、机构邮箱，以及 DBLP URL（如有）（处于 DBLP 消歧页面上的作者使用 AAAI 的声明表格）。profile 不完整会使投稿面临 desk reject。作者必须在所有投稿和审稿中使用同一个 OpenReview 账号，并可自行列出利益冲突（可选）。关于没有机构邮箱的新 profile 审核可能长达两周（two weeks）的说明，只出现在 AI Alignment track 页面上，而不在 main track 页面上。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=AAAI.org/2027/Conference/-/Submission&expired=true>

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。未经审稿的预印本（arXiv、社交媒体、个人网站）、非存档（non-archival）workshop 以及研究报告（包括在线公开的摘要或视频）不视为破坏匿名。未规定 embargo 或匿名期。投稿不得引用或指向公开版本，公开版本也不得声明该工作已投稿至 AAAI-27；违者可能被直接拒稿（summary rejection）。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/review-process/>

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。截至论文截止日期，该工作不得正在其他存档类（archival）会议或期刊审稿中、已被其录用或已在其发表，包括提供审稿后存档选项（post-review archival option）的会议。arXiv 和非存档 workshop 可以。作者可在投稿 AAAI-27 之前从其他 venue 撤稿，但在 AAAI-27 作出决定或论文撤稿之前不得投往其他地方。同一作者内容重叠的论文会被放在一起评估新颖性，'thin slicing' 或仅作表面改动的重复论文可能被直接拒稿。OpenReview 表单要求将其他同时在投的论文以匿名方式引用为 'under review'。对于此前在其他地方被拒的论文，未规定。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/submission-instructions/>

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**未规定**。AAAI-27 只确定了时间窗口：Oct 19-25, 2026（AI Alignment track：Oct 27-Nov 2），仅限 Phase 2 论文，用于回应两个阶段审稿意见中的问题或事实错误。根据 CFP，作者也可以回应 AI 生成的审稿意见。截至 2026-09-24，长度限制以及关于上传 PDF、新实验、图表或链接的规则均未规定（尚未公布）。AAAI-26 的 FAQ（一条 2500 字符的回复、不得包含 URL、不得提供新结果）是去年的规则，尚未确认适用于 2027。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/review-process/>
- 原文："A single author feedback phase will give authors of papers from Phase 2 an opportunity to address questions or factual mistakes in reviews (from both phases), running from October 19-25, 2026."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。论文可以撤稿，且撤稿是最终的。OpenReview 配置中确实定义了撤销撤稿（withdrawal-reversion）的 invitation，但书面政策称撤稿不会被撤销。未公布撤稿截止日期（未规定）。OpenReview 配置设置了 `public_withdrawn_submissions=false` 和 `withdrawn_submission_reveal_authors=false`，因此撤稿论文不会公开，其审稿意见也随之不公开。
- 置信度：中｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-modification-guidelines/>
- 原文："Paper withdrawals are final and will not be reverted."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**未规定**。AAAI-27 没有任何书面政策涉及公开被拒论文或其审稿意见（未规定）。OpenReview venue 配置设置了 `public_submissions=false` 和 `public_desk_rejected_submissions=false`，这提示被拒和被 desk reject 的论文及审稿意见保持不公开，且不提供 opt-in。
- 置信度：中｜来源：<https://api2.openreview.net/groups?id=AAAI.org/2027/Conference>

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。作者可以审慎使用生成式 AI，但须承担全部责任；抄袭和引用不存在的参考文献会受到处罚。禁止使用 LLM 生成的文本，除非其作为实验分析的一部分，但允许对作者自己撰写的文本进行编辑或润色。AAAI 出版政策要求在稿件中记录任何 AI 系统所起的作用，且 AI 不能作为作者或可引用的来源。针对 AAAI 审稿系统的 prompt injection 攻击属于伦理违规，处罚从 desk reject 到多年禁投不等。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/policies-for-aaai-27-authors/>

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。至少一位作者必须按线下（in-person）费率注册并现场报告。没有远程报告选项；虚拟注册仅面向参会者。作者在 camera-ready 时确认：'I commit to an author presenting the paper in-person at AAAI-27.' 未满足要求的论文会在出版前被移除。未公布单独的作者注册截止日期（未规定）。早鸟费率截至 Dec 15, 2026，标准费率截至 Jan 10, 2027（11:59 PM EST）。退款申请截至 Jan 10, 2027，收取 $100 手续费；签证邀请函只发给已付费的注册者。
- 置信度：高｜来源：<https://aaai.org/conference/aaai/aaai-27/paper-publication-and-conference-attendance/>
- 原文："Conference registration and presentation are required for a paper to be included in the proceedings. Papers that do not meet these requirements will be removed before publication."

#### 较去年变化（changes_vs_previous_year）

- 截止日期提前约一周。AAAI-26 (2025)：摘要 Jul 25，论文 Aug 1，补充材料 Aug 4。AAAI-27 (2026)：摘要 Jul 21，论文 Jul 28，补充材料 Jul 31。AAAI-27 随后的日程为：Phase 1 拒稿 Sep 24, 2026，author feedback Oct 19-25，最终决定 Nov 30，camera-ready Dec 14, 2026。
- 页数限制收紧。AAAI-26 允许 7 页正文内容，外加不限页数的参考文献和可复现性检查表（reproducibility checklist），后者放在 PDF 内。AAAI-27 将 PDF 上限定为 9 页（第 8-9 页只能放参考文献），要求任何伦理声明放在 7 页之内，并将检查表改为单独上传。
- camera-ready 页数从 7 页加不限页数的参考文献/致谢（AAAI-26）改为 7 页加最多 2 页。与之前相同，可按每页 $300 购买最多 2 页额外正文内容。
- 10 篇上限现在只计算 main technical track。AAAI-26 包括 AI Alignment 和 AISI track；AAAI-27 的 Submission Instructions 将其排除，不过 CFP 摘要仍写作 'at most 10 AAAI-27 submissions'。
- 审稿义务更严格。AAAI-26 中所有作者 'expected' 参与审稿，每篇论文至少提名一位作者作为 'serve_as_reviewer'。AAAI-27 要求所有符合资格的作者都能参与审稿，新增正式的互审审稿人（reciprocal reviewer）提名（设有资格门槛、最多审 6 篇论文、Jul 21 后锁定，或声明没有作者符合资格），并可能对未提名或被提名者未完成审稿的论文 desk reject。
- profile 声明（profile 须为最新，否则 desk reject）在 AAAI-26 中已经存在。AAAI-27 新增了 'full publication name'，以及另外两项必填声明：未同时在其他存档类（archival）venue 审稿中，以及对同时在投的论文以匿名 'under review' 方式引用。
- 摘要截止后锁定的项目有所变化。AAAI-26 锁定联系作者和 subject areas。AAAI-27 锁定 primary topic、secondary topics 以及提名的互审审稿人。TL;DR 在 AAAI-26 表单中为选填；在 AAAI-27 中为必填，并被列为在 Jul 28 之前可编辑但不可作实质性修改的项目。
- camera-ready 阶段的标题修改现在通过 camera-ready 网站进行；AAAI-26 则是在其 preprint 截止前发邮件至 aaai26@aaai.org。AAAI-26 明确规定 camera-ready 阶段不能修改作者顺序；AAAI-27 的文本只说不能添加或删除作者。
- 补充材料。AAAI-26 已允许三类材料（技术附录 PDF、多媒体 ZIP、代码和数据 ZIP），但其 OpenReview 表单只有一个 50MB ZIP 字段，并称投稿 'should not' 指向网络上的材料。AAAI-27 设有三个独立字段（10MB PDF、50MB ZIP、50MB ZIP），措辞改为 'must not'，并点名 Anonymous GitHub 和 Hugging Face。AAAI-27 新增：'will be released after acceptance' 不算作可复现性的证据。
- 多重投稿政策详细得多：包括重叠投稿和 'thin slicing' 规则、要求以匿名 'under review' 方式引用同时在投的论文，以及确认论文未在提供审稿后存档选项（post-review archival option）的会议审稿中。
- AAAI-27 CFP 新增了明确的伦理违规清单：prompt injection、互审或 bidding 串通、马甲（sock-puppet）审稿人、经 LLM 改写的近似重复论文以及 shotgun 投稿。处罚从 desk reject 到多年禁投不等。Aug 2026 的一封公开信宣布了防止审稿人 2-cycles 的硬性和软性匹配约束。
- AI 辅助审稿试点从 AAAI-26 延续下来，并有所修订。两个官方页面对 Phase 1 的说法不一致：review-process 页面称 'Every paper will be allocated three reviewers'，而 CFP 称是两份人工审稿意见加一份 AI 审稿意见。
- 会议改为在 Montréal 线下举行（Feb 16-23, 2027），而不是 Singapore（Jan 20-27, 2026）。线下报告要求和 LLM 政策文本基本未变。

#### 官方来源矛盾与注意事项

- **能否在 Jul 21–28 加作者：** Submission Instructions 写 'authors may not be added to papers following submission'，Paper Modification Guidelines 则把 'list of authors' 列为 Jul 21 到 Jul 28 可改的项目。核对表认为这里的 'submission' 多半指正文提交；稳妥做法是 Jul 28 前定好作者。
- **10 篇上限的范围：** Submission Instructions 排除 AI Alignment 和 AISI track；CFP 摘要只写 'Authors may be listed on at most 10 AAAI-27 submissions'，没有这个例外。
- **审稿义务措辞：** Submission Instructions 仍说所有作者 'expected' 进审稿池；CFP 说合格作者 'required'。
- **撤稿能否恢复：** OpenReview 配置定义了 withdrawal-reversion invitation，书面政策却说 'Paper withdrawals are final and will not be reverted.'
- **Phase 1 审稿人数：** review-process 页写 'Every paper will be allocated three reviewers'，CFP 写两位人类审稿人加一份 AI 审稿。
- **profile 审核两周：** 这条提示只出现在 AI Alignment track 页面，主 track 页面没有。

### 3.7 IJCAI-ECAI 2026

> IJCAI-ECAI 2026 (35th International Joint Conference on Artificial Intelligence, Bremen, Germany, Aug 15-21, 2026), Main Track

- **届次（edition_used）：** IJCAI-ECAI 2026。本轮已结束：会议已于 Aug 15-21, 2026 举行，并已列出 972 篇录用论文。IJCAI-27 已在 ijcai.org/future_conferences 上公布（Kyoto, Aug 7-13, 2027，另加中国 Hengqin, Aug 15-17, 2027；Conference Chair Sarit Kraus，Program Chair Bo An），但尚无 IJCAI 2027 CFP。截至 2026-09-24，2027.ijcai.org 仍返回 HTTP 401，因此以下所有规则均为 2026 规则。
- **投稿系统（submission_system）：** Chairing Tool（chairingtool.com/conferences/IJCAIECAI2026/main-track），不是 OpenReview。IJCAI 2025 使用的是 CMT（cmt3.research.microsoft.com/IJCAI2025）。camera-ready 通过 proceedings.ijcai.org 提交（由 ConfDNA 运营）。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。标题、作者姓名、联系方式、简短摘要以及最多 3 个 content-area 关键词必须在 Jan 12, 2026, 23:59 AoE 之前提交。正文截止为 Jan 19, 2026，且不允许只提交摘要（FAQ S10）。占位摘要 'will be removed without consideration'；Dec 2025 存档的 CFP（以及 2025 CFP）中的措辞是 'may be removed'。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："However, submissions with “placeholder” abstracts will be removed without consideration."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。在摘要截止（Jan 12）与正文截止（Jan 19, 2026）之间允许对标题做小幅修改。Jan 19 之后或 camera-ready 阶段能否修改标题，官方未规定：proceedings.ijcai.org 只要求作者 'validate the metadata that was initially provided during the peer-review submission'。FAQ S9 建议标题最多 2 行，3 行为严格上限。
- 置信度：中｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："It will be possible to make minor edits to the title and abstract until the full paper submission deadline."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。在正文截止（Jan 19, 2026）之前允许对摘要做小幅修改；只允许 'minor' 修改，占位摘要会被移除。Jan 19 之后或 camera-ready 阶段能否修改摘要，官方未规定。FAQ S9 未给出硬性长度上限，建议约 200 词。
- 置信度：中｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："It will be possible to make minor edits to the title and abstract until the full paper submission deadline."

**`author_add`｜截止后还能加作者吗？**

- 答案：**有条件**。作者名单在 Author Information 截止时定稿，该截止与正文截止相同（Jan 19, 2026, 23:59 AoE），因此只能在此之前添加作者。FAQ S11 重申 'no additional author will be allowed after the Author Information deadline has passed'。此后一律不允许添加作者，包括 camera-ready 阶段：ijcai26.tex 模板写明 'It is strictly forbidden to add authors not declared at submission time.'
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："The list of author names provided at the Author Information Deadline is final. Authors may not be added to or removed from papers following submission."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**有条件**。只能在 Author Information 截止暨正文截止（Jan 19, 2026）之前移除作者。此后，proceedings FAQ 'in all cases' 拒绝任何添加、移除或替换作者的请求，camera-ready 阶段也不例外。未按邮件中的步骤确认作者身份的共同作者将被从论文中除名（FAQ S12）。
- 置信度：高｜来源：<https://proceedings.ijcai.org/info>
- 原文："You cannot. IJCAI's policy is that the set of authors must be the same as those submitting the paper. This is a strict policy that applies in all cases."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。录用论文可在 camera-ready 期间调整作者顺序（camera-ready 截止 May 20, 2026；FAQ S11 予以确认）。添加或移除作者仍不允许。审稿期间（Jan 19 至通知之间）能否调整作者顺序，官方未规定。此规定仅适用于 main track：AI and Health 特别赛道的 CFP 则写明 'list and ordering of authors registered at the paper submission deadline is final'。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："(The author’s ordering may still be changed during the camera-ready period.)"

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**不允许**。作者集合在 'Author information and Full paper submission deadline'（Jan 19, 2026, 23:59 AoE）冻结。在此之前，每位共同作者都必须在 Chairing Tool 注册、填写 author information form 并提供 ORCID，否则投稿可能被不经审稿直接拒绝。冻结后没有任何变更流程：添加、移除和替换作者均会被拒绝，只有拼写错误的姓名可通过 proceedings@ijcai.org 更正。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**未规定**。在提交摘要时选择最多三个 content-area 关键词。官方未规定关键词或赛道（main 与 special）在摘要截止后或 Jan 19 之后能否更改。
- 置信度：中｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："When submitting abstracts, authors must choose up to three content area keywords."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。PDF、technical appendix 和 resubmission file 均须在正文截止（Jan 19, 2026；FAQ S6）前提交，且没有截止后的修改窗口。此后作者唯一能提交的内容是 1 页的 rebuttal，其中不得加入新结果、代码或实验（AR11, AR12）。没有任何文字明确写明 'no PDF edits after the deadline'，因此这一结论是根据截止时间结构推断的。唯一可能的例外：伦理政策称，被标记的论文可能被要求 'revise their submissions' 以加入伦理讨论。
- 置信度：中｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："Supplementary material (e.g., appendices, data, source code, resubmission information) must be submitted by the full paper submission deadline."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。截止 Jan 19, 2026：最多 50MB，仅限 PDF 或 ZIP，须完全匿名（包括代码中硬编码的路径和 URL），分两个上传槽位提交（'Technical Appendix' 和 'Resubmission File'）。审稿人自行决定是否阅读附录，IJCAI 不发表补充材料。放在主 PDF 内（正文之后、参考文献之前）的附录计入页数限制（ijcai26.tex）。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："Authors may submit up to 50MB of supplementary material, such as appendices, proofs, derivations, data, or source code; all supplementary material must be in PDF or ZIP format."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**有条件**。投稿正文 7 页（含所有图表），另加最多 2 页参考文献。可选的伦理声明可放在其中任一部分；不允许包含致谢和贡献声明；必须带行号（模板要求）。超页或违反格式要求的论文将被不经审稿直接拒绝。camera-ready 阶段：7 页内容，另加 2 页仅用于致谢、伦理、贡献声明和参考文献，并可额外购买最多 2 页内容页，每页 USD 300。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。每位作者在 Primary Paper Initiative 覆盖的 main、survey 和 special tracks 中合计最多参与 8 篇投稿；workshop 及其他非 PPI 赛道不计入（FAQ S17）。另有三个赛道额外设置每位作者 1 篇的上限：Survey（超出的论文按 submission ID 被 desk reject）、Human-Centred AI 和 AI and Health（两者均为 'disqualified'）。main-track CFP 未对超过 8 篇上限规定具体处罚，只有一般性处罚：不经审稿直接拒绝，并可能被禁止参加今后的 IJCAI。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："Submission limit: IJCAI-ECAI 2026 will enforce a strict submission limit. Each author is limited to no more than 8 submissions to IJCAI-ECAI 2026."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。每位作者都会进入审稿人池，并可能被邀请审稿。豁免对象：已在担任职务者（PC、SPC、AC、SAC、组织者）以及不具备资格者（例如本科生和低年级研究生），另对育儿假等情况提供豁免。对审稿敷衍的作者是否给予 desk reject 处罚，官方未规定。相反，PPI 收入用于以早鸟注册折扣奖励审稿人：Gold 为全额注册费，Silver 为 50%，Bronze 为 25%（Bronze 覆盖按时完成 3-4 篇审稿的 PC，以及完成 1-2 篇审稿的紧急审稿人，含作者）。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："By submitting to the conference, each author volunteers to be entered into the pool of potential PC members/reviewers for IJCAI-ECAI 2026 and may be asked to review papers for the conference."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。这里使用的是 Chairing Tool，不是 OpenReview。在 Jan 19, 2026 之前，每位共同作者都需要拥有账号、填写完 author information form、提供 ORCID，并通过邮件中的步骤确认作者身份；否则该作者会被除名，或论文可能被不经审稿直接拒绝。'Pending confirmation' 通常表示邮箱不匹配，可通过将另一个邮箱添加为 secondary email 来解决（FAQ S25）。利益冲突遵循 IJCAI COI policy：48 个月内的合著者、60 个月内的导师或学生、同一机构等。
- 置信度：高｜来源：<https://2026.ijcai.org/submissions-faq/>
- 原文："They must acknowledge the authorship by following the steps sent to their email. Failing to do that will result in the exclusion of the author from he paper."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。非匿名预印本（arXiv、社交媒体、网站）以及此前在非存档（non-archival）场合的发表不会导致拒稿，官方未规定任何 embargo 或匿名期。投稿本身仍须完全匿名，包括 PDF 元数据。审稿人被告知不要主动搜索预印本。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："The existence of non-anonymous preprints (on arXiv, social media, websites, etc.) and prior publication in non-archival venues will not result in rejection."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。在正文提交时，正在期刊或存档场合（有 DOI、ISBN 或 ISSN）审稿中、已被其录用或已在其发表的论文不予接收，且在 IJCAI 审稿期间也不得投往此类场合。非存档 workshop 没有问题；在其他场合发表的篇幅明显更短、且无重叠技术内容的版本也可以，前提是作为 resubmission 声明（S23）。过去 12 个月内被同行评审会议拒稿的论文必须声明这一点，并上传被拒版本及其审稿意见。若论文在其他场合的决定落在 Jan 12 至 Jan 19 之间，可以先注册，但如被对方录用则必须撤稿（S4）。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。只有通过 Phase 1 的论文（summary reject 于 Mar 4, 2026 发出）才能回复，时间为 Apr 7 to 10, 2026。回复为 1 页 PDF，使用 ijcai26-authors-response 模板，内容仅限于审稿人的紧要问题和事实性错误；另有一个单独的保密文本框用于反映不道德的审稿，仅 SPC、AC 和 PC chairs 可见；任何作者都可在截止前更新回复。不允许提供代码链接或上传内容，也不允许加入新实验（AR11, AR12），但允许用于解释的图或示例（AR13）。若审稿意见迟到，可通过邮件申请 24 小时延期（AR7）；不提交修改版论文 PDF。
- 置信度：高｜来源：<https://2026.ijcai.org/authors-reponse-faq/>
- 原文："Your response to (1) and (2) is limited to 1-page, using the template provided by IJCAI-ECAI 2026 at www.ijcai.org/sites/default/files/Guidelines/ijcai26-authors-response.zip."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。撤稿机制存在，且有时是强制的：FAQ S4 要求论文若在 Jan 12 至 Jan 19 之间被其他场合录用则必须撤稿；审稿期间禁止一稿多投，这意味着投往其他场合之前须先撤稿。官方未公布一般性的撤稿截止或流程。官方未规定撤稿论文或其审稿意见会被公开；所有投稿均保密。
- 置信度：中｜来源：<https://2026.ijcai.org/submissions-faq/>
- 原文："If the paper is accepted during this period, you must withdraw the IJCAI submission."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**不允许**。被拒和撤稿的论文及其审稿意见不会公开，也没有 opt-in：投稿在发表前均保密，审稿在封闭的 Chairing Tool 中进行。Principles of Peer Review 页面补充说明，投稿仅对授权审稿人可见，作者只能以匿名形式披露其收到的审稿意见。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>
- 原文："Confidentiality policy: All submissions will be handled with strict confidentiality until their publication date."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。LLM 不能作为作者，作者对全部内容负完全责任，在方法或实验中使用的 LLM 生成文本必须加以记录说明。FAQ S22 仅允许用 LLM 润色风格和语言：IJCAI 使用 LLM 检测工具，被认定为 LLM 撰写的论文将被 desk reject（Survey Track CFP 另规定，事实性错误（包括参考文献中的错误）也会导致 desk reject）。关于隐藏提示词（hidden prompts）或提示词注入（prompt injection），官方未规定。
- 置信度：高｜来源：<https://2026.ijcai.org/submissions-faq/>
- 原文："No. You can use an LLM to polish the style and the language. IJCAI will employ LLM detection tools! Papers found to be written by LLMs will be desk rejected."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇录用论文需要一个 regular 或 'Student with Paper' 注册（一个注册可覆盖多篇论文，R1），且须有一位作者在 Bremen 现场报告：6 分钟报告加 2 分钟问答，外加一张 A0 海报。没有 hybrid 选项。注册窗口：早鸟 May 15 to Jun 15，晚期 Jun 16 to Jul 15，现场 Jul 16 to Aug 21, 2026；未规定单独的作者注册截止。若没有作者到场报告，论文将从论文集中移除（论文集在会后定稿），除非事先经 pcchair@2026.ijcai.org 获得 IJCAI 批准的例外。注册不可转让，Jul 15 之前取消需支付 USD 150，Schengen 签证邀请函仅在付款后签发（表单只能填写一次）。
- 置信度：高｜来源：<https://2026.ijcai.org/registration/>
- 原文："Should none of the authors be able to attend in Bremen, the paper will be removed from the Conference Proceedings!"

**`ppi_submission_fee`｜Primary Paper Initiative 的投稿费怎么收？**（会议特有）

- 答案：**有条件**。凡与另一篇 PPI 覆盖赛道中的 IJCAI-ECAI 2026 投稿有任何共同作者的完整论文，每篇收取 USD 100；primary papers 免收。该费用截止于 Jan 26, 2026（正文截止后一周）。任何作者均可付款（S18），仅提交摘要不收费（S20），被 desk reject 时费用不予退还（S21）。
- 置信度：高｜来源：<https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/>

**`camera_ready`｜camera-ready 的截止和要求是什么？**（会议特有）

- 答案：**必须**。main track 的 camera-ready 截止为 May 20, 2026，在 proceedings.ijcai.org 提交，需要签署的版权表、PDF、LaTeX 或 Word 源文件、元数据核对和编辑审查，如有额外页面还需付费。作者和单位信息为必填，致谢和贡献声明为可选，且必须关闭行号。此阶段可以更改作者顺序，但不能更改作者集合。
- 置信度：高｜来源：<https://2026.ijcai.org/important-dates/>
- 原文："May 20th. Camera Ready Copy"

#### 较去年变化（changes_vs_previous_year）

- 投稿系统从 CMT（IJCAI 2025）改为 Chairing Tool。
- 新增 Primary Paper Initiative：每篇非 primary 论文收取 USD 100 费用（截止 Jan 26, 2026，desk reject 不退款）。所得款项用于资助审稿人的早鸟注册折扣：Gold 为全额注册费，Silver 为 50%，Bronze 为 25%。
- 占位摘要的措辞从 'may be removed'（2025 CFP 以及 2026 CFP 的 Dec 2025 草稿）改为最终 2026 CFP 中的 'will be removed without consideration'。
- 页边距或字号缩小等格式违规的处理从 'may be rejected without review'（2025）改为 'will be rejected without review'（2026）。
- ORCID 现对所有作者强制要求，共同作者须通过邮件中的步骤确认作者身份，否则会被除名（FAQ S12）。2025 年，共同作者只需在 CMT 中填写作者信息。
- 新增 FAQ S22：LLM 仅可用于润色风格和语言，会使用 LLM 检测工具，LLM 撰写的论文将被 desk reject。2025 仅有一般性的 'LLMs are not authors, authors are responsible' 表述。
- 2026 CFP 明确禁止在投稿中包含致谢和贡献声明。2025 CFP 中关于 camera-ready 最多可额外购买 2 页的说明已移至 proceedings.ijcai.org，该网站仍列出 2 页、每页 USD 300。
- rebuttal FAQ 新增：审稿意见迟到时可申请 24 小时延期（AR7）。rebuttal 在 Chairing Tool 而非 CMT 中提交，使用 ijcai26-authors-response 模板。
- 与 2025 相比的日期变化：摘要截止 Jan 12（原 Jan 16）、正文截止 Jan 19（原 Jan 23）和 summary reject Mar 4（原 Mar 7）提前，而 author response Apr 7-10（原 Apr 6-9）和通知 Apr 29（原 Apr 28）推迟了一天。
- 仅在 Bremen 现场报告；2025 还为无法获得加拿大签证的作者在 Guangzhou 举办了卫星活动。
- 与 ECAI（EurAI）联合举办。新增特别赛道：AI and Health 和 AI and Robotics。取消：2025 的 'AI and Arts' 赛道。Human-Centred AI 和 AI and Health 现在限制每位作者在该赛道内最多 1 篇投稿。
- 新增 FAQ 条目 S23（其他场合发表的篇幅明显更短的版本，若作为 resubmission 声明则允许）和 S24（无 hybrid；论文集在会后定稿）。2025 CFP 中关于 ICLR 2025 resubmission 的说明已删除。FAQ S13 仍写着 'IJCAI 2025 review period'（过时文本）。
- IJCAI-27 已公布（Kyoto, Aug 7-13, 2027，另加中国 Hengqin, Aug 15-17, 2027；Conference Chair Sarit Kraus，Program Chair Bo An），但尚无 CFP：2027.ijcai.org 返回 401。聚合网站上显示的截止日期均为非官方。

#### 官方来源矛盾与注意事项

- **作者顺序：** 主会 CFP 允许 camera-ready 期间调序；AI and Health 特别 track 的 CFP 说 'list and ordering of authors registered at the paper submission deadline is final'。只有主会可以调序。
- **截止后改 PDF：** 没有明文说"截止后不能改 PDF"，这是从截止结构推断的；伦理政策又说被标记的论文可能被要求 'revise their submissions'（补伦理讨论）。
- **FAQ 过时文字：** FAQ S13 仍写 'IJCAI 2025 review period'。
- **届次：** IJCAI-27（Kyoto，Aug 7-13, 2027，外加 Hengqin）已宣布，但 2027.ijcai.org 仍返回 401，本节全部是 2026 规则。

### 3.8 ACL Rolling Review（ARR 2026 各轮）

> ACL Rolling Review (ARR), plus commitment to EMNLP 2026, EACL 2027, NAACL 2027 and COLING 2027 (the ACL 2027 call says 'Coming soon!')

- **届次（edition_used）：** ARR 2026 各轮：January（截止 Jan 5, 2026 AoE）、March 16、May 25、August 3 和 October 12, 2026。草稿漏掉了 January 2026 这一轮。October 2026 轮对接 NAACL 2027 和 COLING 2027。它是 Sept 11, 2026 公布的 sustainable reviewing policy 下的第一轮。其 OpenReview group（aclweb.org/ACL/ARR/2026/October）在 2026-09-24 时尚不存在，ARR qualifications 页面称表单于 Sept 28 开放。各会议规则取自 EMNLP 2026、EACL 2027 和 NAACL 2027 的 call。ACL 2027 call 页面显示 'Coming soon!'，ARR 仅将其投稿日期列为 'January, 2027'。小的不一致：ARR 日期页给出的 October 轮 meta-review 发布日期为 Dec 17, 2026，而 NAACL 2027 call 写的是 Dec 18。注意：ARR Authors Guidelines 页面写明 'The current version of these guidelines will apply until August'26 review cycle, and will be updated afterwards'。
- **投稿系统（submission_system）：** OpenReview（ARR 各轮投稿站点及各会议的 commit 站点）

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**不要求**。ARR 每轮只有一个投稿截止，没有单独的摘要截止或论文注册步骤（October 2026：Oct 12, 2026, 23:59 AoE；表单提前两周开放，即自 Sept 28 起），且截止前所有字段均可编辑。未找到关于占位摘要的官方规则（官方未规定）。另外，现在两位 chair 可以一致同意将明显低于质量门槛的投稿（'spammy' 投稿）直接 desk reject，无需完整评审。
- 置信度：中｜来源：<https://aclrollingreview.org/authors>
- 原文："You may edit all aspects of your submission up until the deadline."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。标题在 ARR 截止前可自由编辑。截止后，只能在 OpenReview 表单所述的截止后元数据宽限期内修改（'two extra days'，涵盖除 PDF 和作者列表外的所有字段）。该段文字在 March、May 和 August 2026 的表单中仍写作 'In July 2025 cycle we experiment…'；当前 CFP 未提及此宽限期，且 October 2026 表单尚未发布，因此 October 轮的宽限窗口未经确认。标题需在 commit 表单中再次填写，EMNLP 2026 FAQ 允许通过 camera-ready 表单修改标题；NAACL 2027 的 camera-ready 规则尚未发布。
- 置信度：中｜来源：<https://2026.emnlp.org/faq/>
- 原文："Can I change the title? Yes, through the camera-ready form."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要在 ARR 截止前可自由编辑，截止后仅能在元数据宽限期内修改（OpenReview 表单写的是 'two extra days'；July 2025 CFP 写的是 48h，且仅适用于 July 2025 轮）。宽限期涵盖除主论文 PDF 和作者列表外的所有字段，之后元数据即为最终版本；当前 CFP 未确认其是否适用于 October 2026。摘要需在 commit 表单中再次填写（EMNLP 2026 表单，最多 5000 个字符）。官方未规定 camera-ready 阶段能否修改摘要。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=aclweb.org/ACL/ARR/2026/August/-/Submission&expired=true>
- 原文："All fields except the main paper pdf and the author list will remain editable. After that grace period the submission metadata is final and subject to the regular desk rejection rules"

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。论文一经提交即不能添加任何作者，宽限期也不涵盖作者列表。EMNLP 2026、EACL 2027 和 NAACL 2027 禁止在 commit 阶段添加作者，ACL Authorship Changes Policy（2025-09-22 批准）禁止在投稿截止后的任何时间点添加作者，包括 camera-ready 阶段。唯一途径是在之后的某一轮重新投稿，ACL 政策将其视为新投稿，并需在 'Justification for author changes' 字段中给出简短理由。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："Please notice that once the paper has been submitted, no changes to the list of authors are allowed. There are additional authorship rules for resubmissions (see below)."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**有条件**。ARR CFP 不允许在提交后更改作者列表，EMNLP 2026、EACL 2027 和 NAACL 2027 的 call 禁止在 commit 阶段删除作者。重新投稿时，仅在极少数情况下允许移除作者，且必须同时移除该作者贡献的内容。ACL Authorship Changes Policy 允许在评审期间移除作者，但 'only under strict constraints'，也允许在最终决定之后（camera-ready 之前或之后）移除。移除必须由作者发起，并经 PC、editor 或 PEC 明确批准，同时需获得被移除作者的同意，或在 7 天内无合著者反对。EMNLP 2026 FAQ 允许在 camera-ready 表单中编辑作者列表，前提是遵循该政策。
- 置信度：中｜来源：<https://aclrollingreview.org/cfp>
- 原文："If the authors want to add an author as part of a resubmission, they may do so with a (brief) justification; except in extremely rare circumstances, authors may not be removed."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。ARR checklist 称作者顺序在提交时即为最终顺序，但 EMNLP 2026、EACL 2027 和 NAACL 2027 的 call 明确允许在 commit 阶段修改作者顺序。ACL Authorship Changes Policy 从不允许在投稿截止后更换第一作者，且未列出任何 'during the review process' 的顺序调整，这与各会议 call 在 commit 阶段的规定相冲突。该政策允许在最终决定与 camera-ready 之间调整其他作者的顺序，但 camera-ready 截止之后不允许。
- 置信度：中｜来源：<https://2027.naacl.org/calls/main_conference_papers/>
- 原文："During the commitment phase, it is not allowed to modify the author list (i.e., addition/deletion of authors is not allowed). However, modification of author order is possible."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**有条件**。作者列表及顺序在 ARR 提交时冻结，最晚不迟于该轮截止（Oct 12, 2026 AoE），并在元数据宽限期内保持冻结。例外：可在会议 commit 阶段修改顺序（不可修改成员），可在决定与 camera-ready 之间调整其他作者的顺序，且仅可通过 ACL 政策的审批流程移除作者（不可添加，第一作者固定）。重新投稿时可重设作者列表，需附理由。官方未规定逾期申请的具体处罚。
- 置信度：高｜来源：<https://aclrollingreview.org/authorchecklist>
- 原文："All authors are included and in the final order. No changes to author list or author order will be allowed after submission."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**有条件**。研究领域（research area）/track、领域关键词（area keywords）和贡献类型（contribution types）可在截止前以及截止后的元数据宽限期内编辑（October 2026 窗口未经确认，见 title_change），之后在该轮内即为最终版本。重新投稿时需重新选择领域，commit 表单也会再次要求选择 track（EMNLP 2026：'Select the one research track that your submission best fits into.'）。ARR track 于 March 2026 更新，之后又与 NAACL/COLING'27 chairs 共同再次更新（August 2026 changelog），因此 October 2026 的列表可能有所不同。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=aclweb.org/ACL/ARR/2026/August/-/Submission&expired=true>
- 原文："After that grace period the submission metadata is final and subject to the regular desk rejection rules (see https://aclrollingreview.org/authorchecklist for a list of common issues)."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。ARR 投稿截止后不能修改主 PDF：它被排除在元数据宽限期之外，且投稿 invitation 在截止后 30 分钟关闭。在 ARR 内，只能通过在之后的某一轮重新投稿来修改，需附上前一版本的链接和修改说明（修改说明也可置于 PDF 开头）。录用后，会议 camera-ready 允许多一页（9 或 5 页）。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=aclweb.org/ACL/ARR/2026/August/-/Submission&expired=true>
- 原文："All fields except the main paper pdf and the author list will remain editable."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料为可选，在投稿表单中上传，截止时间相同；未规定单独的截止时间。附录放在主 PDF 的参考文献之后，采用双栏格式（数学内容较多的部分可用单栏），不计入页数限制。软件和数据各为一个 .tgz/.zip 压缩包（据投稿表单，每个最大 200MB），匿名的同期论文放在 'data' 字段中。所有内容都必须匿名，不得使用 Google Drive 或 Dropbox 链接。审稿人无需阅读附录，将关键内容放在附录中可能导致 desk reject。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。长文 8 页，短文 4 页。参考文献、必需的 Limitations 部分、可选的 Ethical considerations 部分以及附录不限篇幅、不计入页数；camera-ready 版本为 9 或 5 页。Responsible NLP checklist 在表单中填写，并对录用论文以不计页数的附录形式发表（自 EMNLP 2025 起）。超出页数限制、缺少 Limitations 部分或滥用页数限制（将结果放在 Limitations 中、相关工作只放在附录中、压缩垂直间距的技巧）都会导致 desk reject。
- 置信度：高｜来源：<https://acl-org.github.io/ACLPUB/formatting.html>
- 原文："Review versions of long papers may have up to eight (8) pages of content plus unlimited pages for references."

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。自 October 2026 轮起，每位作者每轮最多 20 篇（重新）投稿，其中作为第一作者或共同第一作者的（重新）投稿最多 5 篇；2026 年此前各轮没有上限。超出上限的作者会收到通知，并有时间撤稿。若未撤稿，其论文中随机选取的一部分将进入抽签，抽签中未被选中的论文将被 desk reject。
- 置信度：高｜来源：<https://aclrollingreview.org/sustainable-reviewing-2026>
- 原文："Additionally, per-author quotas are introduced, where authors are capped at 20 total submissions and 5 first-author (including shared first-author) submissions per cycle."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。截至 August 2026 轮，所有（ALL）作者都必须在截止后约 48h 内注册为审稿人，不符合要求的论文可能被 desk reject。自 October 2026 起，每篇投稿需要一名合格的指定服务贡献者（designated service contributor），可以是为该论文担保的非作者。每人每轮最多为 2 篇投稿服务，每篇投稿需承担 5 篇审稿或 8 篇 meta-review。该贡献者必须在 48h 内完成注册（ARR 日期：Oct 14, 2026；NAACL 页面仍写 Oct 12），否则论文进入抽签。若出现紧急情况而贡献者未自行找到替代者，或贡献者被认定为 'highly irresponsible'，其作为作者的论文及其服务的论文都将被 desk reject，且其可被取消服务资格 2 个月至 5 年。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："Submissions will only be guaranteed review if they contribute a qualified service contributor (serving as a reviewer, chair or in senior roles)."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。自 October 2026 起，每位作者都需要完整的 OpenReview profile；不再接受仅有邮箱的合著者。profile 必须包含 ORCID、任职经历（affiliation history）、职业状态（career status）、邮箱和利益冲突，有发表记录的作者还需提供 DBLP 和 ACL Anthology 链接。截止时间为投稿截止后 1 周（约 Oct 19, 2026）。服务贡献者也需要完整的 profile，并须在 48h 内提交注册表单。违规将导致 desk reject，操纵 profile 可能招致 PEC 制裁，包括最长 5 年的投稿禁令。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："The profile registration for all authors must be finished 1 week after submission deadline at the latest."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。没有匿名期：任何时候都允许发布非匿名预印本（arXiv、社交媒体），但必须在表单中声明预印本状态。'no non-anonymous preprint' 选项在 meta-review 发布之前具有约束力，违反将被 desk reject。匿名论文享有获奖资格，并在边缘决策中优先考虑；若作者 opt-in，ARR 可发布匿名预印本。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："Beginning February 15, 2024, there is no anonymity period or limitation on posting or discussing non-anonymous preprints while the work is under peer review."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**不允许**。正在 ARR 评审中的论文不能同时在任何期刊或任何有审稿且存档（refereed and archival）的会议或 workshop 评审。CFP 未明确涉及非存档会议（未规定）。处于进行中 ARR 轮次的论文不能 commit，已 commit 的论文也不能投 ARR，违规将被 desk reject。NAACL/COLING 2027 允许一个主要 commit 加一个可选的次要 commit，并将在投稿到其他地方（如 ICML）期间进行 commit 视为 desk reject 的理由。必须声明此前的 ARR 版本，否则论文将被 desk reject；其他会议的撤稿论文若公开了作者姓名，则视为预印本。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："This policy covers all journals and refereed and archival conferences and workshops without exception (e.g., TACL, Computational Linguistics, IJCAI, SIGIR, AAAI, ICASSP, ICML, NeurIPS, etc)."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。author response 为可选，以纯文本 OpenReview Official Comments 的形式发布；外部链接（或非文本内容）将导致 desk reject，且在同一轮内不能上传修订后的 PDF。新结果仅允许作为回答审稿人问题的小幅补充（如消融实验）。AC 对每个评审 thread 最多考虑 2 条 author response，官方未规定字符数上限。时间窗口：October 2026 为 Nov 24–30；August 2026 分为 3 个阶段。EMNLP commit 阶段设有可选的对 meta-review 的回复，最多 2000 个字符。该指南页面称其适用至 August 2026 轮，之后将更新。
- 置信度：中｜来源：<https://aclrollingreview.org/authors>
- 原文："Your response must be text-only, and no external links are allowed. The paper will be desk-rejected if this is violated."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。作者可随时撤稿，但在截止后超过 48h 撤稿的论文，须等到之后第二轮才能重新投稿（May 2026 轮曾一次性豁免）。撤回重新投稿的论文也会一并撤回其早期版本，除非恢复，否则这些版本不能 commit；即使只有一篇审稿意见的论文也仍算作重新投稿。提交 camera-ready 即表示接受录用，此后不能再撤稿。August 2026 的 OpenReview 配置不公开撤稿论文，也不公开其作者。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："However, a submission that is withdrawn more than 48 hours after the submission deadline may not be resubmitted until the second subsequent ARR cycle."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**有条件**。ARR 审稿意见从不公开，投稿（包括被 desk reject 和撤稿的投稿）也保持不公开（August 2026 配置：`public_submissions`、`public_withdrawn_submissions` 和 `public_desk_rejected_submissions` 均为 false，且不公开作者）。作者同意其标题、作者姓名以及可能的摘要可与其他会议的 PC 共享，用于合规检查。公开可见仅限 opt-in：ARR 匿名预印本，或捐赠数据。自 May 2026 起，未被录用论文的捐赠数据自投稿起保密 2 年，之后可能公开。
- 置信度：中｜来源：<https://aclrollingreview.org/cfp>
- 原文："ARR will use Open Review as its platform (but reviews will not be open in ARR)."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。生成式 AI 不能作为作者。将其用于写作或编程必须在 Responsible NLP checklist 中披露，并在 Acknowledgements 中给出细节；语法和拼写检查器以及预测输入键盘无需披露。提示注入（prompt injection）将导致 desk reject，在 camera-ready 版本中则可能导致撤回（retraction），'hallucitations' 构成 desk reject 的理由。EMNLP 2026 使用 GPTZero，desk reject 了 258 篇投稿（1,166 位作者），这些作者不能将这些论文 commit 到 EMNLP 2026。
- 置信度：高｜来源：<https://aclrollingreview.org/cfp>
- 原文："Generally, generative AI tools do not qualify for authorship. Their use for writing or coding, as well as its scope, must be disclosed in the Responsible NLP Checklist."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇录用论文都必须进行报告（现场或线上）才能收录进论文集。各 call 称，在早期注册截止前没有已注册报告作者的论文 'may be subject to rejection'。EMNLP 2026 主会论文注册截止为 Sept 11, 2026，与 Sept 24 的早期参会者注册截止分开，每篇论文单独收费，每个注册最多涵盖 6 篇论文。未注册的论文将从会议日程和论文集中移除，但未进行报告的 Findings 论文仍予保留。NAACL 2027 注册页面显示 'Coming soon!'。
- 置信度：高｜来源：<https://2026.emnlp.org/registration/>
- 原文："Papers that are not registered by the applicable Paper Registration Deadline will be removed from the conference program and proceedings."

#### 较去年变化（changes_vs_previous_year）

- sustainable reviewing policy（Sept 11, 2026 公布；自 October 2026 轮起适用，即 NAACL/COLING 2027）。它取代了 May 2025 起所有合格作者都必须审稿的规则，并取消了豁免。每篇投稿需要一名合格的指定服务贡献者（每人最多 2 篇投稿，每篇投稿 5 篇审稿或 8 篇 meta-review）。没有贡献者的论文进入抽签，未被选中的将被 desk reject。
- 新的每位作者上限（自 October 2026 起）：每位作者每轮 20 篇（重新）投稿，其中作为第一作者或共同第一作者 5 篇。
- 所有作者都需在截止后 1 周内拥有完整的 OpenReview profile（ORCID、任职经历、职业状态、邮箱、利益冲突、DBLP/Anthology 链接）。不再允许仅有邮箱的合著者。
- 服务贡献者在紧急情况下必须自行找到替代者，否则其在该轮作为作者或服务的所有论文都将被 desk reject。取消服务资格的期限可为 2 个月至 5 年。
- 新的 desk reject 理由：'hallucitations'，以及两位 chair 一致认为明显低于质量门槛的投稿。EMNLP 2026 使用 GPTZero，desk reject 了 258 篇投稿（1,166 位作者）。
- 仿照 ICML 的原创性规则（April 2026 加入 CFP）：作者重叠的相关同期投稿必须相互引用，并以匿名形式上传。在 EMNLP 2026，切片式（thinly sliced）论文的作者可能被禁止 commit 到 EMNLP 2026/2027。
- 重新投稿限制（2026 CFP）：meta-review 分数为 1.5 意味着须跳过下一轮，分数为 1 则该论文永远不能重新投稿。自 July 2026 起，修改说明也可置于 PDF 开头。
- 撤稿（CFP，spring 2026）：撤回重新投稿的论文也会一并撤回其早期版本，除非恢复，否则这些版本不能 commit。
- ACL Authorship Changes Policy（2025-09-22 批准，2025-10-06 发布）：投稿截止后不得添加作者，也不得更换第一作者。移除作者需经 PC、editor 或 PEC 批准并获得同意，或在 7 天内无合著者反对。重新投稿视为新投稿。
- MS Word 模板已停用；自 March 2026 起，基于 Word 的投稿将被 desk reject。
- 自 May 2025 起每轮为 10 周。2026 年截止日期：January 5、March 16、May 25、August 3、October 12（共五轮；草稿漏掉了 January）。
- 截止后元数据宽限期（除 PDF 和作者列表外的所有字段）始于 July 2025 的一项试验（July 2025 CFP 中为 48h）。其文字仍保留在 2026 OpenReview 表单中，但当前 CFP 未提及。
- EMNLP 2026：May 轮的作者须在投稿时声明 EMNLP 或 AACL，对 EMNLP 具有约束力。NAACL 和 COLING 2027 共享 October 轮：commit 时选择一个主要会议，外加一个可选的次要会议，不得双重 commit，且主要会议不可更改。
- August 2026 轮将 author response 分为 3 个阶段（初始回复截止 Sept 19）。
- 数据收集许可（May 19, 2026）：未录用论文的捐赠数据保密 2 年，之后可能公开。
- 审稿人资格放宽（August 2026）。ARR track 自 March 2026 起修订，之后又与 NAACL/COLING'27 chairs 共同再次修订。

#### 官方来源矛盾与注意事项

- **作者顺序：** ARR author checklist 说投稿后 'No changes to author list or author order will be allowed'；EMNLP 2026、EACL 2027、NAACL 2027 的 call 允许在 commit 时改顺序；ACL Authorship Changes Policy 不允许在审稿期间调序，且提交截止后任何时候都不能换一作。所以在 commit 时换一作与 ACL 政策冲突。
- **元数据宽限期：** 只有 OpenReview 表单文字提到（'In July 2025 cycle we experiment…'），当前 CFP 和 author checklist 都没提；10 月轮表单还没发布，窗口未确认。
- **10 月轮 meta-review 日期：** ARR dates 页写 Dec 17, 2026，NAACL 2027 call 写 Dec 18。
- **service contributor 注册截止：** ARR dates 页写 Oct 14, 2026，NAACL 页面仍写 Oct 12。
- **作者指南适用范围：** ARR Authors Guidelines 页注明 'The current version of these guidelines will apply until August'26 review cycle, and will be updated afterwards'，所以 rebuttal 等细则对 10 月轮可能变化。

### 3.9 ICRA 2027

> ICRA 2027 (IEEE International Conference on Robotics and Automation), Coex, Seoul, Republic of Korea, May 24-28, 2027

- **届次（edition_used）：** ICRA 2027。于 2026-09-24 核对以下来源：线上 CFP 及其 2026-09-18 的 Wayback 存档（网站的 Cloudflare 会拦截直接抓取）、PaperPlaza ICRA 2027 timetable（ConfID 566，生成于 2026-09-23）、PaperCept author manual、RAS 的 ICRA/CEB、RA-L、double-anonymous 和 AI 页面，以及 ICRA 2027 的公告和注册页面。目前尚无真正的 ICRA 2027 final-paper 说明。URL 2027.ieee-icra.org/contribute/final-paper-submission-instructions/ 可以打开，但正文是遗留的 ICRA 2025 文字（"(6+n) page limit"、"6 March 2025" 截止日期），不得作为 2027 规则使用。
- **投稿系统（submission_system）：** PaperCept / PaperPlaza（ras.papercept.net）负责 contributed papers、IROS-ICRA transfer papers（'Revised past RAS conference paper'）、视频、journal transfers、competition proposals、完整的 workshop/tutorial proposals、late-breaking posters 以及 final papers。OpenReview 负责两项：workshop/tutorial pre-proposals（已于 Sep 1, 2026 AoE 截止）和 Arts in Robotics abstracts（截止 Dec 1, 2026）。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**不要求**。没有单独的摘要或注册步骤。PaperPlaza 上只有一个正文截止：July 15, 2026 开放，Sept 16, 2026 23:59 Pacific time 截止；这是从 Sept 15 延期 24 小时后的结果，延期于 Sept 16 公布。CFP 写的是 'PST'，而 PaperPlaza 写的是 '23:59:59 Pacific Time'。CFP FAQ 仍写着 'There is no plan to extend'。PaperCept 仅在会议要求时随论文收集一段约 200 词的纯文本摘要，且没有任何规则涉及占位摘要（未规定）。
- 置信度：中｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："Paper submission deadline: September 16, 2026 (23:59 PST) (via Paperplaza)"

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**未规定**。ICRA 2027 未规定在 Sept 16, 2026 截止之后或在 final submission 阶段（PaperPlaza，Feb 6 - Mar 6, 2027）能否修改标题。通用的 PaperCept manual 称，投稿后的修改取决于各会议设置的权限，只有通讯作者可以修改，且 final re-submission 允许作者更新标题。2027 年的 final instructions 尚未发布。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Re-submitting the manuscript gives you the opportunity to update the title, author list, abstract, etc."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**未规定**。ICRA 2027 未规定投稿后能否编辑摘要。在通用 PaperCept 流程中，通讯作者会在 'Update the final version information' 步骤重新填写摘要，该文本会收入 Book of Abstracts。在此之前的任何修改都取决于 ICRA 尚未公布的权限设置。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："This depends upon whether your conference has set up suitable permissions."

**`author_add`｜截止后还能加作者吗？**

- 答案：**未规定**。所有合作者都必须在首次投稿时（Sept 16, 2026, 23:59 Pacific）通过 PIN 录入 PaperPlaza。只有 Editors 和 AEs 能看到作者列表，审稿人看不到。ICRA 未规定之后（审稿期间或 final submission 时）增加作者的流程。通用 PaperCept manual 称，如果会议允许，final re-submission 可以更新作者列表，因此请先向组织方（info@icra2027.kr）确认。
- 置信度：中｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："However, when all the co-authors must be entered in Paperplaza at the time of first submission."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**未规定**。ICRA 2027 和 RAS 均未规定任何阶段能否删除作者。在 PaperPlaza 中，只有通讯作者可以修改投稿数据，且仅限会议已开启该功能的情况。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Only the corresponding author may update submission information, re-upload paper or submit the final paper."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**未规定**。ICRA 2027 未规定能否调整作者顺序。通用 PaperCept manual 有两条说明，均非 ICRA 专门规定：按稿件中姓名出现的顺序输入合作者 PIN；在 copyright transfer 时确保作者列表及其顺序与论文一致。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Please enter the PINs in the same order as the names appear on the manuscript."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**未规定**。没有官方来源宣布作者列表冻结（未规定）。CFP 只要求在首次投稿时（Sept 16, 2026, 23:59 Pacific）提供完整的合作者列表，未公布之后修改的流程或处罚。在 final upload 时（Feb 6 - Mar 6, 2027），通用 PaperCept 的 copyright 步骤要求 PaperPlaza 中的作者列表及顺序与 PDF 一致。如需申请修改，公布的一般联系邮箱为 info@icra2027.kr。
- 置信度：中｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："However, when all the co-authors must be entered in Paperplaza at the time of first submission."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**不允许**。ICRA CFP 要求至少选择三个 ICRA keywords；通用 manual 写的是 'up to three'，以 ICRA CFP 为准。第一个 keyword 决定论文分配给哪位 CEB Editor。ICRA 未规定能否修改 keywords，但 PaperCept manual 将其列为作者唯一不能更新的字段，因为它们可能已被用于论文分类。没有 track；类别包括 contributed paper、IROS-ICRA transfer（很可能对应 PaperPlaza 的 'Revised past RAS conference paper'，窗口同为 Jul 15 - Sep 16）和 external journal submission。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："With the exception of the “keywords,” which may already have been used to classify the paper, you may be able to update all of the above information, depending on the conference’s choices."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。PDF 可在 Sept 16, 2026, 23:59 Pacific 之前上传和替换；Sept 10-16 期间暂停视频上传，以便 PaperPlaza 专供 PDF 更新。截止后 contributed-paper 类别状态为 Closed，通讯作者只能添加视频，直至 Sept 22, 2026。下一次可以修改 PDF 是 final version 阶段，即 Feb 6 - Mar 6, 2027。
- 置信度：中｜来源：<https://ras.papercept.net/conferences/scripts/start.pl>
- 原文："Regular submissions were due on September 16. Additional video attachments can be uploaded until Sept. 22 by the corresponding author via the PaperPlaza workspace."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**有条件**。唯一的补充材料是一个随附视频；其他所有内容都必须放在 8 页之内。视频上传窗口为 Aug 5 - Sep 9 和 Sep 18-22, 2026（23:59 PST），之后不再接受。规格：最大 20 MB，格式 mpeg/mp4/mpg，最长 180 s，最小高度 480，最低 20 fps，逐行扫描（progressive scan）。允许纯文本 URL（非嵌入链接），但审稿人无须访问，且链接不得泄露身份。
- 置信度：高｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："Any supplementary material must fit within the 8 regular pages. A video attachment is possible."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。页数上限为 8 页 ICRA 双栏格式，包括正文、图、表、致谢和参考文献，附录没有额外页数。投稿时超过 8 页的论文将不经审稿退回，超页也是列明的 summary rejection 理由之一。2027 年尚未宣布 final version 可加页；2027 域名下唯一的 'final instructions' 页面是过时的 ICRA 2025 文字。
- 置信度：高｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。ICRA 2027 未规定每位作者的投稿数量上限。自 Jan 1, 2026 起，RAS 在 PaperCept 中追踪审稿量与投稿量的对应情况，并表示今后可能会限制投稿远多于审稿的人的投稿。ICRA 2027 不适用此类限制。
- 置信度：高｜来源：<https://www.ieee-ras.org/about-ras/latest-news/new-reviewer-author-balance-tracking-system-for-ieee-ras-publications>
- 原文："Conversely, for those who submit significantly more papers without contributing to reviews, we may consider measures such as limiting future submissions."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**不要求**。作者无须审稿，也没有 desk reject 处罚。RAS 追踪系统自 Jan 1, 2026 起运行，期望每投一篇论文至少审一篇，目前仅用于提高意识。对审稿人：审稿意见截止 Nov 6, 2026，且须达到 1,200 个非空白字符（non-white-character）的门槛。RAS 表示审稿不允许使用 AI，稿件内容不得经过 AI 处理。
- 置信度：中｜来源：<https://ras.papercept.net/conferences/scripts/start.pl>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。每位作者都需要一个 PaperPlaza（ras.papercept.net）PIN。所有合作者的 PIN 必须在首次投稿时（Sept 16, 2026）录入，并指定一位通讯作者。每人只保留一个 PIN：应更新单位信息，而不是新建 PIN。没有官方来源要求作者申报利益冲突（未规定）；CEB 的 COI 规则（导师/学生、5 年内合著或合作、同一院系或机构）适用于 Editors、AEs 和审稿人。
- 置信度：高｜来源：<https://ras.papercept.net/conferences/scripts/start.pl>
- 原文："Every participant in a conference served by this site, in any capacity, must maintain a single PIN and password."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。允许在 arXiv 或类似服务器上发布预印本，前提是论文未同时在其他地方审稿。审稿人被告知不要搜索作者身份，官方未规定匿名期或 embargo 期。社交媒体未规定。提交的文件不得包含泄露身份的链接（YouTube、GitHub、实验室主页）、姓名或 logo，违反这些规定可能导致 desk reject。
- 置信度：高｜来源：<https://www.ieee-ras.org/publications/rules-for-the-double-anonymous-review-process/>
- 原文："Authors are allowed to use tools such as arXiv. Reviewers should not actively search for those articles to identify authors."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**不允许**。论文不得同时在其他任何地方审稿，包括 RA-L，其 FAQ 称这属于 dual submission。没有正式或同行评审论文集的 workshop 论文可以投稿；有 DOI 的 workshop 论文视为 archival，不能投稿。IROS 2026 被拒论文可作为 'IROS-ICRA transfer' 重新投稿，需附匿名的 Author Response File 及原审稿意见。与自己已有工作的重叠必须引用并说明：大约 35% 是粗略上限，几乎相同的重复发表将不经审稿被拒。
- 置信度：高｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："Similarly, papers, which have been uploaded on a preprint server (e.g. arxiv) and are not submitted simultaneously to any other conference or journal, can be submitted to ICRA."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**未规定**。没有任何 ICRA 2027 来源提到 rebuttal 或 author response 阶段（未规定）。CEB 时间线从审稿意见（截止 Nov 6, 2026）直接到 AE 报告（Dec 1）、Editor 报告（Dec 8）和通知（Jan 31, 2027）。唯一的 author-response 文件是 IROS-ICRA transfer 论文在投稿时必须附上的匿名 Author Response File（PDF）。
- 置信度：中｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："The submission should include an additional Author Response File (PDF) to clarify how the comments from the AE/Editor and the reviewers were taken into account in the preparation of the revised paper."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**未规定**。ICRA 2027 未规定撤稿截止时间，也未规定撤稿论文是否公开。PaperCept 提供 'Withdraw a submission (any time, only if the conference configured this)'。如果论文因违反 AI 政策被取消资格或撤稿，注册费不予退还。另外，注册可在 9 April 2027 之前以书面形式取消，退款扣除 USD 50。
- 置信度：中｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："If your paper is found to be in violation of IEEE-RAS AI use policies and is subsequently disqualified or withdrawn from the conference program, your registration fees will NOT be refunded."

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**未规定**。没有官方来源称被拒论文或其审稿意见会公开，也没有 opt-in（未规定）。RAS 页面只说作者可在 PaperPlaza 中看到审稿意见和最终的 AE/Editor Review Summary Report（不含分数）。
- 置信度：中｜来源：<https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra/information-for-icra-associate-editors/>

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。可以使用 AI 工具，但不能将其列为作者。AI 生成的文本、图、图像或代码必须在致谢中披露，写明所用系统、涉及的章节及使用方式；编辑和语法帮助一般豁免，但 RAS 建议也予以披露。RAS 禁止用 AI 伪造数据，并要求示意性 AI 图在图注中注明工具和 prompt。因违规被取消资格或撤稿的论文不退还费用；官方未公布关于隐藏 prompt 的规则（未规定）。
- 置信度：高｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："The use of content generated by AI in an article (including but not limited to text, figures, images, and code) must be disclosed in the acknowledgments section."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。仅限现场报告；没有现场报告人的论文视为 no-show 并跳过。$200 的 'Virtual Online' 注册不含论文上传名额。CFP 给出的作者注册截止为 Mar 5, 2027（注册页面称详细日程尚待公布），PaperPlaza 接收 final papers 的时间为 Feb 6 - Mar 6, 2027。至少一位作者必须保持注册状态，论文才能发表；一个 full registration 可上传 2 篇论文，student registration 可上传 1 篇，注册姓名可免费更换。
- 置信度：高｜来源：<https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/>
- 原文："ICRA 2027 will be an on-site conference. There will be no option to present a paper online. If there is no on-site presenter, the paper will be considered as no-show and skipped."

**`ral_icra_option`｜RA-L 等期刊论文怎样拿到 ICRA 报告？**（会议特有）

- 答案：**有条件**。RA-L 没有针对会议的截止日期。已被 RA-L 接收的论文（survey 除外）如在 Mar 1 与 Dec 31, 2026 之间、且在接收后 270 天内转入，可在 ICRA 2027 报告；只能转到一个会议，错过转入后不能重新开放。PaperPlaza 可直接转入 T-RO、RA-M、RA-L 和 T-RL 论文。T-ASE、T-FR、RA-P 和 ToH 论文需要代码并选择 'External journal submission' 类别，PaperPlaza 于 Nov 30, 2026 关闭该类别，但 CFP 写的是 Dec 31, 2026。
- 置信度：高｜来源：<https://www.ieee-ras.org/publications/ra-l/>
- 原文："Reminder: there are no conference-specific submission deadlines for RA-L papers."

#### 较去年变化（changes_vs_previous_year）

- 场地与日期：Vienna, June 1-5, 2026 改为 Seoul (Coex), May 24-28, 2027。费用改以 USD 计价，不再用 EUR。每个注册的论文上传名额不变：full registration 为 2 篇，student 为 1 篇。
- 论文截止延期 24 小时，从 Sept 15 延至 Sept 16, 2026 23:59 PST，公告日期为 Sept 16。ICRA 2026 的截止为 15 Sept 2025。RAS 的 ICRA、reviewer、AE 和 Editor 页面以及 /contribute/ 上的 'About' 文字仍写着 Sept 15, 2026。
- 第二个视频窗口现为 Sept 18-22, 2026（Sept 17 公布）；2026 年为 Sept 17-22, 2025。第一个窗口（Aug 5 - Sep 9）和 Sep 10-16 仅限 PDF 的时段不变。
- 可在会议报告的期刊列表现为 RAM、RA-L、T-ASE、T-RO、T-RL、T-FR、RA-P 和 ToH。ICRA 2026 CFP 正文涵盖 RAM、RA-L、T-ASE 和 T-RO，FAQ 中另有 T-FR 和 RA-P，因此 T-RL 和 ToH 为新增。PaperPlaza 直接转入现在除 T-RO、RA-M 和 RA-L 外还包括 T-RL。2026 CFP 给出了两个不同的转入截止（正文为 31 Dec 2025，FAQ 为 30 Nov 2025）。2027 CFP 两处都写 31 Dec 2026，但 PaperPlaza 于 Nov 30, 2026 关闭 'External journal submission'。
- RA-L 转 ICRA 2027 的窗口：Mar 1 - Dec 31, 2026，且须在接收后 270 天内。RAS 指出 RA-L 没有针对会议的截止日期。此条仅作参考记录，未确认是否为相对 2026 的变化。
- 自 Jan 1, 2026 起新增：RAS 在 PaperCept 中追踪审稿量与投稿量，期望每投一篇论文至少审 1 篇。目前仅用于提高意识，但 RAS 表示今后可能限制投稿。ICRA 2027 是追踪开始后的第一个 ICRA 投稿轮。
- IROS-ICRA transfer 类别继续保留。ICRA 2026 为 IROS 2025 被拒论文引入该类别；现在适用于 IROS 2026 被拒论文。PaperPlaza timetable 显示有一个 'Revised past RAS conference paper' 类别，窗口同为 Jul 15 - Sep 16，很可能就是该类别，但 CFP 未说明。
- 8 页全包含的上限不变。2026 CFP 正文已列出致谢（'text, figures, tables, acknowledgements, and references'）；只有 2027 FAQ 的回答新增了 'acknowledgments'。
- 作者注册截止为 Mar 5, 2027，final upload 为 Feb 6 - Mar 6, 2027。ICRA 2026 的截止为 6 March 2026（23:59 EST），后延至 31 March 2026。
- AI 使用政策文字与 2026 年相同，2026 CFP 截至 March 2026 也已包含不退费条款。ICRA 2026 的 final instructions 新增了对录用论文的 AI 生成内容和幻觉引用筛查，并提醒作者其承诺：final version 须与录用版本高度一致。真正的 ICRA 2027 final instructions 尚未发布，因此这些是否延续尚未确认。
- Workshops 和 tutorials 现采用两阶段流程：先在 OpenReview 提交 pre-proposals（Jul 15 - Sep 1, 2026 AoE），然后受邀者在 PaperPlaza 提交不超过 5 页的 full proposals，截止 Nov 1, 2026。ICRA 2026 只有一个 proposal 截止日期 Sept 25, 2025；其存档页面未说明提交渠道（未规定）。
- Arts in Robotics abstracts 通过 OpenReview 提交，Sep 15, 2026 开放，截止 Dec 1, 2026。

#### 官方来源矛盾与注意事项

- **截止时区：** CFP 写 'PST'，PaperPlaza 写 '23:59:59 Pacific Time'。
- **延期：** 截止已从 Sept 15 延期到 Sept 16, 2026（Sept 16 公告），但 CFP FAQ 仍写 'There is no plan to extend'；RAS 的 ICRA、审稿人、AE、Editor 页面和 /contribute/ 的 About 文字仍写 Sept 15, 2026。
- **关键词数量：** ICRA CFP 要求至少三个 ICRA 关键词，通用 PaperCept 手册写 'up to three'，以 CFP 为准。
- **期刊论文转 ICRA 报告：** CFP 写截止 Dec 31, 2026，PaperPlaza 的 'External journal submission' 类别 Nov 30, 2026 就关闭。
- **过期页面：** 2027 域名下的 final-paper-submission-instructions 页正文是 ICRA 2025 的残留内容（'(6+n) page limit'、'6 March 2025'），不能当作 2027 规则。
- **作者名单类规则：** 所有关于标题、摘要、作者增删和顺序的说法都来自通用 PaperCept 手册，不是 ICRA 2027 的规则。

### 3.10 IROS 2026

> IROS (IEEE/RSJ International Conference on Intelligent Robots and Systems)

- **届次（edition_used）：** IROS 2026（David Lawrence Convention Center, Pittsburgh, Sep 27 to Oct 1, 2026）。本轮投稿已结束：ConfID 537 的所有 PaperCept 窗口均显示 "Closed"（页面生成于 2026-09-23）。IROS 2027（Fortezza da Basso, Florence, Sep 26 to Oct 1, 2027）已公布。IEEE RAS 活动页面列出的投稿截止为 Mar 1, 2027。2027.ieee-iros.org 目前只是一个落地页（Home、Topics、Venue、About），没有 CFP 或作者规则。
- **投稿系统（submission_system）：** PaperCept / PaperPlaza（ras.papercept.net，IROS 2026 ConfID 537）。PaperCept 声明 "All deadlines are 23:59:59 Pacific Time"。有两个例外：CFP 中关于视频的一行写的是 23:59 PST；作者注册和早鸟注册截止于 23:59 EST（注册网站由 Maritz 运营）。只有通讯作者可以更新投稿或上传最终论文。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**不要求**。IROS 2026 没有单独的摘要注册步骤或截止。contributed paper 须在 Mar 2, 2026（23:59:59 PT）前在 PaperPlaza 中创建。此后直至 Mar 5, 2026，已有投稿可以修改，但不能新建投稿。通用 PaperCept 手册称，创建时需填写标题、所有作者的 PIN 和最多 3 个关键词，摘要则 'only if required by the conference'。IROS 未规定其摘要字段是否必填，也没有任何官方来源提及占位摘要。
- 置信度：高｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>
- 原文："Deadline for Paper submissions (Submissions may be modified, but not started, through March 5)"

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。IROS 2026 本身对标题未作规定。在 Mar 2 to Mar 5, 2026 的宽限期内，投稿 'may be modified'，但哪些字段可以修改取决于 PaperCept 的配置，而该配置未公开。在最终提交阶段（PaperCept 窗口 Jun 16 to Jul 27, 2026；网站写的是 Jul 16），根据 2011 年的通用 PaperCept 手册，作者可以更新标题，且标题须与 IEEE eCP 版权表一致。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Re-submitting the manuscript gives you the opportunity to update the title, author list, abstract, etc."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。IROS 本身未作规定。在 Mar 2 to Mar 5 宽限期内，摘要能否编辑取决于配置。在最终提交阶段，根据通用 PaperCept 手册，通讯作者需重新填写最终版本信息（包括摘要），且通常可在最终截止前编辑。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Make sure that the author list and number of pages in the final version of the paper are correctly entered. The Abstract that you enter here will appear in the conference Book of Abstracts."

**`author_add`｜截止后还能加作者吗？**

- 答案：**有条件**。所有作者的 PaperCept PIN 都必须在首次提交时（Mar 2, 2026 前）填写。IROS 2026 未公布之后添加作者的规则、审批流程或处罚（官方未规定）。2011 年的通用 PaperCept 手册称，评审期间作者列表是否可更新取决于会议的设置，并且在最终提交时可以更新。注册页面另外说明，注册不能用于上传注册人并非作者的论文。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："PINs of all co-authors of the manuscript – it is necessary to enter all PINs at this stage to identify all authors."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**有条件**。IROS 本身未作规定。通用 PaperCept 手册称，标题、摘要和作者列表是否可更新取决于会议的配置，且最终提交允许作者更新作者列表。只有通讯作者可以进行修改。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："With the exception of the “keywords,” which may already have been used to classify the paper, you may be able to update all of the above information, depending on the conference’s choices."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**有条件**。IROS 本身未作规定。首次提交时按稿件中的作者顺序填写 PIN。camera-ready 阶段，最终版本信息和 eCP 版权表中的作者顺序必须与论文一致。根据通用手册，最终信息通常可在最终截止前编辑。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："b) the author list and the sequence in which they appear on your paper and above are identical."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**未规定**。IROS 2026 未公布作者列表修改的冻结日期、申请流程或处罚（官方未规定）。实际上最后的机会是最终提交：PaperCept 于 Jul 27, 2026 23:59:59 PT 关闭，而网站写的是 Jul 16。上传还要求至少一名作者在 Jul 16, 2026（23:59 EST）前完成注册。通用手册称，最终信息通常可在最终截止前编辑。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Normally the conference is configured so that you may re-upload the final manuscript and update the final submission information until the final submission deadline."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**不允许**。作者从会议的列表中选择最多三个关键词。通用 PaperCept 手册将关键词排除在后续可更新项之外，因为关键词可能已被用于论文分类。IROS Editor 页面确认，所选关键词决定论文分配给哪位 Editor 和 AE，论文于 9 March 被放入各 profile。IROS 2026 本身未规定能否更改关键词或投稿类别。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："With the exception of the “keywords,” which may already have been used to classify the paper, you may be able to update all of the above information, depending on the conference’s choices."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**允许**。首次提交须在 Mar 2, 2026 前完成。之后作者有 3 天宽限期可更新稿件，截至 Mar 5, 2026 23:59:59 PT，但不能新建投稿。此后，被接收的论文只能在最终窗口（PaperCept Jun 16 to Jul 27, 2026）重新上传。
- 置信度：高｜来源：<https://ras.papercept.net/conferences/scripts/start.pl> (IROS 2026 submission wizard, ConfID 537)
- 原文："Authors will have a three-day grace period until March 5 to update their manuscript."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。唯一的补充材料是一个可选的 1 分钟视频（最大 10 MB；MPG、MPEG 或 MP4）。根据 RAS 规则，视频必须匿名：不得出现姓名、单位或 logo，人脸须模糊处理。截止日期甚至在 CFP 页面内部就不一致：其 Video Supplement 段落写的是 Mar 5, 2026 23:59 PST，而其自身的 Key Dates 列表、Important Dates 页面、PaperCept 投稿向导以及 IROS AE/Editor 时间线都写的是 Mar 7。附录必须包含在 8 页 PDF 之内，未提及单独的附录或代码上传。
- 置信度：中｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。论文最多 8 页 US-letter 页面，含参考文献和附录，PDF 最大 6 MB。旧的 6+2 模式已取消，不能付费购买额外页数；注册页面针对最终上传重申了 8 页上限。未提及 checklist 或伦理声明。AI 的使用必须在致谢中披露。RAS 称，对个人或资助方的致谢仅在接收后添加，但没有官方来源说明 AI 披露应在何时加入（官方未规定）。致谢计入 8 页这一点是根据 'etc.' 推断的。
- 置信度：高｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。IROS 2026 未规定每位作者的投稿数量上限。自 Jan 1, 2026 起，IEEE RAS 在 PaperCept 中对照追踪每个人的审稿数与投稿数，PaperCept 声明期望每篇投稿论文至少完成 1 次审稿。目前这只是为了提高意识，但 RAS 表示今后可能会限制投稿远多于审稿的人的投稿。
- 置信度：中｜来源：<https://www.ieee-ras.org/new-reviewer-author-balance-tracking-system-for-ieee-ras-publications/>
- 原文："Conversely, for those who submit significantly more papers without contributing to reviews, we may consider measures such as limiting future submissions."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**不要求**。IROS 2026 强烈鼓励审稿，但不强制，也未规定 desk reject 处罚。PaperCept 的审稿-投稿平衡通知设定了每篇投稿论文至少一次审稿的 'expectation'，自 Jan 1, 2026 起追踪，RAS 今后可能据此限制投稿。审稿意见须达到 1,200 个非空白字符，审稿人不得使用 AI。
- 置信度：高｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>
- 原文："Authors are strongly encouraged to provide high-quality reviews for the success of IROS 2026."

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。IROS 使用 PaperCept，而非 OpenReview。每位作者都需要一个 PaperCept PIN（profile），所有 PIN 须在提交时（Mar 2, 2026 前）按稿件中的作者顺序填写。PaperCept 要求用户在更换单位后不要创建第二个 PIN。未公布作者利益冲突声明要求或 profile 完整性截止（官方未规定）。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："PINs of all co-authors of the manuscript – it is necessary to enter all PINs at this stage to identify all authors. Please enter the PINs in the same order as the names appear on the manuscript."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。IROS 2026 采用双盲（double-anonymous）评审，其 CFP 指向 IEEE RAS 的 double-anonymous 规则，该规则允许使用 arXiv；审稿人不应搜索此类预印本。投稿中不得链接到可识别身份的网站，如 YouTube、GitHub 或机构页面（建议使用 anonymous.4open.science 等匿名化工具）。未规定匿名期，审稿期间的社交媒体宣传在任何官方来源中均未涉及（未规定）。
- 置信度：高｜来源：<https://www.ieee-ras.org/publications/rules-for-the-double-anonymous-review-process>
- 原文："Authors are allowed to use tools such as arXiv. Reviewers should not actively search for those articles to identify authors."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。IROS 2026 CFP 没有一般性的一稿多投条款，对非存档（non-archival）workshop 论文也未作规定。相关官方规则：(1) IROS AE 指南称，与同一作者先前发表的论文完全相同或几乎相同的论文应不经评审直接拒稿（ieee-ras.org IROS AE 页面）；(2) RA-L FAQ 禁止论文同时在 RA-L 和某个会议审稿；(3) 被 ICRA 2026 拒稿的论文可以在 'ICRA-IROS transfer' 类别中重新投稿，并附一份匿名的 Author Response File，这些论文走常规评审。
- 置信度：中｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>
- 原文："IROS 2026 has a submission category “ICRA-IROS transfer” for papers that previously were submitted to ICRA 2026, but were not accepted for publication."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**不允许**。IROS 没有 rebuttal 阶段。IROS AE 指南（更新于 Mar 9, 2026）明确说明了这一点，时间线从审稿意见（Apr 18）和 AE 报告（Apr 30）直接进入通知（Jun 16, 2026）。唯一的回应文档是 ICRA-IROS transfer 论文随投稿上传的 Author Response File（PDF）。它可以是完整的 rebuttal，也可以是简短的修改列表，不得暴露作者身份，篇幅上限未规定。
- 置信度：高｜来源：<https://www.ieee-ras.org/conferences-workshops/financially-co-sponsored/iros/information-for-iros-associate-editors/>
- 原文："Please note that we will not be using the rebuttal process."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**未规定**。IROS 2026 未公布撤稿截止或可见性规则（官方未规定）。通用 PaperCept 手册列出 'Withdraw a submission' 可随时进行，但仅限会议启用该功能时。没有官方说明称撤稿论文或其审稿意见会被公开（未规定）。
- 置信度：低（待核）｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："Withdraw a submission (any time, only if the conference configured this)"

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**未规定**。没有任何 IROS 或 RAS 官方来源说明被拒论文或审稿意见会被公开（未规定）。在 PaperCept 中，决定信和审稿意见在决定邮件发出后即可在作者工作区查看。IROS AE 指南指出，作者可以看到审稿意见和 AE 报告。
- 置信度：中｜来源：<http://ras.papercept.net/conferences/manuals/authorgetstarted.pdf>
- 原文："After the message has been sent it is available for on-line inspection, including the reviews, under “Inspect the reviews and decision letter” in the “Choose an option” menu for your paper."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。AI 工具不能作为作者。AI 生成的内容（文本、图表、图像、代码）必须在致谢中披露，注明所用工具和涉及的章节。根据 RAS 规定，示意性 AI 图须在图注中注明工具和 prompt。语法润色通常豁免，但 RAS 建议也予以披露。审稿中的稿件不得交由 AI 处理；没有官方来源提及隐藏 prompt 或 prompt injection（未规定）。
- 置信度：高｜来源：<https://2026.ieee-iros.org/contribute/call-for-papers/>
- 原文："The use of content generated by AI in an article (including but not limited to text, figures, images, and code) must be disclosed in the acknowledgments section."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。至少一名作者须在 Jul 16, 2026（23:59 EST）前完成注册才能上传最终论文，否则论文将从会议日程和论文集中移除。非学生、非单日注册最多可覆盖 2 篇上传，其他完整注册覆盖 1 篇，单日票不覆盖任何上传。早鸟价截至 Jul 24；Aug 28, 2026 前取消需支付 US$50，此后仅在特殊情况下或签证被拒后才可退款。论文须现场报告（oral 加 poster），由作者或了解论文的代理人（knowledgeable proxy）进行。录制报告或文字聊天形式的 poster 需填写表格申请，距离该场次不足 72 小时的申请 'may not be able to be accommodated'。
- 置信度：高｜来源：<https://2026.ieee-iros.org/attend/registration/>
- 原文："Authors who do not register by July 16, 2026, will have their paper removed from the program and the proceedings."

#### 较去年变化（changes_vs_previous_year）

- 评审模式：IROS 2025 为单盲，稿件须包含作者姓名和单位（2025 CFP FAQ）。IROS 2026 按照 IEEE RAS 规则采用双盲（double-anonymous），违规可能导致 desk reject。
- 页数限制：IROS 2025 允许 6 页，外加最多 2 页付费额外页，含参考文献。IROS 2026 允许 8 页，含参考文献和附录，不能付费增加页数。
- 视频：IROS 2025 允许最长 180 s、10 MB，分两个窗口上传（Jan 5 to Feb 24 和 Mar 3 to 6, 2025）。IROS 2026 允许 1 分钟、10 MB。2026 年的截止日期在 CFP 视频段落中为 Mar 5，但在 CFP key-dates 列表、Important Dates 页面和 PaperCept 中为 Mar 7。
- 2026 年新增：'ICRA-IROS transfer' 类别，面向被 ICRA 2026 拒稿的论文，投稿时附匿名的 Author Response File，并按常规评审。IROS 2025 CFP 没有这一类别。
- 期刊论文：2026 CFP 明确表示 IROS 'no longer offers an RA-L+IROS submission option'。2025 CFP 同样没有提供该选项，因此这只是澄清，而非 2025 到 2026 的新变化。措辞也有变化：2026 年使 'all published papers from RAM' 均有资格，另加非演进型（non-evolutionary）RA-L、T-ASE 和 T-RO 论文；而 2025 年的表述是非演进型 RA-L、T-ASE、T-RO 和 RAM 论文。
- 2026 年新增：自 Jan 1, 2026 起，IEEE RAS 在 PaperCept 中对照追踪每个人的审稿数与投稿数，期望每篇投稿论文至少 1 次审稿。今后可能会限制审稿较少者的投稿。
- 报告形式：IROS 2025 FAQ 承诺提供视频报告等替代方式。IROS 2026 要求由作者或了解论文的代理人（knowledgeable proxy）现场进行 oral 和 poster 报告。只有无法出行的人才可改为录制报告或在 poster 环节通过文字聊天答疑，需通过表格申请，距离该场次不足 72 h 的申请可能无法安排。
- 2026 年新增：为部分被接收论文提供可选的 'Show and Tell' 实物演示时段，通过在 PaperCept 中勾选一个勾选项申请。
- IROS 2026 明确设有 3 天的投稿编辑宽限期（Mar 2 to Mar 5）。最终论文日期存在冲突：网站写的是 Jul 16, 2026，而 PaperCept 的最终窗口于 Jul 27, 2026 关闭。
- 生成式 AI 政策与 2025 年基本相同：在致谢中披露、AI 不能作为作者、审稿中的稿件不得交由 AI 处理。2026 CFP 删去了 2025 年豁免语法润色的那句话，但其所依据的 RAS 指南仍包含该豁免。
- 无变化：2025 和 2026 均没有 rebuttal 阶段。IROS AE 指南称不使用 rebuttal 流程。
- IROS 2027（Florence, Sep 26 to Oct 1, 2027）已公布，据 IEEE RAS 活动页面，论文截止为 Mar 1, 2027。尚未发布 2027 CFP 或规则变化。

#### 官方来源矛盾与注意事项

- **视频截止：** CFP 的 Video Supplement 段落写 Mar 5, 2026 (23:59 PST)，同一页的 Key Dates、Important Dates 页、PaperCept 和 AE/Editor 时间线都写 Mar 7。
- **终稿截止：** 网站写 Jul 16, 2026，PaperCept 终稿窗口到 Jul 27, 2026。
- **时区混用：** PaperCept 统一用 23:59:59 Pacific Time，CFP 视频行用 PST，作者注册截止用 EST。
- **作者名单类规则：** 标题、摘要、作者增删和顺序的说法都来自通用 PaperCept 手册（revised October 5, 2011），不是 IROS 2026 的规则，所以置信度低。
- **AI 语法编辑豁免：** 2026 CFP 删掉了 2025 年"语法编辑无需披露"那句，但它引用的 RAS 指南仍保留这条豁免。
- **届次：** IROS 2027（Florence）只有 RAS 活动页上的 Mar 1, 2027 投稿截止，没有 CFP，本节是 2026 规则。

### 3.11 CoRL 2026

> CoRL (Conference on Robot Learning)

- **届次（edition_used）：** CoRL 2026（第 10 届 CoRL，Austin, TX，Nov 9-12, 2026；主会 Nov 9-11，workshop Nov 12）。于 2026-09-24 核对了以下来源：corl.org 2026 当前在线页面（Instruction for Authors、Call for Papers、Instruction for Rebuttal、Instruction for Reviewers、Registration、Home/Announcements）、Cvent 注册页面（在浏览器中渲染）、已过期的 OpenReview `Submission` invitation，以及 OpenReview venue group 设置。
- **投稿系统（submission_system）：** OpenReview（robot-learning.org/CoRL/2026/Conference）。摘要注册使用 `Submission` invitation，截止时间为 2026-05-26 11:59 UTC（May 25 AoE）。venue 设置中还为正文截止单独列出了一个 `Full_Submission` invitation，OpenReview 显示其截止时间为 May 29 2026 11:59 UTC（May 28 AoE）。

#### 规则

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。摘要注册为硬性截止：May 25, 2026 23:59 AoE（OpenReview 上为 May 26 2026 11:59 UTC）。正文截止为 May 28, 2026 23:59 AoE（星期四）。摘要阶段的表单要求填写标题、作者、摘要、学生论文标记、主关键词、互审审稿人 (reciprocal reviewer) 指定或豁免、GenAI 披露、一稿多投（dual submission）声明以及三个确认勾选项（Limitations section、匿名化、公开发布）。该阶段 PDF 为可选。官方未规定是否允许占位摘要。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Please keep in mind that the deadlines are final, and we cannot make any accommodations for missing the abstract deadline or paper deadline."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。摘要截止（May 25 AoE）后，作者可以在 OpenReview 上更新标题。官方未规定该修改窗口何时关闭，例如是否在正文截止（May 28 AoE）时关闭。camera-ready 阶段（截止 Oct 12, 2026 AoE），OpenReview 上的标题必须与 PDF 标题一致。
- 置信度：中｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Authors may update the title and abstract on OpenReview after the abstract submission deadline."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要（最多 250 词；表单上限为 3000 字符）在摘要截止后可以修改。corl.org 的作者页面也是同样的说法。官方未规定正文截止后或 camera-ready 阶段是否仍可修改摘要。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=robot-learning.org/CoRL/2026/Conference/-/Submission&expired=true>
- 原文："Provide a concise summary of your paper (max 250 words). The abstract may be updated after the abstract deadline, but the author list may not."

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。摘要截止（May 25, 2026 AoE）后不能添加作者，因此正文截止后同样不能添加，原因是作者列表要用于审稿人分配。唯一途径是发邮件给 OpenReview Chair Carlo Sferrazza 申请例外。官方未规定 camera-ready 阶段能否添加作者；camera-ready 部分只说明作者列表不得匿名。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："However, authors cannot be added or removed after this deadline, as this information is required to facilitate reviewer assignments."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。删除作者与添加作者规则相同：摘要截止（May 25, 2026 AoE）后不允许，除非 OpenReview Chair 通过邮件批准例外。官方未规定 camera-ready 阶段能否删除作者。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："However, authors cannot be added or removed after this deadline, as this information is required to facilitate reviewer assignments."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**不允许**。网站只涉及添加和删除作者。OpenReview 的 `authors` 和 `authorids` 字段都说明摘要截止后不能更改作者列表，这可以合理地理解为也包括作者顺序，但并未明确提到顺序。官方未规定 camera-ready 阶段能否调整作者顺序。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=robot-learning.org/CoRL/2026/Conference/-/Submission&expired=true>
- 原文："Comma separated list of author names. The author list cannot be changed after the abstract submission deadline."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**不允许**。作者列表在摘要截止时冻结：May 25, 2026 23:59 AoE（OpenReview 上为 May 26 11:59 UTC）。如需申请例外，发邮件给 OpenReview Chair Carlo Sferrazza（csferrazza@berkeley.edu）。此类申请的截止时间或处罚未规定。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："If you need to request an exception, please email our OpenReview Chair Carlo Sferrazza (csferrazza@berkeley.edu)."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**未规定**。摘要表单要求从 22 个固定领域中选择一个主关键词，另可从同一列表中选择一个可选的次关键词，以及最多两个可选的自由文本关键词（每个最多 100 字符）。CoRL 为单 track 会议。网站只说明标题和摘要之后可以更新。官方未规定注册后能否更改关键词。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=robot-learning.org/CoRL/2026/Conference/-/Submission&expired=true>
- 原文："Auto-populated from primary, secondary, and free-text keyword selections below."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。正文 PDF（最大 50 MB）可在正文截止（May 28, 2026 AoE）前随时上传或替换。June 4 AoE 的截止仅针对补充材料。rebuttal 页面和作者页面都说明 rebuttal 期间不能更新论文。下一次修改是 camera-ready（Oct 12 AoE，9 页），仅限录用论文。审稿人指南中仍保留一条与此矛盾的模板句（'Authors may submit a response and update their papers during the rebuttal period'）。
- 置信度：中｜来源：<https://www.corl.org/contributions/instruction-for-rebuttal>
- 原文："You will not be able to respond to individual reviewers on OpenReview, nor can you update your paper during the rebuttal process."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**允许**。补充材料截止为 June 4, 2026 23:59 AoE，须为单个匿名 ZIP 文件，不超过 250 MB，上传至 OpenReview。可包含实验、证明、代码、数据或附录。强烈鼓励提供视频：小于 250 MB（严格）且不超过 3 分钟（建议）。审稿人不必阅读补充材料或附录，附录可放在正文 PDF 中，也可放在补充材料中。camera-ready 阶段附录必须放在 PDF 末尾，视频、代码和数据必须托管在外部并提供链接，因为 PMLR 不接受视频。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?id=robot-learning.org/CoRL/2026/Conference/-/Submission&expired=true>
- 原文："Upload supplementary materials as a single ZIP file (optional, ≤250 MB). This may include additional experiments, proofs, code, data, or appendices."

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。正文限 8 页，须使用官方 CoRL 2026 LaTeX 模板。必需的 Limitations section 计入 8 页。致谢、参考文献和可选附录不计入。camera-ready 可增加第 9 页。OpenReview 表单说明，超出页数限制或未按模板排版的论文可能被 desk reject。不要求提供 checklist 或伦理声明。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**未规定**。官方未规定每位作者的投稿数量上限。有两条相关规则：投稿 3 篇或以上的作者必须同意担任审稿人；提交同一篇论文多个实质相同版本的作者，其提交的所有论文都将面临 desk reject，并可能被禁止参加今后的 CoRL。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Additionally, every author with 3 or more submissions must agree to serve as a reviewer."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。每篇投稿必须在摘要表单上指定至少一位列出的作者（通过 OpenReview profile 选择）同意担任审稿人。合格标准是在 CoRL、ICRA、IROS、RSS、ICLR、NeurIPS 或 ICML 或同等期刊上至少有一篇录用论文。若没有作者符合条件，或所有符合条件的作者均为 AC/SAC/organizing chairs，则该投稿可豁免；此外，投稿 3 篇或以上的作者也必须审稿。不符合要求的投稿，以及错过 July 13, 2026 这一硬性审稿截止或审稿质量很差的审稿人的投稿，可能被 desk reject；PC 可逐案批准例外。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**未规定**。官方页面未规定必须填写完整的 OpenReview profile 或利益冲突（conflict-of-interest）条目，也未规定相关截止时间。表单接受通过 OpenReview ID 或邮箱加单位（affiliation）添加作者。指定的审稿人必须通过 OpenReview profile 选择，且必须是列出的作者之一。venue 设置对审稿人和 AC 的利益冲突使用 'NeurIPS' conflict policy，但官方并未将其列为对作者的要求。
- 置信度：中｜来源：<https://api2.openreview.net/invitations?id=robot-learning.org/CoRL/2026/Conference/-/Submission&expired=true>
- 原文："Search and select the designated reviewer(s) (must be among the listed authors)."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。此前仅以技术报告形式（如 arXiv 预印本）出现过的论文可以投稿。官方未规定审稿期间能否发布到 arXiv、能否在社交媒体上宣传，也未规定匿名期。稿件、补充材料及其中的任何链接都不得暴露作者身份，否则论文可能被 desk reject。
- 置信度：中｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Submission is permitted for papers that have previously appeared only as a technical report, e.g., in arXiv."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**不允许**。不允许同时投稿到其他 archival venue，也不允许投稿已发表或已录用的工作。正在其他地方审稿中的论文将不经审稿直接 desk reject，而非 archival 的 workshop 则没有问题。如果其他 venue 的决定时间线略有重叠（给出的例子：ICML、NeurIPS），作者必须在投稿前通知 chairs 并获得逐案批准；网站上写的是 Publication Chair，OpenReview 表单上写的是 Program Chairs。未披露可能导致拒稿并向两个 venue 报告；官方未规定此前在其他地方被拒的论文如何处理。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Dual submission policy: Dual submission is not allowed by default. Submissions that are simultaneously under review at another archival venue will be desk-rejected without review."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。若没有任何审稿人或 AC 给出 weak accept 或更高的分数，论文可能在经 SAC 和 PC 审查后于第一轮被拒，没有 rebuttal 机会。其余论文可在 Aug 4 至 Aug 11, 2026 11:59 PM AoE 期间，使用强制模板提交一页的匿名 PDF。参考文献计入这一页，修改字体或行距将被 desk reject。不允许外部链接，无法单独回复各审稿人，也不能修改论文。官方说明的目的是纠正事实错误并提供审稿人要求的细节；与 2025 不同，2026 的文本没有禁止新实验，图表方面则未规定（未提及）。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-rebuttal>

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。没有面向作者的页面提及撤稿或撤稿截止时间（未规定）。OpenReview venue 设置中确实定义了 Withdrawal 操作（`withdrawal_name` 'Withdrawal'，并有 `Withdraw_Expiration` invitation），但该 invitation 本身不公开可见。撤稿和被 desk reject 的论文不公开，作者身份也不公开，但 PC 以及该论文的 SAC、AC、审稿人和作者仍可阅读。
- 置信度：中｜来源：<https://api2.openreview.net/groups?id=robot-learning.org/CoRL/2026/Conference>
- 原文：""public_withdrawn_submissions":{"value":false} ... "withdrawn_submission_reveal_authors":{"value":false}"

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**不允许**。被拒论文在决定公布后保持不公开，没有任何来源提到可将其公开的选项（未规定）。录用论文及其审稿意见在决定公布（Sept 4, 2026）后公开并去匿名（公开作者姓名），审稿人指南还提到 rebuttal 也会公开。作者在投稿时通过一个必选勾选项确认了这一点。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-reviewers>

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**有条件**。可以使用生成式 AI，但作者必须在投稿表单上披露使用方式（勾选项加简短说明），并对内容承担全部责任。LLM 不能作为作者。引用不存在的文献将在 PC 审查后被 desk reject；所有论文都会用 GPTZero 检查，被标记的内容会人工核实。提交同一篇论文多个实质相同版本的作者，其提交的所有论文都将面临 desk reject（网站上用 'will'，表单上用 'may'），并可能被封禁。隐藏提示词和 prompt injection 未规定。
- 置信度：高｜来源：<https://www.corl.org/contributions/instruction-for-authors>
- 原文："Papers that contain citations to references that do not exist will be desk-rejected after review by the Program Committee."

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇录用论文必须由其列出的作者之一持有的一份完整会议注册（full registration）覆盖（Academic $400，Student $200，Industry $1,200）。注册于 Aug 31, 2026 开放，作者注册截止时间和处罚均未规定。Nov 1 当天及之后适用晚注册费（$1,500）。在 Oct 1, 2026 11:59 pm CT 之前取消需支付 $50，此后不予退款；注册人姓名可免费更改。签证邀请函可从注册确认中获取。所有录用论文都安排 poster session，没有来源明确要求现场报告（未规定）。
- 置信度：高｜来源：<https://web.cvent.com/event/f8bc3f56-3433-4d69-8a33-8aae9eb674b8/summary>
- 原文："Each paper MUST be registered under a full registration by a listed author."

#### 较去年变化（changes_vs_previous_year）

- 页数限制：Limitations section 现在计入 8 页。2025 年不计入。
- camera-ready 现在可增加第 9 页，用于回应审稿人反馈。2025 年为 8 页加一个 Limitations section。
- rebuttal：现在强制使用一页模板，修改字体或行距将被 desk reject。2025 年没有模板，只有一页上限，违反者 desk reject。
- 新增第一轮无 rebuttal 拒稿：若没有任何审稿人或 AC 给出 weak accept 或更高分数，论文可能在 rebuttal 之前被拒。
- rebuttal 措辞：2025 明确要求不得引入新的实验结果。2026 的文本删除了这句话，并将目的描述为纠正事实错误和提供审稿人要求的细节。
- 2026-04-17 新增生成式 AI 政策：必须披露；引用不存在的文献将被 desk reject（用 GPTZero 检查）；近乎重复的投稿将导致该作者所有论文被 desk reject；LLM 不能作为作者。
- OpenReview 表单现在使用 22 个固定关键词领域（一个主关键词、一个可选次关键词和 2 个自由文本关键词），取代 2025 的自由文本关键词和 TLDR 字段。表单新增 GenAI 披露，以及关于 Limitations section、一稿多投、匿名化和公开发布的必选确认，并在表单上注明作者列表在摘要截止时冻结。
- OpenReview 上补充材料 ZIP 的上限现为 250 MB，此前为 100 MB。2025 年关于补充材料在整个审稿期间公开的说明已删除，现在明确规定被拒论文保持不公开。
- 互审审稿（reciprocal reviewing）豁免现在包括 SAC。2025 年只有 AC 和 organizing chairs 可豁免。
- 作者注册：2025 规定至少一位作者必须注册，否则论文不会发表；oral 报告人未到场则降级为 poster；非作者可以展示 poster。2026 只说明每篇论文必须由一位列出的作者以完整注册（full registration）登记，未规定后果，也未规定报告人规则。
- OpenReview Chair 变更：2025 年例外申请发送至 keerthanpg@gmail.com，2026 年发送至 Carlo Sferrazza（csferrazza@berkeley.edu）。
- 时间线整体推迟。2026: 摘要 May 25，正文 May 28，补充材料 June 4，审稿意见 Aug 4，rebuttal 结束 Aug 11，通知 Sept 4，camera-ready Oct 12，会议 Nov 9-12 在 Austin 举行。2025: 摘要 Apr 23，正文 Apr 30，补充材料 May 7，审稿意见 Jun 25，rebuttal 结束 Jul 2，通知 Aug 1，camera-ready Aug 28，会议在 Seoul 举行。

#### 官方来源矛盾与注意事项

- **rebuttal 期间改稿：** rebuttal 页和作者页都说 rebuttal 期间不能改论文；审稿人指南仍保留一句旧模板 'Authors may submit a response and update their papers during the rebuttal period'。
- **时间线重叠的一稿多投找谁批：** 网站说找 Publication Chair，OpenReview 表单说找 Program Chairs。
- **近重复多投的后果：** 网站写 'will face desk rejection of all papers they have submitted'，表单写 'may face'。
- **撤稿：** 作者页面没有提撤稿，证据只有 OpenReview 配置。

### 3.12 KDD 2027（Research Track）

> KDD (ACM SIGKDD Conference on Knowledge Discovery and Data Mining), Research Track

- **届次（edition_used）：** KDD 2027 Research Track，First Cycle：摘要截止 July 19, 2026，正文截止 July 26, 2026。据 kdd2027.kdd.org 主页，会议于 August 1–5, 2027 在 San Jose McEnery Convention Center 举行。Cycle 2（February 2027）的 CFP 尚未发布，OpenReview 上也还没有对应的 group：FAQ 仍写着 "[exact date to be confirmed], 2027"。对比基线为 KDD 2026：Cycle 1（July 2025 截止，group Research_Track_August）和 Cycle 2（February 2026 截止）。截至 2026-09-24，Cycle 1 的两个投稿截止均已过，rebuttal 将于 Sep 29 开始。
- **投稿系统（submission_system）：** OpenReview（group `KDD.org/2027/Research_Track_Cycle_1`）。公开的 Submission invitation 截止于 Jul 20, 2026 11:59 UTC，并于 12:29 UTC 过期。此后，group 配置指向正文阶段使用的另一个 Full_Submission invitation，该 invitation 不可公开读取。

#### 规则

**`important_dates`｜本轮的关键日期是哪些？**（会议特有）

- 答案：**必须**。KDD 2027 Cycle 1 日期：摘要 Jul 19, 2026；正文 Jul 26, 2026；rebuttal Sep 29–Oct 13, 2026；通知 Nov 14, 2026。以上均为 AoE 当日结束，OpenReview 显示为 Jul 20 和 Jul 27, 2026 11:59 UTC。尚未公布：camera-ready 日期、审稿意见向作者发布的日期（FAQ 写的是 '[exact date to be confirmed], 2026'）、所有 Cycle 2 日期以及注册截止。OpenReview group 的 `start_date` 显示为 'Aug 09 2027'，与官网的 Aug 1–5, 2027 矛盾，以官网为准。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："All deadlines are end-of-day in the Anywhere on Earth (AoE) time zone."

**`abstract_registration`｜必须先注册摘要吗？占位摘要怎么处理？**

- 答案：**必须**。须在 Jul 19, 2026 AoE 前注册标题、摘要和作者列表。OpenReview Submission invitation 于 Jul 20 11:59 UTC 关闭，该阶段 PDF 字段为可选。禁止占位或虚假（dummy）摘要。有一个必选勾选项用于确认摘要不是占位摘要（例如 'TBD'），占位摘要可能被 desk reject。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："No placeholder abstracts. Placeholder or dummy abstracts are forbidden. Large changes to the title and abstract may result in a desk rejection."

**`title_change`｜摘要截止后还能改标题吗？**

- 答案：**有条件**。在摘要截止（Jul 19）与正文截止（Jul 26, 2026）之间对标题做小幅修改被暗示为允许，但大幅修改可能导致 desk reject。CFP 未定义何为 'large'，也未明确说明修改窗口。OpenReview 标题上限为 250 个字符。正文截止后或 camera-ready 阶段能否修改标题未规定。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Large changes to the title and abstract may result in a desk rejection."

**`abstract_text_change`｜摘要截止后还能改摘要吗？**

- 答案：**有条件**。摘要（OpenReview 表单中最多 5000 个字符）可在正文截止（Jul 26, 2026 AoE）前继续完善，但相对已注册摘要的大幅修改可能导致 desk reject。正文截止后或 camera-ready 阶段的修改未规定。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Large changes to the title and abstract may result in a desk rejection."

**`other_fields_after_abstract_deadline`｜摘要截止后，其他表单字段还能改吗？**（会议特有）

- 答案：**未规定**。官方未规定在摘要截止与正文截止之间还可以编辑哪些其他表单字段：keywords、TL;DR、通讯作者（corresponding author）、审稿人提名、resubmission 标记或链接、artifact 承诺（artifact pledge）、并行投稿披露。该阶段使用单独的 OpenReview Full_Submission invitation，不可公开读取。只有标题、摘要、作者列表和 PDF 有明确规则。
- 置信度：中｜来源：<https://api2.openreview.net/groups?id=KDD.org/2027/Research_Track_Cycle_1>

**`author_add`｜截止后还能加作者吗？**

- 答案：**不允许**。只能在摘要截止（Jul 19, 2026 AoE）前添加作者。此后不允许任何添加，CFP 对正文截止或 camera-ready 也没有给出例外。FAQ 中唯一的例外：获得 'Resubmit' 决定的论文，在作为新条目重投到紧接着的下一轮时，可以修改作者列表。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："There cannot be any addition, removal, or reordering of authors after the abstract submission deadline."

**`author_remove`｜截止后还能删作者吗？**

- 答案：**不允许**。只能在摘要截止（Jul 19, 2026 AoE）前删除作者，camera-ready 也无例外。转投下一轮的 Resubmit 论文可在下一轮修改作者列表。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："There cannot be any addition, removal, or reordering of authors after the abstract submission deadline."

**`author_reorder`｜截止后还能调整作者顺序吗？**

- 答案：**不允许**。作者顺序必须在摘要截止（Jul 19, 2026 AoE）时确定，此后不能更改。FAQ 允许 Resubmit 论文在重投到下一轮时更改作者组成或顺序。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："The full list of author names, including the ordering, must be finalized by the abstract submission deadline."

**`author_list_freeze`｜作者名单什么时候冻结？有没有例外流程？**

- 答案：**不允许**。作者列表及顺序在摘要截止（Jul 19, 2026 AoE；OpenReview 为 Jul 20 11:59 UTC）时冻结，即正文截止前一周。一个必选勾选项（`author_change_acknowledgment`）对此进行确认。KDD 2026 中允许更正拼写或新增单位（affiliation）的例外已从 2027 CFP 中删除，也未说明之后提出修改请求的流程或处罚。
- 置信度：高｜来源：<https://api2.openreview.net/invitations?expired=true&id=KDD.org/2027/Research_Track_Cycle_1/-/Submission>
- 原文："I understand that author information cannot be changed after the abstract submission deadline. Any additions, removals, or reordering of authors must be completed before the abstract deadline."

**`subject_area_change`｜截止后还能改领域、关键词或 track 吗？**

- 答案：**不允许**。本条针对的是 track。表单没有 subject-area 或 primary-area 字段，只有自由文本 keywords，且未规定 keywords 是否可编辑。每篇论文只能投一个 track，track 之间（Research、ADS、Datasets & Benchmarks、AI4Sciences）不可转投。据 FAQ，在某一 track 被撤稿或被拒的论文，只有在原因是与原 track 不匹配时，才能在下一轮投往其他 track。Resubmit 论文只在同一 track 内保留 resubmission 身份。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Authors should pay special attention to which track is most appropriate; papers may only be submitted to a single track and there are no transfers between tracks."

**`pdf_revision_window`｜截稿后还能改 PDF 吗？**

- 答案：**不允许**。PDF 可在正文截止（Jul 26, 2026 AoE）前上传或替换。截止时间严格，截止后无法再分享代码链接，因为 rebuttal 不允许超链接。没有官方文本明确说明审稿或 rebuttal 期间能否上传修改后的 PDF，因此 'not allowed' 的解读属于推断。被接收论文可进行 camera-ready 修改（9 页正文）。
- 置信度：低（待核）｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Deadlines. The submission deadlines are strict and no extensions, regardless of circumstances, will be allowed."

**`supplementary`｜补充材料的截止、格式和限制是什么？**

- 答案：**有条件**。没有单独的补充材料上传字段或截止：表单只有一个 PDF 字段。附录（页数不限，格式与正文相同：可复现性细节、证明、伪代码）放在同一 PDF 的参考文献之后。代码可通过投稿中的匿名 GitHub 仓库引用，这是推荐而非必需。未提及视频。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>

**`page_limit`｜页数限制是多少？哪些不计页？**

- 答案：**必须**。投稿：ACM 双栏模板（acmart `sigconf,anonymous,review`）8 页正文；参考文献和附录不限页数，审稿人无需阅读第 8 页之后的内容。重投论文的一页修改摘要（summary of changes）不计入页数。Camera-ready：最多 12 页，其中 9 页正文、3 页为参考文献加附录。违反格式要求将被 desk reject。未规定伦理（ethics）章节是否计入页数，且没有 checklist。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>

**`per_author_cap`｜每位作者最多能投几篇？**

- 答案：**有条件**。每位作者每轮最多出现在 7 篇 Research track 投稿中。超出前 7 篇（按 submission ID 计）的论文将被 desk reject，表单中有一个必选勾选项用于证明遵守该上限。此处不涉及其他 track 的上限。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："If more than 7 papers are submitted with the same person listed as an author, the additional papers submitted after the first 7 by submission id, will be desk-rejected."

**`reciprocal_reviewing`｜作者必须审稿吗？不审有什么后果？**

- 答案：**必须**。每篇投稿必须提名至少一位合格的作者审稿人（在 KDD 或相关会议发表过 3+ 篇论文）。参与 3 篇或以上投稿的作者可能被自动登记，除非其已担任审稿人、AC 或 SAC；表单的说法是他们 'will be automatically inducted'。处罚：审稿未完成或迟交的审稿人及其合作者，在完成审稿前无法查看自己论文的审稿意见。2026 年的 'grounds for desk rejection' 条款已删除。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>

**`profile_requirements`｜作者账号或 profile 有什么要求？何时完成？**

- 答案：**必须**。所有作者必须先有 OpenReview profile 才能被添加，因此实际上须在 Jul 19, 2026 摘要截止前完成。profile 必填字段：当前及过往单位（至少 5 年）、个人主页、DBLP（如有既往发表）、ORCID、导师以及近期发表（如有）。没有机构邮箱的新 profile 审核可能需要最多 2 周。profile 不完整即构成 desk reject 的理由。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："The OpenReview profile will be used to handle conflict of interest and paper matching. An incomplete OpenReview profile is sufficient ground for desk rejection."

**`arxiv_and_social_media`｜能发 arXiv、在社交媒体宣传吗？有没有匿名期？**

- 答案：**允许**。投稿必须匿名，但该工作可以已经以预印本形式公开（arXiv、SSRN），且无需引用该预印本。ACM 政策规定 arXiv 发布不算先前发表。审稿期间的发布、社交媒体宣传或匿名期均无官方规则（未规定）。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Authors may submit anonymized work that is already available as a preprint (e.g., on arXiv or SSRN) without citing it."

**`dual_submission_and_workshops`｜一稿多投和 workshop 论文怎么算？**

- 答案：**有条件**。禁止投稿正在任何有论文集的同行评审 venue 审稿中、或已被其接收或发表的论文。允许非存档（non-archival）的 workshop、海报和报告。相关的并行投稿（有共同作者）必须在表单中声明，未披露即构成 desk reject 的理由。Resubmit 论文若改投他处，绝不能同时在 KDD 和另一 venue 处于审议中。被 KDD 拒稿的论文，或在审稿意见发布后撤稿的论文，需等待一年。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Submissions must present original work—this means that papers under review at or published/accepted to any peer-reviewed conference/journal with published proceedings cannot be submitted."

**`rebuttal_format`｜rebuttal 是什么形式？能传新 PDF 或新实验吗？**

- 答案：**有条件**。作者在 Sep 29–Oct 13, 2026 期间对每条审稿意见发布回复，rebuttal 和讨论中不允许超链接。官方未规定篇幅限制，也未规定是否允许新增实验、图或表。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："After the submission deadline, there will be no further opportunity to share this with reviewers during the review process, as rebuttals and discussions will not allow hyperlinks."

**`rebuttal_revised_pdf`｜rebuttal 期间能上传修改后的 PDF 吗？**（会议特有）

- 答案：**未规定**。CFP 和 FAQ 均未规定在 Sep 29–Oct 13, 2026 期间能否上传修改后的 PDF 或 rebuttal PDF。rebuttal 仅被描述为对每条审稿意见的回复，OpenReview rebuttal 表单不公开。
- 置信度：中｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Rebuttal. Authors will have the chance to provide a response to each review during the rebuttal period."

**`withdrawal`｜能撤稿吗？撤稿后会公开吗？**

- 答案：**允许**。作者可随时通过 OpenReview 按钮撤稿。在审稿意见向作者发布后撤稿（发布日期仍为 '[to be confirmed], 2026'）会触发 12 个月等待期：在 KDD'28 第一个截止前不得重投。venue 配置设置了 `public_withdrawn_submissions=false` 和 `withdrawn_submission_reveal_authors=false`，因此撤稿论文不会公开，作者也不会被公开；这一点来自配置而非 CFP 文本。撤稿也是撤回必选的信息共享同意（information-sharing consent）的唯一方式。
- 置信度：高｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>

**`rejected_visibility`｜被拒论文和审稿意见会公开吗？**

- 答案：**不允许**。CFP 只承诺对被接收论文公开投稿原文、审稿意见、meta-review 和讨论。审稿期间投稿不公开（OpenReview `public_submissions=false`）。官方来源未明确说明决定公布后被拒投稿如何处理，也未规定是否存在将其公开的 opt-in。
- 置信度：低（待核）｜来源：<https://kdd2027.kdd.org/research-track-call-for-papers/>
- 原文："Transparency. By submitting paper(s) to KDD 2027, the authors agree that the original submission, reviews, meta-reviews, and discussions will be made public in OpenReview for all accepted papers."

**`llm_policy`｜作者使用 LLM 有什么规则？**

- 答案：**允许**。一个必选勾选项用于确认知悉 ACM Policy on Authorship（更新于 May 14, 2026）。AI 辅助写作无需披露。用于开展研究（设计、数据、代码、分析、图表）的 AI 必须在方法部分详细描述。所有作者都须承担责任，ACM 可能拒绝该投稿或撤回论文。KDD 2026 的 `LLM_usage_description` 字段已删除。关于隐藏提示词或 prompt injection 没有官方规则（未规定）。
- 置信度：高｜来源：<https://www.acm.org/publications/policies/new-acm-policy-on-authorship>

**`registration_presentation`｜录用后的注册和现场报告有什么要求？**

- 答案：**必须**。每篇被接收论文都需要单独一份 Full Conference（5-day）注册，按标准非学生线下费率，学生作者也须按此费率支付。付款截止仍标为 '[exact date to be confirmed], 2027'；未付款的论文将不收入论文集。KDD 2027 'planned to be' 完全线下举行，没有线上报告。可由合作者代为报告，未到场（no-show）的论文可能被从日程和论文集中撤下。
- 置信度：高｜来源：<https://kdd2027.kdd.org/frequently-asked-questions/>
- 原文："At least one author of each accepted paper must register for KDD and present the work in person."

**`resubmit_and_rejected_kdd_papers`｜'Resubmit' 论文和被拒论文怎样再投 KDD？**（会议特有）

- 答案：**有条件**。只有 'Resubmit' 论文可以作为重投投往紧接着的下一轮。重投须在 Paper Link 字段填写之前的 OpenReview forum URL，并将一页 Summary of Changes 作为 PDF 第一页；不允许在其他位置用颜色标记修改。被拒论文以及在审稿意见发布后撤稿的论文需等待一年。同一稿件不能同时投 KDD'27 的两个截止，resubmission 身份只在同一 track 内有效。
- 置信度：高｜来源：<https://kdd2027.kdd.org/frequently-asked-questions/>

#### 较去年变化（changes_vs_previous_year）

- 作者列表冻结提前。KDD 2026（两轮）在正文截止时冻结作者及其顺序，并允许之后更正拼写或新增单位。KDD 2027 Cycle 1 在摘要截止（Jul 19, 2026）时冻结，提前一周，且未说明任何例外；OpenReview 表单新增必选勾选项 'author_change_acknowledgment'。
- 占位规则收紧。2026 Cycle 1 CFP 禁止占位摘要。2026 Cycle 2 CFP 新增 'Large changes to the abstract may result in a desk rejection.' 2027 CFP 将其扩展到标题，并新增必选勾选项 'abstract_placeholder_acknowledgment'。
- LLM 政策。2026 CFP 写明 'Any use of generative AI tools must be disclosed and elaborated in the submission form'（`LLM_usage_description` 字段）。2027 删除了这句话和该字段，改为要求确认知悉更新于 May 14, 2026 的 ACM Policy on Authorship：写作辅助无需披露，但用于开展研究的 AI 必须在方法部分描述。
- 审稿人处罚。2026 规定未能提名合格审稿人或未能妥善审稿 'is grounds for desk rejection'；该条款在 2027 已删除。扣留自己论文审稿意见的处罚并非新增：2026 已规定，若某位作者审稿人未能妥善、按时审稿，该投稿的所有作者在 rebuttal 期间都看不到审稿意见。2027 重申了这一点，并新增迟交审稿人的合作者在审稿完成前也无法查看。参与 3+ 篇论文的作者自动登记的规则不变。
- 撤稿放宽。2026 仅允许在 rebuttal 结束前使用 OpenReview 撤稿按钮，之后的撤稿由 PC chairs 酌情决定。2027 允许 'at any time' 撤稿。审稿意见公开后撤稿的 12 个月等待期不变。
- 格式。2027 新增附录必须与正文格式相同，以及 'Papers in violation of these formatting requirements will be desk-rejected.'
- 报告。2027 新增只有部分被接收论文做口头报告，以及未到场论文可能被从日程和论文集中撤下（2026：从论文集中撤下）。2027 FAQ 称会议计划完全线下举行、没有线上报告；如无法参会，由合作者报告。2026 另有单独的 no-show 政策，还禁止远程和代理报告，并要求提前 4 周通知。
- ACM 开放获取 APC 补贴。2027：ACM/SIG 会员 $500，非会员 $750（较标价减免 29%）。2026：$250 和 $350（减免 65%）。
- 会议地点和时间线。Aug 1–5, 2027 在 San Jose，对比 Aug 9–13, 2026 在 Jeju。Cycle 1 调整为摘要 Jul 19、正文 Jul 26, 2026（原为 Jul 24 和 Jul 31, 2025）。Camera-ready、Cycle 2、审稿意见发布和注册截止均尚未公布。
- 不变：每位作者每轮 7 篇投稿上限；投稿时 8 页正文加不限页数的参考文献和附录，camera-ready 为 9+3 页；必须有完整的 OpenReview profile；允许 arXiv 预印本；只公开被接收论文；每篇被接收论文需一份独立的全价、非学生线下注册；被拒论文或审稿意见发布后撤稿的论文需等待一年。

#### 官方来源矛盾与注意事项

- **会议日期：** OpenReview group 的 start_date 是 'Aug 09 2027'，官网是 Aug 1–5, 2027，以官网为准。
- **自动登记审稿：** CFP 说 3 篇及以上的作者 'may be automatically signed up'，表单说 'will be automatically inducted'。
- **12 个月撤稿等待期的触发点：** "审稿发布给作者"的日期仍是 '[exact date to be confirmed], 2026'，撤稿前务必先确认审稿是否已发布。

## 4. 更多常见规则问题

这 12 个问题是作者常犯错、但上面 21 条没覆盖的规则。同样只用官方来源，2026-09-24 核对；"未规定"表示没有找到官方说法。标"补充"的一行来自第 3 节的核对表，不在原问题清单里。

### 4.1 `template_tampering`：我有没有缩小页边距、字号或行距？

- **为什么重要：** 论文会不经审稿直接 desk reject，而且截止后无法补救。
- **例子：** NeurIPS 2026："Submissions that violate the NeurIPS style (e.g., by decreasing margins or font sizes) or page limits may be desk rejected"（[handbook](https://neurips.cc/Conferences/2026/MainTrackHandbook)）。IJCAI-ECAI 2026 用了同样的表述，但写的是 "will be rejected without review"（[CFP](https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/)）。
- **App 功能：** PDF 检查器，核对纸张尺寸、页边距包围盒、最小字号，以及页数是否超过该会议的上限。

### 4.2 `mandatory_components`：哪些 checklist、章节或表单是必需的？

- **为什么重要：** 缺 checklist 或缺章节会被 desk reject，而且各会议要求的项目不同。
- **例子：**
  - NeurIPS："Do not remove the checklist: The papers not including the checklist will be desk rejected"（[guide](https://neurips.cc/public/guides/PaperChecklist)）。
  - ARR："Papers without a limitations section will be desk rejected"（[CFP](https://aclrollingreview.org/cfp)）；Responsible NLP checklist 填得不好 "can be considered grounds for desk rejection"（[author checklist](https://aclrollingreview.org/authorchecklist)）。
  - CVPR 2026：Compute Reporting Form 是 "mandatory"，与补充材料同时截止；缺交的处罚未规定（[CRF](https://cvpr.thecvf.com/Conferences/2026/ComputeReporting)）。
- **App 功能：** 每个会议一份必需项清单，每一项标明在哪个阶段交（投稿、补充材料或 camera-ready）。

### 4.3 `code_link_anonymity`：我的代码或 demo 链接是匿名的吗？

- **为什么重要：** GitHub 用户名、license、会追踪访客的托管站点和 Dropbox 链接，都可能破坏双盲。
- **例子：**
  - ICML 2026：删掉作者名和 license。Anonymous GitHub 只允许用 "on a branch that will not be modified after the submission deadline"（[instructions](https://icml.cc/Conferences/2026/AuthorInstructions)）。
  - ICLR 2027：托管站点不能追踪访客，否则论文面临 "risk of rejection"。作为补充材料上传或在论文中链接的代码，会随论文一起公开（[guidelines](https://iclr.cc/Conferences/2027/AuthorGuidelines)）。
- **App 功能：** 扫描器，标出个人 GitHub 链接、Dropbox 链接、短链接、致谢以及 "our previous work" 这类说法，并提醒冻结代码分支。

### 4.4 `same_venue_overlap`：我投同一会议的其他论文必须互相引用吗？

- **为什么重要：** 同一组作者投了内容重叠的论文时，所有论文都可能被 desk reject。
- **例子：**
  - ICML 2026：同一作者的相关论文 "must cite each other and discuss each other in the body of the paper"，并在补充材料里附匿名 PDF。违规可能导致 "desk rejection ... of all the submissions by the submitting authors"（[blog](https://blog.icml.cc/2026/01/08/whats-new-in-icml-2026-peer-review/)）。
  - NeurIPS 2026：以 "Anonymous et al." 引用这类工作并附匿名副本。"Papers violating this policy will be desk rejected"（[handbook](https://neurips.cc/Conferences/2026/MainTrackHandbook)）。
- **App 功能：** Portfolio 视图标出同一会议里有共同作者的论文，并加一个"互相引用、附 PDF"的任务。

### 4.5 `prior_rejection_disclosure`：必须声明这篇论文以前被拒过吗？

- **为什么重要：** 有些会议会 desk reject 没有声明的重投稿，有些会要求等一段时间才能重投。
- **例子：**
  - IJCAI-ECAI 2026：须声明过去 12 个月内在其他会议被拒的情况，并上传被拒版本和审稿意见。"fail to report" 的论文可能被拒（[CFP](https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/)）。
  - ARR：没有链接到之前版本的论文 "will be desk rejected"。meta-review 分数 1.5 表示下一轮不能重投，1 表示永远不能重投。截止 48 小时后才撤稿，要到之后的第二轮才能重投（[CFP](https://aclrollingreview.org/cfp)）。
- **App 功能：** 每篇论文的投稿历史（会议、决定、分数、审稿文件），自动填写重投表单，并执行等待期。

### 4.6 `track_or_type_switch`：投稿后还能换 track 或论文类型吗？

- **例子：**
  - NeurIPS 2026："no possibility to switch tracks or types"，重复投稿 "risk desk rejection from all tracks"（[CFP](https://neurips.cc/Conferences/2026/CallForPapers)）。
  - ARR：把短文改成长文仍算重投，不算新论文（[CFP](https://aclrollingreview.org/cfp)）。同一轮 ARR 内能否换类型未规定。
- **补充（第 3 节）：** AAAI-27 不能在主 track 与 AISI、AI Alignment 之间转；KDD 2027 各 track 之间 'no transfers'。
- **App 功能：** 摘要截止前提示选择 track，并把各 track 的规则并排列出。

### 4.7 `journal_conference_overlap`：能同时投期刊和会议吗？能把期刊论文拿到会议上报告吗？

- **例子：**
  - ICML 2026 禁止 "submitted in parallel to other conferences or journals"（[CFP](https://icml.cc/Conferences/2026/CallForPapers)）。IJCAI-ECAI 2026 禁止在其审稿期间投期刊。
  - 容易错过的机会：通过 J2C track，JMLR 和 TMLR 论文可以 poster 形式报告，但不进论文集。条件：2025-01-01 或之后发表；TMLR 论文需有 J2C、Featured 或 Outstanding certification；不能是某篇会议论文的扩展。申请截止：NeurIPS 2026 为 **September 26**，ICLR 2027 为 December 18, 2026，各 150 个名额（[J2C](https://neurips.cc/public/JournalToConference)）。
- **补充（第 3 节）：** ICRA 2027 可报告 RA-L 等 RAS 期刊论文，RA-L 须在 Mar 1 - Dec 31, 2026 之间、录用后 270 天内转过去（见 `ral_icra_option`）。
- **App 功能：** J2C 资格检查器，附截止提醒。

### 4.8 `contemporaneous_cutoff`：必须和很新的工作比较吗？

- **为什么重要：** rebuttal 里被批"缺少 baseline"时，这个截止日期很有用。
- **例子：**
  - NeurIPS 2026：March 1, 2026 之后上线的工作算同期工作（[handbook](https://neurips.cc/Conferences/2026/MainTrackHandbook)）。
  - ICML 2026：截止前不到两个月公开的工作（[reviewer instructions](https://icml.cc/Conferences/2026/ReviewerInstructions)）。
  - ICLR 2027：July 17, 2026 或之后发表的同行评审工作；只在 arXiv 上的论文从不要求比较（[reviewer guidelines](https://iclr.cc/Conferences/2027/ReviewerGuidelines)）。
- **补充（第 3 节）：** CVPR 2027：Sept 15, 2026 之后上线的论文算同期，不会因未比较而被拒，但作者仍被 'EXPECTED' 在可行时引用、讨论和实证比较。
- **App 功能：** 显示每个会议的截止日期，并让 rebuttal 助手引用这条规则。

### 4.9 `deadline_extension`：截止会延期吗？

- **例子：** ICML 2026："In no circumstances will extensions be given." ICLR 2027："deadlines are final"（AOE）。AAAI-27："no individual exceptions"（[instructions](https://aaai.org/conference/aaai/aaai-27/submission-instructions/)）。
- **补充（第 3 节）：** 反例是 ICRA 2027：截止在 Sept 16 公告延期 24 小时（Sept 15 到 Sept 16, 2026），而 CFP FAQ 仍写 'There is no plan to extend'。
- **App 功能：** AOE 倒计时，并换算成本地时间（例如北京时间）。

### 4.10 `sanctions_affiliation`：我的单位会让论文被拒吗？

- **例子：**
  - NeurIPS 2026 不接受 SDN 名单上的人、或被 "reasonably believe[d]" 与其有关联的人的投稿；非 SDN 类别可以投（[policy](https://neurips.cc/Conferences/2026/StateDeptGuidelines)）。NeurIPS 为此前 handbook 里链接到一个范围大得多的制裁查询工具道了歉（[homepage](https://neurips.cc/)）。
  - ICLR 2027：与 SDN 名单实体有关联的论文 "will be desk-rejected"（[guidelines](https://iclr.cc/Conferences/2027/AuthorGuidelines)）。
- **App 功能：** 链接到各会议的政策和官方 OFAC SDN 查询。这不是法律建议。

### 4.11 `registration_coverage`：一份注册能覆盖几篇论文？

- **例子：** NeurIPS 2026 和 ICLR 2027：一份注册覆盖该作者的所有论文；NeurIPS 的 "Virtual Only Pass" 不够。CVPR 2026：一份作者注册覆盖 "up to three papers"，包括 workshop 论文，且 "Virtual registrations will not cover a paper"（[registration](https://cvpr.thecvf.com/Conferences/2026/Pricing2)）。
- **补充（第 3 节）：** ECCV 2026 一份 full 注册至多 2 篇；ICRA 2027 full 注册 2 篇、学生注册 1 篇；IROS 2026 非学生、非单日注册至多 2 篇；EMNLP 2026 一份注册至多 6 篇；KDD 2027 每篇论文要单独一份全额注册。
- **App 功能：** 注册规划器，把论文分配给注册的人，并估算费用。

### 4.12 `name_change`：已发表论文上的名字能改吗？

- **例子：** NeurIPS 论文集：改名 "accepted with no questions asked"，通过 "Report an Issue" 提交（[proceedings](https://papers.neurips.cc/)）。ACL Anthology：用 "Fix data" 按钮；整卷不会重新生成，增删作者可能需要程序主席确认（[corrections](https://aclanthology.org/info/corrections/)）。审稿期间改名未规定。
- **App 功能：** 保存作者的各种姓名写法，并直接链接到各会议的更正表单。

## 5. 数据结构建议

目标：把每一届的规则写进 `data/editions/<series>/<year>.yml` 的 `policy.rules`，让 scheduler、advisor 和提醒直接读结构化字段，同时每条都能追溯到官方原文。下面是建议，不是定稿；它与 [DESIGN.md](DESIGN.md) 第 3 节的 `policy` 字段兼容。

### 5.1 约定

1. **key 与核对表对应。** 以 `rules_matrix.json` 的 21 个 rule id 为准，只把紧密相关的几条合并成一个结构（见 5.2 的映射表），会议特有的规则用同名 key 追加。
2. **缺 key 和 `unspecified` 含义不同。** 缺 key = 还没核；`status: unspecified` = 核过，官方没说。两者不能混用，也**不能**用其他会议的规则填空。
3. **时间点引用 milestone，不写死日期。** 用 `abstract`、`paper`、`supplementary`、`reviews_out`、`discussion_end`、`rebuttal`、`notification`、`camera_ready`、`commitment` 这些 milestone 类型；日期只在 `cycles[].milestones` 里写一次，改日期不用改规则。与 milestone 无关的具体时刻才写 `at:` 加 `tz:`（例如 ICML 的 `Jan 27, 2026 6pm EST`）。
4. **每条规则都带 `conf` 和 `src`。** `src` 指向 `sources` 里的条目（URL、`fetched_at`、逐字 `quote`，CI 校验 quote 确实出现在快照里）。短引文可以直接放在规则的 `quote` 字段。
5. **矛盾和推断要显式标。** 官方来源互相矛盾时写 `status: contradictory` 或在字段值里写 `contradictory`，并在 `conflicts:` 里列出双方原话；我们自己的推断加 `inferred: true`；沿用上一届的规则加 `inherited_from: 2026`（只能来自同一系列的上一届，且 `verified: false`）。
6. **状态词表：** `required | allowed | not_allowed | conditional | unspecified | not_required | contradictory`。`conf` 取 `high | medium | low`，界面上 `low` 显示"待核"。

### 5.2 rule id 到 `policy.rules` 的映射

| 核对表 rule id | `policy.rules` 下的 key | 主要使用者 |
|---|---|---|
| `abstract_registration` | `abstract_registration` | 提醒（摘要截止）、scheduler（预注册摘要任务） |
| `author_add`、`author_remove`、`author_reorder`、`author_list_freeze` | `author_freeze` | 提醒（冻结前 48 小时）、Portfolio（锁定作者名单） |
| `title_change`、`abstract_text_change`、`subject_area_change`，以及 ICML/CVPR/ECCV/KDD 的"截止之间能改什么"类规则 | `metadata_edits.{title, abstract, areas, other_fields, track}` | Portfolio 字段锁定提示 |
| `pdf_revision_window` | `pdf_revision` | 任务生成；advisor（讨论期能否改稿） |
| `supplementary` | `supplementary` | 任务（补充材料截止） |
| `page_limit` | `page_limit` | revise（格式 diff） |
| `per_author_cap` | `per_author_cap`（取代 DESIGN.md 里的 `author_cap`） | 上限仪表 |
| `reciprocal_reviewing`（含 ICML `reciprocal_reviewer_correction`） | `reciprocal_reviewing`（吸收 DESIGN.md 的 `review_quota`） | 审稿任务、资格计算 |
| `profile_requirements` | `profile` | 合作者资料提醒 |
| `arxiv_and_social_media` | `preprint` | 提醒 |
| `dual_submission_and_workshops` | `dual_submission`（窗口仍放在 `cycles[].dual_submission`） | `feasible()`、转投图 |
| `rebuttal_format`（含 KDD `rebuttal_revised_pdf`） | `rebuttal` | Review Round |
| `withdrawal` | `withdrawal`（吸收 `withdraw_penalty`） | advisor 撤稿代价 |
| `rejected_visibility` | `visibility` | advisor |
| `llm_policy` | `llm_authors` | revise 的 LLM 模式 |
| `registration_presentation` | `attendance` | 签证和出行提醒 |
| 其他特有规则：`camera_ready_content_change`、`camera_ready`、`ppi_submission_fee`、`ral_icra_option`、`resubmit_and_rejected_kdd_papers`、`important_dates` | `camera_ready`、`fees.submission`、`edges`、`resubmission`、`cycles[].milestones` | 各自模块 |

`author_freeze` 的取值约定：

| 字段 | 取值 |
|---|---|
| `membership_at` / `order_at` | milestone 类型；`submission` 表示"提交即冻结"（ARR）；`unspecified` |
| `camera_ready` | `none`（什么都不能改）、`reorder_only`、`reorder_and_corresponding_author`（ECCV 2026）、`acl_policy`（ARR）、`unspecified` |
| `exceptions` | `none`、`email_chair`（CoRL）、`written_request_to_pc`（ICML 2026 名义上有、实际未批）、`acl_policy_approval`（ARR）、`unspecified` |

### 5.3 完整示例：ICLR 2027

里程碑沿用 DESIGN.md 里的 `iclr-2027`（abstract `2026-09-18T23:59` AoE、paper `2026-09-25T23:59` AoE、reviews_out `2026-11-05`、discussion `2026-11-05` 到 `2026-11-18`、notification `2026-12-16`）。

```yaml
# data/editions/iclr/2027.yml（只列 policy.rules；其他字段见 DESIGN.md）
policy:
  verified: human
  checked_at: 2026-09-24
  inherited_from: null
  rules:
    abstract_registration:
      status: required
      at: abstract
      pdf_required: false
      required_fields: [title, authors_by_profile_id, keywords, primary_area, code_of_ethics,
                        paper_visibility, submission_requirements, ai_use, reciprocal_reviewer, exemption]
      placeholder: removed                 # placeholder or duplicate abstracts will be removed
      conf: high
      src: s_guide
      quote: "Abstracts submitted by the abstract submission deadline must be genuine; placeholder or duplicate abstracts will be removed."

    author_freeze:
      membership_at: abstract
      order_at: paper
      order_in_discussion: contradictory
      camera_ready: unspecified            # 2027 未写；2026 指南允许 camera-ready 调序
      exceptions: none                     # 'no exceptions whatsoever'
      locked_at_abstract: [reciprocal_reviewer, recent_qualifying_paper, exemption]
      conf: medium
      src: s_guide
      quote: "Author order may be edited after the abstract deadline, but new authors cannot be added or removed. No changes to authors are permitted after the submission deadline."
      conflicts:
        - {a: "main text: No changes to authors are permitted after the submission deadline",
           b: "discussion-stage FAQ: the order can be changed", src: s_guide}

    metadata_edits:
      title:
        until: paper
        condition: must_not_read_like_a_different_paper
        frozen: {from: paper, to: reviews_out}
        in_discussion: contradictory       # 正文说讨论期结束前不能改，FAQ 说 Nov 5-18 可以
        camera_ready: unspecified
        conf: medium
        src: s_guide
      abstract:
        until: paper
        condition: stay_close_to_registered
        frozen: {from: paper, to: reviews_out}
        in_discussion: allowed             # 通过修订版，并告知审稿人和 AC
        camera_ready: unspecified
        conf: high
        src: s_guide
      areas: {status: unspecified, fields: [primary_area, keywords], conf: medium, src: s_form}

    pdf_revision:
      until: paper
      frozen: {from: paper, to: reviews_out}   # 'no matter how small'
      reopen: {from: reviews_out, to: discussion_end, page_limit: 10, compared_by: pdfdiff}
      camera_ready_instructions: "mid-February 2027"
      conf: high
      src: s_guide

    supplementary:
      status: allowed
      due: paper
      max_mb: 100
      main_pdf_max_mb: 50
      public: true
      anonymized: true
      no_visitor_tracking_hosts: true
      conf: high
      src: s_guide

    page_limit:
      submission: 9
      discussion: 10
      camera_ready: 10
      over_limit: desk_reject
      not_counted: [references, appendix, ai_use_section, ethics_statement, reproducibility_statement, acknowledgements]
      conf: high
      src: s_guide

    per_author_cap:
      max_papers: 20
      max_papers_without_eligible_reciprocal_reviewer: 1
      flag_at: abstract
      enforce_at: paper
      over_limit: random_desk_reject
      eligibility_snapshot: abstract
      duplicate_profiles_penalty: [desk_reject_all_papers, openreview_suspension_6m_plus]
      conf: high
      src: s_guide

    reciprocal_reviewing:
      status: required
      heavy_author: {if_papers_gte: 3, reviews: 6, exempt: [AC, SAC, organizing_chair]}
      per_paper: {qualified_authors: 1, reviews: 3, field_locked_at: abstract}
      no_qualified_author: exempt_but_counts_toward_1_paper_cap
      penalties: [own_reviews_hidden_until_done, desk_reject]
      conf: high
      src: s_guide

    profile:
      status: required
      due: contradictory                   # FAQ：正文截止前；表单：提交前，且只收 profile ID
      moderation: "up to two weeks"        # 无机构邮箱
      wrong_info: desk_reject
      conf: medium
      src: s_guide

    preprint: {arxiv: allowed, during_review: allowed, embargo: unspecified, social_media: unspecified,
               conf: high, src: s_guide}

    dual_submission:
      status: conditional
      non_archival_workshops: allowed
      register_abstract_while_under_review_elsewhere: allowed   # NeurIPS FAQ：录用则撤
      conf: high
      src: s_guide

    rebuttal:
      window: {from: reviews_out, to: discussion_end}
      format: openreview_comments
      comment_word_limit: unspecified      # 有限制，数字未公布
      revised_pdf: allowed                 # 不限次数，10 页；作者成员不能改
      new_experiments: limited_scope
      code_links: reviewers_and_acs_only
      conf: high
      src: s_guide

    withdrawal:
      status: allowed
      until: notification
      before_paper: deleted
      after_paper: public_deanonymized_immediately
      conf: high
      src: s_guide

    visibility:
      submissions_public_from: review_start
      reviews: public
      after_notification: all_papers_public_deanonymized   # 含被拒和撤稿，不可 opt-out
      conf: high
      src: s_guide

    llm_authors:
      status: required
      disclosure: [mandatory_section, form_question]
      counts_toward_pages: false
      prompt_injection: unspecified        # 2027 政策未提；仅 iclr.cc/FAQ 仍挂 2026 政策
      conf: high
      src: s_ai

    attendance:
      registration: required               # 'Conference and Workshops'
      in_person: unspecified               # 2026 要求现场注册
      one_registration_covers_many: true
      conf: medium
      src: s_guide

sources:
  s_guide: {url: "https://iclr.cc/Conferences/2027/AuthorGuidelines", fetched_at: 2026-09-24}
  s_ai:    {url: "https://iclr.cc/Conferences/2027/AIPolicyForAuthors", fetched_at: 2026-09-24}
  s_form:  {url: "https://api2.openreview.net/invitations?id=ICLR.cc/2027/Conference/-/Submission&expired=true",
            fetched_at: 2026-09-24}
```

### 5.4 完整示例：KDD 2027（Research Track）

KDD 是多轮会议，规则挂在 edition 上，日期挂在各轮上。Cycle 2（February 2027）的 CFP 还没发布。

```yaml
# data/editions/kdd/2027.yml
id: kdd-2027
series: kdd
dates: {start: 2027-08-01, end: 2027-08-05}      # 官网；OpenReview start_date 'Aug 09 2027' 与之冲突，以官网为准
location: {city: San Jose, venue: San Jose McEnery Convention Center}
cycles:
  - id: cycle-1
    track: research
    milestones:
      - {type: abstract,      at: 2026-07-19T23:59, tz: AoE, effects: [author_freeze], src: s_cfp}
      - {type: paper,         at: 2026-07-26T23:59, tz: AoE, src: s_cfp}
      - {type: reviews_out,   at: null, status: tba}          # '[exact date to be confirmed], 2026'
      - {type: rebuttal,      start: 2026-09-29, end: 2026-10-13, tz: AoE, src: s_cfp}
      - {type: notification,  at: 2026-11-14, tz: AoE, src: s_cfp}
      - {type: camera_ready,  at: null, status: tba}
      - {type: author_registration, at: null, status: tba}
  - id: cycle-2
    status: tba
policy:
  verified: human
  checked_at: 2026-09-24
  rules:
    abstract_registration:
      status: required
      at: abstract
      pdf_required: false
      placeholder: forbidden               # 勾选项 abstract_placeholder_acknowledgment；可 desk reject
      conf: high
      src: s_cfp
      quote: "No placeholder abstracts. Placeholder or dummy abstracts are forbidden. Large changes to the title and abstract may result in a desk rejection."

    author_freeze:
      membership_at: abstract
      order_at: abstract
      camera_ready: none
      exceptions: none                     # KDD 2026 的拼写/单位更正例外已取消
      acknowledgment_field: author_change_acknowledgment
      next_cycle_resubmit_may_change: true # 只限 'Resubmit' 论文
      conf: high
      src: s_cfp
      quote: "There cannot be any addition, removal, or reordering of authors after the abstract submission deadline."

    metadata_edits:
      title:    {until: paper, condition: no_large_change, inferred: true, max_chars: 250,
                 after_paper: unspecified, camera_ready: unspecified, conf: medium, src: s_cfp}
      abstract: {until: paper, condition: no_large_change, max_chars: 5000,
                 after_paper: unspecified, camera_ready: unspecified, conf: medium, src: s_cfp}
      other_fields: {status: unspecified, conf: medium, src: s_group}   # keywords、TL;DR、审稿人提名等
      track: {transfer: not_allowed, next_cycle_if_misfit: allowed, conf: medium, src: s_cfp}

    pdf_revision:
      until: paper
      during_review: not_allowed
      inferred: true                       # 官方没有明文，conf 低
      camera_ready_content_pages: 9
      conf: low
      src: s_cfp

    supplementary:
      status: conditional
      separate_upload: false               # 只有一个 PDF 字段
      appendix: {in_main_pdf: true, page_limit: none, same_format_as_body: true}
      code: anonymized_github_optional
      conf: high
      src: s_cfp

    page_limit:
      submission: {content: 8, references: unlimited, appendix: unlimited}
      camera_ready: {total: 12, content: 9}
      resubmission_summary_page_counted: false
      over_limit: desk_reject
      conf: high
      src: s_cfp

    per_author_cap:
      max_papers: 7
      scope: research_track_per_cycle
      over_limit: desk_reject_beyond_first_7_by_submission_id
      certified_by_checkbox: true
      conf: high
      src: s_cfp

    reciprocal_reviewing:
      status: required
      per_paper: {qualified_authors: 1, qualification: "3+ papers at KDD or related conferences"}
      auto_enroll: {if_papers_gte: 3, wording: contradictory}   # CFP 'may be'，表单 'will be'
      penalties: [own_and_coauthors_reviews_hidden_until_done]
      conf: high
      src: s_cfp

    profile:
      status: required
      due: before_added                    # 实际即 abstract
      fields: [affiliations_5y, homepage, dblp_if_any, orcid, advisors, recent_publications_if_any]
      moderation: "up to 2 weeks"
      incomplete: desk_reject
      conf: high
      src: s_cfp

    preprint: {arxiv: allowed, cite_preprint: not_required, during_review: unspecified,
               social_media: unspecified, conf: medium, src: s_cfp}

    dual_submission:
      status: conditional
      proceedings_venues: not_allowed
      non_archival_workshops: allowed
      related_parallel_submissions: must_declare   # 未申报可 desk reject
      conf: high
      src: s_cfp

    rebuttal:
      window: {milestone: rebuttal}        # Sep 29–Oct 13, 2026
      format: per_review_response
      hyperlinks: not_allowed
      length: unspecified
      new_experiments: unspecified
      revised_pdf: unspecified
      conf: medium
      src: s_cfp

    withdrawal:
      status: allowed
      until: any_time
      after_reviews_out: {wait_months: 12, next_allowed: "KDD'28 first deadline"}
      public: false                        # OpenReview 配置，非 CFP 原文
      conf: high
      src: s_cfp

    visibility:
      accepted: [original_submission, reviews, meta_reviews, discussions]
      rejected: not_allowed                # 官方没写被拒论文的去向，conf 低
      conf: low
      src: s_cfp

    llm_authors:
      policy: acm_authorship
      policy_updated: "May 14, 2026"
      writing_help_disclosure: not_required
      research_use_disclosure: methods_section
      prompt_injection: unspecified
      conf: high
      src: s_acm

    attendance:
      in_person: required                  # 'planned to be' 全现场
      registration: one_full_non_student_per_paper
      deadline: tba
      no_show: may_be_withdrawn
      conf: high
      src: s_faq

    resubmission:
      allowed_from: resubmit_decision_only
      to: next_cycle_same_track
      requires: [previous_forum_url_in_paper_link, one_page_summary_of_changes_first]
      rejected_or_withdrawn_after_reviews: {wait_months: 12}
      conf: high
      src: s_faq

sources:
  s_cfp:   {url: "https://kdd2027.kdd.org/research-track-call-for-papers/", fetched_at: 2026-09-24}
  s_faq:   {url: "https://kdd2027.kdd.org/frequently-asked-questions/", fetched_at: 2026-09-24}
  s_group: {url: "https://api2.openreview.net/groups?id=KDD.org/2027/Research_Track_Cycle_1", fetched_at: 2026-09-24}
  s_acm:   {url: "https://www.acm.org/publications/policies/new-acm-policy-on-authorship", fetched_at: 2026-09-24}
```

### 5.5 CI 与维护建议

- **schema 校验：** `author_freeze.membership_at` 和 `order_at` 必须是已定义的 milestone 类型或 `submission`/`unspecified`；`status` 只能取 5.1 的词表。
- **引文校验：** 每个 `quote` 必须逐字出现在对应 `src` 的快照里。
- **矛盾不能静默：** 出现 `contradictory` 的字段必须有非空 `conflicts`，界面上显示为"官方自相矛盾，按更严格的一边准备"。
- **推断不能冒充规则：** `inferred: true` 的字段在界面上显示"推断"，不参与 `blocking` 级提醒。
- **跨届继承：** 新一届页面没出来时，才允许 `inherited_from`，且只来自同系列上一届；CVPR 2027 目前就是这种状态。
