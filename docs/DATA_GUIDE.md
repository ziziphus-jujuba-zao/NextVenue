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

edition id 的写法：`iclr-2027`、`cvpr-2027`、`aaai-27`；ARR 按轮次写，例如 `arr-2026-10`。

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
- 沿用上一届的规则时，把上一届的页面也加进这一届的 sources 文件，id 带上一届的年份，例如 `cvpr-2026-author-guidelines`。

`snapshots/` 下的文本就是 CI 校验原文的依据。写卡前先打开快照，确认原句确实在里面。

## 3. 第二步：写时间线

```yaml
id: iclr-2027
series: iclr
name: ICLR 2027
year: 2027
kind: conference          # ARR 的一轮写 arr_cycle
location: { city: San Francisco, country: USA }   # 可选，有官方来源才写
dates: { start: 2027-04-26, end: 2027-04-30 }     # 可选
ranks: { ccf: A, ccf_edition: 7 }                 # 可选
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

- `type` 取值：`abstract`、`paper_registration`、`paper`、`supplementary`、`profile_deadline`、`reviewer_registration`、`reviewing`、`phase1_notification`、`reviews_out`、`author_response`、`discussion`、`meta_reviews`、`commitment`、`notification`、`camera_ready`、`author_registration`、`conference`。同一类型出现多次时（例如两次 author response），用 `label_zh` 区分。
- 官方写"Pacific Time"或"PT"时用 `America/Los_Angeles`；写"PST"但日期在夏令时期间，照样用 `America/Los_Angeles` 并在 `note_zh` 说明官方写法。
- 官方没公布的节点写 `status: tba`，不填日期，不猜。
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
| `family` | `author_list`、`content_edit`、`submission`、`cap`、`reciprocal_reviewing`、`profile`、`dual_submission`、`withdrawal`、`visibility`、`rebuttal`、`llm_policy`、`format`、`presentation`、`resubmission`、`other` |
| `answer` | `required` 必须、`allowed` 允许、`not_allowed` 不允许、`conditional` 有条件、`unspecified` 官方未规定、`not_required` 不要求、`contradictory` 官方说法矛盾 |
| `verification` | `human` 人工对照原文核过；`inherited` 新一届未公布、沿用上一届（必须写 `inherited_from`）；`correspondence` 有 PC 书面答复；`upstream` 来自上游数据；`machine` 机器抽取未人工核 |
| `conf` | `high` 原文明确；`medium` 原文可以支撑但需要一步推断；`low` 推断较多。沿用上一届的卡不要标 `high` |
| `quotes[].text` | **逐字复制**官网原文，保留原来的大小写和标点。只截取能支撑结论的 1–2 句，不超过约 400 字符 |
| `effect` | 可选，给排期引擎用：`lock`（冻结某项）、`cap`（上限）、`exclusive`（一稿多投排他）、`withdraw`（撤稿后果）、`requires`（必须完成的义务） |

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
