# 工作流状态（WORKFLOW_STATE）

> 用于断点续跑：记录当前阶段、完成度、待办、审核关卡与续跑点。每阶段结束更新一次。
>
> 计划：`.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md` · 裁决：`DECISIONS.md`

**最后更新**：2026-11-18（P5 + Part B 全部完成） · **当前阶段**：全部执行完毕（P0–P5 + B1–B5） · **续跑点**：无；仅剩人工 G1/G2/G3 评分与（需用户授权的）P4 docs:build。

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

| 关卡 | 位置 | 状态 |
|---|---|---|
| G1 研究范围审核 | P1 证据层种子确定后 | ⬜ 待人工 |
| G2 课程大纲审核（最重要） | P2 `curriculum.md` 完成后 | ⬜ 待人工 |
| G3 最终发布审核 | P5；本计划不发布，仅记录 | ⬜ 待人工 |

## 审核评分（P5 人工填写）

见 `courses/video-rendering-journey/review-report.md`：事实准确性 25 / 知识连贯性 25 / 教学体验 20 / 实践能力 20 / 阅读体验 10，门槛总分 ≥85 且前两项各 ≥80%。**生成 Agent 不得自评通过。**

## 续跑指引

1. 读 `DECISIONS.md` 确认裁决未变。
2. P0–P5 已全部完成（P4 源码树 + D10.6 已知限制）；当前按新批准计划 `C:\Users\Giant\.workbuddy-ai\plans\radiant-cascade-newton-e440_pIP.md` 执行 Part B：B1+B2（validate 第 11 节）→ B3（Skill 角色契约）→ B4（review_gate.py）→ B5（学习反馈闭环，含用户授权的前端 UI）。
3. 每阶段结束跑 `python tools/build_site.py && python tools/validate_site.py`，要求 0 FAIL / 0 WARN；P2 起额外跑 `python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md`。
4. B5 改前端后额外做离线站浏览器 QA（file:// 与 http://localhost:8765 两路）。
5. 不 commit / push / 远程发布，除非用户明确授权；不碰 `.workbuddy-ai/memory/**`；执行结果写入 `CHANGELOG.md` 与本文件。
