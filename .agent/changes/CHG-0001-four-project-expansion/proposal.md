---
doc_id: CHG-0001
type: change-proposal
status: proposed
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: []
generated: false
---

# CHG-0001 · 四项目并进拓展启动

> 位置：`.agent/changes/CHG-0001-four-project-expansion/proposal.md` · 流程：`.agent/changes/README.md`

## 元信息

- **change-id**：CHG-0001
- **提出日期** / **owner** / **状态**：2026-11-19 / qwenwork / proposed
- **关联 ADR**：无（不引入新的长期架构决策；沿用 D14/D15/ADR-0001）
- **关联 KCR**：P7 知识修复部分涉及 Source → Claim → Lesson → Quiz → Course，详见正文 §3

## 1. 背景与问题（证据）

- 用户提供四项目架构材料（Engine / Skills 供应库 / Governance / Radar），明确本轮四项目同时启动。
- 用户裁决：只建本地、不碰 GitHub；Render_Notes 现有 25 项未提交变更保持原样、增量修改；P1 做完全部剩余 P7。
- 审计实测（2026-11-19）：HEAD `474c667`；基线门禁 build 77 documents / validate 11 checks 0 FAIL 0 WARN / arc 5/5 OK。
- Gap 复核：`CURRENT_GAPS.md` 为 11-18 快照；L02 已闭合（V15/V16 + 正文改写已落地）；**未闭合**：L13（claims 仍 `[V06]`、quiz Q1/Q2 `claim_ids: []`）、L06（两层 objectives 漂移、§7.3 错位引用、缺 P02 声明）、L11（FBO=VkRenderPass 过度简化、乱码"由谁 inserted"四处）。

## 2. 提案（准备改变什么）

在**不改变现有架构决策**前提下，按四个工作流增量落地：

1. **P1**（本仓库）：补齐未闭合 P7 gap（L06/L13/L11 + 两层 course.json + quiz 挂接 + claim 登记 open），逐篇深化，过门禁，准备 G1/G2 材料不自批。
2. **P2**（本仓库）：新建 `.agent/skills/learning-experience-design/`（SKILL.md + references + assets + 试点页面规格），不改站点线上代码。
3. **P3**（新本地目录 `C:\Users\Giant\Desktop\GITCODE\agent-workspace-governance`）：通用治理 Kit MVP（规范 + schema + CLI + 测试 + 两个迁移样例）。
4. **P4**（新本地目录 `C:\Users\Giant\Desktop\GITCODE\github-project-radar`）：GitHub 情报系统本地实现（SQLite 快照 + 离线 fixture + 周报 + Engine 导出）。

**不改**：git commit / push / 远程仓库 / 部署；`archive/**`、`.workbuddy-ai/memory/**`、`web/vendor/**`、`web/index.html`、两份旧方案文档；`E:\AI-Tools\mattpocock-skills-zh-CN-custom`；用户级 skills；顶层 `skills/`、`scripts/` 新树；G1/G2/G3 人工结论。

## 3. 影响分析

- **KCR 链**：L13 登记新 open 断言（坐标空间链 / MVP 列序 / w_clip 透视除法 / NDC 差异）→ concepts 关系核对 → L13 正文/quiz → course 映射；L02 V15/V16 已登记在本轮只核对挂接不改状态；L06 补 P02 声明与 source locator 勘误。所有新断言默认 `open`，不升级 verified。
- **文档影响**：`.agent/README.md`（新增 Skill 与变更包索引）、`WORKFLOW_STATE.md`、`IMPLEMENTATION_PLAN.md`、`CHANGELOG.md`、`PROJECT_CURRENT_STATE.md`、`reviews/REVIEW_STATUS.md`（增量追加）；两门 course.json；3 篇 lesson + 3 个 quiz；`evidence/claim-ledger.json`；可能 `knowledge-model/concepts.json`。
- **工具 / 门禁影响**：三个 build 脚本的排除列表需加入新 Skill 目录（如生成器扫描到）；document-registry 需重生成；`web/content.js` 只由 build 生成。
- **风险**：用户未提交变更被覆盖（对策：只做精确字符串增量编辑，不改整文件）；生成物手改污染（对策：只跑脚本）；人工关卡被误判通过（对策：只准备材料不填结论）。

## 4. 替代方案与取舍

- 备选：按 GPT 材料建议只启动 P1 → 被用户明确否决（要求四项目全启动）。
- 备选：在 HEAD 开 worktree 隔离 → 不可用（D15 脚手架 untracked，worktree 缺失治理文件）。
- 备选：P2/P3/P4 另建独立仓库 → P2 被材料与用户确认留在 Engine 内；P3/P4 本轮只建本地目录，不建远程。

## 5. 验收条件

- 确定性门禁：`py -3 tools/build_site.py`、`py -3 tools/validate_site.py`（0 FAIL / 0 WARN）、`check_chapter_arc.py`（全 OK）、`review_gate.py`（只读）实测通过。
- 新知识断言全部 `open`；quiz `claim_ids` 无空挂接（L13）。
- P2 Skill 结构完整、索引登记、排除列表更新、registry 重生成。
- P3/P4：`py -3 -m unittest discover -s tests` 全绿；无远程调用；无凭据入库。
- 人工验收：G1/G2/G3 材料就绪但**未通过**；待裁决项列清单交用户。

## 6. 人工裁决栏（AI 不填）

- [ ] 批准 · [ ] 驳回 · [ ] 补充研究 · [ ] 修改范围 · [ ] 暂缓
- 裁决记录：`DECISIONS.md` D## / ADR-____
