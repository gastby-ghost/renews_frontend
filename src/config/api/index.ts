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
import { API_MODULES } from './modules'
import { useUserStore } from '@/store/modules/user'

const STORAGE_KEY = 'api-config'

/**
 * API注册表 - 基于OpenAPI的模块化配置
 */
const API_REGISTRY: ApiRegistry = {
  services: {
    // 基于OpenAPI的模块化服务配置
    ...API_MODULES
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
   * 实现单向逻辑：
   * - 真实用户登录后，切换到mock模式，保持登录状态
   * - mock用户登录后，切换到真实API模式，需要重新登录
   */
  setUseMock(useMock: boolean): void {
    const currentConfig = this.getConfig()

    // 如果模式没有变化，直接返回
    if (currentConfig.useMock === useMock) {
      return
    }

    // 获取用户store，检查当前用户状态
    const userStore = useUserStore()

    // 如果当前有用户登录
    if (userStore.isLogin) {
      const userType = userStore.getUserType

      // 如果是从Mock模式切换到真实API模式，且当前是Mock用户
      if (!useMock && userType === 'mock') {
        console.warn('[API配置] Mock用户无法切换到真实API模式，需要重新登录')

        // 执行登出操作
        userStore.logOut()

        // 显示提示信息
        if (typeof window !== 'undefined') {
          // 使用定时器确保在Vue组件上下文之外执行
          setTimeout(() => {
            alert('Mock用户无法使用真实API，请使用真实账户重新登录')
          }, 100)
        }

        // 不更新配置，保持当前模式
        return
      }

      // 如果是从真实API切换到Mock模式，且当前是真实用户
      if (useMock && userType === 'real') {
        console.log('[API配置] 真实用户切换到Mock模式，保持登录状态')

        // 真实用户可以切换到Mock模式，保持登录状态
        this.updateConfig({ useMock })

        // 显示提示信息
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            console.log('已切换到Mock模式，当前用户数据保持不变')
          }, 100)
        }

        return
      }
    }

    // 如果没有用户登录，直接更新配置
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

    // 添加调试日志：检查路径匹配情况
    if (this.config.showDebugInfo) {
      console.log(`[API配置调试] 查找服务 ${serviceName} 的路径: ${path}`)
      console.log(`[API配置调试] 服务 ${serviceName} 的所有路径:`, Object.keys(service.paths))
    }

    // 首先尝试精确匹配
    let pathConfig = service.paths[path]

    // 如果没有精确匹配，尝试路径参数匹配
    if (!pathConfig) {
      if (this.config.showDebugInfo) {
        console.log(`[API配置调试] 精确匹配失败，尝试路径参数匹配: ${path}`)
      }

      // 查找包含路径参数的配置
      for (const [configPath, config] of Object.entries(service.paths)) {
        if (configPath.includes('{')) {
          // 构建正则表达式来匹配路径参数
          const regexPattern = configPath.replace(/{[^}]+}/g, '([^/]+)')
          const regex = new RegExp(`^${regexPattern}$`)
          if (regex.test(path)) {
            pathConfig = config
            if (this.config.showDebugInfo) {
              console.log(`[API配置调试] 路径参数匹配成功: ${configPath} -> ${path}`)
            }
            break
          }
        }
      }
    }

    if (!pathConfig) {
      console.warn(`[API配置] 服务 ${serviceName} 未找到路径: ${path}`)
      if (this.config.showDebugInfo) {
        console.warn(`[API配置调试] 路径匹配失败详情:`, {
          serviceName,
          requestedPath: path,
          availablePaths: Object.keys(service.paths),
          serviceConfig: service
        })
      }
      return null
    }

    if (this.config.showDebugInfo) {
      console.log(`[API配置调试] 路径匹配成功: ${path} ->`, pathConfig)
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

    // 添加环境变量中的baseURL，确保返回完整URL
    const envBaseUrl = import.meta.env.VITE_API_URL
    if (envBaseUrl && !url.startsWith('http')) {
      url = envBaseUrl.replace(/\/$/, '') + url
    }

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
      const service = this.getServiceConfig(serviceName)
      if (service) {
        result[serviceName] = {
          name: service.name,
          baseUrl: service.baseUrl,
          methods: service.methods,
          paths: Object.keys(service.paths),
          enableMock: service.enableMock,
          mockPath: service.mockPath
        }
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
   * 获取服务列表
   */
  getServices(): string[] {
    return Object.keys(API_MODULES)
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(moduleName: keyof typeof API_MODULES) {
    const service = API_MODULES[moduleName]
    if (!service) return null

    return {
      name: service.name,
      baseUrl: service.baseUrl,
      methods: service.methods,
      paths: Object.keys(service.paths),
      enableMock: service.enableMock,
      mockPath: service.mockPath,
      totalEndpoints: Object.keys(service.paths).length
    }
  }

  /**
   * 获取所有服务信息
   */
  getAllServicesDetailedInfo() {
    const services = this.getServices()
    const allServices = this.getAllServicesInfo()

    return {
      allServices,
      services: services.map((name) => ({
        name,
        ...this.getServiceInfo(name as keyof typeof API_MODULES)
      })),
      totalServices: Object.keys(allServices).length,
      totalApiServices: services.length
    }
  }

  /**
   * 验证模块配置
   */
  validateModules(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    Object.entries(API_MODULES).forEach(([moduleName, service]) => {
      if (!service.name) {
        errors.push(`模块 ${moduleName} 缺少名称`)
      }

      if (!service.baseUrl) {
        errors.push(`模块 ${moduleName} 缺少基础URL`)
      }

      if (!service.methods || service.methods.length === 0) {
        errors.push(`模块 ${moduleName} 缺少HTTP方法配置`)
      }

      if (!service.paths || Object.keys(service.paths).length === 0) {
        errors.push(`模块 ${moduleName} 缺少路径配置`)
      }

      // 检查路径配置
      Object.entries(service.paths).forEach(([path, pathConfig]) => {
        if (!pathConfig.description) {
          errors.push(`模块 ${moduleName} 路径 ${path} 缺少描述`)
        }

        if (!pathConfig.methods || pathConfig.methods.length === 0) {
          errors.push(`模块 ${moduleName} 路径 ${path} 缺少HTTP方法配置`)
        }
      })
    })

    return {
      isValid: errors.length === 0,
      errors
    }
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
export { API_MODULES } from './modules'
