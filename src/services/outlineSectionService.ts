import http from '@/utils/http'

export interface OutlineSectionCreate {
  title: string
  content_direction?: string
  order_index: number
}

export interface OutlineSectionCreateResponse {
  id: number
  outline_id: number
  title: string
  content_direction?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface OutlineSectionListResponse {
  items: OutlineSection[]
  total: number
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

// Type alias for OutlineSection used as detail response for type safety and API consistency
export type OutlineSectionDetailResponse = OutlineSection

export interface OutlineSectionUpdate {
  title?: string
  content_direction?: string
  order_index?: number
}

// Type alias for OutlineSection used as update response for type safety and API consistency
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

export const outlineSectionService = {
  /**
   * 创建章节
   */
  async createSection(outlineId: number, data: OutlineSectionCreate) {
    const response = await http.post<OutlineSection>(
      `/api/v1/core/outlines/${outlineId}/sections`,
      data
    )
    return response.data
  },

  /**
   * 获取大纲的所有章节
   */
  async getSectionsByOutline(outlineId: number) {
    const response = await http.get<OutlineSectionListResponse>(
      `/api/v1/core/outlines/${outlineId}/sections`
    )
    return response.data
  },

  /**
   * 获取章节详情
   */
  async getSectionById(sectionId: number) {
    const response = await http.get<OutlineSection>(`/api/v1/core/sections/${sectionId}`)
    return response.data
  },

  /**
   * 更新章节
   */
  async updateSection(sectionId: number, data: OutlineSectionUpdate) {
    const response = await http.put<OutlineSection>(`/api/v1/core/sections/${sectionId}`, data)
    return response.data
  },

  /**
   * 删除章节
   */
  async deleteSection(sectionId: number) {
    const response = await http.delete<OutlineSectionDeleteResponse>(
      `/api/v1/core/sections/${sectionId}`
    )
    return response.data
  },

  /**
   * 批量创建章节
   */
  async batchCreateSections(outlineId: number, data: OutlineSectionBatchCreate) {
    const response = await http.post<OutlineSectionBatchCreateResponse>(
      `/api/v1/core/outlines/${outlineId}/sections/batch`,
      data
    )
    return response.data
  },

  /**
   * 重新排序章节
   */
  async reorderSections(data: OutlineSectionReorder) {
    const response = await http.put<OutlineSectionReorderResponse>(
      `/api/v1/core/sections/reorder`,
      data
    )
    return response.data
  }
}
