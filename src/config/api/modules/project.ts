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
      'Content-Type': 'application/json'
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
          page: 'number',
          page_size: 'number',
          status: 'string',
          sort_by: 'string',
          name: 'string',
          description: 'string',
          project_type: 'string',
          settings: 'object'
        }
      },
      response: {
        dataType: 'ProjectListResponse | ProjectResponse'
      }
    },
    // 批量操作项目
    '/projects/batch': {
      description: '批量操作项目',
      methods: ['POST', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_ids: 'number[]',
          operation: 'string'
        }
      },
      response: {
        dataType: 'BatchOperationResponse'
      }
    },
    // 项目详情管理（GET/PUT/PATCH/DELETE）
    '/projects/{project_id}': {
      description: '项目详情管理（获取/更新/删除）',
      methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          name: 'string',
          description: 'string',
          settings: 'object'
        }
      },
      response: {
        dataType: 'ProjectResponse | DeleteResponse'
      }
    },
    // 项目状态管理（GET/PUT）
    '/projects/{project_id}/status': {
      description: '项目状态管理（获取/更新）',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          status: 'string',
          reason: 'string'
        }
      },
      response: {
        dataType: 'ProjectStatusResponse'
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
    }
  }
}
