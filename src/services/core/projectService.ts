/**
 * 项目管理服务 - 基于OpenAPI配置
 * 使用BaseApiService架构，支持Mock/真实API切换
 * 完全符合core_openapi.json中的项目API规范
 * 重构优化版本 - 参考mock-architecture.md架构规范
 * 类型定义来自@/types/services/project，确保服务层与Store层类型一致
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { ApiResponseWrapper, EnhancedErrorHandler } from '@/utils/apiResponseHandler'
import { mockDataManager } from '@/mock'

// 导入共享类型定义，避免循环依赖
import type {
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectCreate,
  ProjectUpdate,
  ProjectStatusUpdateRequest,
  ProjectComponentUpdateRequest,
  ProjectDeleteRequest,
  ProjectDeleteResponse,
  ProjectQueryParams,
  ProjectSearchParams,
  Project
} from '@/types/core'

/**
 * 项目统计响应模型 - 符合OpenAPI规范
 */
interface ProjectStatisticsResponse {
  success: boolean
  message: string
  data: Record<string, number>
}

class ProjectService extends BaseApiService {
  constructor() {
    super('project')
  }

  /**
   * 获取项目列表
   * GET /api/v1/core/projects
   *
   * 支持功能：
   * 1. 分页查询
   * 2. 状态筛选
   * 3. 关键词搜索
   * 4. 文件夹筛选
   *
   * 排序规则：按最后修改时间倒序排列
   */
  async getProjects(
    params?: ProjectQueryParams,
    options?: ApiRequestConfig
  ): Promise<ProjectListResponse> {
    console.log('[ProjectService] getProjects 开始:', { params, options })
    try {
      const rawResponse = await this.get<any>('/projects', params, options)
      console.log('[ProjectService] getProjects 收到原始响应:', rawResponse)
      const wrappedResponse = ApiResponseWrapper.wrapProjectList(rawResponse)
      console.log('[ProjectService] getProjects 包装后响应:', wrappedResponse)
      return wrappedResponse
    } catch (error) {
      console.error('[ProjectService] getProjects 发生错误:', error)
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects',
        method: 'GET',
        data: params
      })
    }
  }

  /**
   * 创建项目
   * POST /api/v1/core/projects
   *
   * 业务规则：
   * 1. 项目名称必须唯一（用户维度）
   * 2. 默认状态为"TITLE_GENERATION"
   * 3. 默认当前组件为"topic-selection"
   * 4. 默认项目类型为"article"
   *
   * 异常处理：
   * - 项目名称已存在 → 提示"项目名称已存在"
   * - 创建失败 → 提示"创建项目失败"
   */
  async createProject(
    params: ProjectCreate,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.post<any>('/projects', params, options)
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects',
        method: 'POST',
        data: params
      })
    }
  }

  /**
   * 获取项目详情
   * GET /api/v1/core/projects/{project_id}
   *
   * 异常处理：
   * - 项目不存在 → 404错误
   */
  async getProjectDetail(
    projectId: number,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.get<any>(`/projects/${projectId}`, undefined, options)

      // 添加调试日志验证类型不匹配问题
      console.log('[DEBUG] ProjectService.getProjectDetail 原始响应:', {
        rawResponse,
        responseType: typeof rawResponse,
        projectKeys: rawResponse.project ? Object.keys(rawResponse.project) : null,
        statusType: rawResponse.project ? typeof rawResponse.project.status : null,
        statusValue: rawResponse.project ? rawResponse.project.status : null
      })

      const wrappedResponse = ApiResponseWrapper.wrapProjectDetail(rawResponse)

      // 添加调试日志验证包装后的响应
      console.log('[DEBUG] ProjectService.getProjectDetail 包装后响应:', {
        wrappedResponse,
        projectType: typeof wrappedResponse.project,
        projectKeys: wrappedResponse.project ? Object.keys(wrappedResponse.project) : null,
        statusType: wrappedResponse.project ? typeof wrappedResponse.project.status : null,
        statusValue: wrappedResponse.project ? wrappedResponse.project.status : null
      })

      return wrappedResponse
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: `/projects/${projectId}`,
        method: 'GET'
      })
    }
  }

  /**
   * 更新项目
   * PUT /api/v1/core/projects/{project_id}
   *
   * 业务规则：
   * 1. 项目名称必须唯一（用户维度，排除当前项目）
   * 2. 更新时自动更新最后修改时间
   *
   * 异常处理：
   * - 项目不存在 → 404错误
   * - 项目名称已存在 → 提示"项目名称已存在"
   */
  async updateProject(
    projectId: number,
    params: ProjectUpdate,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.put<any>(`/projects/${projectId}`, params, options)
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: `/projects/${projectId}`,
        method: 'PUT',
        data: params
      })
    }
  }

  /**
   * 批量删除项目
   * DELETE /api/v1/core/projects/batch
   *
   * 业务规则：
   * 1. 支持批量删除，最多100个项目
   * 2. 只删除用户拥有的项目
   * 3. 返回详细的删除结果
   */
  async batchDeleteProjects(
    projectIds: number[],
    options?: ApiRequestConfig
  ): Promise<ProjectDeleteResponse> {
    try {
      const rawResponse = await this.delete<any>(
        '/projects/batch',
        { project_ids: projectIds } as ProjectDeleteRequest,
        options
      )
      return ApiResponseWrapper.wrapProjectDelete(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects/batch',
        method: 'DELETE',
        data: { project_ids: projectIds }
      })
    }
  }

  /**
   * 更新项目状态
   * PATCH /api/v1/core/projects/{project_id}/status
   *
   * 支持的状态：
   * - TITLE_GENERATION: 标题生成阶段
   * - OUTLINE_GENERATION: 大纲生成阶段
   * - BODY_GENERATION: 正文生成阶段
   * - COMPLETED: 已完成
   */
  async updateProjectStatus(
    projectId: number,
    params: ProjectStatusUpdateRequest,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.patch<any>(`/projects/${projectId}/status`, params, options)
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: `/projects/${projectId}/status`,
        method: 'PATCH',
        data: params
      })
    }
  }

  /**
   * 更新项目组件
   * PATCH /api/v1/core/projects/{project_id}/component
   *
   * 支持的组件：
   * - topic-selection: 选题阶段
   * - outline: 大纲阶段
   * - content: 内容阶段
   */
  async updateProjectComponent(
    projectId: number,
    params: ProjectComponentUpdateRequest,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.patch<any>(`/projects/${projectId}/component`, params, options)
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: `/projects/${projectId}/component`,
        method: 'PATCH',
        data: params
      })
    }
  }

  /**
   * 获取项目统计信息
   * GET /api/v1/core/projects/statistics/status
   *
   * 返回各状态的项目数量统计
   */
  async getProjectStatistics(options?: ApiRequestConfig): Promise<ProjectStatisticsResponse> {
    try {
      const rawResponse = await this.get<any>('/projects/statistics/status', undefined, options)
      return ApiResponseWrapper.wrapProjectStatistics(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects/statistics/status',
        method: 'GET'
      })
    }
  }

  /**
   * 获取项目统计数据（别名方法，保持向后兼容）
   * @deprecated 使用 getProjectStatistics 替代
   */
  async getProjectStats(options?: ApiRequestConfig): Promise<ProjectStatisticsResponse> {
    try {
      return await this.getProjectStatistics(options)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects/statistics/status',
        method: 'GET'
      })
    }
  }

  /**
   * 复制项目
   * POST /api/v1/core/projects/{project_id}/duplicate
   *
   * 业务规则：
   * 1. 复制原项目的所有配置和内容
   * 2. 项目名称需要唯一
   */
  async duplicateProject(
    projectId: number,
    newName: string,
    options?: ApiRequestConfig
  ): Promise<ProjectDetailResponse> {
    try {
      const rawResponse = await this.post<any>(
        `/projects/${projectId}/duplicate`,
        { name: newName },
        options
      )
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: `/projects/${projectId}/duplicate`,
        method: 'POST',
        data: { name: newName }
      })
    }
  }

  /**
   * 搜索项目
   * GET /api/v1/core/projects/search
   */
  async searchProjects(
    params: ProjectSearchParams,
    options?: ApiRequestConfig
  ): Promise<ProjectListResponse> {
    try {
      const rawResponse = await this.get<any>('/projects/search', params, options)
      return ApiResponseWrapper.wrapProjectList(rawResponse)
    } catch (error) {
      throw EnhancedErrorHandler.handleApiError(error, {
        url: '/projects/search',
        method: 'GET',
        data: params
      })
    }
  }

  // ============= 业务便捷方法 =============

  /**
   * 快速创建项目
   * @param name 项目名称
   * @param options 额外选项
   * @returns 创建结果
   */
  async quickCreateProject(
    name: string,
    options?: {
      status?: Project['status']
      folder_id?: number | null
    }
  ): Promise<ProjectDetailResponse> {
    return this.createProject({
      name,
      status: options?.status || 'TITLE_GENERATION',
      current_component: 'topic-selection',
      folder_id: options?.folder_id
    })
  }

  /**
   * 快速搜索项目
   * @param keywords 搜索关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async quickSearch(
    keywords: string,
    options?: {
      status?: Project['status'] | null
      folder_id?: number | null
      maxResults?: number
    }
  ): Promise<ProjectListResponse> {
    return this.searchProjects({
      keywords,
      status: options?.status,
      folder_id: options?.folder_id,
      page: 1,
      page_size: options?.maxResults || 10
    })
  }

  /**
   * 获取我的项目（按状态筛选）
   * @param status 项目状态
   * @param options 查询选项
   * @returns 项目列表
   */
  async getMyProjects(
    status?: Project['status'],
    options?: {
      page?: number
      page_size?: number
      folder_id?: number | null
    }
  ): Promise<ProjectListResponse> {
    return this.getProjects({
      status: status || null,
      folder_id: options?.folder_id,
      page: options?.page,
      page_size: options?.page_size
    })
  }

  /**
   * 批量更新项目状态
   * @param projectIds 项目ID列表
   * @param status 新状态
   * @returns 更新结果
   */
  async batchUpdateStatus(
    projectIds: number[],
    status: string
  ): Promise<{ success: boolean; updated_count: number; failed_count: number }> {
    const results = await Promise.allSettled(
      projectIds.map((projectId) =>
        this.updateProjectStatus(projectId, { status }).catch(() => null)
      )
    )

    const successful = results.filter(
      (result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value !== null
    ).length

    const failed = projectIds.length - successful

    return {
      success: failed === 0,
      updated_count: successful,
      failed_count: failed
    }
  }

  /**
   * 项目状态流转到下一步
   * @param projectId 项目ID
   * @returns 更新后的项目详情
   */
  async moveToNextStage(projectId: number): Promise<ProjectDetailResponse> {
    // 获取当前项目状态
    const currentProject = await this.getProjectDetail(projectId)
    const currentStatus = currentProject.project.status

    // 定义状态流转顺序
    const statusFlow = {
      TITLE_GENERATION: 'OUTLINE_GENERATION',
      OUTLINE_GENERATION: 'BODY_GENERATION',
      BODY_GENERATION: 'COMPLETED'
    }

    const nextStatus = statusFlow[currentStatus as keyof typeof statusFlow]
    if (!nextStatus) {
      throw new Error(`项目状态 ${currentStatus} 无法流转到下一阶段`)
    }

    return this.updateProjectStatus(projectId, { status: nextStatus })
  }

  /**
   * 创建项目并初始化（带轮询）
   * @param name 项目名称
   * @param options 创建选项
   * @returns 轮询任务
   */
  async createProjectWithPolling(
    name: string,
    options?: {
      status?: string
      folder_id?: number | null
    }
  ) {
    // 创建项目
    const response = await this.quickCreateProject(name, options)
    const projectId = response.project.id

    // 对于项目创建，通常不需要轮询，因为创建是同步的
    // 但如果需要初始化过程，可以在这里添加轮询逻辑
    return {
      projectId,
      project: response.project,
      status: 'completed' as const
    }
  }

  /**
   * Mock实现方法 - 基于mockDataManager重构
   * 符合mock-architecture.md架构规范
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data, params } = config

    try {
      // 路由式Mock - 优先使用mockDataManager
      if (method === 'GET' && url.includes('/projects/statistics')) {
        return mockDataManager.getMockData('project-statistics')
      }

      if (method === 'GET' && url.includes('/search')) {
        return mockDataManager.getMockData('project-search', params?.keywords || '')
      }

      // 基础项目操作Mock
      if (method === 'GET' && url.includes('/projects') && !url.includes('/projects/')) {
        return mockDataManager.getMockData('project-list', params)
      }

      if (
        method === 'GET' &&
        url.includes('/projects/') &&
        !url.includes('/status') &&
        !url.includes('/component')
      ) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1]
        return mockDataManager.getMockData('project-detail', parseInt(projectId))
      }

      if (
        method === 'POST' &&
        url.includes('/projects') &&
        !url.includes('/batch') &&
        !url.includes('/duplicate')
      ) {
        return mockDataManager.getMockData('project-create', data)
      }

      if (
        method === 'PUT' &&
        url.includes('/projects/') &&
        !url.includes('/status') &&
        !url.includes('/component')
      ) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1]
        return mockDataManager.getMockData('project-update', { projectId, ...data })
      }

      if (method === 'DELETE' && url.includes('/projects/batch')) {
        return mockDataManager.getMockData('project-batch-delete', data)
      }

      if (method === 'PATCH' && url.includes('/status')) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1]
        return mockDataManager.getMockData('project-status-update', { projectId, ...data })
      }

      if (method === 'PATCH' && url.includes('/component')) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1]
        return mockDataManager.getMockData('project-component-update', {
          projectId,
          ...data
        })
      }

      if (method === 'POST' && url.includes('/duplicate')) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1]
        return mockDataManager.getMockData('project-duplicate', { projectId, ...data })
      }

      // 默认响应
      return {
        success: true,
        message: `项目管理服务Mock响应 - ${method} ${url}`,
        data: { mock: true, timestamp: Date.now() }
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
export const projectService = new ProjectService()
export { ProjectService }
export default projectService
