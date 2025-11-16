/**
 * AI搜索标题代理服务模块API配置
 * 基于 search2title-agent.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const search2titleAgentService: ApiEndpointConfig = {
  name: 'AI搜索标题代理服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/search2title-agent',
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
    // Execute Search2Title Agent
    '/api/v1/ai/document_generate/search2title-agent/execute': {
      description: 'Execute Search2Title Agent',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          body: 'schema: Search2TitleAgentRequest - 请求体数据结构',
          user_id: 'string - user_id (必需)',
          project_id: 'unknown - project_id (可选)'
        }
      },
      response: {
        dataType: 'Search2TitleAgentResponse',
        statusCode: 200
      }
    },

    // Get Search2Title Agent Status
    '/api/v1/ai/document_generate/search2title-agent/status/{task_id}': {
      description: 'Get Search2Title Agent Status',
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
        dataType: 'Search2TitleAgentStatusResponse',
        statusCode: 200
      }
    },

    // List Search2Title Agent Tasks
    '/api/v1/ai/document_generate/search2title-agent/tasks': {
      description: 'List Search2Title Agent Tasks',
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
        dataType: 'Search2TitleAgentListResponse',
        statusCode: 200
      }
    },

    // Cancel Search2Title Agent Task
    '/api/v1/ai/document_generate/search2title-agent/cancel/{task_id}': {
      description: 'Cancel Search2Title Agent Task',
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

    // Get Search2Title Agent Graph State
    '/api/v1/ai/document_generate/search2title-agent/state/{task_id}': {
      description: 'Get Search2Title Agent Graph State',
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
