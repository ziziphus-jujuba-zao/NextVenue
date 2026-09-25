# 热门主题脚本（`dblp_topics.py`）

生成 `data/topics/<series>-<year>.json`：某一届录用论文里，按**录用篇数**排的前 15 个主题（App 只显示前 10 个），以及 `data/topics/taxonomy.json`（关键词表）。页面怎么用这些数字见 `docs/MOBILE_SPEC.md` 第 11.4.2 节，字段见 `docs/DATA_GUIDE.md` 第 8 节。

- **只用 Python 3 标准库**，不装任何包。
- **CI 不跑它。** CI 只用 `pnpm validate` 校验它写出的 JSON（`schema/topics.schema.json`，外加排序、占比、覆盖率、和 `data/stats/` 里官方录用数一致等检查）。
- **数据来源**：dblp 的 SPARQL 接口 `https://sparql.dblp.org/sparql`，每个论文集一次查询。dblp 的元数据是 CC0 1.0（见仓库根目录 `NOTICE`）。
- **只数录用的论文**：dblp 里没有被拒的论文，所以这里算不出、也不写任何录用率；schema 不允许录用率字段。
- **方法**（v0.1.0）：只看标题；52 个主题，每个主题一组英文正则；一篇论文可以算进几个主题，所以各主题占比加起来超过 100%。`robustness`（鲁棒性）和 `benchmark`（基准评测）抽查时误配较多，标 `low_precision`，App 在这两行后加"*"。
- **礼貌**：请求之间至少隔 2 秒，遵守 429/503 和 `Retry-After`；不绕过 dblp 网站的机器人检查；响应缓存在 `scripts/topics/.cache/`（不进仓库）。

## 用法（在仓库根目录）

```bash
python3 scripts/topics/dblp_topics.py                     # 全部届次；只抓缓存里没有的
python3 scripts/topics/dblp_topics.py --offline           # 只用缓存
python3 scripts/topics/dblp_topics.py --offline --check   # 重算一遍，和 data/topics 比较，不写文件
python3 scripts/topics/dblp_topics.py --edition cvpr-2025 # 打印一届
python3 scripts/topics/dblp_topics.py --qa                # 另把 n-gram 短语等核对用的数据写进缓存目录
pnpm validate                                              # 然后校验
```

## 加一届

1. 先确认 dblp 已经收全：`papers_used / 官方录用数` 要在 0.98 到 1.02 之间，否则脚本拒绝写出。ICLR 2026、CVPR 2026 目前还没收全（2026-09-25：257 / 5,357、1,397 / 4,090）。
2. 在 `data/stats/<series>.yml` 里要有这一年的主会录用数（`official_accepted` 必须和那一行的 `accepted`、`source_url`、`quote`、`src` 一模一样，`pnpm validate` 会查）。
3. 在脚本的 `EDITIONS` 里加一项，跑脚本，跑 `pnpm validate`。

改了关键词表（`TOPICS`）就要升 `METHOD_VERSION`，并重新生成所有届次，让同一个会的前后两年用的是同一版方法。
