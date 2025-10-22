/**
 * AI服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'

// AI服务相关类型
type WebpageSummaryAsyncResponse = Api.Ai.WebpageSummaryAsyncResponse
type WebpageSummaryStatusResponse = Api.Ai.WebpageSummaryStatusResponse
type ScopeAgentResponse = Api.Ai.ScopeAgentResponse
type ScopeAgentStatusResponse = Api.Ai.ScopeAgentStatusResponse
type ScopeAgentListResponse = Api.Ai.ScopeAgentListResponse
type SearchAgentResponse = Api.Ai.SearchAgentResponse
type SearchAgentStatusResponse = Api.Ai.SearchAgentStatusResponse
type SearchAgentListResponse = Api.Ai.SearchAgentListResponse
type SearchToolsResponse = Api.Ai.SearchToolsResponse
type SearchToolsStatusResponse = Api.Ai.SearchToolsStatusResponse
type TitleGenerationResponse = Api.Ai.TitleGenerationResponse
type TitleToolsStatusResponse = Api.Ai.TitleToolsStatusResponse
type OutlineGenerationResponse = Api.Ai.OutlineGenerationResponse
type OutlineGenerationStatusResponse = Api.Ai.OutlineGenerationStatusResponse

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

  // ============= Scope Agent服务 =============

  /**
   * 执行Scope Agent
   */
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: {
      query: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post<ScopeAgentResponse>('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Scope Agent任务状态
   */
  async getScopeAgentStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get<ScopeAgentStatusResponse>(`/scope-agent/status/${taskId}`, undefined, options)
  }

  /**
   * 获取Scope Agent任务列表
   */
  async getScopeAgentTasks(
    userId: string,
    projectId?: string,
    limit?: number,
    offset?: number,
    options?: ApiRequestConfig
  ) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId
    if (limit) params.limit = limit
    if (offset) params.offset = offset

    return this.get<ScopeAgentListResponse>('/scope-agent/tasks', params, options)
  }

  /**
   * 取消Scope Agent任务
   */
  async cancelScopeAgentTask(taskId: string, options?: ApiRequestConfig) {
    return this.post(`/scope-agent/cancel/${taskId}`, undefined, options)
  }

  /**
   * 获取Scope Agent图状态
   */
  async getScopeAgentState(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/scope-agent/state/${taskId}`, undefined, options)
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

  /**
   * 获取搜索提供商信息
   */
  async getSearchProviders(options?: ApiRequestConfig) {
    return this.get('/search-tools/providers', undefined, options)
  }

  // ============= 标题生成服务 =============

  /**
   * 生成标题
   */
  async generateTitles(
    request: {
      research_brief: string
      web_search_data: any[] | string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.post<TitleGenerationResponse>('/title-generate/generate', request, options)
  }

  /**
   * 获取标题生成工具状态
   */
  async getTitleToolsStatus(options?: ApiRequestConfig) {
    return this.get<TitleToolsStatusResponse>('/title-generate/status', undefined, options)
  }

  /**
   * 验证标题生成请求
   */
  async validateTitleGeneration(
    request: {
      research_brief: string
      web_search_data: any[] | string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.post('/title-generate/validate', request, options)
  }

  // ============= 大纲生成服务 =============

  /**
   * 生成大纲
   */
  async generateOutline(
    request: {
      title: any
      research_brief: string
      web_search_data: any[] | string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.post<OutlineGenerationResponse>('/outline-generate/generate', request, options)
  }

  /**
   * 获取大纲生成工具状态
   */
  async getOutlineToolsStatus(options?: ApiRequestConfig) {
    return this.get<OutlineGenerationStatusResponse>('/outline-generate/status', undefined, options)
  }

  /**
   * 验证大纲生成请求
   */
  async validateOutlineGeneration(
    request: {
      title: any
      research_brief: string
      web_search_data: any[] | string[]
    },
    options?: ApiRequestConfig
  ) {
    return this.post('/outline-generate/validate', request, options)
  }

  // ============= 系统服务 =============

  /**
   * 健康检查
   */
  async healthCheck(options?: ApiRequestConfig) {
    return this.get('/health', undefined, options)
  }
}

// 创建单例实例
export const aiService = new AiService()

export default aiService
