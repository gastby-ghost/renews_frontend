/**
 * 用户认证服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type {
  PendingRegistrationResponse,
  AuthResponse,
  RefreshTokenResponse,
  ForgotPasswordResponse,
  VerificationResponse,
  AccountSettingsResponse,
  UserResponse,
  CleanupResponse,
  HealthCheckResponse,
  MetricsResponse,
  UserPreferenceResponse,
  UpdateUserPreferenceRequest,
  DefaultPreferencesResponse
} from '@/types/api'
import { mockDataManager } from '@/mock'

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
    return this.post<PendingRegistrationResponse>('/api/v1/core/register', params, options)
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
    return this.post<AuthResponse>('/api/v1/core/login', params, options)
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string, options?: ApiRequestConfig) {
    return this.post<RefreshTokenResponse>('/api/v1/core/refresh-token', undefined, {
      params: { refresh_token: refreshToken },
      ...options
    })
  }

  /**
   * 用户登出
   */
  async logout(options?: ApiRequestConfig) {
    return this.post<AuthResponse>('/api/v1/core/logout', undefined, options)
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
    return this.post<ForgotPasswordResponse>('/api/v1/core/forgot-password', params, options)
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string, options?: ApiRequestConfig) {
    return this.get<VerificationResponse>(`/api/v1/core/verify/${token}`, undefined, options)
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
    return this.get<AccountSettingsResponse>('/api/v1/core/account', undefined, options)
  }

  /**
   * 更新账户信息
   */
  async updateAccount(data: Partial<UserResponse>, options?: ApiRequestConfig) {
    return this.put<AccountSettingsResponse>('/api/v1/core/account', data, options)
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
    return this.delete<null>('/api/v1/core/account', params, options)
  }

  /**
   * 清理过期令牌
   */
  async cleanupExpiredTokens(options?: ApiRequestConfig) {
    return this.post<CleanupResponse>('/api/v1/core/cleanup-expired-tokens', undefined, options)
  }

  /**
   * 基础健康检查
   */
  async healthCheck(options?: ApiRequestConfig) {
    return this.get<HealthCheckResponse>('/api/v1/core/health', undefined, options)
  }

  /**
   * 详细健康检查
   */
  async detailedHealthCheck(options?: ApiRequestConfig) {
    return this.get<HealthCheckResponse>('/api/v1/core/health/detailed', undefined, options)
  }

  /**
   * 就绪性检查
   */
  async readinessCheck(options?: ApiRequestConfig) {
    return this.get<HealthCheckResponse>('/api/v1/core/health/ready', undefined, options)
  }

  /**
   * 存活检查
   */
  async livenessCheck(options?: ApiRequestConfig) {
    return this.get<HealthCheckResponse>('/api/v1/core/health/live', undefined, options)
  }

  /**
   * 获取服务指标
   */
  async getMetrics(options?: ApiRequestConfig) {
    return this.get<MetricsResponse>('/api/v1/core/metrics', undefined, options)
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(options?: ApiRequestConfig) {
    return this.get<UserPreferenceResponse>('/api/v1/core/preferences', undefined, options)
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(
    data: Partial<UpdateUserPreferenceRequest>,
    options?: ApiRequestConfig
  ) {
    return this.put<UserPreferenceResponse>('/api/v1/core/preferences', data, options)
  }

  /**
   * 获取默认偏好设置
   */
  async getDefaultPreferences(options?: ApiRequestConfig) {
    return this.get<DefaultPreferencesResponse>(
      '/api/v1/core/preferences/default',
      undefined,
      options
    )
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

  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { url, method, data, params } = config

    // 根据请求路径和方法返回相应的Mock数据
    if (method === 'POST' && url.includes('/login')) {
      // 生成可识别的Mock token，包含mock标识
      const mockToken = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const mockRefreshToken = `mock-refresh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

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

    if (method === 'GET' && url.includes('/health')) {
      if (url.includes('/health/detailed')) {
        return mockDataManager.getMockData('auth-health', 'detailed')
      }
      if (url.includes('/health/ready')) {
        return mockDataManager.getMockData('auth-health', 'ready')
      }
      if (url.includes('/health/live')) {
        return mockDataManager.getMockData('auth-health', 'live')
      }
      return mockDataManager.getMockData('auth-health', 'basic')
    }

    if (method === 'GET' && url.includes('/metrics')) {
      return mockDataManager.getMockData('auth-metrics')
    }

    if (method === 'GET' && url.includes('/preferences')) {
      if (url.includes('/preferences/default')) {
        return mockDataManager.getMockData('auth-default-preferences')
      }
      return mockDataManager.getMockData('auth-preferences')
    }

    if (method === 'PUT' && url.includes('/preferences')) {
      return mockDataManager.getMockData('auth-preferences')
    }

    if (method === 'POST' && url.includes('/register')) {
      return mockDataManager.getMockData('auth-register', data)
    }

    if (method === 'GET' && url.includes('/verify/')) {
      const token = url.split('/verify/')[1]
      return mockDataManager.getMockData('auth-verify', token)
    }

    if (method === 'POST' && url.includes('/forgot-password')) {
      return mockDataManager.getMockData('auth-forgot-password', data?.email)
    }

    if (method === 'GET' && url.includes('/account')) {
      return mockDataManager.getMockData('auth-account')
    }

    if (method === 'PUT' && url.includes('/account')) {
      return mockDataManager.getMockData('auth-account')
    }

    if (method === 'DELETE' && url.includes('/account')) {
      return { success: true, message: '账户删除成功' }
    }

    if (method === 'POST' && url.includes('/logout')) {
      return mockDataManager.getMockData('auth-logout')
    }

    if (method === 'POST' && url.includes('/refresh-token')) {
      const refreshToken = params?.refresh_token || ''
      return mockDataManager.getMockData('auth-refresh-token', refreshToken)
    }

    if (method === 'POST' && url.includes('/cleanup-expired-tokens')) {
      return mockDataManager.getMockData('auth-cleanup')
    }

    // 默认响应
    return {
      success: true,
      message: `Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }

  /**
   * 直接使用导入的 mockDataManager
   */
}

// 创建单例实例
export const authService = new AuthService()

export default authService
