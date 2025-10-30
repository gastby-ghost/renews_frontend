/**
 * 统一API日志记录器
 * 基于系统架构文档的日志系统要求
 */

interface LogContext {
  service?: string
  url?: string
  method?: string
  status?: number
  duration?: number
  error?: any
  metadata?: Record<string, any>
}

class ApiLogger {
  private static instance: ApiLogger
  private isDebugEnabled = false

  private constructor() {
    // 从环境变量或配置中读取调试开关
    this.isDebugEnabled = import.meta.env.DEV || false
  }

  static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger()
    }
    return ApiLogger.instance
  }

  /**
   * 记录API请求开始
   */
  request(context: LogContext) {
    if (!this.isDebugEnabled) return

    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [API-REQUEST] ${context.method?.toUpperCase()} ${context.url}`, {
      service: context.service,
      metadata: context.metadata
    })
  }

  /**
   * 记录API请求成功
   */
  success(context: LogContext & { duration: number }) {
    if (!this.isDebugEnabled) return

    const timestamp = new Date().toISOString()
    console.log(
      `[${timestamp}] [API-SUCCESS] ${context.method?.toUpperCase()} ${context.url} [${context.duration}ms]`,
      { service: context.service, status: context.status, metadata: context.metadata }
    )
  }

  /**
   * 记录API请求失败
   */
  error(context: LogContext & { duration?: number }) {
    const timestamp = new Date().toISOString()
    const durationInfo = context.duration ? ` [${context.duration}ms]` : ''
    console.error(
      `[${timestamp}] [API-ERROR] ${context.method?.toUpperCase()} ${context.url}${durationInfo}`,
      {
        service: context.service,
        status: context.status,
        error: context.error?.message || context.error,
        metadata: context.metadata
      }
    )
  }

  /**
   * 记录API请求警告
   */
  warn(context: LogContext) {
    if (!this.isDebugEnabled) return

    const timestamp = new Date().toISOString()
    console.warn(`[${timestamp}] [API-WARN] ${context.method?.toUpperCase()} ${context.url}`, {
      service: context.service,
      metadata: context.metadata
    })
  }

  /**
   * 切换调试模式
   */
  setDebugEnabled(enabled: boolean) {
    this.isDebugEnabled = enabled
  }
}

// 导出单例实例
export const apiLogger = ApiLogger.getInstance()
export default apiLogger
