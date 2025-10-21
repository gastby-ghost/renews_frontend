/**
 * 自动保存模块API配置
 * 基于OpenAPI规范自动生成
 */

import type { ApiEndpointConfig } from '../types'

export const autosaveService: ApiEndpointConfig = {
  name: '自动保存服务',
  baseUrl: '/api/v1/core',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/autosave',
  defaults: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: false
  },
  paths: {
    // 自动保存内容管理（GET/POST/PUT/DELETE）
    '/auto-save/{project_id}': {
      description: '自动保存内容管理（获取/保存/更新/删除）',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      request: {
        requireAuth: true,
        params: {
          content_type: 'string',
          content: 'string',
          metadata: 'object'
        }
      },
      response: {
        dataType: 'AutoSaveContentResponse | AutoSaveResponse | DeleteResponse'
      }
    },
    // 获取自动保存历史
    '/auto-save/{project_id}/history': {
      description: '获取自动保存历史记录',
      methods: ['GET'],
      request: {
        requireAuth: true,
        params: {
          limit: 'number',
          content_type: 'string'
        }
      },
      response: {
        dataType: 'AutoSaveHistoryResponse'
      }
    },
    // 恢复自动保存内容
    '/auto-save/{project_id}/restore': {
      description: '从自动保存恢复内容',
      methods: ['POST'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          version_id: 'string',
          content_type: 'string'
        }
      },
      response: {
        dataType: 'AutoSaveRestoreResponse'
      }
    },
    // 清理过期自动保存
    '/auto-save/cleanup': {
      description: '清理过期的自动保存内容',
      methods: ['POST'],
      request: {
        requireAuth: true,
        params: {
          days_to_keep: 'number'
        }
      },
      response: {
        dataType: 'CleanupResponse'
      }
    },
    // 自动保存设置管理（GET/PUT）
    '/auto-save/settings': {
      description: '自动保存设置管理（获取/更新）',
      methods: ['GET', 'PUT'],
      request: {
        bodyType: 'json',
        requireAuth: true,
        params: {
          enabled: 'boolean',
          interval: 'number',
          max_versions: 'number'
        }
      },
      response: {
        dataType: 'AutoSaveSettingsResponse'
      }
    }
  }
}
