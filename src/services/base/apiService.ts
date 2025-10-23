/**
 * 基础API服务类
 * 提供统一的API调用接口和Mock/真实API切换逻辑
 */

import { apiConfigManager } from '@/config/api'
import type {
  ApiRequestConfig,
  ApiResponse,
  HttpMethod,
  ApiEndpointConfig,
  ApiPathConfig
} from '@/config/api/types'
import http from '@/utils/http'

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

    // 添加调试日志
    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 请求开始:`, {
        url: config.url,
        method: config.method,
        useMock: config.useMock,
        globalMockEnabled: apiConfig.useMock,
        hasMockImplementation: !!this.mockImplementation,
        serviceName: this.serviceName
      })
    }

    // 检查是否启用Mock模式
    if (config.useMock !== false && apiConfig.useMock && this.mockImplementation) {
      if (apiConfig.showDebugInfo) {
        console.log(`[API-${this.serviceName}] 使用Mock模式`)
      }
      return this.handleMockRequest<T>(config)
    }

    // 添加调试信息
    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 使用真实API模式. 原因:`, {
        useMockDisabled: config.useMock === false,
        globalMockDisabled: !apiConfig.useMock,
        noMockImplementation: !this.mockImplementation
      })
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

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] Mock请求:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    try {
      // 模拟网络延迟
      await this.simulateDelay(apiConfig.mockDelay || mockConfig.defaultDelay)

      // 调用Mock实现
      const result = await this.mockImplementation?.(config)

      // 包装Mock响应
      const mockResponse: ApiResponse<T> = {
        data: result,
        status: 200,
        message: 'Mock数据响应成功',
        timestamp: Date.now(),
        isMock: true
      }

      if (apiConfig.showDebugInfo) {
        console.log(`[API-${this.serviceName}] Mock响应:`, mockResponse)
      }

      return result as T
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock请求失败:`, error)
      throw error
    }
  }

  /**
   * 处理真实API请求
   */
  private async handleRealRequest<T>(config: ApiRequestConfig): Promise<T> {
    const apiConfig = apiConfigManager.getConfig()
    const serviceDefaults = this.getServiceDefaults()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 真实API请求:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    try {
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

      if (apiConfig.showDebugInfo) {
        console.log(`[API-${this.serviceName}] 真实API响应:`, result)
      }

      return result
    } catch (error) {
      console.error(`[API-${this.serviceName}] 真实API请求失败:`, error)

      // 使用通用错误处理
      throw error
    }
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
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async mockImplementation?(_config: ApiRequestConfig): Promise<any> {
    throw new Error(`Mock实现未定义: ${this.serviceName}`)
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
