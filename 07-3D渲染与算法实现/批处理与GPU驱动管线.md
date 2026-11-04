# 批处理与 GPU 驱动管线

> **定位**：DrawCall 优化的完整谱系，从"少切状态"到"让 GPU 自己决定画什么"。前几代解决 CPU 提交瓶颈，后几代解决"CPU 根本不该参与决策"。
>
> **验证状态**：✅已验证（API 语义与机制）/ ⚠️有条件成立（收益依赖场景与驱动）/ ❗待验证（具体设备数值）
>
> **配套**：[图形与GPU工程 §3](../03-图形与GPU工程/图形与GPU工程.md#3-drawcall与状态优化)、[07-DrawCall优化与渲染管线定制](../06-面试知识库/车载渲染引擎/07-DrawCall优化与渲染管线定制.md)、[显式API与同步原语](../04-跨平台与高性能架构/显式API与同步原语.md)

---

## 1. DrawCall 成本到底花在哪

| 阶段 | 内容 | 谁承担 |
|---|---|---|
| 应用层 | 遍历场景、排序、组装参数 | CPU |
| 驱动校验 | 状态合法性、资源绑定、命令编码 | CPU |
| 提交 | 写入 command buffer、内核态提交 | CPU |
| GPU 前端 | 状态切换、常量加载、图元分配 | GPU |
| GPU 执行 | 顶点/片元/带宽 | GPU |

**关键认知**：

- 100 个 DrawCall 和 10000 个 DrawCall 的差别，主要在前三行。
- 单个 DrawCall 的三角形很多时，成本会被 GPU 执行淹没；三角形很少时，CPU 提交占主导。
- 因此"合批"不是目的，**降低每帧的提交次数与状态切换次数**才是。
- 现代桌面驱动有多线程命令录制，CPU 成本被摊薄；移动端 GLES 驱动仍偏单线程，合批收益更明显 ⚠️。

---

## 2. 合批的四代方案

| 代际 | 方案 | 解决的问题 | 局限 |
|---|---|---|---|
| 1 | 静态合批 | 把静态网格合并成一个大 VBO | 显存膨胀、无法单独剔除/动画 |
| 2 | 动态合批 | 每帧把顶点变换到世界空间合并 | 仅适合小网格，CPU 变换成本 |
| 3 | Instancing | 同一网格多次绘制 | 仅同网格同材质 |
| 4 | 间接/GPU 驱动 | 绘制参数由 GPU 生成 | 实现复杂，需显式 API 或扩展 |

### 2.1 静态合批

- 把多个共享材质的静态物体顶点烘焙到同一 buffer，一次 DrawCall。
- 代价：顶点数据复制，显存增加；合并后失去单体剔除；光照贴图 UV 需展开到同一图集。
- 适合：场景装饰、建筑、植被（配合 LOD）。

### 2.2 动态合批

- 每帧在 CPU 把顶点变换到世界空间，写入动态 VBO。
- 适合顶点数少（数十到数百）的小物件，如 UI 元素、粒子、小道具。
- 顶点数超过阈值后 CPU 变换成本超过收益，应改用 Instancing。

### 2.3 GPU Instancing

```cpp
glBindVertexArray(vao);
glVertexAttribDivisor(3, 1);   // 每实例前进一次
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0, instanceCount);
```

实例数据来源：

| 方式 | 说明 | 适用 |
|---|---|---|
| 顶点属性 divisor | 每实例一组矩阵/颜色 | 实例数少、数据固定 |
| UBO 数组 | `mat4 instances[64]` | 中等实例数，注意大小上限 |
| SSBO / storage buffer | 任意数量 | 大量实例，需 GLES 3.1+ |
| 纹理（texel fetch） | 把实例数据当纹理 | 兼容性最好，需自己解码 |

**注意**：

- 实例矩阵占 4 个 vec4，用 4 个 attribute location + divisor=1；`mat4` 在 GLSL 中占 4 个 location。
- 实例数据本身也要考虑缓存局部性：按材质/网格分组，避免随机跳读。
- Instancing 不等于"免费"：顶点着色器仍执行 N 次，只是省了提交。

### 2.4 间接绘制

```cpp
struct DrawElementsIndirectCommand {
    GLuint count;
    GLuint instanceCount;
    GLuint firstIndex;
    GLuint baseVertex;
    GLuint baseInstance;
};
glDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, 0);
```

- 绘制参数放在 buffer 里，CPU 只需上传/更新参数。
- `glMultiDrawElementsIndirect` 一次提交多个 draw，进一步降低 CPU 开销。
- 若参数由 GPU compute 生成（剔除结果），就是 GPU-driven 的入口。

---

## 3. UBO / SSBO / Push Constant

| 特性 | UBO | SSBO | Push Constant（Vulkan） |
|---|---|---|---|
| 最小保证大小 | 16 KB（GLES3） | 实现相关（通常数十 MB 以上） | 128 B（最小保证） |
| 写入频率 | 每帧/每物体 | 动态、可 GPU 写 | 每 draw |
| GPU 可写 | 否 | 是 | 否 |
| 适合 | 相机/光照/材质参数 | 实例数组、粒子、剔除结果 | 小常量、每 draw 参数 |
| 对齐 | `std140` | `std430` | 紧凑 |

### 3.1 std140 对齐陷阱

`std140` 下 `vec3` 按 16 字节对齐，但自身只占 12 字节；真正的坑在**数组**：`vec3 arr[4]` 的步长是 16 字节而不是 12。

```glsl
layout(std140) uniform Camera {
    mat4 viewProj;     // offset 0,  64 B
    vec3 cameraPos;    // offset 64, 12 B
    float exposure;    // offset 76, 正好填满 16 B 槽
    vec4 params[4];    // offset 80, 每元素 16 B
};
```

C++ 侧对应结构体必须用 `alignas(16)` 或 `vec4` 存放数组元素。**数组步长错一个 float，整个 UBO 全错**，表现为相机抖动/颜色乱掉。

### 3.2 动态偏移

把同一 UBO 的不同槽位按 `glBindBufferRange` 的 offset 绑定，可避免每个物体重新上传：

```cpp
glBindBufferRange(GL_UNIFORM_BUFFER, 0, ubo, offset, size);
```

Vulkan 对应 `vkCmdBindDescriptorSets` 的 `dynamicOffset`。前提是 UBO 大小按 `minUniformBufferOffsetAlignment` 对齐（常见 64/256 B）。

---

## 4. Bindless 与描述符

### 4.1 传统绑定

每个纹理/缓冲区都要 bind 到固定槽位，槽位数量有限，切换需要驱动校验。

### 4.2 Bindless

| API | 机制 |
|---|---|
| GL | `GL_ARB_bindless_texture`，把纹理句柄当 `uint64` 传入 shader |
| Vulkan | `VK_EXT_descriptor_indexing`，描述符数组 + 非均匀索引 |
| D3D12 | descriptor heap + `ResourceDescriptorHeap[]` |
| Metal | argument buffers |

shader 里：

```glsl
layout(binding = 0) uniform sampler2D textures[];
vec4 c = texture(textures[nonuniformEXT(index)], uv);
```

优点：一次绑定整张纹理表，绘制时只传索引；适合材质多样的大场景。

风险：

- 需要扩展/硬件支持，移动端覆盖不完整 ❗。
- 失去驱动的资源追踪，资源生命周期要自己保证（不能提前销毁）。
- 非均匀索引对缓存不友好，索引随机化会降低纹理缓存命中。
- 验证层/工具支持较弱，调试更难。

---

## 5. Mesh Shader 与 Meshlet

### 5.1 管线变化

传统：`顶点 → 细分/几何 → 光栅化`。
Mesh shader：`Task/Mesh shader → 光栅化`，由 shader 直接输出小网格（meshlet）的顶点与图元。

| 阶段 | 作用 |
|---|---|
| Task/Amplification | 按 cluster 做剔除/LOD 选择，决定启动多少 mesh shader |
| Mesh | 输出顶点与索引，替代固定输入装配 |

### 5.2 Meshlet 的意义

- 把大网格切成 ~64–128 顶点的 cluster，便于 GPU 并行剔除。
- 每个 meshlet 有包围球/锥，可在 GPU 上做视锥/背面/遮挡剔除。
- 配合虚拟几何（Nanite 类）可实现"像素级 LOD"。

### 5.3 现实约束

- 桌面独显支持较好（Vulkan `VK_EXT_mesh_shader`、D3D12、Metal）。
- 移动端主流 GPU 尚未普遍支持，GLES 没有对应机制 ❗。
- 需要重新组织资产（meshlet 烘焙、cluster 层级），工程成本高。
- 对车载/移动项目，短期更现实的是 Instancing + 间接绘制 + HZB 剔除。

---

## 6. GPU 驱动管线

### 6.1 一帧的决策流

```
1. GPU: 视锥剔除 + HZB 遮挡剔除 + LOD 选择
2. GPU: 压缩可见实例列表（append buffer）
3. GPU: 生成 indirect draw 参数
4. CPU: 只提交 1 次 multi-draw-indirect
5. GPU: 执行绘制
```

### 6.2 关键组件

| 组件 | 作用 |
|---|---|
| HZB（层级 Z） | 用上一帧深度构建 mip 金字塔，做快速遮挡查询 |
| Append/Consume buffer | GPU 原子追加可见实例，避免 CPU 回读 |
| Indirect draw | 绘制参数由 GPU 写 |
| 双缓冲/多帧延迟 | 避免 GPU 等待 CPU，允许 1–2 帧延迟 |
| 回读（可选） | 统计可见数、调试，但会打断并行 |

### 6.3 代价与陷阱

- **延迟**：剔除结果基于上一帧深度，快速移动的相机会出现"刚出现的物体晚一帧"。可用保守扩张/预测缓解。
- **GPU 原子竞争**：大量实例追加同一计数器会成为瓶颈，需按 warp/块做局部规约。
- **调试困难**：绘制参数在 GPU 上生成，传统抓帧工具可能看不到 CPU 侧调用。
- **小场景不划算**：实例数少时，GPU 剔除的固定开销大于收益 ⚠️。

---

## 7. 遮挡剔除

| 方法 | 原理 | 适用 |
|---|---|---|
| 视锥剔除 | 包围体 vs 视锥平面 | 所有场景，必做 |
| 软件遮挡（Software Occlusion） | CPU 用低模深度缓冲测试 | 大场景、CPU 有余量 |
| HZB | GPU 深度金字塔，保守测试包围盒 | 现代 GPU |
| 硬件遮挡查询 | `GL_ANY_SAMPLES_PASSED` | 延迟 1–2 帧，需条件渲染 |
| Portal/房间 | 预计算可见性 | 室内场景 |

### 7.1 HZB 的保守性

HZB 的 mip 存的是**最大深度**（最远），测试包围盒时取覆盖区域的最大深度，只有在"包围盒最近深度 > 该区域最大深度"时才判定完全遮挡。保守估计避免误剔除，但会漏掉一些可剔除物体。

### 7.2 条件渲染

```cpp
glBeginConditionalRender(queryId, GL_QUERY_WAIT);
glDrawElements(...);
glEndConditionalRender();
```

GPU 根据查询结果决定是否执行，避免 CPU 回读。但查询结果是上一帧的，且 `GL_QUERY_WAIT` 可能造成停顿。

---

## 8. LOD

| 类型 | 说明 | 切换问题 |
|---|---|---|
| 离散 LOD | 预生成 3–5 级网格 | 切换时跳变（popping） |
| 淡入淡出 | 两级同时渲染并按距离混合 | 双倍绘制成本 |
| 抖动过渡 | 用 dither 逐渐丢弃高模像素 | 需 TAA/后处理配合 |
| HLOD | 把远处多个物体合并成代理网格 | 烘焙复杂 |
| 虚拟几何 | cluster 级流式加载与 LOD | 需要新管线与资产格式 |

**LOD 选择依据**：屏幕空间误差（投影后的几何误差）比单纯距离更准确，能适配 FOV/分辨率变化。

---

## 9. PSO 预热与变体治理

### 9.1 为什么 PSO 会卡

Vulkan/Metal/D3D12 的 PSO 包含着色器编译 + 管线状态验证，首次创建可能耗时数十到数百毫秒。若在游戏过程中按需创建，会出现明显卡顿。

### 9.2 治理手段

| 手段 | 说明 |
|---|---|
| 预热 | 加载/过场时创建常用 PSO，避免首帧卡顿 |
| 管线缓存 | Vulkan `VkPipelineCache`、D3D12 pipeline cache、GL program binary |
| 变体裁剪 | 构建期只保留实际用到的关键字组合 |
| Uber shader | 减少变体数量，用分支/动态参数替代编译期开关 |
| 异步编译 | 后台线程编译，配合占位 shader |
| 按档位分包 | 低/中/高画质各自预编译 |

### 9.3 变体爆炸的量化

若有 `n` 个独立布尔关键字，理论变体数为 `2^n`。实际要乘上：

- 平台/图形 API（GL/Vulkan/Metal）
- 画质档位
- 骨骼/蒙皮/实例化等顶点布局
- 阴影/光照/后处理开关

一个中等项目很容易达到数千个变体。**治理的核心不是"全部编译"，而是"知道哪些组合真的会出现"** ✅。

### 9.4 移动端 GLES 的特殊性

- 没有 PSO 概念，但 `glLinkProgram` 同样昂贵；应在加载时链接，避免首帧。
- 支持 `GL_OES_get_program_binary` 缓存二进制，但不同驱动/GPU 不通用。
- 驱动可能在首次 draw 时才真正编译，预热需要"假 draw"或 `glFinish` 触发。

---

## 10. 移动端约束速查

| 能力 | GLES 3.0 | GLES 3.1 | GLES 3.2 | Vulkan |
|---|---|---|---|---|
| Instancing | ✅ | ✅ | ✅ | ✅ |
| UBO | ✅ | ✅ | ✅ | ✅ |
| SSBO | ❌ | ✅ | ✅ | ✅ |
| Compute shader | ❌ | ✅ | ✅ | ✅ |
| Indirect draw | ❌ | ✅ | ✅ | ✅ |
| Multi-draw indirect | 扩展 | 扩展 | 扩展 | ✅（indirect count 扩展） |
| Bindless | 扩展 | 扩展 | 扩展 | 扩展/1.2+ |
| Mesh shader | ❌ | ❌ | ❌ | 扩展，移动端少 |
| Geometry shader | ❌ | ❌ | ✅（可选） | ✅ |

> 表为 API 能力，**不代表设备一定支持**；上线前必须查 `GL_MAX_*` / `VkPhysicalDeviceFeatures` ❗。

---

## 11. 优化决策树

```
DrawCall 多，CPU 主线程高？
├─ 是 → 先查状态切换/材质排序
│        ├─ 同网格多实例 → Instancing
│        ├─ 同材质不同网格 → 静态合批/图集
│        └─ 小物件多 → 动态合批或合并网格
└─ 否 → GPU 高？
         ├─ 顶点多 → LOD/剔除
         ├─ 片元多 → Overdraw/分辨率/着色复杂度
         └─ 带宽高 → 降 pass、降格式、TBDR load/store 优化
```

**先测量再优化**：用 RenderDoc/AGI 看 CPU 提交时间与 GPU 阶段耗时，不要凭"DrawCall 数量"直接下结论。

---

## 12. 自测问答

**Q1：静态合批和 Instancing 的本质区别？**
静态合批把多个网格烘焙成一个 buffer，只画一次；Instancing 保留单网格，用实例数据驱动多次绘制。前者省提交但显存膨胀、失去单体剔除；后者灵活但仍有 N 次顶点执行。

**Q2：为什么 Instancing 不一定比合批快？**
实例数很少时，实例化的固定开销（属性 divisor、每实例数据读取）可能大于收益；且顶点着色器仍执行 N 次。要按实例数与网格复杂度权衡。

**Q3：UBO 和 SSBO 怎么选？**
小、频繁、只读的相机/光照参数用 UBO；大数组、GPU 需要写、或需要任意索引用 SSBO。Push constant 适合每 draw 的小常量。

**Q4：std140 最容易踩的坑？**
`vec3` 按 16 字节对齐、数组元素按 16 字节步长。C++ 结构体不做 `alignas(16)` 就会整体错位。

**Q5：Bindless 的代价是什么？**
需要扩展支持；资源生命周期由应用保证；随机索引降低缓存命中；调试工具支持弱。

**Q6：Mesh shader 为什么在移动端难落地？**
硬件/驱动支持少，GLES 无对应机制；需要 meshlet 资产管线；收益主要在超大几何/虚拟几何场景。

**Q7：GPU-driven 为什么要延迟一帧？**
剔除需要深度缓冲，而当前帧的深度要等绘制后才有；用上一帧 HZB 可并行，但会漏掉新出现物体，需要保守处理。

**Q8：HZB 为什么用最大深度？**
为了保守：只有包围盒最近点都比区域内最远深度更远时，才能确定完全被遮挡。用最小深度会误剔除。

**Q9：PSO 预热为什么必须在加载阶段？**
首次 PSO 创建包含 shader 编译与状态验证，耗时不可预测；放在游戏过程中会造成帧时间尖峰。

**Q10：如何治理 shader 变体爆炸？**
统计实际组合、构建期裁剪、uber shader、按画质档位分包、管线缓存、异步编译。核心是"只编译会出现的组合"。

---

> **一句话总结**：合批的终点不是"更少的 DrawCall"，而是"CPU 不再逐物体做决策"；Instancing 省提交，间接绘制省参数上传，GPU-driven 省掉 CPU 的可见性判断。
