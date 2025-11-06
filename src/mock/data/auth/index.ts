/**
 * 认证相关Mock数据
 * 包含健康检查、指标、偏好设置等新API端点的Mock数据
 */

/**
 * 生成健康检查Mock数据
 */
export function generateHealthCheckResponse(
  type: 'basic' | 'detailed' | 'ready' | 'live' = 'basic'
): any {
  const timestamp = new Date().toISOString()

  switch (type) {
    case 'basic':
      return {
        status: 'healthy',
        timestamp,
        service: 'auth-service',
        version: '1.0.0',
        uptime: Math.floor(Math.random() * 86400)
      }

    case 'detailed':
      return {
        status: 'healthy',
        timestamp,
        service: 'auth-service',
        version: '1.0.0',
        uptime: Math.floor(Math.random() * 86400),
        checks: {
          database: { status: 'pass', response_time: 15 },
          redis: { status: 'pass', response_time: 5 },
          external_apis: { status: 'pass', response_time: 20 }
        }
      }

    case 'ready':
      return {
        status: 'healthy',
        timestamp,
        service: 'auth-service',
        checks: {
          database: { status: 'pass' },
          redis: { status: 'pass' },
          external_apis: { status: 'pass' }
        }
      }

    case 'live':
      return {
        status: 'healthy',
        timestamp,
        service: 'auth-service'
      }

    default:
      return {
        status: 'healthy',
        timestamp
      }
  }
}

/**
 * 生成服务指标Mock数据
 */
export function generateMetricsResponse(): any {
  return {
    total_requests: 156789,
    successful_requests: 154321,
    failed_requests: 2468,
    average_response_time: 85,
    error_rate: 0.015,
    last_updated: new Date().toISOString(),
    by_service: {
      auth: {
        requests: 52345,
        errors: 123,
        avg_response_time: 45
      },
      user: {
        requests: 45678,
        errors: 89,
        avg_response_time: 52
      }
    }
  }
}

/**
 * 生成用户偏好设置Mock数据
 */
export function generateUserPreferencesResponse(): any {
  return {
    success: true,
    message: '用户偏好获取成功',
    data: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      notifications: {
        email: true,
        push: true,
        in_app: true,
        marketing: false
      },
      privacy: {
        profile_visibility: 'private',
        activity_visibility: 'friends',
        search_visibility: false
      },
      ui: {
        page_size: 20,
        compact_mode: false,
        show_tutorials: true,
        auto_save: true
      },
      editor: {
        font_size: 14,
        line_height: 1.6,
        word_wrap: true,
        show_line_numbers: true
      }
    }
  }
}

/**
 * 生成默认偏好设置Mock数据
 */
export function generateDefaultPreferencesResponse(): any {
  return {
    success: true,
    message: '默认偏好获取成功',
    data: {
      theme: 'light',
      language: 'zh-CN',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        in_app: true,
        marketing: false
      },
      privacy: {
        profile_visibility: 'public',
        activity_visibility: 'public',
        search_visibility: true
      },
      ui: {
        page_size: 10,
        compact_mode: false,
        show_tutorials: true,
        auto_save: true
      },
      editor: {
        font_size: 12,
        line_height: 1.5,
        word_wrap: false,
        show_line_numbers: false
      }
    }
  }
}

/**
 * 生成注册响应Mock数据
 */
export function generateRegisterResponse(params: {
  username: string
  email: string
  password: string
}): any {
  return {
    success: true,
    message: '注册成功，请查看邮箱验证账户',
    token: `verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    email: params.email,
    username: params.username
  }
}

/**
 * 生成邮箱验证Mock数据
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateVerifyEmailResponse(token: string): any {
  return {
    success: true,
    message: '邮箱验证成功',
    verification_type: 'email',
    user_id: Date.now(),
    redirect_url: null
  }
}

/**
 * 生成忘记密码Mock数据
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateForgotPasswordResponse(email: string): any {
  return {
    success: true,
    message: '重置密码邮件已发送'
  }
}

/**
 * 生成账户信息Mock数据
 */
export function generateAccountResponse(): any {
  return {
    success: true,
    data: {
      id: 12345,
      username: 'mockuser',
      email: 'mock@example.com',
      is_active: true,
      is_verified: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      avatar: undefined,
      roles: ['user']
    },
    third_party_accounts: []
  }
}

/**
 * 生成登出响应Mock数据
 */
export function generateLogoutResponse(): any {
  return {
    success: true,
    message: '登出成功',
    token: null,
    refresh_token: null
  }
}

/**
 * 生成刷新令牌Mock数据
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateRefreshTokenResponse(refreshToken: string): any {
  const newToken = `mock-access-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  const newRefreshToken = `mock-refresh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

  return {
    success: true,
    message: '令牌刷新成功',
    token: newToken,
    refresh_token: newRefreshToken,
    expires_in: 3600
  }
}

/**
 * 生成清理过期令牌响应Mock数据
 */
export function generateCleanupResponse(): any {
  return {
    success: true,
    message: '过期令牌清理完成',
    cleaned_count: Math.floor(Math.random() * 100) + 50
  }
}
