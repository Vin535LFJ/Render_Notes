# 光栅化、深度与移动 GPU 架构

> **定位**：补齐"为什么会有锯齿/深度冲突/Overdraw/带宽瓶颈"的底层原因，以及 TBDR 与 IMR 的差异。车载低端 SoC 上，这决定了优化方向。
>
> **验证状态**：✅已验证（图形学与规范定义）/ ⚠️有条件成立（厂商实现差异）/ ❗待验证（具体 GPU 型号行为）
>
> **配套**：[图形与GPU工程 §1/§5](图形与GPU工程.md)、[05-项目实战 §4](../05-项目实战/项目实战指南.md)、[01-OpenGL管线-FBO与离屏渲染](../06-面试知识库/车载渲染引擎/01-OpenGL管线-FBO与离屏渲染.md)
>
> **延伸**：[光照材质与阴影](../07-3D渲染与算法实现/光照材质与阴影.md)（Deferred/TBDR 取舍）、[批处理与GPU驱动管线](../07-3D渲染与算法实现/批处理与GPU驱动管线.md)（遮挡剔除与带宽）

---

## 1. 光栅化规则

### 1.1 像素中心与覆盖

- 片元中心在像素的 `(x+0.5, y+0.5)`。
- 三角形覆盖判定用**边函数（edge function）**：三个边函数同号则在内。
- **top-left rule**：落在共享边上的片元只属于其中一个三角形，避免重复着色或缝隙。

### 1.2 属性插值

- 屏幕空间线性插值（`noperspective`）用于 UI/2D。
- **透视校正插值**（默认 `smooth`）：`1/w` 与 `attr/w` 线性插值后再除，保证 3D 正确。
- `flat`：不插值，取 provoking vertex，用于整数 ID/层索引。

### 1.3 重心坐标与导数

```glsl
// 片元内可用的屏幕空间导数
vec2 dx = dFdx(v_uv);
vec2 dy = dFdy(v_uv);
```

- 导数是**按 2×2 片元 quad** 计算的，所以在 `discard` 或非 uniform 控制流中可能不可靠。
- mipmap LOD、各向异性、边缘检测都依赖导数。

---

## 2. 深度缓冲

### 2.1 深度测试

```
if (depthTestEnabled && newDepth < storedDepth) {  // 或 <=，取决于 depthFunc
    write depth;
    write color;
}
```

- 常见 `GL_LESS`；透明物体通常 `depthMask=false` 但保留测试。
- 深度写入与颜色写入可以分离（`glDepthMask`）。

### 2.2 精度与 Z-fighting

- 深度缓冲 16/24/32 bit；24 bit 最常用（配合 8 bit stencil）。
- 透视投影下深度非线性，精度集中在近平面。
- **Z-fighting**：两个表面深度差小于量化精度，出现条纹闪烁。
- 缓解：
  1. 增大 near（最有效）；
  2. 收紧 far；
  3. 使用 reversed-Z（D3D/Vulkan）；
  4. 对数深度缓冲（大场景）；
  5. 多边形偏移（`glPolygonOffset`，用于贴花）。

### 2.3 深度预 Pass

- 先只写深度（关闭颜色写入与着色），再正常渲染。
- 好处：后续片元可被 Early-Z 剔除，减少 Overdraw。
- 代价：多一次几何提交；在 TBDR 上收益取决于实现。
- 适用：Overdraw 严重的场景；不适用于大量半透明。

### 2.4 Early-Z 与 Hi-Z

| 机制 | 作用 | 失效条件 |
|---|---|---|
| **Early-Z** | 在片元着色前做深度测试，剔除被遮挡片元 | `discard`、写入 `gl_FragDepth`、Alpha Test |
| **Hi-Z** | 用深度金字塔做粗粒度剔除 | 依赖上一帧/预 Pass 的深度 |

- `discard` 会禁用 Early-Z，因为着色器可能在任何时刻丢弃片元。
- 需要 Alpha Test 时，可用 `alphaToCoverage` 或预排序减少损失。

---

## 3. Overdraw 与带宽

### 3.1 Overdraw 的本质

同一像素被多次着色/混合。每次半透明混合都是一次 **Read-Modify-Write**：

```
读 framebuffer 颜色 → 混合 → 写回
```

### 3.2 带宽估算

```
每帧颜色带宽 ≈ Σ(每个 Pass 的读 + 写) × 分辨率 × 4B
```

例：720P（1280×720）RGBA8 单次写 ≈ 3.69 MB；读+写 ≈ 7.37 MB；60 FPS ≈ 442 MB/s。10 个全屏 Pass ≈ 4.4 GB/s（未计纹理采样与深度）。

> 这是"为什么移动端要少 Pass、降分辨率、用 tile memory"的根本原因。

### 3.3 优化顺序

1. 减少 Pass 数量（合并 shader、Kernel Fusion）。
2. 降低中间纹理分辨率（Bloom/模糊）。
3. 不透明物体从前到后 + Early-Z。
4. 透明物体控制层数、避免全屏半透明。
5. 用 scissor/stencil 限制绘制区域。
6. 避免 `discard`（除非透明占比高）。

---

## 4. 移动 GPU 架构：TBDR vs IMR

### 4.1 IMR（Immediate Mode Rendering）

- 桌面 GPU 主流：每个三角形立即光栅化、着色、写显存。
- 依赖深度缓存与 Early-Z 控制 Overdraw。
- 带宽压力直接落在显存上。

### 4.2 TBDR（Tile-Based Deferred Rendering）

- 移动 GPU 主流（Mali、Adreno、PowerVR 等，实现细节不同 ⚠️）。
- 把屏幕切成小块（tile，常见 16×16 或 32×32），逐 tile 处理。
- 几何阶段先做**分块（binning）**，把三角形分配到覆盖的 tile。
- 每个 tile 的片元在**片上 tile memory** 中完成着色与混合，最后一次性写回系统内存。
- PowerVR 的 HSR（Hidden Surface Removal）会在着色前剔除被遮挡片元。

### 4.3 关键差异

| 维度 | IMR | TBDR |
|---|---|---|
| 中间结果 | 写显存 | 留在 tile memory |
| 带宽 | 高 | 低（尤其是多 Pass 在 tile 内） |
| `loadOp` | 影响较小 | `LOAD` 代价高（要载入整块） |
| `storeOp` | 影响较小 | `DONT_CARE` 可省写回 |
| MSAA | 带宽换质量 | 片上 resolve，成本较低 |
| `discard` | 关闭 Early-Z | 可能打断 HSR/合并 |
| 依赖上一帧颜色 | 便宜 | 需要 load，代价高 |

### 4.4 对渲染架构的影响

- **Subpass / framebuffer fetch**：在 tile 内完成 G-Buffer → 光照，避免中间纹理落主存。
- **避免每帧 `LOAD`**：清屏用 `CLEAR`/`DONT_CARE`，不要依赖上一帧内容。
- **避免频繁切换 RenderTarget**：每次切换可能触发 tile 的 store/load。
- **MSAA 优先**：TBDR 上 MSAA 的 resolve 在片上完成，比 IMR 更划算。
- **全屏后处理**：尽量合并 Pass；分辨率敏感。

### 4.5 厂商差异 ⚠️

| 厂商 | 架构 | 注意点 |
|---|---|---|
| Arm Mali | TBDR | 关注 tile 大小、`glDiscardFramebufferEXT`、transaction elimination |
| Qualcomm Adreno | TBDR（FlexRender 等） | 部分场景可切换 direct/binning；关注 `glInvalidateFramebuffer` |
| Imagination PowerVR | TBDR + HSR | HSR 对不透明物体友好；`discard` 影响大 |
| Apple GPU | TBDR | Metal 的 `MTLStoreAction` 与 tile memory 语义明确 |

> 面试时不要断言"所有移动 GPU 都是 TBDR"，应说"主流移动 GPU 采用 TBDR 家族，具体实现与优化建议以厂商文档为准"。⚠️

---

## 5. MSAA 与 resolve

### 5.1 原理

- 每个像素有 N 个采样点（2×/4×/8×），几何覆盖按采样点判定。
- 片元着色通常每像素一次（除非 sample shading），颜色写入所有被覆盖的采样点。
- resolve：把 N 个采样平均为一个像素。

### 5.2 成本

- 颜色/深度缓冲占用 ×N（或使用压缩）。
- 带宽增加，但 TBDR 上 resolve 在片上，成本较低。
- 对几何边缘有效，对**着色锯齿**无效（因为每像素仍只着色一次）。

### 5.3 与后处理 AA 的选择

| 场景 | 建议 |
|---|---|
| 3D 车模、清晰边缘 | MSAA 4× |
| 文字/UI 为主 | 提高分辨率或 MSAA，慎用 FXAA |
| 动态场景、性能紧张 | FXAA/SMAA |
| 高端、可接受拖影 | TAA |

---

## 6. 片元阶段性能模型

### 6.1 主要成本

1. **片元数量**：分辨率 × Overdraw。
2. **每片元指令数**：ALU、分支、`pow`、`normalize`。
3. **纹理采样**：次数 × 过滤模式 × 缓存命中率。
4. **带宽**：读纹理 + 写颜色 + 混合读写。

### 6.2 判断瓶颈

| 实验 | 结论 |
|---|---|
| 降分辨率帧率明显上升 | 片元/带宽瓶颈 |
| 降分辨率无变化 | 顶点/提交/同步瓶颈 |
| 简化 shader 帧率上升 | ALU 瓶颈 |
| 减少纹理采样帧率上升 | TMU/带宽瓶颈 |
| 关闭混合帧率上升 | Overdraw/带宽瓶颈 |

### 6.3 移动端红线

- 全屏 Pass 数量控制在个位数。
- 避免每像素多次 `pow`/`normalize`。
- 避免动态分支发散。
- 半透明层数控制在 2–3 层。
- 中间纹理优先半分辨率。

---

## 7. 十个高频问答

### Q1：为什么移动端特别在意带宽？

> 移动 SoC 的 DRAM 带宽有限且功耗敏感；TBDR 把片元计算留在 tile memory，就是为了减少系统内存读写。全屏 Pass、MSAA、大纹理都会直接吃带宽。

### Q2：Early-Z 什么时候失效？

> 片元着色器使用 `discard`、写入 `gl_FragDepth`、或开启 Alpha Test 时，GPU 无法在着色前确定片元是否可见，Early-Z 失效。此时可用深度预 Pass 或调整渲染顺序。

### Q3：Z-fighting 怎么解决？

> 增大 near、收紧 far、使用 reversed-Z 或对数深度；对贴花用 polygon offset；必要时拆分几何或提高深度精度。

### Q4：TBDR 上为什么要避免 `LOAD`？

> `LOAD` 要求把整块附件从系统内存载入 tile，代价高；如果内容不需要保留，用 `CLEAR` 或 `DONT_CARE` 可以省掉这次读。

### Q5：MSAA 能解决 shader 锯齿吗？

> 不能。MSAA 只在几何覆盖层面多采样，每个像素通常仍只着色一次；着色锯齿（高光、纹理）需要 SSAA/TAA 或后处理 AA。

### Q6：为什么 `discard` 在移动端代价高？

> 除了关闭 Early-Z，还可能打断 TBDR 的 HSR/合并流程，导致更多片元被着色。透明占比高时收益才明显。

### Q7：如何测 Overdraw？

> RenderDoc 的 Overdraw 视图、Mali Graphics Analyzer、Adreno Profiler、Xcode GPU Capture 都能可视化；也可以用"关闭混合/减少层数"做 A/B。

### Q8：深度预 Pass 值得吗？

> 在 Overdraw 严重且场景以不透明为主时值得；在 TBDR 上收益取决于实现，且增加一次几何提交。要用数据验证，不要默认开启。

### Q9：为什么半透明要关闭深度写入？

> 半透明物体不遮挡后面的物体，写深度会导致后面的半透明被错误剔除；但保留深度测试可以让它被不透明物体遮挡。

### Q10：如何估算一个全屏 Pass 的带宽？

> `宽 × 高 × 每像素字节 × (读次数 + 写次数)`，再乘帧率。720P RGBA8 单读单写约 7.4 MB/帧，60 FPS 约 442 MB/s。加上纹理采样与深度，实际更高。

---

## 8. 一页速记

```
光栅化：像素中心 + top-left rule + 透视校正插值
深度：非线性，near 最影响精度；reversed-Z/对数深度
Early-Z：discard / fragDepth / alphaTest 会失效
Overdraw：半透明 RMW，带宽杀手
TBDR：tile memory，少 LOAD、多 DONT_CARE、少切 RT
MSAA：几何边缘有效，着色锯齿无效
优化顺序：少 Pass → 降分辨率 → 排序 → 控透明 → 裁剪
```
