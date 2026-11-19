---
doc_id: CHG-0001-TASKS
type: agent-plan
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: []
---

# CHG-0001 · 执行任务清单

> 对应 `proposal.md`。勾选留痕；全部完成后整目录移 `.agent/changes/archive/`。
> 2026-11-19 复核：上半部分为上一会话四项目拓展（已完成项据实测勾选）；下半部分为融合基线增量补齐（新架构文档作缺陷清单+规格增量）。

## P1 · Render_Notes 剩余 P7（本仓库，增量修改）— 上一会话

- [x] A2 审计 gap 闭合状态（L02 已闭合；L13/L06/L11 未闭合；基线门禁 11/0/0 · arc 5/5）
- [x] B1 L13：登记 4 条 open 断言 V17–V20 + quiz Q1/Q2/Q3 重挂接 + 正文 Y-flip/透视除法修正
- [x] B2 L06：两层 objectives 对齐 + §7.3→§7.2/§7.4 + 色彩出处改 `色彩管理与采样滤波.md` + 补 P02 声明
- [x] B3 L11：FBO≠VkRenderPass 桥梁修正 + 乱码"由谁 inserted"四处同步
- [x] B4 L02：核对 V15/V16 挂接（已闭合，仅验证未改内容）
- [ ] B5 G-D6/D7：按学习路径补空 claim_ids / 无断言课挂接 —— **仍未做**，待人工裁决后推进（不擅改断言挂接）
- [ ] B6 Practice：quiz 覆盖 objectives、labs.json tasks/selfTest 观察点 —— **仍未做**，待 P7.2 逐篇深化
- [x] B7 门禁：build → validate(0 FAIL/0 WARN) → arc 5/5 → review_gate（只读）；G1/G2 材料备、未自批

## P2 · learning-experience-design Skill（本仓库）— 上一会话 + 本轮增量

- [x] C1 上游调研（Impeccable Apache-2.0 / Hallmark MIT，只读）
- [x] C2 现有站点调研
- [x] C3 创建 `.agent/skills/learning-experience-design/`（SKILL.md + 8 references + 3 assets + scripts + preview）
- [x] C4 试点页面规格/原型 `preview/PILOT-L13-plan.md`（不改线上站点，方向待确认）
- [x] C5 索引登记 + 三脚本排除列表 + registry 重生成 + 门禁
- [x] C6 本轮增量：新增 5 篇 references（learning-ux-principles / learning-interaction-patterns / visual-system-and-layout / accessibility-and-responsive / ux-review-checklist），旧 8 篇保留，SKILL.md 双索引

## P3 · agent-workspace-governance（新本地目录，不碰 git/GitHub）— 上一会话 + 本轮增量

- [x] D1 README / AGENTS / constitution 四件套
- [x] D2 schemas 五份 JSON Schema
- [x] D3 templates 六份
- [x] D4 skills 占位 + adapters 五端
- [x] D5 CLI 九个命令（Python 标准库）
- [x] D6 tests（unittest 全绿，11 passing）
- [x] D7 examples 两个迁移样例（Render_Notes / 普通项目）
- [x] D8 本轮增量：13 类文档类型枚举 + Task Claim/Single Writer/dependency frontier 协议 + CLI `doctor`/`index`；tests 11→25 全绿；目录名不变

## P4 · github-project-radar（新本地目录，不碰 git/GitHub/API）— 上一会话 + 本轮增量

- [x] E1 项目骨架 + 主题配置外置
- [x] E2 SQLite 快照模型 + 注入式采集器 + 离线 fixture
- [x] E3 增长计算（24h/7d/30d，历史不足标注）
- [x] E4 可配置评分 + 周报七板块 + 深度研究模板
- [x] E5 人工状态机 + Engine 导出接口
- [x] E6 tests（unittest 全绿，17 passing）
- [x] E7 本轮增量：三维独立评分 + 生命周期别名 + `human_selected_for_research` flag + 溯源字段 + `YYYY-WW` 报告 + `radar/sources/` stub（零网络）+ research 新路径；tests 17→38 全绿；目录名不变

## G · 融合基线增量（本轮，新架构文档 = 缺陷清单 + 规格增量）

- [x] G1 发布边界：reviews/ 排除（publish_boundary + allowlist + 11 测试），85→77 文档，archive 不动
- [x] G2 状态漂移：早期表改指针行（B13/B14 已裁决）+ PROJECT_CURRENT_STATE 增量校正块
- [x] G3 裁决材料包：`reviews/decision-kit/` 七项 + 空白裁决栏 + B12 只读 stash diff；不代批
- [x] G4 P8/P9 只读基础：`tools/kcr_impact.py`（只读影响链）+ KCR 工具说明 + P9 设计文档（draft）
- [x] G5 全量门禁 + 状态文档增量追加 + 交接

## F · 收尾

- [x] F1 四项目门禁/测试汇总（validate 11/0/0 · arc 5/5 · boundary 11 · governance 25 · radar 38）
- [x] F2 状态文档增量追加（CHANGELOG / WORKFLOW_STATE / REVIEW_STATUS / tasks.md / handoff）
- [x] F3 交接文档 + 待裁决清单 + 下一续跑点
