import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import * as Api from '@/types/api'

// 素材管理相关类型
type MaterialResponse = Api.Material.MaterialResponse
type MaterialListResponse = Api.Material.MaterialListResponse
type MaterialCreateRequest = Api.Material.MaterialCreateRequest
type AddCompleteMaterialRequest = Api.Material.AddCompleteMaterialRequest
type MaterialUpdateRequest = Api.Material.MaterialUpdateRequest
type MaterialDeleteRequest = Api.Material.MaterialDeleteRequest
type MaterialDeleteResponse = Api.Material.MaterialDeleteResponse
type TagCreateRequest = Api.Material.TagCreateRequest
type TagResponse = Api.Material.TagResponse
type MaterialSearchRequest = Api.Material.MaterialSearchRequest
type MaterialStatsRequest = Api.Material.MaterialStatsRequest

// 扩展类型定义 - 为搜索和统计功能添加明确类型
interface MaterialSearchResponse {
  success: boolean
  message: string
  results: MaterialResponse[]
  total_count: number
  search_time?: number
}

interface MaterialStatsResponse {
  success: boolean
  message: string
  data: Record<string, any>
  total_materials?: number
  last_updated?: string
}

// 标签列表响应类型
interface TagListResponse {
  success: boolean
  message: string
  tags: TagResponse[]
  total_count: number
}

/**
 * 素材管理服务 - 基于OpenAPI配置
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */
class MaterialApiService extends BaseApiService {
  constructor() {
    super('material')
  }

  /**
   * 批量创建素材
   */
  async createMaterials(
    projectId: number,
    materials: MaterialCreateRequest[],
    options?: ApiRequestConfig
  ) {
    const request: AddCompleteMaterialRequest = {
      project_id: projectId,
      materials
    }

    return this.post<MaterialListResponse>('/materials/batch', request, options)
  }

  /**
   * 获取项目素材列表
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
    // 根据OpenAPI规范，tags参数应该在请求体中传递
    if (requestBody?.tags) {
      return this.post<MaterialListResponse>(`/projects/${projectId}/materials`, requestBody, {
        ...options,
        params
      })
    }
    return this.get<MaterialListResponse>(`/projects/${projectId}/materials`, params, options)
  }

  /**
   * 获取所有素材列表
   */
  async getAllMaterials(
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
    // 根据OpenAPI规范，tags参数应该在请求体中传递
    if (requestBody?.tags) {
      return this.post<MaterialListResponse>('/materials', requestBody, { ...options, params })
    }
    return this.get<MaterialListResponse>('/materials', params, options)
  }

  /**
   * 更新素材
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
   * 批量删除素材
   */
  async deleteMaterials(materialIds: number[], options?: ApiRequestConfig) {
    const request: MaterialDeleteRequest = {
      material_ids: materialIds
    }

    return this.delete<MaterialDeleteResponse>('/materials', request, options)
  }

  /**
   * 创建标签
   */
  async createTag(name: string, options?: ApiRequestConfig) {
    const request: TagCreateRequest = { name }
    return this.post<TagResponse>('/tags', request, options)
  }

  /**
   * 获取标签列表
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
   * 搜索素材
   */
  async searchMaterials(params: MaterialSearchRequest, options?: ApiRequestConfig) {
    return this.post<MaterialSearchResponse>('/materials/search', params, options)
  }

  /**
   * 获取素材统计数据
   */
  async getMaterialStats(params?: MaterialStatsRequest, options?: ApiRequestConfig) {
    return this.get<MaterialStatsResponse>('/materials/stats', params, options)
  }

  /**
   * 将搜索结果转换为API所需格式
   */
  static convertSearchResultToMaterialData(searchResult: any): MaterialCreateRequest {
    return {
      title: searchResult.title || '',
      summary: searchResult.summary || searchResult.excerpt || '',
      url: searchResult.url || '',
      score: searchResult.score || 0,
      key_excerpts: searchResult.key_excerpts || searchResult.excerpts || [],
      tags: searchResult.tags || []
    }
  }

  /**
   * 将API返回的素材转换为前端格式
   */
  static convertApiMaterialToMaterial(apiMaterial: MaterialResponse): any {
    return {
      id: apiMaterial.id.toString(),
      title: apiMaterial.title,
      summary: apiMaterial.summary,
      url: apiMaterial.url,
      score: apiMaterial.score,
      key_excerpts: apiMaterial.key_excerpts,
      tags: apiMaterial.tags,
      createdAt: apiMaterial.created_at,
      updatedAt: apiMaterial.updated_at,
      userId: apiMaterial.user_id
    }
  }

  /**
   * Mock实现方法 - 支持所有可变参数API
   * 提供完整的mock数据支持，便于前端独立开发
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()

    console.log(`[API-${this.serviceName}] 执行Mock实现:`, {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params,
      apiConfig
    })

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, apiConfig.mockDelay || 1000))

    const url = config.url
    const method = config.method
    const requestData = config.data
    const params = config.params || {}

    try {
      // 批量创建素材 - POST /materials/batch
      if (method === 'POST' && url.includes('/materials/batch')) {
        const requestBody = requestData as AddCompleteMaterialRequest
        const newMaterials: MaterialResponse[] = requestBody.materials.map((material) => ({
          id: Math.floor(Math.random() * 10000) + 1000,
          user_id: 1,
          title: material.title,
          summary: material.summary,
          url: material.url,
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

      // 获取项目素材列表 - POST /projects/{project_id}/materials (带请求体)
      if (method === 'POST' && url.includes('/projects/') && url.includes('/materials')) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1] || '0'

        return {
          success: true,
          message: '获取项目素材列表成功',
          materials: this.generateMockMaterials(parseInt(projectId)),
          total_count: 10,
          page: params.page || 1,
          page_size: params.page_size || 10,
          total_pages: 1
        }
      }

      // 获取项目素材列表 - GET /projects/{project_id}/materials
      if (method === 'GET' && url.includes('/projects/') && url.includes('/materials')) {
        const parts = url.split('/')
        const projectId = parts[parts.indexOf('projects') + 1] || '0'

        return {
          success: true,
          message: '获取项目素材列表成功',
          materials: this.generateMockMaterials(parseInt(projectId)),
          total_count: 10,
          page: params.page || 1,
          page_size: params.page_size || 10,
          total_pages: 1
        }
      }

      // 获取所有素材列表 - POST /materials (带请求体)
      if (method === 'POST' && url === '/materials') {
        return {
          success: true,
          message: '获取素材列表成功',
          materials: this.generateMockMaterials(0),
          total_count: 20,
          page: params.page || 1,
          page_size: params.page_size || 10,
          total_pages: 2
        }
      }

      // 获取所有素材列表 - GET /materials
      if (method === 'GET' && url === '/materials') {
        return {
          success: true,
          message: '获取素材列表成功',
          materials: this.generateMockMaterials(0),
          total_count: 20,
          page: params.page || 1,
          page_size: params.page_size || 10,
          total_pages: 2
        }
      }

      // 更新素材 - PUT /materials/{material_id}
      if (method === 'PUT' && url.includes('/materials/')) {
        const parts = url.split('/')
        const materialId = parts[parts.indexOf('materials') + 1] || '0'
        const requestBody = requestData as MaterialUpdateRequest

        return {
          success: true,
          message: '更新素材成功',
          material: {
            id: parseInt(materialId),
            user_id: 1,
            title: requestBody.update_data?.title || `素材 ${materialId}`,
            summary: requestBody.update_data?.summary || '素材摘要',
            url: requestBody.update_data?.url || 'https://example.com',
            score: requestBody.update_data?.score || 0,
            key_excerpts: requestBody.update_data?.key_excerpts || [],
            tags: requestBody.update_data?.tags || [],
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }

      // 批量删除素材 - DELETE /materials
      if (method === 'DELETE' && url === '/materials') {
        const requestBody = requestData as MaterialDeleteRequest
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

      // 创建标签 - POST /tags
      if (method === 'POST' && url === '/tags') {
        const requestBody = requestData as TagCreateRequest
        return {
          success: true,
          message: '创建标签成功',
          tag: {
            id: Math.floor(Math.random() * 1000) + 100,
            name: requestBody.name,
            created_at: new Date().toISOString()
          }
        }
      }

      // 获取标签列表 - GET /tags
      if (method === 'GET' && url === '/tags') {
        return {
          success: true,
          message: '获取标签列表成功',
          tags: [
            { id: 1, name: '技术', created_at: '2023-01-01T00:00:00Z' },
            { id: 2, name: '设计', created_at: '2023-01-02T00:00:00Z' },
            { id: 3, name: '产品', created_at: '2023-01-03T00:00:00Z' }
          ],
          total_count: 3
        }
      }

      // 搜索素材 - POST /materials/search
      if (method === 'POST' && url.includes('/materials/search')) {
        const requestBody = requestData as MaterialSearchRequest
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

      // 默认Mock响应
      return {
        success: true,
        message: `素材管理服务Mock响应 - ${method} ${url}`,
        data: {
          mock: true,
          timestamp: Date.now(),
          request_info: {
            url,
            method,
            data: requestData
          }
        }
      }
    } catch (error) {
      console.error(`[API-${this.serviceName}] Mock数据获取失败:`, error)

      return {
        success: false,
        message: `Mock数据获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 生成模拟素材数据
   * @param projectId 项目ID
   * @param keywords 关键词（用于搜索结果）
   * @returns 模拟素材数组
   */
  private generateMockMaterials(projectId: number, keywords: string = ''): MaterialResponse[] {
    const baseMaterials = [
      {
        id: 1,
        user_id: 1,
        title: 'AI技术发展趋势',
        summary: '详细分析了人工智能在2024年的最新发展趋势...',
        url: 'https://example.com/article1',
        score: 0.95,
        key_excerpts: ['机器学习', '深度学习', '神经网络'],
        tags: ['技术', 'AI'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        user_id: 1,
        title: '用户体验设计原则',
        summary: '探讨现代UX/UI设计的核心原则和最佳实践...',
        url: 'https://example.com/article2',
        score: 0.88,
        key_excerpts: ['用户体验', '界面设计', '交互设计'],
        tags: ['设计', 'UX'],
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-16T11:00:00Z'
      },
      {
        id: 3,
        user_id: 1,
        title: '产品管理方法论',
        summary: '介绍敏捷产品管理和精益创业的核心方法...',
        url: 'https://example.com/article3',
        score: 0.92,
        key_excerpts: ['产品管理', '敏捷开发', '精益创业'],
        tags: ['产品', '管理'],
        created_at: '2024-01-17T12:00:00Z',
        updated_at: '2024-01-17T12:00:00Z'
      }
    ]

    // 如果有关键词过滤，只返回匹配的素材
    if (keywords) {
      return baseMaterials.filter(
        (material) =>
          material.title.includes(keywords) ||
          material.summary.includes(keywords) ||
          material.tags.some((tag) => tag.includes(keywords))
      )
    }

    // 根据项目ID返回不同数量的素材
    if (projectId > 0) {
      return baseMaterials.slice(0, Math.min(baseMaterials.length, 3))
    }

    return baseMaterials
  }
}

export const materialApiService = new MaterialApiService()
export { MaterialApiService }
export default materialApiService
