---
doc_id: GOV-REGISTRY-INDEX
type: standard
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# indexes/ — 注册表与索引

## document-registry.json（文档注册表）

- **性质**：生成物（AGENT_RULES 规则四）。事实源 = 各文档 frontmatter（schema 见 `.agent/standards/documentation-types.md` §3）。
- **生成器**：`py -3 tools/build_document_registry.py` → 本文件目录。
- **何时再生成**：任何文档 frontmatter 变更后（新增 / 状态迁移 / owner 变更）；P8 评估并入 validate 门禁与 build 流程。
- **Agent 用法**：判断"哪篇文档当前有效"——**先查注册表，再读文件**；不以遍历仓库为准。`unregistered` = 存量无 frontmatter 文档（渐进补齐，不批量回填）。

## schema

- `document-registry.schema.json`：注册表 JSON Schema（draft-07）。

## 设计原则

- 注册表不手写、不手维护（防漂移——手维护注册表本身会过期，实证：2026-11-19 清理的 3 处过期计划引用）。
- frontmatter 缺字段时，注册表如实标记 `frontmatter_present: false` + 启发式 `type`（`type_source: heuristic`），不伪造。
