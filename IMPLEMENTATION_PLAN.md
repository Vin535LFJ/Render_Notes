# 实施计划（精简版）

> 完整计划见 `.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md`（已获用户批准）。本文件是仓库内的执行索引，随阶段推进更新勾选状态。

**口径**：增量补齐真正缺口；离线 `web/` 与在线 VitePress 两套并存；不重建、不覆盖已有成果。详见 `DECISIONS.md`。

---

## P0 护栏与基线 ✅/🔄

- [x] 复核两份方案，确认旧快照与重复项
- [x] 用户裁决：增量补齐 + 两套并存
- [x] 基线 build + validate：0 FAIL
- [x] `DECISIONS.md` / `WORKFLOW_STATE.md` / 本文件

## P1 证据层 + 知识模型 ✅

- [x] `evidence/README.md` + `claim-ledger.json` + `source-registry.json`
- [x] `knowledge-model/README.md` + `concepts.json` + `taxonomy.json`
- [x] `tools/validate_site.py` 扩展 claim/source/concept 校验
- [x] Skill 新增 `references/evidence-and-claims.md`
- [x] 门禁：0 FAIL

## P2 正式课程闭环（优先）✅

- [x] `courses/video-rendering-journey/` 目录骨架（README/course.json/curriculum/review-report）
- [x] 5 篇教学版样章 + 5 份 quiz + labs 链接映射
- [x] `build_site.py` 增加 `strip_frontmatter()`
- [x] Skill 新增 `assets/lesson-template.md`、`references/quiz-design.md`
- [x] 双门禁：validate 0 FAIL + `check_chapter_arc.py` 全 OK + 浏览器验证

## P3 五个交互 demo ✅

- [x] `tools/labs.json` 新增 yuv-rgb / stride / pts-dts / video-pipeline / rendergraph（实际 4 个新 lab，共 7 个）
- [x] `web/assets/app.js` renderer + type 分支
- [x] `web/assets/styles.css` 样式
- [x] `KNOWN_LAB_TYPES` 扩展（7 种）
- [x] 浏览器实测：交互、selfTest、主题、移动端

## P4 VitePress 并存 🔄（源码树完成；build 受阻按 D10.6 如实记录）

- [x] `site-vitepress/{package.json,README.md,.vitepress/config.mjs}`
- [x] `tools/build_vitepress_content.py` 同源生成（stdlib-only）
- [x] `.gitignore` 追加生成物
- [ ] 本地 `npm run docs:build`：**被权限系统阻止**（vitepress 清理自身 `.vitepress/.temp/` 触发删除请求，用户拒绝并选择跳过）；npm install 成功、源码树与生成文档保留，不伪造构建成功（D10.6）。不远程发布。

## P5 收尾验收 ✅

- [x] `review-report.md` 人工评分框架（AI 不自评通过；自动检查已填实测值）
- [x] `WORKFLOW_STATE.md` 收口
- [x] 最终浏览器 QA 清单（file:// 与 http 两路全绿，详见 CHANGELOG.md）
- [x] 最终 validate 0 FAIL；未 commit/push

## Part B 文档缺口增量补齐 ✅（新批准计划 radiant-cascade-newton-e440）

- [x] B1+B2 `validate_site.py` 第 11 节：孤立断言 / quiz-checkpoint-claim 覆盖 / feedback 引用（11 checks，0 FAIL）
- [x] B3 现有 Skill 补 Practice Designer + Publisher/Feedback Analyst 角色契约（不建顶层 skills/）
- [x] B4 `tools/review_gate.py` 只读前置清单（G1/G2/G3 待人工）
- [x] B5 学习反馈闭环：`feedback.json` + `report_feedback.py` + 离线前端 UI（localStorage + JSON 导出，用户授权偏离 D04，无远程）

---

## 硬门槛（每阶段结束）

```
python tools/build_site.py
python tools/validate_site.py        # 必须 0 FAIL
python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md   # P2 起
```

## 绝对不动

`archive/**` · `.workbuddy-ai/memory/**` · 两份方案文档 · `web/vendor/**` · `web/index.html`

> 例外（2026-11-18 用户新授权）：`README.md` 的 3 行 chat 链接改动按用户明确要求一并纳入本次 git 提交（见 `DECISIONS.md` D09 更新）；此为一次性授权，不改变其余"绝对不动"项。
