# 规则数据编写指南

本文件说明怎么给某一届会议写规则卡，写给维护者、贡献者和帮忙起草数据的 agent。

**核心原则：先有官方原文，再有结论。** 每张卡的答案都必须能被卡上引用的原文直接支撑；原文必须逐字出现在我们保存的官网快照里，CI 会逐条校验。

## 1. 文件在哪里

| 路径 | 内容 | 谁来写 |
|---|---|---|
| `data/sources/<edition>.yml` | 这一届用到的官方页面，以及每个页面快照的哈希 | `pnpm snapshot add` 自动生成；标题和备注可以手改 |
| `snapshots/<sha256>.txt` | 官网页面的纯文本快照，按内容哈希命名，永不覆盖 | 自动生成，不要手改 |
| `data/editions/<edition>.yml` | 这一届的时间线：摘要、正文、出审稿、讨论、出结果…… | 手写 |
| `data/rules/<edition>/<slug>.yml` | 规则卡，一个文件一张 | 手写 |
| `data/visa/<regime>.yml`、`data/visa/countries.yml` | 签证指引（按目的地）和"国家 → 签证文件"路由表，见第 7 节 | 手写 |
| `data/china/holidays-<年>.yml`、`data/china/admin.yml` | 中国放假调休安排；学校出国手续的例子，见第 7 节 | 手写 |
| `data/series/<series>.yml` | 系列：缩写、全称、别名、方向、举办周期、dblp 键、ccfddl 键，见第 9 节 | 手写；ccfddl 新系列由导入脚本建，之后手改 |
| `data/taxonomy.yml` | 学科 → 方向两级分类；CCF 类别 → 默认方向 | 手写 |
| `data/ranks/<list>.yml` | 推荐目录：CCF 第七版、CAA 2024、CAAI 2024、科协 2025 | `pnpm ranks:import` 从官方 PDF 抽取稿生成，不要手改条目 |
| `data/ranks/mapping.yml` | 系列 → 目录条目的手工对应和"永不对应" | 手写 |
| `data/upstream/ccfddl.yml` | 上次导入 ccfddl 的版本（pin）和 ccfddl 的系列记录 | `pnpm import:ccfddl` 写，不要手改 |
| `data/cities.yml` | 城市中文名、国家（地区）中文名、城市时区，会议页的地点块用它，见第 10 节 | 手写 |

edition id 的写法：`iclr-2027`、`cvpr-2027`、`aaai-27`；ARR 按轮次写，例如 `arr-2026-10`。每个 edition 的 `series` 都必须有 `data/series/<series>.yml`。

## 2. 第一步：给官方页面拍快照

```bash
pnpm snapshot add --edition iclr-2027 --id iclr-2027-author-guidelines \
  --kind author_guide --title "ICLR 2027 Author Guidelines" \
  --url https://iclr.cc/Conferences/2027/AuthorGuidelines
```

- `--kind` 取值：`cfp`、`author_guide`、`dates`、`faq`、`policy`、`blog`、`form`、`repo`、`other`。
- source id 用 `<edition>-<页面名>`，全小写加连字符。
- 抓取失败（403、404）也会记下来，`http_status` 写实际状态码、没有 `snapshot`。页面 404 本身就是信息，例如"CVPR 2027 作者指南尚未发布"。
- 只用官网：CFP、作者指南、FAQ、官方博客、官方 GitHub 仓库。二手来源（公众号、知乎、第三方 tracker）不能作为来源。
- 正文由 JavaScript 画出的官网（esmo.org 这类 Nuxt / Next 页面，普通快照里只有页头页脚）：加 `--embedded`。快照在页面文字后面另收页面自带数据里的 HTML 文字（一行分隔 `--- page payload …---`），来源文件记 `embedded: true`，刷新时照样取。这仍是官网原址返回的内容，不是镜像。
- 沿用上一届的规则时，把上一届的页面也加进这一届的 sources 文件，id 带上一届的年份，例如 `cvpr-2026-author-guidelines`。

`snapshots/` 下的文本就是 CI 校验原文的依据。写卡前先打开快照，确认原句确实在里面。

## 3. 第二步：写时间线

```yaml
id: iclr-2027
series: iclr
name: ICLR 2027
year: 2027
kind: conference          # ARR 的一轮写 arr_cycle
data_level: curated       # 必填：curated（本项目按官网原文整理）| upstream（导入脚本从 ccfddl 生成），见第 9 节
location: { city: San Francisco, country: USA }   # 可选，有官方来源才写
dates: { start: 2027-04-26, end: 2027-04-30 }     # 可选
# 方向和等级不写在这里：方向在 data/series/<series>.yml，等级由 data/ranks/ 自动挂上（第 9 节）
milestones:
  - type: abstract
    at: 2026-09-18T23:59     # 会议官方时区下的本地时间；只写日期表示当天 23:59
    tz: AoE                  # AoE、UTC、UTC+8、UTC-07:00，或 IANA 时区如 America/Los_Angeles
    status: confirmed        # confirmed | estimated | tba
    src: iclr-2027-dates
    quote: "Abstract Deadline Sep 18 '26 (Anywhere on Earth)"   # 可选；写了就会被 CI 校验
  - type: discussion         # 时间窗口用 start/end
    start: 2026-11-05
    end: 2026-11-18
    tz: AoE
    status: confirmed
    src: iclr-2027-dates
last_checked: 2026-09-24
```

- `type` 取值：`abstract`、`paper_registration`、`paper`、`supplementary`、`profile_deadline`、`reviewer_registration`、`reviewing`、`phase1_notification`、`reviews_out`、`author_response`、`discussion`、`meta_reviews`、`commitment`、`notification`、`camera_ready`、`author_registration`、`conference`，以及录用后的节点（第 7 节）。同一类型出现多次时（例如两次 author response），用 `label_zh` 区分。
- 官方写"Pacific Time"或"PT"时用 `America/Los_Angeles`；写"PST"但日期在夏令时期间，照样用 `America/Los_Angeles` 并在 `note_zh` 说明官方写法。
- 官方没公布的节点写 `status: tba`，不填日期，不猜。
- 官网自己标了暂定（tentative）的日期：`status: confirmed` 加 `tentative: true`（要有原文），界面标"官网暂定"。`estimated` 只用于本应用推算的日期。
- 不同官方页面日期不一致时：截止类节点取最早的，结果类节点（出审稿、meta、出结果）取最晚的，并在 `note_zh` 写明两个页面各写了什么。

## 4. 第三步：写规则卡

一张卡只回答一个问题。文件名就是卡 id 的后半部分。

```yaml
id: iclr-2027/author-membership-freeze    # <edition>/<slug>，与文件路径一致
edition: iclr-2027
family: author_list
question_zh: 摘要截止后还能增加或删除作者吗？
answer: not_allowed
verification: human
conf: high
applies:
  from: abstract            # 引用时间线里的节点类型，不写死日期
  note_zh: 摘要截止后任何阶段都不能增删作者
summary_zh: 不能。作者名单在摘要截止时冻结，增加和删除都不行；官方写明"没有任何例外"。
detail_zh: 作者顺序可以改到正文截止（见"作者顺序"卡）。
quotes:
  - src: iclr-2027-author-guidelines
    text: "Please note that no authors can be added or removed after the abstract submission deadline (author order can be changed after the abstract submission deadline up to the full paper deadline)."
effect:
  kind: lock
  target: author_membership
last_checked: 2026-09-24
```

### 字段说明

| 字段 | 取值与要求 |
|---|---|
| `family` | `author_list`、`content_edit`、`submission`、`cap`、`reciprocal_reviewing`、`profile`、`dual_submission`、`withdrawal`、`visibility`、`rebuttal`、`llm_policy`、`format`、`presentation`、`registration`、`refund`、`resubmission`、`other` |
| `answer` | `required` 必须、`allowed` 允许、`not_allowed` 不允许、`conditional` 有条件、`unspecified` 官方未规定、`not_required` 不要求、`contradictory` 官方说法矛盾 |
| `verification` | `human` 人工对照原文核过；`inherited` 新一届未公布、沿用上一届（必须写 `inherited_from`）；`correspondence` 有 PC 书面答复；`upstream` 来自上游数据；`machine` 机器抽取未人工核 |
| `conf` | `high` 原文明确；`medium` 原文可以支撑但需要一步推断；`low` 推断较多。沿用上一届的卡不要标 `high` |
| `quotes[].text` | **逐字复制**官网原文，保留原来的大小写和标点。只截取能支撑结论的 1–2 句，不超过约 400 字符 |
| `effect` | 可选，给排期引擎用：`lock`（冻结某项）、`cap`（上限）、`exclusive`（一稿多投排他）、`withdraw`（撤稿后果）、`requires`（必须完成的义务），录用后另有 `refund`、`hold`、`fallback`（第 7 节） |

### 三种特殊情况

**官方没说（`unspecified`）**：`quotes` 可以为空，但必须写 `checked_sources`，列出查过的来源。不要拿别的会议或往年的规则去填这个空。

```yaml
answer: unspecified
quotes: []
checked_sources: [iclr-2027-author-guidelines, iclr-2027-cfp]
```

**官方自相矛盾（`contradictory`）**：至少两条引文，每条写 `reading_zh` 说明按这句话理解会怎样。卡片不替用户选。

```yaml
answer: contradictory
quotes:
  - src: iclr-2027-author-guidelines
    text: "No changes to authors are permitted after the submission deadline."
    reading_zh: 按作者指南：正文截止后连顺序也不能改
  - src: iclr-2027-author-guidelines
    text: "..."
    reading_zh: 按讨论期 FAQ：讨论期内可以调整作者顺序
```

**沿用上一届（`inherited`）**：新一届页面还没出（例如 CVPR 2027 作者指南仍是 404）时，引用上一届原文，写 `verification: inherited`、`inherited_from: cvpr-2026`，`conf` 最高 `medium`，并在 `summary_zh` 里说明"2027 尚未公布，以下为 2026 规则"。

## 5. 第四步：本地校验

```bash
pnpm validate --edition iclr-2027        # 结构和交叉引用
pnpm check:quotes --edition iclr-2027    # 每条原文都在快照里
pnpm build                               # 生成 dist/site/index.html，可以直接用浏览器打开
```

`check:quotes` 失败时会显示原文从第几个词开始对不上，以及快照里最接近的那一段。通常是复制时漏了字、多了空格以外的字符，或者官网已经改了措辞。后一种情况要重新拍快照并复核结论。

## 6. 合规红线

- 只陈述官方规则和后果，不写任何绕过上限、一稿多投、匿名、LLM 政策或检测的办法。
- 不写"录用率预测"，不写"建议投哪个会"。决策建议由引擎在用户本地生成，不放进公共数据。
- 引文只做引用，每条不超过两句。
- 往年数据（第 8 节）：不从没有许可证的数据集复制数字；不自己计算分领域录用率，只摆官方公布的。

## 7. 录用后的数据（MOBILE_SPEC §10）

原则不变：每个值都带 `src` 和 `quote`，CI 核对原文；没公布写 `status: tba`；本应用自己的估算写 `basis: assumption`。

### 7.1 edition 新增内容

- **录用后的 milestone type**：`site_preference`（会场意向表截止）、`site_assignment`（会场分配公布）、`financial_aid`（资助 / 志愿者申请，`at` 或 `start`/`end`）、`financial_aid_result`、`registration_open`、`early_registration`（优惠价截止）、`standard_registration`（标准价截止）、`visa_letter`（官方给了邀请函日期才写）、`visa_refund_apply_by`（拒签退款：须在此日前递签）、`refund_cutoff`（全额退款截止）、`visa_refund_request_by`（拒签退款申请截止）、`presentation_format_final`（线下 / 线上不能再改）、`poster`。"硬性 / 建议 / 通知"写在代码里（`packages/core/src/types.ts` 的 `POST_ACCEPT`），数据里不写。
- **`location.country_code`**：ISO 3166-1 两位字母，签证详情按它查 `data/visa/countries.yml`。
- **`sites`**：只有同时在多地举办的届次才写：`{ id, city, country_code, tz, venue }`。只适用于某个会场的 milestone 加 `site: <id>`。
- **官方没写时区**：只有按北京时间更保守时才能写 `tz: Asia/Shanghai`，而且必须在 `note_zh` 说明，并加 `tz_assumed: true`（界面写"没写时区，按北京时间算"，不写成官方写法）。

### 7.2 edition 的 `logistics`

每一项必须是下面两种之一：

- **值 + `src` + `quote`**；
- **`status: tba` + `checked_sources`**，可以再带 `reference: { from: <同一系列上一届的 id>, …上届的值…, src, quote }`。上届的值界面标"上届"，不参与计算。

| 字段 | 内容 |
|---|---|
| `venue` | `{ name, address, src, quote }`；地址没公布写 `address: tba`。多会场写在 `sites[].venue` |
| `fees[]` | 每个会场一张表：`{ site?, currency, tiers: [{ id, until: <milestone type> }…], rows, src, quote? }`。除最后一档外每档都要有 `until`。`rows[]`：`{ id, label_zh, for: [student\|academic\|industry], member: none\|current\|new, covers_author, amounts, tiers?, quote? }`，`amounts` 与档次一一对应。原文写在表上或行上；**每个金额都必须出现在它的原文里** |
| `coverage` | 一份注册覆盖几篇：`{ per: author\|paper\|unspecified, max_papers?, rate?: any\|in_person\|non_student_in_person, extra_zh?, src, quote }` |
| `visa_letter` | `{ after: paid_registration\|registration\|none, how_zh, how_site_zh?: { <site id>: 该会场的办法 }, lead: tba \| { n, unit: day\|business_day\|week, quote? }, url, src, quote }`；多会场时界面只显示论文所在会场的 `how_site_zh` |
| `visa_guidance[]` | 主办方给的签证提前量：`{ country_code, weeks: 6 \| [6, 8], src, quote }` |
| `aid[]` | `{ id, name, covers_zh?, url, src, quote }`；截止日期写成 `financial_aid` 节点 |
| `hotels[]` | `{ name, address?, rate?: { amount, currency }, cutoff, anchor, src, quote }`。`anchor` 写页面上的酒店名，`quote` 写它的截止原文；CI 要求原文是酒店名之后第一处同类句子，中间没有别的酒店 |
| `sold_out[]` | `{ site?, src, quote }` |
| `poster` | `{ size_zh, src, quote }` 或 tba |
| `links[]` | `{ kind: registration\|visa\|venue\|hotels\|aid\|contact\|program, url, site? }` |

原文可以写在外层对象上：没有自己 `src` 的 `quote` 用最近一层外层对象的 `src`。

### 7.3 录用后的规则卡

- 新 family：`registration`（注册费档次、会员、邀请函要不要先注册、申请资助时能不能先注册）、`refund`（取消退款、拒签退款）。`presentation` 照旧。
- 新 effect：
  - `{ kind: refund, trigger: visa_denied_or_pending, full_until: refund_cutoff, then: virtual_difference, condition: { applied_by: visa_refund_apply_by }, request_by: visa_refund_request_by, evidence: visa_application_date }`
  - `{ kind: hold, target: registration_nudge, while: aid_applied, until: financial_aid_result }`
  - `{ kind: fallback, substitute: <答案>, virtual: <答案> }`：去不了时能不能代讲、能不能线上
  - `{ kind: requires, target: paid_registration, before: visa_letter }`
- effect 里写节点的字段一律写本届已有的 milestone type。
- 一份注册覆盖几篇写在 `logistics.coverage`，不写规则卡。

### 7.4 签证：`data/visa/`

- `countries.yml`：`国家代码: 签证文件 id`，`none` 表示不需要签证。签证文件还没写时界面显示"未收录"。数据里每个会场国家都要有一行，curated 届次、多会场的 sites 和从 ccfddl 地名读出的国家都算；还没写文件的先写将来的 id（GB: uk、SG: sg），`pnpm validate` 列出这些 id。申根 29 国（`SCHENGEN`，packages/core/src/place.ts）一律写 `schengen`。缺行或申根国没指向 `schengen` 时 `pnpm validate` 报错。
- `<id>.yml`（格式见 `schema/visa.schema.json`）：`id`、`name_zh`、`passport: cn_ordinary`、`last_checked`（超过 30 天警告，超过 60 天 CI 失败）、`requirement`（`answer: required|visa_free|not_needed`、`visa_zh`、`conf`、原文；可选 `short_zh`：会议页地点块上的短标签，不是签证的证件写它自己的名字，例如港澳写"港澳通行证"，不写就按 answer 显示"需要签证""免签"）、`apply[]`、`fees[]`（没核实的写 `status: unverified` 加 `note_zh`，不写金额）、`window`（最早 / 最晚可递交）、`facts[]`（有效期、EVUS、活动代码等一句话事实）、`lead`、`documents`、`notices[]`、`transit[]`、`links[]`。
- `lead` 两种：
  - `processing_time`：`official`（官方处理时间）、`as_of`、`includes`/`excludes`、`caveat`、`app_buffer: { weeks, basis: assumption }`（本应用的缓冲，必填）。引擎倒推：D − 官方 − 缓冲。
  - `appointment_wait`：`as_of`、`unit`（例如"按 30 天一个月"）、`posts[]`（各领区等待月数）、`excludes`。不倒推，只比较。
- JSON 来源（例如 IRCC 处理时间）用 `json_path` + `json_value` 代替 `quote`。
- 官方页面对我们返回 403 时，用 `pnpm snapshot add … --mirror-url <同一机构的镜像>`：`url` 仍写官方原址，快照从镜像抓，并在 `note_zh` 说明。PDF 需要本机装有 `pdftotext`。

### 7.5 中国：`data/china/`

- `holidays-<年>.yml`：`holidays[]`（`name_zh`、`start`、`end`，含其中的周末）和 `workdays[]`（调休上班的周末）。已公布的年份 `status: confirmed`，每条原文照抄国务院办公厅通知，CI 还会核对日期和星期。没公布的年份 `status: estimated`、`basis: assumption`，写 `method_zh`，每个节日写 `statutory`（放假办法规定的日子）和 `evidence`（放假办法、农历对照表的原文）。
- `admin.yml`：学校和国家规定的例子，`{ id, org_zh, who: student|staff|all, topic, text_zh, n?, unit?: day|workday|month, kind?: hard|advice, issued?, src, quote }`。只收学校和政府官网，学生自编的指南不收。这些只是例子，界面必须写"以本校最新通知为准"。


## 8. 往年数据（MOBILE_SPEC §11）

原则不变：每个数字都有官网地址和原句；拍得到快照的，CI 在快照里核对原句。往年数字只摆出来，不预测，不参与路线排序。

### 8.1 文件

| 路径 | 内容 |
|---|---|
| `data/stats/<series>.yml` | 这个系列每年的投稿数、录用数、录用率（主会或主赛道；*ACL 另有 Findings 行，KDD 按轮） |
| `data/stats/areas/<series>-<year>.yml` | 官方公布过的分领域数字，只有公布过的年份才有文件 |
| `data/topics/<series>-<year>.json` | 录用论文按主题的篇数排名（前 15，App 显示前 10），由 `scripts/topics/dblp_topics.py` 生成，不要手改 |
| `data/topics/taxonomy.json` | 上面用的关键词表，同样由脚本生成 |
| `data/sources/stats-<series>.yml` | 这些数字引用的官网页面和快照（`pnpm snapshot add --edition stats-<series> …`） |
| `NOTICE` | 用到的第三方数据及其许可证 |

### 8.2 录用率行（`data/stats/<series>.yml`）

```yaml
series: iclr
rows:
  - year: 2026
    track: main                 # main | findings | main_and_findings | cycle1 | cycle2（KDD 按轮，另写 track_zh: 8 月轮）
    status: official            # official | partial | third_party | none
    submissions: 19525
    accepted: 5355
    rate: 27.4                  # 百分数，画柱高
    rate_text: 27.4%            # 照此显示：官方写几位就几位；按官方数字算的写一位小数
    rate_basis: stated          # stated 官方写的 | computed 按官方数字算 | approx 官方写"约" | estimate 官方说是估算
    definition_zh: 单一赛道；分母为全部有效投稿，含后来撤稿和被桌拒的论文
    source_url: https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/
    quote: "ICLR 2026 received 19,525 valid, format-compliant submissions. ... representing an acceptance rate of 27.4%."
    src: iclr-2026-review-retrospective
    quote_check: snapshot       # snapshot：CI 在 src 的快照里核对；manual：拍不了快照（X、Bluesky、LinkedIn、Springer 等），人工核对
    also:                       # 其他官方说法，数字都在 quote 里
      - { source_url: …, quote: "…", src: iclr-2026-fact-sheet, quote_check: snapshot, note_zh: fact sheet 写的录用数是 5,357 }
    checked: 2026-09-25
```

- **status**：
  - `official`：投稿、录用、录用率三个数都来自官方。
  - `partial`：来自官方，但官方只公布了其中一两个（例如只有录用数）。没公布的那个字段不写。
  - `third_party`：没有官方数字，只有第三方转述（理化学研究所转述录用通知、AIST 页面转录的决定邮件、日本机器人学会会刊）或 MIT 许可的数据集。必须写 `relay_zh`（谁转述、转述什么）；取自数据集的加 `dataset: lixin4ever`，并在 `NOTICE` 里有它的许可证。
  - `none`：没有能显示的数字，写 `reason`（`unpublished` 官方没公布 | `unlicensed_only` 只见于无许可证的聚合站 | `doubtful` 官方数字存疑）和 `checked_urls`，不写任何数字。界面写"官方未公布"（`doubtful` 写"数字存疑，不显示"）。
- **一行里有官方数字，就不再存第三方数字。** 例：ICML 2025 官方只有录用数和"27%"，第三方转述的投稿数不入库。
- **不能作来源的数据集**：csconfstats（Xovee/cs-conf-stats）、Paper Copilot（paperlists）、emeryberger/csconferences、tranhungnghiep/AI-Conference-Info 都没有许可证，OpenAccept 是 CC BY-SA。只能当线索，数字要回到官方原文去找；找不到就是 `none`。`pnpm validate` 拒绝这些域名。
- **本应用自己数的**（官网录用名单、PMLR 论文集）：写 `count_method_zh`（怎么数的，含数字）；名单页和 `source_url` 不同时写 `count_url`。
- **官方写的录用率和按官方数字算的对不上**（超出官方写法的精度）：照官方写法显示，并写 `mismatch_zh` 说明。例：ICLR 2023 写 31%，算出来是 31.9%。
- **原句**：逐字复制。可以用 `...` 或 `[...]` 跳过中间的文字，用 ` | ` 分隔表格单元格；CI 要求每一段都按顺序出现在快照里。PDF 文字层里数字中间的细空格（"3, 350"）和中日文里的换行，核对时会自动忽略。

`pnpm validate` 还会检查：三种 status 各自需要的字段；显示的每个数字都出现在原句（或 `also` 的原句、`count_method_zh`）里；`computed` 的录用率等于录用 ÷ 投稿的一位小数；行按年份、赛道排序；`src` 的地址就是 `source_url`。

`areas_none` 记下查过、确实没有分领域数据的年份（`years`、`scope_zh`、`checked`、`checked_urls`）。界面据此写"官方未公布分领域数据"；既没有文件也不在这里的年份写"暂未核查"。

### 8.3 分领域数据（`data/stats/areas/<series>-<year>.yml`）

只收官方公布的数字：会议自己的表格、图表、博客或论文集前言。

| 字段 | 内容 |
|---|---|
| `kind` | `rates`（各领域投稿、录用、录用率）、`rate_only`（只有录用率）、`submissions_only` / `accepted_only`（只有篇数，不写录用率）、`share_of_accepted`（占录用论文的比例）、`theme_track`（*ACL 特别主题 track 一行，录用率按官方数字计算） |
| `precision` | `exact`（文字或表格）、`chart_read`（从官方图表上量的，必须写 `tolerance`，界面写"约"）、`our_count`（本应用在官网名单上数的，写 `count_method_zh`） |
| `names_mapped` | 领域全名是本应用对照补的（AAAI-26 幻灯片上只有缩写），界面标"名称为本应用对照" |
| `total` | 全会数字，画参考线；各领域合计和它差 2% 以上时必须写 `gap_note_zh`。`total.label_zh` 是参考线的名字，照这个数字的口径写：全会、直投合计（ACL 2023 表 1 只含直投）、研究赛道合计（KDD 2023）；不写时显示"全会" |
| `rows[]` | `area`（官方原名）、`submissions`、`accepted`、`rate`、`findings_rate`、`share_pct` 等，按 `kind` 取舍 |

图表图片不复制，只链接（`figure_urls`，或写 `page_zh`：在原文第几页）。

### 8.4 热门主题（`data/topics/`）

由 `scripts/topics/dblp_topics.py` 从 dblp（CC0）的录用论文标题生成，用法见 `scripts/topics/README.md`。CI 不跑脚本，只校验文件：前 10 到 15 个主题按篇数从高到低排；占比 = 篇数 ÷ `papers_used`；`papers_used` 和官方录用数之比在 0.98–1.02 之间；`official_accepted` 和 `data/stats/<series>.yml` 那一年的主会行完全一致；主题和标签与 `taxonomy.json` 一致。文件里不允许出现任何录用率。

## 9. 系列、方向、等级标签与上游数据

原则：**官方的就是官方的，上游的就是上游的，等级从不猜。**

- curated 数据照旧：每个事实带 `src` + 逐字 `quote`，CI 核对快照。
- ccfddl（MIT）的数据标 `data_level: upstream`，界面标"未核对"，永远不当成已核对；许可证全文在 `NOTICE`。
- 等级标签只来自 `data/ranks/` 的四份目录，每个标签都带目录名、版次和官方链接。

### 9.1 系列文件 `data/series/<series>.yml`

```yaml
id: hscc                          # 小写字母数字加连字符；和 edition 的 series 一致
acronym: HSCC+ICCPS               # 会议现在的写法
full_name: ACM/IEEE International Conference on Cyber-Physical and Autonomous Systems
name_zh: 中国控制会议               # 可选；国内会议写上，科协目录靠它匹配
aliases:                          # 可选：以前的缩写、全称，别处的写法；等级匹配会读
  - HSCC
  - "International Conference on Hybrid Systems: Computation and Control"
directions: [cs/theory, eng/control]   # data/taxonomy.yml 的方向 id，主方向在前；至少 1 个
periodicity:                      # 可选
  cycle: annual                   # annual | twice_yearly | biennial | triennial | quadrennial | irregular
  basis: observed                 # official：官网写明，要 src + quote | observed：按往届年份看出来的，要 note_zh
  note_zh: 按 dblp 收录的往届举办年份
  # parity: odd                   # 只用于 biennial：even | odd（ICCV odd，ECCV even）
  # since: 2027                   # 从这一年起按这个周期（FM：官网写明 2027 起一年一届，basis: official + 原文）
dblp: conf/hybrid                 # 可选：dblp 流的键 conf/<key>
ccfddl: CT/HSCC                   # 可选：ccfddl 的系列键 <sub>/<title>；导入脚本只通过它挂上游届次
data_level: curated               # curated | upstream（导入脚本建的系列）
note_zh: 2027 年起与 ICCPS 合并。    # 可选
```

- **系列 id**：一般就是缩写的小写（`cav`、`hscc`、`tacas`）。两个会撞缩写时，CCF/ccfddl 里那个用裸缩写，另一个加后缀：`ccc`（计算复杂性，ccfddl）和 `ccc-control`（中国控制会议）；`its-wc`（ITS 世界大会）；`aiaa-scitech`、`cac`、`yac` 照此。已经被 `data/ranks/mapping.yml` 用到的 id：`hscc`、`aiaa-scitech`、`ccc-control`、`cac`、`its-wc`、`ccc`。
- **CCF 第七版的每个会议都要有系列文件**（`pnpm validate` 在有条目没挂上系列时报错）：ccfddl 没有的会，照目录条目建 `data_level: curated` 的系列文件，`acronym`、`full_name`、`dblp` 照录目录，方向取类别默认值再按内容改，文件头注明"由 CCF 第七版目录条目建立"。这类系列可以没有任何届次：App 照样能搜到、能关注，写"日期暂未收录"。
- **ccfddl 里有的会，一定写 `ccfddl`**（在 `data/upstream/ccfddl.yml` 或 ccfddl 的 `conference/<SUB>/<name>.yml` 里查 `<sub>/<title>`），否则导入脚本会把它当成新系列（dblp 或全称撞上时它会停下来报冲突，不会重复建）。
- 改名、合并的会：`acronym`、`full_name` 写现在的，旧名写进 `aliases`；CCF 目录仍用旧名时在 `mapping.yml` 手工挂（见 HSCC）。
- `directions` 是本项目的分类，不需要原文；`periodicity` 是事实，要么官网原文，要么 `basis: observed` 加说明。

### 9.2 方向 `data/taxonomy.yml`

- 方向 id 写成 `<学科>/<方向>`。学科按规模排：计算机 `cs`（主线）、工程 `eng`、物理 `phys`、化学与材料 `chem`、生命 `life`、医学 `med`、数学 `math`、地球 `earth`、社科经管 `soc`。
- 计算机：`cs/ml`（机器学习与人工智能）`cs/cv` `cs/nlp` `cs/robotics` `cs/dm`（数据挖掘与检索）`cs/systems`（系统与体系结构）`cs/net` `cs/security` `cs/se`（软件工程与程序语言）`cs/db` `cs/theory`（理论与形式化）`cs/graphics`（图形与多媒体）`cs/hci` `cs/speech`（语音与信号）`cs/cross`（交叉）。
- 工程：`eng/control` `eng/transport` `eng/av`（自动驾驶与智能车）`eng/power` `eng/aero` `eng/mech` `eng/civil` `eng/comm` `eng/ic`（电路与芯片，含射频）`eng/eda` `eng/bme` `eng/rs`（遥感）。机器人用 `cs/robotics`，信号处理用 `cs/speech`；工程的选择器通过 `see_also` 也列出它们。
- 一个系列挂多个方向：主方向在前。HSCC+ICCPS `[cs/theory, eng/control]`；DAC `[cs/systems, eng/eda]`；ICASSP `[cs/speech, eng/comm]`；CoRL `[cs/robotics, cs/ml, eng/av]`。
- `legacy` 是 v0.3 `edition.topics` 的旧值（ml、ai、cv、nlp、robotics、dm）。edition 不再写 `topics`，打包时从系列的方向推出来给 App 的旧选择器用。
- `category_directions`：CCF 10 个类别（也就是 ccfddl 的 DS、NW、SC、SE、DB、CT、CG、AI、HI、MX）→ 新系列的默认方向。第 5 类默认 `cs/db`，数据挖掘和检索类改 `cs/dm`；第 7 类里语音类改 `cs/speech`；第 8 类里视觉、语言类改 `cs/cv`、`cs/nlp`。上游系列还是类别默认方向、名字却像视觉、语言、挖掘、语音的，`pnpm validate` 会警告。

### 9.3 edition 的新字段

| 字段 | 取值与要求 |
|---|---|
| `data_level` | 必填。`curated`：本项目整理，每个日期带 `src` + `quote`。`upstream`：只能由 `pnpm import:ccfddl` 生成，必须有 `upstream`，节点不许带 `src`/`quote`、不许 `estimated`，不许有 `logistics`、`sites`、`derived_from`、`submission_evidence`、`federated_with`，也不能给它写规则卡 |
| `upstream` | `{ source: ccfddl, key: <sub>/<title>, conf_id, link?, place?, date?, timezone? }`，后四项照抄 ccfddl 的写法；`key` 必须等于系列文件的 `ccfddl` |
| `submission_type` | `full_paper`（全文）\| `extended_abstract`（2–4 页扩展摘要）\| `abstract`（只交摘要）\| `mixed`（几种赛道并存）。没核实就不写。curated 届次写了就必须有 `submission_evidence: { src, quote }` |
| `federated_with` | `{ name, url?, with?: [其他系列 id], src, quote }`，例如 `{ name: CPS-IoT Week 2027, with: [rtas, sensys], src: hscc-2027-home, quote: "…" }`。curated 届次必须带原文 |

**把上游届次转成 curated**：在原文件里把 `data_level` 改成 `curated`，删掉 `upstream`，给每个节点补 `src` + `quote`（拍快照见第 2 节），`last_checked` 写核对日期。之后导入脚本不再碰这个文件；同一系列同一年只要有 curated 届次，导入就跳过。

### 9.4 等级标签 `data/ranks/`

- **三份目录**：`ccf7`（CCF 第七版，2026-03-31）、`caai2024`（中国人工智能学会，2024-08-24）、`cast2025`（中国科协《重要学术会议目录（2025）》，2025-12-31，不分级）。每个文件有目录全名、版次、发布日期、官方页面、PDF 的 sha256、发布方原话的免责声明和许可说明。条目是 `{ id, acronym, full_name, tier, category, match_keys }`（科协另有 `name_zh`、`society_zh`）。条目由 `pnpm ranks:import --list <id> --from <抽取稿>` 生成，不手改。
- **许可**：三份目录都没有公开许可。界面只显示等级 + 目录名、版次和官方链接，不转载 PDF、不整表展示。许可说明是给维护者的，不随 App 发出、界面不显示。
- **不用的目录**：中国自动化学会（CAA）目录官网写"版权所有 不得转载"，2026-09-25 起不再收录、不显示（`caa2024.yml` 已删除）。
- **学校目录**（清华、同济、北航）、中国电子学会征求意见稿、中汽学会试点：不进 `data/ranks/`，不展示。以后要用，必须 `kind: university` 并在界面写明是学校目录。
- **科协标签只属于被收录的那一届**：`attach: edition`、`covers_year: 2025`。2025 届入选，2026、2027 届的列表行不显示"科协"。
- **CORE、THCPL**：只取 ccfddl 的值，标签带 `upstream: true`，界面写明"取自 ccfddl"；ccfddl 的 CCF 值不用来显示，只拿来和 CCF 目录对照（不一致的列在报告里，例如 IJCAR：ccfddl 写 B，CCF 第七版没有这一条）。

**怎么挂上**（`packages/core/src/ranks.ts`）：

1. `mapping.yml` 的 `links` 优先：`{ series, list, entry, note_zh, qualifier_zh?, year? }`，`entry` 是目录文件里条目的 `id`（CCF 的缩写小写，撞名时带类别：`fse-3`、`fse-4`；科协是条目号 `'314'`）。系列文件还没建时这条先挂着，validate 只提示。
2. 其余自动匹配，按证据打分：同一全称 3 分；同一 dblp 键加同一缩写 3 分；同一 dblp 键加相近全称 2 分；同一缩写加相近全称 1 分。只撞缩写或只撞 dblp 键是 0 分，**永远不挂**，只进报告。一个系列取唯一的最高分条目；并列就是"有歧义"，不挂。一个条目被几个系列取走时给最高分的那个，并列就都不挂。
3. `not` 列出永远不挂的对：`{ series, list, entry, note_zh }`。现有：CAAI 的 ITS（ACM Interactive Tabletops and Surfaces）不是 ITS 世界大会；CCF 的 CCC（计算复杂性）不是中国控制会议；CAA 的 CCC 反过来。
4. `pnpm ranks:report` 列出每个系列的标签、有歧义的、只撞缩写的、被抢的条目、ccfddl 与 CCF 不一致的，以及还没有系列的目录条目（`--unlinked`，"CCF 目录全部导入"的待办清单）。validate 输出一行汇总；`mapping.yml` 里指向不存在的目录或条目、同一对又挂又禁，都是错误。

### 9.5 导入 ccfddl `pnpm import:ccfddl`

```bash
pnpm import:ccfddl --commit <40 位 sha> --dry-run        # 先看摘要
pnpm import:ccfddl --commit <40 位 sha>                  # 写入；as-of 取 commit 日期
pnpm import:ccfddl --file allconf.yml --as-of 2026-09-25 # 用本地的 allconf.yml（记 sha256）
pnpm validate && pnpm ranks:report
```

- 只导"还没开完"的届次（按 `--as-of` 判断，不按今天，所以同一个 pin 重跑不会写任何文件）。
- 每个 ccfddl 系列通过系列文件的 `ccfddl` 键对应；没有的新建 `data_level: upstream` 系列文件（方向取 CCF 类别默认值），之后可以手改，导入不会覆盖。新系列的缩写、dblp 或全称撞上已有系列时停下来报冲突，要人来加 `ccfddl` 键或改 id。
- 每个即将举办的 ccfddl 届次建或更新一个 `data_level: upstream` 的 edition：摘要（`abstract_deadline`）、正文（`deadline`）、会议举办（`date` 能读成确切日期时，否则 `tba`）；时间线有几行就是几轮，轮名写在 `label_zh`；`TBD` 写 `tba`。时区：AoE 和 UTC±N 照写（`UTC+0` 写 `UTC`），`PT` 换成 `America/Los_Angeles`（含夏令时），秒舍掉。地点只在能认出国家时写 `country_code`。
- 同一系列同一年已有 curated 届次：不碰；正文截止和 ccfddl 不一样时，摘要里列出来（例如 ICRA 2027：官网按太平洋夏令时，ccfddl 按 UTC-8）。
- ccfddl 已经删掉的上游届次只列出来，不删文件。
- `data/upstream/ccfddl.yml` 整个重写：pin（commit 或文件、sha256、as-of 日期）和每个系列的 ccfddl 记录（标题、全称、sub、dblp、CCF/CORE/THCPL）。

### 9.6 给整理数据的人：检查清单

1. 新系列：建 `data/series/<id>.yml`（ccfddl 有就写 `ccfddl` 键），方向用 taxonomy 的 id。
2. 新 curated 届次：拍快照 → `data_level: curated` → 每个节点 `src` + `quote` → 需要时 `submission_type` + `submission_evidence`、`federated_with`。
3. 等级：跑 `pnpm ranks:report --series <id>`；自动匹配不上或有歧义，在 `mapping.yml` 写 `links` 或 `not`，每条写 `note_zh`。不要在 edition 里写等级。
4. `pnpm validate`、`pnpm check:quotes`、`pnpm test`、`pnpm build` 全过。

## 10. 城市中文名：`data/cities.yml`

会议页标题下面的地点块写"西雅图 · 美国"，不写 "Seattle"。中文名、国家中文名和城市时区都在 `data/cities.yml`（格式见 `schema/cities.schema.json`），打包时（`packages/core/src/place.ts`）给每届算出 `place`：

- **curated 届次**：按 `location.city` 查；时区用这一届 `conference` 节点自己的 IANA 时区（`pnpm validate` 检查它和城市时区在会期那天一致）。`location.country_code` 没写时，城市给出国家。
- **多会场**：每个 `sites[]` 按自己的 `city` 和 `country_code` 查，时区用 site 的 `tz`。
- **上游（ccfddl）届次**：读 `upstream.place` 原文，按逗号拆开，第一段是已知城市的就是城市，前面几段是场馆（"McCormick Place, Chicago, Illinois, USA" → 芝加哥，场馆 McCormick Place）；哪一段都不是城市时，找长名字里包含的城市（"Grand Hyatt San Antonio Riverwalk" → 圣安东尼奥）；最后一段是城市国家（"…, Singapore"）也算。时区只能用城市的（ccfddl 只有截止日期的时区，多是 AoE）。读不出城市就原样显示 ccfddl 的文字。
- 一行一个城市：`{ name, name_zh, country_code, tz, aliases?, region?, state? }`。`name` 照数据里的英文写，别的写法（不带重音、本地名、旧称）放 `aliases`；比较时不分大小写，不看重音、句点和逗号。`name_zh` 用通行译名（新华社译名、常见地图写法）。
- 同名城市按国家区分：数据写了国家时只认国家对得上的；写 "China" 的港澳台地名也算对得上。`region: true`：名字也是州名（Washington、New York），只在第一段才当城市。`state`：美国同名城市多，城市后面跟着州名时州名要在列表里（Columbia 只认 SC）。
- `countries`：国家（地区）代码 → 中文名。港澳台写"中国香港""中国澳门""中国台湾"，签证按各自的文件查。ccfddl 能写出的国家都要有中文名。
- `unknown`：数据里只写了国家或地区、读不出城市的地名（ccfddl 的 "Taiwan"）。页面写"中国台湾 · 城市待公布"。
- **新届次的城市不在表里时 `pnpm validate` 报错**：加一行城市，不要改届次数据去迁就。`packages/core/test/place.test.ts` 也检查每一届都能对上。
