---
doc_id: GOV-AGENT-RULES
type: standard
status: approved
owner: human
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# Agent 协作规则（Agent Rules）

> L1 权威文档 · type: standard · status: approved（2026-11-19）· owner: human
> 所有智能体（无论客户端）必读。各客户端适配入口只负责跳转到本文件，不复制正文。

## 规则一：一个任务，一个主要写入者
可以并行研究，但同一组文件只能由一个 Agent 负责整合写入。多 Agent 同时改写 `tools/course.json`、`evidence/claim-ledger.json`、`README.md` 等共享文件是高风险操作（本项目已发生 content.js 重建漂移事故）。

## 规则二：默认只读，写入必须有任务授权
每个任务定义须包含：**Owner Agent / 允许读取 / 允许修改 / 禁止修改 / 预期输出 / 验收条件**。无任务授权的文件操作视为违规。

## 规则三：重要任务使用独立 Git Worktree 或分支
涉及共享源文件（course.json / claim-ledger.json / 概念模型 / README / 宪法）时，在独立 worktree 或分支操作，合并前过全部门禁。

## 规则四：生成物不是源文件

| 源文件 | 生成物 |
|---|---|
| `tools/course.json` | 网页课程导航 |
| `tools/glossary.json` | 术语卡片 |
| `knowledge-model/concepts.json` | 知识图谱展示 |
| Markdown 知识文档 | `web/content.js` |
| `tools/build_vitepress_content.py` 及其源 | `site-vitepress/docs/` |
| 各文档 frontmatter | `.agent/indexes/document-registry.json` |

生成物不手改、不提交手工编辑（改源重新生成即可）。

## 规则五：任务完成必须交接
交接内容：实际修改文件清单 / 测试结果（门禁命令 + 实测输出）/ 遗留问题 / 下一步建议 / 任务状态更新。使用 `.agent/templates/agent-handoff.md`。

## 读取顺序（所有 Agent）
1. `.agent/README.md`（总索引）
2. `.agent/constitution/`（本规则 + 原则 + 文档政策 + 审批政策）
3. 按索引或 `.agent/indexes/document-registry.json` 定位权威文档——**先查注册表判断有效性，不以遍历仓库猜测为准**。

## 禁区
`.workbuddy-ai/memory/**`（宿主记忆）· `archive/**`（只读）· `web/vendor/**` · `web/index.html` · 两份旧方案文档 · 外来未跟踪产物（不碰、不纳入提交，先裁决）。

## 适配入口
根目录 `CLAUDE.md` / `AGENTS.md`、`.cursor/rules/`、`.github/copilot-instructions.md`、`.gemini/GEMINI.md`、`.workbuddy-ai/` stub 均为**指针**：只负责发现与跳转，不复制正文。
