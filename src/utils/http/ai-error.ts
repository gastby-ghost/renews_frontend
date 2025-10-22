/**
 * AI服务专用错误处理模块
 * 提供AI服务特定的错误类型和处理策略
 */

import { HttpError } from './error'
import { ApiStatus } from './status'

// AI服务错误码枚举
export enum AiErrorCodes {
  // 基础错误 (1000-1099)
  AI_SERVICE_ERROR = 1000,
  AI_TIMEOUT_ERROR = 1001,
  AI_NETWORK_ERROR = 1002,
  AI_SERVICE_UNAVAILABLE = 1003,
  AI_AUTHENTICATION_ERROR = 1004,

  // 任务相关错误 (1100-1199)
  AI_TASK_NOT_FOUND = 1100,
  AI_TASK_FAILED = 1101,
  AI_TASK_CANCELLED = 1102,
  AI_TASK_TIMEOUT = 1103,
  AI_TASK_INVALID_STATE = 1104,

  // 模型相关错误 (1200-1299)
  AI_MODEL_NOT_AVAILABLE = 1200,
  AI_MODEL_ERROR = 1201,
  AI_MODEL_OVERLOADED = 1202,
  AI_MODEL_INVALID_RESPONSE = 1203,

  // 配额和限制错误 (1300-1399)
  AI_QUOTA_EXCEEDED = 1300,
  AI_RATE_LIMIT_EXCEEDED = 1301,
  AI_CONTENT_TOO_LONG = 1302,
  AI_INVALID_REQUEST = 1303,

  // 搜索相关错误 (1400-1499)
  AI_SEARCH_PROVIDER_ERROR = 1400,
  AI_SEARCH_NO_RESULTS = 1401,
  AI_SEARCH_INVALID_QUERY = 1402,
  AI_SEARCH_TIMEOUT = 1403,

  // 内容生成错误 (1500-1599)
  AI_GENERATION_FAILED = 1500,
  AI_GENERATION_TIMEOUT = 1501,
  AI_GENERATION_INAPPROPRIATE = 1502,
  AI_GENERATION_QUALITY_LOW = 1503
}

// AI服务错误类型枚举
export enum AiErrorTypes {
  SERVICE_ERROR = 'service_error',
  TIMEOUT_ERROR = 'timeout_error',
  NETWORK_ERROR = 'network_error',
  TASK_ERROR = 'task_error',
  MODEL_ERROR = 'model_error',
  QUOTA_ERROR = 'quota_error',
  SEARCH_ERROR = 'search_error',
  GENERATION_ERROR = 'generation_error'
}

// AI服务错误严重程度
export enum AiErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// AI服务错误详情接口
export interface AiErrorDetails {
  service?: string
  endpoint?: string
  taskId?: string
  model?: string
  provider?: string
  retryable?: boolean
  retryAfter?: number
  suggestedAction?: string
  originalError?: any
}

// AI服务专用错误基类
export class AiServiceError extends HttpError {
  public readonly aiErrorCode: AiErrorCodes
  public readonly errorType: AiErrorTypes
  public readonly severity: AiErrorSeverity
  public readonly details: AiErrorDetails
  public readonly retryable: boolean
  public readonly retryAfter?: number

  constructor(
    message: string,
    aiErrorCode: AiErrorCodes,
    errorType: AiErrorTypes,
    severity: AiErrorSeverity = AiErrorSeverity.MEDIUM,
    details: AiErrorDetails = {},
    statusCode: number = ApiStatus.error
  ) {
    super(message, statusCode, {
      url: details.endpoint,
      method: details.service
    })

    this.aiErrorCode = aiErrorCode
    this.errorType = errorType
    this.severity = severity
    this.details = details
    this.retryable = details.retryable ?? false
    this.retryAfter = details.retryAfter
    this.name = 'AiServiceError'
  }

  // 获取用户友好的错误描述
  public getUserFriendlyMessage(): string {
    const baseMessage = this.message
    const suggestedAction = this.details.suggestedAction

    if (suggestedAction) {
      return `${baseMessage}\n建议操作：${suggestedAction}`
    }

    return baseMessage
  }

  // 获取详细的错误信息用于调试
  public getDebugInfo(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      aiErrorCode: this.aiErrorCode,
      errorType: this.errorType,
      severity: this.severity,
      statusCode: this.code,
      timestamp: this.timestamp,
      url: this.url,
      method: this.method,
      details: this.details,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      stack: this.stack
    }
  }

  // 判断是否应该重试
  public shouldRetry(): boolean {
    if (!this.retryable) return false

    // 如果有重试延迟时间，检查是否已经到了重试时间
    if (this.retryAfter) {
      return Date.now() >= this.retryAfter
    }

    return true
  }
}

// AI服务超时错误
export class AiTimeoutError extends AiServiceError {
  constructor(message: string = 'AI服务请求超时', details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_TIMEOUT_ERROR,
      AiErrorTypes.TIMEOUT_ERROR,
      AiErrorSeverity.MEDIUM,
      {
        ...details,
        retryable: true,
        suggestedAction: '请稍后重试，或检查网络连接'
      },
      ApiStatus.requestTimeout
    )
    this.name = 'AiTimeoutError'
  }
}

// AI服务网络错误
export class AiNetworkError extends AiServiceError {
  constructor(message: string = 'AI服务网络连接失败', details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_NETWORK_ERROR,
      AiErrorTypes.NETWORK_ERROR,
      AiErrorSeverity.HIGH,
      {
        ...details,
        retryable: true,
        suggestedAction: '请检查网络连接，稍后重试'
      },
      ApiStatus.error
    )
    this.name = 'AiNetworkError'
  }
}

// AI服务不可用错误
export class AiServiceUnavailableError extends AiServiceError {
  constructor(message: string = 'AI服务暂时不可用', details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_SERVICE_UNAVAILABLE,
      AiErrorTypes.SERVICE_ERROR,
      AiErrorSeverity.HIGH,
      {
        ...details,
        retryable: true,
        retryAfter: Date.now() + 60000, // 1分钟后重试
        suggestedAction: '服务正在维护中，请稍后重试'
      },
      ApiStatus.serviceUnavailable
    )
    this.name = 'AiServiceUnavailableError'
  }
}

// AI任务错误
export class AiTaskError extends AiServiceError {
  constructor(message: string, taskId: string, details: AiErrorDetails = {}) {
    super(message, AiErrorCodes.AI_TASK_FAILED, AiErrorTypes.TASK_ERROR, AiErrorSeverity.MEDIUM, {
      ...details,
      taskId,
      retryable: false,
      suggestedAction: '请检查任务参数，或创建新任务'
    })
    this.name = 'AiTaskError'
  }
}

// AI模型错误
export class AiModelError extends AiServiceError {
  constructor(message: string, model: string, details: AiErrorDetails = {}) {
    super(message, AiErrorCodes.AI_MODEL_ERROR, AiErrorTypes.MODEL_ERROR, AiErrorSeverity.HIGH, {
      ...details,
      model,
      retryable: false,
      suggestedAction: '请尝试使用其他模型，或调整请求参数'
    })
    this.name = 'AiModelError'
  }
}

// AI配额超限错误
export class AiQuotaExceededError extends AiServiceError {
  constructor(message: string = 'AI服务配额已用完', details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_QUOTA_EXCEEDED,
      AiErrorTypes.QUOTA_ERROR,
      AiErrorSeverity.HIGH,
      {
        ...details,
        retryable: false,
        suggestedAction: '请检查账户配额，或稍后重试'
      },
      ApiStatus.forbidden
    )
    this.name = 'AiQuotaExceededError'
  }
}

// 搜索相关错误
export class AiSearchError extends AiServiceError {
  constructor(message: string, provider: string, details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_SEARCH_PROVIDER_ERROR,
      AiErrorTypes.SEARCH_ERROR,
      AiErrorSeverity.MEDIUM,
      {
        ...details,
        provider,
        retryable: true,
        suggestedAction: '请尝试使用其他搜索提供商，或稍后重试'
      }
    )
    this.name = 'AiSearchError'
  }
}

// 内容生成错误
export class AiGenerationError extends AiServiceError {
  constructor(message: string, details: AiErrorDetails = {}) {
    super(
      message,
      AiErrorCodes.AI_GENERATION_FAILED,
      AiErrorTypes.GENERATION_ERROR,
      AiErrorSeverity.MEDIUM,
      {
        ...details,
        retryable: true,
        suggestedAction: '请调整生成参数，或稍后重试'
      }
    )
    this.name = 'AiGenerationError'
  }
}

// 错误工厂函数
export class AiErrorFactory {
  /**
   * 根据HTTP状态码和响应数据创建相应的AI错误
   */
  static createFromHttpResponse(
    statusCode: number,
    responseData: any,
    endpoint?: string,
    service?: string
  ): AiServiceError {
    const message = responseData?.message || responseData?.msg || 'AI服务请求失败'
    const errorType = responseData?.error_type
    const errorCode = responseData?.error_code
    const taskId = responseData?.task_id
    const model = responseData?.model
    const provider = responseData?.provider

    const details: AiErrorDetails = {
      service,
      endpoint,
      taskId,
      model,
      provider,
      originalError: responseData
    }

    // 根据状态码和错误类型创建具体的错误实例
    switch (statusCode) {
      case ApiStatus.requestTimeout:
        return new AiTimeoutError(message, details)

      case ApiStatus.serviceUnavailable:
        return new AiServiceUnavailableError(message, details)

      case ApiStatus.forbidden:
        if (errorCode === AiErrorCodes.AI_QUOTA_EXCEEDED) {
          return new AiQuotaExceededError(message, details)
        }
        break

      default:
        // 根据错误类型创建相应的错误
        if (errorType === AiErrorTypes.TASK_ERROR && taskId) {
          return new AiTaskError(message, taskId, details)
        }

        if (errorType === AiErrorTypes.MODEL_ERROR && model) {
          return new AiModelError(message, model, details)
        }

        if (errorType === AiErrorTypes.SEARCH_ERROR && provider) {
          return new AiSearchError(message, provider, details)
        }

        if (errorType === AiErrorTypes.GENERATION_ERROR) {
          return new AiGenerationError(message, details)
        }
    }

    // 默认返回通用AI服务错误
    return new AiServiceError(
      message,
      errorCode || AiErrorCodes.AI_SERVICE_ERROR,
      errorType || AiErrorTypes.SERVICE_ERROR,
      AiErrorSeverity.MEDIUM,
      details,
      statusCode
    )
  }

  /**
   * 从网络错误创建AI错误
   */
  static fromNetworkError(error: any, endpoint?: string, service?: string): AiNetworkError {
    return new AiNetworkError(error.message || '网络连接失败', {
      service,
      endpoint,
      originalError: error
    })
  }

  /**
   * 从超时错误创建AI错误
   */
  static fromTimeoutError(timeout: number, endpoint?: string, service?: string): AiTimeoutError {
    return new AiTimeoutError(`请求超时 (${timeout}ms)`, {
      service,
      endpoint,
      suggestedAction: 'AI服务处理时间较长，请耐心等待或稍后重试'
    })
  }
}

// 判断是否为AI服务错误
export const isAiServiceError = (error: unknown): error is AiServiceError => {
  return error instanceof AiServiceError
}

// 判断错误是否可重试
export const isRetryableError = (error: unknown): boolean => {
  if (isAiServiceError(error)) {
    return error.shouldRetry()
  }
  return false
}

// 获取错误的重试延迟时间
export const getRetryDelay = (error: unknown): number => {
  if (isAiServiceError(error)) {
    return error.retryAfter ? Math.max(0, error.retryAfter - Date.now()) : 1000
  }
  return 1000
}
