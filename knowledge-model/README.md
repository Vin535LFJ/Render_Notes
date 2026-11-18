# 知识模型（knowledge-model）

> 概念级 ID 与关系模型，补 `tools/graph.json`（route 级导航图）与 `tools/glossary.json`（术语定义）之间的空缺：给每个概念一个稳定 ID，并声明它与其他概念的依赖/对比/使用关系。
>
> **不复制定义正文**：术语定义以 `tools/glossary.json` 为唯一来源，本层只存 `glossary_term` 引用与 `definition_ref` 锚点。

---

## 文件

| 文件 | 作用 |
|---|---|
| `concepts.json` | 概念节点（ID / 名称 / 术语引用 / 层次 / 定义锚点 / 关系） |
| `taxonomy.json` | 由 glossary 的组与 `TECH_CATEGORY_BY_GROUP` 生成的分类视图（生成物，不手工编辑） |

## Schema

```json
{
  "id": "K-VALIDATION",
  "name": "零拷贝",
  "glossary_term": "零拷贝",
  "layer": "L4",
  "definition_ref": "04-跨平台与高性能架构/跨平台与高性能架构.md#11-零拷贝的本质",
  "route": "#/glossary?term=零拷贝",
  "relations": [
    { "type": "prerequisite_of", "target": "K-RENDERGRAPH", "source_claim": "V05" },
    { "type": "contrast_with", "target": "K-DMA" }
  ]
}
```

- `glossary_term`：必须能在 `tools/glossary.json`（含 aliases）中解析，否则校验失败。
- `layer`：L0–L7，与知识架构总览一致。
- `definition_ref`：文件+锚点，指向权威定义位置；锚点会被 `validate_site.py` 检查。
- `route`：站点内跳转（课程/实验/术语图）。
- `relations[].type`：`prerequisite_of` / `contrast_with` / `used_by` / `part_of`；`source_claim` 可选，回指 claim ledger。

## 生成 taxonomy

```bash
python tools/build_knowledge_model.py   # 由 glossary + build_site 的分类映射生成 taxonomy.json
```

## 校验

`tools/validate_site.py` 检查：concept id 唯一、`glossary_term` 可解析、`definition_ref` 文件与锚点存在、relation target 存在、无孤立概念（每个概念至少一条关系）。
