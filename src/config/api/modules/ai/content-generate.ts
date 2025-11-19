/**
 * AI正文生成服务模块API配置
 * 基于 content-generate.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const contentGenerateService: ApiEndpointConfig = {
  name: 'AI正文生成服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/content-generate',
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
    // Generate Content Endpoint
    '/document_generate/content/generate': {
      description: 'Generate Content Endpoint',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: BodyGenerationRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'BodyGenerationResponse',
        statusCode: 200
      }
    },

    // Get Task Status / Cancel Task
    '/document_generate/content/tasks/{task_id}': {
      description: 'Get Task Status / Cancel Task',
      methods: ['GET', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)'
        }
      },
      response: {
        dataType: 'TaskStatusResponse',
        statusCode: 200
      }
    },

    // Get Content Tools Status
    '/document_generate/content/status': {
      description: 'Get Content Tools Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'BodyToolsStatusResponse',
        statusCode: 200
      }
    },

    // Validate Content Generation Request
    '/document_generate/content/validate': {
      description: 'Validate Content Generation Request',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: BodyGenerationRequest - 请求体数据结构'
        }
      },
      response: {
        dataType:
          'Response Validate Content Generation Request Api V1 Ai Document Generate Content Validate Post',
        statusCode: 200
      }
    },

    // List Tasks
    '/document_generate/content/tasks': {
      description: 'List Tasks',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          project_id: 'unknown - project_id (可选)',
          status: 'unknown - status (可选)',
          limit: 'integer - limit (可选)'
        }
      },
      response: {
        dataType: 'Response List Tasks Api V1 Ai Document Generate Content Tasks Get',
        statusCode: 200
      }
    }
  }
}
