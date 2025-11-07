/**
 * API类型定义模块
 * 基于OpenAPI规范的TypeScript类型定义
 */

// 基础响应类型
export interface BaseResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 认证相关类型
export interface UserRegisterRequest {
  username: string
  email: string
  password: string
}

export interface UserLoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string | null
  refresh_token?: string | null
  expires_in?: number | null
  user?: UserResponse | null
  redirect_url?: string | null
}

export interface UserResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  roles?: string[]
  avatar?: string
}

export interface PendingRegistrationResponse {
  success: boolean
  message: string
  token: string
  email: string
  username: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface VerificationResponse {
  success: boolean
  message: string
  verification_type?: string | null
  user_id?: number | null
  redirect_url?: string | null
}

export interface DeleteAccountRequest {
  password: string
  confirm: boolean
}

export interface AccountSettingsResponse {
  success: boolean
  data: UserResponse
  third_party_accounts: any[]
}

export interface HealthCheckResponse {
  status: string
  timestamp: string
  service?: string
  version?: string
  uptime?: number
  checks?: Record<string, any>
}

export interface MetricsResponse {
  total_requests: number
  successful_requests: number
  failed_requests: number
  average_response_time: number
  error_rate: number
  last_updated: string
  by_service?: Record<
    string,
    {
      requests: number
      errors: number
      avg_response_time: number
    }
  >
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface CleanupResponse {
  success: boolean
  message: string
  cleaned_count?: number
}

export interface RefreshTokenResponse {
  success: boolean
  message: string
  token: string
  refresh_token: string
  expires_in: number
}

export interface UserPreference {
  theme?: string
  language?: string
  timezone?: string
  notifications?: {
    email?: boolean
    push?: boolean
    in_app?: boolean
    marketing?: boolean
  }
  privacy?: {
    profile_visibility?: string
    activity_visibility?: string
    search_visibility?: boolean
  }
  ui?: {
    page_size?: number
    compact_mode?: boolean
    show_tutorials?: boolean
    auto_save?: boolean
  }
  editor?: {
    font_size?: number
    line_height?: number
    word_wrap?: boolean
    show_line_numbers?: boolean
  }
}

export interface UpdateUserPreferenceRequest {
  theme?: string
  language?: string
  timezone?: string
  notifications?: {
    email?: boolean
    push?: boolean
    in_app?: boolean
    marketing?: boolean
  }
  privacy?: {
    profile_visibility?: string
    activity_visibility?: string
    search_visibility?: boolean
  }
  ui?: {
    page_size?: number
    compact_mode?: boolean
    show_tutorials?: boolean
    auto_save?: boolean
  }
  editor?: {
    font_size?: number
    line_height?: number
    word_wrap?: boolean
    show_line_numbers?: boolean
  }
}

export interface UserPreferenceResponse {
  success: boolean
  message: string
  data: UserPreference
}

export interface DefaultPreferencesResponse {
  success: boolean
  message: string
  data: UserPreference
}

// 用户偏好类型
export interface PreferencesUserPreference {
  user_id: string
  theme?: 'light' | 'dark' | 'auto'
  font_size?: 'small' | 'medium' | 'large'
  auto_save_frequency?: '1' | '3' | '5' | '10' | '15' | '30'
  language?: string
  timezone?: string
  notifications_enabled?: boolean
  sound_enabled?: boolean
  compact_mode?: boolean
  show_tooltips?: boolean
  auto_complete?: boolean
  spell_check?: boolean
  custom_settings?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface PreferencesUpdateUserPreferenceRequest {
  theme?: 'light' | 'dark' | 'auto' | null
  font_size?: 'small' | 'medium' | 'large' | null
  auto_save_frequency?: '1' | '3' | '5' | '10' | '15' | '30' | null
  language?: string | null
  timezone?: string | null
  notifications_enabled?: boolean | null
  sound_enabled?: boolean | null
  compact_mode?: boolean | null
  show_tooltips?: boolean | null
  auto_complete?: boolean | null
  spell_check?: boolean | null
  custom_settings?: Record<string, any> | null
}

export interface PreferencesUserPreferenceResponse {
  theme?: string
  font_size?: string
  auto_save_interval?: number
  shortcut_settings?: Record<string, any> | null
  user_id: number
  created_at: string
  updated_at?: string | null
}

export interface PreferencesDefaultPreferencesResponse {
  theme: string
  font_size: string
  auto_save_interval: number
  shortcut_settings: Record<string, any>
}

// 项目相关类型 - 基于新的 OpenAPI 3.1.0 规范
export interface ProjectCreate {
  name: string
  status?: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED'
  current_component?: 'topic-selection' | 'outline' | 'content'
  folder_id?: number | null
}

export interface ProjectUpdate {
  name?: string | null
  status?: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED' | null
  current_component?: 'topic-selection' | 'outline' | 'content' | null
  folder_id?: number | null
}

export interface ProjectResponse {
  id: number
  user_id: number
  name: string
  status: 'TITLE_GENERATION' | 'OUTLINE_GENERATION' | 'BODY_GENERATION' | 'COMPLETED'
  current_component: 'topic-selection' | 'outline' | 'content'
  folder_id?: number | null
  last_modified: string
  created_at: string
  updated_at: string
}

export interface ProjectDetailResponse {
  success: boolean
  message: string
  project: ProjectResponse
}

export interface ProjectListResponse {
  success: boolean
  message: string
  projects: ProjectResponse[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

export interface ProjectDeleteRequest {
  project_ids: number[]
}

export interface ProjectDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details: Array<Record<string, any>>
}

export interface ProjectStatisticsResponse {
  success: boolean
  message: string
  data: Record<string, number>
}

// 素材相关类型
export interface MaterialResponse {
  id: number
  title: string
  content: string
  type: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MaterialListResponse {
  items: MaterialResponse[]
  total: number
  page: number
  per_page: number
}

export interface TagResponse {
  name: string
  count: number
}

// AI 相关类型
export interface AiSearchToolsResponse {
  results: Array<{
    url: string
    score: number
    query: string
  }>
}

export interface AiSearchAgentResponse {
  task_id: string
  status: string
}

export interface AiTitleGenerationResponse {
  titles: Array<{
    title: string
    angle: string
  }>
  generation_summary: string
  success: boolean
}

export interface AiOutlineGenerationResponse {
  outline: Array<{
    id: string
    title: string
    level: number
  }>
  success: boolean
}

// ============= 核心服务 - 研究简报模块 =============

export interface ResearchBriefCreate {
  content: string
  metadata?: Record<string, any>
}

export interface ResearchBriefUpdate {
  content?: string
  metadata?: Record<string, any>
}

export interface ResearchBrief {
  id: number
  project_id: number
  user_id: number
  content: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ResearchBriefCreateResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefListResponse {
  success: boolean
  message: string
  data: ResearchBrief[]
  total_count: number
}

export interface ResearchBriefDetailResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefUpdateResponse {
  success: boolean
  message: string
  data: ResearchBrief
}

export interface ResearchBriefDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
}

// ============= 核心服务 - 标题模块 =============

// 标题候选相关类型
export interface TitleCandidateCreate {
  content: string
  metadata?: Record<string, any>
}

export interface TitleCandidateUpdate {
  content?: string
  metadata?: Record<string, any>
}

export interface TitleCandidateCreateBulk {
  candidates: TitleCandidateCreate[]
}

export interface TitleCandidateSelect {
  reason?: string
}

export interface TitleCandidate {
  id: number
  project_id: number
  user_id: number
  content: string
  status: 'generated' | 'selected' | 'rejected'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TitleCandidateCreateResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateListResponse {
  success: boolean
  message: string
  data: TitleCandidate[]
  total_count: number
}

export interface TitleCandidateDetailResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateUpdateResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

export interface TitleCandidateDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
}

export interface TitleCandidateSelectResponse {
  success: boolean
  message: string
  data: TitleCandidate
}

// 标题版本相关类型
export interface TitleCreate {
  content: string
  version?: number
}

export interface TitleUpdate {
  content?: string
}

export interface TitleActivateRequest {
  reason?: string
}

export interface TitleDeactivateRequest {
  reason?: string
}

export interface Title {
  id: number
  project_id: number
  user_id: number
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TitleCreateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleDetailResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleHistoryResponse {
  success: boolean
  message: string
  data: Title[]
  total_count: number
}

export interface TitleUpdateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleActivateResponse {
  success: boolean
  message: string
  data: Title
}

export interface TitleDeactivateResponse {
  success: boolean
  message: string
  data: Title
}

// ============= 验证错误类型 =============

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}
