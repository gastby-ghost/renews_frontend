/**
 * 大纲章节服务相关类型定义
 * 基于OpenAPI规范的大纲章节API类型
 */

// 大纲章节基础类型
export interface OutlineSection {
  id: number
  outline_id: number
  title: string
  content_direction?: string
  order_index: number
  created_at: string
  updated_at: string
  parent_section_id?: number
  level?: number
  word_count_target?: number
  estimated_reading_time?: number
}

// 请求类型
export interface OutlineSectionCreateRequest {
  title: string
  content_direction?: string
  order_index: number
  parent_section_id?: number
  level?: number
  word_count_target?: number
}

export interface OutlineSectionBatchCreateRequest {
  sections: OutlineSectionCreateRequest[]
}

export interface OutlineSectionReorderRequest {
  section_orders: Array<{
    id: number
    order_index: number
    parent_section_id?: number
  }>
}

export interface OutlineSectionUpdateRequest {
  title?: string
  content_direction?: string
  order_index?: number
  parent_section_id?: number
  level?: number
  word_count_target?: number
}

// 响应类型
export interface OutlineSectionListResponse {
  success: boolean
  message: string
  items: OutlineSection[]
  total: number
  hierarchy?: OutlineSection[]
}

export interface OutlineSectionDetailResponse {
  success: boolean
  message: string
  section: OutlineSection
  subsections?: OutlineSection[]
  parent_section?: OutlineSection
}

export interface OutlineSectionDeleteResponse {
  success: boolean
  message: string
  id: number
  deleted_at: string
}

export type OutlineSectionCreateResponse = OutlineSection
export type OutlineSectionUpdateResponse = OutlineSection

export interface OutlineSectionBatchCreateResponse {
  success: boolean
  message: string
  items: OutlineSection[]
  total: number
  created: number
  failed: number
  errors?: Array<{
    index: number
    error: string
  }>
}

export interface OutlineSectionReorderResponse {
  success: boolean
  message: string
  items: OutlineSection[]
  total: number
  updated_hierarchy?: OutlineSection[]
}

// 章节内容生成相关类型
export interface OutlineSectionContentGenerateRequest {
  section_id: number
  generation_options?: {
    tone?: string
    style?: string
    word_count_target?: number
    include_examples?: boolean
    research_depth?: 'basic' | 'detailed' | 'comprehensive'
  }
}

export interface OutlineSectionContentGenerateResponse {
  success: boolean
  message: string
  section_id: number
  generated_content: string
  word_count: number
  generation_info: {
    model_used: string
    tokens_used: number
    generation_time: number
  }
}

// 章节评估相关类型
export interface OutlineSectionEvaluationRequest {
  section_id: number
  evaluation_criteria?: Array<{
    aspect: string
    weight: number
  }>
}

export interface OutlineSectionEvaluationResponse {
  success: boolean
  message: string
  section_id: number
  evaluation: {
    overall_score: number
    criteria_scores: Array<{
      aspect: string
      score: number
      feedback: string
    }>
    suggestions: string[]
    strengths: string[]
    weaknesses: string[]
  }
  evaluated_at: string
}

// 章节导入导出相关类型
export interface OutlineSectionImportRequest {
  outline_id: number
  format: 'markdown' | 'json' | 'csv'
  data: string | object
  import_options?: {
    preserve_hierarchy?: boolean
    auto_order?: boolean
    merge_with_existing?: boolean
  }
}

export interface OutlineSectionImportResponse {
  success: boolean
  message: string
  imported_sections: OutlineSection[]
  total_imported: number
  failed_count: number
  errors?: Array<{
    line_number?: number
    error: string
  }>
}

export interface OutlineSectionExportRequest {
  outline_id: number
  format: 'markdown' | 'json' | 'csv' | 'pdf'
  export_options?: {
    include_content_direction?: boolean
    include_hierarchy?: boolean
    flatten_hierarchy?: boolean
    custom_fields?: string[]
  }
}

export interface OutlineSectionExportResponse {
  success: boolean
  message: string
  download_url?: string
  file_name?: string
  file_format: string
  exported_at: string
  section_count: number
}

// 章节模板相关类型
export interface OutlineSectionTemplate {
  id: number
  name: string
  description?: string
  category: string
  structure: Array<{
    title_template: string
    content_direction_template?: string
    level: number
    word_count_target?: number
  }>
  created_by: string
  created_at: string
  usage_count: number
}

export interface OutlineSectionTemplateListResponse {
  success: boolean
  message: string
  templates: OutlineSectionTemplate[]
  total: number
}

export interface OutlineSectionTemplateCreateRequest {
  name: string
  description?: string
  category: string
  structure: Array<{
    title_template: string
    content_direction_template?: string
    level: number
    word_count_target?: number
  }>
}

// 章节查询参数
export interface OutlineSectionQueryParams {
  outline_id?: number
  parent_section_id?: number
  level?: number
  skip?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include_subsections?: boolean
}

// 服务类类型
export interface OutlineSectionServiceType {
  getSectionsByOutline(outlineId: number, options?: any): Promise<OutlineSectionListResponse>
  getSectionById(sectionId: number, options?: any): Promise<OutlineSectionDetailResponse>
  createSection(
    outlineId: number,
    request: OutlineSectionCreateRequest,
    options?: any
  ): Promise<OutlineSectionCreateResponse>
  updateSection(
    sectionId: number,
    request: OutlineSectionUpdateRequest,
    options?: any
  ): Promise<OutlineSectionUpdateResponse>
  deleteSection(sectionId: number, options?: any): Promise<OutlineSectionDeleteResponse>
  batchCreateSections(
    outlineId: number,
    request: OutlineSectionBatchCreateRequest,
    options?: any
  ): Promise<OutlineSectionBatchCreateResponse>
  reorderSections(
    request: OutlineSectionReorderRequest,
    options?: any
  ): Promise<OutlineSectionReorderResponse>
  getSubsections(parentSectionId: number, options?: any): Promise<OutlineSectionListResponse>
  generateSectionContent(
    request: OutlineSectionContentGenerateRequest,
    options?: any
  ): Promise<OutlineSectionContentGenerateResponse>
  evaluateSection(
    request: OutlineSectionEvaluationRequest,
    options?: any
  ): Promise<OutlineSectionEvaluationResponse>
  importSections(
    request: OutlineSectionImportRequest,
    options?: any
  ): Promise<OutlineSectionImportResponse>
  exportSections(
    request: OutlineSectionExportRequest,
    options?: any
  ): Promise<OutlineSectionExportResponse>
  getSectionTemplates(options?: any): Promise<OutlineSectionTemplateListResponse>
  createSectionTemplate(
    request: OutlineSectionTemplateCreateRequest,
    options?: any
  ): Promise<OutlineSectionTemplate>
  applyTemplate(
    outlineId: number,
    templateId: number,
    options?: any
  ): Promise<OutlineSectionBatchCreateResponse>
}
