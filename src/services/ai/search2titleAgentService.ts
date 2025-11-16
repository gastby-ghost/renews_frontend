/**
 * AI搜索到标题代理服务 - 基于OpenAPI配置
 * 专门服务于基于搜索结果生成标题的功能
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

// 搜索到标题代理相关类型
interface Search2titleAgentRequest {
  search_query: string
  title_preferences?: {
    title_types?: Array<'headline' | 'subtitle' | 'seo_title' | 'social_title' | 'academic_title'>
    tone?: 'formal' | 'casual' | 'professional' | 'creative' | 'academic'
    length_preference?: 'short' | 'medium' | 'long'
    include_numbers?: boolean
    include_questions?: boolean
    target_audience?: string
    language?: string
  }
  search_config?: {
    search_depth?: 'basic' | 'detailed' | 'comprehensive'
    sources?: Array<'news' | 'academic' | 'blogs' | 'social_media' | 'official'>
    time_range?: string
    language?: string
    max_results?: number
  }
  analysis_config?: {
    sentiment_analysis?: boolean
    keyword_extraction?: boolean
    trend_analysis?: boolean
    competitor_analysis?: boolean
  }
}

interface Search2titleAgentResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    search_summary: {
      query: string
      total_results: number
      key_topics: Array<{
        topic: string
        relevance: number
        trend: 'rising' | 'stable' | 'declining'
      }>
      sentiment_distribution: {
        positive: number
        neutral: number
        negative: number
      }
    }
    generated_titles: Array<{
      title: string
      title_type: string
      confidence_score: number
      seo_score?: number
      engagement_prediction?: number
      target_audience_match: number
      uniqueness_score: number
      generated_from: string[]
    }>
    title_analysis: {
      top_keywords: Array<{
        keyword: string
        frequency: number
        importance: number
      }>
      trending_phrases: string[]
      competitor_titles: Array<{
        title: string
        source: string
        similarity_score: number
      }>
      recommended_angles: Array<{
        angle: string
        rationale: string
        opportunity_score: number
      }>
    }
    optimization_suggestions: Array<{
      category: 'seo' | 'engagement' | 'clarity' | 'uniqueness'
      suggestion: string
      impact_level: 'high' | 'medium' | 'low'
      implementation: string
    }>
  }
  error?: string
  created_at: string
  updated_at: string
}

interface Search2titleAgentStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: any
  error?: string
}

class Search2titleAgentService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('search2titleAgent')
  }

  // ============= 搜索到标题代理服务 =============

  /**
   * 执行搜索到标题生成
   * @param request 搜索到标题请求参数
   * @param options API请求选项
   * @returns 生成任务响应
   */
  async executeSearch2title(request: Search2titleAgentRequest, options?: ApiRequestConfig) {
    return this.post<Search2titleAgentResponse>('/search2title-agent/execute', request, options)
  }

  /**
   * 获取搜索到标题任务状态
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getSearch2titleStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<Search2titleAgentStatusResponse>(
      `/search2title-agent/status/${taskId}`,
      undefined,
      options
    )
  }

  /**
   * 取消搜索到标题任务
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelSearch2titleTask(taskId: string, options?: ApiRequestConfig) {
    return this.delete(`/search2title-agent/tasks/${taskId}`, undefined, options)
  }

  /**
   * 获取搜索到标题任务列表
   * @param params 查询参数
   * @param options API请求选项
   * @returns 任务列表
   */
  async getSearch2titleTasks(
    params?: {
      limit?: number
      offset?: number
      status?: string
      date_from?: string
      date_to?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>('/search2title-agent/tasks', params, options)
  }

  /**
   * 重新生成标题
   * @param taskId 原任务ID
   * @param preferences 新的标题偏好
   * @param options API请求选项
   * @returns 重新生成结果
   */
  async regenerateTitles(
    taskId: string,
    preferences: {
      title_types?: string[]
      tone?: string
      length_preference?: string
      additional_keywords?: string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.post(`/search2title-agent/regenerate/${taskId}`, { preferences }, options)
  }

  /**
   * 获取标题性能预测
   * @param titles 标题数组
   * @param context 上下文信息
   * @param options API请求选项
   * @returns 性能预测结果
   */
  async getTitlesPerformancePrediction(
    titles: string[],
    context: {
      platform?: 'google' | 'social_media' | 'blog' | 'news'
      target_audience?: string
      industry?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post('/search2title-agent/predict-performance', { titles, context }, options)
  }

  /**
   * 导出标题分析报告
   * @param taskId 任务ID
   * @param format 导出格式
   * @param options API请求选项
   * @returns 导出结果
   */
  async exportTitleAnalysis(
    taskId: string,
    format: 'pdf' | 'excel' | 'json' | 'csv',
    options?: ApiRequestConfig
  ) {
    return this.get(`/search2title-agent/export/${taskId}`, { format }, options)
  }

  /**
   * 启动搜索到标题并轮询完成
   * @param request 搜索到标题请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async executeSearch2titleWithPolling(
    request: Search2titleAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeSearch2title(request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('搜索到标题任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getSearch2titleStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 2000,
        timeout: 180000,
        maxAttempts: 90,
        ...pollingConfig
      }
    )

    return poller.start(`search2title-${taskId}`)
  }

  /**
   * 启动搜索到标题并等待完成
   * @param request 搜索到标题请求参数
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async executeSearch2titleAndWait(
    request: Search2titleAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<Search2titleAgentResponse> {
    const task = await this.executeSearch2titleWithPolling(request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`搜索到标题任务失败: ${result.error}`)
    }

    return result.data as Search2titleAgentResponse
  }

  /**
   * 快速搜索到标题生成
   * @param searchQuery 搜索查询
   * @param options 生成选项
   * @param pollingConfig 轮询配置
   * @returns 生成结果
   */
  async quickSearch2title(
    searchQuery: string,
    options?: {
      title_types?: Array<'headline' | 'seo_title' | 'social_title'>
      tone?: 'professional' | 'creative' | 'casual'
      language?: string
      target_audience?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<Search2titleAgentResponse> {
    const request: Search2titleAgentRequest = {
      search_query: searchQuery,
      title_preferences: {
        title_types: options?.title_types || ['headline', 'seo_title', 'social_title'],
        tone: options?.tone || 'professional',
        length_preference: 'medium',
        include_numbers: true,
        include_questions: true,
        language: options?.language || 'zh-CN',
        target_audience: options?.target_audience
      },
      search_config: {
        search_depth: 'detailed',
        sources: ['news', 'academic', 'blogs'],
        max_results: 20
      },
      analysis_config: {
        sentiment_analysis: true,
        keyword_extraction: true,
        trend_analysis: true
      }
    }

    return this.executeSearch2titleAndWait(request, pollingConfig)
  }

  /**
   * 批量生成SEO标题
   * @param queries 查询数组
   * @param options 生成选项
   * @param pollingConfig 轮询配置
   * @returns 批量生成结果
   */
  async batchGenerateSeoTitles(
    queries: string[],
    options?: {
      target_keywords?: string[]
      competitor_analysis?: boolean
      language?: string
    },
    pollingConfig?: PollingConfig
  ): Promise<Search2titleAgentResponse[]> {
    const results: Search2titleAgentResponse[] = []

    for (const query of queries) {
      try {
        const request: Search2titleAgentRequest = {
          search_query: query,
          title_preferences: {
            title_types: ['seo_title'],
            tone: 'professional',
            language: options?.language || 'zh-CN'
          },
          search_config: {
            search_depth: 'basic',
            max_results: 10
          },
          analysis_config: {
            keyword_extraction: true,
            competitor_analysis: options?.competitor_analysis || false
          }
        }

        const result = await this.executeSearch2titleAndWait(request, pollingConfig)
        results.push(result)
      } catch (error) {
        console.error(`SEO标题生成失败: ${query}`, error)
      }
    }

    return results
  }

  /**
   * 生成搜索到标题代理状态Mock数据
   */
  private generateSearch2titleStatus() {
    return this.dataManager.getMockData('search2title-agent-status', () => ({
      service_status: 'available',
      active_tasks: Math.floor(Math.random() * 4) + 1,
      max_concurrent_tasks: 4,
      average_processing_time: Math.floor(Math.random() * 30) + 45,
      supported_title_types: [
        'headline',
        'subtitle',
        'seo_title',
        'social_title',
        'academic_title'
      ],
      supported_tones: ['formal', 'casual', 'professional', 'creative', 'academic'],
      supported_languages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR'],
      performance_metrics: {
        success_rate: Math.random() * 0.1 + 0.9, // 90-100%
        average_title_quality: Math.random() * 0.3 + 0.7, // 70-100%
        daily_title_generations: Math.floor(Math.random() * 200) + 50,
        average_engagement_prediction: Math.random() * 20 + 75
      },
      agent_features: {
        multi_source_search: true,
        sentiment_analysis: true,
        trend_analysis: true,
        competitor_analysis: true,
        performance_prediction: true
      },
      mock: true,
      timestamp: Date.now()
    }))
  }

  /**
   * 生成搜索到标题响应Mock数据
   */
  private generateSearch2titleResponse(requestData: Search2titleAgentRequest) {
    const taskId = `s2t_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // 创建任务记录
    const task = this.taskTracker.createTask(taskId, {
      search_query: requestData.search_query,
      title_types: requestData.title_preferences?.title_types || ['headline'],
      tone: requestData.title_preferences?.tone || 'professional',
      search_depth: requestData.search_config?.search_depth || 'detailed'
    })

    return {
      task_id: taskId,
      status: task.status,
      created_at: new Date(task.createdAt).toISOString(),
      updated_at: new Date(task.updatedAt).toISOString(),
      estimated_completion_time: this.calculateProcessingTime(
        requestData.search_config?.search_depth || 'detailed',
        requestData.analysis_config ? Object.keys(requestData.analysis_config).length : 2
      ),
      mock: true,
      request_info: {
        search_query: requestData.search_query,
        title_preferences: requestData.title_preferences,
        search_config: requestData.search_config,
        analysis_config: requestData.analysis_config
      }
    }
  }

  /**
   * 获取搜索到标题任务状态Mock数据
   */
  private getSearch2titleStatusMock(taskId: string) {
    let task = this.taskTracker.getTaskStatus(taskId)

    if (!task) {
      // 如果任务不存在，创建一个模拟任务
      task = this.taskTracker.createTask(taskId, {
        search_query: '示例搜索查询',
        title_types: ['headline'],
        tone: 'professional'
      })
    }

    // 基于时间更新任务状态
    const updatedTask = this.taskTracker.updateTaskByTime(taskId, (_elapsed, task) => {
      if (task.status === 'completed') {
        return {
          result: this.generateSearch2titleResult(task)
        }
      }
      return {}
    })

    if (!updatedTask) {
      throw new Error(`Failed to update task ${taskId}`)
    }

    const phases = ['search', 'analysis', 'generation', 'optimization']
    const currentPhase = updatedTask.progress
      ? phases[Math.min(Math.floor(updatedTask.progress / 25), phases.length - 1)]
      : 'search'

    return {
      task_id: taskId,
      status: updatedTask.status,
      progress: updatedTask.progress,
      current_phase: currentPhase,
      estimated_completion:
        updatedTask.status !== 'completed'
          ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
          : undefined,
      result: updatedTask.result,
      error: updatedTask.error,
      created_at: new Date(updatedTask.createdAt).toISOString(),
      updated_at: new Date(updatedTask.updatedAt).toISOString(),
      mock: true
    }
  }

  /**
   * 生成搜索到标题结果Mock数据
   */
  private generateSearch2titleResult(task: any) {
    const requestData = task.result || {}
    const searchQuery = requestData.search_query || '示例搜索查询'
    const titleTypes = requestData.title_types || ['headline']
    const tone = requestData.tone || 'professional'

    return {
      search_summary: this.generateSearchSummary(searchQuery),
      generated_titles: this.generateTitles(searchQuery, titleTypes, tone),
      title_analysis: this.generateTitleAnalysis(searchQuery),
      optimization_suggestions: this.generateOptimizationSuggestions(titleTypes)
    }
  }

  /**
   * 生成搜索摘要
   */
  private generateSearchSummary(searchQuery: string) {
    const topics = [
      { topic: '人工智能', relevance: 0.95, trend: 'rising' as const },
      { topic: '技术创新', relevance: 0.88, trend: 'stable' as const },
      { topic: '应用场景', relevance: 0.82, trend: 'rising' as const },
      { topic: '发展趋势', relevance: 0.76, trend: 'rising' as const },
      { topic: '市场前景', relevance: 0.7, trend: 'stable' as const }
    ]

    return {
      query: searchQuery,
      total_results: Math.floor(Math.random() * 500) + 100,
      key_topics: topics.slice(0, Math.floor(Math.random() * 3) + 3),
      sentiment_distribution: {
        positive: Math.random() * 0.3 + 0.6,
        neutral: Math.random() * 0.3 + 0.2,
        negative: Math.random() * 0.1 + 0.05
      },
      search_sources_used: ['新闻', '学术文章', '博客', '社交媒体'],
      analysis_timestamp: new Date().toISOString()
    }
  }

  /**
   * 生成标题列表
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateTitles(searchQuery: string, titleTypes: string[], _tone: string) {
    const baseTitles = [
      {
        title: `${searchQuery}：2024年最新发展趋势与深度分析`,
        title_type: 'headline',
        confidence_score: Math.random() * 10 + 85,
        seo_score: Math.random() * 15 + 80,
        engagement_prediction: Math.random() * 20 + 75,
        target_audience_match: Math.random() * 15 + 80,
        uniqueness_score: Math.random() * 20 + 75
      },
      {
        title: `探索${searchQuery}的无限可能：技术革新与应用实践`,
        title_type: 'seo_title',
        confidence_score: Math.random() * 10 + 82,
        seo_score: Math.random() * 15 + 85,
        engagement_prediction: Math.random() * 20 + 70,
        target_audience_match: Math.random() * 15 + 85,
        uniqueness_score: Math.random() * 20 + 80
      },
      {
        title: `${searchQuery}将如何改变世界？5个令人惊讶的事实`,
        title_type: 'social_title',
        confidence_score: Math.random() * 10 + 88,
        seo_score: Math.random() * 15 + 78,
        engagement_prediction: Math.random() * 20 + 90,
        target_audience_match: Math.random() * 15 + 82,
        uniqueness_score: Math.random() * 20 + 88
      }
    ]

    return baseTitles.map((title, index) => ({
      ...title,
      title_type: titleTypes[index % titleTypes.length] || title.title_type,
      generated_from: [
        'keyword_analysis',
        'trend_research',
        'competitor_insights',
        'sentiment_analysis'
      ].slice(0, Math.floor(Math.random() * 3) + 2)
    }))
  }

  /**
   * 生成标题分析
   */
  private generateTitleAnalysis(searchQuery: string) {
    const keywords = [
      {
        keyword: searchQuery.split(' ')[0] || '技术',
        frequency: Math.floor(Math.random() * 50) + 20,
        importance: Math.random() * 0.3 + 0.7
      },
      {
        keyword: '发展',
        frequency: Math.floor(Math.random() * 40) + 15,
        importance: Math.random() * 0.25 + 0.65
      },
      {
        keyword: '应用',
        frequency: Math.floor(Math.random() * 30) + 10,
        importance: Math.random() * 0.2 + 0.6
      },
      {
        keyword: '趋势',
        frequency: Math.floor(Math.random() * 25) + 8,
        importance: Math.random() * 0.2 + 0.55
      },
      {
        keyword: '创新',
        frequency: Math.floor(Math.random() * 20) + 5,
        importance: Math.random() * 0.15 + 0.5
      }
    ]

    return {
      top_keywords: keywords,
      trending_phrases: ['2024年趋势', '技术突破', '市场前景', '创新应用', '发展机遇'].slice(
        0,
        Math.floor(Math.random() * 3) + 3
      ),
      competitor_titles: [
        {
          title: `${searchQuery}的现状与未来发展`,
          source: '行业报告',
          similarity_score: Math.random() * 0.3 + 0.6
        },
        {
          title: `深度解析${searchQuery}的核心价值`,
          source: '专业博客',
          similarity_score: Math.random() * 0.25 + 0.55
        }
      ],
      recommended_angles: [
        {
          angle: '技术突破角度',
          rationale: '突出最新技术进展和创新点',
          opportunity_score: Math.random() * 0.2 + 0.8
        },
        {
          angle: '市场应用角度',
          rationale: '强调实际应用价值和商业潜力',
          opportunity_score: Math.random() * 0.2 + 0.75
        }
      ]
    }
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(titleTypes: string[]) {
    const baseSuggestions = [
      {
        category: 'seo' as const,
        suggestion: '在标题中加入年份和地理位置关键词',
        impact_level: 'high' as const,
        implementation: '修改为"2024年[地区]相关主题分析"'
      },
      {
        category: 'engagement' as const,
        suggestion: '使用疑问句式或数字列表提高点击率',
        impact_level: 'medium' as const,
        implementation: '考虑使用"5个关键点"或"为什么..."等格式'
      },
      {
        category: 'clarity' as const,
        suggestion: '确保标题清晰表达核心内容',
        impact_level: 'high' as const,
        implementation: '明确主题和受众，避免模糊表达'
      },
      {
        category: 'uniqueness' as const,
        suggestion: '创造独特的表达角度',
        impact_level: 'medium' as const,
        implementation: '结合最新趋势或独特见解'
      }
    ]

    // 根据标题类型筛选建议
    const filteredSuggestions = titleTypes.includes('seo_title')
      ? baseSuggestions.filter((s) => s.category === 'seo' || s.impact_level === 'high')
      : titleTypes.includes('social_title')
        ? baseSuggestions.filter((s) => s.category === 'engagement' || s.impact_level === 'high')
        : baseSuggestions

    return filteredSuggestions.slice(0, Math.floor(Math.random() * 2) + 2)
  }

  /**
   * 计算处理时间
   */
  private calculateProcessingTime(searchDepth: string, analysisCount: number): number {
    const baseTime = {
      basic: 30,
      detailed: 60,
      comprehensive: 120
    }

    return (baseTime[searchDepth as keyof typeof baseTime] || 60) + analysisCount * 15
  }

  /**
   * 生成错误场景Mock数据
   */
  private generateErrorScenario(
    errorType: 'network' | 'validation' | 'server' | 'timeout' | 'search_error'
  ) {
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
          fields: ['search_query', 'title_types'],
          reasons: ['搜索查询不能为空', '标题类型不支持']
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
        timeout_duration: 180000
      },
      search_error: {
        success: false,
        message: '搜索失败：无法获取相关搜索结果',
        error_code: 'SEARCH_FAILED',
        details: {
          issue: '搜索查询过于复杂或网络限制',
          suggestion: '请简化搜索查询或稍后重试'
        }
      }
    }

    return errors[errorType]
  }

  /**
   * Mock实现方法
   * 为搜索到标题代理服务提供Mock数据支持
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
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 2000))

    const url = config.url
    const method = config.method

    try {
      // 搜索到标题代理状态API
      if (method === 'GET' && url.includes('/search2title-agent/status')) {
        return this.generateSearch2titleStatus()
      }

      // 搜索到标题执行API
      if (method === 'POST' && url.includes('/search2title-agent/execute')) {
        // 模拟错误场景（5%概率）
        if (Math.random() < 0.05) {
          const errorTypes = ['network', 'validation', 'server', 'timeout', 'search_error']
          const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)] as any
          return this.generateErrorScenario(errorType)
        }
        return this.generateSearch2titleResponse(config.data)
      }

      // 任务列表API
      if (
        method === 'GET' &&
        url.includes('/search2title-agent/tasks') &&
        !url.includes('/tasks/')
      ) {
        const params = config.params || {}
        const mockTasks = this.dataManager.getMockData('search2title-tasks', () => [
          {
            task_id: 's2t_001',
            status: 'completed',
            search_query: '人工智能最新发展',
            created_at: '2024-01-15T02:00:00Z',
            updated_at: '2024-01-15T02:08:00Z',
            progress: 100
          },
          {
            task_id: 's2t_002',
            status: 'processing',
            search_query: '机器学习算法比较',
            created_at: '2024-01-15T02:15:00Z',
            updated_at: '2024-01-15T02:20:00Z',
            progress: 60
          },
          {
            task_id: 's2t_003',
            status: 'failed',
            search_query: '区块链技术应用',
            created_at: '2024-01-15T01:45:00Z',
            updated_at: '2024-01-15T01:50:00Z',
            progress: 35
          }
        ])

        const filteredTasks = mockTasks.filter(
          (task: any) => !params.status || task.status === params.status
        )

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

      // 任务状态API
      if (method === 'GET' && url.includes('/search2title-agent/status/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        return this.getSearch2titleStatusMock(taskId)
      }

      // 重新生成标题API
      if (method === 'POST' && url.includes('/search2title-agent/regenerate/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        const newTaskId = `s2t_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

        return {
          success: true,
          message: '标题重新生成已启动',
          task_id: taskId,
          new_task_id: newTaskId,
          estimated_completion: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
          regeneration_reasons: ['用户偏好调整', '优化SEO效果', '提升点击率预期'],
          mock: true,
          timestamp: Date.now()
        }
      }

      // 标题性能预测API
      if (method === 'POST' && url.includes('/search2title-agent/predict-performance')) {
        const requestData = config.data
        const titles = requestData.titles || []
        const platform = requestData.context?.platform || 'google'

        const predictions = titles.map((title: string, index: number) => ({
          title: title,
          predicted_performance: {
            ctr_prediction: Math.random() * 0.08 + 0.03, // 3-11% CTR
            ranking_potential: Math.floor(Math.random() * 40) + 60, // 60-100
            engagement_score: Math.floor(Math.random() * 25) + 75, // 75-100
            seo_score: Math.floor(Math.random() * 20) + 80, // 80-100
            shareability_score: Math.floor(Math.random() * 30) + 70 // 70-100
          },
          optimization_tips: [
            index % 3 === 0
              ? '考虑加入具体的数字或年份'
              : index % 3 === 1
                ? '使用更具吸引力的动词'
                : '添加目标受众相关的关键词'
          ],
          platform_specific_insights: this.generatePlatformInsights(platform)
        }))

        return {
          predictions,
          platform,
          analysis_timestamp: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 导出标题分析API
      if (method === 'GET' && url.includes('/search2title-agent/export/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]
        const format = config.params?.format || 'pdf'

        const fileSizes = {
          pdf: 1536,
          excel: 2048,
          json: 512,
          csv: 256
        }

        return {
          task_id: taskId,
          export_format: format,
          download_url: `/api/v1/downloads/title-analysis-${taskId}.${format}`,
          file_size: fileSizes[format as keyof typeof fileSizes] || 1024,
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          export_status: 'ready',
          included_sections: [
            'search_summary',
            'generated_titles',
            'title_analysis',
            'optimization_suggestions',
            'performance_predictions'
          ],
          mock: true,
          timestamp: Date.now()
        }
      }

      // 任务取消API
      if (method === 'DELETE' && url.includes('/search2title-agent/tasks/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 从任务跟踪器中删除任务
        this.taskTracker.deleteTask(taskId)

        return {
          success: true,
          message: '搜索到标题任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `搜索到标题代理服务Mock响应 - ${method} ${url}`,
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

  /**
   * 生成平台特定洞察
   */
  private generatePlatformInsights(platform: string): string[] {
    const insights = {
      google: [
        'Google偏好包含年份和数字的标题',
        '建议标题长度保持在50-60字符',
        '使用疑问句式可以提升CTR'
      ],
      social_media: [
        '社交媒体标题更适合使用情感化表达',
        '使用emoji可以提升互动率',
        '标题开头使用强烈吸引力词汇'
      ],
      blog: ['博客标题应突出实用价值', '使用"如何"、"为什么"等引导词', '数字列表格式通常表现更好'],
      news: ['新闻标题需要客观准确', '突出时效性和重要性', '避免过度 sensationalism']
    }

    return insights[platform as keyof typeof insights] || insights.google
  }
}

// 创建单例实例
export const search2titleAgentService = new Search2titleAgentService()

export default search2titleAgentService
