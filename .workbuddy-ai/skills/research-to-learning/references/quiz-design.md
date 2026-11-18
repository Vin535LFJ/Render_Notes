# Quiz 设计规范（quiz-design）

本规范约束 `courses/<course>/quizzes/<lesson_id>.json` 的设计与校验。Quiz 是课程闭环的自测环节，题目必须可回溯，不允许凭空出题。

## 1. 文件约定

- 位置：`courses/<course_id>/quizzes/<lesson_id>.json`，文件名 = 课时 id（如 `L01.json`）。
- 每个课时必须有且只有一个 quiz 文件；`validate_site.py` 会强制检查。

## 2. JSON 结构

```json
{
  "lesson": "L01",
  "title": "为什么视频不是 RGB · 练习",
  "questions": [
    {
      "id": "L01-Q1",
      "type": "short",
      "prompt": "问题文本（来自源课时 checkpoint 或实验 selfTest）",
      "answer": "参考答案（简答题为字符串，不得为空）",
      "claim_ids": ["V12"]
    },
    {
      "id": "L01-Q3",
      "type": "choice",
      "prompt": "选择题文本",
      "options": ["选项 A", "选项 B", "选项 C"],
      "answer": 1,
      "claim_ids": ["V02"]
    }
  ]
}
```

## 3. 硬性规则（validate 会 FAIL）

1. `lesson` 必须指向本课程 `course.json` 中存在的课时 id，且与文件名一致。
2. 问题 `id` 全局唯一，推荐 `<lesson_id>-Q<n>` 格式。
3. `type: choice` 时 `answer` 必须是落在 `options` 范围内的整数下标；`type: short` 时 `answer` 必须是非空参考答案。
4. 每个 `claim_ids` 里的 id 必须已存在于 `evidence/claim-ledger.json`。题目不能引用未登记的断言——若题目依赖新断言，先补 ledger 再出题。

## 4. 设计纪律

- **题目来源**：优先取源课时的 checkpoint 问句、`tools/labs.json` 对应实验的 `selfTest`，或课时 frontmatter `objectives` 的直接改写。出题即"复述考核"，不是新知识。
- **每课 2–4 题**：覆盖该课全部 objectives，不需要穷尽细节。
- **简答题给"依据"**：参考答案不止给结论，还要给依据（数字、来源锚点、反例），方便人工核验。
- **选择题的干扰项**：用真实常见误区做干扰项（如 NV12/NV21 顺序混淆），不要用"以上都不对"式凑数项。
- **不自评通过**：quiz 属于 AI 生成内容，正确性由 claim 链路与人工审核（review-report）保证，AI 不得在 review-report 中替人打分。
