/**
 * 基础API服务类
 * 提供统一的API调用接口和Mock/真实API切换逻辑
 */

import { apiConfigManager } from '@/config/api'
import type {
  ApiRequestConfig,
  HttpMethod,
  ApiEndpointConfig,
  ApiPathConfig
} from '@/config/api/types'
import http from '@/utils/http'

// 动态导入Mock路由（仅在需要时加载）
let mockRoutes: typeof import('@/mock/data/document-generate/mock-routes') | null = null

async function loadMockRoutes() {
  if (!mockRoutes) {
    console.log('[MOCK调试] 正在加载 Mock 路由模块...')
    try {
      mockRoutes = await import('@/mock/data/document-generate/mock-routes')
      console.log('[MOCK调试] Mock 路由模块加载完成')
      console.log('[MOCK调试] 模块导出:', Object.keys(mockRoutes))

      // 验证必要的函数是否存在
      if (typeof mockRoutes.getMockHandler !== 'function') {
        console.error('[MOCK调试] 错误: getMockHandler 函数未找到')
        throw new Error('getMockHandler 函数未在mock-routes模块中导出')
      }

      if (!mockRoutes.mockRoutes || !(mockRoutes.mockRoutes instanceof Map)) {
        console.error('[MOCK调试] 错误: mockRoutes Map 未找到或格式不正确')
        throw new Error('mockRoutes Map 未在mock-routes模块中正确导出')
      }

      console.log('[MOCK调试] Mock路由数量:', mockRoutes.mockRoutes.size)
    } catch (error) {
      console.error('[MOCK调试] Mock路由模块加载失败:', error)
      throw error
    }
  }
  return mockRoutes
}

abstract class BaseApiService {
  protected serviceName: string
  private serviceConfig: ApiEndpointConfig | null = null

  constructor(serviceName: string) {
    this.serviceName = serviceName
    this.serviceConfig = apiConfigManager.getServiceConfig(serviceName)

    if (!this.serviceConfig) {
      throw new Error(`服务配置未找到: ${serviceName}`)
    }
  }

  /**
   * 统一请求方法
   * @param config 请求配置
   * @returns Promise<T>
   */
  protected async request<T>(config: ApiRequestConfig): Promise<T> {
    const apiConfig = apiConfigManager.getConfig()

    // 检查是否启用Mock模式
    if (config.useMock !== false && apiConfig.useMock && this.mockImplementation) {
      return this.handleMockRequest<T>(config)
    }

    // 使用真实API
    return this.handleRealRequest<T>(config)
  }

  /**
   * 处理Mock请求
   */
  private async handleMockRequest<T>(config: ApiRequestConfig): Promise<T> {
    const apiConfig = apiConfigManager.getConfig()
    const mockConfig = apiConfigManager.getMockConfig()

    console.log(`[MOCK调试] handleMockRequest - 请求配置:`, config)
    console.log(`[MOCK调试] API配置:`, apiConfig)
    console.log(`[MOCK调试] Mock配置:`, mockConfig)

    // 模拟网络延迟
    await this.simulateDelay(apiConfig.mockDelay || mockConfig.defaultDelay)

    // 优先尝试路由式Mock
    const routeMockResult = await this.handleRouteMock(config)
    if (routeMockResult !== null) {
      console.log(`[MOCK调试] 路由式Mock结果:`, routeMockResult)
      return routeMockResult as T
    }

    // 回退到传统Mock实现
    const result = await this.mockImplementation?.(config)
    console.log(`[MOCK调试] 传统Mock结果:`, result)

    return result as T
  }

  /**
   * 处理路由式Mock
   */
  private async handleRouteMock(config: ApiRequestConfig): Promise<any> {
    try {
      console.log(`[MOCK调试] 开始处理路由式Mock...`)
      const { getMockHandler } = await loadMockRoutes()
      console.log(`[MOCK调试] handleRouteMock - 原始请求: ${config.method} ${config.url}`)

      // 构建路由键值用于匹配
      const routeConfig = { method: config.method, url: config.url }
      console.log(`[MOCK调试] 路由配置:`, routeConfig)

      const mockHandler = getMockHandler(routeConfig)

      console.log(`[MOCK调试] getMockHandler 返回:`, mockHandler ? '找到处理器' : '未找到处理器')

      if (mockHandler) {
        console.log(`[MOCK调试] 使用路由式Mock处理器`)
        // Mock处理函数需要两个参数：url 和 requestData
        console.log(`[MOCK调试] 路由式Mock匹配路径:`, config.url)
        const result = mockHandler(config.url, config as any)
        console.log(`[MOCK调试] 路由式Mock处理结果:`, result)
        return result
      } else {
        console.log(`[MOCK调试] 未找到匹配的路由式Mock，将回退到传统Mock`)
        if (mockRoutes) {
          console.log(`[MOCK调试] 可用路由:`, Array.from(mockRoutes.mockRoutes.keys()))
        } else {
          console.log(`[MOCK调试] Mock路由模块未加载`)
        }
      }
    } catch (error) {
      // Mock路由加载失败，返回null使用传统Mock
      console.warn('[MOCK调试] Mock路由加载失败，回退到传统Mock实现:', error)
      console.warn('[MOCK调试] 错误详情:', error instanceof Error ? error.message : String(error))
    }

    return null
  }

  /**
   * 处理真实API请求
   */
  private async handleRealRequest<T>(config: ApiRequestConfig): Promise<T> {
    const serviceDefaults = this.getServiceDefaults()

    // 构建HTTP请求配置
    const httpConfig = {
      url: config.url,
      method: config.method as any,
      data: config.data,
      params: config.params,
      headers: {
        ...serviceDefaults.headers,
        ...config.headers
      },
      timeout: config.timeout || serviceDefaults.timeout
    }

    const result: T = await http.request<T>(httpConfig)
    return result
  }

  /**
   * 模拟网络延迟
   */
  private async simulateDelay(baseDelay: number): Promise<void> {
    const mockConfig = apiConfigManager.getMockConfig()

    // 如果启用随机延迟
    if (mockConfig.randomDelay) {
      const [minDelay, maxDelay] = mockConfig.delayRange
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay
      return new Promise((resolve) => setTimeout(resolve, randomDelay))
    }

    return new Promise((resolve) => setTimeout(resolve, baseDelay))
  }

  /**
   * Mock实现方法（子类需要重写）
   * 现在作为路由式Mock的回退方案
   */
  protected async mockImplementation?(_config: ApiRequestConfig): Promise<any> {
    // 默认Mock响应，不再抛出错误
    return {
      success: true,
      message: `默认Mock响应 - ${_config.method} ${_config.url}`,
      data: {
        mock: true,
        timestamp: Date.now(),
        service: this.serviceName,
        note: '使用默认Mock实现，建议配置具体Mock路由'
      }
    }
  }

  /**
   * 验证API请求
   */
  protected validateRequest(path: string, method: HttpMethod): void {
    if (!apiConfigManager.isMethodSupported(this.serviceName, path, method)) {
      throw new Error(
        `API请求验证失败: 服务 ${this.serviceName} 的路径 ${path} 不支持方法 ${method}`
      )
    }
  }

  /**
   * 构建完整的API URL
   */
  protected buildUrl(path: string, pathParams?: Record<string, string>): string {
    return apiConfigManager.buildApiUrl(this.serviceName, path, pathParams)
  }

  /**
   * 获取API端点URL
   */
  protected getEndpoint(path: string = ''): string {
    if (this.serviceConfig) {
      return this.serviceConfig.baseUrl + path
    }
    return path
  }

  /**
   * 获取Mock数据路径
   */
  protected getMockPath(path: string = ''): string {
    if (this.serviceConfig) {
      return this.serviceConfig.mockPath + path
    }
    return path
  }

  /**
   * 获取路径配置
   */
  protected getPathConfig(path: string): ApiPathConfig | null {
    return apiConfigManager.getPathConfig(this.serviceName, path)
  }

  /**
   * 获取服务默认配置
   */
  protected getServiceDefaults() {
    return apiConfigManager.getServiceDefaults(this.serviceName)
  }

  /**
   * GET请求
   */
  protected async get<T>(
    path: string,
    params?: any,
    options?: Partial<ApiRequestConfig>
  ): Promise<T> {
    this.validateRequest(path, 'GET')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'GET',
      params,
      ...options
    })
  }

  /**
   * POST请求
   */
  protected async post<T>(
    path: string,
    data?: any,
    options?: Partial<ApiRequestConfig>
  ): Promise<T> {
    this.validateRequest(path, 'POST')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'POST',
      data,
      ...options
    })
  }

  /**
   * PUT请求
   */
  protected async put<T>(
    path: string,
    data?: any,
    options?: Partial<ApiRequestConfig>
  ): Promise<T> {
    this.validateRequest(path, 'PUT')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'PUT',
      data,
      ...options
    })
  }

  /**
   * DELETE请求
   */
  protected async delete<T>(
    path: string,
    data?: any,
    options?: Partial<ApiRequestConfig>
  ): Promise<T> {
    this.validateRequest(path, 'DELETE')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'DELETE',
      data,
      ...options
    })
  }

  /**
   * PATCH请求
   */
  protected async patch<T>(
    path: string,
    data?: any,
    options?: Partial<ApiRequestConfig>
  ): Promise<T> {
    this.validateRequest(path, 'PATCH')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'PATCH',
      data,
      ...options
    })
  }

  /**
   * HEAD请求
   */
  protected async head<T>(path: string, options?: Partial<ApiRequestConfig>): Promise<T> {
    this.validateRequest(path, 'HEAD')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'HEAD',
      ...options
    })
  }

  /**
   * OPTIONS请求
   */
  protected async options<T>(path: string, options?: Partial<ApiRequestConfig>): Promise<T> {
    this.validateRequest(path, 'OPTIONS')

    return this.request<T>({
      url: this.buildUrl(path),
      method: 'OPTIONS',
      ...options
    })
  }

  /**
   * 检查当前是否使用Mock模式
   */
  protected isMockMode(): boolean {
    return apiConfigManager.isServiceMockEnabled(this.serviceName)
  }

  /**
   * 获取当前配置
   */
  protected getCurrentConfig() {
    return apiConfigManager.getConfig()
  }

  /**
   * 获取服务配置
   */
  protected getServiceConfig(): ApiEndpointConfig | null {
    return this.serviceConfig
  }

  /**
   * 获取服务支持的方法
   */
  protected getSupportedMethods(): HttpMethod[] {
    return this.serviceConfig?.methods || []
  }

  /**
   * 检查是否支持指定方法
   */
  protected isMethodSupported(method: HttpMethod): boolean {
    return this.getSupportedMethods().includes(method)
  }
}

export default BaseApiService
