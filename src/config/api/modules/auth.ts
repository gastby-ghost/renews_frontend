/**
 * 用户认证模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const authService: ApiEndpointConfig = {
  name: '用户认证服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/auth',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2,
    enableCache: false
  },
  paths: {
    // 用户注册
    '/register': {
      description: '用户注册（使用缓存系统）',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          username: 'string',
          email: 'string',
          password: 'string'
        }
      },
      response: {
        dataType: 'PendingRegistrationResponse'
      }
    },
    // 用户登录
    '/login': {
      description: '用户登录',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          email: 'string',
          password: 'string'
        }
      },
      response: {
        dataType: 'AuthResponse'
      }
    },
    // 忘记密码
    '/forgot-password': {
      description: '请求密码重置',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          email: 'string'
        }
      },
      response: {
        dataType: 'ForgotPasswordResponse'
      }
    },
    // 验证邮箱
    '/verify/{token}': {
      description: '验证邮箱地址',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'VerificationResponse'
      }
    },
    // 获取账户信息
    '/account': {
      description: '获取当前用户账户信息',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'UserAccountResponse'
      }
    },
    // 刷新令牌
    '/refresh-token': {
      description: '刷新访问令牌',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          refresh_token: 'string'
        }
      },
      response: {
        dataType: 'AuthResponse'
      }
    },
    // 用户登出
    '/logout': {
      description: '用户登出',
      methods: ['POST'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'LogoutResponse'
      }
    },
    // 清理过期令牌
    '/cleanup-expired-tokens': {
      description: '清理过期的认证令牌',
      methods: ['DELETE'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'CleanupResponse'
      }
    }
  }
}
