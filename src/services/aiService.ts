/**
 * AI服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'
import { mockDataManager } from '@/mock'

// AI服务相关类型
type WebpageSummaryAsyncResponse = Api.Ai.WebpageSummaryAsyncResponse
type WebpageSummaryStatusResponse = Api.Ai.WebpageSummaryStatusResponse
type SearchAgentResponse = Api.Ai.SearchAgentResponse
type SearchAgentStatusResponse = Api.Ai.SearchAgentStatusResponse
type SearchAgentListResponse = Api.Ai.SearchAgentListResponse
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Search2TitleAgentRequest = Api.Ai.Search2TitleAgentRequest
type Search2TitleAgentResponse = Api.Ai.Search2TitleAgentResponse
type Search2TitleAgentStatusResponse = Api.Ai.Search2TitleAgentStatusResponse
type Search2TitleAgentListResponse = Api.Ai.Search2TitleAgentListResponse
type SearchToolsResponse = Api.Ai.SearchToolsResponse
type SearchToolsStatusResponse = Api.Ai.SearchToolsStatusResponse

class AiService extends BaseApiService {
  constructor() {
    super('ai')
  }

  // ============= 网页总结服务 =============

  /**
   * 异步网页总结
   */
  async summarizeWebpageAsync(
    request: {
      url: string
      model_name?: string
      max_tokens?: number
      scraping_timeout?: number
      max_content_length?: number
      target_format?: object
    },
    options?: ApiRequestConfig
  ) {
    return this.post<WebpageSummaryAsyncResponse>(
      '/webpage-summary/summarize-async',
      request,
      options
    )
  }

  /**
   * 获取网页总结任务状态
   */
  async getWebpageSummaryStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<WebpageSummaryStatusResponse>(
      `/webpage-summary/status/${taskId}`,
      undefined,
      options
    )
  }

  // ============= 检索服务 =============

  /**
   * 通用搜索
   */
  async searchRetrieval(
    q: string,
    params?: {
      provider?: string
      freshness?: string
      summary?: boolean
      include?: string
      exclude?: string
      count?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.get('/retrieval/search', { q, ...params }, options)
  }

  /**
   * 创建检索Agent异步任务
   */
  async createRetrievalAgent(
    q: string,
    params?: {
      freshness?: string
      summary?: boolean
      include?: string
      exclude?: string
      count?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.get('/retrieval/agent-search-async', { q, ...params }, options)
  }

  /**
   * 获取检索任务状态
   */
  async getRetrievalStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/retrieval/status/${taskId}`, undefined, options)
  }

  // ============= 任务管理 =============

  /**
   * 取消任务
   */
  async cancelTask(
    request: {
      task_id: string
      terminate?: boolean
      signal?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post(`/tasks/${request.task_id}/cancel`, null, {
      params: {
        task_id: request.task_id,
        terminate: request.terminate,
        signal: request.signal
      },
      ...options
    })
  }

  // ============= Search Agent服务 =============

  /**
   * 执行Search Agent
   */
  async executeSearchAgent(
    userId: string,
    projectId: string,
    request: {
      brief: string
      max_concurrent_research_units?: number
      max_researcher_iterations?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.post<SearchAgentResponse>('/search-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Search Agent任务状态
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
   * 获取Search Agent任务列表
   */
  async getSearchAgentTasks(userId: string, projectId?: string, options?: ApiRequestConfig) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<SearchAgentListResponse>('/search-agent/tasks', params, options)
  }

  /**
   * 取消Search Agent任务
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
   * 获取Search Agent图状态
   */
  async getSearchAgentState(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get(
      `/search-agent/state/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  // ============= Search2Title Agent服务 =============

  /**
   * 执行Search2Title Agent
   */
  async executeSearch2TitleAgent(
    userId: string,
    projectId: string,
    request: {
      brief: string
      max_concurrent_research_units?: number
      max_researcher_iterations?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.post<Search2TitleAgentResponse>(
      '/document-generate/search2title-agent/execute',
      request,
      {
        params: { user_id: userId, project_id: projectId },
        ...options
      }
    )
  }

  /**
   * 获取Search2Title Agent任务状态
   */
  async getSearch2TitleAgentStatus(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get<Search2TitleAgentStatusResponse>(
      `/document-generate/search2title-agent/status/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 获取Search2Title Agent任务列表
   */
  async getSearch2TitleAgentTasks(userId: string, projectId?: string, options?: ApiRequestConfig) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<Search2TitleAgentListResponse>(
      '/document-generate/search2title-agent/tasks',
      params,
      options
    )
  }

  /**
   * 取消Search2Title Agent任务
   */
  async cancelSearch2TitleAgentTask(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.post(`/document-generate/search2title-agent/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Search2Title Agent图状态
   */
  async getSearch2TitleAgentState(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get(
      `/document-generate/search2title-agent/state/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  // ============= 搜索工具服务 =============

  /**
   * 执行搜索工具
   */
  async searchTools(
    request: {
      queries: string[]
      provider: 'tavily' | 'bocha'
      max_results?: number
      enable_structured_summaries?: boolean
      summarization_model?: string
      max_content_length?: number
      topic?: 'general' | 'news' | 'finance'
      include_raw_content?: boolean
      freshness?: string
      summary?: boolean
      include?: string
      exclude?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post<SearchToolsResponse>('/search-tools/search', request, options)
  }

  /**
   * 获取搜索工具状态
   */
  async getSearchToolsStatus(options?: ApiRequestConfig) {
    return this.get<SearchToolsStatusResponse>('/search-tools/status', undefined, options)
  }

  // ============= 系统服务 =============

  /**
   * 健康检查
   */
  async healthCheck(options?: ApiRequestConfig) {
    return this.get('/health', undefined, options)
  }

  /**
   * Mock实现方法
   * 为AI服务提供Mock数据支持
   * 使用外部的Mock数据管理器
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

    // 根据不同的API路径返回相应的Mock数据
    const url = config.url
    const method = config.method

    try {
      // 搜索工具相关API
      if (method === 'GET' && url.includes('/search-tools/status')) {
        return mockDataManager.getMockData('search-tools-status')
      }

      if (method === 'GET' && url.includes('/search-tools/providers')) {
        return mockDataManager.getMockData('search-providers')
      }

      if (method === 'POST' && url.includes('/search-tools/search')) {
        const requestData = config.data
        return mockDataManager.getMockData(
          'search-tools',
          requestData.queries || [],
          requestData.provider || 'tavily'
        )
      }

      // Search Agent相关API
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
        // 从URL中提取taskId，使用split明确提取
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

      // Search2Title Agent相关API
      if (method === 'POST' && url.includes('/document-generate/search2title-agent/execute')) {
        const requestData = config.data
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search2title-agent-execute',
          params.user_id,
          params.project_id,
          requestData.brief
        )
      }

      if (method === 'GET' && url.includes('/document-generate/search2title-agent/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''
        const params = config.params || {}
        return mockDataManager.getMockData('search2title-agent-status', taskId, params.brief)
      }

      if (method === 'GET' && url.includes('/document-generate/search2title-agent/tasks')) {
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search2title-agent-list',
          params.user_id,
          params.project_id,
          params.brief
        )
      }

      // 网页总结相关API
      if (method === 'POST' && url.includes('/webpage-summary/summarize-async')) {
        const requestData = config.data
        return mockDataManager.getMockData('ai-webpage-summary-async', requestData.url)
      }

      if (method === 'GET' && url.includes('/webpage-summary/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''
        return mockDataManager.getMockData('ai-webpage-summary-status', taskId)
      }

      // 默认Mock响应
      return {
        success: true,
        message: `AI服务Mock响应 - ${method} ${url}`,
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
export const aiService = new AiService()

export default aiService
