import http from '@/utils/http'
import type { Api } from '@/typings/api'

// 从Api.Project命名空间导入类型
type ProjectCreate = Api.Project.ProjectCreate
type ProjectUpdate = Api.Project.ProjectUpdate
type ProjectDetailResponse = Api.Project.ProjectDetailResponse
type ProjectListResponse = Api.Project.ProjectListResponse
type ProjectDeleteRequest = Api.Project.ProjectDeleteRequest
type ProjectDeleteResponse = Api.Project.ProjectDeleteResponse
type ProjectStatusUpdateRequest = Api.Project.ProjectStatusUpdateRequest
type ProjectComponentUpdateRequest = Api.Project.ProjectComponentUpdateRequest
type ProjectStatisticsResponse = Api.Project.ProjectStatisticsResponse

/**
 * 项目API服务类
 * 用于与项目管理后端API交互
 */
class ProjectService {
  private baseUrl = '/api/v1/core'
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 检查缓存是否有效
   * @param key 缓存键
   * @returns 是否有效
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 数据
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached || !this.isCacheValid(key)) {
      this.cache.delete(key)
      return null
    }
    return cached.data
  }

  /**
   * 清除缓存
   * @param pattern 缓存键模式，如果不提供则清除所有缓存
   */
  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * 创建项目
   * @param projectData 项目数据
   * @returns 创建的项目详情
   */
  async createProject(projectData: ProjectCreate): Promise<ProjectDetailResponse> {
    try {
      this.clearCache('projects')

      const response = await http.post<ProjectDetailResponse>({
        url: `${this.baseUrl}/projects`,
        data: projectData
      })

      return response
    } catch (error) {
      console.error('Create project error:', error)
      throw new Error('创建项目失败')
    }
  }

  /**
   * 获取用户项目列表
   * @param params 查询参数
   * @returns 项目列表
   */
  async getProjects(params?: {
    page?: number
    page_size?: number
    status?: string | null
    keywords?: string | null
    folder_id?: number | null
  }): Promise<ProjectListResponse> {
    try {
      const cacheKey = `projects_${JSON.stringify(params || {})}`
      const cached = this.getCache(cacheKey)

      if (cached) {
        return cached
      }

      const response = await http.get<ProjectListResponse>({
        url: `${this.baseUrl}/projects`,
        params
      })

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      console.error('Get projects error:', error)
      throw new Error('获取项目列表失败')
    }
  }

  /**
   * 获取项目详情
   * @param projectId 项目ID
   * @returns 项目详情
   */
  async getProjectDetail(projectId: number): Promise<ProjectDetailResponse> {
    try {
      const cacheKey = `project_${projectId}`
      const cached = this.getCache(cacheKey)

      if (cached) {
        return cached
      }

      const response = await http.get<ProjectDetailResponse>({
        url: `${this.baseUrl}/projects/${projectId}`
      })

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      console.error('Get project detail error:', error)
      throw new Error('获取项目详情失败')
    }
  }

  /**
   * 更新项目
   * @param projectId 项目ID
   * @param projectData 更新数据
   * @returns 更新后的项目详情
   */
  async updateProject(
    projectId: number,
    projectData: ProjectUpdate
  ): Promise<ProjectDetailResponse> {
    try {
      this.clearCache(`project_${projectId}`)
      this.clearCache('projects')

      const response = await http.put<ProjectDetailResponse>({
        url: `${this.baseUrl}/projects/${projectId}`,
        data: projectData
      })

      return response
    } catch (error) {
      console.error('Update project error:', error)
      throw new Error('更新项目失败')
    }
  }

  /**
   * 批量删除项目
   * @param projectIds 项目ID列表
   * @returns 删除结果
   */
  async deleteProjects(projectIds: number[]): Promise<ProjectDeleteResponse> {
    try {
      const request: ProjectDeleteRequest = {
        project_ids: projectIds
      }

      this.clearCache('projects')
      projectIds.forEach((id) => this.clearCache(`project_${id}`))

      const response = await http.del<ProjectDeleteResponse>({
        url: `${this.baseUrl}/projects/batch`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Delete projects error:', error)
      throw new Error('删除项目失败')
    }
  }

  /**
   * 更新项目状态
   * @param projectId 项目ID
   * @param status 新状态
   * @returns 更新后的项目详情
   */
  async updateProjectStatus(projectId: number, status: string): Promise<ProjectDetailResponse> {
    try {
      const request: ProjectStatusUpdateRequest = { status }

      this.clearCache(`project_${projectId}`)
      this.clearCache('projects')

      const response = await http.request<ProjectDetailResponse>({
        method: 'PATCH',
        url: `${this.baseUrl}/projects/${projectId}/status`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Update project status error:', error)
      throw new Error('更新项目状态失败')
    }
  }

  /**
   * 更新项目当前组件
   * @param projectId 项目ID
   * @param component 当前组件
   * @returns 更新后的项目详情
   */
  async updateProjectComponent(
    projectId: number,
    component: string
  ): Promise<ProjectDetailResponse> {
    try {
      const request: ProjectComponentUpdateRequest = {
        current_component: component
      }

      this.clearCache(`project_${projectId}`)
      this.clearCache('projects')

      const response = await http.request<ProjectDetailResponse>({
        method: 'PATCH',
        url: `${this.baseUrl}/projects/${projectId}/component`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Update project component error:', error)
      throw new Error('更新项目组件失败')
    }
  }

  /**
   * 获取项目统计信息
   * @returns 项目统计信息
   */
  async getProjectStatistics(): Promise<ProjectStatisticsResponse> {
    try {
      const cacheKey = 'project_statistics'
      const cached = this.getCache(cacheKey)

      if (cached) {
        return cached
      }

      const response = await http.get<ProjectStatisticsResponse>({
        url: `${this.baseUrl}/projects/statistics/status`
      })

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      console.error('Get project statistics error:', error)
      throw new Error('获取项目统计信息失败')
    }
  }

  /**
   * 搜索项目
   * @param keywords 关键词
   * @param filters 过滤条件
   * @returns 搜索结果
   */
  async searchProjects(
    keywords: string,
    filters?: {
      status?: string
      folder_id?: number
    }
  ): Promise<ProjectListResponse> {
    try {
      const params = {
        keywords,
        ...filters
      }

      const cacheKey = `search_projects_${JSON.stringify(params)}`
      const cached = this.getCache(cacheKey)

      if (cached) {
        return cached
      }

      const response = await http.get<ProjectListResponse>({
        url: `${this.baseUrl}/projects`,
        params
      })

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      console.error('Search projects error:', error)
      throw new Error('搜索项目失败')
    }
  }

  /**
   * 复制项目
   * @param projectId 项目ID
   * @param newName 新项目名称
   * @returns 新创建的项目详情
   */
  async duplicateProject(projectId: number, newName: string): Promise<ProjectDetailResponse> {
    try {
      // 首先获取原项目详情
      const originalProject = await this.getProjectDetail(projectId)

      // 创建新项目
      const newProjectData: ProjectCreate = {
        name: newName,
        status: originalProject.project.status,
        current_component: originalProject.project.current_component,
        folder_id: originalProject.project.folder_id
      }

      return await this.createProject(newProjectData)
    } catch (error) {
      console.error('Duplicate project error:', error)
      throw new Error('复制项目失败')
    }
  }
}

export const projectService = new ProjectService()
export { ProjectService }
