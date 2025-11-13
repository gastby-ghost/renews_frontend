# Services 架构逐步优化方案

## 📊 当前问题分析

### 现状概况

| 文件                         | 行数   | 主要功能       | 问题                        |
| ---------------------------- | ------ | -------------- | --------------------------- |
| `documentGenerateService.ts` | 2009   | 文档生成全流程 | 巨型单体文件，包含10+业务域 |
| `projectService.ts`          | 745    | 项目管理       | 过大，职责混合              |
| `materialService.ts`         | 551    | 素材管理       | 中等大小                    |
| `searchService.ts`           | 471    | 搜索服务       | 中等大小                    |
| `bodyService.ts`             | 265    | 正文管理       | 合理范围                    |
| 其他服务                     | 46-375 | 各类服务       | 部分合理                    |

### 核心问题

1. **巨型单体文件**：`documentGenerateService.ts` 超过2000行，难以维护
2. **职责混合**：单个文件包含多个不相关的业务域（Scope Agent、Title Agent、Outline Agent、Material Bind等）
3. **Mock数据分散**：Mock代码与业务逻辑混合在同一个文件中
4. **结构不清晰**：服务结构与页面模块结构不对应，增加理解和维护成本

### 模块化拆分思路

根据 `src/views/document-generation/` 的模块结构：

```
src/views/document-generation/
├── project-list/     # 项目列表
├── topic-selection/  # 主题选择
├── outline/          # 大纲生成
└── content/          # 正文编辑
```

对应服务层应拆分为：

- `project-list` 服务：项目列表管理
- `topic-selection` 服务：主题选择和Scope Agent
- `outline` 服务：大纲生成和Title Agent
- `content` 服务：正文生成和Material Bind

每个模块内部再分为：

- `ai/` 目录：AI Agent相关服务
- `core/` 目录：核心业务逻辑服务

Mock数据统一在 `@src/mock/` 目录下管理。

## 🎯 优化目标

### 短期目标（1-2周）

- [ ] 大文件行数控制在300行以内
- [ ] Mock数据完全分离到@src/mock
- [ ] 按页面模块结构拆分服务
- [ ] AI服务与核心服务分离

### 长期目标（持续优化）

- [ ] 服务懒加载优化
- [ ] 性能监控和缓存
- [ ] 自动化测试覆盖
- [ ] 代码生成工具

## 🚀 逐步优化方案

### 阶段一：Mock数据分离（第1周）

**目标**：将Mock数据从业务逻辑中完全分离，迁移到@src/mock目录

#### 1.1 当前Mock数据分布分析

**documentGenerateService.ts中的Mock代码**：

- 研究简报Mock（约300行）
- 标题候选Mock（约300行）
- 标题版本Mock（约200行）
- 旧版AI服务Mock（AI Agent，约300行）
- 素材绑定Mock（约100行）

总计约1200行Mock代码与业务逻辑混合。

#### 1.2 Mock数据迁移方案

**迁移到@src/mock/data/对应模块**：

```
src/mock/data/
├── document-generate/     # 文档生成Mock
│   ├── agents/
│   │   ├── scope-agent.ts
│   │   ├── title-agent.ts
│   │   ├── outline-agent.ts
│   │   ├── search2title-agent.ts
│   │   └── material-bind.ts
│   ├── core/
│   │   ├── research-brief.ts
│   │   ├── title-candidate.ts
│   │   └── title-version.ts
│   └── index.ts          # 统一导出
├── project/              # 项目Mock（已存在）
├── material/             # 素材Mock（已存在）
├── search/               # 搜索Mock（已存在）
└── outline/              # 大纲Mock（已存在）
```

#### 1.3 重构示例

**Before**（Mock混合在服务中）:

```typescript
class DocumentGenerateService extends BaseApiService {
  async generateOutline(request): Promise<any> {
    if (this.isMockMode()) {
      // 200行Mock代码...
      return {
        outline: [...],
        sources: [...]
      }
    }
    return this.post('/outline-agent/generate', request)
  }
}
```

**After**（Mock数据在@src/mock中）:

```typescript
// src/mock/data/document-generate/agents/outline-agent.ts
export const generateOutlineMock = (request) => {
  return {
    outline: [...],
    sources: [...]
  }
}

// src/services/outline/ai/OutlineAgentService.ts
class OutlineAgentService extends BaseApiService {
  async generate(request): Promise<any> {
    return this.post('/outline-agent/generate', request)
  }

  protected async mockImplementation(config) {
    const { data } = config
    return generateOutlineMock(data)
  }
}
```

#### 1.4 实施步骤

```bash
# 步骤1：创建Agent Mock文件
touch src/mock/data/document-generate/agents/{scope-agent,title-agent,outline-agent,search2title-agent,material-bind}.ts

# 步骤2：创建Core Mock文件
touch src/mock/data/document-generate/core/{research-brief,title-candidate,title-version}.ts

# 步骤3：提取documentGenerateService.ts中的Mock代码
# 按模块分布到对应文件

# 步骤4：创建统一导出
# src/mock/data/document-generate/index.ts

# 步骤5：更新服务类引用Mock
# 在各服务中引用@src/mock中的Mock数据
```

#### 1.5 预期收益

- 业务逻辑文件减少60%（2009行 → 800行）
- Mock数据可复用性提升
- 测试更方便
- 符合架构分层原则

---

### 阶段二：按模块拆分服务（第2周）

**目标**：按照document-generation模块结构拆分服务

#### 2.1 拆分策略

**基于页面模块的服务拆分**：

```
src/services/
├── project-list/         # 项目列表服务
│   ├── index.ts
│   ├── ProjectListService.ts
│   └── types.ts
├── topic-selection/      # 主题选择服务
│   ├── index.ts
│   ├── ai/
│   │   ├── ScopeAgentService.ts
│   │   └── SearchAgentService.ts
│   ├── core/
│   │   └── TopicSelectionService.ts
│   └── types.ts
├── outline/              # 大纲服务
│   ├── index.ts
│   ├── ai/
│   │   ├── TitleAgentService.ts
│   │   ├── OutlineAgentService.ts
│   │   └── Search2TitleAgentService.ts
│   ├── core/
│   │   ├── OutlineGenerationService.ts
│   │   └── OutlineValidationService.ts
│   └── types.ts
└── content/              # 正文服务
    ├── index.ts
    ├── ai/
    │   ├── MaterialBindService.ts
    │   ├── BodyAgentService.ts
    │   └── AITextService.ts
    ├── core/
    │   ├── ContentGenerationService.ts
    │   └── MaterialService.ts
    └── types.ts
```

#### 2.2 拆分示例：TopicSelection模块

**topic-selection/ai/ScopeAgentService.ts**：

```typescript
import BaseApiService from '@/services/base/apiService'
import type { ScopeAgentRequest, ScopeAgentResponse } from '@/types/ai'

export class ScopeAgentService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  /**
   * 执行Scope Agent
   */
  async execute(
    userId: string,
    projectId: string,
    request: ScopeAgentRequest
  ): Promise<ScopeAgentResponse> {
    return this.post('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  /**
   * 获取任务状态
   */
  async getStatus(taskId: string) {
    return this.get(`/scope-agent/status/${taskId}`)
  }

  /**
   * 获取任务列表
   */
  async getTasks(userId: string, projectId?: string) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId
    return this.get('/scope-agent/tasks', params)
  }

  /**
   * 执行并轮询
   */
  async executeWithPolling(userId, projectId, request, pollingConfig) {
    const response = await this.execute(userId, projectId, request)
    const taskId = response.task_id

    const poller = new AsyncTaskPoller(
      () =>
        this.getStatus(taskId).then((result) => ({
          status: result.status,
          data: result,
          isCompleted: result.status === 'completed'
        })),
      {
        interval: 2000,
        timeout: 120000,
        maxAttempts: 60,
        ...pollingConfig
      }
    )

    return poller.start(`scope-agent-${taskId}`)
  }
}
```

**topic-selection/core/TopicSelectionService.ts**：

```typescript
import { ScopeAgentService } from './ai/ScopeAgentService'
import { SearchAgentService } from './ai/SearchAgentService'
import type { ApiRequestConfig } from '@/config/api/types'

export class TopicSelectionService {
  private scopeAgent: ScopeAgentService
  private searchAgent: SearchAgentService

  constructor() {
    this.scopeAgent = new ScopeAgentService()
    this.searchAgent = new SearchAgentService()
  }

  /**
   * 完整的主题选择流程
   */
  async executeTopicSelection(
    userId: string,
    projectId: string,
    brief: string,
    options?: ApiRequestConfig
  ) {
    // 1. 执行Scope Agent
    const scopeResult = await this.scopeAgent.execute(userId, projectId, { query: brief })

    // 2. 启动搜索（可选）
    const searchResult = await this.searchAgent.execute(userId, projectId, { brief })

    return {
      scope: scopeResult,
      search: searchResult
    }
  }

  /**
   * 只执行Scope Agent
   */
  async executeScopeOnly(userId: string, projectId: string, brief: string) {
    return this.scopeAgent.execute(userId, projectId, { query: brief })
  }
}
```

**topic-selection/index.ts**：

```typescript
export { ScopeAgentService } from './ai/ScopeAgentService'
export { SearchAgentService } from './ai/SearchAgentService'
export { TopicSelectionService } from './core/TopicSelectionService'

// 组合服务导出
import { TopicSelectionService } from './core/TopicSelectionService'

export const topicSelectionService = new TopicSelectionService()
export default topicSelectionService
```

#### 2.3 拆分示例：Outline模块

**outline/ai/TitleAgentService.ts**：

```typescript
import BaseApiService from '@/services/base/apiService'
import type { TitleGenerationRequest, TitleGenerationResponse } from '@/types/ai'

export class TitleAgentService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  /**
   * 生成标题
   */
  async generate(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
    return this.post('/title-agent/generate', request)
  }

  /**
   * 获取工具状态
   */
  async getToolsStatus() {
    return this.get('/title-agent/status')
  }

  /**
   * 验证请求
   */
  async validate(request: TitleGenerationRequest) {
    return this.post('/title-agent/validate', request)
  }
}
```

**outline/core/OutlineGenerationService.ts**：

```typescript
import { TitleAgentService } from '../ai/TitleAgentService'
import { OutlineAgentService } from '../ai/OutlineAgentService'
import { Search2TitleAgentService } from '../ai/Search2TitleAgentService'

export class OutlineGenerationService {
  private titleAgent: TitleAgentService
  private outlineAgent: OutlineAgentService
  private search2TitleAgent: Search2TitleAgentService

  constructor() {
    this.titleAgent = new TitleAgentService()
    this.outlineAgent = new OutlineAgentService()
    this.search2TitleAgent = new Search2TitleAgentService()
  }

  /**
   * 生成标题
   */
  async generateTitles(params: { researchBrief: string; webSearchData: any[] }) {
    return this.titleAgent.generate({
      research_brief: params.researchBrief,
      web_search_data: params.webSearchData
    })
  }

  /**
   * 生成大纲
   */
  async generateOutline(params: { title: any; researchBrief: string; webSearchData: any[] }) {
    return this.outlineAgent.generate({
      title: params.title,
      research_brief: params.researchBrief,
      web_search_data: params.webSearchData
    })
  }

  /**
   * Search2Title完整流程
   */
  async executeSearch2Title(userId: string, projectId: string, brief: string) {
    return this.search2TitleAgent.executeWithPolling(userId, projectId, { brief })
  }
}
```

#### 2.4 实施步骤

```bash
# 步骤1：创建四大模块目录
mkdir -p src/services/{project-list,topic-selection,outline,content}

# 步骤2：创建TopicSelection模块
mkdir -p src/services/topic-selection/{ai,core}
# 创建 ai/ScopeAgentService.ts, ai/SearchAgentService.ts
# 创建 core/TopicSelectionService.ts
# 创建 index.ts

# 步骤3：创建Outline模块
mkdir -p src/services/outline/{ai,core}
# 创建 ai/TitleAgentService.ts, ai/OutlineAgentService.ts, ai/Search2TitleAgentService.ts
# 创建 core/OutlineGenerationService.ts, core/OutlineValidationService.ts
# 创建 index.ts

# 步骤4：创建Content模块
mkdir -p src/services/content/{ai,core}
# 创建 ai/MaterialBindService.ts, ai/BodyAgentService.ts, ai/AITextService.ts
# 创建 core/ContentGenerationService.ts, core/MaterialService.ts
# 创建 index.ts

# 步骤5：更新主导出
# 修改 src/services/index.ts
```

#### 2.5 预期收益

- 单个文件行数控制在200-300行
- 服务结构与页面模块结构一致，易于理解
- AI服务与核心服务分离，职责清晰
- 按需引入，降低初始加载成本

---

### 阶段五：性能优化（持续进行）

**目标**：优化加载性能、运行性能、内存占用

#### 5.1 懒加载服务

```typescript
// src/services/lazy/index.ts
export const lazyServices = {
  topicSelection: () => import('../topic-selection/index.ts'),
  outline: () => import('../outline/index.ts'),
  content: () => import('../content/index.ts'),
  documentGenerationWorkflow: () => import('../workflows/DocumentGenerationWorkflow.ts')
}

export async function getTopicSelectionService() {
  const module = await lazyServices.topicSelection()
  return module.topicSelectionService
}

export async function getOutlineService() {
  const module = await lazyServices.outline()
  return module.outlineService
}

export async function getDocumentGenerationWorkflow() {
  const module = await lazyServices.documentGenerationWorkflow()
  return new module.DocumentGenerationWorkflow()
}
```

#### 5.2 服务缓存

```typescript
// src/services/core/ServiceCache.ts
export class ServiceCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5分钟

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }
}

export const serviceCache = new ServiceCache()
```

#### 5.3 性能监控

```typescript
// src/services/core/PerformanceMonitor.ts
export class PerformanceMonitor {
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`[Service] ${name} took ${end - start}ms`)
    return result
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return (async () => {
      const start = performance.now()
      const result = await fn()
      const end = performance.now()
      console.log(`[Service] ${name} took ${end - start}ms`)
      return result
    })()
  }
}
```

---

## 📋 实施计划

### 时间线

| 周次  | 任务         | 交付物                  | 验收标准      |
| ----- | ------------ | ----------------------- | ------------- |
| 第1周 | Mock数据分离 | Mock数据迁移到@src/mock | 大文件减少60% |
| 第2周 | 按模块拆分   | 四大模块服务拆分完成    | 单文件<300行  |
| 持续  | 性能优化     | 懒加载和缓存            | 首屏加载优化  |

### 里程碑

- [ ] **M1**：Mock数据完全分离（1周后）
- [ ] **M2**：四大模块拆分完成（2周后）
- [ ] **M3**：性能优化完成（持续）

### 风险与应对

| 风险     | 影响 | 应对策略                      |
| -------- | ---- | ----------------------------- |
| 拆分粒度 | 中   | 按页面模块对齐，粒度适中      |
| Mock迁移 | 低   | 统一在@src/mock管理，自动生成 |
| 性能回退 | 中   | 懒加载和缓存，性能监控        |
| 学习成本 | 低   | 提供文档和迁移指南            |

---

## 📝 更新日志

| 日期       | 版本 | 内容                                            | 作者     |
| ---------- | ---- | ----------------------------------------------- | -------- |
| 2025-11-13 | v1.0 | 初始版本：基于模块化拆分（简化版：移除阶段3-4） | 开发团队 |

---

**维护者**: 开发团队 **最后更新**: 2025-11-13
