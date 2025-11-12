/**
 * 文档生成服务模块API配置
 * 基于OpenAPI规范自动生成
 * 统一整合文档生成相关功能：scope-agent, title-agent, outline-agent
 */

import type { ApiEndpointConfig } from '../types'

export const documentGenerateService: ApiEndpointConfig = {
  name: '文档生成服务',
  baseUrl: '/api/v1/ai/document_generate',
  methods: ['GET', 'POST'],
  enableMock: true,
  mockPath: '/mock/data/document_generate',
  defaults: {
    timeout: 120000, // AI服务可能需要更长时间，设置为120秒
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 2, // 增加重试次数以配合更长的超时时间
    enableCache: false
  },
  paths: {
    // ========== Scope Agent 服务 ==========
    '/scope-agent/execute': {
      description: 'Execute a scope agent with user and project constraints',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          query: 'string'
        }
      },
      response: {
        dataType: 'ScopeAgentResponse'
      }
    },
    '/scope-agent/status/{task_id}': {
      description: 'Get the status of a scope agent task',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'ScopeAgentStatusResponse'
      }
    },
    '/scope-agent/tasks': {
      description: 'List scope agent tasks for a user, optionally filtered by project',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string | null',
          limit: 'number | null',
          offset: 'number | null'
        }
      },
      response: {
        dataType: 'ScopeAgentListResponse'
      }
    },
    '/scope-agent/cancel/{task_id}': {
      description: 'Cancel a running scope agent task',
      methods: ['POST'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'object'
      }
    },

    // ========== Title Agent 服务 ==========
    '/title-agent/generate': {
      description: 'Generate news titles based on research brief and web search data',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'TitleGenerationResponse'
      }
    },
    '/title-agent/status': {
      description: 'Get the status of title generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'TitleToolsStatusResponse'
      }
    },
    '/title-agent/validate': {
      description: 'Validate title generation request before processing',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // ========== Outline Agent 服务 ==========
    '/outline-agent/generate': {
      description: 'Generate news article outline based on selected title and web search data',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title: 'Title',
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'OutlineGenerationResponse'
      }
    },
    '/outline-agent/status': {
      description: 'Get the status of outline generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'OutlineGenerationStatusResponse'
      }
    },
    '/outline-validate': {
      description: 'Validate outline generation request before processing',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          title: 'Title',
          research_brief: 'string',
          web_search_data: 'SearchResultItem[] | string[]'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // ========== Search2Title Agent 服务 ==========
    '/search2title-agent/execute': {
      description:
        'Execute Search2Title Agent - combines research and title generation in two-phase workflow',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          brief: 'string'
        }
      },
      response: {
        dataType: 'Search2TitleAgentResponse'
      }
    },
    '/search2title-agent/status/{task_id}': {
      description: 'Get the status of a search2title agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'Search2TitleAgentStatusResponse'
      }
    },
    '/search2title-agent/tasks': {
      description: 'List search2title agent tasks for a user',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string | null',
          limit: 'number | null',
          offset: 'number | null'
        }
      },
      response: {
        dataType: 'Search2TitleAgentListResponse'
      }
    },
    '/search2title-agent/cancel/{task_id}': {
      description: 'Cancel a running search2title agent task',
      methods: ['POST'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/search2title-agent/state/{task_id}': {
      description: 'Get the current LangGraph state for a running search2title agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string',
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // ========== Material Bind 服务 ==========
    '/material-bind/execute': {
      description:
        'Execute material binding task to automatically match materials to outline sections',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          title: 'string',
          outline_sections: 'MaterialBindOutlineSection[]',
          materials: 'MaterialBindMaterial[]'
        }
      },
      response: {
        dataType: 'MaterialBindExecuteResponse'
      }
    },
    '/material-bind/status/{task_id}': {
      description: 'Get the status of a material binding task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'MaterialBindStatusResponse'
      }
    }
  }
}
