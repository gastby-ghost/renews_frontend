/**
 * AI搜索代理服务模块API配置
 * 基于 search-agent.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const searchAgentService: ApiEndpointConfig = {
  name: 'AI搜索代理服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/search-agent',
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
    // Execute Search Agent
    '/search-agent/execute': {
      description: 'Execute Search Agent',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: SearchAgentRequest - 请求体数据结构',
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'SearchAgentResponse',
        statusCode: 200
      }
    },

    // Get Search Agent Status
    '/search-agent/status/{task_id}': {
      description: 'Get Search Agent Status',
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
        dataType: 'SearchAgentStatusResponse',
        statusCode: 200
      }
    },

    // List Search Agent Tasks
    '/search-agent/tasks': {
      description: 'List Search Agent Tasks',
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
        dataType: 'SearchAgentListResponse',
        statusCode: 200
      }
    },

    // Cancel Search Agent Task
    '/search-agent/cancel/{task_id}': {
      description: 'Cancel Search Agent Task',
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
        dataType: 'Response',
        statusCode: 200
      }
    },

    // Get Search Agent Graph State
    '/search-agent/state/{task_id}': {
      description: 'Get Search Agent Graph State',
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
    }
  }
}
