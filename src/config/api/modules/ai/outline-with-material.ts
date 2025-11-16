/**
 * AI带素材大纲生成服务模块API配置
 * 基于 outline-with-material.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const outlineWithMaterialService: ApiEndpointConfig = {
  name: 'AI带素材大纲生成服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/outline-with-material',
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
    // Execute Outline With Material
    '/document_generate/outline-with-material/execute': {
      description: 'Execute Outline With Material',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: ExecuteOutlineWithMaterialRequest - 请求体数据结构',
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'ExecuteOutlineResponse',
        statusCode: 200
      }
    },

    // Get Outline With Material Task
    '/document_generate/outline-with-material/task/{task_id}': {
      description: 'Get Outline With Material Task',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)',
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    },

    // List Outline Tasks
    '/document_generate/outline-with-material/tasks': {
      description: 'List Outline Tasks',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'ListOutlineTasksResponse',
        statusCode: 200
      }
    },

    // Cancel Outline Task
    '/document_generate/outline-with-material/cancel/{task_id}': {
      description: 'Cancel Outline Task',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)',
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'CancelOutlineTaskResponse',
        statusCode: 200
      }
    }
  }
}
