/**
 * 项目管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'

class ProjectService extends BaseApiService {
  constructor() {
    super('project')
  }

  /**
   * 获取项目列表
   */
  async getProjects(
    params?: {
      page?: number
      page_size?: number
      status?: string
      sort_by?: string
      name?: string
      description?: string
      project_type?: string
      settings?: object
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>('/projects', params, options)
  }

  /**
   * 创建项目
   */
  async createProject(
    params: {
      name: string
      description?: string
      project_type?: string
      settings?: object
    },
    options?: ApiRequestConfig
  ) {
    return this.post<any>('/projects', params, options)
  }

  /**
   * 获取项目详情
   */
  async getProjectDetail(projectId: number, options?: ApiRequestConfig) {
    return this.get<any>(`/projects/${projectId}`, undefined, options)
  }

  /**
   * 更新项目
   */
  async updateProject(
    projectId: number,
    params: {
      name?: string
      description?: string
      settings?: object
    },
    options?: ApiRequestConfig
  ) {
    return this.put<any>(`/projects/${projectId}`, params, options)
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: number, options?: ApiRequestConfig) {
    return this.delete<any>(`/projects/${projectId}`, undefined, options)
  }

  /**
   * 批量操作项目
   */
  async batchOperateProjects(
    params: {
      project_ids: number[]
      operation: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post<any>('/projects/batch', params, options)
  }

  /**
   * 批量删除项目
   */
  async batchDeleteProjects(projectIds: number[], options?: ApiRequestConfig) {
    return this.delete<any>('/projects/batch', { project_ids: projectIds }, options)
  }

  /**
   * 获取项目状态
   */
  async getProjectStatus(projectId: number, options?: ApiRequestConfig) {
    return this.get<any>(`/projects/${projectId}/status`, undefined, options)
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(
    projectId: number,
    params: {
      status: string
      reason?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.put<any>(`/projects/${projectId}/status`, params, options)
  }

  /**
   * 获取项目组件列表
   */
  async getProjectComponents(
    projectId: number,
    params?: {
      type?: string
      status?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>(`/projects/${projectId}/components`, params, options)
  }

  /**
   * 获取项目统计数据
   */
  async getProjectStats(projectId: number, options?: ApiRequestConfig) {
    return this.get<any>(`/projects/${projectId}/stats`, undefined, options)
  }

  /**
   * 搜索项目
   */
  async searchProjects(
    params: {
      name?: string
      description?: string
      status?: string
      project_type?: string
      page?: number
      page_size?: number
      sort_by?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>('/projects', params, options)
  }

  /**
   * 复制项目
   */
  async duplicateProject(projectId: number, newName: string, options?: ApiRequestConfig) {
    // 首先获取原项目详情
    const originalProject = await this.getProjectDetail(projectId, options)

    // 创建新项目
    return this.createProject(
      {
        name: newName,
        description: originalProject.data?.description || '',
        project_type: originalProject.data?.project_type || '',
        settings: originalProject.data?.settings || {}
      },
      options
    )
  }

  /**
   * Mock实现方法
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
      // 获取项目列表
      if (method === 'GET' && url.includes('/projects') && !url.includes('/projects/')) {
        return {
          projects: [
            {
              id: 1,
              name: '示例项目1',
              description: '这是一个示例项目',
              status: 'active',
              project_type: 'web',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-12-31T23:59:59Z'
            },
            {
              id: 2,
              name: '示例项目2',
              description: '这是另一个示例项目',
              status: 'inactive',
              project_type: 'mobile',
              created_at: '2023-02-01T00:00:00Z',
              updated_at: '2023-12-30T23:59:59Z'
            }
          ],
          total: 2,
          page: 1,
          page_size: 10
        }
      }

      // 获取项目详情
      if (
        method === 'GET' &&
        url.includes('/projects/') &&
        !url.includes('/status') &&
        !url.includes('/components') &&
        !url.includes('/stats')
      ) {
        const projectId = url.split('/')[2]
        return {
          id: parseInt(projectId),
          name: `项目 ${projectId}`,
          description: `项目 ${projectId} 的详细描述`,
          status: 'active',
          project_type: 'web',
          settings: {
            theme: 'light',
            language: 'zh-CN'
          },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-12-31T23:59:59Z'
        }
      }

      // 创建项目
      if (method === 'POST' && url.includes('/projects') && !url.includes('/batch')) {
        const requestData = config.data
        return {
          id: Math.floor(Math.random() * 1000) + 100,
          ...requestData,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // 更新项目
      if (method === 'PUT' && url.includes('/projects/') && !url.includes('/status')) {
        const projectId = url.split('/')[2]
        const requestData = config.data
        return {
          id: parseInt(projectId),
          ...requestData,
          updated_at: new Date().toISOString()
        }
      }

      // 删除项目
      if (method === 'DELETE' && url.includes('/projects/') && !url.includes('/batch')) {
        return {
          success: true,
          message: '项目删除成功'
        }
      }

      // 批量操作项目
      if (url.includes('/projects/batch')) {
        const requestData = config.data
        return {
          success: true,
          message: `批量${requestData.operation}操作成功`,
          affected_count: requestData.project_ids?.length || 0
        }
      }

      // 获取项目状态
      if (method === 'GET' && url.includes('/status')) {
        return {
          status: 'active',
          last_updated: new Date().toISOString()
        }
      }

      // 更新项目状态
      if (method === 'PUT' && url.includes('/status')) {
        const requestData = config.data
        return {
          status: requestData.status,
          updated_at: new Date().toISOString()
        }
      }

      // 获取项目组件
      if (method === 'GET' && url.includes('/components')) {
        return {
          components: [
            {
              id: 1,
              name: '组件1',
              type: 'ui',
              status: 'active'
            },
            {
              id: 2,
              name: '组件2',
              type: 'logic',
              status: 'inactive'
            }
          ]
        }
      }

      // 获取项目统计
      if (method === 'GET' && url.includes('/stats')) {
        return {
          total_components: 10,
          active_components: 7,
          inactive_components: 3,
          last_updated: new Date().toISOString()
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
