# Document Generation 系统重构路线图

## 项目概述

本路线图旨在将当前的 document-generation 系统从混乱的架构重构为清晰的 **Store-Composable-View** 三层架构，确保职责分离、提高代码可维护性，并为渐进式迁移提供详细指导。

## 架构原则

### 核心原则

1. **Store** - 仅负责状态存储和基础状态操作
2. **Composable** - 负责业务逻辑和数据处理，调用 Service
3. **View** - 负责 UI 展示和用户交互
4. **Service** - 负责 API 调用和数据访问（在 Composables 中使用）

### 约束条件

- 重构过程中系统必须持续可用
- 每次迭代必须保持向后兼容性
- 所有变更必须经过测试验证
- 采用渐进式重构策略，避免一次性大规模重构

## 重构范围

### 涉及模块

```
src/views/document-generation/
├── topic-selection/     # 选题策划阶段
├── outline/            # 大纲编辑阶段
└── content/            # 正文编辑阶段

src/composables/document/
├── useTopicSelection.ts
├── useOutlinePage.ts
└── useContent.ts

src/store/
├── documentGenerateStore.ts
├── outlineStore.ts
├── outlineSectionStore.ts
├── materialRelationStore.ts
├── materialBindStore.ts
├── projectStore.ts
└── ...

src/services/
├── core/               # 核心服务（数据库操作）
└── ai/                 # AI 服务（异步任务）
```

## 阶段一：准备工作 (1-2 天)

### 任务 1.1: 建立重构分支和环境

- [ ] 创建专门的 refactor 分支
- [ ] 设置持续集成测试环境
- [ ] 建立代码覆盖率基准
- [ ] 创建重构验收标准文档

### 任务 1.2: 完善类型定义

- [ ] 审核并完善 @/types/ai/ 下的所有类型定义
- [ ] 审核并完善 @/types/core/ 下的所有类型定义
- [ ] 确保类型定义与 Service 方法签名一致
- [ ] 添加缺失的类型守卫 (type guards)

### 任务 1.3: 建立工具和辅助函数

- [ ] 创建 Store 状态验证工具
- [ ] 创建 Composable 测试工具
- [ ] 建立 Service 模拟和测试工具
- [ ] 创建数据流追踪工具

**交付物:**

- `refactoring-checklist.md` - 重构检查清单
- `type-definitions-audit.md` - 类型定义审计报告
- `testing-strategy.md` - 测试策略文档

## 阶段二：Store 层重构 (3-4 天)

### 任务 2.1: 拆分 Store 职责

基于功能边界，将现有 Store 拆分为：

#### 2.1.1: 项目状态 Store

- [ ] `projectStore` - 仅存储项目元数据
  - 项目ID、名称、创建时间
  - 项目配置和偏好设置
  - 不包含任何业务逻辑

#### 2.1.2: 文档生成状态 Store

- [ ] `documentGenerateStore` - 存储文档生成流程状态
  - 当前阶段（topic-selection/outline/content）
  - 流程进度和状态
  - 不包含具体业务数据

#### 2.1.3: 大纲相关 Store

- [ ] `outlineStore` - 存储大纲数据结构
  - 大纲ID、标题、状态
  - 大纲版本信息
- [ ] `outlineSectionStore` - 存储章节数据
  - 章节列表、层级关系
  - 章节内容摘要
- [ ] `outlineSectionEditStore` - 临时编辑状态
  - 当前编辑的章节
  - 编辑历史和撤销栈
  - **注意：仅临时状态，不持久化**

#### 2.1.4: 素材相关 Store

- [ ] `materialStore` - 存储素材库数据
  - 素材列表、分类、标签
- [ ] `materialRelationStore` - 存储素材绑定关系
  - 章节-素材关联
  - 绑定类型和评分
- [ ] `materialSelectionStore` - 存储当前选择的素材
  - 当前页面选中的素材ID列表
  - **注意：仅UI状态，不持久化**

#### 2.1.5: AI 任务状态 Store

- [ ] `aiTaskStore` - 统一管理所有AI任务
  - 任务ID、状态、进度
  - 任务结果缓存
  - 任务错误信息
- [ ] `searchTaskStore` - 搜索任务专用状态
- [ ] `titleTaskStore` - 标题生成任务专用状态
- [ ] `scopeTaskStore` - 范围界定任务专用状态

#### 2.1.6: 编辑器状态 Store

- [ ] `editorStore` - 存储编辑器状态
  - 当前文档内容
  - 光标位置、选区
  - 编辑器配置
- [ ] `contentStatsStore` - 存储内容统计
  - 字数、段落数
  - 可读性评分
  - **注意：仅缓存数据，不计算逻辑**

### 任务 2.2: 清理 Store 业务逻辑

- [ ] 移除所有 Store 中的 API 调用
- [ ] 移除所有 Store 中的计算逻辑
- [ ] 移除所有 Store 中的副作用处理
- [ ] 统一 Store 状态持久化策略

### 任务 2.3: 建立 Store 规范

- [ ] 定义 Store 文件命名规范
- [ ] 定义 State 结构规范
- [ ] 定义 Getters 使用场景（仅数据转换）
- [ ] 定义 Actions 规范（仅状态更新）

**交付物:**

- `store-layer-plan.md` - Store 层重构详细方案
- 拆分的 Store 文件
- Store 测试用例

**验收标准:**

- [ ] 所有 Store 职责单一，无业务逻辑
- [ ] Store 间无循环依赖
- [ ] Store 测试覆盖率 > 80%
- [ ] 所有原有功能正常工作

## 阶段三：Composables 层重构 (4-5 天)

### 任务 3.1: 按领域拆分 Composables

#### 3.1.1: Topic Selection 领域

- [ ] `useTopicSelection` - 选题策划主逻辑
  - 需求表单处理
  - 流程控制
  - **职责：协调整个选题流程**
- [ ] `useScopeAgent` - 范围界定专用逻辑
  - 调用 scopeAgentService
  - 处理 AI 任务轮询
  - 同步结果到 Store
- [ ] `useSearchAgent` - 搜索代理专用逻辑
  - 调用 searchAgentService
  - 搜索结果处理
  - 素材筛选
- [ ] `useTitleGeneration` - 标题生成专用逻辑
  - 调用 titleGenerateService
  - 调用 search2titleAgentService
  - 标题选择和验证

#### 3.1.2: Outline 领域

- [ ] `useOutlinePage` - 大纲页面主逻辑
  - 大纲数据管理
  - 页面状态控制
- [ ] `useOutlineGeneration` - AI 大纲生成专用逻辑
  - 调用 outlineWithMaterialService
  - 处理生成任务
  - 错误处理和重试
- [ ] `useOutlineEditing` - 大纲编辑专用逻辑
  - 调用 outlineService
  - 调用 outlineSectionService
  - 章节 CRUD 操作
  - 拖拽排序
- [ ] `useMaterialBinding` - 素材绑定专用逻辑
  - 调用 materialBindService
  - 智能绑定流程
  - 绑定关系管理
- [ ] `useMaterialSelection` - 素材选择专用逻辑
  - UI 交互状态
  - 选择状态管理
  - 与 materialSelectionStore 交互

#### 3.1.3: Content 领域

- [ ] `useContent` - 正文编辑主逻辑
  - 编辑器状态管理
  - 内容变更处理
  - 实时大纲生成
- [ ] `useContentAI` - AI 辅助功能专用逻辑
  - 调用 contentGenerateService
  - 润色、扩写、总结等
  - AI 结果处理
- [ ] `useContentStats` - 统计功能专用逻辑
  - 计算文档统计信息
  - 分析可读性
  - 更新 contentStatsStore
- [ ] `useDocumentSync` - 文档同步专用逻辑
  - 调用 bodyService
  - 自动保存
  - 版本管理

### 任务 3.2: 建立 Composable 规范

- [ ] 定义 Composable 函数命名规范（use 前缀）
- [ ] 定义返回值结构规范
- [ ] 定义错误处理规范
- [ ] 定义生命周期管理规范
- [ ] 定义资源清理规范（onUnmounted）

### 任务 3.3: 依赖注入和组合

- [ ] 建立 Service 实例注入机制
- [ ] 建立 Composable 间通信机制
- [ ] 建立跨领域数据共享机制
- [ ] 优化 Composable 组合方式

**交付物:**

- `composables-layer-plan.md` - Composables 层重构详细方案
- 重构后的 Composable 文件
- Composable 测试用例

**验收标准:**

- [ ] 每个 Composable 职责单一
- [ ] 无跨层调用（不直接操作 Store）
- [ ] Composable 间耦合度 < 0.3
- [ ] 所有 AI 任务正常轮询
- [ ] 测试覆盖率 > 85%

## 阶段四：View 层优化 (2-3 天)

### 任务 4.1: 组件职责清晰化

- [ ] 移除所有组件中的业务逻辑
- [ ] 移除所有组件中的 API 调用
- [ ] 仅保留 UI 渲染和用户交互
- [ ] 建立组件 Props 和 Events 规范

### 任务 4.2: 组件拆分和复用

- [ ] 识别可复用的 UI 组件
- [ ] 拆分大型组件
- [ ] 建立组件库文档
- [ ] 统一组件样式

### 任务 4.3: 性能优化

- [ ] 优化组件渲染性能
- [ ] 实现虚拟滚动（如需要）
- [ ] 优化大数据列表
- [ ] 实现防抖和节流

**交付物:**

- `view-layer-plan.md` - View 层重构详细方案
- 优化的组件文件
- 性能测试报告

**验收标准:**

- [ ] 组件职责单一
- [ ] 无业务逻辑泄露
- [ ] 组件测试覆盖率 > 90%
- [ ] 渲染性能提升 20%+

## 阶段五：集成测试和优化 (2-3 天)

### 任务 5.1: 端到端测试

- [ ] 编写完整用户流程测试
- [ ] 测试所有三个阶段的数据流
- [ ] 测试 AI 任务全流程
- [ ] 测试错误场景和恢复

### 任务 5.2: 性能测试

- [ ] 测试页面加载时间
- [ ] 测试大数据量处理能力
- [ ] 测试内存使用情况
- [ ] 测试并发处理能力

### 任务 5.3: 代码质量检查

- [ ] 运行完整测试套件
- [ ] 检查代码覆盖率
- [ ] 运行 linting 和 formatting
- [ ] 检查类型安全性

### 任务 5.4: 文档更新

- [ ] 更新 API 文档
- [ ] 更新组件文档
- [ ] 更新开发指南
- [ ] 创建迁移指南

**交付物:**

- 完整的测试报告
- 性能基准报告
- 代码质量报告
- 更新的项目文档

## 阶段六：上线和监控 (1 天)

### 任务 6.1: 灰度发布

- [ ] 配置灰度发布规则
- [ ] 监控系统指标
- [ ] 收集用户反馈
- [ ] 逐步扩大范围

### 任务 6.2: 完整上线

- [ ] 合并到主分支
- [ ] 发布生产版本
- [ ] 监控系统稳定性
- [ ] 准备回滚方案

### 任务 6.3: 总结和复盘

- [ ] 收集重构过程中的经验
- [ ] 更新开发最佳实践
- [ ] 制定后续优化计划
- [ ] 团队知识分享

**交付物:**

- 生产环境部署
- 监控系统仪表板
- 重构总结报告

## 风险评估和应对

### 高风险项

1. **AI 任务轮询机制破坏**

   - 风险：重构过程中异步任务可能中断
   - 应对：先完善异步任务测试，再重构相关代码

2. **数据丢失**

   - 风险：状态迁移过程中数据不一致
   - 应对：建立数据备份和验证机制

3. **性能下降**
   - 风险：重构后性能可能受影响
   - 应对：建立性能基准，持续监控

### 中风险项

1. **测试覆盖不足**

   - 风险：隐藏的边界情况未被发现
   - 应对：增加集成测试和端到端测试

2. **团队学习成本**
   - 风险：新架构需要团队适应时间
   - 应对：提供培训和文档支持

## 成功标准

### 技术指标

- [ ] 代码可维护性提升 50%+
- [ ] 单元测试覆盖率 > 85%
- [ ] 集成测试覆盖所有关键流程
- [ ] 页面性能指标无明显下降
- [ ] 内存使用无明显增长

### 业务指标

- [ ] 所有原有功能正常工作
- [ ] AI 任务成功率无下降
- [ ] 用户操作流程无中断
- [ ] 错误率保持在现有水平

### 代码质量

- [ ] 无架构违规（Architectural lint rules）
- [ ] 类型安全性 100%
- [ ] 代码重复率 < 5%
- [ ] 复杂度指标在合理范围

## 时间表

| 阶段     | 时间         | 主要交付物             |
| -------- | ------------ | ---------------------- |
| 阶段一   | 1-2 天       | 准备工作完成           |
| 阶段二   | 3-4 天       | Store 层重构完成       |
| 阶段三   | 4-5 天       | Composables 层重构完成 |
| 阶段四   | 2-3 天       | View 层优化完成        |
| 阶段五   | 2-3 天       | 测试和优化完成         |
| 阶段六   | 1 天         | 上线和监控             |
| **总计** | **13-18 天** | **完整重构交付**       |

## 资源和依赖

### 人力资源

- 架构师：1 人（全程参与）
- 高级开发：2-3 人（主要执行）
- 测试工程师：1 人（测试支持）

### 工具和依赖

- 代码分析工具（ESLint + 自定义规则）
- 测试框架（Jest + Vue Test Utils）
- 性能监控工具（Chrome DevTools + Lighthouse）
- CI/CD 流水线（GitHub Actions）

### 外部依赖

- 后端 API 稳定性
- 第三方 AI 服务稳定性
- 浏览器兼容性

## 后续规划

### 短期优化（1-3 个月）

1. 建立代码质量门禁
2. 完善自动化测试
3. 建立性能监控体系
4. 优化开发工具链

### 中期演进（3-6 个月）

1. 引入组件库规范
2. 建立设计系统
3. 优化构建和部署流程
4. 完善文档体系

### 长期规划（6-12 个月）

1. 探索微前端架构
2. 引入状态机模式
3. 建立可视化配置系统
4. 实现智能化开发工具

## 结论

本重构路线图遵循渐进式重构原则，确保在重构过程中系统持续可用。通过清晰的职责分离和严格的测试验证，将显著提升代码质量和可维护性，为后续功能扩展打下坚实基础。

整个重构过程预计需要 13-18 个工作日，需要团队紧密协作和充分沟通。建议在重构前进行充分的准备工作，并建立完善的监控和回滚机制。
