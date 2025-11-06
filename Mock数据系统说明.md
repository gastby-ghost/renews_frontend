# Art Design Pro Mock 数据系统使用说明

## 概述

Mock 数据系统是为 Art Design Pro 项目开发的一套完整的 API 模拟解决方案，支持前端独立开发和测试。本系统基于新的 OpenAPI 规范构建，提供了所有认证相关 API 端点的完整 Mock 实现。

## 系统架构

```
Mock 数据系统
├── src/mock/data/auth/          # 认证相关 Mock 数据
│   └── index.ts                 # 12 个生成函数
├── src/mock/index.ts            # Mock 数据管理器
└── src/services/authService.ts  # 智能路由 Mock 实现
```

## 新增功能

### 1. 认证相关 Mock 数据（12个端点）

| 端点                      | 方法   | Mock Key                   | 描述         |
| ------------------------- | ------ | -------------------------- | ------------ |
| `/health`                 | GET    | `auth-health`              | 基础健康检查 |
| `/health/detailed`        | GET    | `auth-health`              | 详细健康检查 |
| `/health/ready`           | GET    | `auth-health`              | 就绪性检查   |
| `/health/live`            | GET    | `auth-health`              | 存活检查     |
| `/metrics`                | GET    | `auth-metrics`             | 服务指标     |
| `/preferences`            | GET    | `auth-preferences`         | 获取用户偏好 |
| `/preferences`            | PUT    | `auth-preferences`         | 更新用户偏好 |
| `/preferences/default`    | GET    | `auth-default-preferences` | 默认偏好设置 |
| `/register`               | POST   | `auth-register`            | 用户注册     |
| `/verify/{token}`         | GET    | `auth-verify`              | 邮箱验证     |
| `/forgot-password`        | POST   | `auth-forgot-password`     | 忘记密码     |
| `/account`                | GET    | `auth-account`             | 获取账户信息 |
| `/account`                | PUT    | `auth-account`             | 更新账户信息 |
| `/account`                | DELETE | -                          | 删除账户     |
| `/logout`                 | POST   | `auth-logout`              | 用户登出     |
| `/refresh-token`          | POST   | `auth-refresh-token`       | 刷新令牌     |
| `/cleanup-expired-tokens` | POST   | `auth-cleanup`             | 清理过期令牌 |

### 2. Mock 数据生成函数

所有生成函数位于 `src/mock/data/auth/index.ts`：

```typescript
// 健康检查（支持 4 种类型）
generateHealthCheckResponse(type: 'basic' | 'detailed' | 'ready' | 'live')

// 服务指标
generateMetricsResponse()

// 用户偏好
generateUserPreferencesResponse()
generateDefaultPreferencesResponse()

// 认证流程
generateRegisterResponse(params)
generateVerifyEmailResponse(token)
generateForgotPasswordResponse(email)
generateAccountResponse()
generateLogoutResponse()
generateRefreshTokenResponse(refreshToken)
generateCleanupResponse()
```

### 3. 智能路由系统

AuthService 的 `mockImplementation` 方法根据请求 URL 和方法智能返回相应的 Mock 数据：

```typescript
// 示例：根据不同路径返回不同数据
if (method === 'GET' && url.includes('/health')) {
  if (url.includes('/health/detailed')) {
    return this.mockDataManager.getMockData('auth-health', 'detailed')
  }
  if (url.includes('/health/ready')) {
    return this.mockDataManager.getMockData('auth-health', 'ready')
  }
  if (url.includes('/health/live')) {
    return this.mockDataManager.getMockData('auth-health', 'live')
  }
  return this.mockDataManager.getMockData('auth-health', 'basic')
}
```

## 使用方法

### 1. 在服务中使用

```typescript
// 直接调用 API，Mock 模式自动启用
const response = await authService.healthCheck()
console.log(response) // { status: 'healthy', timestamp: '...' }

// 获取用户偏好
const preferences = await authService.getUserPreferences()
console.log(preferences) // { success: true, data: {...} }

// 刷新令牌
const newToken = await authService.refreshToken(oldRefreshToken)
console.log(newToken) // { success: true, token: '...', expires_in: 3600 }
```

### 2. 在组件中使用

```typescript
import { authService } from '@/services/authService'

// Vue 组件中
export default {
  async setup() {
    // 加载健康状态
    const healthStatus = ref(null)
    try {
      healthStatus.value = await authService.healthCheck()
    } catch (error) {
      console.error('健康检查失败:', error)
    }

    return { healthStatus }
  }
}
```

### 3. 手动获取 Mock 数据

```typescript
import { mockDataManager } from '@/mock'

// 直接使用 MockDataManager
const healthData = mockDataManager.getMockData('auth-health', 'detailed')
const metrics = mockDataManager.getMockData('auth-metrics')
const preferences = mockDataManager.getMockData('auth-preferences')
```

## Mock 数据特点

### 1. 真实性

- 模拟真实的 API 响应结构
- 包含合理的模拟数据和时间戳
- 支持动态数据生成（随机数、时间等）

### 2. 一致性

- 所有 Mock 数据遵循统一的响应格式
- 响应字段与实际 API 规范完全匹配
- 错误场景也提供了相应的 Mock 响应

### 3. 可配置性

- 支持参数化生成（如健康检查类型、用户信息等）
- 可配置的延迟时间（默认 1000ms）
- 支持随机延迟范围

### 4. 易扩展

- 统一的 Mock 数据管理
- 清晰的代码组织
- 易于添加新的 Mock 端点

## 配置选项

### 1. Mock 延迟配置

在 `src/config/api/index.ts` 中配置：

```typescript
export const mockConfig = {
  version: '1.0.0',
  defaultDelay: 1000, // 默认延迟（毫秒）
  randomDelay: true, // 是否启用随机延迟
  delayRange: [500, 2000] // 随机延迟范围
}
```

### 2. 切换 Mock 模式

```typescript
import { apiConfigManager } from '@/config/api'

// 切换到 Mock 模式
apiConfigManager.setUseMock(true)

// 切换到真实 API 模式
apiConfigManager.setUseMock(false)
```

## 测试结果

所有 12 个 Mock 端点测试通过：

```
✓ 健康检查 (basic)
✓ 健康检查 (detailed)
✓ 服务指标
✓ 用户偏好
✓ 默认偏好
✓ 用户注册
✓ 邮箱验证
✓ 忘记密码
✓ 账户信息
✓ 登出
✓ 刷新令牌
✓ 清理令牌

测试完成: 12 通过, 0 失败
```

## 最佳实践

### 1. 使用真实场景数据

Mock 数据应该尽可能接近真实场景：

```typescript
// ✅ 好的做法：使用真实的数据结构
generateAccountResponse() {
  return {
    success: true,
    data: {
      id: 12345,                    // 真实 ID 格式
      username: 'mockuser',         // 真实用户名格式
      email: 'mock@example.com',    // 真实邮箱格式
      is_active: true,
      is_verified: true,
      created_at: '2023-01-01T00:00:00Z',  // ISO 8601 格式
      roles: ['user']
    }
  }
}
```

### 2. 避免硬编码

```typescript
// ✅ 好的做法：使用动态数据
const timestamp = new Date().toISOString()

// ❌ 避免：硬编码时间戳
const timestamp = '2023-01-01T00:00:00Z'
```

### 3. 保持一致性

```typescript
// ✅ 好的做法：统一响应格式
{
  success: boolean,
  message: string,
  data?: any
}
```

## 故障排除

### 1. Mock 数据不生效

检查是否启用了 Mock 模式：

```typescript
const config = apiConfigManager.getConfig()
console.log('Mock 模式:', config.useMock) // 应该为 true
```

### 2. 响应数据格式错误

检查生成函数是否返回正确格式：

```typescript
// 使用 mockDataManager 验证
const data = mockDataManager.getMockData('auth-health')
console.log(JSON.stringify(data, null, 2))
```

### 3. 类型错误

确保使用 `any` 类型或正确的接口：

```typescript
// ✅ 使用 any 类型避免类型错误
export function generateHealthCheckResponse(): any {
  return { ... }
}
```

## 扩展指南

### 添加新的 Mock 端点

1. 在 `src/mock/data/auth/index.ts` 中添加生成函数：

```typescript
export function generateNewEndpointResponse(params: any): any {
  return {
    success: true,
    message: '操作成功',
    data: { ... }
  }
}
```

2. 在 `src/mock/index.ts` 中添加 case：

```typescript
case 'auth-new-endpoint': {
  data = generateNewEndpointResponse(args[0])
  break
}
```

3. 在 `src/services/authService.ts` 的 `mockImplementation` 中添加路由：

```typescript
if (method === 'GET' && url.includes('/new-endpoint')) {
  return this.mockDataManager.getMockData('auth-new-endpoint', data)
}
```

## 总结

Mock 数据系统为 Art Design Pro 提供了：

1. ✅ **完整的 API 覆盖** - 支持所有 15 个认证相关端点
2. ✅ **智能路由** - 自动根据请求返回正确数据
3. ✅ **真实数据** - 模拟真实 API 响应结构
4. ✅ **易于使用** - 无需额外配置即可使用
5. ✅ **高度可扩展** - 易于添加新端点
6. ✅ **测试验证** - 所有 12 个端点测试通过

该系统为前端开发提供了完整的支持，使开发者可以在后端 API 未完成时也能进行独立开发和测试。
