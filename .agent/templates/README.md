---
doc_id: TPL-KIT-README
type: template
status: active
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# 通用智能体工作模板库（Universal Agent Template Kit）

> 从 `E:/AI-Tools` 的多套技能中**抽取模式**后重写，不是原文复制；不绑定特定工具链，可移植到其他项目。
> 位置：`.agent/templates/`。与既有 `agent-handoff.md`、`change-proposal.md` 并列使用，不替代项目既有流程。

## 1. 什么时候用哪个模板

| 场景 | 模板 | 抽取自 | 核心约束 |
|---|---|---|---|
| 一个决策卡住，需要有人拍板 | [`decision-ticket.md`](decision-ticket.md) | wayfinder + 人工审批政策 | 一票一决策；HITL 票 AI 不自答；先 claim 再动手 |
| 需要别人提供你不知道的知识 | [`human-questionnaire.md`](human-questionnaire.md) | to-questionnaire | 先问"发给谁、要带回什么"，再写问题 |
| 盘点 / 归档 / 收敛文档入口 | [`doc-audit.md`](doc-audit.md) | doc-governance | 判定必须给证据；数字现场重测；归档优先 |
| 调研要变成可追溯的断言 | [`research-brief.md`](research-brief.md) | research + 证据层纪律 | 一手来源优先；每条 claim 有 source 和状态 |
| 设计一节课或一个练习单元 | [`lesson-design-brief.md`](lesson-design-brief.md) | teach + scaffold-exercises + 门禁模式 | 一课一个可见成果；知识服务技能；反馈闭环 |
| 任务结束需要交接 | [`agent-handoff.md`](agent-handoff.md) | 项目既有模板 | 修改清单 + 实测门禁 + 遗留问题 |
| 准备改变范围或方案 | [`change-proposal.md`](change-proposal.md) | 项目既有模板 | 影响分析 + 人工裁决栏 |

## 2. 所有模板共用规则

1. **一个实例只解决一个主要问题**。可以并行研究，但同一组文件只有一个主要写入者。
2. **结论必须有证据**：路径 / 行号 / 命令输出 / commit / ADR / 取代者路径；"感觉过时"不算依据。
3. **HITL 与 AFK 显式标注**：需要人回答的，AI 只准备材料；未答复不视为同意。
4. **数字和状态现场重测**，生成物不手改；模板不制造第二套权威源，项目已有流程优先。
5. **模板是骨架**：按项目实际裁剪字段，裁掉的是字段名，不是上面五条规则。

## 3. 本项目落点（复制实例时的默认位置）

| 模板 | 实例位置 |
|---|---|
| decision-ticket | `reviews/decision-kit/<ticket-id>.md` |
| human-questionnaire | `reviews/` 下对应审核材料旁 |
| doc-audit | `.agent/changes/<change-id>/doc-audit.md` |
| research-brief | `.agent/plans/research-<topic>.md`，进入知识库前走 KCR |
| lesson-design-brief | 对应课程目录内；进入站点前跑项目既有门禁 |

## 4. 维护

新增或改动模板必须带 frontmatter（`type: template`、`status`、`owner`、`updated`），再运行 `py -3 tools/build_document_registry.py` 再生成注册表。注册表是生成物，不手改。
