# OpenAPI集成文档

## 📋 概述

本项目成功将 `core_openapi.json` 规范集成到现有的API配置系统中，采用模块化架构设计，确保代码的可维护性和可扩展性。

## 🏗️ 架构设计

### 模块化结构

```
src/config/api/modules/
├── auth.ts          # 用户认证模块
├── project.ts       # 项目管理模块
├── material.ts      # 素材管理模块
├── autosave.ts      # 自动保存模块
├── system.ts        # 系统管理模块
└── index.ts         # 模块导出文件
```

### 核心特性

1. **类型安全**: 所有API配置都使用TypeScript类型定义
2. **模块化设计**: 按业务功能划分模块，便于维护
3. **向后兼容**: 保留原有API配置，新增OpenAPI模块
4. **自动验证**: 提供配置验证功能
5. **Mock支持**: 每个模块都支持Mock数据

## 🔧 集成详情

### 1. 模块映射

| OpenAPI标签 | 模块文件    | 服务名称     | 基础路径     |
| ----------- | ----------- | ------------ | ------------ |
| 用户认证    | auth.ts     | 用户认证服务 | /api/v1/core |
| 项目管理    | project.ts  | 项目管理服务 | /api/v1/core |
| 素材管理    | material.ts | 素材管理服务 | /api/v1/core |
| 自动保存    | autosave.ts | 自动保存服务 | /api/v1/core |
| 系统管理    | system.ts   | 系统管理服务 | /api/v1/core |

### 2. 配置结构

每个模块都包含以下配置：

```typescript
interface ApiEndpointConfig {
  name: string // 服务名称
  baseUrl: string // 基础URL
  methods: HttpMethod[] // 支持的HTTP方法
  enableMock: boolean // 是否启用Mock
  mockPath: string // Mock数据路径
  defaults: {
    // 默认配置
    timeout: number
    headers: Record<string, string>
    retryCount: number
    enableCache: boolean
  }
  paths: Record<string, ApiPathConfig> // 路径配置
}
```

### 3. 路径配置

每个API路径包含：

```typescript
interface ApiPathConfig {
  description: string // 路径描述
  methods: HttpMethod[] // 支持的HTTP方法
  request?: {
    // 请求配置
    bodyType?: 'json' | 'form' | 'file'
    requireAuth?: boolean
    params?: Record<string, any>
    headers?: Record<string, string>
  }
  response?: {
    // 响应配置
    dataType?: string
    statusCode?: number
  }
  custom?: Record<string, any> // 自定义配置
}
```

## 🚀 使用方法

### 1. 基础使用

```typescript
import { apiConfigManager } from '@/config/api'

// 获取OpenAPI服务信息
const authService = apiConfigManager.getOpenApiServiceInfo('auth')
console.log(authService)

// 获取所有服务详细信息
const allServices = apiConfigManager.getAllServicesDetailedInfo()
console.log(allServices)
```

### 2. 验证配置

```typescript
// 验证OpenAPI模块配置
const validation = apiConfigManager.validateOpenApiModules()
if (!validation.isValid) {
  console.error('配置错误:', validation.errors)
}
```

### 3. 构建API URL

```typescript
// 构建完整的API URL
const url = apiConfigManager.buildApiUrl('auth', '/login')
console.log(url) // 输出: /api/v1/core/login
```

### 4. 检查方法支持

```typescript
// 检查路径是否支持指定的HTTP方法
const isSupported = apiConfigManager.isMethodSupported('material', '/materials', 'POST')
console.log(isSupported) // 输出: true
```

## 📊 统计信息

集成后的API系统包含：

- **模块数量**: 5个核心模块
- **API端点**: 50+个API路径
- **HTTP方法**: 支持GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS
- **Mock支持**: 所有模块均支持Mock数据
- **类型定义**: 完整的TypeScript类型支持

## 🔍 开发工具集成

### 调试信息

通过 `window.__DEV_TOOLS__` 可以访问：

```javascript
// 获取OpenAPI服务列表
window.__DEV_TOOLS__.getOpenApiServices()

// 获取详细的OpenAPI服务信息
window.__DEV_TOOLS__.getOpenApiServiceInfo('auth')

// 获取所有服务的详细信息
window.__DEV_TOOLS__.getAllServicesDetailedInfo()

// 验证OpenAPI模块配置
window.__DEV_TOOLS__.validateOpenApiModules()
```

### 快捷键支持

- `Ctrl/Cmd + Shift + D`: 切换调试模式
- `Ctrl/Cmd + Shift + V`: 验证配置
- `Ctrl/Cmd + Shift + C`: 清除Mock缓存

## 🛠️ 扩展开发

### 添加新的OpenAPI模块

1. 在 `src/config/api/modules/` 目录下创建新的模块文件
2. 定义 `ApiEndpointConfig` 配置
3. 在 `src/config/api/modules/index.ts` 中导出模块
4. 模块将自动集成到系统中

### 示例：添加新模块

```typescript
// src/config/api/modules/newModule.ts
import type { ApiEndpointConfig } from '../types'

export const newModuleService: ApiEndpointConfig = {
  name: '新模块服务',
  baseUrl: '/api/v1/new-module',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/new-module',
  defaults: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    '/endpoint': {
      description: '新端点',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'NewResponse'
      }
    }
  }
}
```

```typescript
// src/config/api/modules/index.ts
export const API_MODULES = {
  // 现有模块...
  newModule: newModuleService
} as const
```

## 📈 性能优化

### 缓存策略

- **服务配置缓存**: API配置在内存中缓存
- **路径配置缓存**: 路径配置按需缓存
- **Mock数据缓存**: Mock数据支持缓存机制

### 配置验证

- **启动时验证**: 系统启动时自动验证配置
- **运行时验证**: API调用时验证方法支持
- **手动验证**: 提供手动验证接口

## 🚨 注意事项

1. **路径冲突**: 确保新模块的路径不与现有路径冲突
2. **类型定义**: 所有配置必须使用正确的TypeScript类型
3. **Mock数据**: Mock数据路径需要与实际数据文件对应
4. **认证配置**: 正确配置 `requireAuth` 属性
5. **错误处理**: 完善的错误处理和验证机制

## 🔮 未来扩展

### 自动化工具

- **OpenAPI解析器**: 自动解析OpenAPI规范文件
- **代码生成器**: 自动生成API配置代码
- **类型生成器**: 自动生成TypeScript类型定义

### 监控功能

- **API使用统计**: 统计各模块API的使用情况
- **性能监控**: 监控API响应时间和错误率
- **健康检查**: 定期检查API服务的健康状态

## 📚 相关文档

- [API管理系统使用指南](./API_MANAGEMENT_README.md)
- [API配置类型定义](./src/config/api/types.ts)
- [基础API服务类](./src/services/base/apiService.ts)
- [Mock数据管理器](./src/mock/index.ts)

---

这个集成提供了一个完整的、类型安全的、模块化的API配置系统，基于OpenAPI规范构建，同时保持了与现有系统的向后兼容性。
