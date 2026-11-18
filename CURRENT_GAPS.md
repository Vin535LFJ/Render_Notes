# CURRENT_GAPS · 真实缺口清单

> 审计时间：2026-11-18，基于 HEAD `5359259` 实测。配套：`PROJECT_CURRENT_STATE.md`、`NEXT_PHASE_PLAN.md`。
> 逐章证据与行号见 `courses/video-rendering-journey/教材质量诊断.md`；覆盖数据见 `courses/video-rendering-journey/课程覆盖矩阵.md`。
> 分级：**blocker**（事实/追溯错误，必修）· **major**（显著影响理解或一致性）· **minor**（记录性/润色）。
> 每项标注归属阶段；"有意分阶段"项不是缺口，单列于 §5。

---

## 1. 教学内容缺口（P6 诊断 / P7 修复）

| ID | 级别 | 缺口 | 证据 | 归属 |
|---|---|---|---|---|
| G-T1 | blocker | L02 正文与 quiz 引用"drift 强纠偏区 / 源文档分级处置说明"，源文档**不存在**该内容（实际只有 §4.2 Δt 两分支 + §4.3 PLL 微调⚠️） | 音视频基础理论.md L434-435、L510；L02 样章 §4.3；quizzes/L02.json Q2 | P7 第一优先 |
| G-T2 | blocker | L02 主课程目标"描述 seek 后为什么要禁止立刻丢帧"在所有主文档无出处（最接近的是解码链路 §8.2/8.4"解码但不渲染"，语义不同）→ 目标不可教、不可测 | tools/course.json L02 objectives[2]；解码与播放链路.md §8 | P7（需 G2 拍板：删目标或补研究） |
| G-T3 | blocker | L13 断言链断裂：claims 仅 [V06]，而 V06 是"顶点/片元是 GLES 可编程阶段"，与坐标空间/MVP/NDC 无关；quiz Q1/Q2 claim_ids 为空，Q3 把 MVP 顺序挂在 V06 上 | claim-ledger.json V06；lessons/L13 frontmatter；quizzes/L13.json | P7（补登记坐标空间/MVP/NDC 断言） |
| G-T4 | major | 5 篇样章均为"骨架完整、深度不足"的压缩提纲（约 80 行/篇）：推导外包给链接、直观模型未展开、无数据形态图、实验任务未利用 labs.json 既有 tasks/selfTest | 教材质量诊断.md 逐章清单 | P6 已做 L01 Gold Standard；其余 P7 |
| G-T5 | major | L06 两层目标漂移：course.json 要求 updateTexImage/变换矩阵、"OES Input Pass"、"预览/导出复用同一 RenderGraph"；正文未讲 updateTexImage；源文档无"OES Input Pass"术语（称"第一道转换 Shader"）、从未说复用 RenderGraph（源说共享同一套 Shader） | courses/.../course.json L06 vs lessons/L06；解码与播放链路.md §7/§8.3 | P7 |
| G-T6 | major | L06 引"源文档 §7.3"错位（桥接内容在 §7.2/7.4）；"色彩空间转换"出处应为色彩管理与采样滤波.md 而非解码链路 §7 | lessons/L06 §4.2 | P7 |
| G-T7 | major | L11 "OpenGL 绑 FBO 与 Vulkan VkRenderPass 是同一个东西换名字"过度简化（RenderPass≠RenderGraph；Vulkan 需预声明附件/subpass 读写） | lessons/L11 §4.1；概念引入说明.md §2.2 | P7 |
| G-T8 | major | L01 核心动机（亮度/色度敏感度差异的生理依据）与 stride 机制此前无断言登记；quiz Q2 把 stride 题挂在 V02（NV12/NV21 断言）上 | claim-ledger.json；quizzes/L01.json | **P6 本次已补 V13/V14（open，待 G1 升级）** |
| G-T9 | minor | L13 "Y 轴可能相反"含糊（源文档明确 Vulkan NDC Y 默认向下、负视口高度可翻转）；"手动透视除法破坏透视正确插值"无推导句 | lessons/L13 §4.3/§6；3D变换与坐标空间.md L184/189、L37 | P7 |

## 2. 课程数据一致性缺口（P6.2 发现）

| ID | 级别 | 缺口 | 处置 |
|---|---|---|---|
| G-D1 | major | pilot course.json next 指针指向 pilot 外课时（L02→L03、L06→L07、L11→L12、L13→L14），与 curriculum 路线 L01→L02→L06→L11→L13 及正文桥矛盾 | **P6 本次已修复**（next 对齐 pilot 路线） |
| G-D2 | major | 主课程 next 主线跳过支线 L13/L14，但 L15 先修含 L14、L17 先修含 L13、L18 先修含 L13+L14——沿 next 链到达时先修未满足（确定性脚本实测，无循环） | P7 需 G2 拍板（改 next 或改先修，属学习路线设计） |
| G-D3 | major | L02/L06/L11 两层 objectives 漂移（L02 第三目标、L06 全部三目标、L11 部分） | P7 统一口径（以 G2 确认的教学目标为准） |
| G-D4 | minor | 乱码文本："说明 Stride Why 错了会花屏"（两层 course.json L01）；"barrier 是由谁 inserted？"（tools/course.json + pilot course.json checkpoint、L11 正文自测、L11 quiz prompt 四处联动） | L01 处 **P6 本次已修**；L11 四处联动修复归 P7（需同步改 4 文件保 validate §11b 覆盖） |
| G-D5 | minor | ledger used_by_lessons 缺漏：V06 未列 L13、E03 未列 L11；P02 挂 L06 但 L06 正文未声明 P02 | V06/E03 **P6 本次已补**；P02 归 P7 裁决 |
| G-D6 | minor | 6 课无任何断言挂载：L07/L12/L14/L16/L17/L18 | P7/P8 按学习路径逐步补 |
| G-D7 | minor | L02-Q2、L13-Q1/Q2 claim_ids 为空（validate 允许，但追溯性缺失） | 随 G-T1/G-T3 修复 |

## 3. 源文档与证据层缺口（P8）

| ID | 级别 | 缺口 | 归属 |
|---|---|---|---|
| G-E1 | minor | 源文档内部不一致：跨平台与高性能架构.md §2.2 写"特效 Pass 深度>3"，C06/验真队列写"≥3" | P8 提请 G1 裁决统一（样章现取 C06 口径） |
| G-E2 | minor | 解码与播放链路.md L124 `glGetTransformMatrix()` API 名不准确（应为 SurfaceTexture.getTransformMatrix；3D变换文档 L225 写法正确） | P8 源文档勘误（走正常知识更新流程） |
| G-E3 | major | 增量资料处理流程未产品化：新资料进入时的同源判断/变化对比/新增断言/受影响断言/章节更新判断，目前只有 Skill 文字契约，无执行合同与变更记录机制 | P8.4 |
| G-E4 | major | Research Agent 输入合同未落地：PDF/网页/论文/GitHub 仓库等输入的处理与"已有知识 vs 缺口"识别流程未形成可复用合同；研究报告 schema 已有文字定义无模板实例 | P8.1 |
| G-E5 | minor | 候选断言待登记：YUV 黑白电视兼容历史叙事（L01 背景句）、音频主时钟的播放器实例（源文档标 [AI-生成]）、坐标空间链/MVP 顺序/NDC 差异（L13 核心）等 | P7/P8 按 evidence-and-claims.md 程序登记，默认 open |

## 4. 工作流与发布缺口（P9 / P10）

| ID | 级别 | 缺口 | 归属 |
|---|---|---|---|
| G-W1 | major | 工作流状态机未实现：WORKFLOW_STATE.md 是人工维护的文档，无阶段输入/输出/执行记录/断点恢复的机器可读状态（P9.2 要求轻量实现，不引重型系统） | P9 |
| G-W2 | major | Skill 各阶段"执行合同"不完整：输入 schema、中间产物 schema、失败处理、任务恢复、增量更新、多课程复用缺可执行定义 | P8.5 |
| G-W3 | minor | MCP/外部工具未盘点封装（Filesystem/GitHub/Web Search/学术检索/Context7/Playwright 哪些实际可用未确认；不假设已安装） | P9.4 |
| G-P1 | major | VitePress `docs:build` 未完成（D10.6：清理自身 .temp 触发删除权限被拒，用户选择跳过）；在线站"可构建"未验证 | P10.2（需用户授权后重试） |
| G-P2 | minor | 离线站课程阅读体验增强项（章节前后导航与 pilot 路线联动、教材↔实验双向跳转、术语探索）未系统化 | P10.1 |
| G-P3 | minor | 多领域课程复用未验证：courses/ 下仅 video-rendering-journey；gpu/procedural/ai-engineering journey 未建（属有意分阶段，见 §5） | P10.3 |
| G-R1 | minor | README 数字过时（29 主文档/41 Markdown/311 链接 vs 实测 63 documents；技术索引 124/116 并存）。D10.5 裁决不动 README → **决策提案**：是否授权按实测更新 | 待用户拍板 |
| G-R2 | minor | CHANGELOG P5 数字（62/452/2107KB）与最终源树（63/461/2136KB）漂移 | 已在 PROJECT_CURRENT_STATE §6 记录更正 |

## 5. 有意分阶段建设（不是缺口，不得当错误"修复"）

1. **19 课只有 5 篇教学正文**：pilot 路线 L01→L02→L06→L11→L13 是 curriculum.md 明示的分阶段策略；其余 14 课按学习路径与依赖在 P7 逐篇深化，不机械批量生成。
2. **L17/L18 有实验无正文/quiz**：属 U7 程序化图形学线（Track B 沉淀入口），实验先行是既定顺序。
3. **L00 无正文/quiz/lab**：知识地图课，reading 指向知识架构总览，形态合理。
4. **VitePress 不移植 Vue 交互 demo**：D02/D10.2 既定，实验入口链接回离线站。
5. **Shader Playground 延后**：D10.3 既定。
6. **反馈只读、G1/G2/G3 人工**：设计原则，不是待补功能。

## 6. 缺口 → 阶段映射总览

- **P6（本次执行）**：G-T4 之 L01（Gold Standard）、G-T8、G-D1、G-D4(L01)、G-D5(V06/E03)；诊断覆盖 G-T1–T9 全部；教材质量规范补齐（G-W2 的教学质量部分）。
- **P7**：G-T1/T2/T3/T5/T6/T7/T9、G-D2/D3/D4(L11)/D5(P02)/D6/D7；按依赖顺序逐篇深化，不批量生成。
- **P8**：G-E1–E5、G-W2（执行合同/增量导入/知识追踪）。
- **P9**：G-W1/W3（轻量状态机 + 工具盘点）。
- **P10**：G-P1/P2/P3、G-R1（授权后）。