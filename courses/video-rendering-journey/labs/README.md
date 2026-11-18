# 实验映射（labs）

> 本课程**不复制实验定义**。所有实验的唯一来源是 [`tools/labs.json`](../../../tools/labs.json)，渲染器在 `web/assets/app.js`。本文件只建立"课时 → 实验"的映射，供学习者查找。

| 课时 | 主题 | 实验 ID | 站点入口 | 状态 |
|---|---|---|---|---|
| L01 | 为什么视频不是 RGB | `yuv-to-rgb` | `#/lab/yuv-to-rgb` | ✅ 已实现（P3） |
| L02 | 时间戳与同步 | `pts-dts-timeline` | `#/lab/pts-dts-timeline` | ✅ 已实现（P3） |
| L06 | 纹理桥与零拷贝 | `frame-pipeline` | `#/lab/frame-pipeline` | ✅ 已实现（P3） |
| L11 | RenderGraph 与资源生命周期 | `rendergraph-dag` | `#/lab/rendergraph-dag` | ✅ 已实现（P3） |
| L13 | 坐标变换与 MVP | `transform-mvp` | `#/lab/transform-mvp` | ✅ 已实现 |

## 现有实验（全部 7 个）

课程绑定的 5 个实验之外，还有两个独立实验：

- `transform-mvp`（L13）— 坐标变换与 MVP
- `procedural-lathe`（L17）— 程序化旋转曲面
- `pbr-lighting`（L18）— PBR 光照与材质
- `yuv-to-rgb`（L01）— YUV 采样格式与字节布局
- `pts-dts-timeline`（L02）— PTS/DTS 与重排序缓冲
- `frame-pipeline`（L06）— 解码帧所有权迁移与零拷贝
- `rendergraph-dag`（L11）— 依赖边、barrier 与显存 aliasing

全部实验均含 selfTest、术语链接、文档/课时双向关联。

## 约束

- 实验定义只在 `tools/labs.json` 维护；新实验须同时实现 renderer 并把 type 加入 `validate_site.py` 的 `KNOWN_LAB_TYPES`。
- 交互必须离线可运行（Canvas 2D，无外部依赖）；新增 demo 不得引入 Three.js/WebGL/网络。
