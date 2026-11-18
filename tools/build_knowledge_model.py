#!/usr/bin/env python3
"""Generate knowledge-model/taxonomy.json from glossary.json + concept layer map.

Stdlib only. The knowledge model keeps definitions in glossary.json as the single
source of truth; this file is a derived, human-browsable category view.
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOSSARY = ROOT / "tools" / "glossary.json"
CONCEPTS = ROOT / "knowledge-model" / "concepts.json"
OUTPUT = ROOT / "knowledge-model" / "taxonomy.json"

# Same category mapping as build_site.py, kept in sync by the validator.
CATEGORY_BY_GROUP = {
    "explicit-api": "api",
    "android-av": "api",
    "pipeline-resources": "api",
    "gpu-hardware": "algorithm",
    "culling-aa": "algorithm",
    "color-compression": "algorithm",
    "math-geometry": "concept",
    "sync-scheduling": "concept",
    "automotive": "topic",
    "procedural-graphics": "topic",
    "pbr-material": "topic",
}
CATEGORY_LABELS = {
    "api": "图形 / 媒体 API",
    "algorithm": "渲染 / 图像算法",
    "concept": "核心概念",
    "topic": "工程主题",
}


def main() -> None:
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    concepts = json.loads(CONCEPTS.read_text(encoding="utf-8")) if CONCEPTS.exists() else {"concepts": []}

    term_to_category: dict[str, str] = {}
    term_to_group: dict[str, str] = {}
    for group in glossary.get("groups", []):
        category = CATEGORY_BY_GROUP.get(group.get("id", ""), "concept")
        for term in group.get("terms", []):
            name = term.get("name", "")
            if not name:
                continue
            term_to_category[name] = category
            term_to_group[name] = group.get("label", "")

    by_category: dict[str, list] = defaultdict(list)
    for concept in concepts.get("concepts", []):
        term = concept.get("glossary_term", "")
        category = term_to_category.get(term, "concept")
        by_category[category].append({
            "id": concept.get("id"),
            "name": concept.get("name"),
            "layer": concept.get("layer"),
            "group": term_to_group.get(term, ""),
            "route": concept.get("route", ""),
        })

    order = ["api", "algorithm", "concept", "topic"]
    payload = {
        "version": "1.0",
        "generatedAt": date.today().isoformat(),
        "note": "Generated from tools/glossary.json + knowledge-model/concepts.json. Do not edit by hand.",
        "categories": [
            {"id": key, "label": CATEGORY_LABELS[key], "concepts": by_category[key]}
            for key in order if by_category[key]
        ],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print("  " + ", ".join(f"{c['id']}={len(c['concepts'])}" for c in payload["categories"]))


if __name__ == "__main__":
    main()
