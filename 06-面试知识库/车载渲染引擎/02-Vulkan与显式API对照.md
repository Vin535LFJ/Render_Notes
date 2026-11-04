# 02 · Vulkan 与显式 API 对照

> **定位**：JD 写"熟悉一种图形 API（OpenGL、Vulkan）"。若你主答 OpenGL，必须能回答"OpenGL 的问题在哪、Vulkan 怎么解决、两者概念怎么映射"。本篇只讲面试需要的深度，不做 API 手册。
>
> **验证状态**：✅已验证（Vulkan 规范语义）/ ⚠️有条件成立（性能与平台差异）/ ❗待验证（驱动/厂商实现细节）
>
> **配套**：[01-OpenGL管线-FBO与离屏渲染](./01-OpenGL管线-FBO与离屏渲染.md)、[04-跨平台与高性能架构 §1](../../04-跨平台与高性能架构/跨平台与高性能架构.md)、[图形与GPU工程 §1](../../03-图形与GPU工程/图形与GPU工程.md)

---

## 0. 一句话回答

> **OpenGL 是"驱动替你猜"，Vulkan 是"你自己说清楚"。** Vulkan 把状态管理、内存分配、同步、命令提交全部显式化，换来可预测的性能与多线程能力，代价是代码量与正确性责任大幅上升。

---

## 1. 对象模型：从"全局状态机"到"显式对象图"

### 1.1 核心对象与生命周期

| 对象 | 作用 | 创建时机 | 销毁时机 |
|---|---|---|---|
| `VkInstance` | 进程级 Vulkan 上下文，加载层与扩展 | 启动 | 退出 |
| `VkPhysicalDevice` | 枚举出的物理 GPU | 查询，不创建 | — |
| `VkDevice` | 逻辑设备，所有资源的父对象 | 启动 | 退出 |
| `VkQueue` | 提交通道（图形/计算/传输/呈现） | 从设备获取 | 随设备 |
| `VkSwapchainKHR` | 可呈现图像集合 | 窗口创建/尺寸变化 | 窗口销毁/重建 |
| `VkImage` / `VkBuffer` | 资源本体（不含内存） | 按需 | 显式销毁 |
| `VkDeviceMemory` | 实际显存/系统内存块 | 分配后绑定 | 显式释放 |
| `VkImageView` | 资源的"视图"（格式/层级/类型） | 按需 | 显式销毁 |
| `VkSampler` | 采样状态（过滤/寻址/各向异性） | 按需 | 显式销毁 |
| `VkRenderPass` | 附件与子通道的声明 | 管线创建前 | 管线销毁后 |
| `VkPipeline` | **不可变**的完整管线状态 | 创建时编译 | 显式销毁 |
| `VkCommandBuffer` | 录制命令的容器 | 从池分配 | 重置/释放 |
| `VkFence` / `VkSemaphore` | CPU-GPU / GPU-GPU 同步 | 按需 | 显式销毁 |

**关键认知**

- Vulkan 中**资源与内存分离**：`vkCreateImage` 只创建"描述"，`vkAllocateMemory` + `vkBindImageMemory` 才真正占显存。这是实现内存池、Aliasing、跨进程共享的前提。
- **管线不可变**：一旦创建，混合、深度、顶点布局、着色器全部冻结；改状态 = 换管线（或使用 dynamic state 的少量字段）。
- 所有对象都要手动销毁，且顺序不能反（子对象先于父对象）。RAII 封装（如 `vk::raii`）是工程必备。

### 1.2 与 OpenGL 的概念映射

| OpenGL | Vulkan | 差异要点 |
|---|---|---|
| Context（隐式全局） | `VkInstance` + `VkDevice` | Vulkan 可多设备、多线程各自录制 |
| `glGenBuffers` + `glBufferData` | `VkBuffer` + `VkDeviceMemory` + 绑定 | 内存由应用分配 |
| VAO | `VkPipeline` 的顶点输入状态 + `VkBuffer` 绑定 | 顶点布局烘焙进管线 |
| Shader Program | `VkPipeline`（含 shader module） | 编译为 SPIR-V，离线/在线编译 |
| `glBindTexture` + sampler 状态 | `VkDescriptorSet`（image + sampler） | 绑定是"描述符集"，可复用 |
| FBO | `VkFramebuffer` + `VkRenderPass` | 附件与子通道显式声明 |
| `glBlendFunc` | `VkPipelineColorBlendAttachmentState` | 状态在管线里 |
| `glFlush` / `glFinish` | `vkQueueSubmit` + fence/semaphore | 同步完全显式 |
| 隐式布局转换 | `vkCmdPipelineBarrier` + image layout | 必须手动管理布局 |

> 面试可用的简答：**"OpenGL 的 FBO 对应 Vulkan 的 RenderPass + Framebuffer；OpenGL 的 program + 状态对应 Vulkan 的 Pipeline；OpenGL 的 bind 对应 descriptor set。"**

---

## 2. 同步：Vulkan 面试的第一道分水岭

### 2.1 三种同步原语

| 原语 | 同步对象 | 典型用途 | 是否可等待 |
|---|---|---|---|
| `VkFence` | **CPU ↔ GPU** | CPU 等待某帧命令执行完（如回收 uniform buffer） | `vkWaitForFences` |
| `VkSemaphore` | **GPU ↔ GPU（队列/提交之间）** | swapchain 图像可用 → 渲染完成 → 呈现 | 只能用于队列提交 |
| `VkEvent` | 队列内/主机 | 细粒度、设备内同步 | 有限 |

**最常见错误**：用 fence 做队列间同步，或用 semaphore 让 CPU 等待。两者语义不同，混用会死锁或读到未完成的数据。

### 2.2 屏障（Barrier）三类

```cpp
// 1) 执行依赖 + 内存依赖（最常见）
VkMemoryBarrier memBarrier{VK_STRUCTURE_TYPE_MEMORY_BARRIER};
memBarrier.srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT;
memBarrier.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
vkCmdPipelineBarrier(cmd,
    VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    0, 1, &memBarrier, 0, nullptr, 0, nullptr);

// 2) 图像布局转换（Vulkan 独有）
VkImageMemoryBarrier imgBarrier{VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER};
imgBarrier.oldLayout = VK_IMAGE_LAYOUT_UNDEFINED;
imgBarrier.newLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
imgBarrier.image = image;
imgBarrier.subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};
imgBarrier.srcAccessMask = 0;
imgBarrier.dstAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
vkCmdPipelineBarrier(cmd, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT,
    VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT, 0,
    0, nullptr, 0, nullptr, 1, &imgBarrier);

// 3) 缓冲区范围屏障（精细控制）
VkBufferMemoryBarrier bufBarrier{...};
```

**答题要点**

- 屏障解决两件事：**执行顺序**（stage mask）和**内存可见性**（access mask）。只写 stage 不写 access，缓存可能不刷新。
- `oldLayout = UNDEFINED` 表示"不关心原内容"，可丢弃；若需要保留内容必须写实际布局。
- 布局转换不是免费的，尤其 TBDR GPU 上可能触发 tile 的 load/store；能合并的转换要合并。
- RenderPass 的 `initialLayout`/`finalLayout` 会自动插入部分布局转换，但**跨 RenderPass 的依赖仍需手动屏障**。

### 2.3 帧循环的标准同步结构

```
[CPU] wait fence[i]            // 该帧上一轮已完成
[CPU] acquire swapchain image  // 信号 imageAvailable[i]
[CPU] reset fence[i]
[CPU] 录制命令
[CPU] submit: 等待 imageAvailable[i]，信号 renderFinished[i]
[CPU] present: 等待 renderFinished[i]
```

- 每帧一个 fence + 每帧一个 `imageAvailable`/`renderFinished` 信号量，构成 ring。
- `renderFinished` 的等待对象是 present 队列，**不能在下一帧重复使用同一个 semaphore 而不等待**（否则触发 validation error）。
- 帧数（frames in flight）通常 2–3，车载上 2 帧更常见（降低延迟），但要防止 CPU 追不上。

---

## 3. RenderPass / Subpass：移动端的关键设计

### 3.1 为什么有 Subpass

在 TBDR（Tile-Based Deferred Rendering）GPU 上，一个 RenderPass 的附件会先进入 **tile memory（片上）**，全部子通道结束后才写回系统内存。Subpass 允许在 tile memory 内连续完成多个绘制阶段，**避免中间结果落主存**。

经典用法：**G-Buffer 的多个附件 + 一个 lighting subpass 通过 input attachment 读取**。

```cpp
// subpass 依赖：颜色附件写入 → 作为 input attachment 读取
VkSubpassDependency dep{};
dep.srcSubpass = 0;
dep.dstSubpass = 1;
dep.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
dep.dstStageMask = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
dep.srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
dep.dstAccessMask = VK_ACCESS_INPUT_ATTACHMENT_READ_BIT;
```

片元着色器里用 `subpassInput` 读取：

```glsl
layout(input_attachment_index = 0, set = 0, binding = 0) uniform subpassInput u_gbuffer;
vec4 albedo = subpassLoad(u_gbuffer);
```

**优势**：G-Buffer 不写回主存，带宽大幅下降（移动端收益显著）。
**代价**：RenderPass 结构复杂、不能随意跨 subpass 采样、调试困难。

### 3.2 Load / Store Op

| Op | 含义 | 用途 |
|---|---|---|
| `LOAD` | 保留上一帧内容 | 需要叠加绘制（UI、粒子） |
| `CLEAR` | 清空 | 每帧全新渲染 |
| `DONT_CARE` | 内容未定义，允许丢弃 | 中间附件、只写不读 |
| `STORE` | 写回内存 | 后续需要采样/呈现 |
| `DONT_CARE`（store） | 不写回 | 深度/模板在 Pass 结束后无用 |

**面试高频**："为什么移动端要尽量用 `DONT_CARE`？" → 省掉 tile → 系统内存的写回带宽；深度缓冲常常只在 Pass 内有用。

### 3.3 与 OpenGL FBO 的对比

| 维度 | OpenGL FBO | Vulkan RenderPass |
|---|---|---|
| 附件声明 | 运行时 `glFramebufferTexture2D` | 创建时声明，管线兼容性校验 |
| 子通道 | 无原生概念（多次 bind FBO） | 原生 Subpass + input attachment |
| 布局 | 隐式 | 显式（`VkImageLayout`） |
| 加载/存储 | 隐式 | 显式 `loadOp`/`storeOp` |
| 兼容性 | 运行时检查完整性 | 管线创建时校验 RenderPass 兼容 |

---

## 4. 管线状态对象（PSO）

### 4.1 创建管线的成本

- 着色器编译 + 状态校验 + 驱动内部优化，**首次创建可能几十到几百毫秒**。
- 运行时创建管线会造成卡顿，工程上必须：**启动预编译 + 磁盘缓存（`VkPipelineCache`）+ 按需异步创建**。
- 管线缓存跨版本/跨驱动可能失效，需要版本号与校验。

### 4.2 动态状态

可动态设置的状态很少（viewport、scissor、line width、depth bias、blend constants、stencil ref 等）。**顶点布局、渲染目标格式、混合模式、着色器**都在管线里。

### 4.3 管线爆炸的治理

| 手段 | 说明 |
|---|---|
| 管线缓存 | `VkPipelineCache` 序列化到磁盘 |
| 状态分组 | 按"材质 × 顶点布局 × 渲染目标"建 key，避免无意义组合 |
| 动态状态 | 把高频变化（viewport/scissor）放进 dynamic state |
| 变体裁剪 | 构建期按平台/质量档裁剪宏组合 |
| 预热 | 进入场景前在 loading 阶段创建并插入队列 |

---

## 5. 内存与图像布局

### 5.1 内存类型选择

`vkGetPhysicalDeviceMemoryProperties` 返回若干 heap + 若干 memory type，每个 type 有属性位：

| 属性 | 含义 | 用途 |
|---|---|---|
| `DEVICE_LOCAL` | 显存 | 纹理、渲染目标、频繁访问的缓冲 |
| `HOST_VISIBLE` | CPU 可映射 | 上传缓冲、uniform |
| `HOST_COHERENT` | 无需手动 flush | 简化上传（性能略低） |
| `HOST_CACHED` | CPU 缓存 | 回读（readback） |
| `LAZILY_ALLOCATED` | 懒分配 | 移动端 transient attachment |

**标准上传模式**：`HOST_VISIBLE | HOST_COHERENT` 的 staging buffer → `vkCmdCopyBufferToImage` → 设备本地图像。不要每帧创建/销毁 staging buffer，用 ring buffer 复用。

### 5.2 Tiling：Linear vs Optimal

- `VK_IMAGE_TILING_LINEAR`：行主序，CPU 可直接按行读写，但 GPU 采样效率低。
- `VK_IMAGE_TILING_OPTIMAL`：驱动自定义 swizzle（如 tiled/compressed），GPU 采样最快，**CPU 不能直接映射**。
- 结论：**渲染与采样一律 OPTIMAL**；需要 CPU 读写的中间数据用 buffer，或 copy 到 linear staging。

### 5.3 与 Android 零拷贝

通过 `VK_ANDROID_external_memory_android_hardware_buffer`：

```cpp
VkImportAndroidHardwareBufferInfoANDROID importInfo{};
importInfo.buffer = ahb;   // 来自 MediaCodec / Camera

// 关键：external format 必须匹配 AHB 的实际格式
VkExternalFormatANDROID extFormat{};
extFormat.externalFormat = 0;     // 0 = 使用 AHB 自带格式

VkImageCreateInfo ci{};
extFormat.pNext = &importInfo;      // 先串成链，再挂到 ci
ci.pNext = &extFormat;
```

导入后直接作为采样源，**不经过 CPU**。注意：
- 需要 `VK_EXT_queue_family_foreign` 处理队列族归属；
- 图像布局通常是 `VK_IMAGE_LAYOUT_GENERAL` 或外部专用布局；
- 生命周期由 AHB 持有者管理，Vulkan 侧只持引用。

详见 [04-跨平台架构 §1](../../04-跨平台与高性能架构/跨平台与高性能架构.md)。

---

## 6. Swapchain 与呈现

### 6.1 关键参数

| 参数 | 说明 | 车载建议 |
|---|---|---|
| `imageCount` | 交换链图像数 | 2（低延迟）或 3（抗抖动） |
| `format` / `colorSpace` | 像素格式与色彩空间 | 注意 sRGB 与 HDR（`VK_COLOR_SPACE_HDR10_ST2084_EXT`） |
| `presentMode` | `FIFO`（垂直同步）/ `MAILBOX`（低延迟三缓冲）/ `IMMEDIATE`（撕裂） | 车载仪表常用 FIFO 保稳定 |
| `compositeAlpha` | 与系统合成器的 Alpha 关系 | 多屏/叠加层时关键 |
| `preTransform` | 预旋转 | 车载屏常有固定旋转 |

### 6.2 重建时机

窗口尺寸变化、`VK_ERROR_OUT_OF_DATE_KHR`、`VK_SUBOPTIMAL_KHR` 都要重建。重建时必须：
1. `vkDeviceWaitIdle`（或等待相关 fence）
2. 销毁旧 image view / framebuffer / swapchain
3. 用新尺寸重建
4. 重新创建依赖 swapchain 格式的管线（若格式变了）

### 6.3 与 EGL 的对应

| EGL | Vulkan |
|---|---|
| `eglSwapBuffers` | `vkQueuePresentKHR` |
| `eglSwapInterval` | `presentMode`（FIFO ≈ vsync） |
| `EGL_BUFFER_DESTROYED` | `loadOp = DONT_CARE`（内容不保证） |
| `eglSwapBuffersWithDamageKHR` | 无直接对应，靠 scissor / render area |
| `EGL_KHR_fence_sync` | `VkFence` / timeline semaphore |

---

## 7. 移动端与桌面端的差异

### 7.1 TBDR 的影响

| 关注点 | 桌面 IMR | 移动 TBDR |
|---|---|---|
| 附件存储 | 直接写显存 | tile memory，Pass 结束才写回 |
| `loadOp` | 影响较小 | `LOAD` 会强制加载整张附件，代价高 |
| 中间纹理 | 可随意采样 | 尽量用 subpass input attachment |
| MSAA | 带宽换质量 | 片上 resolve，成本低 |
| `discard` | 关闭 Early-Z | 可能打断 tile 合并，代价更高 |
| Overdraw | 片元着色 + 带宽 | 片元着色，但带宽被 tile 掩盖一部分 |

### 7.2 能力差异

- 移动端对 `geometryShader`、`tessellation`、`wide lines` 支持不一致；Vulkan 中这些是可选特性，必须查询 `VkPhysicalDeviceFeatures`。
- `maxSamplerAnisotropy`、`maxImageDimension2D`、`maxComputeWorkGroupSize` 都要在启动时校验。
- 部分移动 GPU 不支持 32-bit 深度 + 模板同时高精度，需按需求降级。

---

## 8. 十个高频问答

### Q1：Vulkan 为什么能多线程？

> 因为**对象与命令录制是显式且独立的**：每个线程可以从各自的 command pool 分配 command buffer 并并行录制，最后在主线程按顺序提交。OpenGL 的全局状态机 + 单上下文模型使多线程录制几乎不可行（除非用多个共享上下文 + 大量同步）。

**追问**：command pool 是**外部同步**的，一个 pool 不能同时被多线程 reset/alloc；通常每线程一个 pool。

### Q2：Vulkan 一定比 OpenGL 快吗？

> 不一定。Vulkan 的收益来自**可预测性**：减少驱动猜测、支持多线程、显式内存与同步。但如果应用本身 DrawCall 少、状态切换少、瓶颈在 GPU 填充率，Vulkan 不会自动变快，甚至因为同步写错而更慢。⚠️有条件成立

### Q3：`vkDeviceWaitIdle` 为什么不能每帧调用？

> 它会阻塞到 GPU 完全空闲，摧毁 CPU/GPU 并行，掉帧且增加延迟。正确做法是用 fence 做**帧级**等待，只等需要复用的那一帧。

### Q4：什么是 pipeline barrier 的 stage mask 写错会怎样？

> 同步范围过窄 → 数据竞争、花屏、偶发崩溃；范围过宽 → GPU 气泡、性能下降。典型错误是只写 `FRAGMENT_SHADER` 而漏掉 `COLOR_ATTACHMENT_OUTPUT`，或漏掉 `TRANSFER` 阶段。

### Q5：Descriptor set 的更新有什么坑？

> ① 正在被 GPU 使用的 descriptor set 不能更新（除非用 `VK_DESCRIPTOR_BINDING_UPDATE_AFTER_BIND_BIT`）；② 同一帧内更新同一 set 会被后续提交看到，导致"前一帧数据被改"；③ 常见方案是**每帧/每 flight 一份 descriptor set**，或用 push descriptor / dynamic offset。

### Q6：为什么移动端推荐 `VK_IMAGE_LAYOUT_GENERAL` 少用？

> `GENERAL` 布局允许任意访问，但驱动无法做最优 swizzle，采样效率可能下降。能用 `SHADER_READ_ONLY_OPTIMAL` / `COLOR_ATTACHMENT_OPTIMAL` 就用专用布局。

### Q7：Vulkan 的 clip space 和 OpenGL 有什么不同？

> Vulkan 的 NDC 深度是 **[0,1]**（OpenGL 是 [-1,1]），且 **Y 轴向下**（与 framebuffer 坐标一致）。从 GL 移植时投影矩阵要改：深度映射 `z' = (z+w)/2`，Y 取反。见 [04 §1.4](./04-3D图形学与几何原理.md#14-ndc-与深度范围三套约定)。

### Q8：Subpass 和多次 bind FBO 的本质区别？

> Subpass 的附件**不离开 tile memory**，中间结果不写回系统内存；多次 FBO 会强制 store + load，移动端带宽成本高。Subpass 的限制是不能在 subpass 内任意采样其他附件（只能 input attachment），且依赖声明必须正确。

### Q9：如何调试 Vulkan 的同步问题？

> ① 打开 **Validation Layer**（含 synchronization validation）；② 用 RenderDoc 抓帧看 barrier 与 layout；③ 用 `VK_LAYER_KHRONOS_validation` 的 best practices 提示；④ 二分法禁用多线程录制/减少 frames in flight 定位。同步 bug 往往"偶发"，必须靠工具而不是日志。

### Q10：如果项目只用 OpenGL，为什么还要懂 Vulkan？

> ① 现代引擎（Unity/UE/Cocos 4 的 GFX 后端）都在做 **RHI 抽象**，需要理解统一接口背后的语义差异；② 跨平台零拷贝（AHardwareBuffer/dmabuf）在 Vulkan 路径上是主流；③ 面试官用 Vulkan 问题判断你是否理解"显式 API 的代价"，而不只是会调 `glDrawElements`。

---

## 9. 一页速记

```
对象：Instance → PhysicalDevice → Device → Queue
资源：Image/Buffer 与 Memory 分离，View 描述用途
同步：Fence=CPU等GPU；Semaphore=GPU等GPU；Barrier=阶段+可见性+布局
管线：不可变，创建贵，必须缓存 + 预热
移动：TBDR，少 LOAD，多 DONT_CARE，subpass 留在 tile
差异：NDC 深度 [0,1]，Y 向下，原点左上
```

---

## 10. 与 OpenGL 面试话术的衔接

当面试官问"你只写过 OpenGL，Vulkan 了解吗"：

> "我主力是 OpenGL ES，但按 Vulkan 的模型理解过一遍：对象显式、内存自管、同步显式、管线不可变。比如我们做 FBO 多 Pass 时最怕的是隐式同步和每帧重建纹理，这两点在 Vulkan 里分别对应 barrier/layout 和 memory alias + pipeline cache。我没有把 Vulkan 当性能银弹，它的价值是可预测性和多线程提交。"

这个回答同时展示了：**诚实边界 + 概念映射 + 工程判断**。
