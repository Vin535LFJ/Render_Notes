---
doc_id: GOV-AGENT-INDEX
type: project-state
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# .agent — 统一智能体文档仓库

> 建立：2026-11-19（D14 统一仓库；D15 / ADR-0001 治理基座）。本目录是 Render_Notes 的**公共智能体文档仓库**，随仓库入 git、同步到 GitHub。任何智能体（QwenWork/Workbuddy、zcode、Claude Code、Codex、Cursor、Copilot、Gemini 等）切换时，只读这里即可拿到全部智能体文档。

## 1. 为什么存在

项目已从静态知识库演变为持续产生新知识、新报告、新教材的多智能体系统。过去每个工具/智能体在自己的隐藏文件夹（`.workbuddy-ai/`、`.zcode/`）里建文档，导致：切换智能体时找不到别人的文档、重复创建、不知道别人文件夹怎么工作，甚至发生外来计划污染知识 bundle、生成物漂移、过期引用残留等事故。本目录把**智能体文档**统一收口为一处；各智能体私有文件夹只做索引。

## 2. 目录结构

| 分区 | 内容 | 级别 |
|---|---|---|
| `constitution/` | 宪法：PROJECT_PRINCIPLES / AGENT_RULES / DOCUMENTATION_POLICY / HUMAN_APPROVAL_POLICY | L1 |
| `decisions/` | MADR 架构决策（ADR-0001 起；`DECISIONS.md` 为历史索引） | L1 |
| `standards/` | 规范（文档类型与状态机等） | L1 |
| `skills/` | 技能文档（首次使用时创建，不预建空目录） | L1/L2 |
| `templates/` | 模板（change-proposal / agent-handoff） | L1 |
| `changes/` | 轻量变更包（proposal→tasks→archive，借鉴 OpenSpec 思想自研） | L2→L3 |
| `plans/` | Agent 计划归档（含外来计划，索引注明出处） | L2→L3 |
| `indexes/` | 文档注册表（生成物）+ schema | — |
| `runs/` | 执行日志（**本地 gitignore，不入 git**；按保留策略归档摘要到 `archive/`） | L3 |

## 3. 读取规则（所有智能体必读）

1. **进入项目先读本 README**，再读 `constitution/`（原则 / Agent 规则 / 文档政策 / 审批政策）。
2. 判断文档有效性：**先查 `indexes/document-registry.json`**（由 frontmatter 生成），再读文件；不以遍历仓库猜测为准。
3. 需要技能/计划/规范文档 → 按 §6 索引或注册表定位；**不在自己文件夹重建副本**。
4. 可执行脚本是技能契约的一部分，**不迁移**（如 `check_chapter_arc.py` 留在 `.workbuddy-ai/skills/research-to-learning/scripts/`，门禁命令路径不变）。
5. 文档缺失、过时或结构变更 → 走 KCR（`reviews/KNOWLEDGE_CHANGE_REVIEW.md`）或变更包（`changes/`），**不私自改结构**。
6. 智能体私有运行时状态（如宿主记忆）**不属于文档**，不迁入本目录。

## 4. 索引 stub 与适配入口规则

- 智能体私有文件夹（如 `.workbuddy-ai/`）只保留：① README 索引（指向本目录）；② 宿主发现入口 stub（如 `SKILL.md`，保留 frontmatter 维持发现，正文指向本目录）；③ 可执行脚本。stub 必须明确指向 `.agent/` 正文，**不得复制正文**。
- 各客户端适配入口（根 `CLAUDE.md` / `AGENTS.md`、`.cursor/rules/`、`.github/copilot-instructions.md`、`.gemini/GEMINI.md`）**只负责发现与跳转**，不复制正文。

## 5. 写入规则

- 新文档按类型放入 §2 分区；在 §6 索引登记（名称 / 位置 / 来源 / 日期）。
- 新文档或改动文档带 frontmatter（`type` / `status` / `owner` / `updated`，schema 见 `standards/documentation-types.md`），然后再运行 `py -3 tools/build_document_registry.py` 再生成注册表。
- 归档外来文档保留原名，索引注明来源智能体与原路径。
- 结构调整（新增分区 / 迁移 / 废弃）必须记录 `DECISIONS.md` 或 `.agent/decisions/` ADR。
- 写所有权：同一组文件一个任务一个主要写入者（`constitution/AGENT_RULES.md`）。

## 6. 索引

| 文档 | 位置 | 来源 / 备注 |
|---|---|---|
| 宪法四件套 | `constitution/` | 2026-11-19 建立（D15/ADR-0001） |
| ADR-0001 采纳治理架构 | `decisions/0001-adopt-documentation-governance.md` | MADR 首份；`decisions/README.md` 为索引 |
| 文档类型与状态标准 | `standards/documentation-types.md` | type/status 枚举 + frontmatter schema + level 派生 |
| 模板 | `templates/` | change-proposal / agent-handoff + 通用模板库（decision-ticket / human-questionnaire / doc-audit / research-brief / lesson-design-brief，见 `templates/README.md`） |
| 轻量变更流程 | `changes/README.md` | 借鉴 OpenSpec 思想自研；关闭后移 `changes/archive/` |
| 文档注册表 | `indexes/document-registry.json`（生成物）+ `document-registry.schema.json` | `tools/build_document_registry.py` 生成，不手改 |
| research-to-learning 技能文档 | `skills/research-to-learning/` | 2026-11-19 自 `.workbuddy-ai/skills/` 迁入（D14）；`scripts/` 留原处 |
| learning-experience-design 技能文档 | `skills/learning-experience-design/` | 2026-11-19 新建（CHG-0001 P2）；Engine 内部专属设计 Skill；`preview/PILOT-L13-plan.md` 为待确认试点规格 |
| zcode 会话计划 | `plans/plan-sess_a45a3e3b-….md` | 2026-11-19 自 `.zcode/plans/` 归档（B14 裁决） |
| 项目审核材料（G1/G2/G3/KCR） | `reviews/`（**原处保留**） | 项目治理材料，已入 git |
| 客户端适配入口 | 根 `CLAUDE.md` / `AGENTS.md`、`.cursor/`、`.github/`、`.gemini/`、`.workbuddy-ai` stub | 只跳转不复制（D15） |

## 7. 禁区与隔离

- `.workbuddy-ai/memory/**`：宿主记忆，受保护（D09/D11"绝对不动"），不迁移、不读写。
- 本目录**不进离线知识 bundle**：`tools/build_site.py`、`tools/validate_site.py`、`tools/build_vitepress_content.py` 排除列表均包含 `.agent`（防知识库污染，.zcode 教训 A3）。
- `runs/` 不入 git（`.gitignore`）；执行日志按保留策略归档摘要到 `archive/`。
- 项目保护项不变：`archive/`、`web/vendor/`、`web/index.html`、两份旧方案文档。

## 8. 与知识文档的边界

本目录只放**智能体工作文档**（宪法 / 决策 / 规范 / 技能 / 计划 / 变更包 / 模板 / 注册表）。课程知识文档（lessons）、知识库主文档（01–07）、证据与课程数据（`evidence/`、`knowledge-model/`、`courses/`）**不属于本目录**，维持原位置。
