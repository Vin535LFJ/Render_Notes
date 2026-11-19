---
doc_id: TPL-HUMAN-QUESTIONNAIRE
type: template
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 人工问卷（Human Questionnaire）

> 当答案在别人脑子里时，把"无法独自回答的问题"变成可异步填写的文档。
> 关键：**先 grill 发送，再写问题**——只问用户能回答的"发给谁、要带回什么"，不要替收件人设答案。

## 1. 发送对象（先问用户）

- recipient 的角色 / 专长 / 与用户的关系：
- 对方掌握而用户缺失的知识：
- 由此决定的语气与需要携带的 context：

## 2. 需要带回什么（再问用户）

- 用户最终必须能做什么或决定什么：
- 具体 fact / decision 清单：

## 3. 问卷正文（复制这一段作为实例）

```markdown
# <问卷标题>

**Purpose:** 这份问卷为什么存在，关系到哪项决策
**From:** <用户>，**To:** <recipient>，**How your answers will be used:** <答案用在哪里>

## Context
（一段话建立背景，足以让对方认真回答，不超过一页）

## How to answer
deadline / 预计耗时；部分回答和"我不知道"也有价值；不确定请标注而不是跳过。

## <主题一>
### <一个问题，只包含一个 idea>
_Why this matters: 只在可能被误解或敷衍时写。_
>

## Anything else?
还有哪些我们没问、但应该知道的内容？
```

## 4. Completion criteria

- [ ] 步骤 2 列出的每一项都有对应问题
- [ ] 每个问题只含一个 idea，正下方有答案栏
- [ ] 问题按重要性降序，按主题分组
- [ ] 说明了 deadline、预计耗时与答案用途

> 本项目落点：G1 / G2 审核请求或 B15 研究立项需要外部知识时，复制骨架到 `reviews/`。
