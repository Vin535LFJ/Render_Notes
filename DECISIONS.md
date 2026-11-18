# 决策记录（DECISIONS）

> 本文件记录 Render_Notes「AI Knowledge-to-Learning Engine 增量补齐」过程中的关键裁决与已失效信息。所有非关键技术决策采用合理默认值并在此登记，不反复询问用户。
>
> 更新：2026-11-18。相关计划见 `.workbuddy-ai/plans/quantum-nebula-newton-ffFN4E3P.md`。

---

## D01 · 执行口径：增量补齐，不重建

- **裁决**：保留现有全部成果（离线站、19 课、3 实验、图谱、技术索引、QA、Skill、故事线），只补两份方案里确实没有的东西。
- **理由**：两份方案基于 2026-11-03 旧快照，假设"无网站、无课程层、无 Skill"，与现状严重不符；从零重建会造成重复、覆盖与破坏。
- **影响**：两份方案文档（`Master Prompt：*.md`、`Render_Notes：*.md`）仅作参考，**不改、不删、不覆盖**。

## D02 · 网站方向：两套并存

- **裁决**：保留 `web/` 零依赖离线站为**主站**且不可破坏；另加 `site-vitepress/` 源码树用于在线发布。
- **理由**：用户明确选择"两套并存"；离线站双击即开、vendor 自足、已通过 QA，不能因引入 VitePress 而退化。
- **约束**：在线站不移植 Vue 版交互 demo（避免逻辑分叉），实验入口链接回离线 `web/index.html#/lab/<id>`；**不发布 GitHub Pages / 不远程部署**，除非明确授权。

## D03 · ID 方案：沿用 L##，不引第二套

- **裁决**：课程/课时 ID 沿用现有 `L01`–`L18`；跨课程用命名空间（如 `video-rendering-journey/L01`）。
- **理由**：方案示例的 `video-yuv-lesson-01` 与现有 `tools/course.json` 的 `L##` 冲突；避免双 ID 体系。

## D04 · 目录与工具：只扩展 tools/ 与现有 Skill

- **裁决**：不建顶层 `skills/`、不建 `scripts/{ingest,validate,graph,publish}/`；只扩展 `tools/` 与 `.workbuddy-ai/skills/research-to-learning/`。
- **理由**：`tools/build_site.py` + `tools/validate_site.py` 已覆盖方案里"Website Builder / Website Tester / Link Checker / Anchor Checker"等；重复建树违反"避免重复存储"工程红线。
- **Skill 位置**：保留 `.workbuddy-ai/skills/research-to-learning/`（项目级，git 已跟踪），不采用方案里的 `.agents/skills` 或 `.claude/skills`。

## D05 · 机器可读产物格式：JSON（非 YAML）

- **裁决**：evidence / knowledge-model / quizzes 等机器可读产物统一用 **JSON**；YAML 仅用于 VitePress 前端自有配置。
- **理由**：Python 工具链保持 stdlib-only，不引入 PyYAML；YAML 只留给人读的 VitePress config。

## D06 · 知识正文单一来源：引用不复制

- **裁决**：claim ledger 只存断言/证据/状态；concepts 只存 ID/关系/术语引用；样章只链接现有文档与锚点，不复制知识正文。
- **理由**：避免"一份知识多处存储"导致失同步；glossary.json 仍是术语定义唯一来源。

## D07 · QA 双门禁

- **裁决**：确定性校验统一收敛到 `tools/validate_site.py`（扩展而非新建）；章节叙事语义用现有 `.workbuddy-ai/skills/research-to-learning/scripts/check_chapter_arc.py`。
- **理由**：一个门禁一处维护；语义检查与结构检查分离。

## D08 · 失效数字（方案中的旧快照，不得作为执行依据）

| 来源 | 旧陈述（失效） | 当前实测（2026-11-18） |
|---|---|---|
| 两份方案 | 27 篇主文档 / 9500 行 / 39 个 Markdown（2026-11-03） | 46 篇主文档（build 计 48，含 archive+2 方案）；124 术语 / 11 组 |
| README 第 8 行 | 29 篇主文档 / 41 Markdown / 311 链接（2026-11-17） | 同上；README 含用户未提交改动，**本计划内不动** |
| 方案 Skill 位置 | `.agents/skills` / `.claude/skills` | `.workbuddy-ai/skills/research-to-learning/` 已存在且跟踪 |
| 方案网站栈 | VitePress 重建网站 | 离线 `web/` 为主 + `site-vitepress/` 并存 |
| 方案 ID | `video-yuv-lesson-01` | `L01`–`L18` + 课程命名空间 |

## D09 · Git 与发布

- **裁决（原）**：本计划内**不 commit、不 push、不远程发布**。
- **理由（原）**：用户此前已单独要求推送（commit `2dd62d2` 已推送）；本次执行未获新的提交授权；遵循"远程/不可逆操作需授权"红线。
- **更新 2026-11-18（用户新授权）**：用户在 P5 + Part B 全部完成后明确要求"提交 git 更新"，并确认 **(a) commit + push 到 origin/master**、**(b) README.md 的未提交改动一并纳入**。因此本次允许 `git add/commit/push`；此为一次性明确授权，不改变其他阶段的默认口径。
  - 提交内容：本次 P5 收尾 + Part B 全部产物，以及 README.md 已有的 3 行 chat 链接改动。
  - 远程发布（GitHub Pages 等在线部署）仍 **未授权**（D02），本次只 push 源码，不做在线发布。
- **不伪造构建**：D10.6 仍然有效——VitePress `docs:build` 未完成的如实记录，不因提交而改变。

## D10 · 执行默认值（非关键，直接采用）

1. 在线站目录名 `site-vitepress/`（内部含 `.vitepress/`），非根级 `.vitepress/`。
2. 在线站交互先链接离线 lab，不移植 Vue 版 demo。
3. Demo 优先级：YUV↔RGB、Stride、PTS/DTS、视频链路、RenderGraph；Shader Playground 延后。
4. 离线 `content.js` 继续收录 archive 与两份方案文档（影响最小）；在线站做策展剔除。
5. README 数字不动（含用户未提交的 chat 链接）。
6. VitePress 锁定最新稳定 1.6.x，禁用 alpha；实施时联网确认版本，安装失败则保留源码树并如实记录，不伪造构建成功。

## D11 · P6 教材质量升级执行默认值（2026-11-18，Master Prompt V2.0）

> 依据：根目录 `PROJECT_CURRENT_STATE.md` / `CURRENT_GAPS.md` / `NEXT_PHASE_PLAN.md`；G2 材料见 `courses/video-rendering-journey/G2-审核材料-P6.md`。非关键项直接采用并登记；需用户拍板项已单列 G2 材料 §4，不擅自处理。

1. **Gold Standard 选 L01**：源素材推导最完整、路线首课、实验现成、断言基础好（诊断 §4 理由）。L13 为第二篇深化候选（先重建断言链）。
2. **pilot next 指针对齐 curriculum 路线**（L01→L02→L06→L11→L13→null）：原指针继承自主课程、指向 pilot 外课时，与大纲和正文桥矛盾，属数据错误而非路线变更。主课程 L12.next=L15 与 L15 先修的矛盾**不擅自改**，留 G2 拍板（路线设计权属人）。
3. **乱码修复范围**：L01 目标"Stride Why"两层 course.json 已修；L11"由谁 inserted"涉及 checkpoint/正文/quiz 四处联动（validate §11b 覆盖约束），留 P7 同步修复。
4. **新断言纪律**：V13（生理依据）/V14（stride 机制）从主文档 ✅ 段提取，按 evidence-and-claims 硬规则默认 `open/low`，待 G1 人工升级；新增来源 SRC-RN-AV-BASE（repo_doc）。历史兼容性叙事不挂断言，作明确标注的背景叙述并列入候选清单。
5. **ledger 挂载补漏**：V06 补 L13、E03 补 L11（正文实际引用）；P02 挂 L06 但正文未声明的矛盾留 P7 裁决，不静默删挂载。
6. **教材质量规范为提案**：`references/lesson-quality-standard.md` 待 G2 人工确认后才算正式标准；AI 不宣布通过。十维度诊断结论仅为线索，不替代人工评分。
7. **P6 内容修复边界**：只重写 L01；L02/L06/L11/L13 的 blocker/major 修复全部留 P7（G2 确认后），避免标准未确认前批量改内容。
8. **README 不动**（D10.5 继续有效）：数字过时已登记 G-R1 决策提案，待授权。
9. **不 commit/push**：D09 的一次性授权已用于 5359259，本阶段恢复默认口径。
10. **本机门禁命令用 `py -3`**：`python` 首选解析到 cygwin stub 不可用（环境事实，Python 3.12.10 实测可用）。
