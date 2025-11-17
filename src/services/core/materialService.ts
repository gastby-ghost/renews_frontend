/**
 * 素材管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 * 基于 material.json OpenAPI 3.1.0 规范，提供完整的素材管理功能
 */

import BaseApiService from '../base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type {
  MaterialResponse,
  MaterialListResponse,
  MaterialCreateRequest,
  MaterialUpdateRequest,
  AddCompleteMaterialRequest,
  MaterialDeleteRequest,
  MaterialDeleteResponse,
  AddExternalMaterialRequest,
  MaterialAddToProjectResponse,
  MaterialTagCreate,
  MaterialTagResponse,
  TagListResponse,
  MaterialSearchRequest,
  MaterialSearchResponse
} from '@/types/core'

// Material 相关类型已移至 @/types/core/material.ts

export interface MaterialStatsRequest {
  project_id?: number
  group_by?: 'type' | 'tags' | 'source' | 'date'
  date_range?: {
    start: string
    end: string
  }
}

export interface MaterialStatsResponse {
  success: boolean
  message: string
  data: MaterialStatsData
  total_materials?: number
  last_updated?: string
}

export interface MaterialStatsData {
  total_materials: number
  by_type: Record<string, number>
  by_tags: Record<string, number>
  by_source: Record<string, number>
  by_date: Record<string, number>
  recently_added: MaterialResponse[]
  frequently_used: MaterialResponse[]
}

// 缓存相关类型
export interface MaterialCacheConfig {
  enableCache: boolean
  maxAge: number // 缓存时间（毫秒）
  maxSize: number // 最大缓存条目数
}

// 默认缓存配置
const DEFAULT_CACHE_CONFIG: MaterialCacheConfig = {
  enableCache: true,
  maxAge: 5 * 60 * 1000, // 5分钟
  maxSize: 100
}
class MaterialApiService extends BaseApiService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheConfig: MaterialCacheConfig

  constructor(cacheConfig?: Partial<MaterialCacheConfig>) {
    super('material')
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig }
  }

  /**
   * 缓存键生成
   */
  private getCacheKey(prefix: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${prefix}:${paramString}`
  }

  /**
   * 获取缓存数据
   */
  private getCachedData<T>(key: string): T | null {
    if (!this.cacheConfig.enableCache) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.cacheConfig.maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * 设置缓存数据
   */
  private setCachedData<T>(key: string, data: T): void {
    if (!this.cacheConfig.enableCache) return

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const firstKey = Array.from(this.cache.keys())[0]
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheConfig.maxAge) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * 响应验证和错误处理
   */
  private validateResponse<T>(response: any, requiredFields: string[]): T {
    if (!response) {
      throw new Error('空响应数据')
    }

    if (response.success === false) {
      throw new Error(response.message || '请求失败')
    }

    // 验证必需字段
    for (const field of requiredFields) {
      if (!(field in response)) {
        throw new Error(`响应缺少必需字段: ${field}`)
      }
    }

    return response as T
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * 批量创建素材 - POST /api/v1/core/materials/batch
   */
  async createMaterials(
    projectId: number,
    materials: MaterialCreateRequest[],
    options?: ApiRequestConfig
  ): Promise<MaterialListResponse> {
    if (!projectId || !Array.isArray(materials) || materials.length === 0) {
      throw new Error('项目ID和素材列表不能为空')
    }

    const request: AddCompleteMaterialRequest = {
      project_id: projectId,
      materials
    }

    try {
      const response = await this.post<MaterialListResponse>('/materials/batch', request, options)
      const validatedResponse = this.validateResponse<MaterialListResponse>(response, [
        'materials',
        'total_count'
      ])

      // 创建成功后清理相关缓存
      this.cleanExpiredCache()

      return validatedResponse
    } catch (error) {
      throw new Error(`批量创建素材失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 创建单个素材 - POST /api/v1/core/materials
   */
  async createMaterial(
    material: MaterialCreateRequest,
    options?: ApiRequestConfig
  ): Promise<MaterialResponse> {
    if (!material?.title) {
      throw new Error('素材标题不能为空')
    }

    try {
      const response = await this.post<MaterialResponse>('/materials', material, options)
      const validatedResponse = this.validateResponse<MaterialResponse>(response, ['id', 'title'])

      // 创建成功后清理相关缓存
      this.cleanExpiredCache()

      return validatedResponse
    } catch (error) {
      throw new Error(`创建素材失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取用户的所有素材 - GET /api/v1/core/materials
   * 支持缓存优化
   */
  async getAllMaterials(
    params?: {
      page?: number
      page_size?: number
      keywords?: string
      library_id?: number
    },
    requestBody?: {
      tags?: string[]
    },
    options?: ApiRequestConfig & { useCache?: boolean }
  ): Promise<MaterialListResponse> {
    const cacheKey = this.getCacheKey('all_materials', { params, requestBody })

    // 检查缓存（仅在不带标签搜索时使用缓存）
    if (!requestBody?.tags?.length && options?.useCache !== false) {
      const cached = this.getCachedData<MaterialListResponse>(cacheKey)
      if (cached) return cached
    }

    try {
      let response: MaterialListResponse

      // 根据 OpenAPI 规范，tags 参数在请求体中传递
      if (requestBody?.tags && requestBody.tags.length > 0) {
        response = await this.post<MaterialListResponse>('/materials', requestBody, {
          ...options,
          params
        })
      } else {
        response = await this.get<MaterialListResponse>('/materials', params, options)
      }

      const validatedResponse = this.validateResponse<MaterialListResponse>(response, ['materials'])

      // 缓存响应（仅缓存不带标签搜索的结果）
      if (!requestBody?.tags?.length && options?.useCache !== false) {
        this.setCachedData(cacheKey, validatedResponse)
      }

      return validatedResponse
    } catch (error) {
      throw new Error(`获取素材列表失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量删除素材 - DELETE /api/v1/core/materials
   * 支持两种方式：查询参数或请求体
   */
  async deleteMaterials(materialIds: number[], options?: ApiRequestConfig) {
    const request: MaterialDeleteRequest = {
      material_ids: materialIds
    }

    return this.delete<MaterialDeleteResponse>('/materials', request, options)
  }

  /**
   * 获取素材详情 - GET /api/v1/core/materials/{material_id}
   */
  async getMaterial(materialId: number, options?: ApiRequestConfig) {
    return this.get<MaterialResponse>(`/materials/${materialId}`, undefined, options)
  }

  /**
   * 更新素材 - PUT /api/v1/core/materials/{material_id}
   */
  async updateMaterial(
    materialId: number,
    updateData: Partial<MaterialCreateRequest>,
    options?: ApiRequestConfig
  ) {
    const request: MaterialUpdateRequest = {
      update_data: updateData
    }

    return this.put<MaterialResponse>(`/materials/${materialId}`, request, options)
  }

  /**
   * 将素材添加到项目 - POST /api/v1/core/projects/{project_id}/materials
   */
  async addMaterialsToProject(
    projectId: number,
    materialIds: number[],
    options?: ApiRequestConfig
  ) {
    const request: AddExternalMaterialRequest = {
      material_ids: materialIds
    }

    return this.post<MaterialAddToProjectResponse>(
      `/projects/${projectId}/materials`,
      request,
      options
    )
  }

  /**
   * 获取项目关联的素材 - GET /api/v1/core/projects/{project_id}/materials
   */
  async getProjectMaterials(
    projectId: number,
    params?: {
      page?: number
      page_size?: number
      keywords?: string
    },
    requestBody?: {
      tags?: string[]
    },
    options?: ApiRequestConfig
  ) {
    // 根据 OpenAPI 规范，tags 参数在请求体中传递
    if (requestBody?.tags && requestBody.tags.length > 0) {
      return this.post<MaterialListResponse>(`/projects/${projectId}/materials`, requestBody, {
        ...options,
        params
      })
    }
    return this.get<MaterialListResponse>(`/projects/${projectId}/materials`, params, options)
  }

  /**
   * 获取用户的所有标签 - GET /api/v1/core/tags
   */
  async getTags(
    params?: {
      page?: number
      page_size?: number
      search_keyword?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<TagListResponse>('/tags', params, options)
  }

  /**
   * 创建标签 - POST /api/v1/core/tags
   */
  async createTag(name: string, options?: ApiRequestConfig) {
    const request: MaterialTagCreate = { name }
    return this.post<MaterialTagResponse>('/tags', request, options)
  }

  /**
   * 搜索素材（扩展功能）
   * 支持高级搜索和过滤，返回搜索结果和分面统计
   */
  async searchMaterials(
    request: MaterialSearchRequest,
    options?: ApiRequestConfig & { useCache?: boolean }
  ): Promise<MaterialSearchResponse> {
    if (!request?.keywords || request.keywords.trim().length === 0) {
      throw new Error('搜索关键词不能为空')
    }

    const cacheKey = this.getCacheKey('search_materials', request)

    // 检查缓存
    if (options?.useCache !== false) {
      const cached = this.getCachedData<MaterialSearchResponse>(cacheKey)
      if (cached) return cached
    }

    try {
      const response = await this.post<MaterialSearchResponse>(
        '/materials/search',
        request,
        options
      )
      const validatedResponse = this.validateResponse<MaterialSearchResponse>(response, [
        'results',
        'total_count'
      ])

      // 缓存搜索结果
      if (options?.useCache !== false) {
        this.setCachedData(cacheKey, validatedResponse)
      }

      return validatedResponse
    } catch (error) {
      throw new Error(`搜索素材失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取素材统计数据（扩展功能）
   * 提供详细的素材统计信息和数据分析
   */
  async getMaterialStats(
    request?: MaterialStatsRequest,
    options?: ApiRequestConfig & { useCache?: boolean }
  ): Promise<MaterialStatsResponse> {
    const cacheKey = this.getCacheKey('material_stats', request)

    // 检查缓存（统计数据缓存时间较短）
    if (options?.useCache !== false) {
      const cached = this.getCachedData<MaterialStatsResponse>(cacheKey)
      if (cached) return cached
    }

    try {
      const response = await this.get<MaterialStatsResponse>('/materials/stats', request, options)
      const validatedResponse = this.validateResponse<MaterialStatsResponse>(response, ['data'])

      // 缓存统计数据
      if (options?.useCache !== false) {
        this.setCachedData(cacheKey, validatedResponse)
      }

      return validatedResponse
    } catch (error) {
      throw new Error(`获取素材统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 将搜索结果转换为API所需格式
   * 增强版本，支持更多数据源和更好的数据处理
   */
  static convertSearchResultToMaterialData(searchResult: any): MaterialCreateRequest {
    // 清理和验证数据
    const title = typeof searchResult.title === 'string' ? searchResult.title.trim() : ''
    const summary =
      typeof searchResult.summary === 'string'
        ? searchResult.summary.trim()
        : typeof searchResult.excerpt === 'string'
          ? searchResult.excerpt.trim()
          : ''
    const url = typeof searchResult.url === 'string' ? searchResult.url.trim() : ''

    if (!title) {
      throw new Error('搜索结果标题不能为空')
    }

    return {
      title,
      summary,
      url,
      score: typeof searchResult.score === 'number' ? searchResult.score : 0,
      key_excerpts: Array.isArray(searchResult.key_excerpts)
        ? searchResult.key_excerpts
        : Array.isArray(searchResult.excerpts)
          ? searchResult.excerpts
          : [],
      tags: Array.isArray(searchResult.tags) ? searchResult.tags.filter(Boolean) : []
    }
  }

  /**
   * 将API返回的素材转换为前端格式
   * 增强版本，提供更好的数据一致性和类型安全
   */
  static convertApiMaterialToMaterial(apiMaterial: MaterialResponse): any {
    if (!apiMaterial || typeof apiMaterial.id !== 'number') {
      throw new Error('无效的素材数据')
    }

    return {
      id: apiMaterial.id.toString(),
      title: apiMaterial.title || '',
      summary: apiMaterial.summary || '',
      url: apiMaterial.url || '',
      score: apiMaterial.score || 0,
      key_excerpts: Array.isArray(apiMaterial.key_excerpts) ? apiMaterial.key_excerpts : [],
      tags: Array.isArray(apiMaterial.tags) ? apiMaterial.tags : [],
      createdAt: apiMaterial.created_at || '',
      updatedAt: apiMaterial.updated_at || '',
      userId: apiMaterial.user_id
    }
  }

  /**
   * 批量转换搜索结果
   */
  static batchConvertSearchResults(searchResults: any[]): MaterialCreateRequest[] {
    if (!Array.isArray(searchResults)) {
      throw new Error('搜索结果必须是数组')
    }

    return searchResults
      .map((result, index) => {
        try {
          return this.convertSearchResultToMaterialData(result)
        } catch (error) {
          console.warn(`跳过无效的搜索结果 [${index}]:`, error)
          return null
        }
      })
      .filter((material): material is MaterialCreateRequest => material !== null)
  }

  /**
   * 验证素材数据完整性
   */
  static validateMaterialData(material: MaterialCreateRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!material.title || material.title.trim().length === 0) {
      errors.push('标题不能为空')
    }

    if (material.title && material.title.length > 200) {
      errors.push('标题长度不能超过200个字符')
    }

    if (material.summary && material.summary.length > 1000) {
      errors.push('摘要长度不能超过1000个字符')
    }

    if (material.url && !this.isValidUrl(material.url)) {
      errors.push('URL格式不正确')
    }

    if (material.score !== undefined && (material.score < 0 || material.score > 1)) {
      errors.push('评分必须在0-1之间')
    }

    if (!Array.isArray(material.key_excerpts)) {
      errors.push('关键摘录必须是数组')
    }

    if (!Array.isArray(material.tags)) {
      errors.push('标签必须是数组')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * URL格式验证
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 去重素材列表（基于URL或标题相似性）
   */
  static deduplicateMaterials(materials: MaterialCreateRequest[]): MaterialCreateRequest[] {
    const seen = new Set<string>()
    const deduplicated: MaterialCreateRequest[] = []

    for (const material of materials) {
      const key = material.url || material.title.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push(material)
      }
    }

    return deduplicated
  }

  /**
   * 按评分排序素材
   */
  static sortMaterialsByScore(
    materials: MaterialResponse[],
    descending: boolean = true
  ): MaterialResponse[] {
    return [...materials].sort((a, b) => {
      const scoreA = a.score || 0
      const scoreB = b.score || 0
      return descending ? scoreB - scoreA : scoreA - scoreB
    })
  }

  /**
   * 过滤素材
   */
  static filterMaterials(
    materials: MaterialResponse[],
    filters: {
      minScore?: number
      tags?: string[]
      keywords?: string
      dateRange?: { start: string; end: string }
    }
  ): MaterialResponse[] {
    return materials.filter((material) => {
      // 评分过滤
      if (filters.minScore && (material.score || 0) < filters.minScore) {
        return false
      }

      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => material.tags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // 关键词过滤
      if (filters.keywords) {
        const keyword = filters.keywords.toLowerCase()
        const titleMatch = material.title.toLowerCase().includes(keyword)
        const summaryMatch = material.summary.toLowerCase().includes(keyword)
        if (!titleMatch && !summaryMatch) return false
      }

      // 日期范围过滤
      if (filters.dateRange) {
        const materialDate = new Date(material.created_at)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        if (materialDate < startDate || materialDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Mock实现 - 提供更真实的数据模拟和更智能的响应
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    // 模拟更真实的网络延迟（200-800ms随机）
    const delay = Math.random() * 600 + 200
    await new Promise((resolve) => setTimeout(resolve, delay))

    const { url, method, data, params } = config
    const queryParams = params || {}

    // 模拟网络错误的概率（2%）
    if (Math.random() < 0.02) {
      throw new Error('网络连接失败，请稍后重试')
    }

    // 批量创建素材 - POST /materials/batch
    if (method === 'POST' && url.includes('/materials/batch')) {
      const requestBody = data as AddCompleteMaterialRequest
      const newMaterials: MaterialResponse[] = requestBody.materials.map((material) => ({
        id: Math.floor(Math.random() * 10000) + 1000,
        user_id: 1,
        title: material.title,
        summary: material.summary,
        url: material.url || '',
        score: material.score || 0,
        key_excerpts: material.key_excerpts || [],
        tags: material.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      return {
        success: true,
        message: '批量创建素材成功',
        materials: newMaterials,
        total_count: newMaterials.length
      }
    }

    // 创建单个素材 - POST /materials (不是批量)
    if (method === 'POST' && url.match(/\/materials$/) && !data.materials) {
      const material = data as MaterialCreateRequest
      return {
        success: true,
        message: '创建素材成功',
        id: Math.floor(Math.random() * 10000) + 1000,
        user_id: 1,
        title: material.title,
        summary: material.summary,
        url: material.url || '',
        score: material.score || 0,
        key_excerpts: material.key_excerpts || [],
        tags: material.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    // 获取所有素材列表 - GET /materials
    if (method === 'GET' && url.match(/\/materials$/)) {
      return {
        success: true,
        message: '获取素材列表成功',
        materials: this.generateMockMaterials(0),
        total_count: 20,
        page: queryParams.page || 1,
        page_size: queryParams.page_size || 20,
        total_pages: 1
      }
    }

    // 获取所有素材列表 - POST /materials (带请求体 - tags)
    if (method === 'POST' && url.match(/\/materials$/) && data?.tags) {
      return {
        success: true,
        message: '获取素材列表成功',
        materials: this.generateMockMaterials(0),
        total_count: 20,
        page: queryParams.page || 1,
        page_size: queryParams.page_size || 20,
        total_pages: 1
      }
    }

    // 批量删除素材 - DELETE /materials
    if (method === 'DELETE' && url.match(/\/materials$/)) {
      const requestBody = data as MaterialDeleteRequest
      return {
        success: true,
        message: '批量删除素材成功',
        deleted_count: requestBody.material_ids?.length || 0,
        failed_count: 0,
        details:
          requestBody.material_ids?.map((id) => ({
            material_id: id,
            status: 'success'
          })) || []
      }
    }

    // 将素材添加到项目 - POST /projects/{project_id}/materials
    if (method === 'POST' && url.match(/\/projects\/\d+\/materials$/) && data?.material_ids) {
      const requestBody = data as AddExternalMaterialRequest

      return {
        success: true,
        message: '将素材添加到项目成功',
        added_count: requestBody.material_ids?.length || 0,
        details:
          requestBody.material_ids?.map((id) => ({
            material_id: id,
            status: 'success'
          })) || []
      }
    }

    // 获取项目素材列表 - POST /projects/{project_id}/materials (带请求体 - tags)
    if (method === 'POST' && url.match(/\/projects\/\d+\/materials$/) && data?.tags) {
      const projectId = url.split('/')[2]

      return {
        success: true,
        message: '获取项目素材列表成功',
        materials: this.generateMockMaterials(parseInt(projectId)),
        total_count: 10,
        page: queryParams.page || 1,
        page_size: queryParams.page_size || 20,
        total_pages: 1
      }
    }

    // 获取项目素材列表 - GET /projects/{project_id}/materials
    if (method === 'GET' && url.match(/\/projects\/\d+\/materials$/)) {
      const projectId = url.split('/')[2]

      return {
        success: true,
        message: '获取项目素材列表成功',
        materials: this.generateMockMaterials(parseInt(projectId)),
        total_count: 10,
        page: queryParams.page || 1,
        page_size: queryParams.page_size || 20,
        total_pages: 1
      }
    }

    // 创建标签 - POST /tags
    if (method === 'POST' && url.match(/\/tags$/)) {
      const requestBody = data as MaterialTagCreate
      return {
        success: true,
        message: '创建标签成功',
        id: Math.floor(Math.random() * 1000) + 100,
        name: requestBody.name,
        created_at: new Date().toISOString()
      }
    }

    // 获取标签列表 - GET /tags
    if (method === 'GET' && url.match(/\/tags$/)) {
      return {
        success: true,
        message: '获取标签列表成功',
        tags: [
          { id: 1, name: '技术', created_at: '2024-01-01T00:00:00Z' },
          { id: 2, name: '设计', created_at: '2024-01-02T00:00:00Z' },
          { id: 3, name: '产品', created_at: '2024-01-03T00:00:00Z' }
        ],
        total_count: 3
      }
    }

    // 搜索素材 - POST /materials/search
    if (method === 'POST' && url.includes('/materials/search')) {
      const requestBody = data as any
      return {
        success: true,
        message: '搜索素材成功',
        results: this.generateMockMaterials(0, requestBody.keywords || ''),
        total_count: 5,
        search_time: 0.123
      }
    }

    // 获取素材统计数据 - GET /materials/stats
    if (method === 'GET' && url.includes('/materials/stats')) {
      return {
        success: true,
        message: '获取素材统计数据成功',
        data: {
          total_materials: 100,
          by_category: {
            技术: 40,
            设计: 35,
            产品: 25
          },
          by_source: {
            网络: 60,
            原创: 40
          }
        },
        total_materials: 100,
        last_updated: new Date().toISOString()
      }
    }

    // 默认响应
    return {
      success: true,
      message: `素材管理服务Mock响应 - ${method} ${url}`,
      data: { mock: true, timestamp: Date.now() }
    }
  }

  /**
   * 生成模拟素材数据 - 增强版本
   * 提供更丰富、更真实的数据，支持动态生成和项目相关内容
   */
  private generateMockMaterials(projectId: number = 0, keywords: string = ''): MaterialResponse[] {
    const allMockMaterials: MaterialResponse[] = [
      {
        id: 1,
        user_id: 1,
        title: 'AI技术发展趋势：大语言模型的突破与应用',
        summary:
          '深入分析了2024年人工智能领域的最新发展，特别关注大语言模型技术的突破性进展，以及在各行各业的实际应用案例。文章详细探讨了GPT、Claude等模型的技术原理和商业化前景。',
        url: 'https://tech.example.com/ai-trends-2024',
        score: 0.95,
        key_excerpts: ['大语言模型', '人工智能', '技术突破', '商业化应用'],
        tags: ['技术', 'AI', '机器学习', '深度学习'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        user_id: 1,
        title: '现代用户体验设计原则与实践指南',
        summary:
          '全面探讨现代UX/UI设计的核心原则，包括用户研究、信息架构、交互设计等方面。通过实际案例分析，帮助设计师理解如何在数字化时代创造优秀的用户体验。',
        url: 'https://design.example.com/ux-principles-2024',
        score: 0.88,
        key_excerpts: ['用户体验', '界面设计', '交互设计', '用户研究'],
        tags: ['设计', 'UX', '产品设计', '用户研究'],
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-16T11:00:00Z'
      },
      {
        id: 3,
        user_id: 1,
        title: '敏捷产品管理方法论：从理论到实践',
        summary:
          '详细介绍敏捷产品管理的核心方法论，包括Scrum、看板等框架的实际应用。通过丰富的项目经验分享，帮助产品经理提升工作效率和产品质量。',
        url: 'https://product.example.com/agile-methodology',
        score: 0.92,
        key_excerpts: ['产品管理', '敏捷开发', 'Scrum', '看板方法'],
        tags: ['产品', '管理', '敏捷', '项目管理'],
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-17T12:00:00Z'
      },
      {
        id: 4,
        user_id: 1,
        title: '云原生架构设计与微服务实践',
        summary:
          '深入探讨云原生应用的设计原则和微服务架构的最佳实践。涵盖容器化、服务网格、DevOps等关键技术，为架构师提供全面的技术指导。',
        url: 'https://arch.example.com/cloud-native-microservices',
        score: 0.89,
        key_excerpts: ['云原生', '微服务', '容器化', 'DevOps'],
        tags: ['技术', '架构', '云计算', '微服务'],
        created_at: '2024-01-18T13:00:00Z',
        updated_at: '2024-01-18T13:00:00Z'
      },
      {
        id: 5,
        user_id: 1,
        title: '数据驱动决策：商业智能与分析实战',
        summary:
          '全面介绍数据驱动决策的理念和实践方法，包括数据收集、分析、可视化等环节。通过实际业务案例，展示如何利用数据分析提升企业竞争力。',
        url: 'https://data.example.com/business-intelligence',
        score: 0.86,
        key_excerpts: ['数据分析', '商业智能', '数据可视化', '决策支持'],
        tags: ['数据', '分析', '商业智能', '决策'],
        created_at: '2024-01-19T14:00:00Z',
        updated_at: '2024-01-19T14:00:00Z'
      },
      {
        id: 6,
        user_id: 1,
        title: '移动应用开发最佳实践与性能优化',
        summary:
          '详细介绍移动应用开发的全流程最佳实践，涵盖iOS和Android平台的开发技巧。重点关注应用性能优化、用户体验提升和安全性保障。',
        url: 'https://mobile.example.com/app-development',
        score: 0.84,
        key_excerpts: ['移动开发', '性能优化', '用户体验', '应用安全'],
        tags: ['开发', '移动', '性能优化', '安全'],
        created_at: '2024-01-20T15:00:00Z',
        updated_at: '2024-01-20T15:00:00Z'
      }
    ]

    // 如果有关键词过滤，执行智能匹配
    if (keywords) {
      const filteredMaterials = allMockMaterials.filter((material) => {
        const keywordLower = keywords.toLowerCase()
        return (
          material.title.toLowerCase().includes(keywordLower) ||
          material.summary.toLowerCase().includes(keywordLower) ||
          material.tags.some((tag) => tag.toLowerCase().includes(keywordLower)) ||
          material.key_excerpts.some((excerpt) => excerpt.toLowerCase().includes(keywordLower))
        )
      })

      // 如果没有匹配结果，返回空数组
      if (filteredMaterials.length === 0) {
        return []
      }

      return filteredMaterials
    }

    // 根据项目ID返回相关素材（模拟项目相关性）
    if (projectId > 0) {
      // 项目ID映射到不同的主题类别
      const projectThemes: Record<number, number[]> = {
        1: [1, 4, 5], // 技术项目
        2: [2, 6, 3], // 设计/产品项目
        3: [3, 5, 1], // 管理项目
        4: [1, 2, 3] // 综合项目
      }

      const relevantIds = projectThemes[projectId] || [1, 2, 3]
      return allMockMaterials.filter((material) => relevantIds.includes(material.id))
    }

    // 默认返回前5个素材
    return allMockMaterials.slice(0, 5)
  }
}

export const materialApiService = new MaterialApiService()
export { MaterialApiService }
