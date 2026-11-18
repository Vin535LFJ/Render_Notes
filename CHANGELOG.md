# 变更记录（CHANGELOG）

> 本文件记录「AI Knowledge-to-Learning Engine 增量补齐」的执行结果。
> 权威口径见 `DECISIONS.md`；当前阶段见 `WORKFLOW_STATE.md`。
> P5 + Part B 执行期间遵循 D09（不 commit/push）；2026-11-18 用户新授权 commit + push 到 origin/master，见文末"git 提交"段与 DECISIONS.md D09 更新。

## 2026-11-18 · P5 收尾验收

### 三重确定性门禁（实测）
- `python tools/build_site.py`：写出 `web/content.js`；`62 documents / 17 sections / 11 glossary groups / 124 terms / 8 units / 19 lessons / 7 interactive labs / 452 term cards / 2107 KB`。
  - 说明：文档数/节数高于 P0 基线（48/11），因 P1–P4 新增 `courses/`、`evidence/`、`knowledge-model/` 三个顶层树；`site-vitepress/` 生成树已被正确排除（`build_site.py` 过滤 `site-vitepress`）。
- `python tools/validate_site.py`：`validate_site: 5 checks passed, 0 warnings, 0 failures`，末行 `OK`，exit 0。
- `python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md`：5 篇样章（L01 / L02 / L06 / L11 / L13）全 `OK`，exit 0。
- JSON 结构兜底：`tools/*.json` + `evidence/*.json` + `knowledge-model/*.json` + `courses/.../*.json` 共 14 个文件全部可解析。

### 浏览器 QA（离线主站，零构建）
- 两路验证：`file://` 双击 `web/index.html`、`http://localhost:8765`（`python -m http.server 8765`）。
- 五视图（`#/`、`#/course`、`#/lab`、`#/graph`、`#/tech`、`#/glossary`）均渲染出内容；侧栏 62 链接。
- 7 个实验逐个打开均有 canvas + 3 项自检：`transform-mvp`、`procedural-lathe`、`pbr-lighting`、`yuv-to-rgb`、`pts-dts-timeline`、`frame-pipeline`、`rendergraph-dag`。
- 教材路由 `#/doc/courses/video-rendering-journey/lessons/L01-...md`：frontmatter 已剥离；教材模式 `#/course/L01` 可达。
- `Ctrl+K` 搜索框、明暗主题、390×844 移动视口、hash 刷新保持均正常；控制台/页面错误 0。
- 已知良性提示：agent-browser 报告 Chrome 版本落后（与本仓库无关）。

### review-report.md 收口
- 仅把"自动检查（已执行）"三行结果改为实测值，并新增一段"执行记录（自动检查结果，非评分）"。
- **未填任何分数**：评分表"自评"仍为 `待人工`、"人工评分"仍为 `—`；G1/G2/G3 仍为未勾选；结论仍为 `待人工评分后填写。生成 Agent 不在此处填写"通过"。`

### 已知限制（D10.6，如实记录）
- P4 VitePress `npm run docs:build` 未完成：vitepress 需清理自身 `.vitepress/.temp/` 构建中间产物，触发删除权限请求被用户拒绝；用户已选"跳过构建，如实记录"。
- 本计划**未重试**该命令；源码树（`package.json` / `README.md` / `.vitepress/config.mjs`）与生成的 46 篇策展文档保留，`npm install` 成功（vitepress 1.6.4）。不伪造构建成功。

### 边界确认
- 未 commit / 未 push / 未远程发布（D09）。
- 未改动：`README.md`、两份 GPT 方案文档、`archive/**`、`web/index.html`、`web/vendor/**`、`.workbuddy-ai/memory/**`。
- 人工审核关卡 G1/G2/G3 仍待人工，AI 未自评通过。

## 2026-11-18 · Part B 文档缺口增量补齐

批准计划：`C:\Users\Giant\.workbuddy-ai\plans\radiant-cascade-newton-e440_pIP.md`。用户确认"两者都要" + B5 连前端 UI 一起做（对 D04 的明确授权偏离，仅限 `web/assets/app.js`、`styles.css`，无远程）。

### B1+B2 · validate_site.py 第 11 节（coverage）
- 仅**新增**第 11 节，前 10 节零改动（符合 D07）：
  - 11a 每条 claim 必须有 evidence（孤立断言 FAIL）；`verified` 但未挂任何课时 WARN；`open/conditional` 未挂载属预期（P03），不误报。
  - 11b 每个 checkpoint 必须被 quiz prompt 覆盖；quiz `claim_ids[]` 必须 ⊆ 课时声明的 `claims[]`；覆盖以归一化文本双向包含判定（实测 5/5 课全覆盖）。
  - 11c `tools/feedback.json` 可选校验：`type` 枚举、lesson/quiz/claim ID 可解析（quiz 未找到记 WARN）。
- 负向自检：临时清空 V01 的 evidence → `[coverage] V01: no evidence item` FAIL、exit 1；恢复后 0 FAIL。
- 门禁：validate 由 5 checks → **11 checks passed, 0 warnings, 0 failures**。

### B3 · Skill 角色契约补齐（不建顶层 skills/）
- `SKILL.md`：frontmatter description 补两角色；角色表新增 4b Practice Designer、5b Knowledge Publisher / Feedback Analyst 两行（含 gate）；阅读指引与 Helpers 登记 `practice-and-review.md`。
- `references/workflow-details.md`：在 mapped roles 段后补两角色完整契约（input/actions/output/gate/boundary/reference）。
- 新建 `references/practice-and-review.md`：两角色契约 + G1/G2/G3 人工关卡清单 + 本地反馈循环说明。
- 验证：validate 0 FAIL；`skills/`、`scripts/` 顶层目录未创建。

### B4 · tools/review_gate.py（只读前置清单）
- 新建 stdlib 工具：打印 G1（claim 状态分布、conditional/contested 误标 verified 检查）、G2（curriculum 七段存在性 + 每课时前置/目标/checkpoint 概况）、G3（确定性门禁命令 + review-report 仍待人工状态）的自动前置条件。
- 实测：29 claims（verified 16 / conditional 7 / open 6），误标 0；curriculum 7/7 段齐全；G1/G2/G3 未勾选 3 个。
- **不写分数、不勾关卡、不运行门禁**；review-report.md 字节未因本工具改变。

### B5 · 学习反馈闭环（数据 + 只读聚合 + 离线前端 UI）
- 数据层：新建 `tools/feedback.json`（version + entries[]，空；字段 lesson/quiz/claim_ids/type/note/ts，无个人信息、无远程）。
- 聚合层：新建 `tools/report_feedback.py`（只读，按 type/lesson/claim 汇总 + 从 claim-ledger 取回断言文本输出 needs-review 线索；不改任何状态）。
- 前端 UI（`web/assets/app.js`、`styles.css`，用户授权偏离 D04）：
  - 复用既有 `rn-course-progress` 阅读进度机制，未重复造轮子；
  - 新增 `rn-feedback-queue` localStorage 队列；教材页 L## 与配套文档自动预填课时/quiz；反馈表单（type/lesson/quiz/claim_ids/note）；"加入队列 / 导出 JSON / 清空"三按钮；`Blob` + `URL.createObjectURL` 纯浏览器导出（无第三方库、无网络请求）。
  - `styles.css` 追加反馈面板样式（明暗主题 + ≤640px 移动端 + print 隐藏）。
  - **未改** `web/index.html`（UI 动态注入到 `#content`）。
- 端到端验证（浏览器实测）：填写→提交→localStorage 落库（含 lesson=L01、quiz=L01、claim_ids=[V02,V12]、ts）→刷新后保留、徽标计数同步；导出 payload 结构 = `{version:1, entries:[...]}`；将同结构样本放入 `tools/feedback.json` 后 `report_feedback.py` 正确输出 V02/V12 的复核线索；样本已移除、`feedback.json` 恢复空、门禁绿。
- 回归：五视图 + 7 实验 + 教材路由 + 搜索/主题/移动端全部正常，反馈面板仅出现在课时页，控制台 0 error。

### Part B 边界与收口
- DEFER（逐项理由）：10-Skill 树 / 多 Agent runtime / MCP / 向量 DB / 远程发布 / 修 docs:build / Shader Playground（违反 D04/D09/D10.3/D10.6 或体量过大）；机器可读知识缺口检测（与 `知识缺口登记表.md` 单一来源冲突，待定权威）。
- D04 偏离仅此一处（B5 前端），已按用户授权执行；未新建顶层 skills/ 或 scripts/。
- Part B 执行期间未 commit / push / 发布；未碰两份方案文档、archive、web/index.html、web/vendor、.workbuddy-ai/memory。（git 提交见文末，README.md 的纳入为用户新授权。）

## 2026-11-18 · git 提交（用户新授权）

- 用户在 P5 + Part B 完成后明确要求"提交 git 更新"，并确认 **commit + push 到 origin/master**、**README.md 的 3 行 chat 链接改动一并纳入**（见 `DECISIONS.md` D09 更新）。此为一次性授权，不改变其余"绝对不动"项。
- 提交内容：
  - 引擎层：`tools/validate_site.py`（第 11 节 coverage）、`tools/review_gate.py`、`tools/report_feedback.py`、`tools/feedback.json`、`tools/build_site.py`、`tools/labs.json`、`tools/graph.json`、`tools/course.json` 等既有改动。
  - 前端：`web/assets/app.js`（反馈 UI + 既有实验渲染）、`web/assets/styles.css`、`web/content.js`（生成物）。
  - 课程/证据/知识模型：`courses/`、`evidence/`、`knowledge-model/` 全部产物。
  - Skill：`.workbuddy-ai/skills/research-to-learning/`（角色契约 + practice-and-review.md + 既有脚本改动）。
  - 在线站源码：`site-vitepress/`（源码三件套；生成物由 .gitignore 排除）与 `.gitignore`。
  - 文档/状态：`DECISIONS.md`、`IMPLEMENTATION_PLAN.md`、`WORKFLOW_STATE.md`、`CHANGELOG.md`（本文件）、两份 GPT 方案文档（新增跟踪）。
  - README.md：用户此前的 3 行 chat 链接改动（按本次授权纳入）。
- 未纳入/未执行：在线发布（GitHub Pages 等，D02 未授权）；VitePress `docs:build`（D10.6 已知限制，未重试、未伪造）；`.workbuddy-ai/memory/**`（绝对不动）。
- 提交哈希与远端同步状态：见 `git log -1` 与 `git status`（push 后本地与 origin/master HEAD 一致）。
