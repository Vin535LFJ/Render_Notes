# Knowledge Change Review（知识变更审核）机制设计

> D13 · 2026-11-19 · 用户新增需求。纳入 P8（D3 增量更新 / D4 影响链）实现。
> 目标：让系统持续产生新知识/报告/教材时，**新研究不弄乱既有知识体系**——每次知识变更都经过影响分析、变更提案、人工审核、增量更新，并保留版本记录与来源追溯。
> 性质：机制设计 + schema 提案（实现归 P8）。复用现有 evidence/knowledge-model/tools，**不重建**。机器数据统一 JSON（D05）。

---

## 1. 为什么需要 KCR

项目已从静态知识库演化为持续生产系统：新研究报告、新断言、新教材不断进入。若无变更审核，风险是：
- 新结论与既有 claim 冲突却被静默覆盖；
- 受影响的概念/教材/quiz 未同步，知识体系失同步；
- AI 生成内容冒充已验证事实；
- 无法追溯"某条知识何时、因何来源、经谁批准而改变"。

KCR 把"知识变更"当作一等公民：**任何对 claim/concept/lesson/quiz 的增删改，都走一条可审核、可追溯、增量的流水线。**

## 2. 触发条件

| 触发 | 示例 |
|---|---|
| 新研究报告进入 | 一份"GPU 同步机制"深度研究报告 |
| 新来源登记 | source-registry 新增官方文档/论文 |
| 既有来源更新 | 官方文档改版、规范修订 |
| 教材/quiz 修订需求 | 发现表述失实、目标漂移 |
| 断言状态变更申请 | open→verified 升级、contested 降级 |

## 3. 五阶段流水线

```
新研究报告 / 新来源
   │
   ▼
[Stage 1] 影响分析（Impact Analysis）
   Source → Claim → Concept → Lesson → Quiz → Course
   产出：impact-report.json（受影响产物清单 + 冲突检测）
   │
   ▼
[Stage 2] 变更提案（Change Proposal）
   逐项 action ∈ {add, modify, deprecate, reverify}
   产出：change-proposal.json（每项带证据/理由/受影响产物/版本注记）
   │
   ▼
[Stage 3] 人工审核（Human Review）  ← G1 性质关卡，AI 不自主
   裁决 ∈ {approve, reject, request_research}
   产出：review-decision.json（人工填写，AI 不预填）
   │
   ▼  (仅 approve 项)
[Stage 4] 增量更新（Incremental Apply）
   按提案修改 ledger/concepts/lessons/quizzes/site
   保留版本记录 + 来源追溯；不重生成全库
   │
   ▼
[Stage 5] 验证与归档（Verify & Archive）
   跑门禁（build/validate/arc/review_gate）+ 写 CHANGELOG + 归档提案
```

### Stage 1 · 影响分析（对应 V3.0 D4）

利用现有双向索引计算影响链：
- **Source→Claim**：`source-registry.used_by_claims` 反查该来源支撑的 claim。
- **Claim→Concept**：`concepts.json` 关系的 `source_claim` 反查引用该 claim 的概念。
- **Claim→Lesson**：`claim-ledger.used_by_lessons` + 各 lesson frontmatter `claims`。
- **Lesson→Quiz**：`courses/*/quizzes/<L##>.json` 的 `claim_ids`。
- **Lesson→Course**：`tools/course.json` / pilot `course.json` 的 objectives/checkpoint/reading。
- **冲突检测**：新断言与既有 claim 文本/条件比对（同主题相反结论 → 标 conflict）；新来源与既有来源版本比对。

产出 `impact-report.json`：
```json
{
  "trigger": {"type": "new_research_report", "ref": "reports/2026-11-gpu-sync.md", "date": "2026-11-19"},
  "new_sources": [{"id": "SRC-...", "url": "...", "type": "official_doc"}],
  "affected": {
    "claims": [{"id": "V05", "relation": "supports|conflicts|extends", "note": "..."}],
    "concepts": [{"id": "K-ZEROCOPY", "via_claim": "V05"}],
    "lessons": [{"id": "L06", "via_claim": "V05", "sections": ["§4.1"]}],
    "quizzes": [{"id": "L06-Q1", "via_claim": "V05"}],
    "courses": [{"id": "video-rendering-journey", "objectives_maybe": true}]
  },
  "conflicts": [{"new_claim_draft": "...", "existing_claim": "V05", "type": "contradiction|condition_change", "evidence": "..."}],
  "uncovered": ["新报告中无既有 claim 对应的知识点 → 候选新增"]
}
```

### Stage 2 · 变更提案（对应 V3.0 D3）

每个变更项一条提案，`action` 四类：
- **add**：新增 claim/concept/lesson/quiz（AI 内容默认 open）。
- **modify**：修改既有文本/条件/挂接（须给 diff 与理由）。
- **deprecate**：废弃 claim——**保留 ID，改 status 加 note**（evidence-and-claims 硬规则 5，不静默删除）。
- **reverify**：申请状态变更（open→verified 等），附证据，待人工。

产出 `change-proposal.json`：
```json
{
  "proposal_id": "KCR-2026-11-001",
  "impact_report": "impact-report.json",
  "items": [
    {
      "item_id": "I1",
      "action": "add",
      "target": {"layer": "claim", "id_draft": "V16"},
      "content": "新 GPU 同步机制断言文本",
      "evidence": [{"source_id": "SRC-...", "locator": "§3.2", "evidence_type": "spec"}],
      "default_status": "open",
      "conditions": ["适用边界"],
      "affected": {"concepts": ["K-SYNC"], "lessons": ["L10"], "quizzes": ["L10-Q2"]},
      "rationale": "为何新增/修改/废弃/重验",
      "version_note": "来源 X 2026-11 版新增；替代旧理解 Y"
    },
    {
      "item_id": "I2",
      "action": "reverify",
      "target": {"layer": "claim", "id": "V05"},
      "from_status": "verified", "to_status_requested": "conditional",
      "evidence": ["新来源表明条件 Z"],
      "affected": {"lessons": ["L06"]},
      "version_note": "..."
    }
  ],
  "ai_recommendation": "仅供参考，非裁决",
  "human_decision": null
}
```

### Stage 3 · 人工审核（G1 性质，AI 不自主）

- 人工对每个 item 裁决 `approve / reject / request_research`，可附条件。
- **AI 不预填裁决、不自动升级 claim、不自动废弃**（与 G1/G2/G3 一致）。
- `request_research` → 转 Category C 研究任务，研究后回到 Stage 1 重审。
- 产出 `review-decision.json`（人工填写）：
```json
{
  "proposal_id": "KCR-2026-11-001",
  "reviewer": "＿", "date": "＿",
  "decisions": [{"item_id": "I1", "verdict": "approve|reject|request_research", "conditions": "＿", "note": "＿"}],
  "overall": "＿"
}
```

### Stage 4 · 增量更新（仅 approve 项）

- 按提案精确修改受影响产物：ledger（增/改/废弃 claim）、concepts（关系）、lessons（正文/frontmatter）、quizzes（挂接）、course.json（目标/checkpoint）。
- **增量原则**：只改受影响项，不重生成全库（V3.0 D3）。
- **版本记录**：每次变更写 CHANGELOG（proposal_id + 变更摘要 + 来源 + 裁决）；claim 可加 `history` 字段记录状态变迁（提案 schema 扩展）。
- **来源追溯**：新/改 claim 必挂 evidence.source_id，双向索引同步（validate §8 强制）。
- 网站增量：改后 `build_site.py` 重建 bundle（受影响文档），不重写网站结构。

### Stage 5 · 验证与归档

- 跑四道门禁（build/validate/arc/review_gate），0 FAIL/0 WARN。
- 受影响 lesson 改后重跑 arc + 浏览器抽查（若改前端）。
- 归档 proposal/impact/decision 到 `reviews/kcr/`（或 `knowledge-changes/`），形成可追溯历史。
- 更新 WORKFLOW_STATE/CHANGELOG。

## 4. 与现有基础设施集成（不重建）

| KCR 能力 | 复用现有 | 新增（P8） |
|---|---|---|
| 影响链计算 | claim-ledger.used_by_lessons / source-registry.used_by_claims / concepts.source_claim / quizzes.claim_ids | `tools/kcr_impact.py`（只读，遍历索引产出 impact-report） |
| 变更提案 | evidence-and-claims.md 程序 | `tools/kcr_propose.py` + schema 校验 |
| 人工审核 | review_gate.py / G1 关卡 | review-decision.json 模板（AI 不填） |
| 增量应用 | 现有 JSON 编辑 + build_site | `tools/kcr_apply.py`（仅 approve 项，幂等） |
| 验证 | validate_site / check_chapter_arc | 无（复用） |
| 状态机 | WORKFLOW_STATE | P9 轻量状态机加 KCR 子状态（PROPOSED→REVIEWING→APPROVED→APPLIED→VERIFIED） |

> 工具均 stdlib-only（D05），扩展现有 tools/，不建顶层新目录（D04）。

## 5. Worked Example：新 GPU 同步机制研究报告

1. **触发**：研究报告 `reports/2026-11-gpu-sync.md` 提出"某新 barrier 语义"。
2. **影响分析**：新来源 SRC-VULKAN-SYNC-2026 → 关联既有 E04（RenderGraph 自动同步）、C06、V05；概念 K-SYNC/K-RENDERGRAPH；教材 L10/L11；quiz L10-Q2/L11-Q2。检测到与既有"barrier 由图编译自动插入"表述的条件变化 → conflict。
3. **变更提案**：I1 add 新 claim V16（open，挂新来源）；I2 modify L11 §4.2 补新语义条件；I3 reverify E04 置信度；I4 modify L11-Q2 挂 V16。
4. **人工审核**：人工 approve I1/I2/I4，request_research I3（需官方 spec 逐条对照）。
5. **增量更新**：登记 V16（open）+ 改 L11 正文/quiz + 双向索引；CHANGELOG 记 KCR-2026-11-001；I3 转 C 研究。
6. **验证归档**：门禁绿；归档提案；L11 升级待 I3 研究后另案。

→ 新知识进入，既有体系未被静默覆盖，全程可追溯、经人工批准。

## 6. 实现路线（P8）

- P8.1 先落地 `kcr_impact.py`（只读影响分析）+ impact/proposal/decision schema。
- P8.2 `kcr_propose.py` + `kcr_apply.py`（幂等增量应用，仅 approve）。
- P8.3 与 P9 状态机集成 KCR 子状态；CHANGELOG 版本记录规范化。
- 验收：一份新研究报告能跑通"影响分析→提案→人工裁决→增量应用→门禁绿→归档"，且未批准项不被应用、废弃 claim 保留 ID。

## 7. 硬约束

- AI 不自主批准/升级/废弃；人工裁决栏留空。
- 废弃保留 ID 改状态加 note；不静默删除。
- 增量不重生成全库；新 AI 内容默认 open。
- 每次变更可追溯：来源 + 提案 ID + 裁决 + CHANGELOG。
- 未裁决项不应用（与 DECISION_REQUIRED 一致）。