# 教学课程：一帧视频如何从文件抵达屏幕

> 这是**教学版课程**（pilot course），由 `research-to-learning` 工作流生成。它与 `tools/course.json` 的 19 课主教材层平行：主教材层管"知识地图与进度"，本课程管"按人类理解过程重排的叙事教学样章"。
>
> **不复制知识正文**：样章只链接主文档与锚点，权威定义仍在 `tools/glossary.json`，证据在 `evidence/claim-ledger.json`。

---

## 目录

| 文件 | 作用 |
|---|---|
| `course.json` | 课程与课时结构（沿用 `tools/course.json` 的 `L##` ID） |
| `curriculum.md` | 课程蓝图：目标学习者、最终能力、范围、路线、考核、人工关卡 |
| `review-report.md` | 质量审核评分表（人工填写，85 分门槛） |
| `lessons/` | 5 篇教学版样章（L01/L02/L06/L11/L13） |
| `quizzes/` | 5 份配套练习（题目回指 claim） |
| `labs/README.md` | 实验映射（链接到 `tools/labs.json` 与 `#/lab/<id>`，不复制定义） |

## 五课路线

```
L01 为什么视频不是 RGB → L02 时间戳与同步 → L06 纹理桥与零拷贝
    → L11 RenderGraph 与资源生命周期 → L13 坐标变换与 MVP
   （像素形状）      （时间顺序）        （数据进 GPU）      （多 Pass 组织）   （数学根基）
```

每篇样章遵循：钩子 → 前置 → 直观认识 → 原理（引锚点）→ 数学/数据 → 工程与误区 → 实验 → 自测 → 下一章的桥。

## 与现有资产的关系

- 主教材层：[`tools/course.json`](../../tools/course.json)（19 课 / 8 单元）。
- 故事线：[一帧画面的探索之旅](../../00-导航与索引/一帧画面的探索之旅.md)（六篇章叙事）。
- 概念桥梁：[概念引入说明](../../00-导航与索引/概念引入说明.md)（DRAM/DMA/PCIe、Pass/RenderGraph）。
- 交互实验：[`tools/labs.json`](../../tools/labs.json)。

## 质量门禁

```bash
python tools/build_site.py
python tools/validate_site.py
python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md
```

样章会被离线站自动收录为 `#/doc/courses/video-rendering-journey/lessons/…`（`build_site.py` 会剥离 YAML frontmatter）。
