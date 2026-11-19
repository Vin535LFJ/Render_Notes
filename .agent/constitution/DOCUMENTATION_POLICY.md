---
doc_id: GOV-DOC-POLICY
type: standard
status: approved
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 文档政策（Documentation Policy）

> L1 权威文档 · type: standard · status: approved（2026-11-19）· owner: human
> 规范 schema 与枚举定义见 `.agent/standards/documentation-types.md`（本文件讲规则，standard 讲格式）。

## 1. 文档类型与生命周期

| 类型 | 解决什么问题 | 生命周期 | 仓库实例 |
|---|---|---|---|
| ADR | 为什么作出这个长期决策？ | 长期保留 | `.agent/decisions/NNNN-*.md` |
| Change Proposal | 这次准备改变什么？ | 提出到归档 | `.agent/changes/<id>/` |
| Research Report | 研究得到了什么？ | 长期保存，可更新 | 研究产出（归 `.agent/plans/` 或课程研究目录） |
| KCR | 新知识会影响哪些已有内容？ | 审核到闭环 | `reviews/KNOWLEDGE_CHANGE_REVIEW.md` |
| Agent Plan | 当前 Agent 准备怎么做？ | 任务完成后归档 | `.agent/plans/` |
| Run Log | 实际执行了什么？ | 按保留策略归档 | `.agent/runs/`（本地，gitignore）→ `archive/` |
| Skill | Agent 应该如何执行一类任务？ | 持续迭代 | `.agent/skills/` |
| Project State | 当前真实进度是什么？ | 始终维护 | `WORKFLOW_STATE.md` |

**ADR 纪律**：ADR 只用于有长期影响的技术、架构、治理或产品决策；一般实现任务写 Change Proposal，不建 ADR。

## 2. 三级治理

- **L1 权威文档（Canonical）**：当前真正有效的知识、规范、课程、决策与配置。`01–07/`、`evidence/`、`knowledge-model/`、`courses/` 元数据、`tools/`、`web/` 源、`.agent/constitution/`、已 accepted 的 ADR、active 的标准与技能。
- **L2 工作文档（Active Work）**：正在研究、讨论、实施或等待人工批准。`reviews/` 待审材料、`.agent/changes/` 进行中变更包、`.agent/plans/` 未归档计划、被重写的教材（P7 各课）。
- **L3 历史文档（Archive）**：过期计划、旧报告、被取代文档、执行日志。`archive/`、`.agent/plans/` 已归档、status=superseded/archived 的文档。

## 3. 状态机

`draft → proposed → under_review → approved → active → superseded → archived`

- 不是所有文档走全部状态（ADR 可直接 proposed；run log 无 approved）。
- `status` 写在 frontmatter；**缺 frontmatter 的存量文档注册表状态为 `unregistered`**——渐进补齐，不批量回填。

## 4. frontmatter 为事实源

```yaml
---
doc_id: DOC-007            # 可选；缺省由路径派生
type: knowledge|standard|adr|change-proposal|kcr|agent-plan|run-log|skill|project-state|template|adapter|review-material|research-report|data-config
status: draft|proposed|under_review|approved|active|superseded|archived
owner: human|qwenwork|<agent-id>
created: 2026-11-19
updated: 2026-11-19
supersedes: []             # 被本文件替代的 doc_id
related_adr: []            # 如 ADR-0001
related_task: ""           # 任务 / 变更包 ID
generated: false           # 生成物标记
---
```

## 5. 注册表（防漂移机制）

- 事实源 = 各文档 frontmatter；注册表 = 生成物。
- 生成：`py -3 tools/build_document_registry.py` → `.agent/indexes/document-registry.json`。
- Agent 判断文档有效性：**先查注册表，再读文件**；不以遍历仓库为准。
- 一致性门禁（validate_site 接入）随 P8 评估；当前再生成为手动。

## 6. 归档与保留

- Run logs：本地 `.agent/runs/`（gitignore），按保留策略将摘要归档到 `archive/`。
- ADR / 标准 / 宪法：长期保留于 `.agent/`。
- 变更包：关闭后整体移 `.agent/changes/archive/`。
- 注册表覆盖 `.md` 文档；JSON 数据层（evidence / knowledge-model / course）各有自己的 schema 与注册机制，不并入本文档注册表。
