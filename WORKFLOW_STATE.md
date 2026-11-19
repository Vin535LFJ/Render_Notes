# 工作流状态（WORKFLOW_STATE）

> 用于断点续跑：记录当前阶段、完成度、待办、审核关卡与续跑点。每阶段结束更新一次。
>
> 计划：会话级批准产物，原件位于用户目录 `~/.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md`（不入仓库） · 裁决：`DECISIONS.md`（D01–D14）

**最后更新**：2026-11-19（程序级收口 D16 / PD-Q1/Q2/Q7/Q8） · **当前阶段**：P0–P6 + B1–B5 + V3-Loop1/Loop2 完成；P7.1 四篇 blocker 全部修复（L02/L06/L13/L11）；P8 预研起步（kcr_impact 只读影响分析 + 发布边界 allowlist 生效）；三批未提交改动已拆分收口（`5a4de84`/`a45ffa9`/`7c05bc7`+留痕笔） · **续跑点**：**G1/G2 人工裁决（`reviews/decision-kit/` 七项材料）→ P7.2 逐篇深化**；**仍待人工**：B4/B7/B8/B10/B11/B12/B15（未回复不视为同意）；G3 仍未通过 · **程序级裁剪生效（D16/PD-003）**：Engine 为唯一活跃线，P2 Skill/P03/P04 冻结在现有成果（解冻条件见办公室 PD-003），不新建收录类项目。

---

## 阶段进度

| 阶段 | 内容 | 状态 | 验收 |
|---|---|---|---|
| P0 | 护栏文档 + 基线门禁 | ✅ 完成 | 基线 build/validate 0 FAIL |
| P1 | 证据层 + 知识模型 + QA 扩展 | ✅ 完成 | claim/source 双向索引；concept 术语可解析；0 FAIL |
| P2 | 正式课程闭环（优先） | ✅ 完成 | 5 样章 arc 全 OK；quiz/frontmatter/链接全过 validate；浏览器验证干净 |
| P3 | 五个交互 demo | ✅ 完成 | 4 个新 lab（yuv/timeline/pipeline/dag）+ 既有 mvp/lathe/pbr；浏览器逐个验证交互 |
| P4 | VitePress 并存 | 🔄 源码树完成 | 生成器/配置/package 完成；npm install 成功；**docs:build 被权限阻止**（见下，D10.6 已知限制，未重试） |
| P5 | 收尾验收 | ✅ 完成 | 三重门禁 exit 0（validate 5 checks / 0 FAIL / 0 WARN；arc 5/5 OK）；浏览器 QA 两路全绿；review-report 只填自动检查、AI 不自评；未 commit/push（详见 CHANGELOG.md） |
| B1+B2 | validate 第 11 节 coverage | ✅ 完成 | 11 checks / 0 FAIL / 0 WARN；负向自检确认 FAIL 触发；checkpoint/quiz 覆盖 5/5 |
| B3 | Skill 角色契约 | ✅ 完成 | 补 4b/5b 角色 + practice-and-review.md；未建顶层 skills/ |
| B4 | review_gate.py | ✅ 完成 | 只读前置清单，G1/G2/G3 待人工；不写分数 |
| B5 | 学习反馈闭环 | ✅ 完成 | feedback.json + report_feedback.py + 离线前端 UI（localStorage 队列 + JSON 导出）；端到端验证通过；D04 偏离已授权 |
| P6 | 教材质量升级（Master Prompt V2.0） | ✅ 完成，待 G2 | 审计三件套 + 教材质量诊断（2+1 处 blocker）+ 课程覆盖矩阵 + Gold Standard L01 重写 + V13/V14 登记（open）+ 质量规范提案 + G2 材料；门禁 11 checks 0 FAIL / arc 5/5；D11 登记 |
| V3-Loop1 | 审核准备（Master Prompt V3.0） | ✅ 完成，待裁决 | reviews/ 7 文件（CURRENT_AUDIT/G1/G2/G3/REVIEW_STATUS/DECISION_REQUIRED/EXECUTION_PLAN_V3）；门禁复跑 11/0/0·arc 5/5；偏差登记（L01 239 行/31 claims·16 sources/build 69 基线/.zcode 污染）；A/B/C 分类；未改既有内容文件、未升级 claim、未填人工结论 |
| V3-Loop2 | 裁决后执行（部分） | 🔄 进行中 | D12 裁决记录 + D13 KCR 机制设计（reviews/KNOWLEDGE_CHANGE_REVIEW.md）；已执行 B2 路线（脚本验证 ALL CONSISTENT）/B5 README/B3 规范采纳/A1 数字/A3 build 排除.zcode/A4 导航补 U7/A5 K-STRIDE 改挂/C2 API 勘误/B9 Pass 统一；权威核验完成（G1 §7）；P7.1 L02 修复（V15/V16 open + 正文重写 + quiz）；门禁 11/0/0·arc 5/5·33 claims 误标 0；L06/L13/L11 待续 |

图例：⬜ 待办 · 🔄 进行中 · ✅ 完成 · ⛔ 阻塞

## P4 当前状态（如实记录，D10.6）

- `tools/build_vitepress_content.py`（stdlib-only）已产出 46 篇策展文档 + index.md + sidebar.generated.mjs。
- `site-vitepress/{package.json, README.md, .vitepress/config.mjs}` 源码三件套完成；`.gitignore` 已含全部生成物。
- `npm install` 成功（vitepress 1.6.4，126 packages）。
- **`npm run docs:build` 未完成**：vitepress 需清理自身 `.vitepress/.temp/` 构建中间产物，触发删除权限请求被用户拒绝。用户已选择"跳过构建，如实记录"。修复过的脚本：`vitepress build`（不带 `docs` 参数，根目录含 config）。
- 不伪造构建成功；后续如需验证：用户手动执行 `cd site-vitepress && npm run docs:build`（放行其自身临时目录清理）。

## 基线快照（P0 时实测）

- `python tools/build_site.py`：48 documents / 11 sections / 11 glossary groups / 124 terms / 8 units / 19 lessons / 3 labs / 376 term cards / 1983 KB。
- `python tools/validate_site.py`：`2 checks passed, 0 warnings, 0 failures`。
- Git：`master` @ `2dd62d2` 已推送；`README.md` 有用户未提交改动（chat 链接）；两份方案文档未跟踪。

## 人工审核关卡（方案要求，不可由 AI 自批）

| 关卡 | 位置 | 状态 | V3.0 审核材料 |
|---|---|---|---|
| G1 研究范围审核 | P1 证据层种子确定后 | ⬜ 待人工 | reviews/G1-evidence-review.md（31 claims，V13/V14 升级评估） |
| G2 课程大纲审核（最重要） | P2 `curriculum.md` 完成后 | ⬜ 待人工 | reviews/G2-curriculum-review.md（G2-01…06 重核） |
| G3 最终发布审核 | P5；本计划不发布，仅记录 | ⬜ 待人工（**仍未通过**） | reviews/G3-release-readiness.md |

统一裁决表：`reviews/DECISION_REQUIRED.md`（B1–B15，未回复不视为同意）。

## 审核评分（P5 人工填写）

见 `courses/video-rendering-journey/review-report.md`：事实准确性 25 / 知识连贯性 25 / 教学体验 20 / 实践能力 20 / 阅读体验 10，门槛总分 ≥85 且前两项各 ≥80%。**生成 Agent 不得自评通过。**

## 续跑指引

1. 读 `DECISIONS.md`（D01–D11）与 `reviews/REVIEW_STATUS.md` 确认审核分类。
2. **当前阻塞点 = 等待 `reviews/decision-kit/` 人工裁决（仍 OPEN：B1–B12 中未决项 + B15）**。核心：B4 Gold Standard 认可、B7/B8 V13/V14 升级、B10 L13 断言登记、B11 P02 挂载、B12 stash、B15 研究任务。**B1/B2/B3/B5/B6/B9 已决、B13/B14 已归档裁决**（见 `DECISIONS.md` D01–D12、`.agent/decisions/`）；权威逐项状态以 `reviews/decision-kit/README.md` 总表为准。**未回复项保持待审核，不视为同意。**
3. 收到裁决后按 `reviews/EXECUTION_PLAN_V3.md` Loop 2：记录裁决入 DECISIONS.md → 执行 Category A（A1 数字更正/A3 build 排除 .zcode/A4 学习路径指南补 U7/A5 K-STRIDE 改挂/A6 Pass 勘误）→ P7.1 blocker（L02→L06→L13→L11）→ P7.2 逐篇深化（一次一篇）。
4. 每阶段/每篇跑门禁（本机 `py -3`，`python` 解析到 cygwin stub 不可用）：`py -3 tools/build_site.py` → `py -3 tools/validate_site.py`（0 FAIL/0 WARN）→ `py -3 .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md` → `py -3 tools/review_gate.py`（只读）。
5. 改前端后额外做离线站浏览器 QA（file:// 与 http://localhost:8765 两路）；VitePress 构建需 B6 授权。
6. P6 产物 commit `3ce7b2f`+`0b2c0a1`+`650bb14` 已 push；**Loop 2 产物 commit `d4a9620`（27 文件，含 reviews/ 8 份）已 push**（2026-11-19 用户授权"同步最新更改到github"，`ls-remote` 实测远端 HEAD=`d4a9620`，本地同步）；**D14 结构治理 commit `f5d4ecf`（26 文件，.agent/ 统一仓库）已 push**（2026-11-19 用户授权"授权 commit + push"，远端 HEAD=`f5d4ecf`，本地同步）。B14：`.zcode` 计划已归档入 `.agent/plans/` 并随 `f5d4ecf` 提交；临时备份 `old_content.js.tmp` 已删除（用户授权，回收站可恢复）。后续默认不 commit/push，除非明确授权（D09/D11.9）；在线发布（D02）未授权。
7. 绝对不动：`.workbuddy-ai/memory/**`、`archive/**`、`web/vendor/**`、`web/index.html`、README（B5 前）、两份方案文档、已确认路线（B2 前）、claim 状态（G1 前）、stash（B12 前）、`.agent/**`（统一智能体文档仓库，结构变更走 DECISIONS 记录 + KCR）。外来产物：`.zcode/` 已按 B14 归档入 `.agent/plans/` 并提交、空目录已移除（D14）；临时备份 `old_content.js.tmp` 已删除（用户授权，回收站可恢复）。执行结果写入 `CHANGELOG.md` 与本文件。
8. 环境事实：2026-11-19 网络已恢复（github.com:443 可达），`ls-remote` 实测远端 HEAD=`d4a9620` 与本地一致；早期 DNS 中断已解除。
9. 结构变更（D14，2026-11-19）：智能体文档统一迁入 `.agent/`（技能文档 + zcode 计划）；`.workbuddy-ai/` 只留索引 stub + scripts + memory；三个构建工具排除 `.agent`；门禁命令路径不变（scripts 未迁移）。统一规则与索引：`.agent/README.md`。
10. 文档治理基座（D15/ADR-0001，2026-11-19）：`.agent/` 新增 constitution/decisions/standards/templates/changes/indexes 分区 + 全客户端适配入口（CLAUDE.md/AGENTS.md/.cursor/.github/.gemini，只跳转不复制）+ `tools/build_document_registry.py`（frontmatter 事实源生成注册表，实测 104 篇）；三个构建工具排除适配入口；`.gitignore` 追加 `.agent/runs/`。**已提交**：D15 基座随收口第一笔 `5a4de84` 入库（D16/PD-Q1）。

## CHG-0001 执行记录（2026-11-19，四项目并进）

- **P7 剩余 gap 已修复**：L13（V17–V20 open 断言 + quiz 重挂）、L06（两层 objectives/正文/source anchor/P02）、L11（RenderPass 勘误 + 乱码四处）。L02 已闭合。门禁 build/validate(0 FAIL/0 WARN)/arc(5/5)/review_gate 全绿。
- **P2 Skill**：`learning-experience-design` 建成（`.agent/skills/`），试点规格待用户确认；三个 build 脚本已排除 `.agent`。
- **P3/P4**：两个新本地项目 `agent-workspace-governance`（11 tests OK）、`github-project-radar`（17 tests OK）已初始化，未碰 git/GitHub/网络。
- **续跑点更新**：P7 内容与数据修复完成 → 下一步为 **G1/G2 人工审核**（B4/B10/V13/V14 升级等裁决）+ 试点设计方向确认；G3 仍未通过，本轮不发布。
- **边界**：未 commit/push、未建远程仓库；25 项既有未提交变更保持原样、本轮为增量追加。详见 `CHANGELOG.md` 与 `.agent/changes/CHG-0001-four-project-expansion/`。

## 融合基线增量执行记录（2026-11-19，新架构文档作为缺陷清单+规格增量）

- **发布边界修复（第一优先）**：reviews/ 8 篇审核材料不再进入 `web/content.js`（知识文档 85→77）与 VitePress 树；新增集中边界模块 + 咨询性 allowlist + 11 测试；archive 行为不变。
- **状态漂移**：早期表过期状态改指针行（B13/B14 已裁决）；PROJECT_CURRENT_STATE 加增量校正块。
- **裁决材料包**：`reviews/decision-kit/` 七项（B4/V13/V14/B10/B11/B12/B15）+ G1/G2/G3 全 OPEN，裁决栏空白，未代批。
- **Skill 增量**：learning-experience-design 参考文档 8→13 篇（旧 8 保留 + 新 5），SKILL.md 双索引，draft。
- **两新项目增量**：governance 25 tests（+doctor/index/13 类型/单写者协议）、radar 38 tests（+三维评分/生命周期别名/human_selected flag/零网络 source 接口）；目录名不变。
- **P8/P9 只读基础**：`tools/kcr_impact.py` 只读影响链工具 + P9 设计文档（draft），未写源 JSON/未升级 claim/未建运行态文件。
- **续跑点**：仍为 **G1/G2 人工审核 + 7 项裁决（decision-kit）+ P2 试点方向确认（PILOT-L13-plan.md）**；G3 未通过、本轮不发布。
- **边界**：零 git 写操作；HEAD `474c667`、stash@{0} 原样；未联网、未建远程仓库。详见 CHANGELOG.md 与 `.agent/changes/CHG-0001-four-project-expansion/handoff.md`。

## 程序级收口记录（2026-11-19，D16 / PD-Q1/Q2/Q7/Q8）

- **裁剪生效（PD-Q7/PD-003）**：Engine 唯一活跃线；learning-experience-design/P03/P04 冻结在现有成果（冻结≠删除）；不新建知识库/skill 收录类项目。程序级权威：`AI-Knowledge\ai-knowledge-program\decisions\PD-003-scope-trim.md`（accepted）。
- **三批收口（PD-Q1）**：`5a4de84`（D15 治理基座 31 文件）/ `a45ffa9`（CHG-0001 P7+P2 33 文件）/ `7c05bc7`（P8/P9 预研 20 文件）+ 留痕笔；`test_publish_boundary.py` 断言笔误修正（77→69）后 11/11 OK；发布 allowlist 生效，bundle **69 docs**（reviews 不再进学习站）。
- **P03/P04 版本保护（PD-Q2）**：本地 git `dec60ba`（39 文件）/ `942530b`（30 文件），无远程；测试 25/38 OK 实测。
- **副本清理（PD-Q8）**：`program-office-delivery/` 10 份→回收站（可恢复）；`.qoder-input-images/` gitignore。
- **门禁实测**：build 69 docs/17 sections/124 terms/19 lessons/7 labs/504 cards · validate 11/0/0 · arc 5/5 · review_gate 37 claims（16v/14o/7c）误标 0。
- **续跑点**：G1/G2 人工裁决（decision-kit 七项）→ P7.2 逐篇（一次一篇）→ P8 KCR 闭环 → P9 最小状态机 → P10 一批新资料端到端验收。
- **待办**：Render_Notes 迁入 `AI-Knowledge\`（PD-002 收尾）仍被本会话工作区占用阻塞——需绑定其他目录的会话或关闭本会话后手动 move；stash@{0} 原样（B12）；G3 未通过、在线发布（D02）未授权。
