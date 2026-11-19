---
doc_id: KCR-IMPACT-TOOL
type: kcr
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
---

# KCR 影响分析工具说明（tools/kcr_impact.py）

> 只读工具，2026-11-19 建立。对应 `reviews/KNOWLEDGE_CHANGE_REVIEW.md` 设计的 KCR 机制与 P8 生产化。

## 作用
输入一个 source / claim / 报告 / 断言草稿，输出 Source → Claim → Concept → Lesson → Quiz → Course → Website 的影响链 JSON，供人工裁决"新知识进入体系会影响什么"。

## 数据来源（全部只读）
- `evidence/source-registry.json`（source → claims）
- `evidence/claim-ledger.json`（claim → lessons、verification.status）
- `knowledge-model/concepts.json`（relations[].source_claim → concepts）
- `courses/video-rendering-journey/quizzes/*.json`（claim_ids → quizzes）
- `courses/video-rendering-journey/lessons/*.md` 的 frontmatter `claims`
- 两层 `course.json`（lesson → course）

## 用法（本机 py -3）
```
py -3 tools/kcr_impact.py --source-id SRC-RN-AV-BASE
py -3 tools/kcr_impact.py --claim-id V14 --out reviews/kcr/my-report.json
py -3 tools/kcr_impact.py --report reviews/CURRENT_AUDIT.md
py -3 tools/kcr_impact.py --claim-draft "新断言草稿"
```
默认输出到 `reviews/kcr/impact-report-<date>.json`（位于 reviews/ 内，依发布边界不进学习站）。

## 硬边界
- **只读**：不写任何源 JSON、正文、断言状态；不升级 claim；不过门禁。
- 冲突/缺口如实标注（未 verified 断言、quiz 引用但未挂接的课、无来源断言），不伪造。
- 输出是**审阅材料**，不是裁决。升级/应用需人工批准（G1/KCR）。

## 当前状态
`status: draft`；本轮只建工具与说明，未接入 validate 门禁（接入属人工裁决，避免改变现有 11 checks 口径）。
