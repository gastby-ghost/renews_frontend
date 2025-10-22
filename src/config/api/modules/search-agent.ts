/**
 * Search Agent服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含Search Agent执行、状态查询、任务列表等功能
 */

import type { ApiEndpointConfig } from '../types'

export const searchAgentService: ApiEndpointConfig = {
  name: 'Search Agent服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 120000, // AI服务可能需要更长时间，设置为120秒
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2, // 增加重试次数以配合更长的超时时间
    enableCache: false
  },
  paths: {
    // Search Agent服务
    '/search-agent/execute': {
      description: 'Execute a search agent with user and project constraints',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          brief: 'string',
          max_concurrent_research_units: 'number',
          max_researcher_iterations: 'number'
        }
      },
      response: {
        dataType: 'SearchAgentResponse'
      }
    },
    '/search-agent/status/{task_id}': {
      description: 'Get the status of a search agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'SearchAgentStatusResponse'
      }
    },
    '/search-agent/tasks': {
      description: 'List search agent tasks for a user',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'SearchAgentListResponse'
      }
    },
    '/search-agent/cancel/{task_id}': {
      description: 'Cancel a running search agent task',
      methods: ['POST'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/search-agent/state/{task_id}': {
      description: 'Get the current LangGraph state for a running search agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
