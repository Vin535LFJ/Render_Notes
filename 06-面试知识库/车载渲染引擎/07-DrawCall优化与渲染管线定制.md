# 07 · DrawCall 优化、渲染管线定制与引擎内部开发

> **定位**：用户明确要求的三块：DrawCall 优化、定制渲染管线、渲染引擎内部定制开发。这也是"高级开发"与"会调 API"的分界线。
>
> **验证状态**：✅已验证（通用机制）/ ⚠️有条件成立（收益数字与平台相关）/ ❗待验证（引擎版本细节）
>
> **配套**：[03-引擎架构-Cocos与Unity](./03-引擎架构-Cocos与Unity.md)、[图形与GPU工程 §3-5](../../03-图形与GPU工程/图形与GPU工程.md)、[04-跨平台架构 §2](../../04-跨平台与高性能架构/跨平台与高性能架构.md)

---

## 1. DrawCall 的成本到底在哪

### 1.1 一次 DrawCall 的 CPU 侧开销

```
引擎收集渲染对象
  → 排序 / 合批
  → 设置材质与 uniform（Program、纹理、UBO 更新）
  → 绑定 VAO / VBO
  → 驱动校验状态、把命令写入 command buffer
  → 用户态 → 内核态提交（可能批量）
  → GPU 前端解析命令、启动顶点抓取
```

**关键结论**：DrawCall 贵在 **CPU 提交 + 驱动状态校验 + GPU 前端换装**，不是"GPU 画一个三角形"。三角形本身很便宜。

### 1.2 量化模型（用于面试估算）

| 项目 | 量级 | 备注 |
|---|---|---|
| 单次 DrawCall CPU 开销 | 数微秒 ~ 数十微秒 | 与驱动、平台、状态变化量强相关 [经验值] |
| 1 万 DrawCall | 数十毫秒 | 足以吃满 60 FPS 的 16.7 ms 预算 |
| 状态切换（换纹理/Program） | 高于纯 DrawCall | 触发流水线换装与缓存失效 |
| UBO 更新 | 中等 | 每 DrawCall 更新会放大成本 |

> 面试不要给死数字，给"数量级 + 依赖条件"：**"在移动端，DrawCall 到几千就应警惕；桌面可以到上万，但状态切换仍是主要成本。"** ⚠️有条件成立

### 1.3 先判断瓶颈

| 现象 | 判断 | 下一步 |
|---|---|---|
| 降分辨率帧率明显上升 | 片元/带宽瓶颈 | 优化 shader、Overdraw、降分辨率 |
| 降分辨率无变化，减物体数有效 | 顶点/提交瓶颈 | 合批、剔除、LOD |
| GPU 时间轴有大量空闲气泡 | CPU 提交瓶颈 | 多线程提交、减少状态切换、GPU-Driven |
| 单帧 GPU 时间高但 CPU 低 | GPU 瓶颈 | 查 Pass、带宽、填充率 |

**工具**：RenderDoc（抓帧）、Arm Graphics Analyzer / Mali Offline Compiler、NSight、Snapdragon Profiler、Unity Profiler / Frame Debugger、Xcode GPU Capture。

---

## 2. 合批的完整族谱

### 2.1 四代方案

| 代际 | 方案 | 合并维度 | 限制 | 适用 |
|---|---|---|---|---|
| 1 | **静态合批** | 顶点合并为一个大 VBO | 物体不能移动；内存翻倍 | 静态场景 |
| 2 | **动态合批** | CPU 每帧合并小网格 | 顶点数上限；每帧 CPU 成本 | 小物件（UI、粒子） |
| 3 | **GPU Instancing** | 一次 DrawCall 多个实例 | 需相同 mesh + material；实例数据走属性/UBO | 重复物件（树、螺丝、车道线） |
| 4 | **Indirect / GPU-Driven** | GPU 生成 draw 参数 | 需要 indirect draw + GPU culling | 大规模场景 |

### 2.2 合批成立的条件

- **相同材质**（同 shader、同纹理、同关键字）。
- **相同顶点布局**。
- **连续的内存/描述符**（避免绑定切换）。
- 动态合批还要求顶点数不超过阈值（Unity 默认约 300 顶点/900 索引，❗版本相关）。

### 2.3 图集与合批的关系

合图（Atlas）让不同贴图共用一张纹理，从而满足"同材质"条件；但图集过大会：
- 超过 GPU 最大纹理尺寸（ES 3.0 最低保证 2048）；
- 增加带宽（采样局部性变差）；
- 无法流式加载单张图。

**经验**：按"同时出现 + 同渲染队列"分组打图集，而不是把所有 UI 打成一张。

### 2.4 GPU Instancing

```glsl
// 顶点属性 divisor = 1，每实例步进一次
glVertexAttribDivisor(location, 1);
glDrawElementsInstanced(GL_TRIANGLES, count, GL_UNSIGNED_INT, 0, instanceCount);
```

实例数据可以是：
- 逐实例属性（mat4 需要 4 个 vec4 location）；
- 实例 UBO/SSBO（`gl_InstanceID` 索引）；
- 纹理（把变换烘到纹理里，老设备兼容）。

**注意**：实例数过大会让顶点着色器重复执行，且失去视锥剔除粒度（整批可见才画）。解决方案是**分块实例化**（按空间网格分批）。

### 2.5 Indirect Draw

```cpp
struct DrawIndexedIndirectCommand {
    uint32_t indexCount;
    uint32_t instanceCount;
    uint32_t firstIndex;
    int32_t  vertexOffset;
    uint32_t firstInstance;
};
glMultiDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, nullptr, drawCount, 0);
```

- draw 参数放在 GPU buffer，可由 Compute Shader 写入 → **GPU-Driven**。
- GPU 侧做视锥/遮挡剔除，CPU 只提交一次 indirect。
- 需要 `GL_ARB_multi_draw_indirect` / `GL_EXT_multi_draw_indirect`（ES 3.1+ 部分支持）；Vulkan 原生支持。

### 2.6 合批的代价

- 合批后**单个物体无法独立剔除**，可能画更多不可见几何。
- 大 VBO 更新成本高（动态合批每帧重建）。
- 合批破坏渲染顺序，可能增加 Overdraw。
- 结论：**合批不是越多越好，要按瓶颈选择**。⚠️有条件成立

---

## 3. 排序与状态管理

### 3.1 渲染队列

| 队列 | 内容 | 排序 |
|---|---|---|
| Opaque | 不透明 | 从前到后（减少 Overdraw） |
| AlphaTest | 镂空 | 从前到后（但 Early-Z 受限） |
| Transparent | 半透明 | 从后到前（正确混合） |
| Overlay | UI/后期 | 按层级 |

### 3.2 排序键设计

一个实用的排序 key（高位优先）：

```
[RenderQueue] [MaterialID/Pass] [ShaderID] [TextureID] [Depth]
```

- 先按队列，再按材质/Pass 减少状态切换，最后按深度。
- 半透明队列必须**优先保证深度顺序**，状态切换让位于正确性。

### 3.3 状态切换的成本排序

从高到低（经验）：
1. 换 RenderTarget / FBO（可能触发 tile resolve）
2. 换 Program / Pipeline（驱动重编译或缓存查找）
3. 换纹理（绑定 + 采样器状态）
4. 换 UBO（可能触发 buffer 重绑）
5. 换 VAO / 顶点缓冲
6. 改 blend/depth 等固定状态

**优化原则**：把相同状态的物体排在一起，让"昂贵切换"次数最少。

---

## 4. 剔除与 LOD

### 4.1 剔除层级

| 层级 | 方法 | 成本 |
|---|---|---|
| 视锥剔除 | 包围体 vs 6 平面 | 低 |
| 距离剔除 | 距离 > 阈值 | 极低 |
| 层/通道剔除 | LayerMask | 极低 |
| 遮挡剔除 | 硬件查询 / HZB | 中 |
| 小物体剔除 | 屏幕占比 < 阈值 | 低 |
| 背面剔除 | 绕序 | GPU 免费 |

### 4.2 硬件遮挡查询

```cpp
glBeginQuery(GL_ANY_SAMPLES_PASSED, q);
drawBoundingBox();
glEndQuery(GL_ANY_SAMPLES_PASSED);
// 下一帧读取结果（避免同步等待）
```

- 关键：**延迟一帧读取**，否则 CPU 等待 GPU 造成气泡。
- 适合大遮挡物（建筑、车身）；小物件查询开销大于收益。

### 4.3 HZB（层次 Z 缓冲）

- 用上一帧深度生成 mip 链，每个像素存该区域最大深度。
- CPU/Compute 用包围盒投影后与 HZB 比较，快速剔除。
- GPU-Driven 管线的核心组件。

### 4.4 LOD

- 按屏幕占比（投影后包围球半径 / 屏幕高度）切换。
- 切换需要 hysteresis（迟滞）避免边界抖动。
- LOD 过渡可用 dithering/cross-fade 掩盖跳变。

---

## 5. 定制渲染管线

### 5.1 为什么要定制

| 需求 | 通用管线的问题 |
|---|---|
| 车载多屏/多视图 | 通用管线假设单相机单视口 |
| 特定色彩/HDR 流程 | 固定 tone mapping 不满足车规屏 |
| 低延迟直出 | 通用后处理链引入额外 Pass |
| 与视频/摄像头混合 | 需要零拷贝外部纹理与自定义合成 |
| 功能安全（ASIL） | 需要可验证的确定性路径 |

### 5.2 管线抽象的四层

```
应用层：场景/材质/相机
  ↓
渲染管线层：FrameGraph / RenderGraph（Pass 编排、资源生命周期）
  ↓
RHI 层：统一的 Device/Buffer/Texture/Pipeline/CommandList 接口
  ↓
后端：OpenGL ES / Vulkan / Metal / D3D12
```

**RHI 的价值**：上层管线不感知 API；后端负责句柄映射、同步、内存。代价是抽象泄漏（如 Vulkan 的 barrier 在 GL 上没有对应物）。

### 5.3 Pass 抽象的设计要点

一个 Pass 应显式声明：

```cpp
struct RenderPassDesc {
    std::vector<TextureHandle> inputs;
    std::vector<TextureHandle> outputs;   // 颜色/深度
    DepthStencilDesc depth;
    BlendState blend;
    RasterizerState raster;
    std::function<void(CommandList&)> execute;
};
```

- **输入/输出显式** → 可自动推导依赖、插入屏障、做 Aliasing。
- **不要**在 Pass 内部偷偷绑定全局 RT，否则图编译器无法分析。
- 瞬态资源用 handle 而非裸指针，便于池化与生命周期分析。

### 5.4 资源生命周期与 Aliasing

```
Pass A: 写 T1
Pass B: 读 T1, 写 T2
Pass C: 读 T2
→ T1 生命周期 [A, B]，T2 生命周期 [B, C]，可重叠
→ 若 T3 只在 D 使用，可与 T1 共享物理内存
```

实现要点：
- 每个资源记录 `firstUse` / `lastUse` 的 Pass 索引；
- 生命周期不重叠 + 格式/尺寸兼容 → 分配同一块内存；
- 需要正确的 barrier（Vulkan）或 FBO 重建（GL）。

### 5.5 自动屏障

- 根据"上一 Pass 写、下一 Pass 读"推导 `srcStage/dstStage` 与 access mask。
- 读-读不插屏障；写-写、写-读必须插。
- 跨队列（图形/计算/传输）需要 semaphore 或 owner transfer。

### 5.6 多视图/多相机

车载常见：仪表屏 + 中控屏 + HUD + 后排娱乐，共享同一场景但相机不同。

方案：
1. **每相机一个 View**，共享场景数据（避免重复上传）；
2. 阴影/IBL 等全局 Pass 只做一次；
3. 每视图独立裁剪与 LOD；
4. 最终按屏幕合成（或直接渲染到各自 swapchain）。

### 5.7 低延迟直出

如果某一路只是视频/简单 UI，可以绕过 3D 管线：
- 视频直接绑定到 `Surface`（Overlay 合成），不经 GPU；
- 3D 层用独立 Surface，由系统合成器叠加；
- 减少 Pass = 减少延迟与功耗。

详见 [06-车载座舱专题 §3](./06-车载座舱专题与项目表达.md)。

### 5.8 管线定制的落地步骤

1. **定义不变量**：帧率、延迟、分辨率、色彩空间、平台。
2. **画出现有管线图**：每个 Pass 的输入/输出/成本。
3. **找瓶颈**：带宽？DrawCall？同步？分辨率？
4. **最小改动验证**：先加一个 Pass 或替换一个阶段，A/B 对比。
5. **加开关与回退**：车规项目必须能一键回退到基线。
6. **量化**：帧时间、GPU 时间、带宽、功耗、温度。

---

## 6. 引擎内部定制开发

### 6.1 三种介入深度

| 深度 | 手段 | 成本 | 风险 |
|---|---|---|---|
| 扩展 | 插件/脚本/自定义 Pass/材质 | 低 | 受引擎 API 限制 |
| 替换 | 替换渲染管线（SRP/自定义 Renderer） | 中 | 版本升级需适配 |
| 修改源码 | Fork 引擎核心 | 高 | 维护成本、许可 |

### 6.2 Unity 侧

| 需求 | 手段 |
|---|---|
| 插入后处理 | `ScriptableRendererFeature` + `ScriptableRenderPass`（URP） |
| 自定义光照 | 自定义 `RenderPipeline`（SRP） |
| 修改合批 | SRP Batcher / GPU Instancing / 自定义 `DrawRenderer` |
| 替换着色器 | Shader Graph / HLSL / 自定义 Shader |
| 深度/法线纹理 | `ConfigureInput` 声明依赖 |
| 多相机 | `CameraStacking` 或手动 `Render` |

**关键认知**：URP/HDRP 是"可编程管线"，但仍有固定阶段；要彻底控制需写完整 SRP。

### 6.3 Cocos 侧

| 版本 | 扩展点 |
|---|---|
| Cocos2d-x 3.x/4.x | `Node`/`Renderer`/`RenderCommand`/`Assembler`；4.x 的 GFX 后端抽象 |
| Cocos Creator 3.x | 自定义 `RenderPipeline`、`RenderPass`、`Material`/`Effect`、`Camera` 的 `visibility` |

- Cocos Creator 的 Effect 文件描述 pass 与 shader，可在 pass 里写 `blend`、`depthStencil`、`rasterizer` 状态。
- 自定义管线需要继承 `RenderPipeline` 并实现 `render(camera)`，按需调用 `PipelineUBO`、`SetDynamicStates` 等。❗具体 API 随版本变化，面试只讲结构。

### 6.4 自研引擎（OpenGL/Vulkan）

最小可用渲染器骨架：

```
Engine
 ├─ Window/EGL 上下文
 ├─ RHI (Device, Swapchain, CommandList)
 ├─ ResourceManager (Mesh, Texture, Material)
 ├─ Scene (Node, Camera, Light)
 ├─ Renderer (Culling, Queue, Batcher)
 └─ RenderGraph (Pass, Resource, Barrier)
```

**面试可讲的"内部定制"案例**：
- 把每帧 `glGenTextures` 改为纹理池 + `glTexSubImage2D`（消除驱动分配抖动）；
- 把逐物体 UBO 更新改为 per-frame UBO + dynamic offset；
- 把多 Pass 后处理合并（Kernel Fusion）降低带宽；
- 把硬解视频帧通过 EGLImage 直接导入纹理，绕过 CPU 上传。

### 6.5 修改引擎源码的注意事项

1. **许可证**：Unity 闭源（需源码授权）；Cocos 开源（MIT/自定义，注意条款）；UE 自定义许可。
2. **升级成本**：fork 越深，合并上游越难；尽量用扩展点。
3. **可测试性**：渲染改动必须有截图对比/数值基线，否则无法回归。
4. **平台矩阵**：同一改动要在目标 GPU 家族上验证（Mali/Adreno/PowerVR）。
5. **回退开关**：线上/车规必须能关闭新管线。

---

## 7. 十个高频问答

### Q1：DrawCall 从 1000 降到 100，帧率没变，为什么？

> 说明瓶颈不在 CPU 提交端。可能卡在 GPU 填充率、带宽、Overdraw、片元着色复杂度，或 vsync 限制。验证：降分辨率看帧率是否上升；用 profiler 看 GPU 时间与 CPU 等待。详见 [图形与GPU工程 §3.3](../../03-图形与GPU工程/图形与GPU工程.md)。

### Q2：静态合批和动态合批怎么选？

> 静态物体用静态合批（零运行时成本，但内存增加、不能移动）；小且动态的物体用动态合批（每帧 CPU 合并，有顶点上限）；大量相同网格用 GPU Instancing（最划算）；超大规模用 indirect/GPU-Driven。

### Q3：为什么合批后反而更卡？

> 可能原因：① 合批后失去单体剔除，画了更多不可见几何；② 大 VBO 每帧更新造成带宽/同步；③ 合批破坏了从前到后的排序，Overdraw 增加；④ 顶点数超过缓存，顶点着色器重复执行。

### Q4：GPU Instancing 的限制是什么？

> 需要同 mesh + 同 material；实例数据要走逐实例属性或 buffer；整批只有一个包围盒，剔除粒度粗；实例数过大时顶点开销线性增长。解决：分块实例化 + 每块独立包围盒。

### Q5：如何设计一个自定义 RenderPass？

> 明确声明输入/输出纹理、深度/混合/光栅状态、执行回调；不要依赖全局状态；资源用 handle；Pass 之间由 RenderGraph 推导依赖与屏障；提供开关与降级路径。详见 §5.3。

### Q6：RenderGraph 解决什么问题？

> 资源生命周期管理（Aliasing 降低显存）、自动屏障（减少手工同步错误）、Pass 依赖分析（死代码剔除、并行调度）。它不是"自动提速"，而是把复杂度收敛到框架层。详见 [04 §2](../../04-跨平台与高性能架构/跨平台与高性能架构.md)。

### Q7：多相机场景怎么优化？

> 共享场景数据与全局 Pass（阴影、IBL）；每相机独立裁剪/LOD；按屏幕分配分辨率；避免每个相机重复上传纹理；能合图的 UI 合图；必要时用单 Pass 多视图（VR/多屏）减少重复绘制。

### Q8：如何做 GPU-Driven 渲染？

> 把场景数据放 SSBO；Compute Shader 做视锥/遮挡剔除并写入 indirect draw 参数；`glMultiDrawElementsIndirect` 一次提交；用 HZB 做遮挡；CPU 只负责更新相机与资源。难点是同步、排序与材质分组。

### Q9：定制管线如何保证不破坏原有功能？

> ① 保留基线管线与开关；② 建立截图/数值回归测试；③ 分阶段替换（先加 Pass，再替换阶段）；④ 在目标设备矩阵上验证；⑤ 监控帧时间、内存、功耗、温度。

### Q10：什么时候该 fork 引擎源码？

> 只有扩展点无法满足且收益明确时才 fork。优先顺序：插件/脚本 → 自定义管线 → 替换模块 → fork。fork 前要评估升级成本、许可、团队维护能力。车规项目还要考虑认证与可追溯性。

---

## 8. 面试表达模板

### 8.1 "你做过哪些 DrawCall 优化？"

> "我先用 profiler 确认瓶颈在 CPU 提交而不是 GPU 填充。然后按三步做：① 把同材质的静态物件做静态合批，把重复物件改成 GPU Instancing；② 按渲染队列 + 材质排序，减少 Program/纹理切换；③ 对远景做 LOD 和遮挡剔除。最后 DrawCall 从 X 降到 Y，CPU 提交时间从 A ms 降到 B ms。边界是：合批后单体剔除失效，所以对超大物件保留独立绘制。"

### 8.2 "你如何定制渲染管线？"

> "我们把管线拆成 RenderGraph + RHI 两层：Pass 显式声明输入输出，图编译器负责依赖、屏障和瞬态资源复用；RHI 屏蔽 GL/Vulkan 差异。这样新增一个后处理只需要加一个 Pass，不需要改主循环。为了保证可回退，每个新 Pass 都有开关和基线对比。"

### 8.3 "你改过引擎内部吗？"

> "改过。比如把每帧创建/销毁纹理改成纹理池 + `glTexSubImage2D`，消除驱动分配导致的帧抖动；把逐物体的 uniform 更新改成 per-frame UBO + dynamic offset；把多 Pass 后处理合并成一个 shader 降低带宽。每次改动都有前后帧时间和 GPU 时间的量化对比。"

---

## 9. 一页速记

```
DrawCall 贵在提交与状态切换，不在三角形
合批四代：静态 → 动态 → Instancing → Indirect/GPU-Driven
排序：队列 → 材质 → 纹理 → 深度；半透明优先深度
剔除：视锥 → 距离 → 遮挡（延迟一帧）→ HZB
管线四层：应用 → RenderGraph → RHI → 后端
Pass 要显式声明输入输出，才能自动屏障与 Aliasing
定制顺序：扩展 → 替换 → fork；永远保留回退开关
```
