#!/usr/bin/env python3
"""Aggregate local learner feedback into a 'needs review' hint list.

READ-ONLY: this tool never modifies claim-ledger.json, lessons, or any source.
It prints hints only; a human must review before any state change. Stdlib only.
Input: tools/feedback.json (entries exported from the offline site's feedback UI).
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FEEDBACK = ROOT / "tools" / "feedback.json"
LEDGER = ROOT / "evidence" / "claim-ledger.json"


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"cannot read {path.relative_to(ROOT)}: {exc}")
        return None


def main() -> None:
    fb = load(FEEDBACK)
    if fb is None:
        return
    entries = fb.get("entries", []) or []
    print(f"feedback entries: {len(entries)}")
    if not entries:
        print("(empty) no hints; export feedback from the offline site and paste entries into tools/feedback.json")
        return

    by_type = Counter(e.get("type", "<none>") for e in entries)
    by_lesson: Counter = Counter(e.get("lesson") or "<none>" for e in entries)
    by_claim: Counter = Counter()
    for e in entries:
        for cl in e.get("claim_ids", []) or []:
            by_claim[cl] += 1

    print(f"by type: {dict(by_type)}")
    print(f"by lesson: {dict(by_lesson)}")

    # Cross-reference with the claim ledger to attach human-readable claim text.
    ledger = load(LEDGER) or {}
    claim_text = {c.get("id"): c.get("claim", "") for c in ledger.get("claims", [])}

    # Hints = confusion/gap entries (rating is informational), ranked by count.
    hint_entries = [e for e in entries if e.get("type") in {"confusion", "gap"}]
    print()
    print("=== needs-review hints (confusion / gap), ranked by claim ===")
    if not hint_entries:
        print("  none")
    else:
        ranked = by_claim.most_common()
        for cl, n in ranked:
            print(f"  {cl}  x{n}  {claim_text.get(cl, '(unknown claim)')[:60]}")

    print()
    print("=== entries detail ===")
    for i, e in enumerate(entries):
        print(
            f"  [{i}] type={e.get('type')} lesson={e.get('lesson') or '-'} "
            f"quiz={e.get('quiz') or '-'} claims={e.get('claim_ids') or []} "
            f"ts={e.get('ts') or '-'}"
        )
        note = str(e.get("note", "")).strip().replace("\n", " ")
        if note:
            print(f"       note: {note[:120]}")
    print()
    print("提示：以上只是人工复核线索；本工具不修改任何断言状态或课程内容。")


if __name__ == "__main__":
    main()
