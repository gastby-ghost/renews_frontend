# OpenAPI 到 TypeScript 转换器

## 概述

这个工具将 `core_openapi/` 目录中的 OpenAPI 3.1.0 JSON 规范文件自动转换为 `src/config/api/modules/` 中的 TypeScript 配置文件。

## 功能特性

- ✅ 自动解析 OpenAPI 3.1.0 规范
- ✅ 生成符合 `ApiEndpointConfig` 接口的 TypeScript 代码
- ✅ 提取路径、方法、请求/响应参数
- ✅ 自动检测认证要求
- ✅ 生成类型安全的配置文件
- ✅ 自动更新模块导出

## 使用方法

### 1. 运行转换器

```bash
# 使用 npm 脚本
pnpm generate:api:core

# 或直接运行脚本
node scripts/openapi-to-ts-converter.cjs
```

### 2. 转换结果

转换器会：

- 读取 `core_openapi/` 目录中的所有 `.json` 文件
- 为每个文件生成对应的 `.ts` 配置文件
- 输出到 `src/config/api/modules/` 目录
- 显示转换统计信息

### 3. 手动更新导出

转换完成后，需要手动更新 `src/config/api/modules/index.ts` 文件，添加新模块的导入和导出。

## 文件结构

### 输入文件示例 (core_openapi/auth.json)

```json
{
  "openapi": "3.1.0",
  "info": { "title": "认证服务", "version": "1.0.0" },
  "paths": {
    "POST/api/v1/core/login": {
      "post": {
        "summary": "用户登录",
        "operationId": "login_user",
        "security": [{ "HTTPBearer": [] }],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/UserLoginRequest" }
            }
          }
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/LoginResponse" }
              }
            }
          }
        }
      }
    }
  }
}
```

### 输出文件示例 (src/config/api/modules/auth.ts)

```typescript
/**
 * 用户认证服务模块API配置
 * 基于 auth.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../types'

export const authService: ApiEndpointConfig = {
  name: '用户认证服务',
  baseUrl: '/api/v1',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/auth',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    '/api/v1/core/login': {
      description: '用户登录',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: UserLoginRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'LoginResponse',
        statusCode: 200
      }
    }
  }
}
```

## 配置选项

转换器支持以下配置：

### 输入输出目录

- `inputDir`: OpenAPI 文件目录 (`core_openapi/`)
- `outputDir`: TypeScript 输出目录 (`src/config/api/modules/`)
- `templateDir`: 模板目录 (`src/config/api/`)

### 映射规则

- 文件名映射：`auth.json` → `authService`
- 服务名映射：`auth` → `用户认证服务`
- 基础URL：从 `servers` 或路径中推断

## 支持的 OpenAPI 特性

- ✅ HTTP 方法 (GET, POST, PUT, DELETE, PATCH)
- ✅ 路径参数 (`/api/v1/users/{user_id}`)
- ✅ 查询参数 (`?page=1&size=10`)
- ✅ 请求体 (JSON 格式)
- ✅ 响应模式引用 (`$ref`)
- ✅ 安全要求 (Bearer Token)
- ✅ 多标签分类

## 生成的代码特点

### 1. 类型安全

- 严格遵循 `ApiEndpointConfig` 接口
- 保持 TypeScript 类型检查

### 2. 格式统一

- 统一的代码格式
- 标准化的注释和文档

### 3. 配置完整

- 包含 Mock 配置
- 默认请求头和超时设置
- 认证要求

## 使用示例

### 在组件中使用

```typescript
import { API_MODULES } from '@/config/api/modules'

// 使用认证服务
const authService = API_MODULES.auth

// 发起请求
const response = await fetch(`${authService.baseUrl}/login`, {
  method: 'POST',
  headers: authService.defaults.headers,
  body: JSON.stringify({ username, password })
})
```

### 类型检查

```typescript
// API_MODULES 类型安全
type ModuleName = keyof typeof API_MODULES
// 'auth' | 'project' | 'material' | 'ai' | ...

// 服务配置类型安全
const service: ApiEndpointConfig = API_MODULES.auth
```

## 故障排除

### 常见问题

1. **导入错误**: 检查生成的导出名称是否正确
2. **类型错误**: 确保所有导入的模块都存在
3. **路径错误**: 验证 OpenAPI 文件格式是否正确

### 调试方法

```bash
# 查看生成的文件
ls -la src/config/api/modules/

# 检查类型错误
npx vue-tsc --noEmit --skipLibCheck src/config/api/modules/

# 测试导入
node -e "console.log(Object.keys(require('./src/config/api/modules/index.js').API_MODULES))"
```

## 维护和更新

### 添加新的 OpenAPI 文件

1. 将新的 JSON 文件放入 `core_openapi/` 目录
2. 运行转换器：`pnpm generate:api:core`
3. 更新 `index.ts` 添加新模块的导入和导出

### 修改现有文件

1. 更新 `core_openapi/` 中的 JSON 文件
2. 重新运行转换器
3. 检查生成的 TypeScript 文件

### 自定义转换规则

编辑 `scripts/openapi-to-ts-converter.cjs` 文件中的映射函数：

- `getServiceName()`: 服务名称映射
- `getServiceKey()`: 导出名称映射
- `extractBaseUrl()`: 基础URL推断逻辑

## 贡献指南

1. 确保 OpenAPI 文件符合 3.1.0 规范
2. 测试生成的 TypeScript 文件的类型安全性
3. 更新文档说明新功能或变更
4. 保持代码格式和风格一致性
