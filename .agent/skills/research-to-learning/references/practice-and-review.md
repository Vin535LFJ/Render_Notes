# Practice design and review gates (Render_Notes extension)

This reference defines the two contracts that complete the proposal's specialist roles without creating a parallel skill tree: **Practice Designer** and **Knowledge Publisher / Feedback Analyst**. Both are mapped onto the existing five-phase workflow in `workflow-details.md`.

## Practice Designer contract

Turns "the learner read it" into "the learner can do it".

### Inputs
- A lesson's `checkpoint` list from `courses/*/course.json` (each entry is a question string).
- The lesson's declared `claims[]` from its frontmatter.
- The available lab inventory in `tools/labs.json`.

### Outputs
- `courses/<course>/quizzes/<L##>.json` — one file per pilot lesson, questions carrying `claim_ids[]`.
- A lab binding: the lesson frontmatter `lab` field, and (when new) an entry in `tools/labs.json` with a renderer type known to `KNOWN_LAB_TYPES`.

### Rules
1. Every checkpoint question must be covered by a quiz prompt (text normalized; substring match either direction).
2. Every quiz question's `claim_ids[]` must be a subset of the lesson's declared `claims[]`.
3. Never invent a claim id to make a question look traceable. If a checkpoint has no supporting claim, add a claim to `evidence/claim-ledger.json` at `status: open` instead.
4. Prefer a manipulable lab over a read-only explanation; link with `#/lab/<id>`.
5. Answers must be checkable against a source document or a derivation, not asserted from memory.

### Verification
```
python tools/validate_site.py     # sections 10 and 11 enforce 1-3
python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md
```
Require 0 FAIL / 0 WARN. A FAIL means fix the source JSON or lesson frontmatter, never delete the check.

## Review-gate checklist (G1 / G2 / G3)

Three human-owned gates. The generating agent may fill in **factual auto-check results only**; it must never write a score or a "pass" verdict. `tools/review_gate.py` prints the automatic preconditions for each gate; it does not decide them.

### G1 — research scope (after evidence layer)
- [ ] Claim ledger sources are authoritative and correctly typed.
- [ ] `conditional` / `open` claims have not been silently upgraded to `verified`.
- [ ] Contradictions are recorded with conditions, not hidden.
- Auto precondition: claim id uniqueness + two-way source index (validate §8), orphan-assertion check (§11).

### G2 — course outline (most important; after curriculum)
- [ ] Target learner, prerequisites, final capabilities, scope, route, practice project, and assessment are all stated.
- [ ] Chapter ordering follows concept dependency, not the source folder tree.
- [ ] Each chapter opens with a question and closes with a bridge + practice.
- Auto precondition: course/prerequisite integrity (validate §3), chapter arcs (`check_chapter_arc.py`), quiz/checkpoint/claim coverage (validate §11).

### G3 — final release (P5; this repo records only, does not deploy)
- [ ] Human scoring 25 / 25 / 20 / 20 / 10, total ≥ 85, first two dimensions each ≥ 80%.
- [ ] Fact review and teaching review were done separately; no self-approval.
- [ ] Offline site `web/` passes both `file://` and `http://localhost` QA; 7 labs interactive.
- Auto precondition: all deterministic gates 0 FAIL / 0 WARN; browser QA no page errors.
- **No commit / push / remote publish without explicit authorization (D09).** VitePress `docs:build` remains an honestly-recorded known limitation (D10.6); do not fake success.

## Feedback loop (local only)

- Feedback is stored in the browser `localStorage` and exported by the user as JSON matching `tools/feedback.json` schema. There is no network request and no auto-upload.
- `tools/report_feedback.py` aggregates entries into a "needs review" hint list; it never changes a claim's status or a lesson's state.
- A hint becomes a change only after a human reviews it and an agent re-runs the full gate sequence.
- Fields: `lesson`, `quiz`, `claim_ids`, `type` (`confusion` | `gap` | `rating`), `note`, `ts`. No personal information.

## Anti-patterns
- Letting an agent tick a gate or write its own score.
- Treating a deterministic gate pass as equivalent to human review.
- Auto-promoting an `open` claim because feedback mentioned it.
- Adding a remote service or MCP connector "for feedback" — this repo's feedback loop is intentionally offline.
