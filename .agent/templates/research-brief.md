---
doc_id: TPL-RESEARCH-BRIEF
type: template
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 调研简报（Research Brief）

> 一手来源优先；每条断言可回溯到来源；**调研产物不等于已批准知识**。
> 无来源的断言标 open，不写 verified；AI 不私自升级 claim 状态。

## 元信息

- **question-id**：RES-____
- **问题**：
- **scope**（in / out）：
- **owner / status / date**：

## 1. Question

要回答的具体问题，不是宽泛主题。

## 2. Sources（primary sources only）

| source-id | 类型（官方文档 / 源码 / spec / first-party API） | 位置（URL / 路径 / commit） | 可信度与限制 |
|---|---|---|---|

二手解读只能作为线索，不作为断言依据。

## 3. Findings / claim table

| claim-id | 断言（一句话） | source-id + 定位 | 状态（verified / conditional / open） | 反例或不确定性 |
|---|---|---|---|---|

## 4. Boundaries

- 未覆盖的问题：
- 与既有知识的冲突（路径 / doc_id / claim-id）：
- 需要人确认的解释性判断：

## 5. Handoff

- 如何进入项目知识层（先变更提案 / KCR / 证据层登记，按项目顺序写）：
- 受影响的下游（术语 / 概念 / 断言 / 课程 / 测验 / 站点）：
- 下一步票（ticket-id）：

## 6. Completion criteria

- [ ] 每条 claim 有 source-id 与状态
- [ ] 每个来源是一手资料，或明确标注为线索
- [ ] 没有把 open claim 写成事实
- [ ] handoff 路径明确，未自批升级

> 本项目落点：实例放 `.agent/plans/research-<topic>.md`；进入知识库前走 `reviews/KNOWLEDGE_CHANGE_REVIEW.md`。
