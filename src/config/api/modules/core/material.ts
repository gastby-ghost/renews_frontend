/**
 * 素材管理服务模块API配置
 * 基于 material.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const materialService: ApiEndpointConfig = {
  name: '素材管理服务',
  baseUrl: '/api/v1',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/material',
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
    // Create Materials From List
    '/api/v1/core/materials/batch': {
      description: 'Create Materials From List',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: AddCompleteMaterialRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'MaterialListResponse',
        statusCode: 200
      }
    },

    // Delete Materials
    '/api/v1/core/materials': {
      description: 'Delete Materials',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          material_ids: 'unknown - 要删除的素材ID列表，逗号分隔，如：1,2,3 (可选)'
        }
      },
      response: {
        dataType: 'MaterialDeleteResponse',
        statusCode: 200
      }
    },

    // Update Material
    '/api/v1/core/materials/{material_id}': {
      description: 'Update Material',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialUpdateRequest - 请求体数据结构',
          material_id: 'integer - material_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialResponse',
        statusCode: 200
      }
    },

    // Get Project Materials
    '/api/v1/core/projects/{project_id}/materials': {
      description: 'Get Project Materials',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID，必须为正整数 (必需)',
          page: 'integer - page (可选)',
          page_size: 'integer - page_size (可选)',
          keywords: 'unknown - keywords (可选)'
        }
      },
      response: {
        dataType: 'MaterialListResponse',
        statusCode: 200
      }
    },

    // Create Tag
    '/api/v1/core/tags': {
      description: 'Create Tag',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialTagCreate - 请求体数据结构'
        }
      },
      response: {
        dataType: 'MaterialTagResponse',
        statusCode: 200
      }
    }
  }
}
