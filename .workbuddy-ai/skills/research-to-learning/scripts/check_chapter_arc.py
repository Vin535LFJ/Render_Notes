#!/usr/bin/env python3
"""Check that a chapter markdown file contains the five arc elements.

Usage: python check_chapter_arc.py <chapter.md> [more.md ...]

Exit 0 when every chapter has all five elements, 1 otherwise. Stdlib only.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# Each element is matched against headings (## ... ) or explicit marker lines.
ELEMENTS = {
    "hook": (r"问题钩子|从一个有趣的问题|为什么|开场|本章回答|一个问题", "hook / compelling question"),
    "prerequisite": (r"前置知识|前置|先读|前提", "prerequisite"),
    "concepts": (r"核心概念|概念|原理|直观认识", "concepts"),
    "bridge": (r"通往下一章|本章.*下一章|桥|承上启下", "bridge to next chapter"),
    "practice": (r"实践|动手|练习|试着|实验", "practice"),
}


def check(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    # Consider headings and blockquote marker lines, where the arc lives.
    lines = [ln for ln in text.splitlines() if ln.startswith("#") or ln.startswith(">")]
    head = "\n".join(lines)
    missing = []
    for key, (pattern, label) in ELEMENTS.items():
        if not re.search(pattern, head, re.IGNORECASE):
            missing.append(label)
    return missing


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("usage: check_chapter_arc.py <chapter.md> [more.md ...]")
        return 2
    failed = 0
    for raw in args:
        path = Path(raw)
        if not path.exists():
            print(f"MISSING FILE  {raw}")
            failed += 1
            continue
        missing = check(path)
        if missing:
            print(f"FAIL  {raw}: missing {', '.join(missing)}")
            failed += 1
        else:
            print(f"OK    {raw}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
