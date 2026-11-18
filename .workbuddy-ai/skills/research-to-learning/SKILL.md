---
name: research-to-learning
description: Transform scattered research material (articles, papers, docs, notes) into a coherent, story-driven learning system. Use when asked to "turn research into a course", "build a learning path from these docs", "organize notes into a learning journey", or when a knowledge base feels like a flat taxonomy rather than a teachable sequence. Runs a five-phase workflow with mapped specialist roles (Evidence Analyst, Curriculum Designer, Story Architect, Practice Designer, Knowledge Publisher / Feedback Analyst). Outputs a research report, evidence ledger, knowledge model, docs, a chaptered learning path with hooks and practice, quizzes, a local feedback loop, and a review report.
agent_created: true
---

# Research to Learning

## Purpose

Convert a pile of research material into a learning system organized by **how humans understand a subject**, not by the source material's own folder structure. A flat taxonomy ("LLM / Agent / RAG / Multimodal") is classification, not learning. The target output is a narrative journey: each chapter opens with a compelling question, builds concepts in dependency order, and ends with a hands-on practice.

Use this skill when a request involves turning research into teaching material, designing a course or learning path, or restructuring an existing knowledge base that "has all the information but doesn't flow".

Read `references/workflow-details.md` for the full five-role contracts, output schemas, and the "narrative arc" patterns. Read `references/evidence-and-claims.md` before adding claims or verification statuses; read `references/quiz-design.md` before writing assessments; read `references/practice-and-review.md` before designing labs/quizzes, running review gates, or touching the feedback loop.

## Core principle

**Design the path by the learner's cognition, not the source's taxonomy.** Every chapter must answer: Why should the learner care now? What must they already know? What can they do at the end that they could not before? If a chapter cannot answer these, it is a category label, not a lesson.

## Five-phase workflow

Execute in order. Each phase has a named role, an input, an output, and a gate before the next phase.

| Phase | Role | Output | Gate |
|---|---|---|---|
| 1 | Research Agent | `research-report.md` + source list + reference list | Sources credible and cross-checked; contradictions flagged |
| 1b | Evidence Analyst (mapped) | `evidence/claim-ledger.json` + `source-registry.json` | Every claim traceable; AI content never auto-verified |
| 2 | Knowledge Architect | `knowledge-model/concepts.json` + taxonomy + concept index | Concepts deduplicated; relations explicit; glossary terms resolve |
| 3 | Documentation Writer | Markdown / DOCX / PDF docs | Docs accurate to knowledge tree; examples runnable |
| 4 | Learning Designer (incl. Curriculum + Story roles) | learning path + `courses/*/curriculum.md` + lessons + quizzes | Chapters form a narrative arc; each has prerequisite, goal, hook, practice |
| 4b | Practice Designer (mapped) | `courses/*/quizzes/<L##>.json` + lab bindings | Checkpoints covered; quiz claims ⊆ lesson claims; lab renderer exists |
| 5 | Knowledge Reviewer | revision notes + final docs + `review-report.md` | Facts cited; chapters coherent; tutorials operable; human score ≥85 |
| 5b | Knowledge Publisher / Feedback Analyst (mapped) | curated site content + `tools/report_feedback.py` output + gate status | Human gates G1/G2/G3 only; no score by AI; no remote publish (D09) |

Do not skip the gate checks. A phase whose gate fails must be redone before proceeding.

### Phase 1 · Research Agent

Search the web, retrieve papers, read official docs, compare alternatives, cross-check claims. Produce `research-report.md` with: topic scope, key findings with source URLs, competing viewpoints, open questions, and a bibliography. Never present an unverified claim as settled fact; mark it with a confidence note.

### Phase 2 · Knowledge Architect

Extract atomic knowledge points, build a concept graph (nodes + prerequisite edges), merge duplicates, and resolve or record contradictions. Produce a knowledge tree and a concept index. The tree is a **concept dependency structure**, not a copy of source folders.

### Phase 3 · Documentation Writer

Write docs from the knowledge tree, not from the source material order. Each doc states its prerequisite concepts and the question it answers. Use the project's existing doc conventions (frontmatter, cross-links, verification markers) when a target repo provides them.

### Phase 4 · Learning Designer

This is the differentiating phase. Re-sequence the material into a **narrative journey** of 3–6 chapters. Each chapter follows this arc:

1. **A hook** — a surprising question or concrete problem ("Why did language models suddenly get smart?").
2. **Concepts in dependency order** — smallest set needed to resolve the hook.
3. **A bridge** — explicit sentence connecting this chapter to the previous one and the next.
4. **A practice** — something the learner builds or explains.

Chapter titles should read like a story ("机器是如何学会思考的？"), not a folder ("机器学习基础"). See `assets/chapter-template.md` for a copyable skeleton.

### Phase 5 · Knowledge Reviewer

Audit: factual support and citations, terminology consistency, chapter continuity, prerequisite ordering, and whether every practice is actually doable. Produce a revision list with severity (blocker / major / minor), apply fixes, then re-run the project's validation if one exists (for this repo: `python tools/validate_site.py`).

## Helpers

- `assets/chapter-template.md` — skeleton for a story-driven chapter.
- `assets/lesson-template.md` — teaching-version lesson skeleton (frontmatter + 12 sections).
- `references/workflow-details.md` — detailed role contracts, output schemas, narrative patterns, and anti-patterns.
- `references/evidence-and-claims.md` — claim ledger schema, status mapping, and the "never auto-verify AI output" rule.
- `references/quiz-design.md` — how to derive assessments from prerequisites, checkpoints and claim IDs.
- `references/practice-and-review.md` — Practice Designer and Publisher/Feedback Analyst contracts, the G1/G2/G3 human-gate checklist, and the local feedback loop.
- `scripts/check_chapter_arc.py` — deterministic check that a chapter file contains a hook, prerequisite, concepts, bridge, and practice section.

## Quality gates in Render_Notes

Two deterministic gates must both pass; neither substitutes for human review.

```bash
python tools/build_site.py
python tools/validate_site.py
python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md
```

Repo conventions (see `DECISIONS.md` at the repo root): machine-readable artifacts are JSON; definitions stay in `tools/glossary.json`; do not copy knowledge text into the evidence/model/course layers; never mark AI-generated content as verified.

## Output contract

Always deliver, in this order: research report → knowledge tree/index → docs → learning path with chapters → review report. Name the concrete files created and state which validation was run and its result.
