/**
 * AI范围代理服务模块API配置
 * 基于 scope-agent.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const scopeAgentService: ApiEndpointConfig = {
  name: 'AI范围代理服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/scope-agent',
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
    // Execute Scope Agent
    '/api/v1/ai/document_generate/scope-agent/execute': {
      description: 'Execute Scope Agent',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: ScopeAgentRequest - 请求体数据结构',
          user_id: 'string - user_id (必需)',
          project_id: 'string - project_id (必需)'
        }
      },
      response: {
        dataType: 'ScopeAgentResponse',
        statusCode: 200
      }
    },

    // Get Scope Agent Status
    '/api/v1/ai/document_generate/scope-agent/status/{task_id}': {
      description: 'Get Scope Agent Status',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)'
        }
      },
      response: {
        dataType: 'ScopeAgentStatusResponse',
        statusCode: 200
      }
    },

    // List Scope Agent Tasks
    '/api/v1/ai/document_generate/scope-agent/tasks': {
      description: 'List Scope Agent Tasks',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)',
          limit: 'integer - limit (可选)',
          offset: 'integer - offset (可选)'
        }
      },
      response: {
        dataType: 'ScopeAgentListResponse',
        statusCode: 200
      }
    },

    // Cancel Scope Agent Task
    '/api/v1/ai/document_generate/scope-agent/cancel/{task_id}': {
      description: 'Cancel Scope Agent Task',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          task_id: 'string - task_id (必需)'
        }
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    }
  }
}
