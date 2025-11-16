/**
 * 标题生成服务模块API配置
 * 基于 titles.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const titleService: ApiEndpointConfig = {
  name: '标题生成服务',
  baseUrl: '/api/v1',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/titles',
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
    // Get Project Title Candidates
    '/api/v1/core/projects/{project_id}/title-candidates': {
      description: 'Get Project Title Candidates',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)',
          status: 'string - 状态筛选（generated/selected/rejected） (可选)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量（最多100） (可选)'
        }
      },
      response: {
        dataType: 'TitleCandidateListResponse',
        statusCode: 200
      }
    },

    // Bulk Create Title Candidates
    '/api/v1/core/projects/{project_id}/title-candidates/bulk': {
      description: 'Bulk Create Title Candidates',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleCandidateCreateBulk - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'TitleCandidateListResponse',
        statusCode: 200
      }
    },

    // Delete Title Candidate
    '/api/v1/core/title-candidates/{candidate_id}': {
      description: 'Delete Title Candidate',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          candidate_id: 'integer - 标题候选ID (必需)'
        }
      },
      response: {
        dataType: 'TitleCandidateDeleteResponse',
        statusCode: 200
      }
    },

    // Select Title Candidate
    '/api/v1/core/title-candidates/{candidate_id}/select': {
      description: 'Select Title Candidate',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleCandidateSelect - 请求体数据结构',
          candidate_id: 'integer - 标题候选ID (必需)'
        }
      },
      response: {
        dataType: 'TitleCandidateSelectResponse',
        statusCode: 200
      }
    },

    // Reject Title Candidate
    '/api/v1/core/title-candidates/{candidate_id}/reject': {
      description: 'Reject Title Candidate',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleCandidateSelect - 请求体数据结构',
          candidate_id: 'integer - 标题候选ID (必需)'
        }
      },
      response: {
        dataType: 'TitleCandidateUpdateResponse',
        statusCode: 200
      }
    },

    // Create Title
    '/api/v1/core/projects/{project_id}/titles': {
      description: 'Create Title',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleCreate - 请求体数据结构',
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'TitleCreateResponse',
        statusCode: 200
      }
    },

    // Get Active Title
    '/api/v1/core/projects/{project_id}/titles/active': {
      description: 'Get Active Title',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)'
        }
      },
      response: {
        dataType: 'TitleDetailResponse',
        statusCode: 200
      }
    },

    // Get Title History
    '/api/v1/core/projects/{project_id}/titles/history': {
      description: 'Get Title History',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          project_id: 'integer - 项目ID (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量（最多100） (可选)'
        }
      },
      response: {
        dataType: 'TitleHistoryResponse',
        statusCode: 200
      }
    },

    // Update Title
    '/api/v1/core/titles/{title_id}': {
      description: 'Update Title',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleUpdate - 请求体数据结构',
          title_id: 'integer - 标题ID (必需)'
        }
      },
      response: {
        dataType: 'TitleUpdateResponse',
        statusCode: 200
      }
    },

    // Activate Title
    '/api/v1/core/titles/{title_id}/activate': {
      description: 'Activate Title',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleActivateRequest - 请求体数据结构',
          title_id: 'integer - 标题ID (必需)'
        }
      },
      response: {
        dataType: 'TitleActivateResponse',
        statusCode: 200
      }
    },

    // Deactivate Title
    '/api/v1/core/titles/{title_id}/deactivate': {
      description: 'Deactivate Title',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: TitleDeactivateRequest - 请求体数据结构',
          title_id: 'integer - 标题ID (必需)'
        }
      },
      response: {
        dataType: 'TitleDeactivateResponse',
        statusCode: 200
      }
    }
  }
}
