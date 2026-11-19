---
doc_id: ADP-COPILOT
type: adapter
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# Render_Notes — GitHub Copilot 适配入口

> 指针文件（D15 / ADR-0001）：只负责发现与跳转，**不复制智能体文档正文**。正文统一在 `.agent/`。

- **先读**：`.agent/README.md`（统一索引与读取规则）
- **协作规则**：`.agent/constitution/AGENT_RULES.md`（写所有权五规则）
- **文档政策**：`.agent/constitution/DOCUMENTATION_POLICY.md`
- **文档有效性**：先查 `.agent/indexes/document-registry.json`
- **人工关卡**：`reviews/DECISION_REQUIRED.md`（未答复不视为同意）
- **决策**：`DECISIONS.md`（历史索引）+ `.agent/decisions/`（MADR）
