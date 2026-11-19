---
doc_id: GOV-MADR-INDEX
type: standard
status: active
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# decisions/ — MADR 架构决策记录

> 风格：MADR（Markdown Any Decision Record）。一份长期决策一个文件，`NNNN-简短标题.md`，编号递增。

## 与 DECISIONS.md 的关系

- 仓库根 `DECISIONS.md` 保留为**历史决策索引**（D01–D14），不机械拆分、不改写历史文本。
- **重要新决策**（长期影响的技术 / 架构 / 治理 / 产品决策）独立为本目录下的 ADR 文件，并在下方索引登记。
- 一般实现任务写 Change Proposal（`.agent/changes/`），**不进本目录**——不要每完成一个小任务就创建一个 ADR。

## ADR 状态机

`proposed → accepted | rejected → superseded`

## 索引

| ADR | 标题 | 状态 | 日期 |
|---|---|---|---|
| [ADR-0001](0001-adopt-documentation-governance.md) | 采纳多智能体文档治理架构 | accepted | 2026-11-19 |

## 模板

新建 ADR 复制 [`adr-template.md`](adr-template.md)。
