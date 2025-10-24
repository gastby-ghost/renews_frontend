/**
 * 项目管理模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const projectService: ApiEndpointConfig = {
  name: '项目管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  enableMock: true,
  mockPath: '/mock/data/project',
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
    // 项目管理（GET/POST）
    '/projects': {
      description: '项目管理（获取列表/创建项目）',
      methods: ['GET', 'POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'integer',
          page_size: 'integer',
          status: 'string',
          keywords: 'string',
          folder_id: 'integer',
          name: 'string'
        }
      },
      response: {
        dataType: 'ProjectListResponse | ProjectDetailResponse'
      }
    },
    // 批量删除项目
    '/projects/batch': {
      description: '批量删除项目',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_ids: 'number[]'
        }
      },
      response: {
        dataType: 'ProjectDeleteResponse'
      }
    },
    // 项目详情管理（GET/PUT）
    '/projects/{project_id}': {
      description: '项目详情管理（获取/更新）',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          name: 'string',
          status: 'string',
          current_component: 'string',
          folder_id: 'integer'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse'
      }
    },
    // 项目状态管理（PATCH）
    '/projects/{project_id}/status': {
      description: '项目状态管理（更新）',
      methods: ['PATCH'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          status: 'string'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse'
      }
    },
    // 获取项目组件
    '/projects/{project_id}/components': {
      description: '获取项目组件列表',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          type: 'string',
          status: 'string'
        }
      },
      response: {
        dataType: 'ProjectComponentListResponse'
      }
    },
    // 更新项目当前组件
    '/projects/{project_id}/component': {
      description: '更新项目当前组件',
      methods: ['PATCH'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          current_component: 'string'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse'
      }
    },
    // 项目统计
    '/projects/{project_id}/stats': {
      description: '获取项目统计数据',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'ProjectStatsResponse'
      }
    },
    // 项目统计信息
    '/projects/statistics/status': {
      description: '获取用户项目统计信息',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
