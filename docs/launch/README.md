# 发布文案草稿

这个目录里的文件是发布文案草稿，由 agent 根据 `data/rules/` 和 `data/editions/` 起草，未经发布：维护者需要逐条对照规则卡和官网原文审阅，删除文件开头的草稿注释，补上规则卡页面链接，再按 [ROADMAP §8](../ROADMAP.md) 的节奏和渠道纪律手动发布。发布前请重跑 `pnpm check:quotes`，确认所引规则卡没有变动；如果规则卡在发布前更新了（例如 CVPR 2027 作者指南上线），应以卡片为准改稿，而不是反过来改卡片。目前的草稿：`v0.0-zhihu.md`，9/30 v0.0 的知乎回答；`2026-10-open-source-xiaohongshu.md` 和 `2026-10-open-source-x.md`，10 月开源发布的小红书帖和 X thread（配图在本地 `dist/launch/2026-10-open-source/`）。
