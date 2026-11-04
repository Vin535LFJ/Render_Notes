# OpenGL 渲染管线 · FBO 与离屏渲染

> **面试主线文档**。车载渲染引擎岗的笔试/面试里，OpenGL 管线、帧缓存、离屏渲染是出现频率最高的三连问，本文按「先给结构、再给细节、最后给追问」的方式组织。
>
> 标注口径沿用全库规范：
> - ✅已验证：规范、官方文档或业界共识可核
> - ⚠️有条件成立：依赖平台/驱动/版本，不可绝对化
> - ❗待验证：需查规范原文或实测确认
> - `[经验值]`：来自工程实践的量级参考，不绑定具体数值结论
>
> 相关文档：[图形与GPU工程](../../03-图形与GPU工程/图形与GPU工程.md)（视频渲染视角）、[Vulkan 与显式 API 对照](./02-Vulkan与显式API对照.md)、[DrawCall 优化与管线定制](./07-DrawCall优化与渲染管线定制.md)

---

## 0. 开场答题骨架（先说结构，再展开）

被问"讲一下 OpenGL 渲染管线"时，**不要一上来背 7 个阶段**。分层作答更像高级工程师：

```
第 1 层（数据流）  硬盘/内存 ──上传──▶ 显存(VBO/纹理) ──管线──▶ 帧缓冲 ──swap──▶ 屏幕
第 2 层（职责）    CPU 决定"画什么、怎么画" ；GPU 决定"每个像素是什么颜色"
第 3 层（阶段）    顶点输入 → 顶点着色 → [图元装配] → 裁剪 → 投影/透视除法 → 视口变换
                   → 光栅化 → 片元着色 → 逐片元测试与混合 → 写入帧缓冲
第 4 层（瓶颈映射） 每阶段对应一类优化：CPU提交 / 顶点量 / 填充率 / 带宽 / 显存容量
```

一句收束（面试官在等的就是这句）：

> "管线的可编程只有顶点和片元两个入口，其余是固定功能；所以工程上能做的只有三件事——**少提交、少算、少搬**。所有优化手段最终都能归到这三类。"

---

## 1. 状态机模型：OpenGL 的成本来源

| 维度 | 说明 |
|---|---|
| 本质 | 一个**全局可变状态** + 一条**命令流**。`glUseProgram`/`glBindTexture`/`glEnable` 改的是上下文全局变量，后续 draw 隐式读取它们 ✅ |
| 驱动侧代价 | 每次 draw 需要校验当前状态组合是否合法、资源是否就绪、是否与 shader 声明匹配（uniform 是否绑定、attribute 是否启用）→ 这是 CPU 侧的固定开销 ⚠️ |
| 延迟绑定 | 顶点属性 location 可以在 draw 时才解析（`glVertexAttribPointer` 只记录指针信息，不校验），VBO 内容在 draw 时才真正被消费 ✅ |
| 异步性 | GL 命令是**异步提交**的：`glDrawArrays` 返回不代表执行完成。只有少数调用会隐式同步 ⚠️ |

### 1.1 高频追问：哪些调用会把管线变成同步点

这条答对了，说明你真做过性能优化：

| 会引入同步/停顿的调用 | 原因 | 替代方案 |
|---|---|---|
| `glReadPixels` | 必须等 GPU 把该区域画完 | PBO 异步回读 + `glFenceSync`（见 §6.4） |
| `glGetError` | 需要驱动返回状态；调试期开销大 | Release 关掉，改用 `GL_KHR_debug` 回调 |
| `glGet*`（查询参数/`glGetProgramiv` 编译结果） | 读驱动内部状态 | 初始化阶段一次性查完并缓存 |
| `glMapBuffer`（全量映射） | 驱动必须等前面用到该 buffer 的命令完成 | `glMapBufferRange` + `GL_MAP_UNSYNCHRONIZED_BIT`，或 buffer orphaning |
| `glBufferData` 覆写正在被使用的 VBO | 驱动隐式等待/或整块重建 | orphaning（先传 `NULL` 再传数据）或环形 buffer + `bufferSubData` 偏移 |
| `glFinish` | 显式全同步 | 只在该真正需要结果时用；一般用 fence |
| 纹理在渲染中被 `glTexImage2D` 重分配 | 驱动需重算驻留与寻址 | 预分配 + `glTexSubImage2D` 覆写 ✅ |

> **加分说法**："移动端我会先怀疑同步点，而不是先怀疑 DrawCall 数量。一个 `glReadPixels` 带来的气泡往往顶得上几百次 draw。"

### 1.2 上下文（Context）相关的必考点

- Context 是**状态与资源的容器**，不跨线程共享；一个 context 同一时刻只能在一个线程 current（`eglMakeCurrent`）✅
- 资源（纹理/VBO/程序）**属于创建它的 context**；多 context 共享（`eglCreateContext` 传 `share_context`）可共享纹理/buffer，但**不共享 VAO/FBO 绑定状态**（VAO、FBO 对象本身可共享，绑定的当前状态是每上下文独立的）⚠️
  - ❗具体到"哪些对象名可共享、哪些是每上下文私有"，请以 OpenGL ES 3.x 规范 §"Share States" 与 EGL 规范为准再答；业界通识：纹理/Buffer/Program 可共享，`glBind*` 的当前绑定值、gl 错误状态、客户端能力状态为私有。
- 视频/相机线程与渲染线程交接时，**纹理在 A 线程创建、B 线程采样**是车机与短视频里最常见的黑屏/花屏来源之一 ⚠️
- 丢失上下文（GPU 复位/驱动挂掉）：桌面有 `GL_ARB_robustness`/`OES_robustness`（ES 有 `GL_OES_robustness`），必须做资源重建路径 ⚠️ 车机长时间运行必备

---

## 2. 顶点数据路径（上传与组织）

### 2.1 对象模型

| 对象 | 作用 | 关键调用 | 常见坑 |
|---|---|---|---|
| VBO (`GL_ARRAY_BUFFER`) | 存顶点属性数据 | `glBufferData` / `glBufferSubData` | 每帧 `glBufferData` 重分配 → 显存碎片与停顿 |
| EBO/IBO (`GL_ELEMENT_ARRAY_BUFFER`) | 存索引，实现共享顶点 | `glDrawElements` | 索引类型默认 `GL_UNSIGNED_SHORT`(65535 顶点上限)；ES3 可用 `GL_UNSIGNED_INT` ✅ |
| VAO (`GL_VERTEX_ARRAY`) | 记录"属性指针 + 绑定的 EBO + 启用状态" | `glBindVertexArray` | ES2 需 `GL_OES_vertex_array_object`，ES3 起核心支持 ✅；切换网格只切 VAO，是最便宜的状态切换之一 |
| UBO (`GL_UNIFORM_BUFFER`) | 按块更新 uniform，多 shader 共享 | `glBindBufferRange` | 需处理 `std140` 对齐与 `GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT` ✅ |
| SSBO (`GL_SHADER_STORAGE_BUFFER`) | 读写双向、compute 友好 | ES 3.1+ 核心 | ES3.0 设备不可用 ⚠️ |

**数据组织建议**：交错（interleaved）优于分离（separate）——GPU 的顶点抓取按行读，交错布局局部性更好；对齐到 4/16 字节边界 ✅。

### 2.2 精度与顶点属性（移动端最容易翻车的一节）

```c
// 位置用 GL_BYTE/GL_UNSIGNED_BYTE + GL_TRUE(normalized) 压缩
glVertexAttribPointer(0, 3, GL_BYTE, GL_TRUE, sizeof(Vertex), (void*)0);
// 归一化后取值域是 [-1, 1]：需要显式缩放矩阵补偿，否则模型尺寸错
```

- ⚠️ 归一化整型顶点在 GL/ES 语义下，有符号映射到 `[-1,1]`、无符号映射到 `[0,1]`；用它存世界坐标必须自己乘回尺度。
- **GLSL ES 精度陷阱**：顶点着色器里 `mediump`（FP16 等价精度，约 10 bit 有效尾数）用于位置/UV 时，在大场景或高分辨率纹理上会出现"抖动/条带/UV 错位"。规范上 `gl_Position` 是 `highp`，但自定义 varying 需显式声明 ✅。
  - 实战口径：位置/UV/深度相关一律 `highp`；颜色、方向、归一化后的量用 `mediump`。移动端 `lowp` 只在明确支持的硬件上生效 ⚠️。
- 片元精度不够导致**大分辨率 UV 抖动**是车机 1920×720 / 双 3K 屏上会真实出现的 bug（`mediump vec2 uv` 在 2048 宽度图集上精度不足）`[经验值]`。

### 2.3 上传路径全景（从慢到快）

```
glTexImage2D(每帧重建)     ← 最差：重分配 + 格式转换 + 同步风险
glTexSubImage2D/BufferSub  ← 次优：避免重分配，仍是同步 CPU→GPU 传输
PBO (GL_PIXEL_UNPACK_BUFFER + 异步 map) ← 解耦：DMA 与着色并行
Buffer orphaning / 环形缓冲             ← 避免驱动隐式等待
持久映射 (GL_EXT_buffer_storage + GL_MAP_PERSISTENT_BIT) ⚠️需扩展支持
显存到显存：glCopyBufferSubData / FBO blit / 渲染到纹理 ← 永不经 CPU
外部零拷贝：EGLImage / AHardwareBuffer / dmabuf ← 见 [跨平台架构](../../04-跨平台与高性能架构/跨平台与高性能架构.md)
```

> PBO 的价值常被误解：它不是"更快"，而是**把 CPU→GPU 传输从同步的立即拷贝，变成可被驱动异步调度的 DMA**，从而把传输藏到 GPU 还在算的时候 ✅。

---

## 3. GPU 管线阶段与每阶段的调优抓手

| 阶段 | 性质 | 关键细节（面试深挖点） | 调优抓手 |
|---|---|---|---|
| 顶点输入 | 固定 | 由 VAO 描述的 attribute 流；实例化用 `glVertexAttribDivisor`（ES3.0 核心）✅ | 顶点压缩、属性精简、VAO 复用 |
| 顶点着色器 | 可编程 | 每顶点一次；输出 `gl_Position`（裁剪空间，**齐次坐标 w 未除**）| 减少矩阵乘、把逐像素能做的事下移、剔除前置到 CPU/GPU |
| 细分/几何着色器 | GL 专有 | **OpenGL ES 标准管线不含这两级**；ES3.2 时代由 `GL_EXT_tessellation_shader`/`GL_EXT_geometry_shader` 个别提供 ⚠️ | 车机 GLES 目标下应假定为不可用 |
| 图元装配 | 固定 | 组成三角形/线/点；**背面剔除（Cull Face）在此阶段生效**；多边形需 ≥3 非退化顶点 | 顺时针/逆时针约定统一、剔除前置 |
| 逐顶点裁剪 | 固定 | 用 clip 码对 6 个视锥面裁剪；跨近平面的三角形会被切分 → 顶点数放大 | near 平面别太近；避免大量跨越近平面的几何 |
| 透视除法 | 固定 | `(x,y,z)/w → NDC`；GL 的 NDC 是 `[-1,1]³`，Vulkan/WebGPU/Metal 的 z 是 `[0,1]` ✅ | 跨 API 移植必查 Y 翻转与 Z 范围 |
| 视口变换 | 固定 | NDC → 窗口坐标；`glViewport` 决定像素覆盖范围 | FBO 忘设 viewport 只画左下 1/4（经典 bug） |
| 光栅化 | 固定 | 三角形 setup + 扫描转换，产生片元；**覆盖判定用 top-left fill rule 保证相邻三角形不重不漏** ⚠️跨 API 一致性需实测 | 避免极窄/极大三角形；宽<1 像素的三角形效率极差 |
| 插值 | 固定 | 重心坐标插值；**必须做透视校正（1/w 加权）**，否则纹理拉伸/扭曲 ✅ | `flat` 逐面数据、`noperspective` 省成本（ES3 支持插值限定符 ✅）|
| 片元着色器 | 可编程 | **每片元一次**，是性能与功耗主战场；输出 `gl_FragColor`/`out vec4` + `gl_FragDepth`(需 `GL_..._fragment_depth`/ES3 的 `highp float gl_FragDepth`) ✅ | 降分辨率、减少采样与分支、Kernel Fusion |
| 逐片元操作 | 固定+可配 | 顺序：裁剪测试(含 `scissor`) → 多重采样覆盖 → **stencil** → **depth test** → blend → (dither) → 写 ✅ | 见 §5.2 深度与模板 |
| 帧缓冲写入 | 固定 | 写入当前 draw framebuffer（默认帧缓冲 = 窗口 back buffer，或 FBO） | 见 §4 |
| Swap / 合成 | 系统 | `eglSwapBuffers` → 系统合成器（SurfaceFlinger / QNX Screen / DRM-KMS）→ 显示 | 见 §6 |

> **必背的一句话**："管线里只有顶点和片元可编程，其它阶段你能通过**状态**去影响（剔除、深度、混合、scissor），不能通过代码去影响。"

---

## 4. 帧缓存体系与 FBO（核心考区）

### 4.1 先分清三种"可画的目标"

| 目标 | 是什么 | 特点 | 典型用途 |
|---|---|---|---|
| **默认帧缓冲**（Default framebuffer） | 窗口系统提供的 surface，由 `EGLSurface` 关联 | 唯一能直接上屏的目标；只有它受 VSync/swap 控制 | 最终合成输出 |
| **FBO** | 你自己组装的可离屏渲染目标（一组 attachment 的容器） | 不上屏，产物是纹理或 renderbuffer | 后处理、阴影、RTT、多 Pass、编码导出 |
| **Pbuffer** | EGL 的无窗口离屏 surface | 老式 API，ES 上基本被 FBO 取代 ⚠️ | 无上下文的批量渲染（历史包袱） |

### 4.2 FBO 对象模型

```
FBO (GL_FRAMEBUFFER)
 ├── Attachment: COLOR_ATTACHMENT0..n  ← 可绑 Texture（可采样）或 Renderbuffer（不可采样）
 ├── Attachment: DEPTH_ATTACHMENT      ← 同上
 ├── Attachment: STENCIL_ATTACHMENT
 └── Attachment: DEPTH_STENCIL_ATTACHMENT（ES3 起支持组合格式 GL_DEPTH24_STENCIL8 ✅）
```

**两种 attachment 的本质差别**（高频追问）：

| | `glFramebufferTexture2D` | `glFramebufferRenderbuffer` |
|---|---|---|
| 存储 | 纹理对象（有格式、有 filter/wrap、可 mip） | 纯可写像素存储，**不可直接采样** |
| 用途 | 需要"画完再读作纹理"（RTT/后处理） | 深度/模板缓冲、MSAA 目标、临时附件 |
| MSAA | ES 上需扩展 `GL_EXT_multisampled_render_to_texture` ⚠️ | `GL_RENDERBUFFER_SAMPLES` 是标准路径 ✅ |
| 例外 | — | `GL_OES_texture_stencil8`/深度纹理可采样：`GL_DEPTH_COMPONENT`/`GL_DEPTH24_STENCIL8` 作为纹理采样是阴影贴图的基础 ✅ |

绑定与切换：

```c
glGenFramebuffers(1, &fbo);
glBindFramebuffer(GL_FRAMEBUFFER, fbo);            // 同时作为 draw 与 read 目标
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, tex, 0);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, rb);
if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) { /* 失败必须走兜底 */ }
// 之后所有 draw 写入 fbo；恢复默认帧缓冲：
glBindFramebuffer(GL_FRAMEBUFFER, 0);              // 0 恒等于默认帧缓冲 ✅
```

### 4.3 帧缓冲完整性（Framebuffer Complete）—— 必背检查表

`glCheckFramebufferStatus` 可能返回值及成因 ✅：

| 返回值 | 成因 | 修法 |
|---|---|---|
| `GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT` | 某附件参数非法（纹理 level 未指定、renderbuffer internalformat 不支持可渲染、宽高为 0） | 先给纹理 `glTexImage2D` 指定 level，再 attach |
| `GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT` | 一个附件都没有 | 至少挂 1 个 color/depth/stencil |
| `GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS` | **各附件宽高不一致**（桌面 GL/部分 ES 驱动强制一致） | 统一分辨率；不同尺寸改用 `glBlitFramebuffer` ⚠️ |
| `GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE` | 附件的 samples 数/纹理层不一致 | MSAA 目标所有附件同一 `GL_SAMPLES` |
| `GL_FRAMEBUFFER_UNSUPPORTED` | 格式组合不被驱动支持（如 `GL_RGB10_A2` + 某深度组合） | 退到安全组合 `RGBA8 + DEPTH_COMPONENT16/DEPTH24_STENCIL8` |
| `GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS`（GL 4.0 路径） | 层目标与非层目标混用 | 统一 layer 化绑定 ⚠️ |

> **面试话术**："我会在每次 FBO 创建/尺寸变更后立刻 `glCheckFramebufferStatus`，并把失败降级到'直出不做特效'，而不是让车机出现黑屏。分辨率切换（比如倒车影像 720p↔1080p）是最容易漏掉这一步的地方。"

### 4.4 读写分离与 `glBlitFramebuffer`

```c
glBindFramebuffer(GL_READ_FRAMEBUFFER, srcFbo);
glBindFramebuffer(GL_DRAW_FRAMEBUFFER, dstFbo);
glBlitFramebuffer(0,0,w,h, 0,0,w,h, GL_COLOR_BUFFER_BIT, GL_NEAREST);
```

要点 ✅：
- 源与目标**不能是同一个帧缓冲**（自 blit 未定义）
- `GL_DEPTH_BUFFER_BIT` / `GL_STENCIL_BUFFER_BIT` 的 blit **不允许缩放，且两侧格式必须相同**
- color blit 在有缩放时 `GL_LINEAR` 只有部分实现支持，多数情况用 `GL_NEAREST` ⚠️
- MSAA resolve 的标准路径就是 blit（samples 不同的一侧需 resolve）✅
- 语义：blit 是**显存内 D2D 操作**，不经过 CPU；但仍消耗外部带宽（见 §5.4）

### 4.5 离屏渲染的读写冲突与 Ping-Pong

- 同一纹理**既作为 draw 的 attachment 又作为采样源**是非法（反馈循环），结果未定义/驱动可能黑屏 ✅ → 必须双 FBO 交替。
- ES3 提供了"合法化"的窄通道：`GL_EXT_shader_framebuffer_fetch` / ARM/Qualcomm 上的 framebuffer fetch，可在 shader 里读当前片元的已有值。**它规避了额外的 load 带宽**，但可移植性差，车机项目需按 SoC 判定 ⚠️❗（需查目标平台扩展列表）。

```
FBO_A(texA) ──shader 读 texA 写 texB──▶ FBO_B(texB) ──读 texB 写 texA──▶ FBO_A ...
```

### 4.6 多 Pass 特效链的成本模型

每个额外 Pass 的真实成本 = **一次 attachment 的 store（写回显存）+ 下一次 load（读回）+ 一次全屏片元着色**。
所以"Pass 数"是移动端的一等成本，不是桌面那样近乎免费。→ 优化优先级：

1. **合并 Pass（Kernel Fusion）**：数学上可结合的滤镜（亮度/对比度/饱和度/LUT）合进 1 个 shader ✅
2. **降分辨率**：模糊/Bloom 用 1/2、1/4 面积 FBO，视觉上更平滑且带宽四次方级收益（写一次、读一次都变小）✅
3. **省掉不需要的附件**：不需要深度的 Pass 挂 `NULL` 深度或 `glInvalidateFramebuffer`
4. **避免中间格式转换**：RGBA8 与 RGB565 之间反复转换有转换成本 ⚠️

### 4.7 MSAA 与 resolve

| 项 | 说明 |
|---|---|
| 原理 | 每个像素多个**覆盖采样点**，片元着色**只跑一次**（这是它比 SSAA 便宜的根本原因）✅ |
| 创建 | renderbuffer 用 `glRenderbufferStorageMultisample(GL_RENDERBUFFER, samples, fmt, w, h)`；查询上限 `GL_MAX_SAMPLES` ✅ |
| 采样限制 | **不能直接对 MSAA 纹理做普通采样**，需 resolve 到单采样纹理（blit 或 shader 内 `texture2DMultisampleEXT`）⚠️ |
| 边缘之外无效 | MSAA 只解决**几何边缘锯齿**，对 shader 内部产生的高频（贴图细节、高光闪烁）无效 → 需 FXAA/TAA/SSAA 补充 ✅ |
| alpha-to-coverage | `GL_SAMPLE_ALPHA_TO_COVERAGE` + blend，可用于粒子/铁丝网/树叶边缘过渡 ✅ |
| 移动端 | 在 TBDR 架构上 MSAA 的额外成本主要在最终 resolve/store，tile 内相对便宜 ⚠️（详见 [04-3D 图形学与几何原理](./04-3D图形学与几何原理.md) 的移动 GPU 章节）|

---

## 5. 逐片元操作：测试、混合、深度与模板

### 5.1 混合（Blend）

$$C_{final} = C_{src}\cdot S + C_{dst}\cdot (1-S)$$

| 需求 | 因子组合 | 说明 |
|---|---|---|
| 标准（非预乘 alpha） | `GL_SRC_ALPHA`, `GL_ONE_MINUS_SRC_ALPHA` | 语义直观，但对多次叠加顺序敏感 |
| **预乘 alpha** | `GL_ONE`, `GL_ONE_MINUS_SRC_ALPHA` | 与多数系统合成器/图集排版一致，可正确与背景混排；插值过滤后不易出现暗边 ✅（见 [图形与GPU工程 §2.3](../../03-图形与GPU工程/图形与GPU工程.md)） |
| 加色发光 | `GL_ONE`, `GL_ONE` | 粒子/火焰，不读 dst |
| 分离 alpha | `glBlendFuncSeparate` / `glBlendFuncSeparatei` | 让 A 通道用另一套因子，否则 UI 叠加会把 dst alpha 混合错 ✅ |

- **每个像素一次混合 = 一次读-改-写（RMW）**，是带宽大户 → overdraw 优化的物理依据 ✅
- 混合顺序决定结果（不可交换），故半透明必须**从后往前**排序；前向渲染里这是 CPU 侧排序成本的主要来源 ✅
- ⚠️ 在 gamma/sRGB 空间做混合会得到偏暗的半透明边缘——严格做法是转线性空间混合再编码回去（详见 [04-3D 图形学与几何原理](./04-3D图形学与几何原理.md) 色彩管理节）

### 5.2 深度测试与 Early-Z

- `glDepthFunc`/`glDepthMask`：默认 `GL_LESS`；写入由 mask 控制，纯遮挡查询可关写。
- **深度值是非线性分布**：`z_ndc` 经透视除法后精度集中在 near 附近 → far 越远、near 越大越准；`near=0.1, far=1000` 这类配置在车机 3D 场景里极易出现 z-fighting ✅
  - 解法：拉大 near（如 0.3~0.5）、分级场景（车模层/道路层/天空层用不同 near/far）、`glPolygonOffset`、32 位浮点深度 `GL_DEPTH_COMPONENT32F`（ES3 ✅）、或 reverse-Z ⚠️（ES 上 reverse-Z 收益依赖实现）
- **Early-Z**：GPU 在片元着色前就按深度丢弃被遮挡片元。以下情况会**退化为 Late-Z**（着色成本全额支付）✅
  - 片元着色器写了 `gl_FragDepth`
  - 使用了 `discard`（部分硬件会关闭提前深度剔除；见主库中关于 discard 的讨论）⚠️
  - 开启了混合且需先算颜色（实现相关）⚠️
  - 结论：不透明几何先画、按**从前到后**排序，让深度剔除尽可能早生效 ✅
- `scissor` 是**固定功能级别的免费裁剪**，比在 shader 里判丢弃便宜得多；UI 局部刷新、多屏分割绘制首选 ✅

### 5.3 模板（Stencil）

典型用途 ✅：UI 圆角/异形镂空、遮罩内绘制、`GL_REPLACE` 写标记再按需二次绘制、水/镜面反射区域限定。
- ES 中模板位宽常见 8 bit（`DEPTH24_STENCIL8`），**超过 255 层计数需换策略**
- 追问点："模板 vs alpha 混合实现遮罩的差别" → 模板是**测试即丢弃，不产生 blend 的 RMW**，带宽更省 ✅

### 5.4 一帧的带宽账（用来支撑"为什么要少 Pass"）

```
外部显存带宽 ≈ Σ(每个 Pass 的 load 像素字节 + store 像素字节) + 纹理采样读 + 顶点读 + MSAA resolve
```
- 1920×720 RGBA8 一次 store ≈ 5.5 MB；一帧 5 个全屏 Pass（含 load+store）→ 数十 MB 级别/帧 `[经验值]`
- 60 FPS 下即 GB/s 量级 → 车机共享 DDR 带宽时，**带宽是比算力更早触顶的资源** ⚠️
- 由此推出的手段优先级：降 Pass > 降分辨率 > 换格式(RGB565/压缩纹理) > 换滤波 > 加算力

---

## 6. 帧尾、交换与系统合成

### 6.1 与显示相关的 EGL 调用

| 调用 | 语义 | 车机关注点 |
|---|---|---|
| `eglSwapBuffers` | 提交 back buffer，等待/触发 vsync 节奏 | 阻塞行为取决于 swap interval 与队列深度 |
| `eglSwapInterval(dpy, n)` | 设置交换间隔（0=不等 vsync，可撕裂但高吞吐） | 仪表一般锁 1 帧；诊断模式会设 0 测 GPU 上限 ✅ |
| `EGL_BUFFER_PRESERVED` / `EGL_BUFFER_DESTROYED` | swap 后 back buffer 内容是否保留（`eglQuerySurface(EGL_SWAP_BEHAVIOR)`）| **默认 DESTROYED**：假设可保留会导致残影/花屏；保留会额外一次 copy，移动端功耗代价大 ✅ |
| `eglSwapBuffersWithDamageKHR` | 只提交脏矩形 | 静态 HMI/低速仪表常亮场景下能显著降带宽 `[经验值]`；扩展可用性需查目标平台 ⚠️ |
| `EGL_ANDROID_presentation_time` / `eglGetPresentTimeAndroid` | 取真实上屏时间 | 做延迟与丢帧统计的正确口径，比应用层时间戳准 ✅ |
| `EGL_KHR_fence_sync` + `eglCreateSyncKHR` | 跨上下文/跨 API 的显存栅栏 | 视频解码纹理→渲染共享的正确做法 ✅ |

### 6.2 双缓冲 / 三缓冲

| 模型 | 表现 | 取舍 |
|---|---|---|
| 单缓冲 | 无撕裂保护 | 现代平台基本不用 |
| 双缓冲 + vsync | 延迟最低；CPU 与 GPU 任一超时立即掉帧（2 帧节奏） | 仪表这类低延迟诉求 |
| 三缓冲 | 允许 GPU/CPU 继续产帧，节奏更稳，但引入 1 帧排队延迟与额外显存 | 3D 场景/HMI 动画更稳 `[经验值]` |

> 面试加分：说明"掉帧的两种形态"——**长帧（jank）** 与 **帧节奏抖动（pacing）** 是不同问题；三缓冲治后者，不解决前者。

### 6.3 上屏路径的两种合成（车载必问）

```
路径 A：App GL 合成   App 把视频/UI 画进自己的 surface → 提交 → 系统合成器再叠加
路径 B：硬件 Overlay  视频层交给 DPU/HWC/显示子系统直接叠加，GPU 不参与像素混合
```
- B 的能效比明显高，但**可编辑性差**（不能任意变换/半透明特效）；A 反之 ✅
- 车机现实：仪表/中控/HUD 常要求同一帧里"3D 场景 + 视频流 + 系统 UI + 告警层"共存 → **谁来合成、合成几次**是架构题，也是功耗题。详见 [06-车载座舱专题](./06-车载座舱专题与项目表达.md)。

### 6.4 回读像素的正确姿势（"把 GPU 像素交给 CPU/编码器"）

```c
// 同步回读（慢）：glReadPixels 会等待该区域完成
glBindFramebuffer(GL_READ_FRAMEBUFFER, fbo);
glReadPixels(0,0,w,h,GL_RGBA,GL_UNSIGNED_BYTE, buf);

// 异步回读（推荐）：PBO + fence
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(0,0,w,h,GL_RGBA,GL_UNSIGNED_BYTE, (void*)0);   // 目标为 buffer 偏移 = 异步
GLsync f = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);
// ... 继续提交其它工作，别在这里 client wait ...
// 后续帧检查：glGetSynciv(f, GL_SYNC_STATUS) == GL_SIGNALED 后
glGetBufferSubData(GL_PIXEL_PACK_BUFFER, 0, bytes, out);     // 或双 PBO 轮转
glDeleteSync(f);
```
- 双/三 PBO 轮转（ping-pong）避免驱动等待上一次拷贝完成 ✅
- **车载/视频里更该反问**：为什么需要回读？多数场景应改用 `AHardwareBuffer`/EGLImage/dmabuf 把显存直接交给下游（编码、AI、显示），把回读当性能 bug 看 ✅

---

## 7. 高频追问链（Q → 3 句答法 → 会被继续追问的点）

**Q1 FBO 和 RenderTexture 什么区别？**
FBO 是 GL 层概念（附件容器）；引擎里的 RenderTexture 是资源封装，内部就是一个 FBO + 纹理/RenderBuffer + 生命周期池。追问：切换成本、分辨率变更、多上下文共享、是否需要显式 `Bind(0)`。

**Q2 离屏渲染为什么会比直接画到屏幕贵？**
①多一次 attachment store/load 的显存带宽；②失去系统合成器的硬件 overlay 路径；③可能引入格式转换。追问：你怎么量化——答"数 Pass、数全屏分辨率、算 load+store 字节/帧"（§5.4 公式）。

**Q3 一帧里能开多少个 FBO？**
技术上取决于显存与 attachment 上限（`GL_MAX_COLOR_ATTACHMENTS`、`GL_MAX_VERTEX_*` 之类）；工程上取决于带宽预算。追问：如何做 Pass 预算——答"帧预算 ms → 带宽字节/帧 → 反推允许的全屏 Pass 数"。

**Q4 `glClear` 在 FBO 上有代价吗？**
有。写全屏等于一次带宽消耗；TBDR 上若附件被声明为"不需要 load"（如 `glInvalidateFramebuffer`、Vulkan/Metal 的 load action=DontCare/Load 语义）可省掉 load。追问：UE/Unity/Cocos 里"每帧 clear 颜色+深度"是不是必要。

**Q5 阴影贴图怎么实现，为什么要 `GL_DEPTH_COMPONENT` 纹理？**
从光源视角渲染深度到 FBO（只挂深度），主 pass 里把片元变换到光空间采样比较。追问：PCF 与 3×3 采样的成本、bias 与 acne/peter-panning 取舍、级联 CSM 的分界策略。

**Q6 `glDrawElements` 和 `glDrawArrays` 差在哪？**
索引带来顶点复用与 PostTransformCache 命中；无索引时顶点数=shader 执行次数。追问：`GL_UNSIGNED_SHORT` 65535 上限怎么破、索引顺序与**顶点缓存命中率**（overdraw 优化网格）。

**Q7 怎么判断瓶颈是 CPU 还是 GPU？**
①降分辨率看帧率是否变化（变→片元/填充/带宽）；②减 DrawCall 看是否变化（变→CPU 提交）；③用 Frame Debugger/RenderDoc/平台 profiler 看时间轴是否有气泡。追问：`eglSwapBuffers` 阻塞算谁的时间——答"那是 vsync 背压，不是 GPU 计算时间"。

**Q8 你的 FBO 在某个设备上黑屏，怎么排障？**
`glCheckFramebufferStatus` → 打印格式与尺寸 → 查该设备 `GL_MAX_*` 与格式支持列表 → 逐步降级（去深度/换 RGBA8/降尺寸）→ 查上下文与线程归属 → 查是否读写同一纹理。追问：如何设计**兜底路径**保证车机不黑屏（答：特性开关 + 渲染回退链 + 上报告警，安全显示优先于画质）。

**Q9 `discard` 用不用？**
透明像素占比高时省，接近全不透明时反而可能变慢（关闭 Early-Z/Hi-Z）。追问：那 UI 图集大量全透明区怎么处理——答"预烘焙 alpha 覆盖 bounds、图集裁空、或用 scissor/顶点剔除让片元根本不生成"。

**Q10 为什么需要 `glFlush`/`glFinish`？车机上怎么用？**
`glFlush` 推命令但不等；`glFinish` 全同步。跨 API 共享要靠 fence/eglSync 而不是 finish。追问：视频帧送显示为什么"看起来必须同步"——答"那是 BufferQueue 的排队语义，不是 GL 同步"。

---

## 8. 最短可照抄模板：一个离屏 Pass（GLES 3.0）

```c
// 1) 纹理
GLuint tex; glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, W, H, 0, GL_RGBA, GL_UNSIGNED_BYTE, NULL);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

// 2) 深度（可选，但 3D 场景必挂）
GLuint rb; glGenRenderbuffers(1, &rb);
glBindRenderbuffer(GL_RENDERBUFFER, rb);
glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, W, H);

// 3) FBO
GLuint fbo; glGenFramebuffers(1, &fbo);
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, tex, 0);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, rb);
GLenum st = glCheckFramebufferStatus(GL_FRAMEBUFFER);   // 必须判
if (st != GL_FRAMEBUFFER_COMPLETE) { /* 降级：不做特效，直接上屏 */ }

// 4) 画
glViewport(0, 0, W, H);                                  // 常被漏！
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
glClearColor(0,0,0,0); glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);
drawScene();

// 5) 用 tex 参与后续合成；不需要深度时释放带宽
glInvalidateFramebuffer(GL_FRAMEBUFFER, 1, (GLenum[]){GL_DEPTH_ATTACHMENT});

// 6) 回默认帧缓冲上屏
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glViewport(0, 0, screenW, screenH);
drawFullscreenQuadWithTexture(tex);
```

**四个最常被面试官抓的疏漏**：① 忘 `glViewport`；② 不做 completeness 检查；③ `W/H` 变更时只重建纹理没重建 renderbuffer；④ 每帧 `glTexImage2D` 重分配而不是预分配 + `glTexSubImage2D`。✅

---

## 9. 与其它文档的关系

| 主题 | 位置 |
|---|---|
| 视频纹理化 / OES / 解码链路 | [02-解码与播放链路](../../02-解码与播放链路/解码与播放链路.md) |
| YUV→RGB、Alpha 视频、压缩纹理 | [03-图形与GPU工程](../../03-图形与GPU工程/图形与GPU工程.md) |
| Vulkan/显式 API 对照、subpass、屏障 | [02-Vulkan与显式API对照](./02-Vulkan与显式API对照.md) |
| 色彩管理、Mipmap、各向异性、光栅化细节 | [04-3D图形学与几何原理](./04-3D图形学与几何原理.md) |
| Shader 语法对照与手写题 | [05-Shader编程与手写题库](./05-Shader编程与手写题库.md) |
| DrawCall 体系、管线定制、引擎改造 | [07-DrawCall优化与渲染管线定制](./07-DrawCall优化与渲染管线定制.md) |
| 座舱系统栈与合成 | [06-车载座舱专题](./06-车载座舱专题与项目表达.md) |
