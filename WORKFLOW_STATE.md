# 工作流状态（WORKFLOW_STATE）

> 用于断点续跑：记录当前阶段、完成度、待办、审核关卡与续跑点。每阶段结束更新一次。
>
> 计划：`.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md` · 裁决：`DECISIONS.md`

**最后更新**：2026-11-19（Master Prompt V3.0 · Loop 2 部分执行） · **当前阶段**：P0–P6 + B1–B5 + V3-Loop1 完成；Loop 2 已记录裁决（D12）+ KCR 机制设计（D13）+ 执行已决安全项 + P7.1 第一项 L02 修复 · **续跑点**：P7.1 第二项 L06（待 B4/B10 相关裁决推进 L13）；**仍待人工**：B4（L01 阅读认可）、B7/B8（V13/V14 升级，核验已完成见 G1 §7）、B10–B15（未答复，不视为同意）。G3 仍未通过。

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
2. **当前阻塞点 = 等待 `reviews/DECISION_REQUIRED.md` 人工裁决（B1–B15）**。核心：B1 L02 目标取舍、B2 主课程路线（推荐改 L12.next→L13）、B3 质量规范采用、B4 Gold Standard 认可、B7/B8 V13/V14 升级、B9 Pass 口径、B10 L13 断言登记、B12 stash、B13 reviews/ 入 git。**未回复项保持待审核，不视为同意。**
3. 收到裁决后按 `reviews/EXECUTION_PLAN_V3.md` Loop 2：记录裁决入 DECISIONS.md → 执行 Category A（A1 数字更正/A3 build 排除 .zcode/A4 学习路径指南补 U7/A5 K-STRIDE 改挂/A6 Pass 勘误）→ P7.1 blocker（L02→L06→L13→L11）→ P7.2 逐篇深化（一次一篇）。
4. 每阶段/每篇跑门禁（本机 `py -3`，`python` 解析到 cygwin stub 不可用）：`py -3 tools/build_site.py` → `py -3 tools/validate_site.py`（0 FAIL/0 WARN）→ `py -3 .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md` → `py -3 tools/review_gate.py`（只读）。
5. 改前端后额外做离线站浏览器 QA（file:// 与 http://localhost:8765 两路）；VitePress 构建需 B6 授权。
6. P6 产物 commit `3ce7b2f`+`0b2c0a1`+`650bb14` 已 push；**Loop 2 产物 commit `d4a9620`（27 文件，含 reviews/ 8 份）已 push**（2026-11-19 用户授权"同步最新更改到github"，`ls-remote` 实测远端 HEAD=`d4a9620`，本地同步）。`.zcode/` 与 `old_content.js.tmp` 为外来/临时产物未纳入（B14 待裁决）。后续默认不 commit/push，除非明确授权（D09/D11.9）；在线发布（D02）未授权。
7. 绝对不动：`.workbuddy-ai/memory/**`、`archive/**`、`web/vendor/**`、`web/index.html`、README（B5 前）、两份方案文档、已确认路线（B2 前）、claim 状态（G1 前）、外来产物 `.zcode/`+`old_content.js.tmp`（B14 前）、stash（B12 前）。执行结果写入 `CHANGELOG.md` 与本文件。
8. 环境事实：2026-11-19 网络已恢复（github.com:443 可达），`ls-remote` 实测远端 HEAD=`d4a9620` 与本地一致；早期 DNS 中断已解除。
