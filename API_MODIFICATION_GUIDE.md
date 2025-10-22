# API 配置修改指南

本指南详细说明如何修改 `@src/config`、`@src/services` 和 `@src/typings` 目录以适配新的 API 或修改现有 API。

## 架构概述

本项目采用三层架构设计：

1. **配置层** (`@src/config/api/`) - API 端点配置
2. **服务层** (`@src/services/`) - 业务逻辑封装
3. **类型层** (`@src/typings/`) - TypeScript 类型定义

## 目录结构

```
src/
├── config/
│   └── api/
│       ├── index.ts          # 主 API 配置管理器
│       ├── types.ts          # API 相关类型定义
│       └── modules/          # API 模块配置
│           ├── index.ts      # 模块导出文件
│           ├── auth.ts       # 认证服务配置
│           ├── ai.ts         # AI 服务配置
│           └── ...
├── services/
│   ├── base/
│   │   └── apiService.ts     # 基础 API 服务类
│   ├── authService.ts        # 认证服务
│   ├── aiService.ts          # AI 服务
│   ├── materialService.ts    # 素材服务
│   └── index.ts              # 服务导出文件
└── typings/
    └── api.d.ts              # 全局 API 类型定义
```

## 第一步：添加 API 类型定义

### 1.1 在 `@src/typings/api.d.ts` 中添加命名空间

为您的服务添加新的命名空间：

```typescript
/** 您的服务类型 */
namespace YourService {
  /** 基础响应类型 */
  interface BaseResponse {
    success: boolean
    message?: string
    error?: string | null
  }

  /** 创建请求 */
  interface CreateRequest {
    name: string
    description?: string
  }

  /** 更新请求 */
  interface UpdateRequest {
    name?: string
    description?: string
  }

  /** 响应数据 */
  interface YourDataResponse {
    id: number
    name: string
    description: string
    created_at: string
    updated_at: string
  }

  /** 列表响应 */
  interface ListResponse {
    success: boolean
    message: string
    data: YourDataResponse[]
    total_count: number
    page: number
    page_size: number
    total_pages: number
  }

  /** 详情响应 */
  interface DetailResponse {
    success: boolean
    message: string
    data: YourDataResponse
  }
}

// 导出命名空间作为模块
export { Api }
```

## 第二步：创建 API 模块配置

### 2.1 创建新的模块文件

在 `@src/config/api/modules/` 目录下创建新的模块文件，例如 `your-service.ts`：

```typescript
/**
 * 您的服务模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const yourService: ApiEndpointConfig = {
  name: '您的服务',
  baseUrl: '/api/v1/your-service',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  enableMock: true,
  mockPath: '/mock/data/your-service',
  defaults: {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: false
  },
  paths: {
    // 获取列表
    '/items': {
      description: '获取数据列表',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          keywords: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    // 获取详情
    '/items/{id}': {
      description: '获取数据详情',
      methods: ['GET'],
      request: {
        requireAuth: true,
        pathParams: {
          id: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    // 创建数据
    '/items': {
      description: '创建新数据',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          name: 'string',
          description: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    // 更新数据
    '/items/{id}': {
      description: '更新数据',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        pathParams: {
          id: 'number'
        },
        params: {
          name: 'string',
          description: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    // 删除数据
    '/items/{id}': {
      description: '删除数据',
      methods: ['DELETE'],
      request: {
        requireAuth: true,
        pathParams: {
          id: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
```

### 2.2 更新模块索引文件

在 `@src/config/api/modules/index.ts` 中导入并导出您的新模块：

```typescript
import { yourService } from './your-service'

export const API_MODULES = {
  // ... 其他模块
  yourService: yourService
} as const

export {
  // ... 其他导出
  yourService
}
```

## 第三步：创建服务类

### 3.1 创建服务文件

在 `@src/services/` 目录下创建新的服务文件，例如 `yourService.ts`：

```typescript
/**
 * 您的服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'

// 您的服务相关类型
type YourDataResponse = Api.YourService.YourDataResponse
type ListResponse = Api.YourService.ListResponse
type DetailResponse = Api.YourService.DetailResponse
type CreateRequest = Api.YourService.CreateRequest
type UpdateRequest = Api.YourService.UpdateRequest

class YourService extends BaseApiService {
  constructor() {
    super('yourService') // 对应 API_MODULES 中的 key
  }

  /**
   * 获取数据列表
   */
  async getItems(
    params?: {
      page?: number
      page_size?: number
      keywords?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<ListResponse>('/items', params, options)
  }

  /**
   * 获取数据详情
   */
  async getItem(id: number, options?: ApiRequestConfig) {
    return this.get<DetailResponse>(`/items/${id}`, undefined, options)
  }

  /**
   * 创建数据
   */
  async createItem(data: CreateRequest, options?: ApiRequestConfig) {
    return this.post<DetailResponse>('/items', data, options)
  }

  /**
   * 更新数据
   */
  async updateItem(id: number, data: UpdateRequest, options?: ApiRequestConfig) {
    return this.put<DetailResponse>(`/items/${id}`, data, options)
  }

  /**
   * 删除数据
   */
  async deleteItem(id: number, options?: ApiRequestConfig) {
    return this.delete<DetailResponse>(`/items/${id}`, undefined, options)
  }
}

// 创建单例实例
export const yourService = new YourService()

export default yourService
```

### 3.2 更新服务索引文件

在 `@src/services/index.ts` 中导出您的新服务：

```typescript
export { authService } from './authService'
export { aiService } from './aiService'
export { materialApiService } from './materialService'
export { yourService } from './yourService'
```

## 第四步：使用服务

### 4.1 在组件中使用

```vue
<script setup lang="ts">
  import { yourService } from '@/services'
  import type { Api } from '@/typings/api'

  // 获取数据列表
  const loadItems = async () => {
    try {
      const response = await yourService.getItems({
        page: 1,
        page_size: 10,
        keywords: '搜索关键词'
      })

      if (response.success) {
        items.value = response.data
        totalCount.value = response.total_count
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    }
  }

  // 创建新数据
  const createItem = async () => {
    try {
      const requestData: Api.YourService.CreateRequest = {
        name: '新数据名称',
        description: '数据描述'
      }

      const response = await yourService.createItem(requestData)

      if (response.success) {
        console.log('创建成功:', response.data)
        // 刷新列表
        await loadItems()
      }
    } catch (error) {
      console.error('创建失败:', error)
    }
  }
</script>
```

## 最佳实践

### 1. 命名规范

- **API 模块**: 使用小写连字符命名，如 `user-management.ts`
- **服务类**: 使用 PascalCase，如 `UserManagementService`
- **类型**: 使用 PascalCase，如 `UserResponse`, `CreateUserRequest`
- **函数**: 使用 camelCase，如 `getUserList`, `createUser`

### 2. 类型安全

- 始终使用 TypeScript 类型
- 从 `Api` 命名空间导入类型
- 为所有请求和响应定义明确的类型

### 3. 错误处理

```typescript
async getItems(params?: ListParams, options?: ApiRequestConfig) {
  try {
    return await this.get<ListResponse>('/items', params, options)
  } catch (error) {
    console.error('获取列表失败:', error)
    throw error // 重新抛出错误供调用方处理
  }
}
```

### 4. 配置参数

- 使用 `ApiRequestConfig` 类型定义请求配置
- 支持请求超时、重试、缓存等配置
- 合理使用认证要求和参数验证

### 5. Mock 数据

- 始终启用 Mock 模式 (`enableMock: true`)
- 在 `@src/mock/data/` 目录下创建对应的 Mock 数据文件
- 确保 Mock 数据结构与真实 API 一致

## 高级配置

### 自定义请求配置

```typescript
// 在 API 模块配置中
paths: {
  '/special-endpoint': {
    description: '特殊端点',
    methods: ['POST'],
    request: {
      bodyType: 'json',
      requireAuth: true,
      timeout: 60000, // 自定义超时
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value'
      },
      retryCount: 3, // 自定义重试次数
      enableCache: true // 启用缓存
    },
    response: {
      dataType: 'object'
    }
  }
}
```

### 路径参数处理

```typescript
// API 配置
'/items/{id}/subitems/{subId}': {
  description: '获取子项',
  methods: ['GET'],
  request: {
    requireAuth: true,
    pathParams: {
      id: 'number',
      subId: 'number'
    }
  }
}

// 服务方法
async getSubItem(id: number, subId: number, options?: ApiRequestConfig) {
  return this.get<SubItemResponse>(`/items/${id}/subitems/${subId}`, undefined, options)
}
```

### 查询参数处理

```typescript
// 服务方法
async searchItems(
  params: {
    keyword?: string
    category?: string
    status?: 'active' | 'inactive'
    page?: number
    page_size?: number
  },
  options?: ApiRequestConfig
) {
  return this.get<SearchResponse>('/items/search', params, options)
}
```

## 常见问题解决

### 1. 类型未找到错误

**问题**: `Cannot find namespace 'Api'`

**解决**:

- 确保在 `@src/typings/api.d.ts` 中正确声明了命名空间
- 确保在服务文件中正确导入: `import type { Api } from '@/typings/api'`
- 确保在 `tsconfig.json` 中包含了类型文件

### 2. API 模块未找到错误

**问题**: `Module not found`

**解决**:

- 检查模块文件路径是否正确
- 确保在 `@src/config/api/modules/index.ts` 中正确导入和导出
- 检查 `API_MODULES` 对象中的 key 是否与服务构造函数中的名称匹配

### 3. Mock 数据不工作

**问题**: Mock 数据未生效

**解决**:

- 确保在 API 模块配置中启用了 `enableMock: true`
- 检查 Mock 文件路径是否正确
- 确保 Mock 数据结构正确
- 检查浏览器控制台是否有错误信息

### 4. 请求超时

**问题**: 请求超时

**解决**:

- 在 API 模块配置中增加 `timeout` 值
- 检查网络连接
- 检查服务器响应时间

### 5. 认证失败

**问题**: 401 认证失败

**解决**:

- 确保在 API 模块配置中设置了 `requireAuth: true`
- 检查 token 是否正确存储和发送
- 检查 token 是否过期

## 调试技巧

### 1. 使用开发工具

在浏览器控制台中使用全局开发工具：

```javascript
// 查看 API 配置
window.__DEV_TOOLS__.api.getConfig()

// 切换 Mock/真实 API 模式
window.__DEV_TOOLS__.api.toggleMock()

// 查看当前 API 模式
window.__DEV_TOOLS__.api.isMockMode()
```

### 2. 日志调试

在服务方法中添加日志：

```typescript
async getItems(params?: ListParams, options?: ApiRequestConfig) {
  console.log('获取列表参数:', params)
  const response = await this.get<ListResponse>('/items', params, options)
  console.log('获取列表响应:', response)
  return response
}
```

### 3. 网络调试

- 使用浏览器开发者工具的 Network 面板
- 检查请求 URL、参数、响应数据
- 查看 HTTP 状态码和错误信息

## 总结

通过遵循本指南，您可以：

1. **标准化 API 集成**: 所有 API 都遵循相同的模式和结构
2. **提高类型安全**: 充分利用 TypeScript 的类型系统
3. **简化维护**: 模块化的设计使得代码易于维护和扩展
4. **支持 Mock 开发**: 可以在后端 API 完成前进行前端开发
5. **灵活配置**: 支持各种请求配置和错误处理策略

记住始终遵循设计优先原则，先分析需求，再设计 API 结构，最后实现代码。这样可以确保代码的一致性和可维护性。
