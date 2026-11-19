---
name: learning-experience-design
description: 为 AI 原生知识学习产品设计专业、可读、可交互的学习体验。适用于升级技术教材/知识库网站的阅读体验、信息设计、教学可视化、页面原型、视觉质量审查、响应式与无障碍检查。Use when asked to "improve the reading/learning experience of the knowledge site", "design a lesson/lab page", "review the site's visual quality", "make technical content more learnable". 属于 Render_Notes Engine 内部专属 Skill，不另建站点项目。
agent_created: true
doc_id: SKILL-LEX
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
related_adr: [ADR-0001]
generated: false
---

# Learning Experience Design（学习体验设计）

> **位置说明（D14）**：正文位于统一智能体仓库 `.agent/skills/learning-experience-design/`。本 Skill 属于 AI Knowledge-to-Learning Engine 内部，不创建独立仓库、不重复建设网站生成引擎。适配器入口只做发现与跳转，不复制本正文。

## Purpose

把现有知识库网站从"把 Markdown 渲染出来"升级为**帮助学习者发现、理解、关联、验证并长期记住知识**的技术教育产品。设计定位：

> **Editorial Technical Learning Experience** —— 专业技术百科 × 深度研究杂志 × 互动式教材 × 工程实验室。

这与 SaaS 落地页、营销站、通用仪表盘是不同物种：目标是**理解**，不是转化。禁止套用"英雄区 + 三卡片 + 价格表"式模板。

## 何时使用 / 何时不用

- **用**：改造教材页/知识文章/实验页的信息架构与视觉；新增页面类型；视觉质量审查；多端与无障碍回归；为知识选择教学可视化方式。
- **不用**：纯内容事实修订（走 research-to-learning 的 KCR）；构建脚本与数据结构改造（走 `tools/`）；网站功能 bug（走工程流程）。本 Skill 消费现有 `course.json`/`glossary.json`/`labs.json`/`graph.json`，**不另建内容库**。

## 上游借鉴（合法、有限、已核对 2026-11-19）

| 上游 | 许可证 | 借鉴什么 | 不照搬什么 |
|---|---|---|---|
| [Impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | 设计词汇与命令式指引（bolder/quieter/typeset/critique/polish）；`PRODUCT.md`/`DESIGN.md` 上下文分层；62 条确定性"反 AI 模板"规则思路；hook/CI 质量门 | 整套 24 命令与 npx 安装/钩子；其默认 SaaS 审美 |
| [Hallmark](https://github.com/Nutlope/hallmark) | MIT | Floor/Reflex/Finish 三级门槛；真实浏览器渲染 + 多宽度截图审查；fresh-context 复审；"主题是材料不是页面计划"；反 slop 清单；`--before/--kept` 防内容丢失 | 50 主题目录与图片库；营销站结构；图片许可资产 |

> 许可证已核对（Impeccable Apache-2.0、Hallmark MIT），正式引入任何代码/素材前仍须逐项核验具体文件与依赖。本 Skill **不复制**上游代码或素材，只吸收方法。

## 核心工作流（每次改站点都走）

```
理解页面目标 → 检查现有产品与组件 → 确定学习者任务 → 选择页面原型
→ 建立页面设计方案 → 绘制关键页面原型 → 用户确认设计方向
→ 分阶段实施 → 真实浏览器截图 → 视觉审查 → 响应式与无障碍审查 → 回归测试
```

**铁律**：
1. 一次只改有代表性的 1 篇教材页 + 1 个实验页做试点，用户确认后才推广。
2. 不先改全部网站；不重写 `web/index.html`、`web/vendor/**`、`tools/build_site.py` 的架构。
3. 整体视觉风格、信息架构、重要交互模式属于**人工裁决**，先给出有真实页面效果的多个方案 + 优缺点，不把审美偏好伪装成客观技术结论。
4. Floor 硬阻塞必须清零；Reflex 记录理由可豁免；Finish 不阻塞发布。

## 设计体系（根据 Render_Notes 真实内容建立）

现有基线：`web/assets/styles.css`（明暗双主题 + CSS 变量，正文 15px / 1.75 行高，阅读宽度、侧栏 286px、TOC 238px）。升级必须沿用变量体系与明暗主题，不硬编码颜色。

完整规范见 `references/design-system.md`（色彩/字体/字号行高/阅读宽度/标题层级/间距/布局/代码/公式/图表/术语提示/引用/导航/主题/响应式/无障碍 15 项）。

## 页面原型（7 类，不要所有页一个模板）

A 知识文章 · B 系统教材 · C 技术原理推导 · D 交互实验 · E 知识图谱 · F 研究报告 · G 术语与概念。

每类的目标、结构、必备区块、反模式见 `references/learning-page-archetypes.md`；页面规格模板见 `assets/page-spec-template.md`。

## 教学可视化

按知识类型选表达方式：结构示意 / 数据流 / 时间轴 / 因果图 / 数学推导 / 对比表 / 状态机 / 层级图 / 交互实验 / 前后对照。**图是为了理解，不是装饰**——不默认每篇文章塞卡片和图表。选择与反模式见 `references/educational-visualization.md`。

## 学习体验 12 项能力

课程入口与目标 · 前置知识提示 · 学习路线图 · 上/下一章承接 · 章节阅读进度 · 重点概念提示 · 术语快速解释 · 公式与代码阅读体验 · 交互实验入口 · 学习自测 · 知识图谱探索 · 反馈与学习记录。

全部绑定现有 `course.json` / `glossary.json` / `labs.json` / `graph.json` 与反馈 UI，不另建内容库。交互模式见 `references/interaction-patterns.md`。

## 质量门槛（Floor / Reflex / Finish）

- **Floor（硬阻塞，不清零不许发布）**：文字可读；色彩对比合格（WCAG AA）；键盘导航有效；360px 移动端可用；不制造虚假内容；不破坏现有交互；不遗漏必要操作；长文档/公式/代码/图不溢出。
- **Reflex（默认倾向，有理由可豁免并记录）**：避免无意义重复卡片；避免滥用渐变/玻璃拟态；避免所有页面同模板；不随意改正文阅读宽度；避免多余装饰；避免"每个标题上方一条 eyebrow"等 AI 痕迹。
- **Finish（锦上添花，不阻塞）**：字体细节；动画；图表过渡；微交互；精细间距；页面一致性。

见 `references/visual-quality-gates.md`；审查记录用 `assets/design-review-template.md`，回归清单用 `assets/visual-regression-checklist.md`。

## 验证方法（必须真实浏览器）

- 宽度：360 / 768 / 1024 / 1440 px 四档截图。
- 主题：明 + 暗；内容：长篇文档、复杂公式（KaTeX）、长代码块、Mermaid 图、交互实验。
- 交互：键盘 Tab/Enter/Esc、实验可操作、七实验回归。
- 站点两路：`file://` 双击 与 `http://localhost:8765`。
- 先 `py -3 tools/build_site.py` 生成 `web/content.js`（**禁止手改生成物**），再截图。

## 参考文档索引（双索引，2026-11-19 规范增量）

旧 8 篇全部保留，新增 5 篇按新架构文档指定补齐，二者**分工互补、不重复正文**：

| 层 | 文件 | 职责 |
|---|---|---|
| 原有·规范 | `design-system.md` | 设计 token 15 项（色彩/字体/字号/阅读宽度/间距…） |
| 原有·原型 | `learning-page-archetypes.md` | 7 类页面原型 |
| 原有·可视化 | `educational-visualization.md` | 教学可视化选择与反模式 |
| 原有·组件 | `interaction-patterns.md` | 组件级微交互 |
| 原有·门槛定义 | `visual-quality-gates.md` | Floor/Reflex/Finish 定义 |
| 原有·排版 | `editorial-layout.md` | 编辑式排版 |
| 原有·无障碍基础 | `accessibility.md` | 无障碍概念 |
| 原有·响应式基础 | `responsive-design.md` | 响应式概念 |
| **新增·原理** | `learning-ux-principles.md` | 学习科学"为什么"（认知负荷/检索练习/渐进披露/理解闭环） |
| **新增·旅程交互** | `learning-interaction-patterns.md` | 学习旅程级 12 项流程（与组件级微交互分工） |
| **新增·布局配方** | `visual-system-and-layout.md` | 面向 Render_Notes 的页面布局配方（引用 token 不重列） |
| **新增·联合回归** | `accessibility-and-responsive.md` | WCAG AA + 四档宽度 + 明暗 + 键盘 + 特殊内容 |
| **新增·签发单** | `ux-review-checklist.md` | Floor/Reflex/Finish 逐项签发（定义→执行→签发链终点） |

新增 5 篇引用上表的 token/门槛定义而不复制正文；签发结论进入 `ux-review-checklist.md`，执行记录进 `assets/visual-regression-checklist.md`。

## 与其他 Skill / 门禁的关系

- 内容事实与断言 → `research-to-learning`（KCR）。本 Skill 只管"如何呈现"。
- 结构门禁：`py -3 tools/build_site.py` → `py -3 tools/validate_site.py`（0 FAIL/0 WARN）→ `check_chapter_arc.py` → `review_gate.py`（只读，G1/G2/G3 人工）。
- 本目录在 `build_site.py` / `validate_site.py` / `build_vitepress_content.py` 的排除列表内，不进知识 bundle。

## 试点记录

> 试点页面规格与原型：`preview/`（独立预览目录，不改线上站点）。用户确认设计方向后才分阶段推广。
