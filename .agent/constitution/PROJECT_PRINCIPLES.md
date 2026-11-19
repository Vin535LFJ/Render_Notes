---
doc_id: GOV-PRINCIPLES
type: standard
status: approved
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 项目原则（Project Principles）

> L1 权威文档 · type: standard · status: approved（2026-11-19 用户提案并裁决）· owner: human
> 本文件是 `.agent/constitution/` 的首要原则；AGENT_RULES / DOCUMENTATION_POLICY / HUMAN_APPROVAL_POLICY 的制定依据。

1. **单一事实源**：每类信息只有一个权威位置——知识→`01–07/`；断言→`evidence/`；概念→`knowledge-model/`；课程→`tools/course.json` + `courses/`；智能体文档→`.agent/`；审核材料→`reviews/`。其他位置只允许索引与跳转，**不允许复制正文**。
2. **人工关卡不可自批**：G1/G2/G3、重要治理决策、claim 状态升级、KCR 变更提案，均由人批准。AI 只准备材料与前置条件，不宣布通过、不自填评分与结论栏。
3. **确定性验证优先**：能写成脚本的检查不写成口述要求（`build_site` / `validate_site` / `check_chapter_arc` / `review_gate` / `build_document_registry`）。结构全绿 ≠ 语义达标，语义把关靠人工审核。
4. **增量不重建**：一次一篇、一次一项；新文档先行，存量文档随触碰渐进补齐；不批量重生成、不机械拆分历史、不预建空目录。
5. **真实留痕**：执行结果写入 `CHANGELOG.md` / `WORKFLOW_STATE.md` / `DECISIONS.md`（或 ADR）；实测数字如实记录；不伪造构建、不声称未做的完成。
6. **生成物与源分离**：`web/content.js`、`site-vitepress/docs/`、`.agent/indexes/document-registry.json` 是生成物；改源后重新生成，生成物不手改、不把生成物当源引用。
7. **最小文件**：不预建未使用的技能与目录，不创建"以后可能有用"的文件。
8. **审核与执行隔离**：审核材料（G1/G2/G3、KCR 提案）与执行产物分目录；AI 产出的审核材料留空人工结论栏。
