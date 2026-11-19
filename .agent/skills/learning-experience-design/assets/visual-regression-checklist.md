---
doc_id: LEX-ASSET-VRC
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# Visual Regression Checklist（视觉回归清单）

> 每次改站点后逐项核对。全部通过才算"未破坏现有体验"。

## 环境与构建
- [ ] 先跑 `py -3 tools/build_site.py` 生成 `web/content.js`（未手改生成物）
- [ ] `py -3 tools/validate_site.py` → 0 FAIL / 0 WARN
- [ ] `check_chapter_arc.py` 全部 OK
- [ ] 两路可达：`file://web/index.html` 与 `http://localhost:8765`

## 四档宽度 × 明暗主题（8 组截图）
- [ ] 360px 明 / 暗：无横向溢出、导航可用、实验可操作
- [ ] 768px 明 / 暗：单栏布局、导航折叠正常
- [ ] 1024px 明 / 暗：两栏、正文宽度合理
- [ ] 1440px 明 / 暗：三栏、TOC 有效

## 内容类型
- [ ] 长篇文档：滚动流畅、进度/目录正常
- [ ] 复杂公式（KaTeX）：不溢出、可滚动、明暗可读
- [ ] 长代码块：横向滚动、复制按钮可用
- [ ] Mermaid 图：渲染 + lightbox 放大正常
- [ ] 交互实验：控件与反馈同屏、可操作、可重置

## 交互回归（现有功能不可破坏）
- [ ] 搜索
- [ ] 术语速查 / hover 释义
- [ ] 课程导航 / 上一下一章
- [ ] 7 个交互实验全部可打开可操作
- [ ] 知识图谱节点点击 / 图谱探索
- [ ] 反馈提交与导出（localStorage 队列 + JSON）
- [ ] 明暗主题切换（不闪屏、持久化）
- [ ] 键盘全流程（Tab/Enter/Esc、焦点可见）

## 质量门槛
- [ ] Floor 全清零（见 design-review-template.md）
- [ ] Reflex 项已处理或记录豁免理由
- [ ] 内容保全：改造前后链接/标题/控件无丢失
- [ ] fresh-context 复审已完成

## 结论
- [ ] 通过，可进入人工确认
- [ ] 存在问题（列出，不宣称通过）

> 人工确认栏留空，由用户填写。
