/**
 * API配置相关类型定义
 */

export interface ApiConfig {
  /** 是否使用Mock数据 */
  useMock: boolean
  /** Mock响应延迟（毫秒） */
  mockDelay: number
  /** 是否显示调试信息 */
  showDebugInfo: boolean
}

export interface ApiEndpointConfig {
  /** 服务名称 */
  name: string
  /** API基础路径 */
  baseUrl: string
  /** 支持的HTTP方法 */
  methods: HttpMethod[]
  /** API路径配置 */
  paths: Record<string, ApiPathConfig>
  /** 默认配置 */
  defaults: ApiEndpointDefaults
  /** 是否启用Mock */
  enableMock: boolean
  /** Mock数据路径 */
  mockPath: string
}

export interface ApiPathConfig {
  /** 路径描述 */
  description: string
  /** 支持的HTTP方法 */
  methods: HttpMethod[]
  /** 请求配置 */
  request?: {
    /** 请求体类型 */
    bodyType?: 'json' | 'form' | 'file'
    /** 是否需要认证 */
    requireAuth?: boolean
    /** 请求参数schema（POST/PUT等） */
    params?: Record<string, any>
    /** 查询参数schema（GET等） */
    query?: Record<string, any>
    /** 请求头 */
    headers?: Record<string, string>
  }
  /** 响应配置 */
  response?: {
    /** 响应类型 */
    dataType?: string
    /** 响应状态码 */
    statusCode?: number
  }
  /** 自定义配置 */
  custom?: Record<string, any>
}

export interface ApiEndpointDefaults {
  /** 默认超时时间（毫秒） */
  timeout: number
  /** 默认请求头 */
  headers: Record<string, string>
  /** 默认重试次数 */
  retryCount: number
  /** 是否启用缓存 */
  enableCache: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface MockDataConfig {
  /** Mock数据版本 */
  version: string
  /** 默认延迟时间 */
  defaultDelay: number
  /** 是否启用随机延迟 */
  randomDelay: boolean
  /** 随机延迟范围 */
  delayRange: [number, number]
}

export interface ApiRequestConfig {
  /** 请求URL */
  url: string
  /** 请求方法 */
  method: HttpMethod
  /** 请求数据 */
  data?: any
  /** 请求参数 */
  params?: any
  /** 请求头 */
  headers?: Record<string, string>
  /** 超时时间 */
  timeout?: number
  /** 是否使用Mock */
  useMock?: boolean
}

export interface ApiResponse<T = any> {
  /** 响应数据 */
  data: T
  /** 响应状态 */
  status: number
  /** 响应消息 */
  message: string
  /** 响应时间戳 */
  timestamp: number
  /** 是否来自Mock数据 */
  isMock: boolean
  /** 请求耗时 */
  duration?: number
}

export interface ApiRegistry {
  /** API服务注册表 */
  services: Record<string, ApiEndpointConfig>
  /** 全局默认配置 */
  globalDefaults: ApiEndpointDefaults
  /** Mock配置 */
  mockConfig: MockDataConfig
}
