// ============= Search Tools 相关类型定义 =============

export interface SearchToolsExecuteRequest {
  provider: 'tavily' | 'bocha'
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
}

export interface SearchToolsExecuteResponse {
  success: boolean
  task_id: string
  message: string
  user_id: string
  project_id: string
  provider: string
  query_preview: string
  is_default_project?: boolean
}

export interface SearchToolsTaskStatusResponse {
  task_id: string
  status: string
  progress: number
  result?: any
  error?: string | null
  user_id: string
  project_id: string
  provider?: string | null
  query?: string | null
  created_at: number
  updated_at: number
  is_default_project?: boolean
}

export interface SearchToolsStateResponse {
  task_id: string
  status: string
  progress: number
  query?: string | null
  config?: any
  created_at: number
  updated_at: number
  result_available: boolean
  error?: string | null
}

export interface SearchToolsStatusResponse {
  tavily_configured: boolean
  bocha_configured: boolean
  tavily_api_key_status: string
  bocha_api_key_status: string
  default_provider: string
  available_providers: string[]
}

export interface SearchToolsTaskListResponse {
  tasks: SearchToolsTaskStatusResponse[]
  total_count: number
  user_id: string
  project_id?: string | null
}
