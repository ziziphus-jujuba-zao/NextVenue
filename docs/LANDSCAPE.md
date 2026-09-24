# 现有产品调研（Related Work）

> 2026-09-24 核实。共核实 255 个网站、App、小程序、插件和数据集，这里只列与本项目最相关的约 30 个。
> 每条都实际打开页面或数据文件检查过。"停更"指数据或代码已有 2 个月以上没有更新。

## 结论

- **会议信息 tracker 已经很多，但都只做一部分：**
  - 最全的是 PaperDDL，但数据 8 月以后就没更新，也不开源。
  - ccfddl 是开源数据的事实标准，但只有摘要和正文两个截止。
- **注册费：** 顶会的实际费用金额没有任何 tracker 系统收录，只有零星的区间或单条数据。
- **讨论区：** 只有 CallForPaper.org 的评论区和各种微信群，没有活跃、可检索、按会议组织的讨论区。
- **个人投稿规划：**
  - Auctorium、Acta 有论文管理，但没有会议数据库，全部要手填。
  - DDL Atlas CN 的转投规划器、DDL Radar 的看板都已停更。
- **没有产品同时做到：** 公共会议数据、个人规划、审稿后决策、政策变更监控和规则库。
- **本项目的定位：** 不再做"又一个 tracker"。会议数据复用 ccfddl（MIT）和 HF ai-deadlines（MIT），差异化放在规划、决策、政策和规则上。

## 1. 会议信息 tracker

| 产品 | 平台 | 覆盖 | 长处 | 缺什么 |
|---|---|---|---|---|
| [PaperDDL](https://www.paperddl.com/) | 网页 | 517 个会议（10 个 CCF 类）+ 403 个期刊 | **最接近"全阶段"**：AAAI-27 有摘要、正文、Phase-1、author feedback、终审、camera-ready；倒计时可以在 deadline / rebuttal / notification / camera-ready / 开会之间切换；有 CCF、CORE、THCPL、CAAI 等级；有录用率图表 | 不开源；数据 2026-08-02 后未更新；2026 年以后的 294 个届次里，只有 143 个有摘要截止，89 个有 rebuttal；没有注册截止、注册费、论坛，也没有订阅式提醒 |
| [ccfddl](https://ccfddl.com/) | 网页、微信小程序、Chrome 插件、Raycast、TUI、iCal | 361 个系列 | MIT；9.4k star；约 330 位贡献者；今天还有提交；CCF/CORE/THCPL 三种等级 | 只有摘要和正文截止，没有后续阶段 |
| [ccfcfp.com](https://ccfcfp.com/) | 网页、660 个 webcal/RSS 订阅 | 361 个会议，1,206 个届次 | 中英双语；可切换 AoE、UTC 和本地时间；关注列表；每天更新；**显示变更记录**（"3 个会议届次有变化"） | 只有摘要和正文截止；是否开源不明 |
| [AI Conf Tracker](https://xuanzhang2222.github.io/ai-conf-tracker/) | 网页、iCal | 17 个 AI 会 | 全流程时间线，每个日期都附官方来源 | 覆盖太少；只有一个人维护 |
| [HF AI Deadlines](https://huggingface.co/spaces/huggingface/ai-deadlines)（正迁往 paperswithcode.co） | 网页 | 68 个系列 | MIT；每个会议有多个带标签的节点；由 AI agent 自动更新 | 界面不显示 CCF；没有订阅 |
| [Entropia Labs](https://entropialabs.ai/deadlines) | 网页、iCal | 353 个届次 | 全阶段时间线（来自上游数据） | 注册费只有 AAAI 2026 一条；录用率为空 |
| [会伴](https://www.myhuiban.com/) | 网页、iCal、RSS、邮件、API、MCP | 5,819 个会议 | 覆盖最广；邮件提醒；CCF/ICORE/QUALIS；多年录用率 | 只有一个"投稿日期"，没有时区，没有阶段 |
| [deadlines.hhy.one](https://deadlines.hhy.one/) | 网页、iCal | 约 35 个会 | ARR 处理得最好；状态自动切换到下一个节点；中文界面 | 没有机器人会议，没有 CCF |
| [RoboDDL](https://roboddl.com/) | 网页 | 20 个会 + 13 个期刊 | 唯一专做机器人的 tracker；有 CCF/CAA/CAAI 等级 | 只有截止日期 |
| [具身智能投稿日历](https://liujiting123.github.io/embodied-deadlines/) | 网页 | 具身智能相关会议 | 每个日期附官方来源和时区说明 | 9/22 刚建，靠人工更新 |
| [conference-calendar (chihduo)](https://chihduo.github.io/conference-calendar/) | 网页 | FM/PL/SE/AI，共 45 个 | 开源；bot 每天更新 | AI 会议只有 13 个 |

## 2. 个人投稿管理（和本项目的规划器最接近）

| 产品 | 平台 | 做了什么 | 缺什么 |
|---|---|---|---|
| [Auctorium](https://apps.apple.com/us/app/auctorium/id6756827686) | iOS、iPadOS、macOS | 按论文管理状态（Idea → Published）、合作者和多个截止日；2026 年发了 12 个版本 | 不开源；没有会议数据库，全部手填；没有决策建议 |
| [Acta](https://github.com/qiaoxu123/acta) | Tauri 桌面，local-first | 数据格式很全（有 rebuttal、notification、camera-ready） | 全部手填；6 月后停更 |
| [DDL Radar](https://yzyhhhstudy.github.io/paper-deadlines/) | PWA、浏览器插件 | 个人看板（Planned → Accepted/Rejected）；浏览器通知 | 7 月后停更；数据稀疏 |
| [DDL Atlas CN](https://xiaoxiaomiwang.github.io/ddl-atlas-cn/) | 网页 | 甘特图，加一个 **TRANSFER PLANNER**（转投规划） | 停更，GitHub 已停用它的定时任务；只有 39 个届次有审稿阶段数据 |
| [OnlyTop AI](https://onlytop.ai/deadlines) | 网页 | Submission Strategy（Planner、Fallback Map） | 策略数据停在 2026 年周期 |
| [OpenReview Monitor](https://openreview-monitor.vercel.app) | 网页 | 监控 OpenReview 上投稿状态的变化 | 2026-02 后未更新 |

## 3. 手机和桌面

- **iOS**
  - [PaperDue](https://apps.apple.com/cn/app/id6761820921)：CCF 和 CORE 标签，摘要和正文分别倒计时；只有 Apple 平台，不能订阅日历。
  - AI Conference Dday：桌面和锁屏小组件，带 AAAI Phase-1；没有机器人会议，没有 CCF。
- **微信**
  - ccfddl 小程序：只显示全文截止。
  - 深度之眼 ddlRadar：有摘要和全文截止、三种等级。
  - 轻松参会：每个 CCF 会议一个投稿交流群。
- **macOS**：PaperRush Bar（D-7/3/1 提前通知）、DDL Desk、CCFBar。
- **Windows**：ConferenceDDL-Windows。

## 4. 注册费（零星数据）

| 来源 | 情况 |
|---|---|
| [ConferenceGate](https://www.conferencegate.net/) | 只给粗略区间，例如 AAAI-27 为 USD 500–1200 |
| [se_prices](https://github.com/jrfaller/se_prices) | ICSE、FSE、ASE、ICSME 2010–2026 的早鸟注册费 CSV。许可是 GPL-3.0，复用前要注意许可冲突 |
| [艾思科蓝](https://www.ais.cn/attendees) | 费用表完整，但只覆盖它自己办的商业 EI 会议，不含顶会 |
| 官方页面 | NeurIPS、ICML、ICLR、CVPR 用 `/Conferences/{Y}/Pricing`；USENIX 在各会的注册页 |

## 5. 讨论

- **[CallForPaper.org](https://callforpaper.org/)**：每个会议页有评论区，有 CCF/CORE 等级、提醒和 .ics。但没有摘要截止，数据有明显错误，例如 ICRA 2027 的通知日写成了 2029 年。
- **微信群**：轻松参会、ccfddl.top 给大部分会议配了企业微信群。
- **其他**：Paper Copilot 的 Discord、知乎"如何评价 XX"问题、Reddit r/MachineLearning、OpenReview 公开讨论。
- CSPaper 论坛已在 2026-03 关闭。

## 6. 统计

- [Paper Copilot](https://papercopilot.com/)：录用率、审稿分数分布、rebuttal 期间分数变化。2026 下半年更新变慢。
- [CS Conf Stats](https://csconfstats.xoveexu.com/)、[Conference-Acceptance-Rate](https://github.com/lixin4ever/Conference-Acceptance-Rate)：历年录用率。
