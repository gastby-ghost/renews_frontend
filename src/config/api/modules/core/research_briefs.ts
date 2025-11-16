/**
 * 研究简报服务模块API配置
 * 基于 research_briefs.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const researchBriefService: ApiEndpointConfig = {
  name: '研究简报服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/research_briefs',
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
    // Get Project Briefs
    '/projects/{project_id}/briefs': {
      description: 'Get Project Briefs',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'ResearchBriefListResponse',
        statusCode: 200
      }
    },

    // Delete Research Brief
    '/briefs/{brief_id}': {
      description: 'Delete Research Brief',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          brief_id: 'integer - 简报ID (必需)'
        }
      },
      response: {
        dataType: 'ResearchBriefDeleteResponse',
        statusCode: 200
      }
    }
  }
}
