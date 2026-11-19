---
doc_id: GOV-CHANGES-FLOW
type: standard
status: active
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# changes/ — 轻量变更流程（借鉴 OpenSpec 思想，自研实现）

> 决策依据：ADR-0001（不引入外部框架，复用 KCR 影响分析）。
> 一个变更一个目录：`.agent/changes/<change-id>/`。

## 流程

`proposal → tasks → 执行 → 验收（门禁 + 人工）→ 归档`

1. **提案**：`<change-id>/proposal.md`（模板：`.agent/templates/change-proposal.md`），状态 `proposed`。
2. **任务**：提案批准后建 `tasks.md`（执行任务清单，勾选留痕），状态 `under_review` → `approved`。
3. **执行**：Owner Agent 按授权范围写入（AGENT_RULES 规则一/二/三）；过全部门禁。
4. **知识影响**：走 KCR（`reviews/KNOWLEDGE_CHANGE_REVIEW.md`）——影响分析 → 变更提案 → 人工审核 → 增量更新。
5. **治理影响**：同时登记 ADR（`.agent/decisions/`）。
6. **关闭**：整目录移 `.agent/changes/archive/`，状态 `archived`（L3）。

## 规则

- 变更包是 **L2 工作文档**；关闭归档后为 L3。
- 不建空变更包；提案批准后才建 `tasks.md`。
- 与 ADR 分工：变更提案记录"**这次准备改变什么**"，ADR 记录"**为什么作长期决策**"。
- 与 KCR 分工：变更提案管"改变的范围与验收"，KCR 管"新知识对已有知识体系的影响链"。

## 目录

| 变更包 | 状态 | 说明 |
|---|---|---|
| `CHG-0001-four-project-expansion/` | proposed | 2026-11-19 四项目并进启动（P1 P7 修复 / P2 设计 Skill / P3+P4 本地新项目） |

## 归档

`.agent/changes/archive/`（关闭后的变更包整体移入，保留留痕）。
