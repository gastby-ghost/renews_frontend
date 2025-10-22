/**
 * 网页总结服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含网页内容异步总结等功能
 */

import type { ApiEndpointConfig } from '../types'

export const webpageSummaryService: ApiEndpointConfig = {
  name: '网页总结服务',
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
    // 网页总结服务
    '/webpage-summary/summarize-async': {
      description: '异步网页总结 - 创建Celery异步任务进行网页内容总结',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          url: 'string',
          model_name: 'string',
          max_tokens: 'number',
          scraping_timeout: 'number',
          max_content_length: 'number',
          target_format: 'object'
        }
      },
      response: {
        dataType: 'WebpageSummaryAsyncResponse'
      }
    },
    '/webpage-summary/status/{task_id}': {
      description: '获取网页总结任务状态',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'WebpageSummaryStatusResponse'
      }
    }
  }
}
