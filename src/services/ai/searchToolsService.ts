/**
 * AI搜索工具服务 - 基于OpenAPI配置
 * 专门服务于搜索工具和检索功能
 * 支持Mock/真实API切换
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import { mockDataManager } from '@/mock'

// 搜索工具相关类型
interface SearchToolsRequest {
  queries: string[]
  provider: 'tavily' | 'bocha' | 'serper' | 'google'
  max_results?: number
  enable_structured_summaries?: boolean
  summarization_model?: string
  max_content_length?: number
  topic?: 'general' | 'news' | 'finance' | 'academic' | 'technology'
  include_raw_content?: boolean
  freshness?: string
  summary?: boolean
  include?: string
  exclude?: string
  language?: string
  region?: string
  safe_search?: 'off' | 'moderate' | 'strict'
}

interface SearchToolsResponse {
  results: Array<{
    title: string
    url: string
    snippet: string
    published_date?: string
    score?: number
    content?: string
    author?: string
    source?: string
  }>
  search_metadata: {
    query: string
    total_results: number
    search_time: number
    provider: string
    processed_at: string
  }
  structured_summary?: {
    main_points: string[]
    key_entities: Array<{
      name: string
      type: string
      confidence: number
    }>
    sentiment?: 'positive' | 'negative' | 'neutral'
    topics: string[]
  }
}

interface SearchToolsStatusResponse {
  service_status: 'available' | 'unavailable' | 'maintenance'
  supported_providers: string[]
  active_searches: number
  max_concurrent_searches: number
  rate_limits: {
    provider: string
    requests_per_minute: number
    requests_per_hour: number
    remaining_requests: number
  }[]
}

class SearchToolsService extends BaseApiService {
  constructor() {
    super('searchTools')
  }

  // ============= 搜索工具服务 =============

  /**
   * 执行搜索工具
   * @param request 搜索请求参数
   * @param options API请求选项
   * @returns 搜索结果
   */
  async searchTools(request: SearchToolsRequest, options?: ApiRequestConfig) {
    return this.post<SearchToolsResponse>('/search-tools/search', request, options)
  }

  /**
   * 获取搜索工具状态
   * @param options API请求选项
   * @returns 搜索工具状态
   */
  async getSearchToolsStatus(options?: ApiRequestConfig) {
    return this.get<SearchToolsStatusResponse>('/search-tools/status', undefined, options)
  }

  /**
   * 获取支持的搜索提供商
   * @param options API请求选项
   * @returns 支持的提供商列表
   */
  async getSupportedProviders(options?: ApiRequestConfig) {
    return this.get<any>('/search-tools/providers', undefined, options)
  }

  /**
   * 获取搜索历史记录
   * @param params 查询参数
   * @param options API请求选项
   * @returns 搜索历史
   */
  async getSearchHistory(
    params?: {
      limit?: number
      offset?: number
      date_from?: string
      date_to?: string
      query?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<any>('/search-tools/history', params, options)
  }

  /**
   * 保存搜索结果
   * @param searchResult 搜索结果
   * @param options API请求选项
   * @returns 保存结果
   */
  async saveSearchResult(
    searchResult: {
      query: string
      results: any[]
      provider: string
      search_metadata: any
    },
    options?: ApiRequestConfig
  ) {
    return this.post('/search-tools/save', searchResult, options)
  }

  /**
   * 获取搜索建议
   * @param query 查询关键词
   * @param options API请求选项
   * @returns 搜索建议
   */
  async getSearchSuggestions(query: string, options?: ApiRequestConfig) {
    return this.get<any>('/search-tools/suggestions', { q: query }, options)
  }

  /**
   * 分析搜索结果
   * @param searchId 搜索ID
   * @param analysisType 分析类型
   * @param options API请求选项
   * @returns 分析结果
   */
  async analyzeSearchResults(
    searchId: string,
    analysisType: 'sentiment' | 'topics' | 'entities' | 'quality',
    options?: ApiRequestConfig
  ) {
    return this.post(`/search-tools/analyze/${searchId}`, { analysis_type: analysisType }, options)
  }

  /**
   * 快速搜索
   * @param query 查询关键词
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async quickSearch(
    query: string,
    options?: {
      provider?: 'tavily' | 'bocha' | 'serper'
      max_results?: number
      topic?: 'general' | 'news' | 'finance' | 'academic' | 'technology'
      language?: string
    }
  ): Promise<SearchToolsResponse> {
    const request: SearchToolsRequest = {
      queries: [query],
      provider: options?.provider || 'tavily',
      max_results: options?.max_results || 10,
      topic: options?.topic || 'general',
      language: options?.language || 'zh-CN',
      enable_structured_summaries: true,
      summary: true
    }

    return this.searchTools(request)
  }

  /**
   * 多查询搜索
   * @param queries 查询关键词数组
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async multiQuerySearch(
    queries: string[],
    options?: {
      provider?: 'tavily' | 'bocha' | 'serper'
      max_results?: number
      combine_results?: boolean
      language?: string
    }
  ): Promise<SearchToolsResponse[]> {
    const results: SearchToolsResponse[] = []

    for (const query of queries) {
      const request: SearchToolsRequest = {
        queries: [query],
        provider: options?.provider || 'tavily',
        max_results: options?.max_results || 5,
        language: options?.language || 'zh-CN',
        enable_structured_summaries: true,
        summary: true
      }

      try {
        const result = await this.searchTools(request)
        results.push(result)
      } catch (error) {
        console.error(`搜索查询失败: ${query}`, error)
      }
    }

    return results
  }

  /**
   * Mock实现方法
   * 为搜索工具服务提供Mock数据支持
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    if (apiConfig.showDebugInfo) {
      console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
        url: config.url,
        method: config.method,
        data: config.data
      })
    }

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method

    try {
      // 搜索工具相关API（material search - 普通搜索）
      if (method === 'GET' && url.includes('/search-tools/status')) {
        return mockDataManager.getMockData('search-tools-status')
      }

      if (method === 'GET' && url.includes('/search-tools/providers')) {
        return mockDataManager.getMockData('search-providers')
      }

      if (method === 'POST' && url.includes('/search-tools/search')) {
        const requestData = config.data
        return mockDataManager.getMockData(
          'search-tools',
          requestData.queries || [],
          requestData.provider || 'tavily'
        )
      }

      if (method === 'GET' && url.includes('/search-tools/history')) {
        return mockDataManager.getMockData('search-history', config.params?.limit || 10)
      }

      if (method === 'GET' && url.includes('/search-tools/suggestions')) {
        return mockDataManager.getMockData('search-suggestions', config.params?.q || '')
      }

      if (method === 'POST' && url.includes('/search-tools/save')) {
        return {
          success: true,
          message: '搜索结果已成功保存到个人收藏',
          search_id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          saved_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      if (method === 'POST' && url.includes('/search-tools/analyze/')) {
        const searchId = url.split('/')[4]
        const analysisType = config.data?.analysis_type || 'sentiment'

        return {
          search_id: searchId,
          analysis_type: analysisType,
          result: {
            overall: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
            confidence: 0.7 + Math.random() * 0.25,
            breakdown: {
              positive: Math.random() * 0.4 + 0.3,
              neutral: Math.random() * 0.3 + 0.2,
              negative: Math.random() * 0.2 + 0.1
            }
          },
          processing_time: 1.2 + Math.random() * 2,
          confidence_level: 0.75 + Math.random() * 0.2,
          analyzed_at: new Date().toISOString(),
          mock: true,
          timestamp: Date.now()
        }
      }

      // 默认Mock响应
      return {
        success: true,
        message: `搜索工具服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          request_info: {
            url,
            method,
            data: config.data
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      // 返回错误响应
      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}

// 创建单例实例
export const searchToolsService = new SearchToolsService()

export default searchToolsService
