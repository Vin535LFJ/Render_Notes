---
doc_id: LEX-REF-UX-CHECKLIST
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
---

# 学习体验审查签发单

> 把 Floor / Reflex / Finish 三层门槛落成**可逐项签字的清单**。门槛定义见 `visual-quality-gates.md`，执行记录见 `assets/visual-regression-checklist.md`，本文是"逐项判定 + 签发"环节。
> 使用方式：每次页面改动后逐项填 pass / fail / N/A + 证据位置；Floor 有 fail 即不得发布。

## Floor（硬阻塞，清零才可发布）
| # | 检查项 | 判定 | 证据 | 依据 |
|---|---|---|---|---|
| F1 | 文字可读、正文对比 ≥4.5:1 | ☐ | | accessibility-and-responsive §2 |
| F2 | 键盘可导航、focus 可见、无陷阱 | ☐ | | accessibility-and-responsive §3 |
| F3 | 360/768/1024/1440 四档不溢出 | ☐ | | accessibility-and-responsive §1 |
| F4 | 明暗主题切换正常、无残留块 | ☐ | | accessibility-and-responsive §5 |
| F5 | 公式/代码/表格/Mermaid 不撑破版心 | ☐ | | accessibility-and-responsive §4 |
| F6 | 无虚假内容、不破坏现有交互、不遗漏操作 | ☐ | | 真实浏览器实测 |
| F7 | 七实验回归通过、quiz claim 挂接未丢 | ☐ | | learning-interaction-patterns §9/10 |
| F8 | 知识文档仍正常发布、reviews 未进 bundle | ☐ | | `py -3 tools/test_publish_boundary.py` |

## Reflex（默认倾向，豁免需写明理由）
| # | 检查项 | 判定 | 理由（若豁免） |
|---|---|---|---|
| R1 | 无无意义重复卡片 / 装饰性图标 | ☐ | |
| R2 | 无渐变/玻璃拟态滥用 | ☐ | |
| R3 | 各页不全是同一模板（按 7 类原型区分） | ☐ | |
| R4 | 未随意改正文阅读宽度 | ☐ | |
| R5 | 无"每个标题上方 eyebrow"等 AI 模板痕迹 | ☐ | |
| R6 | 图有因果信息量，不是装饰 | ☐ | |

## Finish（锦上添花，不阻塞）
| # | 检查项 | 判定 |
|---|---|---|
| P1 | 字体细节 / 行高 / 字距 | ☐ |
| P2 | 动画与图表过渡克制流畅 | ☐ |
| P3 | 微交互（hover/focus/反馈）一致 | ☐ |
| P4 | 间距节奏与页面一致性 | ☐ |

## 人工裁决标记
以下属于**人工裁决**，AI 不得代填、不得把审美偏好写成客观结论：
- 整体视觉风格方向（方案 A 增量增强 / B 重设计）
- 信息架构与导航重组
- 重要交互模式变更

试点方向确认见 `preview/PILOT-L13-plan.md`，未确认前不改线上站点。

## 签发
- Floor fail 数：___（必须 0）
- Reflex 豁免数：___（逐条理由已记录）
- 签发人 / 时间：___
- 发布授权：☐ 未授权（默认）　☐ 已授权（需明确）

> 说明：G3 发布关卡仍未通过；本签发单即使全 pass 也不等于 G3 通过，发布需单独人工授权。
