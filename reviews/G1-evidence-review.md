# G1 · 知识与证据审核材料

> Master Prompt V3.0 §3.1 / Loop 1 Step 2 · 2026-11-19 · 基于 HEAD `650bb14` 实测。
> **性质：AI 审核准备材料，非人工结论。** 每条含审核对象/证据来源/发现/建议处理/需人工确认；**人工结论栏留空，AI 不填写、不自动升级任何 claim 状态**（evidence-and-claims.md 硬规则 1）。
> 证据行号均指当前工作区文件。

---

## 0. 审核对象与方法

- `evidence/claim-ledger.json`（31 条）、`evidence/source-registry.json`（16 来源）、`knowledge-model/concepts.json`（23 概念）及教材所引主知识文档。
- 方法：脚本导出全部 claim 的 id/行号/类型/状态/来源/挂载并校验双向索引；逐条核对来源支持性；四个重点项 grep 定位原文。
- 自动前置（review_gate 实测）：31 claims = verified 16 / conditional 7 / open 8；conditional/contested 误标 verified **0**；未挂载课程仅 P03（open，预期）。

## 1. 结构性核查结论（确定性）

| 检查 | 结果 | 证据 |
|---|---|---|
| claim↔source 双向索引 | ✅ 完整，无缺失来源、无反向索引缺漏 | 脚本遍历 31 claim 的 evidence.source_id 与 registry.used_by_claims，0 告警 |
| source.type 合法 | ✅ 16 来源均属 {official_doc, spec, repo_doc, derivation} | source-registry.json |
| concepts.source_claim 可解析 | ✅ 23 概念的全部 source_claim 指向存在 claim | 脚本校验 20 条带 source_claim 的关系，全 OK |
| used_by_lessons 指向存在课时 | ✅ 均存在于 tools/course.json | validate §8 |
| AI 提取断言未冒充 verified | ✅ V13/V14 正确标 open/low | claim-ledger.json:306/330 |

## 2. Claim 全量清单（31 条）

> 支持性判定：✓=来源支持且匹配；⚠=有条件/需留意；✗=问题。行号指 claim-ledger.json。

| ID | 行 | 类型 | 状态/置信 | 来源 | 挂载 | 支持性 | 备注 |
|---|---|---|---|---|---|---|---|
| V01 | 7 | verified_fact | verified/high | SRC-ANDROID-MEDIACODEC | L01,L04 | ✓ | MediaCodec 不负责 demux，官方文档支持 |
| V02 | 32 | verified_fact | verified/high | SRC-FOURCC-REF | L01 | ✓ | NV12/NV21 交错顺序；来源 URL 为 fourcc.org 首页（locator 精度弱，见 §4.5） |
| V03 | 57 | verified_fact | verified/high | SRC-FFMPEG-DOC | L02 | ✓ | 显示看 PTS、B 帧 DTS≠PTS |
| V04 | 80 | verified_fact | verified/high | SRC-KHRONOS-OES | L06 | ✓ | OES 外部纹理采样，spec 支持 |
| V05 | 105 | verified_fact | verified/high | SRC-AHARDWAREBuffer-EGLImage | L06 | ✓ | 零拷贝=尽量减少拷贝，条件已记 |
| V06 | 130 | verified_fact | verified/high | SRC-KHRONOS-GLES32 | L08,L13 | ⚠ | 断言本身（顶点/片元可编程阶段）正确，但**与 L13 核心无关**（见 §4.4） |
| V07 | 156 | engineering_fact | verified/medium | SRC-GPU-PIPELINE-BP | L08 | ⚠ | DrawCall 成本多因素；来源 URL 为 nvidia 首页（locator 精度弱） |
| V08 | 181 | verified_fact | verified/high | SRC-KTX2-SPEC(+BASIS) | L03 | ✓ | KTX2 容器/BasisU 编码 |
| V09 | 206 | verified_fact | verified/high | SRC-W3C-WEBGPU | L09 | ✓ | WebGPU 接近显式 API |
| V10 | 231 | engineering_fact | verified/medium | SRC-FFMPEG-DOC | L02 | ⚠ | 音频主时钟惯例成立；源文档市占率部分标 [AI-生成] 已删除（音视频基础理论.md:448），V10 不含该部分 |
| V11 | 256 | verified_fact | verified/high | SRC-ITU-H264 | L04 | ✓ | NALU/SPS/PPS/SEI |
| V12 | 281 | verified_fact | verified/high | SRC-YUV420-DERIVATION | L01 | ✓ | 62.5% 推导，条件 4:2:0 |
| **V13** | 306 | verified_fact | **open/low** | SRC-RN-AV-BASE | L01 | ⚠ | P6 新增，生理依据；升级评估见 §4.1 |
| **V14** | 330 | engineering_fact | **open/low** | SRC-RN-AV-BASE | L01 | ⚠ | P6 新增，stride 机制；升级评估见 §4.1 |
| C01 | 357 | conditional | conditional/medium | SRC-RN-VERIFICATION | L05 | ✓ | TextureView 合成成本，条件已记 |
| C02 | 382 | conditional | conditional/medium | SRC-RN-VERIFICATION | L06 | ✓ | Surface 直出零拷贝条件 |
| C03 | 407 | conditional | conditional/medium | SRC-RN-VERIFICATION | L05 | ✓ | 硬解节能条件 |
| C04 | 432 | conditional | conditional/medium | SRC-RN-VERIFICATION | L03 | ✓ | KTX2 分发体积条件 |
| C05 | 457 | conditional | conditional/low | SRC-RN-VERIFICATION | L09 | ⚠ | WebGPU/WebGL 性能关系，置信 low，依赖驱动/后端 |
| C06 | 482 | conditional | conditional/medium | SRC-RN-VERIFICATION | L11 | ⚠ | RenderGraph 降 VRAM Peak；**条件"≥3"与源文档">3"冲突**（§4.2） |
| C07 | 507 | conditional | conditional/medium | SRC-RN-VERIFICATION | L03 | ✓ | 压缩纹理需硬件原生支持 |
| P01 | 532 | contested | open/low | SRC-RN-VERIFICATION | L15 | ✗ | "提升X%/降Y%功耗"缺统一测试方法，已降级[测试数据]；需研究（Category C） |
| P02 | 557 | contested | open/low | SRC-RN-VERIFICATION | L06 | ⚠ | "全链路零拷贝"需逐平台 copy trace；**used_by L06 但 L06 正文未声明 P02**（§4.6） |
| P03 | 582 | engineering_fact | open/low | SRC-RN-VERIFICATION | （无） | ⚠ | WebRTC 3A 细节，暂未纳入主线，未挂载预期 |
| P04 | 605 | engineering_fact | open/low | SRC-RN-VERIFICATION | L10 | ⚠ | 跨平台 API 一致性需逐平台官方对照（Category C） |
| P05 | 630 | contested | open/low | SRC-RN-VERIFICATION | L15 | ✗ | "CPU 占用降 98%"缺压测依据，[待验证]（Category C） |
| P06 | 655 | contested | open/low | SRC-RN-VERIFICATION | L11 | ✗ | "显存减 40%"缺 RenderDoc 快照（Category C） |
| E01 | 680 | verified_fact | verified/high | SRC-RN-CONCEPT-INTRO | L01,L00 | ✓ | DRAM/DMA/PCIe 三维度 |
| E02 | 704 | engineering_fact | verified/medium | SRC-RN-CONCEPT-INTRO | L06,L09 | ✓ | PC 独显 PCIe/移动 SoC 共享 DRAM，条件已记 |
| E03 | 730 | verified_fact | verified/high | SRC-RN-CONCEPT-INTRO | L08,L11 | ✓ | Pass=FBO 离屏渲染正式名 |
| E04 | 755 | engineering_fact | verified/medium | SRC-VULKAN-SPEC | L11 | ✓ | RenderGraph DAG/自动同步，条件 Pass≥3 |

## 3. 真实性总体评估

- **无 AI 生成内容冒充 verified**：V13/V14 正确 open；源文档中 [AI-生成] 段（如音频主时钟市占率）已被删除或标注，未进入 claim 结论。
- **无孤立断言**：31 条均有 evidence（validate §11a 0 FAIL）。
- **夸大引用风险点**：教材侧 L02"drift 分级处置"已在 P6 诊断为 blocker（G-T1，属 G2/L02 内容问题，非 ledger 断言本身）；ledger 内 V03/V10 表述与源文档一致，无夸大。
- **来源精度弱点**（非 blocker）：部分种子来源 URL 为官网首页、locator 仅为 claim id（V02/V07 等），可追溯到站但不到具体段落；建议 P8 补精确 locator（Category C/A）。

## 4. 四个重点审核项

### 4.1 V13/V14 升级证据评估（不自动升级）

**V13**（claim-ledger.json:306，open/low）："人眼对亮度细节敏感度远高于色度（杆状细胞远多于锥状细胞），是 YUV 色度下采样的生理依据"。
- 来源 SRC-RN-AV-BASE = `repo:01-基础理论/音视频基础理论.md`，locator §2.1 YUV 设计原理。
- 原文证据：音视频基础理论.md:57 "人眼视网膜中杆状细胞（对明暗敏感）的数量远多于锥状细胞（对色彩敏感）…人眼对亮度的敏感度远高于对色度…✅已验证"。
- **AI 建议**：来源为人写 ✅ 段、生理学共识，证据充分，**具备升级 verified 的条件**；但按硬规则须人工 G1 确认后方可升级。
- 需人工确认：是否同意 V13 → verified/high。
- **人工结论：**＿（待人工填写）

**V14**（claim-ledger.json:330，open/low）："Stride 是硬件对齐后的物理行宽；按逻辑宽度逐行读取会逐行错位，导致斜纹/绿线/绿屏"。
- 来源 SRC-RN-AV-BASE，locator §2.2。
- 原文证据：音视频基础理论.md:148 stride 公式、:152-154 算例 1080@128=1152 ✅、:156-167 故障表（斜纹/绿线/绿屏）✅；:132 对齐基数 ⚠️有条件（因芯片而异）。
- **AI 建议**：核心机制（错位→故障）有 ✅ 支持，**可升级**；但"对齐基数"部分本质条件性，建议升级时**保留 conditions**（对齐基数因平台而异/行高对齐），状态可议 verified（机制）或 conditional（含平台参数）。倾向 verified + 保留条件，与 V12 处理方式一致。
- 需人工确认：V14 目标状态（verified 保留条件 / conditional）与置信度。
- **人工结论：**＿（待人工填写）

> 升级后需同步：source-registry SRC-RN-AV-BASE 反向索引已含 V13/V14（无需改）；若升级，仅改 verification.status/confidence，不改 claim 文本。

### 4.2 Pass 深度口径冲突（G-E1）

- **冲突原文**：
  - 跨平台与高性能架构.md:205 "特效 Pass 深度 **> 3**…必须通过 RenderGraph 自动优化"。
  - 验真队列与术语表.md:47 C06 "需 Pass 深度 **≥3** 且有分支结构"。
  - 概念引入说明.md:145 "Pass **≥ 3** 且有分支"。
  - L11-RenderGraph与资源生命周期.md:46 "Pass 深度 **≥3**"（取 C06 口径）。
  - claim-ledger C06（:482）conditions "需 Pass 深度≥3 且有分支"；E04（:755）conditions "Pass≥3 且有分支才体现价值"。
- **发现**：多数权威口径（验真队列/概念引入/C06/E04/L11）为 **≥3**；离群为跨平台主文档:205 的 **>3**。archive 旧文亦作"大于3"（只读，不作准）。
- **AI 建议**：以 ≥3 为准统一，勘误跨平台与高性能架构.md:205 ">3"→"≥3"（Category A 可由源文档直接证明，但改主文档属内容修改，建议随 G1 裁决一并授权）。样章 L11 现取 ≥3 无需改。
- 需人工确认：统一口径为 ≥3 还是 >3；是否授权勘误跨平台:205。
- **人工结论：**＿（待人工填写）

### 4.3 SurfaceTexture API 名称准确性（G-E2）

- **问题原文**：解码与播放链路.md:124 "利用 `glGetTransformMatrix()` 抽离出纹理坐标变换矩阵"。
- **对照**：3D变换与坐标空间.md:225 "视频纹理（GL_TEXTURE_EXTERNAL_OES）的 UV 变换矩阵由 `SurfaceTexture.getTransformMatrix()` 给出"。解码与播放链路.md:206 正确用 `updateTexImage()`。
- **发现**：`glGetTransformMatrix()` 不是有效 GL/GL ES 函数名；Android 正确 API 为 Java 方法 `SurfaceTexture.getTransformMatrix(float[])`。解码链路:124 写法不准确（与 3D变换:225 矛盾）。
- **AI 建议**：勘误解码链路:124 为 `SurfaceTexture.getTransformMatrix()`。因涉及官方 API 行为确认，归 **Category C**（先核 Android 官方文档再勘误），不本轮自动改。glossary/source-registry 未登记该 API 断言，无需改 ledger。
- 需人工确认：是否授权核验官方文档后勘误（可并入 P7 L06 深化）。
- **人工结论：**＿（待人工填写）

### 4.4 L13 坐标空间/MVP/NDC 断言缺口

- **现状**：L13 正文 claims 仅 [V06]（P6 已补 used_by L13），但 V06="顶点/片元是 GLES 2/3 常见可编程阶段"（claim-ledger:130），**与 L13 核心（坐标空间链/MVP 顺序/NDC 跨 API 差异）无关**。quizzes/L13.json Q3 把 MVP 顺序挂 V06，Q1/Q2 claim_ids 空。
- **源文档支撑**（3D变换与坐标空间.md，推导完整）：§1 坐标空间链（L15-25）、§4 投影矩阵推导+w_clip=-z_eye（L123）、§5 NDC/Y-flip（L181-189/210-225）。
- **候选断言**（对照教材质量诊断.md §3，默认 open，待 G1 登记裁决）：
  1. 坐标空间链：模型→世界→观察→裁剪→NDC→屏幕，各空间原点/单位/用途（source §1）。
  2. MVP 列向量组合顺序 `gl_Position = P·V·M·pos`，矩阵不可交换（source §1/§4）。
  3. 投影矩阵把深度写入 w（w_clip=-z_eye），透视除法由固定管线完成（source §4）。
  4. OpenGL NDC [-1,1] vs Vulkan 深度 [0,1]、Y 默认向下可负视口翻转（source §5）。
- **AI 建议**：P7 L13 深化时按 evidence-and-claims 程序登记上述 4 条（默认 open），quiz 重新挂接；V06 保留给 L08，L13 不再以 V06 作核心支撑。
- 需人工确认：是否同意登记候选断言（编号续 V15+）；L13 quiz 挂接方案。
- **人工结论：**＿（待人工填写）

## 5. 其他发现

| ID | 发现 | 证据 | 建议 | 分类 |
|---|---|---|---|---|
| G1-a | K-STRIDE 概念关系 source_claim=V02（弱挂），V14 已存在更贴切 | concepts.json K-STRIDE→K-DMA；claim-ledger V14:330 | 改挂 V14（数据一致性，可由 ledger 证明） | A（Loop 2） |
| G1-b | P02 used_by_lessons=[L06] 但 L06 正文 claims 未声明 P02 | claim-ledger:557；lessons/L06 frontmatter | P7 裁决：L06 补声明 P02 或 ledger 去除挂载 | B |
| G1-c | 种子来源 locator 精度弱（V02 fourcc 首页 / V07 nvidia 首页，locator=claim id） | source-registry.json | P8 补精确段落 locator | C/A |
| G1-d | contested P01/P05/P06 缺实证（性能数字） | claim-ledger:532/630/655 | 需压测/RenderDoc 证据，研究前不得升级 | C |
| G1-e | P04 跨平台 API 一致性需逐平台官方对照 | claim-ledger:605 | 研究任务 | C |

## 6. 需人工确认事项汇总（G1）

1. V13 是否升级 verified/high（§4.1）。
2. V14 目标状态与置信度（§4.1）。
3. Pass 深度统一口径 ≥3 / >3，及是否勘误跨平台:205（§4.2）。
4. 是否授权核验官方后勘误解码链路:124 API 名（§4.3）。
5. L13 候选断言（4 条）是否登记、quiz 挂接方案（§4.4）。
6. P02 与 L06 挂载矛盾处置（G1-b）。
7. contested P01/P05/P06 / P04 研究任务是否立项（G1-d/e）。

## 7. 权威来源核验增补（Loop 2，2026-11-19，网络恢复后）

> 依 D12.7（G1-01 逐条核查）/ D12.8（G1-02 以权威来源为准）。以下为权威来源核验结果，**供人工裁决；AI 不自动升级 claim**。

### 8.1 SurfaceTexture API（C2，已核验 → 已勘误）
- **结论**：正确为 `SurfaceTexture.getTransformMatrix(float[])`（Java，API11+）；NDK 为 `ASurfaceTexture_getTransformMatrix`（API28+）。`glGetTransformMatrix()` **不是 GL/GLES 函数**；`AImage_getTransformMatrix` 亦不存在。
- **权威来源**：AOSP https://source.android.com/docs/core/graphics/arch-st ；NDK android/surface_texture.h（android.googlesource.com）；Media3 文档。
- **处置**：已勘误 解码与播放链路.md:124 `glGetTransformMatrix()`→`SurfaceTexture.getTransformMatrix()`（D12.8 授权）。

### 8.2 Pass 深度阈值（B9，已核验 → 已统一）
- **结论**：Frostbite FrameGraph GDC 2017 全文与 Vulkan 规范**均无 ≥3/>3 硬阈值**；属工程启发式（浅线性管线收益可能被 setup/compile 开销抵消）。
- **权威来源**：Frostbite "FrameGraph" GDC 2017（slideshare/EA/GDC Vault 1024612）；themaister "Render graphs and Vulkan"；CppCon 2017。
- **处置**：内部统一 **≥3** 并软化为启发式表述；已勘误 跨平台与高性能架构.md:205 ">3"→"≥3（工程启发式，非规范硬阈值）"。C06/E04 条件保持 ≥3。

### 8.3 V13 生理依据（B7，已核验 → 建议修正表述后升级）
- **核心结论高置信支持**：人眼对亮度细节的空间视锐度高于色度（色度通路空间分辨率/对比敏感度较低），是色度下采样公认依据。
- **权威来源**：Wikipedia Chroma subsampling（引 Winkler 2001《Vision and Video》p.209、Livingstone 2002《Vision and Art》pp.46-67）；ACM Computing Surveys DOI 10.1145/3571727。
- **需修正**：V13 与 L01 §3 现用"杆状细胞远多于锥状细胞"作**直接因果**属简化——杆状细胞仅主导暗视觉（无色觉），明视觉下色觉与细节由锥状细胞及神经通路承担。建议改为"视觉系统对亮度细节的空间视锐度高于色度（色度通路空间分辨率较低）；杆/锥数量比是通俗解释，杆状细胞仅主导暗视觉"。
- **术语精化**（Poynton/SMPTE EG 28）：视频 Y' 为 luma（伽马校正加权和），严格区别于色度学 luminance Y；数字视频宜称 Y'CbCr。
- **AI 建议**：先按权威来源修正 V13 claim 文本与 L01 §3 表述，再升级 verified/high。**状态升级与 L01 修改待人工确认**（B4 用户需阅读 L01；B7 待裁决）。本轮未改 V13/L01。
- **人工结论：**＿

### 8.4 V14 stride 机制（B8，已核验）
- 源文档 ✅ 段（公式/算例/故障表）支持核心机制；对齐基数 ⚠️ 平台相关（C3 研究可细化高通/Apple/Intel 参数）。
- **AI 建议**：verified + 保留 conditions（与 V12 一致）。**待人工裁决**。
- **人工结论：**＿

### 8.5 seek 机制（B1/C1，已核验 → L02 已修复）
- **结论**：精准 seek"静默解码追赶 + 目标首帧强制渲染"机制证实（Media3 troubleshooting、FFmpeg -accurate_seek、MediaCodec BUFFER_FLAG_DECODE_ONLY、ExoPlayer 源码）。原 L02 目标"seek 后禁止立刻丢帧"**表述不准确**，已改写为准确表述并登记 V15（open）；drift 夸大引用已改为真实 Δt 两分支 + PLL 条件，登记 V16（open）。
- **权威来源**：https://developer.android.com/media/media3/exoplayer/troubleshooting ；https://ffmpeg.org/ffmpeg.html ；MediaCodec javadoc；google/ExoPlayer MediaCodecVideoRenderer。
- **处置**：L02 正文/quiz/两层 course.json 已修复，门禁绿（validate 11/0/0，arc 5/5）。V15/V16 升级待 G1。

## 8. 人工审核结论区（AI 不填写）

- G1 总体判定（通过 / 有条件通过 / 不通过）：＿
- 审核人 / 日期：＿
- 逐项裁决见 §6 与 DECISION_REQUIRED.md 统一裁决表。
- **本材料所有"AI 建议"仅为线索，最终状态升级与勘误授权以人工裁决为准。**