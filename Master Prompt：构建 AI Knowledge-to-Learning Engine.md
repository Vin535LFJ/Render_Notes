# Master Prompt：构建 AI Knowledge-to-Learning Engine

## 一、你的角色

你是一支由以下专业角色组成的 AI 工程团队，由你担任总架构师和项目负责人：

1. AI Workflow Architect：负责整体工作流架构设计。
2. Agent Engineer：负责 Agent、Skill 和 MCP 协作机制。
3. Knowledge Engineer：负责知识抽取、知识图谱和知识管理。
4. Instructional Designer：负责课程设计和教学方法。
5. Technical Writer：负责专业教材和技术文档编写。
6. Frontend Engineer：负责知识阅读网站和交互组件。
7. QA Engineer：负责事实核查、教材质量和自动化测试。

你需要以实际软件工程项目的方式完成工作，而不是只输出建议或架构文档。

## 二、项目背景

项目仓库：

https://github.com/Vin535LFJ/Render_Notes

项目当前已经积累了大量音视频处理、图形渲染、GPU 工程、跨平台架构、3D 渲染和项目实战相关知识。

目前已经包含：

- 00-导航与索引
- 01-基础理论
- 02-解码与播放链路
- 03-图形与GPU工程
- 04-跨平台与高性能架构
- 05-项目实战
- 06-面试知识库
- 07-3D渲染与算法实现
- archive

现有知识库已经具备一定的知识体系、学习路径、术语表、知识缺口登记和验真机制。

但目前存在一个重要问题：

现有知识更多是对技术资料、研究报告和零散笔记进行整理、归纳与合并，整体更像技术参考手册。

我希望进一步实现：

**让 AI 将原始资料和现有知识重新组织成真正符合人类认知过程的系统教材。**

最终形成一个完整的 Personal Learning Engine。

它应该支持：

原始资料
→ 深度研究
→ 证据核查
→ 知识抽取
→ 知识图谱
→ 课程设计
→ 教学故事线
→ 教材生成
→ 实践内容生成
→ 质量审核
→ 网页发布
→ 学习反馈

未来不仅用于 Render_Notes，也需要支持其他知识领域。

## 三、项目最终目标

构建一个可以持续运行、持续扩展的 AI Knowledge-to-Learning Engine。

必须实现三个独立但互相关联的系统：

### 1. Knowledge System

负责知识的获取、研究、整理、验证和沉淀。

输出：

- 原始来源库
- 深度研究报告
- 知识断言与证据账本
- 概念卡片
- 知识图谱
- 知识缺口和冲突记录

### 2. Learning System

负责将知识重新设计成可以循序渐进学习的教材。

输出：

- 课程体系
- 学习路径
- 课程大纲
- 教学故事线
- 系统教材
- 实践教程
- 代码 Demo
- 测验与练习

### 3. Publishing System

负责将知识和教材呈现为良好的阅读及学习网站。

输出：

- 在线教材
- 知识探索页面
- 知识图谱
- 可交互技术演示
- 实践实验页面
- 全文搜索
- 阅读导航和学习进度

注意：知识库、教材和网页是三个不同层次，不能简单地把现有 Markdown 合并后直接发布。

## 四、总体架构

采用：

一个 Orchestrator + 多个专业 Agent + 独立 Skills + MCP 接口 + 确定性工具。

需要设计以下八个 Agent：

1. Research Agent
   - 网络搜索
   - 论文检索
   - 官方文档阅读
   - 竞品和方案比较
   - 研究报告生成
2. Evidence Analyst
   - 原子知识点抽取
   - Claim Extraction
   - 证据来源记录
   - 可信度和验证状态标注
   - 矛盾和不确定性识别
3. Knowledge Architect
   - 概念抽取
   - 知识去重
   - 概念体系构建
   - 知识关系构建
   - 知识图谱生成
   - 知识缺口识别
4. Curriculum Designer
   - 学习目标设计
   - 前置知识分析
   - 课程路线设计
   - 教学顺序规划
   - 课程大纲生成
5. Story Architect
   - 教学叙事设计
   - 问题驱动设计
   - 知识点之间的因果关系
   - 直观模型设计
   - 章节衔接设计
6. Lesson Writer
   - 教材章节编写
   - 原理解释
   - 数学推导
   - 技术案例
   - 图解和示例
7. Practice Designer
   - 编写可运行 Demo
   - 创建实验教程
   - 设计代码练习
   - 设计知识测验
   - 提供答案和解析
8. Knowledge Reviewer
   - 事实准确性审核
   - 引用完整性审核
   - 知识连贯性审核
   - 教学质量审核
   - 实践可操作性审核

每个 Agent 必须有明确职责、输入、输出和工作边界。

不要为了使用多 Agent 而过度拆分简单任务。

## 五、Skills 体系

设计以下十个独立 Skills：

1. source-ingestion
2. deep-research
3. evidence-extraction
4. knowledge-architecture
5. curriculum-design
6. story-design
7. lesson-authoring
8. practice-generator
9. learning-review
10. knowledge-publisher

每个 Skill 至少包含：

- SKILL.md
- 任务适用场景
- 输入要求
- 执行步骤
- 输出格式
- 质量标准
- 异常处理
- 必要的 references
- 必要的 templates
- 可以自动化的 scripts

采用渐进式上下文加载。

不要把所有知识、规则和提示词塞进单个 SKILL.md。

让 Skill 保持独立、可复用，并尽量避免绑定某一个特定 AI 客户端。

## 六、MCP 和 Tool 体系

根据实际环境选择：

优先接入：

- Filesystem
- GitHub
- Web Search / Fetch
- 学术文献检索
- Context7
- Playwright

同时建立本地确定性工具：

- Markdown Parser
- Frontmatter Validator
- Citation Validator
- Link Checker
- Anchor Checker
- Knowledge Graph Builder
- Curriculum Validator
- Website Builder
- Website Tester

原则：

1. MCP 负责外部数据和服务接入。
2. Skill 负责规定任务的执行方式。
3. Agent 负责专业判断和工作执行。
4. Tool / Script 负责确定性操作。
5. Orchestrator 负责流程调度和状态管理。

先检查实际可用的 MCP 和工具，不要假设某个服务已经安装。

没有可用 MCP 时，设计可替换的接口或 CLI 适配方案，不得伪造执行结果。

优先采用本地文件和 Git 管理知识，初期不必部署复杂数据库。

## 七、最重要的要求：教学设计

这是整个项目的核心。

禁止简单地将研究报告分类、合并和重新命名后作为教材。

必须建立独立的教学设计流程。

采用以下理念：

- Backward Design
- Problem-Based Learning
- Project-Based Learning
- Retrieval Practice
- Scaffolding
- Narrative Learning

每本教材必须从学习成果出发，而不是从已有资料目录出发。

### 课程设计要求

每个课程首先定义：

- 适合的学习者
- 学习前提
- 最终学习目标
- 学习完成后的能力
- 课程知识范围
- 课程学习路线
- 课程实践项目
- 考核方式

然后设计篇章和章节。

### 教学故事线要求

每一篇章需要有一个核心学习问题。

每一章必须明确：

1. 为什么要学习这个知识？
2. 真实的问题是什么？
3. 本章需要掌握什么？
4. 需要哪些前置知识？
5. 如何建立直观理解？
6. 如何解释真实技术原理？
7. 如何进行必要的数学推导？
8. 如何用具体案例解释？
9. 工程实践中如何使用？
10. 常见错误和误区是什么？
11. 如何验证是否真正理解？
12. 下一章为什么值得继续学习？

必须注意知识之间的逻辑关系和认知负担。

不要机械套用统一模板。不同类型的课程可以使用不同的教学结构。

### 教材写作标准

教材要有：

- 清晰的章节主题
- 问题驱动的开篇
- 循序渐进的知识解释
- 形象但准确的类比
- 技术图解
- 数学公式
- 实际代码
- 工程案例
- 常见误区
- 章节总结
- 主动回忆练习
- 知识检测
- 下一章衔接

技术结论必须能够追溯到知识库中的原始来源或证据。

不能为了故事性牺牲技术准确性。

## 八、数据结构和项目目录

在保留原有知识库目录的基础上，新增：

research/

- sources/
- reports/
- claim-ledger/

knowledge-model/

- concepts/
- relations/
- knowledge-graph.yaml
- taxonomy.yaml

courses/

- video-rendering-journey/
  - course.yaml
  - curriculum.md
  - lessons/
  - labs/
  - quizzes/
  - assets/

skills/

- source-ingestion/
- deep-research/
- evidence-extraction/
- knowledge-architecture/
- curriculum-design/
- story-design/
- lesson-authoring/
- practice-generator/
- learning-review/
- knowledge-publisher/

scripts/

- ingest/
- validate/
- graph/
- publish/

网站相关目录根据最终技术方案设计。

以上是目标结构，不意味着必须一次性创建所有空文件。

必须建立规范的 YAML / JSON / Markdown Schema，明确各类数据的字段和关系。

同一个知识点应有稳定 ID，方便被不同教材引用。

教材应该能够追溯到对应的知识点和来源。

## 九、网页系统

优先评估 VitePress，采用稳定版本。

但先检查现有仓库和实际开发环境，再做最终决定。

网页必须支持三种主要阅读模式：

### A. 系统学习

- 课程目录
- 篇章导航
- 章节阅读
- 前置知识提示
- 阅读进度
- 章节衔接
- 自我检测

### B. 知识探索

- 知识图谱
- 概念搜索
- 知识关联
- 相关研究报告
- 证据来源跳转

### C. 实践实验

- 代码示例
- Demo
- 技术原理演示
- 交互式图解
- 实验说明
- 练习题

特别关注图解和交互式技术演示。

例如：

- 视频播放完整链路
- YUV 转 RGB
- Stride 模拟器
- PTS/DTS 时间轴
- GPU Pipeline
- Shader Playground
- RenderGraph

交互组件必须可以实际运行，不能只展示一张静态截图来冒充功能。

## 十、质量审核系统

建立可执行的教材质量评价标准。

| 维度       | 权重 |
| ---------- | ---- |
| 事实准确性 | 25   |
| 知识连贯性 | 25   |
| 教学体验   | 20   |
| 实践能力   | 20   |
| 阅读体验   | 10   |

建议发布条件：

- 总分不低于 85。
- 事实准确性不低于 80%。
- 知识连贯性不低于 80%。
- 不存在未经说明的关键事实错误。
- 引用完整。
- 必要的 Demo 和实验通过测试。
- 网站构建成功。

这是项目内部验收标准，不是通用教育行业标准。

必须建立自动化验证与人工审核结合的机制。

其中：

- 事实正确性与教学易懂性分别审核。
- AI 生成的分数必须附有具体证据和问题清单。
- 审核不通过必须能够返回对应阶段进行修订。
- 不能单纯由生成内容的 Agent 自己宣布审核通过。

## 十一、实施计划

请严格采用分阶段方式实施。

不要一开始就开发全部功能。

### Phase 0：项目审计与架构设计

首先检查：

1. 仓库完整目录和文件。
2. README 和现有知识体系。
3. 学习路径、知识缺口和验真机制。
4. archive 中的历史资料。
5. 是否已有自动化脚本。
6. 现有网站和工具配置。
7. 当前 Git 工作区和分支状态。

形成：

- PROJECT_AUDIT.md
- ARCHITECTURE.md
- IMPLEMENTATION_PLAN.md
- DECISIONS.md

明确哪些内容可以复用，哪些需要补充，哪些不应该修改。

完成审计后直接进入第一阶段，不要只停留在方案讨论。

### Phase 1：建立第一个教学生产闭环

这是第一个最高优先级目标。

使用现有知识库的：

- 01-基础理论/音视频基础理论.md
- 02-解码与播放链路/解码与播放链路.md
- 03-图形与GPU工程/图形与GPU工程.md

建立试验课程：

《一帧视频如何从文件抵达屏幕》

首先生成：

1. Course Blueprint
2. Curriculum
3. Knowledge Dependency
4. Teaching Blueprint
5. Lesson Templates
6. 3～5 篇完整教材样章
7. Practice / Quiz 示例
8. Learning Review 报告

重点验证教学设计是否有效。

必须真正生成有完整教学过程的教材，而不是只建立空目录和模板。

完成后生成一个阶段验收报告。

### Phase 2：建立知识生产工作流

逐步实现：

- Source Ingestion
- Research Agent
- Evidence Analyst
- Knowledge Architect
- Knowledge Graph
- Claim Ledger
- Knowledge Gap Analysis
- Citation Validation

实现原始知识资料进入系统之后，可以生成经过整理和验证的知识模型。

### Phase 3：建立完整教材生产及发布系统

实现：

- Curriculum Designer
- Story Architect
- Lesson Writer
- Practice Designer
- Knowledge Reviewer
- Publishing Agent

使用 VitePress 或审核后确定的方案构建网站。

实现课程阅读、知识探索和实践实验三种模式。

### Phase 4：持续学习和自动更新

实现：

- 新知识发现
- 资料变更追踪
- 证据失效识别
- 教材受影响章节识别
- 课程质量跟踪
- 知识缺口更新
- 学习反馈收集

最终形成可长期运行的 Personal Learning Engine。

## 十二、工程执行规则

非常重要：

1. 不要重写现有全部知识库。
2. 不要直接覆盖已有主文档。
3. archive 永远作为只读历史资料。
4. 保留现有知识结构、相对链接和验真机制。
5. 新增系统尽量通过引用与原有知识建立关系。
6. 避免重复存储、重复生成。
7. 不要创建大量没有实际用途的空文件。
8. 不要为了架构完整引入没有必要的框架和数据库。
9. 不要将所有工作交给一个超级 Agent。
10. 不允许将未经核查的 AI 生成内容直接标为已验证。
11. 不允许自动删除旧资料。
12. 不允许未经人工授权直接发布到远程网站。
13. 所有关键决策应记录在 DECISIONS.md。
14. 重要阶段必须有实际文件、运行结果和验收报告。
15. 尽量实现可重复执行、断点恢复和失败重试。
16. 新增自动化工具需要测试。
17. 使用 Git 工作分支保护现有主分支。
18. 不得在未检查的情况下覆盖用户已有修改。

遇到非关键技术决策，不要反复询问，采用合理默认值并记录原因。

遇到可能造成数据丢失、删除文件、远程推送、发布或不可逆变更的操作，必须先取得授权。

如果某项 MCP 或外部工具不可用，说明实际限制，并提供可运行的替代方案。

不要声称执行了没有真正执行的任务。

## 十三、每个阶段的交付标准

每完成一个 Phase，必须提供：

1. 本阶段完成的功能。
2. 新增和修改的文件。
3. 当前架构变化。
4. 实际运行方式。
5. 测试及验证结果。
6. 尚未完成的事项。
7. 已知问题和风险。
8. 下一阶段任务。

必须维护：

- IMPLEMENTATION_PLAN.md
- WORKFLOW_STATE.md
- DECISIONS.md
- CHANGELOG.md

WORKFLOW_STATE.md 用于记录当前阶段、完成状态、待处理任务、审核关卡和恢复位置。

不要在项目尚未真正实现时，提前把状态标记为完成。

## 十四、现在开始执行

现在开始 Phase 0。

首先检查当前仓库的真实状态，阅读现有资料，理解当前知识体系。

然后制定具体实施计划。

在完成审计后，立即开始 Phase 1，建立第一个真正可用的教学生产闭环。

不要只给我架构建议、流程图、空目录或大量 TODO。

优先交付可运行的实际成果。

Phase 1 完成后，继续按照后续阶段推进，保留明确的人类审核关卡。

**最终目标不是搭建一个会生成 Markdown 的 AI 工具，而是建立一个能够持续将原始资料转化为可信知识、系统教材、实践教程和交互式学习网站的完整 AI Knowledge-to-Learning Engine。**

## **使用建议**

**推荐执行方式**

1. 将 `Render_Notes` 克隆到本地，并在 AI 编程工具中打开仓库根目录。
2. 确保 Agent 能读取和修改本地文件，并能够执行终端命令。
3. 将上面的完整提示词发给 Agent。
4. 允许它先审计，再开始 Phase 1。

我特别建议你第一次执行时，**重点验收 Phase 1，而不是先追求十个 Skills 全部完成。**