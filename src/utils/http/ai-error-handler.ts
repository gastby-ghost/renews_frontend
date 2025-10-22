/**
 * AI服务错误处理工具
 * 提供AI服务的错误处理、重试逻辑和恢复策略
 */

import { ElMessage, ElNotification } from 'element-plus'
import type { AiServiceError, AiErrorCodes, AiErrorTypes } from './ai-error'
import { AiErrorFactory, isAiServiceError, isRetryableError, getRetryDelay } from './ai-error'
import { aiErrorMonitor } from './ai-error-monitor'
import { AiErrorSeverity } from './ai-error'

// 重试配置接口
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors: AiErrorCodes[]
}

// 错误处理配置接口
export interface ErrorHandlerConfig {
  showMessage: boolean
  showNotification: boolean
  logError: boolean
  retryConfig: RetryConfig
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    1001, // AI_TIMEOUT_ERROR
    1002, // AI_NETWORK_ERROR
    1003, // AI_SERVICE_UNAVAILABLE
    1400, // AI_SEARCH_PROVIDER_ERROR
    1500, // AI_GENERATION_FAILED
    1501 // AI_GENERATION_TIMEOUT
  ]
}

// 默认错误处理配置
const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  showMessage: true,
  showNotification: false,
  logError: true,
  retryConfig: DEFAULT_RETRY_CONFIG
}

/**
 * AI服务错误处理器类
 */
export class AiErrorHandler {
  private config: ErrorHandlerConfig

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      ...DEFAULT_ERROR_HANDLER_CONFIG,
      ...config
    }
  }

  /**
   * 处理AI服务错误
   */
  async handleError(
    error: unknown,
    context?: {
      service?: string
      endpoint?: string
      operation?: string
    }
  ): Promise<AiServiceError> {
    let aiError: AiServiceError

    // 转换为AI服务错误
    if (isAiServiceError(error)) {
      aiError = error
    } else if (error instanceof Error) {
      aiError = AiErrorFactory.fromNetworkError(error, context?.endpoint, context?.service)
    } else {
      aiError = new AiServiceError(
        '未知错误',
        AiErrorCodes.AI_SERVICE_ERROR,
        AiErrorTypes.SERVICE_ERROR,
        AiErrorSeverity.MEDIUM,
        {
          service: context?.service,
          endpoint: context?.endpoint,
          originalError: error
        }
      )
    }

    // 记录到监控系统
    aiErrorMonitor.recordError(aiError)

    // 记录错误日志
    if (this.config.logError) {
      this.logError(aiError, context)
    }

    // 显示错误消息
    if (this.config.showMessage) {
      this.showErrorMessage(aiError)
    }

    // 显示错误通知（用于严重错误）
    if (this.config.showNotification && aiError.severity === 'high') {
      this.showErrorNotification(aiError)
    }

    return aiError
  }

  /**
   * 带重试机制的请求执行
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: {
      service?: string
      endpoint?: string
      operation?: string
    }
  ): Promise<T> {
    let lastError: AiServiceError | null = null

    const startTime = Date.now()

    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation()

        // 记录成功请求到监控系统
        const responseTime = Date.now() - startTime
        if (context?.service) {
          aiErrorMonitor.recordSuccess(context.service, responseTime)
        }

        return result
      } catch (error) {
        lastError = await this.handleError(error, context)

        // 如果是最后一次尝试，或者错误不可重试，直接抛出
        if (attempt === this.config.retryConfig.maxRetries || !this.shouldRetry(lastError)) {
          throw lastError
        }

        // 计算重试延迟
        const delay = this.calculateRetryDelay(attempt)

        // 等待重试
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  /**
   * 判断错误是否应该重试
   */
  private shouldRetry(error: AiServiceError): boolean {
    return (
      isRetryableError(error) && this.config.retryConfig.retryableErrors.includes(error.aiErrorCode)
    )
  }

  /**
   * 计算重试延迟（指数退避）
   */
  private calculateRetryDelay(attempt: number): number {
    const delay =
      this.config.retryConfig.baseDelay * Math.pow(this.config.retryConfig.backoffFactor, attempt)

    // 添加随机抖动避免雷群效应
    const jitter = delay * 0.1 * Math.random()

    return Math.min(delay + jitter, this.config.retryConfig.maxDelay)
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 记录错误日志
   */
  private logError(error: AiServiceError, context?: any): void {
    const logData = {
      ...error.getDebugInfo(),
      context,
      timestamp: new Date().toISOString()
    }

    console.error('[AI Service Error]', logData)

    // 这里可以集成外部日志服务
    // 例如：Sentry, LogRocket, 或自定义日志API
    this.sendToLogService(logData)
  }

  /**
   * 发送日志到外部服务
   */
  private sendToLogService(logData: any): void {
    // 实现外部日志服务集成
    // 例如：
    // try {
    //   fetch('/api/v1/logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(logData)
    //   })
    // } catch (e) {
    //   console.warn('Failed to send log to external service:', e)
    // }

    // 临时：将日志数据保存到localStorage用于调试
    try {
      const logs = JSON.parse(localStorage.getItem('ai_error_logs') || '[]')
      logs.push({ ...logData, id: Date.now() })
      // 只保留最近100条日志
      if (logs.length > 100) {
        logs.shift()
      }
      localStorage.setItem('ai_error_logs', JSON.stringify(logs))
    } catch (e) {
      console.warn('Failed to save log to localStorage:', e)
    }
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(error: AiServiceError): void {
    const message = error.getUserFriendlyMessage()

    ElMessage.error({
      message,
      duration: error.severity === 'critical' ? 0 : 5000,
      showClose: true
    })
  }

  /**
   * 显示错误通知（用于严重错误）
   */
  private showErrorNotification(error: AiServiceError): void {
    ElNotification.error({
      title: 'AI服务错误',
      message: error.getUserFriendlyMessage(),
      duration: 0, // 不自动关闭
      showClose: true
    })
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      retryConfig: {
        ...this.config.retryConfig,
        ...newConfig.retryConfig
      }
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ErrorHandlerConfig {
    return { ...this.config }
  }
}

// 全局AI错误处理器实例
export const globalAiErrorHandler = new AiErrorHandler()

/**
 * 创建AI服务请求包装器
 */
export function createAiServiceRequest<T>(
  operation: () => Promise<T>,
  options: {
    service?: string
    endpoint?: string
    operation?: string
    customHandler?: AiErrorHandler
    retryConfig?: Partial<RetryConfig>
  } = {}
): Promise<T> {
  const handler = options.customHandler || globalAiErrorHandler

  // 如果提供了自定义重试配置，临时更新处理器配置
  if (options.retryConfig) {
    const originalConfig = handler.getConfig()
    handler.updateConfig({
      retryConfig: {
        ...originalConfig.retryConfig,
        ...options.retryConfig
      }
    })

    // 执行请求
    const result = handler.executeWithRetry(operation, {
      service: options.service,
      endpoint: options.endpoint,
      operation: options.operation
    })

    // 恢复原始配置
    handler.updateConfig(originalConfig)

    return result
  }

  return handler.executeWithRetry(operation, {
    service: options.service,
    endpoint: options.endpoint,
    operation: options.operation
  })
}

/**
 * 处理AI服务错误的便捷函数
 */
export async function handleAiError(
  error: unknown,
  context?: {
    service?: string
    endpoint?: string
    operation?: string
  },
  customHandler?: AiErrorHandler
): Promise<AiServiceError> {
  const handler = customHandler || globalAiErrorHandler
  return handler.handleError(error, context)
}

/**
 * 检查AI服务健康状态
 */
export async function checkAiServiceHealth(
  serviceUrl: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${serviceUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn(`AI服务健康检查失败: ${serviceUrl}`, error)
    return false
  }
}

/**
 * 获取AI服务状态信息
 */
export async function getAiServiceStatus(serviceUrl: string, timeout: number = 5000): Promise<any> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${serviceUrl}/status`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.warn(`获取AI服务状态失败: ${serviceUrl}`, error)
    throw error
  }
}

// 导出常用的错误处理工具
export { AiErrorFactory, isAiServiceError, isRetryableError, getRetryDelay }
