# CURRENT_AUDIT · Loop 1 仓库复核与基线重建

> Master Prompt V3.0 §2 / Loop 1 Step 1 · 审计时间 2026-11-19。
> 口径：以当前本地代码实测为准；文档声称与实测不符处登记偏差（§3），不沿用旧快照。
> 本文件仅报告事实与证据（file:line），不含人工审核结论。配套：G1/G2/G3 审核材料、REVIEW_STATUS、DECISION_REQUIRED、EXECUTION_PLAN_V3。

---

## 1. Git 复核（只读实测）

| 项 | 实测 | 证据 |
|---|---|---|
| 本地 HEAD | `650bb14` | `git log --oneline -1` |
| 分支 | `master` 跟踪 `origin/master` | `git status -sb` |
| 本地 origin/master 引用 | `650bb148bfc7db253896e8c05feb2bf154b01f4f`（= HEAD） | `git rev-parse origin/master` |
| 远端新鲜核对 | **本 turn 受阻**：`git ls-remote` 报 `Could not resolve host: github.com`（网络/DNS 不可用） | ls-remote 输出 |
| 最近提交 | 650bb14（记录push）→ 0b2c0a1（记录commit）→ 3ce7b2f（P6）→ 5359259（P5） | git log |
| stash | `stash@{0}: On master: sync-pull: 暂存README/archive/学习路径指南3处本地改动` | `git stash list` |

**结论**：本地与"上次已知远端引用"一致（650bb14）；因网络中断，本 turn 无法新鲜验证 GitHub 远端 HEAD，如实记录为"待网络恢复后复核"，不声称已验证远端同步。

### 1.1 工作区状态（含外来产物，均未触碰）

审计开始时工作区**非干净**，存在上一轮（P6 推送后）之外新增的状态：

| 状态 | 文件 | 性质 | 处置 |
|---|---|---|---|
| `M`（审计前已存在） | `web/content.js` | 另一 agent 今早 08:59 重建的生成 bundle，比 HEAD 多约 8.8KB（generatedAt 2026-11-19 08:59 vs HEAD 2026-11-18 21:45） | 备份到临时目录后，按 V3.0 计划恢复 HEAD 版本（见 §2.1） |
| `??` 未跟踪 | `.zcode/plans/plan-sess_a45a3e3b-….md`（6034 B） | 另一 agent（zcode）的计划文件 | **不触碰**；登记为外来产物 |
| `??` 未跟踪 | `old_content.js.tmp`（2,353,123 B，2026-11-19 09:00） | content.js 临时备份 | **不触碰**；登记为外来产物 |
| stash@{0} | README.md(+2) / archive/README.md(10行) / 00-导航与索引/学习路径指南.md(48行) | 用户先前暂存的本地改动 | **不 pop/drop**；Category B 待裁决（§3 偏差⑤） |

> 文件保护：以上外来产物与 stash 均非本轮产出，未删除/覆盖/pop。content.js 为可再生成 bundle，恢复 HEAD 前已备份至 `C:\Users\Giant\AppData\Local\Temp\qwenwork\content_js_preexisting_backup.js`。

## 2. 四道门禁基线（本机 `py -3`，D11.10）

| 门禁 | 实测输出 | 判定 |
|---|---|---|
| `build_site.py` | **70 documents / 18 sections** / 11 glossary groups / 124 terms / 8 units / 19 lessons / 7 labs / 505 term cards / 2313 KB | ⚠️ 含 .zcode 污染（见 §2.1） |
| `validate_site.py` | **11 checks passed, 0 warnings, 0 failures**，exit 0 | ✅ |
| `check_chapter_arc.py`（5 样章） | L01/L02/L06/L11/L13 全 **OK**，exit 0 | ✅ 5/5 |
| `review_gate.py`（只读） | 31 claims（verified 16 / conditional 7 / open 8）；claim_type（verified_fact 13 / engineering_fact 7 / conditional 7 / contested 4）；误标 verified 0；未挂载 P03；curriculum 7/7 段；G1/G2/G3 未勾选 3 | ✅ 正常 |

### 2.1 content.js drift 根因与处置（Category A 候选）

- **现象**：当前源树重建得 70 docs，而 HEAD 已提交 bundle 为 69 docs（17 sections / 497 cards / 2291 KB）。
- **根因**：`tools/build_site.py:440-445` 用 `ROOT.rglob("*.md")` 收集文档，排除 `.git/web/site-vitepress/node_modules/.workbuddy-ai`，**未排除 `.zcode/`**。另一 agent 的 `.zcode/plans/plan-sess_*.md` 被当作第 70 篇知识文档收录（+1 section / +8 term cards / +约15KB）。
- **validate 不受影响**：`validate_site.py:243-252` §7 仅检查 bundle 以 `window.RENDER_NOTES = ` 开头，不比对篇数，故恢复 HEAD bundle 仍 0 FAIL。
- **处置**：按 V3.0 Step 1 计划，重建取真值后 `git checkout -- web/content.js` 恢复 HEAD 版本，工作区不再含 content.js 改动。**知识库干净篇数 = 69**（70 为工具产物污染）。
- **遗留（Loop 2 Category A）**：建议 `build_site.py` 排除 `.zcode/`（及未来工具目录），避免未跟踪工具文件污染 bundle；本轮不改 build_site.py（超出 Loop 1 允许改动范围）。

## 3. 状态文档"声称 vs 实际"偏差清单

| # | 偏差 | 声称（file:line） | 实际（本轮实测） | 分类 |
|---|---|---|---|---|
| ① | L01 行数 | CHANGELOG.md:26 "88→约 300 行"；G2-审核材料-P6.md "约 300 行" | **239 行**（splitlines 实测） | A |
| ② | claim/source 数 | PROJECT_CURRENT_STATE.md:43 "29 claims（16/7/6）"、:53 "29 条断言…15 个来源" | **31 claims（16/7/8）/ 16 sources**（P6 新增 V13/V14 + SRC-RN-AV-BASE 后；PROJECT_CURRENT_STATE 写于 P6 审计基线，未含新增） | A |
| ③ | build 篇数漂移 | PROJECT_CURRENT_STATE.md:40 "63 docs/461 cards/2136KB"；CHANGELOG.md:11 "63"、:38 "69/497/2291"、:56 "62/452/2107"（P5） | 各阶段真值演进 48→62→63→69；**当前干净基线 69/17/497/2291**（HEAD bundle）；含 .zcode 污染 70/18/505/2313。PROJECT_CURRENT_STATE §3 仍停 63（基线快照过时） | A |
| ④ | quizzes/ 路径 | V3.0 主提示词 §3.2 写根目录 `quizzes/` | 根目录 `quizzes/` **不存在**；实际在 `courses/video-rendering-journey/quizzes/`（L01/L02/L06/L11/L13.json） | A（提示词描述，非仓库文件） |
| ⑤ | stash 未决 | 计划已知 1 条 stash | stash@{0} 含 README/archive/README/学习路径指南 3 处用户改动，内容待裁决 pop/drop | B |
| ⑥ | 程序化模块落地 | 前次会话设想"新建 08 章节" | **未采用**：实际以 `07-3D渲染与算法实现/程序化几何与旋转曲面.md` 落地；course.json L00–L18 / 8 单元（U7=L17/L18）；无 08-* 目录（Glob 证实）。记忆需修正 | 记忆修正 |

### 3.1 本轮新发现（非旧诊断已有）

| ID | 发现 | 证据 | 分类 |
|---|---|---|---|
| F-1 | build_site.py 未排除 .zcode/，未跟踪工具文件污染 bundle | build_site.py:440-445；§2.1 | A（Loop 2 修） |
| F-2 | 学习路径指南.md 未收录 U7/程序化几何/L17/L18（W9/W10 仅旧四篇） | 学习路径指南.md:98-99；子代理 grep 无匹配 | A（导航补全） |
| F-3 | UV 无独立 glossary 术语条目（仅作顶点/顶点缓冲/网格的属性描述；YUV 术语存在） | glossary.json:278/1227/1324；YUV L656、NV12/NV21 L667-671 | C/A（是否需独立条目待定） |
| F-4 | 解码链路 `glGetTransformMatrix()` API 名不准确（G-E2） | 解码与播放链路.md:124；正确写法见 3D变换与坐标空间.md:225 `getTransformMatrix` | C（官方核验后勘误） |
| F-5 | Pass 深度口径冲突（G-E1）：">3" vs "≥3" | 跨平台与高性能架构.md:205 ">3"；验真队列与术语表.md:47 / 概念引入说明.md:145 / L11:46 "≥3" | B（G1 统一） |
| F-6 | G2-01 旧结论需修正：seek 目标并非"完全无支撑" | glossary.json:641（AV Sync why "seek 后进入 recover 避免立刻丢帧"）；解码与播放链路.md:348/386（静默解码"丢弃而不渲染"） | B/C（见 G2-01） |
| F-7 | 网络中断，远端新鲜同步核对本 turn 受阻 | ls-remote "Could not resolve host" | 记录（待网络恢复） |

## 4. 程序化图形模块闭环核查（Track B 任务二阶段 1）

按现实核查（非"08 章节"设想），子代理只读取证：

| 环节 | 现状 | 证据 |
|---|---|---|
| 知识文档 | ✅ `07-3D渲染与算法实现/程序化几何与旋转曲面.md`（170 行）：参数方程 §5、顶点缓冲 §7.1、索引缓冲 §7.2、细分成本 §7.3；✅已验证/⚠️有条件标记 | 文档 L5/L56-68/L91-116；实验链接 L7/L85/L151 |
| 课程元数据 | ✅ U7「程序化图形学」；L17（prereq L13，reading 指向该文档无 anchor，next L18）；L18（prereq L13+L14，reading 光照材质 §3.1/§3.6，next null）；L16.next=L17 | tools/course.json:42-45/684-718/721-763/681 |
| 实验绑定 | ✅ procedural-lathe（type lathe，lesson L17，tasks 4/selfTest 3）；pbr-lighting（type pbr，lesson L18，tasks 4/selfTest 3） | tools/labs.json:74-141/143-209 |
| 术语 | ✅ procedural-graphics 组：程序化几何/参数曲面/旋转曲面/顶点缓冲/索引缓冲/细分/网格等；⚠️ UV 无独立条目（F-3） | glossary.json:1161-1324 |
| 导航收录 | ✅ 知识架构总览:132-133、07/README:11/23（含 L17/L18）、graph.json L17/L18/lab-lathe/doc-geo 节点+边；❌ 学习路径指南未收录（F-2） | 知识架构总览.md:132-133；07/README.md:11/23；graph.json:25-38/57-62 |
| 双线规划进度 | ✅ §7「已完成」标"程序化几何·旋转曲面（L17…**任务二阶段 1 成课**）" | Render_Notes_2.0_双线规划.md:284/288/290 |
| 08 残留 | ✅ 无 08-* 目录/文件（规划 L119"08 AI 原生图形开发"仅为未来规划文字） | Glob 08* 无匹配 |
| pilot 正文/Quiz | L17/L18 **无**教学正文/quiz（pilot 仅 L01/L02/L06/L11/L13；Lab 先行，Track B 沉淀入口，有意分阶段） | courses/.../course.json:25/66/102/144/179；课程覆盖矩阵.md:28-31 |

**闭环结论**：程序化几何模块"文档→课时→术语→公式→交互→自检"闭环**已成立**（与双线规划 §7 标记一致）；唯一导航缺口为学习路径指南未同步 U7（F-2，Category A）。L17/L18 教学正文属 P7.2 后续深化范围，非当前遗漏。

## 5. 当前真值快照（供后续文档统一引用）

- 主知识文档（01–07 目录）：**26 篇**；非 archive Markdown（排除工具/web/vitepress/workbuddy/zcode）：57；archive：12（只读）。
- 课程：**19 课 / 8 单元**；pilot 教学正文 **5/19**、Quiz **5/19**；实验 **7**。
- 证据：**31 claims / 16 sources**；状态 verified 16 / conditional 7 / open 8。
- 术语：**124 条 / 11 组**。
- Gold Standard L01：**239 行**。
- 干净 build 基线：**69 documents / 17 sections / 497 term cards / 2291 KB**（HEAD bundle；.zcode 污染时 70/18/505/2313）。
- 门禁：validate 11/0/0 · arc 5/5 · review_gate 正常 · G1/G2/G3 均待人工。

## 6. 审计边界确认

- 仅新建 reviews/ 文件；本轮尚未改任何既有文件（WORKFLOW_STATE/CHANGELOG 待 Step 7 更新）。
- content.js 恢复 HEAD（计划授权，生成物可再生）；外来产物 .zcode/、old_content.js.tmp、stash 均未触碰。
- 未 commit/push；未动 archive/.workbuddy-ai/memory/web/vendor/web/index.html/README/两份方案文档。
- 未自动升级任何 claim；未填写任何人工审核结论。