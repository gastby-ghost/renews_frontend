/**
 * 大纲生成服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含新闻文章大纲生成、状态检查、请求验证等功能
 */

import type { ApiEndpointConfig } from '../types'

export const outlineGenerateService: ApiEndpointConfig = {
  name: '大纲生成服务',
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
    // 大纲生成服务
    '/outline-generate/generate': {
      description: 'Generate news article outline based on selected title and web search data',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title: 'Title',
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'OutlineGenerationResponse'
      }
    },
    '/outline-generate/status': {
      description: 'Get the status of outline generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'OutlineGenerationStatusResponse'
      }
    },
    '/outline-generate/validate': {
      description: 'Validate outline generation request before processing',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title: 'Title',
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
