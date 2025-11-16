/**
 * 内容管理服务模块API配置
 * 基于 bodies.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const bodyService: ApiEndpointConfig = {
  name: '内容管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/bodies',
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
    // Get Bodies
    '/bodies/projects/{project_id}/bodies': {
      description: 'Get Bodies',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - project_id (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量 (可选)'
        }
      },
      response: {
        dataType: 'BodyHistoryResponse',
        statusCode: 200
      }
    },

    // Get Active Body
    '/bodies/projects/{project_id}/bodies/active': {
      description: 'Get Active Body',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - project_id (必需)'
        }
      },
      response: {
        dataType: 'BodyActiveResponse',
        statusCode: 200
      }
    },

    // Get Body History
    '/bodies/projects/{project_id}/bodies/history': {
      description: 'Get Body History',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - project_id (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量 (可选)'
        }
      },
      response: {
        dataType: 'BodyHistoryResponse',
        statusCode: 200
      }
    },

    // Delete Body
    '/bodies/bodies/{body_id}': {
      description: 'Delete Body',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body_id: 'integer - body_id (必需)'
        }
      },
      response: {
        dataType: 'BodyDeactivateResponse',
        statusCode: 200
      }
    },

    // Activate Body
    '/bodies/bodies/{body_id}/activate': {
      description: 'Activate Body',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: BodyActivateRequest - 请求体数据结构',
          body_id: 'integer - body_id (必需)'
        }
      },
      response: {
        dataType: 'BodyActivateResponse',
        statusCode: 200
      }
    },

    // Deactivate Body
    '/bodies/bodies/{body_id}/deactivate': {
      description: 'Deactivate Body',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: BodyDeactivateRequest - 请求体数据结构',
          body_id: 'integer - body_id (必需)'
        }
      },
      response: {
        dataType: 'BodyDeactivateResponse',
        statusCode: 200
      }
    },

    // Get Text Stats
    '/bodies/bodies/{body_id}/stats': {
      description: 'Get Text Stats',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body_id: 'integer - body_id (必需)'
        }
      },
      response: {
        dataType: 'TextStatsResponse',
        statusCode: 200
      }
    },

    // Get Readability Analysis
    '/bodies/bodies/{body_id}/readability': {
      description: 'Get Readability Analysis',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body_id: 'integer - body_id (必需)'
        }
      },
      response: {
        dataType: 'ReadabilityAnalysisResponse',
        statusCode: 200
      }
    }
  }
}
