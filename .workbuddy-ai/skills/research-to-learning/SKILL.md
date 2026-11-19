---
name: research-to-learning
description: Transform scattered research material (articles, papers, docs, notes) into a coherent, story-driven learning system. Use when asked to "turn research into a course", "build a learning path from these docs", "organize notes into a learning journey", or when a knowledge base feels like a flat taxonomy rather than a teachable sequence. Runs a five-phase workflow with mapped specialist roles (Evidence Analyst, Curriculum Designer, Story Architect, Practice Designer, Knowledge Publisher / Feedback Analyst). Outputs a research report, evidence ledger, knowledge model, docs, a chaptered learning path with hooks and practice, quizzes, a local feedback loop, and a review report.
agent_created: true
---

# Research to Learning（索引 stub）

> **2026-11-19 结构治理（D14）**：本技能文档正文已迁入统一智能体仓库 `.agent/skills/research-to-learning/`。本 stub 保留 frontmatter 以维持技能发现；详细内容请读：
> - 完整技能文档（五阶段工作流 / 角色契约 / 输出契约）：[`../../../.agent/skills/research-to-learning/SKILL.md`](../../../.agent/skills/research-to-learning/SKILL.md)
> - references（workflow-details / evidence-and-claims / quiz-design / practice-and-review / lesson-quality-standard）：[`../../../.agent/skills/research-to-learning/references/`](../../../.agent/skills/research-to-learning/references/)
> - assets（chapter / lesson 模板）：[`../../../.agent/skills/research-to-learning/assets/`](../../../.agent/skills/research-to-learning/assets/)

## 本目录保留

- `scripts/check_chapter_arc.py` — 章节弧线确定性校验（**不迁移**，门禁命令路径不变）：

  ```bash
  python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md
  ```

## 统一入口

智能体文档总索引与读写规则：[`.agent/README.md`](../../../.agent/README.md)
