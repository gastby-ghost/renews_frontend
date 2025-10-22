/**
 * AI服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含网页总结、检索、搜索工具、标题生成、大纲生成等功能
 */

import type { ApiEndpointConfig } from '../types'

export const aiService: ApiEndpointConfig = {
  name: 'AI智能服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 30000, // AI服务可能需要更长时间
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: false
  },
  paths: {
    // 网页总结服务
    '/webpage-summary/summarize-async': {
      description: '异步网页总结 - 创建Celery异步任务进行网页内容总结',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          url: 'string',
          model_name: 'string',
          max_tokens: 'number',
          scraping_timeout: 'number',
          max_content_length: 'number',
          target_format: 'object'
        }
      },
      response: {
        dataType: 'WebpageSummaryAsyncResponse'
      }
    },
    '/webpage-summary/status/{task_id}': {
      description: '获取网页总结任务状态',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'WebpageSummaryStatusResponse'
      }
    },

    // 检索服务
    '/retrieval/search': {
      description: '通用直连搜索接口，可指定搜索引擎或使用默认配置',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          q: 'string',
          provider: 'string',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          count: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/retrieval/agent-search-async': {
      description: '创建检索Agent的Celery异步任务',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          q: 'string',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          count: 'number'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/retrieval/status/{task_id}': {
      description: '查询检索相关任务的Celery任务状态',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // 任务管理
    '/tasks/{task_id}/cancel': {
      description: '基于task_id撤销/中断Celery异步任务',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          task_id: 'string',
          terminate: 'boolean',
          signal: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // Scope Agent服务
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
        requireAuth: true,
        params: {
          task_id: 'string'
        }
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
          project_id: 'string',
          limit: 'number',
          offset: 'number'
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
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },
    '/scope-agent/state/{task_id}': {
      description: 'Get the LangGraph state for a running scope agent task',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          task_id: 'string'
        }
      },
      response: {
        dataType: 'object'
      }
    },

    // Search Agent服务
    '/search-agent/execute': {
      description: 'Execute a search agent with user and project constraints',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string',
          brief: 'string',
          max_concurrent_research_units: 'number',
          max_researcher_iterations: 'number'
        }
      },
      response: {
        dataType: 'SearchAgentResponse'
      }
    },
    '/search-agent/status/{task_id}': {
      description: 'Get the status of a search agent task',
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
        dataType: 'SearchAgentStatusResponse'
      }
    },
    '/search-agent/tasks': {
      description: 'List search agent tasks for a user',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          user_id: 'string',
          project_id: 'string'
        }
      },
      response: {
        dataType: 'SearchAgentListResponse'
      }
    },
    '/search-agent/cancel/{task_id}': {
      description: 'Cancel a running search agent task',
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
    '/search-agent/state/{task_id}': {
      description: 'Get the current LangGraph state for a running search agent task',
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

    // 搜索工具服务
    '/search-tools/search': {
      description: 'Execute search using the specified provider',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          queries: 'string[]',
          max_results: 'number',
          enable_structured_summaries: 'boolean',
          summarization_model: 'string',
          max_content_length: 'number',
          topic: 'string',
          include_raw_content: 'boolean',
          freshness: 'string',
          summary: 'boolean',
          include: 'string',
          exclude: 'string',
          provider: 'string'
        }
      },
      response: {
        dataType: 'SearchToolsResponse'
      }
    },
    '/search-tools/status': {
      description: 'Check the configuration status of search tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'SearchToolsStatusResponse'
      }
    },
    '/search-tools/providers': {
      description: 'Get information about available search providers',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'object'
      }
    },

    // 标题生成服务
    '/title-generate/generate': {
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
    '/title-generate/status': {
      description: 'Get the status of title generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'TitleToolsStatusResponse'
      }
    },
    '/title-generate/validate': {
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

    // 大纲生成服务
    '/outline-generate/generate': {
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
    '/outline-generate/status': {
      description: 'Get the status of outline generation tools',
      methods: ['GET'],
      request: {
        requireAuth: true
      },
      response: {
        dataType: 'OutlineGenerationStatusResponse'
      }
    },
    '/outline-generate/validate': {
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

    // 系统健康检查
    '/health': {
      description: '健康检查端点，同时检查Celery连接',
      methods: ['GET'],
      request: {
        requireAuth: false
      },
      response: {
        dataType: 'object'
      }
    }
  }
}
