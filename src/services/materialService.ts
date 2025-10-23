import BaseApiService from './base/apiService'
import type { ApiRequestConfig } from '@/config/api/types'
import type { Api } from '@/typings/api'

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
}

export const materialApiService = new MaterialApiService()
export { MaterialApiService }
export default materialApiService
