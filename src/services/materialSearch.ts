import http from '@/utils/http'
import type { Material, SearchProvider, SearchResultMaterial } from '@/types/material'
import { HttpError } from '@/utils/http/error'

export interface SearchResult {
  materials: Material[]
  total: number
  page: number
  pageSize: number
}

export interface SearchToolsResult {
  materials: SearchResultMaterial[]
  total: number
  page: number
  pageSize: number
}

export interface SearchParams {
  keywords: string
  providers: string[]
  searchScope?: string
  aiProvider?: string
  filters?: {
    type?: Material['type'][]
    source?: string[]
    tags?: string[]
  }
  page?: number
  pageSize?: number
}

// Search-tools API 相关类型定义 - 根据 ai_openapi.json 更新
export interface UnifiedSearchRequest {
  queries: string[]
  provider: 'tavily' | 'bocha'
  max_results?: number
  enable_structured_summaries?: boolean
  summarization_model?: string
  max_content_length?: number

  // Tavily特定参数
  topic?: 'general' | 'news' | 'finance'
  include_raw_content?: boolean

  // Bocha特定参数
  freshness?: string
  summary?: boolean
  include?: string
  exclude?: string
}

// 保持向后兼容的别名
export type SearchToolsRequest = UnifiedSearchRequest

export interface SearchToolsResponse {
  success: boolean
  provider: string
  results: SearchResultItem[]
  total_results: number
  search_queries: string[]
  search_time: number
  api_execution_time: number
  query_count: number
}

export interface SearchResultItem {
  url: string
  webtitle: string
  score: number
  query: string
  aititle?: string
  summary?: string
  tags?: string[] // 添加tags字段，虽然API文档中没有，但可能在实际返回中存在
  key_excerpts: string[]
  published_date?: string
}

export interface SearchToolsStatusResponse {
  tavily_configured: boolean
  bocha_configured: boolean
  tavily_api_key_status: string
  bocha_api_key_status: string
  default_provider: string
  available_providers: string[]
}

class MaterialSearchService {
  private baseUrl = '/api/materials'
  private searchToolsStatusCache: {
    data: SearchToolsStatusResponse | null
    timestamp: number
    ttl: number // 缓存有效期（毫秒）
  } = {
    data: null,
    timestamp: 0,
    ttl: 30000 // 30秒缓存
  }

  async search(params: SearchParams): Promise<SearchResult> {
    try {
      const response = await http.post<SearchResult>({
        url: `${this.baseUrl}/search`,
        data: params,
        timeout: 120000
      })
      return response
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('搜索失败，请稍后重试')
    }
  }

  async searchByProvider(providerId: string, params: SearchParams): Promise<SearchResult> {
    try {
      const response = await http.post<SearchResult>({
        url: `${this.baseUrl}/search/${providerId}`,
        data: params,
        timeout: 120000
      })
      return response
    } catch (error) {
      console.error(`Provider ${providerId} search error:`, error)
      throw new Error(`通过 ${providerId} 搜索失败`)
    }
  }

  async getProviders(): Promise<SearchProvider[]> {
    try {
      const response = await http.get<SearchProvider[]>({
        url: `${this.baseUrl}/providers`
      })
      return response
    } catch (error) {
      console.error('Get providers error:', error)
      throw new Error('获取搜索提供商失败')
    }
  }

  async addToLibrary(materialIds: string[]): Promise<void> {
    try {
      await http.post({
        url: `${this.baseUrl}/add-to-library`,
        data: { materialIds }
      })
    } catch (error) {
      console.error('Add to library error:', error)
      throw new Error('添加到素材库失败')
    }
  }

  async removeFromLibrary(materialIds: string[]): Promise<void> {
    try {
      await http.del({
        url: `${this.baseUrl}/remove-from-library`,
        data: { materialIds }
      })
    } catch (error) {
      console.error('Remove from library error:', error)
      throw new Error('从素材库删除失败')
    }
  }

  async getLibraryMaterials(params?: {
    type?: Material['type']
    source?: string
    tags?: string[]
    search?: string
    page?: number
    pageSize?: number
  }): Promise<SearchResult> {
    try {
      const response = await http.get<SearchResult>({
        url: `${this.baseUrl}/library`,
        params
      })
      return response
    } catch (error) {
      console.error('Get library materials error:', error)
      throw new Error('获取素材库失败')
    }
  }

  async downloadMaterial(materialId: string): Promise<string> {
    try {
      const response = await http.get<{ url: string }>({
        url: `${this.baseUrl}/${materialId}/download`
      })
      return response.url
    } catch (error) {
      console.error('Download material error:', error)
      throw new Error('下载素材失败')
    }
  }

  async getMaterialDetails(materialId: string): Promise<Material> {
    try {
      const response = await http.get<Material>({
        url: `${this.baseUrl}/${materialId}`
      })
      return response
    } catch (error) {
      console.error('Get material details error:', error)
      throw new Error('获取素材详情失败')
    }
  }

  // 集成 search-tools API - 完全使用API返回值
  async searchWithSearchTools(params: SearchParams): Promise<SearchToolsResult> {
    try {
      // 构建API请求 - 使用UnifiedSearchRequest接口
      const request: UnifiedSearchRequest = {
        queries: [params.keywords],
        provider: params.providers[0] as 'tavily' | 'bocha',
        max_results: params.pageSize || 20,
        enable_structured_summaries: true,
        summarization_model: 'deepseek:deepseek-chat'
      }

      // 添加提供商特定参数
      if (request.provider === 'tavily') {
        request.topic = 'general'
        request.include_raw_content = true
      } else if (request.provider === 'bocha') {
        request.summary = true
      }

      // 发送请求，设置120秒超时
      const response = await http.post<SearchToolsResponse>({
        url: '/api/v1/ai/search-tools/search',
        data: request,
        timeout: 120000
      })

      // 转换结果 - 完全使用API返回值
      const materials = response.results.map((result) =>
        this.transformSearchResultToMaterial(result, response.provider)
      ) as SearchResultMaterial[]

      return {
        materials,
        total: response.total_results,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      }
    } catch (error) {
      console.error('Search tools API error:', error)
      throw new Error('搜索失败，请稍后重试')
    }
  }

  // 检查搜索工具状态（带缓存）
  async checkSearchToolsStatus(): Promise<SearchToolsStatusResponse> {
    try {
      const now = Date.now()
      const cacheAge = now - this.searchToolsStatusCache.timestamp

      // 检查缓存是否有效
      if (this.searchToolsStatusCache.data && cacheAge < this.searchToolsStatusCache.ttl) {
        console.log('[MaterialSearchService] 使用缓存数据，缓存年龄:', cacheAge, 'ms')
        return this.searchToolsStatusCache.data
      }

      console.log('[MaterialSearchService] 缓存已过期或不存在，发起新请求...')
      console.log('[MaterialSearchService] 请求URL: /api/v1/ai/search-tools/status')
      console.log('[MaterialSearchService] 时间戳:', new Date().toISOString())
      console.log(
        '[MaterialSearchService] 调用堆栈:',
        new Error().stack?.split('\n').slice(1, 5).join('\n')
      )

      const response = await http.get<SearchToolsStatusResponse>({
        url: '/api/v1/ai/search-tools/status'
      })

      // 更新缓存
      this.searchToolsStatusCache = {
        data: response,
        timestamp: now,
        ttl: 30000 // 30秒缓存
      }

      console.log('[MaterialSearchService] 搜索工具状态检查成功，已更新缓存')
      console.log('[MaterialSearchService] 响应时间戳:', new Date().toISOString())
      return response
    } catch (error) {
      console.error('[MaterialSearchService] Check search tools status error:', error)
      // 添加更详细的错误信息
      if (error instanceof HttpError) {
        console.error('[MaterialSearchService] HTTP Error Details:', {
          code: error.code,
          url: error.url,
          method: error.method,
          data: error.data,
          message: error.message,
          timestamp: error.timestamp
        })
      } else {
        console.error('[MaterialSearchService] 非HTTP错误:', {
          error: error,
          errorMessage: error instanceof Error ? error.message : '未知错误',
          errorType: typeof error
        })
      }
      throw new Error('无法检查搜索工具状态')
    }
  }

  // 转换函数：将SearchResultItem转换为SearchResultMaterial - 完全使用API返回值
  private transformSearchResultToMaterial(
    result: SearchResultItem,
    provider: string
  ): SearchResultMaterial {
    // 从URL提取域名作为来源
    const url = new URL(result.url)
    const source = url.hostname

    // 生成唯一ID
    const id = `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 确定素材类型（基于URL和内容）
    const type = this.determineMaterialType(result.url, result.summary)

    // 只使用API返回的tags，不生成虚假标签
    const tags = result.tags && result.tags.length > 0 ? result.tags : []

    return {
      id,
      title: result.aititle || result.webtitle,
      source,
      summary: result.summary || result.key_excerpts.join(' ') || '无可用摘要',
      tags,
      type,
      url: result.url,
      thumbnail: this.generateThumbnailUrl(result.url, type),
      content: result.key_excerpts.join('\n\n'),
      createdAt: result.published_date ? new Date(result.published_date) : new Date(),
      selected: false,
      // SearchResultMaterial特有字段 - 完全使用API返回值
      score: result.score,
      query: result.query,
      aititle: result.aititle,
      key_excerpts: result.key_excerpts,
      published_date: result.published_date,
      webtitle: result.webtitle
    }
  }

  // 辅助函数：确定素材类型
  private determineMaterialType(url: string, summary?: string): Material['type'] {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac']

    const lowerUrl = url.toLowerCase()

    if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'image'
    }

    if (videoExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'video'
    }

    if (audioExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'audio'
    }

    // 基于URL和摘要内容判断
    if (
      summary &&
      (summary.includes('图片') || summary.includes('图像') || summary.includes('照片'))
    ) {
      return 'image'
    }

    if (summary && (summary.includes('视频') || summary.includes('影片'))) {
      return 'video'
    }

    if (
      summary &&
      (summary.includes('音频') || summary.includes('音乐') || summary.includes('声音'))
    ) {
      return 'audio'
    }

    // 默认为文本类型
    return 'text'
  }

  // 辅助函数：提取标签
  private extractTags(title: string, summary?: string, excerpts: string[] = []): string[] {
    const allText = [title, summary || '', ...excerpts].join(' ')

    // 简单的关键词提取逻辑
    const commonTags = ['设计', '素材', '创意', '灵感', '艺术', '图片', '视频', '音频', '文本']
    const foundTags: string[] = []

    commonTags.forEach((tag) => {
      if (allText.includes(tag)) {
        foundTags.push(tag)
      }
    })

    // 如果没有找到常见标签，使用标题中的关键词
    if (foundTags.length === 0) {
      const titleWords = title.split(/\s+/).filter((word) => word.length > 1)
      foundTags.push(...titleWords.slice(0, 3))
    }

    return foundTags.slice(0, 5) // 最多返回5个标签
  }

  // 辅助函数：生成缩略图URL
  private generateThumbnailUrl(url: string, type: Material['type']): string | undefined {
    if (type === 'image') {
      return url // 图片直接使用原URL
    }

    // 对于其他类型，可以生成占位图
    if (type === 'video') {
      return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}&type=video`
    }

    if (type === 'audio') {
      return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}&type=audio`
    }

    return `https://picsum.photos/300/200?random=${encodeURIComponent(url)}`
  }
}

export const materialSearchService = new MaterialSearchService()
