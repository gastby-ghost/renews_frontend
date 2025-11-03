# Document Generate 文档生成系统架构与功能说明

## 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [核心功能](#核心功能)
- [API设计](#api设计)
- [代码结构](#代码结构)
- [优化说明](#优化说明)
- [最佳实践](#最佳实践)

---

## 系统概述

Document Generate 是一个基于 Vue 3 + TypeScript 的 AI 驱动文档生成系统，支持从研究简报到完整文档的自动化生成流程。系统采用 5 步工作流：需求 → 标题 → 大纲 → 正文 → 完成。

### 核心特性

- ✅ **5步智能工作流**：引导用户完成完整的文档生成
- ✅ **AI 驱动生成**：集成 Scope Agent、Title Agent、Outline Agent
- ✅ **异步任务管理**：支持后台任务执行和状态轮询
- ✅ **实时状态同步**：Store + Composables 统一状态管理
- ✅ **Mock/真实 API切换**：支持开发环境快速迭代
- ✅ **类型安全**：完整的 TypeScript 类型定义

---

## 架构设计

### 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        表示层 (UI Layer)                        │
├─────────────────────────────────────────────────────────────┤
│  Views (页面)  │  Components (组件)  │  Composables (组合式)  │
├─────────────────────────────────────────────────────────────┤
│                     状态管理层 (Store Layer)                    │
├─────────────────────────────────────────────────────────────┤
│                 业务逻辑层 (Business Logic Layer)                │
├─────────────────────────────────────────────────────────────┤
│                   服务层 (Service Layer)                      │
├─────────────────────────────────────────────────────────────┤
│                   数据访问层 (Data Access Layer)                │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向

```
用户操作 → View组件 → Composables → Store → Services → API
                    ↓
                UI状态更新 (响应式)
```

### 核心模块

#### 1. 页面层 (Views)

- `topic-selection/` - 选题策划页面（合并需求定义和标题选择）
- `outline/` - 大纲编辑页面
- `content/` - 正文编辑页面

> 📝 **注意**：原 `requirements/` 和 `title/` 页面已合并为 `topic-selection/`

#### 2. 组合式函数 (Composables)

- `useDocumentGenerate` - 统一工作流管理
- `useOutlineGeneration` - 大纲生成专用逻辑

> 📝 **注意**：原 `useRequirements` 和 `useTitleGeneration` 已被移除，功能合并到新的 `topic-selection` 页面中

#### 3. 状态管理 (Store)

- `documentGenerateStore` - 全局文档生成状态
- 项目管理、任务状态、生成结果持久化

#### 4. 服务层 (Services)

- `documentGenerateService` - 统一 API 服务
- 继承 BaseApiService，支持 Mock/真实 API 切换

---

## 核心功能

### 1. Scope Agent（范围分析）

**功能**：分析研究简报，确定文档范围和方向

**工作流程**：

1. 接收用户输入的研究简报
2. 异步启动 Scope Agent 分析任务
3. 后台轮询任务状态
4. 分析完成后提供范围建议

**API**：

- `POST /scope-agent/execute` - 执行分析
- `GET /scope-agent/status/{task_id}` - 查询状态
- `GET /scope-agent/tasks` - 任务列表
- `POST /scope-agent/cancel/{task_id}` - 取消任务

### 2. Title Agent（标题生成）

**功能**：基于研究简报和搜索数据，生成多个高质量标题选项

**工作流程**：

1. 验证输入数据完整性
2. 调用 AI 生成标题
3. 返回结构化标题列表
4. 用户选择心仪标题

**API**：

- `POST /title-agent/generate` - 生成标题
- `GET /title-agent/status` - 工具状态
- `POST /title-agent/validate` - 验证请求

**输出结构**：

```typescript
interface Title {
  title: string // 标题内容
  angle: string // 报道角度
  why_now: string // 时效性
  news_values: string[] // 新闻价值
  verifiability: string // 可验证性
  sources: string[] // 来源
  risk_notes: string // 风险提示
  feasibility: string // 可行性
}
```

### 3. Outline Agent（大纲生成）

**功能**：基于选中的标题和搜索数据，生成详细的文档大纲

**工作流程**：

1. 接收选中标题 + 研究简报 + 搜索数据
2. 生成结构化大纲
3. 支持大纲编辑和导出

**API**：

- `POST /outline-agent/generate` - 生成大纲
- `GET /outline-agent/status` - 工具状态
- `POST /outline-validate` - 验证请求

**输出结构**：

```typescript
interface OutlineSection {
  level: number // 层级 (1=一级标题)
  title: string // 章节标题
  content_direction: string // 内容方向
  data_requirements: string[] // 数据需求
  estimated_word_count?: number // 预估字数
  priority: 'high' | 'medium' | 'low' // 优先级
  sources: string[] // 支持来源
}
```

---

## API设计

### 统一 API 配置

```typescript
// src/config/api/modules/document-generate.ts
export const documentGenerateService: ApiEndpointConfig = {
  name: '文档生成服务',
  baseUrl: '/api/v1/ai/document-generate',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/document-generate',
  defaults: {
    timeout: 120000,  // AI服务需要更长超时
    retryCount: 2,
    enableCache: false
  },
  paths: {
    // Scope Agent
    '/scope-agent/execute': { ... },
    '/scope-agent/status/{task_id}': { ... },
    // Title Agent
    '/title-agent/generate': { ... },
    // Outline Agent
    '/outline-agent/generate': { ... }
  }
}
```

### 服务层实现

```typescript
// src/services/documentGenerateService.ts
class DocumentGenerateService extends BaseApiService {
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: ScopeAgentRequest
  ): Promise<ScopeAgentResponse>

  async generateTitles(
    request: TitleGenerationRequest
  ): Promise<TitleGenerationResponse>

  async generateOutline(
    request: OutlineGenerationRequest
  ): Promise<OutlineGenerationResponse>

  // 完整工作流执行
  async executeDocumentWorkflow(...): Promise<{...}>
}
```

---

## 代码结构

```
src/
├── composables/                    # 组合式函数
│   ├── useDocumentGenerate.ts      # 统一工作流管理
│   └── useOutlineGeneration.ts     # 大纲生成逻辑
├── services/
│   └── documentGenerateService.ts  # 文档生成服务
├── store/
│   └── modules/
│       └── documentGenerate.ts     # 状态管理
├── views/document-generation/
│   ├── topic-selection/            # 选题策划（需求+标题合并）
│   ├── outline/                    # 大纲编辑
│   └── content/                    # 正文编辑
├── config/api/modules/
│   └── document-generate.ts        # API配置
└── mock/data/document-generate/    # Mock数据
    └── index.ts
```

> 📝 **更新**：移除了 `useTitleGeneration.ts`，功能已整合到 `topic-selection` 页面中

### 关键文件说明

#### 1. useDocumentGenerate.ts

**职责**：统一管理工作流状态和跨页面逻辑 **特性**：

- 5步工作流状态管理
- Scope Agent 异步任务轮询
- 计算属性控制流程
- 页面导航逻辑

#### 2. topic-selection 页面

**职责**：统一的选题策划页面（需求定义 + 标题选择） **特性**：

- 标签页设计：需求定义、标题选择
- Scope Agent 异步任务轮询
- 标题生成进度追踪
- 关键词提取和管理
- 标题评分和建议
- 素材选择和关联
- AI简报编辑功能

#### 3. useOutlineGeneration.ts

**职责**：专注于大纲生成和编辑 **特性**：

- 大纲结构分析
- 章节编辑操作
- 验证和导出功能
- 统计信息计算

#### 4. documentGenerateStore.ts

**职责**：全局状态持久化和任务管理 **特性**：

- 项目列表管理
- 任务状态追踪
- 统计数据计算
- localStorage 持久化

---

## 优化说明

### 本次优化内容

#### ✅ 1. 统一状态管理

**问题**：页面组件直接使用 localStorage，违反分层架构 **解决**：

- 页面通过 Composables 和 Store 管理状态
- localStorage 仅作为持久化层
- 统一的 `documentGenerateStore` 管理全局状态

#### ✅ 2. Scope Agent 状态轮询

**问题**：缺少异步任务状态更新机制 **解决**：

- 添加 `pollScopeAgentStatus` 方法
- 3秒间隔自动轮询任务状态
- 任务完成后自动停止轮询

#### ✅ 3. Outline 类型修复

**问题**：页面使用错误的 OutlineSection 类型（含 subsections） **解决**：

- 使用 API 定义的 `OutlineSection` 类型
- 移除自定义 OutlineSubsection 接口
- 更新 UI 以适配 API 结构

#### ✅ 4. 组件状态同步

**问题**：localStorage 与 Store 数据不同步 **解决**：

- 所有页面数据先更新 Store
- Store 自动同步到 localStorage
- 页面加载时优先从 Store 获取

### 代码质量改进

#### TypeScript 类型安全

- ✅ 所有 API 响应和请求都有完整类型定义
- ✅ 组件 Props 和事件类型检查
- ✅ 严格模式避免 any 类型

#### 错误处理

- ✅ 统一错误捕获和用户提示
- ✅ API 失败降级到 Mock 数据
- ✅ 网络异常重试机制

#### 用户体验

- ✅ 生成进度实时显示
- ✅ 异步任务状态轮询
- ✅ 操作反馈及时提示
- ✅ 页面导航流畅引导

---

## 最佳实践

### 1. 状态管理

**推荐模式**：

```typescript
// ✅ 正确：通过 Store 管理全局状态
const documentStore = useDocumentGenerateStore()
const { currentDocument } = storeToRefs(documentStore)

// ❌ 错误：直接操作 localStorage
const data = localStorage.getItem('key')
```

### 2. API 调用

**推荐模式**：

```typescript
// ✅ 正确：通过 Service 层调用
const response = await documentGenerateService.generateTitles(request)

// ❌ 错误：直接使用 axios
const response = await axios.post('/api/...')
```

### 3. 组件通信

**推荐模式**：

```typescript
// ✅ 正确：使用统一页面管理
// topic-selection 页面内部整合了需求和标题的所有逻辑
const documentStore = useDocumentGenerateStore()
const { state } = documentStore

// ❌ 错误：跨页面状态传递
props: { data: Object },
emit: ['update-data']
```

### 4. 异步任务

**推荐模式**：

```typescript
// ✅ 正确：支持任务取消和状态轮询
const taskId = await executeTask()
pollTaskStatus(taskId) // 自动轮询

// ❌ 错误：不监听异步任务状态
await executeTask() // 不知道任务是否完成
```

### 5. 类型安全

**推荐模式**：

```typescript
// ✅ 正确：使用 API 定义类型
import type { TitleGenerationRequest } from '@/types/ai'
const request: TitleGenerationRequest = { ... }

// ❌ 错误：使用 any 类型
const request: any = { ... }
```

---

## 总结

Document Generate 系统通过清晰的分层架构、完善的类型定义和统一的异步任务管理，实现了高质量的 AI 文档生成功能。系统具备良好的可维护性和扩展性，为后续功能迭代奠定了坚实基础。

### 核心优势

1. **架构清晰**：分层设计，职责分明
2. **类型安全**：完整的 TypeScript 支持
3. **状态统一**：Store + Composables 统一管理
4. **异步友好**：轮询 + 进度反馈
5. **开发高效**：Mock 数据 + 热重载

### 后续可扩展方向

1. **内容生成 Agent**：基于大纲生成正文
2. **多文档管理**：支持项目级文档组织
3. **协作功能**：多用户实时编辑
4. **模板系统**：预定义文档模板
5. **导出功能**：PDF、Word 等多格式导出

---

_本文档最后更新：2025-10-26_
