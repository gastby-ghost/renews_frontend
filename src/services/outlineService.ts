import http from '@/utils/http'

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

export interface OutlineWithSectionsResponse extends OutlineDetailResponse {
  sections: OutlineSection[]
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

export interface OutlineUpdate {
  research_brief?: string
}

// Type alias for OutlineDetailResponse used as update response for type safety and API consistency
export type OutlineUpdateResponse = OutlineDetailResponse

export interface OutlineActivateRequest {
  reason?: string
}

// Type alias for OutlineDetailResponse used as activate response for type safety and API consistency
export type OutlineActivateResponse = OutlineDetailResponse

export interface OutlineDeactivateRequest {
  reason?: string
}

// Type alias for OutlineDetailResponse used as deactivate response for type safety and API consistency
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

export const outlineService = {
  /**
   * 为项目创建大纲
   */
  async createOutline(projectId: number, data: OutlineCreate) {
    const response = await http.post<OutlineCreateResponse>(
      `/api/v1/core/projects/${projectId}/outlines`,
      data
    )
    return response.data
  },

  /**
   * 获取项目活动大纲
   */
  async getActiveOutline(projectId: number) {
    const response = await http.get<OutlineDetailResponse>(
      `/api/v1/core/projects/${projectId}/outlines/active`
    )
    return response.data
  },

  /**
   * 获取大纲版本历史
   */
  async getOutlineHistory(projectId: number, skip = 0, limit = 100) {
    const response = await http.get<OutlineHistoryResponse>(
      `/api/v1/core/projects/${projectId}/outlines/history`,
      { params: { skip, limit } }
    )
    return response.data
  },

  /**
   * 获取大纲及所有章节
   */
  async getOutlineWithSections(outlineId: number) {
    const response = await http.get<OutlineWithSectionsResponse>(
      `/api/v1/core/outlines/${outlineId}`
    )
    return response.data
  },

  /**
   * 更新大纲
   */
  async updateOutline(outlineId: number, data: OutlineUpdate) {
    const response = await http.put<OutlineDetailResponse>(
      `/api/v1/core/outlines/${outlineId}`,
      data
    )
    return response.data
  },

  /**
   * 删除大纲（仅限非活动版本）
   */
  async deleteOutline(outlineId: number) {
    const response = await http.delete<OutlineDetailResponse>(`/api/v1/core/outlines/${outlineId}`)
    return response.data
  },

  /**
   * 激活大纲版本
   */
  async activateOutline(outlineId: number, data: OutlineActivateRequest) {
    const response = await http.put<OutlineDetailResponse>(
      `/api/v1/core/outlines/${outlineId}/activate`,
      data
    )
    return response.data
  },

  /**
   * 停用大纲版本
   */
  async deactivateOutline(outlineId: number, data: OutlineDeactivateRequest) {
    const response = await http.put<OutlineDetailResponse>(
      `/api/v1/core/outlines/${outlineId}/deactivate`,
      data
    )
    return response.data
  }
}
