/**
 * 搜索工具服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含搜索工具执行、状态检查、提供商信息等功能
 */

import type { ApiEndpointConfig } from '../types'

export const searchToolsService: ApiEndpointConfig = {
  name: '搜索工具服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 30000, // AI服务可能需要更长时间
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: false
  },
  paths: {
    // 搜索工具服务
    '/search-tools/search': {
      description: 'Execute search using the specified provider',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          queries: 'string[]',
          max_results: 'number',
          enable_structured_summaries: 'boolean',
          summarization_model: 'string',
          max_content_length: 'number',
          topic: 'string',
          include_raw_content: 'boolean',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          provider: 'string'
        }
      },
      response: {
        dataType: 'SearchToolsResponse'
      }
    },
    '/search-tools/status': {
      description: 'Check the configuration status of search tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'SearchToolsStatusResponse'
      }
    },
    '/search-tools/providers': {
      description: 'Get information about available search providers',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
