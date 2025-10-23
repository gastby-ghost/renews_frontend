/**
 * 素材管理模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const materialService: ApiEndpointConfig = {
  name: '素材管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    // 素材管理（GET/POST/DELETE）
    '/materials': {
      description: '素材管理（获取列表/创建素材/批量删除）',
      methods: ['GET', 'POST', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          keywords: 'string',
          tags: 'string[]'
        }
      },
      response: {
        dataType: 'MaterialListResponse | MaterialResponse | MaterialDeleteResponse'
      }
    },
    // 批量创建素材
    '/materials/batch': {
      description: '批量创建素材',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'number',
          materials: 'CompleteMaterialData[]'
        }
      },
      response: {
        dataType: 'MaterialListResponse'
      }
    },
    // 素材详情管理（GET/PUT/DELETE）
    '/materials/{material_id}': {
      description: '素材详情管理（获取/更新/删除）',
      methods: ['GET', 'PUT', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          update_data: {
            title: 'string',
            summary: 'string',
            url: 'string',
            score: 'number',
            key_excerpts: 'string[]',
            tags: 'string[]'
          }
        }
      },
      response: {
        dataType: 'MaterialResponse'
      }
    },
    // 项目素材管理（GET/POST）
    '/projects/{project_id}/materials': {
      description: '项目素材管理（获取列表/添加素材）',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          keywords: 'string',
          tags: 'string[]',
          material_ids: 'number[]'
        }
      },
      response: {
        dataType: 'MaterialListResponse | MaterialAddToProjectResponse'
      }
    },
    // 标签管理
    '/tags': {
      description: '标签管理',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'number',
          page_size: 'number',
          search_keyword: 'string',
          name: 'string'
        }
      },
      response: {
        dataType: 'TagResponse | TagResponse[] | TagListResponse'
      }
    },
    // 素材搜索（扩展功能）
    '/materials/search': {
      description: '搜索素材（扩展功能）',
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
    // 素材统计（扩展功能）
    '/materials/stats': {
      description: '获取素材统计数据（扩展功能）',
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
