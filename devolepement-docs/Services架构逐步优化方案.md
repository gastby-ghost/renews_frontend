# Services 架构逐步优化方案

## 📊 当前现状评估

### 阶段1完成情况分析

#### ✅ 已完成成果

- **Mock数据已分离**：创建11个独立Mock文件，结构清晰
- **服务引用已更新**：documentGenerateService.ts 正确引用分离后的Mock函数
- **代码结构改善**：Mock实现与业务逻辑分离

#### ❌ 未达标问题

- **文件大小减少未达目标**：
  - 原始行数：2009行
  - 当前行数：1622行
  - 减少比例：**19.3%**（目标60%）
- **Mock分发逻辑仍在服务文件**：330行路由分发逻辑未移除
- **服务拆分尚未开始**：仍存在巨型单体文件
- **项目Service也需要优化**：745行，超过合理范围

#### 🎯 核心问题根因

1. **Mock分发逻辑冗余**：BaseApiService已提供Mock机制，但documentGenerateService仍使用自定义分发
2. **服务职责过度集中**：单个服务包含多个不相关的业务域
3. **结构不清晰**：服务结构与页面模块结构不对应

## 🚀 优化策略调整

### 策略1：Mock分发逻辑完全移除（优先级：最高）

**问题**：BaseApiService已提供统一Mock机制，但documentGenerateService仍有330行自定义分发逻辑

**解决方案**：采用配置驱动的Mock机制

```typescript
// 移除整个mockImplementation方法（330行）
// 改为配置驱动的Mock路由
const mockRoutes = {
  'POST:/scope-agent/execute': executeScopeAgentMock,
  'GET:/scope-agent/status/:taskId': getScopeAgentStatusMock
  // ... 其他路由映射
}
```

### 策略2：激进式服务拆分（优先级：高）

**原则**：彻底拆分单体服务，不考虑向后兼容性

**拆分目标**：

```typescript
// documentGenerateService拆分为4个独立服务：
- ScopeAgentService（~300行）
- TitleAgentService（~400行）
- OutlineAgentService（~500行）
- MaterialBindService（~400行）

// projectService拆分为3个服务：
- ProjectListService（~250行）
- ProjectDetailService（~250行）
- ProjectWorkflowService（~250行）
```

### 策略3：按页面模块重组（优先级：高）

**目标**：服务结构与页面结构完全对应

```typescript
src/services/
├── project-list/              # 项目列表页面服务
├── topic-selection/           # 主题选择页面服务
├── outline/                   # 大纲页面服务
└── content/                   # 正文页面服务
```

## 📋 修订后实施计划

### 阶段1.5：Mock分发逻辑清理（1-2天）

**目标**：真正达到阶段1的文件减少目标

#### 1.1 创建Mock路由配置

```typescript
// src/mock/data/document-generate/mock-routes.ts
import { executeScopeAgentMock, getScopeAgentStatusMock /* ... */ } from './agents'

export const mockRoutes = new Map([
  ['POST:/scope-agent/execute', executeScopeAgentMock],
  ['GET:/scope-agent/status/:taskId', getScopeAgentStatusMock],
  ['POST:/title-agent/generate', generateTitlesMock],
  ['GET:/title-agent/status', getTitleToolsStatusMock],
  ['POST:/outline-agent/generate', generateOutlineMock],
  ['GET:/outline-agent/status', getOutlineToolsStatusMock],
  ['POST:/ai/bind-materials', bindMaterialsWithAIMock],
  // ... 核心服务路由
  ['POST:/api/v1/core/projects/:projectId/briefs', createResearchBriefMock],
  ['GET:/api/v1/core/projects/:projectId/briefs', getProjectBriefsMock]
  // ... 其他路由
])
```

#### 1.2 扩展BaseApiService支持路由式Mock

```typescript
// src/services/base/apiService.ts 扩展
import { mockRoutes } from '@/mock/data/document-generate/mock-routes'

export abstract class BaseApiService {
  // 新增：统一Mock路由处理
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    // 尝试路由匹配
    const routeKey = this.buildRouteKey(config)
    const mockHandler = mockRoutes.get(routeKey)

    if (mockHandler) {
      return mockHandler(config)
    }

    // 默认Mock响应
    return {
      success: true,
      message: `Mock响应 - ${config.method} ${config.url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }

  private buildRouteKey(config: ApiRequestConfig): string {
    // 简化路由匹配逻辑，支持参数化路径
    let routeKey = `${config.method}:${config.url}`

    // 参数化路径匹配（示例）
    routeKey = routeKey.replace(/\/\d+/g, '/:id')
    routeKey = routeKey.replace(/\/tasks\/[^\/]+/g, '/tasks/:taskId')

    return routeKey
  }
}
```

#### 1.3 移除documentGenerateService的Mock逻辑

```typescript
// src/services/documentGenerateService.ts 清理
export class DocumentGenerateService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  // 移除整个mockImplementation方法（330行）
  // 保留纯业务方法

  async executeScopeAgent(userId: string, projectId: string, request: any) {
    return this.post('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  // ... 其他业务方法
}
```

**预期收益**：

- documentGenerateService: 1622行 → 1292行
- 总体减少：35.7%（接近阶段1目标）

### 阶段2：激进式服务拆分（3-4天）

**2.1 documentGenerateService拆分**

#### 创建目录结构

```bash
mkdir -p src/services/{topic-selection,outline,content}/{ai,core}
```

#### 拆分ScopeAgentService

```typescript
// src/services/topic-selection/ai/ScopeAgentService.ts
import BaseApiService from '@/services/base/apiService'
import { AsyncTaskPoller } from '@/utils/polling/asyncTaskPoller'

export class ScopeAgentService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  async execute(userId: string, projectId: string, request: any) {
    return this.post('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  async getStatus(taskId: string) {
    return this.get(`/scope-agent/status/${taskId}`)
  }

  async getTasks(userId: string, projectId?: string) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId
    return this.get('/scope-agent/tasks', params)
  }

  async executeWithPolling(userId: string, projectId: string, request: any, pollingConfig?: any) {
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

#### 拆分TitleAgentService

```typescript
// src/services/outline/ai/TitleAgentService.ts
import BaseApiService from '@/services/base/apiService'

export class TitleAgentService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  async generate(request: any) {
    return this.post('/title-agent/generate', request)
  }

  async getToolsStatus() {
    return this.get('/title-agent/status')
  }

  async validate(request: any) {
    return this.post('/title-agent/validate', request)
  }
}
```

#### 拆分OutlineAgentService

```typescript
// src/services/outline/ai/OutlineAgentService.ts
import BaseApiService from '@/services/base/apiService'

export class OutlineAgentService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  async generate(request: any) {
    return this.post('/outline-agent/generate', request)
  }

  async getToolsStatus() {
    return this.get('/outline-agent/status')
  }
}
```

#### 拆分MaterialBindService

```typescript
// src/services/content/ai/MaterialBindService.ts
import BaseApiService from '@/services/base/apiService'
import { AsyncTaskPoller } from '@/utils/polling/asyncTaskPoller'

export class MaterialBindService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  async execute(request: any) {
    return this.post('/ai/bind-materials', request)
  }

  async getStatus(taskId: string) {
    return this.get(`/material-bind/status/${taskId}`)
  }

  async bindWithAI(materials: any[], chapters: any[]) {
    return this.execute({
      materials,
      chapters,
      binding_strategy: 'ai_smart_match'
    })
  }

  async bindWithPolling(materials: any[], chapters: any[], pollingConfig?: any) {
    const response = await this.bindWithAI(materials, chapters)
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

    return poller.start(`material-bind-${taskId}`)
  }
}
```

#### 创建模块导出文件

```typescript
// src/services/topic-selection/index.ts
export { ScopeAgentService } from './ai/ScopeAgentService'
export const scopeAgentService = new ScopeAgentService()

// src/services/outline/index.ts
export { TitleAgentService } from './ai/TitleAgentService'
export { OutlineAgentService } from './ai/OutlineAgentService'
export const titleAgentService = new TitleAgentService()
export const outlineAgentService = new OutlineAgentService()

// src/services/content/index.ts
export { MaterialBindService } from './ai/MaterialBindService'
export const materialBindService = new MaterialBindService()
```

**2.2 projectService拆分**

#### 拆分ProjectListService

```typescript
// src/services/project-list/ProjectListService.ts
import BaseApiService from '@/services/base/apiService'

export class ProjectListService extends BaseApiService {
  constructor() {
    super('project')
  }

  async getProjects(params?: any) {
    return this.get('/projects', params)
  }

  async createProject(projectData: any) {
    return this.post('/projects', projectData)
  }

  async deleteProject(projectId: string) {
    return this.delete(`/projects/${projectId}`)
  }

  async duplicateProject(projectId: string, newName: string) {
    return this.post(`/projects/${projectId}/duplicate`, { name: newName })
  }
}
```

#### 拆分ProjectDetailService

```typescript
// src/services/project-list/ProjectDetailService.ts
import BaseApiService from '@/services/base/apiService'

export class ProjectDetailService extends BaseApiService {
  constructor() {
    super('project')
  }

  async getProject(projectId: string) {
    return this.get(`/projects/${projectId}`)
  }

  async updateProject(projectId: string, projectData: any) {
    return this.put(`/projects/${projectId}`, projectData)
  }

  async getProjectStats(projectId: string) {
    return this.get(`/projects/${projectId}/stats`)
  }

  async getProjectHistory(projectId: string) {
    return this.get(`/projects/${projectId}/history`)
  }
}
```

### 阶段2.5：按页面模块重组（1-2天）

**目标**：服务目录结构与页面模块完全对应

#### 重组目录结构

```typescript
src/services/
├── project-list/              # 项目列表页面服务
│   ├── index.ts
│   ├── ProjectListService.ts
│   └── ProjectDetailService.ts
├── topic-selection/           # 主题选择页面服务
│   ├── index.ts
│   ├── ai/
│   │   ├── ScopeAgentService.ts
│   │   └── SearchAgentService.ts
│   └── core/
│       └── TopicSelectionService.ts
├── outline/                   # 大纲页面服务
│   ├── index.ts
│   ├── ai/
│   │   ├── TitleAgentService.ts
│   │   ├── OutlineAgentService.ts
│   │   └── Search2TitleAgentService.ts
│   └── core/
│       ├── OutlineGenerationService.ts
│       └── OutlineValidationService.ts
└── content/                   # 正文页面服务
    ├── index.ts
    ├── ai/
    │   ├── MaterialBindService.ts
    │   └── BodyAgentService.ts
    └── core/
        ├── ContentGenerationService.ts
        └── MaterialService.ts
```

#### 更新组件导入

```typescript
// 更新所有Vue组件中的服务导入
// 从：
import documentGenerateService from '@/services/documentGenerateService'

// 改为：
import { scopeAgentService } from '@/services/topic-selection'
import { titleAgentService } from '@/services/outline'
import { materialBindService } from '@/services/content'
```

#### 删除旧服务文件

```bash
# 删除拆分完成后的旧文件
rm src/services/documentGenerateService.ts
rm src/services/projectService.ts
```

### 阶段3：性能优化（持续进行）

**3.1 服务懒加载**

```typescript
// src/services/lazy/index.ts
export const lazyServices = {
  topicSelection: () => import('../topic-selection/index.ts'),
  outline: () => import('../outline/index.ts'),
  content: () => import('../content/index.ts')
}

export async function getTopicSelectionService() {
  const module = await lazyServices.topicSelection()
  return module.scopeAgentService
}
```

**3.2 API缓存机制**

```typescript
// src/services/core/ServiceCache.ts
export class ServiceCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5分钟

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
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
}
```

**3.3 批量API优化**

```typescript
// src/services/core/BatchApiService.ts
export class BatchApiService extends BaseApiService {
  async batchRequests(requests: ApiRequestConfig[]) {
    return Promise.allSettled(requests.map((config) => this.request(config)))
  }

  async parallelRequests(requests: ApiRequestConfig[]) {
    return Promise.all(requests.map((config) => this.request(config)))
  }
}
```

## 🎯 修订后目标与验收标准

### 新目标设定

| 阶段 | 新目标             | 原目标   | 调整说明             |
| ---- | ------------------ | -------- | -------------------- |
| 1.5  | 文件减少35%+       | 60%      | Mock分发逻辑完全移除 |
| 2.0  | 最大文件<500行     | 300行    | 更实际的拆分目标     |
| 2.5  | 服务结构与页面对应 | 保持不变 | 提升可维护性         |
| 3.0  | 首屏加载优化20%    | 保持不变 | 性能优化             |

### 详细验收标准

#### 阶段1.5验收标准

- [ ] documentGenerateService行数<1300行
- [ ] Mock路由配置文件创建完成
- [ ] 所有Mock逻辑移至Mock路由
- [ ] 所有功能测试通过

#### 阶段2.0验收标准

- [ ] 最大服务文件行数<500行
- [ ] documentGenerateService完全拆分
- [ ] projectService完全拆分
- [ ] 新服务结构正常运行

#### 阶段2.5验收标准

- [ ] 服务目录与页面目录对应
- [ ] 所有组件导入更新完成
- [ ] 旧服务文件完全删除
- [ ] 代码review通过

#### 阶段3.0验收标准

- [ ] 懒加载机制实施
- [ ] 缓存机制运行
- [ ] 性能监控到位
- [ ] 首屏加载提升20%+

### 时间线调整

| 阶段 | 时间  | 主要工作         | 关键里程碑     |
| ---- | ----- | ---------------- | -------------- |
| 1.5  | 1-2天 | Mock分发逻辑清理 | 文件减少35%+   |
| 2.0  | 3-4天 | 激进式服务拆分   | 最大文件<500行 |
| 2.5  | 1-2天 | 按页面模块重组   | 目录结构对齐   |
| 3.0  | 持续  | 性能优化         | 加载提升20%+   |

## ⚠️ 风险控制

### 技术风险

1. **功能中断**：每个拆分步骤都要确保功能正常
2. **依赖管理**：理清服务间依赖关系
3. **类型定义**：TypeScript类型要及时更新

### 执行风险

1. **进度控制**：严格按照时间节点执行
2. **质量保证**：每个阶段都要有完整的测试
3. **团队协作**：及时同步进展和问题

## 📈 预期收益

### 短期收益（1周内）

- **代码可维护性提升70%+**：文件大小显著减少，职责更清晰
- **开发效率提升40%+**：服务拆分后，并行开发更容易
- **Mock管理规范化**：统一的Mock路由机制

### 中期收益（2-4周）

- **新功能开发效率提升50%+**：模块化结构，快速定位
- **代码review效率提升60%+**：文件小，逻辑清晰
- **系统稳定性增强**：模块隔离，问题影响范围小

### 长期收益（持续）

- **技术债务大幅降低**：架构清晰，易于扩展
- **团队协作效率提升**：模块化开发，冲突减少
- **系统可扩展性显著增强**：新功能易于集成

---

## 📝 更新日志

| 日期 | 版本 | 内容 | 作者 |
| --- | --- | --- | --- |
| 2025-11-13 | v2.0 | **重大修订**：基于阶段1完成情况，调整优化策略，移除向后兼容考虑，采用激进式拆分 | 开发团队 |
| 2025-11-13 | v1.0 | 初始版本：基于模块化拆分（简化版：移除阶段3-4） | 开发团队 |

---

**维护者**: 开发团队 **最后更新**: 2025-11-13

**核心理念**: 彻底的模块化重构，不考虑向后兼容，追求最佳架构实践
