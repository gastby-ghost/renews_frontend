/**
 * AI搜索工具服务模块API配置
 * 基于 search-tools.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const searchToolsService: ApiEndpointConfig = {
  name: 'AI搜索工具服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/search-tools',
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
    // Execute Search Tools (异步任务)
    '/search-tools/execute': {
      description: 'Execute Search Tools - 异步执行搜索任务',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          query: {
            user_id: 'string - 用户ID',
            project_id: 'string - 项目ID（可选）'
          },
          body: 'schema: SearchToolsExecuteRequest - 搜索执行请求'
        }
      },
      response: {
        dataType: 'SearchToolsExecuteResponse',
        statusCode: 200
      }
    },

    // Get Search Tools Task Status
    '/search-tools/status/{task_id}': {
      description: 'Get Search Tools Status - 获取搜索任务状态',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          path: {
            task_id: 'string - 任务ID'
          },
          query: {
            user_id: 'string - 用户ID',
            project_id: 'string - 项目ID（可选）'
          }
        }
      },
      response: {
        dataType: 'SearchToolsTaskStatusResponse',
        statusCode: 200
      }
    },

    // List Search Tools Tasks
    '/search-tools/tasks': {
      description: 'List Search Tools Tasks - 获取搜索任务列表',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          query: {
            user_id: 'string - 用户ID',
            project_id: 'string - 项目ID（可选）'
          }
        }
      },
      response: {
        dataType: 'SearchToolsTaskListResponse',
        statusCode: 200
      }
    },

    // Cancel Search Tools Task
    '/search-tools/cancel/{task_id}': {
      description: 'Cancel Search Tools Task - 取消搜索任务',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          path: {
            task_id: 'string - 任务ID'
          },
          query: {
            user_id: 'string - 用户ID',
            project_id: 'string - 项目ID（可选）'
          }
        }
      },
      response: {
        dataType: 'object',
        statusCode: 200
      }
    },

    // Get Search Tools Task State
    '/search-tools/state/{task_id}': {
      description: 'Get Search Tools Task State - 获取搜索任务状态',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {
          path: {
            task_id: 'string - 任务ID'
          },
          query: {
            user_id: 'string - 用户ID',
            project_id: 'string - 项目ID（可选）'
          }
        }
      },
      response: {
        dataType: 'SearchToolsStateResponse',
        statusCode: 200
      }
    },

    // Search Tools Config Status
    '/search-tools/config/status': {
      description: 'Search Tools Config Status - 搜索工具配置状态检查',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'SearchToolsStatusResponse',
        statusCode: 200
      }
    },

    // Get Search Providers
    '/search-tools/providers': {
      description: 'Get Search Providers - 获取搜索提供商信息',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: false,
        params: {}
      },
      response: {
        dataType: 'Response Get Search Providers Api V1 Ai Search Tools Providers Get',
        statusCode: 200
      }
    }
  }
}
