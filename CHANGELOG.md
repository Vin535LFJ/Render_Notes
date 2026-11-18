# 变更记录（CHANGELOG）

> 本文件记录「AI Knowledge-to-Learning Engine 增量补齐」的执行结果。
> 权威口径见 `DECISIONS.md`；当前阶段见 `WORKFLOW_STATE.md`。
> P5 + Part B 执行期间遵循 D09（不 commit/push）；2026-11-18 用户新授权 commit + push 到 origin/master，见文末"git 提交"段与 DECISIONS.md D09 更新。

## 2026-11-18 · P6 教材质量升级（Master Prompt V2.0）

### 第一步审计（实测）
- 远程 master HEAD = 本地 HEAD = `5359259`（ls-remote 实测），工作区审计开始时干净。
- 门禁基线：build 63 docs / validate 11 checks 0 FAIL / arc 5/5 OK / review_gate 29 claims（16 verified / 7 conditional / 6 open）。
- 产出：`PROJECT_CURRENT_STATE.md`、`CURRENT_GAPS.md`、`NEXT_PHASE_PLAN.md`（根目录）。
- 记录性偏差：CHANGELOG P5 数字（62/452/2107KB）与最终源树（63/461/2136KB）漂移，已提交 content.js 与重建产物文档集合一致（仅时间戳类差异）；README 数字过时但按 D10.5 不动，列决策提案。本机 `python` 解析到 cygwin stub，门禁改用 `py -3`（D11.10）。

### P6.1 深度诊断
- 新增 `courses/video-rendering-journey/教材质量诊断.md`：十维度逐章判定 + 源文档行号核对 + 跨层数据交叉核对。
- 关键发现：L02"drift 强纠偏区/分级处置"源文档不存在（blocker，夸大引用）；L02 目标"seek 后禁止立刻丢帧"无出处（blocker）；L13 核心知识无断言支撑、quiz 弱挂/空挂（blocker）；L06 目标漂移+§7.3 错位；L11 乱码四处+RenderPass 过度简化；L01 数字口径/推导缺失。
- 诊断明确为 AI 线索，非人工评分；G1/G2/G3 状态未变。

### P6.2 覆盖矩阵
- 新增 `courses/video-rendering-journey/课程覆盖矩阵.md`：19 课 × 元数据/正文/Quiz/Claim/Lab；元数据 19/19、正文 5/19、Quiz 5/19、Lab 7/19、断言挂载 13/19。
- 核对结论：pilot 5 课为有意分阶段（非遗漏）；pilot next 指针与路线矛盾（已修）；主课程 L12.next=L15 与 L15 先修矛盾（留 G2 拍板）；L02/L06/L11 两层目标漂移（留 P7）。
- **第 3 项确定性验证**（一次性审计脚本，不入仓库）：先修存在性 19/19 + DFS 无循环；主课程 next 链行走实测 L15/L17/L18 先修未满足（G-D2 精确量化到 L17/L18）；pilot 路线 next 指针 + §10 正文桥 + lessonFile + quiz + lab 双向**全部一致 0 问题**；labs.json 7 实验 lesson 反向均有效。桥接检测限定 §10 段落，排除 §11 延伸链接误报。结论已写入覆盖矩阵 §2.1，G-D2 范围同步扩展至 L17/L18。

### P6.3 Gold Standard L01 + 数据修复
- 重写 `lessons/L01-为什么视频不是-RGB.md`（88→约 300 行）：精确数字开篇（22.4GB vs 112.5MB 两刀分解）、生理依据（V13）、4:2:0 记号与采样对照表、NV12 布局图、stride 公式+1080@128 算例+逐行错位推导+绿屏成因计算（V14）、glPixelStorei 代码、排查案例、实验四任务+full-range 边界、因果链回忆。checkpoint 两题原文保留。
- `evidence/claim-ledger.json`：新增 V13/V14（open/low，待 G1 升级，note 说明提取来源）；V06 used_by 补 L13、E03 补 L11。
- `evidence/source-registry.json`：新增 SRC-RN-AV-BASE（repo_doc），双向索引完整。
- `quizzes/L01.json`：Q2 改挂 V14，答案补绿线/累积偏差依据。
- 两层 course.json：L01 乱码目标修复；pilot next 对齐 L01→L02→L06→L11→L13→null（D11.2）。
- 未动其余四篇样章内容（修复留 P7，D11.7）。

### P6.4 质量规范提案 + G2 材料
- 新增 `.workbuddy-ai/skills/research-to-learning/references/lesson-quality-standard.md`（十维度/六问/类比边界/数学三件套/引用与断言纪律/知识类型结构/诊断程序）；SKILL.md 登记阅读指引、Phase 5 审核动作、Helpers。**提案状态，待 G2 人工确认，AI 未宣布通过。**
- 新增 `courses/video-rendering-journey/G2-审核材料-P6.md`：变更清单 + 6 个待拍板问题（行为语言）+ 语义审核 8 项清单 + 空白评分表。

### 门禁（P6 结束实测）
- `py -3 tools/build_site.py`：69 documents / 17 sections / 124 terms / 8 units / 19 lessons / 7 labs / 497 term cards / 2291 KB（新增 6 篇审计/诊断/矩阵/G2 文档计入）。
- `py -3 tools/validate_site.py`：**11 checks passed, 0 warnings, 0 failures**，exit 0。
- arc：5/5 OK（含重写后的 L01）。
- review_gate：只读复跑正常，G1/G2/G3 仍待人工，未写任何分数。

### 边界确认
- 未 push / 远程发布（D09 远程需另行授权）；未动 archive / memory / vendor / index.html / 两份旧方案 / README。
- 治理文档同步：DECISIONS.md 新增 D11；WORKFLOW_STATE.md 更新续跑点为 G2；IMPLEMENTATION_PLAN.md 新增 P6 勾选与 P7–P10 待办。
- 已知风险：V13/V14 为 open 断言，G1 升级前教材以主文档锚点为权威；L02 blocker 内容在 P7 修复前仍在线（诊断与 G2 材料已显著标记）。

### git 提交（2026-11-18 用户授权"先提交代码，保存修改"）
- P6 全部产物本地 commit **`3ce7b2f`**（19 文件，+978 / −44）：审计三件套 + 诊断 + 覆盖矩阵 + Gold Standard L01 + V13/V14/SRC-RN-AV-BASE + quiz/next/乱码/used_by 修复 + 质量规范提案 + G2 材料 + 治理文档 + content.js。
- **仅本地 commit，未 push**（D09/D11.9：远程需另行授权）。提交后工作区干净；本笔记录哈希的文档更新随后单独提交。
- **push（2026-11-18 用户授权"push吧"）**：`git push origin master` 成功，`5359259..0b2c0a1`；`ls-remote` 实测远端 HEAD=`0b2c0a16f9de2735a722abdc8d57bc0d94620953`，本地与 origin/master 同步。**仅 push 源码，未做在线发布**（GitHub Pages 等 D02 仍未授权）。

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
