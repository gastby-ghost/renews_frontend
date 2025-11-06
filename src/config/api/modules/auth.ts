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
          password: 'string',
          remember_me: 'boolean'
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
      description: '统一的邮件验证令牌处理',
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
      description: '获取账户设置',
      methods: ['GET', 'PUT', 'DELETE'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'AccountSettingsResponse'
      }
    },
    // 刷新令牌
    '/refresh-token': {
      description: '刷新访问令牌',
      methods: ['POST'],
      request: {
        query: {
          refresh_token: 'string'
        },
        requireAuth: false
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
      description: '清理过期的验证令牌（管理员功能）',
      methods: ['POST'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'CleanupResponse'
      }
    },
    // 基础健康检查
    '/health': {
      description: '基础健康检查',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'HealthCheckResponse'
      }
    },
    // 详细健康检查
    '/health/detailed': {
      description: '详细健康检查',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'HealthCheckResponse'
      }
    },
    // 就绪性检查
    '/health/ready': {
      description: '就绪性检查 - 服务是否准备好接收请求',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'HealthCheckResponse'
      }
    },
    // 存活检查
    '/health/live': {
      description: '存活检查 - 服务是否正在运行',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'HealthCheckResponse'
      }
    },
    // 获取服务指标
    '/metrics': {
      description: '获取服务指标',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'MetricsResponse'
      }
    },
    // 获取用户偏好设置
    '/preferences': {
      description: '获取当前用户的偏好设置',
      methods: ['GET', 'PUT'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'UserPreferenceResponse'
      }
    },
    // 获取默认偏好设置
    '/preferences/default': {
      description: '获取默认偏好设置',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'DefaultPreferencesResponse'
      }
    }
  }
}
