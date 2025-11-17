/**
 * 素材管理服务相关类型定义
 * 基于OpenAPI规范的素材API类型
 */

// 基础素材类型
export interface Material {
  id: number
  title: string
  content?: string
  summary?: string
  source?: string
  source_url?: string
  author?: string
  tags: string[]
  score?: number
  type: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  metadata?: Record<string, any>
}

// 素材响应类型
export interface MaterialResponse {
  success: boolean
  message: string
  material: Material
}

export interface MaterialListResponse {
  success: boolean
  message: string
  materials: Material[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

// 素材CRUD操作类型
export interface MaterialCreateRequest {
  title: string
  content?: string
  summary?: string
  source?: string
  source_url?: string
  author?: string
  tags?: string[]
  type?: string
  metadata?: Record<string, any>
}

export interface MaterialUpdateRequest extends Partial<MaterialCreateRequest> {
  id?: number
}

export interface AddCompleteMaterialRequest extends MaterialCreateRequest {
  project_id?: number
  title_candidate_id?: number
  outline_section_id?: number
}

export interface MaterialDeleteRequest {
  material_ids: number[]
}

export interface MaterialDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<{
    material_id: number
    success: boolean
    error?: string
  }>
}

// 外部素材相关类型
export interface AddExternalMaterialRequest {
  url: string
  title?: string
  summary?: string
  tags?: string[]
  type?: string
  project_id?: number
  title_candidate_id?: number
  outline_section_id?: number
}

export interface MaterialAddToProjectResponse {
  success: boolean
  message: string
  material: Material
  binding_info?: {
    project_id: number
    title_candidate_id?: number
    outline_section_id?: number
  }
}

// 素材标签相关类型
export interface MaterialTagCreate {
  name: string
  color?: string
  description?: string
}

export interface MaterialTagResponse {
  id: number
  name: string
  color?: string
  description?: string
  created_at: string
  updated_at: string
  usage_count: number
}

export interface TagListResponse {
  success: boolean
  message: string
  tags: MaterialTagResponse[]
}

// 素材搜索相关类型
export interface MaterialSearchRequest {
  keywords: string
  filters?: MaterialSearchFilters
  project_id?: number
  page?: number
  page_size?: number
}

export interface MaterialSearchFilters {
  tags?: string[]
  type?: string
  score_range?: [number, number]
  date_range?: {
    start: string
    end: string
  }
  source?: string
}

export interface MaterialSearchResponse {
  success: boolean
  message: string
  results: Material[]
  total_count: number
  search_time?: number
  facets?: Record<string, Array<{ value: string; count: number }>>
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
}

// 素材查询参数
export interface MaterialQueryParams {
  page?: number
  page_size?: number
  keywords?: string
  tags?: string[]
  type?: string
  source?: string
  score_min?: number
  score_max?: number
  date_from?: string
  date_to?: string
  project_id?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 素材统计相关类型
export interface MaterialStatisticsResponse {
  success: boolean
  message: string
  data: {
    total_materials: number
    materials_by_type: Record<string, number>
    materials_by_source: Record<string, number>
    average_score: number
    recent_additions: number
    tag_usage: Record<string, number>
  }
}

// 批量操作相关类型
export interface MaterialBatchOperationRequest {
  material_ids: number[]
  operation: 'tag' | 'delete' | 'update_score' | 'add_to_project'
  parameters?: Record<string, any>
}

export interface MaterialBatchOperationResponse {
  success: boolean
  message: string
  total_count: number
  success_count: number
  failed_count: number
  results: Array<{
    material_id: number
    success: boolean
    error?: string
  }>
}

// 服务类类型
export interface MaterialServiceType {
  getMaterials(params?: MaterialQueryParams, options?: any): Promise<MaterialListResponse>
  getMaterialById(materialId: number, options?: any): Promise<MaterialResponse>
  createMaterial(request: MaterialCreateRequest, options?: any): Promise<MaterialResponse>
  updateMaterial(
    materialId: number,
    request: MaterialUpdateRequest,
    options?: any
  ): Promise<MaterialResponse>
  deleteMaterial(materialId: number, options?: any): Promise<{ success: boolean; message: string }>
  batchDeleteMaterials(
    request: MaterialDeleteRequest,
    options?: any
  ): Promise<MaterialDeleteResponse>
  addExternalMaterial(
    request: AddExternalMaterialRequest,
    options?: any
  ): Promise<MaterialAddToProjectResponse>
  addCompleteMaterial(
    request: AddCompleteMaterialRequest,
    options?: any
  ): Promise<MaterialAddToProjectResponse>
  searchMaterials(request: MaterialSearchRequest, options?: any): Promise<MaterialSearchResponse>
  getMaterialTags(options?: any): Promise<TagListResponse>
  createMaterialTag(request: MaterialTagCreate, options?: any): Promise<MaterialTagResponse>
  updateMaterialTag(
    tagId: number,
    request: Partial<MaterialTagCreate>,
    options?: any
  ): Promise<MaterialTagResponse>
  deleteMaterialTag(tagId: number, options?: any): Promise<{ success: boolean; message: string }>
  getMaterialStatistics(options?: any): Promise<MaterialStatisticsResponse>
  batchOperation(
    request: MaterialBatchOperationRequest,
    options?: any
  ): Promise<MaterialBatchOperationResponse>
}
