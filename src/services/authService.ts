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
    // 检查当前是否使用Mock模式
    if (this.isMockMode()) {
      // Mock模式下直接返回模拟的用户信息
      return {
        success: true,
        data: {
          id: 'mock-user-id',
          username: 'mockuser',
          email: 'mock@example.com',
          is_active: true,
          is_verified: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          avatar: null,
          roles: ['user']
        }
      }
    }

    // 真实API模式下的正常请求
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
   * 验证token是否有效
   * @param token 要验证的token
   * @returns 返回验证结果和用户类型
   */
  async validateToken(token: string): Promise<{ valid: boolean; userType: 'real' | 'mock' }> {
    // 如果是mock token，检查格式并验证基本有效性
    if (token.startsWith('mock-')) {
      // 简单的格式验证：mock-时间戳-随机字符串
      const parts = token.split('-')
      if (parts.length >= 3 && parts[0] === 'mock' && parts[1].length > 0) {
        // 检查时间戳是否在合理范围内（不超过24小时）
        const timestamp = parseInt(parts[1])
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24小时

        if (!isNaN(timestamp) && now - timestamp < maxAge) {
          return { valid: true, userType: 'mock' }
        }
      }
      return { valid: false, userType: 'mock' }
    }

    try {
      // 尝试调用账户信息接口验证token
      await this.getAccount()
      return { valid: true, userType: 'real' }
    } catch {
      return { valid: false, userType: 'real' }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async mockImplementation(_config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 生成可识别的Mock token，包含mock标识
    const mockToken = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const mockRefreshToken = `mock-refresh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // 返回模拟数据
    return {
      success: true,
      message: 'Mock登录成功',
      token: mockToken,
      refresh_token: mockRefreshToken,
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        username: 'mockuser',
        email: 'mock@example.com',
        is_active: true,
        is_verified: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-12-31T23:59:59Z',
        avatar: null,
        roles: ['user']
      }
    }
  }
}

// 创建单例实例
export const authService = new AuthService()

export default authService
