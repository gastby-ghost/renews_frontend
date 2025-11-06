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

// 项目相关类型
export interface ProjectCreate {
  name: string
  status?: 'draft' | 'in_progress' | 'completed' | 'archived'
  current_component?: string
}

export interface ProjectResponse {
  id: number
  name: string
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  current_component: string
  created_at: string
  updated_at: string
  user_id: number
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
