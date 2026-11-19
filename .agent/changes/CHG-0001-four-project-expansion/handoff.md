---
doc_id: HANDOFF-CHG0001
type: run-log
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# Handoff · CHG-0001 四项目并进拓展

## 任务
用户裁决四项目同时启动；本地执行，不碰 GitHub；P1 做完全部剩余 P7；现有 25 项未提交变更保持原样、增量修改。来源：用户指令 + `.agent/changes/CHG-0001-four-project-expansion/`。

## Owner Agent / 授权范围
- **Owner Agent**：WorkBuddy（qwenwork）主代理 + 两个 general-purpose 子代理（P3/P4，文件组隔离）
- **允许读取**：Render_Notes 全仓（除 memory）、两个新本地项目、E:\AI-Tools 技能库（只读）
- **允许修改**：Render_Notes 的 P7 数据/教材、`.agent/skills/learning-experience-design/`、状态文档增量追加、两个新本地项目目录
- **禁止修改**：`.workbuddy-ai/memory/**`、`archive/**`、`web/vendor/**`、`web/index.html`、两份旧方案文档、用户未提交的 25 项变更、E:\AI-Tools、任何 git 远程操作

## 实际修改文件清单
**Render_Notes（P1）**：`evidence/claim-ledger.json`（+V17–V20 open）、`evidence/source-registry.json`（+SRC-RN-3D-TRANSFORM）、`courses/video-rendering-journey/lessons/L13-*.md`/`L06-*.md`/`L11-*.md`、`quizzes/L13.json`/`L11.json`、两层 `course.json`（L06 objectives + L11 checkpoint）。生成物 `web/content.js` 由 build 脚本重建。

**Render_Notes（P2）**：新增 `.agent/skills/learning-experience-design/`（SKILL.md + 8 refs + 3 assets + scripts/check_visual_floor.py + preview/PILOT-L13-plan.md）；索引登记 `.agent/README.md`、`.agent/changes/README.md`；registry 重生成。

**新项目**：`C:\Users\Giant\Desktop\GITCODE\agent-workspace-governance`（README/AGENTS/宪法4/ schemas5/templates6/adapters5/cli/tests/examples2/docs3）；`C:\Users\Giant\Desktop\GITCODE\github-project-radar`（README/AGENTS/config2/radar9/fixtures2/cli/tests/reports/docs3）。

**状态文档**：CHANGELOG.md、WORKFLOW_STATE.md、reviews/REVIEW_STATUS.md（均增量追加，未覆盖用户改动）。

## 测试结果
- Render_Notes：`py -3 tools/build_site.py` OK（77 docs）；`validate_site.py` 11 checks / 0 FAIL / 0 WARN；`check_chapter_arc.py` 5/5 OK；`review_gate.py` 只读输出（G1/G2/G3 待人工）；`build_document_registry.py` 119 docs。
- Governance：`py -3 -m unittest discover -s tests` → 11 tests OK；CLI `validate` 在 basic-project 实测通过。
- Radar：`py -3 -m unittest discover -s tests` → 17 tests OK；全程无网络/git 调用。
- P2 静态检查：`check_visual_floor.py courses/.../lessons` OK；`web` 仅 1 条 WARN（暗色主题缺 --radius/--sidebar-width/--toc-width，是布局变量非颜色变量，非阻塞）。

## 遗留问题
- **待人工裁决**：B4（L01 样板）、B10（L13 断言登记确认）、G1-01（V13/V14 升级）、B11（P02 挂载）、G2/G3 关卡；均未由 AI 通过。
- V17–V20 默认 open，需 G1 确认后才可升级。
- P2 试点设计方向（方案 A 增量增强 vs B 重设计）待用户确认；未改线上站点。
- VitePress `docs:build` 未执行（D10.6，需单独授权）；在线发布未授权（D02）。

## 下一步建议
1. 用户裁决 B4/B10/G1-01 → 按裁决升级/确认断言状态。
2. 用户确认 P2 试点（PILOT-L13-plan.md）方案 A/B → 分阶段实施试点页。
3. 如需真实 Radar 采集，单独授权后接入 GitHub API（env token）并重跑周报。
4. 需要版本化时再单独授权 commit/push；本轮保持未提交。

## 任务状态更新
WORKFLOW_STATE.md 追加“CHG-0001 执行记录”段：P7 内容与数据修复完成，续跑点 = G1/G2 人工审核 + P2 试点确认；G3 仍未通过。

## 第二轮交接 · 融合基线增量（2026-11-19）

**本轮做了什么**（新架构文档作缺陷清单 + 规格增量，保留上轮全部成果）：
1. **发布边界**（第一优先）：reviews/ 8 篇审核材料不再进 `web/content.js`（85→77）与 VitePress 树；新增 `tools/publish_boundary.py` + `publish-allowlist.json`（咨询性）+ `test_publish_boundary.py`（11 tests）；三脚本加排除；archive 行为不变；strict allowlist 强制列人工裁决。
2. **状态漂移**：WORKFLOW_STATE / DECISION_REQUIRED / REVIEW_STATUS 早期表改指针（B13/B14 已裁决）；PROJECT_CURRENT_STATE 加增量校正块（保留原快照）。
3. **裁决材料包**：`reviews/decision-kit/` 七项（B4/V13/V14/B10/B11/B12/B15）+ 索引；9 段模板、裁决栏全空；B12 只读 stash diff（链接路径修正），未 pop/drop/apply。
4. **Skill 增量**：learning-experience-design 新增 5 篇 references（旧 8 保留，共 13），SKILL.md 双索引，status draft。
5. **两新项目增量**：governance 25 tests（13 类类型/单写者协议/doctor/index）、radar 38 tests（三维评分/生命周期别名/human_selected flag/零网络 source stub）；目录名不变、名称映射入文档。
6. **P8/P9 只读基础**：`tools/kcr_impact.py`（只读影响链）+ `reviews/kcr/` 说明 + `reviews/P9-orchestrator-design.md`（状态机 + run-state schema，draft）。

**本轮没做什么**（硬性边界）：零 git 写操作（未 commit/push/建仓/init/deploy）；未联网、未调 GitHub/Trending/OSSInsight；未改 archive 发布行为、未碰绝对不动区；未手改生成物；未删 Skill 旧篇；未升级任何 claim、未批量生成课文、未让 G1/G2/G3 通过；未代填任何人工裁决。

**门禁实测**：validate 11/0/0 · arc 5/5 · boundary 11 tests · governance 25 tests · radar 38 tests 全绿 · review_gate 只读（三关卡仍待人工）· registry 143 docs · HEAD `474c667` 不变 · stash@{0} 原样。

**待人工裁决（AI 未代批）**：B4 / V13 / V14 / B10 / B11 / B12 / B15（见 `reviews/decision-kit/`）+ G1/G2/G3（review_gate 只读）；strict allowlist 强制切换；P2 试点方向（方案 A/B，`PILOT-L13-plan.md`）。

**下一续跑点**：① 用户逐项裁决 decision-kit 后，按批准执行 claim 升级 / 正文修订 / stash 处置；② 确认 P2 试点方向后分阶段实施；③ 如需真实 Radar 采集，单独授权后接 GitHub API（env token）重跑周报；④ 版本化（commit/push）需单独授权。
