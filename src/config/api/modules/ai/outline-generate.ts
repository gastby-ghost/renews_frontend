/**
 * AI大纲生成服务模块API配置
 * 基于 outline-generate.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const outlineGenerateService: ApiEndpointConfig = {
  name: 'AI大纲生成服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/outline-generate',
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
    // Generate Outline Endpoint
    '/api/v1/ai/document_generate/outline-agent/generate': {
      description: 'Generate Outline Endpoint',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: OutlineGenerationRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'OutlineGenerationResponse',
        statusCode: 200
      }
    },

    // Get Outline Tools Status
    '/api/v1/ai/document_generate/outline-agent/status': {
      description: 'Get Outline Tools Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'OutlineGenerationStatusResponse',
        statusCode: 200
      }
    }
  }
}
