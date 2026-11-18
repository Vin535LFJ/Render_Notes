# site-vitepress（在线站 · 与离线主站并存）

Render_Notes 的第二套站点：VitePress 在线站源码树。**离线主站（`web/`）仍是权威版本且不可退化**——本目录只用于在线发布与搜索引擎可索引的浏览体验。

## 目录结构（源码 vs 生成物）

| 路径 | 性质 | 说明 |
|---|---|---|
| `package.json` | 源码 | VitePress 1.6.x（锁定稳定版，禁用 alpha） |
| `.vitepress/config.mjs` | 源码 | 站点配置；`srcDir: docs`；`ignoreDeadLinks: true` |
| `.vitepress/sidebar.generated.json` | **生成物** | 由 `tools/build_vitepress_content.py` 生成 |
| `docs/**` | **生成物** | 从仓库 markdown 同源生成的策展内容树 |

生成物全部在 `.gitignore` 中；只提交源码三件套（package.json / config.mjs / 本 README）。

## 内容策展（DECISIONS D10.4）

生成器与 `tools/build_site.py` 同源读取仓库 markdown，但剔除：

- `archive/**`（历史归档，不作为最新结论来源）
- 两份 AI 方案文档（`Master Prompt：…`、`Render_Notes：…`）

其余内容（含 `courses/` 教学课程）原样收录，不复制、不改写正文。

## 使用

```bash
# 1. 同源生成内容树（Python stdlib-only，无第三方依赖）
python tools/build_vitepress_content.py

# 2. 安装与构建（需要联网；npm install 失败时如实记录，不伪造成功）
npm install
npm run docs:build     # 产物在 .vitepress/dist/
npm run docs:dev       # 本地预览
```

## 已知差异（相对离线主站）

1. **交互实验不移植**（D10.2）：`#/lab/<id>` 站内路由是离线站专属；在线站页面会保留链接文本但无法跳转，交互请回到离线主站。
2. **术语弹层 / 教材模式 / 知识图谱 / 技术索引**为离线站功能，本站为纯文档浏览。
3. **锚点 slug**：离线站与 VitePress 的标题 slug 算法不同，跨文锚点可能落在章节顶部而非精确小节。
4. 本站不发布（P4 阶段仅本地构建验证），远程部署另行授权。
