/**
 * 系统健康检查服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含系统健康检查和Celery连接状态等功能
 */

import type { ApiEndpointConfig } from '../types'

export const healthService: ApiEndpointConfig = {
  name: '系统健康检查',
  baseUrl: '/api/v1/ai',
  methods: ['GET'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 5000, // 健康检查使用较短的超时时间
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 0,
    enableCache: false
  },
  paths: {
    // 系统健康检查
    '/health': {
      description: '健康检查端点，同时检查Celery连接',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
