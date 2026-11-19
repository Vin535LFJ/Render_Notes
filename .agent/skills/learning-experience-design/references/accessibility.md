---
doc_id: LEX-REF-A11Y
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# Accessibility（无障碍）

> Floor 硬阻塞区：不达标不得发布。参照 WCAG 2.1 AA。

## 必须满足（Floor）
- **对比度**：正文 ≥ 4.5:1，大字号（≥18px 或 14px 粗体）≥ 3:1；UI 组件边界 ≥ 3:1。明暗两套都要测。
- **键盘可达**：所有链接、按钮、实验控件、Tab 切换、弹窗可用键盘操作；焦点顺序合理；焦点环可见（不 `outline:none` 无替代）。
- **语义结构**：一个 h1、标题不跳级、列表用 ul/ol、按钮用 button、导航用 nav、表格用 th/scope。
- **图像等价**：info 图有 alt 或相邻文字说明；Mermaid 图有文字描述；装饰图 alt=""。
- **表单标签**：输入框有 label，错误信息可读且与字段关联。
- **不依赖颜色**：状态用颜色 + 图标/文字双通道。
- **减少动效**：`prefers-reduced-motion` 下关闭动画/过渡。
- **移动端**：360px 无横向溢出；触摸目标 ≥ 44px。

## 应做（Reflex/Finish）
- 语言属性 `lang` 正确（中文 `zh-CN`）。
- 跳转链接（skip to content）在长导航站点。
- 进度/状态变化用 `aria-live` 温和播报。
- 弹窗/抽屉管理焦点与 Esc 关闭。

## 验证方法
- 键盘走查：只用 Tab/Shift+Tab/Enter/Esc 完成一次学习路径 + 一次实验。
- 对比度：用工具测正文、次要文字、强调色、边框在明暗主题下的比值。
- 缩放：浏览器 200% 缩放不丢失内容与操作。
- 屏幕阅读器（如可用）：标题层级、图描述、表单标签朗读正确。

## 反模式
- `outline:none` 无替代焦点样式。
- 仅用红/绿区分对错。
- 点击展开的释义只有 hover 无键盘触发。
- 深色主题下次要文字对比不足。
