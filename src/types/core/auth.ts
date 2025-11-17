/**
 * 认证服务相关类型定义
 * 基于OpenAPI规范的认证API类型
 */

// 基础认证响应类型
export interface BaseAuthResponse {
  success: boolean
  message: string
}

// 用户注册相关类型
export interface PendingRegistrationResponse extends BaseAuthResponse {
  data: {
    id: string
    username: string
    email: string
    is_active: boolean
    is_verified: boolean
    created_at: string
    updated_at: string
    avatar: string | null
    roles: string[]
  }
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 用户登录相关类型
export interface AuthResponse extends BaseAuthResponse {
  token: string
  refresh_token?: string
  expires_in?: number
  user: {
    id: string
    username: string
    email: string
    is_active: boolean
    is_verified: boolean
    created_at: string
    updated_at: string
    avatar: string | null
    roles: string[]
  }
}

export interface LoginRequest {
  email: string
  password: string
  remember_me?: boolean
}

// Token刷新相关类型
export interface RefreshTokenResponse extends BaseAuthResponse {
  token: string
  refresh_token: string
  expires_in: number
}

// 密码重置相关类型
export interface ForgotPasswordResponse extends BaseAuthResponse {
  reset_token?: string
  expires_at?: string
}

export interface ForgotPasswordRequest {
  email: string
}

// 邮箱验证相关类型
export interface VerificationResponse extends BaseAuthResponse {
  verified: boolean
  user_id?: string
}

// 账户设置相关类型
export interface AccountSettingsResponse extends BaseAuthResponse {
  data: UserAccount
}

export interface UserAccount {
  id: string
  username: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  avatar: string | null
  roles: string[]
}

export type UpdateAccountRequest = Partial<UserAccount>

// 用户偏好设置相关类型
export interface UserPreferenceResponse extends BaseAuthResponse {
  data: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    in_app: boolean
  }
  privacy: {
    profile_visibility: 'public' | 'private'
    activity_visibility: boolean
  }
}

export type UpdateUserPreferenceRequest = Partial<UserPreferences>

export interface DefaultPreferencesResponse extends BaseAuthResponse {
  data: UserPreferences
}

// 系统管理相关类型
export interface CleanupResponse extends BaseAuthResponse {
  cleaned_tokens: number
  cleaned_sessions: number
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  checks?: {
    database: string
    redis: string
    storage: string
  }
}

export interface MetricsResponse {
  active_users: number
  total_requests: number
  error_rate: number
  response_time: {
    avg: number
    p95: number
    p99: number
  }
  timestamp: string
}

// Token验证相关类型
export interface TokenValidationResult {
  valid: boolean
  userType: 'real' | 'mock'
}

// 服务类类型 - 导入 any 从服务层
export interface AuthServiceType {
  register(params: RegisterRequest, options?: any): Promise<PendingRegistrationResponse>
  login(params: LoginRequest, options?: any): Promise<AuthResponse>
  refreshToken(refreshToken: string, options?: any): Promise<RefreshTokenResponse>
  logout(options?: any): Promise<AuthResponse>
  forgotPassword(params: ForgotPasswordRequest, options?: any): Promise<ForgotPasswordResponse>
  verifyEmail(token: string, options?: any): Promise<VerificationResponse>
  getAccount(options?: any): Promise<AccountSettingsResponse>
  updateAccount(data: Partial<UserAccount>, options?: any): Promise<AccountSettingsResponse>
  deleteAccount(params: { password: string; confirm: boolean }, options?: any): Promise<null>
  cleanupExpiredTokens(options?: any): Promise<CleanupResponse>
  healthCheck(options?: any): Promise<HealthCheckResponse>
  detailedHealthCheck(options?: any): Promise<HealthCheckResponse>
  readinessCheck(options?: any): Promise<HealthCheckResponse>
  livenessCheck(options?: any): Promise<HealthCheckResponse>
  getMetrics(options?: any): Promise<MetricsResponse>
  getUserPreferences(options?: any): Promise<UserPreferenceResponse>
  updateUserPreferences(
    data: Partial<UpdateUserPreferenceRequest>,
    options?: any
  ): Promise<UserPreferenceResponse>
  getDefaultPreferences(options?: any): Promise<DefaultPreferencesResponse>
  validateToken(token: string): Promise<TokenValidationResult>
}
