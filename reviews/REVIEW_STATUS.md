# REVIEW_STATUS · 统一审核总览与事项分类

> Master Prompt V3.0 §4 / Loop 1 Step 5 · 2026-11-19 · HEAD `650bb14`。
> 本文件汇总 G1/G2/G3 状态并把全部事项分为 A/B/C 三类。**审核与执行隔离**：Category A 列出但本轮不执行；B 待人工裁决；C 先研究再审。
> 详细材料：CURRENT_AUDIT.md / G1-evidence-review.md / G2-curriculum-review.md / G3-release-readiness.md / DECISION_REQUIRED.md / EXECUTION_PLAN_V3.md。

---

## 1. 三道关卡状态

| 关卡 | 状态 | 自动前置 | 人工结论 | 材料 |
|---|---|---|---|---|
| G1 证据 | 待人工 | 31 claims（16 verified/7 conditional/8 open），双向索引完整，误标 0 | 未填 | G1-evidence-review.md |
| G2 课程 | 待人工（最重要） | curriculum 7/7 段，pilot 5 课闭环一致 | 未填 | G2-curriculum-review.md |
| G3 发布 | **仍未通过** | 结构门禁全绿；语义层/人工评分未就绪 | 未填 | G3-release-readiness.md |

**当前续跑点：等待 DECISION_REQUIRED.md 人工裁决。** 未回复不视为默认同意（V3.0 §11 Loop 2）。

## 2. Category A · AI 可自行处理（列出，本轮不执行）

> 特征：可由现有源文档/实测直接证明、确定性脚本可验证、无争议。Loop 2 获授权后批量处理。

| ID | 事项 | 证据 | 处理建议 |
|---|---|---|---|
| A1 | 文档数字口径失实：L01"约300行"→**239**；PROJECT_CURRENT_STATE 29 claims/15 sources→**31/16**；build 基线 63→**69**（干净） | CURRENT_AUDIT §3 ①②③ | 更正 CHANGELOG/G2材料/PROJECT_CURRENT_STATE 数字为实测 |
| A2 | quizzes/ 路径描述：V3.0 写根目录，实际 `courses/video-rendering-journey/quizzes/` | CURRENT_AUDIT §3 ④ | 后续文档统一用实际路径（提示词非仓库文件，仅记录） |
| A3 | build_site.py 未排除 `.zcode/`，未跟踪工具文件污染 bundle（70 vs 69）；content.js drift | build_site.py:440-445；CURRENT_AUDIT §2.1 | 排除 .zcode/（及工具目录）；重建后恢复/提交干净 bundle |
| A4 | 学习路径指南.md 未收录 U7/程序化几何/L17/L18 | 学习路径指南.md:98-99；CURRENT_AUDIT F-2 | 补 U7 导航条目（与知识架构总览/07README 对齐） |
| A5 | K-STRIDE 概念 source_claim 弱挂 V02，V14 已存在 | concepts.json K-STRIDE→K-DMA；G1 §5 G1-a | 改挂 V14 |
| A6 | （条件 A，待 B9 口径裁决）跨平台:205 Pass">3"勘误为"≥3" | 跨平台与高性能架构.md:205；G1 §4.2 | G1 裁决 ≥3 后勘误主文档 |

## 3. Category B · 需人工裁决（详见 DECISION_REQUIRED.md）

| ID | 事项 | 选项摘要 | 来源 |
|---|---|---|---|
| B1 | L02 学习目标"seek 后禁止立刻丢帧" | A 删除 / B 补研究保留 | G2-01 |
| B2 | 主课程路线矛盾（L12→L15 跳 L13/L14） | A 改 L12.next→L13 / B 调先修 / C 分支路径 | G2-02 |
| B3 | 教材质量规范正式采用 | A 采用 / B 修订后采用 / C 暂不 | G2-03 |
| B4 | Gold Standard L01 认可 | A 认可 / B 认可+minor修订 / C 不认可 | G2-04 |
| B5 | README 过时数字授权更新 | A 授权更新 / B 调整措辞 / C 暂不（维持 D10.5） | G2-05 |
| B6 | VitePress 构建授权 | A 授权重试 / B 暂不 / C 仅验证生成器 | G2-06 |
| B7 | V13 升级 verified/high | 同意 / 不同意 / 暂缓 | G1 §4.1 |
| B8 | V14 目标状态 | verified+保留条件 / conditional / 暂缓 | G1 §4.1 |
| B9 | Pass 深度口径统一 | ≥3 / >3 | G1 §4.2 |
| B10 | L13 候选断言登记（坐标空间链/MVP顺序/投影w/NDC差异 4 条） | 同意登记 / 调整 / 暂缓 | G1 §4.4 |
| B11 | P02 与 L06 挂载矛盾 | L06 补声明 P02 / ledger 去挂载 | G1 §5 G1-b |
| B12 | stash@{0}（README/archive/学习路径指南 3 处用户改动） | pop / drop / 继续保留 | CURRENT_AUDIT §1.1 |
| B13 | reviews/ 是否纳入 git | 纳入 / 不纳入（本地审核工作区） | Loop 1 产出 |
| B14 | 外来未跟踪产物 .zcode/、old_content.js.tmp | 保留 / 由用户清理 / 加 .gitignore | CURRENT_AUDIT §1.1 |

## 4. Category C · 需先研究再审（不得当作 A 直接改）

| ID | 研究任务 | 触发 | 产出 |
|---|---|---|---|
| C1 | seek recover 状态机 / drift 分级处置知识（区分静默期丢陈旧帧 vs 恢复期保显示帧） | 若 B1 选 B | 主文档增量 + claim（open） |
| C2 | SurfaceTexture 官方 API 行为核验（getTransformMatrix vs glGetTransformMatrix） | G-E2 | 官方文档证据 → 勘误解码链路:124 |
| C3 | stride 对齐基数平台差异（高通/Apple/Intel 具体参数） | V14 条件细化 | SoC 手册证据 → V14 conditions |
| C4 | contested 性能数字实证（P01 提升X% / P05 CPU降98% / P06 显存减40%） | G1-d | 压测/RenderDoc 证据，研究前不升级 |
| C5 | P04 跨平台 API 一致性逐平台官方对照 | G1-e | 各平台官方文档对照表 |
| C6 | 种子来源精确 locator 补全（V02 fourcc / V07 nvidia 等首页级来源） | G1-c | 精确段落 locator |
| C7 | UV 是否需独立 glossary 术语条目 | F-3 | 术语治理裁决 |

## 5. 本轮（Loop 1）已做与未做

- **已做**：仓库复核 + 四道门禁基线 + 偏差登记 + 程序化模块闭环核查；G1/G2/G3 审核材料；A/B/C 分类；统一裁决表；路线图。新建 reviews/ 7 文件。
- **未做（隔离）**：未执行任何 Category A 修改；未升级任何 claim；未填任何人工结论；未 pop/drop stash；未触碰外来产物；未 commit/push；未动 archive/memory/vendor/index.html/README/两份方案。
- **状态文档**：WORKFLOW_STATE.md / CHANGELOG.md 于 Step 7 更新（续跑点=等待裁决）。