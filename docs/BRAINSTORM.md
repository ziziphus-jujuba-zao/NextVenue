# 头脑风暴：四大支柱的点子清单（2026-09-24）

> 6 个方向发散出 147 个点子，去重后剩 76 个。三位评审各有侧重（研究者看价值、工程师看可行性、领域主席看安全和差异化），每个点子按 1–10 打分，取三人平均。
> 综合分 = 0.35×价值 + 0.25×可行性 + 0.25×差异化 + 0.15×安全。排期以 [ROADMAP.md](ROADMAP.md) 为准，本文件是完整点子池。

## 主线

- 本地优先贯穿始终：审稿原文、分数、计划、邮件只在本机处理；对外只交换计数、代号或经 LDP 加噪的汇总，唯一需要服务器的是分数众包（D14），应单独治理并最后做
- 引文规则卡（R01）和三值 DSL（R03）是地基：几乎所有规划、决策、监控、问答功能都要依赖“带逐字原文、区分未规定/矛盾/继承”的规则数据，应在第 1–3 周优先建设
- 日期、计数、上限、概率一律交给普通代码；Jev 或 LLM 只做文本分诊和从已核实选项中挑选（X05），并用多判断方交叉和在线校准决定能信多少
- “最后可用出口”和“最晚安全决定时刻”取代“截止倒计时”，成为产品的核心时间概念（P01、W06、D05），这是和 PaperDDL、ccfddl 等 tracker 的根本区别
- 违规连带和群体协作是真实痛点：按人计算的上限、担保人容量、审稿失职牵连（P03、P06、D13）需要组级视图，但要用加密 git、只含数字的回执和本机 bot 实现，不自建服务
- 政策监控不能只做整页 diff，要做语义层面的检测：引文存活、沉默删除、情态词强度、配置和文字不一致、页面生命周期、regime 变更，然后按个人暴露程度决定推送级别（W01–W09、W16）
- 所有功能都有合规护栏：不帮规避上限、双投、匿名、LLM 检测和拒稿披露，只给原文和后果；不可逆操作有后果预览和冷静期（D12），建议始终写明“仅供决策参考”
- 冷启动靠真实决策日而不是功能清单：11/5 ICLR 审稿夜首发（X06）、每个决策日前 3 天发带原文的卡片（X07）、发给合作者的义务链接（P04）、开放 API 和 feed 回馈上游（X04）
- 中国特有的约束是差异化来源：调休和春节、因公出国审批、CCF 目录版本、学校毕业口径、科协资助声明、微信群传播（P10、P11、P12、W10、X07）
- 可持续靠治理：从原文开始贡献、会议认领人、首发者署名、覆盖率热力图、按信息价值排核实队列、反驳 agent 和合成人物测试把关（X08、W18、W13）

## 总排名

| # | id | 点子 | 支柱 | 规模 | 综合 | 价值 | 可行 | 差异 | 安全 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | R01 | 逐字引文规则卡（带官网高亮深链） | 规则库 | M | 8.38 | 8.7 | 8 | 8 | 9 |
| 2 | W01 | 引文存活哨兵 | 政策监控 | S | 8.23 | 7.7 | 8.3 | 8.7 | 8.7 |
| 3 | P01 | 选项到期队列：按“哪条路先走不通”排序 | 个人规划 | M | 8.08 | 9 | 6.3 | 9 | 7.3 |
| 4 | W06 | 假设登记簿：继承规则、挂起规则与最晚安全决定时刻 | 政策监控 | M | 8.03 | 7.7 | 7 | 9 | 9 |
| 5 | W02 | ARR 规则仓库与新轮次监测 | 政策监控 | M | 7.95 | 6.7 | 9 | 8.7 | 8 |
| 6 | R09 | desk reject 排查清单与第一篇论文护航向导 | 规则库 | M | 7.95 | 8.3 | 7.3 | 8 | 8 |
| 7 | P10 | 工作日引擎：调休、春节与校内隐形截止 | 个人规划 | M | 7.92 | 7 | 8.3 | 8.3 | 8.7 |
| 8 | W16 | 按个人暴露程度计算严重度 | 政策监控 | M | 7.92 | 8 | 7.3 | 8.3 | 8 |
| 9 | W05 | 页面生命周期探针与“该出没出” | 政策监控 | S | 7.73 | 6.3 | 9 | 7.7 | 9 |
| 10 | D09 | ARR 三天决策包与资格模拟器 | 审稿后决策 | M | 7.72 | 8 | 6.7 | 9 | 6.7 |
| 11 | X03 | 本地 MCP server：让 AI 助手查规则、算可行性、读计划 | 跨支柱 | M | 7.67 | 7 | 7.7 | 9 | 7 |
| 12 | R05 | “现在还能改什么”字段锁面板与 Rule Lens 表单标注 | 规则库 | M | 7.62 | 8 | 5.7 | 9 | 7.7 |
| 13 | W12 | 政策年表与“自你上次投这个会以来改了什么” | 政策监控 | M | 7.60 | 8 | 5.7 | 9.3 | 7 |
| 14 | R04 | 官方矛盾与规则空白：检测、账本与向 PC 求证 | 规则库 | M | 7.43 | 6.7 | 6.3 | 9.7 | 7.3 |
| 15 | R06 | 转投 A→B 规则 diff 与 crlint 版式预检 | 规则库 | L | 7.40 | 8.7 | 5 | 7.7 | 8 |
| 16 | X02 | 作者名单冻结前的署名清点 | 跨支柱 | S | 7.38 | 6 | 8.7 | 7.7 | 8 |
| 17 | X04 | 开放数据层：规则 API、变更日志 feed、llms.txt | 跨支柱 | M | 7.37 | 6.3 | 8 | 8 | 7.7 |
| 18 | P08 | 就绪度探针与悬崖日曲线 | 个人规划 | M | 7.33 | 7 | 6 | 8.3 | 8.7 |
| 19 | R07 | 匿名泄露扫描器（稿件与补充材料） | 规则库 | M | 7.33 | 7.3 | 7.7 | 6 | 9 |
| 20 | R11 | 执法记录：这条规则真的会执行吗 | 规则库 | S | 7.32 | 5.7 | 8.3 | 9 | 6.7 |
| 21 | P16 | 五层日历与依赖驱动的提醒 | 个人规划 | M | 7.17 | 8 | 6 | 6.7 | 8 |
| 22 | W17 | 计划的 Dependabot：数据一变给私有计划仓库开 PR | 政策监控 | M | 7.17 | 5.3 | 7.3 | 9.7 | 7 |
| 23 | R02 | 按日期回答、只挑卡片的规则问答 | 规则库 | L | 7.10 | 8 | 5.7 | 7.3 | 7 |
| 24 | W04 | 截止日期三方对账 | 政策监控 | M | 7.07 | 7 | 7 | 6.7 | 8 |
| 25 | X01 | 合规 rebuttal 编辑器（含规则原文插入与语气检查） | 跨支柱 | M | 7.07 | 7.7 | 6.7 | 6.7 | 7 |
| 26 | P19 | 实习离场交接模式 | 个人规划 | S | 7.05 | 4.7 | 8.3 | 8.3 | 8.3 |
| 27 | D16 | 机器人会议族：PaperCept 规则包与 ICRA→IROS/RA-L 决策卡 | 审稿后决策 | M | 7.03 | 6 | 6.7 | 8.7 | 7.3 |
| 28 | P18 | 滚动通道：TMLR + J2C 纳入转投图 | 个人规划 | M | 7.02 | 5.7 | 7.7 | 7.7 | 8 |
| 29 | W08 | 语义级 diff：沉默删除、情态词与范围词强度 | 政策监控 | M | 7.02 | 6.7 | 5.3 | 9 | 7.3 |
| 30 | W10 | 会议之外的政策：CCF 目录、资助方与制裁条款 | 政策监控 | M | 7.00 | 7 | 7 | 8 | 5.3 |
| 31 | R12 | 规则问答评测集（ConfRulesQA / RuleBench） | 规则库 | M | 6.95 | 4.3 | 7.3 | 9 | 9 |
| 32 | P13 | 免手填导入与邮件事件流 | 个人规划 | L | 6.93 | 8.7 | 4.7 | 7.3 | 6 |
| 33 | W18 | 按信息价值排核实队列 | 政策监控 | M | 6.93 | 5 | 6.3 | 9 | 9 |
| 34 | D05 | 盈亏平衡概率卡（留下还是撤稿） | 审稿后决策 | M | 6.90 | 6.7 | 6.7 | 8 | 6 |
| 35 | X07 | 可转发的政策卡片与社媒素材 | 跨支柱 | S | 6.87 | 5.7 | 8.3 | 7 | 7 |
| 36 | R08 | 参考文献核查：幻觉引用与同期工作标注 | 规则库 | M | 6.77 | 7.3 | 7 | 5 | 8 |
| 37 | D06 | 决策预承诺契约与合作者投票 | 审稿后决策 | S | 6.72 | 4.3 | 7.3 | 8.7 | 8 |
| 38 | D01 | 审稿日分诊台 | 审稿后决策 | L | 6.70 | 8 | 6.3 | 5.7 | 6 |
| 39 | W07 | 规则波动指数 | 政策监控 | S | 6.63 | 4.3 | 7 | 8.7 | 8 |
| 40 | W11 | 跨会规则矩阵与扩散雷达 | 政策监控 | L | 6.62 | 5.3 | 6 | 9 | 6.7 |
| 41 | P14 | 论文谱系与转投修改追踪 | 个人规划 | L | 6.60 | 6.7 | 5 | 7.7 | 7.3 |
| 42 | P04 | 合作者加密链接：义务清单与余量回执 | 个人规划 | M | 6.58 | 5.3 | 6 | 8.7 | 7 |
| 43 | W09 | regime 变更与事件模式：证据失效时降级建议 | 政策监控 | M | 6.58 | 5 | 5.7 | 8.7 | 8.3 |
| 44 | D12 | 不可逆操作护栏：后果预览与冷静期 | 审稿后决策 | M | 6.57 | 6 | 4.7 | 9 | 7 |
| 45 | P05 | 互审资格解锁预测 | 个人规划 | M | 6.52 | 5.7 | 5.3 | 9 | 6.3 |
| 46 | P11 | 到场可行性与报告人规划 | 个人规划 | L | 6.52 | 7 | 4.7 | 8 | 6 |
| 47 | D11 | 决策日志、规则存证与个人校准 | 审稿后决策 | M | 6.52 | 4.7 | 6.7 | 7.7 | 8.7 |
| 48 | D03 | 信号还是噪声：重投前要改多少 | 审稿后决策 | M | 6.50 | 6 | 7.3 | 6.7 | 6 |
| 49 | P02 | 对冲摘要账本 | 个人规划 | M | 6.48 | 5.3 | 7.3 | 8.3 | 4.7 |
| 50 | W19 | 【Moonshot】推动会议发布机器可读的投稿政策文件 | 政策监控 | XL | 6.48 | 6.3 | 2 | 9.7 | 9 |
| 51 | W03 | 投稿系统配置与表单即规则 | 政策监控 | M | 6.47 | 5.7 | 5 | 9.3 | 6 |
| 52 | D07 | rebuttal 窗口作战计划：实验预算与讨论节奏 | 审稿后决策 | M | 6.43 | 6.3 | 5.7 | 7 | 7 |
| 53 | P03 | 组级上限与担保人匹配求解器 | 个人规划 | L | 6.40 | 6.7 | 4 | 8.7 | 6 |
| 54 | P12 | 毕业路径求解器与本校规则包 | 个人规划 | L | 6.38 | 7.3 | 3.3 | 9.3 | 4.3 |
| 55 | R10 | AI 使用账本、写作 agent 护栏与按会声明生成 | 规则库 | L | 6.37 | 6 | 5.3 | 8.3 | 5.7 |
| 56 | P17 | 偏好标定：用二选一代替手填参数 | 个人规划 | S | 6.32 | 3.3 | 8.3 | 7.7 | 7.7 |
| 57 | R03 | 可执行规则 DSL：三值逻辑、严格度开关与证明链 | 规则库 | L | 6.28 | 6 | 3.3 | 9 | 7.3 |
| 58 | D10 | 审稿问题上报助手（有证据才上报） | 审稿后决策 | M | 6.27 | 5 | 7 | 7.7 | 5.7 |
| 59 | X08 | 以原文为起点的贡献、认领与核验治理 | 跨支柱 | M | 6.27 | 5.7 | 5 | 7.3 | 8 |
| 60 | D08 | 按拒稿理由选下一站 | 审稿后决策 | M | 6.13 | 6 | 6.7 | 5.7 | 6.3 |
| 61 | D15 | 转投路线条件录用率：公开数据 + LDP 众包 | 审稿后决策 | L | 6.10 | 5.7 | 4.3 | 8.3 | 6.3 |
| 62 | W14 | 传言账本与勘误榜 | 政策监控 | M | 6.10 | 4.7 | 6.7 | 8 | 5.3 |
| 63 | W13 | 数据 PR 质量闸门：反驳 agent 与合成人物影响测试 | 政策监控 | L | 6.07 | 4.7 | 5.3 | 7 | 9 |
| 64 | P15 | 公开足迹账本：首次公开日、opt-in 决策与静默期 | 个人规划 | M | 6.05 | 5 | 5 | 9 | 5.3 |
| 65 | D13 | PI 决策队列与组级 rebuttal 协调 | 审稿后决策 | L | 6.05 | 6 | 4 | 8 | 6.3 |
| 66 | P21 | 课题组协作层：加密同步、组会一页纸与群 bot | 个人规划 | L | 5.85 | 6.7 | 3.3 | 7.3 | 5.7 |
| 67 | P20 | 秘书视图与注册费众包录入 | 个人规划 | L | 5.77 | 4.7 | 4 | 8.3 | 7 |
| 68 | D02 | 摇摆审稿人与 rebuttal 投入排序 | 审稿后决策 | M | 5.72 | 5.7 | 5.3 | 6 | 6 |
| 69 | W15 | 作者邮件与 newsletter 中的规则：本地识别、脱敏上报 | 政策监控 | M | 5.63 | 4.3 | 5 | 8.7 | 4.7 |
| 70 | X06 | 11/5 ICLR 审稿夜首发 | 跨支柱 | M | 5.58 | 6.7 | 5 | 5 | 5 |
| 71 | X05 | packages/decide：Jev 分诊层与多判断方交叉校准 | 跨支柱 | M | 5.57 | 4.3 | 6 | 6 | 7 |
| 72 | P06 | 连带风险图与审稿人模式 | 个人规划 | M | 5.55 | 5 | 3.7 | 8.3 | 5.3 |
| 73 | P07 | 组合 what-if 工作台：结果树、规则压力测试、加一篇的代价 | 个人规划 | L | 5.55 | 5.3 | 3.7 | 7.7 | 5.7 |
| 74 | P09 | 产能账本：真实日历工时、规划谬误校正与审稿邀请顾问 | 个人规划 | M | 5.47 | 5.3 | 4.7 | 5.3 | 7.3 |
| 75 | D04 | ICLR 当届实时分位与讨论期改分预测 | 审稿后决策 | L | 5.23 | 7 | 4.7 | 3.7 | 4.7 |
| 76 | D14 | 社区分数池：隐私保护并用 ICLR 校准自报偏差 | 审稿后决策 | XL | 4.60 | 5.7 | 2 | 6.7 | 3 |

## 个人规划（21 个）

### P01 选项到期队列：按“哪条路先走不通”排序
排名 #3 · 综合 8.08 · 规模 M · 依赖 R03, P10

- **痛点：** tracker 只列截止日。手上 8 篇论文时，作者真正要知道的是哪天过后哪条投稿路线失效、再等几天能多知道什么。
- **做法：** 用 feasible() 和转投图反算每篇论文每条候选路线最早变成 infeasible 的时刻，排成全组合队列。每项写明：失去什么、替代路线多付什么（多等几个月、等级变化）、现在的最小动作。每篇在审论文另有一条时间轴，叠加信息事件（出审稿、改分、meta、出结果）和退路关闭事件（下一站截止、双投窗口开始、撤稿罚则生效），并算出“等到下一个信息事件之前会不会先关掉一条退路”。日期全部由代码计算，在日历里显示为“最后可用出口”。
- **例子：** 9/24：p1 转 ICLR 的出口 9/25 AoE（北京 9/26 19:59）到期，前提是 9/18 已注册摘要；p2“撤 AAAI 转 AISTATS”9/29 到期且 AAAI 撤稿不可撤回；p3 ARR 8 月轮 10/11 commit EACL 或 10/12 重投；p-007“转 CVPR”11/10 到期，比 AAAI 11/30 出结果早 20 天。
- **数据：** 带时区 milestones、双投窗口、edges、withdraw_penalty；私有 Submission 状态；feasible() 结构体
- **评审意见：**
  - researcher: This is the view I'd open every week, because the question it answers is what I actually lose if I wait. It should be the home screen. One wrong date would destroy trust, so every computed exit needs its source quote and an AoE/Beijing pair. Ship the paper-level queue first; the per-paper info-event overlay can come later.
  - builder: 核心卖点，直接复用 feasible() 和 edges，纯函数，golden tests 好写。瓶颈在数据：withdraw_penalty、双投窗口、pre_register_ok 需要人工逐会核对，首版只覆盖约 15 个已核会议，其余会议标“未知”，不去猜。
  - skeptic: 最强差异化（DDL Atlas 转投规划已停更，没人算"最后可用出口"）。但出口依赖 inherited/UNVERIFIED 的双投窗口和撤稿罚则，算错就是用户错过真实出口。每一项都要挂规则卡 id 和假设标签，时区换算要进 golden tests。

### P10 工作日引擎：调休、春节与校内隐形截止
排名 #7 · 综合 7.92 · 规模 M

- **痛点：** 真正的截止比会议早：导师审阅、保密审查、公司审批、专利申请按工作日排，而调休只提前约 3 个月公布，海外会议从不考虑春节。
- **做法：** core 内的工作日算术：中国法定节假日加调休，另叠加合作者所在地节假日。用户或学校模板设置内部流程（初稿交导师 T−10 工作日、保密审查、公司审批、专利先于首次公开），从最早公开事件倒推内部截止。2027 年放假安排未公布时用估计值标 provisional，国务院公布后（预计 11 月）作为政策事件自动重算并推送差异。
- **例子：** ICLR 9/25 正文截止正逢中秋，而 ICLR 投稿即公开，要专利的论文须在 9/25 前递交。明年 ICML（约 1/22）、CVPR rebuttal（1/25–2/1）、除夕（2/5）相连，引擎把 ICML 内部截止排在约 1/8。
- **数据：** 结构化国务院节假日公告；他国节假日；学校和公司流程模板
- **评审意见：**
  - researcher: Cheap core infrastructure with real value for CN users around Spring Festival and National Day. Build it into core early.
  - builder: 可以直接复用 NateScarlet/holiday-cn（自动抓取国务院公告的 JSON）。2027 年安排公布前标 provisional，公布后自动重算，这很容易实现。性价比很高，适合放进 v1。
  - skeptic: 调休、春节是中国用户独有的痛点，provisional 标注和公布后自动重算都做对了。

### P08 就绪度探针与悬崖日曲线
排名 #18 · 综合 7.33 · 规模 M · 依赖 R06, P12

- **痛点：** 论文完成日全靠作者自报且偏乐观；晚一天的代价不是线性的，过了某天就要多等几个月甚至推迟毕业。
- **做法：** 本地读 LaTeX 仓库（或 Overleaf git）：\todo 数、占位图、未解析引用、按目标会口径的页数差、模板是否对、必需章节是否在，结合历史速度估计完成日。再为每篇论文画阶梯曲线：横轴完成日，纵轴最优转投链 EV 或最早录用日；每个台阶是一个悬崖日（截止减内部审阅和格式转换天数），标出掉下去的代价和是否错过用户的毕业节点，一键设为内部里程碑。不上传任何内容。
- **例子：** CV 论文目标 CVPR 2027：8.7 页、14 个 \todo、模板还是 ICLR，按速度预计 11/13 完成。登记只需标题摘要，真正悬崖是 11/16；错过则下一站 ICML（约 1/22）或 ICCV（约 3/5），都赶不上 3/6 预答辩，曲线在此台阶标红。
- **数据：** page_limit、必需章节、模板指纹；本地 LaTeX 解析；毕业节点
- **评审意见：**
  - researcher: The page/template/todo check against the target venue is valuable in the final two weeks before every deadline. The velocity-based completion forecast is noise, so drop it and keep the cliff-day list.
  - builder: 统计 \todo 数、查未解析引用（读 latexmk 日志）、按本地 TeX 实际编译算页数，这些在 CLI 里可行，浏览器里太重。用历史速度估计完成日的噪声很大，只给区间。
  - skeptic: 只在本地读用户自己的 LaTeX，风险低。按目标会口径实测页数是真痛点。

### P16 五层日历与依赖驱动的提醒
排名 #21 · 综合 7.17 · 规模 M · 依赖 P10, R01, W16

- **痛点：** 订阅来的 ICS 把所有截止平铺，重要的事被淹没；提醒按截止前 N 天触发，而真正出事的是上游前置事项。
- **做法：** 个人日历分五层可单独订阅：事实层（标题同时写会议时区和北京时间）、义务层、决策层、锁定层（双投锁定用跨天色块）、缓冲层。提醒从依赖图倒推：每个硬义务有前置任务和所需时间，在前置任务最晚开工日提醒其负责人。设每人每周提醒预算，超出按严重度合并；点“完成”后整串提醒全设备停止。写入日历 API 时逐事件设提醒，不依赖 ICS VALARM。
- **例子：** CVPR 2027 登记 11/10 AoE（北京 11/11 19:59）依赖“作者资料 8 项齐全 ← 非机构邮箱审核最长 2 周”，第一条提醒是 10/27 发给无机构邮箱的本科生“今天注册 OpenReview”。锁定层显示 CVPR 双投窗口 11/16–2/22 盖住 ICML 截止。
- **数据：** milestones 与按会议的依赖模板；资料要求、双投窗口；角色分配；推送通道
- **评审意见：**
  - researcher: Must-have. Subscribable ICS with AoE plus Beijing time in the title, and a reminder that stops once the task is marked done. ccfddl already has ICS, so the real differentiators are the dependency-driven first reminder and the lock-window blocks.
  - builder: 最难的是提醒怎么送达：PWA 不能定时推送本地通知（Notification Triggers 已废弃），Web Push 需要服务器；Google 订阅日历会忽略 ICS 里的 VALARM。可行路径：在用户私有仓库用 Actions cron 发邮件或 bot 消息，或者用桌面 CLI 定时任务。分层 ICS 本身很好做。
  - skeptic: 截止提醒各家都有（会伴、PaperRush Bar），差异在于按依赖倒推和每人的提醒预算。

### P19 实习离场交接模式
排名 #26 · 综合 7.05 · 规模 S · 依赖 P16, P13

- **痛点：** 实习生和换工作的研究者常在出结果前离开：公司邮箱停用、算力没了、rebuttal 无人负责。
- **做法：** 每位作者设 end_date，与所有在审论文后续节点比较，生成交接清单：改 OpenReview/PaperCept 首选邮箱、指定 rebuttal 负责人和备份、离开前跑好可能需要的实验、确认开源审批、camera-ready 单位写法。邮件监控规则同步切到个人邮箱。
- **例子：** 实习生 12/31 离开，CVPR rebuttal 在 1/25–2/1：12/1 提醒交接负责人、趁在公司跑完基线；他的 OpenReview 首选邮箱仍是公司邮箱，离开后收不到审稿通知。
- **数据：** 作者 end_date 和邮箱（本地）；时间线；投稿系统邮箱规则
- **评审意见：**
  - builder: 就是一份模板加现有时间线，成本很低。
  - skeptic: "趁在公司跑完基线"可能违反雇主的知识产权和数据政策，应改为提示"确认离职后代码和数据的使用权"。

### P18 滚动通道：TMLR + J2C 纳入转投图
排名 #28 · 综合 7.02 · 规模 M · 依赖 R01, P12

- **痛点：** 转投链只在会议间跳，被拒两三次的论文越来越过时；TMLR 录用后可到 NeurIPS/ICLR/ICML 报告，但 J2C 资格和截止没人跟踪。
- **做法：** 把 TMLR/JMLR 作为无截止节点放进转投图，审稿周期按历史分布估计。规则库记录 J2C 资格（2025-01-01 后发表、需 J2C/Featured/Outstanding Certification、未在会议发表过）与每届请求截止和名额。第三次转投时自动比较 TMLR 路线，并如实提示“国内评价口径请问本校”。
- **例子：** NeurIPS 2026 J2C 请求 9/26 截止、上限 150 篇。p-007 若 12/16 被 ICLR 拒，列出 ICML（约 1/22）与“TMLR → 下一届 J2C”，并提示 ICLR 2027 合格互审名单含 TMLR，走这条路还能拿到下一年担保资格。
- **数据：** J2C 规则与每届截止名额；TMLR 审稿周期统计；CCF 口径
- **评审意见：**
  - builder: J2C 规则是公开的，容易录入。统计 TMLR 审稿周期需要登录后抓 OpenReview（匿名 API 返回 403），首版先用 TMLR 官方指南里的时长。“国内是否认可”一定要交给用户所在学校判断。

### P13 免手填导入与邮件事件流
排名 #32 · 综合 6.93 · 规模 L · 依赖 X05

- **痛点：** Auctorium、Acta 全靠手填，用户录两周就放弃；匿名 OpenReview API 已 403，状态变化又只靠邮件，进了垃圾箱就漏掉。
- **做法：** 三条导入通道全在本地：(1) OpenReview：CLI 用用户自己的 token，或扩展读取已登录 Author Console 的 DOM，导入投稿、状态、合作者资料完整度；(2) DBLP 离线 dump 导入合作者发表记录，不在线查询以免暴露作者名单；(3) 邮件：.eml/.mbox 或 IMAP IDLE / Gmail 只读 scope，只处理白名单投稿系统模板，抽出会议、编号、事件，驱动本地状态机（reviews_released 生成 Review Round 卡片；deadline_changed 不采信邮件日期，改为触发重新抓官网）。每条导入显示来源和置信度，用户确认入库。导入后立刻生成一张体检单。
- **例子：** 9/24 拖入三封邮件：NeurIPS 决定、ICLR 收稿、AAAI Phase-1 通过，几秒生成 3 条记录并挂上节点；从 OpenReview 发现合作者 C 缺 DBLP 链接。10/12 ARR 确认邮件触发 48 小时 service contributor 注册提醒（T+1h/24h/44h）。
- **数据：** 脱敏邮件模板库（社区维护）；OpenReview 页面选择器；DBLP dump；可选 Jev 事件分类
- **评审意见：**
  - researcher: This decides adoption. Auctorium fails because everything is typed by hand. Start with drag-and-drop .eml files and an OpenReview CLI using the user's own token. IMAP/Gmail scopes and DOM scraping bring privacy and ToS risk and are brittle, so defer them.
  - builder: 免手填是采用的关键。gmail.readonly 是 restricted scope，公开应用必须通过 CASA 安全审计，一个人做不起，不要走这条路。可行的做法：拖入 .eml/.mbox；OpenReview 用用户自己的凭据跑 CLI（openreview-py）。扩展抓 DOM 容易失效，延后。
  - skeptic: 正好补上 Auctorium 全部手填的最大短板。但 Gmail 只读属于 restricted scope，公开应用要过 Google 安全审核，开源本地应用很难拿到，建议先做 .eml/.mbox 拖入。读取已登录的 OpenReview 页面要先核对 ToS，并且只读本人数据。

### P14 论文谱系与转投修改追踪
排名 #41 · 综合 6.60 · 规模 L · 依赖 R01, D01, X01

- **痛点：** 投过两三轮后，作者记不清哪版投了哪、收到什么意见、rebuttal 承诺了什么；ICLR 被拒论文和审稿公开后，下一站审稿人一搜就知道老问题没改。
- **做法：** 用 DAG 表示论文演化：节点是版本（PDF 哈希、页数、模板、AI 修改记录），边是派生、重投、workshop 扩展、合并、拆分；每次投稿挂审稿（本地）、分数、结果。rebuttal 编辑器自动识别承诺语句（we will add…）并记来源。被拒后生成追踪表：上一站每条意见（含 AC 点名理由）→ 本版改动或不改理由，已公开承诺优先。按目标会生成披露材料（IJCAI 被拒经历声明、ARR revision notes、KDD Summary of Changes）。比较兄弟论文摘要相似度提示近似重复，检查 workshop 前身是否算正式发表。明确拒绝帮论文“搜不到”。
- **例子：** p-007 v8 投 NeurIPS 被拒，v12 投 ICLR；若 12/16 再被拒，ICLR 公开审稿的 5 条弱点和讨论期承诺的“补 X 对比、开源、Limitations”排在 ICML 修改计划最前。组内 p-011 与 p-007 摘要相似度 0.83，同投 CVPR 须互相披露。
- **数据：** 本地 PDF/LaTeX 快照、审稿文本、RevisionLog；prior_rejection_disclosure、same_venue_overlap 规则
- **评审意见：**
  - researcher: Mapping each previous review point to a change is useful after every rejection, and ARR/IJCAI require disclosure anyway. The rebuttal-promise tracker is the best piece; the full DAG can wait.
  - builder: 版本 DAG 与 git/Overleaf 功能重叠。最小可用切片是“上一站意见 → 本版改动”的追踪表，加上 rebuttal 承诺语句的提取。近似重复检测做成本地 embedding 即可。
  - skeptic: 主动提示相似度和需要的披露、明确拒绝帮论文"搜不到"，这些都是加分的诚信设计。

### P04 合作者加密链接：义务清单与余量回执
排名 #42 · 综合 6.58 · 规模 M · 依赖 R01, P16

- **痛点：** 中间作者和外单位合作者不装 App，却最容易出事；排期器又需要他们在各会的投稿数，而对方不愿透露在投什么。
- **做法：** 一作在本地给每位合作者生成一次性加密链接（密钥在 URL fragment，静态页，服务器看不到内容），页面只列这个人的义务和日期：建号、资料完整度、审稿配额、担保注册、到场报告，可一键订阅 ICS。对方回传一张签名的“余量凭证”：{会议, 还能参与 ≥k 篇, 是否合格互审作者, 截至时间}，只有数字没有论文。凭证超过 7 天或越过摘要截止自动变灰；选“不确定”按上限减 1 计。页面底部是自己管理投稿的入口，也是传播路径。
- **例子：** 10/27 给 CVPR 2027 合作者发链接：外校老师回传“≥6 篇余量”，企业合作者自检发现缺 DBLP 链接，T-14 标红。ARR 10 月轮担保人在链接里点“已注册”，一作看板同步显示。
- **数据：** 义务模板、资料要求；WebCrypto 签名；回执通道（复制回执码或 Gist）
- **评审意见：**
  - researcher: External co-authors won't click an unfamiliar encrypted link and send back signed certificates. Too much friction. Asking in a WeChat message is how this gets done today.
  - builder: 静态页加 fragment 密钥可以做到。问题有两个：没有 PKI，“签名凭证”只是形式；回执靠复制码回传，体验差，而且要合作者配合。首版只发“个人义务 + ICS 订阅”的只读链接。
  - skeptic: 不含论文内容，这点好。但签名凭证会给人"已核实"的错觉，其实只是本人自报；上限是按会议的全部投稿算的，凭证过期仍可能触发随机 desk reject。

### P05 互审资格解锁预测
排名 #45 · 综合 6.52 · 规模 M · 依赖 R01, P13

- **痛点：** 学生第一次中稿的日期决定下一轮能投哪些会、能投几篇，但没人把“还没出的结果”和“以后的资格”连起来算。
- **做法：** 按每一届规则（合格 venue 名单、资格计算截止日、篇数门槛）算出每个人现在的资格，以及“某个待定结果若录用”之后在哪些会获得担保资格，画成时间线。排期器据此把需要担保人的论文排到资格解锁之后；规则未出时沿用上一届并标 inherited。
- **例子：** 学生 S 的 AAAI-27 论文 11/30 出结果。ICLR 2027 只算 9/18 前录用，S 与 9/24 才中 NeurIPS 的 T 都不合格；S 若 11/30 录用，按 ICML 2026 规则可在 ICML 2027 摘要前担保 2 篇；NeurIPS 2027 仍不够（需 2 篇一作或 5 篇合著）。
- **数据：** reciprocal_eligibility 字段；Person.publications；待定 Submission；DBLP 快照
- **评审意见：**
  - builder: 每届资格规则都要手工编码，改动频繁。DBLP dump 压缩后约 1GB，浏览器里跑不动，只能放 CLI，或让用户自己填发表记录。“若录用则解锁”的推演逻辑本身很简单。
  - skeptic: DBLP 同名没消歧好，就会算出错误的资格。资格由会议判定，所以只能标"估计"，并提示用户到官方表单自查。

### P11 到场可行性与报告人规划
排名 #46 · 综合 6.52 · 规模 L · 依赖 P10, R01

- **痛点：** 多数会要求现场报告，但签证和因公出国审批（常见 40 个工作日）比“录用到开会”还长，选会时没人算“谁能去、来不来得及”。
- **做法：** 排期阶段为每篇论文指定候选报告人和备份，按护照、身份、学校审批提前量、目的地签证周期倒推最晚递签和最晚因公申请日，与出结果日比较。来不及就在出结果前生成“有条件预申请”任务，或在 scheduler 里加到场风险代价。规则库提供替代办法（IROS 可代讲，CVPR 线上报告仍须作者注册，NeurIPS 须非 Virtual Only 注册）。
- **例子：** AAAI-27 11/30 出结果、2/16 Montréal 开会，按 40 个工作日扣元旦和春节（provisional），因公申请最晚约 12/14，出结果后仅 10 个工作日，还要办加拿大 TRV。建议 10/25 feedback 结束就备材料；ICCV 2027 在香港，到场风险更低。
- **数据：** attendance 规则、会期地点；签证周期（社区维护）；学校审批模板
- **评审意见：**
  - researcher: Visa and official-travel approval really hurt Chinese researchers: Canada TRV, US visas, 40-working-day approvals. This matters 2-3 times a year. Visa lead times drift, so show them as community estimates with dates.
  - builder: 签证周期和学校因公审批提前量都没有可靠的公开数据，社区维护也会很快过时。改为用户自己填提前量，加上规则库的 attendance 字段（代讲、线上、注册要求）。签证建议有误导风险，要明确写“以使馆为准”。
  - skeptic: 众包的签证周期误差很大，算错可能导致 no-show 被撤稿。只给区间，并提示向学校外事确认。

### P02 对冲摘要账本
排名 #49 · 综合 6.48 · 规模 M · 依赖 R01, P03

- **痛点：** 对冲摘要会占上限、冻结作者名单、必须是真实摘要，主投录用后还要按时撤回，但没人管它从开立到结算的全过程。
- **做法：** 每份 hedge 记一笔账：开立日、按人占用的上限、是否触发审稿配额（规则未规定就标“需问 PC”）、撤回截止（正文截止前撤回才会删除、不公开）、结算日（主投出结果）。只有两边规则都明确允许 pre_register_ok 才推荐开。结果出来当天生成结算任务：主投中了就撤回，没中就转成正式投稿。组级汇总本周期全组开了多少 hedge。
- **例子：** 论文 10/6 投 AISTATS 2027（1/20 出结果），想在 ICML 2027 摘要（约 1/16，UNVERIFIED）对冲：ICML 规则沿用 2026 并标 inherited，占位摘要大改有 desk reject 风险；1/20 录用则须在 ICML 正文（约 1/22）前撤回。参照 ICLR：9/18 注册，9/25 前撤回会被删除。
- **数据：** pre_register_ok、author_cap、review_quota、withdrawn 可见性；Submission.role=hedge
- **评审意见：**
  - researcher: I'd use this once or twice a year. Recommending placeholder abstracts runs close to the desk-reject and dual-submission gray zone, even with the pre_register_ok gate. Better to show it only as a withdrawal-deadline reminder on abstracts I already have, not as a suggestion to open hedges.
  - builder: 账本本身只是一张表，很好做。但除 ICLR 外，多数会议的 pre_register_ok 是“未规定”，功能大多只会输出“需问 PC”。占位摘要是 PC 反感的做法，默认要保守，只在规则明确允许时出现。
  - skeptic: 规划类里风险最高。占位摘要会占用 PC 的 bidding 和审稿分配，ICML 等会明确 desk reject 占位摘要。几乎没有会议明文写 pre_register_ok，所以多数结果会是"需问 PC"。建议不要主动推荐开 hedge，只给用户已经开的记账。组级 hedge 汇总容易让批量对冲变成常态，建议去掉。

### P03 组级上限与担保人匹配求解器
排名 #53 · 综合 6.40 · 规模 L · 依赖 R01, P05, P04, P21

- **痛点：** 上限按人跨所有投稿累加，担保人一人最多 2 篇，组里没人看得到全貌，常在截止前两天才发现缺人或超限，学生被导师连带 desk reject。
- **做法：** 把“人×会议”计数和“论文×合格担保人”配对建成带容量的匹配或整数规划（HiGHS WASM），同时检查每轮上限、一作上限、ICLR 式“每人最多 1 篇无合格互审作者的论文”。加公平约束：每人审稿负担上限、保护新人、PI 不把超额转嫁给学生。无可行解时给出最少改动（换会、推下一轮、请已同意的外部合格合作者），由 PI 排优先顺序。明确不建议删作者或换作者规避上限。
- **例子：** ARR 10 月轮（10/12）组里 7 篇，只有 3 位合格 service contributor，最多担 6 篇，第 7 篇会进抽签；一位学生是 6 篇共同一作，超过一作 5 篇。10/5 标红，建议第 7 篇推到 1 月轮，contributor 按更早的 10/12 注册（ARR 页写 10/14，NAACL 页写 10/12）。
- **数据：** 规则库 author_cap/first_author_cap/资格定义与 as-of 日期；DBLP 离线 dump；组内 portfolio
- **评审意见：**
  - researcher: The pain is real for PIs at ARR or ICLR time, but a plain per-person counter with red flags covers about 80% of it. The eligibility data is the hard part, not the ILP. Postpone HiGHS until the counter is proven useful.
  - builder: 组内不到 30 篇论文，贪心加校验就够，不需要 HiGHS。真正做不到的是数据：合作者在别的组的投稿数只能自报；资格定义波动很大（ARR 一周改了 13 次）。先做“超限检查加最少改动提示”，求解器以后再说。
  - skeptic: "请已同意的外部合格合作者"这一项，等于为了凑互审资格加作者，属于 gift authorship，应删除，只保留换会和推轮次。HiGHS 整数规划对单人开发太重，先用贪心加校验。

### P12 毕业路径求解器与本校规则包
排名 #54 · 综合 6.38 · 规模 L · 依赖 W10, R01, D14

- **痛点：** 毕业、国奖、预答辩的要求（几篇、哪一版 CCF、认录用还是发表、统计截止）和会议出结果时间对不上；CCF 第七版把 IJCAI 降为 B，老转投路线可能不再算数；规则散在学院 PDF 里，导师看不清谁有风险。
- **做法：** 本校规则包：用户上传学院公开通知，agent 抽取成结构化规则（篇数、类别、CCF 版本、截止、录用/发表），每字段附原文页码，CI 校验引文，同学院同学审核后合入 data/schools/。求解器把每条候选路线标为“赶得上 / 赶不上 / 不算数”，给出最可能满足的路径、每篇论文的最晚录用日、换哪篇到哪个会最能提高达成率。PI 模式下每个学生一行风险，只有状态和日期。只认发表的学校用历年论文集上线日期推算。
- **例子：** 北大 3/6 前预答辩需 1 篇 CCF-A：AAAI（11/30）、ICLR（12/16，第七版 A）、CVPR（2/25）来得及，ICML 太晚，IJCAI-27 已是 B 类。建议最强论文投 CVPR；若学校仍按第六版目录，ICLR 可能不算，先问研究生院。厦大国奖“录用未发表不参评”。
- **数据：** 带版本号的 CCF/CORE；学院通知 PDF 与抽取器；论文集上线日期；advisor 区间
- **评审意见：**
  - researcher: High stakes for students, but per-school rule extraction doesn't scale and a wrong answer on graduation eligibility is costly. At most offer a CCF-edition-aware 'counts or not' flag and tell users to ask the graduate school.
  - builder: 价值高，但学校规则包几乎没法规模化：PDF 格式乱、同一个院系每年都改，还要有人审核。毕业判断错了后果严重。首版让用户手填要求（几篇、哪些等级、截止日、只认录用还是只认发表），求解器本身很简单，规则包以后再加。
  - skeptic: 毕业要求算错后果很重。学院通知常是内部文件，放进公开仓库有保密和版权问题；PI 模式集中展示学生风险，属于敏感个人信息。建议只在本地使用、不进公共库，每个结论都附"以研究生院书面答复为准"。

### P17 偏好标定：用二选一代替手填参数
排名 #56 · 综合 6.32 · 规模 S · 依赖 P12

- **痛点：** 排期器需要效用 U 和月折扣 δ，但没人说得出“CCF-B 值 CCF-A 的 0.6”，学生和导师偏好也不同。
- **做法：** 用 6–10 道基于用户真实会议和日期的二选一题反推 U(tier)、δ 和风险偏好，显示参数区间。导师和学生各做一遍，组级规划时显示分歧。重大结果出来后询问是否重新标定。
- **例子：** “A：12/16 有 35% 中 ICLR 2027；B：1/20 有 45% 中 AISTATS 2027。”做完 8 题估计 δ≈0.93/月，比默认 0.97 更着急，原因是设置了 3/6 预答辩节点。
- **数据：** 私有偏好；bundle 日期；advisor 区间
- **评审意见：**
  - researcher: No one will answer 8 lottery questions. Good defaults plus a single urgency slider are enough.
  - builder: 实现很简单，但它标定的是 EV 参数，而 EV 本身受 p 的质量拖累，边际收益低，可以往后排。

### P15 公开足迹账本：首次公开日、opt-in 决策与静默期
排名 #64 · 综合 6.05 · 规模 M · 依赖 R01, P10, R05

- **痛点：** 论文在哪些地方公开过（arXiv、ICLR 页面、NeurIPS opt-in、宣传帖）影响下一站匿名、宣传禁令、专利和 ARR 表单承诺；opt-in 窗口只有一次；业界研究者还要让专利先于首次公开。
- **做法：** 规则库为每会加 disclosure_events（投稿、撤稿、被拒、opt-in、录用何时公开）。每篇论文维护公开事件时间线，对每条转投链算最早公开日，倒推“发明披露→法务→专利→投稿”链，公开早于专利申请就阻断。出结果当天生成 NeurIPS opt-in 决策卡：截止日、公开后可见内容、对下一站审稿的影响。本地算出每篇论文的“静默约束”（时间段、禁止事项、原文），日历显示色块；浏览器扩展在 arXiv 提交页和 X/知乎/公众号编辑器检测到标题关键词时提示，只提醒不拦截、匹配只在本地。不是法律意见。
- **例子：** NeurIPS 被拒 opt-in 约到 10/8：p5 计划投 ARR 10 月轮且承诺“不发非匿名预印本”，建议不 opt-in；公司研究员若 opt-in，10/8 即首次公开，专利来不及；转投 CVPR 则公开日为挂 arXiv 那天，发明披露最晚 10/19。p-007 投 CVPR 后在 X 写 our CVPR submission 会被提示。
- **数据：** disclosure_events、publicity/arXiv 规则、opt-in 窗口；本地公开事件；法务提前量；扩展站点适配器
- **评审意见：**
  - researcher: The patent chain matters to industry researchers only. Watching social editors feels invasive. The NeurIPS opt-in decision card is the part worth keeping.
  - builder: disclosure_events 字段和 NeurIPS opt-in 决策卡都很便宜，值得做。在社交媒体编辑器上做监控的扩展，适配成本高、有侵入感，建议砍掉。专利链只面向公司研究员，而且接近法律意见。
  - skeptic: 首次公开日算错会让用户丢掉专利权，这是法律后果；扩展监听 X、知乎、公众号编辑器侵入性太强。建议只保留时间线和静默期色块，砍掉编辑器监听，专利部分只提示"咨询法务"。

### P21 课题组协作层：加密同步、组会一页纸与群 bot
排名 #66 · 综合 5.85 · 规模 L · 依赖 P16, R02

- **痛点：** 组里需要共享计划，但数据要本地优先，PI 不会为工具搭服务器；义务落在具体人身上，信息却在一作电脑里，靠微信群喊。
- **做法：** 全组 portfolio 存为 age 加密 JSON，放在组里已有的私有 GitHub/Gitee 仓库，客户端拉取、按字段合并、推送。每周一生成组会一页纸：本周硬义务、决策队列、撞车日、每人上限余量。bot 跑在负责人电脑上，用无需公网 IP 的方式（飞书长连接、钉钉 Stream、Slack Socket Mode、Telegram 轮询；企业微信仅单向推送）：群里只发脱敏内容（代号、截止、空缺角色、政策变化），卡片可认领角色、标记完成；个人义务私聊并逐级升级；/rule 命令查规则卡。附“一个组 30 分钟上手”脚本。
- **例子：** 10/12 ARR 截稿后 1 小时 bot 发卡片“p-021、p-022、p-025 需要 service contributor”，三位博士后认领，第 44 小时仍缺一人则私聊 PI。10/5 一页纸显示 10/12–21 有 5 位同学各有两个以上硬义务。
- **数据：** 加密格式；git 同步适配器；飞书/钉钉/Slack/Telegram 应用；提醒分级
- **评审意见：**
  - researcher: A Feishu bot would be used weekly by labs, but this is a large build with leak risk in group chat. Start with a markdown weekly one-pager to paste.
  - builder: 要同时对接四五家 bot 平台，还要处理 git 合并冲突、在 PI 电脑上长期运行，一个人维护不了。群里一旦发错字段就是泄密。只选一个通道（Telegram 或飞书），同步只做 age 加密文件加手动 pull。
  - skeptic: 密钥管理是难点：学生离组后要轮换密钥。群里即使只发代号也可能被反推出论文，默认只发最少的字段。

### P20 秘书视图与注册费众包录入
排名 #67 · 综合 5.77 · 规模 L · 依赖 P11, P10, W05, X08

- **痛点：** 秘书要用最少的钱在对的日期给对的人注册、赶上外事审批和报销，但不应看到论文内容；顶会实际注册费、覆盖篇数、拒签退款也无人系统收录。
- **做法：** 按角色裁剪的后勤视图：报告人、注册类型、费用、签证邀请函、因公审批、票据。含注册覆盖优化器（按“一份注册覆盖几篇”算最少注册数）、外事审批按工作日倒推、先申资助再注册的顺序提醒、报销时钟（年终冻结、次年 3/31）。数据由 PI 本地导出只含后勤字段的加密文件。内置“补录费用”表单：本地抓 Pricing 页、划选原文生成 YAML、一键开 issue 或复制到群，CI 校验 quote，贡献者署名；404→200 探针在 Pricing 上线时通知订阅的秘书。
- **例子：** ICRA 2027 中 5 篇且报告人都是学生：按 2026 规则学生注册只覆盖 1 篇、非学生 2 篇，改由两位非学生注册从 5 份降到 3 份。iclr.cc/2027/Pricing 从 404 变 200 时，秘书 3 分钟划选即生成 PR；已知 ICLR 只有 3/17 前递签被拒才退费。
- **数据：** 注册覆盖规则、费用、早鸟与退款截止；学校外事报销规则；fees schema；Pricing URL 模板
- **评审意见：**
  - researcher: Outside the four pillars and not for authors. Park it.
  - builder: 注册费数据本身不存在，众包启动很难。Pricing 页 404→200 的探针可以复用 W05，很便宜。注册覆盖优化器和报销时钟依赖各校规则，延后。
  - skeptic: 注册费是公认的空白（LANDSCAPE §4），众包录入必须附原文。外事和报销规则各校不同，只能做成模板。

### P06 连带风险图与审稿人模式
排名 #72 · 综合 5.55 · 规模 M · 依赖 R01, W01, P09, R05

- **痛点：** 合作者审稿迟交或违规用 LLM 会连累自己的论文（ICML 2026 因 398 位互审人违规 desk reject 497 篇），而审稿人政策在另一套页面，作者不看，也会忘记自己选过 Policy A 还是 B。
- **做法：** 规则库给每条处罚标 blast_radius（本篇、违规者全部论文、本篇全部作者、合作者看不到审稿、禁投）。watcher 同时监控审稿人侧页面。本地建“人→论文→审稿义务”图，算每人的连带半径，超阈值时建议分散担保，并把高风险人的审稿排进产能日历。浏览器扩展在审稿页显示该会审稿端 LLM 规则和用户当初的选择，提供本地“LLM 输入日志”按会议格式导出，只辅助如实披露，不代写审稿。提醒只发给承担义务的本人。
- **例子：** 学生 A 担保 ARR p1、p2，又是 p3、p4 作者，还要 10/1–21 给 ICLR 审 6 篇：半径 4 篇、7 位合作者。建议博士后接手 p2，A 的 ICLR 审稿排在 10/8–18 避开 AAAI feedback 周；ICLR 2027 要求提交原始评估和全部 LLM 输入，违规可 desk reject 本人全部论文。
- **数据：** penalty.blast_radius、审稿配额与截止、审稿端 LLM 规则；reviewer_duties；扩展
- **评审意见：**
  - researcher: Too many moving parts. A browser extension on reviewer pages touches confidential review material, and its scope creeps into reviewer tooling.
  - builder: 建议拆开：给规则加 blast_radius 字段很便宜，可以先做。审稿端浏览器扩展和 LLM 输入日志的维护成本高、选择器容易失效，而且涉及审稿保密，延后。
  - skeptic: 在审稿页运行的扩展会接触保密审稿内容，攻击面大。"分散担保以缩小连带半径"是提前为别人可能的违规分摊风险，容易被理解成规避处罚。建议砍掉审稿页扩展，只给本人提示。

### P07 组合 what-if 工作台：结果树、规则压力测试、加一篇的代价
排名 #73 · 综合 5.55 · 规模 L · 依赖 R03, W06, W11, P09

- **痛点：** 作者只想“全中”或“全拒”，计划建立在“今年规则沿用去年”的假设上，还常想“多投一篇碰碰运气”，这些情景的代价都看不见。
- **做法：** 同一个 scheduler 在三类情景下重跑并对比：(1) 结果树：待定结果按 advisor 区间枚举 2^k 分支，显示最可能分支、最坏的一周和“无悔动作”；(2) 规则压力测试：对 inherited/UNVERIFIED 字段拖动取值（上限、互审资格、页数、LLM 模式），给计划打“脆弱度”并生成提前缓解动作；(3) 加一篇：显示边际上限占用、新触发的审稿义务、rebuttal 工时被挤占、与组内摘要相似度、组合 EV 变化区间。只让代价可见，不禁止投稿，也不帮拆分论文。
- **例子：** 分支“AAAI 中、ICLR 拒”：12/14 camera-ready 与因公出国审批撞车，p-007 转 ICML；“全拒”分支 1 月第 3 周最坏。情景“CVPR 2027 上限降到 20”：导师挂名 23 篇，3 篇需调整。学生想再加一篇 ARR：ICLR 讨论期每篇工时从 14h 降到 9h，EV [−0.2,+0.3]，建议不加。
- **数据：** scheduler、feasible()；advisor 区间；inherited 标记；产能账本；本地 embedding
- **评审意见：**
  - researcher: Busy researchers won't play with 2^k branch trees. The EV intervals would look more precise than they are. Keep only the one-click 'what if this inherited cap is X' toggle inside W06.
  - builder: 前提是 scheduler 已经成熟。结果树依赖 advisor 概率区间，而 AAAI、CVPR 等私有会没有公开分数，分支概率基本是假设，容易让人高估精度。“规则压力测试”这一块最便宜，可以先做。
  - skeptic: 2^k 分支加 EV 区间容易让人以为很精确。"加一篇的代价"是好的反批量投稿设计，可以拆出来先做。

### P09 产能账本：真实日历工时、规划谬误校正与审稿邀请顾问
排名 #74 · 综合 5.47 · 规模 M · 依赖 P10, R01

- **痛点：** 排期器只看截止，不知道这周已有课、组会、国庆和审稿；秋季 rebuttal、审稿、新投稿挤在同几周，研究者又普遍低估耗时，还会顺手接下不必要的审稿邀请。
- **做法：** 授权读取 Google/CalDAV/飞书日历的 free/busy（不读标题），叠加节假日。每类任务有工时模板（审稿每篇 4h、讨论期每篇 10–15h、格式转换 1–2 天），做完问一句实际耗时，用个人“实际/估计”比值校正并直说“你通常偏乐观 X%”。容量作为 scheduler 约束，超载周给出前移、推迟、放弃 hedge 等建议。收到审稿邀请时查规则库是否强制、拒绝的后果、审稿端 LLM 规则，再按剩余工时建议接受、少审或婉拒；强制义务只帮排时间块。写回日历用代号标题。
- **例子：** 11/9–15：ICLR 讨论 3 篇 + CVPR 11/10 登记、11/16 正文 + ARR 审稿截止，需求约 70h、可用 40h，建议 11/5 前冻结 CVPR 实验。AISTATS 审稿邀请（10/15–11/5）与 AAAI feedback 重叠、需求为可用工时 1.8 倍，且非本人义务，建议婉拒或只审 2 篇。
- **数据：** 日历 API free/busy；任务日志；review_quota；节假日表
- **评审意见：**
  - researcher: Calendar OAuth plus per-task hour logging is too much upkeep, and Reclaim and Motion already do time blocking. The review-invitation advisor (is this mandatory, and what happens if I decline) is the part worth keeping, as a small rule-card feature.
  - builder: Google Calendar 的 scope 属于 sensitive，公开应用要过 Google 验证；飞书日历要企业自建应用。Reclaim、Motion 等已经在做时间块排程。建议改为导入 ICS 或 CalDAV 读取忙闲，只保留审稿邀请顾问这个差异点。
  - skeptic: Motion、Reclaim 等通用排程工具已经做了工时校正。审稿邀请顾问如果默认建议婉拒，会减少审稿人供给；应只展示是否强制和拒绝的后果，不默认建议婉拒。


## 审稿后决策（16 个）

### D09 ARR 三天决策包与资格模拟器
排名 #10 · 综合 7.72 · 规模 M · 依赖 R03, D01, W02, P03

- **痛点：** meta-review、commit 截止、下一轮截稿只隔 3–4 天；撤稿时机和 meta 分数影响之后资格，规则藏得很深，作者经常弄错。
- **做法：** 用普通代码实现 ARR 状态机：输入轮次历史、撤稿时间、meta 分数，输出下一个能投的轮次、哪些审过的版本还能 commit、commit 截止。点撤稿前先模拟后果（截稿 48 小时后撤要隔一轮；撤回重投会连带撤回早期版本使其不能 commit）。meta 发布当天生成决策包：资格（1.5 分跳一轮、1 分永不可投）、commit 依据（4 对应主会、3 对应 Findings，有数据时附往年分数线）、主会/次会选择、revision notes 草稿与保留或更换审稿人建议、新规检查（每轮 20 篇、一作 5 篇、48 小时 contributor 注册），讨论期结束后提醒 I1–I12 上报。
- **例子：** ARR 8 月轮 10/8 出 meta、10/11 EACL commit、10/12 10 月轮截稿：meta 3.0 可 commit EACL（Findings 概率较大）或重投；选重投须 10/14 前指定 contributor，该一作已有 4 篇一作只剩 1 个名额。10 月轮 12/17 出 meta，NAACL/COLING 12/23 commit 正逢圣诞周。
- **数据：** ARR 轮次、commit edges、withdraw_penalty、resubmit_block、上限；本地轮次历史与 meta 分
- **评审意见：**
  - researcher: ARR's commit, resubmit and withdraw state machine really confuses NLP authors every cycle, and it is deterministic code. This is the strongest decision feature for ACL submitters. The rules change monthly, so tie it to W02.
  - builder: ARR 规则在 GitHub 上，来源最好追踪；状态机是纯代码、可测试，NLP 用户痛点明确。风险是规则变化快（资格规则挂着 WIP），commit 分数线要有公开数据才给。
  - skeptic: 确定性状态机价值高。但 ARR 规则一年改好几次，必须配 golden tests 和 as-of 日期；撤稿模拟一旦算错，已审版本就会失去 commit 资格。

### D16 机器人会议族：PaperCept 规则包与 ICRA→IROS/RA-L 决策卡
排名 #27 · 综合 7.03 · 规模 M · 依赖 R01, R03, D01, W04

- **痛点：** 机器人会议要每位作者 RAS PIN、视频单独窗口且须匿名、“PST”常落在夏令时、页数年年变；ICRA 没有 rebuttal，1/31 才第一次看到审稿，离 IROS 截稿只有一个月。
- **做法：** 规则包：PIN 收集表（T-14 提醒未交者）、视频规则卡（时长、大小、匿名、人脸模糊）、时区卡（按当天偏移解释 PST，有歧义取最早）、“较去年变化”横幅；延期由 watcher 抓公告直接推送。ICRA 出结果时的决策卡列三条路：IROS 的 ICRA-IROS transfer（从审稿生成 Author Response File 骨架，2027 是否保留待核）、RA-L（报告窗口受限）、CoRL（重叠须 chair 批准，conditional），各写截止换算、格式、视频和签证提醒。
- **例子：** ICRA 2027 9/16 当天才延期 24 小时，沿用 2025 年“6+n”习惯的作者会超页（2027 为 8 页含参考文献）。1/31 出结果，IROS 2027 截稿 3/1 23:59 PST（北京 3/2 15:59），间隔 29 天，transfer 需附 response file；ICRA 2027 接收 RA-L 转入报告只到 2026-12-31，已赶不上。
- **数据：** ICRA/IROS/CoRL 页数、视频、PIN、时区原文；transfer edge；RA-L 窗口；PaperCept 手册引文
- **评审意见：**
  - builder: 机器人方向用户少，但几乎没人服务，数据全部公开，可以人工录入。transfer 边在 2027 年是否保留待核。

### D05 盈亏平衡概率卡（留下还是撤稿）
排名 #34 · 综合 6.90 · 规模 M · 依赖 P17, D04, D13

- **痛点：** EV 公式太抽象，作者也未必信系统的概率；他真正想知道的是“要有多大把握才值得留下”。
- **做法：** 在用户的 U、δ、撤稿代价和下一站可行路径下反推 p*：本会录用概率为多少时留下与撤稿转投 EV 相等。卡片只问“你认为自己的概率高于 p* 吗？”，并把系统区间画在同一轴上：整体在上建议留下，在下建议撤，跨过则判势均力敌并指出决定日。附后悔表：每种选择在录用/被拒下损失的时间、公开记录、工作量撞车。
- **例子：** p-007 留 ICLR 还是转 CVPR：p*≈24%（示意），区间 10–35% 跨过 p*，势均力敌，决定日 11/10。后悔表：留下被拒，12/16 后只剩 ICML，论文照样公开；撤稿则立即公开，11/5–16 要同时改 CVPR 稿。
- **数据：** scheduler EV 链与参数区间；advisor 区间；撤稿后果；用户 U、δ
- **评审意见：**
  - researcher: The regret table and decision date are useful. The p* number looks more precise than it is, so show it as a band and lead with the decision date.
  - builder: 反推 p* 让用户自己判断概率，巧妙地绕开了私有会没有分数这个问题。示意数字要标清楚，避免被当成预测。
  - skeptic: 让用户自己判断概率是否高于 p*，而不是由系统给点估计，这个框架比较安全。

### D06 决策预承诺契约与合作者投票
排名 #37 · 综合 6.72 · 规模 S · 依赖 D01, D05, D11, P21

- **痛点：** 审稿出来当晚情绪最差、易受沉没成本影响，导师学生意见不一，常拖到 CVPR 注册前一天才定，而注册即冻结作者。
- **做法：** 审稿发布前 3–5 天，引导全体作者写下“条件 → 动作”规则：条件只用 App 能算的量（均分区间、有无高 confidence 低分、有无根本性问题），动作含留下、撤稿转 X、等结果，并写明拍板人、下一站作者名单、格式负责人、最晚决定日。advisor 先预演各分数组合走哪条路并给 EV 区间。合作者用加密投票卡或群 bot 确认，反对意见也记录。出分后自动对照“按约定应如何”与 advisor 当下判断，不一致时高亮分歧；推翻约定要写一句理由进决策日志，用于复盘校准。只显示不执行。
- **例子：** 10/31 约定：ICLR 均分 <4 且无人给 6 分以上，就在 11/9 前撤稿转 CVPR，作者不变、学生 A 改 8 页。11/5 实际 [6,4,4,2] 有一个 6，按约定留下，advisor 判势均力敌；导师想撤，须写明理由。AISTATS 则提前约定 12/3 讨论结束仍边缘就开始准备 ICML 版本。
- **数据：** advisor 输出；撤稿后果、作者冻结规则；本地约定模板与签名
- **评审意见：**
  - researcher: Co-author rituals before reviews come out won't happen in practice.
  - builder: 模板加本地存储就能做。加密投票卡以后再加。

### D01 审稿日分诊台
排名 #38 · 综合 6.70 · 规模 L · 依赖 X05, R01

- **痛点：** 审稿一出，作者凭情绪判断；分不清一句话能澄清的误读和根本性问题，同一问题被三位审稿人换说法提了三遍也没人合并。
- **做法：** 审稿原文只存本地。拆成关切点并跨审稿人去重，得到“关切×审稿人”矩阵，每条打四类标签：误读（附页码）、rebuttal 可修、下一版才能修、根本性问题。再按当前会议规则过滤：不允许新结果的会，“补实验”降为“只能承诺”。分类走 packages/decide（Jev 或自带 key 的 LLM），置信度 <0.5 交用户；计数合并用普通代码。输出共识弱点（≥2 人提到）与孤立意见，作为所有决策卡的输入。
- **例子：** p-007 ICLR [6,4,4,2]：R2/R3/R4 都提“缺 X 对比”，ICLR 可在 11/18 前上传修订版，标 rebuttal 可修；R4 给 2 分的“测试集泄漏”是误读附录 B；R1“理论贡献有限”为根本性。若是 IJCAI，“补 X 对比”只能解释。
- **数据：** 本地审稿文本；rebuttal_format 规则；分类后端；论文 PDF/LaTeX
- **评审意见：**
  - researcher: I'd use it for every paper in every review round. But I can already paste reviews into an AI assistant and get a concern matrix. The only differentiator is the venue-rule filter (a 'new experiment' downgraded to 'promise only'), so lead with that. Reviews must go only to a BYO-key or local backend.
  - builder: 通用 LLM 也能拆审稿意见，真正的差异点是“按当届规则过滤”，比如不允许新结果的会，补实验只能写成承诺。把审稿原文发给云端 LLM 是一个隐私选择，要默认关闭、明确 opt-in，或者用本地模型。
  - skeptic: AAAI、CVPR、ARR 等私有会的审稿是保密的，把原文发给闭源的 Jev 或第三方 LLM 可能违反会议保密条款；应按会议规则默认用本地模型，用户明确同意后才外发。"误读"标签容易让作者轻视真实批评。通用 LLM 已经能辅助写 rebuttal，差异只在按会议规则过滤。

### D12 不可逆操作护栏：后果预览与冷静期
排名 #44 · 综合 6.57 · 规模 M · 依赖 P01, D11, R05

- **痛点：** 撤稿、ARR commit、opt-in 公开、提交 arXiv 点了就收不回，后果因会而异；审稿常在北京深夜发布，作者在情绪最差时按下按钮。
- **做法：** 浏览器扩展在识别出的不可逆按钮（Withdraw、Commit、Make public、arXiv Submit）上加一层确认，调用本地 core 模拟“点/不点”两条路线：可见性后果（附原文）、重投资格、对本地计划下一站的影响。对这类操作设可配置冷静期（默认 12–24 小时），若对应退路在冷静期内关闭则自动缩短并说明；时间轴上直接写“你还有 5 天，不用今晚决定”。审稿发布当天通知切平静模式只推一条汇总。只提示不拦截，确认写进决策日志；绝不提供“撤稿不留记录”建议。
- **例子：** 凌晨 2 点用户看到 ICLR R4 给 2 分想撤稿转 CVPR：提示 CVPR 注册 11/10 才截止、ICLR 撤稿立即去匿名、分诊显示 R4 是误读，启动 12 小时冷静期。ARR 8 月轮 10/8 后点撤稿，提示审过的版本将不能 10/11 commit EACL。
- **数据：** 撤稿、可见性、重投限制规则；本地计划；扩展按钮识别
- **评审意见：**
  - researcher: Previewing consequences before an irreversible action is valuable. Detecting buttons with an extension is brittle, so do an in-app 'before you withdraw or commit' check first.
  - builder: 在 OpenReview、CMT、PaperCept 上识别按钮很容易失效。先在 App 里做“撤稿前后果模拟”，不依赖扩展；扩展以后再加。
  - skeptic: 在投稿系统按钮上加层的扩展，一旦识别错或页面改版就会误导用户。冷静期如果让用户错过 hedge 撤回截止，反而造成伤害，必须把"不会导致任何截止被错过"定为硬约束。

### D11 决策日志、规则存证与个人校准
排名 #47 · 综合 6.52 · 规模 M · 依赖 R01, W01

- **痛点：** 作者每年做好几次“留还是撤”却不记录当时判断，不知道自己偏乐观还是悲观；规则事后被改或 PC 理解不同时，也拿不出“当时页面就是这么写的”证据。
- **做法：** 每次决定或标记“已提交”时本地冻结快照：证据卡、bundle_hash、考虑过的选项、自估概率、理由、当时处境，以及相关规则卡原文、来源快照 sha256（公共 snapshots 分支可查）、Wayback 链接（没有则触发 Save Page Now），可选 OpenTimestamps。可导出一页 PDF 用于给 PC 写信。之后若引文哨兵触发，自动生成“提交时规则 vs 现行规则”对照表。结果出来后提醒复盘（看过程不看结果），积累 5–10 个决定后画个人校准曲线和 Brier 分数，偏差回灌到盈亏平衡卡。
- **例子：** 2026 秋记录 4 个决定（NeurIPS→ICLR 自估 40%、AAAI 留下 50%、ICLR 留下 35%、ARR commit EACL 60%），12/17 后显示偏乐观，下次提示下调约 10 个百分点。AAAI-27 改作者条款两份文件矛盾，7/25 加作者者可出示当天两页原文与哈希。
- **数据：** Plan.reasoning、bundle_hash；snapshots 分支；Wayback SPN；PDF 导出
- **评审意见：**
  - researcher: The rule-evidence snapshot (hash plus Wayback) is cheap and occasionally decisive in a PC dispute. Calibration curves won't get used.
  - builder: 决策日志和快照哈希都很便宜。Wayback Save Page Now 有限速。个人校准要积累 5 到 10 个决定，价值一年后才显现。
  - skeptic: 存证可以在和 PC 争议时用上，但需求小，OpenTimestamps 可以砍。

### D03 信号还是噪声：重投前要改多少
排名 #48 · 综合 6.50 · 规模 M · 依赖 D01, R03

- **痛点：** 被拒后作者要么原样重投（“审稿太随机”），要么推倒重来，没有依据判断拒稿有多少是论文问题、多少是噪声。
- **做法：** 根据关切重叠度、按 confidence 加权的分歧、公开噪声研究（NeurIPS 2021 两委员会对 23% 论文结论不同；ICLR 2025 有 54.8% 论文改过分）给出信号强度。多位高 confidence 审稿人独立提出同一弱点是强信号，应先改再投；分歧大且不重叠则噪声主导，小改赶最近截止。读数直接决定 revise_days 并交 feasible() 判断下一站。
- **例子：** 9/24 NeurIPS 被拒：论文 A [4,3,4] 三人都说缺消融，建议补完投 AISTATS（10/6）或 CVPR（11/16）而不是赶 ICLR 9/25；论文 B [5,2,4] 意见不重叠，建议小改赶 ICLR（前提已注册摘要）。
- **数据：** 分诊结果；公开噪声研究（附来源）；revise_days、feasible()
- **评审意见：**
  - researcher: Merge this into D01 as one signal-strength line.
  - builder: 在分诊结果上做一个启发式评分，工作量小。引用的噪声研究数字必须附原始来源。
  - skeptic: 噪声研究很容易被拿来合理化"不改直接重投"，加重审稿系统的负担。强信号必须优先；判为噪声主导时，也只允许建议"小改"，不允许"不改"。

### D07 rebuttal 窗口作战计划：实验预算与讨论节奏
排名 #52 · 综合 6.43 · 规模 M · 依赖 D01, D02, P09

- **痛点：** 补充实验常来不及或与另一篇截稿抢 GPU，还常做了会议不允许放进 rebuttal 的实验；ICLR 讨论期作者常拖到最后两天才回复，修订版改动太大被 AC 忽略。
- **做法：** 对分诊台每项“需新实验”先查规则是否允许新结果，允许的估算 GPU 小时与耗时，按摇摆审稿人权重排序，排进窗口并留写作时间，同时把组内其他截止的 GPU 占用算进去，超载时提示取舍。开放讨论型会议（ICLR）另排节奏：前 3 天回复误读，中段上传不超过 10 页、标出改动的修订版（本地 diff 超阈值提醒，因 ICLR 用 pdfdiff），后期礼貌提醒未回复者；用户记录回复和改分，结束时生成给 AC 的总结草稿。截止同时显示 AoE 和北京时间。
- **例子：** p-007 讨论期补 X 对比约 200 GPU·h、消融 40 GPU·h，同组 CVPR 稿 11/16 需约 300 GPU·h，11/10–15 超载 60%，先跑 R2/R3 都要的 X 对比，消融承诺进下一版。节奏：11/8 前回完澄清，11/12 上传修订（改动 18%），11/15 提醒 R3，11/17 给 AC 总结；11/18 AoE 即北京 11/19 19:59。
- **数据：** 分诊结果；rebuttal_format.new_results、修订规则；GPU 配额；本地 PDF diff
- **评审意见：**
  - builder: GPU 预算只能用户手填。PDF diff 可以本地做，但 ICLR 的 pdfdiff 阈值不是官方口径。

### D10 审稿问题上报助手（有证据才上报）
排名 #58 · 综合 6.27 · 规模 M · 依赖 R08, D01

- **痛点：** 遇到没读论文、引用不存在文献、疑似 LLM 编造的审稿，作者不知走哪个渠道；把学术分歧当失职投诉又适得其反。
- **做法：** 按会议列出正式上报渠道（ARR I1–I12 表、ICLR 给 AC 的评论、IJCAI 保密框、AAAI feedback 指出事实错误）。本地用 DBLP/Crossref/arXiv 核对审稿里引用的每篇文献，只发查询不发审稿文本。每条上报必须附审稿原文和论文页码，并显示 ARR 提醒：不要把分歧说成失职。
- **例子：** ICLR R4 说“与 [Smith et al., 2025] 完全相同”，三处都查无此文，助手起草给 AC 的简短、无情绪评论附核对结果；ARR 10 月轮在 11/30 讨论结束后提醒“说不新颖却不给参考文献”可走 I1–I12。
- **数据：** 各会上报渠道；DBLP dump、Crossref/arXiv API；ARR review issue 说明
- **评审意见：**
  - builder: 用 Crossref/DBLP 核对审稿里的引文可行。要防止用户把意见分歧升级成投诉，ARR 自己也有这方面的提醒。
  - skeptic: 在 DBLP、Crossref 查不到不等于文献是编造的（workshop、非英文论文常查不到）。措辞只能写"在 X、Y、Z 中未找到"，不能引导作者指控审稿人用 LLM。一味鼓励上报也会加剧作者和审稿人之间的对立。

### D08 按拒稿理由选下一站
排名 #60 · 综合 6.13 · 规模 M · 依赖 D01, R03, X05, P18

- **痛点：** 转投时只按截止和 CCF 等级挑，没考虑哪个会里这条拒稿理由不再是问题，同一理由连着被拒。
- **做法：** 把主要拒稿理由归类（新颖性不足、缺真实验证、理论实验不匹配、领域不对口、写作），对照各会评审标准原文。代码先用 feasible() 筛出日期、页数、双投都满足的去处，Jev 只在这些选项里按“理由与标准的匹配”排序（Choice），不碰日期。每条推荐附对方评审标准原文。
- **例子：** p-009 被 ICLR 拒，meta 说“新颖性有限但实验扎实”：依次列出 TMLR（新颖性非必要条件，拿到 J2C 可去会议报告）、ICML（约 1/22）、IJCAI-27（约 1/19，现为 CCF-B），用户按本校对 TMLR 的认可调 U。
- **数据：** 各会评审标准原文；分诊结果；feasible()；Jev 或自带 key LLM
- **评审意见：**
  - builder: 要人工收集约 15 个会议的评审标准原文。排序交给 LLM 可以，但必须只在 feasible() 已经筛过的选项里排。
  - skeptic: OnlyTop 的 Fallback Map 和 DDL Atlas 的转投规划已有类似功能。

### D15 转投路线条件录用率：公开数据 + LDP 众包
排名 #61 · 综合 6.10 · 规模 L · 依赖 D04, D14

- **痛点：** 作者最想知道“像我这样被拒的论文后来去了哪、多久中”，而 advisor 对下一站录用率的下调系数只是一个假设值。
- **做法：** 离线脚本把 ICLR 被拒论文（公开）与之后公开录用名单（DBLP dump、OpenReview 录用列表）按标题摘要 embedding 与作者重合匹配，按分位段统计 6/9/12 个月去向与仍只挂 arXiv 的比例，只发汇总不提供逐篇查询。另众包最不敏感的一层“A 被拒→投 B→结果”三元组，本地随机响应后提交、默认关闭。两者共同作为下调系数的先验并公开回测与样本量。
- **例子：** 统计 ICLR 2026 被拒论文到 9/24 的去向（第 30–50 分位中 X% 被 ICML/NeurIPS 录用，待统计），12/16 p-007 被拒时 advisor 用它替代“0.7”假设；到 2027 秋“ICLR→ICML”系数显示为“假设 + N 条贡献”区间。
- **数据：** ICLR 公开论文与分数；DBLP dump；录用名单；离线 embedding；LDP 预算文档
- **评审意见：**
  - researcher: Better as a one-off research report than a product feature.
  - builder: 离线匹配“ICLR 被拒后去了哪”（标题 embedding 加 DBLP）是可行的研究型脚本，但需要维护者账号抓 OpenReview。众包部分砍掉。
  - skeptic: 逐篇匹配本身就是在追踪被拒论文的去向，必须坚持只发布汇总。众包三元组的价值抵不上复杂度，建议砍掉。

### D13 PI 决策队列与组级 rebuttal 协调
排名 #65 · 综合 6.05 · 规模 L · 依赖 D05, D01, P21, P03

- **痛点：** 撞车周每个学生都来问“这篇撤不撤”；一个组同一秋天多篇论文同时 rebuttal，导师看不到全局，同样实验重复做好几遍。
- **做法：** 队列只收两类卡：决定日在 7 天内且 advisor 判势均力敌的论文；需要 PI 本人动手的事（上限、担保、签字）。每卡 5 行：代号、分数摘要、两条路线、决定日、合作者本周硬义务；按决定日、再按 EV 差距排序，可一键把决定权交给一作。协调视图汇总全组分诊结果：合并不同论文的共同弱点为一次实验，按边际价值分配人手和 GPU，每人每周热力图标撞车。审稿原文默认不共享，只共享结构化条目。
- **例子：** 11/6 PI 在 ICLR 有 8 篇：3 篇留下不进队列，2 篇只需确认撤稿，3 篇势均力敌决定日都是 11/10，并提醒 5 篇都转 CVPR 会碰 25 篇上限（inherited）。p-003 与 p-007 都要补 X 对比，只跑一次两篇共用；学生 B 的 ARR 审稿 11/16 截止，建议 11/12 前先交。
- **数据：** advisor 输出；组内 portfolio 与分诊；上限；义务日历
- **评审意见：**
  - builder: 依赖组协作层（P21）和 advisor 都已成熟，属于 v2。组内共享结构化审稿条目仍然要逐篇授权。

### D02 摇摆审稿人与 rebuttal 投入排序
排名 #68 · 综合 5.72 · 规模 M · 依赖 D01, D04

- **痛点：** rebuttal 只有 7–13 天，作者平均分配精力，甚至最多时间花在最不可能改分的“2 分、confidence 5”上。
- **做法：** 结合分数、confidence、可修复关切比例和会议决策结构，估计哪位审稿人改分最能改变结果。T1 会议（ICLR）用当届分位算边际效应；T3 会议不给概率，只按“反对意见最可修复”排序。输出每人建议工时和回复顺序。明确写：目标是回应最实质问题，不提供任何联系审稿人或破坏匿名的方法。
- **例子：** p-007 [6,4,4,2] confidence [3,3,4,5]：R2、R3 卡在“缺 X 对比”和写作，可在 11/18 前修好，分配约 60% 时间；给 R4 一条附页码的简短澄清，并在给 AC 的评论说明是误读。
- **数据：** 分诊结果；ICLR 当届分位；历年改分数据；T3 规则卡片
- **评审意见：**
  - builder: 只有 ICLR 能算边际效应，还依赖 D04 的当届分数和历年改分数据（paperlists 没有 LICENSE）。其他会议只能做可修复性排序这类启发式。
  - skeptic: T1 的分位边际效应数据很薄。按"谁最可能改分"排序有功利化倾向，措辞要保持"回应最实质的问题"。

### D04 ICLR 当届实时分位与讨论期改分预测
排名 #75 · 综合 5.23 · 规模 L · 依赖 W09

- **痛点：** 11/5 作者只知道原始分数，套往年阈值会严重出错（ICLR 2026 用 2025 阈值预测录用率 14.1%，实际 38.8%），2027 刻度还没公布。
- **做法：** 匿名 API 已 403，由维护者用自己账号在 11/5–6 按 ToS 限速抓取公开初评，只把汇总分位表打进 bundle 次日推送；客户端本地换算“当届初评分位”，不依赖刻度。用历年公开修订记录和 11/18 第二次快照建讨论期改分模型，输出分位、同分位平均改分、录用率区间（基于终评、已加宽）和留一年回测误差。ICLR 2026 作为独立 regime。
- **例子：** 11/6 上午 bundle 更新，p-007 均分 4.0 在第 38 百分位；若 R2、R3 各升 2 分约到第 60；11/18 讨论结束后区间更新。
- **数据：** 两次 ICLR 2027 公开分数快照（只发布汇总）；历年终评与修订（paperlists 无 LICENSE，只用汇总并先征得同意）
- **评审意见：**
  - researcher: Everyone checks their percentile on ICLR review night, but Paper Copilot and community sheets already do this. Now that the anonymous API returns 403, scraping with a maintainer account is a ToS and reputational risk for a new project. Link out or partner rather than own it.
  - builder: Paper Copilot 和几个 GitHub 仓库出审稿当晚就会发 ICLR 分数分布，差异化低。匿名 API 已返回 403，要用维护者账号抓，有 ToS 和限速风险，时间窗口也很硬。优先考虑复用或链接现有汇总，只做本地分位换算。
  - skeptic: Paper Copilot 已经在做 ICLR 分数分布和讨论期改分（LANDSCAPE §6），差异化低。匿名 API 返回 403 后改用个人账号批量抓取，有违反 ToS 和被封号的风险，单人维护也是单点故障。预测一旦有偏差，11/5 当晚就会被大量用户用来做撤稿决定。

### D14 社区分数池：隐私保护并用 ICLR 校准自报偏差
排名 #76 · 综合 4.60 · 规模 XL · 依赖 D04, R01

- **痛点：** AAAI、CVPR、ARR、ICRA 分数不公开，作者只能参考 Reddit、知乎自报数据，而这些系统性偏高。
- **做法：** 先把各会保密条款做成规则，禁止或未规定的会默认不收。出结果后才开放自愿贡献，只收粗粒度数据（会议、年份、分桶初评/终评、confidence、结果），不收文本、标题、主题。客户端本地加噪（LDP）后上传，可进一步用 Prio 类安全聚合，格子 ≥k=20 才发布。用 ICLR 公开真实分布与同批用户贡献的 ICLR 分数比较，估计自选偏差系数，用于校正 CVPR、AAAI 数据并公开方法。只输出“分数相近者后来怎样”的区间。项目里唯一需要服务器的部分，单独治理。
- **例子：** AAAI-27 11/30 后开放贡献，若同批用户的 ICLR 自报平均高 0.4 档（示意），AAAI 数据同幅下调并加宽，AAAI-28 作者可见“初评相近者录用 25–40%（已校正，n=87）”（示意）。先回答 AAAI、CVPR 保密条款是否允许向第三方报告分数。
- **数据：** 保密条款规则；LDP 与安全聚合实现；最简聚合服务器；同意书与 CC-BY 汇总
- **评审意见：**
  - researcher: Confidentiality clauses may forbid sharing scores, self-selection bias is severe, and it needs a server. Skip it.
  - builder: XL 级而且要服务器。每格至少 20 条的门槛需要大量用户，要多年才能冷启动。AAAI、CVPR 的保密条款是否允许向第三方报告分数并不清楚。一个人做不了，不建议做。
  - skeptic: 建议砍掉或冻结。AAAI、CVPR 等会的保密条款大多没有明确允许向第三方报告分数，如果坚持"禁止或未规定就不收"，数据池几乎是空的。Paper Copilot 已经在收集自报分数。这是全项目唯一需要服务器的部分，会带来法律和治理负担；样本小的格子里，LDP 噪声会把结果淹没。


## 政策监控（19 个）

### W01 引文存活哨兵
排名 #2 · 综合 8.23 · 规模 S · 依赖 R01, X05

- **痛点：** 整页 diff 噪声大，导航栏或日期一改就报警，真正改规则的那一句被淹没，会议也几乎从不标新增内容。
- **做法：** 把规则库每条 quote 当金丝雀：平时每天抓来源页，截止前 30 天每 6 小时一次；规范化空白、引号、连字符后检查 quote 是否仍逐字存在。消失即高信号事件，直接定位 rule id，再经反向索引找到依赖它的本地计划；用编辑距离找最接近的新段落作为候选替换，由人工或 Jev（只喂变化段）初筛。公告已宣布变化而旧 quote 仍在页面上时，标“过期原文”。
- **例子：** CVPR 2027 CFP 的 “currently being finalized” 一消失，立即给所有计划 11/10 注册 CVPR 的计划发 plan-change 并把 llm_authors 卡降为“待核”。ICRA 2027 已延期，CFP FAQ 仍写 'There is no plan to extend'，标为与公告冲突的过期原文。
- **数据：** quote 与 src 映射；Playwright 抓取；规范化规则；rule id→计划反向索引
- **评审意见：**
  - researcher: The cheapest, highest-leverage watcher. Users feel it as 'your rule card just changed'. Build it first in the policy pillar.
  - builder: 成本最低、信号最强的 watcher，Actions cron 加 Playwright 就能做。要处理 JS 渲染页、cookie 墙和排版变化带来的误报，规范化规则要有测试。
  - skeptic: 原文消失常常只是页面改版，不是规则变了。应先标"待核"，而不是直接发 plan-change，否则误报会损耗用户信任。

### W06 假设登记簿：继承规则、挂起规则与最晚安全决定时刻
排名 #4 · 综合 8.03 · 规模 M · 依赖 W01, W05, R03

- **痛点：** 新一届规则未出或写着“正在制定”时大家按去年规则做计划，等规则发布没人知道自己的计划依赖了哪几条假设、该什么时候回来看。
- **做法：** 规则 schema 加 status: pending_finalization 和官方承诺的最晚公布时间。每个 Plan 记下它用到的全部 inherited、unspecified、pending、低置信度规则（assumptions），与 bundle_hash 一起本地存储，计划卡上显示黄色标签。planner 算“最晚安全决定时刻”：该规则可能影响的第一个不可逆动作之前；在承诺时间前 T-14/7/3 自动复查。404→200 或哨兵命中时只重算依赖这些假设的计划，提示“3 条假设：2 条证实、1 条推翻”。
- **例子：** 某组 11/16 投 CVPR 2027 依赖三条假设：25 篇上限（继承）、LLM 政策 being finalized、全体作者须审稿（2026）。11/10 注册为最晚决定点，11/3 起每天复查，并按 ICLR 2027 标准先起草 AI-use 说明作保底；若上限改为 20，直接列出 3 篇待调整。
- **数据：** Plan.assumptions；inherited_from/verified/conf；pending 状态；复查调度
- **评审意见：**
  - researcher: A 'your plan rests on 3 unverified assumptions, recheck by X' label builds trust and makes the advice safer. This is the right place for what-if.
  - builder: 只要 schema 从第一天就带 inherited/verified，这就是纯本地逻辑，也是诚实度的核心。建议进 MVP。
  - skeptic: 这是整个产品的安全底座之一，应该进 MVP。

### W02 ARR 规则仓库与新轮次监测
排名 #5 · 综合 7.95 · 规模 M · 依赖 R01, P05, W07

- **痛点：** ARR 规则按轮次变，截止前还在 GitHub 仓库里反复改且不发公告；谁能当 service contributor 只能有人逐条读 diff。
- **做法：** 每小时用 GitHub API 按路径拉 acl-org/aclrollingreview 的 commit（qualifications、sustainable-reviewing、cfp、dates），把 markdown diff 映射到 reciprocal_reviewing.qualification 等字段；同时盯 NAACL、COLING、ACL 各自的 call。客户端用本地 Person 记录算出改动前后资格翻转的人和受影响论文，生成任务（导师推荐信、整理审稿记录）。新页面出现、页面间日期不一致、作者指南更新都算事件；不一致按最早执行并标 †。只提醒计划里有该轮论文的用户。
- **例子：** qualifications.md 9/12 建立到 9/22 改了 13 次：9/19 的 03edc0f 改 AC 资格、人工审核要 10 条审稿记录；3158ecb 要求未获硕士学位的直博生附导师推荐信；9/22 挂 'Work in progress!'。9/28 表单开放时推送“先确认 contributor 资格”。
- **数据：** GitHub commits API；markdown 章节解析；qualification schema；DBLP 与学位字段
- **评审意见：**
  - builder: 用 GitHub API 拉提交历史很简单。把 markdown 映射到字段需要人工维护，而且 ARR 目录结构可能会改。

### W16 按个人暴露程度计算严重度
排名 #8 · 综合 7.92 · 规模 M · 依赖 P10, R03, W01

- **痛点：** 同一条规则变化，对挂名 22 篇的 PI 是 blocking，对只投 1 篇的学生只是 FYI；按类型统一推送要么被静音、要么该急的没急。
- **做法：** 严重度由变更方向、本人暴露（在投与计划论文、合作者资格、审稿义务）、离最近不可逆节点的工作日数、能否补救四项决定，全部本地计算，服务器只发布变更本身。不可逆节点已过则标“无法补救，仅供知悉”并列剩余选项。只有 blocking 实时推送，plan-change 当天汇总，FYI 进周报。
- **例子：** ICLR 9/2 宣布 20 篇上限离 9/18 仅 16 天：挂名 22 篇的 PI 是 blocking，只投 2 篇的学生是 FYI。ARR 9/19 资格修订离 10/12 有 23 天且隔着国庆，对依赖人工审核的直博生是 plan-change；若 10/10 才出则升为 blocking。
- **数据：** 本地 portfolio；feasible()；节假日表；不可逆节点标记
- **评审意见：**
  - researcher: Alert fatigue kills policy monitoring. Severity based on personal exposure is what makes me not mute the app. Build it together with W01.
  - builder: 在本地 portfolio 上跑的纯函数，是 Policy inbox 不沦为噪声的关键，建议 v1 必做。

### W05 页面生命周期探针与“该出没出”
排名 #9 · 综合 7.73 · 规模 S · 依赖 R01

- **痛点：** 新一届规则页出没出、是不是新内容，作者只能反复刷新；有的 2027 域名下挂的还是 2025 年内容；作者也不知道某会是否比往年晚出。
- **做法：** 对 URL 模板（{Y,Y+1}×CFP/AuthorGuidelines/Dates/Pricing/LLM-Policy）维护状态机：域名不存在→401/403→404→200 空壳→200 实质内容，每次跳变都是事件。200 后检查正文年份和日期是否属于本届，不符标“疑似旧内容”并禁止抽取。用 Wayback CDX 查往届首个 200 快照得到“预计上线窗口”，过了上沿仍 404 发“逾期”事件：相关日期继续标 UNVERIFIED，planner 给依赖论文留更宽缓冲。
- **例子：** 9/24：CVPR 2027 AuthorGuidelines 404、ICML 2027 CFP 404、2027.ijcai.org 401、ICLR Pricing 200 无金额；ICRA 2027 final-paper 页仍是 2025 的 '(6+n)'，标僵尸页。ICML CFP 往年 10/4、11/8 上线，现在不算晚；若 11/15 仍 404，ICML 2027 在所有转投链里标“日期未官宣、已逾期”。
- **数据：** URL 模板；HTTP 状态历史；Wayback CDX；年份日期正则
- **评审意见：**
  - researcher: A 'CFP/guidelines page is now live' notification is something I'd subscribe to. Cheap.
  - builder: 只需要 HTTP 状态和 Wayback CDX，都免费，适合放进第 2 周。“疑似旧内容”的判定靠年份正则，要写测试。

### W12 政策年表与“自你上次投这个会以来改了什么”
排名 #13 · 综合 7.60 · 规模 M · 依赖 R01, W05

- **痛点：** 想知道一条规则哪年出现、怎么变过来只能翻多年 CFP；作者对规则的了解主要来自上次投稿的记忆，凭记忆行事是最常见违规来源。
- **做法：** 用 Wayback CDX 取历届 CFP、指南、FAQ 快照按 digest 去重，用 watcher 同一抽取器补写逐年 policy.rules（source: wayback、verified: false），再逐步人工核实；会议页显示每条规则的年表和同届内改动，并提供基于 git 历史的规则 blame。读取本地投稿历史，算出“你上次投的那届→这一届”只含作者行为的 diff，按严重度排序；无历史的用户与上一届比较。
- **例子：** 投过 KDD 2026 者：作者名单连同顺序改在摘要截止冻结（早一周、取消拼写例外），large changes 扩展到标题，LLM 披露字段删除改用 ACM 政策，看过审稿后撤稿须等 12 个月。投过 ICRA 2025 者：6+n 改为 8 页含参考文献。ICLR：AI-use 节 2026 仅“重要作用”需披露，2027 每篇必须有。
- **数据：** Wayback CDX 与快照；抽取器；逐年 policy；本地投稿历史；git blame 索引
- **评审意见：**
  - researcher: A 'what changed since you last submitted here' diff before each deadline is exactly what a busy author wants, and nobody offers it. This is the flagship for the policy pillar. Wayback-backfilled rules must stay marked unverified.
  - builder: “你上次投这个会以后改了什么”价值很高。用 Wayback 回填多年政策工作量大，抽取结果也未核实。首版只做 15 个会议的“本届对上一届”diff。

### W17 计划的 Dependabot：数据一变给私有计划仓库开 PR
排名 #22 · 综合 7.17 · 规模 M · 依赖 X04, W06

- **痛点：** 政策变化要落到具体论文才有意义，但用户不会每天看 Policy inbox；组里计划改了什么也没有审阅记录。
- **做法：** portfolio.yml 放在用户私有仓库。一个 Action 每天读公开 bundle、不回传任何数据，bundle_hash 变化就跑 nextvenue plan --diff，影响本计划时开 PR：标题写变化字段，正文放新旧原文、受影响论文、新旧路线对比、需谁确认；合并即确认。golden tests 也在私有仓库跑。PI 可以像 code review 一样审学生的投稿计划。
- **例子：** CVPR 2027 指南上线写明上限后，私有仓库收到 PR“cvpr/2027 author_cap: inherited 25 → verified X；PI 在 CVPR 计划中有 N 篇”；LLM 政策定稿时列出所有要更新 AI 使用声明的论文。
- **数据：** 公开 bundle 与 changelog；nextvenue CLI；GitHub Actions 或本地 cron
- **评审意见：**
  - researcher: A delight for GitHub-native users and cheap once the CLI exists, but the audience is narrow.
  - builder: 对熟悉 GitHub 的用户很自然，也顺带解决了“提醒需要服务器”的问题。但未发表论文的计划会存在 GitHub 私有仓库里，要默认使用代号。
  - skeptic: 未发表论文的投稿计划放进 GitHub 私有仓库由 Actions 处理，数据就落在了第三方。至少要加密，且 Action 只读公开 bundle；而且能用上的用户很少。

### W04 截止日期三方对账
排名 #24 · 综合 7.07 · 规模 M · 依赖 W03

- **痛点：** 延期或更正时，投稿系统和网页有先有后，tracker 互相转抄错误，ICS 订阅还可能晚一天同步。
- **做法：** 每个 milestone 存三个值：投稿系统（OpenReview duedate/tmdate、PaperCept timetable）、官网 Dates/CFP、上游 ccfddl 和 HF，换算时区后比较，任一方变化即生成事件。投稿系统截止被推后视为延期信号，立即推送并重抓官网，不等博客。界面只显示官方截止，OpenReview expdate 宽限只做内部核对，免得有人去赌宽限。
- **例子：** ICLR 2027 Submission duedate 2026-09-19 11:59 UTC = 9/18 23:59 AoE，一致。ICRA 2027 9/16 宣布延至 9/16 23:59 PST，但 CFP FAQ 与 RAS 多页仍写 9/15，标“已延期但官网前后不一”并直接推送。
- **数据：** OpenReview invitations；PaperCept timetable；ccfddl/HF 上游；时区库
- **评审意见：**
  - researcher: Getting an extension alert hours before the blog post is concrete value on deadline day.
  - builder: 比对 ccfddl 和 HF 两个上游很简单；读 OpenReview 的 duedate 需要登录；PaperCept timetable 要抓页面。不显示宽限期是对的。
  - skeptic: ccfcfp 已经显示变更记录。不显示 expdate 宽限，是正确的防赌设计。

### W08 语义级 diff：沉默删除、情态词与范围词强度
排名 #29 · 综合 7.02 · 规模 M · 依赖 W01, X05, R04

- **痛点：** 会议从不说明删了什么；一个词（including/excluding、should/must、may/will）就能改变规则，普通 diff 里看不出来，中文转述又一律译成“会被拒”。
- **做法：** 把今年与去年同一页面（含 FAQ 和表单字段）按句对齐：专门列出“去年有、今年没有”的句子，人工标注为放宽、收紧、挪位（跨页搜索确认）或变未规定，删除的规则写 unspecified，绝不自动当“允许”。维护情态词强度表（must/will/shall > may/can > should/expected/encouraged）和范围词（including/excluding/any/all/only/at most），对变化句打强度与方向，收紧进 plan-change、放宽进 FYI；规则卡原文高亮这些词，中文释义保留强度（将被/可能被/被期望）。同一规则两份官方文件强度不同自动生成矛盾记录。数字和范围由正则判断，判断不了才交 Jev 或 LLM。
- **例子：** KDD 2027 删掉“未提名合格审稿人 is grounds for desk rejection”（放宽）；ICLR 签证邀请函条款挪到 iclr.cc/FAQ（仍有效）。AAAI-27 把 AI Alignment/AISI 从 including 改为 excluding（放宽），补充材料外链 should not→must not（收紧）；IJCAI may→will be rejected；CoRL 网站 will、表单 may，同届矛盾。
- **数据：** 句级对齐 diff；情态与范围词表（中英）；表单字段快照；Jev/LLM 接口
- **评审意见：**
  - researcher: The output feeds W12 ('what changed'). Keep the silent-deletion becomes 'unspecified' rule. Regex handles numbers, and an LLM handles only the modal-verb cases.
  - builder: 跨年页面结构变化大，句级对齐做不准，人工标注量不小。“删除的规则一律标未规定、不当作允许”这条原则必须坚持。

### W10 会议之外的政策：CCF 目录、资助方与制裁条款
排名 #30 · 综合 7.00 · 规模 M · 依赖 W01, P12

- **痛点：** 一篇论文值多少还取决于 CCF 目录调整、资助方声明、会议制裁条款，这些变化在新闻和公众号里，不在任何 tracker 上，几天内还会来回变。
- **做法：** watchlist 加入 CCF 官网、中国科协通知、各会制裁/单位资格条款（affiliation_policy，含 OFAC 相关文字，只放链接）。变化映射到 U(tier) 和 eligibility，触发 planner 重打分，只提醒受影响计划；资助方声明挂到会议“认可度”字段。等级字段带 ccf_edition，用户可设“本校仍按第 6 版”。App 不做法律判断，不判断用户单位是否受影响。
- **例子：** 2026 年 3 月：3/23 NeurIPS 加 OFAC 拒稿条款，3/25 CCF 呼吁抵制，3/27 科协停受理 NeurIPS 2026 资助、同日 NeurIPS 改回只针对 SDN；3/31 CCF 第七版把 IJCAI 降为 B。对需 2 篇 CCF-A 的学生，“AAAI 11/30 被拒→IJCAI-27”价值下降，改优先 ICML 或 ARR。
- **数据：** CCF/科协公告快照；制裁条款页；目录版本表；U(tier)
- **评审意见：**
  - researcher: For CN users, CCF catalog edition changes (IJCAI moved to B) matter as much as venue rules. Sanctions and affiliation text is sensitive, so link only and never interpret.
  - builder: CCF 目录版本对国内用户影响很大，数据可以手录。制裁条款在政治上敏感，只放链接，不做任何判断。
  - skeptic: CCF 目录版本（ccf_edition）价值高、风险低。制裁、OFAC 和抵制则在政治和法律上都敏感，出错或措辞不当会让开源项目在中美两边都惹麻烦，只放官方链接，不要映射到 eligibility。

### W18 按信息价值排核实队列
排名 #33 · 综合 6.93 · 规模 M · 依赖 R03, W06, X08

- **痛点：** 未核实字段很多（ICML/IJCAI 2027 日期、CVPR 上限、ICLR 刻度），维护者和用户都不知道先核实哪一条。
- **做法：** 对每个 UNVERIFIED/inherited 字段在合理范围内扰动，重跑 golden tests 和公开路线模板，统计翻转的路线数得到公开 VOI 分数，用来排核实队列并生成 good first data PR。本地对用户自己的计划做同样计算，提示“你的决策最依赖哪条未核实事实”，结果不上报。核实后 VOI 归零并重跑受影响计划。
- **例子：** ICML 2027 日期 VOI 最高：它决定“ICLR 12/16 被拒→ICML”间隔和“AISTATS 1/20 出结果→ICML”是否可行（需正文截止晚于 1/20）；IJCAI-27 次之；ICLR 刻度只影响区间宽度，排后。
- **数据：** golden tests；路线模板；往年日期分布先验
- **评审意见：**
  - builder: 有了 golden tests 以后，扰动重跑很便宜，也是给贡献者派活的好办法。

### W07 规则波动指数
排名 #39 · 综合 6.63 · 规模 S · 依赖 W01, W12

- **痛点：** 新规则发布后一两周常被反复修改，太早行动可能白做；各会规则稳定程度差很多，planner 却对所有继承规则一视同仁。
- **做法：** 字段级：统计最近 14 天修改次数、幅度、是否挂 WIP/being finalized，用历史估计这类规则多久稳定；波动高时 Policy inbox 标“暂缓，X 日复查”，不可逆动作前必显示。会议级：近几届改动字段数、截止前 30 天改动次数、未发布页数、inherited 占比；指数高的会议 planner 加宽缓冲，并在 T-14、T-3 生成“重核规则”任务。指数在会议页公开。
- **例子：** ARR qualifications 9/15–22 有 13 个 commit 并挂 WIP，标高波动，建议 9/28 表单可自查后再定人选（走人工审核者仍尽早申请）。ICLR 2027 改了 6 个政策字段且上限提前 16 天才公布；投 CVPR 2027 的论文会多出 11/2、11/13 两个重核任务，KDD 不加。
- **数据：** 快照与 git 历史；字段级 diff 计数；WIP 词表；changed_from_prev
- **评审意见：**
  - builder: 要先积累几个月快照才有意义。ARR 可以用 git 历史回填，其他会议有冷启动问题。
  - skeptic: 公开发布会议的"波动指数"可能被读成在批评 PC，建议只在内部用来加宽缓冲。

### W11 跨会规则矩阵与扩散雷达
排名 #40 · 综合 6.62 · 规模 L · 依赖 W12, R01

- **痛点：** 新规则在会议间互相借鉴，作者规划 3–6 个月后的会时，判断不了别的会今年的新规下一届会不会跟进。
- **做法：** 规则按家族归类（每人上限、互审义务、幻觉引用处罚、相关投稿互引、LLM 披露、现场报告、prompt injection 禁令），做“规则家族×会议”矩阵，每格写首次出现年份、当前值、来源；画扩散时间线，官方原文写明“仿照”的算强证据。对未发 CFP 的届次给定性“跟进可能性”（高/中/低附依据），不给概率，作为 what-if 情景源。明确标为推测，永不当规则、不参与 blocking。
- **例子：** 每人上限：IJCAI-ECAI 2026 8、KDD 每轮 7、AAAI 10、CVPR 2026 25、ICLR 2027 20（9/2）、ARR 每轮 20 一作 5。互引：ICML 2026→ARR 4 月 CFP 明写仿照。ICML 2027 CFP 仍 404，雷达提示“每人上限已在 3 个相关会出现”，组可按 20 篇压测 1 月计划。
- **数据：** 规则 family 标签；跨会跨年规则历史；“仿照”引文
- **评审意见：**
  - researcher: The current-value matrix (caps across venues) is handy. The diffusion radar is speculation.
  - builder: R01 做完后，这个矩阵就是规则库上的一个视图，很便宜。“扩散雷达”是推测，不能进 planner，也不能显示成规则。
  - skeptic: "跟进可能性"即使标了推测，也会被当成传言转发。不要公开发布，只作内部 what-if 情景。

### W09 regime 变更与事件模式：证据失效时降级建议
排名 #43 · 综合 6.58 · 规模 M · 依赖 W03, W01, D04

- **痛点：** 会议改分数刻度、审稿流程或中途出事故时，往年分数与结果的对应关系作废，工具却继续给出看似精确的数字，已做的决定可能建立在被回退的分数上。
- **做法：** watcher 监听影响统计可比性的字段组 review_process（score_scale、每篇审稿人数、AI 审稿、两阶段、rebuttal 机制、AC 分配）。变化时 advisor 自动把对应 StatsBand 标 regime 变更：降级为只给分位或加宽区间，并以 plan-change 通知曾依赖它的论文。审稿中途事故（泄漏、系统故障、流程重置）从博客 RSS、配置与时间变化、作者邮件识别，人工确认后进入事件模式：暂停基于分数的建议，事件后的本地分数快照标“可能被回退”，依赖的时间线标“变动中”，页顶卡片只引官方原文写明已知/未知与下次更新，结束后写入政策年表。
- **例子：** ICLR 2026 刻度改变、分数回退到 rebuttal 前、AC 重分配，50% 录用线从 5.81 降到 4.91。若 ICLR 2027 11/5 刻度与 {0,2,4,6,8,10} 不同，自动停用原始分数表；若讨论期再出类似 2025-11-27 的泄漏，暂停“11/10 撤稿转 CVPR”计算，只把 11/10、11/16 列为硬约束。
- **数据：** review_process 字段组；StatsBand regime 标记；博客 RSS；配置快照；人工确认开关
- **评审意见：**
  - builder: 事件模式做成人工开关加横幅就够了。从 RSS 和邮件自动识别事故不值得做。
  - skeptic: 事件模式下暂停分数建议是必要的安全阀，应该比 D04 先做。

### W19 【Moonshot】推动会议发布机器可读的投稿政策文件
排名 #50 · 综合 6.48 · 规模 XL · 依赖 R03, X04

- **痛点：** 规则变更只发在博客或 X 上，或在页面上悄悄改，没有版本号，所有 tracker 都在重复抓取和猜测。
- **做法：** 以本项目 schema 起草开放标准：会议在 /.well-known/submission-policy.json（或 OpenReview venue 配置）发布带版本号和 changelog 的结构化政策（冻结点、上限、双投窗口、LLM、撤稿可见性），每字段附人读原文。提供从同一 YAML 同时生成网页段落和 JSON 的生成器与校验器，先找 ARR、ICLR 这类规则已在 GitHub/博客的社区试点。watcher 优先读标准文件，抓页作后备。
- **例子：** ICLR 2027 9/2 博客公布 20 篇上限，指南未标新规；若有 policy.json，changelog 直接写“v2027.2: author_cap null → 20”，所有工具当天提醒受影响作者。ARR dates.md 本就在 GitHub，是最易试点。
- **数据：** 本项目 schema；与 PC 和 OpenReview 的沟通；security.txt 等先例
- **评审意见：**
  - builder: 起草规范容易，推动采用要靠 PC 和 OpenReview 配合，一个人推不动。可以先把 schema 发出来，找 ARR 试点。
  - skeptic: 单人开发做不了，只作长期倡议。

### W03 投稿系统配置与表单即规则
排名 #51 · 综合 6.47 · 规模 M · 依赖 R01, R04

- **痛点：** 撤稿是否公开、哪些字段何时锁定，实际由 OpenReview venue 配置和表单决定，常与指南文字不一致，或只写在表单字段说明里，作者填表时才看到。
- **做法：** venue group 接口截至 9/24 仍可匿名读取；invitation 等需账号的部分由维护者限速抓取，不接触任何投稿内容。每天快照 public_submissions、public_withdrawn_submissions、withdrawn_submission_reveal_authors、accept_decision_options 等配置及表单字段 schema、必勾项、可编辑窗口。字段翻转或与规则库文字矛盾即生成事件（contradictory，按更严一方处理）。解析结果以 source_type=form_text / config_inferred 入库，界面与书面政策分开显示。PaperCept、Chairing Tool 手册同样处理。
- **例子：** 9/24 ICLR 2027 group（tmdate 9/20）的撤稿公开项均为 False，而指南写正文截止后撤稿立即公开：标“文字与配置暂不一致，按文字准备”，每天检查翻转。ICLR 的 reciprocal_reviewer 等三字段摘要截止后锁定只写在表单；KDD 2027 表单新增两个必勾项。
- **数据：** OpenReview API v2 groups/invitations；字段清单；快照存储；visibility 字段
- **评审意见：**
  - researcher: The parts that need an account run into ToS and access issues. Keep the anonymous group reads only.
  - builder: 依赖 OpenReview 的 group 接口继续匿名可读，invitation 需要登录，有 ToS 风险。配置值不等于书面政策，噪声大，界面上必须和书面规则分开显示。
  - skeptic: 需要账号的 invitation 由维护者抓取，有 ToS 风险。配置标志常常到截止后才设置，拿来推断政策容易误导；把配置和书面政策分开显示是对的。

### W14 传言账本与勘误榜
排名 #62 · 综合 6.10 · 规模 M · 依赖 W05, X08

- **痛点：** 非官方日期和规则先在 tracker、公众号、微信群流传，错误互相转抄，作者按错误日期做了计划。
- **做法：** 每条非官方说法（X、知乎、公众号、群、其他 tracker、社区提交）记入账本：内容、最早来源、时间、状态（传言/二手/官方确认/已否定）。二手说法只能开 issue 不能进数据。官方公布后自动判定真伪，统计各来源提前量与准确率形成可信度记录；被否定的说法公开上勘误榜，方便别人引用纠错。
- **例子：** ICML 2027“约 1/16 或 1/22”目前是“二手”；AI Weekly 把 ICLR 2027 日期写成 10/29、12/9 并称“投 3 篇审 6 篇”是新规，均已否定；CallForPaper.org 把 ICRA 2027 通知日写成 2029 年。ICML CFP 上线当天自动核对。
- **数据：** 社区提交入口；来源表；与官方字段对照
- **评审意见：**
  - researcher: A public errata board naming other trackers creates friction. Keep the rumor ledger internal.
  - builder: 公开点名其他 tracker 或自媒体容易引起冲突。勘误只针对内容，措辞要中性，不给来源排名。
  - skeptic: 公开勘误榜点名其他 tracker 和个人账号，还给来源打准确率，会引发社区冲突甚至名誉纠纷。只记录"某说法与官方原文不符"并附链接，不给个人或项目打分。

### W13 数据 PR 质量闸门：反驳 agent 与合成人物影响测试
排名 #63 · 综合 6.07 · 规模 L · 依赖 R03, X05, X08

- **痛点：** agent 维护数据最怕看起来很对的错误（同名会议、年份错位、范围词、二手转抄）；一个人维护时判断不了一条改动对真实作者影响多大，用户数据又都在本地不能拿来测。
- **做法：** 提议 agent 生成补丁后，另起只读快照、不联网的反驳 agent 专门“证明补丁是错的”：域名是否在 series.yml 白名单、届次年份、同名实体、范围词、时区、与上游冲突、inherited 冒充 verified，结构化 objections 汇总成 PR 评论，人工判对错进标注集。仓库维护 20–30 个公开虚构人物（挂名 25 篇的 PI、只有 ACL Findings 的直博生、只投机器人会的硕士生……），CI 用新旧 bundle 各跑一遍其计划，PR 评论贴出“谁的计划变了”；FYI 级改动却翻转了某人计划则要求调高严重度，改动越大越需两人审。低风险字段可一键合并，上限、双投、撤稿永远人工审。
- **例子：** 提议 agent 把 icml2027.eurac.edu（少数语言会议，征稿 9/21 截止）当 ICML 2027，被“域名不在 icml.cc 白名单”拦下；ResearchTheta 的 ICML 1/16、1/22 保持 UNVERIFIED。ARR 9/19 资格修订 CI 显示“直博生、1 篇 ACL、8 条审稿”从可人工审核变为需 10 条和推荐信，定为 plan-change 当天合并。
- **数据：** snapshots 分支；series.yml 白名单；persona 测试数据；golden tests；PR bot；LLM 预算
- **评审意见：**
  - researcher: Maintainer infrastructure. The persona tests are a good idea, but the refuter agent is overbuilt for a solo developer.
  - builder: 20 到 30 个虚构人物加 golden tests 很值，也便宜。反驳 agent 要花 LLM 预算，而且 fork 来的 PR 拿不到 secrets，延后。

### W15 作者邮件与 newsletter 中的规则：本地识别、脱敏上报
排名 #69 · 综合 5.63 · 规模 M · 依赖 P13, X05

- **痛点：** 有些规则说明只出现在发给作者的邮件或 newsletter 里，而邮件夹着论文编号、标题和审稿内容，不能随便上传。
- **做法：** 本地邮件连接器识别投稿系统邮件和会议 newsletter 里讲规则的段落，用 Jev Noul 判断“是否宣布了对全体作者适用的规则或日期变化”。用户点“上报”后本地删除编号、标题、姓名、审稿内容，只保留全体适用段落，预览后开 issue（来源：作者邮件，待核实），维护者用多份上报交叉印证。
- **例子：** NeurIPS 2026 July newsletter 才说明 rebuttal 与 official comment 同等对待、多条评论合计可超 10,000 字符、可回复到 Aug 3；AAAI 8 月公开信宣布防止互审成环的匹配约束。首位作者上报后几小时即进入待核实区。
- **数据：** 本地邮件解析；脱敏器（正则+本地 NER）；issue 模板
- **评审意见：**
  - builder: 上报量小，而脱敏一旦漏掉编号或标题就是泄密。先做“手动粘贴段落开 issue”的模板。
  - skeptic: 投稿系统邮件里有编号、标题和合作者，正则加 NER 脱敏只要漏掉一项，就会泄露在审论文。把邮件发给闭源的 Jev 也违背本地优先原则。只处理群发 newsletter 的段落，并默认用本地模型。


## 规则库（12 个）

### R01 逐字引文规则卡（带官网高亮深链）
排名 #1 · 综合 8.38 · 规模 M

- **痛点：** 作者看到的多是二手转述，不知道原话、出处、核对日期、是不是去年的；出了问题也拿不出原文去问 PC。
- **做法：** 规则库最小单元：答案标签（必须/允许/不允许/有条件/未规定/不要求/矛盾）、置信度、适用阶段（引用 milestone 类型不写死日期）、英文原文逐字引用加中文释义、来源 URL 加 Text Fragment 深链（#:~:text=）、快照 sha256 与 fetched_at、“较去年变化”和“官方矛盾”徽章。Q&A、diff、linter、planner 的每条输出只能引用卡片 id。深链失效时卡片变灰进复核队列。首批从 VENUE_RULES 12 个会议转成 policy.rules YAML。
- **例子：** ICLR 2027 author_freeze：增删 9/18 AoE 起不允许、调序允许到 9/25 AoE；原文 “new authors cannot be added or removed … No changes to authors are permitted after the submission deadline”；变化徽章：2026 只写 cannot be added；矛盾徽章：讨论期 FAQ 说 11/5–18 可调序。
- **数据：** VENUE_RULES → policy.rules YAML；snapshots 分支；quote 偏移；上一届同名规则
- **评审意见：**
  - researcher: The foundation for every pillar, and VENUE_RULES already exists. Build it first.
  - builder: 这是整个项目的地基。主要成本是把 12 个会议的 VENUE_RULES 人工转成 YAML，并校验引文逐字存在。Text Fragment 深链在主流浏览器都能用，失效时要有降级处理。
  - skeptic: 所有安全措施都建立在它上面，应该第一个做。

### R09 desk reject 排查清单与第一篇论文护航向导
排名 #6 · 综合 7.95 · 规模 M · 依赖 R01, R06, R11, P16

- **痛点：** desk reject 原因散在 CFP、指南、checklist、表单、审稿人政策里，很多与稿件无关；一年级博士生不知道注册截止比正文截止更要命、无机构邮箱合作者要提前两周建号。
- **做法：** 把所有后果为 desk_reject、移出论文集、扣留审稿的规则按会编成触发清单，分稿件、表单、人员、审稿期行为、事后五组，每项标负责人、生效时间、能否自动检查（linter 已覆盖/手动/需合作者确认），截止前生成逐项排查，打勾状态本地保存；schema 新增 penalty 结构。新手模式：回答 5 个问题（目标会、作者及邮箱类型、受试者或数据集、arXiv 计划、谁兼任审稿人）生成按“错过就 desk reject”严重度排序的义务链，每节点配一张“新手为何踩坑”卡（原文、后果、往年真实数字）、“问导师”一键生成微信摘要、术语悬停解释，完成即关闭提醒。
- **例子：** ARR 10 月轮（10/12 AoE）触发项：缺 Limitations、Word 模板、hallucitations、重投未链上一版、checklist 全答 yes、无 contributor 进抽签、1 周内 profile 不全、response 带外链。一年级学生 9/24 选 CVPR 2027：qq 邮箱本科生最晚 10/27 建号；11/10 注册即冻结作者；录用前不得在公众号宣传；rebuttal 1/25–2/1 仅一页 PDF。
- **数据：** penalty 结构；linter 覆盖映射；本地 people 表；往年处罚数字；节假日表
- **评审意见：**
  - researcher: A per-venue desk-reject checklist is what I'd hand every new student. It's mostly data work on R01.
  - builder: 有了 penalty 结构后，清单可以直接生成，对新手价值高。“往年真实数字”必须附官方来源。
  - skeptic: 清单全部打勾不等于合规，界面上要说明哪些项没有覆盖。

### R05 “现在还能改什么”字段锁面板与 Rule Lens 表单标注
排名 #12 · 综合 7.62 · 规模 M · 依赖 R01, W03

- **痛点：** 作者、顺序、标题、摘要、PDF、补充材料、互审人字段各自在不同时间冻结，有的讨论期又重开；出错发生在填表那一刻，作者往往只记得去年的规则。
- **做法：** 对每个 Submission 按今天渲染字段状态表：开放（到何时，会议时区+北京时间）、已锁（从何时，附原文）、有条件、矛盾、未规定；同一状态机生成“最后修改机会”提醒。Chrome/Firefox 扩展（只在 openreview.net、CMT、PaperCept 等域名启用）从 URL group id 识别会议，按“字段 id → rule_id”映射在表单字段旁显示冻结时间、原文、verified 状态；联动本地计划时在作者列表旁显示每人已计数投稿与上限。只读：不自动填写、不提交、不改页面；数据用本地整包 bundle，不按页面请求以免暴露在看哪个会。
- **例子：** 9/24 ICLR 投稿：增删已锁（9/18）、顺序开放到 9/25 AoE、标题摘要开放但不得 'read like a different paper'、互审三字段已锁、PDF 9/25–11/5 冻结、11/5–18 重开（≤10 页）；AAAI Phase-2 全部冻结，10/19–25 只开 feedback。9/28 AISTATS 摘要表单作者字段旁显示 '… final … under any circumstances'（9/29 AoE）。
- **数据：** metadata_edits、author_freeze、pdf_revision；带时区 milestones；字段 id→rule_id 映射（社区维护）；扩展
- **评审意见：**
  - researcher: 'What can I still change today' comes up around every abstract and full-paper deadline. Build the panel before the extension.
  - builder: 字段锁面板是纯 core，建议先做。扩展里“字段 id → rule_id”的映射要靠社区维护，改版后容易失效，延后。
  - skeptic: 锁定状态一旦算错，用户会错过最后修改窗口，或者以为还能改。扩展整包下载 bundle、只读不写，这个设计是对的。

### R04 官方矛盾与规则空白：检测、账本与向 PC 求证
排名 #14 · 综合 7.43 · 规模 M · 依赖 R01, W01

- **痛点：** 同一届 CFP、指南、FAQ、表单、合作会议页面经常互相矛盾，很多关键问题官方根本没写，作者只能猜或在群里听二手说法；即使有人问到答案也不会传给别人。
- **做法：** 对同一 edition 的全部来源做字段级交叉比对，不一致生成 contradictory 条目（双方原话、影响阶段、默认“按更严一方准备”）；另设“执行惯例层”记录书面说法与实际执行不一致的已知事实，单独显示、不参与 blocking。feasible() 遇到任一方“未规定”时生成灰区卡并默认保守路径。两类条目都可一键生成给 PC 的中英问询草稿：引两句原文、只问一个是非题、不透露论文内容，由用户自己发送。公开 issue 跟踪状态（未问/已问/已回复/页面已修正）并显示有几人在等；回复经脱敏、征得 PC 同意后以 source_type=pc_email 入库，标 verified: correspondence，第二份独立回复或官网更新后升级。官方修正本身记为政策事件。
- **例子：** ARR contributor 注册 dates 页 10/14 与 NAACL 页 10/12，按 10/12 提醒；meta 12/17 与 12/18。ICLR 讨论期能否改标题/调序：正文禁、FAQ 允许，须在 11/5 前问清。CVPR 2027 指南 404，未说明 ICLR 在审能否 11/10 注册 CVPR，起草问询。ICML 2026 CFP 说可申请改作者、FAQ 说 PC 从未批准，进执行惯例层。
- **数据：** 全部来源快照；字段抽取；VENUE_RULES 约 40 条矛盾；问询模板；pc_email 来源类型与审核流程
- **评审意见：**
  - builder: 已有约 40 条矛盾可以直接入账。问询草稿只是模板。PC 回信入库要征得同意并脱敏，流程可以轻量。
  - skeptic: 批量生成问询草稿，可能让 PC 被重复邮件淹没。每个问题只由一人去问，用公开 issue 汇总；PC 的回复要先征得同意才能入库。

### R06 转投 A→B 规则 diff 与 crlint 版式预检
排名 #15 · 综合 7.40 · 规模 L · 依赖 R01, R03

- **痛点：** 从被拒到下一截止只有几天，作者要自己对照两份长指南；计页口径各会不同，改模板会 desk reject，常在截止前几小时才发现超页或缺必需章节，工作量被严重低估。
- **做法：** 规则层：任意两个 edition 并排 diff，按“必须新增/删除/改写/变严/变松/对方未规定”分组，覆盖稿件、表单、人员义务、审稿期行为、撤稿后果，两侧附 quote，支持 A→B→C。稿件层：本地 CLI `crlint --target`、浏览器 WASM、pre-commit 与 GitHub Action，用目标会官方模板实编 LaTeX 测超页与溢出图表；PDF 端识别模板、按 not_counted 计有效页、查字号边距行距；LaTeX 端查 sty 年份、geometry、负 vspace；检查必需章节（Limitations、AI-use、checklist、lay summary、Compute Reporting Form）与隐藏文字；camera-ready 反向模式查致谢恢复等。实测结果换算 prep_days 回填 feasible()，工时系数用户可校准。规则全来自 YAML，不写死；不建议改 margin 挤页。
- **例子：** AAAI-27 Phase-1 被拒→ARR 10 月轮：换 ACL 模板、7+2 改 8 页正文、新增 Limitations（缺则 desk reject）、换 Responsible NLP checklist、10/14 前注册 contributor、全体作者补 ORCID。p-007 10 页 ICLR 修订版用 CVPR 模板实编超 2.3 页，缺 Compute Reporting Form，估 4 天，11/10 撤稿到 11/16 可行但紧张。ICRA 2027 终稿沿用 6+n 习惯直接报错。
- **数据：** 两侧 rules；官方模板与 sty（许可允许时）；page_limit.not_counted、mandatory_components；pdf.js/PyMuPDF；latexmk
- **评审意见：**
  - researcher: This is the highest-frequency pain: every rejection means reformatting for the next venue. Split it. The A-to-B rule-diff checklist is M and should ship early. crlint compiling with official templates is L and should come later.
  - builder: 规则 diff 很便宜。crlint 用官方模板实编要本地 TeX；浏览器端 WASM LaTeX 太重，官方 sty 的许可也各不相同。先做 CLI，PDF 端用 PyMuPDF 计页、查字体。
  - skeptic: ACL 的 aclpubcheck 等工具已经做了部分版式检查。各会官方 sty 的许可不一样，需要逐一核对。

### R07 匿名泄露扫描器（稿件与补充材料）
排名 #19 · 综合 7.33 · 规模 M · 依赖 R06

- **痛点：** 双盲泄露不只在作者栏：PDF 元数据路径、GitHub/HF/W&B 用户名、Dropbox 链接、致谢基金号、代码 zip 里的 .git 和 notebook 输出都会暴露身份，各会对外链要求也不同。
- **做法：** 本地扫描 PDF 与补充材料 zip：XMP/Info 元数据、全部超链接按类型分级（个人 GitHub、HF org、wandb、网盘、短链、追踪访客的托管站）、致谢与 Funding、“our previous work”自引、图片 EXIF、zip 内 .git、__MACOSX、ipynb 输出路径、LICENSE 署名。严重级别按目标会规则（是否允许外链、是否要求冻结匿名分支）。只用于遵守匿名规定，只报告问题。
- **例子：** CVPR 2027 补充材料 11/23 截止：notebook 输出有 /home/lab-zhang/、config 有 wandb entity、有个人 GitHub 链接。ICML 要求匿名仓库用截止后不再修改的分支并删作者与 license；IJCAI-ECAI 2026 禁止投稿含致谢；ICLR 2027 托管站点追踪访客有 'risk of rejection'。
- **数据：** 链接域名分类表；code_link_anonymity、supplementary 规则；PDF/zip 解析；身份信息正则
- **评审意见：**
  - researcher: I'd run it on every submission. Cheap and local, and severity by venue rule is the differentiator.
  - builder: 本地扫描 PDF 和 zip 是确定性的工作，难度低。已有零散工具在查元数据，差异点在按目标会规则定严重级别。
  - skeptic: arxiv-latex-cleaner 等工具已有部分功能，按目标会规则分级严重程度是新的。

### R11 执法记录：这条规则真的会执行吗
排名 #20 · 综合 7.32 · 规模 S · 依赖 R01

- **痛点：** 规则大多写 “may desk reject”，作者分不清哪些真会执行、哪些只是写着，风险判断全凭传闻。
- **做法：** 每条规则挂 enforcement 记录：官方公布的处罚数字、日期、检测手段（交叉查重、水印、GPTZero、引用核查）与来源。规则卡与会议页显示执法记录，planner 做近似重复、LLM 文本、幻觉引用、互审违规检查时按有无执法记录调整提醒级别。只陈述事实，不教人绕开检测。
- **例子：** AAAI-26 与 9 个重叠会议交叉比对 desk reject 141 篇；ICML 2026 水印检测，因互审违规 desk reject 497 篇；EMNLP 2026 GPTZero desk reject 258 篇、1,166 位作者；NeurIPS 2026 position track 18.4% 因 AI 检测被 desk reject。组里一篇在 AAAI、一篇相近论文准备投 CVPR，近似重复检查升为 blocking。
- **数据：** 官方博客和报告的处罚统计；与 rule id 映射
- **评审意见：**
  - builder: 手工整理官方博客里的处罚数字即可。每个数字都必须链接原始报告，上面列出的几个数字需要逐一核实。
  - skeptic: 按"有没有执法记录"调整提醒级别，等于暗示"没执法过的规则可以不管"。执法记录只能用来上调严重度，绝不能下调。

### R02 按日期回答、只挑卡片的规则问答
排名 #23 · 综合 7.10 · 规模 L · 依赖 R01, R04, X05

- **痛点：** 作者问的是“今天我还能不能做某事”；通用 LLM 会拿别的会或往年规则填空且不给出处，截止前夜代价极高。
- **做法：** 本地管线：意图解析（会议、届次、rule id、动作；分类交 Jev Choice 或小模型，只输出至多 3 个候选 (series, year, rule_id)，“今年/下一届”由代码按今天解析）→ 结构化检索并由代码算出当前阶段 → 直接展示已核实规则卡或模板答案，每句挂 quote id，LLM 至多改写措辞并过引用校验。找不到则答“未规定/规则库暂未收录”，列出已查来源并一键开 issue，绝不借用他会规则；矛盾给双方原话并建议按严。可一次回答多会成表。问题不上传。问绕过上限或规避检测只返回规则原文和处罚。群 bot /rule 与 MCP 共用路由。
- **例子：** 9/24 问“摘要截止后还能加作者吗？”：ICLR 2027 不能（9/18 冻结，'no exceptions whatsoever'）；CVPR 2027 可到 11/10 AoE（北京 11/11 19:59，继承 2026）；ARR 10 月轮提交即冻结；AAAI-27 已过节点。问“IJCAI 今年几篇上限”：2027 未公布，2026 为 8 篇，不把 8 当 2027 答案。
- **数据：** rules YAML 与 milestones；中英同义问法词表；答案模板与引用校验器；路由模型
- **评审意见：**
  - researcher: Questions like 'can I still add an author' come up constantly. The only edge over ChatGPT is refusing to guess and citing quotes, so the RuleBench-style checks from R12 have to back it.
  - builder: 路由和模板答案都可行，难点在覆盖率：问题多数会落到“未收录”。LLM 只能改写措辞，必须经过引用校验，并且要配 R12 评测集。
  - skeptic: 通用 LLM 回答规则问题时，常把往年的规则当成今年的。"只挑卡片、查不到就答未规定"是正确的防线；关键是给路由选错届次写回归测试（配合 R12）。

### R12 规则问答评测集（ConfRulesQA / RuleBench）
排名 #31 · 综合 6.95 · 规模 M · 依赖 R01, R02, X05

- **痛点：** 规则问答答错可能导致 desk reject，但没办法衡量某个后端或某次改动是否变差，尤其“本该答未规定却编了答案”。
- **做法：** 从 VENUE_RULES 自动生成约 300 题：直接规则、按日期（“截至 2026-09-24”）、跨会对比、答案为未规定、答案为矛盾、诱导套用他会规则的陷阱题、“今年已改”题；每题附标准 status、quote id、as-of 日期。指标：结论准确率、引用精确率（quote 逐字在快照中）、虚假确定率、把往年当今年的比例、日期正确率（检查 LLM 是否自算日期）。三种设置：裸模型、模型+MCP、模型+选择式路由。每次改问答管线或换后端在 CI 跑子集，随数据 PR 更新，每季度发布结果；CC-BY 发布到 HF，模型最常错的题优先做成规则卡。
- **例子：** “CVPR 2027 每人最多几篇？”标准：2027 未公布，2026 为 25（继承），直接答 25 算虚假确定。“ICML 2026 rebuttal 5000 词？”标准：矛盾，按字符准备。“AAAI-27 feedback 能放链接吗？”标准：未规定（AAAI-26 规则未确认沿用）。
- **数据：** 结构化 VENUE_RULES；snapshots；题目模板与评测脚本；各后端适配器
- **评审意见：**
  - researcher: No direct user value, but it gives credibility and a paper, and it keeps R02 honest.
  - builder: 可以从 VENUE_RULES 自动出题。标准答案会随“截至日期”过期，评测集要按快照日期打版本。对建立社区信任和发 HF 数据集都有用。

### R08 参考文献核查：幻觉引用与同期工作标注
排名 #36 · 综合 6.77 · 规模 M · 依赖 R01

- **痛点：** 幻觉引用已被多个会列为 desk reject 理由，多人合写时没人逐条核 .bib；作者也不知道“缺最新 baseline”可以用同期工作规则回应。
- **做法：** 解析 .bib/.bbl 或经 Zotero 本地 API（只读）读取，先和离线 DBLP dump 比对，避免把整份参考文献发给外部暴露研究方向；用户同意后再查 Crossref/arXiv/S2（只发 DOI 或标题）。分四类：查无此文、作者年份会议不符、arXiv 已正式发表、重复条目，后果按目标会规则。给每条标“是否晚于目标会同期工作截止”，供 rebuttal 引用。
- **例子：** 对 9/25 截止的 ICLR 稿核查发现 2 条查无此文：ICLR 2026 曾因幻觉引用 desk reject 且结果一直公开，ARR 列 'hallucitations'，CoRL 用 GPTZero 查引用。同期截止：ICLR 2027 为 7/17（仅 arXiv 论文从不要求比较），CVPR 2027 为 9/15。
- **数据：** DBLP XML 离线索引；可选 Crossref/arXiv；contemporaneous_cutoff；Zotero 本地 API
- **评审意见：**
  - researcher: Hallucinated-citation desk rejects are live now, but checkers are multiplying. The offline DBLP-first check for privacy is the differentiator.
  - builder: 2025 到 2026 年已经出现多款幻觉引用检查器。DBLP dump 约 1GB，只能在 CLI 离线用。差异点只在“同期工作截止”和目标会的处罚规则。
  - skeptic: 2026 年已有多款幻觉引用检查器（如 GPTZero），差异在于按目标会的后果分级，以及用离线 DBLP 保护隐私。

### R10 AI 使用账本、写作 agent 护栏与按会声明生成
排名 #55 · 综合 6.37 · 规模 L · 依赖 R01, X03, W06

- **痛点：** 各会 LLM 政策差别很大（位置、披露项、允许用途），转投时要按新会规则重写声明，作者早忘了哪段用过 AI；AI 编程和写作助手也不知道这篇稿子能用 AI 到哪一步。
- **做法：** 本地账本记录每次 AI 参与（工具、用途：润色/代码/证明/数据/实验设计、段落 hash、时间），App 自身修改自动记账，外部工具经 MCP ai_ledger.append 写入。MCP 提供 llm_policy(paper)，写作 agent 改稿前先查目标会允许的模式和原文，超范围请求由 agent 拒绝。按目标会 llm_authors 规则把账本编译成声明草稿（放哪里、必须/建议披露、是否计页），转投自动生成 A→B 迁移；若某用途在目标会被禁止，只给原文和风险并提示人工重写，不改写措辞去规避。
- **例子：** p-007 9/25 投 ICLR：生成 AI-use 节（不计页），“AI 帮设计实验”也需披露。转 KDD 2027：按 ACM 2026-05-14 政策写作辅助无需披露、研究用 AI 写在方法部分。转 CVPR 2027：政策 being finalized，声明任务标“等定稿”。ICRA 在致谢披露。
- **数据：** llm_authors 字段与各会声明模板；本地账本；MCP
- **评审意见：**
  - researcher: The per-venue AI-use statement generator is useful now that ICLR 2027 requires one. The logging ledger won't be maintained.
  - builder: 账本要靠用户主动记录，采用率会很低，账本不全时生成的声明可能失实。按 llm_authors 生成声明模板这一部分值得做。
  - skeptic: 账本只能记录经过本 App 或 MCP 的 AI 使用，外部 ChatGPT 等不会入账，所以自动生成的声明会系统性少报，而作者签的是一份不完整的声明。必须明确写出"账本不完整，需要本人补全"。agent 拒绝超出范围的请求是好设计。

### R03 可执行规则 DSL：三值逻辑、严格度开关与证明链
排名 #57 · 综合 6.28 · 规模 L · 依赖 R01

- **痛点：** 规则在 YAML 里只能给人看，feasible() 里手写 if-else 难审计，规则一改就改代码；官方没写的地方最危险，常被默认“没禁止就是允许”；判“不可行”时也说不清是哪条挡住。
- **做法：** 小型声明式 DSL（forbid after、cap、exclusive、penalty、requires、wait），每条语句带 quote id 与 status，编译成 packages/core 纯函数，planner、advisor、提醒共用同一解释器。求值为三值（允许/禁止/未规定，另有矛盾），严格缺 key（未核）与 unspecified（核过官方没说）；只允许同系列上一届作 inherited。三档严格度：严格（未规定动作视为禁止、义务视为必须）、字面、并排（结论不同则标出决策日差异）。每个结论输出证明链，UNVERIFIED 前提标为“假设”；可反问“满足什么才可行”返回最小改动。CI 做类型、覆盖（每条必须有 quote）和级联 golden tests；首批覆盖 author_freeze、cap、dual_submission、withdrawal；远期可编译到 Datalog。
- **例子：** CVPR 2027 exclusive(paper, [11/16, 2027-02-22], scope=[conference, workshop])：先投 CVPR 再投 ICML 判不可行并给证明，顺带指出 ICLR 2027 workshop 也被排除。ICLR 审稿期间能否先注册 CVPR：严格模式须 11/10 前撤 ICLR，字面模式 11/16 前撤即可，并排视图建议按 11/10 准备。
- **数据：** DSL 语法与类型系统；YAML→DSL 迁移；golden tests；证明链渲染；可选 Datalog 引擎
- **评审意见：**
  - researcher: Over-engineered for v1. Hand-written TypeScript predicates with three-valued results for 4 rule families give most of the benefit.
  - builder: 一个人早期做 DSL 是过度设计。先用有类型的 YAML 字段加 TypeScript 函数，等 author_freeze、cap 等四类规则稳定后再抽象成 DSL，Datalog 更晚。
  - skeptic: "字面模式"相当于给想钻空子的人一个看似有背书的宽松读法。默认用严格模式；并排显示时明确写"按严格的一方准备"。


## 跨支柱（8 个）

### X03 本地 MCP server：让 AI 助手查规则、算可行性、读计划
排名 #11 · 综合 7.67 · 规模 M · 依赖 R01, R03, R06, R08

- **痛点：** 研究者在 AI 编程助手里改稿和问“还能投哪”，模型凭记忆套往年规则；用户计划锁在 App 里 agent 看不到；把稿件上传网页工具又违反保密。
- **做法：** `npx nextvenue mcp` 以 stdio 在本机运行、不开端口，除更新 bundle 外不联网。resources：bundle 与规则卡全文。只读 tools：rules_get/search/diff、lock_state、feasible、whatif、conflicts、timeline（AoE+北京时间）、lint.pdf、refs.check、plan.check、llm_policy。唯一写 tool 是 propose_plan_change，进 Policy inbox 等用户确认。所有日期计数由 core 计算，工具描述写明“以 quote 为准，未规定就答未规定”。默认代号模式：标题、摘要、审稿原文不经 MCP 输出，可逐篇放开。内置护栏：涉及绕过上限、多账号、藏 prompt、规避检测只返回原文与处罚。附 review-round、weekly-brief prompts。
- **例子：** 9/24 在 AI 编程助手里问“p-003 今天被 NeurIPS 拒，还能投哪？小王第一篇 NeurIPS 今天刚中”：feasible 给出 ICLR 9/25（需已注册摘要）与 AISTATS 9/29/10/6；rules_get 返回 AISTATS “Eligibility is determined by papers accepted … by the abstract submission deadline”，小王不受新手 3 篇限制，但对 ICLR（按 9/18）仍不合格。改 ARR 格式时 agent 调 rules.diff 与 lint.pdf，每条建议附 quote id。
- **数据：** bundle；本地计划导出；packages/core 与 revise；MCP TS SDK；护栏规则表
- **评审意见：**
  - researcher: AI researchers already live in AI coding assistants, and this is a cheap wrapper over core. It's also a strong distribution channel.
  - builder: 用 MCP TS SDK 包一层 core，工作量小。风险是 agent 把计划内容外传，所以默认代号模式是必要的。
  - skeptic: 会伴已有 MCP，但只提供日期。默认代号模式和护栏都做得好；注意工具返回的规则原文里可能夹带 prompt injection。

### X02 作者名单冻结前的署名清点
排名 #16 · 综合 7.38 · 规模 S · 依赖 R01, P04, R05

- **痛点：** 作者名单在第一个截止就冻结（AISTATS 9/29 'under any circumstances'、ICLR 9/18、CVPR 11/10），之后新人永远加不进来，署名纠纷也无记录可查。
- **做法：** 冻结前 72 小时发起清点，逐人核对：本人是否同意署名、CRediT 贡献描述、OpenReview 资料是否满足该会要求、上限余量（来自余量凭证）、冲突声明。最后问“之后的 rebuttal 或补实验会不会有新人参与？”，会就现在决定加不加。结果带时间戳存本地，可导出给全体作者确认。
- **例子：** 9/26 为 AISTATS 9/29 摘要清点：发现实习生 10 月负责补实验，团队 9/28 把他加进名单并存档贡献说明；AISTATS 每人上限规则库为“未规定”，不拿 ICLR 20 篇去套。
- **数据：** 作者冻结点、资料要求；余量凭证；私有作者记录
- **评审意见：**
  - builder: 就是一份清单。上限规则未规定时不拿其他会议的规则来套，这一点做对了。
  - skeptic: 问"之后会不会有新人参与"，可能导致在对方还没做出贡献时就提前挂名。应改为提示"冻结后才加入的贡献者只能写进致谢"。

### X04 开放数据层：规则 API、变更日志 feed、llms.txt
排名 #17 · 综合 7.37 · 规模 M · 依赖 R01, W01, X03

- **痛点：** ccfddl、PaperDDL 只有日期没有规则，各自发现变化、各自出错；没有机器可读、带来源的“会议规则变更流”；AI 助手常用过时知识回答规则问题。
- **做法：** GitHub Pages 发布以内容哈希命名的静态 JSON（CC-BY-4.0，附 JSON Schema、ETag）：/editions/{id}/rules.json、/rules/{rule_id}.json（跨会对比）、/changes.json。每条变更有稳定 ID：会议（映射 ccfddl id）、字段、前后值、逐字引文、快照哈希、生效时间、严重度、核实状态；另出 JSON Feed、每会与全局 Atom、webhook、“政策事件”ICS 和人读 changelog 网站，可按会议与字段订阅。npm 包 @conference-reminder/rules 提供 lockState、diff 纯函数，“今天”在客户端算。发布 llms.txt，本地 MCP 在无计划模式下即公共只读接口（get_rule、list_changes、get_timeline）。可嵌入徽章；日期修正主动回馈 ccfddl 与 HF，给 ccfddl 提 author_freeze 等少量字段 PR 引流回规则卡。
- **例子：** 近期记录：9/2 ICLR 20 篇上限、9/11 ARR sustainable reviewing、9/16 ICRA 延期 24 小时、9/19 ARR 资格修订。订阅了 ICRA Atom 的 tracker 9/16 当天即可更新；ccfddl 在 ICLR 摘要截止旁显示“即作者冻结，无例外”。AI 助手查 CVPR 2027 LLM 政策得到“截至 last checked 尚未定稿”，不会编造。
- **数据：** build 输出 bundle；changelog schema；feed、ICS、徽章生成器；ccfddl/HF id 映射
- **评审意见：**
  - builder: GitHub Pages 上的静态 JSON、feed 和 ICS 都容易做。webhook 需要服务器，砍掉。给 ccfddl 回馈 PR 是很好的引流方式。
  - skeptic: 官方原文不是本项目能用 CC-BY 授权的内容，许可声明要把逐字引文排除在外。把修正回馈给 ccfddl 是好的共生方式。

### X01 合规 rebuttal 编辑器（含规则原文插入与语气检查）
排名 #25 · 综合 7.07 · 规模 M · 依赖 R01, D01, W06, R10

- **痛点：** rebuttal 格式差别很大（字符上限、外链、新结果、一页 PDF），复用上一会的回复容易违规；作者不知道可以直接引官方规则回应“缺最新 baseline”；深夜写出的回复常带火药味。
- **做法：** 每会一套从规则库生成的 lint：实时计数（单位矛盾时按更严算）、外链及“github dot com”变体检测、身份暴露说法、禁止新结果的会检测到新结果时警告；可导出一页 PDF 模板。LLM 模式按 llm_authors 切换（只许润色的会关闭生成），每次 AI 修改写入本地日志。旁边“规则原文”面板收录同期工作截止与审稿人指南关于新实验的原话，一键插入并附出处。本地语气检查标出防御、讽刺、指责句并给中性改写。规则未出时用上一届标 inherited，watcher 发现新规后自动重检草稿。审稿原文只存本地。
- **例子：** AAAI-27 feedback（10/19–25）规则未出，按 AAAI-26 的 2,500 字符、无 URL、无新结果检查并标 inherited；从 NeurIPS 复制来的 9,000 字符回复被标红。KDD Cycle 1 rebuttal（9/29–10/13）逐条回复、无超链接。ICLR 讨论期审稿人要求比较 2026 年 8 月 arXiv 论文，插入“仅 arXiv 论文从不要求比较”原话。
- **数据：** rebuttal_format、llm_authors、contemporaneous_cutoff；一页模板；本地语气分类
- **评审意见：**
  - researcher: Rebuttal limits differ by venue: character caps, URL bans, whether new results are allowed. I'd use a live lint in every round. Ship the lint first and treat LLM rewriting as optional.
  - builder: 字数统计和外链检测很简单，价值立刻可见。语气检查要 LLM，可以后加。AAAI-27 规则目前沿用往年，要标 inherited。
  - skeptic: 和 D01 一样，私有会的审稿原文不应默认发给外部 LLM。

### X07 可转发的政策卡片与社媒素材
排名 #35 · 综合 6.87 · 规模 S · 依赖 X04, R01

- **痛点：** 国内作者主要从微信群、知乎、小红书、公众号获取消息，截图转述丢掉来源和日期，错的版本传得最快；项目只有一个人，没精力专门做内容。
- **做法：** 每条已核实变更或规则卡一键生成素材：中文图片卡（一句话结论、前后对比、官方原文摘句、来源二维码、抓取时间与核实状态、影响谁，不含用户数据）、带链接文字版、公众号周报 diff、B 站脚本。未核实线索不生成卡片。按“决策日日历”排期，在每个真实决策日前 3 天发对应卡片；都标“以官网为准”与核实日期，发现错误在原帖更正并链接修正 PR。
- **例子：** 9/19 ARR 卡：“直博或硕博连读未获硕士者申请人工审核需导师推荐信和 ≥10 条审稿记录；10 月轮 10/12；9/28 起表单自查”附二维码。排期：10/5 ARR commit 还是重投、11/2 ICLR 撤稿会永久公开吗、11/27 AAAI Montréal 签证倒推、12/20 NAACL/COLING 12/23 commit、1/28 ICRA→IROS。
- **数据：** changelog 与规则卡 quote、last_checked；决策日日历；SVG→PNG 模板
- **评审意见：**
  - builder: 做起来简单。风险是错误信息被大量转发，所以只为已核实的变更出卡，并要有更正流程。
  - skeptic: 错误的卡片会被大量转发，只发已核实的内容是对的。

### X08 以原文为起点的贡献、认领与核验治理
排名 #59 · 综合 6.27 · 规模 M · 依赖 R01, W05, W13

- **痛点：** 一个人维护几十个会议必然过时，普通贡献者不知从何下手、怎样算“核实过”；开源数据项目最常见的结局是维护者耗尽。
- **做法：** 贡献从“选中官方原文”开始：Web 标注器打开 snapshots 分支归档页，选中一句生成带 quote、偏移、src 的 YAML 并开 PR。CI 查 schema、quote 在快照中、页面是否过期（年份届次不符即拒）、级联 golden tests。每会两位认领人（最好不同单位）写入 CODEOWNERS，会议页显示认领人与 last checked；规则字段须一位认领人批准且来自不同单位的第二人核验。watcher 发现 404→200 或新博客自动开 issue，首个合格 PR 者署名进该规则。公开“会议×rule_id”覆盖率热力图（已核/继承/未规定/矛盾/缺失），低置信格子自动变 good-first-issue，临近截止超 N 天未复核自动开任务；新 CFP 发布时给认领人逐条核实清单；认领人 6 个月不活跃转“寻找新认领人”。上游优先，资金只用于 CI 与抓取成本，Jev 始终可选。
- **例子：** ICRA 2027 final-paper 页是 2025 残留，引用它的 PR 被过期检测拒绝；IROS 2026 多个“待核”格子做 good-first-issue；CVPR 2027 整行“继承 2026”，提示 11/10 前需有人认领复核；ICML 2027 CFP 发布那天即首发者把 UNVERIFIED 改 verified 的机会。
- **数据：** 归档快照与 Web 标注器；CI 脚本；CODEOWNERS；覆盖率统计；贡献者署名字段
- **评审意见：**
  - builder: Web 标注器本身就是一个项目。早期先用 issue 模板加 CI 引文校验；“两位不同单位认领人”在项目早期不现实。

### X06 11/5 ICLR 审稿夜首发
排名 #70 · 综合 5.58 · 规模 M · 依赖 D04, D05, R06, R01

- **痛点：** 开源项目冷启动最难的是第一次被人需要；一年里同时面对同一决定的人最多的，就是 ICLR 审稿发布那晚。
- **做法：** 首发是一个免登录、纯静态、浏览器内计算的单页“ICLR 2027 审稿出来了：留下，还是转 CVPR 2027”：输入分数不上传，输出分位区间（标“基于终评”）、决定日 11/10、撤稿后果原文、转 CVPR 的格式清单，底部引导导入全部论文。节奏：10/19–25 在机器人与 NLP 群内测；11/3 在知乎、小红书、X 预告；11/5 当晚在知乎相关问题、r/MachineLearning 审稿帖（守版规，只贴工具和原文）、HN Show HN（主打 policy diff + local-first）发布；11/18 后发《ICLR 2027 初评分布》只含汇总。
- **例子：** 11/5 AoE 发布（北京 11/5 晚到 11/6），[6,4,4,2] 得到“势均力敌，决定日 11/10（北京 11/11 19:59）”，并提示被拒论文 12/16 后同样公开，差别只在时间；11/10 前页顶一直挂倒计时。
- **数据：** ICLR 历年 StatsBand；11/5 分数快照（维护者账号限速）；CVPR 2027 规则卡
- **评审意见：**
  - researcher: Good launch moment, but 11/5 is 6 weeks away and it relies on D04 scraping. Launch on the 'stay or switch to CVPR' decision card and the rule diff instead of percentiles.
  - builder: 11/5 这个日期不能挪，只剩 42 天。页面要在没有当届快照时也能用（退回历年终评分段）。Paper Copilot 当晚也会发分布，所以要主打规则和决定日，而不是分位。
  - skeptic: Paper Copilot 在同一时间做同样的事。首发页在作者情绪最激动的那一晚，向陌生用户给"留下还是撤稿"的建议；而分位是基于终评分数的，数据靠个人账号抓取，一旦有偏差就会被大量采用。建议首发改为"规则 + 日期 + 撤稿后果 + 格式清单"，分位只作为可选项，并把区间大幅加宽。

### X05 packages/decide：Jev 分诊层与多判断方交叉校准
排名 #71 · 综合 5.57 · 规模 M

- **痛点：** 政策段落、邮件、审稿条目量大，全交大模型又慢又贵；Jev 这类 System One 模型不会算日期和计数，用错地方会直接产出错误截止或上限；一个人维护时要知道什么时候能信自动分类。
- **做法：** 接口 choose(state, question, options)，后端可换 Jev、自带 key adapter、本地模型。类型层禁止传入 Date/number，lint 拒绝日期、计数、上限、概率、网页数值抽取和任何不可逆动作。适用：政策 diff 是否影响作者（Noul）与规则类别（Choice）、邮件事件类别、审稿条目可修/根本性、自然语言问题→rule_id 路由。政策 diff 由确定性规则、Jev、带 schema 的 LLM（产出 YAML 补丁与逐字引文，CI 校验）三方判断，一致且置信 >0.9 自动开 PR，分歧进人工队列并高亮。门槛 ≥0.9 自动、0.5–0.9 提示、<0.5 交人；自动判定按比例抽样人审，按置信桶统计准确率每月调门槛，某类低于目标退回全人审，准确率公开。只喂变化段防 prompt injection。
- **例子：** AAAI-27 including→excluding：正则、Jev（影响作者 0.97、per_author_cap、放宽）、LLM 三方一致，自动开 PR。ICRA 延期是日期，由代码判断 Jev 不参与。ICLR 9/10 Paper Assistant Tool 公告：Jev 判 FYI、LLM 判 llm_authors 变化，分歧交人工，结论 FYI。有人让 Jev 判断“能否赶上 AISTATS 10/6”，接口拒绝改由 feasible()。
- **数据：** @typesafe-ai/sdk 或替代后端；标注集；本地判定日志；准确率看板
- **评审意见：**
  - researcher: Invisible to users and depends on a closed early-access backend. Keep the interface thin and BYO-LLM first.
  - builder: Jev 还是封闭早期访问，接口要做薄，确保随时能换后端。三方判断一致就自动开 PR 需要标注集，现在做太早。
  - skeptic: Jev 是闭源的早期访问产品，置信度没有经过校准，0.9 的门槛要先用自己的标注集测过。自动开出的 PR 仍然必须人工合并。
