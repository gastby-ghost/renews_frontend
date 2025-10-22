/**
 * AI服务错误监控和日志记录模块
 * 提供错误状态监控、性能指标收集和日志记录功能
 */

import type { AiServiceError } from './ai-error'

// 错误监控数据接口
export interface ErrorMetrics {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByService: Record<string, number>
  errorsBySeverity: Record<string, number>
  averageResponseTime: number
  errorRate: number
  lastUpdated: string
  recentErrors: Array<{
    timestamp: string
    service: string
    errorType: string
    severity: string
    message: string
  }>
}

// 服务健康状态接口
export interface ServiceHealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'unavailable'
  lastCheck: string
  responseTime: number
  errorRate: number
  uptime: number
  consecutiveErrors: number
  lastError?: string
}

// 性能指标接口
export interface PerformanceMetrics {
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

/**
 * AI服务错误监控器类
 */
export class AiErrorMonitor {
  private static instance: AiErrorMonitor
  private errorMetrics: ErrorMetrics
  private serviceHealthStatus: Map<string, ServiceHealthStatus>
  private performanceMetrics: Map<string, PerformanceMetrics[]>
  private maxRecentErrors: number = 100
  private maxPerformanceRecords: number = 1000

  private constructor() {
    this.errorMetrics = this.initializeErrorMetrics()
    this.serviceHealthStatus = new Map()
    this.performanceMetrics = new Map()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): AiErrorMonitor {
    if (!AiErrorMonitor.instance) {
      AiErrorMonitor.instance = new AiErrorMonitor()
    }
    return AiErrorMonitor.instance
  }

  /**
   * 初始化错误指标
   */
  private initializeErrorMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByService: {},
      errorsBySeverity: {},
      averageResponseTime: 0,
      errorRate: 0,
      lastUpdated: new Date().toISOString(),
      recentErrors: []
    }
  }

  /**
   * 记录错误
   */
  public recordError(error: AiServiceError): void {
    const timestamp = new Date().toISOString()
    const service = error.details.service || 'unknown'
    const errorType = error.errorType
    const severity = error.severity

    // 更新总体错误指标
    this.errorMetrics.totalErrors++
    this.errorMetrics.errorsByType[errorType] = (this.errorMetrics.errorsByType[errorType] || 0) + 1
    this.errorMetrics.errorsByService[service] =
      (this.errorMetrics.errorsByService[service] || 0) + 1
    this.errorMetrics.errorsBySeverity[severity] =
      (this.errorMetrics.errorsBySeverity[severity] || 0) + 1
    this.errorMetrics.lastUpdated = timestamp

    // 添加到最近错误列表
    this.errorMetrics.recentErrors.unshift({
      timestamp,
      service,
      errorType,
      severity,
      message: error.message
    })

    // 限制最近错误列表大小
    if (this.errorMetrics.recentErrors.length > this.maxRecentErrors) {
      this.errorMetrics.recentErrors = this.errorMetrics.recentErrors.slice(0, this.maxRecentErrors)
    }

    // 更新服务健康状态
    this.updateServiceHealthStatus(service, error)

    // 记录到控制台
    console.warn('[AI Error Monitor] 错误记录:', {
      service,
      errorType,
      severity,
      message: error.message,
      timestamp
    })

    // 发送到外部日志服务
    this.sendToLogService(error)
  }

  /**
   * 记录成功请求
   */
  public recordSuccess(serviceName: string, responseTime: number): void {
    // 更新服务健康状态
    this.updateServiceSuccessStatus(serviceName, responseTime)

    // 记录性能指标
    this.recordPerformanceMetrics(serviceName, responseTime, true)
  }

  /**
   * 记录性能指标
   */
  private recordPerformanceMetrics(
    serviceName: string,
    responseTime: number,
    success: boolean
  ): void {
    if (!this.performanceMetrics.has(serviceName)) {
      this.performanceMetrics.set(serviceName, [])
    }

    const metrics = this.performanceMetrics.get(serviceName)!
    const timestamp = new Date().toISOString()

    // 计算累计指标
    const lastMetrics = metrics[metrics.length - 1]
    const totalRequests = (lastMetrics?.totalRequests || 0) + 1
    const successfulRequests = (lastMetrics?.successfulRequests || 0) + (success ? 1 : 0)
    const failedRequests = (lastMetrics?.failedRequests || 0) + (success ? 0 : 1)

    // 计算平均响应时间
    const allResponseTimes = [...metrics.map((m) => m.averageResponseTime), responseTime]
    const averageResponseTime =
      allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length

    const newMetrics: PerformanceMetrics = {
      serviceName,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime: this.calculatePercentile(allResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(allResponseTimes, 99),
      errorRate: failedRequests / totalRequests,
      timestamp
    }

    metrics.push(newMetrics)

    // 限制性能记录数量
    if (metrics.length > this.maxPerformanceRecords) {
      metrics.splice(0, metrics.length - this.maxPerformanceRecords)
    }
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * 更新服务健康状态
   */
  private updateServiceHealthStatus(service: string, error: AiServiceError): void {
    const current = this.serviceHealthStatus.get(service)
    const timestamp = new Date().toISOString()

    if (current) {
      current.consecutiveErrors++
      current.lastError = error.message
      current.errorRate = this.calculateServiceErrorRate(service)

      // 根据错误率更新健康状态
      if (current.errorRate > 0.5) {
        current.status = 'unavailable'
      } else if (current.errorRate > 0.1) {
        current.status = 'degraded'
      }
    } else {
      this.serviceHealthStatus.set(service, {
        service,
        status: 'degraded',
        lastCheck: timestamp,
        responseTime: 0,
        errorRate: 1,
        uptime: 0,
        consecutiveErrors: 1,
        lastError: error.message
      })
    }
  }

  /**
   * 更新服务成功状态
   */
  private updateServiceSuccessStatus(service: string, responseTime: number): void {
    const current = this.serviceHealthStatus.get(service)
    const timestamp = new Date().toISOString()

    if (current) {
      current.consecutiveErrors = 0
      current.responseTime = responseTime
      current.errorRate = this.calculateServiceErrorRate(service)
      current.lastCheck = timestamp

      // 根据错误率更新健康状态
      if (current.errorRate < 0.05) {
        current.status = 'healthy'
      } else if (current.errorRate < 0.2) {
        current.status = 'degraded'
      }
    } else {
      this.serviceHealthStatus.set(service, {
        service,
        status: 'healthy',
        lastCheck: timestamp,
        responseTime,
        errorRate: 0,
        uptime: 1,
        consecutiveErrors: 0
      })
    }
  }

  /**
   * 计算服务错误率
   */
  private calculateServiceErrorRate(service: string): number {
    const serviceErrors = this.errorMetrics.errorsByService[service] || 0
    const serviceMetrics = this.performanceMetrics.get(service)
    const totalRequests = serviceMetrics?.[serviceMetrics.length - 1]?.totalRequests || 1

    return serviceErrors / totalRequests
  }

  /**
   * 获取错误指标
   */
  public getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics }
  }

  /**
   * 获取服务健康状态
   */
  public getServiceHealthStatus(): ServiceHealthStatus[] {
    return Array.from(this.serviceHealthStatus.values())
  }

  /**
   * 获取特定服务的健康状态
   */
  public getServiceHealth(serviceName: string): ServiceHealthStatus | undefined {
    return this.serviceHealthStatus.get(serviceName)
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(serviceName?: string): PerformanceMetrics[] {
    if (serviceName) {
      return this.performanceMetrics.get(serviceName) || []
    }

    const allMetrics: PerformanceMetrics[] = []
    this.performanceMetrics.forEach((metrics) => {
      allMetrics.push(...metrics)
    })
    return allMetrics
  }

  /**
   * 获取最近的错误
   */
  public getRecentErrors(limit: number = 50): Array<{
    timestamp: string
    service: string
    errorType: string
    severity: string
    message: string
  }> {
    return this.errorMetrics.recentErrors.slice(0, limit)
  }

  /**
   * 清除错误指标
   */
  public clearMetrics(): void {
    this.errorMetrics = this.initializeErrorMetrics()
    this.serviceHealthStatus.clear()
    this.performanceMetrics.clear()
  }

  /**
   * 发送日志到外部服务
   */
  private sendToLogService(error: AiServiceError): void {
    // 这里可以集成外部日志服务
    // 例如：Sentry, LogRocket, 或自定义日志API
    try {
      const logData = {
        level: 'error',
        message: 'AI Service Error',
        service: error.details.service,
        errorType: error.errorType,
        severity: error.severity,
        errorCode: error.aiErrorCode,
        timestamp: error.timestamp,
        details: error.getDebugInfo()
      }

      // 示例：发送到日志API
      // fetch('/api/v1/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData)
      // }).catch(e => {
      //   console.warn('Failed to send log to external service:', e)
      // })

      console.log('[AI Error Monitor] 日志数据:', logData)
    } catch (e) {
      console.warn('[AI Error Monitor] 发送日志失败:', e)
    }
  }

  /**
   * 生成错误报告
   */
  public generateErrorReport(): {
    summary: ErrorMetrics
    serviceHealth: ServiceHealthStatus[]
    performance: PerformanceMetrics[]
    recommendations: string[]
  } {
    const serviceHealth = this.getServiceHealthStatus()
    const performance = this.getPerformanceMetrics()
    const recommendations = this.generateRecommendations()

    return {
      summary: this.errorMetrics,
      serviceHealth,
      performance,
      recommendations
    }
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const serviceHealth = this.getServiceHealthStatus()

    // 检查高错误率服务
    serviceHealth.forEach((service) => {
      if (service.errorRate > 0.2) {
        recommendations.push(
          `服务 ${service.service} 错误率过高 (${(service.errorRate * 100).toFixed(1)}%)，建议检查服务配置或增加重试机制`
        )
      }

      if (service.responseTime > 10000) {
        recommendations.push(
          `服务 ${service.service} 响应时间过长 (${service.responseTime}ms)，建议优化服务性能或调整超时设置`
        )
      }
    })

    // 检查常见错误类型
    const errorsByType = this.errorMetrics.errorsByType
    if (errorsByType['timeout_error'] > 10) {
      recommendations.push('超时错误频发，建议增加超时时间或优化服务性能')
    }

    if (errorsByType['network_error'] > 10) {
      recommendations.push('网络错误频发，建议检查网络连接或增加重试机制')
    }

    if (errorsByType['quota_error'] > 5) {
      recommendations.push('配额错误较多，建议检查API配额设置或实施限流机制')
    }

    if (recommendations.length === 0) {
      recommendations.push('所有服务运行正常，继续保持')
    }

    return recommendations
  }
}

// 导出单例实例
export const aiErrorMonitor = AiErrorMonitor.getInstance()

// 导出便捷函数
export const recordAiError = (error: AiServiceError): void => {
  aiErrorMonitor.recordError(error)
}

export const recordAiSuccess = (serviceName: string, responseTime: number): void => {
  aiErrorMonitor.recordSuccess(serviceName, responseTime)
}

export const getAiErrorMetrics = (): ErrorMetrics => {
  return aiErrorMonitor.getErrorMetrics()
}

export const getAiServiceHealth = (): ServiceHealthStatus[] => {
  return aiErrorMonitor.getServiceHealthStatus()
}

export const generateAiErrorReport = () => {
  return aiErrorMonitor.generateErrorReport()
}
