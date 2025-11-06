import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type {
  MaterialResponse,
  MaterialListResponse,
  MaterialCreate,
  MaterialUpdateRequest,
  AddCompleteMaterialRequest,
  MaterialDeleteRequest,
  MaterialDeleteResponse,
  AddExternalMaterialRequest,
  MaterialAddToProjectResponse,
  MaterialTagCreate,
  MaterialTagResponse,
  TagListResponse
} from '@/types/api'

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

/**
 * 素材管理服务 - 基于 material.json OpenAPI 3.1.0 规范
 * 提供完整的素材管理功能
 */
class MaterialApiService extends BaseApiService {
  constructor() {
    super('material')
  }

  /**
   * 批量创建素材 - POST /api/v1/core/materials/batch
   */
  async createMaterials(
    projectId: number,
    materials: MaterialCreate[],
    options?: ApiRequestConfig
  ) {
    const request: AddCompleteMaterialRequest = {
      project_id: projectId,
      materials
    }

    return this.post<MaterialListResponse>('/materials/batch', request, options)
  }

  /**
   * 创建单个素材 - POST /api/v1/core/materials
   */
  async createMaterial(material: MaterialCreate, options?: ApiRequestConfig) {
    return this.post<MaterialResponse>('/materials', material, options)
  }

  /**
   * 获取用户的所有素材 - GET /api/v1/core/materials
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
    options?: ApiRequestConfig
  ) {
    // 根据 OpenAPI 规范，tags 参数在请求体中传递
    if (requestBody?.tags && requestBody.tags.length > 0) {
      return this.post<MaterialListResponse>('/materials', requestBody, {
        ...options,
        params
      })
    }
    return this.get<MaterialListResponse>('/materials', params, options)
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
    updateData: Partial<MaterialCreate>,
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
   */
  async searchMaterials(
    params: {
      keywords: string
      filters?: Record<string, any>
      project_id?: number
    },
    options?: ApiRequestConfig
  ) {
    return this.post<MaterialSearchResponse>('/materials/search', params, options)
  }

  /**
   * 获取素材统计数据（扩展功能）
   */
  async getMaterialStats(
    params?: {
      project_id?: number
      group_by?: string
    },
    options?: ApiRequestConfig
  ) {
    return this.get<MaterialStatsResponse>('/materials/stats', params, options)
  }

  /**
   * 将搜索结果转换为API所需格式
   */
  static convertSearchResultToMaterialData(searchResult: any): MaterialCreate {
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
   * Mock实现 - 基于 material.json OpenAPI 规范
   * 提供完整的 mock 数据支持
   */
  protected async mockImplementation(config: ApiRequestConfig): Promise<any> {
    const apiConfig = this.getCurrentConfig()
    const mockDelay = apiConfig?.mockDelay || 1000

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, mockDelay))

    const { url, method } = config
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
      if (method === 'POST' && url.match(/\/materials$/) && !requestData.materials) {
        const material = requestData as MaterialCreate
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
          page: params.page || 1,
          page_size: params.page_size || 20,
          total_pages: 1
        }
      }

      // 获取所有素材列表 - POST /materials (带请求体 - tags)
      if (method === 'POST' && url.match(/\/materials$/) && requestData?.tags) {
        return {
          success: true,
          message: '获取素材列表成功',
          materials: this.generateMockMaterials(0),
          total_count: 20,
          page: params.page || 1,
          page_size: params.page_size || 20,
          total_pages: 1
        }
      }

      // 批量删除素材 - DELETE /materials
      if (method === 'DELETE' && url.match(/\/materials$/)) {
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

      // 将素材添加到项目 - POST /projects/{project_id}/materials
      if (
        method === 'POST' &&
        url.match(/\/projects\/\d+\/materials$/) &&
        requestData?.material_ids
      ) {
        const requestBody = requestData as AddExternalMaterialRequest

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
      if (method === 'POST' && url.match(/\/projects\/\d+\/materials$/) && requestData?.tags) {
        const projectId = url.split('/')[2]

        return {
          success: true,
          message: '获取项目素材列表成功',
          materials: this.generateMockMaterials(parseInt(projectId)),
          total_count: 10,
          page: params.page || 1,
          page_size: params.page_size || 20,
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
          page: params.page || 1,
          page_size: params.page_size || 20,
          total_pages: 1
        }
      }

      // 创建标签 - POST /tags
      if (method === 'POST' && url.match(/\/tags$/)) {
        const requestBody = requestData as MaterialTagCreate
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
        const requestBody = requestData as any
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
   */
  private generateMockMaterials(projectId: number, keywords: string = ''): MaterialResponse[] {
    const baseMaterials: MaterialResponse[] = [
      {
        id: 1,
        user_id: 1,
        title: 'AI技术发展趋势',
        summary: '详细分析了人工智能在2024年的最新发展趋势，包括机器学习、深度学习等领域的突破...',
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
        summary: '探讨现代UX/UI设计的核心原则和最佳实践，帮助设计师提升产品质量...',
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
        summary: '介绍敏捷产品管理和精益创业的核心方法，帮助产品经理更好地规划产品路线...',
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
