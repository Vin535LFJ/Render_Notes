# 质量审核报告：一帧视频如何从文件抵达屏幕

> **AI 不自评通过**。本表由生成 Agent 预填"待人工核验"项，实际分数与通过结论须由人工审核后填写。
>
> 评分权重来自方案：事实准确性 25 / 知识连贯性 25 / 教学体验 20 / 实践能力 20 / 阅读体验 10，总分 100。门槛：总分 ≥85，且事实准确性、知识连贯性各 ≥80%。

## 评分表（待人工填写）

| 维度 | 满分 | 自评（仅供参考） | 人工评分 | 证据/备注 |
|---|---|---|---|---|
| 事实准确性 | 25 | 待人工 | — | 断言回指 `evidence/claim-ledger.json`；open/conditional 未冒充 verified |
| 知识连贯性 | 25 | 待人工 | — | 每课有"下一章的桥"；`check_chapter_arc.py` 全 OK |
| 教学体验 | 20 | 待人工 | — | 每课有钩子、前置、直观认识、自测 |
| 实践能力 | 20 | 待人工 | — | 5 个实验可运行；练习有答案 |
| 阅读体验 | 10 | 待人工 | — | 离线站渲染干净、frontmatter 已剥离、术语可悬停 |
| **总分** | **100** | — | **—** | 门槛 ≥85 且前两项各 ≥80 |

## 自动检查（已执行）

| 检查 | 命令 | 结果 |
|---|---|---|
| 站点与链接/锚点/数据门禁 | `python tools/build_site.py && python tools/validate_site.py` | 通过：`validate_site: 5 checks passed, 0 warnings, 0 failures` + `OK`（2026-11-18 P5 复跑，exit 0） |
| 章节弧线（钩子/前置/概念/桥/实践） | `python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md` | 通过：5 篇样章全 `OK`（L01/L02/L06/L11/L13，exit 0） |
| 证据双向索引 | 已含于 validate_site.py | 通过：含于第 8 节，0 FAIL / 0 WARN（29 claims / 15 sources 双向索引） |

### 执行记录（自动检查结果，非评分）

- 2026-11-18 P5 复跑：三重门禁全部 exit 0；`build_site.py` 输出 62 documents / 124 terms / 8 units / 19 lessons / 7 labs；14 个 JSON 文件结构校验通过。
- 离线主站浏览器抽查：`file://` 双击与 `http://localhost:8765` 两路均渲染正常；五视图、7 实验（canvas + 自检）、教材路由 frontmatter 已剥离、搜索/主题/移动端、hash 刷新保持均正常；控制台 0 error。
- 以上仅为**自动检查实测值**；不含任何人工评分与通过结论。

## 人工审核清单

- [ ] G1 研究范围：证据账本的来源是否权威、状态是否正确（尤其 open/conditional 未被升级）。
- [ ] G2 课程大纲：`curriculum.md` 的目标学习者、路线、考核是否合理（最重要关卡）。
- [ ] G3 最终发布：事实/连贯/教学/实践是否达标；本计划不发布，仅记录结论。

## 已知边界（诚实披露）

- 状态为 `draft`：样章是教学版骨架 + 真实讲解 + 主文档锚点，**不是对主文档的复制**，深度以链接的主文档为准。
- 部分断言为 `conditional` / `open`（如 C06、P02），已在正文标注成立条件，未作为确定结论。
- Shader Playground 交互 demo 延后，未纳入本 pilot 的实践项目。
- 在线 VitePress 站与离线站点并存，本 pilot 的交互以离线 `#/lab/<id>` 为准。

## 结论

**待人工评分后填写。** 生成 Agent 不在此处填写"通过"。
