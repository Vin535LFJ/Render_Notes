#!/usr/bin/env python3
"""集中的知识发布边界：决定哪些 Markdown 可以进入学习站 bundle。

设计约束（2026-11-19，reviews 泄露修复）：
- build_site.py / build_vitepress_content.py / validate_site.py 共用同一套知识排除口径，
  避免"这个工具排除了、那个工具没排除"的漂移。
- reviews/ 是治理与审核材料，不进学习站；build_document_registry.py 故意仍然索引它
  （治理材料需要被注册表登记），因此注册表不受本模块影响。
- archive/ 的发布行为保持 D10.4 原状：离线站 build_site 发布、VitePress 与校验器排除。
  是否改变 archive 策略属于人工裁决，本模块只提供 include_archive 开关，不改默认值。
- allowlist 目前是"咨询性"产物（policy: advisory）：只报告偏差，不自动丢弃文档、不改变
  门禁退出码。切换为强制模式需要人工裁决。
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWLIST_PATH = ROOT / "tools" / "publish-allowlist.json"

# 任何一级或中间目录命中即排除（含 reviews —— 本轮新增）。
KNOWLEDGE_EXCLUDED_PARTS = frozenset({
    ".git",
    "web",
    "site-vitepress",
    "node_modules",
    ".workbuddy-ai",
    ".agent",       # D14：统一智能体文档仓库
    ".zcode",       # D12/A3
    ".gemini",      # D15：客户端适配目录
    ".cursor",      # D15
    ".github",      # D15
    "reviews",      # 2026-11-19：治理/审核材料，不进知识 bundle
    ".qoder-input-images",  # 工具输入缓存，非知识源
})

# 文件名命中即排除（任意层级，与 build_site 原 path.name 判定一致）。
KNOWLEDGE_EXCLUDED_FILES = frozenset({"CLAUDE.md", "AGENTS.md"})  # D15：根适配入口是指针


def is_publishable(rel_posix: str, *, include_archive: bool = True) -> bool:
    """判断一个相对 POSIX 路径是否可发布为知识文档。

    include_archive=True（默认）：保留 D10.4 的离线站行为，archive/ 可发布。
    include_archive=False：VitePress / 校验器口径，archive/ 排除。
    """
    rel = rel_posix.replace("\\", "/")
    parts = tuple(p for p in rel.split("/") if p not in ("", "."))
    if not parts:
        return False
    if any(p in KNOWLEDGE_EXCLUDED_PARTS for p in parts):
        return False
    if not include_archive and "archive" in parts:
        return False
    if parts[-1] in KNOWLEDGE_EXCLUDED_FILES:
        return False
    return True


def load_allowlist(path: Path | None = None) -> dict:
    """读取咨询性发布清单；文件缺失时返回空清单而不抛错。"""
    target = path or ALLOWLIST_PATH
    if not target.exists():
        return {"policy": "advisory", "allowed_top_levels": [], "excluded_top_levels": []}
    return json.loads(target.read_text(encoding="utf-8"))


def check_allowlist(published_paths: list[str], allowlist: dict | None = None) -> dict:
    """对照咨询性清单，报告"已发布但不在清单"与"清单列出但未发布"的一级命名空间。

    纯报告函数：不修改任何文件、不抛出异常、不影响门禁退出码。
    """
    spec = allowlist if allowlist is not None else load_allowlist()
    allowed = set(spec.get("allowed_top_levels", []))
    excluded = set(spec.get("excluded_top_levels", []))

    published_tops: set[str] = set()
    for rel in published_paths:
        top = rel.replace("\\", "/").split("/")[0]
        published_tops.add(top)

    # 排除集里的一级命名空间若仍出现在发布集合，属于边界回归，单独列出。
    leaked = sorted(published_tops & excluded)
    unlisted = sorted(published_tops - allowed - {""})
    missing = sorted(allowed - published_tops)

    return {
        "policy": spec.get("policy", "advisory"),
        "published_top_levels": sorted(published_tops),
        "unlisted": unlisted,
        "leaked": leaked,
        "listed_but_absent": missing,
        "clean": not unlisted and not leaked,
    }
