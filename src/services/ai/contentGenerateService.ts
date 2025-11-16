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
import { MockTaskTracker, MockDataManager } from '@/mock'

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
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

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
   * 生成内容生成工具状态Mock数据
   */
  private generateContentToolsStatus() {
    return this.dataManager.getMockData('content-tools-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 5) + 1,
      max_concurrent_tasks: 5,
      average_processing_time: Math.floor(Math.random() * 30) + 30,
      supported_languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR'],
      supported_formats: ['article', 'blog', 'report', 'email', 'social', 'academic'],
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_quality_score: Math.random() * 0.3 + 0.7, // 70-100%
        daily_requests: Math.floor(Math.random() * 500) + 100
      },
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成内容生成任务列表Mock数据
   */
  private generateContentTasks(params: any) {
    const tasks = this.dataManager.getMockData('content-tasks', () => {
      const baseTasks = [
        {
          task_id: 'content_task_001',
          title: '人工智能发展趋势分析',
          status: 'completed',
          format: 'report',
          word_count: 1200,
          quality_score: 8.5,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:45:00Z'
        },
        {
          task_id: 'content_task_002',
          title: '区块链技术应用案例',
          status: 'processing',
          format: 'article',
          progress: 65,
          estimated_completion: '2024-01-15T11:30:00Z',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:15:00Z'
        },
        {
          task_id: 'content_task_003',
          title: '云计算架构设计指南',
          status: 'pending',
          format: 'blog',
          created_at: '2024-01-15T11:20:00Z',
          updated_at: '2024-01-15T11:20:00Z'
        },
        {
          task_id: 'content_task_004',
          title: '机器学习实践教程',
          status: 'failed',
          format: 'tutorial',
          error: '生成过程中遇到网络连接问题',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T09:15:00Z'
        }
      ]
      return baseTasks
    })

    const filteredTasks = tasks.filter((task: any) => {
      if (params.status && task.status !== params.status) return false
      if (params.format && task.format !== params.format) return false
      return true
    })

    return {
      tasks: filteredTasks,
      total_count: filteredTasks.length,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total_pages: Math.ceil(filteredTasks.length / (params.limit || 10))
      },
      mock: true,
      timestamp: Date.now()
    }
  }

  /**
   * 生成内容生成响应Mock数据
   */
  private generateContentResponse(requestData: BodyGenerationRequest) {
    const taskId = `content_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      title: requestData.title || '未命名内容',
      format: requestData.format || 'article',
      length: requestData.length || 'medium',
      tone: requestData.tone || 'neutral',
      audience: requestData.audience || 'general'
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateEstimatedTime(requestData.length || 'medium'),
      mock: true,
      request_info: {
        title: requestData.title,
        length: requestData.length || 'medium',
        format: requestData.format || 'article',
        tone: requestData.tone,
        audience: requestData.audience,
        keywords: requestData.keywords || []
      }
    }
  }

  /**
   * 生成内容验证结果Mock数据
   */
  private generateContentValidation(requestData: BodyGenerationRequest) {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // 基于请求数据生成验证结果
    if (!requestData.title || requestData.title.length < 5) {
      errors.push('标题长度不足，至少需要5个字符')
    }

    if (requestData.keywords && requestData.keywords.length < 3) {
      warnings.push('关键词较少，建议添加更多相关关键词以提升内容质量')
    }

    if (!requestData.audience) {
      suggestions.push('建议明确目标受众以优化内容风格和表达方式')
    }

    if (!requestData.purpose) {
      suggestions.push('建议明确内容目的以生成更有针对性的内容')
    }

    const qualityScore = Math.max(0, 10 - errors.length * 2 - warnings.length)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      quality_score: qualityScore,
      estimated_generation_time: this.calculateEstimatedTime(requestData.length || 'medium'),
      mock: true,
      timestamp: Date.now()
    }
  }

  /**
   * 获取任务状态Mock数据
   */
  private getContentTaskStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        content: '示例内容生成任务'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateContentResult()
        }
      }
      return {}
    })

    if (!updatedTask) {
      throw new Error(`Failed to update task ${taskId}`)
    }

    return {
      task_id: taskId,
      status: updatedTask.status,
      progress: updatedTask.progress,
      result: updatedTask.result,
      error: updatedTask.error,
      created_at: new Date(updatedTask.createdAt).toISOString(),
      updated_at: new Date(updatedTask.updatedAt).toISOString(),
      mock: true
    }
  }

  /**
   * 生成内容结果Mock数据
   */
  private generateContentResult() {
    const contentTemplates = [
      {
        content:
          '随着科技的不断发展，人工智能正在改变我们的生活方式。从智能家居到自动驾驶，从医疗诊断到金融分析，AI技术的应用越来越广泛。本文将深入探讨人工智能的核心概念、实际应用案例以及未来发展趋势。',
        summary: '探讨人工智能的核心概念、应用案例和发展趋势',
        key_points: ['人工智能的基本概念和原理', 'AI在各行业的实际应用', '人工智能的未来发展方向']
      },
      {
        content:
          '区块链技术作为一种分布式账本技术，正在金融、供应链、医疗等领域发挥重要作用。其去中心化、不可篡改、透明性等特点为传统行业带来了新的可能性。本文将分析区块链技术的核心优势，并通过实际案例展示其应用价值。',
        summary: '分析区块链技术的核心优势和实际应用案例',
        key_points: ['区块链技术的基本原理', '去中心化的优势', '实际应用案例分析']
      },
      {
        content:
          '云计算已经成为现代IT基础设施的核心组成部分。通过云服务，企业可以灵活部署应用程序，降低运维成本，提高业务敏捷性。本文将介绍云计算的基本概念、服务模式以及选择云服务提供商的关键因素。',
        summary: '介绍云计算的基本概念和服务模式',
        key_points: ['云计算的定义和特点', 'IaaS、PaaS、SaaS三种服务模式', '云服务提供商选择指南']
      }
    ]

    const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)]
    const wordCount = template.content.length + Math.floor(Math.random() * 500) + 200

    return {
      content: template.content,
      word_count: wordCount,
      estimated_read_time: Math.ceil(wordCount / 200), // 假设每分钟阅读200字
      summary: template.summary,
      key_points: template.key_points,
      quality_score: Math.random() * 2 + 7, // 7-9分
      readability_score: Math.random() * 20 + 70, // 70-90分
      seo_score: Math.random() * 15 + 75, // 75-90分
      generated_sections: [
        {
          title: '引言',
          word_count: 150,
          key_points: ['背景介绍', '重要性说明']
        },
        {
          title: '主要内容',
          word_count: wordCount - 300,
          key_points: template.key_points
        },
        {
          title: '结论',
          word_count: 150,
          key_points: ['总结', '展望']
        }
      ]
    }
  }

  /**
   * 计算预估生成时间
   */
  private calculateEstimatedTime(length: string): number {
    const timeMap = {
      short: 30, // 30秒
      medium: 60, // 1分钟
      long: 180 // 3分钟
    }
    return timeMap[length as keyof typeof timeMap] || 60
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
      // 内容生成状态API
      if (method === 'GET' && url.includes('/document_generate/content/status')) {
        return this.generateContentToolsStatus()
      }

      // 内容生成任务列表API
      if (
        method === 'GET' &&
        url.includes('/document_generate/content/tasks') &&
        !url.includes('/tasks/')
      ) {
        return this.generateContentTasks(config.params)
      }

      // 内容生成API
      if (method === 'POST' && url.includes('/document_generate/content/generate')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateContentResponse(config.data)
      }

      // 内容验证API
      if (method === 'POST' && url.includes('/document_generate/content/validate')) {
        return this.generateContentValidation(config.data)
      }

      // 任务状态API
      if (method === 'GET' && url.includes('/document_generate/content/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getContentTaskStatusMock(taskId)
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/document_generate/content/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '内容生成任务已取消',
          task_id: taskId,
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
          service_info: {
            name: this.serviceName,
            version: '1.0.0',
            request_info: {
              url,
              method,
              data: config.data
            }
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        error_code: 'MOCK_GENERATION_FAILED',
        mock: true,
        timestamp: Date.now()
      }
    }
  }
}

// 创建单例实例
export const contentGenerateService = new ContentGenerateService()

export default contentGenerateService
