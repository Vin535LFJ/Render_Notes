---
doc_id: ADR-0001
type: adr
status: active
owner: human
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# ADR-0001：采纳多智能体文档治理架构

- **Status**: accepted
- **Date**: 2026-11-19
- **Deciders**: human（用户提案并裁决四项执行口径）
- **Related**: DECISIONS.md D13（KCR）/ D14（.agent 统一仓库）/ D15（本次裁决记录）

## Context

- 项目已从静态知识库演变为持续产生新知识、新报告、新教材的多智能体系统（D13 背景）。
- 已发生实证故障：外来 agent 计划文件污染知识 bundle（A3）、另一 agent 重建 content.js 致 drift、3 处过期计划引用残留（2026-11-19 清理）。D14 统一了文档位置，但缺少协作规则、决策记录格式、文档状态与注册表。
- 用户 2026-11-19 提出 Multi-Agent Documentation Governance 架构提案（OpenSpec 思想 / MADR / KCR / Run Logs / Human Gates / L1-L3 三级治理 / 文档注册表）。

## Decision

在 D14 统一仓库基础上**增量**落地治理架构（不改变 D14 目录归属）：

1. **宪法** `.agent/constitution/`：PROJECT_PRINCIPLES / AGENT_RULES（写所有权五规则）/ DOCUMENTATION_POLICY / HUMAN_APPROVAL_POLICY。
2. **MADR** `.agent/decisions/`：重要新决策独立成 ADR；`DECISIONS.md` 保留为历史索引，不机械拆分。
3. **文档政策**：类型 × 生命周期表、L1/L2/L3 三级治理、状态机 `draft→…→archived`、frontmatter 为事实源。
4. **注册表**：`.agent/indexes/document-registry.json` 由 `tools/build_document_registry.py` 从 frontmatter 生成（生成物，非手写源）。
5. **轻量变更流程** `.agent/changes/`：借鉴 OpenSpec 思想自研（proposal→tasks→archive），不引入外部框架。
6. **全客户端适配入口**：根 `CLAUDE.md` / `AGENTS.md`、`.cursor/rules/`、`.github/copilot-instructions.md`、`.gemini/GEMINI.md`、既有 Workbuddy stub——**只负责发现与跳转，不复制正文**。
7. **增量纪律**：不预建空技能目录（首次使用时创建）；存量文档不批量打状态（渐进补齐）；Run Logs 本地化（gitignore）按保留策略归档。

## Alternatives considered

- 完整采用 OpenSpec 框架：拒绝——外部框架依赖，与本项目"确定性门禁 + 不重建"纪律不符。
- 手维护 document-registry.json：拒绝——注册表本身会过期（刚清理的 3 处过期引用即实证）。
- 一次性重构全部存量文档状态：拒绝——违反增量原则，重蹈"批量生成"覆辙。
- 改变 D14 目录归属：拒绝——D14 刚确立，不 churn。

## Consequences

- 正面：单一事实源 + 写入所有权降低多 agent 冲突；跨客户端发现一致；"哪篇文档有效"可程序化查询。
- 负面：frontmatter 纪律增加写入成本；注册表需随 frontmatter 再生成；新 Agent 有阅读负担（以读取顺序规则缓解）。
- 中性：`DECISIONS.md` 不再新增决策条目正文（重要决策入 ADR，历史保持原样）。

## Compliance

- 遵循：`.agent/constitution/AGENT_RULES.md`、`DOCUMENTATION_POLICY.md`
- 后续：validate_site 注册表一致性门禁（P8 评估）；KCR 工具集成（P8）；存量文档 frontmatter 渐进补齐。
