# NextVenue ／ 投稿下一站

**被拒之后下一站投哪？每条投稿路线什么时候关闭？每个答案都附官方原文。**

**在线使用：<https://ziziphus-jujuba-zao.github.io/NextVenue/>**（手机浏览器打开即可，不用注册；可「添加到主屏幕」当 App 用，离线也能打开）

覆盖各学科的学术会议，计算机为主：工程（控制、交通、自动驾驶……）、医学、生命、物理、化学、数学、地学、社科都有，CCF 目录里的每个会议都能搜到，会议名旁标出 CCF / CAAI / 科协目录等级（照录目录原文，带版次和出处）。App 告诉你下一个截止是什么、之后还能改什么；规则卡回答"摘要截止后还能加作者吗？撤稿会不会公开？CVPR 注册算不算投稿？"。每个日期和每张卡都逐字引用官网原句，点链接直达官网高亮位置，CI 会校验原文确实存在于我们保存的官网快照中。

*Submission deadlines and rules for academic conferences across disciplines, computer science first; every date and answer backed by a verbatim official quote. Dates imported from [ccfddl](https://ccfddl.com/) (MIT) are marked unchecked until verified against the venue.*

> 状态：早期版本。已收录 509 个会议系列、419 届（其中 251 届来自 ccfddl、标"未核对"），12 届会议共 94 张规则卡。仅供决策参考，以官网为准。

## 这个项目要做什么

四块，按 [docs/ROADMAP.md](docs/ROADMAP.md) 逐步交付：

1. **规则库**：按会议、按年份的规则卡，带逐字原文、核对日期，官方说法矛盾或没说时明确标出。
2. **政策监控**：每天检查规则原文是否还在官网上，页面从 404 变成可访问、原句消失都会提醒。
3. **个人规划**：在你自己的电脑上，把多篇论文的投稿路线按"哪条先走不通"排序。
4. **审稿后决策**：留下 rebuttal 还是撤稿转投，并列两边的官方后果。

论文、审稿意见和计划只存在你自己的设备上，本项目不收集任何个人数据。

## 本地运行

需要 Node.js 20+ 和 pnpm 10（`npm i -g pnpm`，或 `npx pnpm@10`）。

```bash
pnpm install
pnpm validate        # 校验数据结构
pnpm check:quotes    # 校验每条原文都在官网快照中
pnpm test            # 单元测试
pnpm build           # 生成 dist/bundle.json、手机 App（dist/site/index.html）和桌面版规则页（dist/site/all-rules.html）
pnpm ranks:report    # 等级标签：每个系列挂上了哪些，哪些有歧义、还没有系列
pnpm import:ccfddl --commit <sha> --dry-run   # 从 ccfddl（MIT）导入上游届次，先看摘要
```

系列、方向（学科 → 方向）、CCF / CAAI / 科协等级标签和 ccfddl 上游数据的格式见 [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md) 第 9 节。上游数据在 App 里标"未核对"。

手机 App 是一个离线可用的单页（数据内联在页面里，往年数据在旁边的 `stats.js` 里按需载入，`file://` 直接打开也能用），源码在 [apps/mobile](apps/mobile)，设计规格见 [docs/MOBILE_SPEC.md](docs/MOBILE_SPEC.md)。测试用参数：`?now=2026-09-25T21:00%2B08:00` 固定当前时间，`?theme=dark|light`，`?prefs=neurips,iclr,icml|acl,emnlp` 设投稿偏好（`|` 前是首选，后是备选），`?topics=cs/ml,eng/control` 设方向（taxonomy id；旧的 `ml,nlp` 也认），`?demo=1` 加两篇示例论文，`?reset=1` 清空本机数据（旧的 `?follow=all` 仍可用）。`pnpm shots` 用 Chrome 按真实手机尺寸截图到 dist/shots；`pnpm icons` 用 rsvg-convert 从 SVG 重新生成 PNG 图标（图标母版在 [docs/brand](docs/brand)）。

## 参与贡献

最有用的贡献是规则卡：从官网原文出发，写一个问题、一个答案、一段逐字引文。格式和流程见 [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md)。发现卡片错误，请提 issue 并附官网原文链接。

提交 PR 即表示：你有权提交这些内容；同意代码按 AGPL-3.0-or-later、数据按 CC BY-SA 4.0 授权；并同意维护者可以把你的贡献以其他许可证再授权（例如用于微信小程序版）。

## 文档

| 文件 | 内容 |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | 路线图（以此为准） |
| [docs/MOBILE_SPEC.md](docs/MOBILE_SPEC.md) | 手机 App 设计规格 |
| [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md) | 规则数据编写指南 |
| [docs/VENUE_RULES.md](docs/VENUE_RULES.md) | 12 个会议的规则调研（规则卡的原始材料） |
| [docs/DESIGN.md](docs/DESIGN.md) | 架构设计 |
| [docs/BRAINSTORM.md](docs/BRAINSTORM.md) | 76 个功能点子及评分 |
| [docs/PAIN_POINTS.md](docs/PAIN_POINTS.md) | 投稿人痛点清单 |
| [docs/LANDSCAPE.md](docs/LANDSCAPE.md) | 现有产品调研 |

## 作者

Zayier Xie（[@ziziphus-jujuba-zao](https://github.com/ziziphus-jujuba-zao)）

## 许可

代码按 [AGPL-3.0-or-later](LICENSE) 开源：可以自由使用、修改和分发，但修改后的版本（包括做成网站或 App 给别人用）必须同样以 AGPL 公开源代码。本项目自己整理的数据（规则卡、说明等）按 [CC BY-SA 4.0](DATA_LICENSE.md) 授权，转载请署名并以相同许可证共享。“投稿下一站”“NextVenue”名称和图标不在授权范围内，fork 请换用自己的名称和图标（见 [NOTICE](NOTICE)）。

引用的官方原文和 `snapshots/` 下的官网快照版权归各会议所有，仅作引用和校验，主办方要求删除的 72 小时内处理。用到的第三方数据及其许可证见 [NOTICE](NOTICE)，App 里在「我的 → 版权与第三方数据」。

## In English

NextVenue answers two questions for researchers: where can this paper go next, and when does each route close? It covers academic conferences across disciplines, computer science first, and every date and rule answer is backed by a verbatim quote from the official site; CI checks each quote against a saved snapshot of the page. Papers, reviews and plans stay on your own device.

Try it in your browser: <https://ziziphus-jujuba-zao.github.io/NextVenue/> (no account; add it to your home screen to use it as an app).

Code: AGPL-3.0-or-later. Own data: CC BY-SA 4.0. The NextVenue name and icon are not licensed. Issues and pull requests are welcome; please link the official page for any rule correction.
