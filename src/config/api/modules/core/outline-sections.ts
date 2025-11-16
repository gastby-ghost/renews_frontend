/**
 * 大纲章节服务模块API配置
 * 基于 outline-sections.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const outlineSectionService: ApiEndpointConfig = {
  name: '大纲章节服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/outline-sections',
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
    // Get Sections By Outline
    '/outlines/{outline_id}/sections': {
      description: 'Get Sections By Outline',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          outline_id: 'integer - 大纲ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineSectionListResponse',
        statusCode: 200
      }
    },

    // Delete Section
    '/sections/{section_id}': {
      description: 'Delete Section',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          section_id: 'integer - 章节ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineSectionDeleteResponse',
        statusCode: 200
      }
    },

    // Bulk Create Sections
    '/outlines/{outline_id}/sections/batch': {
      description: 'Bulk Create Sections',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: OutlineSectionBatchCreate - 请求体数据结构',
          outline_id: 'integer - 大纲ID (必需)'
        }
      },
      response: {
        dataType: 'OutlineSectionBatchCreateResponse',
        statusCode: 200
      }
    },

    // Reorder Sections
    '/sections/reorder': {
      description: 'Reorder Sections',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: OutlineSectionReorder - 请求体数据结构'
        }
      },
      response: {
        dataType: 'OutlineSectionReorderResponse',
        statusCode: 200
      }
    }
  }
}
