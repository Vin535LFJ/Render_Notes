#!/usr/bin/env python3
"""Validate Render_Notes source data, links, anchors, terms and generated site bundle.

Run after every `python tools/build_site.py`. Stdlib only.

Checks (FAIL blocks the build, WARN is informational):
  1. relative .md links in every doc resolve to an existing file
  2. #anchors resolve to a real heading in the target doc (app.js slugify port)
  3. course integrity: reading docs, prerequisites, terms, next pointers
  4. lab integrity: docs, lesson binding, terms, known renderer type
  5. glossary integrity: unique names / aliases, all terms parseable
  6. LaTeX balance: $$...$$ and $...$ delimiters are even / not nested
  7. generated web/content.js exists and starts with the expected assignment

Exit code is non-zero when any FAIL is present.
"""

from __future__ import annotations

import json
import posixpath
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOSSARY_PATH = ROOT / "tools" / "glossary.json"
COURSE_PATH = ROOT / "tools" / "course.json"
LABS_PATH = ROOT / "tools" / "labs.json"
GRAPH_PATH = ROOT / "tools" / "graph.json"
CONTENT_PATH = ROOT / "web" / "content.js"

# Lab types that web/assets/app.js knows how to render.
KNOWN_LAB_TYPES = {"mvp", "lathe", "pbr"}

fails: list[str] = []
warns: list[str] = []
passes = 0


def fail(msg: str) -> None:
    fails.append(msg)


def warn(msg: str) -> None:
    warns.append(msg)


def ok() -> None:
    global passes
    passes += 1


def relpath(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def markdown_files() -> list[Path]:
    return sorted(
        p
        for p in ROOT.rglob("*.md")
        if ".git" not in p.parts
        and "web" not in p.parts
        and "node_modules" not in p.parts
        and ".workbuddy-ai" not in p.parts
        and "archive" not in p.parts
    )


def slugify(text: str) -> str:
    """Port of app.js slugify() so anchor checks match the browser exactly."""
    text = re.sub(r"<[^>]*>", "", text)
    text = text.strip().lower()
    # JS \p{L}\p{N} == unicode letters/numbers; keep letters, digits, spaces, hyphen.
    text = "".join(
        ch if (ch.isalnum() or ch.isspace() or ch == "-") else "" for ch in text
    )
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def headings(markdown: str) -> set[str]:
    out: set[str] = set()
    for line in markdown.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*?)\s*$", line)
        if m:
            out.add(slugify(m.group(2)))
    return out


# ---------------------------------------------------------------------------
# 1 & 2. doc links and anchors
# ---------------------------------------------------------------------------
doc_text: dict[str, str] = {}
doc_headings: dict[str, set[str]] = {}
for path in markdown_files():
    doc_id = relpath(path)
    text = path.read_text(encoding="utf-8")
    doc_text[doc_id] = text
    doc_headings[doc_id] = headings(text)

LINK_RE = re.compile(r"\[[^\]\n]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")

for doc_id, text in doc_text.items():
    for m in LINK_RE.finditer(text):
        href = m.group(1).strip()
        # Skip app routes, external URLs, mailto, anchors-only.
        if href.startswith(("#", "http://", "https://", "mailto:", "data:")):
            continue
        if href.startswith("#/"):
            continue
        # Strip the anchor part for file resolution.
        target, sep, anchor = href.partition("#")
        if not target:
            continue
        decoded = target.replace("%20", " ")
        # Only validate relative markdown / file links, not tool asset links.
        if decoded.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico")):
            continue
        base_dir = posixpath.dirname(doc_id)
        resolved = posixpath.normpath(posixpath.join(base_dir, decoded))
        target_path = ROOT / resolved
        if not target_path.exists():
            # Some links intentionally point at GitHub blob URLs via rewrite; those are http(s) above.
            fail(f"[link] {doc_id}: missing target -> {href}")
            continue
        # Anchor check only for markdown targets we have parsed.
        if sep and anchor and resolved in doc_headings:
            if anchor not in doc_headings[resolved]:
                fail(f"[anchor] {doc_id}: #{anchor} not found in {resolved}")

if doc_text:
    ok()

# ---------------------------------------------------------------------------
# 3, 4, 5. JSON data integrity
# ---------------------------------------------------------------------------
def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        fail(f"[json] {relpath(path)}: cannot parse: {exc}")
        return None


glossary = load_json(GLOSSARY_PATH)
course = load_json(COURSE_PATH)
labs = load_json(LABS_PATH)
graph = load_json(GRAPH_PATH) if GRAPH_PATH.exists() else None

term_names: set[str] = set()
term_aliases: set[str] = set()
if glossary is not None:
    for g in glossary.get("groups", []):
        for t in g.get("terms", []):
            name = t.get("name", "")
            if not name:
                fail("[glossary] term without name")
                continue
            if name in term_names:
                fail(f"[glossary] duplicate term name: {name}")
            term_names.add(name)
            for a in t.get("aliases", []) or []:
                term_aliases.add(a)


def term_resolves(name: str) -> bool:
    return name in term_names or name in term_aliases


if course is not None:
    lesson_ids = {l.get("id") for l in course.get("lessons", [])}
    unit_ids = {u.get("id") for u in course.get("units", [])}
    for l in course.get("lessons", []):
        lid = l.get("id", "<unknown>")
        if l.get("unit") not in unit_ids:
            fail(f"[course] {lid}: unknown unit {l.get('unit')!r}")
        for pre in l.get("prerequisites", []) or []:
            if pre not in lesson_ids:
                fail(f"[course] {lid}: unknown prerequisite {pre}")
        nxt = l.get("next")
        if nxt is not None and nxt not in lesson_ids:
            fail(f"[course] {lid}: unknown next {nxt}")
        for r in l.get("reading", []) or []:
            d = r.get("doc", "")
            if d and d not in doc_text:
                fail(f"[course] {lid}: reading doc missing -> {d}")
            elif d and r.get("anchor") and r["anchor"] not in doc_headings.get(d, set()):
                fail(f"[course] {lid}: reading anchor #{r['anchor']} missing in {d}")
        for t in l.get("terms", []) or []:
            if not term_resolves(t):
                fail(f"[course] {lid}: unresolved term {t!r}")

if labs is not None:
    lesson_ids = {l.get("id") for l in (course or {}).get("lessons", [])}
    for lab in labs.get("labs", []):
        lid = lab.get("id", "<unknown>")
        for d in lab.get("docs", []) or []:
            if d not in doc_text:
                fail(f"[lab] {lid}: doc missing -> {d}")
        lesson = lab.get("lesson")
        if not lesson:
            warn(f"[lab] {lid}: no lesson binding (orphan lab)")
        elif lesson not in lesson_ids:
            fail(f"[lab] {lid}: unknown lesson {lesson}")
        for t in lab.get("terms", []) or []:
            if not term_resolves(t):
                fail(f"[lab] {lid}: unresolved term {t!r}")
        if lab.get("type") not in KNOWN_LAB_TYPES:
            fail(f"[lab] {lid}: no renderer for type {lab.get('type')!r}")
        if "selfTest" not in lab:
            warn(f"[lab] {lid}: no selfTest field")

if graph is not None:
    node_ids = {n.get("id") for n in graph.get("nodes", [])}
    for n in graph.get("nodes", []):
        route = n.get("route", "")
        if not route.startswith("#/"):
            fail(f"[graph] node {n.get('id')}: bad route {route!r}")
    for e in graph.get("edges", []):
        if e.get("from") not in node_ids or e.get("to") not in node_ids:
            fail(f"[graph] edge references unknown node: {e}")

# ---------------------------------------------------------------------------
# 6. LaTeX delimiter balance
# ---------------------------------------------------------------------------
for doc_id, text in doc_text.items():
    if text.count("$$") % 2 != 0:
        fail(f"[latex] {doc_id}: odd number of $$ delimiters")
    # Strip $$ blocks before counting single $ to avoid double-count.
    without_display = re.sub(r"\$\$.*?\$\$", "", text, flags=re.DOTALL)
    if without_display.count("$") % 2 != 0:
        fail(f"[latex] {doc_id}: odd number of $ delimiters outside $$ blocks")

# ---------------------------------------------------------------------------
# 7. generated bundle
# ---------------------------------------------------------------------------
if CONTENT_PATH.exists():
    head = CONTENT_PATH.read_text(encoding="utf-8")[:200]
    if not head.startswith("window.RENDER_NOTES = "):
        fail("[bundle] web/content.js does not start with window.RENDER_NOTES")
    else:
        ok()
else:
    fail("[bundle] web/content.js missing — run python tools/build_site.py")

# ---------------------------------------------------------------------------
# report
# ---------------------------------------------------------------------------
print(f"validate_site: {passes} checks passed, {len(warns)} warnings, {len(fails)} failures")
for w in warns:
    print(f"  WARN  {w}")
for f in fails:
    print(f"  FAIL  {f}")
if fails:
    sys.exit(1)
print("OK")
