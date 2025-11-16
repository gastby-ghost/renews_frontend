/**
 * 项目管理服务模块API配置
 * 基于 project.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const projectService: ApiEndpointConfig = {
  name: '项目管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    // Get User Projects
    '/projects': {
      description: 'Get User Projects',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          page: 'integer - 页码 (可选)',
          page_size: 'integer - 每页数量 (可选)',
          status: 'unknown - 项目状态筛选 (可选)',
          keywords: 'unknown - 关键词搜索（项目名称） (可选)',
          folder_id: 'unknown - 文件夹ID筛选 (可选)'
        }
      },
      response: {
        dataType: 'ProjectListResponse',
        statusCode: 200
      }
    },

    // Update Project
    '/projects/{project_id}': {
      description: 'Update Project',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: ProjectUpdate - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse',
        statusCode: 200
      }
    },

    // Delete Projects
    '/projects/batch': {
      description: 'Delete Projects',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: ProjectDeleteRequest - 请求体数据结构'
        }
      },
      response: {
        dataType: 'ProjectDeleteResponse',
        statusCode: 200
      }
    },

    // Update Project Status
    '/projects/{project_id}/status': {
      description: 'Update Project Status',
      methods: ['PATCH'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: ProjectStatusUpdateRequest - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse',
        statusCode: 200
      }
    },

    // Update Project Component
    '/projects/{project_id}/component': {
      description: 'Update Project Component',
      methods: ['PATCH'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: ProjectComponentUpdateRequest - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'ProjectDetailResponse',
        statusCode: 200
      }
    },

    // Get Project Statistics
    '/projects/statistics/status': {
      description: 'Get Project Statistics',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {}
      },
      response: {
        dataType: 'Response',
        statusCode: 200
      }
    }
  }
}
