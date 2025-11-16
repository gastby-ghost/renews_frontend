/**
 * AI正文生成服务 - 基于OpenAPI配置
 * 专门服务于内容生成相关功能
 * 支持Mock/真实API切换
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import {
  AsyncTaskPoller,
  type PollingConfig,
  type PollingTask,
  TaskStatus
} from '@/utils/polling/asyncTaskPoller'
import { mockDataManager } from '@/mock'

// 正文生成相关类型
interface BodyGenerationRequest {
  outline_id?: string
  title?: string
  content?: string
  style?: string
  tone?: string
  length?: 'short' | 'medium' | 'long'
  language?: string
  keywords?: string[]
  audience?: string
  purpose?: string
  format?: 'article' | 'blog' | 'report' | 'email' | 'social'
}

interface BodyGenerationResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    content: string
    word_count: number
    estimated_read_time: number
    summary?: string
    key_points?: string[]
  }
  error?: string
  created_at: string
  updated_at: string
}

interface BodyToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  active_tasks: number
  max_concurrent_tasks: number
  average_processing_time: number
  supported_languages: string[]
  supported_formats: string[]
}

class ContentGenerateService extends BaseApiService {
  constructor() {
    super('contentGenerate')
  }

  // ============= 内容生成服务 =============

  /**
   * 生成正文内容
   * @param request 内容生成请求参数
   * @param options API请求选项
   * @returns 生成任务响应
   */
  async generateContent(request: BodyGenerationRequest, options?: ApiRequestConfig) {
    return this.post<BodyGenerationResponse>(
      '/document_generate/content/generate',
      request,
      options
    )
  }

  /**
   * 获取内容生成工具状态
   * @param options API请求选项
   * @returns 工具状态信息
   */
  async getContentToolsStatus(options?: ApiRequestConfig) {
    return this.get<BodyToolsStatusResponse>(
      '/document_generate/content/status',
      undefined,
      options
    )
  }

  /**
   * 验证内容生成请求
   * @param request 生成请求参数
   * @param options API请求选项
   * @returns 验证结果
   */
  async validateContentRequest(request: BodyGenerationRequest, options?: ApiRequestConfig) {
    return this.post<any>('/document_generate/content/validate', request, options)
  }

  /**
   * 获取内容生成任务列表
   * @param params 查询参数
   * @param options API请求选项
   * @returns 任务列表
   */
  async getContentTasks(
    params?: {
      project_id?: string
      status?: string
      limit?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>('/document_generate/content/tasks', params, options)
  }

  /**
   * 取消内容生成任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelContentTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/document_generate/content/tasks/${taskId}`, undefined, options)
  }

  /**
   * 获取内容生成任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getContentTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<BodyGenerationResponse>(
      `/document_generate/content/tasks/${taskId}`,
      undefined,
      options
    )
  }

  /**
   * 启动内容生成并轮询完成
   * @param request 内容生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async generateContentWithPolling(
    request: BodyGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.generateContent(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('内容生成任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getContentTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 3000,
        timeout: 300000,
        maxAttempts: 100,
        ...pollingConfig
      }
    )

    return poller.start(`content-generate-${taskId}`)
  }

  /**
   * 启动内容生成并等待完成
   * @param request 内容生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async generateContentAndWait(
    request: BodyGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<BodyGenerationResponse> {
    const task = await this.generateContentWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`内容生成任务失败: ${result.error}`)
    }

    return result.data as BodyGenerationResponse
  }

  /**
   * Mock实现方法
   * 为内容生成服务提供Mock数据支持
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1500))

    const url = config.url
    const method = config.method

    try {
      // 内容生成工具状态API
      if (method === 'GET' && url.includes('/document_generate/content/status')) {
        return mockDataManager.getMockData('content-tools-status')
      }

      // 内容生成任务列表API
      if (
        method === 'GET' &&
        url.includes('/document_generate/content/tasks') &&
        !url.includes('/tasks/')
      ) {
        const params = config.params || {}
        return mockDataManager.getMockData(
          'content-tasks',
          params.status,
          params.format,
          params.limit
        )
      }

      // 内容生成API
      if (method === 'POST' && url.includes('/document_generate/content/generate')) {
        const requestData = config.data

        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }

        return mockDataManager.getMockData(
          'content-generate-execute',
          requestData.title,
          requestData.format,
          requestData.length
        )
      }

      // 内容验证API
      if (method === 'POST' && url.includes('/document_generate/content/validate')) {
        const requestData = config.data
        return mockDataManager.getMockData(
          'content-validate',
          requestData.title,
          requestData.keywords?.length,
          requestData.audience,
          requestData.purpose
        )
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/document_generate/content/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return mockDataManager.getMockData('content-task-status', taskId)
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/document_generate/content/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        return {
          success: true,
          message: '内容生成任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `内容生成服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          request_info: {
            url,
            method,
            data: config.data
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      // 返回错误响应
      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(errorType: 'network' | 'validation' | 'server' | 'timeout') {
    const errors = {
      network: {
        success: false,
        message: '网络连接失败，请检查网络设置',
        error_code: 'NETWORK_ERROR',
        retry_after: 30
      },
      validation: {
        success: false,
        message: '输入数据验证失败',
        error_code: 'VALIDATION_ERROR',
        details: {
          fields: ['title', 'content'],
          reasons: ['标题不能为空', '内容长度不足']
        }
      },
      server: {
        success: false,
        message: '服务器内部错误，请稍后重试',
        error_code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      },
      timeout: {
        success: false,
        message: '请求超时，请稍后重试',
        error_code: 'TIMEOUT_ERROR',
        timeout_duration: 120000
      }
    }

    return errors[errorType]
  }
}

// 创建单例实例
export const contentGenerateService = new ContentGenerateService()

export default contentGenerateService
