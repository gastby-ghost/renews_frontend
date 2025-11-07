/**
 * 文档生成服务
 * 基于新的BaseApiService架构，支持Mock/真实API切换
 * 统一管理文档生成相关API：scope-agent, title-agent, outline-agent
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import * as Api from '@/types/api'
import { mockDataManager } from '@/mock'
import {
  AsyncTaskPoller,
  type PollingConfig,
  type PollingTask,
  TaskStatus
} from '@/utils/polling/asyncTaskPoller'

// 文档生成服务相关类型
type ScopeAgentResponse = any
type ScopeAgentStatusResponse = any
type ScopeAgentListResponse = any
type ScopeAgentRequest = any
type Search2TitleAgentResponse = any
type Search2TitleAgentStatusResponse = any
type Search2TitleAgentListResponse = any
type Search2TitleAgentRequest = any
type TitleGenerationResponse = any
type TitleToolsStatusResponse = any
type TitleGenerationRequest = any
type OutlineGenerationResponse = any
type OutlineGenerationStatusResponse = any
type OutlineGenerationRequest = any
type SearchResultItem = any

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

  /**
   * 启动Scope Agent并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request Scope Agent请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务实例
   */
  async executeScopeAgentWithPolling(
    userId: string,
    projectId: string,
    request: ScopeAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeScopeAgent(userId, projectId, request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('Scope Agent任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getScopeAgentStatus(taskId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 2000,
        timeout: 120000,
        maxAttempts: 60,
        ...pollingConfig
      }
    )

    return poller.start(`scope-agent-${taskId}`)
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

  /**
   * 启动Search2Title Agent并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request Search2Title Agent请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务实例
   */
  async executeSearch2TitleAgentWithPolling(
    userId: string,
    projectId: string,
    request: Search2TitleAgentRequest,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeSearch2TitleAgent(userId, projectId, request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('Search2Title Agent任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getSearch2TitleAgentStatus(taskId, userId, projectId).then((result) => ({
          status: (result as any).status || TaskStatus.RUNNING,
          data: result,
          isCompleted: (result as any).status === TaskStatus.COMPLETED
        })),
      {
        interval: 2000,
        timeout: 120000,
        maxAttempts: 60,
        ...pollingConfig
      }
    )

    return poller.start(`search2title-agent-${taskId}`)
  }

  // ============= 核心服务 - 研究简报模块 =============

  /**
   * 创建研究简报
   * @param projectId - 项目ID
   * @param request - 研究简报创建请求
   * @param options - 请求配置选项
   * @returns 研究简报创建响应
   */
  async createResearchBrief(
    projectId: number,
    request: Api.ResearchBriefCreate,
    options?: ApiRequestConfig
  ): Promise<Api.ResearchBriefCreateResponse> {
    return this.post<Api.ResearchBriefCreateResponse>(
      `/api/v1/core/projects/${projectId}/briefs`,
      request,
      options
    )
  }

  /**
   * 获取项目的所有研究简报
   * @param projectId - 项目ID
   * @param options - 请求配置选项
   * @returns 研究简报列表响应
   */
  async getProjectBriefs(
    projectId: number,
    options?: ApiRequestConfig
  ): Promise<Api.ResearchBriefListResponse> {
    return this.get<Api.ResearchBriefListResponse>(
      `/api/v1/core/projects/${projectId}/briefs`,
      undefined,
      options
    )
  }

  /**
   * 获取研究简报详情
   * @param briefId - 简报ID
   * @param options - 请求配置选项
   * @returns 研究简报详情响应
   */
  async getBriefDetail(
    briefId: number,
    options?: ApiRequestConfig
  ): Promise<Api.ResearchBriefDetailResponse> {
    return this.get<Api.ResearchBriefDetailResponse>(
      `/api/v1/core/briefs/${briefId}`,
      undefined,
      options
    )
  }

  /**
   * 更新研究简报
   * @param briefId - 简报ID
   * @param request - 研究简报更新请求
   * @param options - 请求配置选项
   * @returns 研究简报更新响应
   */
  async updateResearchBrief(
    briefId: number,
    request: Api.ResearchBriefUpdate,
    options?: ApiRequestConfig
  ): Promise<Api.ResearchBriefUpdateResponse> {
    return this.put<Api.ResearchBriefUpdateResponse>(
      `/api/v1/core/briefs/${briefId}`,
      request,
      options
    )
  }

  /**
   * 删除研究简报
   * @param briefId - 简报ID
   * @param options - 请求配置选项
   * @returns 研究简报删除响应
   */
  async deleteResearchBrief(
    briefId: number,
    options?: ApiRequestConfig
  ): Promise<Api.ResearchBriefDeleteResponse> {
    return this.delete<Api.ResearchBriefDeleteResponse>(`/api/v1/core/briefs/${briefId}`, options)
  }

  // ============= 核心服务 - 标题候选模块 =============

  /**
   * 创建标题候选
   * @param projectId - 项目ID
   * @param request - 标题候选创建请求
   * @param options - 请求配置选项
   * @returns 标题候选创建响应
   */
  async createTitleCandidate(
    projectId: number,
    request: Api.TitleCandidateCreate,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateCreateResponse> {
    return this.post<Api.TitleCandidateCreateResponse>(
      `/api/v1/core/projects/${projectId}/title-candidates`,
      request,
      options
    )
  }

  /**
   * 批量创建标题候选
   * @param projectId - 项目ID
   * @param request - 标题候选批量创建请求
   * @param options - 请求配置选项
   * @returns 标题候选列表响应
   */
  async bulkCreateTitleCandidates(
    projectId: number,
    request: Api.TitleCandidateCreateBulk,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateListResponse> {
    return this.post<Api.TitleCandidateListResponse>(
      `/api/v1/core/projects/${projectId}/title-candidates/bulk`,
      request,
      options
    )
  }

  /**
   * 获取项目的所有标题候选
   * @param projectId - 项目ID
   * @param status - 状态筛选（可选）
   * @param skip - 跳过数量（可选）
   * @param limit - 返回数量（可选）
   * @param options - 请求配置选项
   * @returns 标题候选列表响应
   */
  async getProjectTitleCandidates(
    projectId: number,
    status?: 'generated' | 'selected' | 'rejected',
    skip?: number,
    limit?: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateListResponse> {
    const params: any = {}
    if (status) params.status = status
    if (skip !== undefined) params.skip = skip
    if (limit !== undefined) params.limit = limit

    return this.get<Api.TitleCandidateListResponse>(
      `/api/v1/core/projects/${projectId}/title-candidates`,
      params,
      options
    )
  }

  /**
   * 获取标题候选详情
   * @param candidateId - 标题候选ID
   * @param options - 请求配置选项
   * @returns 标题候选详情响应
   */
  async getTitleCandidateDetail(
    candidateId: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateDetailResponse> {
    return this.get<Api.TitleCandidateDetailResponse>(
      `/api/v1/core/title-candidates/${candidateId}`,
      undefined,
      options
    )
  }

  /**
   * 更新标题候选
   * @param candidateId - 标题候选ID
   * @param request - 标题候选更新请求
   * @param options - 请求配置选项
   * @returns 标题候选更新响应
   */
  async updateTitleCandidate(
    candidateId: number,
    request: Api.TitleCandidateUpdate,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateUpdateResponse> {
    return this.put<Api.TitleCandidateUpdateResponse>(
      `/api/v1/core/title-candidates/${candidateId}`,
      request,
      options
    )
  }

  /**
   * 删除标题候选
   * @param candidateId - 标题候选ID
   * @param options - 请求配置选项
   * @returns 标题候选删除响应
   */
  async deleteTitleCandidate(
    candidateId: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateDeleteResponse> {
    return this.delete<Api.TitleCandidateDeleteResponse>(
      `/api/v1/core/title-candidates/${candidateId}`,
      options
    )
  }

  /**
   * 选择标题候选
   * @param candidateId - 标题候选ID
   * @param request - 标题候选选择请求
   * @param options - 请求配置选项
   * @returns 标题候选选择响应
   */
  async selectTitleCandidate(
    candidateId: number,
    request: Api.TitleCandidateSelect,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateSelectResponse> {
    return this.put<Api.TitleCandidateSelectResponse>(
      `/api/v1/core/title-candidates/${candidateId}/select`,
      request,
      options
    )
  }

  /**
   * 拒绝标题候选
   * @param candidateId - 标题候选ID
   * @param request - 标题候选选择请求
   * @param options - 请求配置选项
   * @returns 标题候选更新响应
   */
  async rejectTitleCandidate(
    candidateId: number,
    request: Api.TitleCandidateSelect,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCandidateUpdateResponse> {
    return this.put<Api.TitleCandidateUpdateResponse>(
      `/api/v1/core/title-candidates/${candidateId}/reject`,
      request,
      options
    )
  }

  // ============= 核心服务 - 标题版本模块 =============

  /**
   * 为项目创建标题（版本化）
   * @param projectId - 项目ID
   * @param request - 标题创建请求
   * @param options - 请求配置选项
   * @returns 标题创建响应
   */
  async createTitle(
    projectId: number,
    request: Api.TitleCreate,
    options?: ApiRequestConfig
  ): Promise<Api.TitleCreateResponse> {
    return this.post<Api.TitleCreateResponse>(
      `/api/v1/core/projects/${projectId}/titles`,
      request,
      options
    )
  }

  /**
   * 获取项目活动标题
   * @param projectId - 项目ID
   * @param options - 请求配置选项
   * @returns 标题详情响应
   */
  async getActiveTitle(
    projectId: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleDetailResponse> {
    return this.get<Api.TitleDetailResponse>(
      `/api/v1/core/projects/${projectId}/titles/active`,
      undefined,
      options
    )
  }

  /**
   * 获取项目标题历史（所有版本）
   * @param projectId - 项目ID
   * @param skip - 跳过数量（可选）
   * @param limit - 返回数量（可选）
   * @param options - 请求配置选项
   * @returns 标题历史响应
   */
  async getTitleHistory(
    projectId: number,
    skip?: number,
    limit?: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleHistoryResponse> {
    const params: any = {}
    if (skip !== undefined) params.skip = skip
    if (limit !== undefined) params.limit = limit

    return this.get<Api.TitleHistoryResponse>(
      `/api/v1/core/projects/${projectId}/titles/history`,
      params,
      options
    )
  }

  /**
   * 获取标题详情
   * @param titleId - 标题ID
   * @param options - 请求配置选项
   * @returns 标题详情响应
   */
  async getTitleDetail(
    titleId: number,
    options?: ApiRequestConfig
  ): Promise<Api.TitleDetailResponse> {
    return this.get<Api.TitleDetailResponse>(`/api/v1/core/titles/${titleId}`, undefined, options)
  }

  /**
   * 更新标题
   * @param titleId - 标题ID
   * @param request - 标题更新请求
   * @param options - 请求配置选项
   * @returns 标题更新响应
   */
  async updateTitle(
    titleId: number,
    request: Api.TitleUpdate,
    options?: ApiRequestConfig
  ): Promise<Api.TitleUpdateResponse> {
    return this.put<Api.TitleUpdateResponse>(`/api/v1/core/titles/${titleId}`, request, options)
  }

  /**
   * 激活标题版本
   * @param titleId - 标题ID
   * @param request - 标题激活请求
   * @param options - 请求配置选项
   * @returns 标题激活响应
   */
  async activateTitle(
    titleId: number,
    request: Api.TitleActivateRequest,
    options?: ApiRequestConfig
  ): Promise<Api.TitleActivateResponse> {
    return this.put<Api.TitleActivateResponse>(
      `/api/v1/core/titles/${titleId}/activate`,
      request,
      options
    )
  }

  /**
   * 停用标题版本
   * @param titleId - 标题ID
   * @param request - 标题停用请求
   * @param options - 请求配置选项
   * @returns 标题停用响应
   */
  async deactivateTitle(
    titleId: number,
    request: Api.TitleDeactivateRequest,
    options?: ApiRequestConfig
  ): Promise<Api.TitleDeactivateResponse> {
    return this.put<Api.TitleDeactivateResponse>(
      `/api/v1/core/titles/${titleId}/deactivate`,
      request,
      options
    )
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
   * 解耦业务逻辑与Mock数据，使用统一的MockDataManager
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method
    const params = config.params || {}
    const requestData = config.data

    try {
      // ============= 核心服务 - 研究简报模块 Mock =============
      if (method === 'POST' && url.match(/\/api\/v1\/core\/projects\/\d+\/briefs$/)) {
        return {
          success: true,
          message: '研究简报创建成功',
          data: {
            id: Math.floor(Math.random() * 10000) + 1000,
            project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
            user_id: 1,
            content: requestData?.content || '',
            metadata: requestData?.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/projects\/\d+\/briefs$/)) {
        return {
          success: true,
          message: '获取研究简报列表成功',
          data: [
            {
              id: 1,
              project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
              user_id: 1,
              content: '研究简报示例内容',
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          total_count: 1
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/briefs\/\d+$/)) {
        return {
          success: true,
          message: '获取研究简报详情成功',
          data: {
            id: parseInt(url.match(/\/briefs\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '研究简报示例内容',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/briefs\/\d+$/)) {
        return {
          success: true,
          message: '研究简报更新成功',
          data: {
            id: parseInt(url.match(/\/briefs\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: requestData?.content || '',
            metadata: requestData?.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'DELETE' && url.match(/\/api\/v1\/core\/briefs\/\d+$/)) {
        return {
          success: true,
          message: '研究简报删除成功',
          deleted_count: 1
        }
      }

      // ============= 核心服务 - 标题候选模块 Mock =============
      if (method === 'POST' && url.match(/\/api\/v1\/core\/projects\/\d+\/title-candidates$/)) {
        return {
          success: true,
          message: '标题候选创建成功',
          data: {
            id: Math.floor(Math.random() * 10000) + 1000,
            project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
            user_id: 1,
            content: requestData?.content || '',
            status: 'generated',
            metadata: requestData?.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (
        method === 'POST' &&
        url.match(/\/api\/v1\/core\/projects\/\d+\/title-candidates\/bulk$/)
      ) {
        const projectId = parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0')
        const candidates = requestData?.candidates || []
        return {
          success: true,
          message: '批量创建标题候选成功',
          data: candidates.map((candidate: any, index: number) => ({
            id: Math.floor(Math.random() * 10000) + 1000 + index,
            project_id: projectId,
            user_id: 1,
            content: candidate.content || '',
            status: 'generated',
            metadata: candidate.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          total_count: candidates.length
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/projects\/\d+\/title-candidates$/)) {
        return {
          success: true,
          message: '获取标题候选列表成功',
          data: [
            {
              id: 1,
              project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
              user_id: 1,
              content: '标题候选示例',
              status: 'generated',
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          total_count: 1
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/title-candidates\/\d+$/)) {
        return {
          success: true,
          message: '获取标题候选详情成功',
          data: {
            id: parseInt(url.match(/\/title-candidates\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题候选示例',
            status: 'generated',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/title-candidates\/\d+$/)) {
        return {
          success: true,
          message: '标题候选更新成功',
          data: {
            id: parseInt(url.match(/\/title-candidates\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: requestData?.content || '',
            status: 'generated',
            metadata: requestData?.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'DELETE' && url.match(/\/api\/v1\/core\/title-candidates\/\d+$/)) {
        return {
          success: true,
          message: '标题候选删除成功',
          deleted_count: 1
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/title-candidates\/\d+\/select$/)) {
        return {
          success: true,
          message: '标题候选选择成功',
          data: {
            id: parseInt(url.match(/\/title-candidates\/(\d+)\/select$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题候选示例',
            status: 'selected',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/title-candidates\/\d+\/reject$/)) {
        return {
          success: true,
          message: '标题候选拒绝成功',
          data: {
            id: parseInt(url.match(/\/title-candidates\/(\d+)\/reject$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题候选示例',
            status: 'rejected',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // ============= 核心服务 - 标题版本模块 Mock =============
      if (method === 'POST' && url.match(/\/api\/v1\/core\/projects\/\d+\/titles$/)) {
        return {
          success: true,
          message: '标题创建成功',
          data: {
            id: Math.floor(Math.random() * 10000) + 1000,
            project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
            user_id: 1,
            content: requestData?.content || '',
            version: requestData?.version || 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/projects\/\d+\/titles\/active$/)) {
        return {
          success: true,
          message: '获取活动标题成功',
          data: {
            id: 1,
            project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
            user_id: 1,
            content: '活动标题示例',
            version: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/projects\/\d+\/titles\/history$/)) {
        return {
          success: true,
          message: '获取标题历史成功',
          data: [
            {
              id: 1,
              project_id: parseInt(url.match(/\/projects\/(\d+)/)?.[1] || '0'),
              user_id: 1,
              content: '标题版本1',
              version: 1,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          total_count: 1
        }
      }

      if (method === 'GET' && url.match(/\/api\/v1\/core\/titles\/\d+$/)) {
        return {
          success: true,
          message: '获取标题详情成功',
          data: {
            id: parseInt(url.match(/\/titles\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题示例',
            version: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/titles\/\d+$/)) {
        return {
          success: true,
          message: '标题更新成功',
          data: {
            id: parseInt(url.match(/\/titles\/(\d+)$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: requestData?.content || '',
            version: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/titles\/\d+\/activate$/)) {
        return {
          success: true,
          message: '标题激活成功',
          data: {
            id: parseInt(url.match(/\/titles\/(\d+)\/activate$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题示例',
            version: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      if (method === 'PUT' && url.match(/\/api\/v1\/core\/titles\/\d+\/deactivate$/)) {
        return {
          success: true,
          message: '标题停用成功',
          data: {
            id: parseInt(url.match(/\/titles\/(\d+)\/deactivate$/)?.[1] || '0'),
            project_id: 1,
            user_id: 1,
            content: '标题示例',
            version: 1,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // ============= 旧版AI服务 Mock（保持向后兼容） =============
      if (method === 'POST' && url.includes('/scope-agent/execute')) {
        return mockDataManager.getMockData('scope-agent-execute', params.user_id, params.project_id)
      }

      if (method === 'GET' && url.includes('/scope-agent/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''
        return mockDataManager.getMockData('scope-agent-status', taskId)
      }

      if (method === 'GET' && url.includes('/scope-agent/tasks')) {
        return mockDataManager.getMockData('scope-agent-list', params.user_id, params.project_id)
      }

      if (method === 'POST' && url.includes('/title-agent/generate')) {
        return mockDataManager.getMockData('title-generation')
      }

      if (method === 'GET' && url.includes('/title-agent/status')) {
        return mockDataManager.getMockData('title-tools-status')
      }

      if (method === 'POST' && url.includes('/outline-agent/generate')) {
        return mockDataManager.getMockData('outline-generation')
      }

      if (method === 'GET' && url.includes('/outline-agent/status')) {
        return mockDataManager.getMockData('outline-tools-status')
      }

      if (method === 'POST' && url.includes('/search2title-agent/execute')) {
        return mockDataManager.getMockData(
          'search2title-agent-execute',
          params.user_id,
          params.project_id,
          requestData.brief
        )
      }

      if (method === 'GET' && url.includes('/search2title-agent/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''
        return mockDataManager.getMockData('search2title-agent-status', taskId, requestData?.brief)
      }

      if (method === 'GET' && url.includes('/search2title-agent/tasks')) {
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
            method
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

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
