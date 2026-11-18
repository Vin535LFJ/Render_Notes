#!/usr/bin/env python3
"""Print automatic preconditions for the three human review gates (G1/G2/G3).

READ-ONLY. This tool never writes a score, never ticks a gate, never declares a
verdict. It only assembles factual inputs so a human reviewer can do G1/G2/G3.
Stdlib only. Run from anywhere; paths are resolved relative to the repo root.

Exit code is always 0 unless a source file cannot be read at all.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "evidence" / "claim-ledger.json"
COURSE = ROOT / "courses" / "video-rendering-journey" / "course.json"
CURRICULUM = ROOT / "courses" / "video-rendering-journey" / "curriculum.md"
REVIEW = ROOT / "courses" / "video-rendering-journey" / "review-report.md"


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        print(f"  (unreadable) {path.relative_to(ROOT)}: {exc}")
        return None


def heading(text: str) -> None:
    print()
    print("=" * 64)
    print(text)
    print("=" * 64)


heading("G1 · 研究范围审核 — 自动前置条件（人工判定）")
ledger = load(LEDGER)
if ledger is not None:
    claims = ledger.get("claims", []) or []
    statuses = Counter((c.get("verification") or {}).get("status", "<none>") for c in claims)
    types = Counter(c.get("claim_type", "<none>") for c in claims)
    print(f"  claim 总数: {len(claims)}")
    print(f"  verification.status 分布: {dict(statuses)}")
    print(f"  claim_type 分布: {dict(types)}")
    bad = [
        c.get("id")
        for c in claims
        if c.get("claim_type") in {"conditional", "contested"}
        and (c.get("verification") or {}).get("status") == "verified"
    ]
    print(f"  conditional/contested 被标为 verified 的 claim: {bad if bad else '无'}")
    orphan = [c.get("id") for c in claims if not (c.get("used_by_lessons") or [])]
    print(f"  未挂载任何课程的 claim（open/conditional 可预期）: {orphan if orphan else '无'}")
    print("  → 人员需人工确认：来源是否权威、状态是否正确、条件是否如实标注。")
else:
    print("  → 无法读取 claim-ledger.json，G1 前置条件不可用。")

heading("G2 · 课程大纲审核 — 自动前置条件（人工判定，最重要）")
curriculum = CURRICULUM.read_text(encoding="utf-8") if CURRICULUM.exists() else ""
needed = {
    "适合的学习者": "目标学习者",
    "学习前提": "学习前提",
    "最终学习目标": "最终目标",
    "完成后的能力": "结课能力",
    "学习路线": "学习路线",
    "实践项目": "实践项目",
    "考核方式": "考核方式",
}
if curriculum:
    present = [label for kw, label in needed.items() if kw in curriculum]
    missing = [label for kw, label in needed.items() if kw not in curriculum]
    print(f"  curriculum.md 关键段落存在: {len(present)}/{len(needed)}")
    print(f"  已找到: {present}")
    if missing:
        print(f"  缺失: {missing}")
else:
    print("  → 无法读取 curriculum.md。")
pc = load(COURSE)
if pc is not None:
    lessons = pc.get("lessons", []) or []
    print(f"  课程课时数: {len(lessons)}")
    print("  每课时前置/目标/checkpoint 概况:")
    for l in lessons:
        print(
            f"    {l.get('id')}: prerequisites={len(l.get('prerequisites') or [])} "
            f"objectives={len(l.get('objectives') or [])} "
            f"checkpoint={len(l.get('checkpoint') or [])}"
        )
print("  → 人员需人工确认：路线是否符合认知依赖、目标与考核是否合理。")

heading("G3 · 最终发布审核 — 自动前置条件（人工判定）")
print("  确定性门禁（需另行执行，本工具不运行）:")
print("    python tools/build_site.py")
print("    python tools/validate_site.py            # 目标 0 FAIL / 0 WARN")
print("    python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md")
print("  浏览器 QA: file:// 双击 与 http://localhost:8765 两路全绿、7 实验可交互。")
review = REVIEW.read_text(encoding="utf-8") if REVIEW.exists() else ""
if review:
    pending = "待人工" in review
    unchecked = len(re.findall(r"- \[ \] G[123]", review))
    print(f"  review-report.md：评分仍待人工 = {'是' if pending else '未检测到'}；未勾选人工关卡 = {unchecked}")
    print("  → 本工具不填写、不修改 review-report.md 的任何分数或结论。")
print("  → 人员需人工评分 25/25/20/20/10，总分 ≥85 且前两项各 ≥80%；本计划不发布（D09）。")

print()
print("提示：本输出仅为自动前置条件，不构成通过判定；G1/G2/G3 必须由人工确认。")
