/**
 * 需求管理服务模块API配置
 * 基于 requirements.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const requirementService: ApiEndpointConfig = {
  name: '需求管理服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/requirements',
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
    // Get Project Requirements
    '/projects/{project_id}/requirements': {
      description: 'Get Project Requirements',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'RequirementListResponse',
        statusCode: 200
      }
    },

    // Delete Requirement
    '/requirements/{requirement_id}': {
      description: 'Delete Requirement',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          requirement_id: 'integer - 需求ID (必需)'
        }
      },
      response: {
        dataType: 'RequirementDeleteResponse',
        statusCode: 200
      }
    }
  }
}
