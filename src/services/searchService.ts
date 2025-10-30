/**
 * 素材搜索服务 - 基于OpenAPI配置
 * 专门服务于 @src/views/material/search 模块
 * 支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'
import { mockDataManager } from '@/mock'

// 素材搜索相关类型
type SearchAgentResponse = Api.Ai.SearchAgentResponse
type SearchAgentStatusResponse = Api.Ai.SearchAgentStatusResponse
type SearchAgentListResponse = Api.Ai.SearchAgentListResponse
type SearchToolsResponse = Api.Ai.SearchToolsResponse
type SearchToolsStatusResponse = Api.Ai.SearchToolsStatusResponse

class SearchService extends BaseApiService {
  constructor() {
    super('ai')
  }

  // ============= 搜索工具服务 =============

  /**
   * 执行搜索工具（普通搜索）
   * @param request 搜索请求参数
   * @param options API请求选项
   * @returns 搜索结果
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
   * @param options API请求选项
   * @returns 搜索工具状态
   */
  async getSearchToolsStatus(options?: ApiRequestConfig) {
    return this.get<SearchToolsStatusResponse>('/search-tools/status', undefined, options)
  }

  // ============= Search Agent服务 =============

  /**
   * 执行Search Agent（Agent智能搜索）
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request Agent搜索请求参数
   * @param options API请求选项
   * @returns Agent搜索响应
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
   * 获取Search Agent任务列表
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
   * 取消Search Agent任务
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

  // ============= 通用检索服务 =============

  /**
   * 通用检索搜索（备用搜索方式）
   * @param q 查询关键词
   * @param params 检索参数
   * @param options API请求选项
   * @returns 检索结果
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
   * @param q 查询关键词
   * @param params 检索参数
   * @param options API请求选项
   * @returns 异步任务响应
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
   * @param taskId 任务ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getRetrievalStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/retrieval/status/${taskId}`, undefined, options)
  }

  /**
   * Mock实现方法
   * 为素材搜索服务提供Mock数据支持
   * 专注于material search相关的API mock
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
      // 搜索工具相关API（material search - 普通搜索）
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

      // Search Agent相关API（material search - Agent智能搜索）
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

      // 通用检索相关API（material search - 备用搜索方式）
      if (method === 'GET' && url.includes('/retrieval/search')) {
        const params = config.params || {}
        return mockDataManager.getMockData('retrieval-search', params.q)
      }

      if (method === 'GET' && url.includes('/retrieval/agent-search-async')) {
        const params = config.params || {}
        return mockDataManager.getMockData('retrieval-agent-async', params.q)
      }

      if (method === 'GET' && url.includes('/retrieval/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''
        return mockDataManager.getMockData('retrieval-status', taskId)
      }

      // 默认Mock响应
      return {
        success: true,
        message: `素材搜索服务Mock响应 - ${method} ${url}`,
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
export const searchService = new SearchService()

export default searchService
