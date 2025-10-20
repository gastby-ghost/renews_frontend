import http from '@/utils/http'
import type { Material, SearchResultMaterial } from '@/types/material'

// 素材API响应类型定义
export interface MaterialResponse {
  id: number
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  user_id: number
  created_at: string
  updated_at: string
  tags: string[]
}

export interface MaterialListResponse {
  success: boolean
  message: string
  materials: MaterialResponse[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

export interface MaterialCreateRequest {
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  tags?: string[]
}

export interface AddCompleteMaterialRequest {
  project_id: number
  materials: CompleteMaterialData[]
}

export interface CompleteMaterialData {
  title: string
  summary: string
  url?: string
  score?: number
  key_excerpts?: string[]
  tags?: string[]
}

export interface MaterialUpdateRequest {
  update_data: Partial<MaterialCreateRequest>
}

export interface MaterialDeleteRequest {
  material_ids: number[]
}

export interface MaterialDeleteResponse {
  success: boolean
  message: string
  deleted_count: number
  failed_count: number
  details?: any[]
}

export interface TagCreateRequest {
  name: string
}

export interface TagResponse {
  id: number
  name: string
  is_system: boolean
  material_count: number
  created_at: string
}

/**
 * 素材API服务类
 * 用于与素材管理后端API交互
 */
class MaterialApiService {
  private baseUrl = '/api/v1/core'

  /**
   * 批量创建素材
   * @param project_id 项目ID
   * @param materials 素材数据列表
   * @returns 创建结果
   */
  async createMaterials(
    projectId: number,
    materials: CompleteMaterialData[]
  ): Promise<MaterialListResponse> {
    try {
      // 添加调试日志：检查发送到后端的完整请求
      console.log('[MaterialApiService] 准备发送到后端的完整请求:', {
        projectId,
        materialsCount: materials.length,
        materialsWithTags: materials.map((material) => ({
          title: material.title,
          tags: material.tags,
          tagsLength: material.tags ? material.tags.length : 0
        }))
      })

      const request: AddCompleteMaterialRequest = {
        project_id: projectId,
        materials
      }

      // 添加调试日志：检查最终请求数据
      console.log('[MaterialApiService] 最终请求数据:', JSON.stringify(request, null, 2))

      const response = await http.post<MaterialListResponse>({
        url: `${this.baseUrl}/materials/batch`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Create materials error:', error)
      throw new Error('创建素材失败')
    }
  }

  /**
   * 获取项目素材列表
   * @param projectId 项目ID
   * @param params 查询参数
   * @returns 素材列表
   */
  async getProjectMaterials(
    projectId: number,
    params?: {
      page?: number
      page_size?: number
      keywords?: string
      tags?: string[]
    }
  ): Promise<MaterialListResponse> {
    try {
      const response = await http.get<MaterialListResponse>({
        url: `${this.baseUrl}/projects/${projectId}/materials`,
        params
      })

      return response
    } catch (error) {
      console.error('Get project materials error:', error)
      throw new Error('获取项目素材失败')
    }
  }

  /**
   * 更新素材
   * @param materialId 素材ID
   * @param updateData 更新数据
   * @returns 更新后的素材
   */
  async updateMaterial(
    materialId: number,
    updateData: Partial<MaterialCreateRequest>
  ): Promise<MaterialResponse> {
    try {
      const request: MaterialUpdateRequest = {
        update_data: updateData
      }

      const response = await http.put<MaterialResponse>({
        url: `${this.baseUrl}/materials/${materialId}`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Update material error:', error)
      throw new Error('更新素材失败')
    }
  }

  /**
   * 批量删除素材
   * @param materialIds 素材ID列表
   * @returns 删除结果
   */
  async deleteMaterials(materialIds: number[]): Promise<MaterialDeleteResponse> {
    try {
      const request: MaterialDeleteRequest = {
        material_ids: materialIds
      }

      const response = await http.delete<MaterialDeleteResponse>({
        url: `${this.baseUrl}/materials`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Delete materials error:', error)
      throw new Error('删除素材失败')
    }
  }

  /**
   * 创建标签
   * @param name 标签名称
   * @returns 创建的标签
   */
  async createTag(name: string): Promise<TagResponse> {
    try {
      const request: TagCreateRequest = { name }

      const response = await http.post<TagResponse>({
        url: `${this.baseUrl}/tags`,
        data: request
      })

      return response
    } catch (error) {
      console.error('Create tag error:', error)
      throw new Error('创建标签失败')
    }
  }

  /**
   * 将搜索结果转换为素材创建数据
   * @param searchResult 搜索结果素材
   * @returns 素材创建数据
   */
  static convertSearchResultToMaterialData(
    searchResult: SearchResultMaterial
  ): CompleteMaterialData {
    // 添加调试日志：检查转换前的tags
    console.log('[MaterialApiService] 转换前的SearchResultMaterial tags:', {
      title: searchResult.title,
      url: searchResult.url,
      tags: searchResult.tags,
      tagsType: typeof searchResult.tags,
      tagsLength: searchResult.tags ? searchResult.tags.length : 'N/A'
    })

    const materialData = {
      title: searchResult.title,
      summary: searchResult.summary,
      url: searchResult.url,
      score: searchResult.score,
      key_excerpts: searchResult.key_excerpts,
      tags: searchResult.tags
    }

    // 添加调试日志：检查转换后的CompleteMaterialData tags
    console.log('[MaterialApiService] 转换后的CompleteMaterialData tags:', {
      title: materialData.title,
      tags: materialData.tags,
      tagsType: typeof materialData.tags,
      tagsLength: materialData.tags ? materialData.tags.length : 'N/A'
    })

    return materialData
  }

  /**
   * 将API响应转换为前端素材格式
   * @param apiMaterial API响应的素材
   * @returns 前端素材格式
   */
  static convertApiMaterialToMaterial(apiMaterial: MaterialResponse): Material {
    return {
      id: apiMaterial.id.toString(),
      title: apiMaterial.title,
      source: '', // API响应中没有source字段，需要从URL提取或设为空
      summary: apiMaterial.summary,
      url: apiMaterial.url,
      tags: apiMaterial.tags,
      type: 'text', // 默认类型，可以根据URL或其他信息判断
      createdAt: new Date(apiMaterial.created_at),
      updatedAt: new Date(apiMaterial.updated_at),
      score: apiMaterial.score,
      key_excerpts: apiMaterial.key_excerpts
    } as Material
  }
}

export const materialApiService = new MaterialApiService()
export { MaterialApiService }
