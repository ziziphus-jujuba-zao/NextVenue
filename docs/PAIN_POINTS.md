# NextVenue 痛点与功能 Backlog（2026-09-24）

这份 backlog 来自 2026-09-24 多位研究者收集的 117 条 AI/ML/NLP/CV/robotics 会议投稿者痛点，去重合并后剩 59 条。条目按投稿生命周期分成 8 个阶段，每个阶段内按严重度（1–5）从高到低排列。
每条写明问题、例子、后果、对应的 app 功能（提醒 / 日历事件 / 检查 / planner 规则）和来源。例子里的日期、数字和会议都照录原始数据，没有补充新事实。

阶段：[投稿前](#投稿前)（9）· [提交](#提交)（9）· [审稿与rebuttal](#审稿与rebuttal)（6）· [出结果与转投](#出结果与转投)（6）· [camera-ready](#camera-ready)（6）· [注册与出行](#注册与出行)（8）· [开会](#开会)（2）· [贯穿全程](#贯穿全程)（13）

## Top 10（按严重度）

严重度同为 5 时，按原始记录里独立评为 5 分的条数排序。

| # | 标题 | 阶段 | 功能 |
|---|---|---|---|
| 25 | 出结果时下一个会的摘要已截止，要提前注册对冲摘要 | 出结果与转投 | planner 规则：“摘要截止 − 出结果日”为负时，摘要截止前 ≥3 天生成“对冲决定”事件 |
| 19 | 审稿义务连坐：审稿失职导致自己的论文被 desk reject | 审稿与rebuttal | 审稿义务日历层，按合作者跟踪进度，T-7/T-3/T-1 提醒，lockout 风险警报 |
| 12 | ARR 服务贡献者新规：48 小时内注册，没有贡献者进抽签 | 提交 | 投稿后 T+1h/T+24h/T+44h 注册倒计时，每人 ≤2 篇容量检查 |
| 47 | 一稿多投锁定期决定哪些后续截止够得着 | 贯穿全程 | 每篇论文的锁定区间 + what-if 视图，同一篇论文锁定期重叠的计划直接拒绝 |
| 37 | 签证周期长于“录用到开会”，邀请函要先付注册费 | 注册与出行 | 按护照和目的地倒推 apply-by / letter-by，拒签退款截止做成日历事件 |
| 1 | 合作者 OpenReview 资料不全，新账号审核最长两周 | 投稿前 | 通过 OpenReview API 审计合作者资料，T-21 提醒、T-14 标红、T-3 点名 |
| 26 | 撤稿还是留下：讨论期中途就要决定，ICLR 撤稿永久公开 | 出结果与转投 | 审稿发布时弹出决策卡，按目标会计算 withdraw-by 日期 |
| 14 | 幻觉引用和未披露的 LLM 使用直接 desk reject | 提交 | 引用核查器（DBLP/Crossref/Semantic Scholar/arXiv），T-5 提醒 |
| 13 | 各会必填小节、清单、匿名要求不同，转投时最容易漏 | 提交 | 按会议的 preflight linter + “A 会 → B 会”差异清单，T-3 事件 |
| 48 | 一次投稿背后是一整条义务链，需要会议全周期模板 | 贯穿全程 | 一条“已投 X”自动展开成约 10 个日历事件，AAAI 这类会用两阶段状态机 |

---

## 投稿前

### 1. 合作者 OpenReview 资料不全，新账号审核最长两周 · 严重度 5

- **问题**：任何一位合作者没有活跃、完整的 OpenReview 资料，整篇论文都会被 desk reject。用 gmail、qq、163 这类非机构邮箱注册要人工审核，最长两周，QQ、163 邮箱还常收不到验证邮件。CVPR 和 ARR 另外要求 DBLP 链接、履历、冲突和导师关系、ORCID。最容易出问题的是本科生、访问学生和企业合作者。机器人类会议用 PaperCept/PaperPlaza，要按署名顺序录入每位合作者的 PIN。一个人的论文还可能分散在 OpenReview、PaperCept/PaperPlaza、CMT、EasyChair、Softconf、ACM TAPS、IEEE eCF 里，每个系统有自己的账号、PIN 或 ID、冲突列表和邮箱，没有一个地方能看到所有论文的当前状态。
- **例子**：
  - NeurIPS："unable to make any exception for submissions from accounts initiated less than two weeks prior to the deadline"。NeurIPS 还要求把导师/学生关系和近 3 年的合作者都声明为冲突。
  - ICLR 2027 在全文截止时 desk reject 缺作者资料的论文，"incorrect profile information" 也是 desk reject 理由。
  - CVPR 2026 要求资料满足 8 项（DBLP、Google Scholar 和 Semantic Scholar 链接，履历，导师与冲突，专长，论文），"Incomplete author registration will result in desk rejection"。CVPR 2027 论文登记截止 11/10 AoE，所以没有机构邮箱的合作者最晚约 10/27 就要建好账号，才能留出两周审核。
  - ARR：缺 ORCID、affiliation、COI 会 desk reject，affiliation 历史、career status、邮箱、DBLP 和 ACL Anthology 链接也必须准确。
  - IEEE RAS PaperCept："Enter ALL authors through their RAS PIN"；PIN 向导写明 "a Personal Identification Number (PIN) is needed for each author."
- **后果**：一位合作者的账号问题就能让整篇论文被 desk reject，或者这位合作者加不进作者名单。另外，不常登录的投稿系统里有状态变化，也没人会发现。
- **功能**：
  - 检查：每篇论文维护合作者名单，从 OpenReview public API 拉取每人的状态：账号是否存在、是否活跃、是否机构邮箱、有没有 DBLP、冲突是否已填、8 项是否齐全。
  - 提醒：在最早的门槛（摘要或论文登记截止）前 T-21 天（3–4 周，留出审核时间）提醒还没有活跃资料的人，T-14 天标红，T-3 天发 hard alert，点名仍未完成的合作者。
  - 每位合作者存一份身份记录（OpenReview ID、PaperCept PIN、ORCID、DBLP、CMT 邮箱），用来预填各会的清单。另做一个统一状态面板，轮询或导入各投稿系统的状态。
- **来源**：https://neurips.cc/Conferences/2026/MainTrackHandbook ，https://cvpr.thecvf.com/Conferences/2026/CompleteYourORProfile ，https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines ，https://www.ieee-ras.org/publications/t-rl/papercept-submission-procedures/

### 2. 每人投稿数有上限，按全组合计，导师超额会连累学生 · 严重度 5

- **问题**：投稿上限算在每位作者身上，跨所有投稿累计。学生自己只有 1 篇，也可能因为导师或资深合作者超额被 desk reject，而组里没人能看到每个人的总数。一些会新增规则，限制“没有合格审稿人作者”的论文篇数，资格认定的截止日还可能早于某个大会的出结果日。有的会对非主要论文另外收费，缴费截止单独设。2025 年一项公平性分析指出，一篇论文作者超过 3 人时，按上限砍掉超额论文必然伤及无辜合作者，受连累的多是合作者多的低年资作者（以 CVPR 2025 为例）。
- **例子**：
  - ICLR 2027：每人最多 20 篇。摘要期会标记超额；到 2026/9/25 全文截止仍超额，超出部分随机 desk reject。每位作者最多只能有 1 篇“没有任何作者是合格 reciprocal reviewer”的论文（ICLR 2026 约 20% 的投稿没有这样的作者）。资格只算 9/18 摘要截止前已录用的论文，所以 2026/9/24 才首次中 NeurIPS 的学生团队，对 ICLR 2027 来说仍“不合格”，只能投 1 篇。
  - CVPR 2026：25 篇，超出部分 desk reject。AAAI-27：10 篇。KDD 2027：每周期 7 篇，第 8 篇起 desk reject。ARR（2026 年 10 月起）：每人每周期 20 篇，一作或共同一作最多 5 篇。
  - IJCAI-ECAI 2026：每人最多 8 篇，包括 Survey 在内的所有 track 合计；每篇非主要论文收 USD 100，须在 2026/1/26 前缴清（全文截止是 1/19）。
- **后果**：没有问题的论文被随机或按投稿顺序 desk reject，而且事先很难知道是哪位合作者超了额。非主要论文费没缴，论文不送审。
- **功能**：
  - 检查：课题组共用一张“作者 × 会议”计数表，按 OpenReview ID 统计，可手动录入或读取 OpenReview 已登记的数据；ARR 另外统计一作篇数。
  - planner 规则：某人用到 80% 或 cap−2 时提醒导师和相关学生；超过上限就拒绝排入计划，列出会受影响的论文，建议把其中一篇挪到别的会，由 PI 定优先顺序。
  - 检查：资格检查器按各会的资格截止日判断论文有没有合格审稿人，并校验 ICLR 的“只能有 1 篇”规则。
  - 提醒：“缴纳非主要论文费”任务，带独立截止日。
- **来源**：https://blog.iclr.cc/2026/09/02/submission-policies-for-iclr-2027/ ，https://arxiv.org/abs/2502.00690 ，https://iclr.cc/Conferences/2027/AuthorGuidelines

### 3. 利益冲突声明会被审计，不完整或不准确都会 desk reject · 严重度 4

- **问题**：资料完整之外，每位作者还要声明域名冲突和个人冲突（导师、近期合作者、实习单位、前单位）。会议分配审稿人之后会核查这些声明。实习过或换过组的学生，以及没人提醒的中间作者，冲突列表常常过时，而问题要到投稿几周后才暴露。
- **例子**：CVPR 2026 Author Guidelines 把 "incomplete/inaccurate conflict declarations" 列为 desk reject 原因。冲突要随资料在 2025 年 11 月的登记截止前填好，AC 在分配审稿人后检查异常。CVPR 2027 预计在 2026 年 11 月沿用类似的时间表。
- **后果**：论文已经占掉一个投稿名额才被 desk reject，这时可能已经赶不上别的会了。
- **功能**：检查：冲突审计器拉取每位合作者近 3 年的 DBLP 合作者和单位历史，和他们 OpenReview 里的冲突列表比对。提醒：摘要或登记截止前 7 天，给每位合作者单独发“修正冲突”提醒。
- **来源**：https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines

### 4. 专利要在首次公开前申请，有的会投稿当天就公开 · 严重度 4

- **问题**：业界研究者和有专利指标的高校组，必须在任何公开之前申请专利，包括挂 arXiv、做报告，以及投到会自己公开投稿的会议。《专利法》第 24 条的 6 个月宽限期只适用于政府主办或承认的展览和“规定的”学术会议，所以在 NeurIPS、ICLR、CVPR 或 arXiv 上公开，一般会破坏新颖性。ICLR 在审稿期间就公开投稿，所以公开日是论文截止日，而不是出结果日。公司法务和开源审批还要再加 2–4 周。
- **例子**：ICLR 2027 全文截止 2026/9/25 AoE。撤回的论文立即去匿名，被拒的论文也留在 OpenReview 上公开，所以专利必须在 9/25 前申请（如果更早挂 arXiv，则在挂之前），而不是等录用之后。
- **后果**：专利权永久丧失，业界作者还可能违反公司政策。
- **功能**：planner 规则：每篇论文可加“知识产权审批”标记。系统找出最早的公开事件（计划的 arXiv 日期，或标为“投稿即公开”的会，如 ICLR），倒排出发明披露 → 法务审查 → 专利申请 → 投稿。计划的 arXiv 日期早于专利申请日时发出警告。
- **来源**：https://www.cnipa.gov.cn/art/2020/11/23/art_97_155167.html

### 5. 数据集论文：投稿时就要公开托管并附 Croissant/RAI 元数据，国内还有出境合规 · 严重度 4

- **问题**：Dataset/benchmark track 要求在投稿截止时，数据和代码已经托管在认可的平台上（Hugging Face、Kaggle、OpenML、Dataverse），审稿人不用找 PI 就能访问。作者还要提供包含 Responsible AI 字段的 Croissant 元数据文件，超过 4GB 的数据集要附样本。这些是有独立前置时间的基础设施工作（上传、许可、校验器），研究者却常拖到最后 48 小时。国内组把数据集放到 Hugging Face 或 Kaggle，还属于数据出境：不含个人信息或“重要数据”的学术合作数据可以豁免；含中国个人信息（人脸、声音、病历、驾驶数据）或可能属于“重要数据”的，超过数量门槛后要走合同、认证或安全评估。从大陆向境外上传大数据集也慢且不稳定，和“投稿时必须可访问”的要求冲突。
- **例子**：
  - NeurIPS 2026 Evaluations & Datasets track：摘要 5/4，全文 2026/5/6 AoE。数据集须 "available and accessible to all reviewers, ACs, and SACs at the time of submission"，"Non-compliance justifies the desk rejection of the paper."；从 2026 年起，Croissant 文件必须包含 RAI 元数据。NeurIPS E&D 要求投稿时托管在 HF、Kaggle 或 OpenML。
  - 网信办《促进和规范数据跨境流动规定》（2024 年 3 月）：学术合作数据 "that do not contain personal information or important data" 可以豁免；每年出境 100 万条及以上个人信息（或 1 万条及以上敏感个人信息）须做安全评估。
- **后果**：desk reject，或在审稿中被标记而削弱论文；合规风险或机构处分；错过托管时间导致 desk reject。
- **功能**：
  - 日历事件：“数据集论文”模板生成一组任务：T-21 天选许可和托管平台，T-14 天上传和准备样本，T-7 天跑 Croissant/RAI 校验器，T-2 天在未登录的浏览器里打开链接确认可访问。录用后提醒保持托管在线。
  - 检查：数据集发布问卷，询问是否含个人信息、敏感类别、记录数、是否可能属于重要数据，需要时引导走机构审查。截止前一周加一个“上传演练”任务。
- **来源**：https://neurips.cc/Conferences/2026/CallForEvaluationsDatasets ，https://www.cac.gov.cn/2024-03/22/c_1712776611775634.htm

### 6. 导师和机构审批要好几天，论文越多越慢 · 严重度 3

- **问题**：真正的截止比会议截止早。导师在同一个截止有 5–10 篇学生论文时，自己就成了瓶颈。有的学校要求在任何公开之前（包括 arXiv）做保密审查，由院系签字。业界实习生还要过公司的发表审批。
- **例子**：北京理工大学的流程（2025 年 9 月）：一作填写保密审查表，单位定密责任人线下审批，审批后的表格再到线上备案。任何论文公开前都要走完这一步。
- **后果**：论文不能按时投稿或挂 arXiv，或者违反机构规定。
- **功能**：planner 规则：从外部截止倒推内部里程碑，提前量按机构可调，例如 T−10 天初稿交导师、T−7 天提交保密审查、T−5 天导师反馈。导师面板显示每周有几篇学生初稿到达，方便错开审阅。
- **来源**：https://cnet.bit.edu.cn/docs//2026-03/f74536a017994d459755a3b545118d75.pdf

### 7. GPU 要在截稿高峰前预约，部分会议要求提交算力报告 · 严重度 3

- **问题**：组里几个学生赶同一个截止，抢同一批 GPU。学校集群限制截止前的临时扩容，扩容要提前申请，还要在几个截止之间分配。会议也开始要求填写算力细节，这些信息最好在跑实验时就顺手记下来。
- **例子**：UArizona HPC 允许课题组每年为即将到来的会议、论文或毕业截止申请一次 Special Project allocation。Utah CHPC 的预约最长 2 周。CVPR 2026 的 Compute Reporting Form 是必填项，和补充材料一起提交，其中硬件部分必填，而且必须提交 unflattened PDF。
- **后果**：实验做不完；特别配额用在了不重要的截止上；必填的算力表缺失。
- **功能**：planner 规则：每篇论文做一个算力计划，包括 GPU 小时估计和需要的日期（截止减去写作缓冲）；组级 GPU 需求图汇总所有论文。提醒：提前 N 周申请配额或预约。检查：把算力表作为补充材料截止的清单项。
- **来源**：https://cvpr.thecvf.com/Conferences/2026/ComputeReporting

### 8. arXiv CS 不再接收未经同行评审的综述和立场论文 · 严重度 3

- **问题**：自 2025/10/31 起，arXiv CS 版主会拒收综述和立场论文，除非作者提供期刊引用或 DOI，证明论文已完成同行评审，workshop 录用不算。对综述和 position track（NeurIPS/ICML）论文来说，“先挂 arXiv 占坑再投稿”的做法已经行不通，arXiv 发布只能排在录用之后。
- **例子**：arXiv 博客 2025/10/31："the review conducted at conference workshops generally does not meet the same standard ... and is not enough"。被拒的作者可以在论文完成同行评审后申诉，重新提交。
- **后果**：没有预印本，失去早期曝光和引用，可能被竞争的综述抢先；在宣传窗口期被 arXiv 拒稿，白白浪费时间。
- **功能**：planner 规则：论文加类型字段（研究 / 综述 / 立场）。对综述和立场论文，planner 禁止“投稿前挂 arXiv”，改为生成录用后的任务：“带 DOI/journal-ref 上传 arXiv，之前被拒过就提交申诉”。
- **来源**：https://blog.arxiv.org/2025/10/31/attention-authors-updated-practice-for-review-articles-and-position-papers-in-arxiv-cs-category/

### 9. 人类受试者研究的伦理审批（IRB 或同等审批）要在采集数据前拿到 · 严重度 3

- **问题**：用户研究、标注或众包、有人参与的 LLM 红队测试、有被试的机器人实验，都需要 IRB 或同等审批，还要披露被试风险和报酬。论文清单会问到这些，而审批必须在采集数据之前拿到。很多国内 CS 院系没有常设伦理委员会，委员会每月才开一次会，审批要几周，事后没法补。
- **例子**：NeurIPS Paper Checklist 问 "Did you ... obtain Institutional Review Board (IRB) approvals (or an equivalent approval/review based on the requirements of your institution)?"，众包工人的报酬不得低于最低工资；"Papers not including the checklist will be desk rejected."
- **后果**：研究无法如实报告，论文被伦理标记或拒稿，数据可能不能用。
- **功能**：日历事件：论文标为“人类受试者/众包”时，生成一个“伦理审批”里程碑，挂在计划的数据采集开始日之前。提醒：委员会的开会日程。检查：审批编号自动填进清单。
- **来源**：https://neurips.cc/public/guides/PaperChecklist

---

## 提交

### 10. 一篇论文有 3–4 个截止节点，补充材料和视频的时间各不相同 · 严重度 5

- **问题**：多数会议把投稿拆成几个截止：摘要或论文登记、全文、补充材料或代码，有的还有视频。tracker 一般只显示全文截止。补充材料可能比全文晚，也可能同时截止，每个会都不一样。
- **例子**：
  - ICLR 2027：摘要 9/18，全文 9/25（AoE），补充材料和全文同一天（9/25）截止。
  - CVPR 2027：登记 11/10，全文 11/16，补充材料 11/23（AoE），比全文晚 7 天。
  - AAAI-27：摘要 7/21，全文 7/28，补充材料和代码 7/31（全文后 3 天）。
  - NeurIPS：补充材料和全文同时截止，只收一个不超过 100 MB 的 ZIP。
  - ICRA 2027 有两个视频窗口（8/5–9/9 和 9/18–22），第二个窗口在全文截止（9/16）之后，而且全文截止后一天才被修改。
- **后果**：门户不收全文；错过补充材料截止，附录或代码就交不上；缺了视频会削弱评审（ICRA 审稿人很看重视频）。
- **功能**：日历事件：每次投稿建成一串带类型的里程碑（摘要、作者冻结、全文、补充材料、代码、视频、清单），每个里程碑是独立的日历事件，提醒偏移可以分别设置，默认 T-7 / T-2 / T-1 天。
- **来源**：https://cvpr.thecvf.com/Conferences/2027/Dates

### 11. 作者名单提前冻结，各会冻结点不同（CVPR 2027 的登记是硬门槛） · 严重度 5

- **问题**：作者名单和标题/摘要通常在第一个截止就锁定，之后新加入的学生或业界合作者都加不进来。而每个会冻结的节点又不一样。
- **例子**：
  - ICLR 2027：摘要截止（9/18）后 "No authors can be added or removed"，"no exceptions whatsoever"；作者顺序可以改到 9/25。
  - CVPR 2027：论文登记（11/10 AoE）是强制步骤。按 2026 年规则，登记后不能增删作者，提交时作者顺序定稿，每位作者的资料须满足 8 项标准，否则 desk reject。全文 11/16 AoE（截止 "will not be changed"），补充材料 11/23，审稿与 rebuttal 2027/1/25–2/1，2/25 出结果，6/20–25 在 Seattle 开会。每人最多 25 篇投稿，每位作者都要承诺审稿。CVPR 2026 摘要截止 11/6 后就不能再加作者。
  - AAAI-27：作者名单只能改到全文截止（7/28），'no exceptions'。
  - EACL commitment：不能增删作者。
- **后果**：贡献者永远上不了作者名单，造成署名纠纷，影响简历和毕业；论文根本提交不了。
- **功能**：
  - 日历事件：每个会冻结点前 72 小时建一个“作者名单冻结”事件，附清单：确认每位合作者和他们的 OpenReview ID、标题和摘要。冻结前 48 小时再加一个清单项：“作者名单定了吗？”
  - 检查：CVPR 这类“登记门槛”在 11/10 前 3 天设事件，核对每位合作者的资料是否满足 8 项。论文页顶部用横幅显示一稿多投锁定期。
- **来源**：https://iclr.cc/Conferences/2027/AuthorGuidelines ，https://cvpr.thecvf.com/Conferences/2027/CallForPapers

### 12. ARR 服务贡献者新规（2026 年 10 月周期起）：48 小时内注册，没有贡献者就进抽签 · 严重度 5

- **问题**：ACL 系会议（ACL、EMNLP、NAACL 等）的义务是在投稿之后才开始的。作者或指定的服务贡献者（审稿人或 AC）必须在截稿后 48 小时内注册；这个人如果不能履职又没有替补，相关投稿全部可能被 desk reject。从 2026 年 10 月周期起，只有配了合格服务贡献者的论文才保证送审。一位贡献者最多为 2 篇论文担保（约 10 篇审稿或 16 篇 meta-review），要担保论文达到顶会水平，紧急情况下还要自己找替补。没有服务容量的论文进入抽签，根据剩余容量决定送审还是 desk reject。这条规则从 10/12 截止开始，适用于 NAACL 和 COLING 2027。
- **例子**：
  - ARR 2026 年 10 月周期：10/12 截稿，服务贡献者须在 48 小时内（约 10/14）完成 OpenReview 注册。组里 6 篇 NLP 论文至少需要 3 位合格贡献者。
  - EMNLP 2026：所有作者须在 5/27 前注册、7/6 前完成审稿；做不到的，可能失去 commit 到 EMNLP 2026/2027 的资格。
- **后果**：desk reject（包括抽签被淘汰），或下一周期不能 commit 或重投；系统性地提交或担保低质量论文可能被禁投。
- **功能**：
  - 提醒：投稿后 T+1h、T+24h、T+44h 提醒“注册服务贡献者”，即 48 小时倒计时。
  - 检查：课题组视图里给每篇 ARR 论文分配服务贡献者，每人不超过 2 篇，同时检查一作 5 篇的上限。
  - 提醒：ARR 新周期规则有变化时，显示政策差异横幅。
- **来源**：https://aclrollingreview.org/cfp ，https://aclrollingreview.org/sustainable-reviewing-2026

### 13. 各会必填小节、清单和匿名要求不同，转投时最容易漏 · 严重度 5

- **问题**：每个会要求的必填内容都不一样，包括清单、Limitations 小节、AI 使用声明、贡献类型和模板。论文在会议之间转投时，这些内容要增要删，漏了也没有任何提示。ARR 列出了几十种常见的 desk reject 陷阱，包括残留的注释或元数据、匿名版里留着致谢。被拒到下一个截止，往往只有几天到几周。
- **例子**：
  - NeurIPS：没有 Paper Checklist 的论文直接 desk reject；camera-ready 要资金和利益冲突声明。
  - ARR：Limitations 小节缺失或位置不对会 desk reject；Responsible NLP checklist 全部答 'yes'，或答案不正确、有误导，都可能 desk reject；论文在 meta-review 之后仍可能被 desk reject。
  - ICLR 2027：正文和投稿表单里都要写 AI 使用声明（不计页数）；reproducibility statement 和 1 页的 ethics statement 虽然可选，但会议希望作者提供。
  - AAAI：reproducibility checklist 要单独提交，只写代码 'will be released' 不算满足要求。KDD 用 ACM 模板。
  - 把 NeurIPS 2026 被拒的论文转到 ARR 10 月周期（10/12），要删掉 NeurIPS checklist、加上 Limitations 小节、填好 Responsible NLP checklist，否则 desk reject。
- **后果**：不送审就被 desk reject（ARR 在 meta-review 之后也可能 desk reject）；或者转投时间不够，只能硬砍内容。
- **功能**：
  - 每个会建一张格式卡片：页数、模板、必填小节、匿名要求。
  - 检查：每个截止前跑一遍 preflight linter（PDF/LaTeX），检查必填小节和清单是否存在（解析 'Limitations'、'AI use' 等标题）、模板和字体、匿名情况（致谢、PDF 作者元数据、非匿名 GitHub 链接、残留注释），输出 pass/fail 报告。日历事件：T-3 天加一个“运行 preflight”事件。
  - 检查：“从 A 会移植到 B 会”的差异清单，列出要增删的小节、页数变化和模板切换，并估算改稿工时。
- **来源**：https://aclrollingreview.org/authorchecklist ，https://aclrollingreview.org/cfp ，https://aaai.org/conference/aaai/aaai-27/submission-instructions/

### 14. 幻觉引用和未披露的 LLM 使用直接导致 desk reject · 严重度 5

- **问题**：会议现在把虚构引用当作伦理违规，直接 desk reject。虚构引用多半来自 LLM 辅助写作，或者合作者没核对的 bib 条目；多人合写时，没人逐条核对。会议还要求披露 AI 使用情况。
- **例子**：
  - ICLR 2026 对所有确认含幻觉引用的论文 desk reject（19,525 篇投稿里共 desk reject 779 篇，原因包括幻觉引用和违反 LLM 政策）。被 desk reject 的 ICLR 论文仍然公开可见。
  - GPTZero 抽查 300 篇 ICLR 2026 投稿，有 50 篇至少含一条幻觉引用，每篇都被 3–5 位审稿人漏掉了。
  - ARR 把幻觉引用列为 desk reject 理由；NeurIPS 手册写明幻觉引用违反 Code of Conduct；CVPR 2026 可能对明显引用不存在工作的论文 desk reject。
  - ICLR 2027 要求在正文和投稿表单里都写明 AI 使用情况。
- **后果**：审稿前就被 desk reject，留下 Code of Ethics 违规记录，还可能被学术诚信调查；ICLR 的 desk reject 论文会一直公开。
- **功能**：检查：投稿前的引用核查器解析 .bib，逐条对照 DBLP、Crossref、Semantic Scholar、arXiv 和 DOI，标出查不到的条目，以及作者列表、会议或年份对不上的条目。按会议提供 AI 使用声明模板，作为提交清单的一项。提醒：T-5 天提醒核查，清单结果 T-3 天再提醒一次。
- **来源**：https://blog.iclr.cc/2025/11/19/iclr-2026-response-to-llm-generated-papers-and-reviews/ ，https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/

### 15. 时区陷阱：AoE、夏天的“PST”、CET、夏令时和解析 bug · 严重度 4

- **问题**：ML 会议多用 AoE（UTC-12）。北京时间比 AoE 快 20 小时，AoE 23:59 就是北京时间次日 19:59。机器人和 IEEE 会议常用太平洋时间，而且在夏令时月份仍写成 "PST"；ECCV 用 CET；注册之类的节点还会用 UTC 或会议当地时间。第三方 tracker 的换算方式各不相同，延期也是临时宣布的。AoE 对应的 IANA 名称 Etc/GMT+12 符号是反的，很容易被写成 UTC+12，结果早了一整天。中国没有夏令时，欧美切换夏令时的时候，PT、ET 截止换成北京时间会差 1 小时。已经有 tracker 因为时区标签解析失败，悄悄丢掉了整批会议。
- **例子**：
  - ICRA 2027 全文截止为 '15 Sep 2026 11:59 PM PST'，因服务器负载延长 24 小时到 9/16，而且是 9/16 当天才宣布。一个 tracker 换算成 06:59 UTC（即按 PDT），ResearchTheta 按 UTC-8 换算（16:59 KST），两者差 1 小时。9 月的加州实际用 PDT，所以 'Sep 16, 2026 (23:59 PST)' 约等于北京时间 9/17 14:59–15:59，而 9/16 AoE 的截止是北京时间 9/17 19:59，ICRA 早了 4–5 小时。（源数据里另有一条说“PT 截止比对应的 AoE 截止早约 19 小时”，和这个换算对不上，实现时以 UTC 换算为准。）
  - ICLR 2027 '9/25 AoE' = 北京时间 9/26 19:59。
  - ECCV 2026："Mar 5, 2026, 11:00 PM CET"，即北京时间 3/6 早上 06:00，比按 AoE 理解早了约 14 小时。KDD 2027 的中文投稿指南建议北京作者“至少提前 2 天完成上传，切勿卡点提交”。
  - CVPR 2026 早鸟注册在 '06:59 PM UTC' 截止；NeurIPS 2026 注册在 23:00 AEST 开放。
  - 欧盟 2026/10/25、美国 2026/11/1 结束夏令时，正好在 CVPR 截止之前。
  - ccfddl 中 'PT' 标签报错后被静默吞掉，VLDB 的 96 个事件从 ICS 和 RSS 里消失。
- **后果**：门户关了才提交，论文根本不会被接收；按 AoE 的习惯理解 CET 截止会直接错过，而截止不会延期；错过几小时甚至一整天；日历里的事件消失了却没有任何提示。
- **功能**：
  - 数据：每个 deadline 存成 UTC 时刻 + IANA 时区 + 原文字符串 + 来源 URL + 最后核实时间。
  - 界面默认显示用户本地时间（北京时间），并显示以小时计的倒计时。标签有歧义（比如夏天的 PST）时，按“最早的合理解释”显示并加标记；不是 AoE 的截止标红。
  - 日历事件：每个截止生成两条事件，一条是官方截止，一条是用户自设的内部截止（默认提前 48 小时）。ICS 里写正确的 UTC 时刻。
  - 检查：测试 fixture 覆盖 AoE、PST/PDT 和夏令时边界；遇到无法解析的时区，CI 直接报错失败，而不是悄悄丢掉条目。
- **来源**：https://researchtheta.com/icra-2027-seoul-deadline-submission-guide/ ，https://eccv.ecva.net/Conferences/2026/SubmissionPolicies ，https://2027.ieee-icra.org/announcements/call-for-papers-accompanying-video-submission-period-updated/ ，https://github.com/ccfddl/ccf-deadlines/pull/1662

### 16. 页数和模板各会不同，而且逐年变化 · 严重度 4

- **问题**：各会的页数上限和模板都不一样，同一个会也会逐年改规则。作者按记忆或去年的规则写，很容易超页。
- **例子**：
  - NeurIPS 9 页（camera-ready 10 页）。ICLR 9 页（讨论期和 camera-ready 10 页，严格执行），AI 使用声明不计页数。CVPR 8 页加参考文献。AAAI-27 正文 7 页，另加 2 页只能放参考文献。ARR 长文 8 页、短文 4 页，另加 limitations。KDD 用 ACM 模板，正文 8 页。
  - ICRA 2027：'page limit is 8 pages for the complete paper (… bibliography/references)'，而 ICRA 2025 是 6+n 页，参考文献不限。沿用 2025 年规则又有很长参考文献的作者会超页。ICRA 的终稿超页会被移出论文集，投稿超页则不送审、直接退回。
- **后果**：desk reject，或被移出论文集。
- **功能**：检查：自动 PDF preflight，定位参考文献起始页，统计正文页数，识别模板；规则和去年不同时，附上“与去年相比已变化”的提示。
- **来源**：https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/ ，https://aaai.org/conference/aaai/aaai-27/submission-instructions/

### 17. 同组相关论文：切香肠规则与并行投稿披露 · 严重度 4

- **问题**：一个组常在同一个截止投好几篇相关论文，但一作往往不知道组里其他人投了什么。会议现在把同一作者同时在投的其他论文视为 prior work，并惩罚近似重复的投稿，有时牵连涉事作者的所有论文。
- **例子**：ICML 2026：同一作者投给 ICML 的所有论文都要视为 prior work；相关投稿要在正文里互相引用，并在补充材料里附上匿名 PDF。串通、低质量 AI 内容等违规，可导致违规论文任何一位作者的所有论文被 desk reject。NeurIPS 2026 禁止 thin slicing（切香肠）。ICLR 2026 标记了提交多个略有差异版本的作者。
- **后果**：几篇相关论文一起被 desk reject。
- **功能**：组内相关论文登记表，按共享的数据或方法打标签。提醒：T−7 天提醒每位一作互引相关投稿、附上匿名副本。检查：可选地对同一会议的计划投稿做标题和摘要相似度检查。
- **来源**：https://blog.icml.cc/2026/01/08/whats-new-in-icml-2026-peer-review/

### 18. 代码、数据和补充材料链接的匿名化，以及哪些链接能放 · 严重度 3

- **问题**：这和预印本静默期是两回事。代码和数据本身就会泄露身份：git 历史、路径里的用户名、Hugging Face 组织名、W&B 链接、PDF 元数据。有的会禁止“扩展内容”的外部链接，rebuttal 里常常一个链接都不能放。rebuttal 期间修了代码，匿名镜像也要同步更新。
- **例子**：CVPR 2026："Authors are not allowed to include external links ... in submissions and supplementary material, when the links expand content and subvert the reviewing process"；rebuttal "cannot include links to external material such as code, videos, etc."；匿名化不当是 desk reject 的原因。
- **后果**：因违反匿名规定被 desk reject，或审稿人打不开承诺的代码。
- **功能**：检查：投稿前的匿名扫描器检查 PDF 元数据、链接、仓库作者和路径、HF 和 W&B 账号名，并套用各会的链接政策。提醒：T-3 天提醒在未登录的浏览器里验证匿名链接。
- **来源**：https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines

---

## 审稿与rebuttal

### 19. 审稿义务连坐：自己或合作者审稿失职，自己的论文被 desk reject · 严重度 5

- **问题**：现在几乎所有会议都要求作者审稿，处罚则落在论文上：审稿人名下的所有论文都会受牵连，包括没做错任何事的学生的论文。ICML、ICLR、NeurIPS 要求每篇论文提名一位作者作为 reciprocal reviewer；这个人漏审、写占位审稿，或违反自己选的 LLM 政策，论文就可能被 desk reject，而一作看不到合作者在做什么。不审完就看不到自己论文的审稿意见。审稿截止又正好落在作者自己写作和 rebuttal 的时期。Hacker News 上有人抱怨，合作者和中间作者被迫成为 'mandatory reviewers'，受了连带伤害。提名哪位合作者本身就是一个优化问题（arXiv 2512.17950）。
- **例子**：
  - ICML 2026 在 2026-03-18 desk reject 了 497 篇论文（约 2%）。水印 PDF 抓到 506 位选了 'Policy A'（不用 LLM）却仍在用 LLM 的审稿人，其中 398 位是指定的 reciprocal reviewer，他们被提名的论文都被拒了。
  - CVPR：逾期交审稿或审稿被判为 "highly irresponsible"（包括 LLM 代写）的审稿人，名下所有论文都可能被 desk reject；CVPR 2025 有 19 篇原本已录用的论文因此被移除。
  - ICLR 2027：挂名 3 篇及以上的作者至少审 6 篇；每篇投稿至少要有 1 位作者注册为审稿人并审至少 3 篇，否则 desk reject。初审在 10/1–21，有 3 篇投稿的作者要在这段时间交 6 篇审稿，否则 11/5 看不到自己的审稿。低质量审稿也可能导致 desk reject。ICLR 2026 的审稿人兼作者（及其合作者）在 rebuttal 期间完成全部审稿前，看不到自己论文的审稿。
  - NeurIPS 2026：每篇投稿提名一位 reciprocal reviewer，作者兼审稿人 "will not see the reviews of their own submission(s) unless they have completed all assigned reviews"；低质量审稿人在 meta-review 阶段有被 desk reject 的风险。
  - ARR：投稿后 48 小时内注册；"highly irresponsible" 的贡献者会被 desk reject，还可能被禁投。ARR 2026 年 1 月周期：审稿人注册表 1/7 截止，审稿人清单 1/21 截止，逾期就 desk reject。AAAI-27：合格的作者必须能审稿。
  - ARR 10 月周期的审稿截止是 11/16，和 CVPR 2027 全文截止是同一天。
- **后果**：自己的论文被 desk reject。组里一个学生审稿逾期，可能连累他名下所有论文，包括导师挂名的。或者 rebuttal 期间看不到审稿意见，白白丢掉 rebuttal 的天数。
- **功能**：
  - 日历事件：单独一个“审稿义务”日历层，可手动录入或从 OpenReview 导入。按合作者记录会议、分配篇数、截止日和所选 LLM 政策（A/B）。
  - 提醒：截止前 T-7、T-3、T-1 天各提醒一次，并标出“逾期会连累你的论文 X、Y”。升级提醒直接发给这位合作者，不只发给一作。论文卡片显示风险，例如 'reviewer X has submitted 2 of 6 reviews, due in 3 days'。
  - 提醒：rebuttal 窗口开启时合作者还没审完，就发“lockout risk”警报；每周给 PI 发一份摘要。
  - 检查：审稿截止和自己的截稿相距不到 3 天时发冲突警告；汇总各会的审稿负担，建议在哪里申请豁免或减量。
  - planner 规则：提名助手把提名分摊给过去审稿可靠的合作者；组视图显示每篇论文的审稿要求由哪位成员承担。
- **来源**：https://news.ycombinator.com/item?id=47437101 ，https://cvpr.thecvf.com/Conferences/2026/ReviewerGuidelines ，https://iclr.cc/Conferences/2027/ReviewerGuidelines ，https://blog.icml.cc/2026/03/18/on-violations-of-llm-review-policies/

### 20. 秋季工作量撞车：rebuttal、审稿、新投稿挤在同几周 · 严重度 5

- **问题**：秋天，一个人可能同时有两个会的 rebuttal、一堆审稿任务和一篇新投稿，全挤在 3 周里。deadline tracker 只显示投稿日期，工作量冲突要等撞上了才看得见。对 ML/CV 作者来说，一年里最重要的 rebuttal 窗口正好压在最大的视觉会议截止上，那个会还要在截止前几天强制登记；而 ICLR 的讨论期恰恰是分数真正会变的时候。审稿窗口不在任何人的日历里，总被挤到最后，这时写得潦草又会触发对自己论文的处罚。rebuttal 按 AoE 计时，换成北京时间常常是深夜。
- **例子**：
  - ICLR 2027 审稿人竞价 9/18–25，和 ICLR 全文截止重叠。
  - ICLR 2027 审稿 10/1–21（ICLR 2026 的审稿期是 10/10–11/1），和 EACL 2027 commit（10/11）、ARR 10 月周期投稿（10/12，每位投稿作者 48 小时内注册审稿人）、AAAI-27 作者反馈（10/19–25）重叠。KDD 2027 Cycle 1 的 rebuttal 期（9/29–10/13）跨过国庆。
  - ICLR 2027 作者讨论 11/5–18，期间有 CVPR 2027 登记（11/10）和全文截止（11/16）。11/16 这一天，CVPR 2027 全文截止、ARR 10 月周期审稿截止，ICLR 讨论也还没结束（11/18 结束）。
  - ICLR 审稿人讨论 11/19–25，和 CVPR 补充材料截止（11/23）、ARR 10 月周期作者回复（11/24–30）重叠；AISTATS 2027 讨论 11/23–12/3；AAAI-27 11/30 出结果；NeurIPS 悉尼 12/6–12；AAAI-27 camera-ready 12/14；ICLR 12/16 出结果。
  - CVPR 2027 rebuttal 在 2027/1/25–2/1。
- **后果**：rebuttal 写得仓促甚至错过窗口，本来能救回的论文被拒；审稿逾期，连累自己的论文；CVPR 投稿仓促，或者漏了 CVPR 11/10 的登记，根本投不了。
- **功能**：
  - planner 规则：每人每周一张工作量热力图，汇总投稿、登记、rebuttal、审稿、camera-ready、出行等所有义务。同一周有 2 个及以上硬性义务时预警，建议提前开工，并导出为日历时间块。
  - 日历事件：把审稿当成要排期的工作，估算工时（如 6 篇 × 4 小时），在截止前排进时间块。
  - 提醒：提前 4–6 周发出“crunch forecast”，附分流建议，例如 11/5 前冻结 CVPR 实验、提前写好 ICLR rebuttal FAQ。
  - 日历事件：48 小时内有 2 个及以上义务的日期，标上“撞车日”。
- **来源**：https://aaai.org/conference/aaai/aaai-27/main-technical-track-call/ ，https://github.com/acl-org/aclrollingreview/blob/main/dates.md ，https://iclr.cc/Conferences/2027/ReviewerGuidelines ，https://cvpr.thecvf.com/Conferences/2027/Dates ，https://iclr.cc/Conferences/2027/Dates

### 21. rebuttal 格式和窗口差异很大，要在审稿发布前就开始准备 · 严重度 4

- **问题**：rebuttal 的形式从一页 PDF 到限字数、不能附文件的文本框都有，有的会允许放链接，有的禁止；有的会允许上传修改版 PDF，页数上限也不同。作者在不同会之间复用材料，很容易违规。
- **例子**：
  - CVPR：一页 PDF，必须用 rebuttal 模板，不能有外部链接。CVPR 2027 rebuttal 在 2027/1/25–2/1。
  - NeurIPS 2025：每条审稿最多回复 10,000 字符，只能用 markdown，不能附文件，"do not use links in any part of the rebuttal"。
  - ICLR 2027：rebuttal 期间可以上传修改版 PDF，最多 10 页；评论条数不限，但每条有字数限制。
  - AAAI-26：对所有审稿（包括 AI 审稿）只能回复一次，最多 2,500 字符，不能有 URL，不能有新结果。AAAI-27 的反馈窗口只有 10/19–25。按 AAAI-26 的规则，一条回复要在 2,500 字符内回应 5 条人工审稿加 1 条 AI 审稿，而且和 ICLR 审稿截止（10/21）在同一周。
  - ARR：纯文本，不能有链接，每个审稿线程最多回复 2 次，只能补少量新结果。2026 年 8 月周期把回复分成几个阶段，初次回复 9/19 截止。
- **后果**：rebuttal 因含 URL 被扣下或被截断，或者被忽略、被标记，甚至因违规被 desk reject；rebuttal 需要的实验来不及做。
- **功能**：
  - 检查：每个会一个 rebuttal 工作区，预置模板，实时统计字符数和页数，并检测链接。
  - 日历事件：rebuttal 窗口做成日历块，关闭前 24 小时提醒，讨论期的结束时间换算成北京时间。
  - 提醒：审稿发布前 7 天提醒“预约 GPU、空出日程”。
- **来源**：https://neurips.cc/Conferences/2025/PaperInformation/NeurIPS-FAQ ，https://aaai.org/conference/aaai/aaai-26/aaai-26-faq-for-authors-rebuttal/ ，https://iclr.cc/Conferences/2027/Dates

### 22. 预印本、社交媒体和公众号宣传的静默期 · 严重度 3

- **问题**：各会关于 arXiv 和宣传的规则不同：挂 arXiv 通常可以，社交媒体宣传可能被禁，有的还有媒体禁令。ARR 允许作者做一个有约束力的“不挂非匿名预印本”承诺。作者常常不查论文当前的义务，就在 X 上发帖或挂 arXiv。国内组还有个习惯：挂 arXiv 后马上让机器之心、量子位等公众号宣传，或在小红书、B站发解读。arXiv 本身也有每日截止时间和节假日安排。
- **例子**：
  - CVPR：投稿及与之重叠的 arXiv 预印本，录用前都不能在社交媒体宣传或与媒体讨论，违者可能被 summary rejection。CVPR 2026："Papers submitted to CVPR must not be discussed with the media until they have been officially accepted"，违者 "removed from the conference and proceedings"。CVPR 2027 以 2026/9/15 为界，此后公开的工作算 "contemporaneous"。
  - ARR：选了 "no non-anonymous preprint" 的作者，在 meta-review 发布前不能挂预印本，"under the penalty of desk rejection"。ACL 已在 2024 年取消了匿名期。
  - ECCV 2026 禁止在出结果前在社交媒体宣传投稿。
  - arXiv：美东时间 14:00 前收到的投稿当晚公布。2026 年劳动节前后，9/4（周五）14:00 ET 之后收到的投稿，9/8（周二）20:00 ET 才公布。自 2025/10/31 起，arXiv CS 要求综述和立场论文提供同行评审证明。
- **后果**：被 desk reject 或 summary rejection，或被撤出会议和论文集；预印本晚几天才出现；综述被 arXiv 拒收。
- **功能**：
  - 检查：每篇论文一张“宣传锁”卡片，写明能否挂 arXiv、能否在社交媒体宣传及截至何时、有没有媒体禁令，起止日期由会议规则推出。发 arXiv 或社交媒体帖子前弹出警告。
  - 日历事件：生成“媒体/预印本静默期”日历块，可以分享给组里负责宣传的人；静默期结束时提醒“可以发公众号了”。ECCV 或 CVPR 论文在审期间，提醒“不要发帖”。
  - arXiv 截止计算器：按用户时区换算，考虑 arXiv 的节假日安排。
- **来源**：https://analyticsindiamag.com/ai-features/why-this-influential-ml-conference-banned-social-media-discussion-during-the-review-period/ ，https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines ，https://blog.arxiv.org/2026/09/03/announcement-schedule-changes-laborday2026/

### 23. 等结果的焦虑，和有偏的网上分数统计 · 严重度 3

- **问题**：等结果压力很大，作者会反复刷 OpenReview 和 Reddit 帖子估算自己的机会。但网上自报的分数系统性偏高，按这些众包数据估算，会误导撤稿还是 rebuttal 这类决定。
- **例子**：对 405 个 Reddit 会议帖的分析显示，71.3% 为负面，负面帖中 34.6% 含心理健康相关词。一项针对知乎和 Reddit 的研究发现，'survivors, complainers and borderliners' 抬高了自报的分数分布。
- **后果**：撤稿或重投的决定出错，人也被耗到倦怠。
- **功能**：提醒：平静通知模式，用一份摘要代替多次推送，只在官方发布时刻提醒。检查：分数参照用 OpenReview/Paper Copilot 的完整公开审稿数据，不用社交媒体数据。出结果日之前准备好一张“plan B”卡片。
- **来源**：https://arxiv.org/html/2508.04586v4

### 24. 伦理审稿中途出现，要一路跟到 camera-ready · 严重度 2

- **问题**：论文被审稿人或 AC 标记后，作者回复期会在普通审稿之外多出单独的伦理审稿。作者要回应，还要把承诺的缓解措施（数据声明、防护措施、局限说明）写进 camera-ready。严重违规时，论文偶尔会被拒。伦理审稿在 OpenReview 上看起来和普通评论一样，很容易漏看。
- **例子**：NeurIPS 2026：伦理审稿 "anonymized when made visible to authors and main reviewers"，在作者回复期可见；伦理审稿人 "recommend potential mitigations for authors to incorporate when revising"。
- **后果**：AC 会把没回应的伦理问题当成弱点；camera-ready 缺少承诺过的修改。
- **功能**：提醒：轮询 OpenReview 上的伦理审稿，转成（a）一条 rebuttal 任务，（b）camera-ready 清单里的“承诺修改”项，自动跟踪。
- **来源**：https://blog.neurips.cc/2026/05/12/neurips-2026-call-for-ethics-reviewers/

---

## 出结果与转投

### 25. 出结果时下一个会的摘要已截止，要提前注册对冲摘要 · 严重度 5

- **问题**：主要 ML 会议的日程排得很紧，上一个会出结果，紧接着就是下一个会截稿，而下一个会的摘要注册比全文还早约一周。论文被拒后想马上转投，就必须在知道结果之前，先注册一份真实的摘要，并定好作者名单。多数作者到出结果当天才发现这个依赖关系。ICLR 2027 会删除占位或重复的摘要（摘要要用于审稿人竞价），所以对冲用的必须是真实、有信息量的摘要。
- **例子**：
  - 2026-09-24 同一天：NeurIPS 2026 出结果（9/24 AoE），AAAI-27 发 Phase 1 拒稿，ARR 8 月周期作者回复结束。ICLR 2027 全文截止是 9/25 AoE（北京时间 9/26 19:59），而摘要截止是 9/18 AoE，比 NeurIPS 出结果早 6 天。
  - ICLR 允许论文在别处审稿期间先注册摘要（"We will only do duplicate-submission checks for full submissions"）。摘要截止后如果论文在别处被录用，可以撤回；在全文截止前撤回的论文会被删除，不会公开。但摘要截止后不能增删作者，还在 AAAI-27 Phase 2 审稿的论文也不能投 ICLR。
  - 据 phdflow，2024–25 年 ICLR 是在 NeurIPS 出结果之后才开放摘要注册的。ICLR 2027 注册了约 50,000 份摘要（ICLR 2026 有效投稿 19,525 篇），其中一部分就是对冲。
  - NeurIPS 或 AAAI 被拒后的下一批选择：AISTATS 2027 摘要 9/29、全文 10/6，ARR 10/12，CVPR 2027 登记 11/10、全文 11/16。
- **后果**：跳过一整个周期，只能等 CVPR 2027（11/16）或 ICML 2027（约 2027 年 1 月下旬），损失 2–4 个月，还错过一个 CCF-A 会议周期；或者占位摘要被删。
- **功能**：
  - planner 规则：对每篇在审论文，计算每个候选下一站的“摘要截止 − 当前会出结果日”。结果为负时，在摘要截止前至少 3 天生成“对冲决定”事件，附上该会关于真实摘要的规则原文和清单（写真实摘要，作者名单一次定全）。
  - 日历事件：同时生成一个“若在别处录用，在全文截止前撤回”的任务，挂在出结果日。
  - 检查：确认论文不在其他会的审稿期内，避免一稿多投。
  - 为每种结果列出“下一扇门”清单。出结果当天自动生成“结果之夜”清单：录用就走 camera-ready 和注册流程，被拒就按转投目标倒排任务。
- **来源**：https://iclr.cc/Conferences/2027/AuthorGuidelines ，https://iclr.cc/Conferences/2027/Dates ，https://phdflow.ai/guides/after-neurips-rejection

### 26. 撤稿还是留下：讨论期中途就要决定，ICLR 撤稿永久公开 · 严重度 5

- **问题**：转投到另一个会，必须在目标会的独占期开始前撤稿，这通常比当前会出结果早好几周，也就是看到审稿后几天内就得决定。下一个会的截止常常就落在 rebuttal 窗口里。撤稿的代价各会差别很大：ICLR 截稿后撤回的论文和审稿意见永久公开，并且去匿名；ARR 撤得晚会失去下一周期的资格；KDD 不允许把修改版投到下一周期。作者常常在压力下凭感觉做决定。
- **例子**：
  - ICLR 2027 在 11/5 发布审稿，讨论期 11/5–18，12/16 出结果。CVPR 2027 登记 11/10、全文 11/16，审稿期内（2026/11/16–2027/2/22）禁止并行投稿。所以把 ICLR 论文转投 CVPR，看到审稿后只有 5 天（到 11/10 登记）决定，最晚要在 11/16 前撤稿（看到审稿后第 11 天）。
  - ICLR："if an author chooses to withdraw a submission, it will remain hosted by OpenReview in a publicly visible withdrawn papers section"，撤回后立即去匿名；ICLR 2027 所有论文在审稿结束时都会去匿名。ICLR 2026 的 19,525 篇有效投稿中有 5,042 篇撤稿。
  - AAAI Phase 2 的论文审到 11/30，赶不上 CVPR（登记 11/10，锁定期从 11/16 开始）。
  - ARR：截稿 48 小时后撤稿的论文，"not be resubmitted until the second subsequent ARR cycle"。
  - KDD 2027：审稿后被拒或撤回的论文 "should not submit a revision" 到下一周期。
- **后果**：要么丢一个周期（ICLR 12/16 出拒稿时，CVPR 早已截止），要么仓促撤稿，留下公开的负面记录；一稿多投违规会被两边都拒，并被通报给对方会议；在 ARR 则丢一个周期。
- **功能**：
  - 审稿发布时触发“撤还是留”决策卡：显示分数在该会当年完整分数分布中的位置（Paper Copilot/OpenReview 数据），可达的下一站以及离各自摘要截止还有几天，撤稿是否公开、之后能否重投，以及转投需要的格式改动量。
  - planner 规则：按“论文 × 目标会”算出 withdraw-by 日期，并展示撤稿后果（公开、去匿名、审稿可见）。日历事件：在下一站摘要截止前加一个“decide by”事件。
  - 提醒：审稿发布前 3 天提醒组里先商定去留的分数阈值；审稿到达后一键生成决策笔记，汇总分数和各截止日。撤稿会受罚的时间点（如 ARR 截稿后 48 小时）之前自动提醒。
- **来源**：https://iclr.cc/Conferences/2027/AuthorGuidelines ，https://aclrollingreview.org/cfp

### 27. ARR：meta-review、commit 和下一周期之间只有 3–4 天，撤稿和重投资格暗藏陷阱 · 严重度 4

- **问题**：NLP 论文审完后要在“马上 commit 到某个会”和“修改后重投 ARR”之间二选一，两条路互斥。commit 是在会议表单上单独提交的操作，不会自动完成，所以 ARR 审完不等于已经投了会。commit 截止在 meta-review 发布后几天，有时正赶上假期那一周。晚撤稿和 meta-review 低分都有冷却期，作者经常把资格规则弄错。
- **例子**：
  - ARR 2026 年 8 月周期：8/3 投稿，8/5 审稿人注册（48 小时），作者回复分阶段进行（初次回复 9/19 截止，讨论到 9/24），10/8 发 meta-review，10/11 EACL 2027 commit 截止，10/12 下一周期投稿截止。
  - 10 月周期：10/12 投稿，10/14 审稿人注册，11/16 审稿截止，11/24–30 作者回复，12/17 发 meta-review，12/23 NAACL 和 COLING 2027 commit 截止，正是圣诞周。ACL 2027 用 2027 年 1 月周期。
  - EACL 2027：11/12 出结果，11/26 camera-ready，报告作者须在 EACL 早鸟截止前注册。
  - 截稿 48 小时后撤稿，要到第二个后续周期才能重投；撤稿还会让之前所有审过的版本失去 commit 资格。例如在 9/20 撤回 8 月周期的论文（距 8/3 已超过 48 小时），就不能投 10/12 的周期，审过的版本也不能在 10/11 commit 到 EACL。
  - meta-review 1.5 分要跳过一个周期，1 分永远不能重投。重投要附上一次投稿的链接、一份 PDF 格式的逐条修改说明（revision notes），并申请保留或更换审稿人和 meta-reviewer。
  - 论文在任何阶段都可能被 desk reject，包括 meta-review 之后。ARR 允许 commit 到多个会议，但会议本身通常禁止。
- **后果**：审完的论文没进任何会，审稿白费；进错周期；重投不合格被 desk reject；丢一个周期（约 2 个月）。
- **功能**：
  - planner 规则：ARR 状态机把周期和 commit 建成两个独立事件。meta-review 发布时生成“commit 还是修改”决策卡，显示分数、各目标会的 commit 截止、下一周期截止，以及该会以往的 commit 分数线；自动提醒 commit 截止。
  - 检查：资格计算器根据撤稿时间和分数，算出能否重投、下一个可投的周期；点“撤稿”按钮时先模拟后果。
  - 根据审稿意见生成 revision notes 模板；提醒准备重投材料包（revision notes、上次投稿链接、审稿人偏好）。
- **来源**：https://aclrollingreview.org/dates ，https://github.com/acl-org/aclrollingreview/blob/main/dates.md ，https://aclrollingreview.org/authors

### 28. 期刊和 journal-to-conference 通道有自己的截止，没人跟踪 · 严重度 3

- **问题**：会议窗口对不上时，TMLR/JMLR 加 journal-to-conference（J2C）track、RA-L 转 ICRA/IROS 都是不错的出路。但这些通道有单独的申请截止、有限的名额、资格窗口和 certification 要求，而且不延期。
- **例子**：NeurIPS/ICLR/ICML 的 J2C track：2025/1/1 以来发表的 JMLR 或 TMLR 论文可以申请，TMLR 论文须有 J2C、Featured 或 Outstanding certification。截止：NeurIPS 2026 为 9/26，ICLR 2027 为 2026/12/18。每个会 150 个名额，不延期，不进论文集。RA-L 论文可在 2026/12/31 前转到 ICRA 2027。
- **后果**：已录用的期刊论文失去会议报告机会，或错过资格窗口。
- **功能**：日历事件：期刊论文也纳入跟踪。TMLR 或 JMLR 论文带合格 certification 录用时，为之后符合条件的会议生成 J2C 申请事件和资格结束日；RA-L 录用时生成 ICRA 或 IROS 的转投截止。
- **来源**：https://icml.cc/public/JournalToConference

### 29. workshop 退路在主会出结果前就关了 · 严重度 3

- **问题**：被拒论文常见的退路是投同一会议的 non-archival workshop。但 workshop 截止通常早于主会出结果，每个 workshop 有自己的 OpenReview group、页数限制和 archival/non-archival 属性，而是否 non-archival 决定了之后还能不能投 ICLR 或 CVPR。没有人汇总这些截止。
- **例子**：NeurIPS 2026 建议的 workshop 论文截止是 2026/8/29 AoE，而主会 2026/9/24 才出结果。今天被拒的论文，大多数 NeurIPS 2026 workshop 已经投不了，除非个别 workshop 设了更晚的截止。
- **后果**：失去报告和获得反馈的机会，或者选了 archival workshop，挡住了之后投主会的路。
- **功能**：主要会议的 workshop 爬虫，记录截止、archival 属性和页数。planner 规则：一稿多投规则允许时，建议在主会出结果前投一个 non-archival 版本对冲；archival workshop 和计划中的会冲突时标记出来。
- **来源**：https://neurips.cc/Conferences/2026/CallForWorkshops

### 30. 论文历史丢失：哪个版本投了哪、收到什么意见、改了什么 · 严重度 2

- **问题**：投过 2–3 轮之后，作者已经记不清哪个版本投了哪个会、每位审稿人提了什么、哪些问题改过了。投稿系统越来越多地要求逐条的修改说明，并关联之前的审稿。CMT 或非公开 OpenReview 会议上的审稿意见，事后很难再找到，而同一位审稿人可能再次审到这篇论文。
- **例子**：ARR 重投要求 "An explanation of revisions ... point-by-point response indicating how you have addressed each weakness"，之前的审稿意见会和重投的论文关联在一起。
- **后果**：同样的弱点再犯一遍，修改说明写得弱，审稿人反感甚至直接拒稿。
- **功能**：论文历史图：每次投稿保存 PDF hash、会议、审稿意见（出结果当天导出）、分数和结果。LLM 辅助的“未解决弱点”跟踪器，在下一个截止前生成修改说明草稿。
- **来源**：https://aclrollingreview.org/authors

---

## camera-ready

### 31. 录用后一串短期限 deadline，还和其他会议撞车 · 严重度 5

- **问题**：录用不是终点。录用后会陆续收到邮件表单，截止只有几天：多会场会议的会场选择、指定报告人、资助申请，这些选择一旦做了就不能改，还决定了注册名额。接着是 camera-ready、版权表、ARR commit、注册、海报、视频等一连串事项。这些 deadline 分散在各处，还常和其他会议的出行、截稿撞在一起。
- **例子**：
  - NeurIPS 2026（9/24 出结果，悉尼主会场 12/6–12，亚特兰大和巴黎卫星会场 12/9–13）：会场偏好表（Sydney/Paris/Atlanta）9/30 AoE 截止，指定一位报告作者和偏好会场，满员的会场随机分配。每篇论文正好一个注册名额，绑定分配到的会场；分配定稿后 "no changes to the presenting author or poster location will be permitted"。资助和志愿者申请 10/6 AoE 截止，结果分别在 10/14 和 10/20 前公布，同一作者不能两者兼得。camera-ready 日期还没出现在 2026 Dates 页面上（2025 年是 10/23 AoE），须包含资金和利益冲突声明，上限 10 页。早鸟注册 10/30 AoE 截止；退款截止 11/4 AoE，这也是取消并在分配会场重新注册的最后一天。签证邀请函只发给已付费的现场注册者，澳大利亚签证建议提前 6–8 周申请。Virtual Only Pass 不算数，录用的论文如果没人报告，会被撤销录用。
  - NeurIPS 2025：会场选择 10/3 截止，墨西哥城注册 10/26 截止。
  - AAAI-27 camera-ready 12/14，正好在 NeurIPS 悉尼会期（12/6–12）刚结束时。ICLR 2027 12/16 出结果，camera-ready 可以扩到 10 页。ARR 审完后，必须在 NAACL 或 COLING 2027 的 commit 截止（12/23）前主动 commit，否则不会进入任何会议。
- **后果**：被分到去不了的会场（比如签证问题），失去保证的注册名额或资助；多付费用；签证太晚；没人报告被撤销录用；没交 camera-ready 或没 commit，论文没被收录。
- **功能**：
  - 日历事件：论文状态改为“录用”（'Mark as accepted'）时，按该会模板自动生成录用后任务链：会场偏好、报告人、资助、camera-ready、版权、注册、签证邀请函、海报、视频、报销。任务之间带依赖关系（注册 → 邀请函 → 签证预约 → 出行）。
  - 还没公布的日期标为“TBD，去年是 X”，官方页面更新后自动填入。
  - 任务链可以订阅（ICS 或 CalDAV），和出行日程冲突时预警。
- **来源**：https://neurips.cc/Conferences/2026 ，https://neurips.cc/Conferences/2026/Dates ，https://aaai.org/conference/aaai/aaai-27/submission-instructions/

### 32. 出版方流程：版权表、PDF 合规、超页费 · 严重度 3

- **问题**：录用后每家出版方都有自己的关卡。IEEE 会议（ICRA、IROS、RO-MAN、CVPR）要 eCopyright 表，还要一份通过 IEEE PDF eXpress 检查、嵌入全部字体的 PDF，某些中日韩字体设置过不了。Springer（ECCV）要签 consent-to-publish，ACM 用版权表和 TAPS，PMLR 有自己的许可。超页按页收费。每一步都卡着最终上传，任何一步都可能在最后几小时因为技术细节失败。
- **例子**：RO-MAN 2026：'a manuscript should be of 6 pages, With 2 additional pages allowed with $100 extra charge per page.' PaperCept 合规检查要求 'All fonts must be embedded'，并且 'Fonts that require non-English language support are not allowed.'
- **后果**：论文进不了论文集或 IEEE Xplore，或者付款时才发现要交超页费。
- **功能**：检查：按出版方（IEEE、ACM、Springer、PMLR、ACL Anthology）建 camera-ready 流水线，子任务按顺序排好；按当前页数估算超页费；上传前在本地检查字体嵌入和 PDF 合规。
- **来源**：https://ro-man2026.org/papersubmission/

### 33. ACM 全面开放获取，单位不在 ACM Open 名单里要按篇付 APC · 严重度 3

- **问题**：ACM 从 2026 年起全面改为开放获取（OA）。通讯作者单位不在 ACM Open 名单里的，每篇论文要付 APC（文章处理费）。这会影响 KDD、MM、WWW、SIGIR、CHI 等 ACM 会议的经费预算，很多人到 camera-ready 阶段才发现。
- **例子**：ACM 2026 年的临时补贴价是会员 250 美元、非会员 350 美元（官方称补贴 65%）。浙江大学图书馆通知里列出的标准价是会议论文 1000 美元，ACM/SIG 会员 700 美元。复旦、浙大等高校图书馆都专门发了通知。
- **后果**：camera-ready 阶段才发现要付费，经费没有预算，报销流程也来不及走。
- **功能**：检查：会议卡片上标出出版方和 APC 政策，检查用户单位是否在 ACM Open 名单里。planner 规则：选会时就显示预估总成本（注册费、APC、差旅）。
- **来源**：https://libweb.zju.edu.cn/2026/0122/c55543a3130574/page.htm

### 34. 匿名时删掉的致谢和基金号要按资助方格式恢复 · 严重度 3

- **问题**：双盲审稿时删掉的致谢和基金号，camera-ready 时要加回来。会议现在要求写资金和利益冲突声明。国内资助方（NSFC、部委或省级项目）要求按特定格式标注基金号，论文才能计入进展报告和结题；有的机构还要求特定的单位排序。赶完截止后，这件事经常被忘掉。
- **例子**：NeurIPS 2026 camera-ready 须 'Include funding statement and competing interests disclosure'，另附一份 lay summary。缺了基金号的论文，不能列为该基金在 PI 年报中的成果。
- **后果**：论文不算基金成果，PI 只能申请勘误，或者少一项可报告的成果。
- **功能**：组内基金登记表（资助方、编号、要求的措辞）。检查：camera-ready 时生成致谢文字，并给出“恢复去匿名内容”清单（致谢、仓库链接、自引）。
- **来源**：https://neurips.cc/Conferences/2026/MainTrackHandbook

### 35. 国内毕业、晋升和评奖要的录用函、检索证明和署名信息 · 严重度 3

- **问题**：这和时间上的统计截止是两回事。国内的评价体系要特定的文件和元数据：一是正式录用函，OpenReview 和 CMT 的录用决定不会生成这种函；二是论文集 DOI 或图书馆检索证明，常常比录用晚几个月才有；三是机构官方英文单位名、第一单位、通讯作者标记、共同一作标注，这些在 camera-ready 里必须完全正确。有些会（比如 ICLR，论文只放在 OpenReview 上），各评审部门的认定口径不一。
- **例子**：今天（9/24）被 NeurIPS 2026 录用的论文，要到 12 月开会前后甚至更晚才进入正式论文集，而 2027 年春季的学位或评审截止，可能要求一份届时还不存在的检索证明。camera-ready 里的单位拼写错误，发表后就改不了了。
- **后果**：论文这一轮不能计入毕业或晋升，或者被算到错误的单位。
- **功能**：每篇论文建一个“评价材料包”：按机构列出所需文件，提供向 PC 申请录用函的邮件模板。检查：camera-ready 元数据检查（单位字符串、* 和 † 标记）。提醒：DOI 或检索记录出现时提醒。
- **来源**：源数据未提供 URL

### 36. 承诺的代码、数据和模型开源，录用后没人排期 · 严重度 2

- **问题**：清单和 rebuttal 里写了“代码将会开源”，数据集论文承诺长期托管，可录用后没人负责开源这件事：清理仓库、选许可证、写模型卡或数据集卡、保持托管在线。学生毕业、实习生离职，承诺就悄悄落空了，既伤信誉，也让后续工作更难做。
- **例子**：NeurIPS checklist 问 'If you are releasing new assets, did you document them and provide these details alongside the assets?'；E&D 数据集要求托管 'ensures long-term access'。
- **后果**：作者失去信誉，下一轮收到 GitHub issue 和审稿人的抱怨；E&D 论文违反托管承诺。
- **功能**：日历事件：跟踪“开源承诺”。清单或 rebuttal 里每出现一条承诺，就生成以 camera-ready 和开会日为截止的任务（仓库公开、许可证、README 或卡片、Zenodo 等归档 DOI），并指定一位到时候还在的负责人。
- **来源**：https://neurips.cc/public/guides/PaperChecklist

---

## 注册与出行

### 37. 签证周期长于“录用到开会”，邀请函要先付注册费 · 严重度 5

- **问题**：对包括中国在内的许多非西方国家研究者来说，从录用到开会的间隔比实际的签证周期（预约、生物识别、行政审查）还短。NeurIPS、ICLR、AAAI 和 CVPR 只给已付费的现场注册者发邀请函，所以整条链是：出结果 → 付注册费 → 邀请函 → 签证预约 → 审理。拒签退款还常常要求在某个日期前递签，这个日期甚至早于出结果。
- **例子**：
  - AAAI-27：2026/11/30 出最终结果，2027/2/16 在 Montréal 开会，中间约 11 周，还夹着假期。加拿大访客签证在生物识别后约需 2–12 周（另一来源：从中国申请约 4–8 周，另加生物识别 1–2 周）。
  - ICLR 2027（San Francisco，4/26）：只有在 2027/3/17 前递签，拒签时才退注册费。
  - NeurIPS 2026：必须购买现场注册才能生成邀请函，澳大利亚签证建议提前 6–8 周申请，也就是 10 月初。NeurIPS 提醒 workshop 作者，等录用后再办签证很可能来不及。
  - ICML 2026 在 4/30 出录用结果，但签证原因延长退款期限的前提是 "applied for your visa before April 7, 2026"。
  - ICLR 2026（里约）的邀请函 "only available if you have a in-person conference registration"。NeurIPS 2025 专门增设墨西哥城会场，部分原因就是美国签证难办。美国 221(g) 行政审查需要 2 周到 6 个月不等。
- **后果**：没法到场报告，论文可能被撤销录用、移出论文集或记为 no-show，注册费也可能退不回来。
- **功能**：
  - planner 规则：apply-by = 开会日 − 目的地/国籍缓冲。为每个会议所在地建一条签证时间线（预约等待、审理时长、是否常被 check），结合用户的国籍和护照，倒推“最晚递签日”和“最晚拿到邀请函日”。
  - 提醒：出现早期信号（比如通过 AAAI Phase 1、分数不错）时，就提醒申请邀请函；对录用概率高的论文，建议在出结果前预约面签。AAAI-27 从 11/30 起按护照国家从 2/16 倒推，设置“申请加拿大 TRV”提醒。
  - 日历事件：拒签退款资格的截止做成日历事件；如果该会的拒签退款政策能保证提前注册没风险，就建议提前注册。
  - 提醒：签证截止或退款截止前推送提醒，附材料清单（邀请函、在读证明、资金证明）。
- **来源**：https://neurips.cc/Conferences/2026/Visa ，https://icml.cc/FAQ/CancellationPolicy ，https://aaai.org/conference/aaai/aaai-27/main-technical-track-call/

### 38. 因公出国审批要提前 40 个工作日，还会被节假日吃掉 · 严重度 5

- **问题**：高校师生因公出国，要先过学校和外事办的审批，拿到批件和因公护照后才能办签证。很多学校要求至少提前 40 个工作日申请，去美国、加拿大、英国要提前 2 个月以上。等录用结果出来，往往已经来不及了。
- **例子**：南方科技大学要求“原则上需至少提前 40 个工作日申请”，江南大学要求去美、加、英至少提前 2 个月。以 NeurIPS 悉尼会场（12/6 开幕）为例：往前数 40 个工作日是 10/12；从 9/24 出结果到 10/12，扣掉中秋（9/25 起）和国庆（10/1–7）后，只剩 7 个工作日。上海交通大学要求回国后 7 个工作日内交回因公证照，1 个月内完成报销。
- **后果**：审批赶不上，只能自费因私出行（无法报销），或者干脆去不了。
- **功能**：planner 规则：用户选择所在学校（或自定义提前量），系统用考虑中国节假日和调休的工作日算法，从开会日期倒推“审批最晚提交日”。提醒：出结果当天立即提醒。日历事件：出行后自动生成“交回护照（7 个工作日内）”和“提交出访报告和报销（1 个月内）”两项任务。
- **来源**：https://global.sustech.edu.cn/business_category/guidelines

### 39. 每篇录用论文都要有作者注册，一份注册覆盖几篇各会不同 · 严重度 5

- **问题**：每篇录用论文都要在规定期限前有一个合格的作者注册，而且常常要求现场作者价、赶在早鸟截止前注册，否则论文会被移出论文集。一份注册能覆盖几篇、线上注册算不算，各会规则都不一样。一个组同时中好几篇时，费用很快就上去了。
- **例子**：
  - CVPR 2026：每篇主会或 workshop 论文都要有 AUTHOR 注册覆盖，"One registration may cover up to three papers"，"Virtual registrations will not cover a paper"。费用 625–1,200 美元（学生早鸟价 525–625 美元），5/13 后不退款。
  - EMNLP 2026：主会论文须在 9/11 前完成注册；一份注册最多覆盖 6 篇，前 1–2 篇收 200 美元，之后每篇 100 美元；线上报告半价。至少一位报告作者要在早鸟截止前注册，否则论文 "may be subject to rejection"。
  - KDD 2027：每篇论文都要单独一份 5 天全程现场注册，"regardless of overlapping authors"。
  - AAAI-27：必须按现场价注册，不满足注册和报告要求的论文 "will be removed before publication"。
  - ICRA 2027：作者注册截止 2027/3/5（1/31 出结果，2/6 开放终稿提交，早鸟 3/31，标准注册 5/14，5/24–28 在 Seoul 开会）。按 2026 年规则，非学生注册覆盖 2 篇、学生注册覆盖 1 篇，PaperPlaza 终稿上传码要付款后才发，未注册作者的论文会被移除。一个组有 5 篇录用、报告人全是学生，就需要 5 份注册；如果其中两人是非学生，则需要 3 份。
  - NeurIPS 2026：虚拟通行证不够；早鸟 10/30 截止，退款 11/4 截止。EACL 2027：报告作者须在早鸟截止前注册。
- **后果**：论文被移出程序和论文集；多付上千美元，或付了不可退的费用。
- **功能**：planner 规则：注册优化器按各会“一份注册覆盖几篇”的规则，算出覆盖全部录用论文所需的最少注册（按类型）和作者分配，比如 CVPR 每份注册最多装 3 篇。日历事件：每篇论文生成“register by”事件。提醒：比较早鸟价和标准价的预算，退款截止前提醒。
- **来源**：https://cvpr.thecvf.com/Conferences/2026/Pricing2 ，https://2026.emnlp.org/registration/ ，https://neurips.cc/Conferences/2026/Dates

### 40. NeurIPS 2026 三会场：录用后 6 天内要选好会场和报告人 · 严重度 4

- **问题**：NeurIPS 2026 的主会场在悉尼，另有亚特兰大和巴黎两个卫星会场。录用后要在很短时间内指定报告人和会场，分配结果出来后不能改。选哪个会场，取决于每位作者的签证、预算和学校审批。
- **例子**：2026-09-24 出结果，会场偏好表 9/30 AoE 截止，10/6 公布分配结果，之后不能更换。已在其他会场注册的人，要在 11/4 前取消才能全额退款。只买 Virtual Only Pass 不满足作者注册要求，没人到场可能被撤销发表。悉尼 12/6–12，亚特兰大和巴黎 12/9–13。澳大利亚 600 签证商务类别的审理时间约 6–26 天。
- **后果**：选了一个作者拿不到签证的会场，论文就可能被撤。
- **功能**：会场选择助手：按合作者逐一对比悉尼、亚特兰大、巴黎三地的签证可得性、审理时长、机票和注册费，推荐报告人和会场。提醒：在偏好表截止（9/30）、公布分配（10/6）、退款截止（11/4）三个时间点提醒。
- **来源**：https://blog.neurips.cc/2026/08/27/navigating-neurips-2026-a-breakdown-of-the-multi-site-registration-process/

### 41. 早鸟、退款、资助截止和经费年度 · 严重度 3

- **问题**：跟钱有关的截止都集中在录用之后，和 camera-ready 挨着，又早于签证结果。注册费、APC 和差旅费还要从正确的基金科目支出，赶在基金到期或用完之前。国内高校 12 月中旬前后因年终决算冻结报销。学生常常要为几篇论文先垫付几千美元。
- **例子**：
  - NeurIPS 2026：资助申请 10/6 AoE 截止（10/14 出结果），资助覆盖注册费和最多 7 晚酒店，不含机票；志愿者和资助不能兼得；早鸟 10/30，退款 11/4；会议 12/6–13（悉尼、亚特兰大、巴黎）。差旅和注册费正好落在学校年终关账的时候，而下一年的经费还没到位。
  - EMNLP 2026：早鸟 9/24 截止；9/24 前退款扣 50 美元，10/8 后不退。
  - CVPR 2026：5/13 前取消收 65 美元手续费，之后不退。
  - ICRA 2027：早鸟 3/31，标准注册 5/14。
- **后果**：多付几百美元；拒签后退款拿不回来；失去差旅资助；费用没法从预定的基金报销，学生垫款好几个月，或者费用记到了错误的财年。
- **功能**：
  - 日历事件：每篇录用论文一条“钱的时间线”（资助、早鸟、退款、取消手续费），并提示“先申请资助，再注册”。
  - planner 规则：成本预测（注册费、额外论文、APC、超页费、差旅）挂到选定的基金和它的到期日上；提醒机构年终截止和基金到期；给 PI 一个组级现金流视图。
- **来源**：https://neurips.cc/Conferences/2026/FinancialAssistance ，https://neurips.cc/Conferences/2026/Dates

### 42. 报销有时限，票据要求细，容易漏 · 严重度 3

- **问题**：开会回来后，报销对票据格式、时限、外汇折算都有细致要求，漏一项就可能报不了。这些事项分散在不同时间点，很难记全。
- **例子**：哈尔滨工业大学要求参会后 30 个工作日内提交报销。清华 PACMAN 实验室的指南写明“每个自然年的发票报销日期最晚是下一年的三月底”。注册费、住宿费的票据要有 Invoice 或 Receipt 字样；刷信用卡付款的，要附对账单和当天的外汇牌价。还要提交参会证明（程序册上有本人姓名的页面，或会场照片）。因公出国原则上要乘坐国内航空公司的航班。
- **后果**：几千到上万元报不了，或者影响下一次出国审批。
- **功能**：提醒：出行前推送“票据清单”（要 Receipt，不能只有 Invoice；拍下程序册页面；保留登机牌）。日历事件：回国后自动设置报销截止提醒（30 个工作日、次年 3/31）。支持拍照归档票据。
- **来源**：https://pacman.cs.tsinghua.edu.cn/guide/finance/

### 43. 机器人 demo 和硬件出行：电池、运输、海关 · 严重度 3

- **问题**：做现场 demo 或要带硬件的机器人研究者，面对的是前置时间很长的后勤：航空锂电池规定（备用电池不能托运，超过 100Wh 的电池要审批或根本不能上飞机）、货运和海关手续（临时进口用的 ATA carnet）、demo track 的电源和场地申请，以及只能现场报告的规定。这些都不在会议时间线里。
- **例子**：IATA：'Spare batteries are not allowed in checked baggage.' ICRA 2027（Seoul，2027 年 5 月）只接受现场报告："If there is no on-site presenter, the paper will be considered as no-show and skipped."
- **后果**：demo 跑不起来，硬件被扣在海关或机场，或者论文被记为 no-show。
- **功能**：日历事件：录用时生成“硬件 demo”清单，包括电池 Wh 清点、航空公司规定、从出行日倒推的货运或 ATA carnet 申请日，以及 demo track 电源和场地申请的截止。
- **来源**：https://www.iata.org/en/programs/cargo/dgr/lithium-batteries/

### 44. 酒店 block、官方住宿门户和订房诈骗 · 严重度 2

- **问题**：会议合作酒店的 block 截止比会期早得多，有的会议要求必须通过官方住宿门户预订。录用作者会收到非官方“住宿代理”和仿冒网站的邮件。中国作者办签证需要酒店预订，既要早订，又要能退。
- **例子**：CVPR 2026 酒店 block：Hyatt Regency Denver 'Reservations must be made before May 11th'（会议在 6 月）。NeurIPS 2026：优惠价 'must be booked through the official Housing Portal ... not directly with any hotel or third party, which risks losing your rate or booking through an unauthorized site.'
- **后果**：多花很多钱或住得很远，或者被假代理骗钱。
- **功能**：日历事件：每个会议的住宿截止。论文的出行卡片上置顶官方门户链接；用户粘贴或点开的订房域名和官方域名不一致时发出警告。
- **来源**：https://neurips.cc/Conferences/2026/Hotels

---

## 开会

### 45. 录用不等于发表：必须有人现场报告，还有视频和海报要上传 · 严重度 4

- **问题**：已经录用的论文仍可能丢掉：没人到场、报告人只买了线上注册，或者会场容量不够。报告和媒体材料的要求在 camera-ready 之后很久才来，容易被忘。组里很少安排一位持有效签证的备用报告人。
- **例子**：
  - NeurIPS 2026：至少一位作者要注册主会，虚拟通行证不够，没人到场可能被撤销录用。NeurIPS 2025：广泛流传的报道（如 Nathan Lambert 在 X 上）称，约 400 篇 AC 已接收的论文因场地限制被砍；PC 则称主会仍未超出容量。
  - AAAI-27 不允许远程报告，未事先告知就缺席的论文会被移出论文集。ICRA：没有现场报告人的论文算 no-show，直接跳过。
  - CVPR 2026：5 分钟 YouTube 视频 5/20 AoE 截止，"even if your poster and video are not final"；海报缩略图和可选的海报 PNG（最大 5120×2880、10 MB）6/3 截止，约在出结果 3 个月后。NeurIPS 2025：海报主题 11/9 截止，workshop 的幻灯片和视频 11/5 截止上传。
- **后果**：论文被移出论文集，或被记为 no-show，在线上程序里失去曝光。
- **功能**：
  - 每篇录用论文跟踪报告人：指定报告人和备用报告人，以及他们的会场、签证状态和注册状态。一个人要报告太多篇，或者 T-30 天还没有一位报告人持有效旅行证件时，发出预警。
  - 提醒：视频、海报、幻灯片、缩略图的上传提醒，附格式检查（文件大小、像素上限）。
- **来源**：https://x.com/natolambert/status/1969077159525257301 ，https://cvpr.thecvf.com/Conferences/2026/YouTubeVideoPosterUpload

### 46. 海报打印和现场物料因会场而异 · 严重度 2

- **问题**：海报尺寸和方向各会不同，同一个会议的不同会场也可能不同。打印服务有下单截止，贴晚了的海报可能被清走。NeurIPS 2026 这种多会场会议（悉尼、亚特兰大、巴黎）更麻烦，是带海报筒过去还是在当地打印，都要提前计划。
- **例子**：NeurIPS 2025：圣地亚哥主会海报 96 × 48 英寸横版，workshop 和墨西哥城用 24 × 36 英寸竖版。圣地亚哥打印服务的早鸟价 2025/11/12 截止。
- **后果**：海报尺寸不对，现场加急打印很贵，或者报告时没有海报。
- **功能**：会场分配公布后（NeurIPS 2026：10/6）显示该会场的海报规格。提醒：按打印服务的截止安排“设计海报”和“打印下单”两个提醒。
- **来源**：https://neurips.cc/Conferences/2025/PosterInstructions

---

## 贯穿全程

### 47. 一稿多投锁定期决定哪些后续截止够得着 · 严重度 5

- **问题**：论文一旦投出，在出结果或撤稿之前都被占住；有的会还规定在一段固定的审稿期内不能投相似的稿件，workshop 也算在内。11 月选了 A 会，就悄悄排除了 1 月的 B 会。ARR 可能要求在投稿时就做出有约束力的目标会选择。会议之间会大规模交叉查重。多篇论文、多个会议一起规划时，很容易排出违规的计划。
- **例子**：
  - CVPR 2027 规定，2026/11/16 到 2027/2/22 之间，不能把实质相似的论文投到其他会议或 workshop。所以同一篇论文既不能投 ICML 2027（tracker 上列的是约 2027/1/16 或 1/22，尚未官方公布；约 1 月下旬截稿），也不能投 ICLR 2027 的 workshop（通常 1–2 月截止）。
  - AAAI-27：出结果（11/30）或撤稿前，不能投别处。
  - EMNLP 2026 5 月周期：作者须 "explicitly declare which conference they intend to commit to at submission time"，而且这个选择有约束力。
  - NeurIPS 禁止在审期间投其他 archival 会议，作者有重叠的并行投稿可能两篇都被拒。ECCV 规定，经同行评审且超过 4 页（不含参考文献）的 workshop 论文算正式发表。
  - AAAI-26 与 9 个审稿期重叠的会议交叉比对，因一稿多投 desk reject 了 141 篇。
- **后果**：因一稿多投被 desk reject（两边都拒，被记为学术不端，可能受到伦理处罚），或者太晚才发现最合适的下一站已经赶不上了。
- **功能**：
  - planner 规则：每篇论文建模为一个锁定区间 [投稿, 出结果]，日历上显示“锁定期”色块；Gantt/what-if 视图显示每篇论文还能赶上哪些截止。
  - 硬规则：同一篇论文（或关联的兄弟论文）的锁定期重叠时，计划会被标记或拒绝。做有约束力的选择之前，显示每个选项会排除哪些后续路线。
  - 检查：workshop 计划要核对页数（≤4 页）和是否 archival。
- **来源**：https://cvpr.thecvf.com/Conferences/2027/CallForPapers

### 48. 一次投稿背后是一整条义务链，需要会议全周期模板 · 严重度 5

- **问题**：“投了 ICLR 2027”这一条记录背后有十来个带日期的义务，tracker 通常只记截稿日，漏掉审稿义务、签证退款截止这类节点。AAAI 还是两阶段审稿，Phase 1 被拒不能回应。
- **例子**：
  - ICLR 2027：9/18 AoE 摘要截止，此后不能增删作者，reciprocal reviewer 资格按此日前已录用的论文确定；9/18–25 审稿人竞价；9/25 AoE 全文、补充材料和强制 AI 使用声明同时截止，每位作者都要有 OpenReview 资料（没有机构邮箱的审核最长 2 周）；10/1–21 作者兼审稿人交审稿，交完前看不到自己的审稿；11/5 发布审稿；11/5–18 公开讨论，PDF 可改到 10 页，评论条数不限但每条有字数限制；12/16 出结果；2027 年 2 月中旬发 camera-ready 说明，须有一位作者注册 Conference and Workshops；2027/3/17 前递签才有拒签退款资格；2027/4/26–30 在 California 开会。
  - AAAI-27：6/17 在 OpenReview 开放作者注册；7/21 摘要；7/28 全文，也是改作者名单的最后一天；7/31 补充材料和代码；9/24 Phase 1 拒稿，不能回应；10/19–25 作者反馈；11/30 出结果；12/14 camera-ready，含版权转让和一份签字承诺，保证会有作者现场报告；2027/2/16–23 在 Montréal 开会，须有一位作者按现场价注册，没有远程选项，没人报告的论文会被移出论文集；每人最多 10 篇投稿。
- **后果**：被 desk reject（没有注册审稿人、资料有问题、缺 AI 声明）；自己的审稿被扣下；拒签时拿不到退款；错过反馈窗口；没人报告被移出论文集；加拿大签证太晚。
- **功能**：日历事件：会议模板把一条“已投 ICLR 2027”自动展开成约 10 个日历事件，包括 tracker 通常漏掉的审稿义务和签证退款截止。planner 规则：两阶段状态机（Phase 1 → Phase 2 → 出结果），每推进一个状态就自动生成后续事件。
- **来源**：https://iclr.cc/Conferences/2027/AuthorGuidelines ，https://aaai.org/conference/aaai/aaai-27/main-technical-track-call/

### 49. LLM 政策按会议、按角色都不同，截止前还在变 · 严重度 5

- **问题**：各会的 LLM 规则不一样：ICLR 以披露为主，ICML 要在投稿时选 Policy A 或 B，CVPR 和 ARR 禁止在 PDF 里藏 prompt injection。作者作为审稿人时，还要受几个月前自己选的政策约束。CVPR 2027 的 CFP 都发布了，LLM 政策还写着 "being finalized"。常见的失败点包括：PDF 里有隐藏文字或白色文字，以及合作者作为审稿人违反了自己选的 LLM 政策。
- **例子**：
  - NeurIPS：LLM 是重要或非标准组成部分时要披露。ICLR 2027：强制写 AI 使用声明，LLM 产生的错误内容按伦理违规处理；ICLR 曾公开 desk reject 含幻觉引用和未披露 LLM 使用的论文。AAAI-27：禁止 LLM 生成的文本（作为实验分析的一部分除外），润色可以。ARR：在清单和致谢里披露，并 desk reject "text designed to manipulate machine readers"。ICRA：在致谢里披露。ICML 2026：作者和审稿人都要声明 Policy A 或 B。
  - CVPR 2026：prompt injection（写给 LLM 审稿人的隐藏指令）算伦理违规，直接 desk reject。
  - CVPR 2027 CFP（截至 2026 年 9 月）：LLM 规则 "currently being finalized"，'will be updated with further details before the submission deadline'（11/16），作者要在临近投稿时重新核对。
- **后果**：被 desk reject 或留下伦理违规记录；作为审稿人违规，还会连累自己的论文被 desk reject。
- **功能**：
  - 每个会一张“LLM 政策卡”，分作者和审稿人两种角色，并记下用户的选择（如“你在 ICML 选了 Policy A”）。提醒：给每位兼任审稿人的合作者，提醒他自己选的 LLM 政策。
  - 提醒：快照各会的 LLM 政策页和作者指南页，文字一变就推送 diff。
  - 检查：linter 标出 PDF 里白色、零字号或在页面外的文字。
- **来源**：https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines ，https://iclr.cc/Conferences/2027/AIPolicyForAuthors ，https://blog.iclr.cc/2025/11/19/iclr-2026-response-to-llm-generated-papers-and-reviews/

### 50. 会议在国内的认可度会变：CCF 目录调整和制裁政策风波 · 严重度 5

- **问题**：国内毕业、评职称、申请基金、招聘都看 CCF 目录和各机构的认定口径，而这些口径会变。和美国制裁名单挂钩的资格规则也可能突然改变，影响投稿、参会和资助。作者往往是从新闻或抵制行动里得知的，而不是会议通知。选会时不知道最新口径，论文中了也可能“不算数”或者降了级。
- **例子**：
  - CCF 第七版目录（2026/3/5–12 公示，3/31 发布）：ICLR 首次入选就是 A 类，IJCAI 从 A 降为 B；新增 23 个会议，升级 5 个。传统的“AAAI 被拒 → 1 月投 IJCAI”路线，对 CCF-A 要求的价值下降了。
  - NeurIPS 2026 在 3/23 加入按美国 OFAC 制裁名单拒收论文的条款（另一来源的说法是：2026-03-27 那一周，NeurIPS 发布了拒收任何美国制裁实体论文的政策）。CCF 在 3/25 呼吁抵制，并警告要把 NeurIPS 移出目录。中国科协（CAST）从 3/27 起停止受理参加 NeurIPS 2026 的资助申请，其收录论文在科协项目中不作为代表作认可。NeurIPS 在 3/27 把规则改回只针对 SDN 名单，事后道歉并修改了条款。
  - ICLR 2027 把 "affiliation with sanctioned entities per OFAC" 列为 desk reject 标准之一。
- **后果**：论文中了，却不被学校或资助方认定为 A 类或代表作；花一个周期投了一个已经不满足毕业或考核要求的会；被 desk reject，或失去机构的差旅资助。
- **功能**：
  - 会议元数据加“认可度”字段：带版本号的 CCF 等级（CCF 2022 vs 2026）、CORE、中科院分区，以及用户自填的本校口径。
  - planner 规则：用户设定目标（如“毕业需要 2 篇 CCF-A”），planner 按每个候选会对目标的贡献打分。
  - 提醒：目录更新、资助方声明、会议制裁条款变化时推送，并标出受影响的在投和计划中的论文。可选：合作者单位命中公开的制裁名单时，给出一个仅供参考的标记，并附资助方通知的链接。
- **来源**：https://news.qq.com/rain/a/20260402A03UVY00 ，https://zhuanlan.zhihu.com/p/2022435758171005942 ，https://www.yahoo.com/news/articles/china-boycotts-top-ai-conference-065826433.html

### 51. 规则和时间线中途变更，只在博客或 X 上宣布 · 严重度 4

- **问题**：日期会因服务器负载、平台宕机或安全事件而变，规则（投稿上限、审稿义务、LLM 政策，甚至审稿流程本身）也可能在截止前几周或讨论期中途修改。变更消息分散在博客、X、邮件列表和邮件里，组里的 wiki 和 tracker 很快就过时了；第三方 tracker 还会在官方公布前放出非官方日期。作者往往凭去年的记忆做计划。
- **例子**：
  - ICLR 2026：2025/11/27 OpenReview API 漏洞泄露了审稿人身份。之后所有分数被回退到 rebuttal 之前，讨论被冻结，每篇论文重新分配 AC，meta-review 期限延长，涉及串通的论文被 desk reject。
  - ICRA 2027 因服务器负载把截止延长 24 小时（9/16 当天宣布），9/17 又修改了视频窗口。2025 年 9 月的一次 OpenReview 宕机，影响了截止时间是 12:00 UTC 的人。
  - ICML 2027 的日期（约 1/16 或 1/22）在官方 CFP 发布前就已经在 tracker 上流传。EMNLP 2026 的 camera-ready 官网写 8/30，别处写 9/20。
  - ICLR 在 2026/9/2（摘要截止前 16 天）才宣布 20 篇上限和“无合格审稿人的论文最多 1 篇”的规则。arXiv CS 从 2025/10/31 起拒收没有同行评审证明的综述和立场论文。CVPR 2027 的 LLM 政策还没定。
- **后果**：按错的日期做计划，要么白白提前恐慌，要么错过已经改期的截止；违反新规；流程被重置，rebuttal 白做；按已经作废的分数决定去留。
- **功能**：
  - 真相源监控：轮询官方日期页、博客 RSS 和会议的 X 账号。每个日期带状态（官方 / 非官方 / 已变更）和版本历史。
  - 抽取结构化的规则字段（投稿上限、审稿义务、LLM 政策、一稿多投窗口、页数），字段变化时只提醒有论文受影响的用户，显示前后 diff 和受影响的论文。
  - 日历事件：自动更新用户的日历事件，并发送“时间线已变更”通知。
- **来源**：https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/ ，https://blog.iclr.cc/2025/12/03/iclr-2026-response-to-security-incident/ ，https://blog.iclr.cc/2026/09/02/submission-policies-for-iclr-2027/

### 52. 毕业、评奖、求职的截止日和出结果、出版时间对不上 · 严重度 4

- **问题**：国内的国奖、学业奖学金、预答辩和学位申请都有成果统计截止日，有的学校“只认正式发表”，光有录用通知不算。一个会的价值，还取决于它出结果的时间和个人里程碑（预答辩、送审、教职申请、秋招）的先后。会议出结果和论文集上线之间差好几个月，而 deadline tracker 完全不管这些。
- **例子**：
  - 2026 年研究生国家奖学金：上海海洋大学的成果统计截至 2026/8/31，9/18 前申报。厦门大学电子科学与技术学院写明“有录用通知但未正式发表的科研成果不参加评选”，所以 9/24 才被 NeurIPS 2026 录用的论文，赶不上今年的国奖。南京大学计算机博士的毕业条件之一是“CCF-A 类论文一篇加 CCF-C 类论文一篇以上，其中一篇必须是期刊”。
  - 北京大学 2026 年夏季博士毕业时间表：3/6 前预答辩，3/20–30 提交送审材料，5/30 前答辩。ICML 2026 在 4/30 出结果，赶不上预答辩；CVPR 2027 在 2027/2/25 出最终结果，早于 3 月的预答辩。
  - 美国教职申请约 11/15 开放，多数在 12 月到 1 月初截止。2027 届的提前批在 2026 年 5–7 月开启。
- **后果**：论文中了，却算不进今年的评奖、毕业或求职，要多等一年，毕业或 offer 跟着推迟。
- **功能**：
  - 用户录入本校的毕业和评奖规则（需要几篇、什么类别、统计截止日、只认录用还是只认发表），以及个人里程碑（预答辩、送审、申请截止、实习开始）。
  - planner 规则：在时间线上标出每个会的出结果日在各个里程碑之前还是之后，倒推每篇论文“最晚需要录用或出版”的日期，优先推荐能赶上的会。
  - 提醒：统计截止前 30 天提醒整理材料、开图书馆检索证明；每次录用时提醒更新简历和个人主页。
- **来源**：https://ese.xmu.edu.cn/info/1054/35721.htm ，https://www.aais.pku.edu.cn/info/1352/18381.htm

### 53. 日历订阅更新慢，提醒不可靠 · 严重度 4

- **问题**：订阅 ICS feed 是把 deadline 放进日历最直接的办法，但 Google 每 12–24 小时才刷新一次订阅的 feed，而且不能手动刷新，截止延期或日期更正可能来得太晚。订阅 feed 里的 VALARM 提醒会被 Google 忽略，可能被 Apple 去掉（'Remove alerts'），在某些客户端里又会响个不停、没法静音。RFC 7986 的 REFRESH-INTERVAL 只是建议，规范让客户端大约每天拉取一次。
- **例子**：ICRA 2027 的 2026/9/15 截止延长了 24 小时到 9/16（PT），Google Calendar 订阅者最多可能晚一天才看到。feed 发布方在 ICS 导出里设的提醒，到不了通过 URL 订阅的 Google Calendar 用户。
- **后果**：日历上显示的是错误的日期，或者提醒根本没响。
- **功能**：分两条渠道。ICS feed 只承载事实：稳定的 UID，每次变更递增 SEQUENCE，带上 REFRESH-INTERVAL 和 X-PUBLISHED-TTL。提醒走 app 自己控制的渠道（推送、邮件、微信或 Telegram），或者在用户同意后，通过 Google Calendar 或 CalDAV API 写成逐事件提醒。延期、新规这类紧急变更直接推送，不等 feed 刷新。
- **来源**：https://www.usecarly.com/blog/google-calendar-ics-refresh-rate/

### 54. 中国节假日（春节、中秋、国庆）和截稿、rebuttal 撞在一起 · 严重度 3

- **问题**：海外会议排日程不考虑中国的假期。撞上假期时，导师和合作者不在线，学校的审批和财务停摆，签证中心也关门；春运出行会挤占 rebuttal 时间，集群还可能在假期维护。中国的放假安排包含调休，而且只提前约 3 个月公布。美国的节假日和圣诞节也会影响欧美的合作者。现有的 deadline 网站都不叠加中国节假日和调休。
- **例子**：
  - ICLR 2027 全文截止 9/25 正好是 2026 年中秋节。KDD 2027 Cycle 1 的 rebuttal 期（9/29–10/13）跨过国庆假期（10/1–10/7，10/10 周六调休上班）。
  - 2027 年初更挤：ICML 2027 截稿（第三方按往年推测，约 1/22）、CVPR 2027 rebuttal（1/25–2/1，审稿 1/25 发布）、KDD 2027 Cycle 2（约 2 月初）连在一起，而除夕是 2/5，春节是 2/6。
  - 2026 年：CVPR rebuttal（1/22–29）和 ICML 全文截止（1/28）重叠，IJCAI 全文截止（1/19）之后紧接着缴费截止（1/26）；春节假期 2/15–23，2/14 和 2/28 调休上班，国务院 2025/11/4 才公布这个安排。往年也有先例：KDD 2024 的截稿日就是大年三十 2/8。
  - 美国感恩节（2026/11/26）落在 ICLR 审稿人讨论期和 ARR 作者回复期之内。
- **后果**：过年期间赶稿，还拿不到导师的意见；rebuttal 期间找不到合作者补实验。
- **功能**：
  - 日历叠加国务院公布的法定假日和调休，并按每位合作者的所在地叠加美国和欧盟的节假日。
  - 提醒：某个义务落在任一合作者假期的前后 3 天内，或截止、rebuttal 窗口前 7 天内有假期时，自动预警。
  - planner 规则：把内部里程碑（导师审稿、实验冻结）提前到假期之前，排期按工作日计算。国务院公布 2027 年放假安排后（预计 11 月初）自动刷新。
- **来源**：https://cvpr.thecvf.com/Conferences/2027/CallForPapers ，https://www.news.cn/politics/20251104/37410b5829274623a8b98cca50cf640d/c.html

### 55. 通知太多，重要的反而被忽略 · 严重度 3

- **问题**：研究者本来就被 OpenReview 邮件淹没了。一个对每个 CFP、每个截止、每次变更都推送的 tracker，几周内就会被静音，然后那条能避免 desk reject 的提醒也就错过了。好的工具会把提醒发给真正负责的人，把低优先级的内容打包成摘要，任务完成后停止提醒，并避免在多个设备上重复提醒。
- **例子**：OpenReview 曾经在每次修改时给每位合作者都发邮件，有人一晚上收到多达 50 封。ECCV 投稿期产生了 55,000 多封作者邮件。行业数据显示，约 43% 的用户因为通知太多而关掉通知。RFC 9074 增加了 ACKNOWLEDGED 属性，在一台设备上关掉提醒，其他设备上的也会一起清掉。
- **后果**：用户把 app 静音，结果错过那条本可避免 desk reject 的提醒（合作者资料、审稿截止、withdraw-by 日期）。
- **功能**：分级提醒。可能导致 desk reject 的硬性义务在 T−14/7/3/1 天和 T−6 小时逐级升级，只发给负责人；其他内容（新 CFP、与你无关的政策变化）进每周摘要。免打扰时段按用户本地时区设置。点“确认/完成”就关闭任务，所有设备上的提醒链一起停止。用户可以单独静音某篇论文或某个会议。
- **来源**：https://github.com/openreview/openreview/issues/70

### 56. 关键系统邮件被垃圾箱、旧邮箱或学校邮件服务器吞掉 · 严重度 3

- **问题**：审稿分配、desk reject 通知、紧急审稿请求、资料审核结果和录用决定，都是通过邮件发送的，而且通常发到 OpenReview、CMT 或 PaperCept 资料里排在第一位的邮箱。这个邮箱可能是已经失效的学生邮箱，也可能是会过滤群发邮件的 edu.cn 邮箱。漏掉一封审稿义务相关的邮件，就可能连累自己的论文被 desk reject。
- **例子**：OpenReview 的 FAQ 自己就提醒用户 'Check that the email was not sent to a spam or junk folder'，并建议尝试 'a different email that is listed in your profile (such as personal email, previous institutional email)'。
- **后果**：错过审稿截止，导致自己的论文被 desk reject；或者对录用决定、紧急请求反应太慢。
- **功能**：邮件监控集成（Gmail 或 IMAP 过滤器，或转发规则），覆盖 OpenReview、CMT、PaperCept 和 ARR 的发件人；再加上直接轮询 OpenReview API，这样即使邮件没到，状态变化也会生成提醒。提醒：每年提醒一次“检查资料里排在第一位的是哪个邮箱”。
- **来源**：https://docs.openreview.net/getting-started/frequently-asked-questions/i-didnt-receive-a-password-reset-email-what-do-i-do

### 57. 合作者分工不清，有人离开时没人交接 · 严重度 3

- **问题**：一篇论文有 5–10 位作者时，每个人都以为别人会去注册、报告、做 camera-ready 或承担审稿义务。实习生在出结果前就离开公司，失去算力和账号权限；学生在投稿和开会之间毕业。一位挂名 20 篇以上学生论文的 PI，没有一个地方能看清每件事由谁负责。
- **例子**：ACL 2026："Papers without at least one presenting author registered by the early registration deadline may be subject to desk rejection." NeurIPS 2026："We reserve the right to revoke accepted publication status if no authors registered and presented the paper."
- **后果**：论文被撤销或移出论文集，或者 rebuttal 没人回复。
- **功能**：给每篇论文分配角色：rebuttal 负责人、注册人、报告人、camera-ready 负责人、审稿义务承担人，每个角色都配一位备份。提醒：某个角色在对应关口前 7 天还空着，就升级提醒给 PI。设置了某位作者的离职或毕业日期时，启动交接流程。
- **来源**：https://2026.aclweb.org/calls/main_conference_papers/

### 58. 组织者的截止要早 6–9 个月 · 严重度 2

- **问题**：导师和资深研究者还要申请办 workshop、tutorial、竞赛，或被提名 area chair。这些提案截止比论文截止早得多，而且常在别的忙碌期里。提案通过后，组织者还要承担第二条义务链（CFP、审稿、通知作者），正好和学生的投稿期重叠。
- **例子**：NeurIPS 2026 的 workshop 提案在 2026/7/11 前公布录用结果。之后组织者发布论文征稿，建议截止为 8/29，9 月审稿，正好压在 ICLR 2027（9/18 和 9/25）和 CVPR 2027 的准备期上。
- **后果**：错过提案窗口，或者组织工作过载，拖慢学生的论文。
- **功能**：“组织者模式”：跟踪提案截止，生成组织者时间线，叠加到课题组的论文日历上，负载重叠时发出警告。
- **来源**：https://neurips.cc/Conferences/2026/CallForWorkshops

### 59. 各种 opt-in/opt-out 小选项有自己的时间窗，经常被忘 · 严重度 2

- **问题**：投稿表单和出结果后的页面里藏着一些影响不小的选项，各有时间限制。例如 AI 审稿实验（投稿时选择加入，之后可以发邮件撤回同意），以及把被拒论文在 OpenReview 上公开（出结果后 2 周内）。这些都不在任何人的日历上，却会影响论文在下一个会的匿名性。
- **例子**：NeurIPS 2026："Authors of rejected papers will have two weeks after the notification date to opt in to make their deanonymized rejected papers public"，对今天（9/24）的通知来说，大约到 10/8。NeurIPS 2026 和 EMNLP 2026 的 AI 审稿实验要求作者在投稿时选择是否加入。
- **后果**：失去公开审稿意见的机会，或者不小心让一篇还要投其他双盲会议的论文去匿名。
- **功能**：每篇论文把所有 opt-in/opt-out 的选择记进一份“决策日志”。提醒：窗口截止前提醒；如果论文还计划投其他双盲会议，同时发出警告。
- **来源**：https://neurips.cc/Conferences/2026/MainTrackHandbook

---

## 提醒功能清单

下表去重汇总了上面各条隐含的全部提醒和日历事件类型。T-x 表示截止前 x 天，T+x 表示事件发生后。

### 截止与里程碑

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 摘要 / 论文登记截止 | T-7 / T-2 / T-1 天，倒计时 | 10, 11 |
| 全文截止（官方截止 + 内部截止，默认提前 48 小时） | T-7 / T-2 / T-1 天，按小时倒计时，本地时间显示 | 10, 15 |
| 补充材料、代码、视频、清单截止（各自独立） | 各自的提醒偏移 | 10 |
| 作者名单冻结 | 冻结前 72 小时发事件，48 小时清单项 | 11 |
| 登记门槛检查（如 CVPR 2027 登记） | 登记前 3 天 | 11 |
| 非主要论文费缴纳 | 缴费截止 | 2 |
| J2C 申请 / RA-L 转投截止 | 期刊录用时生成，附资格结束日 | 28 |
| workshop 截止（附 archival 属性和页数） | 主会出结果前 | 29 |
| 组织者提案截止与组织者时间线 | 提案截止 | 58 |

### 投稿前准备

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 合作者 OpenReview 资料检查 | 最早门槛前 T-21 天（3–4 周），T-14 标红，T-3 点名 | 1 |
| 冲突声明修正 | 摘要 / 登记截止前 7 天 | 3 |
| 投稿上限预警 | 某人达到上限的 80% 或 cap−2 | 2 |
| 导师初稿 / 保密审查 / 导师反馈 | T-10 / T-7 / T-5（按机构可调） | 6 |
| GPU 配额或预约申请 | 提前 N 周 | 7 |
| 算力报告表 | 随补充材料截止 | 7 |
| 专利申请倒排（披露 → 法务 → 申请） | 首次公开事件之前 | 4 |
| 伦理审批里程碑 | 数据采集开始前 | 9 |
| 数据集托管任务 | T-21 / T-14 / T-7 / T-2；上传演练在截止前一周 | 5 |
| 相关论文互引、附匿名副本 | T-7 | 17 |
| 综述 / 立场论文录用后上传 arXiv | 录用后 | 8 |

### 提交前检查

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| preflight（必填小节、清单、模板、页数、匿名） | T-3 | 13, 16 |
| 引用核查与 AI 使用声明 | T-5，清单结果 T-3 | 14 |
| 匿名链接验证（未登录浏览器） | T-3 | 18 |
| LLM 政策卡确认 | 投稿前；政策文字变化时 | 49 |

### 投稿后与审稿期

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| ARR 服务贡献者注册倒计时 | 投稿后 T+1h / T+24h / T+44h | 12 |
| 合作者注册审稿人 | 投稿后 24 小时内 | 12, 27 |
| 审稿任务截止 | T-7 / T-3 / T-1，附“会连累哪些论文” | 19 |
| 审稿工时时间块 | 截止前按工时排入日历 | 20 |
| lockout 风险警报 | rebuttal 窗口开启时还没审完 | 19 |
| PI 每周审稿进度摘要 | 每周 | 19 |
| crunch forecast | 提前 4–6 周 | 20 |
| 撞车日标记 | 48 小时内有 2 个及以上义务 | 20 |
| 审稿发布前准备 | 发布前 7 天（预约 GPU、空日程），3 天（商定去留阈值） | 21, 26 |
| rebuttal 窗口 | 日历块，关闭前 24 小时提醒，换算成北京时间 | 21 |
| 伦理审稿回复任务 | 出现伦理审稿时 | 24 |
| 宣传 / 预印本静默期 | 日历块，结束时提醒“可以发了” | 22 |
| arXiv 提交截止时间 | 按用户时区换算，含节假日安排 | 22 |
| 官方出结果时刻（平静模式） | 只在官方发布时刻提醒 | 23 |

### 出结果与转投

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 对冲摘要决定 | 下一站摘要截止前至少 3 天（“摘要截止 − 出结果日”为负时） | 25 |
| “若在别处录用，全文截止前撤回” | 挂在出结果日 | 25 |
| 结果之夜清单 | 出结果当天 | 25 |
| decide-by / withdraw-by | 按“论文 × 目标会”计算 | 26 |
| 撤稿受罚时间点（如 ARR 截稿后 48 小时） | 该时间点之前 | 26, 27 |
| ARR commit 还是修改的决策 + commit 截止 | meta-review 发布时，commit 截止前 | 27 |
| 被拒论文公开的 opt-in 窗口 | 出结果后 2 周内 | 59 |
| 导出审稿意见 | 出结果当天 | 30 |

### 录用后与 camera-ready

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 录用后任务链（会场、报告人、资助、camera-ready、版权、注册、邀请函、海报、视频、报销） | 标记录用时生成，任务带依赖 | 31 |
| TBD 日期自动填入 | 官方页面更新时 | 31 |
| 出版方流水线（eCopyright、PDF eXpress、consent-to-publish、超页费） | camera-ready 前 | 32 |
| APC / 总成本预估 | 选会时、录用时 | 33 |
| 恢复致谢和基金号 | camera-ready 时 | 34 |
| 录用函申请；DOI / 检索记录出现 | 录用后；记录出现时 | 35 |
| 开源承诺任务 | camera-ready 与开会日 | 36 |

### 注册与出行

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 会场偏好表 / 分配公布 / 退款与改注册截止（NeurIPS 2026：9/30、10/6、11/4） | 各节点 | 31, 40 |
| 资助申请（先申请资助再注册） | 资助截止 | 41 |
| 作者注册截止（register by） | 每篇论文 | 39 |
| 早鸟 / 退款 / 取消手续费截止 | 各节点 | 39, 41 |
| 签证：letter-by、apply-by、拒签退款资格截止、建议提前预约面签 | 从开会日倒推；出现早期信号时 | 37 |
| 因公出国审批最晚提交日 | 按工作日倒推，出结果当天提醒 | 38 |
| 交回因公护照 / 出访报告与报销 | 回国后 7 个工作日 / 1 个月 | 38 |
| 出行前票据清单 | 出行前 | 42 |
| 报销截止 | 回国后 30 个工作日；次年 3/31 | 42 |
| 机构年终关账 / 基金到期 | 按机构和基金设置 | 41 |
| 酒店 block 截止 | 各会住宿截止 | 44 |
| 硬件 demo（电池清点、货运或 ATA carnet、demo track 申请） | 从出行日倒推 | 43 |
| 报告人缺失预警 | T-30 天还没有持有效证件的报告人 | 45 |
| 角色空缺升级给 PI | 关口前 7 天 | 57 |

### 开会

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 视频 / 海报 / 幻灯片 / 缩略图上传（附格式检查） | 各上传截止 | 45 |
| 海报设计与打印下单 | 会场分配后，按打印服务截止 | 46 |

### 贯穿全程

| 类型 | 触发 / 提前量 | 相关条目 |
|---|---|---|
| 政策变更 diff（LLM、投稿上限、审稿义务、制裁条款、CCF 目录） | 页面或字段变化时，只推给受影响的用户 | 49, 50, 51 |
| 时间线变更，自动更新日历 | 官方日期变化时，直接推送，不等 feed 刷新 | 51, 53 |
| 节假日预警 | 义务前 7 天内有假期，或在合作者假期前后 3 天内 | 54 |
| 节假日数据刷新 | 国务院公布放假安排时（约 11 月初） | 54 |
| 毕业 / 评奖材料整理 | 统计截止前 30 天 | 52 |
| 更新简历和主页 | 每次录用 | 52 |
| 检查资料里的首选邮箱 | 每年一次 | 56 |
| 每周摘要 | 每周（低优先级内容） | 23, 55 |
| 硬性义务升级提醒链 | T-14 / 7 / 3 / 1 天与 T-6 小时，确认后所有设备同时停止 | 55 |
