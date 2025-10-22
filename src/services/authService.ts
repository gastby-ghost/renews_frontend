/**
 * 用户认证服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'

class AuthService extends BaseApiService {
  constructor() {
    super('auth')
  }

  /**
   * 用户注册
   */
  async register(
    params: {
      username: string
      email: string
      password: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post<Api.Auth.PendingRegistrationResponse>('/register', params, options)
  }

  /**
   * 用户登录
   */
  async login(
    params: {
      email: string
      password: string
      remember_me?: boolean
    },
    options?: ApiRequestConfig
  ) {
    return this.post<Api.Auth.AuthResponse>('/login', params, options)
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string, options?: ApiRequestConfig) {
    return this.post<Api.Auth.RefreshTokenResponse>(
      '/refresh-token',
      {
        refresh_token: refreshToken
      },
      options
    )
  }

  /**
   * 用户登出
   */
  async logout(options?: ApiRequestConfig) {
    return this.post<Api.Auth.AuthResponse>('/logout', undefined, options)
  }

  /**
   * 忘记密码
   */
  async forgotPassword(
    params: {
      email: string
    },
    options?: ApiRequestConfig
  ) {
    return this.post<Api.Auth.ForgotPasswordResponse>('/forgot-password', params, options)
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string, options?: ApiRequestConfig) {
    return this.get<Api.Auth.VerificationResponse>(`/verify/${token}`, undefined, options)
  }

  /**
   * 获取账户信息
   */
  async getAccount(options?: ApiRequestConfig) {
    return this.get<Api.Auth.AccountSettingsResponse>('/account', undefined, options)
  }

  /**
   * 更新账户信息
   */
  async updateAccount(data: Partial<Api.Auth.UserResponse>, options?: ApiRequestConfig) {
    return this.put<Api.Auth.AccountSettingsResponse>('/account', data, options)
  }

  /**
   * 删除账户
   */
  async deleteAccount(
    params: {
      password: string
      confirm: boolean
    },
    options?: ApiRequestConfig
  ) {
    return this.delete<null>('/account', params, options)
  }

  /**
   * 清理过期令牌
   */
  async cleanupExpiredTokens(options?: ApiRequestConfig) {
    return this.delete<Api.Auth.AuthResponse>('/cleanup-expired-tokens', undefined, options)
  }

  /**
   * Mock实现
   */
  protected async mockImplementation(): Promise<any> {
    throw new Error(`Mock实现未定义: ${this.serviceName}`)
  }
}

// 创建单例实例
export const authService = new AuthService()

export default authService
