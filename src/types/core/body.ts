/**
 * 内容管理服务相关类型定义
 * 基于OpenAPI规范的内容API类型
 */

// 基础内容状态类型
export type BodyStatus = 'draft' | 'active' | 'archived'

// 基础内容类型
export interface Body {
  id: number
  project_id: number
  title: string
  content: string
  status: BodyStatus
  version: number
  created_at: string
  updated_at: string
  activated_at?: string
  metadata?: Record<string, any>
}

// 请求类型
export interface BodyCreateRequest {
  project_id: number
  title?: string
  content?: string
  status?: BodyStatus
  metadata?: Record<string, any>
}

export interface BodyUpdateRequest {
  title?: string
  content?: string
  status?: BodyStatus
  metadata?: Record<string, any>
}

export interface BodyActivateRequest {
  reason?: string
}

export interface BodyDeactivateRequest {
  reason?: string
}

// 响应类型
export interface BodyDetailResponse {
  success: boolean
  message: string
  body: Body
}

export interface BodyListResponse {
  success: boolean
  message: string
  items: Body[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
}

export interface BodyHistoryResponse {
  success: boolean
  message: string
  items: Body[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
}

// 扩展响应类型
export type BodyCreateResponse = BodyDetailResponse
export type BodyUpdateResponse = BodyDetailResponse
export type BodyActivateResponse = BodyDetailResponse
export type BodyDeactivateResponse = BodyDetailResponse

export interface BodyActiveResponse {
  success: boolean
  message: string
  body: Body
}

// 文本统计相关类型
export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  paragraphs: number
  sentences: number
  readingTime: number
  headings: number
  headingsByLevel: Record<string, number>
  links: number
  images: number
  codeBlocks: number
  listItems: number
  avgSentenceLength: number
  avgParagraphLength: number
}

export interface TextStatsResponse {
  success: boolean
  message: string
  body_id: number
  stats: TextStats
  calculated_at: string
}

// 可读性分析相关类型
export interface ReadabilityScore {
  score: number
  level:
    | 'very_easy'
    | 'easy'
    | 'fairly_easy'
    | 'standard'
    | 'fairly_difficult'
    | 'difficult'
    | 'very_difficult'
  description: string
}

export interface ReadabilityAnalysisResponse {
  success: boolean
  message: string
  body_id: number
  readability: ReadabilityScore
  suggestions: string[]
  analyzed_at: string
}

// 内容查询参数
export interface BodyQueryParams {
  skip?: number
  limit?: number
  status?: BodyStatus
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 内容版本相关类型
export interface BodyVersion {
  id: number
  body_id: number
  version: number
  title: string
  content: string
  status: BodyStatus
  created_at: string
  created_by: string
  change_summary?: string
}

export interface BodyVersionListResponse {
  success: boolean
  message: string
  versions: BodyVersion[]
  total: number
}

// 内容比较相关类型
export interface BodyCompareRequest {
  from_version: number
  to_version: number
}

export interface BodyCompareResponse {
  success: boolean
  message: string
  comparison: {
    from_version: BodyVersion
    to_version: BodyVersion
    changes: {
      additions: string[]
      deletions: string[]
      modifications: Array<{
        type: string
        content: string
        position: number
      }>
    }
    summary: {
      total_changes: number
      characters_added: number
      characters_removed: number
    }
  }
}

// 内容导出相关类型
export interface BodyExportRequest {
  format: 'markdown' | 'html' | 'pdf' | 'docx'
  options?: {
    include_metadata?: boolean
    include_toc?: boolean
    custom_css?: string
  }
}

export interface BodyExportResponse {
  success: boolean
  message: string
  download_url?: string
  file_name?: string
  file_size?: number
  export_format: string
  exported_at: string
}

// 服务类类型
export interface BodyServiceType {
  getBodies(
    projectId: number,
    skip?: number,
    limit?: number,
    options?: any
  ): Promise<BodyHistoryResponse>
  getActiveBody(projectId: number, options?: any): Promise<BodyActiveResponse>
  getBodyHistory(
    projectId: number,
    skip?: number,
    limit?: number,
    options?: any
  ): Promise<BodyHistoryResponse>
  deleteBody(bodyId: number, options?: any): Promise<{ success: boolean; message: string }>
  createBody(request: BodyCreateRequest, options?: any): Promise<BodyCreateResponse>
  updateBody(bodyId: number, request: BodyUpdateRequest, options?: any): Promise<BodyUpdateResponse>
  activateBody(
    bodyId: number,
    request: BodyActivateRequest,
    options?: any
  ): Promise<BodyActivateResponse>
  deactivateBody(
    bodyId: number,
    request?: BodyDeactivateRequest,
    options?: any
  ): Promise<BodyDeactivateResponse>
  getTextStats(bodyId: number, options?: any): Promise<TextStatsResponse>
  getReadabilityAnalysis(bodyId: number, options?: any): Promise<ReadabilityAnalysisResponse>
  getBodyVersions(bodyId: number, options?: any): Promise<BodyVersionListResponse>
  compareBodyVersions(
    bodyId: number,
    request: BodyCompareRequest,
    options?: any
  ): Promise<BodyCompareResponse>
  exportBody(bodyId: number, request: BodyExportRequest, options?: any): Promise<BodyExportResponse>
}
