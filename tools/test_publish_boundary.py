#!/usr/bin/env python3
"""发布边界回归测试（2026-11-19 reviews 泄露修复）。

验证：
1. 单元断言：reviews/ 不可发布、知识文档可发布、archive 按 include_archive 区分。
2. 产物断言：重生成后 web/content.js 不含 reviews/、VitePress 无 reviews 目录、关键知识文档仍在。
3. allowlist 咨询断言：已发布但不在清单的一级命名空间为 0（否则提示人工审核，不自动丢弃）。

用法：py -3 tools/test_publish_boundary.py （需先跑过 build_site.py / build_vitepress_content.py）
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

from publish_boundary import (  # noqa: E402
    check_allowlist,
    is_publishable,
    load_allowlist,
)


class BoundaryUnitTests(unittest.TestCase):
    def test_reviews_excluded(self):
        self.assertFalse(is_publishable("reviews/DECISION_REQUIRED.md", include_archive=True))
        self.assertFalse(is_publishable("reviews/decision-kit/B4.md", include_archive=True))
        self.assertFalse(is_publishable("reviews/G1-evidence-review.md", include_archive=False))

    def test_knowledge_doc_publishable(self):
        self.assertTrue(is_publishable("01-基础理论/音视频基础理论.md", include_archive=True))
        self.assertTrue(is_publishable("courses/video-rendering-journey/README.md", include_archive=True))
        self.assertTrue(is_publishable("README.md", include_archive=True))

    def test_archive_toggle(self):
        self.assertTrue(is_publishable("archive/README.md", include_archive=True))
        self.assertFalse(is_publishable("archive/README.md", include_archive=False))

    def test_root_adapters_excluded(self):
        self.assertFalse(is_publishable("CLAUDE.md"))
        self.assertFalse(is_publishable("AGENTS.md"))

    def test_agent_dirs_excluded(self):
        self.assertFalse(is_publishable(".agent/README.md"))
        self.assertFalse(is_publishable(".workbuddy-ai/skills/foo/SKILL.md"))

    def test_allowlist_clean_for_published_namespaces(self):
        published = [
            "01-基础理论/音视频基础理论.md",
            "courses/video-rendering-journey/lessons/L01.md",
            "archive/README.md",
            "README.md",
        ]
        report = check_allowlist(published, load_allowlist())
        self.assertEqual(report["unlisted"], [], "已发布命名空间未登记入 allowlist，需人工审核")
        self.assertEqual(report["leaked"], [])

    def test_allowlist_detects_leak(self):
        report = check_allowlist(["reviews/DECISION_REQUIRED.md"], load_allowlist())
        self.assertIn("reviews", report["leaked"])


class ArtifactTests(unittest.TestCase):
    def test_content_js_has_no_reviews(self):
        """断言 8 篇审核材料没有作为"文档条目"发布。

        注意：其他文档正文里出现 `reviews/xxx.md` 这种交叉引用是正常的项目治理叙述，
        不属于泄露；因此这里解析 JSON 只检查 docs[*].id/path，不做全文字符串匹配。
        """
        import json
        import re

        content_js = ROOT / "web" / "content.js"
        if not content_js.exists():
            self.skipTest("web/content.js 尚未生成，请先运行 py -3 tools/build_site.py")
        text = content_js.read_text(encoding="utf-8", errors="replace")
        match = re.search(r"window\.RENDER_NOTES = (\{.*\})\s*;?\s*$", text, re.S)
        self.assertIsNotNone(match, "无法解析 web/content.js 的 JSON 载荷")
        docs = json.loads(match.group(1)).get("docs", [])

        leaked = [d for d in docs if str(d.get("id", "")).startswith("reviews/")
                  or str(d.get("path", "")).startswith("reviews/")]
        self.assertEqual(leaked, [], f"仍有 {len(leaked)} 篇 reviews/ 文档作为条目发布")
        self.assertEqual(len(docs), 69, "知识文档数应为 69（77 篇总数移除 8 篇 reviews 后；PD-Q1 收口修正原断言笔误 77）")

    def test_content_js_keeps_knowledge_docs(self):
        content_js = ROOT / "web" / "content.js"
        if not content_js.exists():
            self.skipTest("web/content.js 尚未生成")
        text = content_js.read_text(encoding="utf-8", errors="replace")
        self.assertIn("01-基础理论/音视频基础理论.md", text, "知识文档意外丢失")
        self.assertIn("courses/video-rendering-journey/", text, "课程文档意外丢失")

    def test_vitepress_has_no_reviews_dir(self):
        vp_docs = ROOT / "site-vitepress" / "docs"
        if not vp_docs.exists():
            self.skipTest("VitePress docs 尚未生成")
        self.assertFalse((vp_docs / "reviews").exists(), "VitePress 树仍含 reviews/ 目录")

    def test_registry_still_indexes_reviews(self):
        # 注册表故意索引治理材料，本轮修复不得影响它。
        registry = ROOT / ".agent" / "indexes" / "document-registry.json"
        if not registry.exists():
            self.skipTest("注册表尚未生成")
        text = registry.read_text(encoding="utf-8", errors="replace")
        self.assertIn("reviews/", text, "注册表应继续索引 reviews/ 治理文档")


if __name__ == "__main__":
    unittest.main(verbosity=2)
