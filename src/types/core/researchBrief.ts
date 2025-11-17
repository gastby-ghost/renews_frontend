/**
 * 研究简报服务相关类型定义
 * 基于OpenAPI规范的研究简报API类型
 */

// 研究简报状态和类型
export type ResearchBriefStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'archived'
export type ResearchBriefType =
  | 'market_analysis'
  | 'competitive_analysis'
  | 'trend_analysis'
  | 'user_research'
  | 'technical_research'
  | 'other'

// 基础研究简报类型
export interface ResearchBrief {
  id: number
  project_id: number
  title: string
  content: string
  summary?: string
  type: ResearchBriefType
  status: ResearchBriefStatus
  methodology?: string
  data_sources?: string[]
  key_findings?: string[]
  recommendations?: string[]
  limitations?: string
  estimated_impact?: 'low' | 'medium' | 'high'
  confidence_level?: number
  researcher_id?: string
  reviewer_id?: string
  tags: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  reviewed_at?: string
  metadata?: Record<string, any>
}

// 请求类型
export interface ResearchBriefCreateRequest {
  project_id: number
  title: string
  content: string
  summary?: string
  type: ResearchBriefType
  methodology?: string
  data_sources?: string[]
  tags?: string[]
  estimated_impact?: 'low' | 'medium' | 'high'
  confidence_level?: number
  metadata?: Record<string, any>
}

export interface ResearchBriefUpdateRequest extends Partial<ResearchBriefCreateRequest> {
  key_findings?: string[]
  recommendations?: string[]
  limitations?: string
  status?: ResearchBriefStatus
  researcher_id?: string
  reviewer_id?: string
}

export interface ResearchBriefStatusUpdateRequest {
  status: ResearchBriefStatus
  notes?: string
  reviewer_id?: string
}

export interface ResearchBriefReviewRequest {
  approved: boolean
  review_notes?: string
  recommendations?: string[]
  confidence_level?: number
}

export interface ResearchBriefGenerateRequest {
  project_id: number
  research_topic: string
  research_objectives: string[]
  research_type: ResearchBriefType
  data_sources?: string[]
  scope?: {
    industries?: string[]
    time_period?: {
      start: string
      end: string
    }
    geographic_regions?: string[]
    target_audience?: string[]
  }
  generation_options?: {
    depth?: 'quick' | 'standard' | 'comprehensive'
    include_recommendations?: boolean
    include_visualizations?: boolean
    max_length?: number
  }
}

// 响应类型
export interface ResearchBriefDetailResponse {
  success: boolean
  message: string
  brief: ResearchBrief
  related_briefs?: ResearchBrief[]
  attachments?: ResearchBriefAttachment[]
  citations?: ResearchBriefCitation[]
}

export interface ResearchBriefListResponse {
  success: boolean
  message: string
  briefs: ResearchBrief[]
  total: number
  pagination: {
    page: number
    page_size: number
    total_pages: number
  }
  filters_applied?: Record<string, any>
}

export type ResearchBriefCreateResponse = ResearchBriefDetailResponse
export type ResearchBriefUpdateResponse = ResearchBriefDetailResponse
export interface ResearchBriefDeleteResponse {
  success: boolean
  message: string
  brief_id: number
  deleted_at: string
  cascaded_deletes?: number[]
}

export interface ResearchBriefGenerateResponse {
  success: boolean
  message: string
  brief: ResearchBrief
  generation_info: {
    model_used: string
    data_sources_analyzed: number
    tokens_used: number
    generation_time: number
    confidence_score: number
  }
  processing_steps?: string[]
}

// 附件类型
export interface ResearchBriefAttachment {
  id: number
  brief_id: number
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
  description?: string
  category: 'data' | 'image' | 'document' | 'reference' | 'other'
}

export interface ResearchBriefAttachmentUploadRequest {
  brief_id: number
  file: File
  description?: string
  category: 'data' | 'image' | 'document' | 'reference' | 'other'
}

export interface ResearchBriefAttachmentResponse {
  success: boolean
  message: string
  attachment: ResearchBriefAttachment
}

// 引用类型
export interface ResearchBriefCitation {
  id: number
  brief_id: number
  title: string
  authors: string[]
  publication?: string
  publication_date?: string
  url?: string
  doi?: string
  citation_type: 'academic' | 'web' | 'book' | 'report' | 'other'
  relevance_score?: number
  notes?: string
  created_at: string
}

export interface ResearchBriefCitationCreateRequest {
  brief_id: number
  title: string
  authors: string[]
  publication?: string
  publication_date?: string
  url?: string
  doi?: string
  citation_type: 'academic' | 'web' | 'book' | 'report' | 'other'
  relevance_score?: number
  notes?: string
}

export interface ResearchBriefCitationResponse {
  success: boolean
  message: string
  citation: ResearchBriefCitation
}

// 研究简报分析类型
export interface ResearchBriefAnalysisRequest {
  brief_id: number
  analysis_types: (
    | 'sentiment'
    | 'key_topics'
    | 'data_quality'
    | 'recommendation_strength'
    | 'impact_assessment'
  )[]
}

export interface ResearchBriefAnalysisResponse {
  success: boolean
  message: string
  brief_id: number
  analysis: {
    sentiment?: {
      overall_sentiment: 'positive' | 'neutral' | 'negative'
      sentiment_score: number
      confidence: number
    }
    key_topics?: {
      topics: Array<{
        topic: string
        relevance: number
        mentions: number
      }>
      topic_clusters: Array<{
        cluster_name: string
        topics: string[]
        weight: number
      }>
    }
    data_quality?: {
      completeness_score: number
      reliability_score: number
      recency_score: number
      data_sources_variety: number
    }
    recommendation_strength?: {
      overall_strength: number
      evidence_based: number
      feasibility: number
      impact_potential: number
    }
    impact_assessment?: {
      business_impact: number
      technical_impact: number
      user_impact: number
      risk_level: 'low' | 'medium' | 'high'
    }
  }
  analyzed_at: string
}

// 研究简报模板类型
export interface ResearchBriefTemplate {
  id: number
  name: string
  description?: string
  category: ResearchBriefType
  template_data: {
    structure: {
      sections: Array<{
        title: string
        content_template?: string
        required: boolean
        order: number
      }>
    }
    default_data_sources?: string[]
    suggested_methodologies?: string[]
    evaluation_criteria?: string[]
  }
  created_by: string
  created_at: string
  usage_count: number
}

export interface ResearchBriefTemplateCreateRequest {
  name: string
  description?: string
  category: ResearchBriefType
  template_data: {
    structure: {
      sections: Array<{
        title: string
        content_template?: string
        required: boolean
        order: number
      }>
    }
    default_data_sources?: string[]
    suggested_methodologies?: string[]
    evaluation_criteria?: string[]
  }
}

// 查询参数
export interface ResearchBriefQueryParams {
  project_id?: number
  status?: ResearchBriefStatus | ResearchBriefStatus[]
  type?: ResearchBriefType | ResearchBriefType[]
  researcher_id?: string
  reviewer_id?: string
  tags?: string[]
  created_date_from?: string
  created_date_to?: string
  completed_date_from?: string
  completed_date_to?: string
  estimated_impact?: 'low' | 'medium' | 'high'
  confidence_level_min?: number
  confidence_level_max?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

// 服务类类型
export interface ResearchBriefServiceType {
  getProjectBriefs(
    projectId: number,
    params?: ResearchBriefQueryParams,
    options?: any
  ): Promise<ResearchBriefListResponse>
  getBriefById(briefId: number, options?: any): Promise<ResearchBriefDetailResponse>
  createBrief(
    request: ResearchBriefCreateRequest,
    options?: any
  ): Promise<ResearchBriefCreateResponse>
  updateBrief(
    briefId: number,
    request: ResearchBriefUpdateRequest,
    options?: any
  ): Promise<ResearchBriefUpdateResponse>
  deleteBrief(briefId: number, options?: any): Promise<ResearchBriefDeleteResponse>
  updateBriefStatus(
    briefId: number,
    request: ResearchBriefStatusUpdateRequest,
    options?: any
  ): Promise<ResearchBriefUpdateResponse>
  reviewBrief(
    briefId: number,
    request: ResearchBriefReviewRequest,
    options?: any
  ): Promise<ResearchBriefUpdateResponse>
  generateBrief(
    request: ResearchBriefGenerateRequest,
    options?: any
  ): Promise<ResearchBriefGenerateResponse>
  searchBriefs(params: ResearchBriefQueryParams, options?: any): Promise<ResearchBriefListResponse>
  getBriefAttachments(
    briefId: number,
    options?: any
  ): Promise<{ attachments: ResearchBriefAttachment[] }>
  uploadAttachment(
    request: ResearchBriefAttachmentUploadRequest,
    options?: any
  ): Promise<ResearchBriefAttachmentResponse>
  deleteAttachment(
    attachmentId: number,
    options?: any
  ): Promise<{ success: boolean; message: string }>
  getBriefCitations(briefId: number, options?: any): Promise<{ citations: ResearchBriefCitation[] }>
  addCitation(
    request: ResearchBriefCitationCreateRequest,
    options?: any
  ): Promise<ResearchBriefCitationResponse>
  updateCitation(
    citationId: number,
    request: Partial<ResearchBriefCitationCreateRequest>,
    options?: any
  ): Promise<ResearchBriefCitationResponse>
  deleteCitation(citationId: number, options?: any): Promise<{ success: boolean; message: string }>
  analyzeBrief(
    request: ResearchBriefAnalysisRequest,
    options?: any
  ): Promise<ResearchBriefAnalysisResponse>
  getBriefTemplates(options?: any): Promise<{ templates: ResearchBriefTemplate[] }>
  createBriefTemplate(
    request: ResearchBriefTemplateCreateRequest,
    options?: any
  ): Promise<ResearchBriefTemplate>
  applyTemplateToBrief(
    templateId: number,
    projectData: Partial<ResearchBriefCreateRequest>,
    options?: any
  ): Promise<ResearchBriefCreateResponse>
}
