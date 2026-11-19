---
doc_id: LEX-ASSET-PS
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# Page Spec Template（页面规格模板）

> 每个试点页面一份。先写规格与用户确认，再改代码。

## 基本信息
- **页面**：（教材 / 实验 / 知识文章 / 图谱 / 报告 / 术语）
- **对应数据**：`courses/.../lessons/<L##>.md` 或 `labs.json:<id>` 或 `glossary.json:<term>`
- **页面原型**：A/B/C/D/E/F/G
- **学习者任务**：（读完/操作完能做到什么）

## 现状审计
- 现有布局与组件：（引用 `web/assets/styles.css` 变量与结构）
- 现有问题：（证据：截图/读者反馈/门诊）
- 不可破坏的功能：（列出该页现有交互）

## 设计方案
- **信息架构**：区块顺序与层级
- **视觉**：用的设计系统变量、字号/间距/色彩决策
- **教学可视化**：选哪种表达（见 educational-visualization.md），理由
- **交互**：12 能力中本页涉及哪些，如何绑定现有数据
- **响应式**：四档断点行为
- **无障碍**：Floor 项如何满足

## 方案备选（人工裁决用）
- 方案 A：（描述 + 优点 + 缺点 + 影响范围 + 技术成本 + 回滚）
- 方案 B：（同上）
- 推荐：**A/B**，理由：

## 验收
- [ ] 过 Floor 全部项
- [ ] 四档宽度 + 明暗截图通过
- [ ] 键盘走查通过
- [ ] `validate_site.py` 0 FAIL/0 WARN
- [ ] 内容保全（链接/标题/控件无丢失）
- [ ] 人工确认方向
