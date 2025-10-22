/**
 * AI服务API服务类
 * 提供AI相关功能的统一接口，包括网页总结、检索、搜索工具、标题生成、大纲生成等
 */

import BaseApiService from './base/apiService'
import { mockDataManager } from '@/mock'
import type {
  // 网页总结
  WebpageSummaryAsyncRequest,
  WebpageSummaryAsyncResponse,
  WebpageSummaryStatusResponse,
  // Scope Agent
  ScopeAgentRequest,
  ScopeAgentResponse,
  ScopeAgentStatusResponse,
  ScopeAgentListResponse,
  // Search Agent
  SearchAgentRequest,
  SearchAgentResponse,
  SearchAgentStatusResponse,
  SearchAgentListResponse,
  // 搜索工具
  UnifiedSearchRequest,
  SearchToolsResponse,
  SearchToolsStatusResponse,
  // 标题生成
  TitleGenerationRequest,
  TitleGenerationResponse,
  TitleToolsStatusResponse,
  // 大纲生成
  OutlineGenerationRequest,
  OutlineGenerationResponse,
  OutlineGenerationStatusResponse,
  // 任务管理
  TaskCancelRequest,
  ProvidersResponse
} from '@/types/ai'

class AiService extends BaseApiService {
  constructor() {
    super('ai')
  }

  /**
   * Mock实现
   */
  protected async mockImplementation(config?: any): Promise<any> {
    const { url, method, params, data } = config || {}
    const path = url.replace(this.getEndpoint(), '')

    // 根据路径和方法返回相应的Mock数据
    switch (path) {
      // 网页总结
      case '/webpage-summary/summarize-async':
        if (method === 'POST') {
          return mockDataManager.getMockData('ai-webpage-summary-async', data?.url)
        }
        break

      case '/webpage-summary/status':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return mockDataManager.getMockData('ai-webpage-summary-status', taskId)
        }
        break

      // Scope Agent
      case '/scope-agent/execute':
        if (method === 'POST') {
          return mockDataManager.getMockData(
            'ai-scope-agent-execute',
            params?.user_id,
            params?.project_id,
            data?.query
          )
        }
        break

      case '/scope-agent/status':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return mockDataManager.getMockData('ai-scope-agent-status', taskId)
        }
        break

      case '/scope-agent/tasks':
        if (method === 'GET') {
          return mockDataManager.getMockData(
            'ai-scope-agent-list',
            params?.user_id,
            params?.project_id
          )
        }
        break

      case '/scope-agent/cancel':
        if (method === 'POST') {
          const taskId = url.split('/').pop()
          return { success: true, message: '任务已取消', task_id: taskId }
        }
        break

      case '/scope-agent/state':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return {
            task_id: taskId,
            state: {
              messages: [],
              next_nodes: [],
              current_node: 'start'
            }
          }
        }
        break

      // Search Agent
      case '/search-agent/execute':
        if (method === 'POST') {
          return mockDataManager.getMockData(
            'ai-search-agent-execute',
            params?.user_id,
            params?.project_id,
            data?.brief
          )
        }
        break

      case '/search-agent/status':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return mockDataManager.getMockData('ai-search-agent-status', taskId)
        }
        break

      case '/search-agent/tasks':
        if (method === 'GET') {
          return mockDataManager.getMockData(
            'ai-search-agent-list',
            params?.user_id,
            params?.project_id
          )
        }
        break

      case '/search-agent/cancel':
        if (method === 'POST') {
          const taskId = url.split('/').pop()
          return { success: true, message: '任务已取消', task_id: taskId }
        }
        break

      case '/search-agent/state':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return {
            task_id: taskId,
            state: {
              messages: [],
              next_nodes: [],
              current_node: 'research'
            }
          }
        }
        break

      // 搜索工具
      case '/search-tools/search':
        if (method === 'POST') {
          return mockDataManager.getMockData('ai-search-tools', data?.queries, data?.provider)
        }
        break

      case '/search-tools/status':
        if (method === 'GET') {
          return mockDataManager.getMockData('ai-search-tools-status')
        }
        break

      case '/search-tools/providers':
        if (method === 'GET') {
          return mockDataManager.getMockData('ai-providers')
        }
        break

      // 标题生成
      case '/title-generate/generate':
        if (method === 'POST') {
          return mockDataManager.getMockData(
            'ai-title-generation',
            data?.research_brief,
            data?.web_search_data
          )
        }
        break

      case '/title-generate/status':
        if (method === 'GET') {
          return mockDataManager.getMockData('ai-title-tools-status')
        }
        break

      case '/title-generate/validate':
        if (method === 'POST') {
          return { valid: true, errors: [], warnings: [] }
        }
        break

      // 大纲生成
      case '/outline-generate/generate':
        if (method === 'POST') {
          return mockDataManager.getMockData(
            'ai-outline-generation',
            data?.title,
            data?.research_brief,
            data?.web_search_data
          )
        }
        break

      case '/outline-generate/status':
        if (method === 'GET') {
          return mockDataManager.getMockData('ai-outline-tools-status')
        }
        break

      case '/outline-generate/validate':
        if (method === 'POST') {
          return { valid: true, errors: [], warnings: [] }
        }
        break

      // 检索服务
      case '/retrieval/search':
        if (method === 'GET') {
          return mockDataManager.getMockData(
            'ai-search-tools',
            [params?.q],
            params?.provider || 'tavily'
          )
        }
        break

      case '/retrieval/agent-search-async':
        if (method === 'GET') {
          return {
            success: true,
            task_id: `retrieval_agent_${Date.now()}`,
            message: '检索Agent任务已创建'
          }
        }
        break

      case '/retrieval/status':
        if (method === 'GET') {
          const taskId = url.split('/').pop()
          return {
            success: true,
            task_id: taskId,
            status: 'completed',
            progress: 100,
            result: {
              search_results: [],
              summary: '检索完成'
            }
          }
        }
        break

      // 任务管理
      case '/tasks':
        if (method === 'POST' && url.includes('cancel')) {
          const taskId = url.split('/').slice(-2)[0]
          return { success: true, message: '任务已取消', task_id: taskId }
        }
        break

      // 健康检查
      case '/health':
        if (method === 'GET') {
          return {
            status: 'healthy',
            timestamp: Date.now(),
            services: {
              api: 'ok',
              celery: 'ok'
            }
          }
        }
        break

      default:
        throw new Error(`未实现的Mock路径: ${path}`)
    }
  }

  // ============= 网页总结服务 =============

  /**
   * 异步网页总结
   */
  async summarizeWebpageAsync(
    request: WebpageSummaryAsyncRequest
  ): Promise<WebpageSummaryAsyncResponse> {
    return this.post<WebpageSummaryAsyncResponse>('/webpage-summary/summarize-async', request)
  }

  /**
   * 获取网页总结任务状态
   */
  async getWebpageSummaryStatus(taskId: string): Promise<WebpageSummaryStatusResponse> {
    return this.get<WebpageSummaryStatusResponse>(`/webpage-summary/status/${taskId}`)
  }

  // ============= Scope Agent服务 =============

  /**
   * 执行Scope Agent
   */
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: ScopeAgentRequest
  ): Promise<ScopeAgentResponse> {
    return this.post<ScopeAgentResponse>('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  /**
   * 获取Scope Agent任务状态
   */
  async getScopeAgentStatus(taskId: string): Promise<ScopeAgentStatusResponse> {
    return this.get<ScopeAgentStatusResponse>(`/scope-agent/status/${taskId}`)
  }

  /**
   * 获取Scope Agent任务列表
   */
  async getScopeAgentTasks(
    userId: string,
    projectId?: string,
    limit?: number,
    offset?: number
  ): Promise<ScopeAgentListResponse> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId
    if (limit) params.limit = limit
    if (offset) params.offset = offset

    return this.get<ScopeAgentListResponse>('/scope-agent/tasks', params)
  }

  /**
   * 取消Scope Agent任务
   */
  async cancelScopeAgentTask(taskId: string): Promise<any> {
    return this.post(`/scope-agent/cancel/${taskId}`)
  }

  /**
   * 获取Scope Agent图状态
   */
  async getScopeAgentState(taskId: string): Promise<any> {
    return this.get(`/scope-agent/state/${taskId}`)
  }

  // ============= Search Agent服务 =============

  /**
   * 执行Search Agent
   */
  async executeSearchAgent(
    userId: string,
    projectId: string,
    request: SearchAgentRequest
  ): Promise<SearchAgentResponse> {
    return this.post<SearchAgentResponse>('/search-agent/execute', request, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  /**
   * 获取Search Agent任务状态
   */
  async getSearchAgentStatus(
    taskId: string,
    userId: string,
    projectId: string
  ): Promise<SearchAgentStatusResponse> {
    return this.get<SearchAgentStatusResponse>(`/search-agent/status/${taskId}`, {
      user_id: userId,
      project_id: projectId
    })
  }

  /**
   * 获取Search Agent任务列表
   */
  async getSearchAgentTasks(userId: string, projectId?: string): Promise<SearchAgentListResponse> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<SearchAgentListResponse>('/search-agent/tasks', params)
  }

  /**
   * 取消Search Agent任务
   */
  async cancelSearchAgentTask(taskId: string, userId: string, projectId: string): Promise<any> {
    return this.post(`/search-agent/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId }
    })
  }

  /**
   * 获取Search Agent图状态
   */
  async getSearchAgentState(taskId: string, userId: string, projectId: string): Promise<any> {
    return this.get(`/search-agent/state/${taskId}`, {
      user_id: userId,
      project_id: projectId
    })
  }

  // ============= 搜索工具服务 =============

  /**
   * 执行搜索工具
   */
  async searchTools(request: UnifiedSearchRequest): Promise<SearchToolsResponse> {
    return this.post<SearchToolsResponse>('/search-tools/search', request)
  }

  /**
   * 获取搜索工具状态
   */
  async getSearchToolsStatus(): Promise<SearchToolsStatusResponse> {
    return this.get<SearchToolsStatusResponse>('/search-tools/status')
  }

  /**
   * 获取搜索提供商信息
   */
  async getSearchProviders(): Promise<ProvidersResponse> {
    return this.get<ProvidersResponse>('/search-tools/providers')
  }

  // ============= 标题生成服务 =============

  /**
   * 生成标题
   */
  async generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
    return this.post<TitleGenerationResponse>('/title-generate/generate', request)
  }

  /**
   * 获取标题生成工具状态
   */
  async getTitleToolsStatus(): Promise<TitleToolsStatusResponse> {
    return this.get<TitleToolsStatusResponse>('/title-generate/status')
  }

  /**
   * 验证标题生成请求
   */
  async validateTitleGeneration(request: TitleGenerationRequest): Promise<any> {
    return this.post('/title-generate/validate', request)
  }

  // ============= 大纲生成服务 =============

  /**
   * 生成大纲
   */
  async generateOutline(request: OutlineGenerationRequest): Promise<OutlineGenerationResponse> {
    return this.post<OutlineGenerationResponse>('/outline-generate/generate', request)
  }

  /**
   * 获取大纲生成工具状态
   */
  async getOutlineToolsStatus(): Promise<OutlineGenerationStatusResponse> {
    return this.get<OutlineGenerationStatusResponse>('/outline-generate/status')
  }

  /**
   * 验证大纲生成请求
   */
  async validateOutlineGeneration(request: OutlineGenerationRequest): Promise<any> {
    return this.post('/outline-generate/validate', request)
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
    }
  ): Promise<any> {
    return this.get('/retrieval/search', { q, ...params })
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
    }
  ): Promise<any> {
    return this.get('/retrieval/agent-search-async', { q, ...params })
  }

  /**
   * 获取检索任务状态
   */
  async getRetrievalStatus(taskId: string): Promise<any> {
    return this.get(`/retrieval/status/${taskId}`)
  }

  // ============= 任务管理 =============

  /**
   * 取消任务
   */
  async cancelTask(request: TaskCancelRequest): Promise<any> {
    return this.post(`/tasks/${request.task_id}/cancel`, null, {
      params: {
        task_id: request.task_id,
        terminate: request.terminate,
        signal: request.signal
      }
    })
  }

  // ============= 系统服务 =============

  /**
   * 健康检查
   */
  async healthCheck(): Promise<any> {
    return this.get('/health')
  }
}

// 创建单例实例
export const aiService = new AiService()

export default aiService
