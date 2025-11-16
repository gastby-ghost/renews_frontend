/**
 * 素材关联服务模块API配置
 * 基于 material-relations.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../../types'

export const materialRelationService: ApiEndpointConfig = {
  name: '素材关联服务',
  baseUrl: '/api/v1',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/material-relations',
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
    // Get Title Materials
    '/api/v1/core/material-relations/titles/{title_candidate_id}/materials': {
      description: 'Get Title Materials',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title_candidate_id: 'integer - title_candidate_id (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量 (可选)'
        }
      },
      response: {
        dataType: 'MaterialTitleListResponse',
        statusCode: 200
      }
    },

    // Unbind Material From Title
    '/api/v1/core/material-relations/titles/{title_candidate_id}/materials/{material_id}': {
      description: 'Unbind Material From Title',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title_candidate_id: 'integer - title_candidate_id (必需)',
          material_id: 'integer - material_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialUnbindResponse',
        statusCode: 200
      }
    },

    // Update Title Relevance Score
    '/api/v1/core/material-relations/titles/relations/{relation_id}/score': {
      description: 'Update Title Relevance Score',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialTitleUpdateScoreRequest - 请求体数据结构',
          relation_id: 'integer - relation_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialUpdateResponse',
        statusCode: 200
      }
    },

    // Get Section Materials
    '/api/v1/core/material-relations/sections/{outline_section_id}/materials': {
      description: 'Get Section Materials',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          outline_section_id: 'integer - outline_section_id (必需)',
          skip: 'integer - 跳过数量 (可选)',
          limit: 'integer - 返回数量 (可选)'
        }
      },
      response: {
        dataType: 'MaterialSectionListResponse',
        statusCode: 200
      }
    },

    // Unbind Material From Section
    '/api/v1/core/material-relations/sections/{outline_section_id}/materials/{material_id}': {
      description: 'Unbind Material From Section',
      methods: ['DELETE'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          outline_section_id: 'integer - outline_section_id (必需)',
          material_id: 'integer - material_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialUnbindResponse',
        statusCode: 200
      }
    },

    // Update Section Binding Type
    '/api/v1/core/material-relations/sections/relations/{relation_id}/binding-type': {
      description: 'Update Section Binding Type',
      methods: ['PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialSectionUpdateTypeRequest - 请求体数据结构',
          relation_id: 'integer - relation_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialUpdateResponse',
        statusCode: 200
      }
    },

    // Get Material All Relations
    '/api/v1/core/material-relations/materials/{material_id}/relations': {
      description: 'Get Material All Relations',
      methods: ['GET'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          material_id: 'integer - material_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialRelationsResponse',
        statusCode: 200
      }
    },

    // Batch Bind Materials To Title
    '/api/v1/core/material-relations/titles/{title_candidate_id}/materials/batch': {
      description: 'Batch Bind Materials To Title',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialBatchBindTitleRequest - 请求体数据结构',
          title_candidate_id: 'integer - title_candidate_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialBatchResponse',
        statusCode: 200
      }
    },

    // Batch Bind Materials To Section
    '/api/v1/core/material-relations/sections/{outline_section_id}/materials/batch': {
      description: 'Batch Bind Materials To Section',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialBatchBindSectionRequest - 请求体数据结构',
          outline_section_id: 'integer - outline_section_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialBatchResponse',
        statusCode: 200
      }
    },

    // Batch Unbind Materials From Title
    '/api/v1/core/material-relations/titles/{title_candidate_id}/materials/batch-unbind': {
      description: 'Batch Unbind Materials From Title',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialBatchUnbindRequest - 请求体数据结构',
          title_candidate_id: 'integer - title_candidate_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialBatchResponse',
        statusCode: 200
      }
    },

    // Batch Unbind Materials From Section
    '/api/v1/core/material-relations/sections/{outline_section_id}/materials/batch-unbind': {
      description: 'Batch Unbind Materials From Section',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          body: 'schema: MaterialBatchUnbindRequest - 请求体数据结构',
          outline_section_id: 'integer - outline_section_id (必需)'
        }
      },
      response: {
        dataType: 'MaterialBatchResponse',
        statusCode: 200
      }
    }
  }
}
