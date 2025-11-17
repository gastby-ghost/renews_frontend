/**
 * 素材管理服务模块API配置
 * 基于 material.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const materialService: ApiEndpointConfig = {
  name: '素材管理服务',
  baseUrl: '/api/v1/core',
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
    '/materials/batch': {
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

    // Get User Materials & Create Material & Delete Materials
    '/materials': {
      description: 'Get User Materials & Create Material & Delete Materials',
      methods: ['GET', 'POST', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          // GET params
          page: 'integer - page (可选)',
          page_size: 'integer - page_size (可选)',
          keywords: 'unknown - keywords (可选)',
          library_id: 'unknown - library_id (可选)',
          // POST/DELETE params
          material_ids: 'unknown - 要删除的素材ID列表，逗号分隔，如：1,2,3 (可选)',
          body: 'schema: MaterialCreate|MaterialDeleteRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'MaterialListResponse|MaterialResponse|MaterialDeleteResponse',
        statusCode: 200
      }
    },

    // Get Material & Update Material
    '/materials/{material_id}': {
      description: 'Get Material & Update Material',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          material_id: 'integer - 素材ID，必须为正整数 (必需)',
          body: 'schema: MaterialUpdateRequest - 请求体数据结构 (PUT only)'
        }
      },
      response: {
        dataType: 'MaterialResponse',
        statusCode: 200
      }
    },

    // Get Project Materials & Add Materials To Project
    '/projects/{project_id}/materials': {
      description: 'Get Project Materials & Add Materials To Project',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID，必须为正整数 (必需)',
          page: 'integer - page (可选)',
          page_size: 'integer - page_size (可选)',
          keywords: 'unknown - keywords (可选)',
          body: 'schema: AddExternalMaterialRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'MaterialListResponse|MaterialAddToProjectResponse',
        statusCode: 200
      }
    },

    // Get User Tags & Create Tag
    '/tags': {
      description: 'Get User Tags & Create Tag',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'integer - page (可选)',
          page_size: 'integer - page_size (可选)',
          search_keyword: 'unknown - search_keyword (可选)',
          body: 'schema: MaterialTagCreate - 请求体数据结构'
        }
      },
      response: {
        dataType: 'TagListResponse|MaterialTagResponse',
        statusCode: 200
      }
    }
  }
}
