# 05 · Shader 编程与手写题库

> **适用**：车载渲染引擎 / 图形开发岗，面试常以"现场写一段"或"口述这段 shader 在干什么"形式出现。
>
> **验证状态**：✅已验证（GLSL ES 3.0 语法与语义）/ ⚠️有条件成立（性能数字与平台差异）/ ❗待验证（版本相关的引擎行为）
>
> **配套**：[00-面试速问速答清单](./00-面试速问速答清单.md) D 组、[01-OpenGL管线-FBO与离屏渲染](./01-OpenGL管线-FBO与离屏渲染.md)、[图形与GPU工程 §2](../../03-图形与GPU工程/图形与GPU工程.md)

---

## 0. 回答框架：先说三件事

面试官问 shader，通常不是要你背语法，而是验证三件事：

1. **你知道每个输入从哪来**（顶点属性 / uniform / 纹理 / 上一 Pass）
2. **你知道每个输出到哪去**（`gl_Position`、`out` 颜色、多个 MRT）
3. **你知道代价在哪**（采样次数、分支、`discard`、`pow`/`normalize`、精度）

答题模板：

> "这个 shader 解决的是 X 问题。输入是 A（来自 VBO）和 B（来自上一 Pass 的 FBO 纹理）。核心计算是 C，放在 N 个 Pass 里做，因为 D。代价主要是 E，在移动端要注意 F。"

---

## 1. 跨语言对照表

车载项目常同时存在 Android（GLSL ES）、QNX/Linux（GLSL / SPIR-V）、Unity（HLSL/Cg）、iOS（MSL）。面试常问"GLSL 里 `texture2D` 在 HLSL 里怎么写"。

| 概念 | GLSL ES 3.0 | GLSL 4.x（桌面） | HLSL（D3D11/12） | MSL | WGSL |
|---|---|---|---|---|---|
| 版本声明 | `#version 300 es` | `#version 430 core` | 无（编译目标决定） | 无 | 无 |
| 顶点输入 | `in` | `in` | `TEXCOORD0` + 语义 | `[[stage_in]]` + 属性 | `@location(n)` |
| 顶点输出/片元输入 | `out` / `in` | `out` / `in` | 结构体 + 语义 | 结构体 | `@location(n)` |
| 片元输出 | `out vec4 fragColor` | `out vec4` | `SV_Target0` | `[[color(0)]]` | `@location(0)` |
| 2D 采样 | `texture(uTex, uv)` | `texture()` | `tex.Sample(s, uv)` | `tex.sample(s, uv)` | `textureSample(tex, s, uv)` |
| 顶点采样（手动 LOD） | `textureLod` | `textureLod` | `tex.SampleLevel` | `sample(..., level(l))` | `textureSampleLevel` |
| 纹理尺寸 | `textureSize` | `textureSize` | `GetDimensions` | `get_width/get_height` | `textureDimensions` |
| 导数 | `dFdx/dFdy` | 同 | `ddx/ddy` | `dfdx/dfdy` | `dpdx/dpdy` |
| 矩阵乘 | `M * v`（列主序） | 同 | `mul(M, v)`（默认行主序语义） | `M * v` | `M * v` |
| 内置插值 | `smooth/flat/noperspective` | 同 | `nointerpolation/linear/noperspective` | `[[flat]]` | `@interpolate(flat)` |
| 深度写入 | 固定管线状态 | 同 | `SV_Depth` | `[[depth(any)]]` | `@builtin(frag_depth)` |
| 精度限定 | `lowp/mediump/highp` | 无实际意义 | `min16float` 等 | `half` | `f32/f16` |

**必答要点**

- GLSL 矩阵是**列主序**，`mat4 * vec4` 等价于 HLSL 的 `mul(vec4, mat4)`；从 Unity 抄矩阵到 GLSL 要转置。
- 移动端 `mediump` 是 fp16，指数范围只有 ±65504，做世界坐标、深度、时间累加时容易溢出或抖动，**位置与 UV 用 highp**。
- `texture2D` 是 GLSL ES 1.0 的写法；ES 3.0 起统一为 `texture()`，旧代码混用会编译失败。

---

## 2. 十二个必须能手写的 Shader

> 代码统一用 **GLSL ES 3.0**，可直接放进 Android/OpenGL ES 3.x 工程。每题给出：用途 → 顶点/片元代码 → 关键点 → 追问。
> 完整 FBO 搭建代码见 [01 文档 §8](./01-OpenGL管线-FBO与离屏渲染.md)。

### 2.1 YUV420P → RGB（视频纹理化的第一道转换）

**用途**：OES 外部纹理转 2D 后，或直接上传 Y/U/V 三平面时做色彩空间转换。

```glsl
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texY;
uniform sampler2D u_texU;
uniform sampler2D u_texV;
uniform mat3 u_yuvToRgb;   // 由 VUI 元数据选择 BT.601/709/2020
uniform vec3 u_offset;     // limited range: (16,128,128)/255

void main() {
    float y = texture(u_texY, v_uv).r;
    float u = texture(u_texU, v_uv).r;
    float v = texture(u_texV, v_uv).r;

    vec3 yuv = vec3(y, u, v) - u_offset;
    vec3 rgb = u_yuvToRgb * yuv;
    fragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}
```

**关键点**

- 三平面各自采样一次，共 3 次纹理采样；NV12 只需 2 次（UV 交织，`texture(u_texUV, uv)` 取 `.rg`）。
- **矩阵与 offset 必须由元数据驱动**，不能硬编码：BT.601/709/2020、limited(16–235)/full(0–255) 组合错误会整体偏色。矩阵推导见 [图形与GPU工程 §2.2](../../03-图形与GPU工程/图形与GPU工程.md)。
- 4:2:0 的 U/V 分辨率是 Y 的 1/4，采样时依赖双线性上采样；若追求更高质量可做 4-tap 或 Catmull-Rom。
- 不要把 `glReadPixels` 回读后 CPU 转换——那是面试里的减分项。

**追问**："为什么不在 CPU 转？" → GPU 并行 + 数据本来就在显存；CPU 转需要回读，带宽和延迟都不可接受。

### 2.2 可分离高斯模糊（两 Pass）

**用途**：Bloom、毛玻璃、阴影软化。核心是把 O(N²) 降成 O(2N)。

```glsl
// 片元：水平/垂直共用，用 u_dir 控制方向
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform vec2 u_texelSize;   // 1.0 / textureSize
uniform vec2 u_dir;         // (1,0) 或 (0,1)

const float w[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec3 sum = texture(u_tex, v_uv).rgb * w[0];
    for (int i = 1; i < 5; ++i) {
        vec2 o = u_dir * u_texelSize * float(i);
        sum += texture(u_tex, v_uv + o).rgb * w[i];
        sum += texture(u_tex, v_uv - o).rgb * w[i];
    }
    fragColor = vec4(sum, 1.0);
}
```

**关键点**

- 9 次采样 = 1 + 2×4，对应 sigma≈2 的 9-tap 近似；半径越大应降分辨率而不是加大 tap 数。
- `u_texelSize` 必须按**当前 Pass 的输入纹理尺寸**算，降采样后尺寸变了要重算。
- 两 Pass 之间必须 Ping-Pong（读写的纹理不能是同一张），原因见 [01 文档 §4.4](./01-OpenGL管线-FBO与离屏渲染.md)。
- 高斯核可分离的数学前提：`G(x,y) = G(x)·G(y)`。

**追问**："为什么不用 13-tap？" → 移动端优先降分辨率（1/2、1/4）配合小核，采样数换分辨率更划算；Bloom 用 Kawase/dual filtering 可进一步降采样数。

### 2.3 Bloom（亮部提取 + 合成）

```glsl
// Pass 1：亮部提取（阈值 + 软膝）
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_scene;
uniform float u_threshold;
uniform float u_knee;

void main() {
    vec3 c = texture(u_scene, v_uv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));   // 线性空间亮度
    float soft = clamp(l - u_threshold + u_knee, 0.0, 2.0 * u_knee);
    soft = soft * soft / (4.0 * u_knee + 1e-4);
    float contrib = max(soft, l - u_threshold) / max(l, 1e-4);
    fragColor = vec4(c * contrib, 1.0);
}

// Pass N：合成（原图 + 模糊结果）
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_intensity;

void main() {
    vec3 base = texture(u_scene, v_uv).rgb;
    vec3 bloom = texture(u_bloom, v_uv).rgb;
    fragColor = vec4(base + bloom * u_intensity, 1.0);
}
```

**关键点**

- 阈值判断用的亮度权重是 **Rec.709 线性亮度**；在 gamma 空间做阈值会导致暗部误发光。
- 软膝（knee）避免阈值处硬跳变产生"光斑边界"。
- 现代做法是多级降采样金字塔（1/2、1/4、1/8…）分别模糊后加权合并，兼顾大范围光晕与性能。
- Bloom 必须放在 **tone mapping 之前、线性空间内**。

**追问**："Bloom 和 Glare 的区别？" → 同一族（点扩散），Bloom 偏柔和扩散，Glare 常叠加星芒/条纹核（anamorphic）。

### 2.4 基础调色（亮度/对比度/饱和度/Gamma）

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform float u_brightness;   // -1..1
uniform float u_contrast;     // 0..2, 1 = 原始
uniform float u_saturation;   // 0..2, 1 = 原始
uniform float u_gamma;        // 1/2.2 常用

void main() {
    vec3 c = texture(u_tex, v_uv).rgb;
    c += u_brightness;
    c = (c - 0.5) * u_contrast + 0.5;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, u_saturation);
    c = pow(max(c, 0.0), vec3(u_gamma));
    fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
```

**关键点**

- 对比度围绕 **0.5 中灰**而不是 0，否则整体变亮/变暗。
- 饱和度用亮度插值而不是简单乘系数，避免过曝。
- `pow` 是逐分量幂运算，移动端不便宜；能合并到 LUT 就合并。
- 顺序有语义：先亮度/对比度、再饱和度、最后 gamma；顺序换了结果不同，要在文档里固定。

### 2.5 3D LUT 调色

**用途**：把复杂调色（曲线、色相偏移、胶片模拟）烘焙成 64³ 查找表，运行时 8 次采样 + 插值完成。

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform sampler2D u_lut;     // 512x512，8x8 平铺 64³
uniform float u_lutSize;     // 64.0
uniform float u_strength;    // 0..1

// 64³ LUT 平铺在 512×512 图集上：8×8 个 64×64 的切片
vec2 sliceUV(float slice, vec2 rg) {
    const float tiles = 8.0;                 // 每行 8 个切片
    float size = u_lutSize;                  // 每个切片 size×size（通常 64）
    float col = mod(slice, tiles);
    float row = floor(slice / tiles);

    // 切片内坐标：映射到 [0.5/64, 63.5/64]，即半像素内缩
    vec2 local = (rg * (size - 1.0) + 0.5) / size;
    return vec2((col + local.x) / tiles,
                1.0 - (row + local.y) / tiles);   // GL 纹理原点在左下
}

vec3 lutSample(vec3 color) {
    float sliceIndex = color.b * (u_lutSize - 1.0);
    float slice0 = floor(sliceIndex);
    float slice1 = min(slice0 + 1.0, u_lutSize - 1.0);
    float t = sliceIndex - slice0;

    vec3 c0 = texture(u_lut, sliceUV(slice0, color.rg)).rgb;
    vec3 c1 = texture(u_lut, sliceUV(slice1, color.rg)).rgb;
    return mix(c0, c1, t);
}

void main() {
    vec3 src = texture(u_tex, v_uv).rgb;
    vec3 graded = lutSample(clamp(src, 0.0, 1.0));
    fragColor = vec4(mix(src, graded, u_strength), 1.0);
}
```

**关键点**

- LUT 必须用 **`GL_LINEAR` + `CLAMP_TO_EDGE`**；平铺边界处过滤会串层，所以切片内 UV 要内缩半个像素（代码里的 `+0.5 / size`）。
- 平铺布局需要处理 **蓝通道跨行**：`sliceIndex` 超过一行要换行，UV 的 V 轴方向（GL 纹理原点在左下）容易写反，写完必须拿纯色图验证。
- 采样在 gamma 空间还是线性空间必须与烘焙时一致，否则颜色对不上。
- 移动端可用 `GL_TEXTURE_3D`（ES 3.0 支持），省掉平铺坐标换算，但要注意部分老 GPU 的 3D 纹理过滤性能。

**追问**："LUT 为什么是 64³ 而不是 256³？" → 体积（64³×4B≈1 MB）与精度折中，配合三线性插值肉眼难辨；HDR 调色需要更高精度或分段。

### 2.6 图集 UV 与半像素修正

**用途**：Sprite Atlas / 字体图集，避免相邻图块渗色（bleeding）。

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_atlas;
uniform vec4 u_rect;        // (x, y, w, h) 归一化到图集
uniform vec2 u_atlasTexel;  // 1.0 / atlasSize

void main() {
    // 内缩半个像素，防止双线性采样跨到邻居
    vec2 uv = u_rect.xy + v_uv * u_rect.zw;
    uv = clamp(uv,
        u_rect.xy + 0.5 * u_atlasTexel,
        u_rect.xy + u_rect.zw - 0.5 * u_atlasTexel);
    fragColor = texture(u_atlas, uv);
}
```

**关键点**

- 图集渗色根因：GPU 双线性会读取相邻图块像素。解决方式三选一：**内缩半像素**、图块间留 padding（透明边）、或用 `CLAMP_TO_EDGE` + 独立纹理。
- 开启 mipmap 后低层级仍会串色，需要 **手动生成带 padding 的 mip** 或对 UI 关闭 mipmap。
- UV 的 V 轴方向取决于图片导入设置（是否 flip），Android Bitmap 与 GL 纹理原点不一致是经典坑。
- 圆角/描边精灵还会遇到"透明像素 RGB 为黑"导致的边缘发黑，需要预乘 Alpha（见 2.12）。

### 2.7 径向模糊 / 暗角 / 镜头畸变

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2 u_center;       // 0.5, 0.5
uniform float u_blurStrength; // 0.0 关闭
uniform float u_vignette;     // 0.0..1.0
uniform float u_distortion;   // 桶形/枕形，0 关闭
uniform float u_aspect;       // w/h

const int SAMPLES = 8;

vec2 distort(vec2 uv) {
    vec2 p = (uv - u_center) * vec2(u_aspect, 1.0);
    float r2 = dot(p, p);
    p *= 1.0 + u_distortion * r2;
    return p / vec2(u_aspect, 1.0) + u_center;
}

void main() {
    vec2 uv = distort(v_uv);
    vec2 dir = (uv - u_center) * u_blurStrength / float(SAMPLES);

    vec3 sum = vec3(0.0);
    for (int i = 0; i < SAMPLES; ++i) {
        sum += texture(u_tex, uv - dir * float(i)).rgb;
    }
    vec3 color = sum / float(SAMPLES);

    float d = length((v_uv - u_center) * vec2(u_aspect, 1.0));
    // 注意 smoothstep 要求 edge0 < edge1，否则结果未定义
    float vig = 1.0 - smoothstep(0.35, 0.9, d);
    color *= mix(1.0, vig, u_vignette);

    fragColor = vec4(color, 1.0);
}
```

**关键点**

- 径向模糊采样方向必须**朝中心**（`uv - dir * i`），方向写反会得到"向外扩散"的错觉。
- 畸变要在**归一化且修正宽高比**的空间里算，否则画面会被拉成椭圆。
- 循环次数必须是编译期常量（ES 3.0 允许非常量循环但有性能与兼容风险），用宏或常量。
- 采样点超出 [0,1] 时依赖 `CLAMP_TO_EDGE`，否则边缘出现黑边。

### 2.8 顶点动画（风摆 / 波浪）

```glsl
#version 300 es
precision highp float;
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

uniform mat4 u_viewProj;
uniform mat4 u_model;
uniform float u_time;
uniform float u_windStrength;
uniform float u_windHeightBias;  // 只让上部摆动

out vec2 v_uv;
out vec3 v_normalWS;

void main() {
    vec4 world = u_model * vec4(a_position, 1.0);

    float h = clamp(world.y * u_windHeightBias, 0.0, 1.0);
    float phase = world.x * 0.7 + world.z * 0.5 + u_time * 1.5;
    world.x += sin(phase) * u_windStrength * h * h;
    world.z += cos(phase * 0.8) * u_windStrength * 0.5 * h * h;

    v_uv = a_uv;
    v_normalWS = mat3(u_model) * a_normal;   // 均匀缩放可用；非均匀缩放须用逆转置
    gl_Position = u_viewProj * world;         // 必须用位移后的 world 坐标
}
```

**关键点**

- 最后一行必须使用**位移后的 `world`**；若写成 `u_viewProj * u_model * vec4(a_position,1.0)`，风摆不会生效——这是最常犯的错误。
- 若位移幅度较大，法线也应随位移近似修正（用有限差分重算法线），否则光照与几何不匹配。
- 非均匀缩放时法线必须用 **模型矩阵的逆转置**（`transpose(inverse(mat3(model)))`），否则光照错误。
- 只用顶点位移做风摆，模型会"拉伸"；高质量做法是按骨骼权重或高度场做分层偏移。
- 若需要参与阴影，必须在 shadow pass 里用同一套位移逻辑，否则影子不动。

### 2.9 Fresnel 边缘光

```glsl
#version 300 es
precision highp float;
in vec3 v_normalWS;
in vec3 v_viewDirWS;
out vec4 fragColor;
uniform vec3 u_rimColor;
uniform float u_rimPower;
uniform float u_rimIntensity;

void main() {
    vec3 N = normalize(v_normalWS);
    vec3 V = normalize(v_viewDirWS);
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), u_rimPower);
    fragColor = vec4(u_rimColor * fresnel * u_rimIntensity, fresnel * u_rimIntensity);
}
```

**关键点**

- `V` 是**片元指向相机**的方向；写成相机指向片元会得到反向结果。
- `pow` 的底数必须 clamp 到 [0,1]，负底数在部分 GPU 上返回 NaN。
- 输出 Alpha 用于叠加时，颜色要预乘（见 2.12）。
- 车载 HMI 常用它做"选中高亮""可交互提示"，成本极低（无额外采样）。

### 2.10 溶解（Dissolve）

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform sampler2D u_noise;
uniform float u_progress;    // 0..1
uniform vec3 u_edgeColor;
uniform float u_edgeWidth;

void main() {
    vec4 base = texture(u_tex, v_uv);
    float n = texture(u_noise, v_uv).r;

    if (n < u_progress) discard;

    float edge = smoothstep(u_progress, u_progress + max(u_edgeWidth, 1e-4), n);
    vec3 color = mix(u_edgeColor, base.rgb, edge);

    fragColor = vec4(color * base.a, base.a);
}
```

**关键点**

- `discard` 会关闭 Early-Z / Hi-Z 优化，且在某些 TBDR GPU 上打断"先深度后着色"的合并；用于转场特效可以接受，不要在日常 UI 上滥用。详见 [01 文档 §5.2](./01-OpenGL管线-FBO与离屏渲染.md#52-深度测试与-early-z)。
- 噪声图必须**不随 UV 平铺**（或用世界坐标采样），否则模型分块重复。
- 边缘色要在预乘空间混合，否则半透明边缘发白/发黑。
- 若需要"溶解 + 描边"，描边宽度按屏幕空间导数归一化，避免远近粗细不一。

### 2.11 描边（Sobel 边缘检测）

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;
uniform vec2 u_texelSize;
uniform vec3 u_outlineColor;
uniform float u_thickness;

float luma(vec2 uv) {
    return dot(texture(u_tex, uv).rgb, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 o = u_texelSize * u_thickness;

    float tl = luma(v_uv + vec2(-o.x,  o.y));
    float t  = luma(v_uv + vec2( 0.0,  o.y));
    float tr = luma(v_uv + vec2( o.x,  o.y));
    float l  = luma(v_uv + vec2(-o.x,  0.0));
    float r  = luma(v_uv + vec2( o.x,  0.0));
    float bl = luma(v_uv + vec2(-o.x, -o.y));
    float b  = luma(v_uv + vec2( 0.0, -o.y));
    float br = luma(v_uv + vec2( o.x, -o.y));

    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -bl - 2.0 * b - br + tl + 2.0 * t + tr;

    float edge = smoothstep(0.2, 0.5, length(vec2(gx, gy)));
    vec3 base = texture(u_tex, v_uv).rgb;
    fragColor = vec4(mix(base, u_outlineColor, edge), 1.0);
}
```

**关键点**

- Sobel 是**后处理描边**；角色描边更常用"背面外扩法"（先渲染放大后的背面为纯色，再渲染正面），成本更低且线宽稳定。
- 亮度权重用 Rec.601（0.299/0.587/0.114）还是 Rec.709 要与素材一致。
- 阈值 `smoothstep` 的上下界决定线条粗细与抗锯齿，硬阈值会出现锯齿。
- 对深度/法线做 Sobel 可以得到"几何描边"，比颜色描边更稳定（不受纹理影响）。

### 2.12 预乘 Alpha 合成

```glsl
#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_tex;

void main() {
    vec4 c = texture(u_tex, v_uv);
    // 若源纹理是直通 Alpha（straight），先预乘
    c.rgb *= c.a;
    if (c.a < 0.0039) discard;   // 1/255，剔除全透明片元
    fragColor = c;
}
```

配合混合状态 **`glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA)`**。

**关键点**

- 直通 Alpha + 双线性过滤 = 边缘像素的 RGB 被透明区"污染"，出现灰黑边；预乘后插值正确。
- 预乘只能做一次，**纹理导入时就预乘**最省；运行时重复预乘会把颜色压暗（`rgb *= a*a`）。
- 在预乘空间做加法混合（`GL_ONE, GL_ONE`）得到"发光叠加"，这是粒子特效的标准做法。
- 与 sRGB 的关系：Alpha 不参与 gamma 编码，预乘应在**线性空间**做（详见 [色彩管理与采样滤波](../../03-图形与GPU工程/色彩管理与采样滤波.md)）。

---

## 3. 精度、性能与常见 Bug 清单

### 3.1 精度

| 场景 | 建议 | 原因 |
|---|---|---|
| 顶点位置、世界坐标 | `highp` | mediump 范围 ±65504，大场景易溢出 |
| UV（大图集） | `highp` | mediump 在 UV 上千会丢精度，出现条纹 |
| 颜色 | `mediump` 可接受 | 人眼对 8-bit 量化不敏感 |
| 时间累加 | `highp` | 长时间运行后 mediump 抖动明显 |
| 深度写入 | `highp` | 精度直接影响 Z-fighting |

### 3.2 性能红线

- **采样次数**是第一成本：全屏 Pass 每多一次采样 = 每像素多一次带宽访问。
- **动态分支**在移动端是双刃剑：uniform 分支通常被编译期消除；依赖 `varying` 的分支会真正发散。优先用 `mix`/`step` 替代。
- **`discard`** 关闭 Early-Z，仅在透明占比高时使用。
- **`pow` / `normalize` / `inverse`** 逐像素做要谨慎；能提到顶点着色器或预计算就提。
- **全屏 Pass 数量**直接决定带宽：720P RGBA 单 Pass 写入约 3.7 MB，10 个 Pass 就是 37 MB/帧。

### 3.3 高频 Bug

1. 忘记 `glViewport` 或 FBO 分辨率变更后未重建 renderbuffer → 画面拉伸/不完整。
2. 采样与写入同一张纹理（缺 Ping-Pong）→ 未定义行为。
3. 图集边缘渗色 → 缺半像素内缩或 padding。
4. 半透明边缘黑边 → 未预乘 Alpha。
5. 法线未归一化 → 光照偏亮/偏暗且随距离变化。
6. 非均匀缩放未用逆转置 → 法线方向错误。
7. GLSL 矩阵未转置（从 Unity/HLSL 移植）→ 模型消失或翻转。
8. `mediump` 用于世界坐标 → 远处顶点抖动（"vertex jitter"）。
9. 未处理 sRGB/线性空间 → 整体发灰或过暗。
10. FBO 纹理未设置 `GL_LINEAR`/`GL_CLAMP_TO_EDGE` → 采样到边缘外颜色。

---

## 4. 三个 "深挖" 追问的标准答法

### Q：一个全屏特效 Pass 的成本怎么估？

> 主要看外部带宽：`读入纹理字节 + 写出颜色字节`。720P RGBA8 单次读写约 3.7 MB + 3.7 MB ≈ 7.4 MB；60 FPS 下约 443 MB/s。若叠加 5 个 Pass，带宽需求接近 2.2 GB/s，已经超过不少低端 SoC 的可持续带宽。所以优化的第一优先级是**减少 Pass 数和降低中间纹理分辨率**，而不是微调 shader 指令。

### Q：什么时候该把计算搬到 Compute Shader？

> 当任务是**数据并行且输出布局与像素无关**时（直方图、降采样、模糊、色彩统计、GPU 粒子），Compute 没有光栅化开销、可以自由读写 SSBO/Image、工作组内可共享内存。反之，需要固定管线插值、混合、深度测试的，仍然用图形管线更合适。OpenGL ES 3.1+ 才支持 Compute；车载项目要确认目标 GPU 与驱动。

### Q：Shader 变体爆炸怎么治理？

> 三个手段：① 用 **UBO/常量分支**替代 `#ifdef` 宏分支，把"功能开关"变成运行期 uniform；② 用 **ShaderVariantCollection / 预编译**把实际用到的组合固化，避免运行时编译卡顿；③ 建立变体矩阵（功能 × 质量档 × 平台），在构建期做笛卡尔积裁剪，并在启动时异步预热。详见 [07 文档 §5](./07-DrawCall优化与渲染管线定制.md)。

---

## 5. 复习清单（面试前 30 分钟）

- [ ] 能默写 YUV→RGB 的 3 采样版本，并说出 BT.601/709 的差别
- [ ] 能解释高斯为什么可分离、9-tap 权重怎么来
- [ ] 能说出 Bloom 的正确管线顺序（线性空间 → 阈值 → 模糊 → 合成 → tone mapping）
- [ ] 能写出预乘 Alpha 的混合状态
- [ ] 能说出 `discard` 的三个代价
- [ ] 能解释 `mediump` 溢出的典型现象
- [ ] 能说出图集渗色的三种解法
- [ ] 能说出 LUT 平铺布局的两个坑（跨行、半像素）
- [ ] 能解释为什么法线要用逆转置矩阵
- [ ] 能说出一个 shader 变体治理方案
