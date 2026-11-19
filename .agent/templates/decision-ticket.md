---
doc_id: TPL-DECISION-TICKET
type: template
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 决策票（Decision Ticket）

> 一票只解决一个决策。AI 可以准备证据和选项；**HITL 票的裁决栏不得由 AI 填写**。
> 每个工作 session 最多解决一票（研究票除外）；动手前先 claim。

## 元信息

- **ticket-id**：DEC-____
- **destination**（这张票服务于哪个更大目标）：
- **type**：HITL / AFK
- **status**：open / blocked / claimed / resolved / out_of_scope
- **claim**（谁在处理）：
- **blocked_by**（先解决的 ticket-id）：
- **关联 ADR / 决策记录**（resolved 后回填）：

## 1. Question

只写一个需要决定的问题，控制在能用一句话说清的粒度。

## 2. Context（最小必要背景）

- 事实与约束：
- 证据（路径 / 行号 / 命令输出 / commit / ADR）：

## 3. Options and tradeoffs

| 选项 | 收益 | 代价 / 风险 | 前置条件 |
|---|---|---|---|
| | | | |

## 4. Resolution（HITL 由人填写；AFK 由 agent 填写并附证据）

- [ ] 批准 · [ ] 驳回 · [ ] 补充研究 · [ ] 修改范围 · [ ] 暂缓
- **决定**：
- **裁决人 / 日期**：
- **生效范围**（是否可延续、授权边界）：
- **后续动作**（谁 / 何时 / 验收条件）：

## 5. Fog / 未决边界

现在说不清、但可能影响路线的问题记在这里；**不要预先切成票**。等前面的票解决后再升级。

## 6. Completion criteria

- [ ] 问题已由有权者回答，写明依据
- [ ] 关联文档与状态文档已同步
- [ ] 后续票已创建，或明确标记 out_of_scope

> 本项目落点：实例放 `reviews/decision-kit/<ticket-id>.md`；HITL 裁决栏留空，等待人工填写。
