#!/usr/bin/env python3
"""Build the offline browsing site data from the Render_Notes Markdown files.

Usage:
    python tools/build_site.py

The only output is web/content.js, which is consumed by web/assets/app.js.
No third-party Python packages are required.
"""

from __future__ import annotations

import json
import posixpath
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "web" / "content.js"
GLOSSARY_PATH = ROOT / "tools" / "glossary.json"
COURSE_PATH = ROOT / "tools" / "course.json"
LABS_PATH = ROOT / "tools" / "labs.json"
GRAPH_PATH = ROOT / "tools" / "graph.json"

# Map each glossary group to a technical-index category. Groups not listed fall back to "concept".
TECH_CATEGORY_BY_GROUP = {
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
TECH_CATEGORY_LABELS = {
    "api": "图形 / 媒体 API",
    "algorithm": "渲染 / 图像算法",
    "concept": "核心概念",
    "topic": "工程主题",
}

CATEGORY_ORDER = [
    "",
    "00-导航与索引",
    "01-基础理论",
    "02-解码与播放链路",
    "03-图形与GPU工程",
    "04-跨平台与高性能架构",
    "05-项目实战",
    "06-面试知识库",
    "07-3D渲染与算法实现",
    "archive",
]

REPO_URL = "https://github.com/Vin535LFJ/Render_Notes"

SECTION_ENTRY = {
    "00-导航与索引": "00-导航与索引/知识架构总览.md",
    "01-基础理论": "01-基础理论/音视频基础理论.md",
    "02-解码与播放链路": "02-解码与播放链路/解码与播放链路.md",
    "03-图形与GPU工程": "03-图形与GPU工程/GPU与渲染引擎基础与链路.md",
    "04-跨平台与高性能架构": "04-跨平台与高性能架构/跨平台与高性能架构.md",
    "05-项目实战": "05-项目实战/项目实战指南.md",
    "06-面试知识库": "06-面试知识库/面试知识库.md",
    "07-3D渲染与算法实现": "07-3D渲染与算法实现/README.md",
    "archive": "archive/README.md",
}

SECTION_META = {
    "": {
        "icon": "◈",
        "summary": "仓库总览与阅读入口。",
        "question": "这套知识库解决什么问题？我该从哪里开始？",
    },
    "00-导航与索引": {
        "icon": "◈",
        "summary": "知识地图、学习路线、缺口登记与术语验真。",
        "question": "我现在该读哪一篇？这个概念属于哪一层？",
    },
    "01-基础理论": {
        "icon": "◉",
        "summary": "音视频与图形渲染的底层概念：像素格式、容器编码、时间戳、色彩。",
        "question": "视频为什么是 YUV？PTS/DTS/Stride 为什么容易出错？",
    },
    "02-解码与播放链路": {
        "icon": "▷",
        "summary": "从文件/网络到解码、纹理与播放时序的完整数据链。",
        "question": "一帧码流如何变成 GPU 可采样的纹理？ownership 在哪里切换？",
    },
    "03-图形与GPU工程": {
        "icon": "▦",
        "summary": "GPU 硬件模型、图形管线、FBO 多 Pass、带宽与移动端架构。",
        "question": "一帧怎么画出来？瓶颈为什么常在带宽而不是算力？",
    },
    "04-跨平台与高性能架构": {
        "icon": "⌗",
        "summary": "显式 API、RenderGraph、同步原语、零拷贝与智驾渲染方案。",
        "question": "如何把渲染变成可预测、可复用、可跨平台的工程系统？",
    },
    "05-项目实战": {
        "icon": "◇",
        "summary": "阶段目标、验收标准、性能数字口径与项目复盘。",
        "question": "如何把知识落成可交付、可讲述、可验证的项目经历？",
    },
    "06-面试知识库": {
        "icon": "✦",
        "summary": "车载渲染方向的高频问答、专题拆解与项目表达。",
        "question": "同一个知识点，如何讲成结论 + 原理 + 工程约束 + 反例？",
    },
    "07-3D渲染与算法实现": {
        "icon": "◐",
        "summary": "坐标变换、光照材质、阴影、图像算法与批处理实现。",
        "question": "矩阵、光照、采样与批处理如何真正落到 shader 和 Pass 上？",
    },
    "archive": {
        "icon": "▤",
        "summary": "历史手册与归档材料，保留原始脉络，不作为最新结论来源。",
        "question": "过去的资料如何追溯？哪些结论已经被主干文档取代？",
    },
}

SECTION_PREREQS = {
    "01-基础理论": [],
    "02-解码与播放链路": ["01-基础理论"],
    "03-图形与GPU工程": ["01-基础理论", "02-解码与播放链路"],
    "04-跨平台与高性能架构": ["03-图形与GPU工程"],
    "05-项目实战": ["04-跨平台与高性能架构"],
    "06-面试知识库": ["04-跨平台与高性能架构", "05-项目实战"],
    "07-3D渲染与算法实现": ["03-图形与GPU工程"],
    "archive": [],
}


def relpath(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def section_key(doc_path: str) -> str:
    return doc_path.rsplit("/", 1)[0] if "/" in doc_path else ""


def top_key(doc_path: str) -> str:
    return doc_path.split("/", 1)[0] if "/" in doc_path else ""


def format_section(key: str) -> str:
    if not key:
        return "总览"
    labels = []
    for part in key.split("/"):
        match = re.match(r"^(\d{2})-(.*)$", part)
        if match:
            labels.append(f"{match.group(1)} · {match.group(2)}")
        elif part == "archive":
            labels.append("归档 · archive")
        else:
            labels.append(part)
    return " / ".join(labels)


def sort_key(doc_path: str):
    key = section_key(doc_path)
    try:
        category_index = CATEGORY_ORDER.index(key.split("/")[0])
    except ValueError:
        category_index = len(CATEGORY_ORDER)
    return (category_index, doc_path)


def truncate(text: str, limit: int = 140) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def strip_frontmatter(markdown: str) -> tuple[str, str]:
    """Split a leading YAML frontmatter block from the body.

    Returns (body, frontmatter). Body keeps everything after the closing
    ``---`` line; when no frontmatter exists, body is the original text.
    """
    match = re.match(r"\A---\s*\n.*?\n---\s*\n", markdown, re.DOTALL)
    if not match:
        return markdown, ""
    return markdown[match.end():], match.group(0)


def extract_title(markdown: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else fallback


def extract_subtitle(markdown: str) -> str:
    lines = markdown.splitlines()
    for line in lines[1:12]:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(">"):
            text = stripped.lstrip(">").strip()
            text = re.sub(r"\*\*|__|`", "", text)
            if text and not text.startswith("验证状态"):
                return truncate(text)
        if stripped.startswith("#") or stripped.startswith("---"):
            continue
        if stripped:
            text = re.sub(r"\*\*|__|`", "", stripped)
            return truncate(text)
    return ""


def plain_text(markdown: str) -> str:
    text = re.sub(r"```.*?```", " ", markdown, flags=re.DOTALL)
    text = re.sub(r"~~~.*?~~~", " ", text, flags=re.DOTALL)
    text = re.sub(r"\$\$.*?\$\$", " ", text, flags=re.DOTALL)
    text = re.sub(r"\$[^$\n]*\$", " ", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[`*_~]", "", text)
    text = re.sub(r"^\s*[#>|]+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def glossary_url(term_name: str) -> str:
    return "#/glossary?term=" + quote(term_name, safe="")


def build_term_entries(glossary: dict) -> list[dict]:
    entries = []
    for group in glossary.get("groups", []):
        for term in group.get("terms", []):
            aliases = [term["name"], *(term.get("aliases") or [])]
            entries.append(
                {
                    "name": term["name"],
                    "aliases": aliases,
                    "short": term.get("short", ""),
                    "group": group.get("label", ""),
                }
            )
    entries.sort(key=lambda item: max(len(name) for name in item["aliases"]), reverse=True)
    return entries


def collect_term_hits(text: str, term_entries: list[dict]) -> list[tuple[dict, int]]:
    lowered = text.lower()
    hits = []
    for entry in term_entries:
        count = max(lowered.count(alias.lower()) for alias in entry["aliases"])
        if count:
            hits.append((entry, count))
    hits.sort(key=lambda item: (-item[1], item[0]["name"]))
    return hits


def relative_doc_link(current: str, target: str, label: str | None = None) -> str:
    base = posixpath.dirname(current)
    rel = posixpath.relpath(target, base) if base else target
    rel = rel.replace("\\", "/")
    text = label or Path(target).stem
    return f"[{text}]({rel})"


def build_chapter_intro(doc_path: str, hits: list[tuple[dict, int]], all_doc_ids: list[str]) -> str:
    top = top_key(doc_path)
    meta = SECTION_META.get(top, SECTION_META[""])
    lines = [
        "<!-- rn-generated-start -->",
        f"> **{meta['icon']} 章节定位** · {meta['summary']}",
        ">",
        f"> **本章核心问题**：{meta['question']}",
    ]

    architecture = "00-导航与索引/知识架构总览.md"
    if doc_path != architecture:
        lines.append(">")
        lines.append("> **知识地图**：" + relative_doc_link(doc_path, architecture, "知识架构总览"))

    prereqs = [
        SECTION_ENTRY[key]
        for key in SECTION_PREREQS.get(top, [])
        if key in SECTION_ENTRY and SECTION_ENTRY[key] != doc_path
    ]
    if prereqs:
        lines.append(">")
        lines.append("> **前置知识**：" + " · ".join(relative_doc_link(doc_path, p) for p in prereqs))

    siblings = [
        doc_id
        for doc_id in all_doc_ids
        if top_key(doc_id) == top and doc_id != doc_path and doc_id != architecture
    ][:6]
    if siblings:
        lines.append(">")
        lines.append("> **同章文档**：" + " · ".join(relative_doc_link(doc_path, s) for s in siblings))

    if hits:
        lines.append(">")
        lines.append("> **本章术语**：")
        for entry, count in hits[:8]:
            link = f"[{entry['name']}]({glossary_url(entry['name'])})"
            lines.append(f"> - {link} — {truncate(entry['short'], 64)}（出现 {count} 次）")

    lines.append("")
    return "\n".join(lines)


PROTECT_PATTERNS = [
    r"`[^`\n]*`",
    r"\[[^\]\n]*\]\([^)\n]*\)",
    r"\$[^$\n]*\$",
    r"<!--.*?-->",
]


def protected_ranges(line: str) -> list[tuple[int, int]]:
    ranges = []
    for pattern in PROTECT_PATTERNS:
        for match in re.finditer(pattern, line):
            ranges.append((match.start(), match.end()))
    return ranges


def find_free(text: str, needle: str, ranges: list[tuple[int, int]]) -> int:
    lowered = text.lower()
    target = needle.lower()
    cursor = 0
    while True:
        index = lowered.find(target, cursor)
        if index < 0:
            return -1
        end = index + len(target)
        if not any(index < stop and end > start for start, stop in ranges):
            return index
        cursor = index + 1


def inject_inline_term_links(markdown: str, selected: list[tuple[dict, int]]) -> str:
    if not selected:
        return markdown
    used: set[str] = set()
    output = []
    in_fence = False

    for line in markdown.splitlines():
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            output.append(line)
            continue
        if in_fence or stripped.startswith("<!--"):
            output.append(line)
            continue
        if stripped.startswith("#") or stripped.startswith("|") or stripped.startswith(">"):
            output.append(line)
            continue

        processed = line
        ranges = protected_ranges(processed)
        for entry, _count in selected:
            if entry["name"] in used:
                continue
            url = glossary_url(entry["name"])
            placed = False
            for alias in entry["aliases"]:
                index = find_free(processed, alias, ranges)
                if index < 0:
                    continue
                processed = (
                    processed[:index]
                    + f"[{alias}]({url})"
                    + processed[index + len(alias) :]
                )
                used.add(entry["name"])
                placed = True
                break
            if placed:
                ranges = protected_ranges(processed)
        output.append(processed)

    return "\n".join(output)


def augment_markdown(markdown: str, doc_path: str, term_entries: list[dict], all_doc_ids: list[str]) -> tuple[str, list[dict]]:
    if "<!-- rn-generated-start -->" in markdown:
        return markdown, []
    plain = plain_text(markdown)
    hits = collect_term_hits(plain, term_entries)
    enriched = inject_inline_term_links(markdown, hits[:12])
    intro = build_chapter_intro(doc_path, hits, all_doc_ids)

    lines = enriched.splitlines()
    heading_index = next((i for i, line in enumerate(lines) if line.startswith("# ")), None)
    if heading_index is None:
        lines = [intro] + lines
    else:
        lines.insert(heading_index + 1, "\n" + intro)

    term_meta = [
        {"name": entry["name"], "count": count, "group": entry["group"]}
        for entry, count in hits[:8]
    ]
    return "\n".join(lines), term_meta


def build_tech_index(glossary: dict) -> dict:
    """Derive a browsable technical index from the glossary groups (no second curated file)."""
    categories: dict[str, list] = {key: [] for key in TECH_CATEGORY_LABELS}
    for group in glossary.get("groups", []):
        category = TECH_CATEGORY_BY_GROUP.get(group.get("id", ""), "concept")
        for term in group.get("terms", []):
            name = term.get("name", "")
            if not name:
                continue
            categories[category].append({
                "name": name,
                "aliases": term.get("aliases", []) or [],
                "summary": term.get("short", ""),
                "group": group.get("label", ""),
                "route": "#/glossary?term=" + quote(name),
            })
    order = ["api", "algorithm", "concept", "topic"]
    return {
        "categories": [
            {"id": key, "label": TECH_CATEGORY_LABELS[key], "items": categories[key]}
            for key in order if categories[key]
        ]
    }


def main() -> None:
    markdown_files = [
        path
        for path in ROOT.rglob("*.md")
        if ".git" not in path.parts
        and "web" not in path.parts
        and "site-vitepress" not in path.parts
        and "node_modules" not in path.parts
        and ".workbuddy-ai" not in path.parts
    ]
    markdown_files.sort(key=lambda p: sort_key(relpath(p)))
    all_doc_ids = [relpath(path) for path in markdown_files]

    glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    course = json.loads(COURSE_PATH.read_text(encoding="utf-8"))
    labs = json.loads(LABS_PATH.read_text(encoding="utf-8"))
    graph = json.loads(GRAPH_PATH.read_text(encoding="utf-8")) if GRAPH_PATH.exists() else {"nodes": [], "edges": [], "views": []}
    term_entries = build_term_entries(glossary)

    docs = []
    sections = []
    linked_term_total = 0
    for path in markdown_files:
        doc_path = relpath(path)
        key = section_key(doc_path)
        markdown = path.read_text(encoding="utf-8", errors="replace")
        markdown, _frontmatter = strip_frontmatter(markdown)
        fallback = path.stem
        plain = plain_text(markdown)
        enriched, term_meta = augment_markdown(markdown, doc_path, term_entries, all_doc_ids)
        linked_term_total += len(term_meta)
        doc = {
            "id": doc_path,
            "path": doc_path,
            "title": extract_title(markdown, fallback),
            "sectionKey": key,
            "section": format_section(key),
            "subtitle": extract_subtitle(markdown),
            "words": len(plain),
            "minutes": max(1, round(len(plain) / 400)),
            "markdown": enriched,
            "plain": plain,
            "terms": term_meta,
        }
        docs.append(doc)
        if not sections or sections[-1]["key"] != key:
            sections.append(
                {
                    "key": key,
                    "label": format_section(key),
                    "items": [],
                }
            )
        sections[-1]["items"].append(doc_path)

    payload = {
        "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "repo": REPO_URL,
        "docs": docs,
        "sections": sections,
        "order": [doc["id"] for doc in docs],
        "glossary": glossary,
        "course": course,
        "labs": labs,
        "graph": graph,
        "techIndex": build_tech_index(glossary),
        "sectionMeta": SECTION_META,
    }

    # Escape sequences that would otherwise terminate the inline <script> block.
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    raw = raw.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("window.RENDER_NOTES = " + raw + ";\n", encoding="utf-8")

    term_count = sum(len(group["terms"]) for group in glossary["groups"])
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print(f"  {len(docs)} documents, {len(sections)} sections")
    print(f"  {len(glossary['groups'])} glossary groups, {term_count} terms")
    print(f"  {len(course['units'])} course units, {len(course['lessons'])} lessons")
    print(f"  {len(labs['labs'])} interactive labs")
    print(f"  {linked_term_total} chapter term cards generated")
    print(f"  {OUTPUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
