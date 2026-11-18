# 证据层（evidence）

> 机器可读的**断言—证据账本**，把散落在各篇文档里的 ✅已验证 / ⚠️有条件成立 / ❗待验证 标记结构化，供课程样章与测验回指。
>
> 本层**不复制知识正文**：断言只存一句话，详细解释仍在原文档；`source_documents` 指向权威来源或库内文档。
>
> 与 `00-导航与索引/验真队列与术语表.md` 的关系：那是人读的验真索引，这里是机器可读的同源结构化版本；两者不互相覆盖，新增断言时同步维护。

---

## 文件

| 文件 | 作用 |
|---|---|
| `claim-ledger.json` | 断言账本：断言、类型、证据、验证状态、条件、关联课时 |
| `source-registry.json` | 来源登记表：来源 ID、标题、URL、类型、被哪些断言引用 |

## Schema

### claim（断言）

```json
{
  "id": "V05",
  "claim": "零拷贝是尽量减少拷贝而非绝对 0 拷贝",
  "claim_type": "verified_fact | engineering_fact | conditional | contested",
  "evidence": [
    { "source_id": "SRC-xxxx", "locator": "章节/网址片段", "evidence_type": "official_doc | paper | spec | derivation | repo_doc" }
  ],
  "verification": { "status": "verified | conditional | open", "confidence": "high | medium | low" },
  "conditions": ["驱动/格式转换可能触发拷贝"],
  "source_documents": ["04-跨平台与高性能架构/跨平台与高性能架构.md"],
  "used_by_lessons": ["L06"]
}
```

- `claim_type`：断言性质。`verified_fact`=有权威来源；`engineering_fact`=工程实践结论；`conditional`=依赖场景；`contested`=证据冲突。
- `verification.status`：`verified`（有权威来源）/ `conditional`（有条件成立）/ `open`（缺证据）。与验真队列的 ✅/⚠️/❗ 一一对应。
- `confidence`：高/中/低。

### source（来源）

```json
{
  "id": "SRC-xxxx",
  "title": "来源标题",
  "url": "https://…",
  "type": "official_doc | spec | paper | book | repo_doc | derivation",
  "accessed": "2026-11-18",
  "used_by_claims": ["V05"]
}
```

## 铁律

1. **AI 生成内容不得自动标为 `verified`**。新断言默认 `status: open`，须人工核证后才升级。
2. 每个 `source_id` 必须在 `source-registry.json` 中存在；反向 `used_by_claims` 必须一致。
3. `used_by_lessons` 中的课时 ID 必须存在于 `tools/course.json`。
4. 断言正文不复制文档内容；`source_documents` 用相对仓库根的路径。
5. 不自动删除旧断言；失效断言改 `status` 并写清原因，不静默移除。

## 校验

`tools/validate_site.py` 会检查：claim id 唯一、来源可解析、枚举值合法、`used_by_lessons` 引用有效、source 与 claim 双向一致。

```bash
python tools/build_site.py
python tools/validate_site.py
```
