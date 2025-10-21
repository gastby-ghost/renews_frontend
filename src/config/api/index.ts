/**
 * API配置管理器
 * 统一管理API配置和Mock/真实API切换
 */

import type {
  ApiConfig,
  ApiEndpointConfig,
  ApiPathConfig,
  HttpMethod,
  ApiEndpointDefaults,
  ApiRegistry,
  MockDataConfig,
  ApiRequestConfig
} from './types'

const STORAGE_KEY = 'api-config'

/**
 * API注册表 - 集中管理所有API配置
 */
const API_REGISTRY: ApiRegistry = {
  services: {
    // Agent服务配置
    agent: {
      name: 'Agent服务',
      baseUrl: '/api/agent',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      enableMock: true,
      mockPath: '/mock/data/agent',
      defaults: {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        },
        retryCount: 2,
        enableCache: false
      },
      paths: {
        // 获取可用Agent服务
        '/services': {
          description: '获取可用的Agent服务列表',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'AgentService[]'
          }
        },
        // Agent搜索
        '/search': {
          description: '使用Agent进行搜索',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              keywords: 'string',
              agentType: 'string',
              filters: 'object'
            }
          },
          response: {
            dataType: 'AgentSearchResult'
          }
        },
        // Agent任务管理
        '/tasks': {
          description: 'Agent任务管理',
          methods: ['POST', 'GET'],
          request: {
            bodyType: 'json',
            requireAuth: true
          },
          response: {
            dataType: 'AgentTask | AgentTask[]'
          }
        },
        // 具体任务操作
        '/tasks/{taskId}': {
          description: '获取或取消特定Agent任务',
          methods: ['GET', 'POST'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'AgentTask'
          }
        },
        // 任务历史
        '/tasks/history': {
          description: '获取Agent任务历史',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'AgentTask[]'
          }
        },
        // Agent推荐
        '/recommendations/{materialId}': {
          description: '获取Agent推荐内容',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'Material[]'
          }
        },
        // 内容分析
        '/analyze/{materialId}': {
          description: '分析素材内容',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'AnalysisResult'
          }
        },
        // Agent能力配置
        '/capabilities': {
          description: '获取Agent能力配置',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'Record<string, string[]>'
          }
        }
      }
    },

    // 素材管理服务配置
    material: {
      name: '素材管理服务',
      baseUrl: '/api/v1/core',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      enableMock: true,
      mockPath: '/mock/data/material',
      defaults: {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        retryCount: 3,
        enableCache: true
      },
      paths: {
        // 批量创建素材
        '/materials/batch': {
          description: '批量创建素材',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              project_id: 'number',
              materials: 'CompleteMaterialData[]'
            }
          },
          response: {
            dataType: 'MaterialListResponse'
          }
        },
        // 获取项目素材
        '/projects/{projectId}/materials': {
          description: '获取项目素材列表',
          methods: ['GET'],
          request: {
            requireAuth: true,
            params: {
              page: 'number',
              page_size: 'number',
              keywords: 'string',
              tags: 'string[]'
            }
          },
          response: {
            dataType: 'MaterialListResponse'
          }
        },
        // 获取所有素材
        '/materials/list': {
          description: '获取所有素材列表',
          methods: ['GET'],
          request: {
            requireAuth: true,
            params: {
              page: 'number',
              page_size: 'number',
              keywords: 'string',
              tags: 'string[]'
            }
          },
          response: {
            dataType: 'MaterialListResponse'
          }
        },
        // 更新素材
        '/materials/{materialId}': {
          description: '更新素材',
          methods: ['PUT'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              update_data: 'Partial<MaterialCreateRequest>'
            }
          },
          response: {
            dataType: 'MaterialResponse'
          }
        },
        // 删除素材
        '/materials': {
          description: '批量删除素材',
          methods: ['DELETE'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              material_ids: 'number[]'
            }
          },
          response: {
            dataType: 'MaterialDeleteResponse'
          }
        },
        // 标签管理
        '/tags': {
          description: '标签管理',
          methods: ['GET', 'POST'],
          request: {
            bodyType: 'json',
            requireAuth: true
          },
          response: {
            dataType: 'TagResponse | TagResponse[]'
          }
        }
      }
    },

    // 搜索服务配置
    search: {
      name: '搜索服务',
      baseUrl: '/api/materials',
      methods: ['GET', 'POST', 'DELETE'],
      enableMock: true,
      mockPath: '/mock/data/search',
      defaults: {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        },
        retryCount: 1,
        enableCache: false
      },
      paths: {
        // 通用搜索
        '/search': {
          description: '通用搜索接口',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              keywords: 'string',
              providers: 'string[]',
              searchScope: 'string',
              filters: 'object'
            }
          },
          response: {
            dataType: 'SearchResult'
          }
        },
        // 提供商搜索
        '/search/{providerId}': {
          description: '通过指定提供商搜索',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true
          },
          response: {
            dataType: 'SearchResult'
          }
        },
        // 获取提供商列表
        '/providers': {
          description: '获取搜索提供商列表',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'SearchProvider[]'
          }
        },
        // 素材库操作
        '/add-to-library': {
          description: '添加到素材库',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true
          }
        },
        '/remove-from-library': {
          description: '从素材库删除',
          methods: ['DELETE'],
          request: {
            bodyType: 'json',
            requireAuth: true
          }
        },
        '/library': {
          description: '获取素材库内容',
          methods: ['GET'],
          request: {
            requireAuth: true,
            params: {
              type: 'string',
              source: 'string',
              tags: 'string[]',
              search: 'string'
            }
          },
          response: {
            dataType: 'SearchResult'
          }
        },
        // 下载素材
        '/{materialId}/download': {
          description: '下载素材',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: '{ url: string }'
          }
        },
        // 素材详情
        '/{materialId}': {
          description: '获取素材详情',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'Material'
          }
        }
      }
    },

    // Search Agent服务配置
    searchAgent: {
      name: 'Search Agent服务',
      baseUrl: '/api/v1/ai/search-agent',
      methods: ['GET', 'POST'],
      enableMock: true,
      mockPath: '/mock/data/agent',
      defaults: {
        timeout: 300000, // 5分钟超时
        headers: {
          'Content-Type': 'application/json'
        },
        retryCount: 1,
        enableCache: false
      },
      paths: {
        // 执行Agent搜索
        '/execute': {
          description: '执行Search Agent搜索',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              brief: 'string',
              max_concurrent_research_units: 'number',
              max_researcher_iterations: 'number'
            }
          },
          response: {
            dataType: 'SearchAgentResponse'
          }
        },
        // 查询任务状态
        '/status/{taskId}': {
          description: '查询Agent任务状态',
          methods: ['GET'],
          request: {
            requireAuth: true,
            params: {
              user_id: 'string',
              project_id: 'string'
            }
          },
          response: {
            dataType: 'SearchAgentStatusResponse'
          }
        },
        // 取消任务
        '/cancel/{taskId}': {
          description: '取消Agent任务',
          methods: ['POST'],
          request: {
            requireAuth: true,
            params: {
              user_id: 'string',
              project_id: 'string'
            }
          }
        }
      }
    },

    // Search Tools服务配置
    searchTools: {
      name: 'Search Tools服务',
      baseUrl: '/api/v1/ai/search-tools',
      methods: ['GET', 'POST'],
      enableMock: true,
      mockPath: '/mock/data/search',
      defaults: {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        },
        retryCount: 2,
        enableCache: false
      },
      paths: {
        // 搜索工具搜索
        '/search': {
          description: '使用搜索工具进行搜索',
          methods: ['POST'],
          request: {
            bodyType: 'json',
            requireAuth: true,
            params: {
              queries: 'string[]',
              provider: 'tavily | bocha',
              max_results: 'number',
              enable_structured_summaries: 'boolean',
              summarization_model: 'string'
            }
          },
          response: {
            dataType: 'SearchToolsResponse'
          }
        },
        // 检查状态
        '/status': {
          description: '检查搜索工具状态',
          methods: ['GET'],
          request: {
            requireAuth: true
          },
          response: {
            dataType: 'SearchToolsStatusResponse'
          }
        }
      }
    }
  },
  globalDefaults: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },
    retryCount: 2,
    enableCache: false
  },
  mockConfig: {
    version: '1.0.0',
    defaultDelay: 1000,
    randomDelay: true,
    delayRange: [500, 2000]
  }
}

class ApiConfigManager {
  private config: ApiConfig
  private listeners: Array<(config: ApiConfig) => void> = []

  constructor() {
    this.config = this.initConfig()
    this.loadFromStorage()
  }

  /**
   * 初始化默认配置
   */
  private initConfig(): ApiConfig {
    return {
      useMock: import.meta.env.VITE_USE_MOCK === 'true',
      mockDelay: parseInt(import.meta.env.VITE_MOCK_DELAY || '1000'),
      showDebugInfo: import.meta.env.VITE_API_DEBUG === 'true' || import.meta.env.DEV
    }
  }

  /**
   * 从本地存储加载配置
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedConfig = JSON.parse(stored)
        this.config = { ...this.config, ...parsedConfig }
      }
    } catch (error) {
      console.warn('加载API配置失败:', error)
    }
  }

  /**
   * 保存配置到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.warn('保存API配置失败:', error)
    }
  }

  /**
   * 通知配置变更
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getConfig()))
  }

  /**
   * 获取当前配置
   */
  getConfig(): ApiConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveToStorage()
    this.notifyListeners()

    if (this.config.showDebugInfo) {
      console.log('[API配置] 配置已更新:', this.config)
    }
  }

  /**
   * 设置是否使用Mock数据
   */
  setUseMock(useMock: boolean): void {
    this.updateConfig({ useMock })
  }

  /**
   * 设置Mock延迟时间
   */
  setMockDelay(delay: number): void {
    this.updateConfig({ mockDelay: Math.max(0, delay) })
  }

  /**
   * 设置是否显示调试信息
   */
  setShowDebugInfo(show: boolean): void {
    this.updateConfig({ showDebugInfo: show })
  }

  /**
   * 获取API注册表
   */
  getApiRegistry(): ApiRegistry {
    return API_REGISTRY
  }

  /**
   * 获取指定服务的配置
   */
  getServiceConfig(serviceName: string): ApiEndpointConfig | null {
    const service = API_REGISTRY.services[serviceName]
    if (!service) {
      console.warn(`[API配置] 未找到服务: ${serviceName}`)
      return null
    }
    return service
  }

  /**
   * 获取指定服务的路径配置
   */
  getPathConfig(serviceName: string, path: string): ApiPathConfig | null {
    const service = this.getServiceConfig(serviceName)
    if (!service) return null

    const pathConfig = service.paths[path]
    if (!pathConfig) {
      console.warn(`[API配置] 服务 ${serviceName} 未找到路径: ${path}`)
      return null
    }

    return pathConfig
  }

  /**
   * 检查路径是否支持指定HTTP方法
   */
  isMethodSupported(serviceName: string, path: string, method: HttpMethod): boolean {
    const pathConfig = this.getPathConfig(serviceName, path)
    if (!pathConfig) return false

    return pathConfig.methods.includes(method)
  }

  /**
   * 获取服务支持的所有HTTP方法
   */
  getServiceMethods(serviceName: string): HttpMethod[] {
    const service = this.getServiceConfig(serviceName)
    if (!service) return []

    return service.methods
  }

  /**
   * 获取路径支持的所有HTTP方法
   */
  getPathMethods(serviceName: string, path: string): HttpMethod[] {
    const pathConfig = this.getPathConfig(serviceName, path)
    if (!pathConfig) return []

    return pathConfig.methods
  }

  /**
   * 构建完整的API URL
   */
  buildApiUrl(serviceName: string, path: string, params?: Record<string, string>): string {
    const service = this.getServiceConfig(serviceName)
    if (!service) return path

    let url = service.baseUrl + path

    // 替换路径参数
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value)
      })
    }

    return url
  }

  /**
   * 获取服务默认配置
   */
  getServiceDefaults(serviceName: string): ApiEndpointDefaults {
    const service = this.getServiceConfig(serviceName)
    if (!service) return API_REGISTRY.globalDefaults

    return {
      ...API_REGISTRY.globalDefaults,
      ...service.defaults
    }
  }

  /**
   * 获取Mock配置
   */
  getMockConfig(): MockDataConfig {
    return API_REGISTRY.mockConfig
  }

  /**
   * 检查服务是否启用Mock
   */
  isServiceMockEnabled(serviceName: string): boolean {
    const service = this.getServiceConfig(serviceName)
    if (!service) return false

    return service.enableMock && this.config.useMock
  }

  /**
   * 获取所有服务列表
   */
  getAllServices(): string[] {
    return Object.keys(API_REGISTRY.services)
  }

  /**
   * 获取服务的所有路径
   */
  getServicePaths(serviceName: string): string[] {
    const service = this.getServiceConfig(serviceName)
    if (!service) return []

    return Object.keys(service.paths)
  }

  /**
   * 获取服务信息摘要
   */
  getServiceInfo(serviceName: string): {
    name: string
    baseUrl: string
    methods: HttpMethod[]
    paths: string[]
    enableMock: boolean
    mockPath: string
  } | null {
    const service = this.getServiceConfig(serviceName)
    if (!service) return null

    return {
      name: service.name,
      baseUrl: service.baseUrl,
      methods: service.methods,
      paths: Object.keys(service.paths),
      enableMock: service.enableMock,
      mockPath: service.mockPath
    }
  }

  /**
   * 获取所有服务的摘要信息
   */
  getAllServicesInfo(): Record<
    string,
    {
      name: string
      baseUrl: string
      methods: HttpMethod[]
      paths: string[]
      enableMock: boolean
      mockPath: string
    }
  > {
    const result: Record<string, any> = {}

    this.getAllServices().forEach((serviceName) => {
      const info = this.getServiceInfo(serviceName)
      if (info) {
        result[serviceName] = info
      }
    })

    return result
  }

  /**
   * 验证API配置
   */
  validateApiConfig(): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // 检查每个服务配置
    Object.entries(API_REGISTRY.services).forEach(([serviceName, service]) => {
      if (!service.name) {
        errors.push(`服务 ${serviceName} 缺少名称`)
      }

      if (!service.baseUrl) {
        errors.push(`服务 ${serviceName} 缺少基础URL`)
      }

      if (!service.methods || service.methods.length === 0) {
        errors.push(`服务 ${serviceName} 缺少HTTP方法配置`)
      }

      if (!service.paths || Object.keys(service.paths).length === 0) {
        errors.push(`服务 ${serviceName} 缺少路径配置`)
      }

      // 检查路径配置
      Object.entries(service.paths).forEach(([path, pathConfig]) => {
        if (!pathConfig.description) {
          errors.push(`服务 ${serviceName} 路径 ${path} 缺少描述`)
        }

        if (!pathConfig.methods || pathConfig.methods.length === 0) {
          errors.push(`服务 ${serviceName} 路径 ${path} 缺少HTTP方法配置`)
        }

        // 检查方法是否在服务支持的方法列表中
        pathConfig.methods.forEach((method) => {
          if (!service.methods.includes(method)) {
            errors.push(
              `服务 ${serviceName} 路径 ${path} 的方法 ${method} 不在服务支持的方法列表中`
            )
          }
        })
      })
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 重置配置为默认值
   */
  resetToDefault(): void {
    this.config = this.initConfig()
    this.saveToStorage()
    this.notifyListeners()

    if (this.config.showDebugInfo) {
      console.log('[API配置] 配置已重置为默认值')
    }
  }

  /**
   * 添加配置变更监听器
   */
  addChangeListener(listener: (config: ApiConfig) => void): void {
    this.listeners.push(listener)
  }

  /**
   * 移除配置变更监听器
   */
  removeChangeListener(listener: (config: ApiConfig) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify(
      {
        config: this.config,
        registry: API_REGISTRY
      },
      null,
      2
    )
  }

  /**
   * 导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson)

      if (imported.config) {
        this.updateConfig(imported.config)
      }

      if (this.config.showDebugInfo) {
        console.log('[API配置] 配置已导入:', imported)
      }

      return true
    } catch (error) {
      console.error('导入API配置失败:', error)
      return false
    }
  }
}

// 创建全局单例实例
export const apiConfigManager = new ApiConfigManager()

// 导出类型和实例
export type {
  ApiConfig,
  ApiEndpointConfig,
  ApiPathConfig,
  HttpMethod,
  ApiEndpointDefaults,
  ApiRegistry,
  MockDataConfig,
  ApiRequestConfig
}
export { ApiConfigManager }
export { API_REGISTRY }
