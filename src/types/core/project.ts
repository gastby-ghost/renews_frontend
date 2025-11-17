/**
 * 项目管理服务相关类型定义
 * 基于OpenAPI规范的项目API类型
 */

// 基础项目类型
export interface Project {
  id: number
  name: string
  description?: string
  status: ProjectStatus
  current_component: ProjectComponent
  project_type: ProjectType
  folder_id?: number
  created_at: string
  updated_at: string
  user_id: string
  metadata?: Record<string, any>
}

export type ProjectStatus =
  | 'TITLE_GENERATION'
  | 'OUTLINE_GENERATION'
  | 'BODY_GENERATION'
  | 'COMPLETED'
export type ProjectComponent = 'topic-selection' | 'outline' | 'content'
export type ProjectType = 'article' | 'report' | 'blog' | 'academic' | 'other'

// 请求/响应类型
export interface ProjectListResponse {
  success: boolean
  message: string
  projects: Project[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface ProjectDetailResponse {
  success: boolean
  message: string
  project: Project
}

export interface ProjectCreate {
  name: string
  description?: string
  status?: ProjectStatus
  current_component?: ProjectComponent
  project_type?: ProjectType
  folder_id?: number
  metadata?: Record<string, any>
}

export type ProjectUpdate = Partial<ProjectCreate>

export interface ProjectStatusUpdateRequest {
  status: ProjectStatus
}

export interface ProjectComponentUpdateRequest {
  current_component: ProjectComponent
}

export interface ProjectDeleteRequest {
  project_ids: number[]
}

export interface ProjectDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<{
    project_id: number
    success: boolean
    error?: string
  }>
}

// 项目统计相关类型
export interface ProjectStatisticsResponse {
  success: boolean
  message: string
  data: Record<string, number>
}

// 搜索相关类型
export interface ProjectSearchParams {
  keywords: string
  status?: ProjectStatus | null
  folder_id?: number | null
  page?: number
  page_size?: number
}

// 项目查询参数
export interface ProjectQueryParams {
  page?: number
  page_size?: number
  status?: ProjectStatus | null
  keywords?: string | null
  folder_id?: number | null
}

// 批量操作响应类型
export interface BatchOperationResponse {
  success: boolean
  updated_count: number
  failed_count: number
}

// 项目复制相关类型
export interface ProjectDuplicateRequest {
  name: string
}

// 服务类类型
export interface ProjectServiceType {
  getProjects(params?: ProjectQueryParams, options?: any): Promise<ProjectListResponse>
  createProject(params: ProjectCreate, options?: any): Promise<ProjectDetailResponse>
  getProjectDetail(projectId: number, options?: any): Promise<ProjectDetailResponse>
  updateProject(
    projectId: number,
    params: ProjectUpdate,
    options?: any
  ): Promise<ProjectDetailResponse>
  batchDeleteProjects(projectIds: number[], options?: any): Promise<ProjectDeleteResponse>
  updateProjectStatus(
    projectId: number,
    params: ProjectStatusUpdateRequest,
    options?: any
  ): Promise<ProjectDetailResponse>
  updateProjectComponent(
    projectId: number,
    params: ProjectComponentUpdateRequest,
    options?: any
  ): Promise<ProjectDetailResponse>
  getProjectStatistics(options?: any): Promise<ProjectStatisticsResponse>
  getProjectStats(options?: any): Promise<ProjectStatisticsResponse>
  duplicateProject(
    projectId: number,
    newName: string,
    options?: any
  ): Promise<ProjectDetailResponse>
  searchProjects(params: ProjectSearchParams, options?: any): Promise<ProjectListResponse>
  quickCreateProject(
    name: string,
    options?: { status?: ProjectStatus; folder_id?: number | null }
  ): Promise<ProjectDetailResponse>
  quickSearch(
    keywords: string,
    options?: { status?: ProjectStatus | null; folder_id?: number | null; maxResults?: number }
  ): Promise<ProjectListResponse>
  getMyProjects(
    status?: ProjectStatus,
    options?: { page?: number; page_size?: number; folder_id?: number | null }
  ): Promise<ProjectListResponse>
  batchUpdateStatus(projectIds: number[], status: ProjectStatus): Promise<BatchOperationResponse>
  moveToNextStage(projectId: number): Promise<ProjectDetailResponse>
  createProjectWithPolling(
    name: string,
    options?: { status?: ProjectStatus; folder_id?: number | null }
  ): Promise<{ projectId: number; project: Project; status: 'completed' }>
}
