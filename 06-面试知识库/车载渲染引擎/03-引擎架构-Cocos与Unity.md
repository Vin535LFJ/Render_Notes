# 03 · 引擎架构：Cocos 与 Unity

> **定位**：JD 要求"熟悉主流 3D 引擎（Cocos、Unity），深入了解其架构和渲染机制"。本篇按**结构层面**讲清楚：场景组织、渲染提交、材质系统、合批策略、管线扩展点。
>
> **验证状态**：✅已验证（公开文档与稳定架构）/ ⚠️有条件成立（具体阈值与平台相关）/ ❗待验证（随引擎版本变化，面试时说明"以项目版本为准"）
>
> **配套**：[07-DrawCall优化与渲染管线定制](./07-DrawCall优化与渲染管线定制.md)、[04-3D图形学与几何原理](./04-3D图形学与几何原理.md)、[02-Vulkan与显式API对照](./02-Vulkan与显式API对照.md)

---

## 0. 一句话对比

> **Cocos 更像"轻量自研引擎 + 编辑器"**：结构简单、源码可控、包体小，适合移动端/HMI/小游戏。
> **Unity 更像"平台型引擎"**：编辑器与资产管线成熟、SRP 可编程管线、生态完善，适合复杂 3D 与跨平台。
>
> 面试时不要背版本号，讲**架构分层**与**渲染提交模型**。

---

## 1. 引擎的通用分层

几乎所有实时 3D 引擎都可以拆成这五层：

```
应用/脚本层（组件、行为、UI）
      ↓
场景层（节点树/ECS、相机、灯光、可见性）
      ↓
渲染层（剔除、排序、合批、材质、Pass）
      ↓
图形抽象层（RHI / GFX：统一 GL/Vulkan/Metal/D3D）
      ↓
平台层（窗口、EGL、输入、文件、线程）
```

**面试要点**：能说清"一个物体从场景树到屏幕"经过哪些层，比背 API 更重要。

---

## 2. Cocos2d-x 架构

> 以 3.x 为主线（车载/嵌入式项目仍常见），4.x 的 GFX 后端在后面单列。

### 2.1 核心对象

| 对象 | 职责 |
|---|---|
| `Director` | 单例，驱动主循环、场景切换、渲染调度 |
| `Scene` | 场景根节点，承载节点树与相机 |
| `Node` | 变换（position/rotation/scale）、父子关系、渲染标志 |
| `Camera` | 视图/投影矩阵、可见性掩码 |
| `Sprite` / `Mesh` | 可渲染节点 |
| `Scheduler` | 定时器与每帧更新 |
| `EventDispatcher` | 触摸/键盘/自定义事件 |
| `ActionManager` | 动作系统（补间、序列） |

### 2.2 渲染主循环

```
Director::mainLoop()
  → drawScene()
      → 更新 Scheduler / Action / 物理
      → visitSceneGraph()        // 深度优先遍历 Node
          → Node::visit()
              → 计算变换矩阵
              → 若可见 → draw()  // 生成 RenderCommand
      → Renderer::render()       // 排序并执行命令
      → swapBuffers()
```

**关键设计**：**遍历与提交分离**。`visit/draw` 只负责"生成命令"，真正的 GPU 调用延后到 `Renderer::render()` 统一执行。这样才有机会排序与合批。

### 2.3 RenderCommand 体系

| 命令 | 用途 |
|---|---|
| `QuadCommand` | 精灵四边形（批量合批） |
| `BatchCommand` | 批量四边形（SpriteBatchNode） |
| `GroupCommand` | 一组命令（用于渲染到纹理/裁剪） |
| `CustomCommand` | 自定义 shader/几何（Mesh、粒子） |

- 命令携带：材质/ProgramState、纹理、顶点缓冲、变换矩阵、渲染标志。
- `Renderer` 维护多个 **RenderQueue**（不透明/透明/UI），按 sort key 排序后提交。
- `SpriteBatchNode` 是 3.x 的显式合批手段：同图集的精灵挂在同一 batch node 下，共享一次 draw。

### 2.4 材质与着色器

- 3.x：`GLProgram` + `GLProgramState`（uniform 绑定）+ `.vsh/.fsh`。
- 4.x：`backend::ProgramState` + `backend::Program`，支持 UBO。
- 自定义渲染：继承 `Node` 并重写 `draw()`，或使用 `CustomCommand` 注入自己的 draw call。

### 2.5 Cocos2d-x 4.x 的 GFX 后端 ❗

4.0 起引入 `gfx` 抽象层（`Device`、`CommandBuffer`、`RenderPass`、`PipelineState`），向 Vulkan/Metal 靠拢：

```
Renderer → RenderCommand → gfx::CommandBuffer → 后端 (GL/Vulkan/Metal)
```

- 好处：多后端、显式资源、接近现代 API。
- 代价：旧自定义渲染代码需要迁移；生态与文档相对少。
- 面试表述："4.x 把渲染后端抽象成 GFX，思路和 Unity SRP/Vulkan 一致，都是把命令录制与执行分离。"

### 2.6 Cocos Creator 3.x 架构 ❗

Creator 3.x 与 2d-x 是**不同代码基**，采用实体-组件（Node + Component）：

| 概念 | 说明 |
|---|---|
| `Node` | 场景节点（变换、层级） |
| `Component` | 挂在节点上的行为/渲染组件 |
| `MeshRenderer` | 提交网格 |
| `Model` / `SubModel` | 一个 Renderer 可含多个 SubModel（对应多个材质/Pass） |
| `Material` | 由 `Effect` 实例化，包含多个 `Pass` |
| `.effect` | YAML 描述 Pass、着色器、渲染状态、属性 |
| `Camera` | 可见性、优先级、目标纹理 |
| `director` | 主循环与场景管理 |

渲染流程（概念层面）：

```
Director → 收集可见 Renderer → 生成 SubModel 列表
  → 按 Pass/材质/队列排序 → 合批/实例化 → 提交到 GFX
```

**Creator 的合批**：动态合批、GPU Instancing、静态合批（版本相关 ❗）；2D 依赖同图集/同材质自动合批。

---

## 3. Unity 架构

### 3.1 核心概念

| 概念 | 说明 |
|---|---|
| `GameObject` + `Component` | 组合式对象模型 |
| `Transform` | 层级变换 |
| `Camera` | 渲染入口，可多相机叠加 |
| `Renderer` / `MeshRenderer` / `SkinnedMeshRenderer` | 提交几何 |
| `Material` / `Shader` | 材质与着色器 |
| `Light` | 实时光源 |
| `ScriptableRenderPipeline`（SRP） | 可编程渲染管线 |

### 3.2 Built-in 渲染管线

- 支持 Forward / Deferred / Vertex Lit。
- 通过 `ShaderLab` 的 `Tags { "Queue" "RenderType" }` 决定队列与替换。
- 内置后处理通过 `OnRenderImage` + `Graphics.Blit`。
- 缺点：管线固定，难以插入自定义 Pass；移动端 Deferred 支持有限。

### 3.3 SRP：URP / HDRP

```
ScriptableRenderPipeline
  └─ ScriptableRenderer（URP）
       ├─ ScriptableRenderPass（内置 Pass：Opaque/Transparent/Shadow/Post）
       └─ ScriptableRendererFeature（用户扩展点）
```

- `ScriptableRenderContext`：提交命令的上下文。
- `CommandBuffer`：录制绘制/计算/RT 切换。
- `ConfigureInput`：声明 Pass 依赖（深度、法线、Opaque 纹理）。
- `RendererFeature`：在管线中插入自定义 Pass（后处理、描边、SSAO 等）。
- HDRP：更复杂的延迟/前向混合、体积光、物理光照。

**面试要点**：URP 不是"另一套渲染器"，而是"用 C# 编排 Pass 的 SRP 实现"；扩展点是 RendererFeature，不是修改内置 shader。

### 3.4 合批机制（Unity）

| 机制 | 条件 | 成本 |
|---|---|---|
| **Static Batching** | 标记 Static，构建时合并 | 内存增加，物体不可移动 |
| **Dynamic Batching** | 小网格 + 同材质，顶点属性受限 ❗ | 每帧 CPU 合并 |
| **GPU Instancing** | 同 mesh + 同 material，`enableInstancing` | 实例数据上传 |
| **SRP Batcher** | 同 shader 变体 + 同 CBUFFER 布局 | 减少 CBUFFER 绑定，不减少 DrawCall |
| **Indirect** | 平台支持 | 需自定义 |

**SRP Batcher 的本质**：把材质属性放在**持久 CBUFFER** 中，按 shader 变体分组，减少每 DrawCall 的常量缓冲上传与绑定；它**不合并 DrawCall**，但显著降低 CPU 提交成本。常见误解是"开了 SRP Batcher 就会降 DrawCall"——不会。✅

### 3.5 Shader 体系

| 类型 | 说明 |
|---|---|
| Surface Shader | Built-in 专用，自动生成光照代码 |
| Vertex/Fragment | 手写 HLSL/Cg，跨管线需适配 |
| Shader Graph | 可视化，输出 HLSL |
| HLSL Include | URP/HDRP 的 `Core.hlsl`、`Lighting.hlsl` |

**变体治理**：`multi_compile` / `shader_feature`、`ShaderVariantCollection`、预热（`Shader.WarmupAllShaders` / 管线预热）、构建期裁剪。

### 3.6 其他相关系统

- **Job System / Burst / DOTS**：数据导向、多线程、SIMD；适合大规模实体与物理。
- **SRP Batcher + GPU Instancing + LOD Group**：常规 3D 优化组合。
- **Light Probes / Reflection Probes**：间接光。
- **Occlusion Culling**：烘焙 PVS。

---

## 4. Cocos vs Unity 对照

| 维度 | Cocos2d-x / Creator | Unity |
|---|---|---|
| 对象模型 | Node 树 + 组件（Creator） | GameObject + Component |
| 语言 | C++ / TypeScript | C# |
| 渲染提交 | RenderCommand / GFX | CommandBuffer / SRP |
| 管线可编程性 | 4.x GFX / Creator 自定义管线 | SRP（URP/HDRP）成熟 |
| 合批 | SpriteBatchNode / 自动合批 / Instancing | Static/Dynamic/Instancing/SRP Batcher |
| 包体 | 小 | 较大 |
| 生态 | 移动端/HMI/小游戏 | 全平台/复杂 3D |
| 源码 | 开源（可改） | 闭源（源码需授权） |
| 适用 | 轻量、可控、嵌入式 | 复杂场景、团队协作、资产生管线 |

**面试话术**："Cocos 的优势是轻和可控，适合车机这种资源受限、需要深度定制的场景；Unity 的优势是管线和工具链成熟，SRP 让渲染扩展有正规入口。选型看团队与资产，而不是单纯比性能。"

---

## 5. 渲染机制深挖：一个物体如何被画出来

以 Cocos2d-x 3.x 为例（Unity 概念类似）：

1. **可见性**：`Node` 的 `_visible` + 相机 `visibility mask` + 视锥剔除。
2. **变换**：递归计算世界矩阵（父 → 子）。
3. **材质绑定**：`GLProgramState` 设置 uniform、纹理。
4. **生成命令**：`Sprite::draw()` 填充 `QuadCommand`（顶点、索引、矩阵、纹理）。
5. **入队**：按 RenderQueue 的 sort key 插入。
6. **排序**：不透明从前到后、透明从后到前；同队列按材质/纹理排序。
7. **合批**：相邻且同材质的 Quad 合并为一个 draw。
8. **提交**：`Renderer::render()` 调用 GL/Vulkan 命令。
9. **呈现**：`eglSwapBuffers` / `vkQueuePresentKHR`。

**追问点**：
- 为什么先排序再合批？→ 合批依赖相邻性；排序决定相邻关系。
- 为什么透明要从后到前？→ Alpha 混合不满足交换律。
- 为什么 UI 常单独一个队列？→ 需要覆盖在 3D 之上，且合批规则不同（图集/字体）。

---

## 6. 十二个高频问答

### Q1：Cocos 的渲染主循环是怎样的？

> `Director` 驱动 `drawScene`：更新逻辑（Scheduler/Action）→ 遍历场景树生成 RenderCommand → `Renderer` 按队列排序、合批、提交 → swap buffers。核心是**遍历与提交分离**。

### Q2：Cocos 如何做合批？

> 3.x 用 `SpriteBatchNode` 把同图集精灵放在一起，生成 `BatchCommand`；4.x/Creator 有自动合批与 GPU Instancing。合批条件是同材质/同纹理/顶点布局一致，且命令相邻。

### Q3：Unity 的 SRP Batcher 和 GPU Instancing 有什么区别？

> Instancing 用一次 DrawCall 画多个相同网格；SRP Batcher **不减少 DrawCall**，而是把材质属性放进持久 CBUFFER，减少每次提交的常量缓冲绑定与上传。两者可以同时使用。

### Q4：Unity 动态合批为什么经常"不生效"？

> 常见原因：网格顶点数/属性超过阈值、材质不同、使用了多 Pass 或 Lightmap 差异、缩放为负、Shader 不支持。用 Frame Debugger 看 "Dynamic Batching" 标记确认。❗阈值随版本变化。

### Q5：URP 里怎么插入自定义后处理？

> 用 `ScriptableRendererFeature` + 自定义 `ScriptableRenderPass`，在 `AddRenderPasses` 中入队；通过 `ConfigureInput` 声明需要深度/法线；`Blit` 到临时 RT。注意 Pass 顺序与 `renderPassEvent`。

### Q6：Cocos 4.x 的 GFX 和 3.x 的 Renderer 有什么区别？

> 3.x 的 RenderCommand 直接封装 GL 调用；4.x 的 GFX 是显式后端抽象（Device/CommandBuffer/PipelineState），更接近 Vulkan/Metal，支持多后端与更明确的资源管理。移植自定义渲染代码需要适配。

### Q7：Creator 的 Model/SubModel/Pass 是什么关系？

> 一个 `Model` 对应一个 Renderer；模型可拆成多个 `SubModel`（不同材质/网格）；每个材质包含多个 `Pass`，每个 Pass 对应一次绘制与一套渲染状态。渲染时按 SubModel × Pass 提交。

### Q8：为什么 Unity 的材质属性修改有时不生效？

> 可能被 `MaterialPropertyBlock` 覆盖、SRP Batcher 的 CBUFFER 布局不匹配、或修改的是共享材质而非实例材质。SRP Batcher 要求属性在 `CBUFFER_START(UnityPerMaterial)` 中且布局一致。

### Q9：Cocos 和 Unity 谁性能更好？

> 不能一概而论。Cocos 包体小、结构轻，在低端设备/简单场景有优势；Unity 的 SRP、LOD、遮挡剔除、Job/Burst 在复杂场景更强。要看具体瓶颈（CPU 提交、GPU 填充、带宽）与团队优化程度。⚠️有条件成立

### Q10：如何在引擎里做多相机/多屏？

> Unity：多 Camera + `targetTexture` 或 Camera Stacking；Cocos：多 Camera + visibility mask，或手动渲染到纹理再合成。车载多屏还要考虑每屏独立 swapchain/EGLSurface 与系统合成器。

### Q11：引擎的剔除发生在哪一层？

> 通常在场景/渲染层：视锥剔除 + 层掩码 + 距离/LOD；遮挡剔除可能是烘焙 PVS（Unity）或运行时硬件查询。Cocos 3.x 的剔除相对简单，复杂场景需要自己扩展。

### Q12：如果让你给引擎加一个"描边"功能，你怎么做？

> 两条路：① 后处理 Sobel（深度/法线）——不改管线，加一个 Pass；② 背面外扩——加一个描边 Pass 渲染放大背面。选择取决于是否需要逐物体控制、是否支持透明、性能预算。实现上在 Cocos 用 CustomCommand/RenderPass，在 Unity 用 RendererFeature。

---

## 7. 面试表达：如何讲"熟悉引擎架构"

不要背 API，按这个结构讲：

1. **对象模型**：Node/GameObject 如何组织场景。
2. **提交模型**：遍历生成命令 → 排序 → 合批 → 提交。
3. **材质模型**：Shader/Material/Pass 的关系。
4. **扩展点**：插件、自定义 Pass、自定义管线、源码。
5. **优化手段**：合批、剔除、LOD、变体治理。
6. **边界**：哪些是引擎保证的，哪些要自己实现。

示例：

> "我理解 Cocos 的渲染是'两段式'：场景树遍历生成 RenderCommand，Renderer 再统一排序合批提交。所以优化合批的关键是让同材质的命令相邻。Unity 的 SRP 则是把 Pass 编排交给 C#，扩展点是 RendererFeature；SRP Batcher 优化的是 CBUFFER 绑定而不是 DrawCall 数量。两套引擎的共性都是'减少状态切换 + 提高提交效率'。"

---

## 8. 一页速记

```
Cocos：Director → Scene/Node → visit/draw → RenderCommand → Renderer 排序合批 → GFX
Creator：Node + Component → Model/SubModel/Pass → 自定义管线
Unity：GameObject/Component → Renderer → SRP（URP RendererFeature）
合批：同材质 + 相邻 + 顶点布局一致
SRP Batcher：省 CBUFFER 绑定，不省 DrawCall
扩展顺序：插件 → 自定义 Pass → 自定义管线 → fork
```
