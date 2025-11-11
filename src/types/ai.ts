/**
 * AI服务相关类型定义
 * 基于ai_openapi.json自动生成
 */

// 基础响应类型
export interface BaseAIResponse {
  success: boolean
  message?: string
  error?: string | null
}

// 任务响应基础类型
export interface TaskResponse extends BaseAIResponse {
  task_id: string
}

// 网页总结相关类型
export interface WebpageSummaryAsyncRequest {
  url: string
  model_name?: string
  max_tokens?: number
  scraping_timeout?: number
  max_content_length?: number
  target_format?: Record<string, any>
}

export interface WebpageSummaryAsyncResponse extends TaskResponse {
  url: string
}

export interface WebpageSummaryStatusResponse extends BaseAIResponse {
  task_id: string
  status: string
  progress: number
  result?: {
    summary: string
    key_excerpts: string[]
    word_count: number
    reading_time: number
    topics: string[]
  } | null
}

// Scope Agent相关类型
export interface ScopeAgentRequest {
  query: string
}

export interface ScopeAgentResponse extends TaskResponse {
  user_id: string
  project_id: string
  agent_type: string
}

export interface ScopeAgentStatusResponse {
  task_id: string
  status: string
  progress: number
  result?: Record<string, any> | null
  error?: string | null
  user_id: string
  project_id: string
  agent_type: string
  created_at: number
  updated_at: number
}

export interface ScopeAgentListResponse {
  tasks: ScopeAgentStatusResponse[]
  total_count: number
  user_id: string
  project_id?: string | null
}

// Search Agent相关类型
export interface SearchAgentRequest {
  brief: string
  max_concurrent_research_units?: number | null
  max_researcher_iterations?: number | null
}

export interface SearchAgentResponse extends TaskResponse {
  user_id: string
  project_id: string
  agent_type: string
  is_default_project?: boolean
}

export interface SearchAgentStatusResponse {
  task_id: string
  status: string
  progress: number
  result?: Record<string, any> | null
  error?: string | null
  user_id: string
  project_id: string
  agent_type: string
  created_at: number
  updated_at: number
  is_default_project?: boolean
}

export interface SearchAgentListResponse {
  tasks: SearchAgentStatusResponse[]
  total_count: number
  user_id: string
  project_id?: string | null
}

// Search2Title Agent相关类型
export interface Search2TitleAgentRequest {
  brief: string
  max_concurrent_research_units?: number | null
  max_researcher_iterations?: number | null
}

export interface Search2TitleAgentResponse extends TaskResponse {
  user_id: string
  project_id: string
  agent_type: string
  is_default_project?: boolean
}

export interface Search2TitleAgentStatusResponse {
  task_id: string
  status: string
  progress: number
  result?: Record<string, any> | null
  error?: string | null
  user_id: string
  project_id: string
  agent_type: string
  created_at: number
  updated_at: number
  is_default_project?: boolean
  research_data?: Record<string, any> | null
  title_data?: Record<string, any> | null
  current_phase?: 'research' | 'title_generation' | null
}

export interface Search2TitleAgentListResponse {
  tasks: Search2TitleAgentStatusResponse[]
  total_count: number
  user_id: string
  project_id?: string | null
}

// 搜索工具相关类型
export interface SearchResultItem {
  url: string
  score: number
  query: string
  aititle?: string | null
  summary?: string | null
  tags: string[]
  key_excerpts: string[]
  published_date?: string | null
}

export interface UnifiedSearchRequest {
  queries: string[]
  max_results?: number
  enable_structured_summaries?: boolean
  summarization_model?: string | null
  max_content_length?: number
  topic?: 'general' | 'news' | 'finance' | null
  include_raw_content?: boolean | null
  freshness?: string | null
  summary?: boolean | null
  include?: string | null
  exclude?: string | null
  provider: 'tavily' | 'bocha'
}

export interface SearchToolsResponse extends BaseAIResponse {
  provider: string
  results: SearchResultItem[]
  total_results: number
  search_queries: string[]
  search_time: number
  api_execution_time: number
  query_count: number
}

export interface SearchToolsStatusResponse {
  tavily_configured: boolean
  bocha_configured: boolean
  tavily_api_key_status: string
  bocha_api_key_status: string
  default_provider: string
  available_providers: string[]
}

// 需求定义相关类型
export interface RequirementsForm {
  topic: string
  targetAudience: string
  documentType: string
  wordCount: number
  tone: string
  keyPoints: string[]
  specialRequirements: string
}

// 标题生成相关类型
export interface Title {
  title: string
  angle: string
  why_now: string
  news_values: string[]
  verifiability: string
  sources: string[]
  risk_notes: string
  feasibility: string
}

export interface TitleGenerationRequest {
  research_brief: string
  web_search_data: SearchResultItem[] | string[]
}

export interface TitleGenerationResponse extends BaseAIResponse {
  titles: Title[]
  title_sources_details: Record<string, any[]>
  generation_time: number
  title_count: number
  generation_summary: string
  total_candidates: number
  final_report: string
}

export interface TitleToolsStatusResponse {
  configured: boolean
  available_models: string[]
  default_model: string
}

// 大纲生成相关类型
export interface OutlineSection {
  level: number
  title: string
  content_direction: string
  data_requirements: string[]
  estimated_word_count?: number | null
  priority: 'high' | 'medium' | 'low'
  sources: string[]
}

export interface OutlineGenerationRequest {
  title: Title
  research_brief: string
  web_search_data: SearchResultItem[] | string[]
}

export interface OutlineGenerationResponse extends BaseAIResponse {
  outline: OutlineSection[]
  outline_sources_details: Record<string, any[]>
  generation_time: number
  section_count: number
  generation_summary: string
  total_word_estimate?: number | null
  final_report: string
}

export interface OutlineGenerationStatusResponse {
  configured: boolean
  available_models: string[]
  default_model: string
}

// 任务取消相关类型
export interface TaskCancelRequest {
  task_id: string
  terminate?: boolean
  signal?: string | null
}

// 验证错误类型
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

// 通用任务状态类型
export interface TaskStatus {
  task_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result?: any
  error?: string
  created_at: number
  updated_at: number
}

// 提供商信息类型
export interface ProviderInfo {
  name: string
  description: string
  capabilities: string[]
  status: 'active' | 'inactive' | 'error'
}

export interface ProvidersResponse {
  [providerName: string]: ProviderInfo
}

// ============= 素材绑定相关类型 =============

/**
 * 素材绑定请求 - 大纲章节
 */
export interface MaterialBindOutlineSection {
  id: number
  outline_id: number
  section_title: string
  content_direction: string
  data_requirements: string[]
  sources: string[]
  section_order: number
  estimated_words: number
}

/**
 * 素材绑定请求 - 素材详情
 */
export interface MaterialBindMaterial {
  id: number
  title: string
  summary: string
  content: string
  score: number
  key_excerpts: string[]
  published_date: string
  source_url: string
  source_type: string
  author: string
}

/**
 * 素材绑定请求
 */
export interface MaterialBindRequest {
  user_id: string
  project_id: string
  title: string
  outline_sections: MaterialBindOutlineSection[]
  materials: MaterialBindMaterial[]
}

/**
 * 素材绑定响应 - 绑定的素材详情
 */
export interface MaterialBindBoundMaterial {
  id: number
  title: string
  summary: string
  score: number
  published_date: string
  url: string
  relevance_explanation: string
}

/**
 * 素材绑定响应 - 章节绑定结果
 */
export interface MaterialBindSectionBinding {
  section_id: number
  section_title: string
  materials: MaterialBindBoundMaterial[]
  binding_type: string
  binding_reason: string
  match_scores: number[]
  material_usage_justification: string
  section_level: number
}

/**
 * 素材绑定结果详情
 */
export interface MaterialBindResult {
  title: string
  material_section_bindings: MaterialBindSectionBinding[]
  binding_summary: string
  final_report: string
  total_sections: number
  total_materials_bound: number
}

/**
 * 素材绑定任务状态响应
 */
export interface MaterialBindStatusResponse extends BaseAIResponse {
  task_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: MaterialBindResult | null
  error: string | null
  created_at: string
  updated_at: string
}

/**
 * 素材绑定任务创建响应
 */
export interface MaterialBindExecuteResponse extends BaseAIResponse {
  task_id?: string
}
