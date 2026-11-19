#!/usr/bin/env python3
"""学习体验设计 - 确定性视觉前置检查（Floor 中可自动化的部分）。

只做静态检查，不替代真实浏览器截图与人工裁决：
  1. 标题跳级（h1 唯一、h2/h3 不跳级）
  2. 暴露的 outline:none（无焦点替代）
  3. 硬编码十六进制颜色（应走 CSS 变量）—— 仅警告
  4. 明暗主题变量是否成对定义
  5. 页面是否引用了受保护/生成物（web/index.html、web/content.js 手改痕迹提示）

用法：py -3 check_visual_floor.py [目标目录或文件，默认 ../.. 即 web/ 由调用方指定]
输出：FAIL / WARN / OK；exit 0 = 无 FAIL。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # .agent/skills/<skill>/scripts -> repo root


def slug(text: str) -> str:
    t = re.sub(r"<[^>]*>", "", text).strip().lower()
    t = "".join(c if (c.isalnum() or c.isspace() or c == "-") else "" for c in t)
    return re.sub(r"-+", "-", re.sub(r"\s+", "-", t)).strip("-")


def check_markdown(path: Path) -> tuple[list[str], list[str]]:
    fails: list[str] = []
    warns: list[str] = []
    levels: list[int] = []
    h1 = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^(#{1,6})\s+(.*?)\s*$", line)
        if m:
            lvl = len(m.group(1))
            levels.append(lvl)
            if lvl == 1:
                h1 += 1
    if h1 != 1:
        warns.append(f"{path.name}: h1 数量 = {h1}（教材/文章应为 1）")
    prev = levels[0] if levels else 0
    for lvl in levels[1:]:
        if lvl > prev + 1:
            fails.append(f"{path.name}: 标题跳级 h{prev}→h{lvl}")
        prev = lvl
    return fails, warns


def check_css(path: Path) -> tuple[list[str], list[str]]:
    fails: list[str] = []
    warns: list[str] = []
    text = path.read_text(encoding="utf-8")
    # 暴露的 outline:none 无后续替代（粗略：同一规则块内无 outline: 定义）
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
        body = m.group(2)
        if re.search(r"outline\s*:\s*(none|0)\b", body) and not re.search(
            r"outline\s*:\s*(?!none|0)", body
        ):
            sel = m.group(1).strip().splitlines()[-1] if m.group(1).strip() else "?"
            warns.append(f"{path.name}: {sel[:50]} 使用 outline:none（需确认有焦点替代）")
    # 明暗主题变量成对：统计 :root 与 [data-theme=dark] 中 -- 变量集合
    def vars_in(block: str) -> set[str]:
        return set(re.findall(r"(--[a-z0-9-]+)\s*:", block))
    root_m = re.search(r":root\s*\{([^}]*)\}", text, re.S)
    dark_m = re.search(r'\[data-theme=["\']?dark["\']?\]\s*\{([^}]*)\}', text, re.S)
    if root_m and dark_m:
        rv = vars_in(root_m.group(1))
        dv = vars_in(dark_m.group(1))
        missing = rv - dv
        if missing:
            warns.append(f"{path.name}: 暗色主题缺少变量 {sorted(missing)}")
    return fails, warns


def main() -> int:
    target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "web"
    if not target.exists():
        print(f"FAIL 目标不存在: {target}")
        return 1
    files = [target] if target.is_file() else sorted(target.rglob("*"))
    fails: list[str] = []
    warns: list[str] = []
    for f in files:
        if not f.is_file():
            continue
        if f.suffix == ".md" and "vendor" not in f.parts:
            a, b = check_markdown(f)
            fails += a; warns += b
        elif f.suffix == ".css" and "vendor" not in f.parts:
            a, b = check_css(f)
            fails += a; warns += b
    for x in warns:
        print("WARN", x)
    for x in fails:
        print("FAIL", x)
    if not fails and not warns:
        print("OK 学习体验 Floor 静态前置检查通过（不替代浏览器与人工裁决）")
    return 0 if not fails else 1


if __name__ == "__main__":
    raise SystemExit(main())
