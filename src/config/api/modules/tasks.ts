/**
 * 任务管理服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含Celery异步任务取消/中断等功能
 */

import type { ApiEndpointConfig } from '../types'

export const tasksService: ApiEndpointConfig = {
  name: '任务管理服务',
  baseUrl: '/api/v1/ai',
  methods: ['POST'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 120000, // AI服务可能需要更长时间，设置为120秒
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2, // 增加重试次数以配合更长的超时时间
    enableCache: false
  },
  paths: {
    // 任务管理
    '/tasks/{task_id}/cancel': {
      description: '基于task_id撤销/中断Celery异步任务',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          task_id: 'string',
          terminate: 'boolean',
          signal: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
