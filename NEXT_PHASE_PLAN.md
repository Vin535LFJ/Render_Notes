# NEXT_PHASE_PLAN · P6–P10 实施计划

> 依据 Master Prompt V2.0 第五/八节与 `CURRENT_GAPS.md` 制定。P0–P5、B1–B5 已完成，不重复执行。
> 硬约束：DECISIONS.md D01–D10 继续有效；不重建、不重复造轮子、不远程发布、不 AI 自批、archive/memory/vendor/index.html 不动。
> 每阶段结束跑门禁（本机用 `py -3`）：`build_site.py` → `validate_site.py`（0 FAIL/0 WARN）→ `check_chapter_arc.py`（全部样章）→ 涉及审核时 `review_gate.py`（只读）。

---

## P6 · 教材质量升级（本次执行，最高优先级）

**目标**：验证并提升现有 5 篇样章的真实教学质量；产出 Gold Standard 与教材质量规范；G2 材料交人工。**不扩大到全部 19 课。**

| 子任务 | 交付物 | 状态 |
|---|---|---|
| P6.1 五篇样章深度诊断（10 维度 + 源文档逐条核对） | `courses/video-rendering-journey/教材质量诊断.md`（含逐章问题清单、severity、证据行号） | 本次完成 |
| P6.2 课程映射检查 + 覆盖矩阵 | `courses/video-rendering-journey/课程覆盖矩阵.md`（19 课 × 元数据/正文/Quiz/Claim/Lab/状态） | 本次完成 |
| P6.3 Gold Standard Lesson | 重写 `lessons/L01-为什么视频不是-RGB.md`（选 L01，理由见诊断 §4）；配套：新断言 V13/V14（open，待 G1）、quiz L01-Q2 改挂 V14、两层 course.json L01 乱码目标修复、pilot next 指针对齐路线、ledger used_by 补漏 | 本次完成 |
| P6.4 教材设计标准 | `.workbuddy-ai/skills/research-to-learning/references/lesson-quality-standard.md` + SKILL.md 登记（不新建顶层 Skill） | 本次完成（标准本身待 G2 人工确认后才算正式通过） |
| G2 审核材料 | `courses/video-rendering-journey/G2-审核材料-P6.md`（诊断摘要 + 变更对照 + 待拍板问题 + 空白人工评分表） | 本次完成 |

**P6 内修复边界**：只修与 Gold Standard 直接相关的数据（L01 目标乱码、V13/V14 登记、quiz 挂接、next 指针、used_by 补漏）。L02/L06/L11/L13 的内容修复一律留给 P7（诊断已给出精确修复方案），避免在质量标准未经人工确认前批量改内容。

**P6 出口条件**：门禁全绿 + G2 材料齐备 + 人工审核请求已发出。**G2 未确认前不启动 P7 内容生产。**

## P7 · 课程内容生产体系（G2 确认后）

1. **修复 blocker**（顺序即优先级）：
   - G-T1/G-T2（L02）：删除或改写"强纠偏区/分级处置"表述为源文档真实内容（Δt 两分支 + PLL⚠️条件）；"seek 后禁止立刻丢帧"目标按 G2 拍板删除或先补研究。
   - G-T3（L13）：按 evidence-and-claims 程序登记坐标空间链/MVP 顺序/NDC 差异断言（默认 open），quiz 重新挂接。
2. **统一两层课程口径**：objectives 漂移（G-D3）、L12.next 与先修图矛盾（G-D2，需 G2 拍板）、L11 乱码四处联动修复（G-D4）、P02 挂载裁决（G-D5）。
3. **按学习路径逐篇深化**：下一篇候选顺序建议 L02（blocker 修复）→ L06（目标对齐）→ L13（断言重建）→ L11 → 其余按先修图推进；每篇以 Gold Standard L01 与质量规范为基准，一次一篇、过门禁、留审核材料。**不一次性机械生成 14 篇。**
4. **Practice Designer 完善**：quiz 覆盖全部 objectives、补 claim 挂接、利用 labs.json tasks/selfTest 设计观察点；L17/L18 补 quiz 与正文时与 Track B 沉淀联动。
5. 同一术语多章出现按"直观→原理→数学→架构→实践"递进判定，不因重复术语判重复内容。

## P8 · Research-to-Learning 工作流生产化

1. **输入合同**（P8.1）：本地 MD/PDF/网页/论文/官方文档/GitHub 仓库/已有研究报告七类输入的处理合同；先查已有知识再研究，产出含目标/范围/方法/来源/发现/争议/结论/未解决问题/参考的研究报告（补模板实例）。
2. **Evidence Analyst 扩展**（P8.2）：断言字段补齐适用边界与使用课程；新断言默认 open；G-E1（>3 vs ≥3）、G-E2（API 名勘误）走源文档更新流程。
3. **Knowledge Architect**（P8.3）：concepts 同义合并/关系标注/循环依赖检查；glossary.json 仍唯一术语源，不重复建词典。
4. **增量资料处理**（P8.4）：同源判断→变化对比→新增/受影响断言→概念关系→受影响章节，全程变更记录；不因新增一篇资料重生成全库。
5. **Skill 进化**（P8.5）：在现有 Skill 内补输入合同/中间产物 schema/阶段门禁/失败处理/任务恢复/增量更新/人工审批/多课程复用；拆分子 Skill 须先证明独立复用需求。

## P9 · Agent Orchestration 与自动化

1. 角色→任务类型映射：AI 判断 / 确定性脚本 / 外部服务 / 人工审核四类清单（不强行拆十进程）。
2. **轻量状态机**（P9.2）：JSON 状态文件（沿用 D05）记录 INTAKE→…→FEEDBACK 各阶段输入/输出/执行记录/完成条件；支持重试、断点恢复、防重复写入、来源追踪、人工跳过/暂停。优先扩展现有 tools/，不引重型分布式系统。
3. G1/G2/G3 人工关卡保留；每次审核生成材料；AI 不填分数，工具通过≠人工通过。
4. **工具盘点**（P9.4）：先确认实际可用的 MCP/工具再封装为可替换能力接口；确定性操作留在现有 Python 脚本；不重复建设 build/validate/review_gate/build_knowledge_model。

## P10 · Publishing 与多领域复用

1. 离线主站体验增强（P10.1）：章节前后导航与 pilot 路线联动、教材↔实验双向关联、图谱/术语探索/搜索/反馈改进；不重写网站、不动 index.html/vendor。
2. **在线站构建验证**（P10.2）：检查 package.json/config.mjs/生成器→生成 MD/sidebar/链接/首页；`docs:build` 涉及清理自身临时目录，**先取得用户授权再执行**；不绕过权限、不伪造成功、未授权不发布 GitHub Pages。
3. **多领域课程**（P10.3）：以 video-rendering-journey 为模板验证 gpu-rendering-journey / procedural-graphics-journey / ai-engineering-journey 的复用（各自画像/目标/地图/故事线/教材/Lab/Quiz，共享 Evidence/Model/Glossary/Skills/QA/组件）；不混成一个大课程。

## 待用户拍板（行为语言，详见 G2 材料）

1. L02 第三个学习目标（"seek 后为什么不能立刻丢帧"）没有任何主文档支撑：删掉这个目标，还是先补研究再保留？
2. 主课程路线里"系统合成与显示"（L12）的下一课直接跳到"性能评测"（L15），但 L15 又要求先学"坐标变换/光照材质"（L13/L14）：路线按哪条走？
3. README 的过时数字是否授权按实测更新（D10.5 原裁决不动）？
4. VitePress 构建需要放行其自身临时目录清理：是否授权重试 `docs:build`（P10 时再问亦可）？

## 阶段交付纪律（每阶段结束）

输出：新增/修改文件清单、已完成能力、架构变化、实际执行的测试与结果、未解决问题、已知风险、下一阶段计划；同步更新 IMPLEMENTATION_PLAN / WORKFLOW_STATE / DECISIONS / CHANGELOG。不 commit/push，除非用户明确授权。