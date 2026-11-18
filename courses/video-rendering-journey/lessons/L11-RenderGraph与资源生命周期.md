---
id: L11
course: video-rendering-journey
title: RenderGraph 与资源生命周期
prerequisites: [L10]
objectives:
  - 说明 RenderGraph 解决的是复杂度问题而非画质问题
  - 判断单 Pass 场景是否适合引入 RenderGraph
  - 解释 barrier 由谁插入
source_documents:
  - 04-跨平台与高性能架构/跨平台与高性能架构.md#2-rendergraph-架构设计
claims: [C06, E03, E04]
status: draft
lab: rendergraph-dag
---

# RenderGraph 与资源生命周期

> **本章回答**：为什么学渲染时没遇到过的 Pass 和 RenderGraph，到工程阶段突然满屏都是？

## 1. 从一个问题开始

一帧只画一遍时，绑定 FBO、画、显示，简单直接。可一旦加上阴影、主场景、透明、后处理，"哪张纹理被谁写、被谁读、什么时候能释放"就变成一张纠缠的依赖网。手写同步稍有不慎就是花屏或死锁。

## 2. 学习前提

- L08 的管线；L10 的 barrier / command buffer 概念。
- 术语 Pass：**一次渲染到某个目标的阶段**。你其实早见过——L3 的"多 Pass 特效链"里每个 FBO 环节就是一次 Pass（断言 `E03`）。

## 3. 直观认识

把每个 Pass 想成一个工人，每张纹理想成一个工作台。工人多了以后，谁先用谁后用、谁用完谁能收走工作台，需要一张排班表。RenderGraph 就是自动排班的系统。

## 4. 一步一步理解原理

### 4.1 Pass 的正式名字

OpenGL 里你手动绑 FBO，Vulkan 要求显式声明 `VkRenderPass`。同一个东西换了正式名字——这就是"突然冒出来"的错觉来源，桥梁见[概念引入说明 §Pass/RenderGraph](../../../00-导航与索引/概念引入说明.md#2-pass-rendergraph为什么学渲染时没遇到)。

### 4.2 RenderGraph 做什么

它把 Pass 与资源依赖抽象成 DAG，在编译期分配显存、决定 aliasing（生命周期不重叠的纹理复用同一物理内存）、自动插入同步屏障。价值详见[跨平台与高性能架构 §RenderGraph 架构设计](../../../04-跨平台与高性能架构/跨平台与高性能架构.md)。

### 4.3 边界：什么时候不值得

RenderGraph 降低 VRAM Peak 需要 Pass 深度 ≥3 且有分支结构（断言 `C06`）；单 Pass 场景用它反而是负担。它解决的是**复杂度与正确性**，不是画质。

## 5. 数学原理 / 数据形态

DAG 中节点是 Pass，边是资源读写依赖。若纹理 A 的写 Pass 与纹理 B 的写 Pass 生命周期不重叠，可复用同一物理页（aliasing）。这不是近似，是依赖图推导出的确定性结论。

## 6. 工程应用与常见错误

- **误区**："RenderGraph 是 GPU 硬件特性。" 错，是 CPU 侧引擎架构（断言 `E04`）。
- **误区**："上了 RenderGraph 就一定更快。" 单 Pass 场景更慢。
- **误区**："barrier 要人工插满。" RenderGraph 编译期自动推导，人工只声明依赖。

## 7. 动手实验

打开 [RenderGraph DAG 实验](#/lab/rendergraph-dag)，增删 Pass 节点看依赖边、aliasing 机会与同步点如何变化。

## 8. 总结与主动回忆

不看文档说明：Pass 是什么？RenderGraph 解决什么问题？什么时候不该用？

## 9. 自我检测

1. 单 Pass 场景适合上 RenderGraph 吗？为什么？
2. barrier 是由谁 inserted？人工还是图编译？

题目来源：`tools/course.json` L11 checkpoint；对应练习 `quizzes/L11.json`。

## 10. 下一章的桥

到这里一帧已经能被组织得可预测、可复用。但要把整条链路讲给别人听，还需要一个"讲法"——[下一章](L13-坐标变换与MVP.md)回到数学根基：坐标变换与 MVP，作为面试表达的核心支点。

## 11. 术语与延伸

RenderGraph / Pass / RenderPass / Subpass / Memory Aliasing / CommandBuffer；延伸见 [显式 API 与同步原语 §RenderPass/Subpass](../../../04-跨平台与高性能架构/显式API与同步原语.md#6-renderpass-subpass-load-store)。
