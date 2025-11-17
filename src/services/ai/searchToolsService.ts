/**
 * AI搜索工具服务 - 基于OpenAPI配置
 * 专门服务于搜索工具和检索功能
 * 支持异步轮询和Mock/真实API切换
 * 类型定义来自@/types/ai，确保服务层与Store层类型一致
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

// 导入共享类型定义，避免循环依赖
import type {
  SearchToolsExecuteRequest,
  SearchToolsExecuteResponse,
  SearchToolsTaskStatusResponse,
  SearchToolsStateResponse,
  SearchToolsStatusResponse,
  SearchToolsTaskListResponse
} from '@/types/ai'

class SearchToolsService extends BaseApiService {
  constructor() {
    super('searchTools')
  }

  // ============= 搜索工具服务 =============

  /**
   * 执行搜索工具（异步）
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索请求参数
   * @param options API请求选项
   * @returns 搜索工具执行响应
   */
  async executeSearchTools(
    userId: string,
    projectId: string,
    request: SearchToolsExecuteRequest,
    options?: ApiRequestConfig
  ) {
    return this.post<SearchToolsExecuteResponse>('/search-tools/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取搜索工具任务状态
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getSearchToolsStatus(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get<SearchToolsTaskStatusResponse>(
      `/search-tools/status/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 获取搜索工具任务列表
   * @param userId 用户ID
   * @param projectId 项目ID（可选）
   * @param options API请求选项
   * @returns 任务列表
   */
  async getSearchToolsTasks(userId: string, projectId?: string, options?: ApiRequestConfig) {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<SearchToolsTaskListResponse>('/search-tools/tasks', params, options)
  }

  /**
   * 取消搜索工具任务
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 取消结果
   */
  async cancelSearchToolsTask(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.post(`/search-tools/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取搜索工具任务状态
   * @param taskId 任务ID
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param options API请求选项
   * @returns 任务状态
   */
  async getSearchToolsState(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ) {
    return this.get<SearchToolsStateResponse>(
      `/search-tools/state/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 获取搜索工具配置状态
   * @param options API请求选项
   * @returns 配置状态
   */
  async getSearchToolsConfigStatus(options?: ApiRequestConfig) {
    return this.get<SearchToolsStatusResponse>('/search-tools/config/status', undefined, options)
  }

  /**
   * 获取支持的搜索提供商
   * @param options API请求选项
   * @returns 支持的提供商列表
   */
  async getSupportedProviders(options?: ApiRequestConfig) {
    return this.get<any>('/search-tools/providers', undefined, options)
  }

  /**
   * 启动搜索工具并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索工具请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务结果
   */
  async executeSearchToolsWithPolling(
    userId: string,
    projectId: string,
    request: SearchToolsExecuteRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeSearchTools(userId, projectId, request)

    if (!response.success) {
      throw new Error(response.message || '搜索工具任务启动失败')
    }

    const taskId = response.task_id

    if (!taskId) {
      throw new Error('搜索工具任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getSearchToolsStatus(taskId, userId, projectId).then((result) => ({
          status:
            result.status === 'completed'
              ? TaskStatus.COMPLETED
              : result.status === 'failed'
                ? TaskStatus.FAILED
                : TaskStatus.RUNNING,
          data: result,
          isCompleted: result.status === 'completed'
        })),
      {
        interval: 5000,
        timeout: 600000,
        maxAttempts: 120,
        ...pollingConfig
      }
    )

    return poller.start(`search-tools-${taskId}`)
  }

  /**
   * 启动搜索工具并等待完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 搜索工具请求参数
   * @param pollingConfig 轮询配置
   * @returns 搜索结果
   */
  async executeSearchToolsAndWait(
    userId: string,
    projectId: string,
    request: SearchToolsExecuteRequest,
    pollingConfig?: PollingConfig
  ): Promise<SearchToolsTaskStatusResponse> {
    const task = await this.executeSearchToolsWithPolling(userId, projectId, request, pollingConfig)
    const result = await task.promise

    if (result.status !== TaskStatus.COMPLETED) {
      throw new Error(`搜索工具任务失败: ${result.error}`)
    }

    return result.data as SearchToolsTaskStatusResponse
  }

  /**
   * 快速搜索
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param queries 查询关键词
   * @param options 搜索选项
   * @param pollingConfig 轮询配置
   * @returns 搜索结果
   */
  async quickSearch(
    userId: string,
    projectId: string,
    queries: string | string[],
    options?: {
      provider?: 'tavily' | 'bocha'
      max_results?: number
      topic?: 'general' | 'news' | 'finance'
      enable_structured_summaries?: boolean
    },
    pollingConfig?: PollingConfig
  ): Promise<SearchToolsTaskStatusResponse> {
    const request: SearchToolsExecuteRequest = {
      provider: options?.provider || 'tavily',
      queries: Array.isArray(queries) ? queries : [queries],
      max_results: options?.max_results || 10,
      topic: options?.topic || 'general',
      enable_structured_summaries: options?.enable_structured_summaries !== false,
      summary: true,
      include_raw_content: true
    }

    return this.executeSearchToolsAndWait(userId, projectId, request, pollingConfig)
  }

  /**
   * 批量搜索
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param queries 查询关键词数组
   * @param options 搜索选项
   * @returns 搜索结果数组
   */
  async batchSearch(
    userId: string,
    projectId: string,
    queries: string[],
    options?: {
      provider?: 'tavily' | 'bocha'
      max_results?: number
      topic?: 'general' | 'news' | 'finance'
      concurrent?: boolean
    }
  ): Promise<SearchToolsTaskStatusResponse[]> {
    const request: SearchToolsExecuteRequest = {
      provider: options?.provider || 'tavily',
      queries,
      max_results: options?.max_results || 5,
      topic: options?.topic || 'general',
      enable_structured_summaries: true,
      summary: true,
      include_raw_content: false // 减少带宽使用
    }

    // 支持并发搜索（一次提交多个查询）或分别搜索
    if (options?.concurrent) {
      const result = await this.executeSearchToolsAndWait(userId, projectId, request)
      return [result]
    } else {
      // 分别搜索每个查询
      const results: SearchToolsTaskStatusResponse[] = []
      for (const query of queries) {
        try {
          const singleQueryRequest = { ...request, queries: [query] }
          const result = await this.executeSearchToolsAndWait(userId, projectId, singleQueryRequest)
          results.push(result)
        } catch (error) {
          console.error(`批量搜索查询失败: ${query}`, error)
        }
      }
      return results
    }
  }

  /**
   * Mock实现方法
   * 为搜索工具服务提供Mock数据支持
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
      // 搜索工具相关API（异步轮询模式）
      if (method === 'POST' && url.includes('/search-tools/execute')) {
        const requestData = config.data
        const params = config.params || {}
        const taskId = `search_tools_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

        return {
          success: true,
          task_id: taskId,
          message: '搜索任务已启动，正在执行搜索操作...',
          user_id: params.user_id,
          project_id: params.project_id,
          provider: requestData.provider || 'tavily',
          query_preview: Array.isArray(requestData.queries)
            ? requestData.queries.join(', ')
            : 'search query',
          is_default_project: !params.project_id,
          mock: true,
          timestamp: Date.now()
        }
      }

      if (method === 'GET' && url.includes('/search-tools/status/')) {
        // 从URL中提取taskId
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''

        if (taskId) {
          const params = config.params || {}
          const isCompleted = Math.random() > 0.3 // 70%概率完成
          const hasError = Math.random() < 0.1 // 10%概率出错

          return {
            task_id: taskId,
            status: isCompleted ? 'completed' : hasError ? 'failed' : 'processing',
            progress: isCompleted ? 100 : hasError ? 0 : Math.floor(Math.random() * 80 + 10),
            result: isCompleted
              ? mockDataManager.getMockData('search-results', params.queries || [])
              : null,
            error: hasError ? '模拟搜索失败：API密钥无效或网络错误' : null,
            user_id: params.user_id,
            project_id: params.project_id || 'default-project',
            provider: 'tavily',
            query: '示例搜索查询',
            created_at: Date.now() - 30000,
            updated_at: Date.now(),
            is_default_project: !params.project_id,
            mock: true
          }
        }
      }

      if (method === 'GET' && url.includes('/search-tools/tasks')) {
        const params = config.params || {}
        return mockDataManager.getMockData('search-tools-tasks', params.user_id, params.project_id)
      }

      if (method === 'POST' && url.includes('/search-tools/cancel/')) {
        const taskId = url.split('/')[4]
        return {
          success: true,
          message: '搜索工具任务已取消',
          task_id: taskId,
          cancelled_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      if (method === 'GET' && url.includes('/search-tools/state/')) {
        const taskId = url.split('/')[4]
        const params = config.params || {}
        return {
          task_id: taskId,
          status: 'processing',
          progress: Math.floor(Math.random() * 100),
          query: '当前执行的搜索查询',
          config: {
            provider: 'tavily',
            max_results: 10,
            enable_summaries: true
          },
          created_at: Date.now() - 60000,
          updated_at: Date.now(),
          result_available: false,
          error: null,
          user_id: params.user_id,
          mock: true
        }
      }

      if (method === 'GET' && url.includes('/search-tools/config/status')) {
        return mockDataManager.getMockData('search-tools-config-status')
      }

      if (method === 'GET' && url.includes('/search-tools/providers')) {
        return mockDataManager.getMockData('search-providers')
      }

      // 默认Mock响应
      return {
        success: true,
        message: `搜索工具服务Mock响应 - ${method} ${url}`,
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
export const searchToolsService = new SearchToolsService()

export default searchToolsService
