# NextVenue ／ 投稿下一站

**被拒之后下一站投哪？每条投稿路线什么时候关闭？每个答案都附官方原文。**

现在上线的是第一部分：CS/AI 顶会投稿规则卡。摘要截止后还能加作者吗？撤稿会不会公开？CVPR 注册算不算投稿？这里的每张卡都逐字引用官网原句，点链接直达官网高亮位置，CI 会校验原文确实存在于我们保存的官网快照中。

*Submission rules for CS/AI conferences, every answer backed by a verbatim official quote. Not another deadline tracker — for deadlines, use [ccfddl](https://ccfddl.com/) or [PaperDDL](https://www.paperddl.com/).*

> 状态：v0.0，数据正在录入（首批 ICLR 2027、CVPR 2027、AAAI-27、ARR 2026 年 10 月轮）。仅供决策参考，以官网为准。

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
pnpm build           # 生成 dist/site/index.html
```

## 参与贡献

最有用的贡献是规则卡：从官网原文出发，写一个问题、一个答案、一段逐字引文。格式和流程见 [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md)。发现卡片错误，请提 issue 并附官网原文链接。

## 文档

| 文件 | 内容 |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | 路线图（以此为准） |
| [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md) | 规则数据编写指南 |
| [docs/VENUE_RULES.md](docs/VENUE_RULES.md) | 12 个会议的规则调研（规则卡的原始材料） |
| [docs/DESIGN.md](docs/DESIGN.md) | 架构设计 |
| [docs/BRAINSTORM.md](docs/BRAINSTORM.md) | 76 个功能点子及评分 |
| [docs/PAIN_POINTS.md](docs/PAIN_POINTS.md) | 投稿人痛点清单 |
| [docs/LANDSCAPE.md](docs/LANDSCAPE.md) | 现有产品调研 |

## 作者

Zayier Xie（[@ziziphus-jujuba-zao](https://github.com/ziziphus-jujuba-zao)）

## 许可

代码：MIT（见 [LICENSE](LICENSE)）。本项目自有数据：CC BY 4.0（见 [DATA_LICENSE.md](DATA_LICENSE.md)）。引用的官方原文和官网快照版权归各会议所有，仅作引用。
