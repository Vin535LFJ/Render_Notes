# PROJECT_CURRENT_STATE · Render_Notes 真实状态审计

> 审计时间：2026-11-18。依据 Master Prompt V2.0 第一步要求产出。
> 口径：一切以实际代码与本地文件实测为准；旧方案文档、README 数字、历史对话描述不作为执行依据（D08）。
> 配套文件：`CURRENT_GAPS.md`（缺口）、`NEXT_PHASE_PLAN.md`（P6–P10 计划）。

---

## 1. Git 基线（实测）

| 项 | 实测值 |
|---|---|
| 远程 | `origin = https://github.com/Vin535LFJ/Render_Notes.git` |
| 远程 master HEAD | `5359259abc735f01bef38c399854f2b3eeaa001e`（`git ls-remote` 实测） |
| 本地 HEAD | `5359259`，与远程一致，分支 `master` 跟踪 `origin/master` |
| 提交信息 | AI Knowledge-to-Learning Engine: P5 收尾与文档缺口增量补齐 |
| 审计开始时工作区 | 干净（无未提交修改） |
| 审计期间改动 | 仅 `web/content.js` 因复跑 `build_site.py` 重生（与已提交版本等长、文档集合一致，差异为生成时间戳类字段；见 §6 说明） |

结论：本地与 GitHub 完全同步，Master Prompt 给出的基线 commit 即当前 HEAD。**P0–P5、B1–B5 已完成，不重复执行。**

## 2. 顶层结构（实测目录）

```
00-导航与索引/  01-基础理论/  02-解码与播放链路/  03-图形与GPU工程/
04-跨平台与高性能架构/  05-项目实战/  06-面试知识库/  07-3D渲染与算法实现/
archive/（只读）  courses/  evidence/  knowledge-model/  tools/  web/  site-vitepress/
.workbuddy-ai/skills/research-to-learning/
DECISIONS.md  WORKFLOW_STATE.md  IMPLEMENTATION_PLAN.md  CHANGELOG.md  README.md
Master Prompt：构建 AI Knowledge-to-Learning Engine.md（旧方案，仅参考）
Render_Notes：从知识库到 AI 原生教学系统的工作流设计.md（旧方案，仅参考）
```

## 3. 确定性门禁（本次审计实测，非转述）

命令用 `py -3` 执行（本机 `python` 首选解析到 cygwin  stub，不可用；Python 3.12.10 实际可用）。

| 门禁 | 实测结果 |
|---|---|
| `tools/build_site.py` | 63 documents / 17 sections / 11 glossary groups / 124 terms / 8 units / 19 lessons / 7 labs / 461 term cards / 2136 KB |
| `tools/validate_site.py` | **11 checks passed, 0 warnings, 0 failures**，exit 0 |
| `check_chapter_arc.py`（5 篇样章） | 5/5 OK，exit 0 |
| `tools/review_gate.py` | 29 claims（verified 16 / conditional 7 / open 6）；误标 verified 0；curriculum 7/7 段；G1/G2/G3 均待人工 |

**重要结论：结构门禁全绿 ≠ 教学质量达标。** 本次深度诊断（见 `courses/video-rendering-journey/教材质量诊断.md`）发现多处门禁无法覆盖的语义问题，包括一处夸大引用（L02"分级处置"源文档不存在）与一处断言链断裂（L13 核心知识无 Claim 支撑）。

## 4. 各子系统现状

### 4.1 知识层（单一来源，健康）
- 主知识文档分布在 01–07 目录；`archive/` 只读未动。
- `tools/glossary.json`：124 术语 / 11 组，术语定义唯一来源。
- `knowledge-model/concepts.json` + `taxonomy.json`：概念带 layer（L0–L7）、glossary_term、relations（prerequisite_of / contrast_with / used_by / part_of），validate §9 全过。
- `evidence/claim-ledger.json`：29 条断言（V01–V12、C01–C07、P01–P06、E01–E04）；`source-registry.json`：15 个来源，双向索引完整。
- 推导深度不均：`3D变换与坐标空间.md` 推导最完整；`音视频基础理论.md` §1/§2 有完整公式与数值实例、§4 同步部分仅结论级；`解码与播放链路.md` 工程流程详尽但无数学推导，且个别 API 名不严谨（见诊断 D-L06-5）。

### 4.2 课程层（两套数据，存在映射缺口）
- **主课程** `tools/course.json`：8 单元 / 19 课（L00–L18），每课有 question/objectives/prerequisites/reading/terms/checkpoint/next。**无 lab 字段**（lab 绑定在 `tools/labs.json` 的 `lesson` 字段）。
- **教学试点课程** `courses/video-rendering-journey/`：course.json（5 课元数据）+ curriculum.md（G2 对象）+ 5 篇样章（L01/L02/L06/L11/L13，各约 80 行 / 3.5–4.5KB）+ 5 份 quiz（各 3 题）+ review-report.md（评分待人工）。
- 19 课中只有 5 课有教学正文——这是**有意分阶段建设**（pilot 路线 L01→L02→L06→L11→L13），不是遗漏；但两层之间存在目标漂移、next 指针矛盾等真实缺口（详见 CURRENT_GAPS）。
- `tools/labs.json`：7 个实验（transform-mvp→L13、procedural-lathe→L17、pbr-lighting→L18、yuv-to-rgb→L01、pts-dts-timeline→L02、frame-pipeline→L06、rendergraph-dag→L11），每个含 tasks/selfTest/formula/note，离线可运行。

### 4.3 交互层（离线主站，健康）
- `web/` 零依赖离线站：阅读/搜索/术语/教材模式/进度/依赖图/技术索引/Mermaid 放大/7 实验/自测/本地反馈。P5 浏览器 QA 两路全绿（记录于 CHANGELOG）。
- 反馈闭环：localStorage 队列 + JSON 导出 + `tools/feedback.json`（当前空）+ `report_feedback.py` 只读聚合。不自动改任何状态。

### 4.4 Skill（单一综合 Skill，角色契约齐全）
- `.workbuddy-ai/skills/research-to-learning/`：SKILL.md（五阶段 + 映射角色 1b/4b/5b）、assets（chapter/lesson 模板）、references（workflow-details / evidence-and-claims / quiz-design / practice-and-review）、scripts/check_chapter_arc.py。
- arc 检查是**结构性底线**（标题/引语正则匹配五要素），不做语义判断。教材语义质量标准此前缺失——P6.4 本次补齐（`references/lesson-quality-standard.md`，待 G2 人工确认）。

### 4.5 发布层（两套并存，一处已知限制）
- `web/` 离线主站为权威交互版本（D02）。
- `site-vitepress/` 源码三件套 + `build_vitepress_content.py`（46 篇策展文档）完成；npm install 成功（vitepress 1.6.4）。
- **已知限制（D10.6，如实记录）**：`npm run docs:build` 未完成——vitepress 清理自身 `.vitepress/.temp/` 触发删除权限请求被用户拒绝，用户选择跳过。未伪造构建成功；重试需用户授权放行其自身临时目录清理。
- 不远程发布（D02/D09）；GitHub Pages 未授权。

## 5. 治理文档状态

- `DECISIONS.md` D01–D10 有效；D09 含 2026-11-18 一次性 commit+push 授权（已用完，本阶段默认不 commit）。
- `WORKFLOW_STATE.md`：P0–P5 + B1–B5 完成；G1/G2/G3 待人工；续跑点明确。
- `IMPLEMENTATION_PLAN.md` / `CHANGELOG.md`：与实测一致，除两处数字漂移（见 §6）。

## 6. 审计中发现的记录性偏差（非功能性）

1. **CHANGELOG P5 数字漂移**：P5 记录 62 documents / 452 term cards / 2107 KB；当前源树实测 63 / 461 / 2136 KB。已提交 `content.js` 与本次重建产物文档集合完全一致（63 篇，等长），差异仅为生成时间戳类字段——说明 P5 记录写于最后一次重建之前。本文件以实测为准。
2. **README 数字过时**：README 称"29 篇主文档 / 41 Markdown / 311 链接"（2026-11-17 口径），技术索引处 124 与 116 并存。D10.5 裁决 README 数字不动，故本次**不改 README**，已在 CURRENT_GAPS 列为决策提案。
3. **本机执行环境**：`python` 命令首选解析到 cygwin stub 导致"No application associated"；须用 `py -3`。已记录，后续门禁命令均用 `py -3`。

## 7. 边界确认（本次审计未做的事）

- 未 commit / push / 远程发布；未动 `archive/**`、`.workbuddy-ai/memory/**`、`web/vendor/**`、`web/index.html`、两份旧方案文档、README。
- 未重装任何依赖、未引入新框架/数据库。
- 审计阶段唯一文件改动为 `web/content.js` 重建（生成物，门禁要求）。