# .workbuddy-ai — 索引（文档正文已迁入 .agent/）

> 2026-11-19 结构治理（`DECISIONS.md` D14）：智能体文档统一迁入 `.agent/`。本目录只做索引与宿主运行时。

- **技能文档**（SKILL.md 正文 / `references/` / `assets/`）→ [`.agent/skills/research-to-learning/`](../.agent/skills/research-to-learning/SKILL.md)；规则与总索引见 [`.agent/README.md`](../.agent/README.md)
- **技能发现 stub**：`skills/research-to-learning/SKILL.md`（保留 frontmatter 维持发现，正文在 `.agent/`）
- **可执行脚本**（不迁移，门禁命令路径不变）：`skills/research-to-learning/scripts/check_chapter_arc.py`
- **memory/**：宿主记忆，受保护（D09/D11"绝对不动"），gitignore 排除，不迁移
- **plans/**：仓库内不存在。历史引用的计划文件实际位于用户目录（`~/.workbuddy-ai/plans/`），仓库内指向 `.workbuddy-ai/plans/` 的引用属过期引用，待清理（见 D14 已知问题）
