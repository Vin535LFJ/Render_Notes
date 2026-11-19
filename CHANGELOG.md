# 变更记录（CHANGELOG）

> 本文件记录「AI Knowledge-to-Learning Engine 增量补齐」的执行结果。
> 权威口径见 `DECISIONS.md`；当前阶段见 `WORKFLOW_STATE.md`。
> P5 + Part B 执行期间遵循 D09（不 commit/push）；2026-11-18 用户新授权 commit + push 到 origin/master，见文末"git 提交"段与 DECISIONS.md D09 更新。

## 2026-11-19 · 程序级收口：裁剪生效 + 三批提交（D16 / PD-Q1/Q2/Q7/Q8）

- **裁决**：用户批准 PD-Q7（PD-003 裁剪：Engine 单活跃线；P2 Skill/P03/P04 冻结在现有成果，冻结≠删除；不新建收录类项目）+ PD-Q1/Q2/Q8 按推荐执行。程序级权威记录在 `AI-Knowledge\ai-knowledge-program\decisions\`。
- **三批拆分提交**：`5a4de84`（D15 治理基座，31 文件）/ `a45ffa9`（CHG-0001 P7 教材修复+P2 Skill，33 文件）/ `7c05bc7`（P8/P9 预研：kcr_impact 只读影响分析+publish allowlist+decision-kit，20 文件）+ 本留痕笔。
- **测试修正**：`test_publish_boundary.py` 断言笔误 77→69（注释"移除 8 篇 reviews 后"与断言值矛盾），修正后 **11/11 OK**。
- **发布边界生效**：allowlist 使 reviews/ 不再进入学习站 bundle，build 实测 **69 docs**；archive 行为不变（D10.4）。口径更正：融合基线记录中"知识文档 85→77"为另一会话口径，当前 allowlist 实测知识文档 69（77 为含 8 篇 reviews 的旧总数）。
- **PD-Q2**：P03 本地 git `dec60ba`（39 文件）/ P04 本地 git `942530b`（30 文件），均无远程；测试 **25/38 OK** 本轮实测。
- **PD-Q8**：`program-office-delivery/` 10 份交付副本→回收站（可恢复，原件在办公室）；`.qoder-input-images/` 加入 .gitignore。
- **门禁实测（收口复跑）**：build 69 docs / 17 sections / 124 terms / 19 lessons / 7 labs / 504 cards · validate **11 checks 0 FAIL 0 WARN** · arc **5/5** · review_gate **37 claims（16 verified / 14 open / 7 conditional）误标 0** · publish boundary 11/11。
- **待办**：Render_Notes 迁入 AI-Knowledge（会话占用，需绑定其他目录的会话）；G1/G2/G3 人工裁决（decision-kit）；stash（B12）。
- **git 同步**：四笔已 push（`474c667..9bfa732`，首次遇网络 RPC/SSL 抖动重试成功，ls-remote 实测远端 HEAD=`9bfa732`）。仅 push 源码，未在线发布（D02）。

## 2026-11-19 · 多智能体文档治理基座（D15 / ADR-0001）

### 采纳的架构（用户提案 + 四项裁决）
在 D14 统一仓库之上增量落地治理能力，不改变目录归属：宪法四件套 / MADR（`decisions/` + ADR-0001；`DECISIONS.md` 保留为历史索引，不机械拆分）/ 文档类型×状态机 + frontmatter schema（`standards/`）/ 模板（change-proposal、agent-handoff）/ 轻量变更流程（`changes/`，借鉴 OpenSpec 自研）/ 文档注册表（frontmatter 事实源 + 脚本生成）/ 全客户端适配入口（只跳转不复制）。

### 新增文件
- `.agent/constitution/`：PROJECT_PRINCIPLES / AGENT_RULES（写所有权五规则）/ DOCUMENTATION_POLICY / HUMAN_APPROVAL_POLICY
- `.agent/decisions/`：README（MADR 索引）+ adr-template + 0001-adopt-documentation-governance.md
- `.agent/standards/documentation-types.md`（type/status 枚举 + frontmatter schema + level 派生）
- `.agent/templates/`：change-proposal.md + agent-handoff.md
- `.agent/changes/README.md`（轻量变更流程）
- `.agent/indexes/`：README + document-registry.schema.json + document-registry.json（生成物）
- 适配入口：CLAUDE.md、AGENTS.md、.cursor/rules/render-notes.mdc、.github/copilot-instructions.md、.gemini/GEMINI.md
- `tools/build_document_registry.py`

### 改动
- `.agent/README.md` 升级（分区索引 + constitution 指引 + frontmatter 写入规则）
- 治理文档自身补 YAML frontmatter（dogfooding 修正：初版 blockquote 元数据无法被注册表识别）
- 三个构建工具排除列表新增 `.gemini`/`.cursor`/`.github` + 根 `CLAUDE.md`/`AGENTS.md`
- `.gitignore` 追加 `.agent/runs/`

### 实测
- 注册表初版：**104 篇文档**（frontmatter 26 / unregistered 78 存量渐进补齐；L1 19 / L2 14 / L3 13 / unclassified 58；status：active 14 / approved 5 / draft 6 / archived 1 / unregistered 78）
- build **77 docs 不变**（适配入口与 `.agent` 均排除，零污染）/ validate **11 checks 0 FAIL 0 WARN**

### 边界
- 不预建 6 个空技能目录；不批量给存量文档打状态；DECISIONS 历史不拆分；Run logs 本地化；注册表一致性门禁接入 validate 留 P8
- 待 commit+push（用户授权后执行；与上轮清理分两笔提交）

## 2026-11-19 · 智能体文档统一仓库 .agent/（D14）

### 结构变更（用户裁决四项：文档迁移+脚本留原 / reviews/ 不动 / zcode 归档并提交 / README 合一）
- 建立 `.agent/` 公共智能体文档仓库（入 git）：`skills/research-to-learning/`（SKILL.md + references 5 篇 + assets 2 篇，自 `.workbuddy-ai/skills/` 迁入）、`plans/plan-sess_a45a3e3b-….md`（自 `.zcode/plans/` 归档，B14 裁决：归档并提交）。
- `.workbuddy-ai/` 只做索引：新增 `README.md` 索引；技能 `SKILL.md` 改为发现 stub（frontmatter 保留）；`scripts/check_chapter_arc.py` **不迁移**（门禁命令路径不变，迁移后实测可运行）；`memory/` 受保护不动。
- `.zcode/` 清空后移除（回收站可恢复）；`old_content.js.tmp` 仍待 B14 清理裁决。
- 规则与总索引：`.agent/README.md`（读取规则 / 索引 stub 规则 / 写入规则 / 禁区 / bundle 隔离 / 统一索引）。

### 引用同步
- 路径引用更新：`README.md`、`00-导航与索引/一帧画面的探索之旅.md`（2 处）、`NEXT_PHASE_PLAN.md`、`courses/video-rendering-journey/G2-审核材料-P6.md`、`reviews/G2-curriculum-review.md`、`PROJECT_CURRENT_STATE.md`（结构树 + §4.4）、`IMPLEMENTATION_PLAN.md`。
- 三个构建工具排除列表新增 `.agent`（`tools/build_site.py` / `tools/validate_site.py` / `tools/build_vitepress_content.py`），防知识 bundle 污染。
- 门禁命令（`check_chapter_arc.py` 路径）不变，WORKFLOW_STATE / README / courses README / review_gate.py 无需改动。

### 实测（迁移后重建）
- build：**77 documents / 18 sections / 124 terms / 8 units / 19 lessons / 7 labs / 559 term cards / 2510 KB**（= 69 知识 + 8 reviews；`.agent` 与 `.workbuddy-ai` 均排除，篇数与迁移前一致，无污染）。
- validate：**11 checks / 0 FAIL / 0 WARN**；arc：**5/5 OK**；review_gate：**33 claims 误标 0**。
- 边界：未升级任何 claim；未填人工结论；stash 未动（B12）；`old_content.js.tmp` 未动（B14 部分）。

### git 同步（2026-11-19 用户授权"授权 commit + push"）
- 结构治理 commit **`f5d4ecf`**（26 文件，+258/−91；git 识别 7 处 100% rename）已 push 到 origin/master（`656d107..f5d4ecf`）；`ls-remote` 实测远端 HEAD=`f5d4ecfa65480abcb5c276617c227c5da9d89cfb`，本地与远端同步。**仅 push 源码，未做在线发布**（D02 未授权）。

### 清理（2026-11-19，用户授权）
- 删除临时备份 `old_content.js.tmp`（2.35MB，Loop 1 的 content.js 安全备份，使命已完成；走回收站可恢复）。
- 清理 3 处过期计划引用（`DECISIONS.md:5` / `IMPLEMENTATION_PLAN.md:3` / `WORKFLOW_STATE.md:5`）：原指向仓库内不存在的 `.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md`，改为如实说明——计划原件位于用户目录 `~/.workbuddy-ai/plans/`（会话级产物，不入仓库），关键裁决已萃取至 `DECISIONS.md` D01–D14。D14 已知问题就此关闭。
- 门禁复跑：build 77 docs / validate 11 checks 0 FAIL 0 WARN（content.js 同步重建）。

## 2026-11-19 · Master Prompt V3.0 · Loop 2 裁决后执行（部分）

> 收到用户裁决（D12）+ 新增 Knowledge Change Review 机制需求（D13）。网络恢复，权威来源核验完成。

### 裁决记录与机制设计
- DECISIONS.md 新增 **D12**（B1–B6/G1-01/G1-02 逐项裁决，含待定项 B4/B10–B15 不视为同意）+ **D13**（引入 KCR 机制）。
- 新增 `reviews/KNOWLEDGE_CHANGE_REVIEW.md`：KCR 五阶段（影响分析→变更提案→人工审核→增量更新→验证归档）+ impact/proposal/decision JSON schema + 与现有 tools/evidence 集成方案 + "新 GPU 同步机制" worked example。实现归 P8（D3/D4）。

### 权威来源核验（G1 §7 增补）
- SurfaceTexture：正确 `SurfaceTexture.getTransformMatrix()`（AOSP/NDK 官方），`glGetTransformMatrix()` 不存在 → 勘误解码链路:124。
- Pass 阈值：Frostbite GDC 2017/Vulkan 无硬阈值，属启发式 → 统一 ≥3 并软化，勘误跨平台:205。
- V13 生理：核心高置信支持（Wikipedia 引 Winkler 2001/Livingstone 2002/ACM），但杆/锥因果属简化 → 建议修正表述后升级（待人工，本轮未改 V13/L01）。
- seek：Media3/FFmpeg/MediaCodec/ExoPlayer 证实静默解码追赶+首帧强制渲染；原"禁止立刻丢帧"表述不准确。

### 已执行（已裁决安全项 + Category A）
- **B2**：tools/course.json L12.next L15→L13；一致性脚本复跑主线 L00→…→L18 先修全满足（branch=[]，ALL CONSISTENT）。
- **B5**：README 三处数字按实测更新（26 主文档/57 非归档 md/7 实验/124 术语；保留 chat 链接）。
- **B3**：lesson-quality-standard.md 采纳为可迭代基准。
- **A1**：L01 行数约300→239（CHANGELOG/G2材料）；PROJECT_CURRENT_STATE claim/source 29/15→31/16 + V3.0 真值指引。
- **A3**：build_site.py 排除 .zcode/（消除 bundle 污染）。
- **A4**：学习路径指南.md 补 U7/程序化几何 L17/L18（W10+ 行）。
- **A5**：concepts.json K-STRIDE source_claim V02→V14。
- **C2/B9 勘误**：解码链路:124 API 名；跨平台:205 Pass 口径。

### P7.1 第一项 L02 修复（blocker G-T1/G-T2）
- 新断言 **V15**（精准 seek 静默解码追赶+首帧强制渲染）/**V16**（Δt 分级同步+多路 PLL），默认 open；新来源 SRC-MEDIA3-SEEK（official_doc）/SRC-RN-DECODE-PIPELINE（repo_doc）；V16 复用 SRC-FFMPEG-DOC/SRC-RN-AV-BASE 反向索引。
- 两层 course.json L02：目标[2] 改写为准确 seek 表述；checkpoint[1] 失实"强纠偏区"→"Δt 正/负处理"；新增 checkpoint[2] seek。
- L02 正文重写：§4.3 夸大引用改为真实 Δt 两分支+PLL⚠️条件；新增 §4.4 精准 seek；§4.1 补 I-B-P-B-P 五帧表；§5 Δt 公式；§6 误区修正；§9 三题对应三 checkpoint；§11 断言状态说明。
- quizzes/L02.json 重写为 4 题（Q1 B帧 V03 / Q2 Δt V16 / Q3 主时钟 V10 / Q4 seek V15），覆盖 3 checkpoint。

### 门禁（本轮实测）
- build **77 documents**（69 知识 + 8 reviews；.zcode 已排除）/ 18 sections / 124 terms / 19 lessons / 7 labs / 559 term cards。
- validate **11 checks / 0 FAIL / 0 WARN**；arc **5/5 OK**（含重写 L02）；review_gate **33 claims（16 verified/7 conditional/10 open）误标 0**；一致性脚本 ALL CONSISTENT。

### 边界与待续
- 未 commit/push（D12.11）；未升级任何 claim（V13/V14/V15/V16 均 open 待 G1）；未填人工结论。
- **git 同步（2026-11-19 用户授权"同步最新更改到github"）**：commit **`d4a9620`**（27 文件，+1289/−53：Loop 2 裁决执行产物 + reviews/ 8 份审核材料 + KCR 机制文档），已 push 到 origin/master（`650bb14..d4a9620`，`ls-remote` 实测远端 HEAD=`d4a962089254e6ad419ce1e010a1a969c381f7f2`，本地与远端同步）。`.zcode/`（外来 agent 产物）与 `old_content.js.tmp`（临时备份）按 B14 未纳入；**B13 由本次同步授权解答：reviews/ 已纳入 git**。
- **未改 L01**（B4 待用户阅读；V13 表述修正建议待裁决）；未动 archive/memory/vendor/index.html/两份方案；外来产物 .zcode/old_content.js.tmp/stash 未触碰（B12/B14 待裁决）。
- 待续：P7.1 L06（第三项）/L13（第二项，待 B10 断言登记裁决）/L11（第四项）；B6 VitePress 本地构建排 P10。
- 仍待人工：B4（L01 认可）、B7/B8（V13/V14 升级）、B10–B15。

## 2026-11-19 · Master Prompt V3.0 · Loop 1 审核准备

> 审核驱动开发：本轮只做审核材料与分类，**不执行依赖人工裁决的修改**。产物在 `reviews/`（7 文件）。

### 仓库复核与基线（实测）
- 本地 HEAD=`650bb14`，origin/master 引用同值；**本 turn `git ls-remote` 因网络/DNS 中断受阻**（Could not resolve host），远端新鲜同步待网络恢复复核，不声称已验证。
- 工作区审计前非干净：`M web/content.js`（另一 agent 今早 08:59 重建，比 HEAD 多约 8.8KB）+ 未跟踪 `.zcode/plans/plan-sess_*.md`（6034B）+ `old_content.js.tmp`（2.35MB）。外来产物**未触碰**；content.js 备份至临时目录后按 V3.0 计划恢复 HEAD。
- stash@{0}：README/archive/README/学习路径指南 3 处用户改动，**未 pop/drop**（B12 待裁决）。
- 四道门禁：build **70 docs/18 sections**（含 .zcode 污染）/ validate **11 checks 0 FAIL 0 WARN** / arc **5/5 OK** / review_gate **31 claims（16 verified/7 conditional/8 open）误标 0**。
- **content.js drift 根因**：build_site.py:440-445 未排除 `.zcode/`，未跟踪工具计划文件被当第 70 篇文档；干净基线 **69 docs/17 sections/497 cards/2291 KB**（HEAD bundle）。validate §7 仅查前缀不比对篇数，恢复 HEAD 仍 0 FAIL。登记 Category A（A3）。

### 偏差登记（声称 vs 实测）
- ① L01 行数：CHANGELOG/G2材料"约300行" → 实测 **239 行**。
- ② claim/source：PROJECT_CURRENT_STATE "29/15" → 实测 **31/16**（P6 新增 V13/V14+SRC-RN-AV-BASE）。
- ③ build 篇数演进 48→62→63→69；当前干净基线 69（PROJECT_CURRENT_STATE §3 仍停 63 基线快照）。
- ④ V3.0 根目录 quizzes/ 实际在 courses/video-rendering-journey/quizzes/。
- ⑤ stash 未决（B12）。⑥ 程序化模块以 07 文档落地（非"08 章节"），course.json L00–L18/8 单元；无 08-* 目录。

### 程序化模块闭环核查
- 文档（07/程序化几何与旋转曲面.md 170行 ✅/⚠️）+ L17/L18 元数据 + procedural-lathe/pbr-lighting 实验 + glossary procedural-graphics 组 + graph.json 节点 + 双线规划§7"任务二阶段1成课"——**闭环成立**。
- 唯一导航缺口：学习路径指南.md 未收录 U7/L17/L18（F-2，Category A4）；UV 无独立术语条目（F-3，C7）。

### 审核材料（reviews/ 新增 7 文件）
- CURRENT_AUDIT.md：git/门禁/偏差/程序化闭环/真值快照。
- G1-evidence-review.md：31 claim 全量（双向索引完整、23 概念 source_claim 全解析）；V13/V14 升级评估（引源文档✅段，不自动升级）；Pass 口径冲突（跨平台:205 ">3" vs 验真队列:47/概念引入:145 "≥3"）；SurfaceTexture API（解码链路:124 glGetTransformMatrix 不准确，3D变换:225 正确）；L13 断言缺口（4 候选）；K-STRIDE 弱挂 V02。
- G2-curriculum-review.md：G2-01…06 重核（修正旧结论：seek 目标有 glossary:641 种子但与§8.2 机制语境矛盾）；G2-02 确定性复跑确认主线矛盾，**单指针修复方案 L12.next→L13**；G2-04 重读 L01 239 行十维度达标。
- G3-release-readiness.md：**G3 仍未通过**；结构层就绪/语义层未就绪；人工评分表留空。
- REVIEW_STATUS.md：A/B/C 分类（A1–A6 / B1–B14 / C1–C7）。
- DECISION_REQUIRED.md：统一裁决表 B1–B15，空白裁决栏，未回复不视为同意。
- EXECUTION_PLAN_V3.md：Loop 2（裁决→Category A→P7 blocker L02→L06→L13→L11→P7.2）/ Loop 3（P8→P9→P10 独立验收）。

### 边界确认
- 仅新建 reviews/ 7 文件 + 更新 WORKFLOW_STATE.md/CHANGELOG.md（本文件）；**未改任何既有内容文件**（含 build_site.py/concepts.json/主文档/README）。
- 未升级任何 claim；未填任何人工结论/评分；未 pop/drop stash；未触碰外来产物；未 commit/push。
- content.js 恢复 HEAD（生成物可再生，计划授权）；未动 archive/memory/vendor/index.html/两份方案。
- 记忆修正：程序化模块已并入 07（非 08）；当前续跑点=等待 DECISION_REQUIRED 裁决。

## 2026-11-18 · P6 教材质量升级（Master Prompt V2.0）

### 第一步审计（实测）
- 远程 master HEAD = 本地 HEAD = `5359259`（ls-remote 实测），工作区审计开始时干净。
- 门禁基线：build 63 docs / validate 11 checks 0 FAIL / arc 5/5 OK / review_gate 29 claims（16 verified / 7 conditional / 6 open）。
- 产出：`PROJECT_CURRENT_STATE.md`、`CURRENT_GAPS.md`、`NEXT_PHASE_PLAN.md`（根目录）。
- 记录性偏差：CHANGELOG P5 数字（62/452/2107KB）与最终源树（63/461/2136KB）漂移，已提交 content.js 与重建产物文档集合一致（仅时间戳类差异）；README 数字过时但按 D10.5 不动，列决策提案。本机 `python` 解析到 cygwin stub，门禁改用 `py -3`（D11.10）。

### P6.1 深度诊断
- 新增 `courses/video-rendering-journey/教材质量诊断.md`：十维度逐章判定 + 源文档行号核对 + 跨层数据交叉核对。
- 关键发现：L02"drift 强纠偏区/分级处置"源文档不存在（blocker，夸大引用）；L02 目标"seek 后禁止立刻丢帧"无出处（blocker）；L13 核心知识无断言支撑、quiz 弱挂/空挂（blocker）；L06 目标漂移+§7.3 错位；L11 乱码四处+RenderPass 过度简化；L01 数字口径/推导缺失。
- 诊断明确为 AI 线索，非人工评分；G1/G2/G3 状态未变。

### P6.2 覆盖矩阵
- 新增 `courses/video-rendering-journey/课程覆盖矩阵.md`：19 课 × 元数据/正文/Quiz/Claim/Lab；元数据 19/19、正文 5/19、Quiz 5/19、Lab 7/19、断言挂载 13/19。
- 核对结论：pilot 5 课为有意分阶段（非遗漏）；pilot next 指针与路线矛盾（已修）；主课程 L12.next=L15 与 L15 先修矛盾（留 G2 拍板）；L02/L06/L11 两层目标漂移（留 P7）。
- **第 3 项确定性验证**（一次性审计脚本，不入仓库）：先修存在性 19/19 + DFS 无循环；主课程 next 链行走实测 L15/L17/L18 先修未满足（G-D2 精确量化到 L17/L18）；pilot 路线 next 指针 + §10 正文桥 + lessonFile + quiz + lab 双向**全部一致 0 问题**；labs.json 7 实验 lesson 反向均有效。桥接检测限定 §10 段落，排除 §11 延伸链接误报。结论已写入覆盖矩阵 §2.1，G-D2 范围同步扩展至 L17/L18。

### P6.3 Gold Standard L01 + 数据修复
- 重写 `lessons/L01-为什么视频不是-RGB.md`（88→239 行，实测）：精确数字开篇（22.4GB vs 112.5MB 两刀分解）、生理依据（V13）、4:2:0 记号与采样对照表、NV12 布局图、stride 公式+1080@128 算例+逐行错位推导+绿屏成因计算（V14）、glPixelStorei 代码、排查案例、实验四任务+full-range 边界、因果链回忆。checkpoint 两题原文保留。
- `evidence/claim-ledger.json`：新增 V13/V14（open/low，待 G1 升级，note 说明提取来源）；V06 used_by 补 L13、E03 补 L11。
- `evidence/source-registry.json`：新增 SRC-RN-AV-BASE（repo_doc），双向索引完整。
- `quizzes/L01.json`：Q2 改挂 V14，答案补绿线/累积偏差依据。
- 两层 course.json：L01 乱码目标修复；pilot next 对齐 L01→L02→L06→L11→L13→null（D11.2）。
- 未动其余四篇样章内容（修复留 P7，D11.7）。

### P6.4 质量规范提案 + G2 材料
- 新增 `.workbuddy-ai/skills/research-to-learning/references/lesson-quality-standard.md`（十维度/六问/类比边界/数学三件套/引用与断言纪律/知识类型结构/诊断程序）；SKILL.md 登记阅读指引、Phase 5 审核动作、Helpers。**提案状态，待 G2 人工确认，AI 未宣布通过。**
- 新增 `courses/video-rendering-journey/G2-审核材料-P6.md`：变更清单 + 6 个待拍板问题（行为语言）+ 语义审核 8 项清单 + 空白评分表。

### 门禁（P6 结束实测）
- `py -3 tools/build_site.py`：69 documents / 17 sections / 124 terms / 8 units / 19 lessons / 7 labs / 497 term cards / 2291 KB（新增 6 篇审计/诊断/矩阵/G2 文档计入）。
- `py -3 tools/validate_site.py`：**11 checks passed, 0 warnings, 0 failures**，exit 0。
- arc：5/5 OK（含重写后的 L01）。
- review_gate：只读复跑正常，G1/G2/G3 仍待人工，未写任何分数。

### 边界确认
- 未 push / 远程发布（D09 远程需另行授权）；未动 archive / memory / vendor / index.html / 两份旧方案 / README。
- 治理文档同步：DECISIONS.md 新增 D11；WORKFLOW_STATE.md 更新续跑点为 G2；IMPLEMENTATION_PLAN.md 新增 P6 勾选与 P7–P10 待办。
- 已知风险：V13/V14 为 open 断言，G1 升级前教材以主文档锚点为权威；L02 blocker 内容在 P7 修复前仍在线（诊断与 G2 材料已显著标记）。

### git 提交（2026-11-18 用户授权"先提交代码，保存修改"）
- P6 全部产物本地 commit **`3ce7b2f`**（19 文件，+978 / −44）：审计三件套 + 诊断 + 覆盖矩阵 + Gold Standard L01 + V13/V14/SRC-RN-AV-BASE + quiz/next/乱码/used_by 修复 + 质量规范提案 + G2 材料 + 治理文档 + content.js。
- **仅本地 commit，未 push**（D09/D11.9：远程需另行授权）。提交后工作区干净；本笔记录哈希的文档更新随后单独提交。
- **push（2026-11-18 用户授权"push吧"）**：`git push origin master` 成功，`5359259..0b2c0a1`；`ls-remote` 实测远端 HEAD=`0b2c0a16f9de2735a722abdc8d57bc0d94620953`，本地与 origin/master 同步。**仅 push 源码，未做在线发布**（GitHub Pages 等 D02 仍未授权）。

## 2026-11-18 · P5 收尾验收

### 三重确定性门禁（实测）
- `python tools/build_site.py`：写出 `web/content.js`；`62 documents / 17 sections / 11 glossary groups / 124 terms / 8 units / 19 lessons / 7 interactive labs / 452 term cards / 2107 KB`。
  - 说明：文档数/节数高于 P0 基线（48/11），因 P1–P4 新增 `courses/`、`evidence/`、`knowledge-model/` 三个顶层树；`site-vitepress/` 生成树已被正确排除（`build_site.py` 过滤 `site-vitepress`）。
- `python tools/validate_site.py`：`validate_site: 5 checks passed, 0 warnings, 0 failures`，末行 `OK`，exit 0。
- `python .workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py courses/video-rendering-journey/lessons/*.md`：5 篇样章（L01 / L02 / L06 / L11 / L13）全 `OK`，exit 0。
- JSON 结构兜底：`tools/*.json` + `evidence/*.json` + `knowledge-model/*.json` + `courses/.../*.json` 共 14 个文件全部可解析。

### 浏览器 QA（离线主站，零构建）
- 两路验证：`file://` 双击 `web/index.html`、`http://localhost:8765`（`python -m http.server 8765`）。
- 五视图（`#/`、`#/course`、`#/lab`、`#/graph`、`#/tech`、`#/glossary`）均渲染出内容；侧栏 62 链接。
- 7 个实验逐个打开均有 canvas + 3 项自检：`transform-mvp`、`procedural-lathe`、`pbr-lighting`、`yuv-to-rgb`、`pts-dts-timeline`、`frame-pipeline`、`rendergraph-dag`。
- 教材路由 `#/doc/courses/video-rendering-journey/lessons/L01-...md`：frontmatter 已剥离；教材模式 `#/course/L01` 可达。
- `Ctrl+K` 搜索框、明暗主题、390×844 移动视口、hash 刷新保持均正常；控制台/页面错误 0。
- 已知良性提示：agent-browser 报告 Chrome 版本落后（与本仓库无关）。

### review-report.md 收口
- 仅把"自动检查（已执行）"三行结果改为实测值，并新增一段"执行记录（自动检查结果，非评分）"。
- **未填任何分数**：评分表"自评"仍为 `待人工`、"人工评分"仍为 `—`；G1/G2/G3 仍为未勾选；结论仍为 `待人工评分后填写。生成 Agent 不在此处填写"通过"。`

### 已知限制（D10.6，如实记录）
- P4 VitePress `npm run docs:build` 未完成：vitepress 需清理自身 `.vitepress/.temp/` 构建中间产物，触发删除权限请求被用户拒绝；用户已选"跳过构建，如实记录"。
- 本计划**未重试**该命令；源码树（`package.json` / `README.md` / `.vitepress/config.mjs`）与生成的 46 篇策展文档保留，`npm install` 成功（vitepress 1.6.4）。不伪造构建成功。

### 边界确认
- 未 commit / 未 push / 未远程发布（D09）。
- 未改动：`README.md`、两份 GPT 方案文档、`archive/**`、`web/index.html`、`web/vendor/**`、`.workbuddy-ai/memory/**`。
- 人工审核关卡 G1/G2/G3 仍待人工，AI 未自评通过。

## 2026-11-18 · Part B 文档缺口增量补齐

批准计划：`C:\Users\Giant\.workbuddy-ai\plans\radiant-cascade-newton-e440_pIP.md`。用户确认"两者都要" + B5 连前端 UI 一起做（对 D04 的明确授权偏离，仅限 `web/assets/app.js`、`styles.css`，无远程）。

### B1+B2 · validate_site.py 第 11 节（coverage）
- 仅**新增**第 11 节，前 10 节零改动（符合 D07）：
  - 11a 每条 claim 必须有 evidence（孤立断言 FAIL）；`verified` 但未挂任何课时 WARN；`open/conditional` 未挂载属预期（P03），不误报。
  - 11b 每个 checkpoint 必须被 quiz prompt 覆盖；quiz `claim_ids[]` 必须 ⊆ 课时声明的 `claims[]`；覆盖以归一化文本双向包含判定（实测 5/5 课全覆盖）。
  - 11c `tools/feedback.json` 可选校验：`type` 枚举、lesson/quiz/claim ID 可解析（quiz 未找到记 WARN）。
- 负向自检：临时清空 V01 的 evidence → `[coverage] V01: no evidence item` FAIL、exit 1；恢复后 0 FAIL。
- 门禁：validate 由 5 checks → **11 checks passed, 0 warnings, 0 failures**。

### B3 · Skill 角色契约补齐（不建顶层 skills/）
- `SKILL.md`：frontmatter description 补两角色；角色表新增 4b Practice Designer、5b Knowledge Publisher / Feedback Analyst 两行（含 gate）；阅读指引与 Helpers 登记 `practice-and-review.md`。
- `references/workflow-details.md`：在 mapped roles 段后补两角色完整契约（input/actions/output/gate/boundary/reference）。
- 新建 `references/practice-and-review.md`：两角色契约 + G1/G2/G3 人工关卡清单 + 本地反馈循环说明。
- 验证：validate 0 FAIL；`skills/`、`scripts/` 顶层目录未创建。

### B4 · tools/review_gate.py（只读前置清单）
- 新建 stdlib 工具：打印 G1（claim 状态分布、conditional/contested 误标 verified 检查）、G2（curriculum 七段存在性 + 每课时前置/目标/checkpoint 概况）、G3（确定性门禁命令 + review-report 仍待人工状态）的自动前置条件。
- 实测：29 claims（verified 16 / conditional 7 / open 6），误标 0；curriculum 7/7 段齐全；G1/G2/G3 未勾选 3 个。
- **不写分数、不勾关卡、不运行门禁**；review-report.md 字节未因本工具改变。

### B5 · 学习反馈闭环（数据 + 只读聚合 + 离线前端 UI）
- 数据层：新建 `tools/feedback.json`（version + entries[]，空；字段 lesson/quiz/claim_ids/type/note/ts，无个人信息、无远程）。
- 聚合层：新建 `tools/report_feedback.py`（只读，按 type/lesson/claim 汇总 + 从 claim-ledger 取回断言文本输出 needs-review 线索；不改任何状态）。
- 前端 UI（`web/assets/app.js`、`styles.css`，用户授权偏离 D04）：
  - 复用既有 `rn-course-progress` 阅读进度机制，未重复造轮子；
  - 新增 `rn-feedback-queue` localStorage 队列；教材页 L## 与配套文档自动预填课时/quiz；反馈表单（type/lesson/quiz/claim_ids/note）；"加入队列 / 导出 JSON / 清空"三按钮；`Blob` + `URL.createObjectURL` 纯浏览器导出（无第三方库、无网络请求）。
  - `styles.css` 追加反馈面板样式（明暗主题 + ≤640px 移动端 + print 隐藏）。
  - **未改** `web/index.html`（UI 动态注入到 `#content`）。
- 端到端验证（浏览器实测）：填写→提交→localStorage 落库（含 lesson=L01、quiz=L01、claim_ids=[V02,V12]、ts）→刷新后保留、徽标计数同步；导出 payload 结构 = `{version:1, entries:[...]}`；将同结构样本放入 `tools/feedback.json` 后 `report_feedback.py` 正确输出 V02/V12 的复核线索；样本已移除、`feedback.json` 恢复空、门禁绿。
- 回归：五视图 + 7 实验 + 教材路由 + 搜索/主题/移动端全部正常，反馈面板仅出现在课时页，控制台 0 error。

### Part B 边界与收口
- DEFER（逐项理由）：10-Skill 树 / 多 Agent runtime / MCP / 向量 DB / 远程发布 / 修 docs:build / Shader Playground（违反 D04/D09/D10.3/D10.6 或体量过大）；机器可读知识缺口检测（与 `知识缺口登记表.md` 单一来源冲突，待定权威）。
- D04 偏离仅此一处（B5 前端），已按用户授权执行；未新建顶层 skills/ 或 scripts/。
- Part B 执行期间未 commit / push / 发布；未碰两份方案文档、archive、web/index.html、web/vendor、.workbuddy-ai/memory。（git 提交见文末，README.md 的纳入为用户新授权。）

## 2026-11-18 · git 提交（用户新授权）

- 用户在 P5 + Part B 完成后明确要求"提交 git 更新"，并确认 **commit + push 到 origin/master**、**README.md 的 3 行 chat 链接改动一并纳入**（见 `DECISIONS.md` D09 更新）。此为一次性授权，不改变其余"绝对不动"项。
- 提交内容：
  - 引擎层：`tools/validate_site.py`（第 11 节 coverage）、`tools/review_gate.py`、`tools/report_feedback.py`、`tools/feedback.json`、`tools/build_site.py`、`tools/labs.json`、`tools/graph.json`、`tools/course.json` 等既有改动。
  - 前端：`web/assets/app.js`（反馈 UI + 既有实验渲染）、`web/assets/styles.css`、`web/content.js`（生成物）。
  - 课程/证据/知识模型：`courses/`、`evidence/`、`knowledge-model/` 全部产物。
  - Skill：`.workbuddy-ai/skills/research-to-learning/`（角色契约 + practice-and-review.md + 既有脚本改动）。
  - 在线站源码：`site-vitepress/`（源码三件套；生成物由 .gitignore 排除）与 `.gitignore`。
  - 文档/状态：`DECISIONS.md`、`IMPLEMENTATION_PLAN.md`、`WORKFLOW_STATE.md`、`CHANGELOG.md`（本文件）、两份 GPT 方案文档（新增跟踪）。
  - README.md：用户此前的 3 行 chat 链接改动（按本次授权纳入）。
- 未纳入/未执行：在线发布（GitHub Pages 等，D02 未授权）；VitePress `docs:build`（D10.6 已知限制，未重试、未伪造）；`.workbuddy-ai/memory/**`（绝对不动）。
- 提交哈希与远端同步状态：见 `git log -1` 与 `git status`（push 后本地与 origin/master HEAD 一致）。

## 2026-11-19 · CHG-0001 四项目并进拓展（用户授权，本地执行）

用户裁决：四项目同时启动；只建本地、不碰 GitHub（不建仓/不 push/不部署）；P1 做完全部剩余 P7；Render_Notes 现有 25 项未提交变更保持原样、增量修改。变更包 `.agent/changes/CHG-0001-four-project-expansion/`（proposal + tasks）。

**P1 · Render_Notes P7 未闭合 gap 修复**（基线门禁 11 checks 0 FAIL/0 WARN、arc 5/5）：
- L13（G-T3/T9/B10）：新登记 4 条 open 断言 V17（坐标空间链）/V18（MVP 列序）/V19（透视除法与插值）/V20（NDC 跨 API 差异），配套 `SRC-RN-3D-TRANSFORM` 来源；frontmatter claims 从误挂 V06 改为 V17–V20；正文 §4.2/§4.3/§5/§6 修正 Y-flip 含糊表述与透视插值推导；quiz Q1/Q2/Q3 重新挂接（消除空 claim_ids）。断言默认 open，不升级 verified。
- L06（G-T5/T6/D5）：两层 course.json objectives 对齐源文档真实内容（updateTexImage/变换矩阵、第一道转换 Shader、PC vs 移动通路）；正文 §4.1/4.2 补 updateTexImage 与 FBO→2D 转换机制，纠正 §7.3 错位引用，色彩出处改 `03-图形与GPU工程/色彩管理与采样滤波.md`，补 P02 声明；source anchor slug 修正（validator 实测通过）。
- L11（G-T7/D4）：§4.1 修正"FBO=VkRenderPass 换名字"过度简化（区分 RenderPass API 声明 vs RenderGraph 工程抽象、Vulkan 附件预声明）；乱码"barrier 是由谁 inserted？"四处同步改为"barrier 由谁插入？"（两层 course.json checkpoint + 正文 §9 + quiz Q2）。
- L02：核对已闭合（V15/V16 + 正文改写已在 Loop 2 落地），本轮不改。

**P2 · learning-experience-design Skill**（Engine 内部，不独立仓库）：
- 新建 `.agent/skills/learning-experience-design/`：SKILL.md + 8 references（design-system/editorial-layout/learning-page-archetypes/educational-visualization/interaction-patterns/accessibility/responsive-design/visual-quality-gates）+ 3 assets + `scripts/check_visual_floor.py` + 试点规格 `preview/PILOT-L13-plan.md`。
- 上游核对：Impeccable（Apache-2.0）、Hallmark（MIT）——只吸收方法，不复制代码/素材。试点选 L13 教材页 + transform-mvp 实验页，**待用户确认设计方向**，不改线上站点。
- 三个 build 脚本已整体排除 `.agent`（D14），新 Skill 自动不进知识 bundle；registry 重生成（119 docs）。

**P3 · agent-workspace-governance（新本地目录 `C:/Users/Giant/Desktop/GITCODE/agent-workspace-governance`）**：
- Portable Agent Project Governance Kit：README/AGENTS/宪法四件套 + 5 JSON Schema + 6 模板 + 5 端 adapters + CLI 9 命令（init/inventory/validate/status/map/handoff/adr/archive-check/audit）+ tests（11 passing）+ 两个迁移样例（Render_Notes / 普通项目）+ docs 三篇。明确三概念边界、不重造 Skills、不做 Orchestrator。

**P4 · github-project-radar（新本地目录 `C:/Users/Giant/Desktop/GITCODE/github-project-radar`）**：
- 开源情报系统本地实现：SQLite 快照模型 + 注入式离线采集（fixtures，**不调用 GitHub API**）+ 24h/7d/30d 增长（历史不足标注、不伪造）+ 可配置评分 + 周报七板块 + 深度研究模板 + 人工审核状态机 + Engine 研究任务导出接口 + CLI + tests（17 passing）+ docs 三篇。

**门禁与边界**：build/validate(0/0)/arc(5/5)/review_gate 全绿；两新项目 unittest 11+17 全绿；未 commit/push、未建远程仓库、未联网采集、未碰受保护目录与用户未提交变更。G1/G2/G3 仍待人工，未自批。

## 2026-11-19 · 融合基线增量补齐（新架构文档 = 缺陷清单 + 规格增量）

用户裁决：保留上一会话全部已建成果（融合基准，不重做）；reviews/ 泄露为第一优先、archive 不动；只备人工裁决材料不代批；两新项目保留目录名；Skill 补 5 篇保留旧 8 篇；仅本地零 git 操作。计划见 `~/.workbuddy-ai/plans/stellar-thunder-lovelace-4LLY_xlW.md`。

**P1 · 发布边界泄露修复（第一优先）**：新增 `tools/publish_boundary.py`（集中式排除 + 咨询性 allowlist）+ `tools/publish-allowlist.json` + `tools/test_publish_boundary.py`（11 测试）；`build_site.py` / `build_vitepress_content.py` / `validate_site.py` 三处增加 `reviews/` 排除；重生成 `web/content.js`（知识文档 85→77，恰好移除 8 篇审核材料）与 VitePress 树。`archive/` 发布行为不变（D10.4）；注册表仍故意索引 reviews。strict allowlist 强制切换列为人工裁决。

**P2 · 状态文档漂移**：`WORKFLOW_STATE.md` / `reviews/DECISION_REQUIRED.md` / `reviews/REVIEW_STATUS.md` 早期表的过期"B10–B15 未答复"改为指针行（B13/B14 已裁决归档见 D11/D12）；`PROJECT_CURRENT_STATE.md` 头部加"增量校正（2026-11-19）"块（HEAD `474c667`、5/19 正文仍成立），保留原快照。

**P3 · 人工裁决材料包**：新增 `reviews/decision-kit/`（README + B4/V13/V14/B10/B11/B12/B15 七份），9 段模板 + 空白裁决栏；B12 仅 `git stash show -p stash@{0}` 只读摘录（链接路径修正），未 pop/drop/apply。7 项 + G1/G2/G3 全部 OPEN，无一项代批。

**P4 · Skill 规范增量**：`.agent/skills/learning-experience-design/references/` 新增 5 篇（learning-ux-principles / learning-interaction-patterns / visual-system-and-layout / accessibility-and-responsive / ux-review-checklist），旧 8 篇全保留，SKILL.md 改双索引表；`status: draft` 不动。参考文档 8→13 篇。

**P5 · Governance 增量**（`agent-workspace-governance`）：13 类文档类型枚举（ADR/Spec/Plan/Task/Runbook/Glossary/Architecture/Skill/Workflow/Script/Handoff/Audit/Session Note）、Task Claim / Single Writer per Path / dependency frontier 协议与纯函数、CLI 新增 `doctor` + `index`（`inventory` 保留），tests 11→25 全绿。目录名不变、名称映射写入 README。

**P6 · Radar 增量**（`github-project-radar`）：三维独立评分（Discovery Signal / Engineering Quality / Relevance to My Learning Ecosystem，缺失标 unknown）、canonical 生命周期 + 旧状态别名、`human_selected_for_research` flag、溯源字段、`YYYY-WW.md`+JSON 报告、`radar/sources/` 接口 stub（零网络）、research 默认 `research/owner__repo.md`，tests 17→38 全绿。目录名不变。

**P7 · P8/P9 只读基础**：新增只读 `tools/kcr_impact.py`（Source→Claim→Concept→Lesson→Quiz→Course→Website 影响链，实测 SRC-RN-AV-BASE 得 3 claims/2 lessons/2 quizzes）+ `reviews/kcr/KCR-IMPACT-TOOL.md` + `reviews/P9-orchestrator-design.md`（状态机 + run-state schema 内联，均 draft）。不写源 JSON、不升级 claim、不建运行态文件、不批量生成课文。

**门禁/边界**：validate 11/0/0、arc 5/5、boundary 11 tests、review_gate 只读（G1/G2/G3 未通过）、governance 25 + radar 38 tests 全绿；registry 重生成 143 docs；HEAD 仍 `474c667`、stash@{0} 仍在、零 commit/push/建仓/联网。
