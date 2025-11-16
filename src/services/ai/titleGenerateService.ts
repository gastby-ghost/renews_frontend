/**
 * AI标题生成服务 - 基于OpenAPI配置
 * 专门服务于标题生成相关功能
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

// 标题生成相关类型
interface TitleGenerationRequest {
  content?: string
  topic?: string
  keywords?: string[]
  target_audience?: string
  tone?: 'formal' | 'casual' | 'professional' | 'creative'
  title_type?: 'headline' | 'subtitle' | 'seo_title' | 'social_title'
  count?: number
  language?: string
  length_preference?: 'short' | 'medium' | 'long'
  include_numbers?: boolean
  include_questions?: boolean
}

interface TitleGenerationResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    titles: Array<{
      title: string
      confidence_score: number
      category: string
      seo_score?: number
      engagement_prediction?: number
    }>
    total_generated: number
    recommended_title: string
  }
  error?: string
  created_at: string
  updated_at: string
}

interface TitleToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  active_tasks: number
  max_concurrent_tasks: number
  average_processing_time: number
  supported_languages: string[]
  supported_title_types: string[]
}

class TitleGenerateService extends BaseApiService {
  constructor() {
    super('titleGenerate')
  }

  // ============= 标题生成服务 =============

  /**
   * 生成标题内容
   * @param request 标题生成请求参数
   * @param options API请求选项
   * @returns 生成任务响应
   */
  async generateTitles(request: TitleGenerationRequest, options?: ApiRequestConfig) {
    return this.post<TitleGenerationResponse>(
      '/document_generate/title-agent/generate',
      request,
      options
    )
  }

  /**
   * 获取标题生成工具状态
   * @param options API请求选项
   * @returns 工具状态信息
   */
  async getTitleToolsStatus(options?: ApiRequestConfig) {
    return this.get<TitleToolsStatusResponse>(
      '/document_generate/title-agent/status',
      undefined,
      options
    )
  }

  /**
   * 验证标题生成请求
   * @param request 生成请求参数
   * @param options API请求选项
   * @returns 验证结果
   */
  async validateTitleRequest(request: TitleGenerationRequest, options?: ApiRequestConfig) {
    return this.post<any>('/document_generate/title-agent/validate', request, options)
  }

  /**
   * 获取标题生成任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getTitleTaskStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<TitleGenerationResponse>(
      `/document_generate/title-agent/tasks/${taskId}`,
      undefined,
      options
    )
  }

  /**
   * 取消标题生成任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelTitleTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/document_generate/title-agent/tasks/${taskId}`, undefined, options)
  }

  /**
   * 启动标题生成并轮询完成
   * @param request 标题生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async generateTitlesWithPolling(
    request: TitleGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.generateTitles(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('标题生成任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getTitleTaskStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 1500,
        timeout: 60000,
        maxAttempts: 40,
        ...pollingConfig
      }
    )

    return poller.start(`title-generate-${taskId}`)
  }

  /**
   * 启动标题生成并等待完成
   * @param request 标题生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async generateTitlesAndWait(
    request: TitleGenerationRequest,
    pollingConfig?: PollingConfig
  ): Promise<TitleGenerationResponse> {
    const task = await this.generateTitlesWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`标题生成任务失败: ${result.error}`)
    }

    return result.data as TitleGenerationResponse
  }

  /**
   * 基于内容快速生成标题
   * @param content 内容或主题
   * @param options 生成选项
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async quickGenerateTitles(
    content: string,
    options?: {
      title_type?: 'headline' | 'subtitle' | 'seo_title' | 'social_title'
      count?: number
      tone?: 'formal' | 'casual' | 'professional' | 'creative'
      language?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<TitleGenerationResponse> {
    const request: TitleGenerationRequest = {
      content,
      title_type: options?.title_type || 'headline',
      count: options?.count || 5,
      tone: options?.tone || 'professional',
      language: options?.language || 'zh-CN',
      length_preference: 'medium'
    }

    return this.generateTitlesAndWait(request, pollingConfig)
  }

  /**
   * 基于关键词生成SEO标题
   * @param keywords 关键词数组
   * @param options 生成选项
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async generateSeoTitles(
    keywords: string[],
    options?: {
      count?: number
      include_numbers?: boolean
      include_questions?: boolean
      language?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<TitleGenerationResponse> {
    const request: TitleGenerationRequest = {
      keywords,
      title_type: 'seo_title',
      count: options?.count || 8,
      include_numbers: options?.include_numbers ?? true,
      include_questions: options?.include_questions ?? true,
      language: options?.language || 'zh-CN',
      length_preference: 'medium',
      tone: 'professional'
    }

    return this.generateTitlesAndWait(request, pollingConfig)
  }

  /**
   * Mock实现方法
   * 为标题生成服务提供Mock数据支持
   * 遵循Mock架构设计原则，提供真实的模拟数据和异步任务状态演进
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

    // 智能延迟模拟（基于架构指南的配置驱动延迟）
    await this.simulateNetworkDelay(apiConfig.mockDelay || 1000)

    const url = config.url
    const method = config.method
    const routeKey = this.buildRouteKey(method, url)

    try {
      // 根据路由键进行精确匹配
      switch (routeKey) {
        case 'GET:/document_generate/title-agent/status':
          return this.generateTitleToolsStatus()

        case 'POST:/document_generate/title-agent/generate':
          return this.createTitleGenerationTask(config.data)

        case 'POST:/document_generate/title-agent/validate':
          return this.validateTitleRequest(config.data)

        case routeKey.match(/^GET:\/document_generate\/title-agent\/tasks\/[^/]+$/)?.input:
          return this.getTitleTaskStatus(url)

        case routeKey.match(/^DELETE:\/document_generate\/title-agent\/tasks\/[^/]+$/)?.input:
          return this.cancelTitleTask(url)

        default:
          return this.generateDefaultResponse(method, url, config.data)
      }
    } catch (error) {
      return this.handleMockError(error, method, url)
    }
  }

  /**
   * 模拟网络延迟（支持随机延迟配置）
   */
  private async simulateNetworkDelay(baseDelay: number): Promise<void> {
    const randomFactor = 0.3 // 30%的随机变化
    const variance = baseDelay * randomFactor
    const actualDelay = baseDelay + (Math.random() - 0.5) * variance

    await new Promise((resolve) => setTimeout(resolve, Math.max(500, actualDelay)))
  }

  /**
   * 构建路由键用于精确匹配
   */
  private buildRouteKey(method: string, url: string): string {
    let routeKey = `${method.toUpperCase()}:${url}`
    // 标准化URL参数
    routeKey = routeKey.replace(
      /\/document_generate\/title-agent\/tasks\/[^/]+/g,
      '/document_generate/title-agent/tasks/:taskId'
    )
    return routeKey
  }

  /**
   * 生成标题工具状态（遵循真实性原则）
   */
  private generateTitleToolsStatus() {
    return {
      service_status: ['available', 'available', 'maintenance'][Math.floor(Math.random() * 3)] as
        | 'available'
        | 'unavailable'
        | 'maintenance',
      active_tasks: Math.floor(Math.random() * 8),
      max_concurrent_tasks: 15,
      average_processing_time: 12 + Math.random() * 8,
      queue_length: Math.floor(Math.random() * 5),
      supported_languages: [
        { code: 'zh-CN', name: '简体中文', quality_score: 0.95 },
        { code: 'en-US', name: 'English', quality_score: 0.98 },
        { code: 'ja-JP', name: '日本語', quality_score: 0.92 },
        { code: 'ko-KR', name: '한국어', quality_score: 0.88 }
      ],
      supported_title_types: [
        { type: 'headline', description: '新闻标题，简洁有力' },
        { type: 'subtitle', description: '副标题，补充说明' },
        { type: 'seo_title', description: 'SEO优化标题，提高搜索排名' },
        { type: 'social_title', description: '社交媒体标题，吸引点击' }
      ],
      performance_metrics: {
        success_rate: 0.92 + Math.random() * 0.07,
        average_quality_score: 0.78 + Math.random() * 0.2,
        user_satisfaction_rate: 0.85 + Math.random() * 0.14
      },
      mock: true,
      timestamp: Date.now(),
      version: '2.3.1'
    }
  }

  /**
   * 创建标题生成任务
   */
  private createTitleGenerationTask(requestData: any) {
    const taskId = `title_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // 分析请求数据
    const contentType = requestData.content
      ? 'content'
      : requestData.keywords
        ? 'keywords'
        : 'topic'
    const titleType = requestData.title_type || 'headline'
    const requestedCount = Math.min(requestData.count || 5, 20) // 限制最大数量

    // 根据内容复杂度预估处理时间
    const complexityScore = this.calculateContentComplexity(requestData)
    const estimatedDuration = 8 + complexityScore * 12 // 8-20秒

    return {
      task_id: taskId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      estimated_completion_at: new Date(Date.now() + estimatedDuration * 1000).toISOString(),
      mock: true,
      request_info: {
        content_type: contentType,
        title_type: titleType,
        count: requestedCount,
        language: requestData.language || 'zh-CN',
        tone: requestData.tone || 'professional',
        complexity_score: complexityScore
      },
      queue_position: Math.floor(Math.random() * 3) + 1
    }
  }

  /**
   * 计算内容复杂度
   */
  private calculateContentComplexity(requestData: any): number {
    let complexity = 0.5 // 基础复杂度

    if (requestData.content) {
      complexity += Math.min(requestData.content.length / 1000, 0.3)
    }

    if (requestData.keywords) {
      complexity += Math.min(requestData.keywords.length * 0.05, 0.2)
    }

    if (requestData.include_numbers) complexity += 0.1
    if (requestData.include_questions) complexity += 0.1
    if (requestData.target_audience) complexity += 0.05

    return Math.min(complexity, 1.0)
  }

  /**
   * 生成标题结果（高真实度数据）
   */
  private generateTitleResults(taskId: string) {
    // 从任务ID提取原始请求特征（这里简化处理）
    const titleVariants = this.generateTitleVariants()

    const titles = titleVariants.map((variant, index) => ({
      id: `title_${taskId}_${index + 1}`,
      title: variant.text,
      confidence_score: variant.confidence,
      category: variant.category,
      seo_score: variant.seo_score,
      engagement_prediction: variant.engagement_prediction,
      length_analysis: this.analyzeTitleLength(variant.text),
      keyword_density: Math.random() * 0.3 + 0.1,
      readability_score: Math.random() * 0.3 + 0.7,
      uniqueness_score: Math.random() * 0.2 + 0.8,
      emotional_tone: this.getEmotionalTone(variant.text),
      target_audience_match: Math.random() * 0.3 + 0.7
    }))

    // 推荐最佳标题
    const recommendedTitle = titles.reduce((best, current) =>
      current.confidence_score > best.confidence_score ? current : best
    )

    return {
      titles,
      total_generated: titles.length,
      recommended_title: recommendedTitle.title,
      quality_metrics: {
        average_confidence: titles.reduce((sum, t) => sum + t.confidence_score, 0) / titles.length,
        diversity_score: this.calculateDiversityScore(titles),
        creativity_score: Math.random() * 0.3 + 0.6,
        brand_safety_score: 0.85 + Math.random() * 0.14
      },
      generation_metadata: {
        model_version: 'title-generator-v2.1',
        processing_time: 12.3 + Math.random() * 7,
        iterations: Math.floor(Math.random() * 50) + 20,
        optimization_applied: true
      }
    }
  }

  /**
   * 生成标题变体（多样性原则）
   */
  private generateTitleVariants() {
    const templates = [
      {
        text: '人工智能在2024年的发展趋势与应用前景',
        confidence: 92,
        category: 'technology',
        seo_score: 88,
        engagement_prediction: 85
      },
      {
        text: 'AI技术如何改变我们的日常生活？深度解析未来趋势',
        confidence: 89,
        category: 'lifestyle',
        seo_score: 91,
        engagement_prediction: 90
      },
      {
        text: '10个你必须了解的人工智能应用场景（2024最新版）',
        confidence: 86,
        category: 'listicle',
        seo_score: 94,
        engagement_prediction: 88
      },
      {
        text: '深度学习革命：开启人工智能新纪元的关键技术',
        confidence: 87,
        category: 'technical',
        seo_score: 83,
        engagement_prediction: 75
      },
      {
        text: '从ChatGPT到通用AI：技术发展的机遇与挑战',
        confidence: 90,
        category: 'analysis',
        seo_score: 86,
        engagement_prediction: 82
      },
      {
        text: '为什么说2024是AI普及元年？这3个变化你必须知道',
        confidence: 84,
        category: 'opinion',
        seo_score: 89,
        engagement_prediction: 87
      },
      {
        text: '人工智能伦理与治理：在发展与规范之间寻找平衡',
        confidence: 88,
        category: 'ethics',
        seo_score: 81,
        engagement_prediction: 70
      },
      {
        text: '企业AI转型指南：从概念到落地的完整路线图',
        confidence: 91,
        category: 'business',
        seo_score: 85,
        engagement_prediction: 78
      }
    ]

    // 随机排序和变体生成
    return templates.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 5) // 5-8个结果
  }

  /**
   * 分析标题长度
   */
  private analyzeTitleLength(title: string) {
    const length = title.length
    let optimal = false
    let category = 'medium'

    if (length <= 20) {
      category = 'short'
      optimal = false
    } else if (length <= 60) {
      category = 'medium'
      optimal = true
    } else {
      category = 'long'
      optimal = false
    }

    return {
      length,
      category,
      optimal,
      suggestion: optimal ? '长度适中' : length <= 20 ? '建议增加细节' : '建议适当精简'
    }
  }

  /**
   * 获取情感语调
   */
  private getEmotionalTone(title: string) {
    const positiveWords = ['机遇', '发展', '创新', '突破', '成功', '未来']
    const negativeWords = ['挑战', '风险', '问题', '失败', '危机']
    const questionWords = ['如何', '为什么', '什么', '怎样', '?']

    const hasPositive = positiveWords.some((word) => title.includes(word))
    const hasNegative = negativeWords.some((word) => title.includes(word))
    const hasQuestion = questionWords.some((word) => title.includes(word))

    if (hasQuestion) return 'curious'
    if (hasPositive && !hasNegative) return 'optimistic'
    if (hasNegative && !hasPositive) return 'cautious'
    return 'neutral'
  }

  /**
   * 计算多样性分数
   */
  private calculateDiversityScore(titles: any[]) {
    const categories = new Set(titles.map((t) => t.category))
    const lengths = new Set(titles.map((t) => t.title.length))

    const categoryDiversity = categories.size / Math.min(titles.length, 5)
    const lengthDiversity = lengths.size / titles.length

    return (categoryDiversity + lengthDiversity) / 2
  }

  /**
   * 生成默认响应
   */
  private generateDefaultResponse(method: string, url: string, data: any) {
    return {
      success: true,
      message: `标题生成服务Mock响应 - ${method} ${url}`,
      data: {
        mock: true,
        timestamp: Date.now(),
        request_info: { url, method, data },
        note: '该端点暂未实现具体Mock逻辑，使用默认响应'
      }
    }
  }

  /**
   * 统一错误处理
   */
  private handleMockError(error: any, method: string, url: string) {
    console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

    // 模拟不同类型的错误
    const errorTypes = [
      'NETWORK_ERROR',
      'VALIDATION_ERROR',
      'RATE_LIMIT',
      'INTERNAL_ERROR',
      'MODEL_UNAVAILABLE'
    ]
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]

    return {
      success: false,
      error: {
        code: randomError,
        message: `Mock服务错误: ${error instanceof Error ? error.message : '未知错误'}`,
        details: {
          method,
          url,
          timestamp: Date.now(),
          retry_after: randomError === 'RATE_LIMIT' ? 60 : undefined
        }
      }
    }
  }
}

// 创建单例实例
export const titleGenerateService = new TitleGenerateService()

export default titleGenerateService
