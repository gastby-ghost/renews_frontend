/**
 * 项目管理服务 - 基于OpenAPI配置
 * 使用BaseApiService架构，支持Mock/真实API切换
 * 完全符合core_openapi.json中的项目API规范
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { ApiResponseWrapper, EnhancedErrorHandler } from '@/utils/apiResponseHandler'

// 从OpenAPI规范中提取的TypeScript类型定义
/**
 * 项目响应模型 - 符合OpenAPI规范
 */
interface ProjectResponse {
  id: number
  user_id: number
  name: string
  status?: string
  current_component?: string
  folder_id?: number | null
  last_modified: string
  created_at: string
  updated_at: string
}

/**
 * 项目列表响应模型 - 符合OpenAPI规范
 */
interface ProjectListResponse {
  success: boolean
  message: string
  projects: ProjectResponse[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 项目详情响应模型 - 符合OpenAPI规范
 */
interface ProjectDetailResponse {
  success: boolean
  message: string
  project: ProjectResponse
}

/**
 * 创建项目请求模型 - 符合OpenAPI规范
 */
interface ProjectCreate {
  name: string
  status?: string
  current_component?: string
  folder_id?: number | null
}

/**
 * 更新项目请求模型 - 符合OpenAPI规范
 */
interface ProjectUpdate {
  name?: string | null
  status?: string | null
  current_component?: string | null
  folder_id?: number | null
}

/**
 * 项目状态更新请求模型 - 符合OpenAPI规范
 */
interface ProjectStatusUpdateRequest {
  status: string
}

/**
 * 项目组件更新请求模型 - 符合OpenAPI规范
 */
interface ProjectComponentUpdateRequest {
  current_component: string
}

/**
 * 项目删除请求模型 - 符合OpenAPI规范
 */
interface ProjectDeleteRequest {
  project_ids: number[]
}

/**
 * 项目删除响应模型 - 符合OpenAPI规范
 */
interface ProjectDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<Record<string, any>>
}

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
    params?: {
      page?: number
      page_size?: number
      status?: string | null
      keywords?: string | null
      folder_id?: number | null
    },
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
   * 2. 默认状态为"draft"
   * 3. 默认当前组件为"requirement"
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
      return ApiResponseWrapper.wrapProjectDetail(rawResponse)
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
   * 支持的常用状态：draft, active, completed, archived
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
   * 支持的常用组件：requirement, title, outline, content, review
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
    params: {
      keywords: string
      status?: string | null
      folder_id?: number | null
      page?: number
      page_size?: number
    },
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

  /**
   * Mock实现方法 - 完全符合OpenAPI规范
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      apiConfig
    })

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method

    console.log(`[API-${this.serviceName}] Mock实现处理URL:`, { url, method })

    try {
      // 获取项目列表 - GET /api/v1/core/projects
      if (
        method === 'GET' &&
        url.includes('/projects') &&
        !url.includes('/projects/') &&
        !url.includes('/statistics')
      ) {
        console.log(`[API-${this.serviceName}] Mock返回项目列表数据`)
        const mockData = {
          success: true,
          message: '获取项目列表成功',
          projects: [
            {
              id: 1,
              user_id: 1,
              name: '示例项目1',
              status: 'active',
              current_component: 'requirement',
              folder_id: null,
              last_modified: '2023-12-31T23:59:59Z',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-12-31T23:59:59Z'
            },
            {
              id: 2,
              user_id: 1,
              name: '示例项目2',
              status: 'draft',
              current_component: 'title',
              folder_id: 1,
              last_modified: '2023-12-30T23:59:59Z',
              created_at: '2023-02-01T00:00:00Z',
              updated_at: '2023-12-30T23:59:59Z'
            }
          ],
          total_count: 2,
          page: 1,
          page_size: 10,
          total_pages: 1
        }
        console.log(`[API-${this.serviceName}] Mock项目列表数据:`, mockData)
        return mockData
      }

      // 获取项目详情 - GET /api/v1/core/projects/{project_id}
      if (
        method === 'GET' &&
        url.includes('/projects/') &&
        !url.includes('/status') &&
        !url.includes('/component') &&
        !url.includes('/statistics')
      ) {
        const projectId = url.split('/')[2]
        return {
          success: true,
          message: '获取项目详情成功',
          project: {
            id: parseInt(projectId),
            user_id: 1,
            name: `项目 ${projectId}`,
            status: 'active',
            current_component: 'requirement',
            folder_id: null,
            last_modified: '2023-12-31T23:59:59Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-12-31T23:59:59Z'
          }
        }
      }

      // 创建项目 - POST /api/v1/core/projects
      if (method === 'POST' && url.includes('/projects') && !url.includes('/batch')) {
        const requestData = config.data as ProjectCreate
        return {
          success: true,
          message: '创建项目成功',
          project: {
            id: Math.floor(Math.random() * 1000) + 100,
            user_id: 1,
            name: requestData.name,
            status: requestData.status || 'draft',
            current_component: requestData.current_component || 'requirement',
            folder_id: requestData.folder_id || null,
            last_modified: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // 更新项目 - PUT /api/v1/core/projects/{project_id}
      if (
        method === 'PUT' &&
        url.includes('/projects/') &&
        !url.includes('/status') &&
        !url.includes('/component')
      ) {
        const projectId = url.split('/')[2]
        const requestData = config.data as ProjectUpdate
        return {
          success: true,
          message: '更新项目成功',
          project: {
            id: parseInt(projectId),
            user_id: 1,
            name: requestData.name || `项目 ${projectId}`,
            status: requestData.status || 'active',
            current_component: requestData.current_component || 'requirement',
            folder_id: requestData.folder_id || null,
            last_modified: new Date().toISOString(),
            created_at: '2023-01-01T00:00:00Z',
            updated_at: new Date().toISOString()
          }
        }
      }

      // 批量删除项目 - DELETE /api/v1/core/projects/batch
      if (method === 'DELETE' && url.includes('/projects/batch')) {
        const requestData = config.data as ProjectDeleteRequest
        return {
          success: true,
          message: '批量删除项目成功',
          deleted_count: requestData.project_ids?.length || 0,
          failed_count: 0,
          details:
            requestData.project_ids?.map((id) => ({ project_id: id, status: 'success' })) || []
        }
      }

      // 更新项目状态 - PATCH /api/v1/core/projects/{project_id}/status
      if (method === 'PATCH' && url.includes('/status')) {
        const projectId = url.split('/')[2]
        const requestData = config.data as ProjectStatusUpdateRequest
        return {
          success: true,
          message: '更新项目状态成功',
          project: {
            id: parseInt(projectId),
            user_id: 1,
            name: `项目 ${projectId}`,
            status: requestData.status,
            current_component: 'requirement',
            folder_id: null,
            last_modified: new Date().toISOString(),
            created_at: '2023-01-01T00:00:00Z',
            updated_at: new Date().toISOString()
          }
        }
      }

      // 更新项目组件 - PATCH /api/v1/core/projects/{project_id}/component
      if (method === 'PATCH' && url.includes('/component')) {
        const projectId = url.split('/')[2]
        const requestData = config.data as ProjectComponentUpdateRequest
        return {
          success: true,
          message: '更新项目组件成功',
          project: {
            id: parseInt(projectId),
            user_id: 1,
            name: `项目 ${projectId}`,
            status: 'active',
            current_component: requestData.current_component,
            folder_id: null,
            last_modified: new Date().toISOString(),
            created_at: '2023-01-01T00:00:00Z',
            updated_at: new Date().toISOString()
          }
        }
      }

      // 复制项目 - POST /api/v1/core/projects/{project_id}/duplicate
      if (method === 'POST' && url.includes('/duplicate')) {
        const projectId = url.split('/')[2]
        const requestData = config.data as { name: string }
        return {
          success: true,
          message: '复制项目成功',
          project: {
            id: Math.floor(Math.random() * 1000) + 100,
            user_id: 1,
            name: requestData.name || `项目 ${projectId} 副本`,
            status: 'draft',
            current_component: 'requirement',
            folder_id: null,
            last_modified: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // 搜索项目 - GET /api/v1/core/projects/search
      if (method === 'GET' && url.includes('/search')) {
        return {
          success: true,
          message: '搜索项目成功',
          projects: [
            {
              id: 1,
              user_id: 1,
              name: '搜索结果项目1',
              status: 'active',
              current_component: 'requirement',
              folder_id: null,
              last_modified: '2023-12-31T23:59:59Z',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-12-31T23:59:59Z'
            }
          ],
          total_count: 1,
          page: 1,
          page_size: 10,
          total_pages: 1
        }
      }

      // 获取项目统计信息 - GET /api/v1/core/projects/statistics/status
      if (method === 'GET' && url.includes('/statistics')) {
        return {
          success: true,
          message: '获取项目统计信息成功',
          data: {
            draft: 5,
            active: 3,
            completed: 2,
            archived: 1
          }
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `项目管理服务Mock响应 - ${method} ${url}`,
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
