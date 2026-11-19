# EXECUTION_PLAN_V3 · 审核驱动执行路线图

> Master Prompt V3.0 §5–§11 / Loop 1 Step 6 · 2026-11-19。
> 三循环：Loop 1 审核准备（本轮，已完成）→ Loop 2 裁决后执行（P7）→ Loop 3 长期推进（P8→P9→P10）。
> 原则：审核与执行隔离；未裁决不动；每篇/每阶段独立验收；不重建已有系统；不批量生成教材。

---

## Loop 1 · 审核准备（本轮已完成）

产出 reviews/ 7 文件：CURRENT_AUDIT / G1-evidence-review / G2-curriculum-review / G3-release-readiness / REVIEW_STATUS / DECISION_REQUIRED / 本文件。
门禁基线绿（validate 11/0/0 · arc 5/5 · review_gate 正常）；偏差与新发现登记；A/B/C 分类完成。
**暂停点：等待 DECISION_REQUIRED.md 人工裁决。**

## Loop 2 · 裁决后执行（收到 DECISION_REQUIRED 答复后）

### 2.1 记录裁决
- 把每项人工裁决写入 `DECISIONS.md`（新增 D12+，逐项注明裁决与授权范围）。
- 未回复项保持待审核，不执行、不视为同意。

### 2.2 执行 Category A（获授权后批量，确定性可验证）
- A1 数字口径更正（L01 239 行 / 31 claims·16 sources / build 69 基线）→ CHANGELOG/G2材料/PROJECT_CURRENT_STATE。
- A3 build_site.py 排除 `.zcode/`（及工具目录）→ 重建干净 bundle（69 docs）。
- A4 学习路径指南.md 补 U7/程序化几何/L17/L18 导航。
- A5 K-STRIDE source_claim V02→V14。
- A6 跨平台:205 Pass 口径勘误（仅当 B9=≥3）。
- 每项改后跑门禁；A 类不涉及学习目标/技术事实/路线变更。

### 2.3 P7.1 修复 blocker（顺序依覆盖矩阵 §4：L02 → L06 → L13 → L11）

> 注：V3.0 §5 列序为 L02→L13→L06→L11；本计划采用用户 Loop 1 指定的覆盖矩阵 §4 序（L02→L06→L13→L11），两者均在 L02 优先后处理其余三篇，差异不影响 blocker 解除。每篇以 Gold Standard L01 + 已确认质量规范为基准。

**第一项 L02**（依 B1 裁决）
- 修 G-T1 引用失实：删除"drift 强纠偏区/源文档分级处置"夸大表述，改为源文档真实内容（音视频基础理论 §4.2 Δt 两分支 L434-435 + §4.3 PLL 微调⚠️条件 L510）。
- B1=A：删除两层 course.json 第三目标 + L02 frontmatter objective；B1=B：先做 C1 研究再改写目标。
- 用源文档 I-B-P-B-P 五帧表（L410-420）深化"画出 DTS/PTS 差异"；补 Δt 公式。
- quizzes/L02.json Q2 答案修正（去"分级策略"失实表述）+ claim 挂接（V03/V10 或新 claim）。

**第二项 L06**
- 统一两层目标与正文：补 updateTexImage/变换矩阵、BufferQueue 生产者-消费者、OES→2D Shader 转换、数据流与资源所有权（源 解码链路 §7/§8）。
- 修 §7.3 小节号错位（→§7.2/§7.4）；"色彩空间转换"出处改指 色彩管理与采样滤波.md。
- 目标"OES Input Pass/预览导出复用 RenderGraph"按源文档真实口径修正（源称"第一道转换 Shader"/"共享同一套 Shader"）。
- 依 C2 核验后勘误 API 名（getTransformMatrix）；P02 挂载依 B11 裁决。

**第三项 L13**（依 B10 裁决）
- 登记 4 条候选 claim（坐标空间链/MVP 顺序/投影 w/NDC 差异，默认 open，编号续 V15+）。
- 重建 quiz 挂接（Q1/Q2/Q3 挂正确 claim，去除 V06 弱挂）。
- 教材化投影推导（w_clip=-z_eye 含义 + 透视除法）；六空间原点/单位/用途表；NDC/Y-flip 确定表述（Vulkan Y 默认向下/负视口翻转）。

**第四项 L11**
- RenderPass≠RenderGraph 口径修正（Vulkan 需预声明附件/subpass 读写）；aliasing 生命周期区间例子。
- 乱码"barrier 是由谁 inserted？"四处联动修复：tools/course.json checkpoint + pilot course.json checkpoint + L11 正文 §9 + quizzes/L11.json Q2 prompt（保 validate §11b 覆盖）。
- Pass 口径依 B9 统一。

**每篇完成后八步验收**（V3.0 §5 P7.2）：知识来源审核 → claim 追溯 → 教学设计审核 → quiz 检查 → lab 关联 → 章节桥接 → 自动化门禁（build/validate/arc）→ 人工抽查。

### 2.4 P7.2 逐篇深化其余课程
- 按先修图与学习路径逐步扩展（L03/L04/L05 → L07/L08/L09 → L10/L12 → L14 → L15/L16 → L17/L18），**一次一篇，不一次性生成 14 篇**。
- L17/L18 与 Track B 程序化模块沉淀联动（文档/lab 已就绪，补教学正文+quiz）。
- 每篇过门禁 + 留审核材料 + 更新 WORKFLOW_STATE/CHANGELOG。

### 2.5 状态与下轮材料
- 更新 WORKFLOW_STATE（续跑点随进度）、IMPLEMENTATION_PLAN（P7 勾选）、CHANGELOG（实测数字/哈希）。
- 生成下一轮 G1/G2/G3 增量审核材料；新登记 claim 提交 G1 升级裁决。

## Loop 3 · 长期推进（P7 完成后，各阶段独立验收）

### P8 · Research-to-Learning 生产化（在现有 Skill 迭代，不新建）
- D1 Research Input Contract：本地 MD/PDF/论文/官方文档/网页/GitHub/AI 报告七类输入（来源/获取/解析/元数据/去重/可靠性/异常）。
- D2 Research Report Contract：目标/范围/已有知识/缺口/搜索策略/来源/发现/证据/观点/争议/结论/未解决。
- D3 Incremental Knowledge Update：查重→对比来源→抽新增→识冲突→claim 变更提案→概念关系提案→受影响教材→更新报告（不重生成全库）。
- D4 Knowledge Change Impact：Source→Claim→Concept→Lesson→Course 影响链；claim 修订时定位受影响概念/教材/quiz/目标（建议不替代人工审核）。
- 验收：输入合同可处理七类输入；增量更新有变更记录；影响链可查询。

### P9 · 轻量 Orchestrator（现有 tools/ + JSON，不引重型 DB）
- 状态机：INTAKE→RESEARCH→EVIDENCE→KNOWLEDGE→CURRICULUM→STORY_DESIGN→LESSON_DRAFT→PRACTICE→REVIEW→REVISION→READY→PUBLISH→FEEDBACK。
- 每阶段记录：task_id/当前状态/输入文件/输出文件/执行时间/执行结果/失败原因/重试次数/审核状态/下一步动作。
- 能力：断点恢复/重复执行保护/增量处理/阶段跳转检查/人工暂停/失败恢复/执行日志。
- 验收：可断点续跑、防重复写入、失败可恢复、人工可暂停。

### P10 · 网站与多领域复用（不重建）
- 离线站体验：课程阅读/章节前后导航/教材↔lab 双向/知识图谱/搜索/术语跳转/学习进度/反馈。
- VitePress：先验证源码与生成器；依 B6 授权构建（放行自身 .temp 清理）；未授权不绕过权限、不发布 GitHub Pages。
- 多领域复用：video-rendering-journey / gpu-rendering-journey / procedural-graphics-journey / ai-engineering-journey，共享 Evidence/Knowledge Model/Skill/QA/发布组件，各课独立目标与路线。
- 验收：离线站回归全绿；在线站可构建（授权后）；至少一门新课程复用底层跑通闭环。

> **阶段隔离**：不因某阶段完成自动批准下一阶段所有风险操作；远程发布/构建清理/claim 升级/路线变更始终需相应授权。

## 硬门槛（每轮/每篇）

```
py -3 tools/build_site.py
py -3 tools/validate_site.py        # 0 FAIL / 0 WARN
py -3 .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md
py -3 tools/review_gate.py          # 只读
```

## 绝对不动（除非明确授权）

archive/** · .workbuddy-ai/memory/** · web/vendor/** · web/index.html · README（B5 授权前）· 两份方案文档 · 已确认学习路线（B2 裁决前）· claim 状态（G1 裁决前）· 外来产物 .zcode/old_content.js.tmp（B14 裁决前）· stash（B12 裁决前）。