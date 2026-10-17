# NextVenue 设计文档 v1.0（合并定稿，2026-09-24）

> **注意（2026-09-24 更新）：** 项目已确定只做四大支柱（个人规划、审稿后决策、政策监控、规则库），不再做 tracker。本文件 §2 的 Tracker 和 Giscus 讨论区、§4.2 的维护者抓分和 T1 分段表、§7 的 HiGHS，以及 §8 路线图都已被 [ROADMAP.md](ROADMAP.md) 取代；两者冲突时以 ROADMAP 为准。


> 日期默认按 AoE。标 **UNVERIFIED** 的内容还没在官网核实。所有引擎的输出都只是建议，最终由作者自己决定。

## 1. 产品定位

NextVenue（投稿下一站）是一个开源（AGPL-3.0）、本地优先（local-first）的"投稿作战室"，代码放在公开的 GitHub 仓库。

**公共层**是一份 data-as-code 的会议数据库，覆盖 CS/AI/NLP/CV/robotics 主要会议：
- 每一届的完整时间线：摘要、正文、Phase-1、rebuttal/讨论、通知、camera-ready、录用后作者注册。ARR/KDD/WACV 这类多轮会议按"每一轮"记录。
- 会期和地点、注册费、CCF/CORE 等级。
- 按年份记录的投稿政策，以及讨论区入口。

每个字段都带官方链接、抓取时间和核实状态。社区和自动化 agent 只能提 PR，由人工合并。

**私有层**只存在用户自己的设备上。用户导入自己的论文、合作者和审稿分数，三个引擎分别回答三个问题：
- **scheduler**：哪篇投哪、什么时候投、被拒后转投哪里。
- **advisor**：一轮分数出来后，留下 rebuttal，还是撤稿转投。
- **policy watcher**：会议改了政策，哪些论文受影响，要怎么重排。

现在用 AI 写论文变便宜了，这个 App 要优化的是投稿结果，而不是投稿数量。所以它按人严格计算投稿上限，检测近似重复的稿子，也不帮用户拆分论文。

## 2. 总体架构

```
 PUBLIC  (GitHub repo + Actions + GitHub Pages)
 official pages (CFP/Dates/AuthorGuide*/Pricing)     ccfddl YAML, HF ai-deadlines (MIT)
 blog RSS, ARR git commits, CCF/CORE lists                       |
          |                                                      |
   [watchers] fetch -> snapshot -> diff -> regex (-> LLM, v1)   [importers] daily sync
          |        snapshots on orphan branch                    |  data/upstream + NOTICE
          +------> PR / issue: source_url, fetched_at, verbatim quote <-----+
                   CI: ajv schema | quote-in-snapshot | cascade golden tests
                       | cross-source conflict -> issue | human merge
                                          v
             data/: series, editions, cycles, edges, policies, stats bands
                                          v  build
             bundle.<sha256>.json | per-venue .ics | mainland mirror (later)
 =========================================|====================================
 PRIVATE  (browser now, phone later; IndexedDB; no telemetry)
   UI: Today | Venue page | Portfolio kanban | Planner | Review Round | Policy inbox
   packages/core:   time(AoE/PST/Beijing) | feasible() | scheduler | advisor | policy-impact
   packages/revise: review->tasks | format diff | ref check | hidden-text scan (BYO key)
   packages/cli:    nextvenue plan portfolio.json -> plan.json
```

各模块的职责：

- **importers**
  - 每天把 ccfddl（DDL、时区、地点、ccf/core/thcpl）和 HF ai-deadlines（Phase-1、rebuttal、camera-ready 等节点）同步到 `data/upstream/`，保留两者的 MIT NOTICE。
  - 映射进 `data/` 时，不覆盖人工核实过（`verified: human`）的字段。两个来源不一致时自动开 issue。
  - 许可不明的来源只放链接、不做镜像，并记在 `DATA_SOURCES.md` 里。包括 eventhosts iCal、sec/sys-deadlines、paperlists。
- **watchers**：见 4.3。
- **build**：把全部数据打成一个以内容哈希命名的 bundle，客户端一次下载全部数据，不按会议逐个请求，这样不会暴露用户在投哪些会。同时生成各会议的公共 .ics。
- **packages/core**：纯 TypeScript，不联网。浏览器、CLI、CI（级联回归测试）和将来的手机端共用同一份代码。
- **packages/cli**：输入 JSON、输出 JSON。方便一个人开发时不开界面就能测引擎，贡献者也能用它复现 bug。
- **stats/**：离线 Python，只提交汇总后的分段表和来源说明。88.8 MB 的 paperlists LFS 文件不进仓库，也不进 CI。
- **界面**
  - **Today**：一条时间线，每个时间都同时显示会议时区和北京时间。
  - **会议页**：阶段时间线；政策卡片，标出"较去年变化"；费用；等级；"last checked"时间；讨论区。
  - **Portfolio 看板**：Idea → Writing → Submitted → Phase-1 → Rebuttal → Decision → Camera-ready → Registered。
  - **Planner**：甘特图，加上每位作者的投稿上限仪表。
  - **Review Round**、**Revision workspace**。
  - **Policy inbox**：消息分 blocking、plan-change、FYI 三级。
  - 界面中英双语，支持 CCF-A 目标模式。
- **讨论区**
  - 用 Giscus，按页面路径映射。出结果之前默认只讨论日程和行程安排。
  - 禁止贴审稿意见，禁止发"正在投 X"一类的帖子。
  - 第一版就同时链接 ccfddl 企业微信群、知乎和 Reddit，照顾上不了 GitHub 的用户。

## 3. 核心数据模型

**公共实体**
- `Series`：会议本身。等级带版本号，如 `ccf_edition: 7`。
- `Edition`：某一年的会议。
- `Cycle`：多轮会议的每一轮；单轮会议默认有一个 `main`。
- `Milestone`：时间节点。**每个节点都带自己的时区**，例如 ICRA 2027 用 PST。
- `Edge`：会议之间的特殊路径，写明条件和需要做的动作。例如 ARR→EACL 的 commit、ICRA↔IROS 的 transfer（需要 response file）。
- `Policy`：带 `verified`、`inherited_from` 和 `changed_from_prev`。
- `Fees`、`Ranks`、`Source`（字段级来源）。
- `StatsBand`：分数刻度、分段表、留一年回测误差，以及分数来源是 `final` 还是 `pre_rebuttal`。

**私有实体**
- `Person`：本地保存的发表记录，互审资格由每一届的规则算出来；在其他会议的投稿数；审稿任务；签证需要提前多少天。
- `Paper`。
- `Submission`：一篇论文的一次投稿。
- `Review`：同时存 pre 和 post 两个分数、confidence，以及指向本地原文的指针。
- `Plan`：记录生成时用的 `bundle_hash`、推理过程，以及用户是否确认。
- `Task`、`RevisionLog`。

**会议年份示例：**
```yaml
# data/editions/iclr/2027.yml
id: iclr-2027
series: iclr
location: {city: San Francisco, venue: null}   # Moscone 只是从官网照片推断的，UNVERIFIED
dates: {start: 2027-04-26, end: 2027-04-30}
ranks: {ccf: A, ccf_edition: 7, core: null}     # CORE 来源还没核实，先留空
cycles:
  - id: main
    milestones:
      - {type: abstract, at: 2026-09-18T23:59, tz: AoE, effects: [author_freeze, cap_flag], src: s_dates}
      - {type: paper,    at: 2026-09-25T23:59, tz: AoE, effects: [cap_enforce], src: s_dates}
      - {type: reviews_out,  at: 2026-11-05, tz: AoE, src: s_cfp}
      - {type: discussion,   start: 2026-11-05, end: 2026-11-18, tz: AoE, src: s_cfp}
      - {type: notification, at: 2026-12-16, tz: AoE, src: s_cfp}
      - {type: camera_ready, at: null, status: tba}
      - {type: author_registration, at: null, status: tba}
    dual_submission: {window_start: paper, window_end: notification, pre_register_ok: true, src: s_guide}
policy:
  verified: human
  inherited_from: null
  changed_from_prev: [author_cap, no_reciprocal_papers_per_author, reciprocal_eligibility,
                      llm_authors, llm_reviewers, timeline]
  author_cap: {max: 20, flag_at: abstract, enforce_at: paper, over_limit: random_desk_reject, src: s_blog}
  no_reciprocal_papers_per_author: 1   # 2026 新人豁免 → 2027 每人最多 1 篇（收窄，不是取消）
  reciprocal_eligibility: {rule: accepted_paper_at_any, venues_src: s_guide}  # 名单扩到 UAI/AISTATS/JMLR/TMLR/ACL/CVPR/AAAI/IJCAI/KDD/COLT 等
  review_quota: {per_paper_author_reviews: 3, if_author_papers_gte: 3, reviews: 6}
  page_limit: {submission: 9, discussion: 10, camera_ready: 10}
  llm_authors: {disclosure: mandatory_section, counts_toward_pages: false, form_questions: true,
                falsehood_or_plagiarism: may_desk_reject, src: s_ai}
  llm_reviewers: {must_submit: [own_assessment, all_llm_inputs],
                  penalty_may_include: [desk_reject_own_papers, future_ban]}
  visibility: {withdrawn_after_paper_deadline: public_deanonymized_now,
               all_papers_after_notification: public_deanonymized, reviews_public: true}
  score_scale: null                    # 2027 没有公布
fees: {status: not_published, watch: "https://iclr.cc/Conferences/2027/Pricing"}
discussion: {giscus: true, mode: logistics_until_notification}
sources:
  s_dates: {url: "https://iclr.cc/Conferences/2027/Dates", fetched_at: 2026-09-24, verified: human}
  s_cfp:   {url: "https://iclr.cc/Conferences/2027/CallForPapers", fetched_at: 2026-09-24}
  s_guide: {url: "https://iclr.cc/Conferences/2027/AuthorGuidelines", fetched_at: 2026-09-24}
  s_blog:  {url: "https://blog.iclr.cc/2026/09/02/submission-policies-for-iclr-2027/",
            fetched_at: 2026-09-24, quote: "<逐字引文；CI 校验它确实出现在快照里>"}
  s_ai:    {url: "https://iclr.cc/Conferences/2027/AIPolicyForAuthors", fetched_at: 2026-09-24}
```

**多轮会议片段：**
```yaml
# data/editions/arr/2026.yml
cycles:
  - id: aug-2026
    milestones: [{type: paper, at: 2026-08-03}, {type: meta_reviews, at: 2026-10-08}]
    commit_edges: [{to: eacl-2027, commit_by: 2026-10-11}]
  - id: oct-2026
    milestones: [{type: paper, at: 2026-10-12}, {type: meta_reviews, at: 2026-12-17}]
    commit_edges: [{to: naacl-2027, commit_by: 2026-12-23}]    # COLING 待公布
policy:
  author_cap: {total_per_cycle: 20, first_author_per_cycle: 5, from_cycle: oct-2026}
  withdraw_penalty: {free_within_hours: 48, blocked_next_cycles: 1, waivers: [may-2026]}
  resubmit_block: {meta_1_5: next_cycle, meta_1: forever}
```

**用户数据示例**（只存在本地 IndexedDB，可以导出成加密文件）：
```json
{
  "people": [
    {"id": "me", "publications": [{"venue": "cvpr", "year": 2025, "status": "accepted"}],
     "other_submissions": {"iclr-2027": 3},
     "reviewer_duties": [{"edition": "iclr-2027", "quota": 6, "llm_rule": "submit_own_assessment_and_inputs"}],
     "travel": {"visa_lead_days": 60}},
    {"id": "coauthor-A", "publications": [], "other_submissions": {"iclr-2027": 1}}
  ],
  "paper": {"id": "p-007", "title": "(local only)", "topic": "LLM agents", "ready": "2026-05-01",
            "format": {"template": "neurips", "main_pages": 9}, "revise_days": 5,
            "authors": [{"person": "me", "first": true}, {"person": "coauthor-A"}],
            "tier_utility": {"CCF-A": 1.0, "CCF-B": 0.6}},
  "submissions": [
    {"edition": "neurips-2026", "state": "rejected", "scale": "neurips:1-6",
     "reviews": [{"rid": "R1", "pre": 4, "post": 4, "conf": 3},
                 {"rid": "R2", "pre": 3, "post": 3, "conf": 4},
                 {"rid": "R3", "pre": 3, "post": 4, "conf": 3}],
     "review_text": "local://p-007/neurips-2026",
     "decision": {"at": "2026-09-24", "outcome": "reject"}},
    {"edition": "iclr-2027", "state": "abstract_registered", "at": "2026-09-18",
     "role": "fallback", "counts_toward_cap_since": "2026-09-18"}
  ],
  "plan": {"bundle_hash": "sha256:3f2a…", "confirmed_by_user": true,
           "chain": ["neurips-2026", "iclr-2027", "icml-2027"],
           "reasoning": "clean route NeurIPS→ICLR, gap 1 day, abstract pre-registered",
           "tasks": [
             {"due": "2026-09-25T23:59 AoE", "beijing": "2026-09-26 19:59", "do": "ICLR 正文 + AI-use section"},
             {"due": "2026-11-05", "do": "Review Round：留下，还是撤稿转 CVPR（注册截止 11/10）"}]},
  "revision_log": [{"at": "2026-09-22", "kind": "ai_edit", "tool": "byo-llm",
                    "before": "local://p-007/v11", "after": "local://p-007/v12"}]
}
```

## 4. 三个核心引擎

### 4.0 共用的可行性函数：`feasible()`

这是一个纯函数，返回一个结构体，而不是简单的 true/false：

```
feasible(paper, A, B, today) -> {ok, route, actions[], costs[], conditions[]}
  time:  B.paper_deadline − max(A.decision, paper.ready) ≥ prep_days(A.format→B.format) + revise_days
  route: clean       if B.window_start > A.decision
                     (若 B.abstract < A.decision：要求 B.pre_register_ok，并生成"预注册摘要"任务)
         exit        elif today < B.window_start 且 A 允许撤稿；cost += A.withdraw_penalty
         conditional 例：CoRL 需事先获 Publication Chair 批准；ICRA↔IROS transfer 需 response file
         infeasible  otherwise
  caps:  在整个投稿组合里按人计数（预注册的摘要也算）；上限若继承自上一年(inherited)，只警告不阻断
```

**级联回归测试（golden tests）。** 每个数据 PR 都要跑一遍。改了一个日期、导致已知的转投路径结论变了，CI 就失败：
1. NeurIPS 2026 → ICLR 2027：直接转投，间隔 1 天，前提是 9/18 前已注册 ICLR 摘要。
2. AAAI-27 Phase-1 被拒（9/24）→ ICLR 2027：间隔 1 天，前提同上。
3. ICLR 2027 → CVPR 2027：只能撤稿后转投。决策窗口在 11/5（出审稿）和 11/10（CVPR 注册）/ 11/16（CVPR 正文）之间。
4. ICRA → RSS：不能直接转，只能先撤稿。IROS → CoRL：只能走 conditional 路径（需 Publication Chair 批准）。
5. ARR 8 月轮：10/8 出 meta-review，之后二选一：10/11 前 commit 到 EACL，或者修改后赶 10/12 那一轮。

### 4.1 投稿排期器（scheduler）

**输入：**
- 论文：完成日期、主题、模板和页数、作者名单。每位合作者在各会议的其他投稿数由用户手填（App 看不到合作者的其他论文）。
- editions、cycles、edges。
- 各人的发表记录，用来按每一届的规则算互审资格。
- 用户偏好：各等级的效用 U、每月折扣 δ（默认 0.97）、最多同时进行几个 rebuttal、签证提前量。

**逻辑：**
1. 对每篇论文枚举深度不超过 3 的转投链（主投加两级备选），用 `feasible()` 剪掉不可行的。
2. 给每条链打分：`EV = Σₖ Πⱼ<ₖ(1−pⱼ)·pₖ·U(tierₖ)·δ^月数ₖ − Σ代价`。
   - **代价包括：**
     - 撤稿代价；
     - 投稿费（IJCAI 2026 非 primary 论文每篇 $100）；
     - 现场参会规则带来的风险（NeurIPS 2026、ICRA）；
     - 签证提前量。
   - **pₖ 的取法：**
     - 还没审稿时用官方录用率。
     - **被拒后的下一站不直接用官方录用率**，而是按上一轮的评审信息下调。下调系数是一个公开、可调的假设，界面上显示它对结果的影响。不这样做，引擎会过度推荐撤稿转投。
   - 对 p、U、δ 各取低/中/高值分别计算，输出一个区间。
3. **整个组合的约束。** 按论文优先级贪心分配，违反约束时把边际 EV 最低的论文挪到次优链（local repair）。约束都带年份：
   - 投稿上限：ICLR 2027 20 篇；CVPR 2026 25 篇；AAAI-27 10 篇；IJCAI 2026 8 篇；KDD 2027 每轮 7 篇；ARR 从 2026 年 10 月轮起每轮 20 篇、其中一作最多 5 篇。
   - ICLR 2027：每位作者最多参与 1 篇"没有合格互审作者"的论文。
   - 审稿负担：ICLR 投 3 篇及以上要审 6 篇；ICML 投 4 篇及以上必须当审稿人；ICML 和 ARR 每位审稿人最多覆盖 2 篇。
   - 同时进行的 rebuttal 数量不超过上限。
   - 投稿数宁可多算。
4. **生成任务：**
   - 预注册摘要。
   - 备选会议的撤回任务：如果主投会议录用了，要在备选会议正文截止前撤回摘要。ICLR 要在 9/25 前撤，过了截止再撤，论文会公开并显示作者姓名。
   - 审稿任务：配额、截止日、审稿端的 LLM 规则。审稿失职可能导致自己的论文被 desk reject（CVPR 2026、NeurIPS 2026、ICML 2026 都有这类规定）。
   - 决策时刻。
   - 最后可用的出口日期（last useful exit）。
5. **什么时候重跑：** 收到审稿、出结果、数据 bundle 的哈希变了、会议等级变了。

**输出：**
- 每篇论文一条主链加上备选链。
- 一张任务清单，时间同时显示会议时区和北京时间。
- 每位作者的上限仪表、冲突清单。
- 一个只在浏览器里生成的个人 .ics 日历。

### 4.2 审稿后决策（advisor）

**输入：**
- 这次投稿当前所处的阶段。
- 初评（pre-rebuttal）分数和 confidence，意见原文只存在本地。
- StatsBand、policy，以及转投图。

**按公开数据的多少分三档：**

| 档 | 会议 | 输出 |
|---|---|---|
| T1 | ICLR（所有投稿分数公开） | 先换算成当年分位数，再给近 3 年同分位段的录用率区间 |
| T2 | NeurIPS、ICML（被拒论文要作者选择才公开；NeurIPS 2025 只有 400 篇 Reject，对比 5,812 篇录用） | 只给"在已录用论文中排第几分位"，不给概率 |
| T3 | AAAI、IJCAI、CVPR、ICRA/IROS、ARR（分数不公开） | 官方录用率加规则卡片，不给概率 |

T3 规则卡片的例子：
- **ARR**：总评 4 对应主会，3 对应 Findings，2 表示建议下一轮再投。meta 分 1.5 不能投下一轮，1 永远不能再投。
- **IJCAI**：官方 FAQ 说，四个 reject 很难靠 rebuttal 翻盘。
- **CoRL**：没有一个分数达到 weak accept，可能在 rebuttal 之前就被拒。

**如实交代数据的局限：**
- **分段表建在终评分数上。** paperlists 只有终评（post-rebuttal）分数，调研里的分段表和 AUC 0.944 都是用终评分数算的。拿它回答"一轮分数出来后怎么办"，会把 rebuttal 的结果提前泄漏进预测。所以 MVP 的 ICLR 分段表标注为"基于终评分数"，并加宽区间。
- **从 ICLR 2027 开始自己攒初评数据。**
  - 匿名调用 OpenReview API 已经返回 403 ChallengeRequiredError，所以由维护者用自己的账号抓取，遵守 ToS 并限速。
  - 在 11/5（初评）和 11/18（讨论结束）各抓一次公开分数，只发布汇总值。
  - 这份数据同时给出当年的完整分布，可以用来算当年分位数。在那之前，用"按排名映射到往年"兜底，并给录用率本身加一个先验。
- **ICLR 2026 单独建模，作为一个独立的 regime。** 那一年分数刻度变了，分数被重置到 rebuttal 前，AC 全部重新分配。50% 录用线从 5.81 降到 4.91，是这三件事混在一起的结果，换算成分位数也消不掉。
- **不跨年套用原始分数阈值。** 用 2025 年的原始分数去拟合 2026 年，预测录用率 14.1%，实际是 38.8%。
- **区间要把这些波动算进去：**
  - rebuttal 期间的改分（ICLR 2025 有 54.8% 的论文改过分）；
  - 委员会噪声（NeurIPS 2021 实验中，两个委员会对 23% 的论文结论不同）；
  - 主题效应（同样的分数，录用概率在不同主题间最多差 8 倍）。

  每个数字旁边都显示留一年回测误差。

**决策规则：**
- `EV(留下) = p·U + (1−p)·δ^Δ·V(出结果日)`
- `EV(撤稿转 X) = V(今天, 从 X 出发) − 撤稿代价`
- 在 p、U、δ 的低/中/高组合上都算一遍。只有某个选项在所有组合下都胜出，才推荐它；否则判为"势均力敌"，并指出哪个截止日会决定结果。
- **ICLR 要特别处理：** 被拒的论文也会在通知后公开并显示作者姓名，所以"撤稿后公开"不是撤稿独有的代价，差别只在公开的时间早晚。两种情况下，下一站的审稿人都可能看到 ICLR 的公开审稿。

**会单独提示的情况：**
- 审稿人分歧大，例如一个人给 2 分、其他人给 8 分。
- confidence 低的审稿。
- 在本地把意见分成"rebuttal 能修复的"和"根本性问题"。

**输出卡片：**
- 建议，或者"势均力敌"。
- 概率区间加上历史回测误差，并注明数据档位。
- last useful exit。例如投 AAAI-27 进了 Phase 2：最后可用的出口在 10/19–25 feedback 窗口之后，那时距 CVPR 截止还有 22 天。
- 撤稿后果（引用官方原文）。
- 改投清单。
- "仅供参考"标注。

### 4.3 政策变更（policy watcher）

**监听哪些来源：**
- 页面 URL 模板：`/Conferences/{Y,Y+1}/{CallForPapers|AuthorGuide|AuthorGuidelines|Dates|Pricing}`，同时处理页面改名（例如 ICLR 2026 用 AuthorGuide，2027 改成 AuthorGuidelines）。
- 博客 RSS：`blog.iclr.cc/feed/`、`blog.neurips.cc/feed/`、`blog.icml.cc/feed/`。
- `acl-org/aclrollingreview` 仓库的提交记录。
- AAAI、IJCAI、KDD、ICRA、IROS、CoRL、RSS 的征稿页面。
- CCF 和 CORE 的等级名单。等级变化也算政策事件，因为它会改变 U(tier)。

**抓取频率：**
- RSS 和 ARR 提交记录：每天一次。
- 征稿和作者指南页面：平时每周一次，截止前 30 天内改为每天一次。
- 会议的 X 账号只作为线索，只能开 issue。

**处理流程：**
1. 抓取页面，需要 JavaScript 渲染的用 Playwright，然后转成规范化文本快照，存到 orphan 分支 `snapshots`。
2. 每个页面按章节和上次快照比、也和去年同一页面比。会议很少标出哪些是新规定，例如 ICLR 2027 的指南没有注明 20 篇上限是新加的。
3. 这些都算事件：页面从 404 变成可访问（CVPR 2027 的 AuthorGuidelines 今天还是 404）、URL 改名、博客新帖。
4. 用正则提取数字类字段（上限、页数、审稿配额、日期），并单独高亮范围词。例如 AAAI 把 "including" 改成 "excluding"，一个词就改变了上限覆盖哪些 track。
5. v1 起加 LLM：给每段变化打类别标签，并生成带逐字引文的 YAML 补丁。
6. **CI 先检查补丁里的引文确实逐字出现在快照里**，再交给人工审核，然后开 `policy-change` PR，人工合并。
7. 二手来源（例如 AI Weekly）只能开"待核实"的 issue，不能直接提补丁。
8. 用 LLM 的任务只在主仓库里定时运行，设预算上限。来自 fork 的 PR 只跑 schema 校验、引文校验和级联测试，不需要任何密钥。
9. 新一年的政策页面还没出来时，先继承上一年的政策，标 `inherited_from: 2026, verified: false`。

**客户端如何响应变更：** 比较新旧 bundle 的哈希，只看和用户计划相关的字段。

| 变化的字段 | 客户端动作 |
|---|---|
| `author_cap` / `first_author_cap` | 重新统计整个组合的投稿数，把超限的论文标红 |
| 互审资格和名额 | 用本地发表记录逐篇重新计算 |
| `page_limit`、模板、必需章节 | 生成改稿任务 |
| `llm_authors` | 加入检查清单，并起草 AI-use 声明 |
| 时间节点、双投窗口、edges | 重建转投图 |
| `withdraw_penalty` / 重投限制 | 更新 advisor 里的撤稿代价 |
| 到场要求 | 发出行和签证提醒 |
| 等级 | 更新 U，重新给计划打分 |

变更结果进入 Policy inbox，按 blocking、plan-change、FYI 分级，附官方链接，**用户确认后才生效**。示例："ICLR 2027 把新人豁免收窄为每人最多 1 篇无合格互审作者的论文。p-003 和 p-005 都没有合格互审作者，是否把 p-005 改投 CVPR 2027（11/16）？"

### 4.4 完整例子：p-007 在 ICLR 2027 被拒之后怎么走

**11/5，Review Round。** 假设 ICLR 2027 沿用 2026 年的刻度 {0,2,4,6,8,10}（2027 的刻度 UNVERIFIED）。p-007 的初评是 [6, 4, 4, 2]，其中给 2 分的审稿人 confidence 为 5。
- **advisor：** 属于 T1。区间很宽（以下是示意数字，不是真实计算：10–35%），标注"基于终评分数"，并提示审稿人分歧大。
- **比较两个选项：**
  - **留下 rebuttal**：讨论期 11/5–18，12/16 出结果。
  - **撤稿转 CVPR 2027**：CVPR 注册截止 11/10，正文截止 11/16。CVPR 2027 的投稿上限继承自 2026 年的 25 篇，只警告不阻断。
- **结论是"势均力敌"：** p 取下限时撤稿更好，取上限时留下更好。
- **决定日是 11/10。** 两边规则都没有明确允许"ICLR 审稿期间去 CVPR 注册"，所以默认按"11/10 前撤稿才能转 CVPR"处理。
- 卡片同时写明：留下来如果被拒，ICLR 的论文和审稿意见同样会公开，差别只在公开时间。

**12/16，被拒，下一站怎么选：**

| 去向 | 截止 | 间隔 | 状态 | 格式改动和规则 |
|---|---|---|---|---|
| ICML 2027 | 摘要约 1/16，正文约 1/22 | 31 / 37 天 | UNVERIFIED（只有第三方来源）；地点在南美 | 9 页改成 8 页（沿用 2026 规则，inherited）。每篇需要一位合格审稿人（2026 规则）；按规则计算，me 可能合格，coauthor-A 不合格。LLM Policy A/B。要写 lay summary。另有签证提醒 |
| IJCAI-27 | 约 1/19 | 约 34 天 | UNVERIFIED；CCF 第七版为 B | 7 + 2 页。2026 年有 8 篇上限，非 primary 论文每篇收 $100，2027 规则未公布 |
| ARR 2027 年 1 月轮（ACL 2027） | 待公布 | — | UNVERIFIED | 8 页，加 Limitations 一节，用 ACL 模板。每轮上限 20 篇、一作 5 篇。需要 ORCID |
| CVPR 2027 | 11/16 已过 | — | 不可行 | 只能在 11/5–11/16 期间撤稿转投 |

- **排期器的输出：** 默认推荐"ICML 2027 → NeurIPS 2027"这条链。如果用户把 IJCAI 的效用 U 调高，两条链就势均力敌。
- **下一站的 p：** 按 ICLR 的评审结果下调，并显示下调系数的影响。
- **改投清单：**
  - 逐条回应 ICLR 的公开审稿意见，因为下一站的审稿人可能会看到。
  - 9 页转 8 页。
  - 按 ICML 的规则重写 AI 使用说明。
  - 核对参考文献，扫描隐藏文字，每次 AI 修改前后存快照。

## 5. LLM 润色和转投助手

**功能：**
- 把审稿意见拆成去重后的问题清单，标上严重程度，并区分"rebuttal 能修复的"和"根本性问题"。
- 按 ARR 的风格逐条写出修改说明；ICRA↔IROS transfer 需要的 response file 也可以起草。
- **根据两个会议的 YAML 自动生成格式差异：**
  - ICLR 9 页 → ICML 8 页（2026 规则）
  - → IJCAI 或 AAAI 7 + 2 页
  - → CVPR 8 页 + 参考文献
  - → ICRA 8 页，**含**参考文献
  - → ARR 8 页，必须有 Limitations 一节
- **补上目标会议要求的部分：** ICLR 的 AI-use 一节、CVPR 2026 的 Compute Reporting Form、ARR 的 Responsible NLP checklist。

**合规边界（强制执行，不只是提醒）：**
1. **不上传用户的稿件和审稿。** 只用用户自己的 API key 或本地模型；任何上传之前都弹出警告；不做遥测。私有会议的审稿意见是保密的。
2. **按目标会议切换 LLM 模式**，由 `policy.llm_authors` 决定：
   - 投 AAAI-27 时只能润色已有文字，不能生成正文。
   - NeurIPS Position track 要求论文"substantially human-written"。大幅改写前要提醒：那一轮有 18.4% 的论文因 AI 检测被 desk reject。
3. **记录每一次 AI 修改。** App 自己做的 LLM 修改都会自动写进 AI-use 声明的草稿（ICLR 2027 要求披露）。每次修改前后都在本地存快照，可以作为 NeurIPS 要求的那种版本历史证据。
4. **投稿前核对：**
   - 用 DBLP、Crossref 和 arXiv 核对每一条参考文献。引用不存在的文献，在 CVPR 2026 会被拒；ICML 2026 会 desk reject 那篇论文。
   - 扫描 PDF 里的隐藏文字和白色文字。prompt injection 在 ICML 2026 会波及所有涉事作者的全部论文。
   - 用户粘贴进来的审稿文本也要扫描，检查里面有没有夹带的操纵性指令。
5. **不做的事：**
   - 不生成论文，不帮忙拆分发表。
   - 在本地比较自己各篇摘要的相似度，提醒近似重复的风险：AAAI-27 禁止 LLM 改写出的近似重复投稿，CVPR 禁止 20% 以上重叠。
   - 不替用户写审稿意见。如果用户同时在当审稿人，提醒 ICLR 2027 要求提交自己写的原始评估和全部 LLM 输入。

## 6. GitHub 仓库结构

```
NextVenue/
├── data/
│   ├── series/iclr.yml            # ranks(with edition), URL templates, discussion links
│   ├── editions/iclr/2027.yml     # cycles, milestones(tz), policy, fees, sources
│   ├── edges/                     # ARR commit, ICRA↔IROS transfer, conditions
│   ├── stats/iclr/2025.yml        # percentile band → rate (aggregates, score_source)
│   └── upstream/{ccfddl,hf}/      # daily mirror + NOTICE
├── schema/                        # edition/cycle/policy/portfolio JSON Schema
├── packages/
│   ├── core/                      # time, feasible, scheduler, advisor, policy-impact
│   │   └── test/golden/           # cascade regression tests
│   ├── revise/                    # format diff, ref check, hidden-text scan, prompts
│   └── cli/                       # nextvenue CLI
├── crawler/                       # watchlist.yml, fetch, diff, extract, label, pr-bot
├── stats/                         # offline Python, backtest reports
├── apps/web/                      # Astro site
├── .github/workflows/             # validate, sync-upstream, watch(scheduled), build, deploy
├── docs/                          # DATA_SOURCES, PRIVACY, MODERATION, CONTRIBUTING
├── CODEOWNERS                     # per-venue maintainers
└── LICENSE（AGPL-3.0）  DATA_LICENSE（CC BY-SA 4.0）  NOTICE
# snapshots live on orphan branch `snapshots`
```

## 7. 技术栈

- **pnpm monorepo + TypeScript。** `core` 只写一次，网页、CLI、CI 和将来的手机端共用。
- **数据用 YAML + JSON Schema。** CI 里用 `ajv-cli` 5.0.0 校验；ccfddl 现成的 `conference-yaml-schema.yml` 可以参考。
- **网站用 Astro 7.3.4 做静态站，部署在 GitHub Pages。**
  - PWA 直接用 `vite-plugin-pwa` 或手写 service worker，因为 `@vite-pwa/astro` 1.2.0 只声明支持到 Astro 5。
  - 应用变重以后，可以换 Next.js 16.3.6。
- **本地存储：** 先用 Dexie 4.4.6（基于 IndexedDB）。需要 SQL 时换 wa-sqlite 的 `OPFSCoopSyncVFS`，它不需要 COOP/COEP 头；GitHub Pages 能不能设这两个头还没核实。
- **日历用 `ical-generator` 11.1.1。** 各会议的公共订阅在 CI 里生成；个人 .ics 只在浏览器里生成，不经过服务器。
- **抓取和 agent：** Playwright 抓页面；更新 agent 参照 HF ai-deadlines 的做法，只能开 PR。
- **求解器：** v1 用贪心加局部搜索。性能不够时再引入 MIP（例如 HiGHS 的 WASM 构建），引入前先做基准测试。
- **统计：** Python 离线运行。先用 scikit-learn 做逻辑回归，之后升级到 PyMC 的分层贝叶斯模型。
- **讨论区用 Giscus（MIT）**，同时链接企业微信群和知乎。
- **后续：**
  - 手机端用 Capacitor 8.5.2 包装，加本地通知；
  - 同步用 Evolu 做端到端加密，或者只提供加密导出文件；
  - 微信小程序需要一个做过 ICP 备案的国内镜像。
- **许可：** 开源，代码 AGPL-3.0-or-later，自有数据 CC BY-SA 4.0，名称和图标不授权（2026-10-17 决定，取代 9/25 的闭源决定）；保留上游的 MIT 等声明，并在 App 里展示。

## 8. 路线图

**MVP：6 周，9/24 → 11/5 前发布。首发功能是"ICLR 审稿出来了：留下 rebuttal，还是转 CVPR"。**

| 周 | 交付 |
|---|---|
| 1 | 定 schema：cycle、每个节点自带时区、政策字段、双投窗口、结构化的撤稿代价、edges、inherited 标记。写好 importers。人工核对约 15 个会议：NeurIPS、ICLR、ICML、AAAI、IJCAI、CVPR、ECCV、WACV、ARR（ACL/EMNLP/NAACL/EACL）、COLM、KDD、ICRA、IROS、CoRL、RSS |
| 2 | Tracker：按 CCF/CORE/领域筛选；会议时区和北京时间两种倒计时；阶段时间线；公共 .ics；讨论区链接和 Giscus（只讨论日程和行程）；404→200 探针。注册费先留空，只附来源链接 |
| 3 | Portfolio：IndexedDB 存储、JSON/CSV 导入导出、看板、上限仪表（含合作者手填的其他投稿数）。`feasible()` 加上 golden tests 进 CI。CLI |
| 4 | 排期器 v1：枚举转投链加贪心修复。生成任务，包括备选摘要的撤回任务和审稿任务。个人 .ics |
| 5 | advisor v0：T1 分段表（标注"基于终评分数"）、T2、T3 规则卡片；稳健决策规则；输出卡片 |
| 6 | watcher v0：快照、diff、正则、自动开 issue，暂不用 LLM。补齐 docs、CODEOWNERS 和 "good first data PR" 入门任务。发布后在 11/5 和 11/18 抓取 ICLR 2027 分数快照 |

**v1（第 2–3 个月，赶在 1 月 ICML 和 IJCAI 截止之前）：**
- LLM 给政策 diff 分类，加上引文校验 CI；Policy inbox；用户确认后重新排期。
- 润色和转投助手。
- 注册费：写爬虫抓 `/Conferences/{Y}/Pricing`，其他会议人工录入。
- Person 的发表记录，加上用 DBLP dump 做的离线查询（不实时联网查，免得暴露作者名单）。
- 完整支持多轮会议：ARR、KDD、WACV。
- PWA 通知：截止前 14/7/3/1 天，摘要截止优先提醒，另有决策时刻提醒。
- 用 ICLR 2027 的初评和终评数据训练两阶段模型 v0，加一个留一年交叉验证的校准看板。

**v2（第 4–6 个月以后）：**
- Capacitor 手机 App、微信小程序加 ICP 备案的国内镜像、Evolu 端到端同步。
- 课题组模式：在全组范围内统计每位作者的投稿上限。
- 用户经同意后自愿贡献初评分数，并校正自报分数偏高的问题。
- 带主题效应的分层贝叶斯模型。
- NeurIPS 和 ICML 的已录用分位。

## 9. 风险与对策

| 风险 | 对策 |
|---|---|
| 各 tracker 互相转抄，二手来源常出错 | 每个字段带来源、抓取时间和 verified；二手来源只能开 issue；来源冲突时自动开 issue；未核实的内容标 UNVERIFIED；每个会议显示 last checked 时间 |
| 漏掉政策变更 | 多渠道监听；截止前提高抓取频率；跟去年页面比；404→200 告警；URL 改名处理；社区报告 |
| LLM 抽取出错或编造引文 | CI 校验引文逐字出现在快照里；人工合并；客户端要用户确认后才重新排期 |
| 预测过于自信、用户因此承担后果 | 只给区间；分三档，没有数据就不给概率；公布回测误差；各页标明"仅供参考"；ICLR 2026 单独建模 |
| 用终评分数回答初评问题 | 标注出来并加宽区间；自己抓取 ICLR 2027 的初评快照；做两阶段模型 |
| 数据许可和访问限制：paperlists、sec/sys-deadlines 没有 LICENSE；ARR-DC 只能非商业使用；OpenReview API 需要账号 | 只发布汇总值，先征得维护者同意；原始数据只放链接；用 DATA_SOURCES.md 登记每个来源的许可 |
| 审稿保密和双盲 | 本地优先，不做遥测，LLM 用用户自己的 key；bundle 整体下载；讨论区出结果前只谈日程和行程，禁止贴审稿意见、禁止"正在投 X"一类的帖子 |
| 被当成批量投稿的工具 | 投稿上限按人计算、宁可多算；检测近似重复；不帮拆分论文 |
| 维护者精力不够 | 自动化 agent 起草 PR；每个会议通过 CODEOWNERS 找人认领；把修正回馈给 ccfddl 和 HF |
| 国内访问 GitHub 困难（UNVERIFIED） | 提供国内镜像；讨论区同时链接企业微信群和知乎；iCal 订阅 |

## 10. 首批要写进数据的政策事实

### 10.1 ICLR 2027 和 2026 相比改了什么

| 项目 | 2026 | 2027 |
|---|---|---|
| 每位作者的投稿上限 | 无 | 每人最多 20 篇。9/18 摘要截止时标记超限作者；到 9/25 正文截止仍超限，多出的论文随机 desk reject |
| 没有合格互审作者的论文 | 新人豁免 | 每位作者最多参与 1 篇（新人仍然可以有 1 篇）。原因：2026 年约 20% 的论文没有审稿人 |
| 谁算合格的互审作者 | 在 ICLR/NeurIPS/ICML 或同等期刊有过录用 | 名单扩到 UAI、AISTATS、JMLR、TMLR、ACL、CVPR、AAAI、IJCAI、KDD、COLT 等 |
| 作者披露 AI 使用 | 只有 LLM 起"重要作用"时才要披露 | 每篇论文必须有 AI-use 一节（不计页数），投稿表单也有相关问题；用 AI 帮忙证明、设计实验、生成数据都要披露 |
| 审稿人使用 LLM | 低质量或编造内容的审稿可能受罚 | 必须提交自己写的原始评估和全部 LLM 输入，两者差距大视为 misrepresentation；处罚可以包括 desk reject 其本人的全部论文，或禁止以后投稿 |
| 时间线 | 1/22 出结果 | 11/5 出审稿，11/5–18 讨论，12/16 出结果；会议在旧金山，4/26–30 |

来源：[blog 2026-09-02](https://blog.iclr.cc/2026/09/02/submission-policies-for-iclr-2027/)、[2027 AuthorGuidelines](https://iclr.cc/Conferences/2027/AuthorGuidelines)、[2026 AuthorGuide](https://iclr.cc/Conferences/2026/AuthorGuide)、[AIPolicyForAuthors](https://iclr.cc/Conferences/2027/AIPolicyForAuthors)、[AIPolicyForReviewers](https://iclr.cc/Conferences/2027/AIPolicyForReviewers)、[CFP](https://iclr.cc/Conferences/2027/CallForPapers)

**不是 2027 年的新规（2026 年已经有）：**
- 投稿 9 页，之后 10 页。
- 投 3 篇及以上要审 6 篇。
- 每篇论文要有一位作者审 3 篇。
- 截止后撤稿的论文保持公开，并立即显示作者姓名。
- 所有论文（包括被拒的）在通知后都显示作者姓名。

**其他说明：**
- 2027 年的分数刻度没有公布（UNVERIFIED）。
- 勘误：AI Weekly 把日期写成 10/29 和 12/9，并说"3 篇以上审 6 篇"是新规，两处都不对。

### 10.2 其他会议

| 会议 | 要写进数据的规则 | 来源 |
|---|---|---|
| ICML 2026 | 每篇论文指定一位合格审稿人，一人最多覆盖 2 篇；投 4 篇及以上必须审稿。审稿用 LLM 分 Policy A（禁止）和 B（有限使用）；因审稿违规 desk reject 了 497 篇。prompt injection 和串通会波及涉事作者的全部论文。要写 lay summary | [CFP](https://icml.cc/Conferences/2026/CallForPapers)、[LLM-Policy](https://icml.cc/Conferences/2026/LLM-Policy)、[blog](https://blog.icml.cc/2026/03/18/on-violations-of-llm-review-policies/) |
| NeurIPS 2026 | 主会场悉尼（12/6–12），另有亚特兰大和巴黎两个卫星会场；至少一位作者现场注册。禁止 prompt injection。Position track 要求"substantially human-written"，有 18.4% 被 desk reject。被拒论文要作者选择才公开 | [handbook](https://neurips.cc/Conferences/2026/MainTrackHandbook)、[blog](https://blog.neurips.cc/2026/06/02/ai-generated-papers-in-the-neurips-2026-position-paper-track/) |
| CVPR 2026 / 2027 | 2026：上限 25 篇；隐藏 prompt 导致 desk reject；引用不存在的文献导致被拒；审稿失职可能导致自己的论文被 desk reject；要填 Compute Reporting Form。2027：注册截止 11/10，正文截止 11/16，双投窗口 11/16–2/22；AuthorGuidelines 页面今天还是 404 | [2026 guide](https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines)、[2027 CFP](https://cvpr.thecvf.com/Conferences/2027/CallForPapers) |
| AAAI-27 | 上限仍是 10 篇，但 AI Alignment 和 AI for Social Impact 两个 track 从"计入"改为"不计入"。禁止 prompt injection 和 LLM 改写的近似重复投稿。7 + 2 页。只允许润色，不允许 LLM 生成正文 | [instructions](https://aaai.org/conference/aaai/aaai-27/submission-instructions/)、[policies](https://aaai.org/conference/aaai/aaai-27/policies-for-aaai-27-authors/) |
| IJCAI-ECAI 2026 | 上限 8 篇；非 primary 论文每篇 $100；Phase 1 的 summary reject 没有 rebuttal | [PPI](https://2026.ijcai.org/primary-paper-initiative/)、[CFP](https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/) |
| ARR | 从 2026 年 10 月轮起：每人每轮最多 20 篇，其中一作最多 5 篇；每篇需要一位合格的 service contributor（一人最多 2 篇），没有的进入抽签；需要 ORCID。截止 48 小时后撤稿，下一轮不能再投（2026 年 5 月那一轮豁免）。meta 分 1.5 不能投下一轮，1 永远不能再投 | [policy](https://aclrollingreview.org/sustainable-reviewing-2026)、[cfp](https://aclrollingreview.org/cfp)、[dates](https://aclrollingreview.org/dates) |
| KDD 2027 | 每轮最多 7 篇；看过审稿意见后撤稿，要等 12 个月才能再投；第一轮被拒的论文不能投 2 月那一轮 | [CFP](https://kdd2027.kdd.org/research-track-call-for-papers/)、[FAQ](https://kdd2027.kdd.org/frequently-asked-questions/) |
| ICRA 2027 / IROS 2026 | ICRA：截止 9/16，按 PST（延期后）；8 页含参考文献，不能加页；必须现场参会。IROS：8 页；取消 RA-L+IROS 选项；新增 ICRA→IROS transfer，需要 response file | [ICRA](https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/)、[IROS](https://2026.ieee-iros.org/contribute/call-for-papers/) |
| CoRL 2026 | 投 3 篇及以上必须审稿；没有合格作者的论文 desk reject；假引用 desk reject；时间线和别的会重叠时，需事先获 Publication Chair 批准 | [instructions](https://www.corl.org/contributions/instruction-for-authors) |
| CCF 第七版（2026-03-31） | ICLR 进 A，IJCAI 从 A 降到 B。这是第三方网站的转述，以 CCF 官方 PDF 为准 | [ccf.atom.im](https://ccf.atom.im/) |

**数据访问方面：**
- 匿名调用 OpenReview API 返回 403（[docs](https://docs.openreview.net/getting-started/using-the-api)）。
- papercopilot/paperlists 没有 LICENSE（[repo](https://github.com/papercopilot/paperlists)）。
## 11. 提醒与日历

### 11.1 两条通道：日历只放事实，提醒走 App 自己的通道

- **ICS 订阅（公共和个人）只放事实：**
  - 每个事件用稳定的 UID，内容一改就把 SEQUENCE 加 1。
  - 写上 `REFRESH-INTERVAL` 和 `X-PUBLISHED-TTL`。
- **提醒不依赖 ICS 里的 VALARM。** 原因有两个：Google Calendar 通过 URL 订阅 ICS 时，更新可能晚一天才同步；订阅源里设的 VALARM，Google 用户也收不到。例如 ICRA 2027 截止延期 24 小时，订阅用户可能第二天才看到。
  - 提醒改走 App 能控制的通道：PWA 推送、邮件、企业微信或 Telegram。
  - 用户授权后，也可以通过 Google Calendar 或 CalDAV API，给每个事件单独写入提醒。
- **紧急变更直接推送**，不等订阅刷新。包括截止延期和新规则。

### 11.2 分级，避免提醒太多

| 级别 | 内容 | 节奏 | 发给谁 |
|---|---|---|---|
| 硬义务 | 错过会导致 desk reject 或论文被撤：摘要/作者冻结、正文、合作者资料、审稿义务、作者注册 | T-14/7/3/1 天和 T-6 小时，逐级升级 | 只发给该事项的负责人 |
| 计划变更 | 政策变化影响到自己的论文、撞车预警、决策日 | 发生时 | 论文的所有作者 |
| FYI | 新 CFP、与自己无关的政策变化 | 每周一次摘要 | 订阅者 |

- 安静时段按用户所在时区计算。
- 点"已完成"后，所有设备上的这一串提醒都停止（参考 RFC 9074 的 ACKNOWLEDGED）。
- 可以单独静音某篇论文或某个会议。

### 11.3 一个动作生成一串事件（按会议的模板）

- **"已投 ICLR 2027"**生成约 10 个事件：
  - 9/18 摘要截止，同时冻结作者名单；9/25 正文截止。
  - 10/1–21 审稿义务。
  - 11/5 出审稿；11/5–18 讨论期；12/16 出结果。
  - 2027-03-17 签证退款截止（以签证申请日期为准）。
- **"已录用 NeurIPS 2026"**生成录用后清单：
  - 9/30 选会场，10/6 申请资助，10/30 早鸟注册截止，11/4 退款截止，12/6 开会。
  - 还没公布日期的事项标"待公布，去年是 X"，官网一更新就自动补上。

### 11.4 规则类提醒（现有 tracker 都没有）

| 提醒 | 规则 |
|---|---|
| 备份摘要（hedge abstract） | 当前会议出结果的日子，晚于下一站的摘要截止时（例如 NeurIPS/AAAI Phase-1 在 9/24，ICLR 摘要截止在 9/18），提前 3 天提醒"要不要先注册 ICLR 摘要"，并附上官方关于占位摘要的规定 |
| 作者名单冻结 | 冻结前 48 小时提醒"作者名单定了吗" |
| 合作者 OpenReview 资料 | T-21 天提醒资料不全的合作者，T-14 天标红（非机构邮箱审核最长要 2 周） |
| 撞车预警 | 提前 4–6 周预告本人各项事务的重叠。例如 11/5–18 ICLR 讨论期、11/10 CVPR 注册、11/16 CVPR 正文、11/24–30 ARR response、11/30 AAAI 出结果 |
| 签证和因公出国审批 | 从开会日期倒推，按中国法定节假日和调休计算工作日。例如某些学校要求提前 40 个工作日申请，NeurIPS 悉尼会场（12/6）往回推是 10/12，扣掉中秋和国庆，9/24 出结果后只剩 7 个工作日 |
| 毕业和评奖统计截止 | 用户填入本校规则（需要几篇、哪一类、统计截止日、认录用还是认发表），倒推每篇论文"最晚录用日" |
| opt-in 窗口 | 例如 NeurIPS 被拒论文 2 周内选择是否公开（今年约到 10/8） |
| 投稿前核查 | T-5 天提醒核对参考文献、准备 AI-use 声明 |

### 11.5 邮件兜底

用邮件过滤规则（Gmail 或 IMAP）盯住 OpenReview、CMT、PaperCept、ARR 发来的邮件，同时轮询 OpenReview API。这样即使系统邮件进了垃圾箱，状态变化也会触发提醒。

## 12. 接入 Jev（TypeSafe AI）做快速判断

**Jev 是什么。** TypeSafe AI 在 2026-09-15 发布的 "System One" 模型，目前还在 early access。
- 它不生成文字。输入是当前状态（state）和几道带固定选项的题，输出所选的选项和概率。
- 题型有三种：Choice（单选）、Score（按等级打分）、Noul（判断一句话为真的概率）。
- 官方称每次调用 70–500 ms。SDK 为 MIT 许可：Python 包 `typesafe-sdk`，npm 包 `@typesafe-ai/sdk`。npm 上不带作用域的 `typesafe-sdk` 不是官方的。

**适合交给 Jev 的事（快速分诊）：**
1. **政策 diff 分类。** 代码先算出页面改了哪一段，Jev 再判断两件事：这段是否影响作者（Noul），属于哪一类规则（Choice）。
2. **审稿意见归类。** 分出"rebuttal 能修复的"和"根本性问题"，判断一周内能改掉多少（Score）。概率仍由 4.2 的统计模型给。
3. **选下一站。** 代码先过滤出可行的会议（日期、页数、双投规则都满足），Jev 只在这些会议里按主题匹配度选。
4. **邮件分类。** 判断一封邮件是否宣布了截止变更；如果是，就重新抓官网。

**不能交给 Jev 的事：**
- 日期比较、间隔计算、窗口判断和计数。TypeSafe 自己的文档说 Jev 1.13 做这些不可靠，所以截止、时区、页数和投稿上限全部用普通代码算。
- 从页面里抽取字段。Jev 只会选择和打分，抽取交给带 schema 校验的普通 LLM 加日期解析器。
- 录用概率。Jev 的置信度只表示它对自己的答案有多确定，和录用率无关。
- 另外两点要注意：
  - 抓来的网页属于不可信输入，有 prompt injection 风险，只把变化的那一段喂给它。
  - 撤稿这类不可逆的动作，永远要用户确认。
- 门槛参照官方建议：置信度高于 0.9 才自动执行，0.5–0.9 之间给提示，低于 0.5 交给人。

**接口设计。** 放在 `packages/decide` 里，定义一个统一接口，后端可以替换：
- Jev（需要 TypeSafe 的 key）
- `system-one-adapter`（用户自带主流 LLM 服务商的 key）
- kev 或 SemIf（本地运行）

开源版不能只依赖一个闭源、还在 early access 的 API。
