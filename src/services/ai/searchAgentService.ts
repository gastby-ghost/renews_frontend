/**
 * AI搜索代理服务 - 基于OpenAPI配置
 * 专门服务于智能搜索代理和研究分析功能
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

// 搜索代理相关类型
interface SearchAgentRequest {
  brief: string
  max_concurrent_research_units?: number
  max_researcher_iterations?: number
  search_depth?: 'shallow' | 'medium' | 'deep'
  focus_areas?: string[]
  exclude_domains?: string[]
  include_domains?: string[]
  language?: string
  timeframe?: string
  result_format?: 'summary' | 'detailed' | 'comprehensive'
  analysis_type?: 'factual' | 'comparative' | 'analytical' | 'predictive'
}

interface SearchAgentResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    research_summary: {
      executive_summary: string
      key_findings: Array<{
        finding: string
        confidence: number
        sources: string[]
      }>
      research_questions: string[]
      methodology: string
    }
    detailed_analysis: {
      topic_analysis: string
      market_trends: Array<{
        trend: string
        impact: 'high' | 'medium' | 'low'
        timeframe: string
      }>
      expert_opinions: Array<{
        opinion: string
        expert_name: string
        credibility_score: number
        source: string
      }>
      data_insights: Array<{
        insight: string
        supporting_data: string
        interpretation: string
      }>
    }
    sources: Array<{
      title: string
      url: string
      credibility_score: number
      publication_date: string
      relevance_score: number
      content_type: 'article' | 'research_paper' | 'report' | 'blog' | 'news'
    }>
    recommendations: Array<{
      recommendation: string
      priority: 'high' | 'medium' | 'low'
      rationale: string
      implementation_timeline: string
    }>
    research_metadata: {
      total_sources_analyzed: number
      research_duration: number
      confidence_level: number
      research_quality_score: number
      last_updated: string
    }
  }
  error?: string
  created_at: string
  updated_at: string
}

interface SearchAgentStatusResponse {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_phase?: string
  estimated_completion?: string
  result?: any
  error?: string
}

interface SearchAgentListResponse {
  tasks: Array<{
    task_id: string
    status: string
    brief: string
    created_at: string
    updated_at: string
    progress?: number
  }>
  total_count: number
  page: number
  per_page: number
}

class SearchAgentService extends BaseApiService {
  private taskTracker = new MockTaskTracker()
  private dataManager = new MockDataManager()

  constructor() {
    super('searchAgent')
  }

  // ============= 搜索代理服务 =============

  /**
   * 执行搜索代理研究
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索代理请求参数
   * @param options API请求选项
   * @returns 搜索代理响应
   */
  async executeSearchAgent(
    userId: string,
    projectId: string,
    request: SearchAgentRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<SearchAgentResponse>('/search-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取搜索代理任务状态
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getSearchAgentStatus(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get<SearchAgentStatusResponse>(
      `/search-agent/status/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 获取搜索代理任务列表
   * @param userId 用户ID
   * @param projectId 项目ID（可选）
   * @param options API请求选项
   * @returns 任务列表
   */
  async getSearchAgentTasks(userId: string, projectId?: string, options?: ApiRequestConfig) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<SearchAgentListResponse>('/search-agent/tasks', params, options)
  }

  /**
   * 取消搜索代理任务
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelSearchAgentTask(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.post(`/search-agent/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取搜索代理研究详情
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 研究详情
   */
  async getResearchDetails(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get<any>(
      `/search-agent/research/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 导出搜索代理研究报告
   * @param taskId 任务ID
   * @param format 导出格式
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 导出结果
   */
  async exportResearchReport(
    taskId: string,
    format: 'pdf' | 'docx' | 'markdown' | 'json',
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get(
      `/search-agent/export/${taskId}`,
      {
        format,
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 启动搜索代理并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索代理请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async executeSearchAgentWithPolling(
    userId: string,
    projectId: string,
    request: SearchAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeSearchAgent(userId, projectId, request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('搜索代理任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getSearchAgentStatus(taskId, userId, projectId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 5000,
        timeout: 600000,
        maxAttempts: 120,
        ...pollingConfig
      }
    )

    return poller.start(`search-agent-${taskId}`)
  }

  /**
   * 启动搜索代理并等待完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索代理请求参数
   * @param pollingConfig 轮询配置
   * @returns 研究结果
   */
  async executeSearchAgentAndWait(
    userId: string,
    projectId: string,
    request: SearchAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<SearchAgentResponse> {
    const task = await this.executeSearchAgentWithPolling(userId, projectId, request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`搜索代理任务失败: ${result.error}`)
    }

    return result.data as SearchAgentResponse
  }

  /**
   * 快速研究分析
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param brief 研究简报
   * @param options 研究选项
   * @param pollingConfig 轮询配置
   * @returns 研究结果
   */
  async quickResearch(
    userId: string,
    projectId: string,
    brief: string,
    options?: {
      search_depth?: 'shallow' | 'medium' | 'deep'
      language?: string
      timeframe?: string
      analysis_type?: 'factual' | 'comparative' | 'analytical' | 'predictive'
    },
    pollingConfig?: PollingConfig
  ): Promise<SearchAgentResponse> {
    const request: SearchAgentRequest = {
      brief,
      search_depth: options?.search_depth || 'medium',
      language: options?.language || 'zh-CN',
      timeframe: options?.timeframe || 'last_month',
      analysis_type: options?.analysis_type || 'factual',
      max_concurrent_research_units: 3,
      max_researcher_iterations: 2,
      result_format: 'summary'
    }

    return this.executeSearchAgentAndWait(userId, projectId, request, pollingConfig)
  }

  /**
   * 生成搜索代理状态
   */
  private generateSearchAgentStatus(taskId: string) {
    const taskRecord = this.taskTracker.getTaskStatus(taskId)
    const status = taskRecord?.status || 'pending'
    const phases = ['initialization', 'search', 'analysis', 'synthesis']
    const currentPhase = phases[Math.floor(Math.random() * phases.length)]
    const progress =
      status === 'running'
        ? (phases.indexOf(currentPhase) + 1) * 20 + Math.random() * 15
        : status === 'completed'
          ? 100
          : 0

    return {
      task_id: taskId,
      status,
      progress: Math.round(progress),
      current_phase: status === 'completed' ? 'completed' : currentPhase,
      estimated_completion: new Date(Date.now() + this.calculateSearchTime(status)).toISOString(),
      mock: true,
      timestamp: Date.now()
    }
  }

  /**
   * 生成搜索代理响应
   */
  private generateSearchAgentResponse(taskId: string, requestData: any, params: any) {
    const brief = requestData.brief || '智能搜索代理研究'
    const searchDepth = requestData.search_depth || 'medium'
    const analysisType = requestData.analysis_type || 'factual'

    return {
      task_id: taskId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mock: true,
      timestamp: Date.now(),
      request_info: {
        brief: brief.substring(0, 50) + (brief.length > 50 ? '...' : ''),
        search_depth: searchDepth,
        analysis_type: analysisType,
        user_id: params.user_id,
        project_id: params.project_id
      }
    }
  }

  /**
   * 获取搜索代理任务状态
   */
  private getSearchAgentStatusMock(taskId: string) {
    const taskRecord = this.taskTracker.getTaskStatus(taskId)
    const status = taskRecord?.status || 'pending'

    if (status === 'completed') {
      return {
        ...this.generateSearchAgentStatus(taskId),
        result: this.generateSearchResult()
      }
    } else if (status === 'failed') {
      return {
        ...this.generateSearchAgentStatus(taskId),
        error: this.generateErrorScenario()
      }
    } else {
      return this.generateSearchAgentStatus(taskId)
    }
  }

  /**
   * 生成搜索结果
   */
  private generateSearchResult() {
    const topics = [
      '人工智能在医疗领域的应用研究',
      '区块链技术在供应链管理中的创新应用',
      '新能源技术的发展趋势与市场前景',
      '数字化转型对企业竞争力的影响'
    ]
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)]

    return {
      research_summary: {
        executive_summary: `${selectedTopic}正快速发展，涵盖多个重要方向和应用场景。`,
        key_findings: [
          {
            finding: '技术成熟度显著提升',
            confidence: 0.85 + Math.random() * 0.1,
            sources: ['Nature', 'Science', 'IEEE']
          },
          {
            finding: '商业化应用加速推进',
            confidence: 0.8 + Math.random() * 0.15,
            sources: ['Harvard Business Review', 'MIT Technology Review']
          }
        ],
        research_questions: ['如何确保技术的可持续发展？', '相关法规政策如何完善？'],
        methodology: '综合分析了近期相关研究和市场数据'
      },
      detailed_analysis: {
        topic_analysis: `${selectedTopic}展现出巨大的应用潜力...`,
        market_trends: [
          {
            trend: '市场投资持续增长',
            impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
            timeframe: ['1-2年', '2-3年', '3-5年'][Math.floor(Math.random() * 3)]
          }
        ],
        expert_opinions: [
          {
            opinion: '该领域将成为未来发展的重要方向',
            expert_name: ['Dr. 张明', 'Prof. 李华', 'Dr. 王芳'][Math.floor(Math.random() * 3)],
            credibility_score: 0.85 + Math.random() * 0.1,
            source: '行业峰会 2024'
          }
        ],
        data_insights: [
          {
            insight: '相关指标显著改善',
            supporting_data: '基于多项实证研究数据',
            interpretation: '显示出良好的发展前景'
          }
        ]
      },
      sources: [
        {
          title: '行业发展趋势分析报告',
          url: 'https://example.com/industry-report',
          credibility_score: 0.9 + Math.random() * 0.08,
          publication_date: '2024-01-10',
          relevance_score: 0.85 + Math.random() * 0.12,
          content_type: ['research_paper', 'report', 'article'][
            Math.floor(Math.random() * 3)
          ] as any
        }
      ],
      recommendations: [
        {
          recommendation: '加强技术创新和应用推广',
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
          rationale: '促进产业健康发展',
          implementation_timeline: ['6-12个月', '1-2年', '2-3年'][Math.floor(Math.random() * 3)]
        }
      ],
      research_metadata: {
        total_sources_analyzed: 30 + Math.floor(Math.random() * 30),
        research_duration: 15 + Math.floor(Math.random() * 20),
        confidence_level: 0.8 + Math.random() * 0.15,
        research_quality_score: 0.85 + Math.random() * 0.1,
        last_updated: new Date().toISOString()
      }
    }
  }

  /**
   * 计算搜索时间
   */
  private calculateSearchTime(status: string): number {
    switch (status) {
      case 'pending':
        return 10 * 60 * 1000 // 10分钟
      case 'processing':
        return 5 * 60 * 1000 // 5分钟
      case 'completed':
        return 0
      case 'failed':
        return 0
      default:
        return 15 * 60 * 1000 // 15分钟
    }
  }

  /**
   * 生成错误场景
   */
  private generateErrorScenario(): string {
    const errors = [
      '研究过程中遇到错误：无法访问部分数据源',
      '搜索代理执行超时，请稍后重试',
      '请求参数格式错误，请检查输入内容',
      '系统资源不足，请稍后再试',
      '外部API服务暂时不可用'
    ]
    return errors[Math.floor(Math.random() * errors.length)]
  }

  /**
   * Mock实现方法
   * 为搜索代理服务提供Mock数据支持，集成智能缓存和任务状态跟踪
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
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 3000))

    const url = config.url
    const method = config.method
    const cacheKey = `${method}:${url}:${JSON.stringify(config.data || {})}:${JSON.stringify(config.params || {})}`

    try {
      // 检查缓存
      const cachedData = this.dataManager.getData(cacheKey)
      if (cachedData) {
        if (apiConfig.showDebugInfo) {
          console.log(`[API-${this.serviceName}] 使用缓存数据:`, cacheKey)
        }
        return { ...cachedData, from_cache: true }
      }

      let result: any

      // 搜索代理执行API
      if (method === 'POST' && url.includes('/search-agent/execute')) {
        const requestData = config.data
        const params = config.params || {}
        const taskId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

        // 创建任务
        this.taskTracker.createTask(taskId, 'pending')
        result = this.generateSearchAgentResponse(taskId, requestData, params)

        // 缓存结果
        this.dataManager.setData(cacheKey, result, 300) // 5分钟缓存
      }

      // 任务列表API
      else if (method === 'GET' && url.includes('/search-agent/tasks')) {
        const tasks = Array.from(this.taskTracker.getAllTasks().entries()).map(([id, task]) => ({
          task_id: id,
          status: task.status,
          brief: task.result?.brief || '搜索代理任务',
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          progress: task.progress || 0
        }))

        result = {
          tasks:
            tasks.length > 0
              ? tasks
              : [
                  {
                    task_id: 'agent_001',
                    status: 'completed',
                    brief: '人工智能在医疗领域的应用研究',
                    created_at: '2024-01-15T03:00:00Z',
                    updated_at: '2024-01-15T03:25:00Z',
                    progress: 100
                  },
                  {
                    task_id: 'agent_002',
                    status: 'processing',
                    brief: '区块链技术在供应链管理中的创新应用',
                    created_at: '2024-01-15T04:00:00Z',
                    updated_at: '2024-01-15T04:15:00Z',
                    progress: 65
                  }
                ],
          total_count: tasks.length || 2,
          page: 1,
          per_page: 10,
          mock: true,
          timestamp: Date.now()
        }

        this.dataManager.setData(cacheKey, result, 60) // 1分钟缓存
      }

      // 任务状态API
      else if (method === 'GET' && url.includes('/search-agent/status/')) {
        const parts = url.split('/')
        const taskId = parts[parts.length - 1]

        // 5%概率生成错误场景
        if (Math.random() < 0.05) {
          this.taskTracker.updateTaskStatus(taskId, 'failed')
        }

        result = this.getSearchAgentStatusMock(taskId)
        this.dataManager.setData(cacheKey, result, 30) // 30秒缓存
      }

      // 研究详情API
      else if (method === 'GET' && url.includes('/search-agent/research/')) {
        const taskId = url.split('/')[4]
        result = {
          task_id: taskId,
          research: {
            detailed_analysis: this.generateSearchResult().detailed_analysis
          },
          mock: true,
          timestamp: Date.now()
        }

        this.dataManager.setData(cacheKey, result, 600) // 10分钟缓存
      }

      // 导出研究报告API
      else if (method === 'GET' && url.includes('/search-agent/export/')) {
        const taskId = url.split('/')[4]
        const format = config.params?.format || 'pdf'

        result = {
          task_id: taskId,
          export_format: format,
          download_url: `/api/v1/downloads/research-report-${taskId}.${format}`,
          file_size: format === 'pdf' ? 3072 : format === 'docx' ? 2048 : 1024,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          mock: true,
          timestamp: Date.now()
        }

        this.dataManager.setData(cacheKey, result, 300) // 5分钟缓存
      }

      // 任务取消API
      else if (method === 'POST' && url.includes('/search-agent/cancel/')) {
        const taskId = url.split('/')[4]
        this.taskTracker.updateTaskStatus(taskId, 'cancelled')

        result = {
          success: true,
          message: '搜索代理任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      else {
        result = {
          success: true,
          message: `搜索代理服务Mock响应 - ${method} ${url}`,
          data: {
            mock: true,
            timestamp: Date.now(),
            request_info: {
              url,
              method,
              data: config.data,
              params: config.params
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误',
        mock: true,
        timestamp: Date.now()
      }
    }
  }
}

// 创建单例实例
export const searchAgentService = new SearchAgentService()

export default searchAgentService
