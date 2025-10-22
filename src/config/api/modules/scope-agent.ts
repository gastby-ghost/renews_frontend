/**
 * Scope Agent服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含Scope Agent执行、状态查询、任务列表等功能
 */

import type { ApiEndpointConfig } from '../types'

export const scopeAgentService: ApiEndpointConfig = {
  name: 'Scope Agent服务',
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
    // Scope Agent服务
    '/scope-agent/execute': {
      description: 'Execute a scope agent with user and project constraints',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          query: 'string'
        }
      },
      response: {
        dataType: 'ScopeAgentResponse'
      }
    },
    '/scope-agent/status/{task_id}': {
      description: 'Get the status of a scope agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'ScopeAgentStatusResponse'
      }
    },
    '/scope-agent/tasks': {
      description: 'List scope agent tasks for a user, optionally filtered by project',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          limit: 'number',
          offset: 'number'
        }
      },
      response: {
        dataType: 'ScopeAgentListResponse'
      }
    },
    '/scope-agent/cancel/{task_id}': {
      description: 'Cancel a running scope agent task',
      methods: ['POST'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/scope-agent/state/{task_id}': {
      description: 'Get the LangGraph state for a running scope agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
