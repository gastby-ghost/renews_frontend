/**
 * 素材关联服务相关类型定义
 * 基于OpenAPI规范的素材关联API类型
 */

// 基础关联类型
export type BindingType = 'primary' | 'reference' | 'supporting'

// 素材与标题关联类型
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
    type?: string
    source?: string
  }
  created_at: string
  updated_at: string
  binding_notes?: string
  relevance_factors?: string[]
}

// 素材与章节关联类型
export interface MaterialSectionRelation {
  id: number
  outline_section_id: number
  material_id: number
  binding_type: BindingType
  material?: {
    id: number
    title: string
    summary?: string
    tags?: string[]
    type?: string
    source?: string
  }
  created_at: string
  updated_at: string
  binding_notes?: string
  usage_count?: number
}

// 请求类型
export interface MaterialTitleBindRequest {
  material_id: number
  score?: number
  binding_notes?: string
  relevance_factors?: string[]
}

export interface MaterialTitleUpdateScoreRequest {
  score: number
  binding_notes?: string
  relevance_factors?: string[]
}

export interface MaterialSectionBindRequest {
  material_id: number
  binding_type?: BindingType
  binding_notes?: string
}

export interface MaterialSectionUpdateTypeRequest {
  binding_type: BindingType
  binding_notes?: string
}

export interface MaterialBatchBindTitleRequest {
  material_ids: number[]
  scores?: number[]
  binding_notes?: string
  auto_score?: boolean
}

export interface MaterialBatchBindSectionRequest {
  material_ids: number[]
  binding_types?: BindingType[]
  binding_notes?: string
}

export interface MaterialBatchUnbindRequest {
  material_ids: number[]
  reason?: string
}

// 响应类型
export interface MaterialTitleListResponse {
  success: boolean
  message: string
  items: MaterialTitleRelation[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
  statistics?: {
    average_score: number
    high_relevance_count: number
    medium_relevance_count: number
    low_relevance_count: number
  }
}

export interface MaterialSectionListResponse {
  success: boolean
  message: string
  items: MaterialSectionRelation[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
  statistics?: {
    primary_count: number
    reference_count: number
    supporting_count: number
  }
}

export interface MaterialRelationsResponse {
  success: boolean
  message: string
  title_relations: MaterialTitleRelation[]
  section_relations: MaterialSectionRelation[]
  total: number
  summary: {
    total_title_relations: number
    total_section_relations: number
    most_bound_materials: Array<{
      material_id: number
      material_title: string
      binding_count: number
    }>
  }
}

export interface MaterialUnbindResponse {
  success: boolean
  message: string
  unbound_relations: Array<{
    relation_id: number
    material_id: number
    target_id: number
    target_type: 'title' | 'section'
  }>
  unbinded_at: string
}

export interface MaterialUpdateResponse {
  success: boolean
  message: string
  id: number
  updated_fields: string[]
  updated_at: string
}

export interface MaterialBatchResponse {
  success: boolean
  message: string
  success_count: number
  failed_count: number
  total: number
  items: Array<{
    material_id: number
    success: boolean
    error?: string
    relation_id?: number
  }>
  processed_at: string
}

// 智能绑定相关类型
export interface MaterialSmartBindRequest {
  title_candidate_id?: number
  outline_section_id?: number
  material_filters?: {
    keywords?: string[]
    tags?: string[]
    type?: string
    min_score?: number
    max_count?: number
  }
  binding_options?: {
    auto_score_threshold?: number
    preferred_binding_type?: BindingType
    allow_duplicates?: boolean
  }
}

export interface MaterialSmartBindResponse {
  success: boolean
  message: string
  auto_bound_relations: Array<{
    material_id: number
    target_id: number
    target_type: 'title' | 'section'
    score?: number
    binding_type?: BindingType
    confidence: number
    reasoning: string
  }>
  suggested_bindings: Array<{
    material_id: number
    target_id: number
    target_type: 'title' | 'section'
    suggested_score?: number
    suggested_binding_type?: BindingType
    confidence: number
    reasoning: string
  }>
  statistics: {
    total_processed: number
    auto_bound: number
    suggested: number
    ignored: number
    processing_time: number
  }
}

// 关联分析相关类型
export interface MaterialRelationAnalysisRequest {
  title_candidate_id?: number
  outline_section_id?: number
  analysis_type?: 'usage' | 'relevance' | 'coverage' | 'quality'
}

export interface MaterialRelationAnalysisResponse {
  success: boolean
  message: string
  analysis_type: string
  target_id?: number
  target_type?: 'title' | 'section'
  insights: {
    material_coverage: {
      total_materials: number
      relevant_materials: number
      coverage_percentage: number
      gaps: string[]
    }
    relevance_distribution: {
      high_relevance: number
      medium_relevance: number
      low_relevance: number
    }
    binding_type_distribution: Record<BindingType, number>
    quality_metrics: {
      average_score: number
      diversity_score: number
      recency_score: number
    }
  }
  recommendations: string[]
  analyzed_at: string
}

// 查询参数
export interface MaterialRelationQueryParams {
  skip?: number
  limit?: number
  min_score?: number
  max_score?: number
  binding_type?: BindingType
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include_material_details?: boolean
}

// 服务类类型
export interface MaterialRelationServiceType {
  getTitleMaterials(
    titleCandidateId: number,
    skip?: number,
    limit?: number,
    options?: any
  ): Promise<MaterialTitleListResponse>
  getSectionMaterials(
    outlineSectionId: number,
    skip?: number,
    limit?: number,
    options?: any
  ): Promise<MaterialSectionListResponse>
  bindMaterialToTitle(
    titleCandidateId: number,
    request: MaterialTitleBindRequest,
    options?: any
  ): Promise<MaterialUpdateResponse>
  bindMaterialToSection(
    outlineSectionId: number,
    request: MaterialSectionBindRequest,
    options?: any
  ): Promise<MaterialUpdateResponse>
  unbindMaterialFromTitle(
    titleCandidateId: number,
    materialId: number,
    options?: any
  ): Promise<MaterialUnbindResponse>
  unbindMaterialFromSection(
    outlineSectionId: number,
    materialId: number,
    options?: any
  ): Promise<MaterialUnbindResponse>
  updateTitleRelevanceScore(
    relationId: number,
    request: MaterialTitleUpdateScoreRequest,
    options?: any
  ): Promise<MaterialUpdateResponse>
  updateSectionBindingType(
    relationId: number,
    request: MaterialSectionUpdateTypeRequest,
    options?: any
  ): Promise<MaterialUpdateResponse>
  getMaterialAllRelations(materialId: number, options?: any): Promise<MaterialRelationsResponse>
  batchBindMaterialsToTitle(
    titleCandidateId: number,
    request: MaterialBatchBindTitleRequest,
    options?: any
  ): Promise<MaterialBatchResponse>
  batchBindMaterialsToSection(
    outlineSectionId: number,
    request: MaterialBatchBindSectionRequest,
    options?: any
  ): Promise<MaterialBatchResponse>
  batchUnbindMaterialsFromTitle(
    titleCandidateId: number,
    request: MaterialBatchUnbindRequest,
    options?: any
  ): Promise<MaterialBatchResponse>
  batchUnbindMaterialsFromSection(
    outlineSectionId: number,
    request: MaterialBatchUnbindRequest,
    options?: any
  ): Promise<MaterialBatchResponse>
  smartBindMaterials(
    request: MaterialSmartBindRequest,
    options?: any
  ): Promise<MaterialSmartBindResponse>
  analyzeRelations(
    request: MaterialRelationAnalysisRequest,
    options?: any
  ): Promise<MaterialRelationAnalysisResponse>
}
