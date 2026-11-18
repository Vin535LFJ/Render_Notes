# Workflow details

## The five role contracts

### 1. Research Agent (调研阶段)

**Input**: a topic or a pile of mixed material (articles, papers, official docs, notes, competitor pages).

**Actions**: web search, paper lookup, official documentation reading, competitor comparison, information cross-check. For every claim that will become a teaching point, find at least one primary or authoritative source.

**Output** `research-report.md`:
- Topic scope and what is explicitly out of scope
- Key findings, each with a source URL and a confidence note (verified / single-source / contested)
- Competing viewpoints and why they differ
- Open questions that research could not settle
- Bibliography with links

**Gate**: no finding lacks a source; contested claims are marked, not smoothed over.

### 2. Knowledge Architect (知识整理阶段)

**Actions**: extract atomic knowledge points, build concept relations (prerequisite / contrasts-with / part-of / example-of), deduplicate, detect contradictions.

**Output**:
- Knowledge tree (concept dependency structure, NOT source folder mirror)
- Concept index (term → canonical definition → where it appears)
- Topic KB (merged, contradiction-free knowledge base)

**Gate**: every node has at least one edge; duplicates merged; contradictions either resolved with evidence or recorded as open.

### 3. Documentation Writer (文档编写阶段)

**Actions**: write technical docs, architecture docs, operation manuals, reference manuals from the knowledge tree.

**Output**: Markdown / DOCX / PDF depending on target.

**Gate**: every doc answers "what question does this answer" and names prerequisites; code examples are runnable; cross-links resolve.

### 4. Learning Designer (教学设计阶段) — the differentiating phase

**Actions**: plan the learning path, set prerequisites and knowledge goals, order chapters, design practice. Critically, **re-design the sequence by human understanding**, not by source material order.

**Output**: system learning manual, course outline, practice tutorials.

**Chapter arc** (each chapter must have all five):
1. Hook — a question or problem that creates a need to know
2. Prerequisite — what the learner must already have
3. Concepts — minimal dependency-ordered set that resolves the hook
4. Bridge — explicit link to previous and next chapter
5. Practice — a build or explain task

**Gate**: running `scripts/check_chapter_arc.py` on each chapter passes; titles read as questions/themes, not folder labels.

### 5. Knowledge Reviewer (质量审核阶段)

**Actions**: check factual support, citation accuracy, knowledge gaps, chapter continuity, tutorial operability.

**Output**: revision list with severity blocker / major / minor, then final corrected docs.

**Gate**: no blocker-level items remain; project validation passes (in Render_Notes: `python tools/validate_site.py`).

## Worked example: from flat taxonomy to AI exploration journey

**Input material**: a batch of AI articles, papers, tech docs, and scattered notes.

**Naive output (classification, not learning):**
```
AI 知识库
├── 大语言模型
├── Agent
├── RAG
├── 多模态
├── Transformer
└── 强化学习
```

**Target output (learning journey):**
```
AI 探索之旅：从机器如何学习到智能体如何思考
第一篇章：机器是如何学会思考的？
├── 从一个有趣的问题开始
├── 什么是机器学习？
├── 神经网络如何模仿学习？
└── 实践：训练一个简单的分类器
第二篇章：为什么大语言模型突然变得聪明？
├── 从预测下一个词开始
├── Transformer 的诞生
├── 注意力机制到底在做什么？
├── GPT 是如何训练出来的？
└── 实践：亲手理解一个迷你语言模型
第三篇章：AI 如何拥有工具和行动能力？
├── 从聊天机器人到 Agent
├── 工具调用
├── 记忆与规划
├── 多 Agent 协作
└── 实践：构建一个自己的 AI Agent
第四篇章：AI 的边界在哪里？
├── 世界模型
├── 多模态理解
├── 具身智能
└── 未来研究方向
```

**Why this works**: each chapter opens with a question a human actually asks, concepts are ordered by dependency, and each chapter ends with a practice. The learner always knows why the next concept is coming.

## Narrative arc patterns

- **Mystery arc**: "Why did X suddenly work?" → build the mechanism → reveal. Good for paradigm shifts (Transformer, PBR).
- **Journey arc**: "Start from a concrete problem" → progressively add capability → end with a working system. Good for engineering stacks.
- **Boundary arc**: "Here is what the tool can do" → "here is where it breaks" → "what lies beyond". Good for closing a chapter or a whole journey.
- **Bridge sentence template**: "上一章我们把 X 解决了；但一旦需要 Y，X 就不够了——这一章引入 Z。" This is precisely the kind of sentence missing when learners complain a term appeared "out of nowhere".

## Anti-patterns

- Copying the source folder tree as the table of contents.
- Introducing a term before its motivating problem (causes "莫名引入" complaints).
- Chapter titles that are nouns rather than questions/themes.
- Practices that only read, not build or explain.
- Treating research, structuring, writing, teaching, and reviewing as one undifferentiated step — each role has a distinct gate for a reason.
