/**
 * API响应处理工具
 * 提供类型安全的API响应处理，确保所有API响应都有正确的类型定义
 */

import type { Api } from '@/typings/api'

// 基础API响应接口
export interface BaseApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  code?: number
  total_count?: number
  page?: number
  page_size?: number
  total_pages?: number
}

// 项目相关响应类型
export interface ProjectResponse extends Api.Project.ProjectResponse {
  // 确保所有必要字段都存在
  id: number
  user_id: number
  name: string
  status: string
  current_component: string
  created_at: string
  updated_at: string
  last_modified: string
  // 可选字段
  folder_id?: number | null
}

export interface ProjectListResponse {
  success: boolean
  message: string
  projects: ProjectResponse[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

export interface ProjectDetailResponse {
  success: boolean
  message: string
  project: ProjectResponse
}

export interface ProjectStatisticsResponse {
  success: boolean
  message: string
  data: Record<string, number>
}

export interface ProjectDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<Record<string, any>>
}

// API响应验证器类
export class ApiResponseValidator {
  /**
   * 验证基础API响应
   */
  static validateBaseResponse<T>(response: any): BaseApiResponse<T> {
    if (!response || typeof response !== 'object') {
      throw new Error('响应数据格式错误：非对象类型')
    }

    const result: BaseApiResponse<T> = {
      success: Boolean(response.success),
      message: String(response.message || '')
    }

    if (response.data !== undefined) {
      result.data = response.data
    }

    if (response.code !== undefined) {
      result.code = Number(response.code)
    }

    // 处理分页字段，统一使用total_count
    if (response.total_count !== undefined) {
      result.total_count = Number(response.total_count)
    } else if (response.total !== undefined) {
      // 兼容旧格式，转换为total_count
      console.warn('[API] 检测到已弃用的total字段，已转换为total_count')
      result.total_count = Number(response.total)
    }

    if (response.page !== undefined) {
      result.page = Number(response.page)
    }

    if (response.page_size !== undefined) {
      result.page_size = Number(response.page_size)
    }

    if (response.total_pages !== undefined) {
      result.total_pages = Number(response.total_pages)
    }

    return result
  }

  /**
   * 验证项目响应
   * 注意：此方法用于验证单个项目对象，不包含success字段
   */
  static validateProjectResponse(projectData: any): ProjectResponse {
    if (!projectData || typeof projectData !== 'object') {
      throw new Error('项目数据格式错误：非对象类型')
    }

    // 验证必需字段
    const requiredFields = [
      'id',
      'user_id',
      'name',
      'status',
      'current_component',
      'created_at',
      'updated_at',
      'last_modified'
    ]
    for (const field of requiredFields) {
      if (projectData[field] === undefined || projectData[field] === null) {
        throw new Error(`项目响应缺少必需字段: ${field}`)
      }
    }

    // 类型转换和验证
    return {
      id: Number(projectData.id),
      user_id: Number(projectData.user_id),
      name: String(projectData.name),
      status: String(projectData.status),
      current_component: String(projectData.current_component),
      created_at: String(projectData.created_at),
      updated_at: String(projectData.updated_at),
      last_modified: String(projectData.last_modified),
      folder_id:
        projectData.folder_id !== undefined && projectData.folder_id !== null
          ? Number(projectData.folder_id)
          : null
    }
  }

  /**
   * 验证项目列表响应
   */
  static validateProjectListResponse(response: any): ProjectListResponse {
    const baseResponse = this.validateBaseResponse(response)

    if (!baseResponse.success) {
      throw new Error(baseResponse.message || '获取项目列表失败')
    }

    const projects = Array.isArray(response.projects) ? response.projects : []
    const validatedProjects = projects.map((project) => this.validateProjectResponse(project))

    return {
      success: baseResponse.success,
      message: baseResponse.message,
      projects: validatedProjects,
      total_count: baseResponse.total_count || 0,
      page: baseResponse.page || 1,
      page_size: baseResponse.page_size || 20,
      total_pages: baseResponse.total_pages || 0
    }
  }

  /**
   * 验证项目详情响应
   * 支持两种格式：
   * 1. { success: true, data: project } - 新的统一格式
   * 2. { success: true, project } - 旧的兼容性格式
   */
  static validateProjectDetailResponse(response: any): ProjectDetailResponse {
    const baseResponse = this.validateBaseResponse(response)

    if (!baseResponse.success) {
      throw new Error(baseResponse.message || '获取项目详情失败')
    }

    // 优先从 data 字段获取项目对象
    let projectData = baseResponse.data

    // 兼容性：如果没有 data 字段，直接从 response 获取
    if (!projectData) {
      projectData = (response as any).project
    }

    if (!projectData) {
      throw new Error('项目详情响应缺少项目数据')
    }

    const project = this.validateProjectResponse(projectData)

    return {
      success: baseResponse.success,
      message: baseResponse.message || '获取项目详情成功',
      project
    }
  }

  /**
   * 验证项目统计响应
   */
  static validateProjectStatisticsResponse(response: any): ProjectStatisticsResponse {
    const baseResponse = this.validateBaseResponse(response)

    if (!baseResponse.success || !baseResponse.data) {
      throw new Error(baseResponse.message || '获取项目统计失败')
    }

    const data = baseResponse.data as Record<string, any>
    const validatedData: Record<string, number> = {}

    // 确保所有统计值都是数字
    for (const [key, value] of Object.entries(data)) {
      validatedData[key] = Number(value) || 0
    }

    return {
      success: baseResponse.success,
      message: baseResponse.message,
      data: validatedData
    }
  }

  /**
   * 验证项目删除响应
   */
  static validateProjectDeleteResponse(response: any): ProjectDeleteResponse {
    const baseResponse = this.validateBaseResponse(response)

    if (!baseResponse.success) {
      throw new Error(baseResponse.message || '删除项目失败')
    }

    return {
      success: baseResponse.success,
      message: baseResponse.message,
      deleted_count: Number(response.deleted_count) || 0,
      failed_count: Number(response.failed_count) || 0,
      details: Array.isArray(response.details) ? response.details : []
    }
  }
}

// API响应包装器类
export class ApiResponseWrapper {
  /**
   * 包装项目列表响应
   */
  static wrapProjectList(rawResponse: any): ProjectListResponse {
    try {
      return ApiResponseValidator.validateProjectListResponse(rawResponse)
    } catch (error) {
      console.error('[API] 项目列表响应验证失败:', error)
      throw new Error(
        `项目列表响应格式错误: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 包装项目详情响应
   */
  static wrapProjectDetail(rawResponse: any): ProjectDetailResponse {
    try {
      return ApiResponseValidator.validateProjectDetailResponse(rawResponse)
    } catch (error) {
      console.error('[API] 项目详情响应验证失败:', error)
      throw new Error(
        `项目详情响应格式错误: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 包装项目统计响应
   */
  static wrapProjectStatistics(rawResponse: any): ProjectStatisticsResponse {
    try {
      return ApiResponseValidator.validateProjectStatisticsResponse(rawResponse)
    } catch (error) {
      console.error('[API] 项目统计响应验证失败:', error)
      throw new Error(
        `项目统计响应格式错误: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 包装项目删除响应
   */
  static wrapProjectDelete(rawResponse: any): ProjectDeleteResponse {
    try {
      return ApiResponseValidator.validateProjectDeleteResponse(rawResponse)
    } catch (error) {
      console.error('[API] 项目删除响应验证失败:', error)
      throw new Error(
        `项目删除响应格式错误: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 通用响应包装
   */
  static wrapResponse<T>(rawResponse: any, validator: (response: any) => T): T {
    try {
      return validator(rawResponse)
    } catch (error) {
      console.error('[API] 响应验证失败:', error)
      throw new Error(`响应格式错误: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

// 错误处理增强
export class EnhancedErrorHandler {
  /**
   * 处理API错误，提供更详细的错误信息
   */
  static handleApiError(
    error: any,
    context?: { url?: string; method?: string; data?: any }
  ): never {
    let message = '请求失败'
    let code = 500
    let details: any = {}

    if (error instanceof Error) {
      message = error.message
    }

    if (error.response) {
      // HTTP错误响应
      code = error.response.status || 500
      details = {
        status: code,
        statusText: error.response.statusText,
        data: error.response.data
      }

      // 尝试从响应中提取详细错误信息
      if (error.response.data) {
        if (error.response.data.message) {
          message = error.response.data.message
        } else if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.msg) {
          message = error.response.data.msg
        }
      }
    } else if (error.request) {
      // 网络错误
      message = '网络连接失败，请检查网络设置'
      code = 0
      details = {
        networkError: true,
        request: error.request
      }
    }

    // 添加上下文信息
    if (context) {
      details.context = context
    }

    const enhancedError = new Error(message)
    ;(enhancedError as any).code = code
    ;(enhancedError as any).details = details

    console.error('[API] 增强错误处理:', {
      message,
      code,
      details,
      stack: error.stack
    })

    throw enhancedError
  }
}

// 导出默认实例
export default {
  validator: ApiResponseValidator,
  wrapper: ApiResponseWrapper,
  errorHandler: EnhancedErrorHandler
}
