---
doc_id: decision-kit-readme
type: review-material
status: draft
owner: human
created: 2026-11-19
updated: 2026-11-19
---

# 人工裁决材料包（decision-kit）

> **全部 OPEN，无一项已批准。** 本目录只准备证据、选项与分析，**不代为裁决**。
> 每项文件的 §4 Resolution 栏均为空白，需由人填写；未答复不视为同意。
> 本目录位于 `reviews/` 内，依 2026-11-19 发布边界修复，不进入学习站知识 bundle。

## 状态总表（2026-11-19 实测）

| 编号 | 事项 | 状态 | 材料 |
|---|---|---|---|
| B4 | L01 Gold Standard 阅读认可 | ⬜ OPEN | [B4.md](B4.md) |
| V13（B7） | 杆状/锥状细胞表述修正 + 状态升级 | ⬜ OPEN（claim 仍 open/low） | [V13.md](V13.md) |
| V14（B8） | Stride claim 升级 verified + 保留条件 | ⬜ OPEN（claim 仍 open/low） | [V14.md](V14.md) |
| B10 | L13 四条断言登记确认 / 升级 | ⬜ OPEN（已登记为 open，待确认） | [B10.md](B10.md) |
| B11 | P02 ↔ L06 挂载矛盾处理 | ⬜ OPEN（L06 已补声明，待确认） | [B11.md](B11.md) |
| B12 | stash@{0} 三处用户改动处置 | ⬜ OPEN（stash 原样保留） | [B12.md](B12.md) |
| B15 | C1–C7 研究任务立项 | ⬜ OPEN | [B15.md](B15.md) |

**已裁决、不在本包内**（避免重复裁决）：B1/B2/B3/B5/B6/B9（见 `DECISIONS.md` D01–D11）、B13（reviews 纳入 git）、B14（.zcode 归档提交，见 `DECISIONS.md` D12 / `.agent/decisions/`）。

## 关卡状态（不属本包，持续 OPEN）
- **G1**（证据核验）、**G2**（课程质量）、**G3**（发布）：均未通过。`py -3 tools/review_gate.py` 只读运行，不产生通过结论。
- V17–V20（L13 新断言）均 `open`，不得在未裁决前升级。

## 使用方式

> 格式：本包 7 项已按 `.agent/templates/decision-ticket.md` 改写为 Decision Ticket（元信息 / Question / Context / Options and tradeoffs / Resolution / Fog / Completion criteria）。**Resolution 栏保持空白，等待人工填写**；AI 未代批、未改 claim 状态。

1. 逐项阅读对应 `.md`，核对 §2 证据中的精确行号与文件。
2. 在 §4 Resolution 栏填写决定（勾选选项 + 决定 / 裁决人 / 日期 / 授权范围 / 后续动作）。
3. 裁决后由人决定是否执行；AI 不得据材料自动升级 claim、改正文或过关卡。
4. 本包状态变化后，同步更新 `WORKFLOW_STATE.md` / `reviews/REVIEW_STATUS.md` 的指针。

## B12 只读检查结论（摘录）
`git stash show -p stash@{0}`（2026-11-19 只读执行）显示 stash 内容为`00-导航与索引/学习路径指南.md` 等文件中把推荐阅读链接从 `01-基础理论/...` 改为 `../01-基础理论/...`（相对路径修正）。**未执行** pop/drop/apply。详见 [B12.md](B12.md)。
