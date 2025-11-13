/**
 * 文档生成服务
 * 基于新的BaseApiService架构，支持Mock/真实API切换
 * 统一管理文档生成相关API：scope-agent, title-agent, outline-agent
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import * as Api from '@/types/api'
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

  // ============= AI素材绑定服务 =============

  /**
   * AI智能绑定素材到章节（新版异步任务API）
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param request - AI素材绑定请求参数
   * @param options - 请求配置选项
   * @returns AI素材绑定任务创建响应
   */
  async executeMaterialBind(
    userId: string,
    projectId: string,
    request: {
      title: string
      outline_sections: any[]
      materials: any[]
    },
    options?: ApiRequestConfig
  ): Promise<{
    success: boolean
    message: string
    task_id?: string
    error?: string
  }> {
    console.log('========================================')
    console.log('[SERVICE] executeMaterialBind 开始执行')
    console.log('[SERVICE] userId:', userId)
    console.log('[SERVICE] projectId:', projectId)
    console.log('[SERVICE] request.title:', request.title)
    console.log('[SERVICE] request.outline_sections 数量:', request.outline_sections.length)
    console.log('[SERVICE] request.materials 数量:', request.materials.length)
    console.log('[SERVICE] API端点: POST /material-bind/execute')
    console.log('========================================')

    const result = await this.post('/material-bind/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })

    console.log('[SERVICE] this.post 返回结果:', result)
    console.log('[SERVICE] executeMaterialBind 执行完成')
    return result as any
  }

  /**
   * 获取素材绑定任务状态
   * @param taskId - 任务ID
   * @param options - 请求配置选项
   * @returns 素材绑定任务状态响应
   */
  async getMaterialBindStatus(
    taskId: string,
    options?: ApiRequestConfig
  ): Promise<{
    success: boolean
    task_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress: number
    result?: {
      title: string
      material_section_bindings: Array<{
        section_id: number
        section_title: string
        materials: Array<{
          id: number
          title: string
          summary: string
          score: number
          published_date: string
          url: string
          relevance_explanation: string
        }>
        binding_type: string
        binding_reason: string
        match_scores: number[]
        material_usage_justification: string
        section_level: number
      }>
      binding_summary: string
      final_report: string
      total_sections: number
      total_materials_bound: number
    }
    error: string | null
    created_at: string
    updated_at: string
  }> {
    return this.get(`/material-bind/status/${taskId}`, undefined, options)
  }

  /**
   * 启动素材绑定任务并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 素材绑定请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务实例
   */
  async executeMaterialBindWithPolling(
    userId: string,
    projectId: string,
    request: {
      title: string
      outline_sections: any[]
      materials: any[]
    },
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    console.log('========================================')
    console.log('[SERVICE] executeMaterialBindWithPolling 开始执行')
    console.log('[SERVICE] userId:', userId)
    console.log('[SERVICE] projectId:', projectId)
    console.log('[SERVICE] request.title:', request.title)
    console.log('[SERVICE] pollingConfig:', pollingConfig)
    console.log('========================================')

    console.log('[SERVICE] 第一步：调用 executeMaterialBind 创建任务')
    const response = await this.executeMaterialBind(userId, projectId, request)
    console.log('[SERVICE] executeMaterialBind 返回:', response)

    if (!response.success || !response.task_id) {
      console.error('[SERVICE] 错误：任务创建失败，response:', response)
      throw new Error(`素材绑定任务启动失败: ${response.message || '未知错误'}`)
    }

    const taskId = response.task_id
    console.log('[SERVICE] 任务创建成功，taskId:', taskId)

    console.log('[SERVICE] 第二步：创建 AsyncTaskPoller')
    const poller = new AsyncTaskPoller(
      () => {
        console.log('[SERVICE POLLER] 执行状态检查...')
        return this.getMaterialBindStatus(taskId).then((result: any) => {
          console.log('[SERVICE POLLER] 状态检查结果:', result)
          const statusMap: Record<string, TaskStatus> = {
            pending: TaskStatus.PENDING,
            running: TaskStatus.RUNNING,
            completed: TaskStatus.COMPLETED,
            failed: TaskStatus.FAILED
          }
          const mappedStatus = statusMap[result.status] || TaskStatus.RUNNING

          return {
            status: mappedStatus,
            data: result,
            isCompleted: result.status === 'completed',
            isFailed: result.status === 'failed'
          }
        })
      },
      {
        interval: 2000,
        timeout: 180000, // 3分钟超时
        maxAttempts: 90,
        ...pollingConfig
      }
    )

    console.log('[SERVICE] 第三步：启动 poller.start()')
    const task = poller.start(`material-bind-${taskId}`)
    console.log('[SERVICE] poller.start() 返回:', task)
    console.log('[SERVICE] executeMaterialBindWithPolling 执行完成')
    return task
  }

  /**
   * @deprecated 已废弃，请使用 executeMaterialBind 替代
   * AI智能绑定素材到章节（旧版同步API）
   */
  async bindMaterialsWithAI(
    request: {
      outline: any[]
      materials: any[]
      title: string
      researchBrief: string
    },
    options?: ApiRequestConfig
  ): Promise<{
    success: boolean
    message: string
    data: {
      bindings: Array<{
        section_index: number
        section_title: string
        bound_materials: Array<{
          material_id: string
          material_title: string
          relevance_score: number
          reason: string
        }>
      }>
      statistics: {
        total_sections: number
        total_bindings: number
        average_relevance: number
      }
    }
  }> {
    console.warn('bindMaterialsWithAI 已废弃，请使用 executeMaterialBind 替代')
    return this.post('/ai/bind-materials', request, options)
  }

  // ============= Outline With Material 服务 =============

  /**
   * 执行大纲与素材生成
   * @param userId - 用户ID
   * @param projectId - 项目ID
   * @param request - 大纲与素材生成请求参数
   * @param options - 请求配置选项
   * @returns 大纲与素材生成响应
   */
  async executeOutlineWithMaterial(
    userId: string,
    projectId: string,
    request: {
      title: string
      materials: any[]
      research_brief?: string
      force_research?: boolean
    },
    options?: ApiRequestConfig
  ): Promise<{
    task_id: string
    status: 'started' | 'pending'
    message: string
  }> {
    return this.post('/outline-with-material/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取大纲与素材生成任务状态
   * @param taskId - 任务ID
   * @param userId - 用户ID
   * @param projectId - 项目ID（可选）
   * @param options - 请求配置选项
   * @returns 任务状态响应
   */
  async getOutlineWithMaterialTask(
    taskId: string,
    userId: string,
    projectId?: string,
    options?: ApiRequestConfig
  ): Promise<{
    task_id: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    data?: {
      title: string
      outline: Array<{
        level: number
        title: string
        content_direction: string
        data_requirements: string[]
        estimated_word_count: number
        priority: 'high' | 'medium' | 'low'
        sources: string[]
        multimedia_elements?: string[]
        audience_consideration?: string
        style_guidance?: string
      }>
      material_bindings: Array<{
        section_id: number
        section_title: string
        materials: Array<{
          id: string
          title: string
          summary: string
          content: string
          score: number
          published_date: string
          url: string
          source: string
          relevance_explanation: string
        }>
        binding_type: string
        binding_reason: string
        match_scores: number[]
        material_usage_justification: string
        section_level: number
      }>
      generation_summary: string
      final_report: string
      used_research_agent: boolean
      total_sections: number
      total_word_estimate: number
      total_materials_bound: number
    }
    created_at: string
    updated_at: string
  }> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.get(`/outline-with-material/task/${taskId}`, params, options)
  }

  /**
   * 启动大纲与素材生成任务并轮询完成
   * @param userId 用户ID
   * @param projectId 项目ID
   * @param request 大纲与素材生成请求参数
   * @param pollingConfig 轮询配置
   * @returns 轮询任务实例
   */
  async executeOutlineWithMaterialWithPolling(
    userId: string,
    projectId: string,
    request: {
      title: string
      materials: any[]
      research_brief?: string
      force_research?: boolean
    },
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.executeOutlineWithMaterial(userId, projectId, request)
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('大纲与素材生成任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getOutlineWithMaterialTask(taskId, userId, projectId).then((result: any) => {
          const statusMap: Record<string, TaskStatus> = {
            pending: TaskStatus.PENDING,
            running: TaskStatus.RUNNING,
            completed: TaskStatus.COMPLETED,
            failed: TaskStatus.FAILED
          }
          const mappedStatus = statusMap[result.status] || TaskStatus.RUNNING

          return {
            status: mappedStatus,
            data: result,
            isCompleted: result.status === 'completed',
            isFailed: result.status === 'failed'
          }
        }),
      {
        interval: 2000,
        timeout: 180000,
        maxAttempts: 90,
        ...pollingConfig
      }
    )

    return poller.start(`outline-with-material-${taskId}`)
  }

  /**
   * 取消大纲与素材生成任务
   * @param taskId - 任务ID
   * @param userId - 用户ID
   * @param projectId - 项目ID（可选）
   * @param options - 请求配置选项
   * @returns 取消响应
   */
  async cancelOutlineWithMaterialTask(
    taskId: string,
    userId: string,
    projectId?: string,
    options?: ApiRequestConfig
  ): Promise<{
    task_id: string
    status: string
    message: string
  }> {
    const params: any = { user_id: userId }
    if (projectId) params.project_id = projectId

    return this.post(`/outline-with-material/cancel/${taskId}`, undefined, {
      ...params,
      ...options
    })
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
}

// 创建单例实例
export const documentGenerateService = new DocumentGenerateService()

export default documentGenerateService
