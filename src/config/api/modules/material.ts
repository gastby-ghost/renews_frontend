/**
 * 素材管理模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const materialService: ApiEndpointConfig = {
  name: '素材管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  enableMock: true,
  mockPath: '/mock/data/material',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    // 素材管理（GET/POST）
    '/materials': {
      description: '素材管理（获取列表/创建素材）',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          project_id: 'number',
          type: 'string',
          tags: 'string[]',
          keywords: 'string',
          sort_by: 'string',
          title: 'string',
          content: 'string',
          metadata: 'object'
        }
      },
      response: {
        dataType: 'MaterialListResponse | MaterialResponse'
      }
    },
    // 批量操作素材（POST/DELETE）
    '/materials/batch': {
      description: '批量操作素材（创建/删除）',
      methods: ['POST', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'number',
          materials: 'CompleteMaterialData[]',
          material_ids: 'number[]'
        }
      },
      response: {
        dataType: 'MaterialListResponse | MaterialDeleteResponse'
      }
    },
    // 素材详情管理（GET/PUT/PATCH/DELETE）
    '/materials/{material_id}': {
      description: '素材详情管理（获取/更新/删除）',
      methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title: 'string',
          content: 'string',
          tags: 'string[]',
          metadata: 'object'
        }
      },
      response: {
        dataType: 'MaterialResponse | DeleteResponse'
      }
    },
    // 获取项目素材
    '/projects/{project_id}/materials': {
      description: '获取项目素材列表',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          keywords: 'string',
          tags: 'string[]',
          sort_by: 'string'
        }
      },
      response: {
        dataType: 'MaterialListResponse'
      }
    },
    // 标签管理
    '/tags': {
      description: '标签管理',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true
      },
      response: {
        dataType: 'TagResponse | TagResponse[]'
      }
    },
    // 素材搜索
    '/materials/search': {
      description: '搜索素材',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          keywords: 'string',
          filters: 'object',
          project_id: 'number'
        }
      },
      response: {
        dataType: 'MaterialSearchResponse'
      }
    },
    // 素材统计
    '/materials/stats': {
      description: '获取素材统计数据',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          project_id: 'number',
          group_by: 'string'
        }
      },
      response: {
        dataType: 'MaterialStatsResponse'
      }
    }
  }
}
