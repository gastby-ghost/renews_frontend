/**
 * AI标题生成服务模块API配置
 * 基于 title-generate.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const titleGenerateService: ApiEndpointConfig = {
  name: 'AI标题生成服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/title-generate',
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
    // Generate Titles Endpoint
    '/api/v1/ai/document_generate/title-agent/generate': {
      description: 'Generate Titles Endpoint',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: TitleGenerationRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'TitleGenerationResponse',
        statusCode: 200
      }
    },

    // Get Title Tools Status
    '/api/v1/ai/document_generate/title-agent/status': {
      description: 'Get Title Tools Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'TitleToolsStatusResponse',
        statusCode: 200
      }
    },

    // Validate Title Generation Request
    '/api/v1/ai/document_generate/title-agent/validate': {
      description: 'Validate Title Generation Request',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: TitleGenerationRequest - 请求体数据结构'
        }
      },
      response: {
        dataType:
          'Response Validate Title Generation Request Api V1 Ai Document Generate Title Agent Validate Post',
        statusCode: 200
      }
    }
  }
}
