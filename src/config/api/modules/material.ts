/**
 * 素材管理模块API配置
 * 基于 material.json OpenAPI 3.1.0 规范
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
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: {
    // 批量创建素材 - POST /api/v1/core/materials/batch
    '/materials/batch': {
      description: '批量创建素材 - 从完整素材列表批量创建',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'number - 项目ID',
          materials: 'MaterialCreate[] - 素材列表'
        }
      },
      response: {
        dataType: 'MaterialListResponse',
        statusCode: 200
      }
    },

    // 创建单个素材/获取列表/批量删除 - POST/GET/DELETE /api/v1/core/materials
    '/materials': {
      description: '素材管理（创建单个素材/获取列表/批量删除）',
      methods: ['GET', 'POST', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          // GET/POST 查询参数
          page: 'number - 页码',
          page_size: 'number - 每页数量',
          keywords: 'string - 关键词',
          library_id: 'number - 素材库ID（可选）',
          material_ids: 'string - 素材ID列表（删除时支持，逗号分隔）',
          // POST 创建参数
          title: 'string - 标题',
          summary: 'string - 摘要',
          url: 'string - 来源URL',
          score: 'number - 相关性评分',
          key_excerpts: 'string[] - 关键摘录',
          tags: 'string[] - 标签（创建或筛选）',
          // DELETE 删除参数
          material_ids_array: 'number[] - 要删除的素材ID列表'
        }
      },
      response: {
        dataType: 'MaterialResponse | MaterialListResponse | MaterialDeleteResponse',
        statusCode: 200
      }
    },

    // 素材详情管理 - GET/PUT /api/v1/core/materials/{material_id}
    '/materials/{material_id}': {
      description: '素材详情管理（获取/更新）',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          material_id: 'number - 素材ID，必须为正整数',
          // PUT 更新参数
          update_data: 'object - 更新数据，包含title、summary、url、score、key_excerpts、tags等'
        }
      },
      response: {
        dataType: 'MaterialResponse',
        statusCode: 200
      }
    },

    // 项目素材管理 - GET/POST /api/v1/core/projects/{project_id}/materials
    '/projects/{project_id}/materials': {
      description: '项目素材管理（获取列表/添加素材）',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'number - 项目ID，必须为正整数',
          // GET 查询参数
          page: 'number - 页码',
          page_size: 'number - 每页数量',
          keywords: 'string - 关键词',
          // POST 添加参数
          material_ids: 'number[] - 要添加的素材ID列表',
          tags: 'string[] - 标签列表（用于筛选）'
        }
      },
      response: {
        dataType: 'MaterialListResponse | MaterialAddToProjectResponse',
        statusCode: 200
      }
    },

    // 标签管理 - GET/POST /api/v1/core/tags
    '/tags': {
      description: '标签管理（获取列表/创建标签）',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          // GET 查询参数
          page: 'number - 页码',
          page_size: 'number - 每页数量（默认50）',
          search_keyword: 'string - 搜索关键词',
          // POST 创建参数
          name: 'string - 标签名称'
        }
      },
      response: {
        dataType: 'MaterialTagResponse | TagListResponse',
        statusCode: 200
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
          keywords: 'string - 搜索关键词',
          filters: 'object - 筛选条件',
          project_id: 'number - 项目ID（可选）'
        }
      },
      response: {
        dataType: 'MaterialSearchResponse',
        statusCode: 200
      }
    },

    // 素材统计（扩展功能）
    '/materials/stats': {
      description: '获取素材统计数据（扩展功能）',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          project_id: 'number - 项目ID（可选）',
          group_by: 'string - 分组字段（可选）'
        }
      },
      response: {
        dataType: 'MaterialStatsResponse',
        statusCode: 200
      }
    }
  }
}
