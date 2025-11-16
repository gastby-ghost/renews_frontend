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
import { mockDataManager } from '@/mock'

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
   * Mock实现方法
   * 为搜索代理服务提供Mock数据支持
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
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method

    try {
      // 搜索代理相关API（agent智能搜索）
      if (method === 'POST' && url.includes('/search-agent/execute')) {
        const requestData = config.data
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search-agent-execute',
          params.user_id,
          params.project_id,
          requestData.brief
        )
      }

      if (method === 'GET' && url.includes('/search-agent/status/')) {
        // 从URL中提取taskId
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''

        if (taskId) {
          const params = config.params || {}
          return mockDataManager.getMockData('search-agent-status', taskId, params.brief)
        }
      }

      if (method === 'GET' && url.includes('/search-agent/tasks')) {
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search-agent-list',
          params.user_id,
          params.project_id,
          params.brief
        )
      }

      if (method === 'POST' && url.includes('/search-agent/cancel/')) {
        const taskId = url.split('/')[4]
        return {
          success: true,
          message: '搜索代理任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      if (method === 'GET' && url.includes('/search-agent/research/')) {
        const taskId = url.split('/')[4]
        return {
          task_id: taskId,
          research: {
            detailed_analysis: mockDataManager.getMockData('search-agent-status', taskId).result
              ?.detailed_analysis
          },
          mock: true,
          timestamp: Date.now()
        }
      }

      if (method === 'GET' && url.includes('/search-agent/export/')) {
        const taskId = url.split('/')[4]
        const format = config.params?.format || 'pdf'

        return {
          task_id: taskId,
          export_format: format,
          download_url: `/api/v1/downloads/research-report-${taskId}.${format}`,
          file_size: format === 'pdf' ? 3072 : format === 'docx' ? 2048 : 1024,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `搜索代理服务Mock响应 - ${method} ${url}`,
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
}

// 创建单例实例
export const searchAgentService = new SearchAgentService()

export default searchAgentService
