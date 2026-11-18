import { defineConfig } from "vitepress";
import sidebar from "./sidebar.generated.mjs";

export default defineConfig({
  lang: "zh-CN",
  title: "Render_Notes",
  description: "音视频与 GPU 渲染知识库（在线镜像站）",
  srcDir: "docs",
  // 知识库中的站内路由链接（#/glossary?term=... 等）与部分锚点不适用于 VitePress，
  // 构建不因死链失败；链接精度问题记录在 README，离线主站仍是权威版本。
  ignoreDeadLinks: true,
  themeConfig: {
    siteTitle: "Render_Notes",
    outline: [2, 4],
    sidebar,
    socialLinks: [
      { icon: "github", link: "https://github.com/Vin535LFJ/Render_Notes" },
    ],
    footer: {
      message: "离线主站为仓库 web/ 目录，双击 index.html 即可打开。",
      copyright: "Render_Notes",
    },
  },
});
