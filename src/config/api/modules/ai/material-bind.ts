/**
 * AI素材绑定服务模块API配置
 * 基于 material-bind.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const materialBindService: ApiEndpointConfig = {
  name: 'AI素材绑定服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/material-bind',
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
    // Execute Material Bind
    '/api/v1/ai/document_generate/material-bind/execute': {
      description: 'Execute Material Bind',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: ExecuteMaterialBindRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'MaterialBindResult',
        statusCode: 200
      }
    },

    // Get Material Bind Status
    '/api/v1/ai/document_generate/material-bind/status/{task_id}': {
      description: 'Get Material Bind Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)'
        }
      },
      response: {
        dataType: 'TaskStatus',
        statusCode: 200
      }
    },

    // Cancel Material Bind Task
    '/api/v1/ai/document_generate/material-bind/cancel/{task_id}': {
      description: 'Cancel Material Bind Task',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)'
        }
      },
      response: {
        dataType: 'CancelTaskResponse',
        statusCode: 200
      }
    }
  }
}
