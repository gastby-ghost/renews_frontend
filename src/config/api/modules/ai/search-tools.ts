/**
 * AI搜索工具服务模块API配置
 * 基于 search-tools.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const searchToolsService: ApiEndpointConfig = {
  name: 'AI搜索工具服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/search-tools',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    // Search Endpoint
    '/api/v1/ai/search-tools/search': {
      description: 'Search Endpoint',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: UnifiedSearchRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'SearchToolsResponse',
        statusCode: 200
      }
    },

    // Search Tools Status
    '/api/v1/ai/search-tools/status': {
      description: 'Search Tools Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'SearchToolsStatusResponse',
        statusCode: 200
      }
    },

    // Get Search Providers
    '/api/v1/ai/search-tools/providers': {
      description: 'Get Search Providers',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response Get Search Providers Api V1 Ai Search Tools Providers Get',
        statusCode: 200
      }
    }
  }
}
