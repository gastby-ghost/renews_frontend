# API管理系统使用指南

## 📋 概述

本项目实现了一个完整的API管理系统，支持集中管理所有API端口配置和Mock/真实API切换。系统提供了详细的API端点配置、HTTP方法验证、统一的请求处理接口，以及直观的开发工具界面。

## 🎯 核心功能

### 1. 集中化API配置管理

- **API注册表**：在 `src/config/api/index.ts` 中集中管理所有服务配置
- **详细端口配置**：每个服务包含详细的路径配置、HTTP方法支持、请求/响应参数等
- **类型安全**：完整的TypeScript类型定义，确保配置的类型安全

### 2. HTTP方法支持

- **方法验证**：自动验证API路径是否支持指定的HTTP方法
- **灵活配置**：每个路径可以独立配置支持的HTTP方法（GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS）
- **统一接口**：基础服务类提供统一的HTTP方法调用接口

### 3. Mock/真实API切换

- **一键切换**：通过浮动按钮快速切换Mock/真实API
- **状态显示**：实时显示当前API模式状态
- **配置管理**：可调整Mock延迟、调试信息等参数

## 📁 文件结构

```
src/config/api/
├── index.ts              # API配置管理器 + API注册表
├── types.ts              # 完整的类型定义
src/services/base/
├── apiService.ts         # 重构后的基础API服务类
src/services/
├── agentService.ts       # 重构后的Agent服务
├── materialApi.ts        # 重构后的素材API服务
├── materialSearch.ts     # 重构后的搜索服务
src/components/dev/
├── MockToggle.vue        # Mock切换浮动按钮
├── ApiConfigViewer.vue   # API配置查看器
src/utils/dev/
├── index.ts              # 开发工具初始化
src/mock/
├── index.ts              # Mock数据管理器
├── data/                 # Mock数据存储
```

## 🚀 快速开始

### 1. 基础API调用

```typescript
import { AgentService } from '@/services/agentService'

const agentService = new AgentService()

// 自动验证方法支持
const result = await agentService.get('/agents/list', { page: 1, page_size: 10 })

// 构建带参数的URL
const url = agentService.buildUrl('/agents/{id}', { id: '123' })
```

### 2. 查看API配置

```javascript
// 获取所有服务信息
const services = window.__DEV_TOOLS__.getAllServicesInfo()

// 获取特定服务配置
const config = window.__DEV_TOOLS__.getServiceInfo('material')

// 验证API配置
const result = window.__DEV_TOOLS__.validateConfig()
```

### 3. Mock/真实API切换

```javascript
// 切换Mock模式
window.__DEV_TOOLS__.toggleMock()

// 设置Mock延迟
window.__DEV_TOOLS__.setMockDelay(2000)

// 清除Mock缓存
window.__DEV_TOOLS__.clearMockCache()
```

## 🔧 API配置系统

### 1. 服务配置结构

```typescript
interface ServiceConfig {
  name: string // 服务名称
  baseUrl: string // 基础URL
  description?: string // 服务描述
  defaultHeaders?: Record<string, string> // 默认请求头
  timeout?: number // 超时时间(ms)
  retryCount?: number // 重试次数
  retryDelay?: number // 重试延迟(ms)
  cache?: {
    // 缓存配置
    enabled: boolean
    ttl?: number // 缓存时间(ms)
  }
  mock?: {
    // Mock配置
    enabled: boolean
    delay?: number // Mock延迟(ms)
    dataPath?: string // Mock数据路径
  }
  paths: Record<string, PathConfig> // 路径配置
}
```

### 2. 路径配置结构

```typescript
interface PathConfig {
  description?: string // 路径描述
  methods: HttpMethod[] // 支持的HTTP方法
  request?: {
    // 请求配置
    headers?: Record<string, string>
    params?: Record<string, any>
  }
  response?: {
    // 响应配置
    headers?: Record<string, string>
    status?: number
  }
  cache?: {
    // 路径级缓存配置
    enabled: boolean
    ttl?: number
  }
  mock?: {
    // 路径级Mock配置
    enabled: boolean
    delay?: number
    dataPath?: string
  }
}
```

### 3. 支持的HTTP方法

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
```

## 🎨 用户界面组件

### 1. MockToggle浮动按钮

- **位置**：右下角浮动按钮
- **功能**：一键切换Mock/真实API模式
- **状态显示**：显示当前API模式状态
- **展开面板**：显示详细配置信息

### 2. ApiConfigViewer配置查看器

- **配置概览**：显示全局配置状态
- **服务列表**：详细展示所有服务配置
- **路径详情**：查看每个路径的详细配置
- **配置验证**：验证配置正确性

## 🔮 开发工具

### 1. 全局调试方法

通过 `window.__DEV_TOOLS__` 访问：

```javascript
// API配置相关
window.__DEV_TOOLS__.getServiceInfo(serviceName)
window.__DEV_TOOLS__.getAllServicesInfo()
window.__DEV_TOOLS__.getApiRegistry()
window.__DEV_TOOLS__.validateConfig()
window.__DEV_TOOLS__.isMethodSupported(serviceName, path, method)
window.__DEV_TOOLS__.buildUrl(serviceName, path, params)

// Mock相关
window.__DEV_TOOLS__.toggleMock()
window.__DEV_TOOLS__.setMockDelay(delay)
window.__DEV_TOOLS__.clearMockCache(key)

// 配置管理
window.__DEV_TOOLS__.getConfig()
window.__DEV_TOOLS__.resetConfig()
window.__DEV_TOOLS__.getCacheStats()
```

### 2. 快捷键

- `Ctrl/Cmd + Shift + D`：切换调试模式
- `Ctrl/Cmd + Shift + C`：清除Mock缓存
- `Ctrl/Cmd + Shift + R`：重置配置
- `Ctrl/Cmd + Shift + V`：验证配置

### 3. 开发环境信息

```javascript
// 获取完整的开发环境信息
const devInfo = window.__DEV_TOOLS__.getDevInfo()
```

## 📊 API注册表示例

```typescript
// 素材API服务配置
{
  name: 'material',
  baseUrl: '/api/material',
  description: '素材管理API服务',
  paths: {
    '/materials': {
      description: '素材列表',
      methods: ['GET'],
      cache: { enabled: true, ttl: 300000 }
    },
    '/materials/batch': {
      description: '批量操作素材',
      methods: ['POST', 'PUT', 'DELETE'],
      cache: { enabled: false }
    },
    '/materials/{id}': {
      description: '素材详情',
      methods: ['GET', 'PUT', 'DELETE'],
      cache: { enabled: true, ttl: 600000 }
    }
  }
}
```

## 🔧 扩展开发

### 1. 添加新的API服务

1. 在 `src/config/api/index.ts` 中注册服务：

```typescript
export const API_REGISTRY: ApiRegistry = {
  // 现有服务...
  newService: {
    name: 'newService',
    baseUrl: '/api/new-service',
    paths: {
      '/endpoint': {
        methods: ['GET', 'POST']
        // 其他配置...
      }
    }
  }
}
```

2. 创建服务类：

```typescript
import { BaseApiService } from '@/services/base/apiService'
import { apiConfigManager } from '@/config/api'

export class NewService extends BaseApiService {
  constructor() {
    super(apiConfigManager.getServiceConfig('newService'))
  }

  async getItems(params?: any) {
    return this.get('/endpoint', params)
  }

  async createItem(data: any) {
    return this.post('/endpoint', data)
  }
}
```

### 2. 添加Mock数据

1. 在 `src/mock/data/` 目录下创建数据文件：

```typescript
// src/mock/data/newService.ts
export const newServiceMockData = {
  '/endpoint': {
    GET: { items: [], total: 0 },
    POST: { success: true, id: 'new-id' }
  }
}
```

2. 注册Mock数据：

```typescript
// src/mock/index.ts
import { newServiceMockData } from './data/newService'

export const mockDataRegistry = {
  // 现有Mock数据...
  newService: newServiceMockData
}
```

## 🚨 注意事项

1. **类型安全**：所有API配置都有完整的TypeScript类型定义
2. **方法验证**：系统会自动验证HTTP方法是否支持
3. **缓存管理**：合理使用缓存可以提高性能
4. **Mock数据**：Mock数据应该与真实API响应结构保持一致
5. **环境变量**：确保正确配置环境变量

## 📈 性能优化

1. **请求缓存**：启用适当的缓存策略
2. **重试机制**：配置合理的重试次数和延迟
3. **超时设置**：设置合适的请求超时时间
4. **Mock延迟**：在开发时模拟真实网络延迟

## 🔍 调试技巧

1. **开启调试模式**：使用 `Ctrl/Cmd + Shift + D` 开启调试信息
2. **查看网络请求**：在浏览器开发者工具中查看请求详情
3. **验证配置**：使用 `Ctrl/Cmd + Shift + V` 验证API配置
4. **清除缓存**：使用 `Ctrl/Cmd + Shift + C` 清除Mock缓存

## 📚 更多资源

- [API配置类型定义](./src/config/api/types.ts)
- [基础API服务类](./src/services/base/apiService.ts)
- [Mock数据管理器](./src/mock/index.ts)
- [开发工具初始化](./src/utils/dev/index.ts)

---

如有问题或建议，请联系开发团队。
