# AI 模块 API 使用指南

## 概述

本文档介绍如何使用 AI 模块的 DAO（Data Access Object）结构，该结构已将 `ai_openapi` 中的 OpenAPI 3.1.0 规范转换为 TypeScript API 配置。

## 转换结果

### 生成的文件结构

```
src/config/api/modules/ai/
├── index.ts                          # 模块导出和索引
├── content-generate.ts              # AI正文生成服务
├── material-bind.ts                 # AI素材绑定服务
├── outline-generate.ts              # AI大纲生成服务
├── outline-with-material.ts         # AI带素材大纲生成服务
├── scope-agent.ts                   # AI范围代理服务
├── search-agent.ts                  # AI搜索代理服务
├── search-tools.ts                  # AI搜索工具服务
├── search2title-agent.ts            # AI搜索标题代理服务
└── title-generate.ts                # AI标题生成服务
```

### 服务统计

- **服务数量**: 9 个 AI 服务模块
- **API 端点**: 52 个
- **覆盖功能**: AI 内容生成、素材管理、搜索代理等

## 使用方法

### 1. 导入服务

```typescript
// 导入所有 AI 模块
import { AI_API_MODULES } from '@/config/api/modules/ai'

// 导入特定服务
import { contentGenerateService } from '@/config/api/modules/ai'
```

### 2. 通过 API 配置管理器使用

```typescript
import { apiConfigManager } from '@/config/api'

// 获取 AI 服务
const contentService = apiConfigManager.getServiceConfig('contentgenerate')

// 检查路径配置
const pathConfig = apiConfigManager.getPathConfig(
  'contentgenerate',
  '/api/v1/ai/document_generate/content/generate'
)

// 构建 API URL
const apiUrl = apiConfigManager.buildApiUrl(
  'contentgenerate',
  '/api/v1/ai/document_generate/content/generate'
)
```

### 3. 直接使用服务配置

```typescript
import { contentGenerateService } from '@/config/api/modules/ai'

// 访问服务配置
console.log(contentGenerateService.name) // "AI正文生成服务"
console.log(contentGenerateService.baseUrl) // "/api/v1/ai"
console.log(Object.keys(contentGenerateService.paths)) // 可用的API端点列表
```

## 各服务详细说明

### 1. content-generate (AI正文生成服务)

**功能**: AI 生成正文内容

**主要端点**:

- `POST /api/v1/ai/document_generate/content/generate` - 生成正文
- `GET /api/v1/ai/document_generate/content/tasks/{task_id}` - 查询任务状态
- `DELETE /api/v1/ai/document_generate/content/tasks/{task_id}` - 取消任务
- `GET /api/v1/ai/document_generate/content/status` - 获取工具状态
- `POST /api/v1/ai/document_generate/content/validate` - 验证请求
- `GET /api/v1/ai/document_generate/content/tasks` - 列出任务

### 2. material-bind (AI素材绑定服务)

**功能**: AI 自动绑定素材到文档

**主要端点**:

- `POST /api/v1/ai/material_bind/bind` - 绑定素材
- `GET /api/v1/ai/material_bind/status/{task_id}` - 查询绑定状态
- `POST /api/v1/ai/material_bind/execute` - 执行绑定

### 3. outline-generate (AI大纲生成服务)

**功能**: AI 生成文档大纲

**主要端点**:

- `POST /api/v1/ai/outline/generate` - 生成大纲
- `GET /api/v1/ai/outline/status/{task_id}` - 查询生成状态

### 4. outline-with-material (AI带素材大纲生成服务)

**功能**: 基于素材生成大纲

**主要端点**:

- `POST /api/v1/ai/outline/generate_with_material` - 带素材生成大纲
- `GET /api/v1/ai/outline/task_status/{task_id}` - 查询任务状态
- `POST /api/v1/ai/outline/execute_with_material` - 执行生成
- `GET /api/v1/ai/outline/list_tasks` - 列出任务

### 5. scope-agent (AI范围代理服务)

**功能**: AI 范围分析和代理

**主要端点**:

- `POST /api/v1/ai/agent/scope` - 范围分析
- `GET /api/v1/ai/agent/scope/status/{task_id}` - 查询状态
- `POST /api/v1/ai/agent/scope/execute` - 执行分析
- `GET /api/v1/ai/agent/scope/list_tasks` - 列出任务

### 6. search-agent (AI搜索代理服务)

**功能**: AI 智能搜索代理

**主要端点**:

- `POST /api/v1/ai/agent/search` - 执行搜索
- `GET /api/v1/ai/agent/search/status/{task_id}` - 查询搜索状态
- `POST /api/v1/ai/agent/search/execute` - 执行搜索任务
- `GET /api/v1/ai/agent/search/list_tasks` - 列出搜索任务
- `POST /api/v1/ai/agent/search/cancel/{task_id}` - 取消搜索任务

### 7. search-tools (AI搜索工具服务)

**功能**: AI 搜索工具集合

**主要端点**:

- `POST /api/v1/ai/tools/search` - 使用搜索工具
- `GET /api/v1/ai/tools/search/status` - 获取工具状态
- `GET /api/v1/ai/tools/search/providers` - 获取搜索提供商列表

### 8. search2title-agent (AI搜索标题代理服务)

**功能**: 基于搜索结果生成标题

**主要端点**:

- `POST /api/v1/ai/agent/search2title` - 搜索转标题
- `GET /api/v1/ai/agent/search2title/status/{task_id}` - 查询状态
- `POST /api/v1/ai/agent/search2title/execute` - 执行转换
- `GET /api/v1/ai/agent/search2title/list_tasks` - 列出任务
- `POST /api/v1/ai/agent/search2title/cancel/{task_id}` - 取消任务

### 9. title-generate (AI标题生成服务)

**功能**: AI 标题生成服务

**主要端点**:

- `POST /api/v1/ai/title/generate` - 生成标题
- `GET /api/v1/ai/title/status/{task_id}` - 查询生成状态
- `POST /api/v1/ai/title/execute` - 执行生成

## 配置选项

### 默认配置

所有 AI 服务共享以下默认配置：

```typescript
{
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/{service-name}',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  }
}
```

### 环境变量配置

- `VITE_USE_MOCK`: 是否使用 Mock 数据
- `VITE_MOCK_DELAY`: Mock 延迟时间（毫秒）
- `VITE_API_DEBUG`: 是否显示调试信息
- `VITE_API_URL`: API 基础 URL

## 开发指南

### 1. 添加新的 AI 服务

1. 在 `ai_openapi/` 目录添加新的 OpenAPI 规范文件
2. 运行转换脚本：`node scripts/ai-openapi-converter.cjs`
3. 更新 `src/config/api/modules/ai/index.ts`（脚本会自动完成）
4. 验证结果：`node scripts/verify-ai-modules.cjs`

### 2. 修改现有服务

1. 更新对应的 OpenAPI 规范文件
2. 重新运行转换脚本
3. 验证修改结果

### 3. 调试和测试

```typescript
// 启用调试模式
apiConfigManager.setShowDebugInfo(true)

// 获取所有 AI 服务信息
const aiServicesInfo = apiConfigManager.getAllServicesDetailedInfo()
console.log('AI 服务:', aiServicesInfo)

// 验证配置
const validation = apiConfigManager.validateApiConfig()
if (!validation.isValid) {
  console.error('配置验证失败:', validation.errors)
}
```

## 最佳实践

### 1. 使用类型安全

```typescript
import type { ApiEndpointConfig } from '@/config/api/types'
import { AI_API_MODULES } from '@/config/api/modules/ai'

// 使用类型约束
function useAiService(serviceName: keyof typeof AI_API_MODULES) {
  const service = AI_API_MODULES[serviceName]
  // ...使用服务
}
```

### 2. 错误处理

```typescript
const serviceConfig = apiConfigManager.getServiceConfig('contentgenerate')
if (!serviceConfig) {
  console.error('服务配置不存在')
  return
}

// 检查路径支持
const isSupported = apiConfigManager.isMethodSupported('contentgenerate', '/path', 'POST')
if (!isSupported) {
  console.error('不支持的方法')
  return
}
```

### 3. Mock 和真实 API 切换

```typescript
// 切换到 Mock 模式
apiConfigManager.setUseMock(true)

// 切换到真实 API
apiConfigManager.setUseMock(false)

// 检查当前模式
const config = apiConfigManager.getConfig()
console.log('当前模式:', config.useMock ? 'Mock' : 'Real API')
```

## 维护和更新

### 重新生成所有模块

```bash
# 重新运行转换脚本
node scripts/ai-openapi-converter.cjs

# 验证结果
node scripts/verify-ai-modules.cjs

# 检查类型错误
pnpm tsc --noEmit --skipLibCheck src/config/api/modules/ai/
```

### 清理和重建

```bash
# 清理生成的文件
rm -rf src/config/api/modules/ai/

# 重新生成
mkdir -p src/config/api/modules/ai/
node scripts/ai-openapi-converter.cjs
```

## 故障排除

### 常见问题

1. **类型错误**: 检查 `ApiEndpointConfig` 类型导入路径
2. **模块导入失败**: 确保所有生成的文件语法正确
3. **路径匹配问题**: 使用 `apiConfigManager.getPathConfig()` 调试

### 调试步骤

1. 检查文件是否存在：`ls src/config/api/modules/ai/`
2. 验证语法：`pnpm tsc --noEmit src/config/api/modules/ai/index.ts`
3. 测试导入：运行验证脚本
4. 检查 API 注册表：`console.log(apiConfigManager.getAllServices())`

---

**注意**: 本配置基于 OpenAPI 3.1.0 规范自动生成，确保原始规范文件的准确性和一致性很重要。
