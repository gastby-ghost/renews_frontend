/**
 * 文档生成服务
 * 基于新的BaseApiService架构，支持Mock/真实API切换
 * 统一管理文档生成相关API：scope-agent, title-agent, outline-agent
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'
import { mockDataManager } from '@/mock'

// 文档生成服务相关类型
type ScopeAgentResponse = Api.Ai.ScopeAgentResponse
type ScopeAgentStatusResponse = Api.Ai.ScopeAgentStatusResponse
type ScopeAgentListResponse = Api.Ai.ScopeAgentListResponse
type ScopeAgentRequest = Api.Ai.ScopeAgentRequest
type Search2TitleAgentResponse = Api.Ai.Search2TitleAgentResponse
type Search2TitleAgentStatusResponse = Api.Ai.Search2TitleAgentStatusResponse
type Search2TitleAgentListResponse = Api.Ai.Search2TitleAgentListResponse
type Search2TitleAgentRequest = Api.Ai.Search2TitleAgentRequest
type TitleGenerationResponse = Api.Ai.TitleGenerationResponse
type TitleToolsStatusResponse = Api.Ai.TitleToolsStatusResponse
type TitleGenerationRequest = Api.Ai.TitleGenerationRequest
type OutlineGenerationResponse = Api.Ai.OutlineGenerationResponse
type OutlineGenerationStatusResponse = Api.Ai.OutlineGenerationStatusResponse
type OutlineGenerationRequest = Api.Ai.OutlineGenerationRequest
type SearchResultItem = Api.Ai.SearchResultItem

class DocumentGenerateService extends BaseApiService {
  constructor() {
    super('documentGenerate')
  }

  // ============= Scope Agent 服务 =============

  /**
   * 执行Scope Agent
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param request - Scope Agent请求参数
   * @param options - 请求配置选项
   * @returns Scope Agent执行响应
   */
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: ScopeAgentRequest,
    options?: ApiRequestConfig
  ): Promise<ScopeAgentResponse> {
    return this.post<ScopeAgentResponse>('/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Scope Agent任务状态
   * @param taskId - 任务ID
   * @param options - 请求配置选项
   * @returns Scope Agent状态响应
   */
  async getScopeAgentStatus(
    taskId: string,
    options?: ApiRequestConfig
  ): Promise<ScopeAgentStatusResponse> {
    return this.get<ScopeAgentStatusResponse>(`/scope-agent/status/${taskId}`, undefined, options)
  }

  /**
   * 获取Scope Agent任务列表
   * @param userId - 用户ID
   * @param projectId - 项目ID（可选）
   * @param limit - 限制数量（可选）
   * @param offset - 偏移量（可选）
   * @param options - 请求配置选项
   * @returns Scope Agent任务列表响应
   */
  async getScopeAgentTasks(
    userId: string,
    projectId?: string,
    limit?: number,
    offset?: number,
    options?: ApiRequestConfig
  ): Promise<ScopeAgentListResponse> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId
    if (limit) params.limit = limit
    if (offset) params.offset = offset

    return this.get<ScopeAgentListResponse>('/scope-agent/tasks', params, options)
  }

  /**
   * 取消Scope Agent任务
   * @param taskId - 任务ID
   * @param options - 请求配置选项
   * @returns 取消响应
   */
  async cancelScopeAgentTask(taskId: string, options?: ApiRequestConfig): Promise<any> {
    return this.post(`/scope-agent/cancel/${taskId}`, undefined, options)
  }

  // ============= Title Agent 服务 =============

  /**
   * 生成标题
   * @param request - 标题生成请求参数
   * @param options - 请求配置选项
   * @returns 标题生成响应
   */
  async generateTitles(
    request: TitleGenerationRequest,
    options?: ApiRequestConfig
  ): Promise<TitleGenerationResponse> {
    return this.post<TitleGenerationResponse>('/title-agent/generate', request, options)
  }

  /**
   * 获取标题生成工具状态
   * @param options - 请求配置选项
   * @returns 标题工具状态响应
   */
  async getTitleToolsStatus(options?: ApiRequestConfig): Promise<TitleToolsStatusResponse> {
    return this.get<TitleToolsStatusResponse>('/title-agent/status', undefined, options)
  }

  /**
   * 验证标题生成请求
   * @param request - 标题生成请求参数
   * @param options - 请求配置选项
   * @returns 验证响应
   */
  async validateTitleGeneration(
    request: TitleGenerationRequest,
    options?: ApiRequestConfig
  ): Promise<any> {
    return this.post('/title-agent/validate', request, options)
  }

  // ============= Outline Agent 服务 =============

  /**
   * 生成大纲
   * @param request - 大纲生成请求参数
   * @param options - 请求配置选项
   * @returns 大纲生成响应
   */
  async generateOutline(
    request: OutlineGenerationRequest,
    options?: ApiRequestConfig
  ): Promise<OutlineGenerationResponse> {
    return this.post<OutlineGenerationResponse>('/outline-agent/generate', request, options)
  }

  /**
   * 获取大纲生成工具状态
   * @param options - 请求配置选项
   * @returns 大纲工具状态响应
   */
  async getOutlineToolsStatus(
    options?: ApiRequestConfig
  ): Promise<OutlineGenerationStatusResponse> {
    return this.get<OutlineGenerationStatusResponse>('/outline-agent/status', undefined, options)
  }

  /**
   * 验证大纲生成请求
   * @param request - 大纲生成请求参数
   * @param options - 请求配置选项
   * @returns 验证响应
   */
  async validateOutlineGeneration(
    request: OutlineGenerationRequest,
    options?: ApiRequestConfig
  ): Promise<any> {
    return this.post('/outline-validate', request, options)
  }

  // ============= Search2Title Agent 服务 =============

  /**
   * 执行Search2Title Agent
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param request - Search2Title Agent请求参数
   * @param options - 请求配置选项
   * @returns Search2Title Agent执行响应
   */
  async executeSearch2TitleAgent(
    userId: string,
    projectId: string,
    request: Search2TitleAgentRequest,
    options?: ApiRequestConfig
  ): Promise<Search2TitleAgentResponse> {
    return this.post<Search2TitleAgentResponse>('/search2title-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Search2Title Agent任务状态
   * @param taskId - 任务ID
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param options - 请求配置选项
   * @returns Search2Title Agent状态响应
   */
  async getSearch2TitleAgentStatus(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ): Promise<Search2TitleAgentStatusResponse> {
    return this.get<Search2TitleAgentStatusResponse>(
      `/search2title-agent/status/${taskId}`,
      {
        user_id: userId,
        project_id: projectId
      },
      options
    )
  }

  /**
   * 获取Search2Title Agent任务列表
   * @param userId - 用户ID
   * @param projectId - 项目ID（可选）
   * @param options - 请求配置选项
   * @returns Search2Title Agent任务列表响应
   */
  async getSearch2TitleAgentTasks(
    userId: string,
    projectId?: string,
    options?: ApiRequestConfig
  ): Promise<Search2TitleAgentListResponse> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get<Search2TitleAgentListResponse>('/search2title-agent/tasks', params, options)
  }

  /**
   * 取消Search2Title Agent任务
   * @param taskId - 任务ID
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param options - 请求配置选项
   * @returns 取消响应
   */
  async cancelSearch2TitleAgentTask(
    taskId: string,
    userId: string,
    projectId: string,
    options?: ApiRequestConfig
  ): Promise<any> {
    return this.post(`/search2title-agent/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  // ============= 便捷方法 =============

  /**
   * 完整的文档生成工作流
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param researchBrief - 研究简报
   * @param webSearchData - 网络搜索数据
   * @param selectedTitle - 选中的标题（用于大纲生成）
   * @param options - 请求配置选项
   */
  async executeDocumentWorkflow(
    userId: string,
    projectId: string,
    researchBrief: string,
    webSearchData: SearchResultItem[],
    selectedTitle?: any,
    options?: ApiRequestConfig
  ): Promise<{
    scopeResult?: ScopeAgentResponse
    titlesResult?: TitleGenerationResponse
    outlineResult?: OutlineGenerationResponse
  }> {
    const results: {
      scopeResult?: ScopeAgentResponse
      titlesResult?: TitleGenerationResponse
      outlineResult?: OutlineGenerationResponse
    } = {}

    try {
      // 1. 执行Scope Agent
      const scopeRequest: ScopeAgentRequest = { query: researchBrief }
      results.scopeResult = await this.executeScopeAgent(userId, projectId, scopeRequest, options)

      // 2. 生成标题
      const titleRequest: TitleGenerationRequest = {
        research_brief: researchBrief,
        web_search_data: webSearchData
      }
      results.titlesResult = await this.generateTitles(titleRequest, options)

      // 3. 生成大纲（如果提供了选中的标题）
      if (selectedTitle) {
        const outlineRequest: OutlineGenerationRequest = {
          title: selectedTitle,
          research_brief: researchBrief,
          web_search_data: webSearchData
        }
        results.outlineResult = await this.generateOutline(outlineRequest, options)
      }

      return results
    } catch (error) {
      console.error('文档生成工作流执行失败:', error)
      throw error
    }
  }

  /**
   * 检查文档生成服务状态
   * @param options - 请求配置选项
   * @returns 服务状态信息
   */
  async checkServiceStatus(options?: ApiRequestConfig): Promise<{
    titleTools: TitleToolsStatusResponse
    outlineTools: OutlineGenerationStatusResponse
  }> {
    const [titleTools, outlineTools] = await Promise.all([
      this.getTitleToolsStatus(options),
      this.getOutlineToolsStatus(options)
    ])

    return {
      titleTools,
      outlineTools
    }
  }

  /**
   * Mock实现方法
   * 为文档生成服务提供Mock数据支持
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
      // Scope Agent相关API
      if (method === 'POST' && url.includes('/scope-agent/execute')) {
        const params = config.params || {}
        return mockDataManager.getMockData('scope-agent-execute', params.user_id, params.project_id)
      }

      if (method === 'GET' && url.includes('/scope-agent/status/')) {
        const taskId = url.split('/').pop()
        return mockDataManager.getMockData('scope-agent-status', taskId)
      }

      if (method === 'GET' && url.includes('/scope-agent/tasks')) {
        const params = config.params || {}
        return mockDataManager.getMockData('scope-agent-list', params.user_id, params.project_id)
      }

      // Title Agent相关API
      if (method === 'POST' && url.includes('/title-agent/generate')) {
        return mockDataManager.getMockData('title-generation')
      }

      if (method === 'GET' && url.includes('/title-agent/status')) {
        return mockDataManager.getMockData('title-tools-status')
      }

      // Outline Agent相关API
      if (method === 'POST' && url.includes('/outline-agent/generate')) {
        return mockDataManager.getMockData('outline-generation')
      }

      if (method === 'GET' && url.includes('/outline-agent/status')) {
        return mockDataManager.getMockData('outline-tools-status')
      }

      // Search2Title Agent相关API
      if (method === 'POST' && url.includes('/search2title-agent/execute')) {
        const requestData = config.data
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search2title-agent-execute',
          params.user_id,
          params.project_id,
          requestData.brief
        )
      }

      if (method === 'GET' && url.includes('/search2title-agent/status/')) {
        const taskId = url.split('/').pop()
        return mockDataManager.getMockData('search2title-agent-status', taskId)
      }

      if (method === 'GET' && url.includes('/search2title-agent/tasks')) {
        const params = config.params || {}
        return mockDataManager.getMockData(
          'search2title-agent-list',
          params.user_id,
          params.project_id
        )
      }

      // 默认Mock响应
      return {
        success: true,
        message: `文档生成服务Mock响应 - ${method} ${url}`,
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
export const documentGenerateService = new DocumentGenerateService()

export default documentGenerateService
