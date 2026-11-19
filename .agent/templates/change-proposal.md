---
doc_id: TPL-CHANGE-PROPOSAL
type: template
status: active
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 变更提案（Change Proposal）

> 位置：`.agent/changes/<change-id>/proposal.md` · 流程：`.agent/changes/README.md`
> 状态：`draft → proposed → under_review → approved（执行）→ archived（关闭）`

## 元信息

- **change-id**：CHG-0000
- **提出日期** / **owner** / **状态**
- **关联 ADR** / **关联 KCR**（知识影响时必填）

## 1. 背景与问题（证据）

什么问题、什么实证（事故 / 门禁输出 / 诊断行号）。

## 2. 提案（准备改变什么）

改变内容 + 范围边界（改什么 / 不改什么）。

## 3. 影响分析

- **KCR 链**（知识影响时）：Source → Claim → Concept → Lesson → Quiz → Course
- **文档影响**：受影响文档清单（doc_id / 路径）
- **工具 / 门禁影响**：tools/、validate 检查项、build 排除列表
- **风险**：生成物污染、路径失效、多 agent 写冲突

## 4. 替代方案与取舍

## 5. 验收条件

确定性门禁实测（build / validate / arc / review_gate / registry 再生成）+ 人工验收标准。

## 6. 人工裁决栏（AI 不填）

- [ ] 批准 · [ ] 驳回 · [ ] 补充研究 · [ ] 修改范围 · [ ] 暂缓
- 裁决记录：`DECISIONS.md` D## / ADR-____
