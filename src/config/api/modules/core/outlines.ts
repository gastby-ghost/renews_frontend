/**
 * 大纲管理服务模块API配置
 * 基于 outlines.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const outlineService: ApiEndpointConfig = {
  name: '大纲管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/outlines',
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
    // Create Outline
    '/projects/{project_id}/outlines': {
      description: 'Create Outline',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: OutlineCreate - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineCreateResponse',
        statusCode: 200
      }
    },

    // Get Active Outline
    '/projects/{project_id}/outlines/active': {
      description: 'Get Active Outline',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineDetailResponse',
        statusCode: 200
      }
    },

    // Get Outline History
    '/projects/{project_id}/outlines/history': {
      description: 'Get Outline History',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量 (可选)'
        }
      },
      response: {
        dataType: 'OutlineHistoryResponse',
        statusCode: 200
      }
    },

    // Delete Outline
    '/outlines/{outline_id}': {
      description: 'Delete Outline',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          outline_id: 'integer - 大纲ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineDeactivateResponse',
        statusCode: 200
      }
    },

    // Activate Outline
    '/outlines/{outline_id}/activate': {
      description: 'Activate Outline',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: OutlineActivateRequest - 请求体数据结构',
          outline_id: 'integer - 大纲ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineActivateResponse',
        statusCode: 200
      }
    },

    // Deactivate Outline
    '/outlines/{outline_id}/deactivate': {
      description: 'Deactivate Outline',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: OutlineDeactivateRequest - 请求体数据结构',
          outline_id: 'integer - 大纲ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineDeactivateResponse',
        statusCode: 200
      }
    }
  }
}
