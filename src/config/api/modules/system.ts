/**
 * 系统管理模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const systemService: ApiEndpointConfig = {
  name: '系统管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/system',
  defaults: {
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: true
  },
  paths: {
    // 健康检查
    '/health': {
      description: '基础健康检查',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'HealthResponse'
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
        dataType: 'DetailedHealthResponse'
      }
    },
    // 就绪检查
    '/health/ready': {
      description: '服务就绪检查',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'ReadinessResponse'
      }
    },
    // 存活检查
    '/health/live': {
      description: '服务存活检查',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'LivenessResponse'
      }
    },
    // 系统指标
    '/metrics': {
      description: '获取系统指标',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'MetricsResponse'
      }
    },
    // 用户偏好设置管理（GET/PUT）
    '/preferences': {
      description: '用户偏好设置管理（获取/更新）',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          theme: 'string',
          language: 'string',
          notifications: 'object',
          privacy: 'object'
        }
      },
      response: {
        dataType: 'UserPreferencesResponse'
      }
    },
    // 默认偏好设置
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
