/**
 * 认证相关类型定义
 * Authentication Types
 */

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

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface RefreshTokenResponse {
  success: boolean
  message: string
  token: string
  refresh_token: string
  expires_in: number
}

// Re-export UserResponse for convenience
export type { UserResponse } from '../user'
