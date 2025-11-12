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
    return result
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

      // AI智能绑定素材
      if (method === 'POST' && url.includes('/ai/bind-materials')) {
        const { outline, materials } = requestData || {}
        const bindings: any[] = []

        if (outline && materials) {
          outline.forEach((section: any, sectionIndex: number) => {
            const sectionBindings: any = {
              section_index: sectionIndex,
              section_title: section.title,
              bound_materials: []
            }

            // AI逻辑：根据章节标题和内容方向匹配素材
            materials.forEach((material: any) => {
              // 简单的相关性评分算法（实际项目中应使用更复杂的AI模型）
              let relevanceScore = 0

              // 基于关键词匹配评分
              const sectionText =
                `${section.title} ${section.content_direction || ''}`.toLowerCase()
              const materialText =
                `${material.title} ${material.summary || ''} ${(material.tags || []).join(' ')}`.toLowerCase()

              // 计算共同关键词
              const sectionKeywords = sectionText.split(/\s+/).filter((w: string) => w.length > 1)
              const materialKeywords = materialText.split(/\s+/).filter((w: string) => w.length > 1)

              const commonKeywords = sectionKeywords.filter((kw: string) =>
                materialKeywords.includes(kw)
              )
              relevanceScore = commonKeywords.length / Math.max(sectionKeywords.length, 1)

              // 基于素材分数加权
              relevanceScore = relevanceScore * 0.7 + (material.score || 0) * 0.3

              // 如果相关性超过阈值，则绑定
              if (relevanceScore > 0.3) {
                sectionBindings.bound_materials.push({
                  material_id: material.id,
                  material_title: material.title,
                  relevance_score: Number(relevanceScore.toFixed(2)),
                  reason: `基于关键词"${commonKeywords.slice(0, 3).join('、')}"匹配`
                })
              }
            })

            // 按相关性分数排序，只保留前3个
            sectionBindings.bound_materials.sort(
              (a: any, b: any) => b.relevance_score - a.relevance_score
            )
            sectionBindings.bound_materials = sectionBindings.bound_materials.slice(0, 3)

            bindings.push(sectionBindings)
          })
        }

        const totalBindings = bindings.reduce((sum, b) => sum + b.bound_materials.length, 0)
        const averageRelevance =
          totalBindings > 0
            ? Number(
                (
                  bindings.reduce(
                    (sum, b) =>
                      sum +
                      b.bound_materials.reduce((s: number, m: any) => s + m.relevance_score, 0),
                    0
                  ) / totalBindings
                ).toFixed(2)
              )
            : 0

        return {
          success: true,
          message: 'AI智能绑定完成',
          data: {
            bindings,
            statistics: {
              total_sections: outline?.length || 0,
              total_bindings: totalBindings,
              average_relevance: averageRelevance
            }
          }
        }
      }

      if (method === 'POST' && url.includes('/outline-with-material/execute')) {
        const taskId = `outline_material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.log('[MOCK] 大纲与素材生成任务已创建:', taskId)
        console.log('[MOCK] 请求参数:', requestData)

        return {
          task_id: taskId,
          status: 'started',
          message: '大纲与素材生成任务已启动'
        }
      }

      if (method === 'GET' && url.includes('/outline-with-material/task/')) {
        const parts = url.split('/')
        const taskIndex = parts.indexOf('task')
        const taskId = taskIndex > -1 ? parts[taskIndex + 1] : ''

        console.log('[MOCK] 检查大纲与素材生成任务状态:', taskId)

        // 模拟进度变化
        const elapsed = Date.now() - parseInt(taskId.split('_')[2] || '0')
        const progress = Math.min(100, Math.floor(elapsed / 100))

        if (progress < 100) {
          return {
            task_id: taskId,
            status: 'running',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        } else {
          // 返回完整的模拟数据（基于responsedata.json）
          const mockResult = {
            title: requestData?.title || '人工智能在医疗领域的革命性突破',
            outline: [
              {
                level: 1,
                title: '导语：AI医疗革命性突破重塑就医体验',
                content_direction:
                  '采用倒金字塔结构，开篇点明AI在医疗领域的革命性影响，突出95%癌症诊断准确率、40%并发症降低等核心数据，强调对普通患者就医体验的直接影响。体现新闻时效性，引用最新研究数据，保持客观报道风格，避免过度渲染。',
                data_requirements: [
                  'AI诊断准确率对比数据',
                  '手术并发症发生率统计',
                  '患者就医体验改善案例'
                ],
                estimated_word_count: 150,
                priority: 'high',
                sources: ['1', '2'],
                multimedia_elements: ['AI医疗应用场景概念图', '诊断准确率对比图表'],
                audience_consideration:
                  '用通俗语言解释专业术语，重点突出对普通人看病就医的实际好处，如更准的诊断、更快的康复、更低的费用',
                style_guidance: '开门见山，用具体数据说话，避免专业术语堆砌，保持新闻客观性'
              },
              {
                level: 1,
                title: 'AI诊断：精准识别微小病灶，癌症筛查准确率达95%',
                content_direction:
                  '详细展开AI在诊断领域的突破，重点介绍深度学习系统识别微小肿瘤的能力，对比传统方法70%准确率与AI的95%准确率，强调早期发现对治疗时机的关键意义。引用具体研究案例，保持数据支撑的客观性。',
                data_requirements: [
                  '深度学习系统技术原理简化说明',
                  '不同癌症类型诊断准确率细分',
                  '早期发现治疗成功率对比'
                ],
                estimated_word_count: 250,
                priority: 'high',
                sources: ['1'],
                multimedia_elements: ['AI识别肿瘤病灶示意图', '传统方法与AI诊断准确率对比柱状图'],
                audience_consideration:
                  "用'火眼金睛'等比喻帮助理解AI识别能力，强调'早发现早治疗'对普通人的生命健康价值",
                style_guidance: '数据说话，案例支撑，避免技术细节堆砌，突出实际应用价值'
              },
              {
                level: 1,
                title: '机器人手术：并发症降低40%，住院时间缩短30%',
                content_direction:
                  '介绍机器人辅助手术系统的临床应用成效，重点说明在心脏手术、神经外科等复杂手术中的表现，用具体数据展示患者获益。分析技术如何提高手术精度，减少人为误差。',
                data_requirements: [
                  '机器人手术系统操作原理简化说明',
                  '不同手术类型并发症降低数据',
                  '患者康复时间具体案例'
                ],
                estimated_word_count: 200,
                priority: 'high',
                sources: ['2'],
                multimedia_elements: ['机器人手术操作场景配图', '并发症发生率下降趋势图'],
                audience_consideration:
                  "重点说明'少受罪、快出院'对患者的意义，用具体康复案例增强说服力",
                style_guidance: '客观描述技术成效，用患者获益案例增强报道亲和力'
              }
            ],
            material_bindings: [
              {
                section_id: 1,
                section_title: '导语：AI医疗革命性突破重塑就医体验',
                materials: [
                  {
                    id: '1',
                    title: 'AI诊断系统在癌症早期筛查中的准确性突破',
                    summary:
                      '最新研究显示，基于深度学习的AI诊断系统在癌症早期筛查中达到95%的准确率，显著高于传统方法的70%。该系统能够识别微小的肿瘤病灶，为患者争取最佳治疗时机。',
                    content:
                      '基于深度学习的AI诊断系统在癌症早期筛查中达到95%的准确率，显著高于传统方法的70%。该系统能够识别微小的肿瘤病灶，为患者争取最佳治疗时机。',
                    score: 0.95,
                    published_date: '2024-11-01',
                    url: 'https://example.com/ai-cancer-diagnosis',
                    source: '学术论文',
                    relevance_explanation:
                      '直接提供章节所需的AI诊断准确率对比数据（95% vs 70%），完美匹配导语对核心数据的强调要求'
                  }
                ],
                binding_type: 'required',
                binding_reason:
                  '素材1提供核心数据支撑：95%癌症诊断准确率直接对应章节数据需求，素材2提供并发症降低40%数据，素材4体现远程医疗对就医体验的改善。',
                match_scores: [0.95],
                material_usage_justification:
                  '素材1作为核心数据支撑，提供95%诊断准确率的关键数据，完美匹配导语章节需求',
                section_level: 1
              },
              {
                section_id: 2,
                section_title: 'AI诊断：精准识别微小病灶，癌症筛查准确率达95%',
                materials: [
                  {
                    id: '1',
                    title: 'AI诊断系统在癌症早期筛查中的准确性突破',
                    summary:
                      '最新研究显示，基于深度学习的AI诊断系统在癌症早期筛查中达到95%的准确率，显著高于传统方法的70%。该系统能够识别微小的肿瘤病灶，为患者争取最佳治疗时机。',
                    content:
                      '基于深度学习的AI诊断系统在癌症早期筛查中达到95%的准确率，显著高于传统方法的70%。该系统能够识别微小的肿瘤病灶，为患者争取最佳治疗时机。',
                    score: 0.95,
                    published_date: '2024-11-01',
                    url: 'https://example.com/ai-cancer-diagnosis',
                    source: '学术论文',
                    relevance_explanation:
                      '与章节标题和内容方向完全一致，提供95%准确率核心数据和识别微小病灶的能力说明'
                  }
                ],
                binding_type: 'required',
                binding_reason:
                  '素材1与本章节主题高度契合，不仅提供95%准确率的核心数据，还详细说明识别微小病灶的能力，完美匹配章节需求。',
                match_scores: [0.95],
                material_usage_justification:
                  '素材1完美匹配本章节所有核心需求，提供95%准确率数据和识别微小病灶能力说明',
                section_level: 1
              },
              {
                section_id: 3,
                section_title: '机器人手术：并发症降低40%，住院时间缩短30%',
                materials: [
                  {
                    id: '2',
                    title: '机器人辅助手术系统降低并发症风险',
                    summary:
                      '采用机器人辅助手术系统的患者，术后并发症发生率降低40%，住院时间缩短30%。该技术在心脏手术、神经外科等领域表现突出。',
                    content:
                      '采用机器人辅助手术系统的患者，术后并发症发生率降低40%，住院时间缩短30%。该技术在心脏手术、神经外科等领域表现突出。',
                    score: 0.88,
                    published_date: '2024-10-15',
                    url: 'https://example.com/robot-surgery',
                    source: '案例研究',
                    relevance_explanation:
                      '完全匹配章节标题中的核心数据（并发症降低40%，住院时间缩短30%），并在复杂手术领域的表现说明符合内容方向'
                  }
                ],
                binding_type: 'required',
                binding_reason:
                  '素材2直接提供并发症降低40%和住院时间缩短30%的核心数据，完全匹配章节标题和数据需求。',
                match_scores: [0.88],
                material_usage_justification:
                  '素材2是本章节最核心的支撑素材，直接提供标题中强调的两个关键数据指标',
                section_level: 1
              }
            ],
            generation_summary: '',
            final_report: '成功绑定 3 个章节的素材',
            used_research_agent: false,
            total_sections: 3,
            total_word_estimate: 600,
            total_materials_bound: 3
          }

          return {
            task_id: taskId,
            status: 'completed',
            data: mockResult,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
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

      // ============= 素材绑定服务 Mock =============
      if (method === 'POST' && url.includes('/material-bind/execute')) {
        console.log('[MOCK] ========================================')
        console.log('[MOCK] 收到 POST /material-bind/execute 请求')
        console.log('[MOCK] user_id:', params.user_id)
        console.log('[MOCK] project_id:', params.project_id)
        console.log('[MOCK] requestData:', requestData)
        console.log('[MOCK] ========================================')

        // 生成任务ID
        const taskId = `material_bind_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        console.log('[MOCK] 生成的 taskId:', taskId)
        console.log('[MOCK] 准备返回响应')

        // 模拟异步任务创建
        setTimeout(() => {
          // 模拟任务处理完成
          console.log('[MOCK] 模拟任务处理完成:', taskId)
        }, 3000)

        const response = {
          success: true,
          message: '素材绑定任务已创建',
          task_id: taskId
        }

        console.log('[MOCK] 返回响应:', response)
        return response
      }

      if (method === 'GET' && url.includes('/material-bind/status/')) {
        const parts = url.split('/')
        const statusIndex = parts.indexOf('status')
        const taskId = statusIndex > -1 ? parts[statusIndex + 1] : ''

        console.log('[MOCK] ========================================')
        console.log('[MOCK] 收到 GET /material-bind/status/', taskId)
        console.log('[MOCK] taskId:', taskId)

        // 模拟进度变化
        const elapsed = Date.now() - parseInt(taskId.split('_')[2] || '0')
        const progress = Math.min(100, Math.floor(elapsed / 30)) // 每30ms增加1%

        console.log('[MOCK] elapsed:', elapsed, 'ms')
        console.log('[MOCK] progress:', progress, '%')

        if (progress < 100) {
          // 任务进行中
          console.log('[MOCK] 任务进行中，返回 running 状态')
          const response = {
            success: true,
            task_id: taskId,
            status: 'running',
            progress: progress,
            result: null,
            error: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('[MOCK] 返回响应:', response)
          console.log('[MOCK] ========================================')
          return response
        } else {
          // 任务完成 - 返回模拟的绑定结果
          console.log('[MOCK] 任务完成，返回 completed 状态')
          const mockResult = {
            title: requestData?.title || 'AI技术在2024年的最新发展',
            material_section_bindings: [
              {
                section_id: 1,
                section_title: 'AI技术概述',
                materials: [
                  {
                    id: 1001,
                    title: 'AI技术发展简史',
                    summary: '从1950年代开始的人工智能发展历程',
                    score: 0.95,
                    published_date: '2024-01-15 10:00:00',
                    url: 'https://example.com/ai-history',
                    relevance_explanation: '直接提供AI发展历程的核心内容，完美匹配章节需求'
                  }
                ],
                binding_type: 'required',
                binding_reason: '该章节需要介绍AI技术的基本概念和发展历程',
                match_scores: [0.95],
                material_usage_justification:
                  '素材1001作为核心素材，为章节提供AI发展历程的完整框架',
                section_level: 1
              }
            ],
            binding_summary: '本次绑定成功为1个章节分配了1个素材，匹配度较高',
            final_report: '成功绑定 1 个章节的素材',
            total_sections: 1,
            total_materials_bound: 1
          }

          const response = {
            success: true,
            task_id: taskId,
            status: 'completed',
            progress: 100,
            result: mockResult,
            error: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log('[MOCK] 返回响应:', response)
          console.log('[MOCK] ========================================')
          return response
        }
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
