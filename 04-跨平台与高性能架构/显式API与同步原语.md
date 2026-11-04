# 显式 API 与同步原语

> **定位**：RenderGraph 一章默认读者已经懂 command buffer、fence/semaphore、barrier、PSO。本文把这层基础补齐，并给出 Vulkan / Metal / OpenGL 的对照。
>
> **验证状态**：✅已验证（规范语义）/ ⚠️有条件成立（驱动实现与性能）/ ❗待验证（特定设备行为）
>
> **配套**：[跨平台与高性能架构 §2](../04-跨平台与高性能架构/跨平台与高性能架构.md#2-rendergraph-架构设计)、[02-Vulkan与显式API对照](../06-面试知识库/车载渲染引擎/02-Vulkan与显式API对照.md)、[批处理与GPU驱动管线 §9](../07-3D渲染与算法实现/批处理与GPU驱动管线.md#9-pso-预热与变体治理)

---

## 1. 为什么需要显式 API

| 维度 | OpenGL | Vulkan / Metal / D3D12 |
|---|---|---|
| 状态管理 | 全局状态机，驱动隐式跟踪 | 显式 PSO / 编码器 |
| 多线程 | 上下文绑定线程，难并行录制 | command buffer 可多线程录制 |
| 内存 | 驱动决定布局与生命周期 | 应用决定类型、布局、别名 |
| 同步 | 驱动隐式插入，可能过度同步 | 应用显式声明依赖 |
| 错误检查 | 运行时 GL 错误 | 验证层（可选，发布时关闭） |

显式 API 把"驱动猜你想干什么"变成"你告诉驱动要干什么"。代价是代码量与同步正确性责任转移到应用。

---

## 2. 对象模型

```
Instance
 └─ PhysicalDevice（枚举）
     └─ Device（逻辑设备）
         ├─ Queue（图形/计算/传输/呈现）
         ├─ CommandPool → CommandBuffer
         ├─ DescriptorSetLayout → DescriptorPool → DescriptorSet
         ├─ PipelineLayout → Pipeline（PSO）
         ├─ RenderPass / Framebuffer
         ├─ ShaderModule
         └─ Buffer / Image / ImageView / Sampler
Swapchain（与 Surface 关联）
Fence / Semaphore / Event（同步）
```

| 对象 | 作用 | GL 对应 |
|---|---|---|
| CommandBuffer | 录制绘制/拷贝/屏障命令 | 无直接对应（立即模式） |
| Queue | 执行 command buffer | 隐式 |
| PSO | 完整管线状态（shader + 固定功能） | 一组 `glUseProgram` + `gl*` 状态 |
| DescriptorSet | 资源绑定集合 | 纹理/UBO 绑定点 |
| RenderPass | 附件与子 pass 描述 | FBO + 状态 |
| Framebuffer | 具体附件实例 | FBO |
| Fence | CPU 等待 GPU | `glFenceSync` + `glClientWaitSync` |
| Semaphore | 队列/交换链之间同步 | 隐式 |

---

## 3. 命令录制与提交

### 3.1 基本流程

```cpp
vkResetCommandBuffer(cmd, 0);
vkBeginCommandBuffer(cmd, &beginInfo);

vkCmdBeginRenderPass(cmd, &rpBegin, VK_SUBPASS_CONTENTS_INLINE);
vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, pso);
vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, layout, 0, 1, &set, 0, nullptr);
vkCmdBindVertexBuffers(cmd, 0, 1, &vbo, offsets);
vkCmdBindIndexBuffer(cmd, ibo, 0, VK_INDEX_TYPE_UINT32);
vkCmdDrawIndexed(cmd, indexCount, 1, 0, 0, 0);
vkCmdEndRenderPass(cmd);

vkEndCommandBuffer(cmd);
```

提交：

```cpp
VkSubmitInfo submit{};
submit.commandBufferCount = 1;
submit.pCommandBuffers = &cmd;
submit.waitSemaphoreCount = 1;
submit.pWaitSemaphores = &imageAvailable;
submit.pWaitDstStageMask = &waitStage;
submit.signalSemaphoreCount = 1;
submit.pSignalSemaphores = &renderFinished;
vkQueueSubmit(queue, 1, &submit, inFlightFence);
```

### 3.2 多线程录制

- 每个线程一个 `CommandPool`（`VK_COMMAND_POOL_CREATE_TRANSIENT_BIT` 可选）。
- 线程只录制 secondary command buffer 或各自的 primary，最后在主线程统一提交。
- 资源（descriptor set、buffer）在线程间分配时要用锁或每线程池。
- GL 没有等价能力；GLES 的 `glMapBufferRange` 持久映射 + 多线程填充是常见折中。

---

## 4. 同步三件套

### 4.1 Fence：CPU 等 GPU

```cpp
vkWaitForFences(device, 1, &inFlightFence, VK_TRUE, UINT64_MAX);
vkResetFences(device, 1, &inFlightFence);
```

- 每帧一个 in-flight fence，控制 CPU 不超前 GPU 太多帧。
- `vkGetFenceStatus` 可非阻塞查询。
- GL 对应 `glFenceSync` + `glClientWaitSync`。

### 4.2 Semaphore：GPU 队列之间

| 类型 | 用途 |
|---|---|
| Binary semaphore | 交换链 acquire/present、队列间依赖 |
| Timeline semaphore | 带计数值，可跨队列/跨帧，替代多个 binary |

```cpp
// 呈现前等待渲染完成
VkPresentInfoKHR present{};
present.waitSemaphoreCount = 1;
present.pWaitSemaphores = &renderFinished;
```

- 交换链图像获取后，必须等 `imageAvailable` 再写颜色。
- 渲染完成后，必须等 `renderFinished` 再 present。
- **方向不要写反**：等待的是"生产完成"，发出的是"消费可开始"。

### 4.3 Event：GPU 内部细粒度同步

- `vkCmdSetEvent` / `vkCmdWaitEvent`，可在同一队列内做 split barrier。
- 适合"前半段写入、后半段读取"的长流水，避免整条管线停顿。
- GL 对应 `glMemoryBarrier`（更粗粒度）。

### 4.4 三者的选择

| 场景 | 原语 |
|---|---|
| CPU 等一帧渲染完 | Fence |
| 图形队列 → 传输队列 | Semaphore |
| 交换链 acquire/present | Binary semaphore |
| 同一 command buffer 内 pass 依赖 | Pipeline barrier / event |
| 跨帧 GPU 时间线 | Timeline semaphore |

---

## 5. 三类 Barrier

### 5.1 执行依赖

`srcStageMask` → `dstStageMask`：保证源阶段的所有命令在目标阶段开始前完成。

```cpp
VkMemoryBarrier mb{};
mb.sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER;
mb.srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT;
mb.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;

vkCmdPipelineBarrier(
    cmd,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,   // src
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,   // dst
    0, 1, &mb, 0, nullptr, 0, nullptr);
```

### 5.2 内存依赖

`srcAccessMask` / `dstAccessMask` 保证写入对后续读取可见（cache flush/invalidate）。**只写 stage mask 不写 access mask 是最常见的错误**，表现为"偶尔读到旧数据"。

### 5.3 布局转换

图像从 `COLOR_ATTACHMENT_OPTIMAL` 转到 `SHADER_READ_ONLY_OPTIMAL`：

```cpp
VkImageMemoryBarrier ib{};
ib.sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER;
ib.oldLayout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
ib.newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
ib.srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
ib.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
ib.image = image;
ib.subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};

vkCmdPipelineBarrier(
    cmd,
    VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT,
    VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT,
    0, 0, nullptr, 0, nullptr, 1, &ib);
```

| 转换 | 典型场景 |
|---|---|
| `UNDEFINED → COLOR_ATTACHMENT_OPTIMAL` | 新图像首次渲染 |
| `COLOR_ATTACHMENT_OPTIMAL → SHADER_READ_ONLY_OPTIMAL` | 后处理采样 |
| `SHADER_READ_ONLY_OPTIMAL → TRANSFER_DST_OPTIMAL` | 上传/拷贝 |
| `PRESENT_SRC_KHR → COLOR_ATTACHMENT_OPTIMAL` | 下一帧复用交换链图像 |

### 5.4 RenderPass 内的依赖

子 pass 之间用 `VkSubpassDependency` 声明，不要在每个子 pass 手动插 barrier：

```cpp
VkSubpassDependency dep{};
dep.srcSubpass = 0;
dep.dstSubpass = 1;
dep.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
dep.dstStageMask = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
dep.srcAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
dep.dstAccessMask = VK_ACCESS_INPUT_ATTACHMENT_READ_BIT;
```

### 5.5 常见同步错误

| 现象 | 原因 |
|---|---|
| 画面偶尔闪烁/旧帧 | 缺少 access mask 或 barrier 范围不对 |
| 验证层报 layout 错误 | 图像布局与 descriptor 不符 |
| 首帧黑屏 | 未等 `imageAvailable` 就写颜色 |
| 退出时崩溃 | 未等 fence 就销毁资源 |
| 多队列竞争 | binary semaphore 方向错误或复用未重置 |
| 过度同步、GPU 空转 | barrier 粒度过大（整条管线）或每 draw 一个 barrier |

---

## 6. RenderPass / Subpass / Load-Store

### 6.1 附件操作

| 操作 | 含义 | 移动端影响 |
|---|---|---|
| `loadOp = CLEAR` | 开始时清空 | 不读旧内容，省带宽 |
| `loadOp = LOAD` | 保留旧内容 | 读 tile memory/系统内存 |
| `storeOp = STORE` | 结束时写回 | 写系统内存，费带宽 |
| `storeOp = DONT_CARE` | 丢弃 | 省带宽，但内容不可用 |

**TBDR 优化核心**：中间 pass 用 `DONT_CARE`，让 tile 数据留在片上；只有最终输出才 `STORE`。这是移动端后处理链最重要的带宽优化之一 ✅。

### 6.2 Subpass 与 Input Attachment

同一 RenderPass 内，前一个 subpass 的颜色附件可作为后一个 subpass 的 input attachment，**无需离开 tile memory**：

```glsl
layout(input_attachment_index = 0, set = 0, binding = 0) uniform subpassInput u_scene;
vec4 color = subpassLoad(u_scene);
```

- 适合：色调映射、Bloom 合成、AA resolve 等"读上一 pass 结果"的操作。
- 限制：input attachment 的布局/格式必须匹配；不能同时作为 color attachment 写入。
- GLES 对应 `GL_EXT_shader_framebuffer_fetch`（读当前 fragment 的旧值），语义不同但同样省带宽。

### 6.3 与 GL 的 FBO 对比

| 概念 | GL | Vulkan |
|---|---|---|
| 渲染目标 | FBO + attachments | RenderPass + Framebuffer |
| 切换目标 | `glBindFramebuffer` | `vkCmdBeginRenderPass` |
| 读上一 pass | 绑定为纹理 | input attachment |
| 清除 | `glClear` | `loadOp = CLEAR` |
| 丢弃 | `glInvalidateFramebuffer` | `storeOp = DONT_CARE` |

---

## 7. PSO 与描述符

### 7.1 PSO 包含什么

- 顶点输入布局
- 图元装配（拓扑、剔除、绕序）
- 光栅化（视口、深度偏移、线宽）
- 多重采样
- 深度/模板测试
- 颜色混合
- 着色器阶段与 specialization constants
- RenderPass 兼容性

**任何一项不同都是一个新 PSO**。因此 PSO 数量容易爆炸，需要缓存与预热。

### 7.2 创建成本与缓存

```cpp
VkPipelineCacheCreateInfo ci{};
ci.initialDataSize = cacheSize;
ci.pInitialData = cacheData;
vkCreatePipelineCache(device, &ci, nullptr, &cache);
```

- 首次创建可能几十到几百毫秒；缓存后可降到毫秒级。
- 缓存数据与驱动/GPU 型号绑定，不能跨设备复用。
- GL 用 `glGetProgramBinary` / `glProgramBinary`，同样与驱动绑定。

### 7.3 Descriptor Set

- `VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER`、`UNIFORM_BUFFER`、`STORAGE_BUFFER` 等。
- 布局在 pipeline layout 中声明；set 可复用。
- 频繁更新的小数据用 push descriptor（`VK_KHR_push_descriptor`）或 dynamic offset。
- 描述符池按帧/线程分配，避免运行时分配。

---

## 8. 显存与资源

### 8.1 内存类型

| 类型 | 属性 | 用途 |
|---|---|---|
| Device Local | GPU 访问最快，CPU 不可见 | 纹理、渲染目标、静态顶点 |
| Host Visible + Coherent | CPU 可写，GPU 可读 | 动态 UBO、暂存 |
| Host Visible + Cached | CPU 读快 | 回读 |
| Lazily Allocated | 延迟提交 | 大缓冲 |

### 8.2 上传路径

```
CPU → staging buffer (host visible) → vkCmdCopyBufferToImage → device local image
```

- 小资源可用 `VK_IMAGE_TILING_LINEAR` 直接映射，但采样性能差。
- 大纹理必须 `OPTIMAL` tiling，经 staging 拷贝。
- 移动端可结合 `AHardwareBuffer`/dmabuf 实现零拷贝导入。

### 8.3 Tiling

| 布局 | 用途 |
|---|---|
| `VK_IMAGE_TILING_LINEAR` | CPU 直接读写、 staging |
| `VK_IMAGE_TILING_OPTIMAL` | GPU 采样/渲染，驱动决定 swizzle |

Tiling 是**创建时属性**，不能通过 barrier 改变。需要从 LINEAR 转 OPTIMAL 时，必须新建一张 OPTIMAL 图像，用 `vkCmdCopyBufferToImage` / `vkCmdBlitImage` 搬运，而不是插一个 barrier。

### 8.4 内存别名（Aliasing）

同一块内存可绑定多个资源，只要生命周期不重叠：

```
帧 N：RT_A 使用 [0, 4MB)
帧 N+1：RT_B 使用 [0, 4MB)  // RT_A 已不再使用
```

- 用于 transient attachment，降低峰值显存。
- 需要正确的 barrier 与生命周期跟踪，否则读到脏数据。
- RenderGraph 的核心优化之一就是自动做 aliasing。

### 8.5 分配策略

- 不要每个资源一次 `vkAllocateMemory`（驱动有分配上限，且慢）。
- 用 suballocator（VMA 或自研）：大块分配 + 子分配。
- 按用途分池：静态几何、动态缓冲、纹理、transient。
- 移动端受限于统一内存，显存预算要与系统内存一起算。

---

## 9. Metal 对照

| Vulkan | Metal |
|---|---|
| Instance / Device | `MTLDevice` |
| Queue | `MTLCommandQueue` |
| CommandBuffer | `MTLCommandBuffer` |
| RenderPass | `MTLRenderCommandEncoder` |
| Compute pass | `MTLComputeCommandEncoder` |
| Copy/barrier | `MTLBlitCommandEncoder` |
| PSO | `MTLRenderPipelineState` / `MTLComputePipelineState` |
| DescriptorSet | Argument Buffer |
| Fence（同队列） | `MTLFence` |
| Event（跨队列/GPU） | `MTLEvent` / `MTLSharedEvent` |
| Memory heap | `MTLHeap` |
| 资源存储模式 | `MTLStorageModeShared/Private/Managed` |

Metal 的 encoder 更接近"立即录制"，但依然是显式资源与 PSO。`MTLSharedEvent` 可用于 CPU-GPU 时间线同步。

---

## 10. 与 OpenGL 的映射与迁移陷阱

| GL 习惯 | 显式 API 要求 |
|---|---|
| `glBindTexture` 后直接画 | 先更新 descriptor set，再绑定 |
| 驱动自动同步 | 自己插 barrier |
| `glTexImage2D` 随时重建 | 预分配 + 布局转换 |
| 全局状态 | PSO 固化 |
| 单线程上下文 | command buffer 多线程录制 |
| `glFinish` 等 GPU | fence/semaphore，避免全设备停顿 |

**迁移顺序建议**：

1. 先把渲染抽象成"资源 + pass + 状态"三层，不直接调 GL。
2. 用 RenderGraph 描述依赖，自动插 barrier。
3. 再替换后端为 Vulkan/Metal，验证层全开跑通。
4. 最后做 PSO 缓存、内存池、多线程录制等性能优化。

---

## 11. 自测问答

**Q1：fence 和 semaphore 的区别？**
fence 是 CPU 等 GPU（`vkWaitForFences`）；semaphore 是 GPU 队列之间/与交换链的依赖。fence 有"已信号"状态可查询，binary semaphore 没有。

**Q2：三类 barrier 分别是什么？**
执行依赖（stage mask）、内存依赖（access mask）、图像布局转换（old/new layout）。三者常在同一次 `vkCmdPipelineBarrier` 中完成。

**Q3：只写 stage mask 不写 access mask 会怎样？**
GPU 阶段顺序对了，但缓存未刷新/失效，后续读取可能拿到旧数据，表现为间歇性闪烁或错误。

**Q4：RenderPass 的 `loadOp=LOAD` 为什么在移动端贵？**
需要把 tile 的旧内容从系统内存读回片上；如果不需要旧内容，用 `CLEAR` 或 `DONT_CARE` 可省大量带宽。

**Q5：input attachment 解决了什么？**
同一 RenderPass 内读取前一 subpass 的结果，数据留在 tile memory，不经过系统内存，适合 TBDR 的后处理链。

**Q6：PSO 为什么会导致卡顿？**
首次创建包含 shader 编译与状态验证，耗时不可预测；解决是预热 + pipeline cache + 变体裁剪。

**Q7：Vulkan 的 Y 方向和 GL 不同，怎么处理？**
投影矩阵改用 `[0,1]` 深度，并用负视口高度或翻转 UV 对齐 Y；不要同时在 shader 里再翻一次。

**Q8：内存别名安全的前提？**
资源的生命周期不重叠，且有正确的 barrier/布局转换；否则会读到前一个资源的残留数据。

**Q9：为什么不能每个资源单独分配显存？**
驱动有 `maxMemoryAllocationCount` 限制，且每次分配有开销、易碎片化；应使用 suballocator 分池。

**Q10：从 GL 迁到 Vulkan，最先该改什么？**
先把渲染抽象成资源/pass/状态三层并引入 RenderGraph，再换后端；否则会把 GL 的全局状态习惯带进显式 API，得到"能跑但很慢"的实现。

---

> **一句话总结**：显式 API 的核心不是"更多代码"，而是把同步、内存、状态三件事从驱动猜测变成应用声明；barrier 写错不会立刻崩，只会偶发花屏——这才是它最难的地方。
