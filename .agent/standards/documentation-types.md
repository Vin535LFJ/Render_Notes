---
doc_id: GOV-DOC-TYPES
type: standard
status: approved
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 文档类型与状态标准（Documentation Types Standard）

> L1 权威 · type: standard · status: approved（2026-11-19，ADR-0001 配套）
> 本文件是 `.agent/constitution/DOCUMENTATION_POLICY.md` 的**格式层规范**（normative）：policy 讲规则，standard 讲枚举与 schema。

## 1. type 枚举

| 值 | 含义 | 默认位置 |
|---|---|---|
| `knowledge` | 知识文档（主文档 / lesson / curriculum） | `00–07/`、`courses/` |
| `research-report` | 研究报告 | `.agent/plans/` 或课程研究目录 |
| `change-proposal` | 变更提案（OpenSpec-lite） | `.agent/changes/<id>/` |
| `adr` | 架构决策记录（MADR） | `.agent/decisions/` |
| `kcr` | 知识变更审核材料 | `reviews/`（KCR 专用） |
| `agent-plan` | Agent 执行计划 | `.agent/plans/` |
| `run-log` | 执行日志 | `.agent/runs/`（本地）→ `archive/` |
| `skill` | 技能文档 | `.agent/skills/` |
| `project-state` | 项目状态 / 进度 / 计划索引 | 根治理文档（WORKFLOW_STATE 等） |
| `standard` | 规范 / 宪法 | `.agent/constitution/`、`.agent/standards/` |
| `template` | 模板 | `.agent/templates/` |
| `adapter` | 客户端适配入口（指针） | 根 `CLAUDE.md`/`AGENTS.md`、`.cursor/`、`.github/`、`.gemini/`、`.workbuddy-ai` stub |
| `review-material` | 人工审核材料 | `reviews/` |
| `data-config` | 数据 / 配置说明 | `.agent/indexes/` 等 |

## 2. status 枚举与转移

`draft → proposed → under_review → approved → active → superseded → archived`

- ADR：`proposed → accepted | rejected → superseded`（accepted 后视同 active）。
- run-log：创建即 active，归档即 archived。
- `unregistered`：**存量无 frontmatter 文档的注册表默认状态**——不视同有效也不视同无效，查询方需人工确认；随文档被触碰渐进补齐 frontmatter。

## 3. frontmatter 字段规范（注册表事实源）

| 字段 | 必填 | 说明 |
|---|---|---|
| `type` | ✓ | §1 枚举值 |
| `status` | ✓ | §2 枚举值 |
| `owner` | ✓ | `human` / `qwenwork` / `<agent-id>` |
| `updated` | ✓ | YYYY-MM-DD |
| `doc_id` | 可选 | 唯一 ID；缺省由注册表生成器从路径派生 |
| `created` | 可选 | YYYY-MM-DD |
| `supersedes` | 可选 | 被本文件替代的 doc_id 列表 |
| `related_adr` | 可选 | 如 `ADR-0001` |
| `related_task` | 可选 | 任务 / 变更包 ID |
| `generated` | 可选 | 生成物标记（默认 false） |

## 4. level 派生规则（注册表生成器用）

- **L3**：`status ∈ {superseded, archived}` 或路径在 `archive/`
- **L2**：`status ∈ {draft, proposed, under_review}` 或路径在 `reviews/`、`.agent/changes/`（未归档）、`.agent/plans/`
- **L1**：`status ∈ {approved, active}`
- `unregistered` → `unclassified`

## 5. 示例

```yaml
---
doc_id: DOC-007
type: knowledge
status: active
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---
```

```yaml
---
type: change-proposal
status: proposed
owner: qwenwork
updated: 2026-11-19
related_task: CHG-0001
generated: false
---
```
