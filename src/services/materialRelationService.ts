import http from '@/utils/http'

// ==================== Title Material Relations ====================

export interface MaterialTitleBindRequest {
  material_id: number
  score?: number
}

export interface MaterialTitleBindResponse {
  id: number
  title_candidate_id: number
  material_id: number
  score: number
  created_at: string
  updated_at: string
}

export interface MaterialTitleListResponse {
  items: MaterialTitleRelation[]
  total: number
}

export interface MaterialTitleRelation {
  id: number
  title_candidate_id: number
  material_id: number
  score: number
  material?: {
    id: number
    title: string
    summary?: string
    tags?: string[]
  }
  created_at: string
  updated_at: string
}

export interface MaterialUnbindResponse {
  success: boolean
  message: string
}

export interface MaterialTitleUpdateScoreRequest {
  score: number
}

export interface MaterialUpdateResponse {
  id: number
  success: boolean
  updated_fields: string[]
}

// ==================== Section Material Relations ====================

export interface MaterialSectionBindRequest {
  material_id: number
  binding_type?: 'primary' | 'reference' | 'supporting'
}

export interface MaterialSectionBindResponse {
  id: number
  outline_section_id: number
  material_id: number
  binding_type: string
  created_at: string
  updated_at: string
}

export interface MaterialSectionListResponse {
  items: MaterialSectionRelation[]
  total: number
}

export interface MaterialSectionRelation {
  id: number
  outline_section_id: number
  material_id: number
  binding_type: string
  material?: {
    id: number
    title: string
    summary?: string
    tags?: string[]
  }
  created_at: string
  updated_at: string
}

export interface MaterialSectionUpdateTypeRequest {
  binding_type: 'primary' | 'reference' | 'supporting'
}

export interface MaterialSectionUpdateTypeResponse {
  id: number
  outline_section_id: number
  material_id: number
  binding_type: string
  updated_at: string
}

// ==================== Material Relations ====================

export interface MaterialRelationsResponse {
  title_relations: MaterialTitleRelation[]
  section_relations: MaterialSectionRelation[]
  total: number
}

// ==================== Batch Operations ====================

export interface MaterialBatchBindTitleRequest {
  material_ids: number[]
  scores?: number[]
}

export interface MaterialBatchBindSectionRequest {
  material_ids: number[]
  binding_types?: string[]
}

export interface MaterialBatchUnbindRequest {
  material_ids: number[]
}

export interface MaterialBatchResponse {
  success_count: number
  failed_count: number
  total: number
  items: Array<{
    material_id: number
    success: boolean
    error?: string
  }>
}

export const materialRelationService = {
  // ==================== Title Material Relations ====================

  /**
   * 绑定素材到标题候选
   */
  async bindMaterialToTitle(titleCandidateId: number, data: MaterialTitleBindRequest) {
    const response = await http.post<MaterialTitleBindResponse>(
      `/api/v1/core/material-relations/titles/${titleCandidateId}/materials`,
      data
    )
    return response.data
  },

  /**
   * 获取标题候选关联的素材列表
   */
  async getTitleMaterials(titleCandidateId: number, skip = 0, limit = 100) {
    const response = await http.get<MaterialTitleListResponse>(
      `/api/v1/core/material-relations/titles/${titleCandidateId}/materials`,
      { params: { skip, limit } }
    )
    return response.data
  },

  /**
   * 解除素材与标题候选的绑定
   */
  async unbindMaterialFromTitle(titleCandidateId: number, materialId: number) {
    const response = await http.delete<MaterialUnbindResponse>(
      `/api/v1/core/material-relations/titles/${titleCandidateId}/materials/${materialId}`
    )
    return response.data
  },

  /**
   * 更新素材-标题关联的相关性评分
   */
  async updateTitleRelevanceScore(relationId: number, data: MaterialTitleUpdateScoreRequest) {
    const response = await http.put<MaterialUpdateResponse>(
      `/api/v1/core/material-relations/titles/relations/${relationId}/score`,
      data
    )
    return response.data
  },

  // ==================== Section Material Relations ====================

  /**
   * 绑定素材到大纲章节
   */
  async bindMaterialToSection(outlineSectionId: number, data: MaterialSectionBindRequest) {
    const response = await http.post<MaterialSectionBindResponse>(
      `/api/v1/core/material-relations/sections/${outlineSectionId}/materials`,
      data
    )
    return response.data
  },

  /**
   * 获取大纲章节关联的素材列表
   */
  async getSectionMaterials(outlineSectionId: number, skip = 0, limit = 100) {
    const response = await http.get<MaterialSectionListResponse>(
      `/api/v1/core/material-relations/sections/${outlineSectionId}/materials`,
      { params: { skip, limit } }
    )
    return response.data
  },

  /**
   * 解除素材与大纲章节的绑定
   */
  async unbindMaterialFromSection(outlineSectionId: number, materialId: number) {
    const response = await http.delete<MaterialUnbindResponse>(
      `/api/v1/core/material-relations/sections/${outlineSectionId}/materials/${materialId}`
    )
    return response.data
  },

  /**
   * 更新素材-章节关联的绑定类型
   */
  async updateSectionBindingType(relationId: number, data: MaterialSectionUpdateTypeRequest) {
    const response = await http.put<MaterialSectionUpdateTypeResponse>(
      `/api/v1/core/material-relations/sections/relations/${relationId}/binding-type`,
      data
    )
    return response.data
  },

  // ==================== Material Relations ====================

  /**
   * 获取素材的所有关联关系
   */
  async getMaterialAllRelations(materialId: number) {
    const response = await http.get<MaterialRelationsResponse>(
      `/api/v1/core/material-relations/materials/${materialId}/relations`
    )
    return response.data
  },

  // ==================== Batch Operations ====================

  /**
   * 批量绑定素材到标题候选
   */
  async batchBindMaterialsToTitle(titleCandidateId: number, data: MaterialBatchBindTitleRequest) {
    const response = await http.post<MaterialBatchResponse>(
      `/api/v1/core/material-relations/titles/${titleCandidateId}/materials/batch`,
      data
    )
    return response.data
  },

  /**
   * 批量绑定素材到大纲章节
   */
  async batchBindMaterialsToSection(
    outlineSectionId: number,
    data: MaterialBatchBindSectionRequest
  ) {
    const response = await http.post<MaterialBatchResponse>(
      `/api/v1/core/material-relations/sections/${outlineSectionId}/materials/batch`,
      data
    )
    return response.data
  },

  /**
   * 批量解除素材与标题候选的绑定
   */
  async batchUnbindMaterialsFromTitle(titleCandidateId: number, data: MaterialBatchUnbindRequest) {
    const response = await http.post<MaterialBatchResponse>(
      `/api/v1/core/material-relations/titles/${titleCandidateId}/materials/batch-unbind`,
      data
    )
    return response.data
  },

  /**
   * 批量解除素材与大纲章节的绑定
   */
  async batchUnbindMaterialsFromSection(
    outlineSectionId: number,
    data: MaterialBatchUnbindRequest
  ) {
    const response = await http.post<MaterialBatchResponse>(
      `/api/v1/core/material-relations/sections/${outlineSectionId}/materials/batch-unbind`,
      data
    )
    return response.data
  }
}
