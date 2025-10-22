# AI服务错误处理指南

本指南详细介绍了项目中AI服务的错误处理机制、超时设置和监控功能。

## 目录

1. [概述](#概述)
2. [错误类型体系](#错误类型体系)
3. [超时配置](#超时配置)
4. [错误处理策略](#错误处理策略)
5. [监控和日志](#监控和日志)
6. [使用示例](#使用示例)
7. [最佳实践](#最佳实践)
8. [故障排除](#故障排除)

## 概述

AI服务错误处理系统提供了以下核心功能：

- **统一错误类型**: 专门的AI服务错误类型和错误码
- **智能重试**: 基于错误类型的自动重试机制
- **详细错误信息**: 包含错误详情、建议操作和调试信息
- **实时监控**: 错误率、响应时间和服务健康状态监控
- **120秒超时**: 所有AI服务统一设置为120秒超时

## 错误类型体系

### 基础错误类型

```typescript
enum AiErrorCodes {
  AI_SERVICE_ERROR = 1000, // 基础服务错误
  AI_TIMEOUT_ERROR = 1001, // 超时错误
  AI_NETWORK_ERROR = 1002, // 网络错误
  AI_SERVICE_UNAVAILABLE = 1003, // 服务不可用
  AI_AUTHENTICATION_ERROR = 1004 // 认证错误
  // ... 更多错误码
}

enum AiErrorTypes {
  SERVICE_ERROR = 'service_error',
  TIMEOUT_ERROR = 'timeout_error',
  NETWORK_ERROR = 'network_error',
  TASK_ERROR = 'task_error',
  MODEL_ERROR = 'model_error',
  QUOTA_ERROR = 'quota_error',
  SEARCH_ERROR = 'search_error',
  GENERATION_ERROR = 'generation_error'
}
```

### 专用错误类

- `AiServiceError`: AI服务基础错误类
- `AiTimeoutError`: 超时错误（120秒后触发）
- `AiNetworkError`: 网络连接错误
- `AiServiceUnavailableError`: 服务不可用错误
- `AiTaskError`: 任务执行错误
- `AiModelError`: AI模型错误
- `AiQuotaExceededError`: 配额超限错误
- `AiSearchError`: 搜索相关错误
- `AiGenerationError`: 内容生成错误

## 超时配置

### 全局超时设置

所有AI服务配置文件已更新为120秒超时：

```typescript
// src/config/api/modules/*.ts
defaults: {
  timeout: 120000, // 120秒
  retryCount: 2,   // 增加重试次数
  // ...
}
```

### 已更新的服务列表

- ✅ `webpage-summary.ts` - 网页总结服务
- ✅ `scope-agent.ts` - Scope Agent服务
- ✅ `search-agent.ts` - Search Agent服务
- ✅ `title-generate.ts` - 标题生成服务
- ✅ `outline-generate.ts` - 大纲生成服务
- ✅ `retrieval.ts` - 检索服务
- ✅ `tasks.ts` - 任务管理服务
- ✅ `ai.ts` - 主AI服务配置
- ✅ `search-tools.ts` - 搜索工具服务（已为120秒）

## 错误处理策略

### 自动重试机制

系统会根据错误类型自动决定是否重试：

```typescript
// 可重试的错误类型
const RETRYABLE_ERRORS = [
  1001, // AI_TIMEOUT_ERROR
  1002, // AI_NETWORK_ERROR
  1003, // AI_SERVICE_UNAVAILABLE
  1400, // AI_SEARCH_PROVIDER_ERROR
  1500, // AI_GENERATION_FAILED
  1501 // AI_GENERATION_TIMEOUT
]
```

### 重试配置

```typescript
interface RetryConfig {
  maxRetries: 2 // 最大重试次数
  baseDelay: 1000 // 基础延迟（毫秒）
  maxDelay: 30000 // 最大延迟（毫秒）
  backoffFactor: 2 // 退避因子
  retryableErrors: number[] // 可重试错误码
}
```

### 指数退避算法

重试延迟使用指数退避算法，避免雷群效应：

```typescript
delay = baseDelay * (backoffFactor ^ attempt) + randomJitter
```

## 监控和日志

### 错误监控

系统提供实时错误监控功能：

```typescript
import { aiErrorMonitor } from '@/utils/http/ai-error-monitor'

// 获取错误指标
const metrics = aiErrorMonitor.getErrorMetrics()
console.log('总错误数:', metrics.totalErrors)
console.log('错误率:', metrics.errorRate)

// 获取服务健康状态
const healthStatus = aiErrorMonitor.getServiceHealthStatus()
healthStatus.forEach((service) => {
  console.log(`服务 ${service.service}: ${service.status}`)
})
```

### 性能指标

```typescript
interface PerformanceMetrics {
  serviceName: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  timestamp: string
}
```

### 错误报告

```typescript
const report = aiErrorMonitor.generateErrorReport()
console.log('错误报告:', report.recommendations)
```

## 使用示例

### 基础错误处理

```typescript
import { aiService } from '@/services'
import { isAiServiceError } from '@/utils/http/ai-error'

try {
  const result = await aiService.searchTools({
    queries: ['Vue3教程'],
    provider: 'tavily'
  })
  console.log('搜索结果:', result)
} catch (error) {
  if (isAiServiceError(error)) {
    console.log('AI服务错误:', error.aiErrorCode)
    console.log('错误类型:', error.errorType)
    console.log('用户友好消息:', error.getUserFriendlyMessage())
    console.log('是否可重试:', error.shouldRetry())
  }
}
```

### 自定义错误处理

```typescript
import { AiErrorHandler, createAiServiceRequest } from '@/utils/http/ai-error-handler'

// 创建自定义错误处理器
const customHandler = new AiErrorHandler({
  showMessage: true,
  showNotification: true,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 2000
  }
})

// 使用自定义处理器
const result = await createAiServiceRequest(() => aiService.generateTitles(requestData), {
  service: 'title-generate',
  customHandler
})
```

### 错误监控集成

```typescript
import { aiErrorMonitor } from '@/utils/http/ai-error-monitor'

// 在组件中使用
export default defineComponent({
  methods: {
    async handleAiRequest() {
      try {
        const result = await aiService.searchTools(request)
        this.result = result
      } catch (error) {
        // 错误已自动记录到监控系统
        this.handleError(error)
      }
    },

    getErrorStats() {
      const metrics = aiErrorMonitor.getErrorMetrics()
      this.errorStats = {
        total: metrics.totalErrors,
        byType: metrics.errorsByType,
        recent: metrics.recentErrors.slice(0, 10)
      }
    }
  }
})
```

### Vue组件中的错误处理

```vue
<template>
  <div>
    <el-button @click="executeSearch" :loading="loading"> 执行搜索 </el-button>

    <el-alert
      v-if="error"
      :title="error.message"
      :type="getAlertType(error.severity)"
      :description="error.details.suggestedAction"
      show-icon
      closable
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { aiService } from '@/services'
  import { isAiServiceError, AiErrorSeverity } from '@/utils/http/ai-error'

  const loading = ref(false)
  const error = ref<AiServiceError | null>(null)

  const executeSearch = async () => {
    loading.value = true
    error.value = null

    try {
      await aiService.searchTools({
        queries: ['Vue3教程'],
        provider: 'tavily'
      })
    } catch (err) {
      if (isAiServiceError(err)) {
        error.value = err
      }
    } finally {
      loading.value = false
    }
  }

  const getAlertType = (severity: string) => {
    switch (severity) {
      case AiErrorSeverity.CRITICAL:
      case AiErrorSeverity.HIGH:
        return 'error'
      case AiErrorSeverity.MEDIUM:
        return 'warning'
      case AiErrorSeverity.LOW:
        return 'info'
      default:
        return 'info'
    }
  }
</script>
```

## 最佳实践

### 1. 错误处理原则

- **用户友好**: 始终向用户显示可理解的错误信息
- **自动恢复**: 对于可重试的错误，自动进行重试
- **详细日志**: 记录足够的调试信息
- **优雅降级**: 提供备选方案或默认值

### 2. 超时设置建议

```typescript
// 快速操作（健康检查）
timeout: 5000

// 标准AI操作
timeout: 120000

// 长时间运行的任务
timeout: 300000 // 5分钟，带进度提示
```

### 3. 重试策略

```typescript
// 用户触发的操作
maxRetries: 2, baseDelay: 1000

// 自动后台任务
maxRetries: 5, baseDelay: 5000

// 关键业务操作
maxRetries: 3, baseDelay: 2000
```

### 4. 错误监控

```typescript
// 定期检查错误率
setInterval(() => {
  const metrics = aiErrorMonitor.getErrorMetrics()
  if (metrics.errorRate > 0.1) {
    console.warn('AI服务错误率过高:', metrics.errorRate)
  }
}, 60000) // 每分钟检查一次
```

### 5. 性能优化

```typescript
// 使用缓存减少AI请求
const cache = new Map()

const getCachedResult = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key)
  }

  const result = await fetcher()
  cache.set(key, result)

  // 5分钟后清除缓存
  setTimeout(() => cache.delete(key), 300000)

  return result
}
```

## 故障排除

### 常见问题

#### 1. 超时错误频繁出现

**原因**: 网络延迟或服务响应慢 **解决方案**:

```typescript
// 检查网络连接
const healthCheck = await checkAiServiceHealth('/api/v1/ai')
if (!healthCheck) {
  console.warn('AI服务不可用')
}

// 增加超时时间（已统一设置为120秒）
```

#### 2. 错误率过高

**原因**: 服务配置问题或负载过高 **解决方案**:

```typescript
const report = aiErrorMonitor.generateErrorReport()
console.log('改进建议:', report.recommendations)

// 检查特定服务状态
const serviceHealth = aiErrorMonitor.getServiceHealth('search-tools')
if (serviceHealth?.status === 'unavailable') {
  // 切换到备用服务或显示降级提示
}
```

#### 3. 重试次数过多

**原因**: 配置不当或持续的服务问题 **解决方案**:

```typescript
// 调整重试配置
const handler = new AiErrorHandler({
  retryConfig: {
    maxRetries: 1, // 减少重试次数
    baseDelay: 5000 // 增加重试间隔
  }
})
```

### 调试技巧

#### 1. 启用详细日志

```typescript
// 在开发环境中启用详细日志
const handler = new AiErrorHandler({
  logError: true,
  showMessage: true
})
```

#### 2. 监控错误趋势

```typescript
// 创建错误趋势图表
const errorTrend = aiErrorMonitor.getPerformanceMetrics()
// 使用图表库显示错误率变化
```

#### 3. 测试错误处理

```typescript
// 模拟错误进行测试
const testError = new AiTimeoutError('测试超时错误')
await handleAiError(testError, {
  service: 'test-service',
  endpoint: '/test'
})
```

## 总结

AI服务错误处理系统提供了完整的错误管理解决方案：

1. **120秒统一超时**: 确保AI服务有充足的处理时间
2. **智能重试机制**: 基于错误类型的自动重试
3. **详细错误信息**: 包含调试信息和用户友好提示
4. **实时监控**: 错误率和性能指标监控
5. **灵活配置**: 支持自定义错误处理策略

通过遵循本指南的最佳实践，可以构建稳定、可靠的AI服务应用，提供优秀的用户体验。

## 相关文件

- `src/utils/http/ai-error.ts` - 错误类型定义
- `src/utils/http/ai-error-handler.ts` - 错误处理逻辑
- `src/utils/http/ai-error-monitor.ts` - 监控和日志
- `src/services/base/apiService.ts` - 基础API服务类
- `src/config/api/modules/*.ts` - 各AI服务配置
- `src/typings/api.d.ts` - 类型定义
