/**
 * 大纲管理服务相关类型定义
 * 基于OpenAPI规范的大纲API类型
 */

// 大纲基础类型
export interface Outline {
  id: number
  project_id: number
  title_candidate_id: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  research_brief?: string
}

// 大纲请求类型
export interface OutlineCreateRequest {
  title_candidate_id: number
  research_brief?: string
}

export interface OutlineUpdateRequest {
  research_brief?: string
}

export interface OutlineActivateRequest {
  reason?: string
}

export interface OutlineDeactivateRequest {
  reason?: string
}

// 大纲响应类型
export interface OutlineDetailResponse {
  success: boolean
  message: string
  outline: Outline
}

export interface OutlineListResponse {
  success: boolean
  message: string
  outlines: Outline[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
}

export type OutlineCreateResponse = OutlineDetailResponse
export type OutlineUpdateResponse = OutlineDetailResponse
export type OutlineActivateResponse = OutlineDetailResponse
export type OutlineDeactivateResponse = OutlineDetailResponse

// 大纲历史相关类型
export interface OutlineHistoryItem {
  id: number
  project_id: number
  title_candidate_id: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  research_brief?: string
}

export interface OutlineHistoryResponse {
  success: boolean
  message: string
  items: OutlineHistoryItem[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
}

// 大纲章节相关类型
// OutlineSection 相关类型已移至 @/types/core/outlineSection.ts

// 大纲生成相关类型
export interface OutlineGenerateRequest {
  title_candidate_id: number
  research_brief?: string
  generation_options?: {
    max_sections?: number
    include_subsections?: boolean
    style?: 'academic' | 'blog' | 'report' | 'general'
    depth?: number
  }
}

export interface OutlineGenerateResponse {
  success: boolean
  message: string
  outline: Outline
  sections: Array<{
    id: number
    outline_id: number
    title: string
    content_direction?: string
    order_index: number
    created_at: string
    updated_at: string
  }>
  generation_info: {
    model_used: string
    tokens_used: number
    generation_time: number
  }
}

// 大纲比较相关类型
export interface OutlineCompareRequest {
  from_outline_id: number
  to_outline_id: number
}

export interface OutlineCompareResponse {
  success: boolean
  message: string
  comparison: {
    from_outline: Outline
    to_outline: Outline
    section_changes: {
      added: Array<{ id: number; title: string; order_index: number }>
      removed: Array<{ id: number; title: string; order_index: number }>
      modified: Array<{
        from: { id: number; title: string; order_index: number }
        to: { id: number; title: string; order_index: number }
        changes: string[]
      }>
    }
    summary: {
      total_sections_added: number
      total_sections_removed: number
      total_sections_modified: number
    }
  }
}

// 大纲查询参数
export interface OutlineQueryParams {
  skip?: number
  limit?: number
  project_id?: number
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 服务类类型
export interface OutlineServiceType {
  getOutlines(params?: OutlineQueryParams, options?: any): Promise<OutlineListResponse>
  getOutlineById(outlineId: number, options?: any): Promise<OutlineDetailResponse>
  createOutline(request: OutlineCreateRequest, options?: any): Promise<OutlineCreateResponse>
  updateOutline(
    outlineId: number,
    request: OutlineUpdateRequest,
    options?: any
  ): Promise<OutlineUpdateResponse>
  deleteOutline(outlineId: number, options?: any): Promise<{ success: boolean; message: string }>
  activateOutline(
    outlineId: number,
    request?: OutlineActivateRequest,
    options?: any
  ): Promise<OutlineActivateResponse>
  deactivateOutline(
    outlineId: number,
    request?: OutlineDeactivateRequest,
    options?: any
  ): Promise<OutlineDeactivateResponse>
  getOutlineHistory(
    projectId: number,
    params?: OutlineQueryParams,
    options?: any
  ): Promise<OutlineHistoryResponse>
  generateOutline(request: OutlineGenerateRequest, options?: any): Promise<OutlineGenerateResponse>
  compareOutlines(request: OutlineCompareRequest, options?: any): Promise<OutlineCompareResponse>
  getProjectActiveOutline(projectId: number, options?: any): Promise<OutlineDetailResponse>
}
