/**
 * 项目相关类型定义
 * Project Types
 */

export interface ProjectCreate {
  name: string
  status?: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED'
  current_component?: 'topic-selection' | 'outline' | 'content'
  folder_id?: number | null
}

export interface ProjectUpdate {
  name?: string | null
  status?: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED' | null
  current_component?: 'topic-selection' | 'outline' | 'content' | null
  folder_id?: number | null
}

export interface ProjectResponse {
  id: number
  user_id: number
  name: string
  status: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED'
  current_component: 'topic-selection' | 'outline' | 'content'
  folder_id?: number | null
  last_modified: string
  created_at: string
  updated_at: string
}

export interface ProjectDetailResponse {
  success: boolean
  message: string
  project: ProjectResponse
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

export interface ProjectDeleteRequest {
  project_ids: number[]
}

export interface ProjectDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<Record<string, any>>
}

export interface ProjectStatisticsResponse {
  success: boolean
  message: string
  data: Record<string, number>
}
