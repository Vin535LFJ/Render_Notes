# .agent — 统一智能体文档仓库

> 建立：2026-11-19（`DECISIONS.md` D14）。本目录是 Render_Notes 的**公共智能体文档仓库**，随仓库入 git、同步到 GitHub。任何智能体（QwenWork/Workbuddy、zcode、Claude、Cursor 等）切换时，只读这里即可拿到全部智能体文档。

## 1. 为什么存在

项目会持续产生新知识、新报告、新教材，参与的智能体也不止一个。过去每个工具/智能体在自己的隐藏文件夹（`.workbuddy-ai/`、`.zcode/`）里建文档，导致：切换智能体时找不到别人的文档、重复创建、不知道别人文件夹怎么工作。本目录把**智能体文档**统一收口为一处；各智能体私有文件夹只做索引。

## 2. 目录结构

| 分区 | 内容 |
|---|---|
| `skills/<skill-name>/` | 项目技能文档（SKILL.md 正文、`references/`、`assets/`） |
| `plans/` | 各智能体计划归档（保留来源会话文件名，§6 索引注明出处） |

## 3. 读取规则（所有智能体必读）

1. **进入项目先读本 README**，按 §6 索引定位文档。
2. 需要技能/计划/规范文档 → 到本目录对应分区查找；**不在自己文件夹重建副本**。
3. 可执行脚本是技能契约的一部分，**不迁移**（如 `check_chapter_arc.py` 留在 `.workbuddy-ai/skills/research-to-learning/scripts/`，门禁命令路径不变）。
4. 文档缺失或过时 → 走 Knowledge Change Review（`reviews/KNOWLEDGE_CHANGE_REVIEW.md`）提议变更，**不私自改结构**。
5. 智能体私有运行时状态（如宿主记忆）**不属于文档**，不迁入本目录。

## 4. 索引 stub 规则（私有文件夹只做索引）

- 智能体私有文件夹（如 `.workbuddy-ai/`）只保留：① README 索引（指向本目录）；② 宿主发现入口 stub（如 `SKILL.md`，保留 frontmatter 维持技能发现，正文指向本目录）；③ 可执行脚本。
- stub 必须明确指向 `.agent/` 中的正文，**不得复制正文**。

## 5. 写入规则

- 新文档按类型放入 §2 分区；在 §6 索引登记（名称 / 位置 / 来源 / 日期）。
- 归档外来文档保留原名，索引注明来源智能体与原路径。
- 结构调整（新增分区 / 迁移 / 废弃）必须记录 `DECISIONS.md`（本次为 D14）。

## 6. 索引

| 文档 | 位置 | 来源 / 备注 |
|---|---|---|
| research-to-learning 技能文档（SKILL.md + references/ 5 篇 + assets/ 2 篇） | `skills/research-to-learning/` | 2026-11-19 自 `.workbuddy-ai/skills/research-to-learning/` 迁入（D14）；`scripts/` 留原处 |
| zcode 会话计划 | `plans/plan-sess_a45a3e3b-28f5-474b-b35b-9b81a6d193d5.md` | 2026-11-19 自 `.zcode/plans/` 归档（B14 裁决：归档并提交） |
| 项目审核材料（G1/G2/G3/KCR） | `reviews/`（**原处保留**，不入本目录） | 项目治理材料，已入 git，被治理文档引用 |

## 7. 禁区与隔离

- `.workbuddy-ai/memory/**`：宿主记忆，受保护（D09/D11"绝对不动"），不迁移、不读写。
- 本目录**不进离线知识 bundle**：`tools/build_site.py`、`tools/validate_site.py`、`tools/build_vitepress_content.py` 排除列表均已包含 `.agent`（防知识库污染，.zcode 教训 A3）。
- 项目保护项不变：`archive/`、`web/vendor/`、`web/index.html`、两份旧方案文档。

## 8. 与知识文档的边界

本目录只放**智能体工作文档**（技能文档 / 计划 / 规则）。课程知识文档（lessons）、知识库主文档（01–07）、证据与课程数据（`evidence/`、`knowledge-model/`、`courses/`）**不属于本目录**，维持原位置。
