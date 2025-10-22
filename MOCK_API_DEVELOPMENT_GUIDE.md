# Mock API 开发指南

本指南详细说明如何在开发过程中添加Mock API、创建Mock数据，以及有效利用Mock数据进行前端开发。

## 目录

1. [概述](#概述)
2. [架构说明](#架构说明)
3. [添加新的Mock API](#添加新的mock-api)
4. [创建Mock数据](#创建mock数据)
5. [在服务中使用Mock](#在服务中使用mock)
6. [Mock数据管理](#mock数据管理)
7. [最佳实践](#最佳实践)
8. [调试和测试](#调试和测试)
9. [常见问题](#常见问题)

## 概述

### 什么是Mock API？

Mock API是模拟真实API接口的假数据服务，它允许前端开发者在后端API还未完成时进行并行开发，提高开发效率。

### 为什么使用Mock API？

- **并行开发**：前后端可以同时开发，不受后端进度限制
- **稳定可靠**：Mock数据不会因为网络问题或服务器问题而失效
- **测试覆盖**：可以轻松测试各种边界情况和异常场景
- **演示展示**：在没有后端时也能展示完整功能

### 项目中的Mock架构

```
src/
├── mock/                    # Mock数据根目录
│   ├── index.ts            # Mock数据管理器
│   └── data/               # Mock数据文件
│       ├── ai/            # AI服务Mock数据
│       ├── material/      # 素材服务Mock数据
│       └── search/        # 搜索服务Mock数据
├── services/               # API服务层
│   └── base/
│       └── apiService.ts  # 基础API服务类
└── config/
    └── api/               # API配置
```

## 架构说明

### 核心组件

#### 1. MockDataManager

位置：[`src/mock/index.ts`](src/mock/index.ts:20)

负责统一管理所有Mock数据，提供缓存和数据获取功能。

```typescript
export class MockDataManager {
  // 获取Mock数据
  getMockData(key: string, ...args: any[]): any

  // 清除缓存
  clearCache(key?: string): void

  // 获取缓存统计
  getCacheStats(): { total: number; keys: string[] }
}
```

#### 2. BaseApiService

位置：[`src/services/base/apiService.ts`](src/services/base/apiService.ts:16)

提供统一的API调用接口，支持Mock/真实API切换。

```typescript
protected async mockImplementation?(config: ApiRequestConfig): Promise<any> {
  throw new Error(`Mock实现未定义: ${this.serviceName}`)
}
```

#### 3. API配置管理

位置：[`src/config/api/`](src/config/api/)

管理API端点配置和Mock模式切换。

## 添加新的Mock API

### 步骤1：定义API接口

首先在服务类中定义API方法。以添加新的AI功能为例：

```typescript
// src/services/aiService.ts
/**
 * 新的AI功能API
 */
async newAIFeature(
  request: {
    input: string
    options?: Record<string, any>
  },
  options?: ApiRequestConfig
) {
  return this.post<Api.Ai.NewFeatureResponse>('/new-feature', request, options)
}
```

### 步骤2：添加类型定义

在类型定义文件中添加相应的接口：

```typescript
// src/typings/api.d.ts
declare namespace Api {
  namespace Ai {
    interface NewFeatureRequest {
      input: string
      options?: Record<string, any>
    }

    interface NewFeatureResponse {
      success: boolean
      result: {
        output: string
        confidence: number
        metadata: Record<string, any>
      }
      execution_time: number
    }
  }
}
```

### 步骤3：创建Mock数据生成器

在对应的Mock数据文件中添加生成函数：

```typescript
// src/mock/data/ai/index.ts
/**
 * 生成新AI功能的Mock响应
 */
export function generateMockNewFeatureResponse(
  input: string,
  options?: Record<string, any>
): Api.Ai.NewFeatureResponse {
  return {
    success: true,
    result: {
      output: `AI处理结果：${input}`,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      metadata: {
        model: 'mock-ai-model',
        version: '1.0.0',
        processing_time: Math.random() * 1000 + 500,
        ...options
      }
    },
    execution_time: Math.random() * 2000 + 1000
  }
}
```

### 步骤4：注册Mock数据

在Mock数据管理器中注册新的Mock数据：

```typescript
// src/mock/index.ts
case 'ai-new-feature': {
  const { generateMockNewFeatureResponse } = require('./data/ai')
  data = generateMockNewFeatureResponse(args[0], args[1])
  break
}
```

### 步骤5：实现服务的Mock方法

在服务类的`mockImplementation`方法中添加对应的处理逻辑：

```typescript
// src/services/aiService.ts
protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
  const url = config.url
  const method = config.method

  // 新AI功能Mock
  if (method === 'POST' && url.includes('/new-feature')) {
    const requestData = config.data
    return mockDataManager.getMockData('ai-new-feature', requestData.input, requestData.options)
  }

  // ... 其他API的Mock处理
}
```

## 创建Mock数据

### Mock数据设计原则

1. **真实性**：Mock数据应该尽可能接近真实数据
2. **完整性**：包含所有必要的字段和类型
3. **多样性**：提供不同的数据变体和边界情况
4. **一致性**：保持数据间的逻辑一致性

### 数据生成策略

#### 1. 静态数据

适用于不变的基础数据：

```typescript
export const mockProviders = {
  tavily: {
    name: 'Tavily Search',
    description: 'AI-powered search engine',
    status: 'active'
  }
}
```

#### 2. 动态生成数据

适用于需要变化的数据：

```typescript
export function generateMockSearchResults(queries: string[], count: number = 10) {
  return Array.from({ length: count }, (_, index) => ({
    id: `result_${index}`,
    title: `搜索结果 ${index + 1}`,
    query: queries[Math.floor(Math.random() * queries.length)],
    score: Math.random(),
    timestamp: Date.now() - Math.random() * 86400000
  }))
}
```

#### 3. 参数化数据

根据输入参数生成相应的Mock数据：

```typescript
export function generateMockResponse(input: string, options?: any) {
  return {
    input,
    output: `处理结果：${input}`,
    options: options || {},
    timestamp: Date.now()
  }
}
```

### 数据类型匹配

确保Mock数据与API类型定义完全匹配：

```typescript
// 使用类型断言确保类型安全
export function generateMockTypedData(): Api.Ai.ExampleResponse {
  return {
    success: true,
    data: {
      // TypeScript会检查字段完整性
    }
  } as Api.Ai.ExampleResponse
}
```

## 在服务中使用Mock

### 启用Mock模式

```typescript
// 方法1：通过配置管理器
import { apiConfigManager } from '@/config/api'
apiConfigManager.setUseMock(true)

// 方法2：通过开发工具
window.dev.toggleMock()

// 方法3：通过环境变量
VITE_USE_MOCK = true
```

### 条件性Mock

某些方法可以特殊处理Mock逻辑：

```typescript
async getAccount(options?: ApiRequestConfig) {
  if (this.isMockMode()) {
    // 特殊的Mock逻辑
    return this.getMockAccountData()
  }

  // 真实API调用
  return this.get<Api.Auth.AccountResponse>('/account', undefined, options)
}
```

### Mock数据缓存

Mock数据管理器自动缓存数据，也可以手动控制：

```typescript
// 清除特定缓存
mockDataManager.clearCache('ai-search-tools')

// 清除所有缓存
mockDataManager.clearCache()

// 查看缓存状态
const stats = mockDataManager.getCacheStats()
console.log('缓存统计:', stats)
```

## Mock数据管理

### 文件组织结构

```
src/mock/data/
├── ai/                    # AI服务相关
│   ├── index.ts           # 导出所有AI Mock函数
│   ├── search.ts          # 搜索相关Mock
│   ├── agents.ts          # Agent相关Mock
│   └── generation.ts      # 生成类Mock
├── material/              # 素材服务相关
│   ├── index.ts
│   └── list.ts
└── search/                # 搜索服务相关
    ├── index.ts
    └── results.ts
```

### 命名规范

- **文件命名**：使用kebab-case，如 `search-tools.ts`
- **函数命名**：使用 `generateMock` + 功能名，如 `generateMockSearchToolsStatus`
- **数据键命名**：使用 `service-function` 格式，如 `ai-search-tools`

### 导出管理

每个模块的 `index.ts` 文件统一导出所有Mock函数：

```typescript
// src/mock/data/ai/index.ts
export * from './search'
export * from './agents'
export * from './generation'

// 或者具名导出
export { generateMockSearchToolsStatus, generateMockSearchToolsResponse } from './search'
```

## 最佳实践

### 1. 数据真实性

```typescript
// ❌ 不好的Mock数据
{
  title: '测试标题',
  content: '测试内容'
}

// ✅ 好的Mock数据
{
  title: '人工智能技术在医疗领域的应用前景分析',
  content: '近年来，人工智能技术在医疗诊断、药物研发、个性化治疗等方面取得了显著进展...',
  author: '张医生',
  publishDate: '2024-01-15',
  tags: ['人工智能', '医疗', '技术分析'],
  readTime: 8
}
```

### 2. 边界情况覆盖

```typescript
export function generateMockSearchResults(query: string, count: number = 10) {
  const results = []

  // 正常结果
  for (let i = 0; i < count - 2; i++) {
    results.push(createNormalResult(query, i))
  }

  // 边界情况：空结果
  if (Math.random() > 0.8) {
    results.push(createEmptyResult())
  }

  // 边界情况：错误结果
  if (Math.random() > 0.9) {
    results.push(createErrorResult())
  }

  return results
}
```

### 3. 性能优化

```typescript
// 使用缓存避免重复计算
const cachedData = new Map()

export function generateExpensiveData(params: string) {
  if (cachedData.has(params)) {
    return cachedData.get(params)
  }

  const data = performExpensiveGeneration(params)
  cachedData.set(params, data)
  return data
}
```

### 4. 类型安全

```typescript
// 使用泛型确保类型安全
export function generateMockData<T>(template: Partial<T>): T {
  return {
    // 提供默认值
    id: generateId(),
    timestamp: Date.now(),
    ...template
  } as T
}

// 使用时指定类型
const mockUser = generateMockData<Api.User>({
  name: '测试用户',
  email: 'test@example.com'
})
```

## 调试和测试

### 启用调试模式

```typescript
// 启用详细日志
apiConfigManager.setShowDebugInfo(true)

// 设置Mock延迟以模拟网络
apiConfigManager.setMockDelay(1000)
```

### 测试Mock功能

使用提供的测试脚本：

```typescript
// 运行完整测试
testAiMock()

// 测试特定功能
mockDataManager.getMockData('ai-search-tools-status')
```

### 调试技巧

1. **查看网络请求**：在浏览器开发者工具中查看Mock请求
2. **检查缓存状态**：`mockDataManager.getCacheStats()`
3. **验证数据格式**：确保Mock数据与API类型匹配
4. **测试边界情况**：验证异常和错误处理

## 常见问题

### Q: Mock数据不生效？

**A:** 检查以下几点：

1. 确认Mock模式已启用：`apiConfigManager.getConfig().useMock`
2. 检查服务是否实现了 `mockImplementation` 方法
3. 验证Mock数据键名是否正确注册

### Q: 如何处理分页数据？

```typescript
export function generateMockPaginatedData(page: number, pageSize: number, totalItems?: number) {
  const total = totalItems || 100
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)

  return {
    data: generateItems(startIndex, endIndex),
    pagination: {
      current: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
```

### Q: 如何模拟异步操作？

```typescript
protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 模拟随机失败
  if (Math.random() > 0.9) {
    throw new Error('模拟网络错误')
  }

  return mockDataManager.getMockData(getDataKey(config))
}
```

### Q: 如何处理复杂的嵌套数据？

```typescript
export function generateMockComplexData() {
  return {
    user: generateMockUser(),
    posts: Array.from({ length: 5 }, () => generateMockPost()),
    metadata: {
      version: '1.0.0',
      timestamp: Date.now(),
      features: generateMockFeatures()
    }
  }
}
```

### Q: 如何避免"require is not defined"错误？

**A:** 在现代前端项目中，应该使用ES6的`import`语法而不是`require`：

```typescript
// ❌ 错误：使用require
case 'ai-search-tools-status': {
  const { generateMockSearchToolsStatus } = require('./data/ai')
  data = generateMockSearchToolsStatus()
  break
}

// ✅ 正确：使用import
import { generateMockSearchToolsStatus } from './data/ai'

case 'ai-search-tools-status': {
  data = generateMockSearchToolsStatus()
  break
}
```

**最佳实践：**

- 在文件顶部统一导入所有需要的函数
- 避免在switch语句或条件语句中使用动态导入
- 使用ES6模块系统确保兼容性

## 总结

通过本指南，你应该能够：

1. 理解项目中的Mock架构和数据流
2. 正确添加新的Mock API和数据
3. 遵循最佳实践创建高质量的Mock数据
4. 有效利用Mock数据进行前端开发和测试
5. 调试和解决Mock相关的问题

合理使用Mock API可以显著提高开发效率，确保前后端开发的并行进行，同时提供稳定可靠的测试环境。
