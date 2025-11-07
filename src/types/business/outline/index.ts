/**
 * 大纲相关类型定义
 * Outline Types
 */

export interface OutlineCreate {
  title_candidate_id: number
  research_brief?: string
}

export interface OutlineCreateResponse {
  id: number
  project_id: number
  title_candidate_id: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OutlineDetailResponse {
  id: number
  project_id: number
  title_candidate_id: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OutlineSection {
  id: number
  outline_id: number
  title: string
  content_direction?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface OutlineWithSectionsResponse extends OutlineDetailResponse {
  sections: OutlineSection[]
}

export interface OutlineUpdate {
  research_brief?: string
}

export type OutlineUpdateResponse = OutlineDetailResponse

export interface OutlineActivateRequest {
  reason?: string
}

export type OutlineActivateResponse = OutlineDetailResponse

export interface OutlineDeactivateRequest {
  reason?: string
}

export type OutlineDeactivateResponse = OutlineDetailResponse

export interface OutlineHistoryItem {
  id: number
  project_id: number
  title_candidate_id: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OutlineHistoryResponse {
  items: OutlineHistoryItem[]
  total: number
  skip: number
  limit: number
}

// 大纲章节相关类型
export interface OutlineSectionCreate {
  title: string
  content_direction?: string
  order_index: number
}

export type OutlineSectionCreateResponse = OutlineSection

export interface OutlineSectionListResponse {
  items: OutlineSection[]
  total: number
}

export type OutlineSectionDetailResponse = OutlineSection

export interface OutlineSectionUpdate {
  title?: string
  content_direction?: string
  order_index?: number
}

export type OutlineSectionUpdateResponse = OutlineSection

export interface OutlineSectionDeleteResponse {
  id: number
  success: boolean
}

export interface OutlineSectionBatchCreate {
  sections: OutlineSectionCreate[]
}

export interface OutlineSectionBatchCreateResponse {
  items: OutlineSection[]
  total: number
  created: number
  failed: number
}

export interface OutlineSectionReorder {
  section_orders: Array<{
    id: number
    order_index: number
  }>
}

export interface OutlineSectionReorderResponse {
  items: OutlineSection[]
  total: number
}
