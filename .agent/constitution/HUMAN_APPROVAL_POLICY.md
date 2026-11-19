---
doc_id: GOV-HUMAN-APPROVAL
type: standard
status: approved
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 人工审批政策（Human Approval Policy）

> L1 权威文档 · type: standard · status: approved（2026-11-19）· owner: human

## 原则

1. **AI 不自批**：任何人工关卡（G1/G2/G3、ADR 采纳、变更提案批准、claim 状态升级、KCR 变更）的结论栏由人填写；AI 只准备材料与确定性前置条件。
2. **未答复不视为同意**：裁决清单未回复项保持待审核，不执行、不视为同意。
3. **一次性授权不延伸**：commit / push / 本地构建 / 在线发布等授权各自独立，不默认延续（D09/D11.9 模式）。
4. **裁决留痕**：裁决记录入 `DECISIONS.md`（历史索引）或 `.agent/decisions/`（MADR），执行结果写入 `CHANGELOG.md` 与 `WORKFLOW_STATE.md`。

## 关卡

| 关卡 | 时机 | 材料 |
|---|---|---|
| G1 研究范围审核 | P1 证据层种子确定后 | `reviews/G1-evidence-review.md` |
| G2 课程大纲审核（最重要） | `curriculum.md` 完成后 | `reviews/G2-curriculum-review.md` |
| G3 最终发布审核 | P5；本计划不发布 | `reviews/G3-release-readiness.md` |
| 治理决策 | 架构 / 规范 / 路线变更 | ADR + `reviews/DECISION_REQUIRED.md` |
| 知识变更（KCR） | 新研究 / 新报告进入知识库 | KCR 变更提案（`reviews/KNOWLEDGE_CHANGE_REVIEW.md`） |

## 裁决选项

批准 · 驳回 · 补充研究 · 修改范围 · 暂缓。

## 当前待裁决（示例登记，动态见 reviews/DECISION_REQUIRED.md）

B4（L01 阅读认可）· B7/B8（V13/V14 升级）· B10（L13 断言登记）· B12（stash）· B15（研究立项）。
