/**
 * 标题生成服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含新闻标题生成、状态检查、请求验证等功能
 */

import type { ApiEndpointConfig } from '../types'

export const titleGenerateService: ApiEndpointConfig = {
  name: '标题生成服务',
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
    // 标题生成服务
    '/title-generate/generate': {
      description: 'Generate news titles based on research brief and web search data',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'TitleGenerationResponse'
      }
    },
    '/title-generate/status': {
      description: 'Get the status of title generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'TitleToolsStatusResponse'
      }
    },
    '/title-generate/validate': {
      description: 'Validate title generation request before processing',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
