# Evidence and claims

Guidance for the Evidence Analyst role and the machine-readable evidence layer in Render_Notes. Read this when adding claims, sources, or verification statuses.

## Where evidence lives

- `00-导航与索引/验真队列与术语表.md` — human-readable verification index (✅ / ⚠️ / ❗).
- `evidence/claim-ledger.json` — machine-readable claims with evidence, status and conditions.
- `evidence/source-registry.json` — source IDs referenced by claims.
- `knowledge-model/concepts.json` — relations may cite `source_claim` pointing back to a claim ID.

Definitions stay in `tools/glossary.json` and full explanations stay in the main docs. The evidence layer never copies knowledge text.

## Status mapping

| Human marker | `verification.status` | Meaning |
|---|---|---|
| ✅已验证 | `verified` | Authoritative source available |
| ⚠️有条件成立 | `conditional` | Holds only under stated conditions |
| ❗待验证 / ❓存疑 | `open` | Evidence missing or conflicted |

`confidence` (`high` / `medium` / `low`) is independent of `status`: a well-supported conditional claim can be `conditional` + `high`.

## Hard rules

1. **AI-generated content never starts at `verified`.** New claims default to `status: open`, `confidence: low`. Only a human reviewer may promote them after checking the source.
2. Every `evidence[].source_id` must exist in the source registry, and the source's `used_by_claims` must list the claim back.
3. `used_by_lessons` values must exist in `tools/course.json`.
4. Record `conditions` explicitly for conditional claims — "when does this stop being true" matters more than the claim itself.
5. Do not silently delete claims. To retire one, keep the ID and change status with a note.
6. Prefer primary sources: spec > official doc > paper > repo doc > derivation. Note the `evidence_type` so readers can judge weight.

## Adding a claim (procedure)

1. Search the existing ledger for the assertion; update rather than duplicate.
2. Find a source; add it to `source-registry.json` with type and access date. If the source is a repo doc, use `repo:<relative path>` as URL.
3. Append the claim with a one-sentence `claim`, correct `claim_type`, evidence array, status/confidence, conditions, `source_documents`, `used_by_lessons`.
4. Update the source's reverse index.
5. Run `python tools/build_site.py && python tools/validate_site.py` — must be 0 FAIL.

## Seeding principle used for Render_Notes

The initial ledger was seeded only from assertions already recorded in `验真队列与术语表.md` (V01–V12, C01–C07, P01–P06) and `概念引入说明.md` (E01–E04). Statuses were inherited, not invented. New research must follow the same discipline.
