/**
 * 需求管理服务相关类型定义
 * 基于OpenAPI规范的需求API类型
 */

// 需求状态和类型
export type RequirementStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
export type RequirementPriority = 'low' | 'medium' | 'high' | 'critical'
export type RequirementType =
  | 'functional'
  | 'non_functional'
  | 'technical'
  | 'business'
  | 'user_experience'
  | 'other'

// 基础需求类型
export interface Requirement {
  id: number
  project_id: number
  title: string
  description: string
  type: RequirementType
  priority: RequirementPriority
  status: RequirementStatus
  acceptance_criteria?: string
  estimated_hours?: number
  actual_hours?: number
  assignee_id?: string
  reporter_id?: string
  tags: string[]
  dependencies: number[]
  created_at: string
  updated_at: string
  due_date?: string
  completed_at?: string
  metadata?: Record<string, any>
}

// 请求类型
export interface RequirementCreateRequest {
  project_id: number
  title: string
  description: string
  type: RequirementType
  priority: RequirementPriority
  acceptance_criteria?: string
  estimated_hours?: number
  assignee_id?: string
  tags?: string[]
  dependencies?: number[]
  due_date?: string
  metadata?: Record<string, any>
}

export interface RequirementUpdateRequest extends Partial<RequirementCreateRequest> {
  status?: RequirementStatus
  actual_hours?: number
}

export interface RequirementStatusUpdateRequest {
  status: RequirementStatus
  actual_hours?: number
  completion_notes?: string
}

export interface RequirementAssignRequest {
  assignee_id: string
  notes?: string
}

export interface RequirementBatchUpdateRequest {
  requirement_ids: number[]
  updates: Partial<RequirementUpdateRequest>
}

// 响应类型
export interface RequirementDetailResponse {
  success: boolean
  message: string
  requirement: Requirement
  related_requirements?: Requirement[]
  time_logs?: RequirementTimeLog[]
  attachments?: RequirementAttachment[]
}

export interface RequirementListResponse {
  success: boolean
  message: string
  requirements: Requirement[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
  filters_applied?: Record<string, any>
}

export type RequirementCreateResponse = RequirementDetailResponse
export type RequirementUpdateResponse = RequirementDetailResponse
export interface RequirementDeleteResponse {
  success: boolean
  message: string
  requirement_id: number
  deleted_at: string
  cascaded_deletes?: number[]
}

export interface RequirementBatchUpdateResponse {
  success: boolean
  message: string
  total_updated: number
  failed_updates: number
  results: Array<{
    requirement_id: number
    success: boolean
    error?: string
  }>
}

// 时间日志类型
export interface RequirementTimeLog {
  id: number
  requirement_id: number
  user_id: string
  hours: number
  description?: string
  log_date: string
  created_at: string
}

export interface RequirementTimeLogCreateRequest {
  requirement_id: number
  hours: number
  description?: string
  log_date?: string
}

export interface RequirementTimeLogResponse {
  success: boolean
  message: string
  time_log: RequirementTimeLog
}

// 附件类型
export interface RequirementAttachment {
  id: number
  requirement_id: number
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
  description?: string
}

export interface RequirementAttachmentUploadRequest {
  requirement_id: number
  file: File
  description?: string
}

export interface RequirementAttachmentResponse {
  success: boolean
  message: string
  attachment: RequirementAttachment
}

// 需求依赖类型
export interface RequirementDependency {
  id: number
  requirement_id: number
  depends_on_requirement_id: number
  dependency_type: 'blocks' | 'related' | 'duplicates' | 'implements'
  created_at: string
  created_by: string
}

export interface RequirementDependencyCreateRequest {
  requirement_id: number
  depends_on_requirement_id: number
  dependency_type: 'blocks' | 'related' | 'duplicates' | 'implements'
}

export interface RequirementDependencyResponse {
  success: boolean
  message: string
  dependency: RequirementDependency
}

// 需求统计类型
export interface RequirementStatisticsResponse {
  success: boolean
  message: string
  project_id?: number
  statistics: {
    total_requirements: number
    requirements_by_status: Record<RequirementStatus, number>
    requirements_by_priority: Record<RequirementPriority, number>
    requirements_by_type: Record<RequirementType, number>
    completion_rate: number
    average_completion_time: number
    total_estimated_hours: number
    total_actual_hours: number
    overdue_count: number
    upcoming_due_count: number
  }
  trends?: {
    created_this_week: number
    completed_this_week: number
    created_this_month: number
    completed_this_month: number
  }
}

// 需求模板类型
export interface RequirementTemplate {
  id: number
  name: string
  description?: string
  category: RequirementType
  template_data: {
    title_template: string
    description_template: string
    acceptance_criteria_template?: string
    default_priority: RequirementPriority
    estimated_hours_range?: {
      min: number
      max: number
    }
    tags: string[]
    checklist?: string[]
  }
  created_by: string
  created_at: string
  usage_count: number
}

export interface RequirementTemplateCreateRequest {
  name: string
  description?: string
  category: RequirementType
  template_data: {
    title_template: string
    description_template: string
    acceptance_criteria_template?: string
    default_priority: RequirementPriority
    estimated_hours_range?: {
      min: number
      max: number
    }
    tags: string[]
    checklist?: string[]
  }
}

// 查询参数
export interface RequirementQueryParams {
  project_id?: number
  status?: RequirementStatus | RequirementStatus[]
  priority?: RequirementPriority | RequirementPriority[]
  type?: RequirementType | RequirementType[]
  assignee_id?: string
  reporter_id?: string
  tags?: string[]
  due_date_from?: string
  due_date_to?: string
  created_date_from?: string
  created_date_to?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

// 服务类类型
export interface RequirementServiceType {
  getProjectRequirements(
    projectId: number,
    params?: RequirementQueryParams,
    options?: any
  ): Promise<RequirementListResponse>
  getRequirementById(requirementId: number, options?: any): Promise<RequirementDetailResponse>
  createRequirement(
    request: RequirementCreateRequest,
    options?: any
  ): Promise<RequirementCreateResponse>
  updateRequirement(
    requirementId: number,
    request: RequirementUpdateRequest,
    options?: any
  ): Promise<RequirementUpdateResponse>
  deleteRequirement(requirementId: number, options?: any): Promise<RequirementDeleteResponse>
  updateRequirementStatus(
    requirementId: number,
    request: RequirementStatusUpdateRequest,
    options?: any
  ): Promise<RequirementUpdateResponse>
  assignRequirement(
    requirementId: number,
    request: RequirementAssignRequest,
    options?: any
  ): Promise<RequirementUpdateResponse>
  batchUpdateRequirements(
    request: RequirementBatchUpdateRequest,
    options?: any
  ): Promise<RequirementBatchUpdateResponse>
  searchRequirements(
    params: RequirementQueryParams,
    options?: any
  ): Promise<RequirementListResponse>
  getRequirementDependencies(
    requirementId: number,
    options?: any
  ): Promise<{ dependencies: RequirementDependency[] }>
  createRequirementDependency(
    request: RequirementDependencyCreateRequest,
    options?: any
  ): Promise<RequirementDependencyResponse>
  deleteRequirementDependency(
    dependencyId: number,
    options?: any
  ): Promise<{ success: boolean; message: string }>
  getRequirementTimeLogs(
    requirementId: number,
    options?: any
  ): Promise<{ time_logs: RequirementTimeLog[] }>
  addTimeLog(
    request: RequirementTimeLogCreateRequest,
    options?: any
  ): Promise<RequirementTimeLogResponse>
  updateTimeLog(
    timeLogId: number,
    hours: number,
    description?: string,
    options?: any
  ): Promise<RequirementTimeLogResponse>
  deleteTimeLog(timeLogId: number, options?: any): Promise<{ success: boolean; message: string }>
  getRequirementAttachments(
    requirementId: number,
    options?: any
  ): Promise<{ attachments: RequirementAttachment[] }>
  uploadAttachment(
    request: RequirementAttachmentUploadRequest,
    options?: any
  ): Promise<RequirementAttachmentResponse>
  deleteAttachment(
    attachmentId: number,
    options?: any
  ): Promise<{ success: boolean; message: string }>
  getRequirementStatistics(
    projectId?: number,
    options?: any
  ): Promise<RequirementStatisticsResponse>
  getRequirementTemplates(options?: any): Promise<{ templates: RequirementTemplate[] }>
  createRequirementTemplate(
    request: RequirementTemplateCreateRequest,
    options?: any
  ): Promise<RequirementTemplate>
  applyTemplateToRequirement(
    templateId: number,
    projectData: Partial<RequirementCreateRequest>,
    options?: any
  ): Promise<RequirementCreateResponse>
}
