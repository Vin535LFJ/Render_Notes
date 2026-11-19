---
doc_id: LEX-REF-VQ
type: skill
status: draft
owner: qwenwork
created: 2026-11-19
updated: 2026-11-19
generated: false
---

# Visual Quality Gates（视觉质量门槛）

> 借鉴 Hallmark（MIT）Floor/Reflex/Finish 三级 + Impeccable（Apache-2.0）确定性检测思路。本仓库只做方法与规则，不引入上游代码。

## Floor（硬阻塞——不清零不许发布）
- 文字可读：正文 ≥15px、行高 ≥1.6、对比度达 AA。
- 色彩对比：正文/次要/强调/边框在明暗主题下均达标。
- 键盘导航：全流程可达、焦点可见。
- 移动端：360px 无横向溢出、必要操作不隐藏。
- 不制造虚假内容：数据来自现有 JSON，不编造数字/来源/断言状态。
- 不破坏现有交互：7 个实验、搜索、术语、课程、图谱、反馈均可用。
- 不遗漏必要操作：自测、实验入口、上下章导航在。
- 长内容：复杂公式、长代码块、Mermaid 图不溢出、不截断。

## Reflex（默认倾向——有理由可豁免并记录）
- 无意义重复卡片；卡片套卡片。
- 滥用渐变、玻璃拟态、发光阴影。
- 所有页面同一模板；每个标题上方一条 eyebrow。
- 标题里染一个彩色单词；追踪字距全大写标签滥用。
- 一页只有空框架/只有图片。
- 随意改正文阅读宽度（应保持 65–80 字符）。
- Hero 没占满其屏幕、页尾无意义的邮箱订阅框、假成功表单。

## Finish（锦上添花——不阻塞）
- 字体细节与字重搭配。
- 克制的动效与过渡（尊重 reduced-motion）。
- 图表过渡与状态变化。
- 微交互（hover/focus 反馈）。
- 精细间距与跨页一致性。

## 判定纪律
1. **区分硬阻塞与审美建议**：Floor 项未清零 = 阻塞；Reflex/Finish = 建议，记录理由。
2. **AI 不自评通过**：视觉审查给证据（截图、测量值），最终方向由用户确认。
3. **确定性检测**：可自动化的（对比度、标题跳级、溢出、空 claim）优先脚本；审美靠 fresh-context 人工复审。
4. **fresh-context 复审**：改完页面用新上下文再审一遍，避免"自己改自己看不出问题"。
5. **防内容丢失**：改造前后对比链接/标题/控件/处理器（借鉴 Hallmark `--before`/`--kept`），改造后逐项核对。

## 输出
用 `assets/design-review-template.md` 记录每项判定（通过/阻塞/建议 + 证据），用 `assets/visual-regression-checklist.md` 做回归清单。不改 `web/index.html`、`web/vendor/**` 与受保护文件。
