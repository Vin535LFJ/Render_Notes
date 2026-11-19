# -*- coding: utf-8 -*-
"""生成 .agent/indexes/document-registry.json（D15 / ADR-0001）。

事实源 = 各 .md 文档 frontmatter（type/status/owner/...）；缺 frontmatter 的存量文档
如实标记 unregistered + 启发式 type，不伪造。注册表是生成物，不手改（AGENT_RULES 规则四）。

用法：py -3 tools/build_document_registry.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / ".agent" / "indexes" / "document-registry.json"

# 注册表扫描范围比知识 bundle 更广（含 .agent / reviews / archive / 适配入口），
# 仅排除宿主运行时、生成物与外来产物。
EXCLUDED_PARTS = {".git", "web", "site-vitepress", "node_modules", ".workbuddy-ai", ".zcode"}

FRONTMATTER_KEYS = {"doc_id", "type", "status", "owner", "created", "updated",
                    "supersedes", "related_adr", "related_task", "generated"}
VALID_TYPES = {"knowledge", "research-report", "change-proposal", "adr", "kcr", "agent-plan",
               "run-log", "skill", "project-state", "standard", "template", "adapter",
               "review-material", "data-config"}
VALID_STATUS = {"draft", "proposed", "under_review", "approved", "active", "superseded", "archived"}

FM_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)


def parse_frontmatter(text):
    m = FM_RE.match(text)
    if not m:
        return None
    out = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        k, v = line.split(":", 1)
        k, v = k.strip(), v.strip()
        if k not in FRONTMATTER_KEYS:
            continue
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        elif v.lower() in ("true", "false"):
            v = (v.lower() == "true")
        out[k] = v
    return out


def derive_type(rel_posix):
    parts = Path(rel_posix).parts
    top = parts[0] if parts else ""
    base = Path(rel_posix).name
    if base in ("CLAUDE.md", "AGENTS.md") and len(parts) == 1:
        return "adapter"
    if top in (".cursor", ".github", ".gemini"):
        return "adapter"
    if top == ".agent":
        sub = parts[1] if len(parts) > 1 else ""
        return {"constitution": "standard", "standards": "standard", "decisions": "adr",
                "changes": "change-proposal", "plans": "agent-plan", "skills": "skill",
                "templates": "template", "indexes": "data-config"}.get(sub, "standard")
    if top == "reviews":
        return "review-material"
    if top == "archive":
        return "knowledge"
    if top == "courses":
        if "lessons" in parts:
            return "knowledge"
        if base in ("教材质量诊断.md", "课程覆盖矩阵.md") or base.startswith("G2-") or base.startswith("G1-") or base.startswith("G3-"):
            return "review-material"
        return "knowledge"
    if top in ("evidence", "knowledge-model", "tools"):
        return "data-config" if base.endswith(".md") else "knowledge"
    if top == "00-导航与索引" or re.match(r"^0[1-7]-", top):
        return "knowledge"
    # 根目录治理文档
    return {"README.md": "knowledge", "DECISIONS.md": "adr", "CHANGELOG.md": "run-log",
            "WORKFLOW_STATE.md": "project-state", "PROJECT_CURRENT_STATE.md": "project-state",
            "CURRENT_GAPS.md": "project-state", "NEXT_PHASE_PLAN.md": "project-state"}.get(
        base, "change-proposal" if "方案" in base or "Prompt" in base else "project-state")


def derive_level(status, rel_posix):
    parts = Path(rel_posix).parts
    if status in ("superseded", "archived") or parts[0] == "archive":
        return "L3"
    if status in ("draft", "proposed", "under_review"):
        return "L2"
    if status in ("approved", "active"):
        return "L1"
    if parts[0] in ("reviews",) or (parts[0] == ".agent" and len(parts) > 1 and parts[1] in ("changes", "plans")):
        return "L2"
    return "unclassified"


def slug(rel_posix):
    s = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]+", "-", rel_posix).strip("-").lower()
    return s or "doc"


def main():
    entries = []
    md_files = sorted(set(ROOT.rglob("*.md")) | set(ROOT.rglob("*.mdc")))
    for p in md_files:
        rel = p.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        text = p.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        rel_posix = rel.as_posix()
        fm_type = (fm or {}).get("type")
        fm_status = (fm or {}).get("status")
        entry = {
            "path": rel_posix,
            "id": (fm or {}).get("doc_id") or slug(rel_posix),
            "type": fm_type if fm_type in VALID_TYPES else derive_type(rel_posix),
            "type_source": "frontmatter" if fm_type in VALID_TYPES else "heuristic",
            "status": fm_status if fm_status in VALID_STATUS else "unregistered",
            "owner": (fm or {}).get("owner", "unassigned"),
            "created": (fm or {}).get("created", ""),
            "updated": (fm or {}).get("updated", ""),
            "supersedes": (fm or {}).get("supersedes", []),
            "related_adr": (fm or {}).get("related_adr", []),
            "related_task": (fm or {}).get("related_task", ""),
            "generated": bool((fm or {}).get("generated", False)),
            "frontmatter_present": fm is not None,
        }
        entry["level"] = derive_level(entry["status"], rel_posix)
        entries.append(entry)

    def count(key):
        out = {}
        for e in entries:
            out[e[key]] = out.get(e[key], 0) + 1
        return dict(sorted(out.items(), key=lambda kv: -kv[1]))

    registry = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "generator": "tools/build_document_registry.py",
            "total": len(entries),
            "counts_by_status": count("status"),
            "counts_by_level": count("level"),
            "counts_by_type": count("type"),
            "note": "生成物；事实源为各文档 frontmatter。unregistered = 存量无 frontmatter 文档（渐进补齐）。",
        },
        "documents": entries,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(registry, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")
    print(f"  total documents: {len(entries)}")
    print(f"  by status: {registry['meta']['counts_by_status']}")
    print(f"  by level: {registry['meta']['counts_by_level']}")
    print(f"  frontmatter present: {sum(1 for e in entries if e['frontmatter_present'])}/{len(entries)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
