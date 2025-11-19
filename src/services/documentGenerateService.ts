/**
 * 文档生成服务聚合器
 * 基于新的BaseApiService架构，支持Mock/真实API切换
 * 统一管理文档生成相关API：scope-agent, title-agent, outline-agent, material-bind等
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import {
  AsyncTaskPoller,
  type PollingConfig,
  type PollingTask,
  TaskStatus
} from '@/utils/polling/asyncTaskPoller'

// ============= Scope Agent 服务 =============
class ScopeAgentService extends BaseApiService {
  constructor() {
    super('scopeAgent')
  }

  /**
   * 执行Scope Agent
   */
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.post('/document_generate/scope-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Scope Agent任务状态
   */
  async getScopeAgentStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/document_generate/scope-agent/status/${taskId}`, undefined, options)
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

    return this.get('/document_generate/scope-agent/tasks', params, options)
  }

  /**
   * 取消Scope Agent任务
   */
  async cancelScopeAgentTask(taskId: string, options?: ApiRequestConfig) {
    return this.post(`/document_generate/scope-agent/cancel/${taskId}`, undefined, options)
  }

  /**
   * 启动Scope Agent并轮询完成
   */
  async executeScopeAgentWithPolling(
    userId: string,
    projectId: string,
    request: any,
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
}

// ============= Title Generate 服务 =============
class TitleGenerateService extends BaseApiService {
  constructor() {
    super('titleGenerate')
  }

  /**
   * 生成标题
   */
  async generateTitles(request: any, options?: ApiRequestConfig) {
    return this.post('/document_generate/title-agent/generate', request, options)
  }

  /**
   * 获取标题生成工具状态
   */
  async getTitleToolsStatus(options?: ApiRequestConfig) {
    return this.get('/document_generate/title-agent/status', undefined, options)
  }

  /**
   * 验证标题生成请求
   */
  async validateTitleGeneration(request: any, options?: ApiRequestConfig) {
    return this.post('/document_generate/title-agent/validate', request, options)
  }
}

// ============= Outline Generate 服务 =============
class OutlineGenerateService extends BaseApiService {
  constructor() {
    super('outlineGenerate')
  }

  /**
   * 生成大纲
   */
  async generateOutline(request: any, options?: ApiRequestConfig) {
    return this.post('/document_generate/outline-agent/generate', request, options)
  }

  /**
   * 获取大纲生成工具状态
   */
  async getOutlineToolsStatus(options?: ApiRequestConfig) {
    return this.get('/document_generate/outline-agent/status', undefined, options)
  }

  /**
   * 验证大纲生成请求
   */
  async validateOutlineGeneration(request: any, options?: ApiRequestConfig) {
    return this.post('/document_generate/outline-validate', request, options)
  }
}

// ============= Material Bind 服务 =============
class MaterialBindService extends BaseApiService {
  constructor() {
    super('materialBind')
  }

  /**
   * AI智能绑定素材到章节
   */
  async executeMaterialBind(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    console.log('[MaterialBindService] executeMaterialBind 开始执行')
    console.log('[MaterialBindService] userId:', userId)
    console.log('[MaterialBindService] projectId:', projectId)
    console.log('[MaterialBindService] API端点: POST /document_generate/material-bind/execute')

    const result = await this.post('/document_generate/material-bind/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })

    console.log('[MaterialBindService] executeMaterialBind 执行完成')
    return result
  }

  /**
   * 获取素材绑定任务状态
   */
  async getMaterialBindStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/document_generate/material-bind/status/${taskId}`, undefined, options)
  }

  /**
   * AI智能素材绑定（兼容旧版本）
   */
  async bindMaterialsWithAI(request: any, options?: ApiRequestConfig) {
    return this.post('/document_generate/material-bind/execute', request, options)
  }
}

// ============= Outline With Material 服务 =============
class OutlineWithMaterialService extends BaseApiService {
  constructor() {
    super('outlineWithMaterial')
  }

  /**
   * 基于素材生成大纲
   */
  async executeOutlineWithMaterial(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.post('/document_generate/outline-with-material/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取大纲生成任务状态
   */
  async getOutlineWithMaterialStatus(taskId: string, params?: any, options?: ApiRequestConfig) {
    return this.get(`/document_generate/outline-with-material/task/${taskId}`, params, options)
  }

  /**
   * 取消大纲生成任务
   */
  async cancelOutlineWithMaterialTask(taskId: string, params: any, options?: ApiRequestConfig) {
    return this.post(`/document_generate/outline-with-material/cancel/${taskId}`, undefined, {
      ...params,
      ...options
    })
  }
}

// ============= Search2Title Agent 服务 =============
class Search2TitleAgentService extends BaseApiService {
  constructor() {
    super('search2titleAgent')
  }

  /**
   * 执行Search2Title Agent
   */
  async executeSearch2TitleAgent(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.post('/document_generate/search2title-agent/execute', request, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }

  /**
   * 获取Search2Title Agent状态
   */
  async getSearch2TitleAgentStatus(taskId: string, options?: ApiRequestConfig) {
    return this.get(`/document_generate/search2title-agent/status/${taskId}`, undefined, options)
  }

  /**
   * 获取Search2Title Agent任务列表
   */
  async getSearch2TitleAgentTasks(
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

    return this.get('/document_generate/search2title-agent/tasks', params, options)
  }

  /**
   * 取消Search2Title Agent任务
   */
  async cancelSearch2TitleAgentTask(
    userId: string,
    projectId: string,
    taskId: string,
    options?: ApiRequestConfig
  ) {
    return this.post(`/document_generate/search2title-agent/cancel/${taskId}`, null, {
      params: { user_id: userId, project_id: projectId },
      ...options
    })
  }
}

// ============= 文档生成服务聚合器 =============
/**
 * 为了保持向后兼容性，提供统一的服务入口
 * 建议新代码直接使用具体的服务类
 */
class DocumentGenerateService {
  private scopeAgentService: ScopeAgentService
  private titleGenerateService: TitleGenerateService
  private outlineGenerateService: OutlineGenerateService
  private materialBindService: MaterialBindService
  private outlineWithMaterialService: OutlineWithMaterialService
  private search2titleAgentService: Search2TitleAgentService

  constructor() {
    this.scopeAgentService = new ScopeAgentService()
    this.titleGenerateService = new TitleGenerateService()
    this.outlineGenerateService = new OutlineGenerateService()
    this.materialBindService = new MaterialBindService()
    this.outlineWithMaterialService = new OutlineWithMaterialService()
    this.search2titleAgentService = new Search2TitleAgentService()
  }

  // Scope Agent 相关方法
  async executeScopeAgent(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.scopeAgentService.executeScopeAgent(userId, projectId, request, options)
  }

  async getScopeAgentStatus(taskId: string, options?: ApiRequestConfig) {
    return this.scopeAgentService.getScopeAgentStatus(taskId, options)
  }

  async getScopeAgentTasks(
    userId: string,
    projectId?: string,
    limit?: number,
    offset?: number,
    options?: ApiRequestConfig
  ) {
    return this.scopeAgentService.getScopeAgentTasks(userId, projectId, limit, offset, options)
  }

  async cancelScopeAgentTask(taskId: string, options?: ApiRequestConfig) {
    return this.scopeAgentService.cancelScopeAgentTask(taskId, options)
  }

  async executeScopeAgentWithPolling(
    userId: string,
    projectId: string,
    request: any,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    return this.scopeAgentService.executeScopeAgentWithPolling(
      userId,
      projectId,
      request,
      pollingConfig
    )
  }

  // Title Generate 相关方法
  async generateTitles(request: any, options?: ApiRequestConfig) {
    return this.titleGenerateService.generateTitles(request, options)
  }

  async getTitleToolsStatus(options?: ApiRequestConfig) {
    return this.titleGenerateService.getTitleToolsStatus(options)
  }

  async validateTitleGeneration(request: any, options?: ApiRequestConfig) {
    return this.titleGenerateService.validateTitleGeneration(request, options)
  }

  // Outline Generate 相关方法
  async generateOutline(request: any, options?: ApiRequestConfig) {
    return this.outlineGenerateService.generateOutline(request, options)
  }

  async getOutlineToolsStatus(options?: ApiRequestConfig) {
    return this.outlineGenerateService.getOutlineToolsStatus(options)
  }

  async validateOutlineGeneration(request: any, options?: ApiRequestConfig) {
    return this.outlineGenerateService.validateOutlineGeneration(request, options)
  }

  // Material Bind 相关方法
  async executeMaterialBind(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.materialBindService.executeMaterialBind(userId, projectId, request, options)
  }

  async getMaterialBindStatus(taskId: string, options?: ApiRequestConfig) {
    return this.materialBindService.getMaterialBindStatus(taskId, options)
  }

  async bindMaterialsWithAI(request: any, options?: ApiRequestConfig) {
    return this.materialBindService.bindMaterialsWithAI(request, options)
  }

  // Outline With Material 相关方法
  async executeOutlineWithMaterial(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.outlineWithMaterialService.executeOutlineWithMaterial(
      userId,
      projectId,
      request,
      options
    )
  }

  async getOutlineWithMaterialStatus(taskId: string, params?: any, options?: ApiRequestConfig) {
    return this.outlineWithMaterialService.getOutlineWithMaterialStatus(taskId, params, options)
  }

  async cancelOutlineWithMaterialTask(taskId: string, params: any, options?: ApiRequestConfig) {
    return this.outlineWithMaterialService.cancelOutlineWithMaterialTask(taskId, params, options)
  }

  /**
   * 启动Outline With Material并轮询完成
   */
  async executeOutlineWithMaterialWithPolling(
    userId: string,
    projectId: string,
    request: any,
    pollingConfig?: PollingConfig
  ): Promise<PollingTask> {
    const response = await this.outlineWithMaterialService.executeOutlineWithMaterial(
      userId,
      projectId,
      request
    )
    const taskId = (response as any).task_id

    if (!taskId) {
      throw new Error('Outline With Material任务启动失败：未获取到任务ID')
    }

    const poller = new AsyncTaskPoller(
      () =>
        this.getOutlineWithMaterialStatus(taskId).then((result) => ({
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

    return poller.start(`outline-with-material-${taskId}`)
  }

  // Search2Title Agent 相关方法
  async executeSearch2TitleAgent(
    userId: string,
    projectId: string,
    request: any,
    options?: ApiRequestConfig
  ) {
    return this.search2titleAgentService.executeSearch2TitleAgent(
      userId,
      projectId,
      request,
      options
    )
  }

  async getSearch2TitleAgentStatus(taskId: string, options?: ApiRequestConfig) {
    return this.search2titleAgentService.getSearch2TitleAgentStatus(taskId, options)
  }

  async getSearch2TitleAgentTasks(
    userId: string,
    projectId?: string,
    limit?: number,
    offset?: number,
    options?: ApiRequestConfig
  ) {
    return this.search2titleAgentService.getSearch2TitleAgentTasks(
      userId,
      projectId,
      limit,
      offset,
      options
    )
  }

  async cancelSearch2TitleAgentTask(
    userId: string,
    projectId: string,
    taskId: string,
    options?: ApiRequestConfig
  ) {
    return this.search2titleAgentService.cancelSearch2TitleAgentTask(
      userId,
      projectId,
      taskId,
      options
    )
  }
}

// 创建单例实例
export const documentGenerateService = new DocumentGenerateService()

// 导出具体服务类
export {
  type ScopeAgentService,
  type TitleGenerateService,
  type OutlineGenerateService,
  type MaterialBindService,
  type OutlineWithMaterialService,
  type Search2TitleAgentService
}

// 默认导出（保持向后兼容）
export default documentGenerateService
