/**
 * 检索服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含通用搜索、Agent搜索和任务状态查询等功能
 */

import type { ApiEndpointConfig } from '../types'

export const retrievalService: ApiEndpointConfig = {
  name: '检索服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST'],
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
    // 检索服务
    '/retrieval/search': {
      description: '通用直连搜索接口，可指定搜索引擎或使用默认配置',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          q: 'string',
          provider: 'string',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          count: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/retrieval/agent-search-async': {
      description: '创建检索Agent的Celery异步任务',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          q: 'string',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          count: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/retrieval/status/{task_id}': {
      description: '查询检索相关任务的Celery任务状态',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
