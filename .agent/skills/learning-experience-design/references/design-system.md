---
doc_id: LEX-REF-DS
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# Design System（Render_Notes 学习体验设计体系）

> 参考 `web/assets/styles.css` 现有基线。所有值以 CSS 变量为准；升级通过扩展变量，不硬编码颜色、不推翻明暗双主题。

## 1. 色彩系统
- 语义变量：`--bg`/`--bg-soft`/`--bg-elevated`/`--bg-translucent`、`--text`/`--text-muted`/`--text-subtle`、`--border`/`--border-strong`、`--accent`/`--accent-soft`/`--accent-contrast`、`--code-bg`/`--code-text`、`--quote-bg`/`--quote-border`、`--table-head`/`--table-stripe`。
- 主色：亮色 `#3b5bdb` / 暗色 `#8aa4ff`；保持一组强调色，不引入彩虹色板。
- 对比：正文对背景 ≥ 4.5:1（WCAG AA），大字号 ≥ 3:1；强调色在软背景上需复测。
- 状态色（正确/警告/错误）需明暗两套并与语义色区分；不得只靠颜色传达信息（配图标/文字）。

## 2. 字体系统
- 正文栈沿用 `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`。
- 代码/公式：等宽栈 + KaTeX 自带字体（`web/vendor/` 离线）。不联网加载字体。
- 最多两种字族（正文 + 等宽）；标题不另引装饰字体，靠字重/字号/间距建立层级。

## 3. 字号与行高
- 正文 15px / 1.75（现有基线，不随意改）。层级建议：h1 1.9em、h2 1.5em、h3 1.22em、h4 1.08em。
- 长文行高 ≥ 1.7；代码块 1.5；表格可 1.5。小字（caption）不低于 12px。

## 4. 阅读宽度
- 正文单行 65–80 字符（中文约 34–40 字）；超出时居中并限制 `max-width`，不拉伸到全屏。
- 侧栏 286px / TOC 238px 为现有基线；窄屏折叠为抽屉，不挤压正文。

## 5. 标题层级
- 每页一个 h1；h2/h3 不跳级（validator 的"skipped headings"检测同理）。
- 标题即结论或问题，不用"概述/内容"这类空标签；章节标题可承载导航。

## 6. 间距规则
- 采用 4px 基准的间距刻度（4/8/12/16/24/32/48）；段落间距 > 行内间距；章节间距 > 段落间距。
- 卡片内边距 ≥ 16px，避免 cramped padding（Hallmark Floor 项）。

## 7. 页面布局
- 三栏（导航 / 正文 / TOC）在 ≥1280px；中屏隐藏 TOC；窄屏隐藏侧栏为汉堡菜单。
- 正文区优先，广告式侧栏不侵占阅读宽度。

## 8. 代码展示
- 深色/浅色随主题；行号可选；长行横向滚动不折行破坏缩进；标注语言；复制按钮可键盘访问。

## 9. 公式展示
- 行内公式不撑破行高；块公式居中可横向滚动；变量首次出现给含义；推导分步而非一次性给结果。

## 10. 图表与流程图
- Mermaid 图支持点击放大（现有 lightbox 保留）；图下方给一句"这张图说明什么"；配色随主题。
- 结构图/数据流/状态机按 `educational-visualization.md` 选择，不为好看强塞。

## 11. 术语提示
- 术语首次出现给可展开释义（绑定 `glossary.json`）；不每个词都加卡片；悬停/点击不遮挡正文。

## 12. 内容引用
- 来源/断言引用用统一的引用块（`--quote-bg`/`--quote-border`）；给出处与状态（open/verified 以 evidence 为准），AI 不自改状态。

## 13. 导航
- 上/下一章、面包屑、课程路线、当前章节进度；活跃项高亮但不过度；键盘可达。

## 14. 主题
- 明/暗双主题，跟随系统并可切换；切换不闪屏；用户选择持久化；图表/公式随主题。

## 15. 响应式规则
- 断点 360/768/1024/1440；移动端代码/公式/表格可横向滚动；触摸目标 ≥ 44px；不隐藏必要操作。

## 16. Accessibility
- 语义 HTML、可见焦点环、足够对比、`prefers-reduced-motion` 尊重、图有 alt/文字说明、表单有标签、键盘全流程可达。详见 `accessibility.md`。
